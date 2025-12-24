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
    prefix="/admin_knowledge_base",
    tags=["Администрирование Базы Знаний"],
    dependencies=[Depends(dependencies.get_current_user)],
)

KNOWLEDGE_BASE_FILES_DIR = Path("files/knowledge_base")


def _sanitize_filename(name: str, fallback: str) -> str:
    """Очистка имени файла от недопустимых символов."""
    trimmed = name.strip() if name else ""
    cleaned = re.sub(r"[^\w.\-]", "_", trimmed) or fallback
    return cleaned[:255]


def _build_destination(base_dir: Path, kb_id: int, original_name: Optional[str], fallback: str) -> Path:
    """Формирует полный путь сохранения файла внутри base_dir/kb_id/."""
    unique_prefix = datetime.utcnow().strftime("%Y%m%d%H%M%S%f")
    safe_name = _sanitize_filename(original_name or "", fallback)
    relative = Path(str(kb_id)) / f"{unique_prefix}_{safe_name}"
    destination = base_dir / relative
    destination.parent.mkdir(parents=True, exist_ok=True)
    return destination


class KnowledgeBaseCreate(BaseModel):
    """Тело запроса для создания элемента базы знаний."""

    title: str = Field(..., min_length=3, max_length=255, description="Название элемента базы знаний")
    description: Optional[str] = Field(None, description="Краткое описание")
    content: Optional[str] = Field(None, description="Полное описание")
    video_url: Optional[str] = Field(None, description="URL видео")
    material_url: Optional[str] = Field(None, description="Внешняя ссылка на материал")
    category_knowledge_base_id: Optional[int] = Field(
        None, description="ID категории базы знаний (если известен)"
    )
    category_knowledge_base_name: Optional[str] = Field(
        None, description="Название категории (если нужно создать или найти)"
    )
    type_material_id: Optional[int] = Field(
        None, description="ID типа материала (если известен)"
    )
    type_material_name: Optional[str] = Field(
        None, description="Название типа материала (если нужно создать или найти)"
    )
    files: List[str] = Field(
        default_factory=list,
        description="Список путей к файлам (MaterialKnowledgeBaseData.path)",
    )


class KnowledgeBaseFileDelete(BaseModel):
    """Тело запроса для удаления файла из базы знаний."""

    knowledge_base_id: int = Field(..., description="ID элемента базы знаний")
    file_path: str = Field(..., description="Путь, сохраненный в MaterialKnowledgeBaseData.path")


class KnowledgeBaseUpdate(BaseModel):
    """Модель данных для обновления элемента базы знаний."""

    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    content: Optional[str] = None
    video_url: Optional[str] = None
    material_url: Optional[str] = None
    category_knowledge_base_id: Optional[int] = Field(
        None, description="ID существующей категории базы знаний"
    )
    category_knowledge_base_name: Optional[str] = Field(
        None, description="Название категории (будет создана при отсутствии)"
    )
    type_material_id: Optional[int] = Field(
        None, description="ID существующего типа материала"
    )
    type_material_name: Optional[str] = Field(
        None, description="Название типа материала (будет создан при отсутствии)"
    )
    files: Optional[List[str]] = Field(
        None,
        description="Новый полный список путей к прикреплённым файлам; пустой список очистит файлы",
    )


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    summary="Создание элемента базы знаний",
    response_description="Созданный элемент базы знаний",
)
def create_knowledge_base(
    payload: KnowledgeBaseCreate,
    db: Session = Depends(get_db),
):
    """
    Создает элемент базы знаний вместе со связанными сущностями (категорией, типом материала, файлами).
    Доступ к эндпоинту ограничен авторизованными пользователями через зависимость `get_current_user`.
    """

    # --- Валидация категории ---
    category_id = payload.category_knowledge_base_id
    if not category_id and payload.category_knowledge_base_name:
        category = db_operations.get_or_create_category_knowledge_base(db, payload.category_knowledge_base_name)
        category_id = category.id
    if not category_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Необходимо указать category_knowledge_base_id или category_knowledge_base_name",
        )

    # --- Валидация типа материала ---
    type_material_id = payload.type_material_id
    if not type_material_id and payload.type_material_name:
        type_material = db_operations.get_or_create_type_material(db, payload.type_material_name)
        type_material_id = type_material.id
    if not type_material_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Необходимо указать type_material_id или type_material_name",
        )

    # --- Создание основной записи базы знаний ---
    created_kb = db_operations.create_knowledge_base_data(
        db=db,
        name=payload.title,
        category_knowledge_base_data_id=category_id,
        type_material_category_knowledge_base_data_id=type_material_id,
        description=payload.description,
        full_description=payload.content,
        video_url=payload.video_url,
        material_url=payload.material_url,
    )

    # --- Связанные файлы ---
    for file_path in payload.files:
        db_operations.create_material_knowledge_base_data(
            db, knowledge_base_data_id=created_kb.id, name=Path(file_path).name, path=file_path
        )

    # Возвращаем полное представление элемента базы знаний
    return db_operations.knowledge_base_data_to_dict(created_kb)


