"""Weather Service to fetch forecasts, historical data, and compute derived agronomic features."""

import json
import logging
import urllib.request
from datetime import UTC, date, datetime, timedelta
from decimal import Decimal
from typing import Any

from sqlalchemy.orm import Session

from app.ai_engine.schemas import GrowthStage, WaterBalanceIndex, WeatherRiskIndex
from app.models.field import Field
from app.models.weather_snapshot import WeatherSnapshot
from app.repositories.weather_repository import WeatherRepository

logger = logging.getLogger(__name__)


class WeatherService:
    """Manages weather data retrieval and calculation of derived features."""

    def __init__(self, session: Session) -> None:
        self.session = session
        self.repo = WeatherRepository(session)

    def _get_province_code(self, lat: float, lon: float) -> str:
        """Map latitude/longitude to an Indonesian province code (fallback basis)."""
        # West Java (ID-JB)
        if -8.5 <= lat <= -6.0 and 105.0 <= lon < 109.0:
            return "ID-JB"
        # Central Java (ID-JT)
        elif -8.5 <= lat <= -6.0 and 109.0 <= lon < 111.5:
            return "ID-JT"
        # East Java (ID-JI)
        elif -8.5 <= lat <= -6.0 and 111.5 <= lon <= 115.0:
            return "ID-JI"
        # South Sumatra (ID-SS)
        elif lat > -6.0 and lon < 106.0:
            return "ID-SS"
        # South Sulawesi (ID-SN)
        elif lon > 118.0:
            return "ID-SN"
        # Default fallback
        return "ID-JT"

    def _fetch_from_open_meteo(self, lat: float, lon: float) -> dict[str, Any]:
        """Fetch forecast and historical 30d data from Open-Meteo API."""
        # Forecast URL (14 days)
        forecast_url = (
            f"http://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}"
            "&daily=temperature_2m_max,temperature_2m_min,temperature_2m_mean,"
            "precipitation_sum,et0_fao_evapotranspiration,wind_speed_10m_max,"
            "relative_humidity_2m_mean&timezone=auto&forecast_days=14"
        )

        today_dt = date.today()
        start_date = today_dt - timedelta(days=30)
        end_date = today_dt - timedelta(days=1)

        # Historical URL (30 days)
        archive_url = (
            f"https://archive-api.open-meteo.com/v1/archive?latitude={lat}&longitude={lon}"
            f"&start_date={start_date.isoformat()}&end_date={end_date.isoformat()}"
            "&daily=precipitation_sum,et0_fao_evapotranspiration&timezone=auto"
        )

        req_forecast = urllib.request.Request(forecast_url, headers={"User-Agent": "AgrivoApp/1.0"})
        req_archive = urllib.request.Request(archive_url, headers={"User-Agent": "AgrivoApp/1.0"})

        with urllib.request.urlopen(req_forecast, timeout=10) as response:
            forecast_data = json.loads(response.read().decode())

        with urllib.request.urlopen(req_archive, timeout=10) as response:
            archive_data = json.loads(response.read().decode())

        return {
            "forecast": forecast_data,
            "archive": archive_data,
        }

    def _calculate_derived(
        self,
        field: Field,
        weather_data: dict[str, Any],
        is_estimated: bool,
        province_code: str,
    ) -> dict[str, Any]:
        """Compute growth_stage, water_balance_index, and weather_risk_index."""
        # 1. Growth Stage
        today_date = date.today()
        days_after_planting = (today_date - field.planting_date).days
        total_days = field.rice_variety.total_duration_days

        if days_after_planting < 0:
            stage = GrowthStage.LAND_PREPARATION
        else:
            pct = (days_after_planting / total_days) * 100
            if pct < 9:
                stage = GrowthStage.LAND_PREPARATION
            elif pct < 45:
                stage = GrowthStage.VEGETATIVE
            elif pct < 65:
                stage = GrowthStage.REPRODUCTIVE
            else:
                stage = GrowthStage.RIPENING

        # 2. Water Balance Index (last 10 days)
        water_balance_mm = 0.0
        if is_estimated:
            # Fallback based on regional baseline
            baseline = self.repo.get_baseline_by_province(province_code)
            if baseline:
                rain = float(baseline.avg_daily_rainfall_mm)
                et0 = float(baseline.avg_et0_mm)
                water_balance_mm = 10 * (rain - et0)
        else:
            # Cumulative precipitation - et0 from historical data (last 10 days)
            archive_daily = weather_data.get("archive", {}).get("daily", {})
            rain_history = archive_daily.get("precipitation_sum", [])[-10:]
            et0_history = archive_daily.get("et0_fao_evapotranspiration", [])[-10:]
            # Filter out None/null values
            rain_sum = sum(r for r in rain_history if r is not None)
            et0_sum = sum(e for e in et0_history if e is not None)
            water_balance_mm = rain_sum - et0_sum

        if water_balance_mm < -15.0:
            wb_index = WaterBalanceIndex.DEFICIT
        elif water_balance_mm > 20.0:
            wb_index = WaterBalanceIndex.SURPLUS
        else:
            wb_index = WaterBalanceIndex.NORMAL

        # 3. Weather Risk Index (next 14 days)
        weather_risk = WeatherRiskIndex.NORMAL
        if is_estimated:
            weather_risk = WeatherRiskIndex.NORMAL
        else:
            forecast_daily = weather_data.get("forecast", {}).get("daily", {})
            rain_forecast = forecast_daily.get("precipitation_sum", [])
            forecast_sum = sum(r for r in rain_forecast if r is not None)

            if forecast_sum > 150.0:
                weather_risk = WeatherRiskIndex.EXCESS_HIGH
            elif forecast_sum < 15.0:
                weather_risk = WeatherRiskIndex.DROUGHT_HIGH
            elif forecast_sum < 30.0:
                weather_risk = WeatherRiskIndex.DROUGHT_MODERATE

        return {
            "growth_stage": stage,
            "days_after_planting": days_after_planting,
            "water_balance_index": wb_index,
            "water_balance_mm": round(water_balance_mm, 2),
            "weather_risk_index": weather_risk,
        }

    def get_weather_for_field(self, field: Field) -> WeatherSnapshot:
        """Fetch cached weather snapshot or pull new one (with regional fallback)."""
        # Try finding cached snapshot (< 6 hours)
        cached = self.repo.get_latest_valid_snapshot(field.id)
        if cached:
            return cached

        # Fetch new data
        lat = float(field.latitude)
        lon = float(field.longitude)
        province_code = self._get_province_code(lat, lon)

        is_estimated = False
        estimation_reason = None
        raw_payload = {}

        try:
            raw_payload = self._fetch_from_open_meteo(lat, lon)
        except Exception as exc:
            logger.warning(f"Failed to fetch live weather from Open-Meteo: {exc}")
            is_estimated = True
            estimation_reason = "Open-Meteo API unreachable or failed"
            # Build mock empty payload for fallback structures
            raw_payload = {"forecast": {}, "archive": {}}

        # Compute derived inputs
        derived = self._calculate_derived(field, raw_payload, is_estimated, province_code)
        raw_payload["_derived"] = {
            "growth_stage": derived["growth_stage"].value,
            "days_after_planting": derived["days_after_planting"],
            "water_balance_index": derived["water_balance_index"].value,
            "water_balance_mm": derived["water_balance_mm"],
            "weather_risk_index": derived["weather_risk_index"].value,
        }

        # Calculate expiration (6 hours from now)
        fetched_at = datetime.now(UTC)
        expires_at = fetched_at + timedelta(hours=6)

        # Average ET0 for record metadata
        et0_val = None
        if not is_estimated:
            forecast_et0 = raw_payload.get("forecast", {}).get("daily", {}).get("et0_fao_evapotranspiration", [])
            valid_et0 = [e for e in forecast_et0 if e is not None]
            if valid_et0:
                et0_val = Decimal(str(round(sum(valid_et0) / len(valid_et0), 2)))
        else:
            baseline = self.repo.get_baseline_by_province(province_code)
            if baseline:
                et0_val = baseline.avg_et0_mm

        # Create database record
        snapshot = self.repo.create_snapshot(
            field_id=field.id,
            raw_data=raw_payload,
            et0_mm=et0_val,
            is_estimated=is_estimated,
            estimation_reason=estimation_reason,
            fetched_at=fetched_at,
            expires_at=expires_at,
        )

        return snapshot

    def format_weather_response(self, snapshot: WeatherSnapshot) -> dict[str, Any]:
        """Convert a WeatherSnapshot model back to the Pydantic Response payload format."""
        raw = snapshot.raw_data
        derived_raw = raw.get("_derived", {})

        # Default values if estimated/empty
        temp = 25.0
        humidity = 80.0
        precip = 0.0
        wind = 10.0
        cond = "cloudy"
        et0 = 4.0

        forecast_list = []

        if not snapshot.is_estimated:
            forecast_daily = raw.get("forecast", {}).get("daily", {})
            times = forecast_daily.get("time", [])

            # Extract today's values
            if times:
                temp = forecast_daily.get("temperature_2m_mean", [temp])[0]
                humidity = forecast_daily.get("relative_humidity_2m_mean", [humidity])[0]
                precip = forecast_daily.get("precipitation_sum", [precip])[0]
                wind = forecast_daily.get("wind_speed_10m_max", [wind])[0]
                et0 = forecast_daily.get("et0_fao_evapotranspiration", [et0])[0]
                cond = "rainy" if precip > 5.0 else ("sunny" if precip == 0 and temp > 28 else "partly-cloudy")

            # Build forecast list
            for i in range(len(times)):
                t_mean = forecast_daily.get("temperature_2m_mean", [25.0])[i]
                rain = forecast_daily.get("precipitation_sum", [0.0])[i]
                daily_cond = "rainy" if rain > 5.0 else ("sunny" if rain == 0 and t_mean > 28 else "partly-cloudy")

                forecast_list.append({
                    "date": times[i],
                    "temperature_max": forecast_daily.get("temperature_2m_max", [28.0])[i],
                    "temperature_min": forecast_daily.get("temperature_2m_min", [22.0])[i],
                    "temperature_mean": t_mean,
                    "precipitation_sum": rain,
                    "relative_humidity_mean": forecast_daily.get("relative_humidity_2m_mean", [80.0])[i],
                    "wind_speed_max": forecast_daily.get("wind_speed_10m_max", [10.0])[i],
                    "et0_mm": forecast_daily.get("et0_fao_evapotranspiration", [4.0])[i],
                    "weather_condition": daily_cond,
                })
        else:
            # Generate fallback simulated forecast based on regional baseline
            lat = float(snapshot.field.latitude)
            lon = float(snapshot.field.longitude)
            province_code = self._get_province_code(lat, lon)
            baseline = self.repo.get_baseline_by_province(province_code)

            if baseline:
                temp = float(baseline.avg_temperature_c)
                precip = float(baseline.avg_daily_rainfall_mm)
                et0 = float(baseline.avg_et0_mm)

            today_dt = date.today()
            for i in range(14):
                day_date = today_dt + timedelta(days=i)
                forecast_list.append({
                    "date": day_date.isoformat(),
                    "temperature_max": temp + 2.0,
                    "temperature_min": temp - 2.0,
                    "temperature_mean": temp,
                    "precipitation_sum": precip,
                    "relative_humidity_mean": humidity,
                    "wind_speed_max": wind,
                    "et0_mm": et0,
                    "weather_condition": "rainy" if precip > 5.0 else "partly-cloudy",
                })

        return {
            "field_id": str(snapshot.field_id),
            "snapshot_id": str(snapshot.id),
            "is_estimated": snapshot.is_estimated,
            "estimation_reason": snapshot.estimation_reason,
            "fetched_at": snapshot.fetched_at.isoformat(),
            "expires_at": snapshot.expires_at.isoformat(),
            "temperature_c": temp,
            "humidity_percent": humidity,
            "precipitation_mm": precip,
            "wind_speed_kmh": wind,
            "weather_condition": cond,
            "et0_mm": et0,
            "forecast": forecast_list[:7],  # UI only asks for 7 days
            "derived": {
                "growth_stage": derived_raw.get("growth_stage"),
                "days_after_planting": derived_raw.get("days_after_planting"),
                "water_balance_index": derived_raw.get("water_balance_index"),
                "water_balance_mm": derived_raw.get("water_balance_mm"),
                "weather_risk_index": derived_raw.get("weather_risk_index"),
            },
        }
