"""
Скрипт миграции данных из JSON файлов в PostgreSQL.
Переносит пользователей, НКО, новости и мероприятия.
"""
import sys
import os

# Получаем абсолютный путь к директории, где находится my_script.py
current_dir = os.path.dirname(os.path.abspath(__file__))
# Получаем абсолютный путь к директории проекта (на уровень выше)
project_dir = os.path.join(current_dir, '..')

# Добавляем директорию проекта в sys.path
sys.path.insert(0, project_dir)

import json
import re
import unicodedata
from pathlib import Path
from datetime import datetime
from io import BytesIO
from app.db_session import SessionLocal
from app.db_operations import (
    get_user_by_email, create_user, get_or_create_role,
    create_organization, get_organization_by_name, get_organization_by_id,
    create_news, get_or_create_category_news,
    create_event, get_or_create_city, get_or_create_category,
    get_or_create_status_organization, get_or_create_status_event,
    create_knowledge_base_data, get_or_create_category_knowledge_base,
    get_or_create_type_material, create_material_knowledge_base_data,
    create_photo_news, create_file_news, create_hashtag_news,
    create_photo_event
)
from app.minio_client import get_minio_client
import mimetypes


def migrate_users(db, json_path: Path):
    """Миграция пользователей из JSON в БД."""
    print("\n📤 Миграция пользователей...")
    
    if not json_path.exists():
        print("⚠ Файл users.json не найден")
        return
    
    with open(json_path, 'r', encoding='utf-8') as f:
        users_data = json.load(f)
    
    migrated = 0
    skipped = 0
    
    for email, user_data in users_data.items():
        # Проверяем, существует ли пользователь
        existing_user = get_user_by_email(db, email)
        if existing_user:
            skipped += 1
            continue
        
        try:
            # Получаем или создаем роль
            role = get_or_create_role(db, user_data.get('role', 'user'))
            role_name = user_data.get('role', 'user')
            
            # Получаем или создаем город
            city_id = None
            if user_data.get('city_name'):
                city = get_or_create_city(db, user_data['city_name'])
                city_id = city.id
            
            # Обработка organization_id
            organization_id = user_data.get('organization_id')
            
            # Валидация для пользователей с ролью 'nko'
            if role_name == 'nko':
                if organization_id is None:
                    print(f"  ⚠ Пропущен пользователь {email}: роль 'nko' требует указания organization_id")
                    skipped += 1
                    continue
                
                # Проверяем, существует ли организация
                org = get_organization_by_id(db, organization_id)
                if not org:
                    print(f"  ⚠ Пропущен пользователь {email}: организация с ID {organization_id} не найдена в базе данных")
                    skipped += 1
                    continue
            else:
                # Для пользователей с другими ролями organization_id должен быть None
                # Если указан, игнорируем его с предупреждением
                if organization_id is not None:
                    print(f"  ⚠ Пользователь {email}: organization_id указан для роли '{role_name}', будет проигнорирован")
                    organization_id = None
            
            # Создаем пользователя
            create_user(
                db=db,
                email=email,
                password_hash=user_data.get('hashed_password', ''),
                name=user_data.get('name', ''),
                surname=user_data.get('surname'),
                patronymic=user_data.get('patronymic'),
                role_id=role.id,
                organization_id=organization_id,
                city_id=city_id,
                user_photo=user_data.get('user_photo')
            )
            migrated += 1
            print(f"  ✓ {email}" + (f" (организация ID: {organization_id})" if organization_id else ""))
            
        except Exception as e:
            print(f"  ✗ {email}: {e}")
    
    print(f"✓ Пользователи: мигрировано {migrated}, пропущено {skipped}")


