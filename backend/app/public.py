from fastapi import APIRouter, Query, HTTPException, Depends
from fastapi.responses import Response
from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime
from sqlalchemy.orm import Session
import os
from pathlib import Path

from . import db_operations
from .db_session import get_db
from .minio_client import get_minio_client

router = APIRouter(
    prefix="/public",
    tags=["Общедоступные данные"],
)

# --- Модели данных ---
class NewsResponse(BaseModel):
    id: int
    title: str
    shortDescription: str
    content: str
    images: Optional[List[str]] = [] 
    files: Optional[List[str]] = []
    publishDate: str
    city: str
    category: str
    tags: List[str]

class EventResponse(BaseModel):
    id: int
    organizationId: Optional[int] = None
    statusId: Optional[int] = None
    status: Optional[str] = None
    rejectionReason: Optional[str] = None
    title: str
    description: str
    fullDescription: Optional[str] = ""
    date: str
    time: str
    location: str
    address: Optional[str] = ""
    organizer: str
    organizerDescription: Optional[str] = ""
    city: str
    category: str
    phone: Optional[str] = ""
    email: Optional[str] = ""
    maxParticipants: Optional[int] = 0
    registrationRequired: Optional[bool] = False
    isFree: bool
    images: Optional[List[str]] = []

class NkoResponse(BaseModel):
    id: int
    email: str
    organization_name: str
    city_name: str
    city_lat: Optional[float] = None
    city_long: Optional[float] = None
    moderation_status: str
    category: Optional[str] = None
    description: Optional[str] = ""
    address: Optional[str] = ""
    website_url: Optional[str] = ""
    phone: Optional[str] = ""
    founded_year: Optional[int] = None
    social_links: Optional[List[str]] = []
    logo_url: Optional[str] = None
    rejection_reason: Optional[str] = None

class MaterialResponse(BaseModel):
    id: int
    name: str
    url: str

class KnowledgeBaseResponse(BaseModel):
    id: int
    title: str
    description: str
    content: str
    category: str
    type: str
    views: int
    publishDate: str
    videoUrl: Optional[str] = None
    externalLink: Optional[str] = None
    materials: List[MaterialResponse]

class CityResponse(BaseModel):
    id: int
    name: str
    lat: Optional[float] = None
    long: Optional[float] = None

class OrganizationMembersCountResponse(BaseModel):
    organization_id: int
    members_count: int


# --- Эндпоинты для новостей ---
@router.get("/news", response_model=List[NewsResponse])
def get_all_news(
    limit: Optional[int] = Query(None, description="Количество новостей"),
    db: Session = Depends(get_db)
):
    """Получить список всех новостей, отсортированных по дате (новые первыми)."""
    # Получаем новости из БД
    news_list = db_operations.get_all_news(db)
    
    # Преобразуем в словари
    news = [db_operations.news_to_dict(n) for n in news_list]
    
    # Сортировка по дате (новые первыми)
    news = sorted(news, key=lambda x: x.get('publishDate', ''), reverse=True)
    
    # Лимит
    if limit:
        news = news[:limit]
   
    return news


@router.get("/news/{news_id}", response_model=NewsResponse)
def get_news_by_id(
    news_id: int,
    db: Session = Depends(get_db)
):
    """Получить новость по ID."""
    # Получаем новость из БД
    news = db_operations.get_news_by_id(db, news_id)
    
    if not news:
        raise HTTPException(status_code=404, detail="News not found")
    
    # Преобразуем в словарь
    return db_operations.news_to_dict(news)


# --- Эндпоинты для событий ---
@router.get("/events", response_model=List[EventResponse])
def get_all_events(
    limit: Optional[int] = Query(None, description="Количество событий"),
    db: Session = Depends(get_db)
):
    """Получить список всех событий."""
    # Получаем события из БД
    events_list = db_operations.get_all_events(db)
    
    # Преобразуем в словари
    events = [db_operations.event_to_dict(e) for e in events_list]
    
    # Сортировка по дате
    events = sorted(events, key=lambda x: x.get('date', ''))
    
    # Лимит
    if limit:
        events = events[:limit]
    
    return events


