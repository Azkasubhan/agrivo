"""Weather snapshot persistence model."""

from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING, Any
from uuid import UUID

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, Numeric, String, func, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.field import Field
    from app.models.recommendation import Recommendation


class WeatherSnapshot(UUIDPrimaryKeyMixin, BaseModel):
    """Cached Open-Meteo or regional-fallback weather data for a field."""

    __tablename__ = "weather_snapshots"
    __table_args__ = (
        Index(
            "idx_weather_snapshots_field_id_fetched_at",
            "field_id",
            text("fetched_at DESC"),
        ),
    )

    field_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("fields.id"), nullable=False
    )
    raw_data: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False)
    et0_mm: Mapped[Decimal | None] = mapped_column(Numeric(6, 2), nullable=True)
    is_estimated: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="false")
    estimation_reason: Mapped[str | None] = mapped_column(String(100), nullable=True)
    fetched_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    field: Mapped["Field"] = relationship(back_populates="weather_snapshots")
    recommendations: Mapped[list["Recommendation"]] = relationship(
        back_populates="weather_snapshot"
    )
