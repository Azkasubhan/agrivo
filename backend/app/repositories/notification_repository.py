"""Notification data access layer."""

from datetime import datetime, timezone
from typing import Any
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.notification import Notification


class NotificationRepository:
    """Repository for managing User Notifications in the DB."""

    def __init__(self, session: Session) -> None:
        self.session = session

    def create(self, **attributes: Any) -> Notification:
        """Create and persist a new Notification."""
        notification = Notification(**attributes)
        self.session.add(notification)
        self.session.commit()
        self.session.refresh(notification)
        return notification

    def get_by_id(self, notification_id: UUID) -> Notification | None:
        """Get a notification by id."""
        statement = select(Notification).where(Notification.id == notification_id)
        return self.session.execute(statement).scalar_one_or_none()

    def list_by_user(
        self, user_id: UUID, page: int, page_size: int
    ) -> tuple[list[Notification], int]:
        """Return a paginated list of notifications for a user, ordered by date descending."""
        statement = select(Notification).where(Notification.user_id == user_id)
        total = self.session.execute(
            select(func.count()).select_from(statement.subquery())
        ).scalar_one()

        items = (
            self.session.execute(
                statement.order_by(Notification.created_at.desc())
                .offset((page - 1) * page_size)
                .limit(page_size)
            )
            .scalars()
            .all()
        )
        return list(items), total

    def mark_as_read(self, notification: Notification) -> Notification:
        """Mark a notification as read."""
        notification.is_read = True
        notification.read_at = datetime.now(timezone.utc)
        self.session.commit()
        self.session.refresh(notification)
        return notification
