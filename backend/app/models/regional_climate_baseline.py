"""Regional climate baseline persistence model."""

from decimal import Decimal

from sqlalchemy import Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import BaseModel, UUIDPrimaryKeyMixin


class RegionalClimateBaseline(UUIDPrimaryKeyMixin, BaseModel):
    """Reference climate values used only when live weather retrieval fails."""

    __tablename__ = "regional_climate_baseline"

    province_code: Mapped[str] = mapped_column(String(10), nullable=False, unique=True)
    avg_daily_rainfall_mm: Mapped[Decimal] = mapped_column(Numeric(6, 2), nullable=False)
    avg_temperature_c: Mapped[Decimal] = mapped_column(Numeric(4, 1), nullable=False)
    avg_et0_mm: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False)