@router.get("/events/{event_id}", response_model=EventResponse)
def get_event_by_id(
    event_id: int,
    db: Session = Depends(get_db)
):
    """Получить событие по ID."""
    # Получаем событие из БД
    event = db_operations.get_event_by_id(db, event_id)
    
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Преобразуем в словарь
    return db_operations.event_to_dict(event)


# --- Эндпоинты для НКО ---
@router.get("/nkos", response_model=List[NkoResponse])
def get_all_nkos(
    limit: Optional[int] = Query(None, description="Количество НКО"),
    db: Session = Depends(get_db)
):
    """Получить список всех НКО со статусом 'Одобрена'."""
    # Получаем ID статуса "Одобрена"
    status_approved = db_operations.get_status_organization_by_name(db, "Одобрена")
    if not status_approved:
        return []
    
    # Получаем все организации с этим статусом
    organizations = db_operations.get_all_organizations(db, status_id=status_approved.id)

    # Преобразуем в словари и адаптируем под модель NkoResponse
    nkos = []
    for org in organizations:
        org_dict = db_operations.organization_to_dict(org)
        # Приводим к формату NkoResponse
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
        nkos.append(nko_data)
    
    # Сортировка по названию организации
    nkos = sorted(nkos, key=lambda x: x.get('organization_name', ''))
    
    # Лимит
    if limit:
        nkos = nkos[:limit]
    
    return nkos


