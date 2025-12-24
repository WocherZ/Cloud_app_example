// src/pages/KnowledgeBasePage.jsx
import React, { useState, useEffect } from 'react';
import { usePublic } from '../contexts/PublicContext';
import { FiBook, FiFilter, FiSearch, FiRefreshCw } from 'react-icons/fi';
import KnowledgeBaseCard from '../components/KnowledgeBase/KnowledgeBaseCard';
import { FiXCircle } from 'react-icons/fi';

const KnowledgeBasePage = () => {
  const { knowledgeBaseList, loading, error, fetchAllKnowledgeBase } = usePublic();
  
  const [filteredMaterials, setFilteredMaterials] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('Все категории');
  const [selectedType, setSelectedType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState(['Все категории']);

  const types = [
    { value: 'all', label: 'Все типы' },
    { value: 'document', label: 'Документы' },
    { value: 'video', label: 'Видео' },
    { value: 'link', label: 'Ссылки' },
  ];

  // Извлечение уникальных категорий
  useEffect(() => {
    if (knowledgeBaseList && knowledgeBaseList.length > 0) {
      const uniqueCategories = ['Все категории', ...new Set(
        knowledgeBaseList
          .map(item => item.category)
          .filter(cat => cat && cat.trim() !== '')
      )];
      setCategories(uniqueCategories);
    }
  }, [knowledgeBaseList]);

  // Фильтрация
  useEffect(() => {
    if (!knowledgeBaseList) return;
    
    let filtered = [...knowledgeBaseList];

    if (selectedCategory !== 'Все категории') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    if (selectedType !== 'all') {
      filtered = filtered.filter(item => item.type === selectedType);
    }

    if (searchQuery) {
      filtered = filtered.filter(item =>
        (item.title && item.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    setFilteredMaterials(filtered);
  }, [knowledgeBaseList, selectedCategory, selectedType, searchQuery]);

  const handleResetFilters = () => {
    setSelectedCategory('Все категории');
    setSelectedType('all');
    setSearchQuery('');
  };

  if (loading && (!knowledgeBaseList || knowledgeBaseList.length === 0)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg animate-pulse">Загрузка базы знаний...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-xl shadow-lg max-w-md">
          <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiBook className="text-red-500 text-2xl" />
          </div>
          <p className="text-gray-800 font-semibold text-lg mb-2">Ошибка загрузки</p>
          <p className="text-red-500 mb-6 text-sm">{error}</p>
          <button
            onClick={() => fetchAllKnowledgeBase()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full flex items-center justify-center gap-2"
          >
            <FiRefreshCw /> Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      {/* Стили для анимаций */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up { animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
      `}</style>

      <div className="container mx-auto px-4">
        
        {/* Заголовок */}
        <div className="mb-10 text-center md:text-left animate-fade-in-up">
          <div className="inline-flex items-center justify-center md:justify-start gap-3 mb-3">
            <div className="p-3 bg-blue-100 rounded-xl text-blue-600">
              <FiBook className="text-3xl" />
            </div>
            <h1 className="text-4xl font-bold text-gray-800">База знаний</h1>
          </div>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto md:mx-0">
            Методические материалы, видеоуроки и полезные ресурсы для эффективной работы НКО и волонтеров.
          </p>
        </div>

        {/* Фильтры и поиск */}
        <div className="bg-white p-6 rounded-2xl shadow-lg mb-8 border border-gray-100 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-100">
            <FiFilter className="text-blue-600 text-xl" />
            <h2 className="text-lg font-semibold text-gray-800">Фильтры материалов</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Поиск */}
            <div className="md:col-span-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Поиск</label>
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Название, описание..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            {/* Категория */}
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">Категория</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Тип */}
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">Тип материала</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer"
              >
                {types.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Сброс фильтров */}
          {(selectedCategory !== 'Все категории' || selectedType !== 'all' || searchQuery) && (
            <div className="mt-6 flex justify-end pt-4 border-t border-gray-100">
              <button
                onClick={handleResetFilters}
                className="text-sm font-medium text-red-500 hover:text-red-600 transition-colors flex items-center gap-1"
              >
                <FiXCircle /> Сбросить все фильтры
              </button>
            </div>
          )}
        </div>

        {/* Счетчик */}
        <div className="mb-6 flex items-center justify-between animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <p className="text-gray-500 font-medium">
            Найдено материалов: <span className="text-gray-900 font-bold ml-1">{filteredMaterials.length}</span>
          </p>
        </div>

        {/* Список материалов */}
        {filteredMaterials.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMaterials.map((item, index) => (
              <div 
                key={item.id} 
                className="animate-fade-in-up h-full"
                style={{ animationDelay: `${0.2 + (index * 0.1)}s` }} // Staggered animation
              >
                <KnowledgeBaseCard item={item} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-300 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiSearch className="text-4xl text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Ничего не найдено</h3>
            <p className="text-gray-500 mb-6">Попробуйте изменить параметры поиска или категорию</p>
            <button
              onClick={handleResetFilters}
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

// Вспомогательный импорт иконки для кнопки сброса (если забыли)


export default KnowledgeBasePage;