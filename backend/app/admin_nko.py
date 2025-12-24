from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from . import db_operations, dependencies
from .db_session import get_db

router = APIRouter(
    prefix="/admin/nko",
    tags=["Администрирование НКО"],
    dependencies=[Depends(dependencies.get_current_admin_or_moderator)],
)


@router.get(
    "/pending",
    response_model=List[dict],
    summary="Получить список НКО со статусом 'На модерации'",
)
def get_pending_nkos(
    db: Session = Depends(get_db),
):
    """
    Возвращает все организации, у которых статус модерации установлен в 'На модерации'.
    Доступно только администраторам и модераторам.
    """
    status = db_operations.get_status_organization_by_name(db, "На модерации")
    if not status:
        return []

    organizations = db_operations.get_all_organizations(db, status_id=status.id)
    return [db_operations.organization_to_dict(org) for org in organizations]


@router.get(
    "/rejected",
    response_model=List[dict],
    summary="Получить список НКО со статусом 'Отклонена'",
)
def get_rejected_nkos(
    db: Session = Depends(get_db),
):
    """
    Возвращает все организации, у которых статус модерации установлен в 'Отклонена'.
    Доступно только администраторам и модераторам.
    """
    status = db_operations.get_status_organization_by_name(db, "Отклонена")
    if not status:
        return []

    organizations = db_operations.get_all_organizations(db, status_id=status.id)
    return [db_operations.organization_to_dict(org) for org in organizations]


class RejectOrganizationRequest(BaseModel):
    """Запрос для отклонения организации."""

    reason: Optional[str] = Field(
        None,
        description="Причина отклонения, отображается пользователю",
        max_length=2000,
    )


def _update_org_status(
    db: Session,
    organization_id: int,
    status_name: str,
    rejection_reason: Optional[str] = None,
):
    org = db_operations.get_organization_by_id(db, organization_id)
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Организация не найдена",
        )

    status_obj = db_operations.get_or_create_status_organization(db, status_name)
    updated_org = db_operations.update_organization(
        db,
        organization_id,
        status_organization_id=status_obj.id,
        reason_rejection=rejection_reason,
    )
    return db_operations.organization_to_dict(updated_org)


@router.post(
    "/{organization_id}/approve",
    response_model=dict,
    status_code=status.HTTP_200_OK,
    summary="Одобрить организацию",
)
def approve_organization(
    organization_id: int,
    db: Session = Depends(get_db),
):
    """
    Устанавливает статус организации в 'Одобрена' и очищает причину отклонения.
    """
    return _update_org_status(db, organization_id, "Одобрена", rejection_reason=None)


@router.post(
    "/{organization_id}/reject",
    response_model=dict,
    status_code=status.HTTP_200_OK,
    summary="Отклонить организацию",
)
def reject_organization(
    organization_id: int,
    payload: RejectOrganizationRequest,
    db: Session = Depends(get_db),
):
    """
    Устанавливает статус организации в 'Отклонена' и фиксирует причину отклонения.
    """
    reason = (payload.reason or "").strip() or None
    return _update_org_status(db, organization_id, "Отклонена", rejection_reason=reason)


class OrganizationUpdateRequest(BaseModel):
    """Запрос на обновление информации об организации."""

    name: Optional[str] = None
    short_name: Optional[str] = None
    description: Optional[str] = None
    full_description: Optional[str] = None
    volunteer_role: Optional[str] = None
    address: Optional[str] = None
    website: Optional[str] = Field(None, description="Ссылка на сайт")
    phone: Optional[str] = None
    founded_year: Optional[int] = Field(
        None, ge=1000, le=datetime.utcnow().year + 1, description="Год основания"
    )
    email: Optional[str] = None
    city_id: Optional[int] = None
    city_name: Optional[str] = Field(
        None, description="Название города, если нужно создать/найти"
    )
    id_category: Optional[int] = None
    category_name: Optional[str] = Field(
        None, description="Название категории, если нужно создать/найти"
    )
    path_to_logo: Optional[str] = None
    cover_image: Optional[str] = None
    reason_rejection: Optional[str] = None


@router.put(
    "/{organization_id}",
    response_model=dict,
    status_code=status.HTTP_200_OK,
    summary="Обновить информацию об организации",
)
def update_organization(
    organization_id: int,
    payload: OrganizationUpdateRequest,
    db: Session = Depends(get_db),
):
    """
    Обновляет произвольные поля организации по ее идентификатору.
    """
    org = db_operations.get_organization_by_id(db, organization_id)
    if not org:
        raise HTTPException(status_code=404, detail="Организация не найдена")

    payload_data = payload.model_dump(exclude_unset=True)
    updates = {}

    if "city_id" in payload_data:
        updates["city_id"] = payload_data["city_id"]
    elif "city_name" in payload_data:
        city = db_operations.get_or_create_city(db, payload_data["city_name"])
        updates["city_id"] = city.id

    if "id_category" in payload_data:
        updates["id_category"] = payload_data["id_category"]
    elif "category_name" in payload_data:
        category = db_operations.get_or_create_category(db, payload_data["category_name"])
        updates["id_category"] = category.id

    for field in [
        "name",
        "short_name",
        "description",
        "full_description",
        "volunteer_role",
        "address",
        "website",
        "phone",
        "founded_year",
        "email",
        "path_to_logo",
        "cover_image",
        "reason_rejection",
    ]:
        if field in payload_data:
            updates[field] = payload_data[field]

    if not updates:
        return db_operations.organization_to_dict(org)

    updated_org = db_operations.update_organization(db, organization_id, **updates)
    return db_operations.organization_to_dict(updated_org)


@router.delete(
    "/{organization_id}",
    status_code=status.HTTP_200_OK,
    summary="Удалить организацию",
)
def delete_organization(
    organization_id: int,
    db: Session = Depends(get_db),
):
    """
    Мягко удаляет организацию (проставляет дату удаления).
    """
    org = db_operations.get_organization_by_id(db, organization_id)
    if not org:
        raise HTTPException(status_code=404, detail="Организация не найдена")

    if org.date_delete is not None:
        return {"detail": "Организация уже удалена"}

    org.date_delete = datetime.utcnow()
    db.commit()
    return {"detail": "Организация успешно удалена"}
