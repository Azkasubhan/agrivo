"""Field (rice field) CRUD endpoints. All routes require auth and are scoped to the owner."""

from uuid import UUID

from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session

from app.core.database import get_db_session
from app.core.dependencies import get_current_user
from app.core.responses import build_success_response
from app.models.user import User
from app.schemas.field import FieldCreateRequest, FieldUpdateRequest
from app.services.field_service import FieldService

router = APIRouter(prefix="/fields", tags=["Fields"])


@router.post("", summary="Create a new field", status_code=201)
def create_field(
    payload: FieldCreateRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_db_session),
):
    """Register a new rice field owned by the authenticated user."""
    field = FieldService(session).create(current_user.id, payload)
    return build_success_response(
        message="Lahan berhasil dibuat.", data=field.model_dump(mode="json"), status_code=201
    )


@router.get("", summary="List fields owned by the authenticated user")
def list_fields(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_db_session),
):
    """Return a paginated list of active fields owned by the authenticated user."""
    result = FieldService(session).list_for_user(current_user.id, page, page_size)
    return build_success_response(message="Daftar lahan.", data=result.model_dump(mode="json"))


@router.get("/{field_id}", summary="Get a field by id")
def get_field(
    field_id: UUID,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_db_session),
):
    """Return a single field owned by the authenticated user."""
    field = FieldService(session).get(current_user.id, field_id)
    return build_success_response(message="Detail lahan.", data=field.model_dump(mode="json"))


@router.patch("/{field_id}", summary="Partially update a field")
def update_field(
    field_id: UUID,
    payload: FieldUpdateRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_db_session),
):
    """Partially update a field owned by the authenticated user."""
    field = FieldService(session).update(current_user.id, field_id, payload)
    return build_success_response(
        message="Lahan berhasil diperbarui.", data=field.model_dump(mode="json")
    )


@router.delete("/{field_id}", summary="Soft delete a field", status_code=204)
def delete_field(
    field_id: UUID,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_db_session),
):
    """Soft delete a field owned by the authenticated user, preserving history."""
    FieldService(session).delete(current_user.id, field_id)
    return Response(status_code=204)


@router.get("/{field_id}/weather", summary="Get weather for a field")
def get_field_weather(
    field_id: UUID,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_db_session),
):
    """Return weather forecast and computed derived agronomic inputs for a field."""
    from app.services.weather_service import WeatherService  # noqa: PLC0415
    field_service = FieldService(session)
    field = field_service._get_owned_or_raise(current_user.id, field_id)

    weather_service = WeatherService(session)
    snapshot = weather_service.get_weather_for_field(field)
    data = weather_service.format_weather_response(snapshot)

    return build_success_response(
        message="Informasi cuaca berhasil diambil.",
        data=data,
    )


@router.post("/{field_id}/recommendations", summary="Trigger a new AI recommendation", status_code=201)
def trigger_recommendation(
    field_id: UUID,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_db_session),
):
    """Generate a new AI recommendation and prediction for a field."""
    from app.services.recommendation_service import RecommendationService  # noqa: PLC0415
    result = RecommendationService(session).generate_recommendation(current_user.id, field_id)
    return build_success_response(
        message="Rekomendasi berhasil dibuat.",
        data=result,
        status_code=201,
    )


@router.get("/{field_id}/recommendations", summary="List recommendations for a field")
def list_field_recommendations(
    field_id: UUID,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_db_session),
):
    """Return a paginated list of recommendations generated for a field."""
    from app.services.recommendation_service import RecommendationService  # noqa: PLC0415
    result = RecommendationService(session).list_recommendations_for_field(
        current_user.id, field_id, page, page_size
    )
    return build_success_response(
        message="Daftar rekomendasi lahan.",
        data=result,
    )


