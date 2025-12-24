from datetime import datetime
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from typing import Dict


class UserBase(BaseModel):
    email: EmailStr
    name: str
    city_name: str
    role: str
    user_photo: Optional[str] = None
    organization_id: Optional[int] = None 

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    city_name: str
    name: str
    

class NkoCreate(BaseModel):
    email: EmailStr
    password: str
    organization_name: str # Имя организации при регистрации


class UserInDB(UserBase):
    hashed_password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: Optional[str] = None


class UserProfile(UserBase):
    pass


class UserCityUpdate(BaseModel):
    city_name: str


class UserNameUpdate(BaseModel):
    name: str


class EventRegistration(BaseModel):
    event_id: int


# Модели для НКО профиля
class NkoProfileUpdate(BaseModel):
    category: Optional[str] = Field(None, description="Категория/направление деятельности")
    description: Optional[str] = Field(None, description="Краткое описание деятельности")
    address: Optional[str] = Field(None, description="Адрес (если есть)")
    website_url: Optional[str] = Field(None, description="Ссылка на сайт")
    social_links: List[str] = Field([], description="Ссылки на соцсети")


class NkoProfile(NkoProfileUpdate):
    organization_name: str
    email: EmailStr
    city_name: str  
    is_moderated: bool = False
    logo_url: Optional[str] = None # Ссылка на логотип
    moderation_status: str = Field("not_submitted", description="Статус модерации: not_submitted, pending, approved, rejected")
    rejection_reason: Optional[str] = Field(None, description="Причина отклонения заявки")


class RejectBody(BaseModel):
    reason: str


# --- Новые модели для постов (контента) ---
class PostBase(BaseModel):
    title: str
    content: str


class PostCreate(PostBase):
    pass


class PostInDB(PostBase):
    id: str
    author_email: EmailStr
    status: str = Field("draft", description="Статус поста: draft, pending, approved, rejected")
    rejection_reason: Optional[str] = None


class UserRoleUpdate(BaseModel):
    role: str


class UserWithRole(BaseModel):
    id: int
    email: EmailStr
    name: str
    surname: Optional[str] = None
    patronymic: Optional[str] = None
    role_id: Optional[int] = None
    role_name: Optional[str] = None
    city_id: Optional[int] = None
    city_name: Optional[str] = None
    organization_id: Optional[int] = None
    user_photo: Optional[str] = None
    date_create: Optional[datetime] = None


class RepresentativeCreate(UserCreate):
    # Эта модель наследует email, password, city_name, name от UserCreate
    nko_email: EmailStr # Email организации, к которой хочет присоединиться пользователь


class NkoProfileUpdate(BaseModel):
    category: Optional[str] = Field(None, description="Категория/направление деятельности")
    description: Optional[str] = Field(None, description="Краткое описание деятельности")
    address: Optional[str] = Field(None, description="Адрес (если есть)")
    phone: Optional[str] = Field(None, description="Контактный телефон") # <-- НОВОЕ
    website_url: Optional[str] = Field(None, description="Ссылка на сайт")
    founded_year: Optional[int] = Field(None, description="Год основания") # <-- НОВОЕ
    volunteers_count: Optional[int] = Field(None, description="Количество волонтеров") # <-- НОВОЕ
    social_links: List[str] = Field([], description="Ссылки на соцсети")