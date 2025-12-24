from fastapi import Depends, HTTPException, status
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from . import auth, db_operations, models
from .db_session import get_db


def get_current_user(token: str = Depends(auth.oauth2_scheme), db: Session = Depends(get_db)):
    """Получает текущего аутентифицированного пользователя из БД."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = models.TokenData(email=email)
    except JWTError:
        raise credentials_exception
    
    # Получаем пользователя из БД
    user = db_operations.get_user_by_email(db, token_data.email)
    if user is None:
        raise credentials_exception
    
    # Возвращаем пользователя в формате словаря для совместимости
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "surname": user.surname or "",
        "patronymic": user.patronymic or "",
        "role": user.role.name if user.role else "user",
        "organization_id": user.organization_id,
        "city_name": user.city.name if user.city else "Не указан",
        "user_photo": user.user_photo
    }


def get_current_admin_or_moderator(current_user: dict = Depends(get_current_user)):
    """Проверяет, что пользователь - администратор или модератор."""
    if current_user.get("role") not in ["admin", "moderator"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this resource",
        )
    return current_user


def get_current_active_nko(current_user: dict = Depends(get_current_user)):
    """Проверяет, что пользователь - представитель НКО."""
    if current_user.get("role") != "nko":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operation not permitted for this user role",
        )
    return current_user


def get_current_admin(current_user: dict = Depends(get_current_user)):
    """Проверяет, что текущий пользователь является администратором."""
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This action requires admin privileges",
        )
    return current_user