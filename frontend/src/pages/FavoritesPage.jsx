// src/pages/FavoritesPage.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiHeart, FiCalendar, FiFileText, FiUsers, FiBookOpen } from 'react-icons/fi'; // Добавил иконку книги
import { useFavorites } from '../contexts/FavoritesContext';

// Импорт всех карточек
import NkoCard from '../components/Nko/NkoCard'; 
import NewsCard from '../components/News/NewsCard';
import EventCard from '../components/Events/EventCard';
import KnowledgeBaseCard from '../components/KnowledgeBase/KnowledgeBaseCard';

const FavoritesPage = () => {
  // Достаем все массивы, включая favoriteKnowledgeBase
  const { 
    favoriteNews, 
    favoriteEvents, 
    favoriteNkos, 
    favoriteKnowledgeBase, // <--- Добавили
    isLoading 
  } = useFavorites();

  const [activeTab, setActiveTab] = useState('all'); // 'all', 'news', 'events', 'nko', 'kb'

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка избранного...</p>
        </div>
      </div>
    );
  }

  // Считаем общее количество
  const totalFavorites = 
    favoriteNews.length + 
    favoriteEvents.length + 
    favoriteNkos.length + 
    favoriteKnowledgeBase.length;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Заголовок */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <FiHeart className="text-4xl text-red-500" />
            <h1 className="text-4xl font-bold text-gray-800">Избранное</h1>
          </div>
          <p className="text-gray-600">
            Сохраненные материалы ({totalFavorites})
          </p>
        </div>

        {/* Табы */}
        <div className="mb-8 flex gap-2 border-b border-gray-200 overflow-x-auto pb-2 scrollbar-thin">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-6 py-3 font-medium transition-colors whitespace-nowrap ${
              activeTab === 'all' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Все ({totalFavorites})
          </button>
          
          <button
            onClick={() => setActiveTab('events')}
            className={`px-6 py-3 font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'events' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <FiCalendar /> События ({favoriteEvents.length})
          </button>
          
          <button
            onClick={() => setActiveTab('news')}
            className={`px-6 py-3 font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'news' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <FiFileText /> Новости ({favoriteNews.length})
          </button>

          <button
            onClick={() => setActiveTab('kb')}
            className={`px-6 py-3 font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'kb' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <FiBookOpen /> База знаний ({favoriteKnowledgeBase.length})
          </button>

          <button
            onClick={() => setActiveTab('nko')}
            className={`px-6 py-3 font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'nko' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <FiUsers /> НКО ({favoriteNkos.length})
          </button>
        </div>

        {/* Контент */}
        {totalFavorites === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <FiHeart className="mx-auto text-6xl text-gray-300 mb-4" />
            <h3 className="text-2xl font-semibold text-gray-800 mb-2">У вас пока нет избранного</h3>
            <p className="text-gray-600 mb-6">Добавляйте интересные материалы, чтобы не потерять их</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/calendar" className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors">События</Link>
              <Link to="/news" className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors">Новости</Link>
              <Link to="/knowledge-base" className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors">База знаний</Link>
            </div>
          </div>
        ) : (
          <div className="space-y-12">
            
            {/* События */}
            {(activeTab === 'all' || activeTab === 'events') && favoriteEvents.length > 0 && (
              <div>
                {activeTab === 'all' && <h2 className="text-2xl font-bold mb-4 text-gray-800">События</h2>}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {favoriteEvents.map(event => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              </div>
            )}

            {/* Новости */}
            {(activeTab === 'all' || activeTab === 'news') && favoriteNews.length > 0 && (
              <div>
                {activeTab === 'all' && <h2 className="text-2xl font-bold mb-4 text-gray-800">Новости</h2>}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {favoriteNews.map(news => (
                    <NewsCard key={news.id} news={news} />
                  ))}
                </div>
              </div>
            )}

            {/* База Знаний */}
            {(activeTab === 'all' || activeTab === 'kb') && favoriteKnowledgeBase.length > 0 && (
              <div>
                {activeTab === 'all' && <h2 className="text-2xl font-bold mb-4 text-gray-800">База знаний</h2>}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {favoriteKnowledgeBase.map(item => (
                    <KnowledgeBaseCard key={item.id} item={item} />
                  ))}
                </div>
              </div>
            )}

            {/* НКО */}
            {(activeTab === 'all' || activeTab === 'nko') && favoriteNkos.length > 0 && (
              <div>
                {activeTab === 'all' && <h2 className="text-2xl font-bold mb-4 text-gray-800">Организации (НКО)</h2>}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {favoriteNkos.map(nko => (
                     <NkoCard key={nko.id} nko={nko} />
                  ))}
                </div>
              </div>
            )}

            {/* Сообщение, если в конкретном табе пусто */}
            {activeTab !== 'all' && 
             ((activeTab === 'events' && favoriteEvents.length === 0) ||
              (activeTab === 'news' && favoriteNews.length === 0) ||
              (activeTab === 'kb' && favoriteKnowledgeBase.length === 0) ||
              (activeTab === 'nko' && favoriteNkos.length === 0)) && (
                <div className="text-center py-12 text-gray-500">
                  <p>В этой категории пока ничего нет</p>
                </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
};

export default FavoritesPage;