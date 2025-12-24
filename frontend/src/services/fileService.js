/**
 * Базовый URL вашего API.
 * Убедитесь, что он соответствует адресу, где запущен ваш сервер.
 */
const API_BASE_URL = 'http://localhost:8000';

/**
 * Генерирует полный URL для скачивания файла через ваш API.
 * @param {string} filePath - Путь к файлу, который возвращает бэкенд (например, "/uploads/document.pdf").
 * @returns {string} - Готовый URL для использования в атрибуте href.
 */
export const getFileUrl = (filePath) => {
  // Проверка на случай, если путь пустой
  if (!filePath) {
    console.warn("Получен пустой путь к файлу.");
    return "#"; // Возвращаем безопасное значение для ссылки
  }

  // Убираем лишний слэш в начале, если он есть
  const correctedPath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
  
  // Формируем URL с query-параметром, как ожидает ваш API
  const downloadUrl = new URL(`${API_BASE_URL}/public/files`);
  downloadUrl.searchParams.append('file_path', correctedPath);
  
  return downloadUrl.toString();
};