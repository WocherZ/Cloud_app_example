from datetime import datetime, timedelta, timezone
from typing import Optional
import uuid

from fastapi import APIRouter, Depends, HTTPException, status, Form, File, UploadFile
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from . import models, db_operations
from .config import settings
from .db_session import get_db
from .minio_client import get_minio_client

# --- Настройки ---
SECRET_KEY = settings.SECRET_KEY
ALGORITHM = settings.ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

router = APIRouter(
    prefix="/auth",
    tags=["Авторизация и регистрация"],
)

# --- Функции-утилиты ---
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password):
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


# --- Эндпоинты ---
@router.post("/register/user", status_code=status.HTTP_201_CREATED)
def register_user(form_data: models.UserCreate, db: Session = Depends(get_db)):
    """Регистрация обычного пользователя (волонтера)."""
    # Проверяем, не занят ли email
    existing_user = db_operations.get_user_by_email(db, form_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    
    # Получаем роль 'user'
    user_role = db_operations.get_or_create_role(db, "user")
    
    # Получаем или создаем город
    city_id = None
    if hasattr(form_data, 'city_name') and form_data.city_name:
        city = db_operations.get_or_create_city(db, form_data.city_name)
        city_id = city.id
    
    # Хешируем пароль
    hashed_password = get_password_hash(form_data.password)
    
    # Создаем пользователя в БД
    new_user = db_operations.create_user(
        db=db,
        email=form_data.email,
        password_hash=hashed_password,
        name=form_data.name,
        role_id=user_role.id,
        city_id=city_id,
        surname=None,
        patronymic=None
    )
    
    return {"success": True, "message": "User registered successfully", "user_id": new_user.id}


@router.post("/register/nko", status_code=status.HTTP_201_CREATED)
def register_nko(form_data: models.NkoCreate, db: Session = Depends(get_db)):
    """Регистрация представителя НКО."""
    # Проверяем, не занят ли email
    existing_user = db_operations.get_user_by_email(db, form_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    
    # Получаем роль 'nko'
    nko_role = db_operations.get_or_create_role(db, "nko")
    
    # Создаем организацию
    new_organization = db_operations.create_organization(
        db=db,
        name=form_data.organization_name,
        pens=None
    )
    
    # Хешируем пароль
    hashed_password = get_password_hash(form_data.password)
    
    # Создаем пользователя с привязкой к организации
    new_user = db_operations.create_user(
        db=db,
        email=form_data.email,
        password_hash=hashed_password,
        name=form_data.organization_name,  # Используем название НКО как имя
        role_id=nko_role.id,
        organization_id=new_organization.id,
        surname=None,
        patronymic=None
    )
    
    return {
        "success": True, 
        "message": "NKO registered successfully",
        "user_id": new_user.id,
        "organization_id": new_organization.id
    }


@router.post("/login", response_model=models.Token)
def login_for_access_token(form_data: models.UserLogin, db: Session = Depends(get_db)):
    """Вход и получение JWT токена."""
    # Получаем пользователя из БД
    user = db_operations.get_user_by_email(db, form_data.email)
    
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Создаем JWT токен
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "role": user.role.name}, 
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/register/representative", status_code=status.HTTP_201_CREATED)
def register_nko_representative(form_data: models.RepresentativeCreate, db: Session = Depends(get_db)):
    """Регистрация представителя существующей НКО."""
    # Проверяем, не занят ли email
    existing_user = db_operations.get_user_by_email(db, form_data.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Ищем организацию по email (а не пользователя)
    target_organization = db_operations.get_organization_by_email(db, form_data.nko_email)
    if not target_organization:
        raise HTTPException(status_code=404, detail="Target NKO not found")
    
    # Проверяем, что организация одобрена
    status_approved = db_operations.get_status_organization_by_name(db, "Одобрена")
    if not status_approved or target_organization.status_organization_id != status_approved.id:
        raise HTTPException(status_code=400, detail="Target NKO is not approved")

    # Получаем роль 'nko'
    nko_role = db_operations.get_or_create_role(db, "nko")
    
    # Хешируем пароль
    hashed_password = get_password_hash(form_data.password)

    # Получаем или создаем город
    city_id = None
    if hasattr(form_data, 'city_name') and form_data.city_name:
        city = db_operations.get_or_create_city(db, form_data.city_name)
        city_id = city.id
    
    # Создаем пользователя с привязкой к организации
    # В реальном приложении статус привязки должен быть pending до одобрения
    new_user = db_operations.create_user(
        db=db,
        email=form_data.email,
        password_hash=hashed_password,
        name=form_data.name,
        role_id=nko_role.id,
        organization_id=target_organization.id,  # Привязываем к организации
        city_id=city_id,
        surname=None,
        patronymic=None
    )
    
    # В реальном приложении здесь бы отправлялось уведомление админам
    return {
        "success": True, 
        "message": "Representative application submitted successfully",
        "user_id": new_user.id
    }


@router.post("/register/nko-application", status_code=status.HTTP_201_CREATED)
def register_new_nko_application(
    user_email: str = Form(...), 
    user_password: str = Form(...), 
    user_city: str = Form(...), 
    user_name: str = Form(...),
    organization_name: str = Form(...), 
    category: str = Form(...), 
    description: str = Form(...),
    address: Optional[str] = Form(None), 
    phone: Optional[str] = Form(None), 
    website: Optional[str] = Form(None),
    founded_year: Optional[str] = Form(None), 
    volunteers_count: Optional[str] = Form(None),
    logo: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    """Принимает заявку на регистрацию новой НКО и ее представителя."""
    # 1. Проверяем, не заняты ли email'ы
    existing_user = db_operations.get_user_by_email(db, user_email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Пользователь с таким email уже существует")

    # Проверяем уникальность названия организации
    existing_org = db_operations.get_organization_by_name(db, organization_name)
    if existing_org:
        raise HTTPException(status_code=400, detail="Организация с таким названием уже существует")

    # 2. Обрабатываем логотип
    logo_url = None
    if logo:
        file_extension = logo.filename.split(".")[-1] if logo.filename and "." in logo.filename else "jpg"
        unique_filename = f"{uuid.uuid4()}.{file_extension}"
        file_location = f"static/logos/{unique_filename}"
        
        # Читаем содержимое файла
        file_data = logo.file.read()
        
        # Определяем content-type
        content_type = logo.content_type or f"image/{file_extension}"
        
        # Сохраняем файл в MinIO
        minio_client = get_minio_client()
        try:
            minio_client.put_file(file_location, file_data, content_type=content_type)
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Не удалось сохранить логотип в MinIO: {exc}",
            ) from exc
        
        logo_url = file_location

    # 3. Получаем или создаем необходимые справочники
    city = db_operations.get_or_create_city(db, user_city)
    category_obj = db_operations.get_or_create_category(db, category)
    status_pending = db_operations.get_or_create_status_organization(db, "На модерации")
    
    # 4. Создаем организацию в БД с полной информацией
    new_organization = db_operations.create_organization(
        db=db,
        name=organization_name,
        short_name=organization_name,  # Можно добавить отдельное поле в форму
        email=user_email,
        city_id=city.id,
        status_organization_id=status_pending.id,
        id_category=category_obj.id,
        description=description,
        address=address,
        phone=phone,
        website=website,
        founded_year=int(founded_year) if founded_year else None,
        path_to_logo=logo_url,
    )
    
    # 5. Получаем роль 'nko'
    nko_role = db_operations.get_or_create_role(db, "nko")

    # 6. Создаем пользователя-представителя
    hashed_password = get_password_hash(user_password)
    new_user = db_operations.create_user(
        db=db,
        email=user_email,
        password_hash=hashed_password,
        name=user_name,
        role_id=nko_role.id,
        organization_id=new_organization.id,
        city_id=city.id,
        surname=None,
        patronymic=None
    )
    
    return {
        "success": True, 
        "message": "NKO application submitted successfully",
        "user_id": new_user.id,
        "organization_id": new_organization.id
    }