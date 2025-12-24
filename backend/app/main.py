from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
import os
from contextlib import asynccontextmanager

from . import auth, users, nko, admin, admin_nko, public, admin_news, favorites, admin_event, admin_knowledge_base
from .generation_logics import generation_router
from .db_session import init_db, SessionLocal
from .db_operations import init_default_roles, init_default_categories


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Инициализация при старте и очистка при завершении."""
    # Startup: инициализация базы данных
    print("🚀 Запуск приложения...")
    try:
        init_db()
        # Инициализируем базовые данные
        db = SessionLocal()
        try:
            init_default_roles(db)
            init_default_categories(db)
        finally:
            db.close()
        print("✓ Приложение готово к работе!")
    except Exception as e:
        print(f"⚠ Ошибка при инициализации БД: {e}")
    
    yield
    
    print("👋 Завершение работы приложения...")


app = FastAPI(title="Volunteer Service API", lifespan=lifespan)

# --- CORS Middleware ---
origins = [
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Подключение роутеров ---
# Авторизация и регистрация
app.include_router(auth.router)

# Пользователи
app.include_router(users.router)

# НКО
app.include_router(nko.router)

# Администрация
app.include_router(admin.router)

# Администрация: НКО
app.include_router(admin_nko.router)

# Администрация: Новости
app.include_router(admin_news.router)

# Администрация: События
app.include_router(admin_event.router)

# Администрация: База знаний
app.include_router(admin_knowledge_base.router)

# Публичные данные
app.include_router(public.router)

# Избранное
app.include_router(favorites.router)

# Генерация контента
app.include_router(generation_router.router)


@app.get("/")
def read_root():
    return {"message": "Welcome to the Volunteer and NKO Service API!"}

