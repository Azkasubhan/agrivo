"""Recommendation and prediction persistence models."""

from decimal import Decimal
from typing import TYPE_CHECKING, Any
from uuid import UUID

from sqlalchemy import CheckConstraint, Enum, ForeignKey, Index, Numeric, String, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel, CreatedAtMixin, UUIDPrimaryKeyMixin
from app.models.enums import IrrigationStrategy

if TYPE_CHECKING:
    from app.models.field import Field
    from app.models.notification import Notification
    from app.models.weather_snapshot import WeatherSnapshot


class Recommendation(UUIDPrimaryKeyMixin, CreatedAtMixin, BaseModel):
    """Immutable AI recommendation generated from a field and weather snapshot."""

    __tablename__ = "recommendations"
    __table_args__ = (
        CheckConstraint("confidence_score BETWEEN 0 AND 1", name="confidence_score_range"),
        Index("idx_recommendations_field_id_created_at", "field_id", text("created_at DESC")),
    )

    field_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("fields.id"), nullable=False
    )
    weather_snapshot_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("weather_snapshots.id"), nullable=False
    )
    input_snapshot: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False)
    recommended_strategy: Mapped[IrrigationStrategy] = mapped_column(
        Enum(IrrigationStrategy, name="irrigation_strategy", create_constraint=False),
        nullable=False,
    )
    confidence_score: Mapped[Decimal] = mapped_column(Numeric(4, 3), nullable=False)
    engine_type: Mapped[str] = mapped_column(String(20), nullable=False)
    model_version: Mapped[str] = mapped_column(String(30), nullable=False)

    field: Mapped["Field"] = relationship(back_populates="recommendations")
    weather_snapshot: Mapped["WeatherSnapshot"] = relationship(back_populates="recommendations")
    prediction: Mapped["RecommendationPrediction | None"] = relationship(
        back_populates="recommendation", uselist=False
    )
    notifications: Mapped[list["Notification"]] = relationship(back_populates="recommendation")


class RecommendationPrediction(UUIDPrimaryKeyMixin, CreatedAtMixin, BaseModel):
    """Quantitative impact estimates and explanation for one recommendation."""

    __tablename__ = "recommendation_predictions"

    recommendation_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("recommendations.id"),
        nullable=False,
        unique=True,
    )
    water_saving_percent: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False)
    expected_yield_ton_per_ha: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False)
    yield_baseline_ton_per_ha: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False)
    ch4_reduction_percent: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False)
    n2o_change_percent: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False)
    net_gwp_reduction_percent: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False)
    explanation: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False)

    recommendation: Mapped["Recommendation"] = relationship(back_populates="prediction")
