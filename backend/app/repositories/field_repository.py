"""Field data access, scoped to the owning user and soft-delete state."""

from datetime import UTC, datetime
from typing import Any
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.field import Field, RiceVariety


class FieldRepository:
    """Repository for the `fields` and `rice_varieties` tables."""

    def __init__(self, session: Session) -> None:
        self.session = session

    def get_rice_variety_by_code(self, code: str) -> RiceVariety | None:
        """Return the rice variety with the given reference code, if any."""
        statement = select(RiceVariety).where(RiceVariety.code == code)
        return self.session.execute(statement).scalar_one_or_none()

    def create(self, **attributes: Any) -> Field:
        """Persist a new field."""
        field = Field(**attributes)
        self.session.add(field)
        self.session.commit()
        self.session.refresh(field)
        return field

    def get_owned(self, field_id: UUID, user_id: UUID) -> Field | None:
        """Return the active field with the given id, scoped to its owner."""
        statement = select(Field).where(
            Field.id == field_id, Field.user_id == user_id, Field.deleted_at.is_(None)
        )
        return self.session.execute(statement).scalar_one_or_none()

    def list_owned(self, user_id: UUID, page: int, page_size: int) -> tuple[list[Field], int]:
        """Return a paginated list of active fields owned by the user, plus total count."""
        base_statement = select(Field).where(Field.user_id == user_id, Field.deleted_at.is_(None))
        total = self.session.execute(
            select(func.count()).select_from(base_statement.subquery())
        ).scalar_one()
        items = (
            self.session.execute(
                base_statement.order_by(Field.created_at.desc())
                .offset((page - 1) * page_size)
                .limit(page_size)
            )
            .scalars()
            .all()
        )
        return list(items), total

    def update(self, field: Field, changes: dict[str, Any]) -> Field:
        """Apply partial changes to a field and persist them."""
        for attribute, value in changes.items():
            setattr(field, attribute, value)
        self.session.commit()
        self.session.refresh(field)
        return field

    def soft_delete(self, field: Field) -> None:
        """Mark a field as deleted without removing its row (preserves history)."""
        field.deleted_at = datetime.now(UTC)
        self.session.commit()
