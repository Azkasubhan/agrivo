"""FastAPI application entrypoint for AGRIVO backend."""

from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api.v1 import api_v1_router
from app.core.config import get_settings
from app.core.exceptions import register_exception_handlers
from app.core.logging import configure_logging
from app.core.middleware import register_middleware
from app.services.scheduler_service import SchedulerService

configure_logging()
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage startup and shutdown lifecycle events."""
    SchedulerService.start()
    yield
    SchedulerService.shutdown()


def create_application() -> FastAPI:
    """Create and configure the FastAPI application instance."""
    application = FastAPI(
        title=settings.app_name,
        debug=settings.is_debug,
        lifespan=lifespan,
    )

    register_middleware(application, settings)
    register_exception_handlers(application)
    application.include_router(api_v1_router, prefix=settings.api_v1_prefix)

    return application


app = create_application()
