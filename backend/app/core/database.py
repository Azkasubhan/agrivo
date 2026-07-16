"""Database engine and session infrastructure."""

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import get_settings
from app.models.base import BaseModel

settings = get_settings()

engine = create_engine(
    settings.sqlalchemy_database_url,
    pool_pre_ping=True,
    future=True,
)
SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
    expire_on_commit=False,
    class_=Session,
)

__all__ = ["BaseModel", "SessionLocal", "engine", "get_db_session"]


def get_db_session() -> Generator[Session, None, None]:
    """Yield a database session for dependency injection."""
    database_session = SessionLocal()
    try:
        yield database_session
    finally:
        database_session.close()
