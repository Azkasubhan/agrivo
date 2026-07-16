"""Weather snapshot and climate baseline data access."""

from datetime import UTC, datetime
from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.regional_climate_baseline import RegionalClimateBaseline
from app.models.weather_snapshot import WeatherSnapshot


class WeatherRepository:
    """Repository for managing weather snapshots and regional baseline data."""

    def __init__(self, session: Session) -> None:
        self.session = session

    def get_latest_valid_snapshot(self, field_id: UUID) -> WeatherSnapshot | None:
        """Return the latest weather snapshot for the field if it is not expired."""
        now = datetime.now(UTC)
        statement = (
            select(WeatherSnapshot)
            .where(
                WeatherSnapshot.field_id == field_id,
                WeatherSnapshot.expires_at > now,
            )
            .order_by(WeatherSnapshot.fetched_at.desc())
            .limit(1)
        )
        return self.session.execute(statement).scalar_one_or_none()

    def create_snapshot(self, **attributes: Any) -> WeatherSnapshot:
        """Create and persist a new weather snapshot."""
        snapshot = WeatherSnapshot(**attributes)
        self.session.add(snapshot)
        self.session.commit()
        self.session.refresh(snapshot)
        return snapshot

    def get_baseline_by_province(self, province_code: str) -> RegionalClimateBaseline | None:
        """Get the regional climate baseline for a specific province."""
        statement = select(RegionalClimateBaseline).where(
            RegionalClimateBaseline.province_code == province_code
        )
        return self.session.execute(statement).scalar_one_or_none()
