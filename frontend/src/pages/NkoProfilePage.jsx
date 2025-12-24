import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { getFileUrl, handleImageError } from '../utils/apiUtils';
import { FiEdit, FiSave, FiSend, FiXCircle, FiCalendar, FiUsers, FiPlus, FiArrowRight, FiClock, FiMapPin } from 'react-icons/fi';

// Компонент для отображения статуса
const StatusBadge = ({ status, reason }) => {
  const statusStyles = {
    not_submitted: { text: 'Черновик (не подана)', bg: 'bg-gray-200', text_color: 'text-gray-800' },
    pending: { text: 'На проверке', bg: 'bg-yellow-200', text_color: 'text-yellow-800' },
    approved: { text: 'Одобрена', bg: 'bg-green-200', text_color: 'text-green-800' },
    rejected: { text: 'Отклонена', bg: 'bg-red-200', text_color: 'text-red-800' },
  };
  const currentStatus = statusStyles[status] || statusStyles.not_submitted;

  return (
    <div className="mb-4">
      <p className={`inline-block px-4 py-2 rounded-lg font-semibold ${currentStatus.bg} ${currentStatus.text_color}`}>
        Статус заявки: {currentStatus.text}
      </p>
      {status === 'rejected' && reason && (
        <p className="mt-2 p-3 bg-red-50 border-l-4 border-red-500 text-red-700">
          <strong>Причина отклонения:</strong> {reason}
        </p>
      )}
    </div>
  );
};

