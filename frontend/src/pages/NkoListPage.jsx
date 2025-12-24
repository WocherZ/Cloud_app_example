// src/pages/NkoListPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useCity } from '../contexts/CityContext';
import { usePublic } from '../contexts/PublicContext';
import { FiFilter, FiMap, FiLoader, FiChevronDown, FiCheck } from 'react-icons/fi';
import NkoCard from '../components/Nko/NkoCard';

const NkoListPage = () => {
  const { cities } = useCity();
  const { nkoList, loading, error, fetchAllNkos } = usePublic();
  
  const [filteredNko, setFilteredNko] = useState([]);
  
  // --- Фильтры ---
  const [filterCities, setFilterCities] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('Все категории');
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState(['Все категории']);

  // Состояние для выпадающего списка городов
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Закрытие дропдауна при клике вне его
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsCityDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Логика переключения города в фильтре
  const toggleCity = (cityName) => {
    setFilterCities(prev => {
      if (prev.includes(cityName)) {
        return prev.filter(c => c !== cityName);
      } else {
        return [...prev, cityName];
      }
    });
  };

  // Извлечение уникальных категорий из НКО
  useEffect(() => {
    if (nkoList.length > 0) {
      const uniqueCategories = ['Все категории', ...new Set(
        nkoList
          .map(nko => nko.category)
          .filter(cat => cat && cat.trim() !== '')
      )];
      setCategories(uniqueCategories);
    }
  }, [nkoList]);

  // Фильтрация
  useEffect(() => {
    let filtered = [...nkoList];

    // Фильтр по городам (Мультивыбор)
    if (filterCities.length > 0) {
      filtered = filtered.filter(nko => filterCities.includes(nko.city_name));
    }

    // Фильтр по категории
    if (selectedCategory !== 'Все категории') {
      filtered = filtered.filter(nko => nko.category === selectedCategory);
    }

    // Поиск
    if (searchQuery) {
      filtered = filtered.filter(nko =>
        (nko.organization_name && nko.organization_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (nko.description && nko.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    setFilteredNko(filtered);
  }, [nkoList, filterCities, selectedCategory, searchQuery]);

  const handleResetFilters = () => {
    setFilterCities([]);
    setSelectedCategory('Все категории');
    setSearchQuery('');
  };

  if (loading && nkoList.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FiLoader className="animate-spin text-6xl text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Загрузка НКО...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-xl shadow-md">
          <p className="text-red-600 text-lg mb-4">Ошибка загрузки: {error}</p>
          <button
            onClick={() => fetchAllNkos()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

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
        @keyframes slideInFromRight {
          from { opacity: 0; transform: translateX(30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
        }
        .animate-slide-left {
          animation: slideInFromLeft 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
        }
        .animate-slide-right {
          animation: slideInFromRight 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
        }
        .animate-scale-in {
          animation: scaleIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
        }
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-300 { animation-delay: 0.3s; }
        .nko-card-stagger {
          animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
        }
        .icon-float {
          animation: pulse 2s ease-in-out infinite;
        }
      `}</style>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          {/* Заголовок */}
          <div className="mb-8 animate-fade-in-up">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                <FiMap className="text-2xl text-white" />
              </div>
              <h1 className="text-4xl font-bold text-gray-800">Некоммерческие организации</h1>
            </div>
            <p className="text-gray-600 text-lg pl-16">
              Найдите НКО в вашем городе и станьте частью добрых дел
            </p>
          </div>

          {/* Фильтры */}
          <div className="bg-white p-6 rounded-xl shadow-md mb-8 relative z-20 animate-slide-right delay-100 border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                <FiFilter className="text-lg text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800">Фильтры</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Поиск */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Поиск
                </label>
                <input
                  type="text"
                  placeholder="Название организации..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:border-blue-400 hover:shadow-md"
                />
              </div>

              {/* Города (Мультиселект) */}
              <div className="relative" ref={dropdownRef}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Города
                </label>
                <button
                  onClick={() => setIsCityDropdownOpen(!isCityDropdownOpen)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-left flex items-center justify-between transition-all hover:border-blue-400 hover:shadow-md"
                >
                  <span className="truncate">
                    {filterCities.length === 0 
                      ? 'Все города' 
                      : `Выбрано: ${filterCities.length}`}
                  </span>
                  <FiChevronDown className={`transition-transform ${isCityDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isCityDropdownOpen && (
                  <div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto z-30 animate-scale-in">
                    <div className="p-2">
                      <div 
                        className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer transition-colors"
                        onClick={() => setFilterCities([])}
                      >
                        <div className={`w-4 h-4 border rounded mr-2 flex items-center justify-center transition-all ${filterCities.length === 0 ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                          {filterCities.length === 0 && <FiCheck className="text-white text-xs" />}
                        </div>
                        <span className={filterCities.length === 0 ? 'font-medium text-blue-600' : 'text-gray-700'}>
                          Все города
                        </span>
                      </div>
                      
                      <div className="my-1 border-t border-gray-100"></div>

                      {cities.map(city => (
                        <div 
                          key={city.id} 
                          className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer transition-colors"
                          onClick={() => toggleCity(city.name)}
                        >
                          <div className={`w-4 h-4 border rounded mr-2 flex items-center justify-center transition-all ${filterCities.includes(city.name) ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                            {filterCities.includes(city.name) && <FiCheck className="text-white text-xs" />}
                          </div>
                          <span className="text-gray-700">{city.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Категория */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Направление деятельности
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:border-blue-400 hover:shadow-md"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Отображение выбранных тегов городов */}
            {filterCities.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {filterCities.map(city => (
                  <span key={city} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 animate-scale-in hover:bg-blue-200 transition-colors">
                    {city}
                    <button 
                      onClick={() => toggleCity(city)}
                      className="ml-2 text-blue-600 hover:text-blue-800 focus:outline-none transition-colors"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Сброс фильтров */}
            {(filterCities.length > 0 || selectedCategory !== 'Все категории' || searchQuery) && (
              <button
                onClick={handleResetFilters}
                className="mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium transition-all hover:scale-105"
              >
                Сбросить фильтры
              </button>
            )}
          </div>

          {/* Счетчик */}
          <div className="mb-6 animate-slide-left delay-200">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-xl border border-blue-100 inline-block">
              <p className="text-gray-700">
                Найдено организаций: <span className="font-bold text-2xl text-blue-600 ml-2">{filteredNko.length}</span>
              </p>
            </div>
          </div>

          {/* Список НКО */}
          <div className="relative z-0">
            {filteredNko.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredNko.map((nko, idx) => (
                  <div 
                    key={nko.id}
                    className="nko-card-stagger transform transition-all duration-300 hover:scale-105"
                    style={{ animationDelay: `${(idx % 9) * 0.08}s` }}
                  >
                    <NkoCard nko={nko} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-2xl shadow-md animate-fade-in-up delay-300 border border-dashed border-gray-300">
                <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-50 to-purple-50 rounded-full mb-6 shadow-inner">
                  <FiMap className="text-5xl text-blue-400 icon-float" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">НКО не найдены</h3>
                <p className="text-gray-500 mb-6">Попробуйте изменить параметры поиска</p>
                <button
                  onClick={handleResetFilters}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-medium hover:shadow-lg transition-all hover:scale-105"
                >
                  Сбросить фильтры
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default NkoListPage;