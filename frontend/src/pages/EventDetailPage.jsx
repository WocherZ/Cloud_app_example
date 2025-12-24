// src/pages/EventDetailPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { usePublic } from '../contexts/PublicContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { useAuth } from '../contexts/AuthContext';
import { getFileUrl, handleImageError } from '../utils/apiUtils';
import AuthTooltip from '../components/Shared/AuthTooltip';

import { 
  FiCalendar, FiMapPin, FiClock, FiUser, FiPhone, FiMail, 
  FiArrowLeft, FiUsers, FiCheck, FiX, FiAlertCircle 
} from 'react-icons/fi';
import { FaHeart, FaRegHeart } from 'react-icons/fa';

const EventDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { fetchEventById, loading } = usePublic();
  const { user } = useAuth();
  
  const { 
    isEventFavorite, toggleEventFavorite, 
    isAttendingEvent, toggleAttendingEvent 
  } = useFavorites();
  
  const [event, setEvent] = useState(null);
  const [error, setError] = useState(null);

  // Тултипы
  const [showTopFavTooltip, setShowTopFavTooltip] = useState(false);
  const topFavBtnRef = useRef(null);
  const [showBottomFavTooltip, setShowBottomFavTooltip] = useState(false);
  const bottomFavBtnRef = useRef(null);
  const [showAttendTooltip, setShowAttendTooltip] = useState(false);
  const attendBtnRef = useRef(null);

  useEffect(() => {
    const loadEvent = async () => {
      try {
        const data = await fetchEventById(id);
        if (data) setEvent(data);
        else setError('Событие не найдено');
      } catch (err) {
        setError(err.message || 'Ошибка загрузки');
      }
    };
    loadEvent();
  }, [id, fetchEventById]);

  useEffect(() => {
    const timers = [];
    if (showTopFavTooltip) timers.push(setTimeout(() => setShowTopFavTooltip(false), 3000));
    if (showBottomFavTooltip) timers.push(setTimeout(() => setShowBottomFavTooltip(false), 3000));
    if (showAttendTooltip) timers.push(setTimeout(() => setShowAttendTooltip(false), 3000));
    return () => timers.forEach(clearTimeout);
  }, [showTopFavTooltip, showBottomFavTooltip, showAttendTooltip]);

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
    </div>
  );

  if (error || !event) return (
    <div className="container mx-auto px-4 py-12 text-center">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">{error || 'Событие не найдено'}</h2>
      <Link to="/calendar" className="text-blue-600 hover:text-blue-800">← Вернуться к календарю</Link>
    </div>
  );

  const isFavorite = isEventFavorite(event.id);
  const attending = isAttendingEvent(event.id);

  // --- ЛОГИКА ДАТЫ И АКТУАЛЬНОСТИ ---
  const dateString = event.date || event.event_date || event.event_datetime;
  const eventDate = dateString ? new Date(dateString) : new Date();
  
  // Проверка: прошло ли событие (сравниваем с "вчера", чтобы событие сегодня считалось активным)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isEventPassed = eventDate < today;

  const formattedDate = eventDate.toLocaleDateString('ru-RU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const eventTime = event.time || '00:00';

  // Хендлеры
  const handleTopFavoriteClick = (e) => {
    e.stopPropagation();
    if (user) toggleEventFavorite(event);
    else setShowTopFavTooltip(true);
  };

  const handleBottomFavoriteClick = (e) => {
    e.stopPropagation();
    if (user) toggleEventFavorite(event);
    else setShowBottomFavTooltip(true);
  };

  const handleAttendingClick = () => {
    if (isEventPassed) return; // Блокируем клик если прошло
    if (user) toggleAttendingEvent(event.id);
    else setShowAttendTooltip(true);
  };

  const handleCancelAttending = () => {
    if (window.confirm('Отменить участие в событии?')) toggleAttendingEvent(event.id);
  };

  // Данные
  const nkoData = event.nko || event.organization; 
  const organizerName = nkoData?.name || nkoData?.organization_name || event.organizer || "Организатор";
  const organizerLogo = nkoData?.logo || nkoData?.logo_url;
  const organizerId = nkoData?.id || event.organizationId;
  const rawImage = event.image || event.image_url || (event.images && event.images.length > 0 ? event.images[0] : null);
  const eventImage = getFileUrl(rawImage);
  
  // Логика адреса
  const location = event.location || '';
  const address = event.address || '';
  const city = event.city || '';
  const showAddress = address && !location.includes(address);
  const mapsQuery = encodeURIComponent(`${city}, ${location || address}`);

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      {/* Стили анимаций */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up { animation: fadeInUp 0.6s ease-out forwards; opacity: 0; }
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-300 { animation-delay: 0.3s; }
      `}</style>

      {/* ИЗМЕНЕНИЕ: Увеличена ширина контейнера до max-w-7xl */}
      <div className="container mx-auto px-4 max-w-7xl">
        
        {/* Навигация */}
        <button onClick={() => navigate('/calendar')} className="group flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-6 transition-colors font-medium">
          <div className="p-2 bg-white rounded-full shadow-sm group-hover:shadow-md transition-all group-hover:-translate-x-1">
            <FiArrowLeft />
          </div>
          <span>Назад к календарю</span>
        </button>

        <div className="bg-white rounded-2xl shadow-xl relative animate-fade-in-up overflow-hidden">
          
          {/* ВЕРХНЯЯ КНОПКА ИЗБРАННОГО */}
          <div className="absolute top-6 right-6 z-30">
            <AuthTooltip isVisible={showTopFavTooltip} anchorRef={topFavBtnRef} />
            <button
              ref={topFavBtnRef}
              onClick={handleTopFavoriteClick}
              className="p-3 bg-white/90 backdrop-blur-md rounded-full shadow-lg hover:scale-110 transition-transform group border border-gray-100"
              title={isFavorite ? 'Удалить из избранного' : 'Добавить в избранное'}
            >
              {isFavorite ? <FaHeart className="text-red-500 text-2xl drop-shadow-sm" /> : <FaRegHeart className="text-gray-600 text-2xl group-hover:text-red-500 transition-colors" />}
            </button>
          </div>

          {/* --- ПЕРЕРАБОТАННАЯ ШАПКА (HERO STYLE) --- */}
          <div className="relative w-full h-[450px] flex items-end">
            {/* Фон шапки: Картинка или Градиент */}
            {eventImage && rawImage ? (
              <>
                <img src={eventImage} alt={event.title} onError={handleImageError} className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent"></div>
              </>
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900">
                 <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
              </div>
            )}

            {/* Контент шапки */}
            <div className="relative z-10 p-8 md:p-12 w-full">
              {/* Теги */}
              <div className="flex flex-wrap gap-3 mb-4">
                {event.category && (
                  <span className="px-4 py-1.5 bg-white/20 backdrop-blur-md text-white border border-white/20 rounded-full text-sm font-bold tracking-wide uppercase">
                    {event.category}
                  </span>
                )}
                {isEventPassed && (
                  <span className="px-4 py-1.5 bg-red-500/80 backdrop-blur-md text-white rounded-full text-sm font-bold uppercase flex items-center gap-2">
                    <FiAlertCircle /> Завершено
                  </span>
                )}
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight drop-shadow-lg">
                {event.title}
              </h1>

              <div className="flex flex-wrap gap-6 text-blue-50">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm"><FiCalendar className="text-xl" /></div>
                  <span className="text-lg capitalize font-medium">{formattedDate}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm"><FiClock className="text-xl" /></div>
                  <span className="text-lg font-medium">{eventTime}</span>
                </div>
                {event.city && (
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm"><FiMapPin className="text-xl" /></div>
                    <span className="text-lg font-medium">{event.city}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* ----------------------------------------- */}

          {/* Основной контент */}
          <div className="p-8 md:p-12">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              
              {/* Левая колонка (Основная информация) */}
              <div className="lg:col-span-2 space-y-10 animate-fade-in-up delay-100">
                <section>
                  <h2 className="text-2xl font-bold text-gray-800 mb-6 border-l-4 border-blue-500 pl-4">О событии</h2>
                  <div className="prose prose-lg max-w-none text-gray-600 leading-relaxed whitespace-pre-wrap">
                    {event.fullDescription || event.full_description || event.description}
                  </div>
                </section>

                {/* Условия участия */}
                {(event.maxParticipants || event.registrationRequired !== undefined || event.isFree !== undefined) && (
                  <section className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-8 border border-blue-100 shadow-sm">
                    <h3 className="text-xl font-bold text-gray-800 mb-6">Условия участия</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {event.maxParticipants && (
                        <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-gray-100">
                          <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
                            <FiUsers className="text-xl" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">Количество мест</p>
                            <p className="text-lg font-bold text-gray-800">{event.maxParticipants}</p>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-gray-100">
                         <div className={`p-3 rounded-full ${event.isFree ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                            {event.isFree ? <FiCheck className="text-xl" /> : <span className="font-bold text-lg">₽</span>}
                         </div>
                         <div>
                            <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">Стоимость</p>
                            <p className="text-lg font-bold text-gray-800">
                              {event.isFree ? 'Бесплатно' : 'Платно'}
                            </p>
                         </div>
                      </div>
                    </div>
                  </section>
                )}
              </div>

              {/* Сайдбар (Правая колонка) */}
              <div className="space-y-8 animate-fade-in-up delay-200">
                
                {/* Карточка Организатора */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 mb-4 text-blue-600 font-semibold uppercase text-xs tracking-wider">
                    <FiUser /><span>Организатор</span>
                  </div>
                  <div className="flex items-start gap-4">
                    {organizerLogo ? (
                      <img src={getFileUrl(organizerLogo)} alt={organizerName} onError={handleImageError} className="w-16 h-16 rounded-xl object-cover bg-gray-50 border border-gray-100"/>
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 text-2xl font-bold">{organizerName.charAt(0)}</div>
                    )}
                    <div className="flex-1 overflow-hidden">
                      <h3 className="font-bold text-gray-900 line-clamp-2 text-lg mb-1">{organizerName}</h3>
                      {organizerId ? (
                        <Link to={`/nko/${organizerId}`} className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline">
                          Перейти к профилю
                        </Link>
                      ) : (
                        <p className="text-sm text-gray-500">{event.organizerDescription}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Карточка Адреса */}
                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
                  <div className="flex items-center gap-2 mb-3 text-blue-600 font-semibold uppercase text-xs tracking-wider">
                    <FiMapPin /><span>Где пройдет</span>
                  </div>
                  
                  <a 
                    href={`https://yandex.ru/maps/?text=${mapsQuery}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="group block hover:opacity-80 transition-opacity"
                    title="Открыть на Яндекс.Картах"
                  >
                    <p className="text-gray-900 font-bold text-lg mb-1 group-hover:text-blue-700 transition-colors">
                      {location}
                    </p>
                    {showAddress && (
                      <p className="text-gray-600 text-sm">{address}</p>
                    )}
                    <span className="inline-block mt-3 text-xs font-medium text-blue-600 border-b border-blue-200 group-hover:border-blue-600 transition-all">
                      Показать на карте →
                    </span>
                  </a>
                </div>

                {/* Контакты */}
                {(event.phone || event.email) && (
                  <div className="bg-white border border-gray-200 p-6 rounded-2xl">
                    <div className="flex items-center gap-2 mb-4 text-gray-400 font-semibold uppercase text-xs tracking-wider">
                      Контакты
                    </div>
                    <div className="space-y-3">
                      {event.phone && (
                        <a href={`tel:${event.phone}`} className="flex items-center gap-3 text-gray-700 hover:text-blue-600 transition-colors p-2 hover:bg-gray-50 rounded-lg -mx-2">
                          <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center text-blue-600"><FiPhone /></div>
                          <span className="font-medium">{event.phone}</span>
                        </a>
                      )}
                      {event.email && (
                        <a href={`mailto:${event.email}`} className="flex items-center gap-3 text-gray-700 hover:text-blue-600 transition-colors p-2 hover:bg-gray-50 rounded-lg -mx-2">
                          <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center text-blue-600"><FiMail /></div>
                          <span className="truncate font-medium">{event.email}</span>
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* НИЖНЯЯ ПАНЕЛЬ ДЕЙСТВИЙ */}
            <div className="mt-16 pt-8 border-t border-gray-200 animate-fade-in-up delay-300">
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                
                {/* Кнопка УЧАСТИЯ (С проверкой на прошедшее событие) */}
                <div className="relative w-full sm:w-auto">
                  {!isEventPassed && (
                    <div className="absolute bottom-full mb-2 w-full flex justify-center pointer-events-none">
                       <div className="pointer-events-auto"><AuthTooltip isVisible={showAttendTooltip} /></div>
                    </div>
                  )}

                  <button
                    ref={attendBtnRef}
                    onClick={handleAttendingClick}
                    disabled={isEventPassed} // Блокируем, если прошло
                    className={`
                      w-full px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-lg flex items-center justify-center gap-3
                      ${isEventPassed 
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none' // Стили для прошедшего
                        : attending 
                          ? 'bg-green-600 hover:bg-green-700 text-white hover:-translate-y-1 active:scale-95' 
                          : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white hover:-translate-y-1 active:scale-95'
                      }
                    `}
                  >
                    {isEventPassed ? (
                      'Событие завершено'
                    ) : attending ? (
                      <><FiCheck className="text-2xl" /> Вы участвуете</>
                    ) : (
                      'Хочу посетить'
                    )}
                  </button>
                </div>
                
                {/* Кнопка ИЗБРАННОГО (Нижняя) */}
                <div className="relative w-full sm:w-auto">
                  <div className="absolute bottom-full mb-2 w-full flex justify-center pointer-events-none"><div className="pointer-events-auto"><AuthTooltip isVisible={showBottomFavTooltip} anchorRef={bottomFavBtnRef} /></div></div>
                  <button
                    ref={bottomFavBtnRef}
                    onClick={handleBottomFavoriteClick}
                    className={`w-full px-8 py-4 rounded-xl font-bold text-lg border-2 transition-all flex items-center justify-center gap-3 hover:shadow-md ${isFavorite ? 'border-red-400 bg-red-50 text-red-600 hover:bg-red-100' : 'border-gray-200 text-gray-700 hover:border-blue-300 hover:text-blue-600 bg-white'}`}
                  >
                    {isFavorite ? <FaHeart /> : <FaRegHeart />} {isFavorite ? 'В избранном' : 'В избранное'}
                  </button>
                </div>

                {attending && !isEventPassed && (
                  <button onClick={handleCancelAttending} className="w-full sm:w-auto px-6 py-4 text-red-500 font-medium hover:bg-red-50 rounded-xl transition-colors flex items-center justify-center gap-2">
                    <FiX /> Не смогу пойти
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetailPage;