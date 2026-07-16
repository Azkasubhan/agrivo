"""Centralized exception types and handler registration."""

import logging

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError

from app.core.responses import build_error_response

logger = logging.getLogger(__name__)

# Maps a single-field Pydantic validation failure to the specific error code
# defined in docs/08-security-validation.md § 3. Falls back to the generic
# VALIDATION_ERROR code when multiple fields fail or the field is unmapped.
_VALIDATION_ERROR_CODES: dict[str, str] = {
    "phone_number": "INVALID_PHONE_FORMAT",
    "password": "WEAK_PASSWORD",
    "email": "INVALID_EMAIL_FORMAT",
    "latitude": "LATITUDE_OUT_OF_RANGE",
    "longitude": "LONGITUDE_OUT_OF_RANGE",
    "soil_type": "INVALID_SOIL_TYPE",
    "field_area_ha": "FIELD_AREA_INVALID",
    "previous_irrigation_method": "INVALID_IRRIGATION_METHOD",
    "irrigation_system_type": "INVALID_IRRIGATION_SYSTEM_TYPE",
}


class AppError(Exception):
    """Base application exception for consistent API error mapping."""

    def __init__(
        self,
        code: str,
        message: str,
        status_code: int = 400,
        details: list[dict[str, str]] | None = None,
    ) -> None:
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details
        super().__init__(message)


class DuplicatePhoneNumberError(AppError):
    """Raised when registering a phone number already in use by an active user."""

    def __init__(self) -> None:
        super().__init__(
            code="PHONE_ALREADY_REGISTERED",
            message="Nomor telepon sudah terdaftar.",
            status_code=409,
        )


class DuplicateEmailError(AppError):
    """Raised when registering an email already in use by an active user."""

    def __init__(self) -> None:
        super().__init__(
            code="EMAIL_ALREADY_REGISTERED",
            message="Email sudah terdaftar.",
            status_code=409,
        )


class InvalidCredentialsError(AppError):
    """Raised when login credentials do not match any active user (generic message)."""

    def __init__(self) -> None:
        super().__init__(
            code="INVALID_CREDENTIALS",
            message="Nomor telepon atau password salah.",
            status_code=401,
        )


class TooManyRequestsError(AppError):
    """Raised when a client exceeds a rate limit on a sensitive endpoint."""

    def __init__(self, message: str = "Terlalu banyak percobaan, coba lagi nanti.") -> None:
        super().__init__(
            code="RATE_LIMIT_EXCEEDED",
            message=message,
            status_code=429,
        )


class InvalidRefreshTokenError(AppError):
    """Raised when a refresh token is invalid, expired, revoked, or reused."""

    def __init__(self) -> None:
        super().__init__(
            code="INVALID_REFRESH_TOKEN",
            message="Sesi telah berakhir, silakan login kembali.",
            status_code=401,
        )


class UnauthorizedError(AppError):
    """Raised when a request lacks a valid authenticated user context."""

    def __init__(self) -> None:
        super().__init__(
            code="UNAUTHORIZED",
            message="Autentikasi diperlukan.",
            status_code=401,
        )


class FieldNotFoundError(AppError):
    """Raised when a field does not exist or is not owned by the current user."""

    def __init__(self) -> None:
        super().__init__(
            code="FIELD_NOT_FOUND",
            message="Lahan tidak ditemukan.",
            status_code=404,
        )


class RiceVarietyNotFoundError(AppError):
    """Raised when the given rice variety code does not match any reference row."""

    def __init__(self) -> None:
        super().__init__(
            code="RICE_VARIETY_NOT_FOUND",
            message="Varietas padi tidak ditemukan.",
            status_code=404,
        )


class PlantingDateInFutureError(AppError):
    """Raised when planting_date is later than today."""

    def __init__(self) -> None:
        super().__init__(
            code="PLANTING_DATE_IN_FUTURE",
            message="Tanggal tanam tidak boleh di masa depan.",
            status_code=422,
            details=[
                {"field": "planting_date", "issue": "Tanggal tanam tidak boleh di masa depan"}
            ],
        )


class PlantingDateTooOldError(AppError):
    """Raised when planting_date exceeds the configured maximum field age."""

    def __init__(self, max_days: int) -> None:
        super().__init__(
            code="PLANTING_DATE_TOO_OLD",
            message=f"Tanggal tanam tidak boleh lebih dari {max_days} hari yang lalu.",
            status_code=422,
            details=[
                {
                    "field": "planting_date",
                    "issue": f"Melebihi batas maksimum {max_days} hari sejak tanam",
                }
            ],
        )


def register_exception_handlers(application: FastAPI) -> None:
    """Register application-wide exception handlers."""

    @application.exception_handler(AppError)
    async def handle_app_exception(_: Request, exc: AppError):
        return build_error_response(
            code=exc.code,
            message=exc.message,
            details=exc.details,
            status_code=exc.status_code,
        )

    @application.exception_handler(RequestValidationError)
    async def handle_validation_exception(_: Request, exc: RequestValidationError):
        errors = exc.errors()
        details = [
            {
                "field": ".".join(str(part) for part in error["loc"] if part != "body"),
                "issue": error["msg"],
            }
            for error in errors
        ]
        code = "VALIDATION_ERROR"
        if len(errors) == 1:
            field_name = next((str(part) for part in errors[0]["loc"] if part != "body"), None)
            code = _VALIDATION_ERROR_CODES.get(field_name, code)
        return build_error_response(
            code=code,
            message="Request tidak valid.",
            details=details,
            status_code=422,
        )

    @application.exception_handler(HTTPException)
    async def handle_http_exception(_: Request, exc: HTTPException):
        message = exc.detail if isinstance(exc.detail, str) else "Permintaan tidak dapat diproses."
        return build_error_response(
            code="HTTP_EXCEPTION",
            message=message,
            status_code=exc.status_code,
        )

    @application.exception_handler(Exception)
    async def handle_unexpected_exception(request: Request, exc: Exception):
        request_id = getattr(request.state, "request_id", None)
        logger.exception("Unhandled exception", extra={"request_id": request_id})
        return build_error_response(
            code="INTERNAL_SERVER_ERROR",
            message="Terjadi kesalahan internal pada server.",
            status_code=500,
        )
