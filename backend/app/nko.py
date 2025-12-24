from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, status
from typing import Optional, List
from sqlalchemy.orm import Session
import uuid

from . import models, dependencies, db_operations
from .db_session import get_db
from .minio_client import get_minio_client

router = APIRouter(
    prefix="/nko",
    tags=["Некоммерческие организации"],
)


@router.get("/profile/me", response_model=models.NkoProfile)
def get_my_nko_profile(
    current_user: dict = Depends(dependencies.get_current_active_nko),
    db: Session = Depends(get_db)
):
    """Получить профиль НКО текущего пользователя."""
    # Проверяем, что у пользователя есть привязка к организации
    if not current_user.get("organization_id"):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found for this user"
        )
    
    # Получаем организацию
    organization = db_operations.get_organization_by_id(db, current_user["organization_id"])
    if not organization:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found"
        )
    
    # Преобразуем в формат NkoProfile
    org_dict = db_operations.organization_to_dict(organization)
    
    # Маппим статус модерации
    moderation_status_map = {
        "Не подана": "not_submitted",
        "На модерации": "pending",
        "Одобрена": "approved",
        "Отклонена": "rejected"
    }
    moderation_status = moderation_status_map.get(org_dict.get("moderation_status", "Не подана"), "not_submitted")
    
    # TODO: Получить социальные сети из таблицы social_media_organization
    # Пока возвращаем пустой список
    social_links = []
    
    # Формируем ответ согласно модели NkoProfile
    return {
        "organization_name": org_dict.get("organization_name", ""),
        "email": org_dict.get("email", ""),
        "city_name": org_dict.get("city_name", "Не указан"),
        "category": org_dict.get("category", ""),
        "description": org_dict.get("description", ""),
        "address": org_dict.get("address", ""),
        "website_url": org_dict.get("website_url", ""),
        "phone": org_dict.get("phone"),  # Из organization_to_dict
        "founded_year": org_dict.get("founded_year"),  # Из organization_to_dict
        "social_links": social_links,
        "is_moderated": org_dict.get("is_moderated", False),
        "logo_url": org_dict.get("logo_url"),
        "moderation_status": moderation_status,
        "rejection_reason": org_dict.get("reason_rejection")
    }


@router.put("/profile/me", response_model=models.NkoProfile)
def update_my_nko_profile(
    profile_data: models.NkoProfileUpdate,
    current_user: dict = Depends(dependencies.get_current_active_nko),
    db: Session = Depends(get_db)
):
    """
    Обновить профиль НКО.
    При изменении данных статус модерации сбрасывается на 'Не подана',
    если профиль еще не был одобрен. Если был одобрен, статус меняется на 'На модерации'.
    """
    # Проверяем, что у пользователя есть привязка к организации
    if not current_user.get("organization_id"):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found for this user"
        )
    
    # Получаем организацию
    organization = db_operations.get_organization_by_id(db, current_user["organization_id"])
    if not organization:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found"
        )
    
    # Подготавливаем данные для обновления
    update_data = {}
    
    # Обновляем категорию, если указана
    if profile_data.category:
        category = db_operations.get_or_create_category(db, profile_data.category)
        update_data["id_category"] = category.id
    
    # Обновляем остальные поля
    if profile_data.description is not None:
        update_data["description"] = profile_data.description
    
    if profile_data.address is not None:
        update_data["address"] = profile_data.address
    
    if profile_data.website_url is not None:
        update_data["website"] = profile_data.website_url  # В БД поле называется website
    
    if profile_data.phone is not None:
        update_data["phone"] = profile_data.phone
    
    if profile_data.founded_year is not None:
        update_data["founded_year"] = profile_data.founded_year
    
    # TODO: Обновление social_links через таблицу social_media_organization
    # Пока пропускаем
    
    # Определяем новый статус модерации
    # При обновлении профиля статус меняется только если был одобрен
    current_status = organization.status_organization.name if organization.status_organization else "Не подана"
    
    if current_status == "Одобрена":
        # Если был одобрен, при изменении ставим "На модерации"
        status_pending = db_operations.get_or_create_status_organization(db, "На модерации")
        update_data["status_organization_id"] = status_pending.id
        update_data["reason_rejection"] = None  # Сбрасываем причину отклонения
    elif current_status == "Отклонена":
        # Если был отклонен, при изменении ставим "Не подана" (чтобы можно было подать заново)
        status_not_submitted = db_operations.get_or_create_status_organization(db, "Не подана")
        update_data["status_organization_id"] = status_not_submitted.id
        update_data["reason_rejection"] = None  # Сбрасываем причину отклонения
    # Если статус "Не подана" или "На модерации", оставляем как есть
    
    # Обновляем организацию
    updated_org = db_operations.update_organization(db, organization.id, **update_data)
    if not updated_org:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update organization"
        )
    
    # Возвращаем обновленный профиль
    org_dict = db_operations.organization_to_dict(updated_org)
    
    # Маппим статус модерации
    moderation_status_map = {
        "Не подана": "not_submitted",
        "На модерации": "pending",
        "Одобрена": "approved",
        "Отклонена": "rejected"
    }
    moderation_status = moderation_status_map.get(org_dict.get("moderation_status", "Не подана"), "not_submitted")
    
    # TODO: Получить социальные сети
    social_links = []
    
    # Формируем ответ согласно модели NkoProfile
    return {
        "organization_name": org_dict.get("organization_name", ""),
        "email": org_dict.get("email", ""),
        "city_name": org_dict.get("city_name", "Не указан"),
        "category": org_dict.get("category", ""),
        "description": org_dict.get("description", ""),
        "address": org_dict.get("address", ""),
        "website_url": org_dict.get("website_url", ""),
        "phone": org_dict.get("phone"),  # Из organization_to_dict
        "founded_year": org_dict.get("founded_year"),  # Из organization_to_dict
        "social_links": social_links,
        "is_moderated": org_dict.get("is_moderated", False),
        "logo_url": org_dict.get("logo_url"),
        "moderation_status": moderation_status,
        "rejection_reason": org_dict.get("reason_rejection")
    }


