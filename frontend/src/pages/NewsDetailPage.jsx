// src/pages/NewsDetailPage.jsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FiCalendar, FiMapPin, FiUser, FiArrowLeft, FiDownload, FiZoomIn } from 'react-icons/fi';
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import { usePublic } from '../contexts/PublicContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { useAuth } from '../contexts/AuthContext';
import ImageModal from '../components/Shared/ImageModal';
import AuthTooltip from '../components/Shared/AuthTooltip';
import { getFileUrl, handleImageError, getFileName, DEFAULT_IMAGE } from '../utils/apiUtils';

const NewsDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { fetchNewsById } = usePublic();
  const { user } = useAuth();
  
  const [news, setNews] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);

  const [showTooltip, setShowTooltip] = useState(false);
  const favBtnRef = useRef(null);

  const { isNewsFavorite, toggleNewsFavorite } = useFavorites();

  useEffect(() => {
    let isMounted = true;
    const loadNews = async () => {
      setIsLoading(true);
      try {
        const data = await fetchNewsById(id);
        if (isMounted) {
          if (data) setNews(data);
          else setError('Новость не найдена');
        }
      } catch (e) {
        if (isMounted) setError('Ошибка при загрузке');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    loadNews();
    return () => { isMounted = false; };
  }, [id, fetchNewsById]);

  // Автоскрытие тултипа
  useEffect(() => {
    if (showTooltip) {
      const timer = setTimeout(() => setShowTooltip(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showTooltip]);

  const allImages = useMemo(() => {
    if (!news) return [];
    const images = [];
    let mainImage = news.image || news.image_url;
    if (!mainImage && news.images && news.images.length > 0) mainImage = news.images[0];
    if (mainImage) images.push(getFileUrl(mainImage));
    else images.push(DEFAULT_IMAGE);
    
    if (news.images && Array.isArray(news.images)) {
      news.images.forEach(img => {
        if (img && img !== mainImage) images.push(getFileUrl(img));
      });
    }
    return images;
  }, [news]);

  const openModal = (index) => {
    setPhotoIndex(index);
    setIsModalOpen(true);
  };

  if (isLoading) return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
    </div>
  );

  if (error || !news) return (
    <div className="container mx-auto px-4 py-12 text-center min-h-screen bg-gray-50 flex flex-col items-center justify-center">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">{error || 'Новость не найдена'}</h2>
      <Link to="/news" className="text-blue-600 hover:text-blue-800 font-medium">← Вернуться к списку новостей</Link>
    </div>
  );

  const isFavorite = isNewsFavorite(news.id);
  
  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    if (user) toggleNewsFavorite(news);
    else setShowTooltip(true);
  };

  const title = news.title || 'Без заголовка';
  const content = news.content || news.description || '';
  const shortDescription = news.short_description || news.shortDescription;
  const category = news.category || 'Новости';
  const city = news.city || news.city_name || 'Все города';
  const publishDate = news.publish_date || news.publishDate;
  const author = news.author || news.author_name;
  const tags = news.tags || [];
  const galleryImages = news.images || []; 
  const files = news.files || [];

  return (
    <>
      <div className="bg-gray-50 min-h-screen py-8">
        {/* Стили анимаций (как в Базе Знаний) */}
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
          {/* Кнопка Назад */}
          <button 
            onClick={() => navigate('/news')} 
            className="group flex items-center gap-2 text-gray-500 hover:text-blue-600 mb-6 transition-colors font-medium"
          >
            <div className="p-2 bg-white rounded-full shadow-sm group-hover:shadow-md transition-all group-hover:-translate-x-1">
              <FiArrowLeft />
            </div>
            <span>Назад к новостям</span>
          </button>

          <article className="bg-white rounded-2xl shadow-xl relative animate-fade-in-up">
            
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

            {/* Главная картинка */}
            <div 
              className="w-full h-64 md:h-96 overflow-hidden rounded-t-2xl relative group cursor-pointer" 
              onClick={() => openModal(0)}
            >
              <img 
                src={allImages[0]} 
                alt={title} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                onError={handleImageError} 
              />
              
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 bg-white/20 backdrop-blur-sm p-3 rounded-full text-white">
                  <FiZoomIn className="text-3xl" />
                </div>
              </div>
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none opacity-80"></div>
              
              <div className="absolute bottom-0 left-0 p-8 text-white pointer-events-none w-full">
                 {category && (
                  <span className="inline-block bg-blue-600 text-white px-4 py-1.5 rounded-full text-sm font-bold mb-3 shadow-lg tracking-wide uppercase">
                    {category}
                  </span>
                )}
              </div>
            </div>

            <div className="p-6 md:p-10 rounded-b-2xl">
              
              {/* Заголовок */}
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight animate-fade-in-up delay-100">
                {title}
              </h1>
              
              {/* Мета-инфо */}
              <div className="flex flex-wrap gap-y-3 gap-x-6 text-gray-500 text-sm mb-8 pb-8 border-b border-gray-100 animate-fade-in-up delay-200">
                {publishDate && (
                  <div className="flex items-center gap-2">
                    <FiCalendar className="text-blue-500 text-lg" />
                    <span>{new Date(publishDate).toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <FiMapPin className="text-blue-500 text-lg" />
                  <span>{city}</span>
                </div>
                {author && (
                  <div className="flex items-center gap-2">
                    <FiUser className="text-blue-500 text-lg" />
                    <span className="font-medium">{author}</span>
                  </div>
                )}
              </div>

              <div className="animate-fade-in-up delay-300">
                {/* Краткое описание */}
                {shortDescription && (
                  <div className="text-xl text-gray-600 font-serif italic mb-10 border-l-4 border-blue-500 pl-6 py-2 leading-relaxed">
                    {shortDescription}
                  </div>
                )}
                
                {/* Основной текст */}
                <div className="prose prose-lg max-w-none mb-12 text-gray-800 leading-8">
                   {content.split('\n').map((paragraph, idx) => (
                     <p key={idx} className="mb-6">{paragraph}</p>
                   ))}
                </div>

                {/* Галерея */}
                {galleryImages.length > 0 && (
                  <div className="mb-12">
                    <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                      Фотогалерея
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {galleryImages.map((img, index) => (
                        <div 
                          key={index} 
                          className="relative h-64 rounded-xl overflow-hidden cursor-pointer group shadow-sm hover:shadow-md transition-all"
                          onClick={() => openModal(index + 1)}
                        >
                          <img 
                            src={getFileUrl(img)} 
                            alt={`Фото ${index + 1}`} 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                            onError={handleImageError} 
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                            <FiZoomIn className="text-white text-3xl opacity-0 group-hover:opacity-100 transition-opacity transform scale-75 group-hover:scale-100 duration-300" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Файлы */}
                {files.length > 0 && (
                  <div className="bg-gray-50 p-6 md:p-8 rounded-2xl border border-gray-200 mb-8">
                    <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                        <FiDownload className="text-xl" />
                      </div>
                      Материалы для скачивания
                    </h3>
                    <div className="space-y-3">
                      {files.map((filePath, index) => {
                        const fileName = getFileName(filePath);
                        const fileUrl = getFileUrl(filePath);
                        return (
                          <a 
                            key={index} 
                            href={fileUrl} 
                            download={fileName} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all group"
                          >
                            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                              <FiDownload className="text-2xl" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-800 group-hover:text-blue-700 transition-colors truncate break-all">
                                {fileName}
                              </p>
                            </div>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-500">
                              <FiArrowLeft className="rotate-180" />
                            </div>
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}

                {tags.length > 0 && (
                  <div className="mt-10 pt-8 border-t border-gray-100">
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag, index) => (
                        <span 
                          key={index} 
                          className="px-4 py-2 bg-gray-100 text-gray-600 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors cursor-default hover:text-gray-900"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </article>

          <div className="mt-16 text-center animate-fade-in-up delay-300">
            <Link 
              to="/news" 
              className="inline-flex items-center justify-center px-8 py-3 bg-white text-gray-700 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 rounded-xl transition-all font-medium shadow-sm hover:shadow-md"
            >
              Читать другие новости
            </Link>
          </div>
        </div>
      </div>
      
      <ImageModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} images={allImages} currentIndex={photoIndex} setCurrentIndex={setPhotoIndex} />
    </>
  );
};

export default NewsDetailPage;