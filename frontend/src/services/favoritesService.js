// src/services/favoritesService.js

const API_URL = 'http://localhost:8000'; 

const getHeaders = () => {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

export const favoritesService = {
  // === EVENTS ===
  getFavoriteEvents: async () => {
    const res = await fetch(`${API_URL}/favorites/events`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Error fetching favorite events');
    return await res.json();
  },
  addEventToFavorites: async (id) => {
    const res = await fetch(`${API_URL}/favorites/events/${id}`, { method: 'POST', headers: getHeaders() });
    if (!res.ok) throw new Error('Error adding event');
    return await res.json();
  },
  removeEventFromFavorites: async (id) => {
    const res = await fetch(`${API_URL}/favorites/events/${id}`, { method: 'DELETE', headers: getHeaders() });
    if (!res.ok) throw new Error('Error removing event');
    return true;
  },

  // === NEWS ===
  getFavoriteNews: async () => {
    const res = await fetch(`${API_URL}/favorites/news`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Error fetching favorite news');
    return await res.json();
  },
  addNewsToFavorites: async (id) => {
    const res = await fetch(`${API_URL}/favorites/news/${id}`, { method: 'POST', headers: getHeaders() });
    if (!res.ok) throw new Error('Error adding news');
    return await res.json();
  },
  removeNewsFromFavorites: async (id) => {
    const res = await fetch(`${API_URL}/favorites/news/${id}`, { method: 'DELETE', headers: getHeaders() });
    if (!res.ok) throw new Error('Error removing news');
    return true;
  },

// === НКО (NKOS) ===
  
  getFavoriteNkos: async () => {
    try {
      // ИСПРАВЛЕНО: добавил 's' на конце -> /nkos
      const response = await fetch(`${API_URL}/favorites/nkos`, { 
        method: 'GET',
        headers: getHeaders(),
      });
      if (!response.ok) throw new Error('Failed to fetch');
      return await response.json();
    } catch (e) {
      console.warn("Error fetching favorite NKOs", e);
      return []; 
    }
  },

  addNkoToFavorites: async (nkoId) => {
    // Здесь оставляем /nko/, так как POST у вас, судя по всему, был в единственном числе
    const response = await fetch(`${API_URL}/favorites/nko/${nkoId}`, {
      method: 'POST',
      headers: getHeaders(),
    });

    // ОБРАБОТКА 409: Если уже добавлено, не считаем это ошибкой
    if (response.status === 409) {
      return { message: "Already added" };
    }

    if (!response.ok) throw new Error('Failed to add nko to favorites');
    return await response.json();
  },

  removeNkoFromFavorites: async (nkoId) => {
    const response = await fetch(`${API_URL}/favorites/nko/${nkoId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to remove nko from favorites');
    return true;
  },
  // === KNOWLEDGE BASE (БАЗА ЗНАНИЙ) ===
  getFavoriteKnowledgeBase: async () => {
    const res = await fetch(`${API_URL}/favorites/knowledge-base`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Error fetching favorite KB');
    return await res.json();
  },

  addKnowledgeBaseToFavorites: async (kbId) => {
    const res = await fetch(`${API_URL}/favorites/knowledge-base/${kbId}`, { 
      method: 'POST', 
      headers: getHeaders() 
    });
    if (!res.ok) throw new Error('Error adding KB to favorites');
    return await res.json();
  },

  removeKnowledgeBaseFromFavorites: async (kbId) => {
    const res = await fetch(`${API_URL}/favorites/knowledge-base/${kbId}`, { 
      method: 'DELETE', 
      headers: getHeaders() 
    });
    if (!res.ok) throw new Error('Error removing KB from favorites');
    return true;
  },
};