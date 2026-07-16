"""Pydantic schemas for weather data responses."""

from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.ai_engine.schemas import GrowthStage, WaterBalanceIndex, WeatherRiskIndex


class DailyForecast(BaseModel):
    """One day of weather forecast data."""

    model_config = ConfigDict(extra="forbid")

    date: date
    temperature_max: float
    temperature_min: float
    temperature_mean: float
    precipitation_sum: float
    relative_humidity_mean: float
    wind_speed_max: float
    et0_mm: float
    weather_condition: str  # "sunny" | "rainy" | "cloudy" | "partly-cloudy"


class DerivedInputs(BaseModel):
    """Derived agronomic inputs computed from weather + field data."""

    model_config = ConfigDict(extra="forbid")

    growth_stage: GrowthStage
    days_after_planting: int
    water_balance_index: WaterBalanceIndex
    water_balance_mm: float
    weather_risk_index: WeatherRiskIndex


class WeatherResponse(BaseModel):
    """Full weather response for a field including forecast and derived inputs."""

    model_config = ConfigDict(extra="forbid")

    field_id: UUID
    snapshot_id: UUID
    is_estimated: bool
    estimation_reason: str | None
    fetched_at: datetime
    expires_at: datetime

    # Today's conditions
    temperature_c: float
    humidity_percent: float
    precipitation_mm: float
    wind_speed_kmh: float
    weather_condition: str
    et0_mm: float

    # 7-day forecast
    forecast: list[DailyForecast]

    # Derived agronomic inputs
    derived: DerivedInputs
