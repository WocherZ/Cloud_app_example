# Инструкция по запуску приложения

## Требования

- Python 3.11+
- Node.js 16+
- PostgreSQL 15
- Docker и Docker Compose (для запуска через контейнеры)
- Git

## Способ 1: Запуск через Docker Compose (рекомендуется)

### 1. Клонирование репозитория

```bash
git clone <repository-url>
cd app
```

### 2. Создание файла .env для бэкенда

Создайте файл `backend/.env` со следующим содержимым:

```env
# База данных
DB_HOST=db
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=gooddeeds_db

# JWT
SECRET_KEY=your-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=2880

# MinIO
MINIO_ENDPOINT=minio:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET_NAME=gooddeeds-files
MINIO_SECURE=false

# OpenAI (опционально, для функции генерации контента)
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-4
OPENAI_TEMPERATURE=0.4
OPENAI_BASE_URL=https://api.openai.com/v1
```

### 3. Запуск всех сервисов

```bash
cd backend
docker-compose up -d
```

Это запустит:
- PostgreSQL (порт 5432)
- MinIO (порты 9000 и 9001)
- Backend API (порт 8000)

### 4. Инициализация базы данных

```bash
docker exec -it gooddeeds_backend python migrations/init_db.py
```

### 5. Запуск фронтенда

Откройте новый терминал:

```bash
cd frontend
npm install
npm start
```

Фронтенд будет доступен по адресу: http://localhost:3000

### 6. Доступ к системе

- **Фронтенд**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API документация**: http://localhost:8000/docs
- **MinIO Console**: http://localhost:9001

**Данные администратора по умолчанию:**
- Email: `admin@gooddeeds.ru`
- Пароль: `admin123`

⚠️ **Важно:** Смените пароль администратора после первого входа!

## Способ 2: Локальный запуск без Docker

### 1. Установка PostgreSQL

Установите PostgreSQL 15 и создайте базу данных:

```sql
CREATE DATABASE gooddeeds_db;
CREATE USER postgres WITH PASSWORD 'postgres';
GRANT ALL PRIVILEGES ON DATABASE gooddeeds_db TO postgres;
```

### 2. Установка и настройка MinIO

Скачайте и установите MinIO с официального сайта: https://min.io/download

Запустите MinIO:

```bash
# Windows
minio.exe server C:\minio-data --console-address ":9001"

# Linux/Mac
minio server ~/minio-data --console-address ":9001"
```

### 3. Настройка бэкенда

```bash
cd backend
```

Создайте файл `.env` со следующим содержимым:

```env
# База данных
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=gooddeeds_db

# JWT
SECRET_KEY=your-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=2880

# MinIO
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET_NAME=gooddeeds-files
MINIO_SECURE=false

# OpenAI (опционально)
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-4
OPENAI_TEMPERATURE=0.4
OPENAI_BASE_URL=https://api.openai.com/v1
```

Установите зависимости Python:

```bash
pip install -r requirements.txt
```

Инициализируйте базу данных:

```bash
python migrations/init_db.py
```

Запустите бэкенд:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 4. Настройка фронтенда

Откройте новый терминал:

```bash
cd frontend
npm install
npm start
```

### 5. Доступ к системе

- **Фронтенд**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API документация**: http://localhost:8000/docs
- **MinIO Console**: http://localhost:9001

**Данные администратора по умолчанию:**
- Email: `admin@gooddeeds.ru`
- Пароль: `admin123`

## Дополнительная настройка

### Миграция данных из JSON

Если у вас есть тестовые данные в формате JSON, выполните:

```bash
cd backend
python migrations/migrate_json_to_db.py
```

### Остановка сервисов (Docker)

```bash
cd backend
docker-compose down
```

### Полная очистка (Docker)

Для удаления всех данных (включая базу данных и файлы):

```bash
cd backend
docker-compose down -v
```

## Структура проекта

```
app/
├── backend/                  # FastAPI бэкенд
│   ├── app/                  # Основной код приложения
│   │   ├── main.py          # Точка входа
│   │   ├── config.py        # Конфигурация
│   │   ├── db_models.py     # Модели базы данных
│   │   └── ...              # Другие модули
│   ├── migrations/          # Скрипты миграции
│   ├── files/               # Статические файлы
│   ├── requirements.txt     # Python зависимости
│   ├── docker-compose.yml   # Docker конфигурация
│   └── Dockerfile           # Docker образ
└── frontend/                # React фронтенд
    ├── src/                 # Исходный код
    │   ├── App.jsx         # Главный компонент
    │   ├── pages/          # Страницы приложения
    │   ├── components/     # React компоненты
    │   ├── services/       # API сервисы
    │   └── contexts/       # React контексты
    ├── public/             # Публичные файлы
    └── package.json        # Node.js зависимости
```

## Порты по умолчанию

- **Frontend**: 3000
- **Backend**: 8000
- **PostgreSQL**: 5432
- **MinIO API**: 9000
- **MinIO Console**: 9001

