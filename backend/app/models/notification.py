"""Notification persistence model."""

from datetime import datetime
from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, String, Text, text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel, CreatedAtMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.field import Field
    from app.models.recommendation import Recommendation
    from app.models.user import User


class Notification(UUIDPrimaryKeyMixin, CreatedAtMixin, BaseModel):
    """Record of a user notification and its delivery/read status."""

    __tablename__ = "notifications"
    __table_args__ = (
        Index("idx_notifications_user_id_created_at", "user_id", text("created_at DESC")),
    )

    user_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    field_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("fields.id"), nullable=False
    )
    recommendation_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("recommendations.id"), nullable=True
    )
    channel: Mapped[str] = mapped_column(String(20), nullable=False, server_default="whatsapp")
    message: Mapped[str] = mapped_column(Text, nullable=False)
    delivery_status: Mapped[str] = mapped_column(
        String(20), nullable=False, server_default="pending"
    )
    is_read: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="false")
    sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    read_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    user: Mapped["User"] = relationship(back_populates="notifications")
    field: Mapped["Field"] = relationship(back_populates="notifications")
    recommendation: Mapped["Recommendation | None"] = relationship(back_populates="notifications")
