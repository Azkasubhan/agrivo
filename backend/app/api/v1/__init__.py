"""API v1 router aggregation."""

from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.education import router as education_router
from app.api.v1.fields import router as fields_router
from app.api.v1.health import router as health_router
from app.api.v1.recommendations import router as recommendations_router
from app.api.v1.users import router as users_router

api_v1_router = APIRouter()
api_v1_router.include_router(health_router)
api_v1_router.include_router(auth_router)
api_v1_router.include_router(users_router)
api_v1_router.include_router(education_router)
api_v1_router.include_router(fields_router)
api_v1_router.include_router(recommendations_router)

__all__ = ["api_v1_router"]

