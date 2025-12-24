"""
Клиент MinIO для работы с файлами.
Обеспечивает чтение, запись, удаление и проверку существования файлов в MinIO.
"""
import io
from typing import Optional
from fastapi import HTTPException, status
from minio import Minio
from minio.error import S3Error
from .config import settings


class MinIOClient:
    """Клиент для работы с MinIO."""
    
    def __init__(self):
        """Инициализация клиента MinIO."""
        self.client = Minio(
            endpoint=settings.MINIO_ENDPOINT,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=settings.MINIO_SECURE,
        )
        self.bucket_name = settings.MINIO_BUCKET_NAME
        self._ensure_bucket_exists()
    
    def _ensure_bucket_exists(self):
        """Проверяет существование bucket и создает его, если необходимо."""
        try:
            if not self.client.bucket_exists(self.bucket_name):
                self.client.make_bucket(self.bucket_name)
        except S3Error as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Ошибка при работе с MinIO bucket: {e}"
            )
    
    def put_file(
        self,
        file_path: str,
        file_data: bytes,
        content_type: str = "application/octet-stream"
    ) -> str:
        """
        Сохраняет файл в MinIO.
        
        Args:
            file_path: Путь к файлу (будет использован как object_name в MinIO)
            file_data: Данные файла в виде bytes
            content_type: MIME-тип файла
        
        Returns:
            Путь к файлу (тот же, что был передан)
        
        Raises:
            HTTPException: При ошибке сохранения файла
        """
        try:
            file_stream = io.BytesIO(file_data)
            self.client.put_object(
                bucket_name=self.bucket_name,
                object_name=file_path,
                data=file_stream,
                length=len(file_data),
                content_type=content_type
            )
            return file_path
        except S3Error as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Не удалось сохранить файл в MinIO: {e}"
            )
    
    def get_file(self, file_path: str) -> bytes:
        """
        Получает файл из MinIO.
        
        Args:
            file_path: Путь к файлу в MinIO
        
        Returns:
            Данные файла в виде bytes
        
        Raises:
            HTTPException: При ошибке чтения файла или если файл не найден
        """
        try:
            response = self.client.get_object(
                bucket_name=self.bucket_name,
                object_name=file_path
            )
            file_data = response.read()
            response.close()
            response.release_conn()
            return file_data
        except S3Error as e:
            if e.code == "NoSuchKey":
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Файл не найден"
                )
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Не удалось получить файл из MinIO: {e}"
            )
    
    def delete_file(self, file_path: str) -> bool:
        """
        Удаляет файл из MinIO.
        
        Args:
            file_path: Путь к файлу в MinIO
        
        Returns:
            True, если файл был удален, False если файл не существовал
        
        Raises:
            HTTPException: При ошибке удаления файла
        """
        try:
            self.client.remove_object(
                bucket_name=self.bucket_name,
                object_name=file_path
            )
            return True
        except S3Error as e:
            if e.code == "NoSuchKey":
                # Файл не существует, это не ошибка
                return False
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Не удалось удалить файл из MinIO: {e}"
            )
    
    def file_exists(self, file_path: str) -> bool:
        """
        Проверяет существование файла в MinIO.
        
        Args:
            file_path: Путь к файлу в MinIO
        
        Returns:
            True, если файл существует, False в противном случае
        """
        try:
            self.client.stat_object(
                bucket_name=self.bucket_name,
                object_name=file_path
            )
            return True
        except S3Error as e:
            if e.code == "NoSuchKey":
                return False
            # Для других ошибок считаем, что файл не существует
            return False
    
    def get_file_info(self, file_path: str) -> Optional[dict]:
        """
        Получает информацию о файле (метаданные, размер и т.д.).
        
        Args:
            file_path: Путь к файлу в MinIO
        
        Returns:
            Словарь с информацией о файле или None, если файл не найден
        """
        try:
            stat = self.client.stat_object(
                bucket_name=self.bucket_name,
                object_name=file_path
            )
            return {
                "size": stat.size,
                "content_type": stat.content_type,
                "last_modified": stat.last_modified,
                "etag": stat.etag,
            }
        except S3Error as e:
            if e.code == "NoSuchKey":
                return None
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Не удалось получить информацию о файле: {e}"
            )


# Глобальный экземпляр клиента
_minio_client: Optional[MinIOClient] = None


def get_minio_client() -> MinIOClient:
    """
    Получает глобальный экземпляр клиента MinIO (singleton).
    
    Returns:
        Экземпляр MinIOClient
    """
    global _minio_client
    if _minio_client is None:
        _minio_client = MinIOClient()
    return _minio_client