@router.post(
    "/upload-file",
    status_code=status.HTTP_201_CREATED,
    summary="Загрузка файла для базы знаний",
    response_description="Информация о сохраненном файле",
)
async def upload_knowledge_base_file(
    knowledge_base_id: int = Form(..., description="ID элемента базы знаний, к которому относится файл"),
    file: UploadFile = File(..., description="Файл, который необходимо сохранить"),
    db: Session = Depends(get_db),
):
    """
    Загружает файл для элемента базы знаний, сохраняет его в MinIO
    и создает запись в таблице `MaterialKnowledgeBaseData`.
    """

    kb = db_operations.get_knowledge_base_data_by_id(db, knowledge_base_id)
    if not kb:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Элемент базы знаний не найден"
        )

    # Формируем путь для сохранения в MinIO (сохраняем тот же формат пути)
    unique_prefix = datetime.utcnow().strftime("%Y%m%d%H%M%S%f")
    safe_name = _sanitize_filename(file.filename or "", "file.bin")
    stored_path = f"files/knowledge_base/{knowledge_base_id}/{unique_prefix}_{safe_name}"

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
    db_operations.create_material_knowledge_base_data(
        db, knowledge_base_data_id=knowledge_base_id, name=file.filename or "file.bin", path=stored_path
    )

    return {
        "status": "created",
        "knowledge_base_id": knowledge_base_id,
        "path": stored_path,
    }


@router.put(
    "/{kb_id}",
    response_model=dict,
    status_code=status.HTTP_200_OK,
    summary="Обновление элемента базы знаний",
)
def update_knowledge_base(
    kb_id: int,
    payload: KnowledgeBaseUpdate,
    db: Session = Depends(get_db),
    current_admin: dict = Depends(dependencies.get_current_admin_or_moderator),
):
    """Обновляет элемент базы знаний и связанные записи (категория, тип материала, файлы)."""
    existing_kb = db_operations.get_knowledge_base_data_by_id(db, kb_id)
    if not existing_kb:
        raise HTTPException(status_code=404, detail="Элемент базы знаний не найден")

    payload_data = payload.model_dump(exclude_unset=True)
    updates = {}

    if "title" in payload_data:
        updates["name"] = payload_data["title"]
    if "description" in payload_data:
        updates["description"] = payload_data["description"]
    if "content" in payload_data:
        updates["full_description"] = payload_data["content"]
    if "video_url" in payload_data:
        updates["video_url"] = payload_data["video_url"]

    if "category_knowledge_base_id" in payload_data:
        updates["category_knowledge_base_data_id"] = payload_data["category_knowledge_base_id"]
    elif "category_knowledge_base_name" in payload_data:
        category = db_operations.get_or_create_category_knowledge_base(db, payload_data["category_knowledge_base_name"])
        updates["category_knowledge_base_data_id"] = category.id

    if "type_material_id" in payload_data:
        updates["type_material_category_knowledge_base_data_id"] = payload_data["type_material_id"]
    elif "type_material_name" in payload_data:
        type_material = db_operations.get_or_create_type_material(db, payload_data["type_material_name"])
        updates["type_material_category_knowledge_base_data_id"] = type_material.id

    if "material_url" in payload_data:
        updates["material_url"] = payload_data["material_url"]

    if updates:
        existing_kb = db_operations.update_knowledge_base_data(db, kb_id, **updates)

    timestamp = datetime.utcnow()

    if "files" in payload_data:
        for material in existing_kb.material_knowledge_base_data:
            if material.date_delete is None:
                material.date_delete = timestamp
        db.commit()
        for path in payload_data["files"]:
            db_operations.create_material_knowledge_base_data(
                db, knowledge_base_data_id=kb_id, name=Path(path).name, path=path
            )

    refreshed_kb = db_operations.get_knowledge_base_data_by_id(db, kb_id)
    return db_operations.knowledge_base_data_to_dict(refreshed_kb)


