// src/components/Events/EventCard.jsx
import React, { useState, useEffect, useRef  } from 'react';
import { Link } from 'react-router-dom';
import { FiClock, FiMapPin } from 'react-icons/fi';
import { FaHeart, FaRegHeart } from 'react-icons/fa'; 
import { useFavorites } from '../../contexts/FavoritesContext';
import { useAuth } from '../../contexts/AuthContext';
import AuthTooltip from '../Shared/AuthTooltip';      
import { getFileUrl, handleImageError } from '../../utils/apiUtils';

const getCategoryIcon = (category) => {
  const icons = {
    'Волонтерство': '🤝', 'Экология': '♻️', 'Благотворительность': '💝',
    'Спорт': '🏃', 'Образование': '🎓', 'Культура': '🎨',
  };
  return icons[category] || '📅';
};

const EventCard = ({ event }) => {
  const { user } = useAuth();
  const { isEventFavorite, toggleEventFavorite } = useFavorites();
  const isFavorite = isEventFavorite(event.id);
  const buttonRef = useRef(null)
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
      toggleEventFavorite(event);
    } else {
      setShowTooltip(true);
    }
  };

  const dateString = event.date || event.event_date || event.event_datetime;
  const eventDate = dateString ? new Date(dateString) : new Date();
  
  const rawImage = event.image || event.image_url || (event.images && event.images.length > 0 ? event.images[0] : null);
  const eventImage = getFileUrl(rawImage);

  const title = event.title || 'Без названия';
  const description = event.description || '';
  const time = event.time || '00:00';
  const location = event.location || event.address || 'Место не указано';
  const category = event.category || event.category_event_name || '';

  return (
      <Link to={`/events/${event.id}`}>
      <div className="bg-white rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 h-full border border-gray-100 hover:border-blue-300 group relative flex flex-col">
        
        <div className="absolute top-3 right-3 z-20">
          <AuthTooltip isVisible={showTooltip} anchorRef={buttonRef} />
          <div ref={buttonRef}>
            <button onClick={handleFavoriteClick} className="p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:scale-110 transition-transform">
              {isFavorite ? <FaHeart className="text-red-500 text-xl" /> : <FaRegHeart className="text-gray-600 text-xl" />}
            </button>
          </div>
        </div>

        {/* Изображение (скруглили верх) */}
        <div className="relative rounded-t-xl overflow-hidden">
          <div className="absolute top-4 left-4 bg-gradient-to-br from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg shadow-lg z-10">
            <div className="text-center">
              <div className="text-2xl font-bold">{eventDate.getDate()}</div>
              <div className="text-xs uppercase">
                {eventDate.toLocaleDateString('ru-RU', { month: 'short' })}
              </div>
            </div>
          </div>
          
          {eventImage && rawImage ? (
            <img 
              src={eventImage} 
              alt={title} 
              onError={handleImageError}
              className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-48 bg-gradient-to-br from-blue-100 via-blue-200 to-blue-300 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
              <div className="text-center">
                <div className="text-7xl mb-2">{getCategoryIcon(category)}</div>
              </div>
            </div>
          )}
          
          {category && (
            <span className="absolute top-4 right-14 bg-white/90 backdrop-blur-sm text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">
              {category}
            </span>
          )}
        </div>

        <div className="p-5 flex-1 rounded-b-xl">
          <h3 className="text-xl font-bold text-gray-800 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
            {title}
          </h3>
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">{description}</p>
          
          <div className="space-y-2 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <FiClock className="text-blue-500" />
              <span>{time}</span>
            </div>
            <div className="flex items-center gap-2">
              <FiMapPin className="text-blue-500" />
              <span className="line-clamp-1">{location}</span>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-100">
            <span className="text-blue-600 font-medium group-hover:text-blue-700 inline-flex items-center">
              Подробнее 
              <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default EventCard;