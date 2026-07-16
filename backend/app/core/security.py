"""Password hashing and JWT token utilities."""

import hashlib
import secrets
from datetime import UTC, datetime, timedelta
from uuid import UUID

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError

from app.core.config import get_settings

_password_hasher = PasswordHasher()
_JWT_ALGORITHM = "HS256"


def hash_password(password: str) -> str:
    """Hash a plaintext password with Argon2id."""
    return _password_hasher.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    """Verify a plaintext password against its Argon2id hash."""
    try:
        return _password_hasher.verify(password_hash, password)
    except VerifyMismatchError:
        return False


def create_access_token(user_id: UUID) -> tuple[str, int]:
    """Create a short-lived JWT access token for the given user."""
    settings = get_settings()
    expires_in = settings.access_token_expire_minutes * 60
    now = datetime.now(UTC)
    payload = {
        "user_id": str(user_id),
        "iat": now,
        "exp": now + timedelta(seconds=expires_in),
    }
    token = jwt.encode(payload, settings.jwt_secret_key, algorithm=_JWT_ALGORITHM)
    return token, expires_in


def decode_access_token(token: str) -> UUID:
    """Decode a JWT access token and return the embedded user id."""
    settings = get_settings()
    payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[_JWT_ALGORITHM])
    return UUID(payload["user_id"])


def generate_refresh_token() -> str:
    """Generate a cryptographically random opaque refresh token."""
    return secrets.token_urlsafe(64)


def hash_refresh_token(token: str) -> str:
    """Hash a refresh token for storage (never store raw tokens)."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()
