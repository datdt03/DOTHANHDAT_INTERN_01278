from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "RepairFlow API"
    service_name: str = "repairflow-api"
    app_version: str = "0.1.0"
    api_version: str = "v1"
    environment: str = Field(default="development", validation_alias="APP_ENV")
    host: str = Field(default="127.0.0.1", validation_alias="APP_HOST")
    port: int = Field(default=8000, validation_alias="APP_PORT")
    database_url: str = Field(
        default=(
            "postgresql+psycopg://repairflow:change-me-local-only"
            "@127.0.0.1:5432/repairflow"
        ),
        validation_alias="DATABASE_URL",
    )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        env_prefix="",
        extra="ignore",
        case_sensitive=False,
    )


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
