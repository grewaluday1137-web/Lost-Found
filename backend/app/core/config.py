import os
from typing import List, Union
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import AnyHttpUrl, field_validator

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    PROJECT_NAME: str = "Campus Lost & Found Portal"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "campus-lost-and-found-super-secret-jwt-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    MONGODB_URI: str = "mongodb://localhost:27017"
    DATABASE_NAME: str = "lost_and_found_db"

    AUTO_APPROVE_REPORTS: bool = False

    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE_MB: int = 5
    ALLOWED_EXTENSIONS: List[str] = ["jpg", "jpeg", "png", "webp"]

    QR_TOKEN_EXPIRE_HOURS: int = 48

    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

settings = Settings()
