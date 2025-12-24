// src/services/userService.js

const API_URL = 'http://localhost:8000'; // Твой URL

const getHeaders = () => {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

export const userService = {
  // Обновить имя
  updateName: async (name) => {
    const response = await fetch(`${API_URL}/users/me/name`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ name }),
    });
    if (!response.ok) throw new Error('Failed to update name');
    return await response.json();
  },

  // Обновить город
  updateCity: async (cityName) => {
    const response = await fetch(`${API_URL}/users/me/city`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ city_name: cityName }),
    });
    if (!response.ok) throw new Error('Failed to update city');
    return await response.json();
  },

  // Регистрация на событие
  registerForEvent: async (eventId) => {
    const response = await fetch(`${API_URL}/users/me/events/register`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ event_id: eventId }),
    });
    if (!response.ok) throw new Error('Failed to register for event');
    return await response.json();
  },

  // Отмена регистрации (Предполагаемый эндпоинт, так как в Swagger его нет, 
  // но логика требует. Если его нет - кнопку удаления пока можно скрыть или оставить заглушку)
  unregisterFromEvent: async (eventId) => {
    // Обычно это DELETE /users/me/events/{id} или похожий
    const response = await fetch(`${API_URL}/users/me/events/${eventId}`, { 
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to unregister');
    return true;
  },

  // Получить мои события (чтобы отобразить в кабинете)
  getMyEvents: async () => {
    // Предполагаем, что есть такой GET запрос, чтобы получить список
    const response = await fetch(`${API_URL}/users/me/events`, {
      method: 'GET',
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch my events');
    return await response.json();
  }
};