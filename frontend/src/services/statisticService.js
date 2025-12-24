// src/services/adminService.js

const API_BASE_URL = 'http://localhost:8000'; // Убедись, что URL совпадает с твоим конфигом

const getHeaders = () => {
  // Проверяем оба варианта ключа, чтобы точно найти токен
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

export const adminService = {
  getStatistics: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/statistics`, {
        method: 'GET',
        headers: getHeaders(),
      });

      if (!response.ok) {
        // Если 401/403 - можно вернуть нули, чтобы не ломать верстку
        console.warn('Failed to fetch stats, status:', response.status);
        return {
          totalUsers: 0, totalNko: 0, pendingNko: 0, 
          totalEvents: 0, totalNews: 0, totalKnowledgeBase: 0
        };
      }

      const data = await response.json();

      // Маппинг snake_case -> camelCase
      return {
        totalUsers: data.total_users || 0,
        totalNko: data.total_nko || 0,
        pendingNko: data.total_pending_nko || 0,
        totalEvents: data.total_events || 0,
        totalNews: data.total_news || 0,
        totalKnowledgeBase: data.total_knowledge_base_data || 0 
      };
    } catch (error) {
      console.error('Admin stats fetch error:', error);
      return {
        totalUsers: 0, totalNko: 0, pendingNko: 0, 
        totalEvents: 0, totalNews: 0, totalKnowledgeBase: 0
      };
    }
  }
};