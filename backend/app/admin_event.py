import re
import shutil
from datetime import datetime
from pathlib import Path
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from . import db_operations, dependencies
from .db_session import get_db
from .minio_client import get_minio_client


router = APIRouter(
    prefix="/admin/events",
    tags=["Администрирование Событий"],
)

EVENT_IMAGES_DIR = Path("files/events/images")

ALLOWED_EVENT_ROLES = {"admin", "moderator", "nko"}


def _get_event_manager(current_user: dict = Depends(dependencies.get_current_user)) -> dict:
    """Позволяет доступ только администраторам, модераторам и НКО."""
    if current_user.get("role") not in ALLOWED_EVENT_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав для управления событиями",
        )
    return current_user


def _resolve_organization_id(
    requested_org_id: Optional[int],
    current_user: dict,
) -> int:
    """Определяет ID организации, с которой работает пользователь."""
    user_org_id = current_user.get("organization_id")

    if current_user.get("role") == "nko":
        if not user_org_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Для роли 'nko' необходимо привязать пользователя к организации",
            )
        if requested_org_id and requested_org_id != user_org_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="НКО может управлять только своей организацией",
            )
        return user_org_id

    resolved = requested_org_id or user_org_id
    if not resolved:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="organization_id обязателен",
        )
    return resolved


def _ensure_event_access(event, current_user: dict) -> None:
    """Проверяет, имеет ли пользователь право управлять событием."""
    if current_user.get("role") == "nko":
        if event.organization_id != current_user.get("organization_id"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="НКО может управлять только событиями своей организации",
            )


class EventBase(BaseModel):
    """Базовые поля события."""

    description: Optional[str] = None
    full_description: Optional[str] = None
    event_datetime: Optional[datetime] = Field(
        None, description="Дата и время проведения мероприятия"
    )
    registration_deadline: Optional[datetime] = Field(
        None, description="Крайний срок регистрации"
    )
    address: Optional[str] = None
    type_event_id: Optional[int] = None
    type_event_name: Optional[str] = None
    category_event_id: Optional[int] = None
    category_event_name: Optional[str] = None
    quantity_participant: Optional[int] = Field(
        None, ge=0, description="Максимальное количество участников"
    )
    images: List[str] = Field(
        default_factory=list, description="Список путей к изображениям (PhotoEvent.path)"
    )


class EventCreateRequest(EventBase):
    """Запрос на создание события."""

    title: str = Field(..., min_length=3, max_length=255)
    organization_id: Optional[int] = Field(
        None, description="ID организации, если не задан по умолчанию"
    )


class EventUpdateRequest(EventBase):
    """Запрос на обновление события."""

    title: Optional[str] = Field(None, min_length=1, max_length=255)
    organization_id: Optional[int] = Field(
        None, description="Новый ID организации (только для админов/модераторов)"
    )


def _apply_reference_fields(
    db: Session,
    payload_data: dict,
) -> dict:
    """Преобразует связанные поля (тип, категория) в ID."""
    updates = {}

    if "type_event_id" in payload_data and payload_data["type_event_id"]:
        updates["type_event_id"] = payload_data["type_event_id"]
    elif payload_data.get("type_event_name"):
        type_event = db_operations.get_or_create_type_event(db, payload_data["type_event_name"])
        updates["type_event_id"] = type_event.id

    if "category_event_id" in payload_data and payload_data["category_event_id"]:
        updates["category_event_id"] = payload_data["category_event_id"]
    elif payload_data.get("category_event_name"):
        category = db_operations.get_or_create_category_event(db, payload_data["category_event_name"])
        updates["category_event_id"] = category.id

    return updates


def _get_events_with_status(db: Session, status_name: str) -> List[dict]:
    """Возвращает список событий с заданным статусом."""
    events = db_operations.get_events_by_status(db, status_name)
    return [db_operations.event_to_dict(event) for event in events]


class EventRejectRequest(BaseModel):
    """Запрос на отклонение события."""

    reason: str = Field(..., min_length=3, max_length=1000, description="Причина отклонения")


def _update_event_status(
    db: Session,
    event,
    status_name: str,
    rejection_reason: Optional[str] = None,
) -> dict:
    """Обновляет статус события и возвращает сериализованные данные."""
    status = db_operations.get_or_create_status_event(db, status_name)
    updates = {"status_event_id": status.id}
    if status_name == "Отклонено":
        updates["reason_rejection"] = rejection_reason or ""
    else:
        updates["reason_rejection"] = None

    updated_event = db_operations.update_event(db, event.id, **updates)
    return db_operations.event_to_dict(updated_event)


