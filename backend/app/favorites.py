from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from . import db_operations, dependencies
from .db_session import get_db
from .public import EventResponse, NewsResponse, KnowledgeBaseResponse, NkoResponse


class FavoriteActionResponse(BaseModel):
    message: str


class FavoriteAddResponse(FavoriteActionResponse):
    event: EventResponse


class FavoriteNewsAddResponse(FavoriteActionResponse):
    news: NewsResponse


class FavoriteKnowledgeBaseAddResponse(FavoriteActionResponse):
    knowledge_base: KnowledgeBaseResponse


class FavoriteOrganizationAddResponse(FavoriteActionResponse):
    organization: NkoResponse


router = APIRouter(
    prefix="/favorites",
    tags=["Избранное"],
    dependencies=[Depends(dependencies.get_current_user)],
)


@router.post(
    "/events/{event_id}",
    response_model=FavoriteAddResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Добавить мероприятие в избранное",
)
def add_event_to_favorites(
    event_id: int,
    current_user: dict = Depends(dependencies.get_current_user),
    db: Session = Depends(get_db),
):
    """Добавляет указанное мероприятие в список избранных пользователя."""
    event = db_operations.get_event_by_id(db, event_id)
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Событие не найдено")

    # Проверяем, не добавлено ли мероприятие уже в избранное
    existing_active = db_operations.get_selected_event_entry(db, current_user["id"], event_id)
    if existing_active:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Мероприятие уже находится в избранном",
        )

    # Если запись ранее удаляли, восстановим её, иначе создаём новую
    existing_any = db_operations.get_selected_event_entry(
        db,
        current_user["id"],
        event_id,
        include_deleted=True,
    )
    if existing_any:
        db_operations.restore_selected_event(db, existing_any)
    else:
        db_operations.add_selected_event(db, current_user["id"], event_id)

    return FavoriteAddResponse(
        message="Мероприятие добавлено в избранное",
        event=db_operations.event_to_dict(event),
    )


@router.get(
    "/events",
    response_model=List[EventResponse],
    summary="Получить избранные мероприятия текущего пользователя",
)
def get_favorite_events(
    current_user: dict = Depends(dependencies.get_current_user),
    db: Session = Depends(get_db),
):
    """Возвращает список всех избранных мероприятий пользователя."""
    events = db_operations.get_selected_events_by_user(db, current_user["id"])
    return [db_operations.event_to_dict(event) for event in events]


@router.delete(
    "/events/{event_id}",
    response_model=FavoriteActionResponse,
    summary="Удалить мероприятие из избранного",
)
def remove_event_from_favorites(
    event_id: int,
    current_user: dict = Depends(dependencies.get_current_user),
    db: Session = Depends(get_db),
):
    """Удаляет мероприятие из избранного пользователя."""
    removed = db_operations.remove_selected_event(db, current_user["id"], event_id)
    if not removed:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Мероприятия нет в списке избранного",
        )

    return FavoriteActionResponse(message="Мероприятие удалено из избранного")


@router.post(
    "/news/{news_id}",
    response_model=FavoriteNewsAddResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Добавить новость в избранное",
)
def add_news_to_favorites(
    news_id: int,
    current_user: dict = Depends(dependencies.get_current_user),
    db: Session = Depends(get_db),
):
    """Добавляет указанную новость в список избранных пользователя."""
    news = db_operations.get_news_by_id(db, news_id)
    if not news:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Новость не найдена")

    existing_active = db_operations.get_selected_news_entry(db, current_user["id"], news_id)
    if existing_active:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Новость уже находится в избранном",
        )

    existing_any = db_operations.get_selected_news_entry(
        db,
        current_user["id"],
        news_id,
        include_deleted=True,
    )
    if existing_any:
        db_operations.restore_selected_news(db, existing_any)
    else:
        db_operations.add_selected_news(db, current_user["id"], news_id)

    return FavoriteNewsAddResponse(
        message="Новость добавлена в избранное",
        news=db_operations.news_to_dict(news),
    )


@router.get(
    "/news",
    response_model=List[NewsResponse],
    summary="Получить избранные новости текущего пользователя",
)
def get_favorite_news(
    current_user: dict = Depends(dependencies.get_current_user),
    db: Session = Depends(get_db),
):
    """Возвращает список всех избранных новостей пользователя."""
    news_list = db_operations.get_selected_news_by_user(db, current_user["id"])
    return [db_operations.news_to_dict(news) for news in news_list]


@router.delete(
    "/news/{news_id}",
    response_model=FavoriteActionResponse,
    summary="Удалить новость из избранного",
)
def remove_news_from_favorites(
    news_id: int,
    current_user: dict = Depends(dependencies.get_current_user),
    db: Session = Depends(get_db),
):
    """Удаляет новость из избранного пользователя."""
    removed = db_operations.remove_selected_news(db, current_user["id"], news_id)
    if not removed:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Новости нет в списке избранного",
        )

    return FavoriteActionResponse(message="Новость удалена из избранного")


@router.post(
    "/knowledge-base/{kb_id}",
    response_model=FavoriteKnowledgeBaseAddResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Добавить материал базы знаний в избранное",
)
def add_knowledge_base_to_favorites(
    kb_id: int,
    current_user: dict = Depends(dependencies.get_current_user),
    db: Session = Depends(get_db),
):
    """Добавляет указанный материал базы знаний в список избранного пользователя."""
    kb = db_operations.get_knowledge_base_data_by_id(db, kb_id)
    if not kb:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Материал базы знаний не найден")

    existing_active = db_operations.get_selected_knowledge_base_entry(db, current_user["id"], kb_id)
    if existing_active:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Материал базы знаний уже находится в избранном",
        )

    existing_any = db_operations.get_selected_knowledge_base_entry(
        db,
        current_user["id"],
        kb_id,
        include_deleted=True,
    )
    if existing_any:
        db_operations.restore_selected_knowledge_base(db, existing_any)
    else:
        db_operations.add_selected_knowledge_base_data(db, current_user["id"], kb_id)

    return FavoriteKnowledgeBaseAddResponse(
        message="Материал базы знаний добавлен в избранное",
        knowledge_base=db_operations.knowledge_base_data_to_dict(kb),
    )


