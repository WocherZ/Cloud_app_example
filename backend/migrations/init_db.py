"""
Скрипт инициализации базы данных.
Создает все таблицы, базовые роли, категории и администратора по умолчанию.
"""
import sys
import os

# Получаем абсолютный путь к директории, где находится my_script.py
current_dir = os.path.dirname(os.path.abspath(__file__))
# Получаем абсолютный путь к директории проекта (на уровень выше)
project_dir = os.path.join(current_dir, '..')

# Добавляем директорию проекта в sys.path
sys.path.insert(0, project_dir)

from app.db_session import init_db, SessionLocal
from app.db_operations import (
    init_default_roles, init_default_categories, init_default_statuses, 
    init_default_cities, get_role_by_name, get_user_by_email, create_user
)
from app.auth import get_password_hash


def create_admin_user(db):
    """Создает администратора по умолчанию, если его нет."""
    admin_email = "admin@gooddeeds.ru"
    admin_user = get_user_by_email(db, admin_email)
    
    if not admin_user:
        admin_role = get_role_by_name(db, "admin")
        if not admin_role:
            print("⚠ Роль 'admin' не найдена. Запустите init_default_roles().")
            return
        
        hashed_password = get_password_hash("admin123")  # ВАЖНО: Смените пароль!
        
        admin_user = create_user(
            db=db,
            email=admin_email,
            password_hash=hashed_password,
            name="Администратор",
            surname="Системы",
            patronymic="",
            role_id=admin_role.id
        )
        
        print(f"✓ Создан администратор: {admin_email} (пароль: admin123)")
        print("⚠ ВАЖНО: Смените пароль администратора после первого входа!")
    else:
        print(f"✓ Администратор уже существует: {admin_email}")


def main():
    """Основная функция инициализации."""
    print("=" * 60)
    print("Инициализация базы данных GoodDeeds")
    print("=" * 60)
    
    try:
        # Создаем таблицы
        print("\n1. Создание таблиц...")
        init_db()
        
        # Инициализируем базовые данные
        db = SessionLocal()
        try:
            print("\n2. Инициализация ролей...")
            init_default_roles(db)
            
            print("\n3. Инициализация категорий...")
            init_default_categories(db)
            
            print("\n4. Инициализация статусов...")
            init_default_statuses(db)
            
            print("\n5. Инициализация городов...")
            init_default_cities(db)
            
            print("\n6. Создание администратора...")
            create_admin_user(db)
            
            print("\n" + "=" * 60)
            print("✓ Инициализация завершена успешно!")
            print("=" * 60)
            print("\nТеперь вы можете запустить приложение:")
            print("  cd AuthApi")
            print("  uvicorn app.main:app --reload")
            print("\nДанные для входа администратора:")
            print("  Email: admin@gooddeeds.ru")
            print("  Пароль: admin123")
            print("\n⚠ ВАЖНО: Смените пароль после первого входа!")
            
        finally:
            db.close()
            
    except Exception as e:
        print(f"\n❌ Ошибка при инициализации: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()

