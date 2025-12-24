import re
from datetime import datetime
from pathlib import Path
import shutil
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from . import db_operations, dependencies
from .db_session import get_db
from .minio_client import get_minio_client


router = APIRouter(
    prefix="/admin_news",
    tags=["Администрирование Новостей"],
    dependencies=[Depends(dependencies.get_current_user)],
)

NEWS_FILES_DIR = Path("files/news")
NEWS_IMAGES_DIR = NEWS_FILES_DIR / "images"


def _sanitize_filename(name: str, fallback: str) -> str:
    """Очистка имени файла от недопустимых символов."""
    trimmed = name.strip() if name else ""
    cleaned = re.sub(r"[^\w.\-]", "_", trimmed) or fallback
    return cleaned[:255]


def _build_destination(base_dir: Path, news_id: int, original_name: Optional[str], fallback: str) -> Path:
    """Формирует полный путь сохранения файла внутри base_dir/news_id/."""
    unique_prefix = datetime.utcnow().strftime("%Y%m%d%H%M%S%f")
    safe_name = _sanitize_filename(original_name or "", fallback)
    relative = Path(str(news_id)) / f"{unique_prefix}_{safe_name}"
    destination = base_dir / relative
    destination.parent.mkdir(parents=True, exist_ok=True)
    return destination


class NewsCreate(BaseModel):
    """Тело запроса для создания новости."""

    title: str = Field(..., min_length=3, max_length=255, description="Заголовок новости")
    short_description: Optional[str] = Field(None, description="Краткое описание")
    content: Optional[str] = Field(None, description="Полное описание")
    date_event: Optional[datetime] = Field(
        None, description="Дата события/публикации в формате ISO 8601"
    )
    category_news_id: Optional[int] = Field(
        None, description="ID категории новости (если известен)"
    )
    category_news_name: Optional[str] = Field(
        None, description="Название категории (если нужно создать или найти)"
    )
    city_id: Optional[int] = Field(None, description="ID города (если известен)")
    city_name: Optional[str] = Field(
        None, description="Название города (если нужно создать или найти)"
    )
    hashtags: List[str] = Field(default_factory=list, description="Список хештегов")
    images: List[str] = Field(
        default_factory=list,
        description="Список путей к изображениям (PhotoNews.path)",
    )
    files: List[str] = Field(
        default_factory=list,
        description="Список путей к файлам (FileNews.path)",
    )


class NewsFileDelete(BaseModel):
    """Тело запроса для удаления файла новости."""

    news_id: int = Field(..., description="ID новости")
    file_path: str = Field(..., description="Путь, сохраненный в FileNews.path")


class NewsImageDelete(BaseModel):
    """Тело запроса для удаления изображения новости."""

    news_id: int = Field(..., description="ID новости")
    image_path: str = Field(..., description="Путь, сохраненный в PhotoNews.path")

