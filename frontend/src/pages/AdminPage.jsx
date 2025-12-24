// src/pages/AdminPage.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePublic } from '../contexts/PublicContext';
import {
  FiUsers,
  FiHome,
  FiFileText,
  FiCalendar,
  FiTrendingUp,
  FiBook,
  FiCheckSquare, // Иконка для модерации событий
} from 'react-icons/fi';

// API методы
import * as AdminAPI from '../services/AdminAPI';
import { adminService } from '../services/statisticService'; // Проверьте путь, если создавали как adminService.js

// Компоненты
import { StatsSection } from '../components/Admin/StatsSection';
import { NkoModerationSection } from '../components/Admin/NkoModerationSection';
import { UsersSection } from '../components/Admin/UsersSection';
import { NewsSection } from '../components/Admin/NewsSection';
import { EventsSection } from '../components/Admin/EventsSection';
import { KnowledgeBaseSection } from '../components/Admin/KnowledgeBaseSection';
import { EventsModerationSection } from '../components/Admin/EventsModerationSection';

const DEFAULT_ROLE_ID_MAP = {
  user: 1,
  nko: 2,
  moderator: 3,
  admin: 4,
};

const AdminPage = () => {
  const { user, isAdmin } = useAuth();
  const { 
    nkoList,
    newsList, 
    eventsList, 
    knowledgeBaseList,
    fetchAllNkos,
    fetchAllNews,
    fetchAllEvents,
    fetchAllKnowledgeBase,
  } = usePublic();

  const [activeTab, setActiveTab] = useState('stats');

  // Состояния
  const [stats, setStats] = useState({
    totalUsers: 0, totalNko: 0, pendingNko: 0, totalEvents: 0, totalNews: 0, totalKnowledgeBase: 0,
  });

  const [pendingNkos, setPendingNkos] = useState([]);
  const [nkosLoading, setNkosLoading] = useState(false);
  const [nkosError, setNkosError] = useState('');

  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState('');
  const [roleIdMap, setRoleIdMap] = useState(DEFAULT_ROLE_ID_MAP);

  const [newsLoading, setNewsLoading] = useState(false);
  const [newsError, setNewsError] = useState('');
  
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState('');
  
  const [kbLoading, setKbLoading] = useState(false);

  const [pendingEvents, setPendingEvents] = useState([]);
  const [pendingEventsLoading, setPendingEventsLoading] = useState(false);
  const [pendingEventsError, setPendingEventsError] = useState('');

  // ==================== ЗАГРУЗКА ДАННЫХ ====================

  const loadStatistics = async () => {
    try {
      const data = await adminService.getStatistics();
      setStats(data);
    } catch (error) {
      console.error("Failed to load stats", error);
      setStats({
        totalUsers: users.length,
        totalNko: nkoList.length,
        pendingNko: pendingNkos.length,
        totalEvents: eventsList.length,
        totalNews: newsList.length,
        totalKnowledgeBase: knowledgeBaseList.length,
      });
    }
  };

  const loadPendingNkos = async () => {
    setNkosLoading(true);
    setNkosError('');
    const result = await AdminAPI.getPendingNkos();
    if (result.success) setPendingNkos(result.data || []);
    else {
      setNkosError(result.message || 'Ошибка загрузки заявок');
      setPendingNkos([]);
    }
    setNkosLoading(false);
  };

  const loadPendingEvents = async () => {
    setPendingEventsLoading(true);
    setPendingEventsError('');
    const result = await AdminAPI.getPendingEvents();
    if (result.success) setPendingEvents(result.data || []);
    else {
      setPendingEventsError(result.message || 'Ошибка загрузки');
      setPendingEvents([]);
    }
    setPendingEventsLoading(false);
  };

  const loadUsers = async () => {
    setUsersLoading(true);
    setUsersError('');
    const result = await AdminAPI.getAllUsers();
    if (result.success) {
      const fetchedUsers = result.data || [];
      const normalizedUsers = fetchedUsers.map((userRecord) => ({
        ...userRecord,
        registered_date: userRecord.registered_date || userRecord.date_create || null,
      }));
      setUsers(normalizedUsers);

      const derivedRoleMap = normalizedUsers.reduce((acc, userRecord) => {
        if (userRecord.role_name && userRecord.role_id) {
          acc[userRecord.role_name] = userRecord.role_id;
        }
        return acc;
      }, {});

      if (Object.keys(derivedRoleMap).length) {
        setRoleIdMap((prev) => ({ ...prev, ...derivedRoleMap }));
      }
    } else {
      setUsersError(result.message || 'Ошибка загрузки пользователей');
      setUsers([]);
    }
    setUsersLoading(false);
  };

  // ==================== ОБРАБОТЧИКИ ====================

  // НКО
  const handleApproveNko = async (id) => {
    const result = await AdminAPI.approveNko(id);
    if (result.success) {
      await loadPendingNkos();
      loadStatistics(); 
      alert('НКО успешно одобрена!');
    } else alert(`Ошибка: ${result.message}`);
  };

  const handleRejectNko = async (id, reason) => {
    const result = await AdminAPI.rejectNko(id, reason);
    if (result.success) {
      await loadPendingNkos();
      loadStatistics();
      alert('Заявка отклонена');
    } else alert(`Ошибка: ${result.message}`);
  };

  // События (Модерация)
  const handleApprovePendingEvent = async (id) => {
    const result = await AdminAPI.approveEvent(id);
    if (result.success) {
      await loadPendingEvents();
      loadStatistics();
      alert('Событие одобрено!');
    } else alert(`Ошибка: ${result.message}`);
  };

  const handleRejectPendingEvent = async (id, reason) => {
    const result = await AdminAPI.rejectEvent(id, reason);
    if (result.success) {
      await loadPendingEvents();
      loadStatistics();
      alert('Событие отклонено');
    } else alert(`Ошибка: ${result.message}`);
  };

  // Пользователи
  const handleRoleChange = async (targetUser, newRoleName) => {
    if (!targetUser?.id || !roleIdMap[newRoleName]) return;
    const result = await AdminAPI.updateUserRole(targetUser.id, roleIdMap[newRoleName]);
    if (result.success) {
      setUsers(curr => curr.map(u => u.id === targetUser.id ? { ...u, role: newRoleName, role_name: newRoleName } : u));
      alert('Роль обновлена!');
    } else alert(`Ошибка: ${result.message}`);
  };

  // Новости
  const handleSaveNews = async (newsData, newsId) => {
    setNewsLoading(true);
    const payload = { ...newsData };
    if (newsData.cityId) payload.city_id = Number(newsData.cityId);
    
    const result = newsId ? await AdminAPI.updateNews(newsId, payload) : await AdminAPI.createNews(payload);
    
    if (result.success) {
      // Логика файлов (упрощено)
      const targetId = newsId || result.data?.id;
      if (targetId && newsData.imageFile) await AdminAPI.uploadNewsImage(targetId, newsData.imageFile);
      
      await fetchAllNews();
      loadStatistics();
      alert(newsId ? 'Новость обновлена!' : 'Новость создана!');
    } else alert(`Ошибка: ${result.message}`);
    setNewsLoading(false);
  };

  const handleDeleteNews = async (newsId) => {
    setNewsLoading(true);
    const result = await AdminAPI.deleteNews(newsId);
    if (result.success) {
      await fetchAllNews();
      loadStatistics();
    } else alert(`Ошибка: ${result.message}`);
    setNewsLoading(false);
  };

  // События (CRUD)
  const handleSaveEvent = async (eventData, eventId) => {
    setEventsLoading(true);
    const result = eventId ? await AdminAPI.updateEvent(eventId, eventData) : await AdminAPI.createEvent(eventData);
    if (result.success) {
      await fetchAllEvents();
      loadStatistics();
      alert(eventId ? 'Событие обновлено!' : 'Событие создано!');
    } else alert(`Ошибка: ${result.message}`);
    setEventsLoading(false);
  };

  const handleDeleteEvent = async (eventId) => {
    setEventsLoading(true);
    const result = await AdminAPI.deleteEvent(eventId);
    if (result.success) {
      await fetchAllEvents();
      loadStatistics();
    } else alert(`Ошибка: ${result.message}`);
    setEventsLoading(false);
  };

  // База знаний
  const handleSaveKb = async (kbData, kbId) => {
    setKbLoading(true);
    const result = kbId ? await AdminAPI.updateKnowledgeBase(kbId, kbData) : await AdminAPI.createKnowledgeBase(kbData);
    if (result.success) {
      await fetchAllKnowledgeBase();
      alert(kbId ? 'Материал обновлен!' : 'Материал создан!');
    } else alert(`Ошибка: ${result.message}`);
    setKbLoading(false);
  };

  const handleDeleteKb = async (kbId) => {
    setKbLoading(true);
    const result = await AdminAPI.deleteKnowledgeBase(kbId);
    if (result.success) {
      await fetchAllKnowledgeBase();
    } else alert(`Ошибка: ${result.message}`);
    setKbLoading(false);
  };

  // ==================== ЭФФЕКТЫ ====================

  useEffect(() => {
    if (isAdmin) {
      // При первой загрузке страницы загружаем важные данные
      loadStatistics();
      loadPendingNkos();
      loadPendingEvents();
      
      // Данные для табов загружаем по необходимости или все сразу
      if (activeTab === 'users') loadUsers();
      if (activeTab === 'news') fetchAllNews();
      if (activeTab === 'events') fetchAllEvents();
      if (activeTab === 'knowledge') fetchAllKnowledgeBase();
    }
  }, [activeTab, isAdmin]);

  // ==================== РЕНДЕР ====================

  // Конфигурация табов с подсветкой
  const tabs = [
    { key: 'stats', label: 'Статистика', icon: FiTrendingUp },
    { 
      key: 'events_moderation', 
      label: 'Модерация событий', 
      icon: FiCheckSquare, 
      count: pendingEvents.length // <-- Счетчик
    },
    { 
      key: 'nko', 
      label: 'Модерация НКО', 
      icon: FiHome, 
      count: pendingNkos.length // <-- Счетчик
    },
    { key: 'users', label: 'Пользователи', icon: FiUsers },
    { key: 'news', label: 'Новости', icon: FiFileText },
    { key: 'events', label: 'События', icon: FiCalendar },
    { key: 'knowledge', label: 'База знаний', icon: FiBook },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {/* Анимации */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up { animation: fadeInUp 0.4s ease-out forwards; opacity: 0; }
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
      `}</style>

      <div className="container mx-auto px-4">
        {/* Заголовок */}
        <div className="mb-8 animate-fade-in-up">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Панель администратора
          </h1>
          <p className="text-gray-600">
            Управление платформой "Добрые дела Росатома"
          </p>
        </div>

        {/* Табы */}
        <div className="bg-white rounded-xl shadow-md mb-8 overflow-x-auto animate-fade-in-up delay-100">
          <div className="flex border-b border-gray-200 min-w-max">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-6 py-4 font-medium transition-all relative ${
                    isActive
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  <Icon className={`text-xl ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                  
                  <span>{tab.label}</span>
                  
                  {/* БЕЙДЖ СЧЕТЧИКА */}
                  {tab.count > 0 && (
                    <span className={`ml-1 text-xs px-2 py-0.5 rounded-full font-bold shadow-sm ${
                      isActive 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-red-100 text-red-600'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Контент вкладок */}
        <div className="animate-fade-in-up delay-200">
          {activeTab === 'stats' && <StatsSection stats={stats} />}
            
          {activeTab === 'events_moderation' && (
            <EventsModerationSection
              events={pendingEvents}
              loading={pendingEventsLoading}
              error={pendingEventsError}
              onApprove={handleApprovePendingEvent}
              onReject={handleRejectPendingEvent}
            />
          )}

          {activeTab === 'nko' && (
            <NkoModerationSection
              pendingNkos={pendingNkos}
              loading={nkosLoading}
              error={nkosError}
              onApprove={handleApproveNko}
              onReject={handleRejectNko}
            />
          )}

          {activeTab === 'users' && (
            <UsersSection
              users={users}
              loading={usersLoading}
              error={usersError}
              currentUserEmail={user.email}
              onRoleChange={handleRoleChange}
            />
          )}

          {activeTab === 'news' && (
            <NewsSection
              news={newsList}
              loading={newsLoading}
              error={newsError}
              onSave={handleSaveNews}
              onDelete={handleDeleteNews}
            />
          )}

          {activeTab === 'events' && (
            <EventsSection
              events={eventsList}
              loading={eventsLoading}
              error={eventsError}
              onSave={handleSaveEvent}
              onDelete={handleDeleteEvent}
            />
          )}

          {activeTab === 'knowledge' && (
            <KnowledgeBaseSection
              items={knowledgeBaseList}
              loading={kbLoading}
              error=""
              onSave={handleSaveKb}
              onDelete={handleDeleteKb}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPage;