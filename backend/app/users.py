from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from . import models, dependencies, db_operations
from .db_session import get_db


router = APIRouter(
    prefix="/users",
    tags=["Пользовательские данные"],
    dependencies=[Depends(dependencies.get_current_user)],
)


@router.get("/me", response_model=models.UserProfile)
def read_users_me(current_user: dict = Depends(dependencies.get_current_user)):
    """Получение данных о текущем залогиненном пользователе."""
    return current_user


@router.patch("/me/city", response_model=models.UserProfile)
def update_user_city(
    city_update: models.UserCityUpdate,
    current_user: dict = Depends(dependencies.get_current_user),
    db: Session = Depends(get_db),
):
    """Обновление города пользователя."""
    # Получаем или создаем город в таблице City
    city = db_operations.get_or_create_city(db, city_update.city_name)
    
    # Обновляем city_id в таблице User
    updated_user = db_operations.update_user(
        db, current_user["id"], city_id=city.id
    )
    
    if not updated_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Возвращаем обновленного пользователя в формате UserProfile
    return {
        "email": updated_user.email,
        "name": updated_user.name,
        "city_name": city.name,
        "role": updated_user.role.name if updated_user.role else "user",
        "user_photo": updated_user.user_photo
    }


@router.patch("/me/name", response_model=models.UserProfile)
def update_user_name(
    name_update: models.UserNameUpdate,
    current_user: dict = Depends(dependencies.get_current_user),
    db: Session = Depends(get_db),
):
    """Обновление имени пользователя."""
    # Обновляем name в таблице User
    updated_user = db_operations.update_user(
        db, current_user["id"], name=name_update.name
    )
    
    if not updated_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Возвращаем обновленного пользователя в формате UserProfile
    return {
        "email": updated_user.email,
        "name": updated_user.name,
        "city_name": updated_user.city.name if updated_user.city else "Не указан",
        "role": updated_user.role.name if updated_user.role else "user",
        "user_photo": updated_user.user_photo
    }


@router.post("/me/events/register", status_code=status.HTTP_201_CREATED)
def register_for_event(
    registration: models.EventRegistration,
    current_user: dict = Depends(dependencies.get_current_user),
    db: Session = Depends(get_db),
):
    """Запись текущего пользователя на событие."""
    # Проверяем, что событие существует
    event = db_operations.get_event_by_id(db, registration.event_id)
    if not event:
        raise HTTPException(
            status_code=404,
            detail="Event not found"
        )
    
    # Проверяем, не записан ли уже пользователь на это событие
    existing_participation = db_operations.get_participant_event_by_user_and_event(
        db, current_user["id"], registration.event_id
    )
    if existing_participation:
        raise HTTPException(
            status_code=400,
            detail="User is already registered for this event"
        )
    
    # Создаем запись об участии
    participant = db_operations.create_participant_event(
        db,
        event_id=registration.event_id,
        user_id=current_user["id"]
    )
    
    return {
        "success": True,
        "message": "Successfully registered for event",
        "participant_id": participant.id,
        "event_id": registration.event_id
    }


@router.get("/me/events")
def get_user_registered_events(
    current_user: dict = Depends(dependencies.get_current_user),
    db: Session = Depends(get_db),
):
    """Получить все мероприятия, на которые зарегистрирован пользователь."""
    events_list = db_operations.get_user_registered_events(db, current_user["id"])
    
    # Преобразуем в словари
    events = [db_operations.event_to_dict(e) for e in events_list]
    
    # Сортировка по дате
    events = sorted(events, key=lambda x: x.get('date', ''))
    
    return events


@router.delete("/me/events/{event_id}", status_code=status.HTTP_200_OK)
def unregister_from_event(
    event_id: int,
    current_user: dict = Depends(dependencies.get_current_user),
    db: Session = Depends(get_db),
):
    """Удалить регистрацию текущего пользователя с мероприятия."""
    # Проверяем, что событие существует
    event = db_operations.get_event_by_id(db, event_id)
    if not event:
        raise HTTPException(
            status_code=404,
            detail="Event not found"
        )
    
    # Проверяем, зарегистрирован ли пользователь на это событие
    existing_participation = db_operations.get_participant_event_by_user_and_event(
        db, current_user["id"], event_id
    )
    if not existing_participation:
        raise HTTPException(
            status_code=400,
            detail="User is not registered for this event"
        )
    
    # Удаляем регистрацию
    deleted = db_operations.delete_participant_event(
        db, current_user["id"], event_id
    )
    
    if not deleted:
        raise HTTPException(
            status_code=500,
            detail="Failed to delete registration"
        )
    
    return {
        "success": True,
        "message": "Successfully unregistered from event",
        "event_id": event_id
    }