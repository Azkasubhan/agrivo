"""Authentication endpoints: register, login, refresh."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db_session
from app.core.responses import build_success_response
from app.schemas.auth import LoginRequest, RefreshRequest, RegisterRequest, RegisterResponse
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", summary="Register a new user", status_code=201)
def register(payload: RegisterRequest, session: Session = Depends(get_db_session)):
    """Create a new user account."""
    user = AuthService(session).register(payload)
    response = RegisterResponse(
        id=user.id, full_name=user.full_name, phone_number=user.phone_number
    )
    return build_success_response(
        message="Registrasi berhasil.", data=response.model_dump(mode="json"), status_code=201
    )


@router.post("/login", summary="Authenticate and issue access/refresh tokens")
def login(payload: LoginRequest, session: Session = Depends(get_db_session)):
    """Authenticate a user and return a new token pair."""
    tokens = AuthService(session).login(payload.phone_number, payload.password)
    return build_success_response(message="Login berhasil.", data=tokens.model_dump(mode="json"))


@router.post("/refresh", summary="Rotate a refresh token for a new access token")
def refresh(payload: RefreshRequest, session: Session = Depends(get_db_session)):
    """Rotate a refresh token, issuing a new access/refresh token pair."""
    tokens = AuthService(session).refresh(payload.refresh_token)
    return build_success_response(message="Token diperbarui.", data=tokens.model_dump(mode="json"))
