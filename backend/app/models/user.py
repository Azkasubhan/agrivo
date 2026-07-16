"""User and notification-preference persistence models."""

from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import Boolean, ForeignKey, Index, String
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel, SoftDeleteMixin, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.field import Field
    from app.models.notification import Notification


class User(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, BaseModel):
    """Application user retained after deletion to preserve dependent history."""

    __tablename__ = "users"
    __table_args__ = (
        Index(
            "uq_users_active_phone_number",
            "phone_number",
            unique=True,
            postgresql_where="deleted_at IS NULL",
        ),
        Index(
            "uq_users_active_email",
            "email",
            unique=True,
            postgresql_where="deleted_at IS NULL AND email IS NOT NULL",
        ),
    )

    full_name: Mapped[str] = mapped_column(String(150), nullable=False)
    phone_number: Mapped[str] = mapped_column(String(20), nullable=False)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)

    notification_preference: Mapped["NotificationPreference | None"] = relationship(
        back_populates="user", uselist=False
    )
    fields: Mapped[list["Field"]] = relationship(back_populates="user")
    notifications: Mapped[list["Notification"]] = relationship(back_populates="user")


class NotificationPreference(UUIDPrimaryKeyMixin, TimestampMixin, BaseModel):
    """Per-user controls for WhatsApp recommendation and weather alerts."""

    __tablename__ = "notification_preferences"

    user_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
        unique=True,
    )
    whatsapp_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="true")
    recommendation_change_alert: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default="true"
    )
    weather_risk_alert: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="true")

    user: Mapped["User"] = relationship(back_populates="notification_preference")