@router.get(
    "/knowledge-base",
    response_model=List[KnowledgeBaseResponse],
    summary="Получить избранные материалы базы знаний текущего пользователя",
)
def get_favorite_knowledge_base(
    current_user: dict = Depends(dependencies.get_current_user),
    db: Session = Depends(get_db),
):
    """Возвращает список всех избранных материалов базы знаний пользователя."""
    kb_list = db_operations.get_selected_knowledge_base_by_user(db, current_user["id"])
    return [db_operations.knowledge_base_data_to_dict(kb) for kb in kb_list]


@router.delete(
    "/knowledge-base/{kb_id}",
    response_model=FavoriteActionResponse,
    summary="Удалить материал базы знаний из избранного",
)
def remove_knowledge_base_from_favorites(
    kb_id: int,
    current_user: dict = Depends(dependencies.get_current_user),
    db: Session = Depends(get_db),
):
    """Удаляет материал базы знаний из избранного пользователя."""
    removed = db_operations.remove_selected_knowledge_base(db, current_user["id"], kb_id)
    if not removed:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Материала базы знаний нет в списке избранного",
        )

    return FavoriteActionResponse(message="Материал базы знаний удалён из избранного")


@router.post(
    "/nko/{nko_id}",
    response_model=FavoriteOrganizationAddResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Добавить организацию в избранное",
)
def add_organization_to_favorites(
    nko_id: int,
    current_user: dict = Depends(dependencies.get_current_user),
    db: Session = Depends(get_db),
):
    """Добавляет указанную организацию в список избранных пользователя."""
    organization = db_operations.get_organization_by_id(db, nko_id)
    if not organization:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Организация не найдена")

    # Проверяем, не добавлена ли организация уже в избранное
    existing_active = db_operations.get_selected_organization_entry(db, current_user["id"], nko_id)
    if existing_active:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Организация уже находится в избранном",
        )

    # Если запись ранее удаляли, восстановим её, иначе создаём новую
    existing_any = db_operations.get_selected_organization_entry(
        db,
        current_user["id"],
        nko_id,
        include_deleted=True,
    )
    if existing_any:
        db_operations.restore_selected_organization(db, existing_any)
    else:
        db_operations.add_selected_organization(db, current_user["id"], nko_id)

    # Преобразуем организацию в формат NkoResponse
    org_dict = db_operations.organization_to_dict(organization)
    nko_data = {
        "id": org_dict.get("id"),
        "email": org_dict.get("email", ""),
        "organization_name": org_dict.get("organization_name", ""),
        "city_name": org_dict.get("city_name", "Не указан"),
        "city_lat": org_dict.get("city_lat"),
        "city_long": org_dict.get("city_long"),
        "moderation_status": org_dict.get("moderation_status", ""),
        "category": org_dict.get("category"),
        "description": org_dict.get("description", ""),
        "address": org_dict.get("address", ""),
        "website_url": org_dict.get("website_url", ""),
        "phone": org_dict.get("phone", ""),
        "founded_year": org_dict.get("founded_year"),
        "social_links": org_dict.get("social_links", []),
        "logo_url": org_dict.get("logo_url"),
        "rejection_reason": org_dict.get("reason_rejection"),
    }

    return FavoriteOrganizationAddResponse(
        message="Организация добавлена в избранное",
        organization=nko_data,
    )


@router.get(
    "/nkos",
    response_model=List[NkoResponse],
    summary="Получить избранные организации текущего пользователя",
)
def get_favorite_organizations(
    current_user: dict = Depends(dependencies.get_current_user),
    db: Session = Depends(get_db),
):
    """Возвращает список всех избранных организаций пользователя."""
    organizations = db_operations.get_selected_organizations_by_user(db, current_user["id"])
    
    # Преобразуем в формат NkoResponse
    result = []
    for org in organizations:
        org_dict = db_operations.organization_to_dict(org)
        nko_data = {
            "id": org_dict.get("id"),
            "email": org_dict.get("email", ""),
            "organization_name": org_dict.get("organization_name", ""),
            "city_name": org_dict.get("city_name", "Не указан"),
            "city_lat": org_dict.get("city_lat"),
            "city_long": org_dict.get("city_long"),
            "moderation_status": org_dict.get("moderation_status", ""),
            "category": org_dict.get("category"),
            "description": org_dict.get("description", ""),
            "address": org_dict.get("address", ""),
            "website_url": org_dict.get("website_url", ""),
            "phone": org_dict.get("phone", ""),
            "founded_year": org_dict.get("founded_year"),
            "social_links": org_dict.get("social_links", []),
            "logo_url": org_dict.get("logo_url"),
            "rejection_reason": org_dict.get("reason_rejection"),
        }
        result.append(nko_data)
    
    return result


@router.delete(
    "/nko/{nko_id}",
    response_model=FavoriteActionResponse,
    summary="Удалить организацию из избранного",
)
def remove_organization_from_favorites(
    nko_id: int,
    current_user: dict = Depends(dependencies.get_current_user),
    db: Session = Depends(get_db),
):
    """Удаляет организацию из избранного пользователя."""
    removed = db_operations.remove_selected_organization(db, current_user["id"], nko_id)
    if not removed:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Организации нет в списке избранного",
        )

    return FavoriteActionResponse(message="Организация удалена из избранного")

