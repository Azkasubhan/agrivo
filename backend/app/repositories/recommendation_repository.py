"""Recommendation and prediction data access layer."""

from typing import Any
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.models.recommendation import Recommendation, RecommendationPrediction


class RecommendationRepository:
    """Repository for managing AI recommendations and associated predictions in the DB."""

    def __init__(self, session: Session) -> None:
        self.session = session

    def create(self, **attributes: Any) -> Recommendation:
        """Create and persist a new AI Recommendation."""
        rec = Recommendation(**attributes)
        self.session.add(rec)
        self.session.commit()
        self.session.refresh(rec)
        return rec

    def create_prediction(self, **attributes: Any) -> RecommendationPrediction:
        """Create and persist quantitative predictions for a recommendation."""
        pred = RecommendationPrediction(**attributes)
        self.session.add(pred)
        self.session.commit()
        self.session.refresh(pred)
        return pred

    def get_by_id(self, rec_id: UUID) -> Recommendation | None:
        """Get a recommendation by id including its prediction and weather snapshot."""
        statement = (
            select(Recommendation)
            .options(
                joinedload(Recommendation.prediction),
                joinedload(Recommendation.weather_snapshot),
            )
            .where(Recommendation.id == rec_id)
        )
        return self.session.execute(statement).scalar_one_or_none()

    def list_by_field(
        self, field_id: UUID, page: int, page_size: int
    ) -> tuple[list[Recommendation], int]:
        """Return a paginated list of recommendations for a field, ordered by date descending."""
        statement = select(Recommendation).where(Recommendation.field_id == field_id)
        total = self.session.execute(
            select(func.count()).select_from(statement.subquery())
        ).scalar_one()

        items = (
            self.session.execute(
                statement.options(
                    joinedload(Recommendation.prediction),
                    joinedload(Recommendation.weather_snapshot),
                )
                .order_by(Recommendation.created_at.desc())
                .offset((page - 1) * page_size)
                .limit(page_size)
            )
            .scalars()
            .all()
        )
        return list(items), total
