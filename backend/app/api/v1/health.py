"""Health check endpoint for infrastructure validation."""

from fastapi import APIRouter

from app.core.responses import build_success_response
from app.schemas.common import ApiSuccessResponse

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=ApiSuccessResponse, summary="Backend health check")
def health_check():
    """Return the backend health status."""
    return build_success_response(message="Backend is healthy")
