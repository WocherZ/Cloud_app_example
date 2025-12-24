// src/contexts/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';
import { userService } from '../services/userService';  

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('authToken') || null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const loadUser = async () => {
      const storedToken = localStorage.getItem('authToken');
      if (storedToken) {
        api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        try {
          const response = await api.get('/users/me');
          setUser(response.data);
        } catch (error) {
          console.error("Token verification failed:", error);
          logout();
        }
      }
      setIsLoading(false);
    };
    loadUser();
  }, []);

  const login = async (email, password) => {
    try {
      const loginData = { email, password };
      const response = await api.post('/auth/login', loginData);
      
      const newToken = response.data.access_token;
      
      localStorage.setItem('authToken', newToken);
      setToken(newToken);
      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      const userResponse = await api.get('/users/me');
      setUser(userResponse.data);
      localStorage.setItem('userCity', userResponse.data.city_name);

      return { success: true };

    } catch (error) {
      console.error("Login failed:", error);
      return { success: false, message: error.response?.data?.detail || "Неверный логин или пароль" };
    }
  };

  const updateUserName = async (newName) => {
    try {
      await userService.updateName(newName);
      setUser(prev => ({ ...prev, name: newName }));
      return { success: true };
    } catch (error) {
      console.error("Error updating name:", error);
      return { success: false, error: error.message };
    }
  };

  const register = async (email, password, city_name, name = '', role = 'user', nkoId = null, nkoData = null) => {
    try {
      if (role === 'nko') {
        console.log('Заявка на представительство НКО отправлена на модерацию');
      }
      localStorage.setItem('userCity', city_name);
      return { success: true };
    } catch (error) {
      console.error("Registration failed:", error);
      return { 
        success: false, 
        message: error.response?.data?.email || "Ошибка регистрации" 
      };
    }
  };

  const registerUser = async (email, password, city_name, name) => {
    try {
      await api.post('/auth/register/user', { email, password, city_name, name });
      return { success: true };
    } catch (error) {
      console.error("User registration failed:", error);
      return { success: false, message: error.response?.data?.detail || "Ошибка регистрации" };
    }
  };

  const registerNko = async (email, password, organization_name) => {
    try {
      await api.post('/auth/register/nko', { email, password, organization_name });
      return { success: true };
    } catch (error) {
      console.error("NKO registration failed:", error);
      return { success: false, message: error.response?.data?.detail || "Ошибка регистрации" };
    }
  };

  const updateUserCity = async (newCity) => {
    try {
      await userService.updateCity(newCity);
      setUser(prev => ({ ...prev, city: newCity }));
      return { success: true };
    } catch (error) {
      console.error("Error updating city:", error);
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userCity');
    setToken(null);
    setUser(null);
    delete api.defaults.headers.common['Authorization'];
  };

  // --- Новые функции для НКО ---
  const getNkoProfile = async () => {
    try {
      const response = await api.get('/nko/profile/me');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, message: error.response?.data?.detail };
    }
  };
  
  const updateNkoProfile = async (profileData) => {
     try {
      const response = await api.put('/nko/profile/me', profileData);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, message: error.response?.data?.detail };
    }
  };
  
  const submitNkoProfileForModeration = async () => {
    try {
      const response = await api.post('/nko/profile/me/submit-moderation');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, message: error.response?.data?.detail || "Ошибка отправки на модерацию" };
    }
  };

  const getAllUsers = async () => {
    try {
      const response = await api.get('/admin/users/with-roles');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, message: 'Не удалось загрузить список пользователей' };
    }
  };

  const updateUserRole = async (email, role) => {
    try {
      const response = await api.put(`/admin/users/${email}/role`, { role });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, message: error.response?.data?.detail || 'Ошибка обновления роли' };
    }
  };

  const getPendingNkos = async () => {
    try {
      const response = await api.get('/admin/nkos/pending');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, message: 'Не удалось загрузить заявки НКО' };
    }
  };
  
  const approveNko = async (email) => {
    try {
      await api.post(`/admin/nkos/${email}/approve`);
      return { success: true };
    } catch (error) {
      return { success: false, message: 'Ошибка одобрения НКО' };
    }
  };

  const rejectNko = async (email, reason) => {
    try {
      await api.post(`/admin/nkos/${email}/reject`, { reason });
      return { success: true };
    } catch (error) {
      return { success: false, message: 'Ошибка отклонения НКО' };
    }
  };

  const getApprovedNkos = async () => {
    try {
      const response = await api.get('/public/nkos');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, message: 'Не удалось загрузить список НКО' };
    }
  };

  const registerNkoRepresentative = async (userData, nkoEmail) => {
    try {
      const payload = {
        email: userData.email,
        password: userData.password,
        city_name: userData.city,
        name: userData.name,
        nko_email: nkoEmail
      };
      await api.post('/auth/register/representative', payload);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.detail || 'Ошибка отправки заявки' };
    }
  };

  const registerNewNkoApplication = async (applicationData, logoFile) => {
    try {
      const formData = new FormData();
      Object.keys(applicationData).forEach(key => {
        const value = applicationData[key];
        if (value !== undefined && value !== null) {
          formData.append(key, value.toString());
        }
      });
      if (logoFile) {
        formData.append('logo', logoFile);
      }

      await api.post('/auth/register/nko-application', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      return { success: true };
    } catch (error) {
      console.error("NKO Application failed:", error);
      const detail = error.response?.data?.detail;
      if (Array.isArray(detail)) {
        return { success: false, message: `Ошибка: ${detail[0].msg}` };
      }
      const errorMessage = typeof detail === 'string' ? detail : "Ошибка при отправке заявки.";
      return { success: false, message: errorMessage };
    }
  };

  // --- ИСПРАВЛЕНИЕ ЗДЕСЬ ---
  const isNkoRepresentative = user?.role === 'nko';
  // Разделяем роли строго
  const isModerator = user?.role === 'moderator'; 
  const isAdmin = user?.role === 'admin'; 
  // ------------------------

  const value = {
    user,
    token,
    isLoading,
    login,
    registerUser,
    registerNko,
    logout,
    updateUserName,
    updateUserCity,
    
    // Роли
    isNkoRepresentative,
    isAdmin,     // Теперь true только для admin
    isModerator, // Теперь true только для moderator
    
    getNkoProfile,
    updateNkoProfile,
    submitNkoProfileForModeration,
    register,
    getApprovedNkos,               
    registerNkoRepresentative,
    registerNewNkoApplication,      
    getAllUsers,
    updateUserRole,
    getPendingNkos,  
    approveNko,      
    rejectNko,      
  };

  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};