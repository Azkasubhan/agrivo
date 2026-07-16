"""User and refresh-token data access."""

from datetime import datetime
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.refresh_token import RefreshToken
from app.models.user import NotificationPreference, User


class UserRepository:
    """Repository for `users`, `notification_preferences`, and `refresh_tokens` tables."""

    def __init__(self, session: Session) -> None:
        self.session = session

    def get_by_phone_number(self, phone_number: str) -> User | None:
        """Return the active user with the given phone number, if any."""
        statement = select(User).where(User.phone_number == phone_number, User.deleted_at.is_(None))
        return self.session.execute(statement).scalar_one_or_none()

    def get_by_email(self, email: str) -> User | None:
        """Return the active user with the given email, if any."""
        statement = select(User).where(User.email == email, User.deleted_at.is_(None))
        return self.session.execute(statement).scalar_one_or_none()

    def get_by_id(self, user_id: UUID) -> User | None:
        """Return the active user with the given id, if any."""
        statement = select(User).where(User.id == user_id, User.deleted_at.is_(None))
        return self.session.execute(statement).scalar_one_or_none()

    def create(
        self, full_name: str, phone_number: str, password_hash: str, email: str | None
    ) -> User:
        """Persist a new user with default notification preferences."""
        user = User(
            full_name=full_name,
            phone_number=phone_number,
            password_hash=password_hash,
            email=email,
        )
        self.session.add(user)
        self.session.flush()
        self.session.add(NotificationPreference(user_id=user.id))
        self.session.commit()
        self.session.refresh(user)
        return user

    def create_refresh_token(
        self, user_id: UUID, token_hash: str, expires_at: datetime
    ) -> RefreshToken:
        """Persist a new refresh token record."""
        refresh_token = RefreshToken(user_id=user_id, token_hash=token_hash, expires_at=expires_at)
        self.session.add(refresh_token)
        self.session.commit()
        self.session.refresh(refresh_token)
        return refresh_token

    def get_refresh_token_by_hash(self, token_hash: str) -> RefreshToken | None:
        """Return the refresh token record matching the given hash, if any."""
        statement = select(RefreshToken).where(RefreshToken.token_hash == token_hash)
        return self.session.execute(statement).scalar_one_or_none()

    def revoke_refresh_token(
        self, refresh_token: RefreshToken, replaced_by_id: UUID | None = None
    ) -> None:
        """Mark a refresh token as used/revoked, optionally linking its replacement."""
        refresh_token.is_used = True
        refresh_token.revoked_at = datetime.now(tz=refresh_token.expires_at.tzinfo)
        refresh_token.replaced_by_token_id = replaced_by_id
        self.session.commit()

    def revoke_all_refresh_tokens_for_user(self, user_id: UUID) -> None:
        """Revoke every active refresh token for a user (reuse-detection response)."""
        statement = select(RefreshToken).where(
            RefreshToken.user_id == user_id, RefreshToken.is_used.is_(False)
        )
        tokens = self.session.execute(statement).scalars().all()
        now = datetime.now(tz=tokens[0].expires_at.tzinfo) if tokens else None
        for token in tokens:
            token.is_used = True
            token.revoked_at = now
        self.session.commit()

    def update_user(self, user: "User", changes: dict) -> "User":
        """Apply partial updates to a user's profile fields."""
        for attr, value in changes.items():
            setattr(user, attr, value)
        self.session.commit()
        self.session.refresh(user)
        return user

    def update_notification_preference(
        self, user: "User", changes: dict
    ) -> "NotificationPreference | None":
        """Apply partial updates to a user's notification preferences."""
        pref = user.notification_preference
        if pref is None:
            return None
        for attr, value in changes.items():
            setattr(pref, attr, value)
        self.session.commit()
        self.session.refresh(pref)
        return pref
