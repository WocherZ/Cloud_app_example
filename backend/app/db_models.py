"""
SQLAlchemy модели для базы данных.
Содержит определения всех таблиц согласно схеме БД energy_goodness_db.
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()


# 1. Категория (общая)
class Category(Base):
    __tablename__ = "category"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    date_create = Column(DateTime, default=datetime.utcnow)
    date_update = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    date_delete = Column(DateTime, nullable=True)
    
    # Relationships
    organizations = relationship("Organization", back_populates="category")


# 2. Категория мероприятия
class CategoryEvent(Base):
    __tablename__ = "category_event"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    date_create = Column(DateTime, default=datetime.utcnow)
    date_update = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    date_delete = Column(DateTime, nullable=True)
    
    # Relationships
    events = relationship("Event", back_populates="category_event")


# 3. Категория базы знаний
class CategoryKnowledgeBaseData(Base):
    __tablename__ = "category_knowledge_base_data"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    date_create = Column(DateTime, default=datetime.utcnow)
    date_update = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    date_delete = Column(DateTime, nullable=True)
    
    # Relationships
    knowledge_base_data = relationship("KnowledgeBaseData", back_populates="category_knowledge_base_data")


# 4. Категория новостей
class CategoryNews(Base):
    __tablename__ = "category_news"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    date_create = Column(DateTime, default=datetime.utcnow)
    date_update = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    date_delete = Column(DateTime, nullable=True)
    
    # Relationships
    news = relationship("News", back_populates="category_news")


# 5. Город
class City(Base):
    __tablename__ = "city"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    lat = Column(Float, nullable=True)  # Широта
    long = Column(Float, nullable=True)  # Долгота
    date_create = Column(DateTime, default=datetime.utcnow)
    date_update = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    date_delete = Column(DateTime, nullable=True)
    
    # Relationships
    news = relationship("News", back_populates="city")
    organizations = relationship("Organization", back_populates="city")
    users = relationship("User", back_populates="city")


# 6. Роль
class Role(Base):
    __tablename__ = "role"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    date_create = Column(DateTime, default=datetime.utcnow)
    date_update = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    date_delete = Column(DateTime, nullable=True)
    
    # Relationships
    users = relationship("User", back_populates="role")


# 7. Статус организации
class StatusOrganization(Base):
    __tablename__ = "status_organization"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    date_create = Column(DateTime, default=datetime.utcnow)
    date_update = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    date_delete = Column(DateTime, nullable=True)
    
    # Relationships
    organizations = relationship("Organization", back_populates="status_organization")


# 8. Статус участника мероприятия
class StatusParticipantEvent(Base):
    __tablename__ = "status_participant_event"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    date_create = Column(DateTime, default=datetime.utcnow)
    date_update = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    date_delete = Column(DateTime, nullable=True)
    
    # Relationships
    participant_events = relationship("ParticipantEvent", back_populates="status_participant_event")


# 9. Статус события
class StatusEvent(Base):
    __tablename__ = "status_event"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    date_create = Column(DateTime, default=datetime.utcnow)
    date_update = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    date_delete = Column(DateTime, nullable=True)

    # Relationships
    events = relationship("Event", back_populates="status_event")


# 10. Тип мероприятия
class TypeEvent(Base):
    __tablename__ = "type_event"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    date_create = Column(DateTime, default=datetime.utcnow)
    date_update = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    date_delete = Column(DateTime, nullable=True)
    
    # Relationships
    events = relationship("Event", back_populates="type_event")


# 11. Тип материала категории базы знаний
class TypeMaterialCategoryKnowledgeBaseData(Base):
    __tablename__ = "type_material_category_knowledge_base_data"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    date_create = Column(DateTime, default=datetime.utcnow)
    date_update = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    date_delete = Column(DateTime, nullable=True)
    
    # Relationships
    knowledge_base_data = relationship("KnowledgeBaseData", back_populates="type_material_category_knowledge_base_data")


# 12. Тип социальной сети
class TypeSocialMedia(Base):
    __tablename__ = "type_social_media"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    path = Column(String(255), nullable=False)
    date_create = Column(DateTime, default=datetime.utcnow)
    date_update = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    date_delete = Column(DateTime, nullable=True)
    
    # Relationships
    social_media_organizations = relationship("SocialMediaOrganization", back_populates="type_social_media")


# 13. База знаний
class KnowledgeBaseData(Base):
    __tablename__ = "knowledge_base_data"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    full_description = Column(Text, nullable=True)
    quantity_views = Column(Integer, nullable=True)
    video_url = Column(String(500), nullable=True)
    material_url = Column(String(500), nullable=True)
    category_knowledge_base_data_id = Column(Integer, ForeignKey("category_knowledge_base_data.id"), nullable=False)
    type_material_category_knowledge_base_data_id = Column(Integer, ForeignKey("type_material_category_knowledge_base_data.id"), nullable=False)
    date_create = Column(DateTime, default=datetime.utcnow)
    date_update = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    date_delete = Column(DateTime, nullable=True)
    
    # Relationships
    category_knowledge_base_data = relationship("CategoryKnowledgeBaseData", back_populates="knowledge_base_data")
    type_material_category_knowledge_base_data = relationship("TypeMaterialCategoryKnowledgeBaseData", back_populates="knowledge_base_data")
    material_knowledge_base_data = relationship("MaterialKnowledgeBaseData", back_populates="knowledge_base_data")
    selected_knowledge_base_data = relationship("SelectedKnowledgeBaseData", back_populates="knowledge_base_data")


# 14. Материалы базы знаний
class MaterialKnowledgeBaseData(Base):
    __tablename__ = "material_knowledge_base_data"
    
    id = Column(Integer, primary_key=True, index=True)
    knowledge_base_data_id = Column(Integer, ForeignKey("knowledge_base_data.id"), nullable=False)
    name = Column(String(255), nullable=False)
    path = Column(String(255), nullable=False)
    date_create = Column(DateTime, default=datetime.utcnow)
    date_update = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    date_delete = Column(DateTime, nullable=True)
    
    # Relationship
    knowledge_base_data = relationship("KnowledgeBaseData", back_populates="material_knowledge_base_data")


# 15. Новости
class News(Base):
    __tablename__ = "news"
    
    id = Column(Integer, primary_key=True, index=True)
    category_news_id = Column(Integer, ForeignKey("category_news.id"), nullable=True)
    name = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    full_description = Column(Text, nullable=True)
    date_event = Column(DateTime, nullable=True)
    city_id = Column(Integer, ForeignKey("city.id"), nullable=True)
    date_create = Column(DateTime, default=datetime.utcnow)
    date_update = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    date_delete = Column(DateTime, nullable=True)
    
    # Relationships
    category_news = relationship("CategoryNews", back_populates="news")
    city = relationship("City", back_populates="news")
    photo_news = relationship("PhotoNews", back_populates="news")
    file_news = relationship("FileNews", back_populates="news")
    hashtags_news = relationship("HashtagsNews", back_populates="news")
    selected_news = relationship("SelectedNews", back_populates="news")


# 16. Организация
class Organization(Base):
    __tablename__ = "organization"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=True)
    short_name = Column(String(255), nullable=True)
    path_to_logo = Column(String(255), nullable=True)
    cover_image = Column(String(255), nullable=True)
    id_category = Column(Integer, ForeignKey("category.id"), nullable=True)
    description = Column(Text, nullable=True)
    full_description = Column(Text, nullable=True)
    volunteer_role = Column(String(255), nullable=True)
    address = Column(String(255), nullable=True)
    website = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    founded_year = Column(Integer, nullable=True)
    email = Column(String(255), nullable=True)
    city_id = Column(Integer, ForeignKey("city.id"), nullable=True)
    status_organization_id = Column(Integer, ForeignKey("status_organization.id"), nullable=True)
    reason_rejection = Column(Text, nullable=True)
    date_create = Column(DateTime, default=datetime.utcnow)
    date_update = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    date_delete = Column(DateTime, nullable=True)
    
    # Relationships
    category = relationship("Category", back_populates="organizations")
    city = relationship("City", back_populates="organizations")
    status_organization = relationship("StatusOrganization", back_populates="organizations")
    photo_organizations = relationship("PhotoOrganization", back_populates="organization")
    social_media_organizations = relationship("SocialMediaOrganization", back_populates="organization")
    users = relationship("User", back_populates="organization")
    events = relationship("Event", back_populates="organization")
    participant_events = relationship("ParticipantEvent", back_populates="organization", foreign_keys="[ParticipantEvent.organization_id]")
    selected_organizations = relationship("SelectedOrganization", back_populates="organization")


# 17. Фото новостей
class PhotoNews(Base):
    __tablename__ = "photo_news"
    
    id = Column(Integer, primary_key=True, index=True)
    news_id = Column(Integer, ForeignKey("news.id"), nullable=False)
    path = Column(String(255), nullable=False)
    date_create = Column(DateTime, default=datetime.utcnow)
    date_update = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    date_delete = Column(DateTime, nullable=True)
    
    # Relationship
    news = relationship("News", back_populates="photo_news")


# 18. Фото организации
class PhotoOrganization(Base):
    __tablename__ = "photo_organization"
    
    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organization.id"), nullable=False)
    path = Column(String(255), nullable=True)
    date_create = Column(DateTime, default=datetime.utcnow)
    date_update = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    date_delete = Column(DateTime, nullable=True)
    
    # Relationship
    organization = relationship("Organization", back_populates="photo_organizations")


# 19. Социальные сети организации
class SocialMediaOrganization(Base):
    __tablename__ = "social_media_organization"
    
    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organization.id"), nullable=False)
    type_social_media_id = Column(Integer, ForeignKey("type_social_media.id"), nullable=False)
    link = Column(String(255), nullable=False)
    date_create = Column(DateTime, default=datetime.utcnow)
    date_update = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    date_delete = Column(DateTime, nullable=True)
    
    # Relationships
    organization = relationship("Organization", back_populates="social_media_organizations")
    type_social_media = relationship("TypeSocialMedia", back_populates="social_media_organizations")


# 20. Пользователь
class User(Base):
    __tablename__ = "user"
    
    id = Column(Integer, primary_key=True, index=True)
    surname = Column(String(255), nullable=True)
    name = Column(String(255), nullable=True)
    patronymic = Column(String(255), nullable=True)
    email = Column(String(255), nullable=True, unique=True, index=True)
    city_id = Column(Integer, ForeignKey("city.id"), nullable=True)
    organization_id = Column(Integer, ForeignKey("organization.id"), nullable=True)
    role_id = Column(Integer, ForeignKey("role.id"), nullable=True)
    password_hash = Column(String(255), nullable=True)
    user_photo = Column(String(255), nullable=True)
    date_create = Column(DateTime, default=datetime.utcnow)
    date_update = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    date_delete = Column(DateTime, nullable=True)
    
    # Relationships
    city = relationship("City", back_populates="users")
    organization = relationship("Organization", back_populates="users")
    role = relationship("Role", back_populates="users")
    participant_events = relationship("ParticipantEvent", back_populates="user", foreign_keys="[ParticipantEvent.user_id]")
    representative_participant_events = relationship("ParticipantEvent", back_populates="representative_user", foreign_keys="[ParticipantEvent.representative_organization]")
    selected_events = relationship("SelectedEvent", back_populates="user")
    selected_knowledge_base_data = relationship("SelectedKnowledgeBaseData", back_populates="user")
    selected_news = relationship("SelectedNews", back_populates="user")
    selected_organizations = relationship("SelectedOrganization", back_populates="user")


# 21. Мероприятие
class Event(Base):
    __tablename__ = "event"
    
    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organization.id"), nullable=True)
    name = Column(String(255), nullable=True)
    date_time_event = Column(DateTime, nullable=True)  # Дата и время проведения мероприятия
    date_before_register = Column(DateTime, nullable=True)  # Крайний срок регистрации
    description = Column(Text, nullable=True)
    full_description = Column(Text, nullable=True)
    address = Column(String(255), nullable=True)
    type_event_id = Column(Integer, ForeignKey("type_event.id"), nullable=True)
    quantity_participant = Column(Integer, nullable=True)
    category_event_id = Column(Integer, ForeignKey("category_event.id"), nullable=True)
    status_event_id = Column(Integer, ForeignKey("status_event.id"), nullable=False)
    reason_rejection = Column(Text, nullable=True)
    date_create = Column(DateTime, default=datetime.utcnow)
    date_update = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    date_delete = Column(DateTime, nullable=True)
    
    # Relationships
    organization = relationship("Organization", back_populates="events")
    type_event = relationship("TypeEvent", back_populates="events")
    category_event = relationship("CategoryEvent", back_populates="events")
    status_event = relationship("StatusEvent", back_populates="events")
    file_events = relationship("FileEvent", back_populates="event")
    hashtag_events = relationship("HashtagEvent", back_populates="event")
    photo_events = relationship("PhotoEvent", back_populates="event")
    selected_events = relationship("SelectedEvent", back_populates="event")
    participant_events = relationship("ParticipantEvent", back_populates="event")


# 22. Файлы мероприятия
class FileEvent(Base):
    __tablename__ = "file_event"
    
    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("event.id"), nullable=False)
    path = Column(String(255), nullable=True)
    date_create = Column(DateTime, default=datetime.utcnow)
    date_update = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    date_delete = Column(DateTime, nullable=True)
    
    # Relationship
    event = relationship("Event", back_populates="file_events")


# 23. Файлы новостей
class FileNews(Base):
    __tablename__ = "file_news"
    
    id = Column(Integer, primary_key=True, index=True)
    news_id = Column(Integer, ForeignKey("news.id"), nullable=True)
    path = Column(String(255), nullable=True)
    date_create = Column(DateTime, default=datetime.utcnow)
    date_update = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    date_delete = Column(DateTime, nullable=True)
    
    # Relationship
    news = relationship("News", back_populates="file_news")


# 24. Хештеги мероприятия
class HashtagEvent(Base):
    __tablename__ = "hashtag_event"
    
    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("event.id"), nullable=False)
    name = Column(String(255), nullable=True)
    date_create = Column(DateTime, default=datetime.utcnow)
    date_update = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    date_delete = Column(DateTime, nullable=True)
    
    # Relationship
    event = relationship("Event", back_populates="hashtag_events")


# 25. Хештеги новостей
class HashtagsNews(Base):
    __tablename__ = "hashtags_news"
    
    id = Column(Integer, primary_key=True, index=True)
    news_id = Column(Integer, ForeignKey("news.id"), nullable=False)
    name = Column(String(255), nullable=False)
    date_create = Column(DateTime, default=datetime.utcnow)
    date_update = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    date_delete = Column(DateTime, nullable=True)
    
    # Relationship
    news = relationship("News", back_populates="hashtags_news")


# 26. Участник мероприятия
class ParticipantEvent(Base):
    __tablename__ = "participant_event"
    
    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("event.id"), nullable=True)
    organization_id = Column(Integer, ForeignKey("organization.id"), nullable=True)
    user_id = Column(Integer, ForeignKey("user.id"), nullable=True)
    status_participant_event_id = Column(Integer, ForeignKey("status_participant_event.id"), nullable=True)
    representative_organization = Column(Integer, ForeignKey("user.id"), nullable=True)
    date_submission = Column(DateTime, nullable=True)
    date_decision = Column(DateTime, nullable=True)
    date_create = Column(DateTime, default=datetime.utcnow)
    date_update = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    date_delete = Column(DateTime, nullable=True)
    
    # Relationships
    event = relationship("Event", back_populates="participant_events", foreign_keys=[event_id])
    organization = relationship("Organization", back_populates="participant_events", foreign_keys=[organization_id])
    user = relationship("User", back_populates="participant_events", foreign_keys=[user_id])
    representative_user = relationship("User", back_populates="representative_participant_events", foreign_keys=[representative_organization])
    status_participant_event = relationship("StatusParticipantEvent", back_populates="participant_events")


# 27. Фото мероприятия
class PhotoEvent(Base):
    __tablename__ = "photo_event"
    
    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("event.id"), nullable=False)
    path = Column(String(255), nullable=True)
    date_create = Column(DateTime, default=datetime.utcnow)
    date_update = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    date_delete = Column(DateTime, nullable=True)
    
    # Relationship
    event = relationship("Event", back_populates="photo_events")


# 28. Избранные мероприятия
class SelectedEvent(Base):
    __tablename__ = "selected_event"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("user.id"), nullable=False)
    event_id = Column(Integer, ForeignKey("event.id"), nullable=False)
    date_create = Column(DateTime, default=datetime.utcnow)
    date_delete = Column(DateTime, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="selected_events")
    event = relationship("Event", back_populates="selected_events")


# 29. Избранная база знаний
class SelectedKnowledgeBaseData(Base):
    __tablename__ = "selected_knowledge_base_data"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("user.id"), nullable=False)
    knowledge_base_data_id = Column(Integer, ForeignKey("knowledge_base_data.id"), nullable=False)
    date_create = Column(DateTime, default=datetime.utcnow)
    date_update = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    date_delete = Column(DateTime, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="selected_knowledge_base_data")
    knowledge_base_data = relationship("KnowledgeBaseData", back_populates="selected_knowledge_base_data")


# 30. Избранные новости
class SelectedNews(Base):
    __tablename__ = "selected_news"
    
    id = Column(Integer, primary_key=True, index=True)
    news_id = Column(Integer, ForeignKey("news.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("user.id"), nullable=False)
    date_create = Column(DateTime, default=datetime.utcnow)
    date_delete = Column(DateTime, nullable=True)
    
    # Relationships
    news = relationship("News", back_populates="selected_news")
    user = relationship("User", back_populates="selected_news")


# 31. Избранные организации
class SelectedOrganization(Base):
    __tablename__ = "selected_organization"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("user.id"), nullable=False)
    organization_id = Column(Integer, ForeignKey("organization.id"), nullable=False)
    date_create = Column(DateTime, default=datetime.utcnow)
    date_delete = Column(DateTime, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="selected_organizations")
    organization = relationship("Organization", back_populates="selected_organizations")