const NkoProfilePage = () => {
  const { getNkoProfile, updateNkoProfile, submitNkoProfileForModeration, user } = useAuth();

  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [stats, setStats] = useState({ eventsCount: 0, participantsCount: 0 });
  const [events, setEvents] = useState([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    const result = await getNkoProfile();
    if (result.success) {
      setProfile(result.data);
      setFormData(result.data);
      // Загружаем статистику и события, если есть organization_id
      if (user?.organization_id) {
        fetchStats(user.organization_id);
        fetchEvents(user.organization_id);
      }
    } else {
      setMessage({ type: 'error', text: result.message });
    }
    setIsLoading(false);
  }, [getNkoProfile, user]);

  const fetchStats = async (organizationId) => {
    try {
      // Получаем события организации для статистики
      const eventsResponse = await api.get(`/admin/events/organization/${organizationId}`);
      const events = eventsResponse.data || [];
      
      // Получаем количество участников организации из API
      let membersCount = 0;
      try {
        const membersResponse = await api.get(`/public/nkos/${organizationId}/members-count`);
        if (membersResponse.data && membersResponse.data.members_count !== undefined) {
          membersCount = membersResponse.data.members_count;
        }
      } catch (membersError) {
        console.error('Ошибка загрузки количества участников организации:', membersError);
        // В случае ошибки оставляем значение по умолчанию (0)
      }
      
      setStats({
        eventsCount: events.length,
        participantsCount: membersCount
      });
    } catch (error) {
      console.error('Ошибка загрузки статистики:', error);
      // В случае ошибки оставляем значения по умолчанию
    }
  };

  const fetchEvents = async (organizationId) => {
    setIsLoadingEvents(true);
    try {
      const eventsResponse = await api.get(`/nko/events/${organizationId}`);
      setEvents(eventsResponse.data || []);
    } catch (error) {
      console.error('Ошибка загрузки событий организации:', error);
      setEvents([]);
    } finally {
      setIsLoadingEvents(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setMessage({ type: '', text: '' });
    const result = await updateNkoProfile(formData);
    if (result.success) {
      setProfile(result.data); // Обновляем основной профиль
      setIsEditing(false);
      setMessage({ type: 'success', text: 'Профиль успешно сохранен. Теперь вы можете отправить его на проверку.' });
    } else {
      setMessage({ type: 'error', text: result.message });
    }
  };

  const handleSubmitForModeration = async () => {
    setMessage({ type: '', text: '' });
    const result = await submitNkoProfileForModeration();
    if (result.success) {
        // После успешной отправки обновляем данные профиля, чтобы получить новый статус
        fetchProfile(); 
        setMessage({ type: 'success', text: 'Заявка успешно отправлена на модерацию!' });
    } else {
        setMessage({ type: 'error', text: result.message });
    }
  }

  if (isLoading) return <p className="text-center p-10">Загрузка профиля...</p>;
  if (!profile) return <p className="text-center p-10 text-red-500">Не удалось загрузить профиль.</p>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Заголовок и статистика */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-green-600 to-green-700 p-8 text-white">
            <h1 className="text-3xl font-bold mb-2">{profile.organization_name}</h1>
            <p className="text-green-100">{profile.email}</p>
          </div>

          <div className="p-6">
            <StatusBadge status={profile.moderation_status} reason={profile.rejection_reason} />

            {message.text && (
              <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                {message.text}
              </div>
            )}

            {/* Статистика */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border-2 border-green-200">
                <div className="flex items-center gap-3 mb-2">
                  <FiCalendar className="text-green-600 text-2xl" />
                  <span className="text-sm font-medium text-gray-600">События</span>
                </div>
                <div className="text-3xl font-bold text-green-600">
                  {stats.eventsCount}
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border-2 border-blue-200">
                <div className="flex items-center gap-3 mb-2">
                  <FiUsers className="text-blue-600 text-2xl" />
                  <span className="text-sm font-medium text-gray-600">Участники организации</span>
                </div>
                <div className="text-3xl font-bold text-blue-600">
                  {stats.participantsCount}
                </div>
              </div>
            </div>

            {/* Кнопки действий */}
            <div className="space-y-3 mb-6">
              <button
                onClick={() => setIsEditing(true)}
                className="group flex items-center justify-between w-full px-6 py-4 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all font-medium shadow-md hover:shadow-lg"
              >
                <span className="flex items-center gap-2">
                  <FiEdit />
                  Редактировать профиль НКО
                </span>
                <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
              </button>
              
              <Link
                to="/nko/events/create"
                className="flex items-center justify-center gap-2 w-full px-6 py-4 bg-white hover:bg-gray-50 text-green-600 border-2 border-green-600 rounded-lg transition-all font-medium shadow-sm hover:shadow-md"
              >
                <FiPlus />
                Создать событие
              </Link>
            </div>
          </div>
        </div>

        {/* Информация о профиле */}
        <div className="bg-white p-6 rounded-lg shadow-lg">

        {isEditing ? (
          /* --- ФОРМА РЕДАКТИРОВАНИЯ --- */
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Категория/направление</label>
              <input type="text" name="category" value={formData.category || ''} onChange={handleFormChange} className="mt-1 block w-full p-2 border rounded-md"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Краткое описание (2-3 предложения)</label>
              <textarea name="description" value={formData.description || ''} onChange={handleFormChange} className="mt-1 block w-full p-2 border rounded-md" rows="4"></textarea>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Адрес</label>
              <input type="text" name="address" value={formData.address || ''} onChange={handleFormChange} className="mt-1 block w-full p-2 border rounded-md"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Сайт</label>
              <input type="url" name="website_url" value={formData.website_url || ''} onChange={handleFormChange} className="mt-1 block w-full p-2 border rounded-md"/>
            </div>
            <div className="flex gap-4 pt-4">
              <button onClick={handleSave} className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"><FiSave />Сохранить</button>
              <button onClick={() => { setIsEditing(false); setFormData(profile); }} className="flex items-center gap-2 px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded-lg"><FiXCircle />Отмена</button>
            </div>
          </div>
        ) : (
          /* --- РЕЖИМ ПРОСМОТРА --- */
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-500 mb-1">Категория</h3>
                <p className="text-lg text-gray-800">{profile.category || 'Не указано'}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-500 mb-1">Адрес</h3>
                <p className="text-lg text-gray-800">{profile.address || 'Не указано'}</p>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-500 mb-1">Описание</h3>
              <p className="text-lg text-gray-800 whitespace-pre-wrap">{profile.description || 'Не указано'}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-500 mb-1">Сайт</h3>
              <p className="text-lg">
                {profile.website_url ? (
                  <a href={profile.website_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    {profile.website_url}
                  </a>
                ) : (
                  <span className="text-gray-500">Не указан</span>
                )}
              </p>
            </div>
          </div>
        )}

        {/* --- КНОПКА ОТПРАВКИ НА МОДЕРАЦИЮ --- */}
        {!isEditing && ['not_submitted', 'rejected'].includes(profile.moderation_status) && (
          <div className="mt-8 border-t pt-6">
            <p className="mb-4 text-gray-700">Когда профиль будет полностью заполнен, отправьте его на проверку.</p>
            <button
                onClick={handleSubmitForModeration}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-transform transform hover:scale-105"
            >
              <FiSend /> Отправить на подтверждение
            </button>
          </div>
        )}
        </div>

        {/* События организации */}
        <div className="bg-white p-6 rounded-lg shadow-lg mt-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <FiCalendar className="text-green-600" />
            События организации
          </h2>
          
          {isLoadingEvents ? (
            <p className="text-center p-10 text-gray-500">Загрузка событий...</p>
          ) : events.length === 0 ? (
            <div className="text-center p-10">
              <p className="text-gray-500 mb-4">У организации пока нет событий</p>
              <Link
                to="/nko/events/create"
                className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all font-medium shadow-md hover:shadow-lg"
              >
                <FiPlus />
                Создать первое событие
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => {
                const eventDate = event.date || event.date_time_event || event.event_date;
                const formattedDate = eventDate ? new Date(eventDate).toLocaleDateString('ru-RU', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                }) : 'Дата не указана';
                const eventTime = event.time || (eventDate ? new Date(eventDate).toLocaleTimeString('ru-RU', {
                  hour: '2-digit',
                  minute: '2-digit'
                }) : '');
                const rawImage = event.image || (event.images && event.images.length > 0 ? event.images[0] : null);
                const eventImageUrl = getFileUrl(rawImage);

                return (
                  <Link
                    key={event.id}
                    to={`/events/${event.id}`}
                    className="block"
                  >
                    <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 h-full flex flex-col group cursor-pointer">
                      {/* Изображение */}
                      {rawImage ? (
                        <div className="relative h-48 overflow-hidden">
                          <img
                            src={eventImageUrl}
                            alt={event.name || event.title || 'Событие'}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={handleImageError}
                          />
                        </div>
                      ) : (
                        <div className="w-full h-48 bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
                          <FiCalendar className="text-6xl text-green-300" />
                        </div>
                      )}

                      {/* Контент */}
                      <div className="p-5 flex-1 flex flex-col">
                        {event.category_event_name && (
                          <span className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold mb-3">
                            {event.category_event_name}
                          </span>
                        )}
                        
                        <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2 group-hover:text-green-600 transition-colors">
                          {event.name || event.title || 'Без названия'}
                        </h3>
                        
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2 flex-1">
                          {event.description || 'Описание отсутствует'}
                        </p>
                        
                        <div className="space-y-2 text-sm text-gray-500 mb-4">
                          <div className="flex items-center gap-2">
                            <FiCalendar className="text-green-500" />
                            <span>{formattedDate}</span>
                          </div>
                          {eventTime && (
                            <div className="flex items-center gap-2">
                              <FiClock className="text-green-500" />
                              <span>{eventTime}</span>
                            </div>
                          )}
                          {event.address && (
                            <div className="flex items-center gap-2">
                              <FiMapPin className="text-green-500" />
                              <span className="line-clamp-1">{event.address}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="mt-auto pt-4 border-t border-gray-100">
                          <span className="text-green-600 font-medium group-hover:text-green-700 inline-flex items-center">
                            Подробнее
                            <FiArrowRight className="ml-1 group-hover:translate-x-1 transition-transform" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NkoProfilePage;