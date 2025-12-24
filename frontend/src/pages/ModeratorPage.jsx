// src/pages/ModeratorPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import { 
  FiCheckCircle, 
  FiXCircle, 
  FiSearch,
  FiMapPin,
  FiMail,
  FiHome,
  FiCalendar,
  FiExternalLink
} from 'react-icons/fi';

// Импорт API и компонентов
import * as AdminAPI from '../services/AdminAPI';
import { EventsModerationSection } from '../components/Admin/EventsModerationSection';

const ModeratorPage = () => {
  const { isModerator } = useAuth();
  
  // Табы: 'nko', 'events' (Новости убрали)
  const [activeTab, setActiveTab] = useState('nko');

  // --- СОСТОЯНИЯ ---
  
  // НКО
  const [pendingNkos, setPendingNkos] = useState([]);
  const [nkosLoading, setNkosLoading] = useState(false);
  const [nkosError, setNkosError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNkoId, setSelectedNkoId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // События
  const [pendingEvents, setPendingEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState('');

  // ==================== ЗАГРУЗКА ДАННЫХ ====================

  const loadPendingNkos = useCallback(async () => {
    setNkosLoading(true);
    setNkosError('');
    const result = await AdminAPI.getPendingNkos();
    if (result.success) {
      setPendingNkos(result.data || []);
    } else {
      setNkosError(result.message || 'Ошибка загрузки заявок НКО');
    }
    setNkosLoading(false);
  }, []);

  const loadPendingEvents = useCallback(async () => {
    setEventsLoading(true);
    setEventsError('');
    const result = await AdminAPI.getPendingEvents();
    if (result.success) {
      setPendingEvents(result.data || []);
    } else {
      setEventsError(result.message || 'Ошибка загрузки событий');
    }
    setEventsLoading(false);
  }, []);

  // Загружаем данные при входе
  useEffect(() => {
    if (isModerator) {
      loadPendingNkos();
      loadPendingEvents();
    }
  }, [isModerator, loadPendingNkos, loadPendingEvents]);

  if (!isModerator) {
    return <Navigate to="/" />;
  }

  // ==================== ОБРАБОТЧИКИ НКО ====================

  const handleApproveNko = async (id) => {
    const result = await AdminAPI.approveNko(id);
    if (result.success) {
      await loadPendingNkos();
      alert('НКО одобрена');
    } else {
      alert(`Ошибка: ${result.message}`);
    }
  };

  const handleRejectNko = async () => {
    if (!rejectionReason.trim()) {
      alert('Укажите причину отклонения');
      return;
    }
    const result = await AdminAPI.rejectNko(selectedNkoId, rejectionReason);
    if (result.success) {
      setSelectedNkoId(null);
      setRejectionReason('');
      await loadPendingNkos();
      alert('Заявка НКО отклонена');
    } else {
      alert(`Ошибка: ${result.message}`);
    }
  };

  // ==================== ОБРАБОТЧИКИ СОБЫТИЙ ====================

  const handleApproveEvent = async (id) => {
    const result = await AdminAPI.approveEvent(id);
    if (result.success) {
      await loadPendingEvents();
      alert('Событие одобрено');
    } else {
      alert(`Ошибка: ${result.message}`);
    }
  };

  const handleRejectEvent = async (id, reason) => {
    const result = await AdminAPI.rejectEvent(id, reason);
    if (result.success) {
      await loadPendingEvents();
      alert('Событие отклонено');
    } else {
      alert(`Ошибка: ${result.message}`);
    }
  };

  // ==================== РЕНДЕР: Секция НКО ====================
  const renderNkoModeration = () => {
    if (nkosLoading) return <div className="text-center py-12">Загрузка...</div>;
    if (nkosError) return <div className="text-red-600 p-4 border border-red-200 rounded bg-red-50">{nkosError}</div>;

    const filteredNkos = pendingNkos.filter(nko => 
        (nko.organization_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (nko.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800">Заявки ({filteredNkos.length})</h2>
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Поиск НКО..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-64 focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {filteredNkos.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center text-gray-500">
            Новых заявок нет
          </div>
        ) : (
          <div className="space-y-4">
            {filteredNkos.map(nko => (
              <div key={nko.id || nko.email} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-800">
                        {nko.organization_name || 'Без названия'}
                      </h3>
                      {/* ССЫЛКА НА СТРАНИЦУ НКО */}
                      <Link 
                        to={`/nko/${nko.id}`} 
                        target="_blank"
                        className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                        title="Открыть страницу НКО в новой вкладке"
                      >
                        <FiExternalLink /> Профиль
                      </Link>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-3">
                      {nko.category && <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">{nko.category}</span>}
                      {nko.city && <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium flex items-center gap-1"><FiMapPin className="text-xs" />{nko.city}</span>}
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                      <FiMail className="text-gray-400" />
                      <span>{nko.email}</span>
                    </div>
                    
                    {nko.description && (
                      <p className="text-gray-700 mb-4 line-clamp-3">{nko.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button 
                    onClick={() => handleApproveNko(nko.id)} 
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                  >
                    <FiCheckCircle /> Одобрить
                  </button>
                  <button 
                    onClick={() => setSelectedNkoId(nko.id)} 
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg transition-colors"
                  >
                    <FiXCircle /> Отклонить
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Модалка отклонения */}
        {selectedNkoId && (
          <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Причина отклонения</h3>
              <textarea 
                value={rejectionReason} 
                onChange={(e) => setRejectionReason(e.target.value)} 
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 mb-4" 
                rows="4" 
                placeholder="Опишите причину..."
              />
              <div className="flex gap-3">
                <button onClick={() => { setSelectedNkoId(null); setRejectionReason(''); }} className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg">Отмена</button>
                <button onClick={handleRejectNko} className="flex-1 px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg">Отклонить</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {/* Анимации */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up { animation: fadeInUp 0.4s ease-out forwards; opacity: 0; }
      `}</style>

      <div className="container mx-auto px-4">
        <div className="mb-8 animate-fade-in-up">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Кабинет модератора</h1>
          <p className="text-gray-600">Управление контентом и участниками платформы</p>
        </div>

        {/* Табы */}
        <div className="bg-white rounded-xl shadow-md mb-8 overflow-x-auto animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex border-b border-gray-200">
            {[
              { key: 'nko', label: 'НКО', icon: FiHome, count: pendingNkos.length },
              { key: 'events', label: 'События', icon: FiCalendar, count: pendingEvents.length },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <tab.icon className="text-xl" />
                {tab.label}
                {tab.count > 0 && (
                  <span className="ml-1 bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Контент */}
        <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          {activeTab === 'nko' && renderNkoModeration()}
          
          {activeTab === 'events' && (
            <EventsModerationSection
              events={pendingEvents}
              loading={eventsLoading}
              error={eventsError}
              onApprove={handleApproveEvent}
              onReject={handleRejectEvent}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ModeratorPage;