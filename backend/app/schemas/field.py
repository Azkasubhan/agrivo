"""Pydantic request/response schemas for field (rice field) endpoints."""

from datetime import date, datetime
from decimal import Decimal
from typing import Annotated
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import IrrigationStrategy, IrrigationSystemType, SoilType

Latitude = Annotated[Decimal, Field(ge=Decimal("-11.00"), le=Decimal("6.10"))]
Longitude = Annotated[Decimal, Field(ge=Decimal("94.70"), le=Decimal("141.10"))]
FieldAreaHa = Annotated[Decimal, Field(gt=Decimal("0"), le=Decimal("25"))]
FieldName = Annotated[str, Field(min_length=1, max_length=100)]


class FieldCreateRequest(BaseModel):
    """Request payload for `POST /api/v1/fields`."""

    model_config = ConfigDict(extra="forbid")

    name: FieldName
    latitude: Latitude
    longitude: Longitude
    soil_type: SoilType
    rice_variety_code: str
    planting_date: date
    field_area_ha: FieldAreaHa
    previous_irrigation_method: IrrigationStrategy | None = None
    irrigation_system_type: IrrigationSystemType | None = None


class FieldUpdateRequest(BaseModel):
    """Request payload for `PATCH /api/v1/fields/{field_id}` (partial update)."""

    model_config = ConfigDict(extra="forbid")

    name: FieldName | None = None
    latitude: Latitude | None = None
    longitude: Longitude | None = None
    soil_type: SoilType | None = None
    rice_variety_code: str | None = None
    planting_date: date | None = None
    field_area_ha: FieldAreaHa | None = None
    previous_irrigation_method: IrrigationStrategy | None = None
    irrigation_system_type: IrrigationSystemType | None = None


class FieldResponse(BaseModel):
    """Response payload representing a single field."""

    model_config = ConfigDict(extra="forbid")

    id: UUID
    name: str
    latitude: Decimal
    longitude: Decimal
    soil_type: SoilType
    rice_variety_code: str
    planting_date: date
    field_area_ha: Decimal
    previous_irrigation_method: IrrigationStrategy | None
    irrigation_system_type: IrrigationSystemType | None
    created_at: datetime
    updated_at: datetime


class FieldListResponse(BaseModel):
    """Paginated response payload for `GET /api/v1/fields`."""

    model_config = ConfigDict(extra="forbid")

    items: list[FieldResponse]
    total: int
    page: int
    page_size: int
