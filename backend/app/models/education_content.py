"""Education-content persistence model."""

from sqlalchemy import Enum, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import BaseModel, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.enums import IrrigationStrategy


class EducationContent(UUIDPrimaryKeyMixin, TimestampMixin, BaseModel):
    """Static educational material optionally associated with an irrigation strategy."""

    __tablename__ = "education_content"

    related_strategy: Mapped[IrrigationStrategy | None] = mapped_column(
        Enum(IrrigationStrategy, name="irrigation_strategy", create_constraint=False), nullable=True
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    body_markdown: Mapped[str] = mapped_column(Text, nullable=False)
    display_order: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")
