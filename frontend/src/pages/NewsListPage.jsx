// src/pages/NewsListPage.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useCity } from '../contexts/CityContext';
import { usePublic } from '../contexts/PublicContext';
import NewsCard from '../components/News/NewsCard';
import { FiChevronDown, FiCheck, FiFilter, FiRefreshCw, FiX, FiTag } from 'react-icons/fi';

const NewsListPage = () => {
  const { selectedCity, cities } = useCity();
  const { newsList, loading, error, fetchAllNews } = usePublic();
  
  const [filteredNews, setFilteredNews] = useState([]);
  const [displayedNews, setDisplayedNews] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  
  // --- ФИЛЬТРЫ ---
  // Города
  const [filterCities, setFilterCities] = useState([]);
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  const cityDropdownRef = useRef(null);

  // Теги (Мультивыбор)
  const [allTags, setAllTags] = useState([]);
  const [filterTags, setFilterTags] = useState([]); // <--- Теперь массив
  const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false);
  const tagDropdownRef = useRef(null);
  
  // Даты
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  const loader = useRef(null);
  const NEWS_PER_PAGE = 10;

  // 1. Извлекаем уникальные теги (ИСКЛЮЧАЯ ГОРОДА)
  useEffect(() => {
    if (newsList && newsList.length > 0) {
      const tagsSet = new Set();
      
      // Создаем Set из имен городов для быстрой проверки
      const cityNames = new Set(cities.map(c => c.name));

      newsList.forEach(news => {
        if (news.tags && Array.isArray(news.tags)) {
          news.tags.forEach(tag => {
            // Добавляем тег, только если это НЕ город
            if (!cityNames.has(tag)) {
              tagsSet.add(tag);
            }
          });
        }
      });
      // Сортируем по алфавиту
      setAllTags(Array.from(tagsSet).sort());
    }
  }, [newsList, cities]);

  // Закрытие дропдаунов при клике вне
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(event.target)) {
        setIsCityDropdownOpen(false);
      }
      if (tagDropdownRef.current && !tagDropdownRef.current.contains(event.target)) {
        setIsTagDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Логика переключения городов
  const toggleCity = (cityName) => {
    setFilterCities(prev => {
      if (prev.includes(cityName)) {
        return prev.filter(c => c !== cityName);
      } else {
        return [...prev, cityName];
      }
    });
  };

  // Логика переключения тегов (Мультивыбор)
  const toggleTag = (tag) => {
    setFilterTags(prev => {
      if (prev.includes(tag)) {
        return prev.filter(t => t !== tag);
      } else {
        return [...prev, tag];
      }
    });
  };

  // --- ОСНОВНАЯ ФИЛЬТРАЦИЯ ---
  useEffect(() => {
    if (!newsList) return;

    let filtered = [...newsList];

    // 1. Города
    if (filterCities.length > 0) {
      filtered = filtered.filter(news => 
        filterCities.includes(news.city) || news.city === 'Все города'
      );
    }

    // 2. Теги (Мультивыбор)
    if (filterTags.length > 0) {
      filtered = filtered.filter(news => 
        // Показываем новость, если у неё есть ХОТЯ БЫ ОДИН из выбранных тегов
        news.tags && news.tags.some(tag => filterTags.includes(tag))
      );
    }

    // 3. Дата от
    if (filterDateFrom) {
      filtered = filtered.filter(news => 
        new Date(news.publishDate) >= new Date(filterDateFrom)
      );
    }

    // 4. Дата до
    if (filterDateTo) {
      filtered = filtered.filter(news => 
        new Date(news.publishDate) <= new Date(filterDateTo)
      );
    }

    // Сортировка (сначала новые)
    filtered.sort((a, b) => {
      const dateA = new Date(a.publishDate);
      const dateB = new Date(b.publishDate);
      return dateB - dateA;
    });

    setFilteredNews(filtered);
    setPage(1);
    setHasMore(true);
  }, [newsList, filterCities, filterTags, filterDateFrom, filterDateTo]);

  // Пагинация
  useEffect(() => {
    const startIndex = 0;
    const endIndex = page * NEWS_PER_PAGE;
    const newsToShow = filteredNews.slice(startIndex, endIndex);
    setDisplayedNews(newsToShow);
    setHasMore(endIndex < filteredNews.length);
  }, [filteredNews, page]);

  // Intersection Observer
  const handleObserver = useCallback((entries) => {
    const target = entries[0];
    if (target.isIntersecting && hasMore && !loading) {
      setPage(prev => prev + 1);
    }
  }, [hasMore, loading]);

  useEffect(() => {
    const option = { root: null, rootMargin: "20px", threshold: 0 };
    const observer = new IntersectionObserver(handleObserver, option);
    if (loader.current) observer.observe(loader.current);
    return () => { if (loader.current) observer.unobserve(loader.current); };
  }, [handleObserver]);

  // Сброс фильтров
  const resetFilters = () => {
    setFilterCities([]);
    setFilterTags([]);
    setFilterDateFrom('');
    setFilterDateTo('');
  };

  if (loading && (!newsList || newsList.length === 0)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg animate-pulse">Загрузка новостей...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-xl shadow-md max-w-md">
          <p className="text-red-600 text-lg mb-4">Ошибка загрузки: {error}</p>
          <button onClick={() => fetchAllNews()} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 w-full">
            <FiRefreshCw /> Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up { animation: fadeInUp 0.6s ease-out forwards; opacity: 0; }
      `}</style>

      <div className="container mx-auto px-4">
        
        <div className="mb-10 text-center md:text-left animate-fade-in-up">
          <h1 className="text-4xl font-bold text-gray-800 mb-3">Новости</h1>
          <p className="text-gray-600 text-lg max-w-2xl">
            Актуальные новости, анонсы и события в {selectedCity ? `городе ${selectedCity}` : 'городах присутствия Росатома'}.
          </p>
        </div>

        {/* БЛОК ФИЛЬТРОВ */}
        <div className="bg-white p-6 rounded-2xl shadow-lg mb-8 relative z-20 border border-gray-100 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-100">
            <FiFilter className="text-blue-600 text-xl" />
            <h2 className="text-lg font-semibold text-gray-800">Фильтры</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            
            {/* 1. Города */}
            <div className="relative" ref={cityDropdownRef}>
              <label className="block text-sm font-medium text-gray-700 mb-2">Города</label>
              <button
                onClick={() => setIsCityDropdownOpen(!isCityDropdownOpen)}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-left flex items-center justify-between transition-all"
              >
                <span className="truncate text-gray-700">
                  {filterCities.length === 0 ? 'Все города' : `Выбрано: ${filterCities.length}`}
                </span>
                <FiChevronDown className={`text-gray-500 transition-transform ${isCityDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isCityDropdownOpen && (
                <div className="absolute top-full left-0 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto z-30 py-2">
                  <div className="flex items-center px-4 py-2 hover:bg-blue-50 cursor-pointer transition-colors" onClick={() => setFilterCities([])}>
                    <div className={`w-5 h-5 border-2 rounded mr-3 flex items-center justify-center transition-colors ${filterCities.length === 0 ? 'bg-blue-600 border-blue-600' : 'border-gray-300 bg-white'}`}>
                      {filterCities.length === 0 && <FiCheck className="text-white text-xs" />}
                    </div>
                    <span className={`text-sm ${filterCities.length === 0 ? 'font-medium text-blue-700' : 'text-gray-700'}`}>Все города</span>
                  </div>
                  <div className="my-1 border-t border-gray-100"></div>
                  {cities.map(city => (
                    <div key={city.id} className="flex items-center px-4 py-2 hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => toggleCity(city.name)}>
                      <div className={`w-5 h-5 border-2 rounded mr-3 flex items-center justify-center transition-colors ${filterCities.includes(city.name) ? 'bg-blue-600 border-blue-600' : 'border-gray-300 bg-white'}`}>
                        {filterCities.includes(city.name) && <FiCheck className="text-white text-xs" />}
                      </div>
                      <span className="text-sm text-gray-700">{city.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 2. ТЕГИ (Мультивыбор) */}
            <div className="relative" ref={tagDropdownRef}>
              <label className="block text-sm font-medium text-gray-700 mb-2">Тематика</label>
              <button
                onClick={() => setIsTagDropdownOpen(!isTagDropdownOpen)}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-left flex items-center justify-between transition-all"
              >
                <span className="truncate text-gray-700">
                  {filterTags.length === 0 ? 'Все темы' : `Выбрано: ${filterTags.length}`}
                </span>
                <FiChevronDown className={`text-gray-500 transition-transform ${isTagDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isTagDropdownOpen && (
                <div className="absolute top-full left-0 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto z-30 py-2">
                  <div 
                    className="flex items-center px-4 py-2 hover:bg-blue-50 cursor-pointer transition-colors" 
                    onClick={() => setFilterTags([])}
                  >
                    <div className={`w-5 h-5 border-2 rounded mr-3 flex items-center justify-center transition-colors ${filterTags.length === 0 ? 'bg-blue-600 border-blue-600' : 'border-gray-300 bg-white'}`}>
                      {filterTags.length === 0 && <FiCheck className="text-white text-xs" />}
                    </div>
                    <span className={`text-sm ${filterTags.length === 0 ? 'font-medium text-blue-700' : 'text-gray-700'}`}>Все темы</span>
                  </div>
                  <div className="my-1 border-t border-gray-100"></div>
                  {allTags.map(tag => (
                    <div 
                      key={tag} 
                      className="flex items-center px-4 py-2 hover:bg-gray-50 cursor-pointer transition-colors" 
                      onClick={() => toggleTag(tag)}
                    >
                      <div className={`w-5 h-5 border-2 rounded mr-3 flex items-center justify-center transition-colors ${filterTags.includes(tag) ? 'bg-blue-600 border-blue-600' : 'border-gray-300 bg-white'}`}>
                        {filterTags.includes(tag) && <FiCheck className="text-white text-xs" />}
                      </div>
                      <span className="text-sm text-gray-700 flex items-center gap-2">
                        <FiTag className="text-gray-400 text-xs" />
                        {tag}
                      </span>
                    </div>
                  ))}
                  {allTags.length === 0 && <div className="px-4 py-2 text-sm text-gray-500">Тегов нет</div>}
                </div>
              )}
            </div>

            {/* 3. Дата от */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Дата от</label>
              <input
                type="date"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>

            {/* 4. Дата до */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Дата до</label>
              <input
                type="date"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          {/* Сброс фильтров */}
          {(filterCities.length > 0 || filterTags.length > 0 || filterDateFrom || filterDateTo) && (
            <div className="mt-6 flex justify-end pt-4 border-t border-gray-100">
              <button
                onClick={resetFilters}
                className="text-red-500 hover:text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors font-medium text-sm flex items-center gap-2"
              >
                <FiX /> Сбросить фильтры
              </button>
            </div>
          )}

          {/* Активные теги */}
          {(filterCities.length > 0 || filterTags.length > 0) && (
            <div className="mt-4 flex flex-wrap gap-2">
              {filterCities.map(city => (
                <span key={city} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700 border border-blue-100">
                  {city} <button onClick={() => toggleCity(city)} className="ml-2 text-blue-400 hover:text-blue-600 transition-colors">×</button>
                </span>
              ))}
              {filterTags.map(tag => (
                <span key={tag} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-50 text-purple-700 border border-purple-100">
                  <FiTag className="mr-1 text-xs" /> {tag} 
                  <button onClick={() => toggleTag(tag)} className="ml-2 text-purple-400 hover:text-purple-600 transition-colors">×</button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Счетчик */}
        <div className="mb-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <p className="text-gray-500 font-medium">
            Найдено новостей: <span className="text-gray-900 font-bold ml-1">{filteredNews.length}</span>
          </p>
        </div>

        {/* Список новостей */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 z-0 relative">
          {displayedNews.map((news, index) => (
            <div 
              key={news.id}
              className="animate-fade-in-up h-full"
              style={{ animationDelay: `${0.2 + (index % NEWS_PER_PAGE) * 0.1}s` }}
            >
              <NewsCard news={news} />
            </div>
          ))}
        </div>

        {/* Loader */}
        {hasMore && (
          <div ref={loader} className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>
        )}

        {!hasMore && displayedNews.length > 0 && (
          <div className="text-center py-12 text-gray-400 animate-fade-in-up">
            Все новости загружены
          </div>
        )}

        {displayedNews.length === 0 && !loading && (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-300 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiFilter className="text-4xl text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Новостей не найдено</h3>
            <p className="text-gray-500 mb-6">Попробуйте изменить параметры фильтрации</p>
            <button
              onClick={resetFilters}
              className="px-6 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
            >
              Сбросить фильтры
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewsListPage;