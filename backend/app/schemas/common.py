"""Shared response schemas for infrastructure endpoints."""

from typing import Any

from pydantic import BaseModel, ConfigDict


class ApiSuccessResponse(BaseModel):
    """Standard success response wrapper."""

    model_config = ConfigDict(extra="forbid")

    success: bool = True
    message: str
    data: Any | None = None


class ApiErrorEnvelope(BaseModel):
    """Standard error envelope payload."""

    model_config = ConfigDict(extra="forbid")

    code: str
    message: str
    details: list[dict[str, str]] | None = None


class ApiErrorResponse(BaseModel):
    """Standard top-level error response payload."""

    model_config = ConfigDict(extra="forbid")

    error: ApiErrorEnvelope

    def __init__(self, **data: Any) -> None:
        if "error" not in data:
            payload = {
                "code": data.pop("code"),
                "message": data.pop("message"),
                "details": data.pop("details", None),
            }
            data["error"] = payload
        super().__init__(**data)
