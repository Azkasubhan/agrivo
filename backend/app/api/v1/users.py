"""User profile endpoints: GET/PATCH /users/me and notification preferences."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db_session
from app.core.dependencies import get_current_user
from app.core.responses import build_success_response
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.user import (
    NotificationPreferenceSchema,
    UpdateNotificationPreferenceRequest,
    UpdateProfileRequest,
    UserProfileResponse,
)

router = APIRouter(prefix="/users", tags=["Users"])


def _to_profile_response(user: User) -> UserProfileResponse:
    """Map a User ORM instance to its profile response schema."""
    pref = user.notification_preference
    return UserProfileResponse(
        id=user.id,
        full_name=user.full_name,
        phone_number=user.phone_number,
        email=user.email,
        notification_preference=(
            NotificationPreferenceSchema(
                whatsapp_enabled=pref.whatsapp_enabled,
                recommendation_change_alert=pref.recommendation_change_alert,
                weather_risk_alert=pref.weather_risk_alert,
            )
            if pref
            else None
        ),
        created_at=user.created_at,
    )


@router.get("/me", summary="Get the authenticated user's profile")
def get_me(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_db_session),
):
    """Return the profile of the authenticated user."""
    # Re-fetch to ensure notification_preference is loaded
    repo = UserRepository(session)
    user = repo.get_by_id(current_user.id)
    return build_success_response(
        message="Profil pengguna.",
        data=_to_profile_response(user).model_dump(mode="json"),
    )


@router.patch("/me", summary="Update the authenticated user's profile")
def update_me(
    payload: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_db_session),
):
    """Partially update the authenticated user's name or email."""
    changes = payload.model_dump(exclude_unset=True)
    if not changes:
        return build_success_response(
            message="Tidak ada perubahan.", data=_to_profile_response(current_user).model_dump(mode="json")
        )
    repo = UserRepository(session)
    user = repo.update_user(current_user, changes)
    return build_success_response(
        message="Profil berhasil diperbarui.",
        data=_to_profile_response(user).model_dump(mode="json"),
    )


@router.patch("/me/notifications", summary="Update notification preferences")
def update_notifications(
    payload: UpdateNotificationPreferenceRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_db_session),
):
    """Update WhatsApp and alert preferences for the authenticated user."""
    changes = payload.model_dump(exclude_unset=True)
    repo = UserRepository(session)
    user = repo.get_by_id(current_user.id)
    if changes:
        repo.update_notification_preference(user, changes)
        user = repo.get_by_id(current_user.id)
    return build_success_response(
        message="Preferensi notifikasi diperbarui.",
        data=_to_profile_response(user).model_dump(mode="json"),
    )
