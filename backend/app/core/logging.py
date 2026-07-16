"""Structured JSON logging configuration."""

import logging
from logging.config import dictConfig

from app.core.config import get_settings


def configure_logging() -> None:
    """Configure application-wide structured logging."""
    settings = get_settings()

    dictConfig(
        {
            "version": 1,
            "disable_existing_loggers": False,
            "formatters": {
                "json": {
                    "()": "pythonjsonlogger.jsonlogger.JsonFormatter",
                    "fmt": "%(asctime)s %(levelname)s %(name)s %(message)s %(request_id)s",
                }
            },
            "handlers": {
                "default": {
                    "class": "logging.StreamHandler",
                    "formatter": "json",
                    "level": settings.log_level,
                }
            },
            "root": {
                "handlers": ["default"],
                "level": settings.log_level,
            },
        }
    )

    logging.getLogger("uvicorn.access").handlers = []
