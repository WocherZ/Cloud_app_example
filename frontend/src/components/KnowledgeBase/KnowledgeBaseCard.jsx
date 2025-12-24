// src/components/KnowledgeBase/KnowledgeBaseCard.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FiFileText, FiVideo, FiExternalLink, FiClock, FiEye, FiDownload } from 'react-icons/fi';
import { FaHeart, FaRegHeart } from 'react-icons/fa'; 
import { useFavorites } from '../../contexts/FavoritesContext';
import { useAuth } from '../../contexts/AuthContext'; // <--- Импорт Auth
import AuthTooltip from '../Shared/AuthTooltip';      // <--- Импорт Тултипа

const KnowledgeBaseCard = ({ item }) => {
  const { id, title, category, type, description, coverImage, publishDate, views, downloads, duration } = item;
  
  const { user } = useAuth(); // Проверка авторизации
  const { isKnowledgeBaseFavorite, toggleKnowledgeBaseFavorite } = useFavorites();
  const isFavorite = isKnowledgeBaseFavorite(id);

  // Состояния для тултипа
  const [showTooltip, setShowTooltip] = useState(false);
  const buttonRef = useRef(null); // Ссылка на кнопку для позиционирования

  // Автоскрытие тултипа
  useEffect(() => {
    if (showTooltip) {
      const t = setTimeout(() => setShowTooltip(false), 3000);
      return () => clearTimeout(t);
    }
  }, [showTooltip]);

  const handleFavoriteClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (user) {
      toggleKnowledgeBaseFavorite(item);
    } else {
      setShowTooltip(true);
    }
  };

  const getTypeConfig = () => {
    switch (type) {
      case 'video': return { icon: FiVideo, color: 'text-red-600', bgColor: 'bg-red-100', label: 'Видео' };
      case 'link': return { icon: FiExternalLink, color: 'text-blue-600', bgColor: 'bg-blue-100', label: 'Ссылка' };
      default: return { icon: FiFileText, color: 'text-green-600', bgColor: 'bg-green-100', label: 'Документ' };
    }
  };

  const typeConfig = getTypeConfig();
  const TypeIcon = typeConfig.icon;

  return (
    <Link to={`/knowledge-base/${id}`}>
      {/* 
          1. Убрали overflow-hidden с родителя.
          2. Добавили динамический z-index, чтобы активная карточка была выше соседей.
      */}
      <div className={`bg-white rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 h-full border border-gray-100 hover:border-blue-300 group relative flex flex-col ${showTooltip ? 'z-[100]' : 'z-0'}`}>
        
        {/* === КНОПКА ЛАЙКА === */}
        <div className="absolute top-3 right-3 z-50">
          <AuthTooltip isVisible={showTooltip} anchorRef={buttonRef} />
          
          <div ref={buttonRef}>
            <button
              onClick={handleFavoriteClick}
              className="p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-md hover:scale-110 transition-transform hover:bg-white"
            >
              {isFavorite ? (
                <FaHeart className="text-red-500 text-lg" />
              ) : (
                <FaRegHeart className="text-gray-600 text-lg" />
              )}
            </button>
          </div>
        </div>
        {/* =================== */}

        {/* Изображение (скругляем верхние углы здесь) */}
        <div className="relative h-48 overflow-hidden rounded-t-xl flex-shrink-0">
          {coverImage ? (
            <img src={coverImage} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"/>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
              <TypeIcon className={`text-7xl ${typeConfig.color}`} />
            </div>
          )}
          
          <div className={`absolute top-3 left-3 ${typeConfig.bgColor} ${typeConfig.color} px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1`}>
            <TypeIcon className="text-sm" /> {typeConfig.label}
          </div>
          
          {type === 'video' && duration && (
            <div className="absolute bottom-3 right-3 bg-black/70 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
              <FiClock className="text-xs" /> {duration}
            </div>
          )}
        </div>

        {/* Контент (скругляем нижние углы) */}
        <div className="p-5 flex flex-col flex-grow rounded-b-xl">
          <span className="text-xs text-blue-600 font-medium">{category}</span>
          <h3 className="text-lg font-bold text-gray-800 mt-2 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">{title}</h3>
          <p className="text-gray-600 text-sm mb-4 line-clamp-3 flex-grow">{description}</p>
          
          <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100 mt-auto">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1"><FiEye /><span>{views}</span></div>
              {downloads && <div className="flex items-center gap-1"><FiDownload /><span>{downloads}</span></div>}
            </div>
            <span>{new Date(publishDate).toLocaleDateString('ru-RU')}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default KnowledgeBaseCard;