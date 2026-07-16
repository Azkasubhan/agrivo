"""AGRIVO SQLAlchemy ORM model registry."""

from app.models.base import BaseModel
from app.models.education_content import EducationContent
from app.models.field import Field, RiceVariety
from app.models.notification import Notification
from app.models.recommendation import Recommendation, RecommendationPrediction
from app.models.regional_climate_baseline import RegionalClimateBaseline
from app.models.user import NotificationPreference, User
from app.models.weather_snapshot import WeatherSnapshot

__all__ = [
    "BaseModel",
    "EducationContent",
    "Field",
    "Notification",
    "NotificationPreference",
    "Recommendation",
    "RecommendationPrediction",
    "RegionalClimateBaseline",
    "RiceVariety",
    "User",
    "WeatherSnapshot",
]