class NewsUpdate(BaseModel):
    """Модель данных для обновления новости со всеми связями."""

    title: Optional[str] = Field(None, min_length=1, max_length=255)
    short_description: Optional[str] = None
    full_description: Optional[str] = None
    date_event: Optional[datetime] = None
    category_news_id: Optional[int] = Field(
        None, description="ID существующей категории новостей"
    )
    category_news_name: Optional[str] = Field(
        None, description="Название категории (будет создана при отсутствии)"
    )
    city_id: Optional[int] = Field(None, description="ID города")
    city_name: Optional[str] = Field(
        None, description="Название города для создания/поиска"
    )
    hashtags: Optional[List[str]] = Field(
        None,
        description="Новый полный список хештегов; если передан пустой список, хештеги будут очищены",
    )
    images: Optional[List[str]] = Field(
        None,
        description="Новый полный список путей к изображениям; пустой список очистит изображения",
    )
    files: Optional[List[str]] = Field(
        None,
        description="Новый полный список путей к прикреплённым файлам; пустой список очистит файлы",
    )


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    summary="Создание новости",
    response_description="Созданная новость",
)
def create_news(
    payload: NewsCreate,
    db: Session = Depends(get_db),
):
    """
    Создает новость вместе со связанными сущностями (категорией, городом, тегами, файлами и изображениями).
    Доступ к эндпоинту ограничен авторизованными пользователями через зависимость `get_current_user`.
    """

    # --- Валидация категории ---
    category_id = payload.category_news_id
    if not category_id and payload.category_news_name:
        category = db_operations.get_or_create_category_news(db, payload.category_news_name)
        category_id = category.id
    if not category_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Необходимо указать category_news_id или category_news_name",
        )

    # --- Валидация города ---
    city_id = payload.city_id
    if not city_id and payload.city_name:
        city = db_operations.get_or_create_city(db, payload.city_name)
        city_id = city.id

    # --- Создание основной записи новости ---
    created_news = db_operations.create_news(
        db=db,
        name=payload.title,
        category_news_id=category_id,
        city_id=city_id,
        description=payload.short_description,
        full_description=payload.content,
        date_event=payload.date_event,
    )

    # --- Связанные изображения ---
    for image_path in payload.images:
        db_operations.create_photo_news(db, news_id=created_news.id, path=image_path)

    # --- Связанные файлы ---
    for file_path in payload.files:
        db_operations.create_file_news(db, news_id=created_news.id, path=file_path)

    # --- Хештеги ---
    for tag in payload.hashtags:
        clean_tag = tag.strip()
        if clean_tag:
            db_operations.create_hashtag_news(db, news_id=created_news.id, name=clean_tag)

    # Возвращаем полное представление новости
    return db_operations.news_to_dict(created_news)


@router.post(
    "/upload-file",
    status_code=status.HTTP_201_CREATED,
    summary="Загрузка файла для новости",
    response_description="Информация о сохраненном файле",
)
async def upload_news_file(
    news_id: int = Form(..., description="ID новости, к которой относится файл"),
    file: UploadFile = File(..., description="Файл, который необходимо сохранить"),
    db: Session = Depends(get_db),
):
    """
    Загружает файл для новости, сохраняет его в MinIO
    и создает запись в таблице `FileNews`.
    """

    news = db_operations.get_news_by_id(db, news_id)
    if not news:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Новость не найдена"
        )

    # Формируем путь для сохранения в MinIO (сохраняем тот же формат пути)
    unique_prefix = datetime.utcnow().strftime("%Y%m%d%H%M%S%f")
    safe_name = _sanitize_filename(file.filename or "", "file.bin")
    stored_path = f"files/news/{news_id}/{unique_prefix}_{safe_name}"

    # Читаем содержимое файла
    try:
        file_data = await file.read()
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Не удалось прочитать файл: {exc}",
        ) from exc

    # Определяем content-type
    content_type = file.content_type or "application/octet-stream"

    # Сохраняем файл в MinIO
    minio_client = get_minio_client()
    try:
        minio_client.put_file(stored_path, file_data, content_type=content_type)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Не удалось сохранить файл в MinIO: {exc}",
        ) from exc

    # Создаем запись в БД
    db_operations.create_file_news(db, news_id=news_id, path=stored_path)

    return {
        "status": "created",
        "news_id": news_id,
        "path": stored_path,
    }


@router.post(
    "/upload-image",
    status_code=status.HTTP_201_CREATED,
    summary="Загрузка изображения для новости",
    response_description="Информация о сохраненном изображении",
)
async def upload_news_image(
    news_id: int = Form(..., description="ID новости, к которой относится изображение"),
    image: UploadFile = File(..., description="Изображение, которое необходимо сохранить"),
    db: Session = Depends(get_db),
):
    """
    Загружает изображение для новости, сохраняет его в MinIO
    и создает запись в таблице `PhotoNews`.
    """

    news = db_operations.get_news_by_id(db, news_id)
    if not news:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Новость не найдена"
        )

    # Формируем путь для сохранения в MinIO (сохраняем тот же формат пути)
    unique_prefix = datetime.utcnow().strftime("%Y%m%d%H%M%S%f")
    safe_name = _sanitize_filename(image.filename or "", "image.jpg")
    stored_path = f"files/news/images/{news_id}/{unique_prefix}_{safe_name}"

    # Читаем содержимое файла
    try:
        file_data = await image.read()
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Не удалось прочитать изображение: {exc}",
        ) from exc

    # Определяем content-type
    content_type = image.content_type or "image/jpeg"

    # Сохраняем файл в MinIO
    minio_client = get_minio_client()
    try:
        minio_client.put_file(stored_path, file_data, content_type=content_type)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Не удалось сохранить изображение в MinIO: {exc}",
        ) from exc

    # Создаем запись в БД
    db_operations.create_photo_news(db, news_id=news_id, path=stored_path)

    return {
        "status": "created",
        "news_id": news_id,
        "path": stored_path,
    }