def _replace_event_images(db: Session, event, new_images: List[str]) -> None:
    """Заменяет список изображений мероприятия."""
    timestamp = datetime.utcnow()
    for photo in event.photo_events:
        if photo.date_delete is None:
            photo.date_delete = timestamp
    db.commit()

    for path in new_images:
        clean_path = path.strip()
        if clean_path:
            db_operations.create_photo_event(db, event_id=event.id, path=clean_path)


def _sanitize_filename(name: str, fallback: str) -> str:
    cleaned = re.sub(r"[^\w.\-]", "_", name.strip() if name else "") or fallback
    return cleaned[:255]


def _build_event_destination(base_dir: Path, event_id: int, original_name: Optional[str], fallback: str) -> Path:
    unique_prefix = datetime.utcnow().strftime("%Y%m%d%H%M%S%f")
    safe_name = _sanitize_filename(original_name or "", fallback)
    destination = base_dir / str(event_id) / f"{unique_prefix}_{safe_name}"
    destination.parent.mkdir(parents=True, exist_ok=True)
    return destination


class EventImageDelete(BaseModel):
    """Запрос на удаление изображения события."""

    event_id: int
    image_path: str


@router.post(
    "",
    response_model=dict,
    status_code=status.HTTP_201_CREATED,
    summary="Создание события",
)
def create_event(
    payload: EventCreateRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(_get_event_manager),
):
    """Создает событие и сохраняет изображения (при наличии)."""
    org_id = _resolve_organization_id(payload.organization_id, current_user)
    payload_data = payload.model_dump(exclude_unset=True)

    updates = _apply_reference_fields(db, payload_data)
    event = db_operations.create_event(
        db,
        name=payload.title,
        organization_id=org_id,
        description=payload.description,
        full_description=payload.full_description,
        date_time_event=payload.event_datetime,
        date_before_register=payload.registration_deadline,
        address=payload.address,
        quantity_participant=payload.quantity_participant,
        **updates,
    )

    if payload.images:
        _replace_event_images(db, event, payload.images)
        event = db_operations.get_event_by_id(db, event.id)

    return db_operations.event_to_dict(event)


@router.put(
    "/{event_id}",
    response_model=dict,
    status_code=status.HTTP_200_OK,
    summary="Изменение события",
)
def update_event(
    event_id: int,
    payload: EventUpdateRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(_get_event_manager),
):
    """Обновляет событие и связанные данные."""
    existing_event = db_operations.get_event_by_id(db, event_id)
    if not existing_event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Событие не найдено")

    _ensure_event_access(existing_event, current_user)
    payload_data = payload.model_dump(exclude_unset=True)

    updates = _apply_reference_fields(db, payload_data)

    if "title" in payload_data:
        updates["name"] = payload_data["title"]
    if "description" in payload_data:
        updates["description"] = payload_data["description"]
    if "full_description" in payload_data:
        updates["full_description"] = payload_data["full_description"]
    if "event_datetime" in payload_data:
        updates["date_time_event"] = payload_data["event_datetime"]
    if "registration_deadline" in payload_data:
        updates["date_before_register"] = payload_data["registration_deadline"]
    if "address" in payload_data:
        updates["address"] = payload_data["address"]
    if "quantity_participant" in payload_data:
        updates["quantity_participant"] = payload_data["quantity_participant"]

    if "organization_id" in payload_data and payload_data["organization_id"] is not None:
        if current_user.get("role") == "nko" and payload_data["organization_id"] != current_user.get("organization_id"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="НКО не может переназначить событие на другую организацию",
            )
        updates["organization_id"] = payload_data["organization_id"]

    if updates:
        existing_event = db_operations.update_event(db, event_id, **updates)

    if "images" in payload_data:
        _replace_event_images(db, existing_event, payload_data["images"])
        existing_event = db_operations.get_event_by_id(db, event_id)

    return db_operations.event_to_dict(existing_event)


@router.get(
    "/status/rejected",
    response_model=List[dict],
    status_code=status.HTTP_200_OK,
    summary="Список отклоненных событий",
)
def list_rejected_events(
    db: Session = Depends(get_db),
    current_user: dict = Depends(_get_event_manager),
):
    """Возвращает все события со статусом 'Отклонено'."""
    _ = current_user  # Используется только для проверки прав
    return _get_events_with_status(db, "Отклонено")


@router.get(
    "/status/pending",
    response_model=List[dict],
    status_code=status.HTTP_200_OK,
    summary="Список событий на модерации",
)
def list_pending_events(
    db: Session = Depends(get_db),
    current_user: dict = Depends(_get_event_manager),
):
    """Возвращает все события со статусом 'На модерации'."""
    _ = current_user
    return _get_events_with_status(db, "На модерации")


