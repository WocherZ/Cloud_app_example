// src/utils/apiUtils.js

// Базовый URL API
export const API_BASE_URL = 'http://localhost:8000';

// Дефолтная картинка-заглушка
export const DEFAULT_IMAGE = '/volunteer-center-1.jpg';

/**
 * Формирует корректную ссылку на файл или изображение.
 * @param {string} path - Путь к файлу, пришедший с бэкенда (или полный URL).
 * @returns {string} Полный URL для src или href.
 */
export const getFileUrl = (path) => {
  // Если пути нет, возвращаем заглушку
  if (!path) return DEFAULT_IMAGE;

  // Если это уже полная ссылка (http/https) или base64 (data:), возвращаем как есть
  if (path.startsWith('http') || path.startsWith('https') || path.startsWith('data:')) {
    return path;
  }

  // Иначе формируем ссылку через эндпоинт получения файлов
  // encodeURIComponent важен, если в пути есть пробелы или спецсимволы
  return `${API_BASE_URL}/public/files?file_path=${encodeURIComponent(path)}`;
};

export const getFileName = (path) => {
  if (!path) return 'Документ';
  // Если это объект (на случай если API изменится), берем name
  if (typeof path === 'object' && path.name) return path.name;
  // Если строка
  return path.split('/').pop().split('\\').pop();
};
/**
 * Хелпер для обработки ошибки загрузки изображения (ставит заглушку).
 * Использование: <img onError={handleImageError} ... />
 */
export const handleImageError = (e) => {
  e.target.onerror = null; // Предотвращает зацикливание
  e.target.src = DEFAULT_IMAGE;
};