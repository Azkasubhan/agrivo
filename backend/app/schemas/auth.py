"""Pydantic request/response schemas for authentication endpoints."""

import re
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, field_validator

_PHONE_PATTERN = re.compile(r"^\+62\d{8,13}$")


class RegisterRequest(BaseModel):
    """Request payload for `POST /api/v1/auth/register`."""

    model_config = ConfigDict(extra="forbid")

    full_name: str
    phone_number: str
    password: str
    email: EmailStr | None = None

    @field_validator("phone_number")
    @classmethod
    def validate_phone_number(cls, value: str) -> str:
        if not _PHONE_PATTERN.match(value):
            raise ValueError("Nomor telepon harus format E.164 Indonesia (+62...)")
        return value

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        if len(value) < 8 or not re.search(r"[A-Za-z]", value) or not re.search(r"\d", value):
            raise ValueError("Password minimal 8 karakter dan mengandung huruf serta angka")
        return value


class RegisterResponse(BaseModel):
    """Response payload for a successfully registered user."""

    model_config = ConfigDict(extra="forbid")

    id: UUID
    full_name: str
    phone_number: str


class LoginRequest(BaseModel):
    """Request payload for `POST /api/v1/auth/login`."""

    model_config = ConfigDict(extra="forbid")

    phone_number: str
    password: str


class TokenResponse(BaseModel):
    """Response payload for a successful login or token refresh."""

    model_config = ConfigDict(extra="forbid")

    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class RefreshRequest(BaseModel):
    """Request payload for `POST /api/v1/auth/refresh`."""

    model_config = ConfigDict(extra="forbid")

    refresh_token: str
