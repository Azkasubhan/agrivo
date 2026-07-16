"""FastAPI application entrypoint for AGRIVO backend."""

from fastapi import FastAPI

from app.api.v1 import api_v1_router
from app.core.config import get_settings
from app.core.exceptions import register_exception_handlers
from app.core.logging import configure_logging
from app.core.middleware import register_middleware

configure_logging()
settings = get_settings()


def create_application() -> FastAPI:
    """Create and configure the FastAPI application instance."""
    application = FastAPI(
        title=settings.app_name,
        debug=settings.is_debug,
    )

    register_middleware(application, settings)
    register_exception_handlers(application)
    application.include_router(api_v1_router, prefix=settings.api_v1_prefix)

    return application


app = create_application()
