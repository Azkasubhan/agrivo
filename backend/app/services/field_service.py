"""Field (rice field) business logic: ownership scoping and business-rule validation."""

from datetime import date, timedelta
from uuid import UUID

from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.exceptions import (
    FieldNotFoundError,
    PlantingDateInFutureError,
    PlantingDateTooOldError,
    RiceVarietyNotFoundError,
)
from app.models.field import Field
from app.repositories.field_repository import FieldRepository
from app.schemas.field import (
    FieldCreateRequest,
    FieldListResponse,
    FieldResponse,
    FieldUpdateRequest,
)


class FieldService:
    """Coordinates field CRUD with row-level ownership enforcement."""

    def __init__(self, session: Session) -> None:
        self.repository = FieldRepository(session)

    def create(self, user_id: UUID, payload: FieldCreateRequest) -> FieldResponse:
        """Create a new field owned by the given user."""
        rice_variety = self.repository.get_rice_variety_by_code(payload.rice_variety_code)
        if rice_variety is None:
            raise RiceVarietyNotFoundError()
        self._validate_planting_date(payload.planting_date)

        field = self.repository.create(
            user_id=user_id,
            name=payload.name,
            latitude=payload.latitude,
            longitude=payload.longitude,
            soil_type=payload.soil_type,
            rice_variety_id=rice_variety.id,
            planting_date=payload.planting_date,
            field_area_ha=payload.field_area_ha,
            previous_irrigation_method=payload.previous_irrigation_method,
            irrigation_system_type=payload.irrigation_system_type,
        )
        return self._to_response(field, rice_variety.code)

    def list_for_user(self, user_id: UUID, page: int, page_size: int) -> FieldListResponse:
        """Return a paginated list of fields owned by the given user."""
        fields, total = self.repository.list_owned(user_id, page, page_size)
        return FieldListResponse(
            items=[self._to_response(field, field.rice_variety.code) for field in fields],
            total=total,
            page=page,
            page_size=page_size,
        )

    def get(self, user_id: UUID, field_id: UUID) -> FieldResponse:
        """Return a single field owned by the given user."""
        field = self._get_owned_or_raise(user_id, field_id)
        return self._to_response(field, field.rice_variety.code)

    def update(self, user_id: UUID, field_id: UUID, payload: FieldUpdateRequest) -> FieldResponse:
        """Partially update a field owned by the given user."""
        field = self._get_owned_or_raise(user_id, field_id)
        changes = payload.model_dump(exclude_unset=True, exclude={"rice_variety_code"})

        if payload.planting_date is not None:
            self._validate_planting_date(payload.planting_date)
        if payload.rice_variety_code is not None:
            rice_variety = self.repository.get_rice_variety_by_code(payload.rice_variety_code)
            if rice_variety is None:
                raise RiceVarietyNotFoundError()
            changes["rice_variety_id"] = rice_variety.id

        field = self.repository.update(field, changes)
        return self._to_response(field, field.rice_variety.code)

    def delete(self, user_id: UUID, field_id: UUID) -> None:
        """Soft delete a field owned by the given user."""
        field = self._get_owned_or_raise(user_id, field_id)
        self.repository.soft_delete(field)

    def _get_owned_or_raise(self, user_id: UUID, field_id: UUID) -> Field:
        """Return the field owned by the user, or raise a 404 if absent/not owned."""
        field = self.repository.get_owned(field_id, user_id)
        if field is None:
            raise FieldNotFoundError()
        return field

    @staticmethod
    def _validate_planting_date(planting_date: date) -> None:
        """Enforce planting_date business rules (cannot use CURRENT_DATE in a DB CHECK)."""
        settings = get_settings()
        today = date.today()
        if planting_date > today:
            raise PlantingDateInFutureError()
        if today - planting_date > timedelta(days=settings.max_planting_age_days):
            raise PlantingDateTooOldError(settings.max_planting_age_days)

    @staticmethod
    def _to_response(field: Field, rice_variety_code: str) -> FieldResponse:
        """Map a `Field` ORM instance to its API response schema."""
        return FieldResponse(
            id=field.id,
            name=field.name,
            latitude=field.latitude,
            longitude=field.longitude,
            soil_type=field.soil_type,
            rice_variety_code=rice_variety_code,
            planting_date=field.planting_date,
            field_area_ha=field.field_area_ha,
            previous_irrigation_method=field.previous_irrigation_method,
            irrigation_system_type=field.irrigation_system_type,
            created_at=field.created_at,
            updated_at=field.updated_at,
        )