@router.get("/nkos/{nko_id}", response_model=NkoResponse)
def get_nko_by_id(
    nko_id: int,
    db: Session = Depends(get_db)
):
    """Получить организацию по ID (с любым статусом)."""
    # Получаем организацию по ID
    organization = db_operations.get_organization_by_id(db, nko_id)
    
    if not organization:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    # Преобразуем в словарь и адаптируем под модель NkoResponse
    org_dict = db_operations.organization_to_dict(organization)
    nko_data = {
        "id": org_dict.get("id"),
        "email": org_dict.get("email", ""),
        "organization_name": org_dict.get("organization_name", ""),
        "city_name": org_dict.get("city_name", "Не указан"),
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
    
    return nko_data


@router.get("/nkos/{nko_id}/members-count", response_model=OrganizationMembersCountResponse)
def get_organization_members_count(
    nko_id: int,
    db: Session = Depends(get_db)
):
    """Получить количество участников организации по её ID."""
    # Проверяем, что организация существует
    organization = db_operations.get_organization_by_id(db, nko_id)
    if not organization:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    # Подсчитываем количество пользователей, привязанных к организации
    members_count = db_operations.count_users_by_organization_id(db, nko_id)
    
    return OrganizationMembersCountResponse(
        organization_id=nko_id,
        members_count=members_count
    )


# --- Эндпоинты для базы знаний ---
@router.get("/knowledge-base", response_model=List[KnowledgeBaseResponse])
def get_all_knowledge_base(
    limit: Optional[int] = Query(None, description="Количество записей"),
    db: Session = Depends(get_db)
):
    """Получить список всех записей базы знаний с материалами."""
    # Получаем записи базы знаний из БД
    kb_list = db_operations.get_all_knowledge_base_data(db)
    
    # Преобразуем в словари
    knowledge_base = [db_operations.knowledge_base_data_to_dict(kb) for kb in kb_list]
    
    # Сортировка по дате создания (новые первыми)
    knowledge_base = sorted(knowledge_base, key=lambda x: x.get('publishDate', ''), reverse=True)
    
    # Лимит
    if limit:
        knowledge_base = knowledge_base[:limit]
    
    return knowledge_base


@router.get("/knowledge-base/{kb_id}", response_model=KnowledgeBaseResponse)
def get_knowledge_base_by_id(
    kb_id: int,
    db: Session = Depends(get_db)
):
    """Получить запись базы знаний по ID с материалами."""
    # Получаем запись из БД
    kb = db_operations.get_knowledge_base_data_by_id(db, kb_id)
    
    if not kb:
        raise HTTPException(status_code=404, detail="Knowledge base entry not found")
    
    # Преобразуем в словарь
    return db_operations.knowledge_base_data_to_dict(kb)


# --- Эндпоинты для категорий ---
@router.get("/categories/news")
def get_news_categories(db: Session = Depends(get_db)):
    """Получить список всех категорий новостей."""
    # Получаем новости из БД
    news_list = db_operations.get_all_news(db)
    
    # Преобразуем в словари и извлекаем категории
    news = [db_operations.news_to_dict(n) for n in news_list]
    categories = list(set(n.get('category', '') for n in news if n.get('category')))
    return sorted(categories)


@router.get("/categories/events")
def get_event_categories(db: Session = Depends(get_db)):
    """Получить список всех категорий событий."""
    # Получаем события из БД
    events_list = db_operations.get_all_events(db)
    
    # Преобразуем в словари и извлекаем категории
    events = [db_operations.event_to_dict(e) for e in events_list]
    categories = list(set(e.get('category', '') for e in events if e.get('category')))
    return sorted(categories)


@router.get("/categories/nkos")
def get_nko_categories(db: Session = Depends(get_db)):
    """Получить список всех категорий НКО."""
    nkos = db_operations.get_approved_nkos(db)
    categories = list(set(n.get('category', '') for n in nkos if n.get('category')))
    return sorted(categories)


# --- Эндпоинты для городов ---
@router.get("/cities", response_model=List[CityResponse])
def get_all_cities(
    db: Session = Depends(get_db)
):
    """Получить список всех городов из базы данных."""
    # Получаем города из БД
    cities_list = db_operations.get_all_cities(db)
    
    # Преобразуем в словари
    cities = [db_operations.city_to_dict(city) for city in cities_list]
    
    # Сортировка по названию
    cities = sorted(cities, key=lambda x: x.get('name', ''))
    
    return cities


@router.get("/cities/with-organizations", response_model=List[CityResponse])
def get_cities_with_organizations(
    db: Session = Depends(get_db)
):
    """Получить список городов, в которых есть хотя бы одна организация."""
    # Получаем города с организациями из БД
    cities_list = db_operations.get_cities_with_organizations(db)
    
    # Преобразуем в словари
    cities = [db_operations.city_to_dict(city) for city in cities_list]
    
    # Сортировка по названию
    cities = sorted(cities, key=lambda x: x.get('name', ''))
    
    return cities


# --- Эндпоинт для отдачи файлов ---
@router.get("/files")
def get_file(
    file_path: str = Query(..., description="Путь до файла в MinIO")
):
    """Получить файл из MinIO."""
    # Проверяем путь на безопасность (защита от path traversal)
    if ".." in file_path or file_path.startswith("/"):
        raise HTTPException(status_code=403, detail="Доступ к файлу запрещен")
    
    # Нормализуем путь (убираем начальные слеши)
    normalized_path = file_path.lstrip("/")
    
    # Получаем клиент MinIO
    minio_client = get_minio_client()
    
    # Проверяем существование файла
    if not minio_client.file_exists(normalized_path):
        raise HTTPException(status_code=404, detail="Файл не найден")
    
    # Получаем информацию о файле для определения content-type
    file_info = minio_client.get_file_info(normalized_path)
    content_type = file_info.get("content_type", "application/octet-stream") if file_info else "application/octet-stream"
    
    # Получаем файл из MinIO
    try:
        file_data = minio_client.get_file(normalized_path)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка при получении файла: {e}")
    
    # Определяем имя файла из пути
    filename = Path(normalized_path).name
    
    # Возвращаем файл
    return Response(
        content=file_data,
        media_type=content_type,
        headers={
            "Content-Disposition": f'inline; filename="{filename}"'
        }
    )