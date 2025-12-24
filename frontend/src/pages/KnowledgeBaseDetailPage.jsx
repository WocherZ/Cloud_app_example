// src/pages/KnowledgeBaseDetailPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePublic } from '../contexts/PublicContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { useAuth } from '../contexts/AuthContext';
import { FiArrowLeft, FiDownload, FiEye, FiCalendar, FiUser, FiExternalLink, FiFileText, FiVideo, FiLink } from 'react-icons/fi';
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import { getFileUrl } from '../services/fileService';
import UniversalVideoPlayer from '../components/UniversalVideoPlayer';
import AuthTooltip from '../components/Shared/AuthTooltip';

const KnowledgeBaseDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { fetchKnowledgeBaseById, loading } = usePublic();
  const { isKnowledgeBaseFavorite, toggleKnowledgeBaseFavorite } = useFavorites();
  const { user } = useAuth();

  const [item, setItem] = useState(null);
  const [error, setError] = useState(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const favBtnRef = useRef(null);

  useEffect(() => {
    const loadItem = async () => {
      try {
        const data = await fetchKnowledgeBaseById(id);
        if (data) {
          setItem(data);
        } else {
          setError('Материал не найден');
        }
      } catch (err) {
        setError(err.message || 'Ошибка загрузки');
      }
    };

    loadItem();
  }, [id, fetchKnowledgeBaseById]);

  useEffect(() => {
    if (showTooltip) {
      const t = setTimeout(() => setShowTooltip(false), 3000);
      return () => clearTimeout(t);
    }
  }, [showTooltip]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg animate-pulse">Загрузка материала...</p>
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8 max-w-md">
          <div className="bg-red-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiFileText className="text-red-500 text-4xl" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Материал не найден</h2>
          <p className="text-gray-500 mb-6">{error || 'Запрашиваемая страница не существует или была удалена.'}</p>
          <button
            onClick={() => navigate('/knowledge-base')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all transform hover:scale-105 shadow-lg font-medium"
          >
            Вернуться к базе знаний
          </button>
        </div>
      </div>
    );
  }

  const isFavorite = isKnowledgeBaseFavorite(item.id);
  
  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    if (user) {
      toggleKnowledgeBaseFavorite(item);
    } else {
      setShowTooltip(true);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'video': return <><FiVideo className="mr-1"/> Видео</>;
      case 'link': return <><FiLink className="mr-1"/> Ссылка</>;
      default: return <><FiFileText className="mr-1"/> Документ</>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
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

      <div className="container mx-auto px-4 max-w-5xl">
        {/* Кнопка назад */}
        <button 
          onClick={() => navigate('/knowledge-base')} 
          className="group flex items-center gap-2 text-gray-500 hover:text-blue-600 mb-6 transition-colors font-medium"
        >
          <div className="p-2 bg-white rounded-full shadow-sm group-hover:shadow-md transition-all group-hover:-translate-x-1">
            <FiArrowLeft />
          </div>
          <span>Назад к базе знаний</span>
        </button>

        {/* Карточка контента */}
        <div className="bg-white rounded-2xl shadow-xl relative animate-fade-in-up"> 

          {/* === КНОПКА ИЗБРАННОГО === */}
          <div className="absolute top-4 right-4 z-20">
            <AuthTooltip isVisible={showTooltip} anchorRef={favBtnRef} />
            <button
              ref={favBtnRef}
              onClick={handleFavoriteClick}
              className="p-3 bg-white/90 backdrop-blur-md rounded-full shadow-lg hover:scale-110 transition-transform group border border-gray-100"
              title={isFavorite ? "Удалить из избранного" : "В избранное"}
            >
              {isFavorite ? (
                <FaHeart className="text-red-500 text-2xl drop-shadow-sm" />
              ) : (
                <FaRegHeart className="text-gray-600 text-2xl group-hover:text-red-500 transition-colors" />
              )}
            </button>
          </div>

          {/* Обложка */}
          {item.coverImage ? (
            <div className="w-full h-64 md:h-96 overflow-hidden rounded-t-2xl relative group">
              <img
                src={item.coverImage}
                alt={item.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-60"></div>
            </div>
          ) : (
            // Если обложки нет, делаем красивый градиентный фон заголовка
            <div className="h-32 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-t-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
            </div>
          )}

          {/* Контент */}
          <div className="p-6 md:p-10 rounded-b-2xl">
            
            {/* Теги и Тип */}
            <div className="flex flex-wrap gap-3 mb-6 animate-fade-in-up delay-100">
              {item.category && (
                <span className="px-4 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-semibold tracking-wide uppercase">
                  {item.category}
                </span>
              )}
              {item.type && (
                <span className="px-4 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm font-medium flex items-center">
                  {getTypeIcon(item.type)}
                </span>
              )}
            </div>

            {/* Заголовок */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight animate-fade-in-up delay-100">
              {item.title}
            </h1>

            {/* Мета-информация */}
            <div className="flex flex-wrap items-center gap-y-4 gap-x-8 text-gray-500 text-sm mb-8 pb-8 border-b border-gray-100 animate-fade-in-up delay-200">
              {item.publishDate && (
                <div className="flex items-center gap-2">
                  <FiCalendar className="text-blue-500 text-lg" />
                  <span>{new Date(item.publishDate).toLocaleDateString('ru-RU', {
                    year: 'numeric', month: 'long', day: 'numeric'
                  })}</span>
                </div>
              )}
              {item.author && (
                <div className="flex items-center gap-2">
                  <FiUser className="text-blue-500 text-lg" />
                  <span className="font-medium">{item.author}</span>
                </div>
              )}
              <div className="flex items-center gap-6 ml-auto mr-0 sm:ml-0">
                {item.views && (
                  <div className="flex items-center gap-1.5" title="Просмотры">
                    <FiEye className="text-gray-400 text-lg" />
                    <span>{item.views}</span>
                  </div>
                )}
                {item.downloads && (
                  <div className="flex items-center gap-1.5" title="Скачивания">
                    <FiDownload className="text-gray-400 text-lg" />
                    <span>{item.downloads}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Основной блок контента */}
            <div className="animate-fade-in-up delay-300">
              {/* Краткое описание */}
              {item.description && (
                <div className="prose prose-lg max-w-none mb-10 text-gray-600 leading-relaxed italic border-l-4 border-blue-500 pl-6 bg-gray-50 py-4 rounded-r-lg">
                  {item.description}
                </div>
              )}

              {/* Видео плеер */}
              {item.type === 'video' && item.videoUrl && (
                <div className="mb-10 rounded-xl overflow-hidden shadow-lg ring-1 ring-gray-200">
                  <UniversalVideoPlayer videoUrl={item.videoUrl} />
                </div>
              )}

              {/* Внешняя ссылка (Hero Button) */}
              {item.type === 'link' && item.externalLink && (
                <div className="mb-10 p-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 text-center">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Материал доступен на внешнем ресурсе</h3>
                  <a
                    href={item.externalLink.startsWith('http') ? item.externalLink : `https://${item.externalLink}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all transform hover:-translate-y-1 shadow-lg font-bold text-lg"
                  >
                    <FiExternalLink />
                    Перейти к материалу
                  </a>
                </div>
              )}

              {/* Полный текст */}
              {item.content && (
                <div className="prose prose-lg max-w-none mb-12 text-gray-800 leading-8">
                  <div className="whitespace-pre-line">{item.content}</div>
                </div>
              )}

              {/* Секция файлов */}
              {item.materials && item.materials.length > 0 && (
                <div className="bg-gray-50 p-6 md:p-8 rounded-2xl border border-gray-200">
                  <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                      <FiDownload className="text-xl" />
                    </div>
                    Материалы для скачивания
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {item.materials.map((material, index) => (
                      <a
                        key={index}
                        href={getFileUrl(material.url)}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all group"
                      >
                        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                          <FiDownload className="text-2xl" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-800 group-hover:text-blue-700 transition-colors truncate">
                            {material.name || `Файл ${index + 1}`}
                          </p>
                          {material.size && (
                            <p className="text-xs text-gray-500 mt-1 font-medium uppercase tracking-wider">
                              {material.size}
                            </p>
                          )}
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-500">
                          <FiArrowLeft className="rotate-180" />
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Футер страницы */}
        <div className="mt-12 text-center animate-fade-in-up delay-300">
          <button
            onClick={() => navigate('/knowledge-base')}
            className="px-8 py-3 bg-white text-gray-700 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 rounded-xl transition-colors font-medium shadow-sm"
          >
            Смотреть другие материалы
          </button>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeBaseDetailPage;