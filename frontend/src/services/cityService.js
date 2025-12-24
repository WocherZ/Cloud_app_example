// src/services/cityService.js
const API_BASE_URL = 'http://localhost:8000'; 

export const cityService = {
  // 1. ВСЕ города (для Регистрации)
  getAllCities: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/public/cities`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to load all cities');
      return await response.json();
    } catch (error) {
      console.error('Fetch all cities error:', error);
      return [];
    }
  },

  // 2. Города с НКО (для Контекста/Фильтрации на сайте)
  getCitiesWithOrganizations: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/public/cities/with-organizations`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to load active cities');
      return await response.json();
    } catch (error) {
      console.error('Fetch active cities error:', error);
      return [];
    }
  }
};