@router.post(
    "/{event_id}/approve",
    response_model=dict,
    status_code=status.HTTP_200_OK,
    summary="Одобрение события",
)
def approve_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(_get_event_manager),
):
    """Переводит событие в статус 'Одобрено'."""
    event = db_operations.get_event_by_id(db, event_id)
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Событие не найдено")

    _ensure_event_access(event, current_user)
    return _update_event_status(db, event, "Одобрено")


@router.post(
    "/{event_id}/reject",
    response_model=dict,
    status_code=status.HTTP_200_OK,
    summary="Отклонение события",
)
def reject_event(
    event_id: int,
    payload: EventRejectRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(_get_event_manager),
):
    """Переводит событие в статус 'Отклонено'."""
    event = db_operations.get_event_by_id(db, event_id)
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Событие не найдено")

    _ensure_event_access(event, current_user)
    return _update_event_status(db, event, "Отклонено", rejection_reason=payload.reason)


@router.post(
    "/upload-image",
    status_code=status.HTTP_201_CREATED,
    summary="Загрузка изображения события",
)
async def upload_event_image(
    event_id: int = Form(..., description="ID события"),
    image: UploadFile = File(..., description="Файл изображения"),
    db: Session = Depends(get_db),
    current_user: dict = Depends(_get_event_manager),
):
    """Загружает изображение события и сохраняет запись в БД."""
    event = db_operations.get_event_by_id(db, event_id)
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Событие не найдено")

    _ensure_event_access(event, current_user)

    # Формируем путь для сохранения в MinIO (сохраняем тот же формат пути)
    unique_prefix = datetime.utcnow().strftime("%Y%m%d%H%M%S%f")
    safe_name = _sanitize_filename(image.filename or "", "image.jpg")
    stored_path = f"files/events/images/{event_id}/{unique_prefix}_{safe_name}"

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
    db_operations.create_photo_event(db, event_id=event_id, path=stored_path)

    return {"status": "created", "event_id": event_id, "path": stored_path}


@router.delete(
    "/{event_id}",
    status_code=status.HTTP_200_OK,
    summary="Удаление события",
)
def delete_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(_get_event_manager),
):
    """Мягко удаляет событие и связанные изображения."""
    event = db_operations.get_event_by_id(db, event_id)
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Событие не найдено")

    _ensure_event_access(event, current_user)

    timestamp = datetime.utcnow()
    event.date_delete = timestamp
    for photo in event.photo_events:
        if photo.date_delete is None:
            photo.date_delete = timestamp
    db.commit()

    return {"detail": "Событие успешно удалено"}


@router.delete(
    "/delete-image",
    status_code=status.HTTP_200_OK,
    summary="Удаление изображения события",
)
def delete_event_image(
    payload: EventImageDelete,
    db: Session = Depends(get_db),
    current_user: dict = Depends(_get_event_manager),
):
    """Удаляет изображение события из файловой системы и помечает запись в БД."""
    event = db_operations.get_event_by_id(db, payload.event_id)
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Событие не найдено")

    _ensure_event_access(event, current_user)

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

    destination = path_candidate.resolve() if path_candidate.is_absolute() else (Path.cwd() / path_candidate).resolve()

    base_dir = EVENT_IMAGES_DIR.resolve()
    if base_dir not in destination.parents and destination != base_dir:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Путь должен находиться внутри директории files/events/images/",
        )

    try:
        relative_to_root = destination.relative_to(Path.cwd())
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Путь должен быть относительным к корню проекта",
        ) from exc

    normalized_db_path = str(relative_to_root).replace("\\", "/")

    photo_entry = db_operations.get_photo_event_by_path(
        db, event_id=payload.event_id, path=normalized_db_path
    )
    if not photo_entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Изображение не найдено у указанного события",
        )

    # Удаляем файл из MinIO
    minio_client = get_minio_client()
    try:
        minio_client.delete_file(normalized_db_path)
    except HTTPException:
        # Игнорируем ошибки удаления из MinIO, продолжаем удаление из БД
        pass

    deleted = db_operations.delete_photo_event(db, event_id=payload.event_id, path=normalized_db_path)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Не удалось обновить информацию об изображении в базе данных",
        )

    return {"status": "deleted", "event_id": payload.event_id, "path": normalized_db_path}


@router.get(
    "/organization/{organization_id}",
    response_model=List[dict],
    status_code=status.HTTP_200_OK,
    summary="Получение всех событий организации",
)
def get_events_by_organization(
    organization_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(_get_event_manager),
):
    """Возвращает список событий конкретной организации."""
    if current_user.get("role") == "nko" and organization_id != current_user.get("organization_id"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="НКО может просматривать только свою организацию",
        )

    events = db_operations.get_events_by_organization(db, organization_id)
    return [db_operations.event_to_dict(event) for event in events]