@router.post("/profile/me/submit-moderation", response_model=models.NkoProfile)
def submit_nko_for_moderation(
    current_user: dict = Depends(dependencies.get_current_active_nko),
    db: Session = Depends(get_db)
):
    """Подать заявку на модерацию профиля НКО."""
    # Проверяем, что у пользователя есть привязка к организации
    if not current_user.get("organization_id"):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found for this user"
        )
    
    # Получаем организацию
    organization = db_operations.get_organization_by_id(db, current_user["organization_id"])
    if not organization:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found"
        )
    
    # Проверяем текущий статус
    current_status = organization.status_organization.name if organization.status_organization else "Не подана"
    
    # Нельзя подать на модерацию, если она уже в процессе
    if current_status == "На модерации":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Application is already pending review"
        )
    
    # Нельзя подать на модерацию, если уже одобрена (но можно обновить и подать заново)
    if current_status == "Одобрена":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Organization is already approved. Update profile to resubmit."
        )
    
    # Меняем статус на "На модерации"
    status_pending = db_operations.get_or_create_status_organization(db, "На модерации")
    updated_org = db_operations.update_organization(
        db,
        organization.id,
        status_organization_id=status_pending.id,
        reason_rejection=None  # Сбрасываем причину отклонения
    )
    
    if not updated_org:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update organization status"
        )
    
    # Возвращаем обновленный профиль
    org_dict = db_operations.organization_to_dict(updated_org)
    
    # Маппим статус модерации
    moderation_status_map = {
        "Не подана": "not_submitted",
        "На модерации": "pending",
        "Одобрена": "approved",
        "Отклонена": "rejected"
    }
    moderation_status = moderation_status_map.get(org_dict.get("moderation_status", "Не подана"), "not_submitted")
    
    # TODO: Получить социальные сети
    social_links = []
    
    # Формируем ответ согласно модели NkoProfile
    return {
        "organization_name": org_dict.get("organization_name", ""),
        "email": org_dict.get("email", ""),
        "city_name": org_dict.get("city_name", "Не указан"),
        "category": org_dict.get("category", ""),
        "description": org_dict.get("description", ""),
        "address": org_dict.get("address", ""),
        "website_url": org_dict.get("website_url", ""),
        "phone": org_dict.get("phone"),  # Из organization_to_dict
        "founded_year": org_dict.get("founded_year"),  # Из organization_to_dict
        "social_links": social_links,
        "is_moderated": org_dict.get("is_moderated", False),
        "logo_url": org_dict.get("logo_url"),
        "moderation_status": moderation_status,
        "rejection_reason": org_dict.get("reason_rejection")
    }


@router.get("/events/{organization_id}", response_model=List[dict])
def get_organization_events(
    organization_id: int,
    current_user: dict = Depends(dependencies.get_current_active_nko),
    db: Session = Depends(get_db)
):
    """Получить все события организации по её ID."""
    # Проверяем, что у пользователя есть привязка к организации
    if not current_user.get("organization_id"):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found for this user"
        )
    
    # НКО может просматривать только события своей организации
    if organization_id != current_user.get("organization_id"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view events of your own organization"
        )
    
    # Проверяем, что организация существует
    organization = db_operations.get_organization_by_id(db, organization_id)
    if not organization:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found"
        )
    
    # Получаем события организации
    events = db_operations.get_events_by_organization(db, organization_id)
    
    # Преобразуем в словари
    return [db_operations.event_to_dict(event) for event in events]


@router.post("/profile/me/logo", status_code=status.HTTP_200_OK)
def upload_nko_logo(
    current_user: dict = Depends(dependencies.get_current_active_nko),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Загрузить логотип для НКО."""
    # Проверяем, что у пользователя есть привязка к организации
    if not current_user.get("organization_id"):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found for this user"
        )
    
    # Получаем организацию
    organization = db_operations.get_organization_by_id(db, current_user["organization_id"])
    if not organization:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found"
        )
    
    # Проверяем тип файла
    if not file.content_type or not file.content_type.startswith('image/'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be an image"
        )
    
    # Генерируем уникальное имя файла
    file_extension = file.filename.split(".")[-1] if file.filename and "." in file.filename else "jpg"
    unique_filename = f"{uuid.uuid4()}.{file_extension}"
    file_location = f"static/logos/{unique_filename}"
    
    # Читаем содержимое файла
    file_data = file.file.read()
    
    # Определяем content-type
    content_type = file.content_type or f"image/{file_extension}"
    
    # Сохраняем файл в MinIO
    minio_client = get_minio_client()
    try:
        minio_client.put_file(file_location, file_data, content_type=content_type)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Не удалось сохранить логотип: {exc}"
        )
    
    # Обновляем путь к логотипу в БД
    updated_org = db_operations.update_organization(
        db,
        organization.id,
        path_to_logo=file_location
    )
    
    if not updated_org:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update organization logo"
        )
    
    return {
        "success": True,
        "message": "Logo uploaded successfully",
        "logo_url": file_location
    }