@router.delete(
    "/{kb_id}",
    status_code=status.HTTP_200_OK,
    summary="Удаление элемента базы знаний",
)
def delete_knowledge_base(
    kb_id: int,
    db: Session = Depends(get_db),
    current_admin: dict = Depends(dependencies.get_current_admin_or_moderator),
):
    """Мягко удаляет элемент базы знаний и связанные объекты (назначает дату удаления)."""
    kb = db_operations.get_knowledge_base_data_by_id(db, kb_id)
    if not kb:
        raise HTTPException(status_code=404, detail="Элемент базы знаний не найден")

    timestamp = datetime.utcnow()
    kb.date_delete = timestamp

    related_collections = [
        kb.material_knowledge_base_data,
        kb.selected_knowledge_base_data,
    ]
    for collection in related_collections:
        for item in collection:
            if item.date_delete is None:
                item.date_delete = timestamp

    db.commit()
    return {"detail": "Элемент базы знаний успешно удален"}


@router.delete(
    "/delete-file",
    status_code=status.HTTP_200_OK,
    summary="Удаление файла из элемента базы знаний",
    response_description="Статус удаления файла",
)
def delete_knowledge_base_file(
    payload: KnowledgeBaseFileDelete,
    db: Session = Depends(get_db),
):
    """
    Удаляет файл, связанный с элементом базы знаний: файл удаляется из файловой системы,
    а запись в `MaterialKnowledgeBaseData` помечается как удаленная.
    """

    kb = db_operations.get_knowledge_base_data_by_id(db, payload.knowledge_base_id)
    if not kb:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Элемент базы знаний не найден"
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

    base_dir = KNOWLEDGE_BASE_FILES_DIR.resolve()
    if base_dir not in destination.parents and destination != base_dir:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Путь должен находиться внутри директории files/knowledge_base/",
        )

    try:
        relative_to_root = destination.relative_to(Path.cwd())
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Путь должен быть относительным к корню проекта",
        ) from exc

    normalized_db_path = str(relative_to_root).replace("\\", "/")

    material_entry = db_operations.get_material_knowledge_base_data_by_path(
        db, knowledge_base_data_id=payload.knowledge_base_id, path=normalized_db_path
    )
    if not material_entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Файл не найден у указанного элемента базы знаний",
        )

    # Удаляем файл из MinIO
    minio_client = get_minio_client()
    try:
        minio_client.delete_file(normalized_db_path)
    except HTTPException:
        # Игнорируем ошибки удаления из MinIO, продолжаем удаление из БД
        pass

    deleted = db_operations.delete_material_knowledge_base_data(
        db, knowledge_base_data_id=payload.knowledge_base_id, path=normalized_db_path
    )
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Не удалось обновить информацию о файле в базе данных",
        )

    return {
        "status": "deleted",
        "knowledge_base_id": payload.knowledge_base_id,
        "path": normalized_db_path,
    }

