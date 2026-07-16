"""Centralized exception types and handler registration."""

import logging

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError

from app.core.responses import build_error_response

logger = logging.getLogger(__name__)


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
        details = [
            {
                "field": ".".join(str(part) for part in error["loc"] if part != "body"),
                "issue": error["msg"],
            }
            for error in exc.errors()
        ]
        return build_error_response(
            code="VALIDATION_ERROR",
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
