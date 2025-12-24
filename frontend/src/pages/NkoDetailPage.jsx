// src/pages/NkoDetailPage.jsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePublic } from '../contexts/PublicContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  FiArrowLeft, FiMapPin, FiPhone, FiMail, FiExternalLink, 
  FiCheckCircle, FiUsers, FiCalendar, FiAward, FiDownload, 
  FiZoomIn, FiInfo, FiClock, FiXCircle 
} from 'react-icons/fi';
import { FaVk, FaTelegram, FaInstagram, FaHeart, FaRegHeart } from 'react-icons/fa';

import ImageModal from '../components/Shared/ImageModal';
import AuthTooltip from '../components/Shared/AuthTooltip';
import { getFileUrl, handleImageError, DEFAULT_IMAGE } from '../utils/apiUtils';
import EventCard from '../components/Events/EventCard';

const NkoDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const { fetchNkoById, eventsList, fetchAllEvents } = usePublic();
  
  const { user } = useAuth();
  const { isNkoFavorite, toggleNkoFavorite } = useFavorites();
  
  const [nko, setNko] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Состояния для UI
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [showTooltip, setShowTooltip] = useState(false);
  const favBtnRef = useRef(null);

  // 1. Загрузка данных НКО
  useEffect(() => {
    let isMounted = true;
    const loadNko = async () => {
      setIsLoading(true);
      try {
        const data = await fetchNkoById(id);
        if (isMounted) {
          if (data) setNko(data);
          else setError('НКО не найдена');
        }
      } catch (err) {
        if (isMounted) setError(err.message || 'Ошибка загрузки');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    loadNko();
    return () => { isMounted = false; };
  }, [id, fetchNkoById]);

  // 2. Подгрузка событий
  useEffect(() => {
    if (!eventsList || eventsList.length === 0) {
      fetchAllEvents();
    }
  }, [eventsList, fetchAllEvents]);

  // 3. Автоскрытие тултипа
  useEffect(() => {
    if (showTooltip) {
      const t = setTimeout(() => setShowTooltip(false), 3000);
      return () => clearTimeout(t);
    }
  }, [showTooltip]);

  // 4. Фильтрация событий
  const nkoEvents = useMemo(() => {
    if (!eventsList || !nko) return [];
    const nkoId = Number(id);
    return eventsList.filter(event => {
      const eventOrgId = Number(event.organization_id);
      const eventOrgIdCamel = Number(event.organizationId);
      const nestedOrgId = event.organization ? Number(event.organization.id) : null;
      const nestedNkoId = event.nko ? Number(event.nko.id) : null;

      if (eventOrgId === nkoId) return true;
      if (eventOrgIdCamel === nkoId) return true;
      if (nestedOrgId === nkoId) return true;
      if (nestedNkoId === nkoId) return true;
      return false;
    });
  }, [eventsList, nko, id]);

  const allImages = useMemo(() => {
    if (!nko) return [];
    const images = [];
    const logo = nko.logo || nko.logo_url;
    if (logo) images.push(getFileUrl(logo));
    if (nko.images && Array.isArray(nko.images)) {
      nko.images.forEach(img => { if (img) images.push(getFileUrl(img)); });
    }
    return images;
  }, [nko]);

  const openModal = (index) => {
    setPhotoIndex(index);
    setIsModalOpen(true);
  };

  const handleFavoriteClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (user) {
      toggleNkoFavorite(nko);
    } else {
      setShowTooltip(true);
    }
  };

  if (isLoading) return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 text-lg">Загрузка...</p>
      </div>
    </div>
  );
  
  if (error || !nko) return (
    <div className="container mx-auto px-4 py-12 text-center">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">{error || 'НКО не найдена'}</h2>
      <button onClick={() => navigate('/nko')} className="text-blue-600 hover:text-blue-800">← Вернуться к списку НКО</button>
    </div>
  );

  const isFavorite = isNkoFavorite(nko.id);
  const socialLinks = nko.social_links || [];
  const socialMedia = {
    vk: socialLinks.find(link => link.toLowerCase().includes('vk.com')),
    telegram: socialLinks.find(link => link.toLowerCase().includes('t.me') || link.toLowerCase().includes('telegram')),
    instagram: socialLinks.find(link => link.toLowerCase().includes('instagram'))
  };
  const isVerified = nko.moderation_status === 'одобрено' || nko.moderation_status === 'Одобрена';
  const logoUrl = getFileUrl(nko.logo || nko.logo_url);
  const files = nko.files || [];
  const galleryImages = nko.images || [];

  const getStatusBadgeConfig = (status) => {
    const s = String(status || '').toLowerCase();
    if (s.includes('одобрен')) return { color: 'bg-green-500', icon: <FiCheckCircle />, text: 'Одобрено' };
    if (s.includes('модераци')) return { color: 'bg-yellow-500', icon: <FiClock />, text: 'На модерации' };
    if (s.includes('отклонен')) return { color: 'bg-red-500', icon: <FiXCircle />, text: 'Отклонено' };
    return { color: 'bg-gray-500', icon: <FiInfo />, text: status || 'Статус неизвестен' };
  };

  const statusConfig = getStatusBadgeConfig(nko.moderation_status);

  return (
    <>
      {/* Инлайн стили для анимаций */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInFromLeft {
          from { opacity: 0; transform: translateX(-30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes heartBeat {
          0%, 100% { transform: scale(1); }
          25% { transform: scale(1.1); }
          50% { transform: scale(1); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
        }
        .animate-slide-left {
          animation: slideInFromLeft 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
        }
        .animate-scale-in {
          animation: scaleIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
        }
        .animate-slide-down {
          animation: slideDown 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
        }
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-300 { animation-delay: 0.3s; }
        .delay-400 { animation-delay: 0.4s; }
        .delay-500 { animation-delay: 0.5s; }
        .favorite-btn:active {
          animation: heartBeat 0.3s ease;
        }
        .stat-card {
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .stat-card:hover {
          transform: translateY(-5px) scale(1.02);
        }
        .gallery-image {
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .gallery-image:hover {
          transform: scale(1.05);
        }
      `}</style>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <button
            onClick={() => navigate('/nko')}
            className="flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-6 transition-all hover:gap-3 animate-slide-left"
          >
            <FiArrowLeft /><span>Назад к списку НКО</span>
          </button>

          <div className="bg-white rounded-2xl shadow-lg relative animate-scale-in">
            
            {/* Кнопки в углу */}
            <div className="absolute top-4 right-4 z-50 flex gap-3 animate-slide-down">
              {/* Статус */}
              <div className={`${statusConfig.color} text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2`}>
                {statusConfig.icon}
                <span className="font-medium capitalize">{statusConfig.text}</span>
              </div>

              {/* Избранное */}
              <div className="relative">
                <AuthTooltip isVisible={showTooltip} anchorRef={favBtnRef} />
                <button
                  ref={favBtnRef}
                  onClick={handleFavoriteClick}
                  className="favorite-btn p-3 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:scale-110 transition-transform group"
                  title={isFavorite ? 'Удалить из избранного' : 'Добавить в избранное'}
                >
                  {isFavorite ? (
                    <FaHeart className="text-red-500 text-2xl" />
                  ) : (
                    <FaRegHeart className="text-gray-600 text-2xl group-hover:text-red-500 transition-colors" />
                  )}
                </button>
              </div>
            </div>

            {/* Шапка с градиентом */}
            <div className="relative">
              <div className="h-64 bg-gradient-to-r from-blue-600 to-blue-700 rounded-t-2xl relative overflow-hidden">
                {/* Декоративные элементы */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl"></div>
              </div>
              
              {/* Логотип */}
              <div className="absolute -bottom-16 left-8 group animate-fade-in-up delay-200">
                <div 
                  className="w-32 h-32 bg-white rounded-2xl shadow-xl p-2 flex items-center justify-center cursor-pointer relative overflow-hidden transition-all hover:shadow-2xl hover:scale-105"
                  onClick={() => logoUrl !== DEFAULT_IMAGE && openModal(0)}
                >
                  {logoUrl !== DEFAULT_IMAGE ? (
                    <>
                      <img src={logoUrl} alt={nko.organization_name} className="max-w-full max-h-full object-contain" onError={handleImageError} />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center rounded-xl">
                         <FiZoomIn className="text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity text-2xl" />
                      </div>
                    </>
                  ) : (
                    <span className="text-5xl">🏢</span>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-20 px-8 pb-8 rounded-b-2xl">
              
              {/* Основная информация */}
              <div className="mb-6 animate-fade-in-up delay-300">
                <h1 className="text-4xl font-bold text-gray-800 mb-3">{nko.organization_name || nko.name}</h1>
                <div className="flex flex-wrap gap-2">
                  {nko.category && <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium hover:bg-blue-200 transition-colors">{nko.category}</span>}
                  {(nko.city_name || nko.city) && <span className="px-4 py-2 bg-gray-100 text-gray-800 rounded-full text-sm font-medium flex items-center gap-1 hover:bg-gray-200 transition-colors"><FiMapPin className="text-sm" />{nko.city_name || nko.city}</span>}
                </div>
              </div>

              {/* Статистика */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {nko.founded_year && (
                  <div className="stat-card bg-blue-50 p-4 rounded-xl animate-fade-in-up delay-400">
                    <div className="flex items-center gap-3">
                      <FiCalendar className="text-2xl text-blue-600" />
                      <div>
                        <div className="text-2xl font-bold text-gray-800">{nko.founded_year}</div>
                        <div className="text-sm text-gray-600">Год основания</div>
                      </div>
                    </div>
                  </div>
                )}
                {nko.volunteers_count && (
                  <div className="stat-card bg-green-50 p-4 rounded-xl animate-fade-in-up delay-400" style={{animationDelay: '0.45s'}}>
                    <div className="flex items-center gap-3">
                      <FiUsers className="text-2xl text-green-600" />
                      <div>
                        <div className="text-2xl font-bold text-gray-800">{nko.volunteers_count}+</div>
                        <div className="text-sm text-gray-600">Волонтеров</div>
                      </div>
                    </div>
                  </div>
                )}
                {nko.projects_count && (
                  <div className="stat-card bg-purple-50 p-4 rounded-xl animate-fade-in-up delay-500">
                    <div className="flex items-center gap-3">
                      <FiAward className="text-2xl text-purple-600" />
                      <div>
                        <div className="text-2xl font-bold text-gray-800">{nko.projects_count}</div>
                        <div className="text-sm text-gray-600">Проектов</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Описание */}
              {nko.description && (
                <div className="mb-8 animate-slide-left delay-500">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">О нас</h2>
                  <div className="prose max-w-none">
                    <p className="text-lg text-gray-700 leading-relaxed whitespace-pre-line">{nko.description}</p>
                  </div>
                </div>
              )}

              {/* Фотогалерея */}
              {galleryImages.length > 0 && (
                <div className="mb-8 animate-fade-in-up delay-500">
                  <h3 className="text-2xl font-bold text-gray-800 mb-4">Фотогалерея</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {galleryImages.map((img, index) => (
                      <div 
                        key={index} 
                        className="h-40 rounded-xl overflow-hidden cursor-pointer relative group"
                        onClick={() => openModal(logoUrl !== DEFAULT_IMAGE ? index + 1 : index)}
                        style={{animationDelay: `${0.55 + index * 0.05}s`}}
                      >
                        <img 
                          src={getFileUrl(img)} 
                          alt={`Фото ${index+1}`} 
                          className="gallery-image w-full h-full object-cover" 
                          onError={handleImageError} 
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <FiZoomIn className="text-white opacity-0 group-hover:opacity-100 transition-opacity text-2xl" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* События */}
              <div className="mb-10 animate-fade-in-up" style={{animationDelay: '0.6s'}}>
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <FiCalendar className="text-blue-600" />
                  Наши мероприятия
                </h2>
                {nkoEvents.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {nkoEvents.map((event, idx) => (
                      <div key={event.id} className="animate-scale-in" style={{animationDelay: `${0.65 + idx * 0.05}s`}}>
                        <EventCard event={event} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 p-8 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full shadow-sm mb-4">
                      <FiInfo className="text-3xl text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-800 mb-1">Актуальных событий пока нет</h3>
                    <p className="text-gray-500 max-w-md mx-auto">Организация пока не запланировала новых мероприятий.</p>
                  </div>
                )}
              </div>

              {/* Документы */}
              {files.length > 0 && (
                <div className="mb-8 animate-slide-left" style={{animationDelay: '0.7s'}}>
                  <h3 className="text-2xl font-bold text-gray-800 mb-4">Документы</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {files.map((file, index) => (
                      <a 
                        key={index} 
                        href={getFileUrl(file.url || file.path)} 
                        download 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all group"
                      >
                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm text-blue-600 group-hover:scale-110 transition-transform">
                          <FiDownload className="text-xl" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-800 group-hover:text-blue-700 transition-colors">
                            {file.name || 'Скачать документ'}
                          </div>
                          {file.size && <div className="text-xs text-gray-500">{file.size}</div>}
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Контакты и соцсети */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-gray-50 p-6 rounded-xl animate-scale-in" style={{animationDelay: '0.75s'}}>
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Контакты</h3>
                  <div className="space-y-3">
                    {nko.address && (
                      <div className="flex items-start gap-3 group">
                        <FiMapPin className="text-blue-600 text-xl mt-1 flex-shrink-0 group-hover:scale-110 transition-transform" />
                        <div><div className="text-sm text-gray-600 mb-1">Адрес</div><div className="text-gray-800">{nko.address}</div></div>
                      </div>
                    )}
                    {nko.phone && (
                      <div className="flex items-start gap-3 group">
                        <FiPhone className="text-blue-600 text-xl mt-1 flex-shrink-0 group-hover:scale-110 transition-transform" />
                        <div><div className="text-sm text-gray-600 mb-1">Телефон</div><a href={`tel:${nko.phone}`} className="text-gray-800 hover:text-blue-600 transition-colors">{nko.phone}</a></div>
                      </div>
                    )}
                    {nko.email && (
                      <div className="flex items-start gap-3 group">
                        <FiMail className="text-blue-600 text-xl mt-1 flex-shrink-0 group-hover:scale-110 transition-transform" />
                        <div><div className="text-sm text-gray-600 mb-1">Email</div><a href={`mailto:${nko.email}`} className="text-gray-800 hover:text-blue-600 transition-colors break-all">{nko.email}</a></div>
                      </div>
                    )}
                    {nko.website_url && (
                      <div className="flex items-start gap-3 group">
                        <FiExternalLink className="text-blue-600 text-xl mt-1 flex-shrink-0 group-hover:scale-110 transition-transform" />
                        <div><div className="text-sm text-gray-600 mb-1">Веб-сайт</div><a href={nko.website_url.startsWith('http') ? nko.website_url : `https://${nko.website_url}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 transition-colors break-all">{nko.website_url.replace(/^https?:\/\//, '')}</a></div>
                      </div>
                    )}
                  </div>
                </div>

                {socialLinks.length > 0 && (
                  <div className="bg-gray-50 p-6 rounded-xl animate-scale-in" style={{animationDelay: '0.8s'}}>
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Мы в соцсетях</h3>
                    <div className="space-y-3">
                      {socialMedia.vk && (
                        <a href={socialMedia.vk} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-white rounded-lg hover:bg-blue-50 transition-all hover:scale-105">
                          <FaVk className="text-2xl text-blue-600 flex-shrink-0" />
                          <span className="text-gray-800">ВКонтакте</span>
                        </a>
                      )}
                      {socialMedia.telegram && (
                        <a href={socialMedia.telegram} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-white rounded-lg hover:bg-blue-50 transition-all hover:scale-105">
                          <FaTelegram className="text-2xl text-blue-500 flex-shrink-0" />
                          <span className="text-gray-800">Telegram</span>
                        </a>
                      )}
                      {socialMedia.instagram && (
                        <a href={socialMedia.instagram} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-white rounded-lg hover:bg-pink-50 transition-all hover:scale-105">
                          <FaInstagram className="text-2xl text-pink-600 flex-shrink-0" />
                          <span className="text-gray-800">Instagram</span>
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* CTA */}
              {isVerified && (
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-8 rounded-xl text-white text-center relative overflow-hidden animate-fade-in-up" style={{animationDelay: '0.85s'}}>
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                  <div className="relative z-10">
                    <h3 className="text-2xl font-bold mb-3">Хотите стать волонтером?</h3>
                    <p className="text-blue-100 mb-6">Присоединяйтесь к нашей команде!</p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      {nko.email && (
                        <a href={`mailto:${nko.email}`} className="px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-all hover:scale-105 hover:shadow-lg">
                          Написать нам
                        </a>
                      )}
                      {nko.phone && (
                        <a href={`tel:${nko.phone}`} className="px-6 py-3 bg-blue-800 text-white rounded-lg font-semibold hover:bg-blue-900 transition-all hover:scale-105 hover:shadow-lg">
                          Позвонить
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 text-center animate-fade-in-up" style={{animationDelay: '0.9s'}}>
            <button 
              onClick={() => navigate('/nko')} 
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all font-medium hover:scale-105 hover:shadow-lg"
            >
              Вернуться к списку НКО
            </button>
          </div>
        </div>
      </div>

      <ImageModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} images={allImages} currentIndex={photoIndex} setCurrentIndex={setPhotoIndex} />
    </>
  );
};

export default NkoDetailPage;