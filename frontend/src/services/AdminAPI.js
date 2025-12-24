// src/api/AdminAPI.js
// Все API запросы для админ-панели

const API_BASE_URL = 'http://localhost:8000';
const ADMIN_NEWS_BASE = `${API_BASE_URL}/admin_news`;

// Получить токен из localStorage
const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

// Базовый fetch с авторизацией
const authFetch = async (url, options = {}) => {
  const token = getAuthToken();
  console.log('URL:', url);
  console.log('Token found:', token);

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  return response;
};

// ==================== СТАТИСТИКА ====================

export const getStatistics = async () => {
  try {
    const response = await authFetch(`${API_BASE_URL}/admin/statistics`);
    const data = await response.json();
    return { success: response.ok, data: data.data || data };
  } catch (error) {
    console.error('Statistics error:', error);
    return { success: false, message: error.message };
  }
};

// ==================== ПОЛЬЗОВАТЕЛИ ====================

export const getAllUsers = async () => {
  try {
    const response = await authFetch(`${API_BASE_URL}/admin/users/with-roles`);
    const data = await response.json();
    return { success: response.ok, data: data.data || data };
  } catch (error) {
    console.error('Get users error:', error);
    return { success: false, message: error.message };
  }
};

export const updateUserRole = async (userId, newRoleId) => {
  try {
    const response = await authFetch(`${API_BASE_URL}/admin/users/update-role`, {
      method: 'PUT',
      body: JSON.stringify({ user_id: userId, new_role_id: newRoleId }),
    });
    const data = await response.json();
    return {
      success: response.ok,
      data,
      message: data?.detail || data?.message,
    };
  } catch (error) {
    console.error('Update user role error:', error);
    return { success: false, message: error.message };
  }
};

// ==================== НКО (модерация) ====================
export const getPendingNkos = async () => {
  try {
    const response = await authFetch(`${API_BASE_URL}/admin/nko/pending`);
    const data = await response.json();
    return { success: response.ok, data: data.data || data };
  } catch (error) {
    console.error('Get pending NKOs error:', error);
    return { success: false, message: error.message };
  }
};

// ИСПРАВЛЕНО: используем organizationId вместо email
export const approveNko = async (organizationId) => {
  try {
    const response = await authFetch(`${API_BASE_URL}/admin/nko/${organizationId}/approve`, {
      method: 'POST',
    });
    const data = await response.json();
    return { success: response.ok, message: data.message };
  } catch (error) {
    console.error('Approve NKO error:', error);
    return { success: false, message: error.message };
  }
};

// ИСПРАВЛЕНО: используем organizationId вместо email
export const rejectNko = async (organizationId, reason) => {
  try {
    // В Swagger просто POST /{id}/reject, но обычно причину передают в body
    // Если бэк ждет query param, нужно изменить URL, но пока оставляем body
    const response = await authFetch(`${API_BASE_URL}/admin/nko/${organizationId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
    const data = await response.json();
    return { success: response.ok, message: data.message };
  } catch (error) {
    console.error('Reject NKO error:', error);
    return { success: false, message: error.message };
  }
};

// ==================== НОВОСТИ ====================

export const createNews = async (newsData) => {
  try {
    const response = await authFetch(`${ADMIN_NEWS_BASE}`, {
      method: 'POST',
      body: JSON.stringify(newsData),
    });
    const data = await response.json();
    return { success: response.ok, data, message: data?.detail || data?.message };
  } catch (error) {
    console.error('Create news error:', error);
    return { success: false, message: error.message };
  }
};

export const updateNews = async (newsId, newsData) => {
  try {
    const response = await authFetch(`${ADMIN_NEWS_BASE}/${newsId}`, {
      method: 'PUT',
      body: JSON.stringify(newsData),
    });
    const data = await response.json();
    return { success: response.ok, data, message: data?.detail || data?.message };
  } catch (error) {
    console.error('Update news error:', error);
    return { success: false, message: error.message };
  }
};

export const deleteNews = async (newsId) => {
  try {
    const response = await authFetch(`${ADMIN_NEWS_BASE}/${newsId}`, {
      method: 'DELETE',
    });
    const data = await response.json();
    return { success: response.ok, message: data?.detail || data?.message };
  } catch (error) {
    console.error('Delete news error:', error);
    return { success: false, message: error.message };
  }
};

export const uploadNewsImage = async (newsId, file) => {
  try {
    const token = getAuthToken();
    const formData = new FormData();
    formData.append('news_id', newsId);
    formData.append('image', file);

    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await fetch(`${ADMIN_NEWS_BASE}/upload-image`, {
      method: 'POST',
      headers,
      body: formData,
    });
    const data = await response.json();
    return { success: response.ok, data, message: data?.detail || data?.message };
  } catch (error) {
    console.error('Upload news image error:', error);
    return { success: false, message: error.message };
  }
};

export const uploadNewsFile = async (newsId, file) => {
  try {
    const token = getAuthToken();
    const formData = new FormData();
    formData.append('news_id', newsId);
    formData.append('file', file);

    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await fetch(`${ADMIN_NEWS_BASE}/upload-file`, {
      method: 'POST',
      headers,
      body: formData,
    });
    const data = await response.json();
    return { success: response.ok, data, message: data?.detail || data?.message };
  } catch (error) {
    console.error('Upload news file error:', error);
    return { success: false, message: error.message };
  }
};

export const deleteNewsFile = async (newsId, filePath) => {
  try {
    const response = await authFetch(`${ADMIN_NEWS_BASE}/delete-file`, {
      method: 'DELETE',
      body: JSON.stringify({
        news_id: newsId,
        file_path: filePath,
      }),
    });
    const data = await response.json();
    return { success: response.ok, message: data?.detail || data?.message };
  } catch (error) {
    console.error('Delete news file error:', error);
    return { success: false, message: error.message };
  }
};

// ==================== СОБЫТИЯ ====================

export const createEvent = async (eventData) => {
  try {
    const response = await authFetch(`${API_BASE_URL}/admin/events`, {
      method: 'POST',
      body: JSON.stringify(eventData),
    });
    const data = await response.json();
    return { success: response.ok, data, message: data.message };
  } catch (error) {
    console.error('Create event error:', error);
    return { success: false, message: error.message };
  }
};

export const updateEvent = async (eventId, eventData) => {
  try {
    const response = await authFetch(`${API_BASE_URL}/admin/events/${eventId}`, {
      method: 'PUT',
      body: JSON.stringify(eventData),
    });
    const data = await response.json();
    return { success: response.ok, data, message: data.message };
  } catch (error) {
    console.error('Update event error:', error);
    return { success: false, message: error.message };
  }
};

export const deleteEvent = async (eventId) => {
  try {
    const response = await authFetch(`${API_BASE_URL}/admin/events/${eventId}`, {
      method: 'DELETE',
    });
    const data = await response.json();
    return { success: response.ok, message: data.message };
  } catch (error) {
    console.error('Delete event error:', error);
    return { success: false, message: error.message };
  }
};
// ==================== БАЗА ЗНАНИЙ ====================

// Загрузка файла (отдельный эндпоинт)
export const uploadKbFile = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file); // 'file' - имя поля, которое ждет бэк

    // Для отправки файлов не ставим Content-Type: application/json вручную,
    // браузер сам поставит multipart/form-data boundary
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_BASE_URL}/admin_knowledge_base/upload-file`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();
    // Бэк должен вернуть путь к файлу (строку) или объект.
    // Предполагаем, что возвращается { file_path: "..." } или просто строка
    return { success: response.ok, data: data };
  } catch (error) {
    console.error('Upload KB file error:', error);
    return { success: false, message: error.message };
  }
};

export const createKnowledgeBase = async (kbData) => {
  try {
    const response = await authFetch(`${API_BASE_URL}/admin_knowledge_base`, {
      method: 'POST',
      body: JSON.stringify(kbData),
    });
    const data = await response.json();
    return { success: response.ok, data, message: data.message };
  } catch (error) {
    console.error('Create KB error:', error);
    return { success: false, message: error.message };
  }
};

export const updateKnowledgeBase = async (kbId, kbData) => {
  try {
    const response = await authFetch(`${API_BASE_URL}/admin_knowledge_base/${kbId}`, {
      method: 'PUT',
      body: JSON.stringify(kbData),
    });
    const data = await response.json();
    return { success: response.ok, data, message: data.message };
  } catch (error) {
    console.error('Update KB error:', error);
    return { success: false, message: error.message };
  }
};

export const deleteKnowledgeBase = async (kbId) => {
  try {
    const response = await authFetch(`${API_BASE_URL}/admin_knowledge_base/${kbId}`, {
      method: 'DELETE',
    });
    // DELETE иногда возвращает 204 No Content (без JSON)
    if (response.status === 204) return { success: true };
    
    const data = await response.json();
    return { success: response.ok, message: data.message };
  } catch (error) {
    console.error('Delete KB error:', error);
    return { success: false, message: error.message };
  }
};

// "==================== СОБЫТИЯ ===================="

// Загрузка изображения для события
export const uploadEventImage = async (eventId, file) => {
  try {
    const token = getAuthToken();
    const formData = new FormData();
    formData.append('event_id', eventId);
    formData.append('image', file);

    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await fetch(`${API_BASE_URL}/admin/events/upload-image`, {
      method: 'POST',
      headers,
      body: formData,
    });
    const data = await response.json();
    return { success: response.ok, data, message: data?.detail || data?.message };
  } catch (error) {
    console.error('Upload event image error:', error);
    return { success: false, message: error.message };
  }
};

// Удаление изображения события
export const deleteEventImage = async (eventId, imagePath) => {
  try {
    const response = await authFetch(`${API_BASE_URL}/admin/events/delete-image`, {
      method: 'DELETE',
      body: JSON.stringify({
        event_id: eventId,
        image_path: imagePath,
      }),
    });
    const data = await response.json();
    return { success: response.ok, message: data?.detail || data?.message };
  } catch (error) {
    console.error('Delete event image error:', error);
    return { success: false, message: error.message };
  }
};

// ==================== МОДЕРАЦИЯ СОБЫТИЙ ====================

export const getPendingEvents = async () => {
  try {
    const response = await authFetch(`${API_BASE_URL}/admin/events/status/pending`);
    const data = await response.json();
    // API может возвращать массив напрямую или внутри поля.
    // Судя по Swagger (GET /admin/events/status/pending), это массив
    return { success: response.ok, data: data.data || data };
  } catch (error) {
    console.error('Get pending events error:', error);
    return { success: false, message: error.message };
  }
};

export const approveEvent = async (eventId) => {
  try {
    const response = await authFetch(`${API_BASE_URL}/admin/events/${eventId}/approve`, {
      method: 'POST',
    });
    const data = await response.json();
    return { success: response.ok, message: data.message };
  } catch (error) {
    console.error('Approve event error:', error);
    return { success: false, message: error.message };
  }
};

export const rejectEvent = async (eventId, reason) => {
  try {
    // ВАЖНО: Передаем reason в body
    const response = await authFetch(`${API_BASE_URL}/admin/events/${eventId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason: reason || 'Причина не указана' }), // Заглушка, если админ не ввел
    });
    const data = await response.json();
    
    if (!response.ok) {
        // Если сервер вернул ошибку валидации (422), пробрасываем её
        throw new Error(data.detail?.[0]?.msg || data.message || 'Ошибка отклонения');
    }

    return { success: response.ok, message: data.message };
  } catch (error) {
    console.error('Reject event error:', error);
    return { success: false, message: error.message };
  }
};