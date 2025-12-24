import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000', // URL вашего FastAPI сервера
  headers: {
    'Content-Type': 'application/json',
  },
});

// Можно добавить interceptors для обработки ошибок (опционально)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Обработка ошибок, например, 401 Unauthorized
    return Promise.reject(error);
  }
);

export default api;