def migrate_nkos(db, json_path: Path):
    """Миграция НКО из JSON в БД."""
    print("\n📤 Миграция организаций...")
    
    if not json_path.exists():
        print("⚠ Файл nkos.json не найден")
        return
    
    with open(json_path, 'r', encoding='utf-8') as f:
        nkos_raw = json.load(f)

    if isinstance(nkos_raw, dict):
        nkos_data = list(nkos_raw.values())
    elif isinstance(nkos_raw, list):
        nkos_data = nkos_raw
    else:
        print("⚠ Неверный формат файла nkos.json")
        return
    
    migrated = 0
    skipped = 0
    
    for nko_data in nkos_data:
        email = nko_data.get('email', '')
        if not email:
            skipped += 1
            print("  ⚠ Пропущена организация без email")
            continue
        org_name = nko_data.get('organization_name', '')
        
        # Проверяем, существует ли организация
        existing_org = get_organization_by_name(db, org_name)
        if existing_org:
            skipped += 1
            continue
        
        try:
            # Получаем или создаем город
            city_id = None
            if nko_data.get('city_name'):
                city = get_or_create_city(db, nko_data['city_name'])
                city_id = city.id
            
            # Получаем или создаем категорию
            category_id = None
            if nko_data.get('category'):
                category = get_or_create_category(db, nko_data['category'])
                category_id = category.id
            
            # Получаем или создаем статус
            status_id = None
            if nko_data.get('moderation_status'):
                status = get_or_create_status_organization(db, nko_data['moderation_status'])
                status_id = status.id
            
            # Подготавливаем дополнительные поля
            website = nko_data.get('website') or nko_data.get('website_url')

            founded_year = nko_data.get('founded_year')
            if isinstance(founded_year, str):
                founded_year = ''.join(filter(str.isdigit, founded_year))
                founded_year = int(founded_year) if founded_year else None
            elif founded_year is not None:
                try:
                    founded_year = int(founded_year)
                except (TypeError, ValueError):
                    founded_year = None

            # Создаем организацию
            create_organization(
                db=db,
                name=org_name,
                short_name=nko_data.get('short_name', org_name),
                email=email,
                city_id=city_id,
                status_organization_id=status_id,
                id_category=category_id,
                description=nko_data.get('description'),
                address=nko_data.get('address'),
                website=website,
                phone=nko_data.get('phone'),
                founded_year=founded_year,
                path_to_logo=nko_data.get('logo_url'),
            )
            migrated += 1
            print(f"  ✓ {org_name}")
            
        except Exception as e:
            print(f"  ✗ {org_name}: {e}")
    
    print(f"✓ Организации: мигрировано {migrated}, пропущено {skipped}")


def migrate_news(db, json_path: Path):
    """Миграция новостей из JSON в БД."""
    print("\n📤 Миграция новостей...")
    
    if not json_path.exists():
        print("⚠ Файл news.json не найден")
        return
    
    with open(json_path, 'r', encoding='utf-8') as f:
        news_list = json.load(f)
    
    if not isinstance(news_list, list):
        print("⚠ Неверный формат файла news.json")
        return
    
    migrated = 0
    
    for news_item in news_list:
        try:
            # Получаем или создаем категорию
            category_name = news_item.get('category', 'Новости')
            category = get_or_create_category_news(db, category_name)
            
            # Получаем или создаем город
            city_id = None
            if news_item.get('city'):
                city = get_or_create_city(db, news_item['city'])
                city_id = city.id
            
            # Парсим дату события
            date_event = None
            if news_item.get('eventDate'):
                try:
                    date_event = datetime.strptime(news_item['eventDate'], "%Y-%m-%d")
                except Exception as e:
                    print(f"    ⚠ Ошибка парсинга даты события: {e}")
            
            # Создаем новость
            title = news_item.get('title', '')
            content = news_item.get('content', '')
            short_desc = news_item.get('shortDescription', '')
            
            news = create_news(
                db=db,
                name=title,
                category_news_id=category.id,
                city_id=city_id,
                description=short_desc,
                full_description=content,
                date_event=date_event
            )
            
            # Добавляем изображения новости
            image_paths = []
            if news_item.get('image'):
                image_paths.append(news_item['image'])
            
            extra_images = news_item.get('images', [])
            if isinstance(extra_images, list):
                image_paths.extend([img for img in extra_images if img])
            elif isinstance(extra_images, str):
                image_paths.append(extra_images)
            
            # Удаляем дубликаты и пустые значения
            unique_images = []
            for path in image_paths:
                if path and path not in unique_images:
                    unique_images.append(path)
            
            for image_path in unique_images:
                try:
                    create_photo_news(db=db, news_id=news.id, path=image_path)
                except Exception as image_error:
                    print(f"    ⚠ Не удалось добавить изображение '{image_path}' для '{title}': {image_error}")
            
            # Добавляем файлы новости
            files_added = 0
            files_data = news_item.get('files', [])
            if isinstance(files_data, list):
                for file_path in files_data:
                    try:
                        create_file_news(db=db, news_id=news.id, path=file_path)
                        files_added += 1
                    except Exception as file_error:
                        print(f"    ⚠ Не удалось добавить файл '{file_path}' для '{title}': {file_error}")
            
            # Добавляем хештеги новости
            tags_data = news_item.get('tags', [])
            if isinstance(tags_data, str):
                tags_data = [tags_data]
            if isinstance(tags_data, list):
                unique_tags = []
                for tag in tags_data:
                    normalized_tag = (tag or "").strip()
                    if normalized_tag and normalized_tag not in unique_tags:
                        unique_tags.append(normalized_tag)
                for tag in unique_tags:
                    try:
                        create_hashtag_news(db=db, news_id=news.id, name=tag)
                    except Exception as tag_error:
                        print(f"    ⚠ Не удалось добавить хештег '{tag}' для '{title}': {tag_error}")

            
            migrated += 1
            print(f"  ✓ {title}")
            
        except Exception as e:
            print(f"  ✗ Ошибка: {e}")
    
    print(f"✓ Новости: мигрировано {migrated}")


