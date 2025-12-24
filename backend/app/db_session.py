"""
Управление сессиями SQLAlchemy и подключением к базе данных.
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator

from .config import settings
from .db_models import Base

# Создаем движок базы данных
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,  # Проверка соединения перед использованием
    echo=False,  # Установите True для отладки SQL запросов
)

# Создаем фабрику сессий
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db():
    """
    Инициализация базы данных - создание всех таблиц.
    Вызывается при старте приложения.
    """
    Base.metadata.create_all(bind=engine)
    print("✓ База данных инициализирована")


def get_db() -> Generator[Session, None, None]:
    """
    Dependency для получения сессии БД в FastAPI endpoints.
    
    Использование:
        @app.get("/items/")
        def read_items(db: Session = Depends(get_db)):
            ...
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

