import React, { useState, useEffect, useRef } from 'react'; // Добавил useRef
// ... остальные импорты без изменений ...
import { Link } from 'react-router-dom';
import { FiMapPin, FiCheckCircle } from 'react-icons/fi';
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import { useFavorites } from '../../contexts/FavoritesContext';
import { useAuth } from '../../contexts/AuthContext';
import AuthTooltip from '../Shared/AuthTooltip';
import { getFileUrl } from '../../utils/apiUtils'; 

const NkoCard = ({ nko }) => {
  const { user } = useAuth();
  const { isNkoFavorite, toggleNkoFavorite } = useFavorites();
  const isFavorite = isNkoFavorite(nko.id);

  const [showTooltip, setShowTooltip] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  // --- REF ДЛЯ КНОПКИ ---
  const buttonRef = useRef(null);

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
      toggleNkoFavorite(nko);
    } else {
      setShowTooltip(true);
    }
  };

  const id = nko.id;
  const name = nko.organization_name || nko.name || 'Без названия';
  const shortName = nko.short_name;
  const category = nko.category || 'Другое';
  const city = nko.city_name || nko.city || 'Не указан';
  const description = nko.description || '';
  const volunteersCount = nko.volunteers_count;
  const isVerified = nko.moderation_status === 'одобрено' || nko.moderation_status === 'Одобрена';
  const rawLogo = nko.logo_url || nko.logo;
  const logoUrl = getFileUrl(rawLogo);

  const getCategoryIcon = (cat) => {
    if (!cat) return '🏢';
    const lowerCat = cat.toLowerCase();
    if (lowerCat.includes('благотвор')) return '❤️';
    if (lowerCat.includes('эколог')) return '🌱';
    if (lowerCat.includes('спорт')) return '⚽';
    if (lowerCat.includes('культур')) return '🎭';
    if (lowerCat.includes('образован')) return '📚';
    if (lowerCat.includes('социальн')) return '🤝';
    if (lowerCat.includes('здоров')) return '🏥';
    if (lowerCat.includes('животн')) return '🐾';
    return '🏢';
  };

  return (
    <Link to={`/nko/${id}`}>
      <div className="bg-white rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 h-full border border-gray-100 hover:border-blue-300 group flex flex-col relative">
        
        {/* КНОПКА ИЗБРАННОГО */}
        <div className="absolute top-3 right-3 z-50">
          {/* Передаем ref в тултип */}
          <AuthTooltip isVisible={showTooltip} anchorRef={buttonRef} />
          
          {/* Вешаем ref на контейнер кнопки или саму кнопку */}
          <div ref={buttonRef}>
            <button
              onClick={handleFavoriteClick}
              className="p-2 bg-white/60 backdrop-blur-sm rounded-full shadow hover:bg-white hover:scale-110 transition-all"
            >
              {isFavorite ? (
                <FaHeart className="text-red-500 text-lg" />
              ) : (
                <FaRegHeart className="text-blue-900 text-lg" />
              )}
            </button>
          </div>
        </div>

        {/* ШАПКА */}
        <div className="relative h-48 bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-6 flex-shrink-0 rounded-t-xl overflow-hidden">
          {logoUrl && !imageError ? (
            <img 
              src={logoUrl} alt={name} className="max-h-full max-w-full object-contain drop-shadow-md" onError={() => setImageError(true)}
            />
          ) : (
            <div className="text-center animate-fade-in">
              <div className="text-6xl mb-2 filter drop-shadow-sm">{getCategoryIcon(category)}</div>
              <div className="text-blue-800 font-bold text-lg line-clamp-2 px-2 leading-tight">{shortName || name}</div>
            </div>
          )}
          {isVerified && <div className="absolute top-3 right-14 bg-green-500 text-white p-2 rounded-full shadow-lg z-10"><FiCheckCircle className="text-xl" /></div>}
          <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm text-blue-700 px-3 py-1 rounded-full text-xs font-semibold shadow-sm border border-blue-100">{category}</div>
        </div>

        {/* КОНТЕНТ */}
        <div className="p-5 flex flex-col flex-grow rounded-b-xl">
          <h3 className="text-xl font-bold text-gray-800 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors min-h-[3.5rem]">{name}</h3>
          <div className="flex items-center gap-2 text-gray-600 mb-3"><FiMapPin className="text-blue-500 flex-shrink-0" /><span className="text-sm font-medium">{city}</span></div>
          <p className="text-gray-600 text-sm mb-4 line-clamp-3 flex-grow">{description}</p>
          <div className="pt-4 border-t border-gray-100 flex items-center justify-between mt-auto">
            <div className="text-sm text-gray-500 font-medium">
               {volunteersCount ? <span className="flex items-center gap-1">👥 {volunteersCount} волонтеров</span> : <span className="text-blue-500">👥 Ищем волонтеров</span>}
            </div>
            <span className="text-blue-600 font-medium group-hover:text-blue-700 inline-flex items-center text-sm transition-all group-hover:translate-x-1">
              Подробнее <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default NkoCard;