// src/contexts/FavoritesContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { favoritesService } from '../services/favoritesService';
import { userService } from '../services/userService'; 

const FavoritesContext = createContext();

export const useFavorites = () => useContext(FavoritesContext);

export const FavoritesProvider = ({ children }) => {
  const { user } = useAuth();
  
  // Состояния для всех типов избранного
  const [favoriteEvents, setFavEvents] = useState([]);
  const [favoriteNews, setFavNews] = useState([]);
  const [favoriteNkos, setFavNkos] = useState([]);
  const [favoriteKnowledgeBase, setFavKB] = useState([]); 
  const [isLoading, setIsLoading] = useState(false);
  const [attendingEvents, setAttendingEvents] = useState([]); 

  // Загрузка данных при входе
  useEffect(() => {
    if (user) {
      loadFavorites();
    } else {
      // Очистка при выходе
      setFavEvents([]);
      setFavNews([]);
      setFavNkos([]);
      setFavKB([]);
    }
  }, [user]);

  const loadFavorites = async () => {
  setIsLoading(true);
  try {
    // ВАЖНО: Мы объявляем переменную myEventsResp здесь, 5-м элементом
    const [events, news, nkos, kb, myEventsResp] = await Promise.allSettled([
      favoritesService.getFavoriteEvents(),                      // 1
      favoritesService.getFavoriteNews(),                        // 2
      favoritesService.getFavoriteNkos().catch(() => []),        // 3
      favoritesService.getFavoriteKnowledgeBase().catch(() => []), // 4
      userService.getMyEvents().catch(() => [])                  // 5 <--- Вот этот запрос
    ]);

    if (events.status === 'fulfilled') setFavEvents(events.value);
    if (news.status === 'fulfilled') setFavNews(news.value);
    if (nkos.status === 'fulfilled') setFavNkos(nkos.value);
    if (kb.status === 'fulfilled') setFavKB(kb.value);

    // Теперь переменная myEventsResp существует и мы можем её проверить
    if (myEventsResp.status === 'fulfilled') {
      setAttendingEvents(myEventsResp.value);
    }

  } catch (e) {
    console.error("Error loading favorites data", e);
  } finally {
    setIsLoading(false);
  }
};


  
  // --- EVENTS ---
  const isEventFavorite = (id) => favoriteEvents.some(e => e.id === id);
  const toggleEventFavorite = async (event) => {
    const isFav = isEventFavorite(event.id);
    setFavEvents(prev => isFav ? prev.filter(e => e.id !== event.id) : [...prev, event]);
    try {
      if (isFav) await favoritesService.removeEventFromFavorites(event.id);
      else await favoritesService.addEventToFavorites(event.id);
    } catch (e) {
      console.error(e); loadFavorites();
    }
  };

  // --- NEWS ---
  const isNewsFavorite = (id) => favoriteNews.some(n => n.id === id);
  const toggleNewsFavorite = async (newsItem) => {
    const isFav = isNewsFavorite(newsItem.id);
    setFavNews(prev => isFav ? prev.filter(n => n.id !== newsItem.id) : [...prev, newsItem]);
    try {
      if (isFav) await favoritesService.removeNewsFromFavorites(newsItem.id);
      else await favoritesService.addNewsToFavorites(newsItem.id);
    } catch (e) {
      console.error(e); loadFavorites();
    }
  };

  // --- NKOS ---
  const isNkoFavorite = (id) => favoriteNkos.some(n => n.id === id);
  const toggleNkoFavorite = async (nkoItem) => {
    const isFav = isNkoFavorite(nkoItem.id);
    setFavNkos(prev => isFav ? prev.filter(n => n.id !== nkoItem.id) : [...prev, nkoItem]);
    try {
      if (isFav) await favoritesService.removeNkoFromFavorites(nkoItem.id);
      else await favoritesService.addNkoToFavorites(nkoItem.id);
    } catch (e) {
      console.error(e); loadFavorites();
    }
  };

  // --- KNOWLEDGE BASE (БАЗА ЗНАНИЙ) ---
  const isKnowledgeBaseFavorite = (id) => favoriteKnowledgeBase.some(item => item.id === id);
  const toggleKnowledgeBaseFavorite = async (item) => {
    const isFav = isKnowledgeBaseFavorite(item.id);
    setFavKB(prev => isFav ? prev.filter(x => x.id !== item.id) : [...prev, item]);
    try {
      if (isFav) await favoritesService.removeKnowledgeBaseFromFavorites(item.id);
      else await favoritesService.addKnowledgeBaseToFavorites(item.id);
    } catch (e) {
      console.error(e); loadFavorites();
    }
  };

  // --- ATTENDING EVENTS ---
  const isAttendingEvent = (id) => attendingEvents.some(e => e.id === id);

  const toggleAttendingEvent = async (eventId) => {
    const isAttending = isAttendingEvent(eventId);
    
    try {
      if (isAttending) {
        // Если уже записан - отменяем
        await userService.unregisterFromEvent(eventId);
        setAttendingEvents(prev => prev.filter(e => e.id !== eventId));
      } else {
        // Если не записан - регистрируемся
        await userService.registerForEvent(eventId);
        // Чтобы получить полный объект события для списка, лучше перезагрузить список
        // Или можно оптимистично добавить, если у нас есть объект события на руках (но тут принимаем ID)
        const updatedList = await userService.getMyEvents(); 
        setAttendingEvents(updatedList);
      }
    } catch (e) {
      console.error("Error toggling event registration", e);
      alert("Ошибка при регистрации на событие");
    }
  };

  return (
    <FavoritesContext.Provider value={{
      // Данные
      favoriteEvents, 
      favoriteNews, 
      favoriteNkos, 
      favoriteKnowledgeBase, // <--- Теперь это поле точно есть
      isLoading,
      
      // Методы Events
      isEventFavorite, toggleEventFavorite,
      
      // Методы News
      isNewsFavorite, toggleNewsFavorite,
      
      // Методы NKO
      isNkoFavorite, toggleNkoFavorite,
      
      // Методы Knowledge Base
      isKnowledgeBaseFavorite, toggleKnowledgeBaseFavorite,

      // Методы Attending
      attendingEvents, // Теперь это массив объектов!
      toggleAttendingEvent,
      isAttendingEvent
      
    }}>
      {children}
    </FavoritesContext.Provider>
  );
};