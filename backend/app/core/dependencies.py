"""Shared FastAPI dependencies for resolving the authenticated user."""

import jwt
from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.database import get_db_session
from app.core.exceptions import UnauthorizedError
from app.core.security import decode_access_token
from app.models.user import User
from app.repositories.user_repository import UserRepository

_bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
    session: Session = Depends(get_db_session),
) -> User:
    """Resolve the authenticated user from the `Authorization: Bearer` access token."""
    if credentials is None:
        raise UnauthorizedError()

    try:
        user_id = decode_access_token(credentials.credentials)
    except jwt.PyJWTError as exc:
        raise UnauthorizedError() from exc

    user = UserRepository(session).get_by_id(user_id)
    if user is None:
        raise UnauthorizedError()
    return user