def migrate_events(db, json_path: Path):
    """Миграция мероприятий из JSON в БД."""
    print("\n📤 Миграция мероприятий...")
    
    if not json_path.exists():
        print("⚠ Файл events.json не найден")
        return
    
    with open(json_path, 'r', encoding='utf-8') as f:
        events_list = json.load(f)
    
    if not isinstance(events_list, list):
        print("⚠ Неверный формат файла events.json")
        return
    
    migrated = 0
    skipped = 0
    
    for event_item in events_list:
        try:
            title = event_item.get('title', '')
            
            # Получаем организацию по ID (обязательное поле)
            organization_id = event_item.get('organization_id')
            
            if organization_id is None:
                print(f"    ⚠ Пропущено событие '{title}': не указан organization_id")
                skipped += 1
                continue
            
            # Получаем организацию по ID
            org = get_organization_by_id(db, organization_id)
            if not org:
                print(f"    ⚠ Пропущено событие '{title}': организация с ID {organization_id} не найдена в базе данных")
                skipped += 1
                continue
            
            # Объединяем дату и время в datetime
            date_time_event = None
            if event_item.get('date') and event_item.get('time'):
                try:
                    date_str = event_item['date']  # формат: "2025-01-21"
                    time_str = event_item['time']  # формат: "11:00"
                    datetime_str = f"{date_str} {time_str}"
                    date_time_event = datetime.strptime(datetime_str, "%Y-%m-%d %H:%M")
                except Exception as e:
                    print(f"    ⚠ Ошибка парсинга даты/времени для '{title}': {e}")
            
            # Получаем или создаем категорию события
            category_event_id = None
            if event_item.get('category'):
                from app.db_operations import get_or_create_category_event
                category = get_or_create_category_event(db, event_item['category'])
                category_event_id = category.id
            
            # Определяем статус события
            status_event_id = None
            status_name = event_item.get('status')
            if status_name:
                status = get_or_create_status_event(db, status_name)
                status_event_id = status.id

            # Причина отклонения
            rejection_reason = event_item.get('rejectionReason')
            if status_name != "Отклонено":
                rejection_reason = None
            elif rejection_reason is None:
                rejection_reason = ""

            # Создаем мероприятие
            event = create_event(
                db=db,
                name=title,
                organization_id=org.id,
                status_event_id=status_event_id,
                reason_rejection=rejection_reason,
                date_time_event=date_time_event,
                description=event_item.get('description'),
                full_description=event_item.get('fullDescription'),
                address=event_item.get('address'),
                category_event_id=category_event_id,
                quantity_participant=event_item.get('maxParticipants', 0) if event_item.get('maxParticipants') else None
            )

            # Добавляем файлы/изображения мероприятия
            image_paths = []
            
            raw_images = event_item.get('images', [])
            if isinstance(raw_images, list):
                image_paths.extend(raw_images)
            elif isinstance(raw_images, str):
                image_paths.append(raw_images)

            unique_paths = []
            for path in image_paths:
                normalized_path = (path or "").strip()
                if normalized_path and normalized_path not in unique_paths:
                    unique_paths.append(normalized_path)

            for image_path in unique_paths:
                try:
                    create_photo_event(db=db, event_id=event.id, path=image_path)
                except Exception as file_error:
                    print(f"    ⚠ Не удалось добавить файл '{image_path}' для '{title}': {file_error}")

            migrated += 1
            print(f"  ✓ {title}")
            
        except Exception as e:
            print(f"  ✗ Ошибка: {e}")
            import traceback
            traceback.print_exc()
    
    print(f"✓ Мероприятия: мигрировано {migrated}, пропущено {skipped}")