@router.put(
    "/{news_id}",
    response_model=dict,
    status_code=status.HTTP_200_OK,
    summary="Обновление новости",
)
def update_news(
    news_id: int,
    payload: NewsUpdate,
    db: Session = Depends(get_db),
    current_admin: dict = Depends(dependencies.get_current_admin_or_moderator),
):
    """Обновляет новость и связанные записи (категория, город, файлы, изображения, хештеги)."""
    existing_news = db_operations.get_news_by_id(db, news_id)
    if not existing_news:
        raise HTTPException(status_code=404, detail="Новость не найдена")

    payload_data = payload.model_dump(exclude_unset=True)
    updates = {}

    if "title" in payload_data:
        updates["name"] = payload_data["title"]
    if "short_description" in payload_data:
        updates["description"] = payload_data["short_description"]
    if "full_description" in payload_data:
        updates["full_description"] = payload_data["full_description"]
    if "date_event" in payload_data:
        updates["date_event"] = payload_data["date_event"]

    if "category_news_id" in payload_data:
        updates["category_news_id"] = payload_data["category_news_id"]
    elif "category_news_name" in payload_data:
        category = db_operations.get_or_create_category_news(db, payload_data["category_news_name"])
        updates["category_news_id"] = category.id

    if "city_id" in payload_data:
        updates["city_id"] = payload_data["city_id"]
    elif "city_name" in payload_data:
        city = db_operations.get_or_create_city(db, payload_data["city_name"])
        updates["city_id"] = city.id

    if updates:
        existing_news = db_operations.update_news(db, news_id, **updates)

    timestamp = datetime.utcnow()

    if "images" in payload_data:
        for photo in existing_news.photo_news:
            if photo.date_delete is None:
                photo.date_delete = timestamp
        db.commit()
        for path in payload_data["images"]:
            db_operations.create_photo_news(db, news_id=news_id, path=path)

    if "files" in payload_data:
        for file_item in existing_news.file_news:
            if file_item.date_delete is None:
                file_item.date_delete = timestamp
        db.commit()
        for path in payload_data["files"]:
            db_operations.create_file_news(db, news_id=news_id, path=path)

    if "hashtags" in payload_data:
        for hashtag in existing_news.hashtags_news:
            if hashtag.date_delete is None:
                hashtag.date_delete = timestamp
        db.commit()
        for tag in payload_data["hashtags"]:
            clean_tag = tag.strip()
            if clean_tag:
                db_operations.create_hashtag_news(db, news_id=news_id, name=clean_tag)

    refreshed_news = db_operations.get_news_by_id(db, news_id)
    return db_operations.news_to_dict(refreshed_news)


@router.delete(
    "/{news_id}",
    status_code=status.HTTP_200_OK,
    summary="Удаление новости",
)
def delete_news(
    news_id: int,
    db: Session = Depends(get_db),
    current_admin: dict = Depends(dependencies.get_current_admin_or_moderator),
):
    """Мягко удаляет новость и связанные объекты (назначает дату удаления)."""
    news = db_operations.get_news_by_id(db, news_id)
    if not news:
        raise HTTPException(status_code=404, detail="Новость не найдена")

    timestamp = datetime.utcnow()
    news.date_delete = timestamp

    related_collections = [
        news.photo_news,
        news.file_news,
        news.hashtags_news,
        news.selected_news,
    ]
    for collection in related_collections:
        for item in collection:
            if item.date_delete is None:
                item.date_delete = timestamp

    db.commit()
    return {"detail": "Новость успешно удалена"}


