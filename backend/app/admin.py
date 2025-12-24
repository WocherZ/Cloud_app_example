from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from . import models, dependencies, db_operations
from .db_session import get_db
from . import db_models

router = APIRouter(
    prefix="/admin",
    tags=["Администрирование"],
    dependencies=[Depends(dependencies.get_current_admin_or_moderator)],
)


class UserRoleUpdateRequest(BaseModel):
    """Модель данных для смены роли пользователя."""

    user_id: int = Field(..., gt=0, description="ID пользователя, чью роль нужно изменить")
    new_role_id: int = Field(..., gt=0, description="ID существующей роли")


class StatisticsResponse(BaseModel):
    """Модель данных для статистики по базе данных."""

    total_users: int = Field(..., description="Общее количество пользователей")
    total_nko: int = Field(..., description="Общее количество НКО")
    total_pending_nko: int = Field(..., description="Количество НКО со статусом 'Одобрена'")
    total_events: int = Field(..., description="Общее количество мероприятий")
    total_news: int = Field(..., description="Общее количество новостей")
    total_knowledge_base_data: int = Field(
        ..., description="Общее количество материалов базы знаний"
    )




@router.get("/users/with-roles", response_model=List[models.UserWithRole])
def get_all_users_with_roles(
    db: Session = Depends(get_db),
    current_admin: dict = Depends(dependencies.get_current_admin)
):
    """Получить список всех пользователей со всеми их ролями из таблиц user и role (только для админов)."""
    # Получаем всех пользователей из БД
    users = db_operations.get_all_users(db)
    
    # Преобразуем каждого пользователя в формат UserWithRole
    result = []
    for user in users:
        user_with_role = models.UserWithRole(
            id=user.id,
            email=user.email,
            name=user.name,
            surname=user.surname,
            patronymic=user.patronymic,
            role_id=user.role_id,
            role_name=user.role.name if user.role else None,
            city_id=user.city_id,
            city_name=user.city.name if user.city else None,
            organization_id=user.organization_id,
            user_photo=user.user_photo,
            date_create=user.date_create
        )
        result.append(user_with_role)
    
    return result


@router.put(
    "/users/update-role",
    response_model=dict,
    status_code=status.HTTP_200_OK,
    summary="Смена роли пользователя",
)
def update_user_role(
    payload: UserRoleUpdateRequest,
    db: Session = Depends(get_db),
    current_admin: dict = Depends(dependencies.get_current_admin),
):
    """Обновляет роль пользователя на указанную (доступно только администраторам)."""
    user = db_operations.get_user_by_id(db, payload.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    role = db_operations.get_role_by_id(db, payload.new_role_id)
    if not role:
        raise HTTPException(status_code=404, detail="Роль не найдена")

    updated_user = db_operations.update_user(db, payload.user_id, role_id=payload.new_role_id)

    return {
        "detail": "Роль пользователя успешно обновлена",
        "user_id": updated_user.id,
        "new_role_id": updated_user.role_id,
    }


@router.get(
    "/statistics",
    response_model=StatisticsResponse,
    status_code=status.HTTP_200_OK,
    summary="Получить статистику по базе данных",
)
def get_statistics(
    db: Session = Depends(get_db),
    current_admin: dict = Depends(dependencies.get_current_admin),
):
    """Получить статистику по базе данных (доступно только администраторам)."""
    # Подсчет общего количества пользователей
    total_users = db.query(db_models.User).filter(
        db_models.User.date_delete.is_(None)
    ).count()

    # Подсчет общего количества НКО
    total_nko = db.query(db_models.Organization).filter(
        db_models.Organization.date_delete.is_(None)
    ).count()

    # Подсчет НКО со статусом "Одобрена"
    status_approved = db_operations.get_status_organization_by_name(db, "Одобрена")
    total_pending_nko = 0
    if status_approved:
        total_pending_nko = db.query(db_models.Organization).filter(
            db_models.Organization.date_delete.is_(None),
            db_models.Organization.status_organization_id == status_approved.id
        ).count()

    # Подсчет общего количества мероприятий
    total_events = db.query(db_models.Event).filter(
        db_models.Event.date_delete.is_(None)
    ).count()

    # Подсчет общего количества новостей
    total_news = db.query(db_models.News).filter(
        db_models.News.date_delete.is_(None)
    ).count()

    # Подсчет общего количества материалов базы знаний
    total_knowledge_base_data = db.query(db_models.KnowledgeBaseData).filter(
        db_models.KnowledgeBaseData.date_delete.is_(None)
    ).count()

    return StatisticsResponse(
        total_users=total_users,
        total_nko=total_nko,
        total_pending_nko=total_pending_nko,
        total_events=total_events,
        total_news=total_news,
        total_knowledge_base_data=total_knowledge_base_data,
    )