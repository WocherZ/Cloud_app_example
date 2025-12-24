"""
CRUD операции для работы с базой данных.
Содержит функции для создания, чтения, обновления и удаления данных.
"""
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from datetime import datetime

from . import db_models


DEFAULT_USER_PHOTO = "files/user_photo/user4.jpg"
DEFAULT_EVENT_STATUS = "На модерации"
EVENT_STATUS_PRESETS = ("Одобрено", "Отклонено", DEFAULT_EVENT_STATUS)

# ==================== ПОЛЬЗОВАТЕЛИ (User) ====================

def get_user_by_email(db: Session, email: str) -> Optional[db_models.User]:
    """Получить пользователя по email."""
    return db.query(db_models.User).filter(
        db_models.User.email == email,
        db_models.User.date_delete.is_(None)
    ).first()


def get_user_by_id(db: Session, user_id: int) -> Optional[db_models.User]:
    """Получить пользователя по ID."""
    return db.query(db_models.User).filter(
        db_models.User.id == user_id,
        db_models.User.date_delete.is_(None)
    ).first()


def create_user(db: Session, email: str, password_hash: str, name: str, 
                role_id: int, organization_id: Optional[int] = None,
                surname: Optional[str] = None, patronymic: Optional[str] = None,
                city_id: Optional[int] = None, user_photo: Optional[str] = DEFAULT_USER_PHOTO) -> db_models.User:
    """Создать нового пользователя."""
    db_user = db_models.User(
        email=email,
        password_hash=password_hash,
        name=name,
        surname=surname,
        patronymic=patronymic,
        role_id=role_id,
        organization_id=organization_id,
        city_id=city_id,
        user_photo=user_photo,
        date_create=datetime.utcnow(),
        date_update=datetime.utcnow()
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def update_user(db: Session, user_id: int, **kwargs) -> Optional[db_models.User]:
    """Обновить данные пользователя."""
    user = get_user_by_id(db, user_id)
    if not user:
        return None
    
    for key, value in kwargs.items():
        if hasattr(user, key):
            setattr(user, key, value)
    
    user.date_update = datetime.utcnow()
    db.commit()
    db.refresh(user)
    return user


def get_all_users(db: Session) -> List[db_models.User]:
    """Получить список всех пользователей."""
    return db.query(db_models.User).filter(
        db_models.User.date_delete.is_(None)
    ).all()


def soft_delete_user(db: Session, user_id: int) -> bool:
    """Мягкое удаление пользователя (установка date_delete)."""
    user = get_user_by_id(db, user_id)
    if not user:
        return False
    
    user.date_delete = datetime.utcnow()
    db.commit()
    return True


def count_users_by_organization_id(db: Session, organization_id: int) -> int:
    """Подсчитать количество пользователей, привязанных к организации."""
    return db.query(db_models.User).filter(
        db_models.User.organization_id == organization_id,
        db_models.User.date_delete.is_(None)
    ).count()


# ==================== РОЛИ (Role) ====================

def get_role_by_name(db: Session, role_name: str) -> Optional[db_models.Role]:
    """Получить роль по названию."""
    return db.query(db_models.Role).filter(
        db_models.Role.name == role_name,
        db_models.Role.date_delete.is_(None)
    ).first()


def get_role_by_id(db: Session, role_id: int) -> Optional[db_models.Role]:
    """Получить роль по ID."""
    return db.query(db_models.Role).filter(
        db_models.Role.id == role_id,
        db_models.Role.date_delete.is_(None)
    ).first()


def create_role(db: Session, name: str) -> db_models.Role:
    """Создать новую роль."""
    db_role = db_models.Role(
        name=name,
        date_create=datetime.utcnow(),
        date_update=datetime.utcnow()
    )
    db.add(db_role)
    db.commit()
    db.refresh(db_role)
    return db_role


def get_or_create_role(db: Session, role_name: str) -> db_models.Role:
    """Получить роль или создать, если не существует."""
    role = get_role_by_name(db, role_name)
    if not role:
        role = create_role(db, role_name)
    return role


# ==================== ГОРОДА (City) ====================

def get_city_by_name(db: Session, city_name: str) -> Optional[db_models.City]:
    """Получить город по названию."""
    return db.query(db_models.City).filter(
        db_models.City.name == city_name,
        db_models.City.date_delete.is_(None)
    ).first()


def get_city_by_id(db: Session, city_id: int) -> Optional[db_models.City]:
    """Получить город по ID."""
    return db.query(db_models.City).filter(
        db_models.City.id == city_id,
        db_models.City.date_delete.is_(None)
    ).first()


def create_city(db: Session, name: str, lat: Optional[float] = None, long: Optional[float] = None) -> db_models.City:
    """Создать новый город."""
    db_city = db_models.City(
        name=name,
        lat=lat,
        long=long,
        date_create=datetime.utcnow(),
        date_update=datetime.utcnow()
    )
    db.add(db_city)
    db.commit()
    db.refresh(db_city)
    return db_city


def get_or_create_city(db: Session, city_name: str) -> db_models.City:
    """Получить город или создать, если не существует."""
    city = get_city_by_name(db, city_name)
    if not city:
        city = create_city(db, city_name)
    return city


def get_all_cities(db: Session) -> List[db_models.City]:
    """Получить список всех городов."""
    return db.query(db_models.City).filter(
        db_models.City.date_delete.is_(None)
    ).all()


def city_to_dict(city: db_models.City) -> Dict[str, Any]:
    """Преобразует модель города SQLAlchemy в словарь."""
    return {
        "id": city.id,
        "name": city.name,
        "lat": city.lat,
        "long": city.long,
    }


def get_cities_with_organizations(db: Session) -> List[db_models.City]:
    """Получить список городов, в которых есть хотя бы одна организация."""
    return db.query(db_models.City).join(
        db_models.Organization,
        db_models.City.id == db_models.Organization.city_id
    ).filter(
        db_models.City.date_delete.is_(None),
        db_models.Organization.date_delete.is_(None)
    ).distinct().all()


# ==================== ОРГАНИЗАЦИИ (Organization) ====================

def get_organization_by_id(db: Session, org_id: int) -> Optional[db_models.Organization]:
    """Получить организацию по ID."""
    return db.query(db_models.Organization).filter(
        db_models.Organization.id == org_id,
        db_models.Organization.date_delete.is_(None)
    ).first()


def get_organization_by_name(db: Session, name: str) -> Optional[db_models.Organization]:
    """Получить организацию по названию."""
    return db.query(db_models.Organization).filter(
        db_models.Organization.name == name,
        db_models.Organization.date_delete.is_(None)
    ).first()


def get_organization_by_email(db: Session, email: str) -> Optional[db_models.Organization]:
    """Получить организацию по email."""
    return db.query(db_models.Organization).filter(
        db_models.Organization.email == email,
        db_models.Organization.date_delete.is_(None)
    ).first()


def create_organization(db: Session, name: str, short_name: Optional[str] = None,
                       email: Optional[str] = None, city_id: Optional[int] = None,
                       status_organization_id: Optional[int] = None,
                       id_category: Optional[int] = None,
                       **kwargs) -> db_models.Organization:
    """Создать новую организацию."""
    db_org = db_models.Organization(
        name=name,
        short_name=short_name,
        email=email,
        city_id=city_id,
        status_organization_id=status_organization_id,
        id_category=id_category,
        date_create=datetime.utcnow(),
        date_update=datetime.utcnow(),
        **kwargs
    )
    db.add(db_org)
    db.commit()
    db.refresh(db_org)
    return db_org


def update_organization(db: Session, org_id: int, **kwargs) -> Optional[db_models.Organization]:
    """Обновить данные организации."""
    org = get_organization_by_id(db, org_id)
    if not org:
        return None
    
    for key, value in kwargs.items():
        if hasattr(org, key):
            setattr(org, key, value)
    
    org.date_update = datetime.utcnow()
    db.commit()
    db.refresh(org)
    return org


def organization_to_dict(org: db_models.Organization) -> Dict[str, Any]:
    """Преобразует модель организации SQLAlchemy в словарь."""
    return {
        "id": org.id,
        "name": org.name,
        "short_name": org.short_name or "",
        "email": org.email or "",
        "organization_name": org.name,
        "city_name": org.city.name if org.city else "Не указан",
        "city_id": org.city_id,
        "city_lat": org.city.lat if org.city else None,
        "city_long": org.city.long if org.city else None,
        "moderation_status": org.status_organization.name if org.status_organization else "Не подана",
        "is_moderated": org.status_organization_id is not None,
        "category": org.category.name if org.category else None,
        "description": org.description,
        "full_description": org.full_description,
        "address": org.address,
        "website_url": org.website,
        "phone": org.phone,
        "founded_year": org.founded_year,
        "social_links": [],  # TODO: заполнить из связанных данных
        "logo_url": org.path_to_logo,
        "cover_image": org.cover_image,
        "volunteer_role": org.volunteer_role,
        "reason_rejection": org.reason_rejection,
    }


def get_all_organizations(db: Session, status_id: Optional[int] = None) -> List[db_models.Organization]:
    """Получить список всех организаций, опционально с фильтром по статусу."""
    query = db.query(db_models.Organization).filter(
        db_models.Organization.date_delete.is_(None)
    )
    if status_id is not None:
        query = query.filter(db_models.Organization.status_organization_id == status_id)
    return query.all()


def get_approved_nkos(db: Session) -> List[Dict[str, Any]]:
    """Получить список одобренных НКО (с использованием БД)."""
    # Пока возвращаем все организации
    orgs = get_all_organizations(db)
    return [organization_to_dict(org) for org in orgs]

# ==================== КАТЕГОРИИ (Category) ====================

def get_category_by_name(db: Session, name: str) -> Optional[db_models.Category]:
    """Получить категорию по названию."""
    return db.query(db_models.Category).filter(
        db_models.Category.name == name,
        db_models.Category.date_delete.is_(None)
    ).first()


def create_category(db: Session, name: str) -> db_models.Category:
    """Создать новую категорию."""
    db_category = db_models.Category(
        name=name,
        date_create=datetime.utcnow(),
        date_update=datetime.utcnow()
    )
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category


def get_or_create_category(db: Session, name: str) -> db_models.Category:
    """Получить категорию или создать, если не существует."""
    category = get_category_by_name(db, name)
    if not category:
        category = create_category(db, name)
    return category


# ==================== СТАТУС ОРГАНИЗАЦИИ (StatusOrganization) ====================

def get_status_organization_by_name(db: Session, name: str) -> Optional[db_models.StatusOrganization]:
    """Получить статус организации по названию."""
    return db.query(db_models.StatusOrganization).filter(
        db_models.StatusOrganization.name == name,
        db_models.StatusOrganization.date_delete.is_(None)
    ).first()


def create_status_organization(db: Session, name: str) -> db_models.StatusOrganization:
    """Создать новый статус организации."""
    db_status = db_models.StatusOrganization(
        name=name,
        date_create=datetime.utcnow(),
        date_update=datetime.utcnow()
    )
    db.add(db_status)
    db.commit()
    db.refresh(db_status)
    return db_status


def get_or_create_status_organization(db: Session, name: str) -> db_models.StatusOrganization:
    """Получить статус организации или создать, если не существует."""
    status = get_status_organization_by_name(db, name)
    if not status:
        status = create_status_organization(db, name)
    return status


# ==================== СТАТУСЫ СОБЫТИЙ (StatusEvent) ====================

def get_status_event_by_name(db: Session, name: str) -> Optional[db_models.StatusEvent]:
    """Получить статус события по названию."""
    return db.query(db_models.StatusEvent).filter(
        db_models.StatusEvent.name == name,
        db_models.StatusEvent.date_delete.is_(None)
    ).first()


def create_status_event(db: Session, name: str) -> db_models.StatusEvent:
    """Создать новый статус события."""
    db_status = db_models.StatusEvent(
        name=name,
        date_create=datetime.utcnow(),
        date_update=datetime.utcnow()
    )
    db.add(db_status)
    db.commit()
    db.refresh(db_status)
    return db_status


def get_or_create_status_event(db: Session, name: str) -> db_models.StatusEvent:
    """Получить статус события или создать, если не существует."""
    status = get_status_event_by_name(db, name)
    if not status:
        status = create_status_event(db, name)
    return status


def ensure_default_event_status(db: Session) -> db_models.StatusEvent:
    """
    Гарантирует наличие всех предустановленных статусов событий и возвращает
    статус по умолчанию.
    """
    default_status = None
    for name in EVENT_STATUS_PRESETS:
        status = get_or_create_status_event(db, name)
        if name == DEFAULT_EVENT_STATUS:
            default_status = status
    return default_status


# ==================== МЕРОПРИЯТИЯ (Event) ====================

def get_event_by_id(db: Session, event_id: int) -> Optional[db_models.Event]:
    """Получить мероприятие по ID."""
    return db.query(db_models.Event).filter(
        db_models.Event.id == event_id,
        db_models.Event.date_delete.is_(None)
    ).first()


def create_event(
    db: Session,
    name: str,
    organization_id: Optional[int] = None,
    status_event_id: Optional[int] = None,
    **kwargs
) -> db_models.Event:
    """Создать новое мероприятие."""
    # Позволяем передавать статус через kwargs, чтобы избежать конфликта имен.
    status_event_id = kwargs.pop("status_event_id", status_event_id)
    if status_event_id is None:
        default_status = ensure_default_event_status(db)
        status_event_id = default_status.id

    db_event = db_models.Event(
        name=name,
        organization_id=organization_id,
        status_event_id=status_event_id,
        date_create=datetime.utcnow(),
        date_update=datetime.utcnow(),
        **kwargs
    )
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return db_event


def create_photo_event(db: Session, event_id: int, path: str) -> db_models.PhotoEvent:
    """Добавить файл или изображение к мероприятию."""
    db_file = db_models.PhotoEvent(
        event_id=event_id,
        path=path,
        date_create=datetime.utcnow(),
        date_update=datetime.utcnow()
    )
    db.add(db_file)
    db.commit()
    db.refresh(db_file)
    return db_file


def get_photo_event_by_path(db: Session, event_id: int, path: str) -> Optional[db_models.PhotoEvent]:
    """Получить изображение мероприятия по пути."""
    return db.query(db_models.PhotoEvent).filter(
        db_models.PhotoEvent.event_id == event_id,
        db_models.PhotoEvent.path == path,
        db_models.PhotoEvent.date_delete.is_(None)
    ).first()


def delete_photo_event(db: Session, event_id: int, path: str) -> bool:
    """Пометить изображение мероприятия как удаленное."""
    photo_entry = get_photo_event_by_path(db, event_id, path)
    if not photo_entry:
        return False

    photo_entry.date_delete = datetime.utcnow()
    db.commit()
    return True


def get_all_events(db: Session) -> List[db_models.Event]:
    """Получить список всех мероприятий."""
    return db.query(db_models.Event).filter(
        db_models.Event.date_delete.is_(None)
    ).all()


def get_events_by_organization(db: Session, org_id: int) -> List[db_models.Event]:
    """Получить все мероприятия организации."""
    return db.query(db_models.Event).filter(
        db_models.Event.organization_id == org_id,
        db_models.Event.date_delete.is_(None)
    ).all()


def get_events_by_status(db: Session, status_name: str) -> List[db_models.Event]:
    """Получить все мероприятия с указанным статусом."""
    status = get_status_event_by_name(db, status_name)
    if not status:
        return []
    return db.query(db_models.Event).filter(
        db_models.Event.status_event_id == status.id,
        db_models.Event.date_delete.is_(None)
    ).all()


def update_event(db: Session, event_id: int, **kwargs) -> Optional[db_models.Event]:
    """Обновить данные мероприятия."""
    event = get_event_by_id(db, event_id)
    if not event:
        return None
    
    for key, value in kwargs.items():
        if hasattr(event, key):
            setattr(event, key, value)
    
    event.date_update = datetime.utcnow()
    db.commit()
    db.refresh(event)
    return event


def event_to_dict(event: db_models.Event) -> Dict[str, Any]:
    """
    Преобразует модель мероприятия SQLAlchemy в словарь.
    Разделяет date_time_event на отдельные поля date и time для API.
    """
    from datetime import datetime
    
    # Извлекаем дату и время из date_time_event
    date_str = ""
    time_str = ""
    if event.date_time_event:
        date_str = event.date_time_event.strftime("%Y-%m-%d")
        time_str = event.date_time_event.strftime("%H:%M")
    
    # Получаем данные организации
    organizer = ""
    organizer_description = ""
    city = "Не указан"
    phone = ""
    email = ""
    if event.organization:
        organizer = event.organization.name or ""
        organizer_description = event.organization.description or ""
        city = event.organization.city.name if event.organization.city else "Не указан"
        phone = event.organization.phone or ""
        email = event.organization.email or ""
    
    images = [photo.path for photo in event.photo_events if photo.date_delete is None] if event.photo_events else []

    return {
        "id": event.id,
        "organizationId": event.organization_id,
        "statusId": event.status_event_id,
        "status": event.status_event.name if event.status_event else "",
        "rejectionReason": event.reason_rejection or "",
        "title": event.name or "",
        "description": event.description or "",
        "fullDescription": event.full_description or "",
        "date": date_str,
        "time": time_str,
        "location": event.address or "",
        "address": event.address or "",
        "organizer": organizer,
        "organizerDescription": organizer_description,
        "city": city,
        "category": event.category_event.name if event.category_event else "",
        "phone": phone,
        "email": email,
        "maxParticipants": event.quantity_participant or 0,
        "registrationRequired": event.date_before_register is not None,
        "isFree": True,  # По умолчанию true, т.к. в БД нет поля
        "images": images,
    }

# ==================== КАТЕГОРИИ МЕРОПРИЯТИЙ (CategoryEvent) ====================

def get_category_event_by_name(db: Session, name: str) -> Optional[db_models.CategoryEvent]:
    """Получить категорию мероприятия по названию."""
    return db.query(db_models.CategoryEvent).filter(
        db_models.CategoryEvent.name == name,
        db_models.CategoryEvent.date_delete.is_(None)
    ).first()


def create_category_event(db: Session, name: str) -> db_models.CategoryEvent:
    """Создать новую категорию мероприятия."""
    db_category = db_models.CategoryEvent(
        name=name,
        date_create=datetime.utcnow(),
        date_update=datetime.utcnow()
    )
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category


def get_or_create_category_event(db: Session, name: str) -> db_models.CategoryEvent:
    """Получить категорию или создать, если не существует."""
    category = get_category_event_by_name(db, name)
    if not category:
        category = create_category_event(db, name)
    return category


# ==================== ТИПЫ МЕРОПРИЯТИЙ (TypeEvent) ====================

def get_type_event_by_name(db: Session, name: str) -> Optional[db_models.TypeEvent]:
    """Получить тип мероприятия по названию."""
    return db.query(db_models.TypeEvent).filter(
        db_models.TypeEvent.name == name,
        db_models.TypeEvent.date_delete.is_(None)
    ).first()


def create_type_event(db: Session, name: str) -> db_models.TypeEvent:
    """Создать новый тип мероприятия."""
    db_type = db_models.TypeEvent(
        name=name,
        date_create=datetime.utcnow(),
        date_update=datetime.utcnow()
    )
    db.add(db_type)
    db.commit()
    db.refresh(db_type)
    return db_type


def get_or_create_type_event(db: Session, name: str) -> db_models.TypeEvent:
    """Получить тип мероприятия или создать, если не существует."""
    type_event = get_type_event_by_name(db, name)
    if not type_event:
        type_event = create_type_event(db, name)
    return type_event


# ==================== НОВОСТИ (News) ====================

def get_all_news(db: Session) -> List[db_models.News]:
    """Получить список всех новостей."""
    return db.query(db_models.News).filter(
        db_models.News.date_delete.is_(None)
    ).all()


def get_news_by_id(db: Session, news_id: int) -> Optional[db_models.News]:
    """Получить новость по ID."""
    return db.query(db_models.News).filter(
        db_models.News.id == news_id,
        db_models.News.date_delete.is_(None)
    ).first()


def create_news(db: Session, name: str, category_news_id: Optional[int] = None, 
                city_id: Optional[int] = None, **kwargs) -> db_models.News:
    """Создать новую новость."""
    db_news = db_models.News(
        name=name,
        category_news_id=category_news_id,
        city_id=city_id,
        date_create=datetime.utcnow(),
        date_update=datetime.utcnow(),
        **kwargs
    )
    db.add(db_news)
    db.commit()
    db.refresh(db_news)
    return db_news


def create_photo_news(db: Session, news_id: int, path: str) -> db_models.PhotoNews:
    """Добавить изображение для новости."""
    db_photo = db_models.PhotoNews(
        news_id=news_id,
        path=path,
        date_create=datetime.utcnow(),
        date_update=datetime.utcnow()
    )
    db.add(db_photo)
    db.commit()
    db.refresh(db_photo)
    return db_photo


def get_photo_news_by_path(db: Session, news_id: int, path: str) -> Optional[db_models.PhotoNews]:
    """Получить изображение новости по пути."""
    return db.query(db_models.PhotoNews).filter(
        db_models.PhotoNews.news_id == news_id,
        db_models.PhotoNews.path == path,
        db_models.PhotoNews.date_delete.is_(None)
    ).first()


def delete_photo_news(db: Session, news_id: int, path: str) -> bool:
    """Пометить изображение новости как удаленное."""
    photo_entry = get_photo_news_by_path(db, news_id, path)
    if not photo_entry:
        return False

    photo_entry.date_delete = datetime.utcnow()
    db.commit()
    return True


def create_file_news(db: Session, news_id: int, path: str) -> db_models.FileNews:
    """Добавить файл к новости."""
    db_file = db_models.FileNews(
        news_id=news_id,
        path=path,
        date_create=datetime.utcnow(),
        date_update=datetime.utcnow()
    )
    db.add(db_file)
    db.commit()
    db.refresh(db_file)
    return db_file


def get_file_news_by_path(db: Session, news_id: int, path: str) -> Optional[db_models.FileNews]:
    """Получить файл новости по пути."""
    return db.query(db_models.FileNews).filter(
        db_models.FileNews.news_id == news_id,
        db_models.FileNews.path == path,
        db_models.FileNews.date_delete.is_(None)
    ).first()


def delete_file_news(db: Session, news_id: int, path: str) -> bool:
    """Пометить файл новости как удаленный."""
    file_entry = get_file_news_by_path(db, news_id, path)
    if not file_entry:
        return False

    file_entry.date_delete = datetime.utcnow()
    db.commit()
    return True


def create_hashtag_news(db: Session, news_id: int, name: str) -> db_models.HashtagsNews:
    """Добавить хештег к новости."""
    db_hashtag = db_models.HashtagsNews(
        news_id=news_id,
        name=name,
        date_create=datetime.utcnow(),
        date_update=datetime.utcnow()
    )
    db.add(db_hashtag)
    db.commit()
    db.refresh(db_hashtag)
    return db_hashtag


def update_news(db: Session, news_id: int, **kwargs) -> Optional[db_models.News]:
    """Обновить новость."""
    news = get_news_by_id(db, news_id)
    if not news:
        return None
    
    for key, value in kwargs.items():
        if hasattr(news, key):
            setattr(news, key, value)
    
    news.date_update = datetime.utcnow()
    db.commit()
    db.refresh(news)
    return news

def news_to_dict(news: db_models.News) -> Dict[str, Any]:
    """Преобразует модель новости SQLAlchemy в словарь."""
    # Получаем список изображений
    images = [photo.path for photo in news.photo_news if photo.date_delete is None] if news.photo_news else []
    
    # Получаем список файлов
    files = [file.path for file in news.file_news if file.date_delete is None] if news.file_news else []
    
    # Получаем список тегов
    tags = [hashtag.name for hashtag in news.hashtags_news if hashtag.date_delete is None] if news.hashtags_news else []
    
    return {
        "id": news.id,
        "title": news.name or "",
        "shortDescription": news.description or "",
        "content": news.full_description or "",
        "images": images,
        "files": files,
        "publishDate": news.date_event.isoformat() if news.date_event else "",
        "city": news.city.name if news.city else "Не указан",
        "category": news.category_news.name if news.category_news else "",
        "tags": tags,
    }

# ==================== КАТЕГОРИИ НОВОСТЕЙ (CategoryNews) ====================

def get_category_news_by_name(db: Session, name: str) -> Optional[db_models.CategoryNews]:
    """Получить категорию новостей по названию."""
    return db.query(db_models.CategoryNews).filter(
        db_models.CategoryNews.name == name,
        db_models.CategoryNews.date_delete.is_(None)
    ).first()


def create_category_news(db: Session, name: str) -> db_models.CategoryNews:
    """Создать новую категорию новостей."""
    db_category = db_models.CategoryNews(
        name=name,
        date_create=datetime.utcnow(),
        date_update=datetime.utcnow()
    )
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category


def get_or_create_category_news(db: Session, name: str) -> db_models.CategoryNews:
    """Получить категорию новостей или создать, если не существует."""
    category = get_category_news_by_name(db, name)
    if not category:
        category = create_category_news(db, name)
    return category


# ==================== УЧАСТНИКИ МЕРОПРИЯТИЙ (ParticipantEvent) ====================

def create_participant_event(db: Session, event_id: Optional[int] = None,
                            user_id: Optional[int] = None, 
                            organization_id: Optional[int] = None,
                            status_participant_event_id: Optional[int] = None,
                            representative_organization: Optional[int] = None) -> db_models.ParticipantEvent:
    """Создать запись об участии в мероприятии."""
    db_participant = db_models.ParticipantEvent(
        event_id=event_id,
        user_id=user_id,
        organization_id=organization_id,
        status_participant_event_id=status_participant_event_id,
        representative_organization=representative_organization,
        date_submission=datetime.utcnow(),
        date_create=datetime.utcnow(),
        date_update=datetime.utcnow()
    )
    db.add(db_participant)
    db.commit()
    db.refresh(db_participant)
    return db_participant


def get_participant_events_by_user(db: Session, user_id: int) -> List[db_models.ParticipantEvent]:
    """Получить все участия пользователя в мероприятиях."""
    return db.query(db_models.ParticipantEvent).filter(
        db_models.ParticipantEvent.user_id == user_id,
        db_models.ParticipantEvent.date_delete.is_(None)
    ).all()


def get_participant_event_by_user_and_event(db: Session, user_id: int, event_id: int) -> Optional[db_models.ParticipantEvent]:
    """Получить запись об участии пользователя в конкретном мероприятии."""
    return db.query(db_models.ParticipantEvent).filter(
        db_models.ParticipantEvent.user_id == user_id,
        db_models.ParticipantEvent.event_id == event_id,  # Используйте event_id вместо event
        db_models.ParticipantEvent.date_delete.is_(None)
    ).first()

def get_user_registered_events(db: Session, user_id: int) -> List[db_models.Event]:
    """Получить все мероприятия, на которые зарегистрирован пользователь."""
    participant_events = get_participant_events_by_user(db, user_id)
    events = []
    for participant in participant_events:
        if participant.event_id:
            event = get_event_by_id(db, participant.event_id)
            if event:
                events.append(event)
    return events


def delete_participant_event(db: Session, user_id: int, event_id: int) -> bool:
    """Удалить регистрацию пользователя на мероприятие (мягкое удаление)."""
    participant = get_participant_event_by_user_and_event(db, user_id, event_id)
    if not participant:
        return False
    
    participant.date_delete = datetime.utcnow()
    db.commit()
    return True


# ==================== ИЗБРАННЫЕ (Selected) ====================

def add_selected_event(db: Session, user_id: int, event_id: int) -> db_models.SelectedEvent:
    """Добавить мероприятие в избранное."""
    db_selected = db_models.SelectedEvent(
        user_id=user_id,
        event_id=event_id,
        date_create=datetime.utcnow()
    )
    db.add(db_selected)
    db.commit()
    db.refresh(db_selected)
    return db_selected


def add_selected_news(db: Session, user_id: int, news_id: int) -> db_models.SelectedNews:
    """Добавить новость в избранное."""
    db_selected = db_models.SelectedNews(
        user_id=user_id,
        news_id=news_id,
        date_create=datetime.utcnow()
    )
    db.add(db_selected)
    db.commit()
    db.refresh(db_selected)
    return db_selected


def add_selected_knowledge_base_data(
    db: Session,
    user_id: int,
    kb_id: int,
) -> db_models.SelectedKnowledgeBaseData:
    """Добавить материал базы знаний в избранное."""
    db_selected = db_models.SelectedKnowledgeBaseData(
        user_id=user_id,
        knowledge_base_data_id=kb_id,
        date_create=datetime.utcnow(),
    )
    db.add(db_selected)
    db.commit()
    db.refresh(db_selected)
    return db_selected


def get_selected_event_entry(
    db: Session,
    user_id: int,
    event_id: int,
    include_deleted: bool = False
) -> Optional[db_models.SelectedEvent]:
    """Получить запись об избранном мероприятии по пользователю и событию."""
    query = db.query(db_models.SelectedEvent).filter(
        db_models.SelectedEvent.user_id == user_id,
        db_models.SelectedEvent.event_id == event_id,
    )
    if not include_deleted:
        query = query.filter(db_models.SelectedEvent.date_delete.is_(None))
    return query.first()


def get_selected_news_entry(
    db: Session,
    user_id: int,
    news_id: int,
    include_deleted: bool = False
) -> Optional[db_models.SelectedNews]:
    """Получить запись об избранной новости по пользователю и новости."""
    query = db.query(db_models.SelectedNews).filter(
        db_models.SelectedNews.user_id == user_id,
        db_models.SelectedNews.news_id == news_id,
    )
    if not include_deleted:
        query = query.filter(db_models.SelectedNews.date_delete.is_(None))
    return query.first()


def get_selected_knowledge_base_entry(
    db: Session,
    user_id: int,
    kb_id: int,
    include_deleted: bool = False,
) -> Optional[db_models.SelectedKnowledgeBaseData]:
    """Получить запись об избранном материале базы знаний."""
    query = db.query(db_models.SelectedKnowledgeBaseData).filter(
        db_models.SelectedKnowledgeBaseData.user_id == user_id,
        db_models.SelectedKnowledgeBaseData.knowledge_base_data_id == kb_id,
    )
    if not include_deleted:
        query = query.filter(db_models.SelectedKnowledgeBaseData.date_delete.is_(None))
    return query.first()


def restore_selected_event(
    db: Session,
    selected_event: db_models.SelectedEvent
) -> db_models.SelectedEvent:
    """Восстановить ранее удалённое избранное мероприятие."""
    selected_event.date_delete = None
    selected_event.date_create = datetime.utcnow()
    db.commit()
    db.refresh(selected_event)
    return selected_event


def restore_selected_news(
    db: Session,
    selected_news: db_models.SelectedNews
) -> db_models.SelectedNews:
    """Восстановить ранее удалённую избранную новость."""
    selected_news.date_delete = None
    selected_news.date_create = datetime.utcnow()
    db.commit()
    db.refresh(selected_news)
    return selected_news


def restore_selected_knowledge_base(
    db: Session,
    selected_kb: db_models.SelectedKnowledgeBaseData,
) -> db_models.SelectedKnowledgeBaseData:
    """Восстановить ранее удалённый материал базы знаний из избранного."""
    selected_kb.date_delete = None
    selected_kb.date_create = datetime.utcnow()
    db.commit()
    db.refresh(selected_kb)
    return selected_kb


def remove_selected_event(db: Session, user_id: int, event_id: int) -> bool:
    """Удалить мероприятие из избранного."""
    selected = get_selected_event_entry(db, user_id, event_id)
    
    if selected:
        selected.date_delete = datetime.utcnow()
        db.commit()
        return True
    return False


def remove_selected_news(db: Session, user_id: int, news_id: int) -> bool:
    """Удалить новость из избранного."""
    selected = get_selected_news_entry(db, user_id, news_id)
    
    if selected:
        selected.date_delete = datetime.utcnow()
        db.commit()
        return True
    return False


def remove_selected_knowledge_base(db: Session, user_id: int, kb_id: int) -> bool:
    """Удалить материал базы знаний из избранного."""
    selected = get_selected_knowledge_base_entry(db, user_id, kb_id)

    if selected:
        selected.date_delete = datetime.utcnow()
        db.commit()
        return True
    return False


def get_selected_events_by_user(db: Session, user_id: int) -> List[db_models.Event]:
    """Получить все избранные мероприятия пользователя."""
    selected = db.query(db_models.SelectedEvent).filter(
        db_models.SelectedEvent.user_id == user_id,
        db_models.SelectedEvent.date_delete.is_(None)
    ).all()
    
    return [get_event_by_id(db, s.event_id) for s in selected if get_event_by_id(db, s.event_id)]


def get_selected_news_by_user(db: Session, user_id: int) -> List[db_models.News]:
    """Получить все избранные новости пользователя."""
    selected = db.query(db_models.SelectedNews).filter(
        db_models.SelectedNews.user_id == user_id,
        db_models.SelectedNews.date_delete.is_(None)
    ).all()
    
    return [get_news_by_id(db, s.news_id) for s in selected if get_news_by_id(db, s.news_id)]


def get_selected_knowledge_base_by_user(db: Session, user_id: int) -> List[db_models.KnowledgeBaseData]:
    """Получить все избранные материалы базы знаний пользователя."""
    selected = db.query(db_models.SelectedKnowledgeBaseData).filter(
        db_models.SelectedKnowledgeBaseData.user_id == user_id,
        db_models.SelectedKnowledgeBaseData.date_delete.is_(None),
    ).all()

    result: List[db_models.KnowledgeBaseData] = []
    for s in selected:
        kb = get_knowledge_base_data_by_id(db, s.knowledge_base_data_id)
        if kb:
            result.append(kb)
    return result


def add_selected_organization(db: Session, user_id: int, organization_id: int) -> db_models.SelectedOrganization:
    """Добавить организацию в избранное."""
    db_selected = db_models.SelectedOrganization(
        user_id=user_id,
        organization_id=organization_id,
        date_create=datetime.utcnow()
    )
    db.add(db_selected)
    db.commit()
    db.refresh(db_selected)
    return db_selected


def get_selected_organization_entry(
    db: Session,
    user_id: int,
    organization_id: int,
    include_deleted: bool = False
) -> Optional[db_models.SelectedOrganization]:
    """Получить запись об избранной организации по пользователю и организации."""
    query = db.query(db_models.SelectedOrganization).filter(
        db_models.SelectedOrganization.user_id == user_id,
        db_models.SelectedOrganization.organization_id == organization_id,
    )
    if not include_deleted:
        query = query.filter(db_models.SelectedOrganization.date_delete.is_(None))
    return query.first()


def restore_selected_organization(
    db: Session,
    selected_organization: db_models.SelectedOrganization
) -> db_models.SelectedOrganization:
    """Восстановить ранее удалённую избранную организацию."""
    selected_organization.date_delete = None
    selected_organization.date_create = datetime.utcnow()
    db.commit()
    db.refresh(selected_organization)
    return selected_organization


def remove_selected_organization(db: Session, user_id: int, organization_id: int) -> bool:
    """Удалить организацию из избранного."""
    selected = get_selected_organization_entry(db, user_id, organization_id)
    
    if selected:
        selected.date_delete = datetime.utcnow()
        db.commit()
        return True
    return False


def get_selected_organizations_by_user(db: Session, user_id: int) -> List[db_models.Organization]:
    """Получить все избранные организации пользователя."""
    selected = db.query(db_models.SelectedOrganization).filter(
        db_models.SelectedOrganization.user_id == user_id,
        db_models.SelectedOrganization.date_delete.is_(None)
    ).all()
    
    return [get_organization_by_id(db, s.organization_id) for s in selected if get_organization_by_id(db, s.organization_id)]


# ==================== БАЗА ЗНАНИЙ (KnowledgeBaseData) ====================

def get_all_knowledge_base_data(db: Session) -> List[db_models.KnowledgeBaseData]:
    """Получить список всех данных базы знаний."""
    return db.query(db_models.KnowledgeBaseData).filter(
        db_models.KnowledgeBaseData.date_delete.is_(None)
    ).all()


def get_knowledge_base_data_by_id(db: Session, kb_id: int) -> Optional[db_models.KnowledgeBaseData]:
    """Получить данные базы знаний по ID."""
    return db.query(db_models.KnowledgeBaseData).filter(
        db_models.KnowledgeBaseData.id == kb_id,
        db_models.KnowledgeBaseData.date_delete.is_(None)
    ).first()


def create_knowledge_base_data(db: Session, name: str, 
                                category_knowledge_base_data_id: int,
                                type_material_category_knowledge_base_data_id: int,
                                description: Optional[str] = None,
                                full_description: Optional[str] = None,
                                quantity_views: Optional[int] = None,
                                video_url: Optional[str] = None,
                                material_url: Optional[str] = None) -> db_models.KnowledgeBaseData:
    """Создать запись в базе знаний."""
    db_knowledge = db_models.KnowledgeBaseData(
        name=name,
        description=description,
        full_description=full_description,
        quantity_views=quantity_views,
        video_url=video_url,
        material_url=material_url,
        category_knowledge_base_data_id=category_knowledge_base_data_id,
        type_material_category_knowledge_base_data_id=type_material_category_knowledge_base_data_id,
        date_create=datetime.utcnow(),
        date_update=datetime.utcnow()
    )
    db.add(db_knowledge)
    db.commit()
    db.refresh(db_knowledge)
    return db_knowledge


def knowledge_base_data_to_dict(kb: db_models.KnowledgeBaseData) -> Dict[str, Any]:
    """Преобразует модель базы знаний SQLAlchemy в словарь."""
    # Получаем список материалов (файлов)
    materials = []
    if kb.material_knowledge_base_data:
        materials = [
            {
                "id": material.id,
                "name": material.name,
                "url": material.path,
            }
            for material in kb.material_knowledge_base_data 
            if material.date_delete is None
        ]
    
    return {
        "id": kb.id,
        "title": kb.name,
        "description": kb.description or "",
        "content": kb.full_description or "",
        "category": kb.category_knowledge_base_data.name if kb.category_knowledge_base_data else "",
        "type": kb.type_material_category_knowledge_base_data.name if kb.type_material_category_knowledge_base_data else "",
        "views": kb.quantity_views or 0,
        "publishDate": kb.date_create.isoformat() if kb.date_create else "",
        "videoUrl": kb.video_url if kb.video_url else None,
        "externalLink": kb.material_url if kb.material_url else None,
        "materials": materials,
    }


# ==================== КАТЕГОРИИ БАЗЫ ЗНАНИЙ (CategoryKnowledgeBaseData) ====================

def get_category_knowledge_base_by_name(db: Session, name: str) -> Optional[db_models.CategoryKnowledgeBaseData]:
    """Получить категорию базы знаний по названию."""
    return db.query(db_models.CategoryKnowledgeBaseData).filter(
        db_models.CategoryKnowledgeBaseData.name == name,
        db_models.CategoryKnowledgeBaseData.date_delete.is_(None)
    ).first()


def create_category_knowledge_base(db: Session, name: str) -> db_models.CategoryKnowledgeBaseData:
    """Создать новую категорию базы знаний."""
    db_category = db_models.CategoryKnowledgeBaseData(
        name=name,
        date_create=datetime.utcnow(),
        date_update=datetime.utcnow()
    )
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category


def get_or_create_category_knowledge_base(db: Session, name: str) -> db_models.CategoryKnowledgeBaseData:
    """Получить категорию базы знаний или создать, если не существует."""
    category = get_category_knowledge_base_by_name(db, name)
    if not category:
        category = create_category_knowledge_base(db, name)
    return category


# ==================== ТИПЫ МАТЕРИАЛОВ БАЗЫ ЗНАНИЙ (TypeMaterialCategoryKnowledgeBaseData) ====================

def get_type_material_by_name(db: Session, name: str) -> Optional[db_models.TypeMaterialCategoryKnowledgeBaseData]:
    """Получить тип материала базы знаний по названию."""
    return db.query(db_models.TypeMaterialCategoryKnowledgeBaseData).filter(
        db_models.TypeMaterialCategoryKnowledgeBaseData.name == name,
        db_models.TypeMaterialCategoryKnowledgeBaseData.date_delete.is_(None)
    ).first()


def create_type_material(db: Session, name: str) -> db_models.TypeMaterialCategoryKnowledgeBaseData:
    """Создать новый тип материала базы знаний."""
    db_type = db_models.TypeMaterialCategoryKnowledgeBaseData(
        name=name,
        date_create=datetime.utcnow(),
        date_update=datetime.utcnow()
    )
    db.add(db_type)
    db.commit()
    db.refresh(db_type)
    return db_type


def get_or_create_type_material(db: Session, name: str) -> db_models.TypeMaterialCategoryKnowledgeBaseData:
    """Получить тип материала или создать, если не существует."""
    type_material = get_type_material_by_name(db, name)
    if not type_material:
        type_material = create_type_material(db, name)
    return type_material


# ==================== МАТЕРИАЛЫ БАЗЫ ЗНАНИЙ (MaterialKnowledgeBaseData) ====================

def create_material_knowledge_base_data(db: Session, knowledge_base_data_id: int, 
                                       name: str, path: str) -> db_models.MaterialKnowledgeBaseData:
    """Создать материал базы знаний (файл)."""
    db_material = db_models.MaterialKnowledgeBaseData(
        knowledge_base_data_id=knowledge_base_data_id,
        name=name,
        path=path,
        date_create=datetime.utcnow(),
        date_update=datetime.utcnow()
    )
    db.add(db_material)
    db.commit()
    db.refresh(db_material)
    return db_material


def get_material_knowledge_base_data_by_path(db: Session, knowledge_base_data_id: int, path: str) -> Optional[db_models.MaterialKnowledgeBaseData]:
    """Получить материал базы знаний по пути."""
    return db.query(db_models.MaterialKnowledgeBaseData).filter(
        db_models.MaterialKnowledgeBaseData.knowledge_base_data_id == knowledge_base_data_id,
        db_models.MaterialKnowledgeBaseData.path == path,
        db_models.MaterialKnowledgeBaseData.date_delete.is_(None)
    ).first()


def delete_material_knowledge_base_data(db: Session, knowledge_base_data_id: int, path: str) -> bool:
    """Пометить материал базы знаний как удаленный."""
    material_entry = get_material_knowledge_base_data_by_path(db, knowledge_base_data_id, path)
    if not material_entry:
        return False

    material_entry.date_delete = datetime.utcnow()
    db.commit()
    return True


def update_knowledge_base_data(db: Session, kb_id: int, **kwargs) -> Optional[db_models.KnowledgeBaseData]:
    """Обновить запись базы знаний."""
    kb = get_knowledge_base_data_by_id(db, kb_id)
    if not kb:
        return None
    
    for key, value in kwargs.items():
        if hasattr(kb, key):
            setattr(kb, key, value)
    
    kb.date_update = datetime.utcnow()
    db.commit()
    db.refresh(kb)
    return kb


# ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================

def init_default_roles(db: Session):
    """Инициализация стандартных ролей."""
    default_roles = ["user", "nko", "moderator", "admin"]
    for role_name in default_roles:
        get_or_create_role(db, role_name)
    print("✓ Роли инициализированы")


def init_default_categories(db: Session):
    """Инициализация базовых категорий."""
    # Категории мероприятий
    event_categories = ["Экология", "Образование", "Здравоохранение", "Культура", "Социальная помощь"]
    for cat_name in event_categories:
        get_or_create_category_event(db, cat_name)
    
    # Категории новостей
    news_categories = ["Важное", "Новости", "Анонсы", "Отчеты"]
    for cat_name in news_categories:
        get_or_create_category_news(db, cat_name)
    
    # Общие категории для организаций
    org_categories = ["Благотворительность", "Экология", "Образование", "Культура", "Здоровье"]
    for cat_name in org_categories:
        get_or_create_category(db, cat_name)
    
    print("✓ Категории инициализированы")


def init_default_statuses(db: Session):
    """Инициализация стандартных статусов."""
    # Статусы организаций
    org_statuses = ["Не подана", "На модерации", "Одобрена", "Отклонена"]
    for status_name in org_statuses:
        get_or_create_status_organization(db, status_name)

    # Статусы событий
    for status_name in EVENT_STATUS_PRESETS:
        get_or_create_status_event(db, status_name)
    
    print("✓ Статусы инициализированы")


def init_default_cities(db: Session):
    """Инициализация списка городов с координатами."""
    # Словарь городов с их координатами (широта, долгота)
    cities_data = {
        "Москва": (55.7558, 37.6173),
        "Санкт-Петербург": (59.9343, 30.3351),
        "Нижний Новгород": (56.3269, 44.0075),
        "Екатеринбург": (56.8431, 60.6454),
        "Новосибирск": (55.0084, 82.9357),
        "Северск": (56.6006, 84.8864),
        "Володинск": (56.2314, 43.1876),  # Примерные координаты
        "Волгодонск": (47.4667, 42.1667),
        "Ангарск": (52.5444, 103.8883),
        "Гусиноозерск": (51.2833, 106.5000),
        "Зеленогорск": (56.1128, 94.5981),
        "Иркутск": (52.2864, 104.2807),
        "Кемерово": (55.3547, 86.0873),
        "Новокузнецк": (53.7596, 87.1216),
        "Омск": (54.9885, 73.3242),
        "Оренбург": (51.7682, 55.0974),
        "Пермь": (58.0105, 56.2502),
        "Ростов-на-Дону": (47.2357, 39.7015),
        "Самара": (53.2001, 50.15),
        "Саратов": (51.5336, 46.0342),
        "Тольятти": (53.5303, 49.3461),
        "Уфа": (54.7431, 55.9678),
        "Хабаровск": (48.4802, 135.0719),
        "Челябинск": (55.1644, 61.4368),
        "Ярославль": (57.6266, 39.8938),
        "Нарьян-Мар": (67.6378, 133.3611),
        "Нерюнгри": (56.6684, 124.7205),
        "Петропавловск-Камчатский": (53.0371, 158.6551),
        "Хатанга": (65.8810, 124.9127),
        "Черский": (67.4572, 133.3510),
        "Усть-Ордынский": (66.0834, 123.4156),
        "Минусинск": (53.7102, 91.6871),
        "Канск": (56.2049, 95.7050),
        "Красноярск": (56.0000, 92.7500),
        "Абакан": (53.7167, 91.4167),
        "Кызыл": (51.7167, 94.4167),
        "Улан-Удэ": (51.8267, 107.6167),
        "Биробиджан": (48.7983, 132.9511),
        "Николаевск-на-Амуре": (53.1500, 140.7167),
        "Братск": (56.1500, 101.6167),
        "Вилюйск": (63.7500, 121.6167),
        "Жиганск": (63.5500, 125.3833),
        "Кангалассы": (67.5333, 133.3667),
        "Лебединский": (65.1833, 133.4500),
        "Мирный": (62.7667, 114.9167),
        "Нерюнгри": (56.6684, 124.7205),
        "Нытва": (60.9333, 125.3833),
        "Обнинск": (55.0736, 36.6005),
        "Оймякон": (65.5500, 137.2333),
        "Омчак": (63.4667, 143.3000),
        "Певек": (69.7000, 170.3167),
        "Пеледуй": (68.5333, 161.0833),
        "Покровск": (67.5833, 133.3667),
        "Сангар": (67.1667, 133.4833),
        "Сковородино": (53.9833, 123.9500),
        "Среднеколымск": (67.4833, 153.7167),
        "Сусуман": (62.7833, 148.1667),
        "Табоган": (62.6667, 135.8667),
        "Тура": (64.2833, 125.3333),
        "Усть-Мая": (60.4167, 162.1500),
        "Усть-Нера": (63.8667, 143.1667),
        "Хатанга": (65.8810, 124.9127),
        "Черский": (67.4572, 133.3510),
        "Шимановск": (52.0000, 127.7000),
        "Эльбан": (58.1833, 126.4333),
        "Якутск": (66.6333, 139.8833),
        "Усть-Алдан": (67.4167, 133.3667),
        "Усть-Камчатск": (56.2333, 160.1667),
        "Усть-Кут": (56.7833, 105.7167),
        "Усть-Кутам": (67.4667, 133.3500),
        "Усть-Мая": (60.4167, 162.1500),
        "Усть-Нера": (63.8667, 143.1667),
        "Усть-Ордынский": (66.0834, 123.4156),
        "Усть-Уда": (66.4833, 112.3000),
        "Усть-Улаган": (66.5167, 113.2833),
    }
    
    for city_name, (lat, long) in cities_data.items():
        city = get_city_by_name(db, city_name)
        if not city:
            create_city(db, city_name, lat=lat, long=long)
        else:
            # Обновляем координаты, если они не заданы
            if not city.lat or not city.long:
                city.lat = lat
                city.long = long
                city.date_update = datetime.utcnow()
                db.commit()
    
    print("✓ Города инициализированы")