@router.delete(
    "/delete-file",
    status_code=status.HTTP_200_OK,
    summary="Удаление файла из новости",
    response_description="Статус удаления файла",
)
def delete_news_file(
    payload: NewsFileDelete,
    db: Session = Depends(get_db),
):
    """
    Удаляет файл, связанный с новостью: файл удаляется из файловой системы,
    а запись в `FileNews` помечается как удаленная.
    """

    news = db_operations.get_news_by_id(db, payload.news_id)
    if not news:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Новость не найдена"
        )

    sanitized_path = payload.file_path.strip()
    if not sanitized_path:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Путь до файла не может быть пустым",
        )

    path_candidate = Path(sanitized_path)
    if ".." in path_candidate.parts:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Путь не должен содержать '..'",
        )

    if path_candidate.is_absolute():
        destination = path_candidate.resolve()
    else:
        destination = (Path.cwd() / path_candidate).resolve()

    base_dir = NEWS_FILES_DIR.resolve()
    if base_dir not in destination.parents and destination != base_dir:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Путь должен находиться внутри директории files/news/",
        )

    try:
        relative_to_root = destination.relative_to(Path.cwd())
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Путь должен быть относительным к корню проекта",
        ) from exc

    normalized_db_path = str(relative_to_root).replace("\\", "/")

    file_entry = db_operations.get_file_news_by_path(
        db, news_id=payload.news_id, path=normalized_db_path
    )
    if not file_entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Файл не найден у указанной новости",
        )

    # Удаляем файл из MinIO
    minio_client = get_minio_client()
    try:
        minio_client.delete_file(normalized_db_path)
    except HTTPException:
        # Игнорируем ошибки удаления из MinIO, продолжаем удаление из БД
        pass

    deleted = db_operations.delete_file_news(
        db, news_id=payload.news_id, path=normalized_db_path
    )
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Не удалось обновить информацию о файле в базе данных",
        )

    return {
        "status": "deleted",
        "news_id": payload.news_id,
        "path": normalized_db_path,
    }


@router.delete(
    "/delete-image",
    status_code=status.HTTP_200_OK,
    summary="Удаление изображения из новости",
    response_description="Статус удаления изображения",
)
def delete_news_image(
    payload: NewsImageDelete,
    db: Session = Depends(get_db),
):
    """
    Удаляет изображение, связанное с новостью: файл удаляется из файловой системы,
    а запись в `PhotoNews` помечается как удаленная.
    """

    news = db_operations.get_news_by_id(db, payload.news_id)
    if not news:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Новость не найдена"
        )

    sanitized_path = payload.image_path.strip()
    if not sanitized_path:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Путь до изображения не может быть пустым",
        )

    path_candidate = Path(sanitized_path)
    if ".." in path_candidate.parts:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Путь не должен содержать '..'",
        )

    if path_candidate.is_absolute():
        destination = path_candidate.resolve()
    else:
        destination = (Path.cwd() / path_candidate).resolve()

    base_dir = NEWS_IMAGES_DIR.resolve()
    if base_dir not in destination.parents and destination != base_dir:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Путь должен находиться внутри директории files/news/images/",
        )

    try:
        relative_to_root = destination.relative_to(Path.cwd())
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Путь должен быть относительным к корню проекта",
        ) from exc

    normalized_db_path = str(relative_to_root).replace("\\", "/")

    photo_entry = db_operations.get_photo_news_by_path(
        db, news_id=payload.news_id, path=normalized_db_path
    )
    if not photo_entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Изображение не найдено у указанной новости",
        )

    # Удаляем файл из MinIO
    minio_client = get_minio_client()
    try:
        minio_client.delete_file(normalized_db_path)
    except HTTPException:
        # Игнорируем ошибки удаления из MinIO, продолжаем удаление из БД
        pass

    deleted = db_operations.delete_photo_news(
        db, news_id=payload.news_id, path=normalized_db_path
    )
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Не удалось обновить информацию об изображении в базе данных",
        )

    return {
        "status": "deleted",
        "news_id": payload.news_id,
        "path": normalized_db_path,
    }
