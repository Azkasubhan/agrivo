"""Pydantic request/response schemas for user profile endpoints."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr


class NotificationPreferenceSchema(BaseModel):
    """Embeds notification preference toggles in the user profile response."""

    model_config = ConfigDict(extra="forbid")

    whatsapp_enabled: bool
    recommendation_change_alert: bool
    weather_risk_alert: bool


class UserProfileResponse(BaseModel):
    """Response payload for GET /users/me."""

    model_config = ConfigDict(extra="forbid")

    id: UUID
    full_name: str
    phone_number: str
    email: str | None
    notification_preference: NotificationPreferenceSchema | None
    created_at: datetime


class UpdateProfileRequest(BaseModel):
    """Request payload for PATCH /users/me (all fields optional)."""

    model_config = ConfigDict(extra="forbid")

    full_name: str | None = None
    email: EmailStr | None = None


class UpdateNotificationPreferenceRequest(BaseModel):
    """Request payload for PATCH /users/me/notifications."""

    model_config = ConfigDict(extra="forbid")

    whatsapp_enabled: bool | None = None
    recommendation_change_alert: bool | None = None
    weather_risk_alert: bool | None = None
