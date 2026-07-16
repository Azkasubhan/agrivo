"""Scheduler service to run daily recurring background jobs for weather updates & AI predictions."""

import logging
from datetime import datetime, timedelta, timezone
from uuid import UUID

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.config import get_settings
from app.core.database import SessionLocal
from app.models.field import Field
from app.models.notification import Notification
from app.models.recommendation import Recommendation
from app.models.user import User
from app.services.notification_service import NotificationService
from app.services.recommendation_service import RecommendationService

logger = logging.getLogger(__name__)


async def run_daily_recommendation_job() -> None:
    """Check all active fields, fetch weather, run AI prediction, and notify users."""
    logger.info("Starting daily recommendation scheduler job...")
    session = SessionLocal()
    try:
        # Load active fields with their users and notification preferences loaded
        statement = (
            select(Field)
            .where(Field.deleted_at.is_(None))
            .options(
                selectinload(Field.user).selectinload(User.notification_preference)
            )
        )
        fields = session.execute(statement).scalars().all()
        logger.info(f"Loaded {len(fields)} active fields to process.")

        rec_service = RecommendationService(session)
        notif_service = NotificationService(session)

        for field in fields:
            try:
                user = field.user
                if not user:
                    continue

                # 1. Fetch previous recommendation for comparison
                prev_stmt = (
                    select(Recommendation)
                    .where(Recommendation.field_id == field.id)
                    .order_by(Recommendation.created_at.desc())
                    .limit(1)
                )
                prev_rec = session.execute(prev_stmt).scalar_one_or_none()

                # 2. Generate a fresh recommendation cycle
                rec_data = rec_service.generate_recommendation(
                    user_id=user.id, field_id=field.id
                )
                new_rec_id = UUID(rec_data["id"])
                
                # Fetch new recommendation ORM
                new_rec = rec_service.repo.get_by_id(new_rec_id)
                if not new_rec:
                    continue

                # 3. Check if we already sent any notification to this field in the last 12 hours
                # to prevent duplicate alerts during manual testing/triggers
                limit_time = datetime.now(timezone.utc) - timedelta(hours=12)
                check_stmt = (
                    select(Notification)
                    .where(
                        Notification.field_id == field.id,
                        Notification.created_at >= limit_time
                    )
                )
                recent_notifs = session.execute(check_stmt).scalars().all()
                
                # Debounce alerts
                has_rec_alert = any(n.recommendation_id is not None for n in recent_notifs)
                has_weather_alert = any(
                    n.recommendation_id is None and "RISIKO CUACA" in n.message
                    for n in recent_notifs
                )

                # 4. Check for recommendation change
                rec_changed = (
                    prev_rec is None
                    or prev_rec.recommended_strategy != new_rec.recommended_strategy
                )
                if rec_changed and not has_rec_alert:
                    notif_service.notify_recommendation_change(
                        user=user, field=field, new_rec=new_rec
                    )

                # 5. Check for weather risk
                raw_derived = new_rec.weather_snapshot.raw_data.get("_derived", {})
                weather_risk = raw_derived.get("weather_risk_index", "NORMAL")
                if weather_risk != "NORMAL" and not has_weather_alert:
                    notif_service.notify_weather_risk(
                        user=user,
                        field=field,
                        weather_risk_index=weather_risk,
                        weather_snapshot_id=new_rec.weather_snapshot_id,
                    )

            except Exception as e:
                logger.error(
                    f"Failed to process daily recommendation for field {field.id}: {str(e)}",
                    exc_info=True,
                )
        session.commit()
    except Exception as e:
        logger.error(f"Daily recommendation job failed: {str(e)}", exc_info=True)
    finally:
        session.close()
    logger.info("Daily recommendation scheduler job completed.")


class SchedulerService:
    """Manages the lifecycle of background job schedulers."""

    _scheduler: AsyncIOScheduler | None = None

    @classmethod
    def start(cls) -> None:
        """Initialize and start the background scheduler."""
        if cls._scheduler and cls._scheduler.running:
            logger.warning("Scheduler is already running.")
            return

        cls._scheduler = AsyncIOScheduler()
        
        # Schedule the daily job at 06:00 AM every day
        cls._scheduler.add_job(
            run_daily_recommendation_job,
            trigger="cron",
            hour=6,
            minute=0,
            id="daily_recommendation_job",
            replace_existing=True,
        )
        
        cls._scheduler.start()
        logger.info("APScheduler started successfully. Scheduled daily job at 06:00 AM.")

    @classmethod
    def shutdown(cls) -> None:
        """Shut down the background scheduler."""
        if cls._scheduler and cls._scheduler.running:
            cls._scheduler.shutdown()
            logger.info("APScheduler shut down successfully.")
            cls._scheduler = None
