"""Authentication business logic: registration, login, and token refresh."""

from datetime import UTC, datetime, timedelta

from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.exceptions import (
    DuplicateEmailError,
    DuplicatePhoneNumberError,
    InvalidCredentialsError,
    InvalidRefreshTokenError,
    TooManyRequestsError,
)
from app.core.rate_limiter import get_login_rate_limiter
from app.core.security import (
    create_access_token,
    generate_refresh_token,
    hash_password,
    hash_refresh_token,
    verify_password,
)
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.auth import RegisterRequest, TokenResponse


class AuthService:
    """Coordinates user registration, authentication, and refresh-token rotation."""

    def __init__(self, session: Session) -> None:
        self.repository = UserRepository(session)

    def register(self, payload: RegisterRequest) -> User:
        """Register a new user, rejecting duplicate active phone numbers/emails."""
        if self.repository.get_by_phone_number(payload.phone_number):
            raise DuplicatePhoneNumberError()
        if payload.email and self.repository.get_by_email(payload.email):
            raise DuplicateEmailError()
        return self.repository.create(
            full_name=payload.full_name,
            phone_number=payload.phone_number,
            password_hash=hash_password(payload.password),
            email=payload.email,
        )

    def login(self, phone_number: str, password: str, client_ip: str) -> TokenResponse:
        """Authenticate a user by phone number and password, issuing new tokens."""
        rate_limiter = get_login_rate_limiter()
        rate_limit_key = f"{phone_number}:{client_ip}"
        if not rate_limiter.is_allowed(rate_limit_key):
            raise TooManyRequestsError("Terlalu banyak percobaan login, coba lagi nanti.")

        user = self.repository.get_by_phone_number(phone_number)
        if user is None or not verify_password(password, user.password_hash):
            rate_limiter.record_attempt(rate_limit_key)
            raise InvalidCredentialsError()

        rate_limiter.reset(rate_limit_key)
        return self._issue_tokens(user.id)

    def refresh(self, refresh_token: str) -> TokenResponse:
        """Rotate a refresh token, detecting reuse of already-consumed tokens."""
        token_hash = hash_refresh_token(refresh_token)
        stored_token = self.repository.get_refresh_token_by_hash(token_hash)
        if stored_token is None:
            raise InvalidRefreshTokenError()
        if stored_token.is_used:
            # Reuse of a rotated/consumed token indicates possible theft.
            self.repository.revoke_all_refresh_tokens_for_user(stored_token.user_id)
            raise InvalidRefreshTokenError()
        if stored_token.expires_at < datetime.now(UTC):
            raise InvalidRefreshTokenError()

        tokens = self._issue_tokens(stored_token.user_id)
        new_hash = hash_refresh_token(tokens.refresh_token)
        new_token = self.repository.get_refresh_token_by_hash(new_hash)
        self.repository.revoke_refresh_token(stored_token, replaced_by_id=new_token.id)
        return tokens

    def _issue_tokens(self, user_id) -> TokenResponse:
        """Create a new access/refresh token pair and persist the refresh token."""
        settings = get_settings()
        access_token, expires_in = create_access_token(user_id)
        refresh_token = generate_refresh_token()
        expires_at = datetime.now(UTC) + timedelta(days=settings.refresh_token_expire_days)
        self.repository.create_refresh_token(
            user_id=user_id,
            token_hash=hash_refresh_token(refresh_token),
            expires_at=expires_at,
        )
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=expires_in,
        )
