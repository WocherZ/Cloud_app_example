// src/contexts/PublicContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const PublicContext = createContext();

export const usePublic = () => {
  const context = useContext(PublicContext);
  if (!context) {
    throw new Error('usePublic must be used within PublicProvider');
  }
  return context;
};

export const PublicProvider = ({ children }) => {
  const [nkoList, setNkoList] = useState([]);
  const [newsList, setNewsList] = useState([]);
  const [eventsList, setEventsList] = useState([]);
  const [knowledgeBaseList, setKnowledgeBaseList] = useState([]);
  
  // Глобальный лоадер оставим только для списков
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const API_BASE_URL = 'http://localhost:8000';

  // --- СПИСКИ (Оставляем с глобальным лоадером) ---

  const fetchAllNkos = useCallback(async (limit = null) => {
    setLoading(true);
    try {
      const url = limit 
        ? `${API_BASE_URL}/public/nkos?limit=${limit}`
        : `${API_BASE_URL}/public/nkos`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(response.statusText);
      const data = await response.json();
      setNkoList(data);
      return data;
    } catch (err) {
      console.error(err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAllNews = useCallback(async (limit = null) => {
    setLoading(true);
    try {
      const url = limit 
        ? `${API_BASE_URL}/public/news?limit=${limit}`
        : `${API_BASE_URL}/public/news`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(response.statusText);
      const data = await response.json();
      setNewsList(data);
      return data;
    } catch (err) {
      console.error(err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAllEvents = useCallback(async (limit = null) => {
    setLoading(true);
    try {
      const url = limit 
        ? `${API_BASE_URL}/public/events?limit=${limit}`
        : `${API_BASE_URL}/public/events`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(response.statusText);
      const data = await response.json();
      setEventsList(data);
      return data;
    } catch (err) {
      console.error(err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAllKnowledgeBase = useCallback(async (limit = null) => {
    setLoading(true);
    try {
      const url = limit 
        ? `${API_BASE_URL}/public/knowledge-base?limit=${limit}`
        : `${API_BASE_URL}/public/knowledge-base`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(response.statusText);
      const data = await response.json();
      setKnowledgeBaseList(data);
      return data;
    } catch (err) {
      console.error(err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // --- ПОЛУЧЕНИЕ ПО ID (УБИРАЕМ setLoading, используем useCallback) ---
  // Это предотвратит бесконечные циклы и мерцание

  const fetchNkoById = useCallback(async (id) => {
    // Не ставим setLoading(true), чтобы не перерисовывать всё приложение
    try {
      const response = await fetch(`${API_BASE_URL}/public/nkos/${id}`);
      if (!response.ok) throw new Error(response.statusText);
      return await response.json();
    } catch (err) {
      console.error('Ошибка загрузки НКО:', err);
      return null;
    }
  }, []);

  const fetchNewsById = useCallback(async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/public/news/${id}`);
      if (!response.ok) throw new Error(response.statusText);
      return await response.json();
    } catch (err) {
      console.error('Ошибка загрузки новости:', err);
      return null;
    }
  }, []);

  const fetchEventById = useCallback(async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/public/events/${id}`);
      if (!response.ok) throw new Error(response.statusText);
      return await response.json();
    } catch (err) {
      console.error('Ошибка загрузки события:', err);
      return null;
    }
  }, []);

  const fetchKnowledgeBaseById = useCallback(async (id) => {
    try {
        const response = await fetch(`${API_BASE_URL}/public/knowledge-base/${id}`);
        if (!response.ok) throw new Error(response.statusText);
        return await response.json();
    } catch (err) {
        console.error('Ошибка:', err);
        return null;
    }
  }, []);

  // Загрузка списков при монтировании
  useEffect(() => {
    fetchAllNkos();
    fetchAllNews();
    fetchAllEvents();
    fetchAllKnowledgeBase();
  }, [fetchAllNkos, fetchAllNews, fetchAllEvents, fetchAllKnowledgeBase]); // Добавили зависимости

  const value = {
    nkoList,
    newsList,
    eventsList,
    knowledgeBaseList,
    loading,
    error,
    fetchAllNkos,
    fetchNkoById,
    fetchAllNews,
    fetchNewsById,
    fetchAllEvents,
    fetchEventById,
    fetchAllKnowledgeBase,
    fetchKnowledgeBaseById,
  };

  return (
    <PublicContext.Provider value={value}>
      {children}
    </PublicContext.Provider>
  );
};

export default PublicContext;