def migrate_knowledge_base(db, json_path: Path):
    """Миграция базы знаний из JSON в БД."""
    print("\n📤 Миграция базы знаний...")
    
    if not json_path.exists():
        print("⚠ Файл knowledge_base_data.json не найден")
        return
    
    with open(json_path, 'r', encoding='utf-8') as f:
        knowledge_list = json.load(f)
    
    if not isinstance(knowledge_list, list):
        print("⚠ Неверный формат файла knowledge_base_data.json")
        return
    
    migrated = 0
    
    for kb_item in knowledge_list:
        try:
            title = kb_item.get('title', '')
            
            # Получаем или создаем категорию
            category_name = kb_item.get('category', 'Общее')
            category = get_or_create_category_knowledge_base(db, category_name)
            
            # Получаем или создаем тип материала
            type_name = kb_item.get('type', 'document')
            type_material = get_or_create_type_material(db, type_name)
            
            # Создаем запись в базе знаний
            knowledge = create_knowledge_base_data(
                db=db,
                name=title,
                category_knowledge_base_data_id=category.id,
                type_material_category_knowledge_base_data_id=type_material.id,
                description=kb_item.get('description', ''),
                full_description=kb_item.get('content', ''),
                quantity_views=kb_item.get('views', 0),
                video_url=kb_item.get('videoUrl'),
                material_url=kb_item.get('externalLink') or kb_item.get('materialUrl')
            )
            
            # Добавляем файлы, если они есть
            files = kb_item.get('files', [])
            for file_item in files:
                file_name = file_item.get('name', '')
                file_url = file_item.get('url', '#')
                
                create_material_knowledge_base_data(
                    db=db,
                    knowledge_base_data_id=knowledge.id,
                    name=file_name,
                    path=file_url
                )
            
            migrated += 1
            print(f"  ✓ {title}")
            
        except Exception as e:
            print(f"  ✗ Ошибка: {e}")
            import traceback
            traceback.print_exc()
    
    print(f"✓ База знаний: мигрировано {migrated}")


def migrate_files_to_minio(files_dir: Path):
    """Миграция всех файлов из локальной директории files в MinIO."""
    print("\n📤 Миграция файлов в MinIO...")
    
    if not files_dir.exists():
        print(f"⚠ Директория {files_dir} не найдена")
        return
    
    if not files_dir.is_dir():
        print(f"⚠ {files_dir} не является директорией")
        return
    
    try:
        minio_client = get_minio_client()
    except Exception as e:
        print(f"❌ Не удалось подключиться к MinIO: {e}")
        return
    
    uploaded = 0
    skipped = 0
    errors = 0
    
    # Рекурсивно обходим все файлы в директории files
    for file_path in files_dir.rglob('*'):
        # Пропускаем директории
        if file_path.is_dir():
            continue
        
        try:
            # Получаем относительный путь от директории files
            # Например: files/news/images/volunteers-photo.jpg -> files/news/images/volunteers-photo.jpg
            relative_path = file_path.relative_to(files_dir.parent)
            
            # Преобразуем путь в строку с использованием слешей (для MinIO)
            minio_path = str(relative_path).replace("\\", "/")
            
            # Убеждаемся, что путь начинается с "files/"
            if not minio_path.startswith("files/"):
                minio_path = f"files/{minio_path}"
            
            # Проверяем, существует ли файл уже в MinIO
            if minio_client.file_exists(minio_path):
                skipped += 1
                continue
            
            # Читаем содержимое файла
            with open(file_path, 'rb') as f:
                file_data = f.read()
            
            # Определяем content-type по расширению файла
            content_type, _ = mimetypes.guess_type(str(file_path))
            if not content_type:
                content_type = "application/octet-stream"
            
            # Загружаем файл в MinIO
            minio_client.put_file(minio_path, file_data, content_type=content_type)
            uploaded += 1
            print(f"  ✓ {minio_path}")
            
        except Exception as e:
            errors += 1
            print(f"  ✗ {file_path}: {e}")
    
    print(f"✓ Файлы: загружено {uploaded}, пропущено {skipped}, ошибок {errors}")


def main():
    """Основная функция миграции."""
    print("=" * 60)
    print("Миграция данных из JSON в PostgreSQL")
    print("=" * 60)
    
    BASE_DIR = Path(__file__).resolve().parent / "data"
    
    try:
        db = SessionLocal()
        
        # Миграция НКО (сначала, чтобы организации были доступны для пользователей)
        migrate_nkos(db, BASE_DIR / "nkos.json")
        
        # Миграция пользователей (после НКО, чтобы можно было проверить organization_id)
        migrate_users(db, BASE_DIR / "users.json")
        
        # Миграция новостей
        migrate_news(db, BASE_DIR / "news.json")
        
        # Миграция мероприятий
        migrate_events(db, BASE_DIR / "events.json")
        
        # Миграция базы знаний
        migrate_knowledge_base(db, BASE_DIR / "knowledge_base_data.json")
        
        # Миграция файлов в MinIO
        FILES_DIR = Path(__file__).resolve().parent.parent / "files"
        migrate_files_to_minio(FILES_DIR)
        
        print("\n" + "=" * 60)
        print("✓ Миграция завершена успешно!")
        print("=" * 60)
        print("\n💡 Совет: Создайте резервную копию JSON файлов")
        print("   и после проверки данных в БД удалите их.")
        
    except Exception as e:
        print(f"\n❌ Ошибка при миграции: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    main()

