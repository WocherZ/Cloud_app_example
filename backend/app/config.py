"""
Конфигурационный файл для подключения к базе данных.
"""
import os
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Настройки приложения и базы данных."""
    
    # Настройки базы данных
    DB_HOST: str = "localhost"
    DB_PORT: int = 5432
    DB_USER: str = "postgres"
    DB_PASSWORD: str = "postgres"
    DB_NAME: str = "gooddeeds_db"
    
    # Настройки JWT
    SECRET_KEY: str = "YOUR_SUPER_SECRET_KEY"  # Важно: смените на свой ключ
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 2880 # 2 дня 

    # Настройки OpenAI (обязательно задаются через .env)
    # Примеры переменных окружения:
    # OPENAI_API_KEY=...
    # OPENAI_MODEL=...
    # OPENAI_TEMPERATURE=0.4
    # OPENAI_BASE_URL=https://openrouter.ai/api/v1
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_MODEL: Optional[str] = None
    OPENAI_TEMPERATURE: float = 0.4
    OPENAI_BASE_URL: Optional[str] = None
    
    # Настройки MinIO (обязательно задаются через .env)
    # Примеры переменных окружения:
    # MINIO_ENDPOINT=localhost:9000
    # MINIO_ACCESS_KEY=minioadmin
    # MINIO_SECRET_KEY=minioadmin
    # MINIO_BUCKET_NAME=gooddeeds-files
    # MINIO_SECURE=false
    MINIO_ENDPOINT: str = "localhost:9000"
    MINIO_ACCESS_KEY: str = "minioadmin"
    MINIO_SECRET_KEY: str = "minioadmin"
    MINIO_BUCKET_NAME: str = "gooddeeds-files"
    MINIO_SECURE: bool = False

    # URL подключения к БД
    @property
    def DATABASE_URL(self) -> str:
        """Формирует URL подключения к PostgreSQL."""
        return f"postgresql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
    
    @property
    def ASYNC_DATABASE_URL(self) -> str:
        """Формирует URL для асинхронного подключения."""
        return f"postgresql+asyncpg://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Создаем глобальный экземпляр настроек
settings = Settings()

