"""Education content endpoints (public, no auth required)."""

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db_session
from app.core.responses import build_success_response
from app.models.education_content import EducationContent

router = APIRouter(prefix="/education", tags=["Education"])


@router.get("", summary="List all educational content (public)")
def list_education(session: Session = Depends(get_db_session)):
    """Return all educational articles ordered by display_order."""
    rows = (
        session.execute(
            select(EducationContent).order_by(EducationContent.display_order)
        )
        .scalars()
        .all()
    )
    data = [
        {
            "id": str(row.id),
            "related_strategy": row.related_strategy.value if row.related_strategy else None,
            "title": row.title,
            "body_markdown": row.body_markdown,
            "display_order": row.display_order,
        }
        for row in rows
    ]
    return build_success_response(message="Konten edukasi.", data=data)
