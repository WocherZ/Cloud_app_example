// src/components/News/NewsCard.jsx
import React, { useState, useEffect, useRef  } from 'react';
import { Link } from 'react-router-dom';
import { FiCalendar, FiMapPin, FiArrowRight } from 'react-icons/fi';
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import { useFavorites } from '../../contexts/FavoritesContext';
import { useAuth } from '../../contexts/AuthContext';
import AuthTooltip from '../Shared/AuthTooltip';
import { getFileUrl, handleImageError } from '../../utils/apiUtils';

const NewsCard = ({ news }) => {
  const { user } = useAuth();
  const { isNewsFavorite, toggleNewsFavorite } = useFavorites();
  const isFavorite = isNewsFavorite(news.id);
  const buttonRef = useRef(null); 
  const [showTooltip, setShowTooltip] = useState(false);

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
      toggleNewsFavorite(news);
    } else {
      setShowTooltip(true);
    }
  };

  const rawImage = news.image || news.image_url || (news.images && news.images.length > 0 ? news.images[0] : null);
  const imageUrl = getFileUrl(rawImage);
  const title = news.title || 'Без заголовка';

  return (
    <Link to={`/news/${news.id}`} className="group">
      <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 h-full flex flex-col relative">
        
        <div className="absolute top-3 right-3 z-20">
          <AuthTooltip isVisible={showTooltip} anchorRef={buttonRef} />
          <div ref={buttonRef}>
            <button onClick={handleFavoriteClick} className="p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:scale-110 transition-transform">
               {isFavorite ? <FaHeart className="text-red-500 text-lg" /> : <FaRegHeart className="text-gray-600 text-lg" />}
            </button>
          </div>
        </div>

        <div className="relative h-48 overflow-hidden rounded-t-xl">
          <img src={imageUrl} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onError={handleImageError} />
          <div className="absolute top-4 left-4">
            <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium shadow-md">
              {news.category || 'Новости'}
            </span>
          </div>
        </div>

        <div className="p-6 flex-1 flex flex-col rounded-b-xl">
          <h3 className="text-xl font-bold text-gray-800 mb-3 group-hover:text-blue-600 transition-colors line-clamp-2">{title}</h3>
          <p className="text-gray-600 mb-4 line-clamp-3 flex-1">{news.short_description}</p>
          
          <div className="flex flex-col gap-2 text-sm text-gray-500 mb-4">
            {news.publish_date && (
               <div className="flex items-center gap-2"><FiCalendar /><span>{new Date(news.publish_date).toLocaleDateString()}</span></div>
            )}
             <div className="flex items-center gap-2"><FiMapPin /><span>{news.city || 'Все города'}</span></div>
          </div>

          <div className="flex items-center gap-2 text-blue-600 font-medium group-hover:gap-3 transition-all mt-auto">
            <span>Читать далее</span> <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </Link>
  );
};

export default NewsCard;