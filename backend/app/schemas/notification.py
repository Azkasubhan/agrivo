"""Notification schema definitions."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class NotificationSchema(BaseModel):
    """Pydantic model representing a Notification."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    field_id: UUID
    recommendation_id: UUID | None
    channel: str
    message: str
    delivery_status: str
    is_read: bool
    sent_at: datetime | None
    read_at: datetime | None
    created_at: datetime


class NotificationListResponse(BaseModel):
    """Response payload containing paginated notifications."""

    items: list[NotificationSchema]
    total: int
    page: int
    page_size: int
