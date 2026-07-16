"""Application settings loaded from environment variables."""

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime configuration for the AGRIVO backend."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    app_name: str = Field(default="AGRIVO Backend")
    app_env: str = Field(default="development")
    app_host: str = Field(default="0.0.0.0")
    app_port: int = Field(default=8000)
    api_v1_prefix: str = Field(default="/api/v1")
    log_level: str = Field(default="INFO")
    allowed_origins_raw: str = Field(default="", alias="allowed_origins")
    request_id_header_name: str = Field(default="X-Request-ID")
    database_url: str = Field(...)
    jwt_secret_key: str = Field(default="")
    access_token_expire_minutes: int = Field(default=15)
    refresh_token_expire_days: int = Field(default=7)
    weather_cache_ttl_hours: int = Field(default=6)
    max_planting_age_days: int = Field(default=150)
    max_field_area_ha: int = Field(default=25)
    open_meteo_base_url: str = Field(default="https://api.open-meteo.com")
    open_meteo_archive_url: str = Field(default="https://archive-api.open-meteo.com")
    fonnte_base_url: str = Field(default="https://api.fonnte.com")
    fonnte_api_token: str = Field(default="")
    fonnte_device_id: str = Field(default="")

    @property
    def allowed_origins(self) -> list[str]:
        if not self.allowed_origins_raw:
            return []
        return [origin.strip() for origin in self.allowed_origins_raw.split(",") if origin.strip()]

    @property
    def sqlalchemy_database_url(self) -> str:
        """Return the configured PostgreSQL URL with the installed psycopg v3 dialect."""
        return self.database_url.replace("postgresql://", "postgresql+psycopg://", 1)

    @property
    def is_debug(self) -> bool:
        return self.app_env.lower() == "development"


@lru_cache
def get_settings() -> Settings:
    """Return the cached settings instance."""
    return Settings()
