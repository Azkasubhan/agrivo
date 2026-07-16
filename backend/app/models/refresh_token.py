"""Refresh token persistence model for JWT rotation and reuse detection."""

from datetime import datetime
from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, String
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel, CreatedAtMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.user import User


class RefreshToken(UUIDPrimaryKeyMixin, CreatedAtMixin, BaseModel):
    """Hashed refresh token record supporting rotation and reuse detection."""

    __tablename__ = "refresh_tokens"
    __table_args__ = (Index("idx_refresh_tokens_user_id", "user_id"),)

    user_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    token_hash: Mapped[str] = mapped_column(String(64), nullable=False, unique=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    replaced_by_token_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("refresh_tokens.id"), nullable=True
    )
    is_used: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="false")

    user: Mapped["User"] = relationship()
