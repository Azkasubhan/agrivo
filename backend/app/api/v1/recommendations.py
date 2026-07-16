"""Recommendation retrieval endpoints. Scoped to field owners."""

from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db_session
from app.core.dependencies import get_current_user
from app.core.responses import build_success_response
from app.models.user import User
from app.services.recommendation_service import RecommendationService

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])


@router.get("/{recommendation_id}", summary="Get recommendation detail")
def get_recommendation(
    recommendation_id: UUID,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_db_session),
):
    """Return complete detail for a specific recommendation including quantitative predictions and explanations."""
    result = RecommendationService(session).get_recommendation_detail(
        current_user.id, recommendation_id
    )
    return build_success_response(
        message="Detail rekomendasi.",
        data=result,
    )
