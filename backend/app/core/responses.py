"""Helpers for standardized API responses."""

from typing import Any

from fastapi.responses import JSONResponse

from app.schemas.common import ApiErrorResponse, ApiSuccessResponse


def build_success_response(
    message: str,
    data: Any | None = None,
    status_code: int = 200,
) -> JSONResponse:
    """Build a standardized success response payload."""
    payload = ApiSuccessResponse(message=message, data=data)
    return JSONResponse(status_code=status_code, content=payload.model_dump(exclude_none=True))


def build_error_response(
    code: str,
    message: str,
    details: list[dict[str, str]] | None = None,
    status_code: int = 500,
) -> JSONResponse:
    """Build a standardized error response payload."""
    payload = ApiErrorResponse(code=code, message=message, details=details)
    return JSONResponse(status_code=status_code, content=payload.model_dump(exclude_none=True))
