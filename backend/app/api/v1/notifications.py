"""Notification API endpoints for retrieve and update read status."""

from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db_session
from app.core.dependencies import get_current_user
from app.core.exceptions import NotificationNotFoundError
from app.core.responses import build_success_response
from app.models.user import User
from app.repositories.notification_repository import NotificationRepository
from app.schemas.notification import NotificationListResponse, NotificationSchema

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("", summary="List notifications for the current user")
def list_notifications(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_db_session),
):
    """Retrieve a paginated list of notifications for the authenticated user."""
    repo = NotificationRepository(session)
    items, total = repo.list_by_user(current_user.id, page, page_size)
    
    # Map to schema
    response_data = NotificationListResponse(
        items=[NotificationSchema.model_validate(item) for item in items],
        total=total,
        page=page,
        page_size=page_size,
    )
    return build_success_response(
        message="Daftar notifikasi.",
        data=response_data.model_dump(mode="json"),
    )


@router.patch("/{notification_id}/read", summary="Mark a notification as read")
def mark_notification_as_read(
    notification_id: UUID,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_db_session),
):
    """Mark a specific notification as read, validating user ownership."""
    repo = NotificationRepository(session)
    notification = repo.get_by_id(notification_id)
    
    if not notification or notification.user_id != current_user.id:
        raise NotificationNotFoundError()

    updated_notif = repo.mark_as_read(notification)
    return build_success_response(
        message="Notifikasi ditandai sebagai terbaca.",
        data=NotificationSchema.model_validate(updated_notif).model_dump(mode="json"),
    )
