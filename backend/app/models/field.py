"""Field and rice-variety persistence models."""

from datetime import date
from decimal import Decimal
from typing import TYPE_CHECKING, Any
from uuid import UUID

from sqlalchemy import CheckConstraint, Date, Enum, ForeignKey, Index, Integer, Numeric, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel, SoftDeleteMixin, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.enums import IrrigationStrategy, IrrigationSystemType, SoilType

if TYPE_CHECKING:
    from app.models.notification import Notification
    from app.models.recommendation import Recommendation
    from app.models.user import User
    from app.models.weather_snapshot import WeatherSnapshot


class RiceVariety(UUIDPrimaryKeyMixin, TimestampMixin, BaseModel):
    """Reference rice variety with lifecycle duration and phase thresholds."""

    __tablename__ = "rice_varieties"
    __table_args__ = (
        CheckConstraint("total_duration_days > 0", name="total_duration_days_positive"),
    )

    code: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    display_name: Mapped[str] = mapped_column(String(100), nullable=False)
    total_duration_days: Mapped[int] = mapped_column(Integer, nullable=False)
    phase_breakdown_percent: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False)

    fields: Mapped[list["Field"]] = relationship(back_populates="rice_variety")


class Field(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, BaseModel):
    """A user-owned rice field and its agronomic input attributes."""

    __tablename__ = "fields"
    __table_args__ = (
        CheckConstraint("latitude BETWEEN -11.00 AND 6.10", name="latitude_indonesia_range"),
        CheckConstraint("longitude BETWEEN 94.70 AND 141.10", name="longitude_indonesia_range"),
        CheckConstraint(
            "field_area_ha > 0 AND field_area_ha <= 25", name="field_area_ha_valid_range"
        ),
        Index(
            "idx_fields_user_id",
            "user_id",
            postgresql_where="deleted_at IS NULL",
        ),
        Index("idx_fields_location", "latitude", "longitude"),
    )

    user_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    latitude: Mapped[Decimal] = mapped_column(Numeric(9, 6), nullable=False)
    longitude: Mapped[Decimal] = mapped_column(Numeric(9, 6), nullable=False)
    soil_type: Mapped[SoilType] = mapped_column(
        Enum(SoilType, name="soil_type", create_constraint=False), nullable=False
    )
    rice_variety_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("rice_varieties.id"), nullable=False
    )
    planting_date: Mapped[date] = mapped_column(Date, nullable=False)
    field_area_ha: Mapped[Decimal] = mapped_column(Numeric(6, 2), nullable=False)
    previous_irrigation_method: Mapped[IrrigationStrategy | None] = mapped_column(
        Enum(IrrigationStrategy, name="irrigation_strategy", create_constraint=False), nullable=True
    )
    irrigation_system_type: Mapped[IrrigationSystemType | None] = mapped_column(
        Enum(IrrigationSystemType, name="irrigation_system_type", create_constraint=False),
        nullable=True,
    )

    user: Mapped["User"] = relationship(back_populates="fields")
    rice_variety: Mapped["RiceVariety"] = relationship(back_populates="fields")
    weather_snapshots: Mapped[list["WeatherSnapshot"]] = relationship(back_populates="field")
    recommendations: Mapped[list["Recommendation"]] = relationship(back_populates="field")
    notifications: Mapped[list["Notification"]] = relationship(back_populates="field")
