// src/components/profile/FavoritesCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { FiHeart, FiArrowRight, FiCalendar, FiFileText, FiBookOpen, FiUsers } from 'react-icons/fi';

export const FavoritesCard = ({ events = [], news = [], kb = [], nkos = [] }) => {
  // 1. Собираем все элементы в один плоский список
  const allItems = [
    ...events.map(e => ({ ...e, type: 'event', url: `/events/${e.id}`, label: 'Событие' })),
    ...news.map(n => ({ ...n, type: 'news', url: `/news/${n.id}`, label: 'Новость' })),
    ...kb.map(k => ({ ...k, type: 'kb', url: `/knowledge-base/${k.id}`, label: 'База знаний' })),
    ...nkos.map(n => ({ ...n, type: 'nko', url: `/nko/${n.id}`, label: 'НКО' }))
  ];

  // 2. Берем только первые 5 элементов для превью (можно добавить логику сортировки по дате добавления, если бэк это присылает)
  const previewItems = allItems.slice(0, 5);
  const totalCount = allItems.length;

  // Функция для выбора иконки
  const getIcon = (type) => {
    switch (type) {
      case 'event': return <FiCalendar className="text-blue-500" />;
      case 'news': return <FiFileText className="text-green-500" />;
      case 'kb': return <FiBookOpen className="text-purple-500" />;
      case 'nko': return <FiUsers className="text-orange-500" />;
      default: return <FiHeart className="text-red-500" />;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <FiHeart className="text-red-500" />
          Избранное
        </h3>
        <span className="text-sm font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
          {totalCount}
        </span>
      </div>

      {totalCount > 0 ? (
        <div className="space-y-4">
          {previewItems.map((item, index) => (
            <Link
              key={`${item.type}-${item.id}-${index}`}
              to={item.url}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group border border-transparent hover:border-gray-100"
            >
              <div className="flex-shrink-0 w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center text-lg group-hover:bg-white group-hover:shadow-sm transition-all">
                {getIcon(item.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-gray-800 truncate group-hover:text-blue-600 transition-colors">
                  {item.title || item.name || item.organization_name}
                </h4>
                <p className="text-xs text-gray-500">
                  {item.label}
                </p>
              </div>
              
              <FiArrowRight className="text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
            </Link>
          ))}

          <div className="pt-2">
            <Link
              to="/favorites"
              className="block w-full py-2 text-center text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              Посмотреть все ({totalCount})
            </Link>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
            <FiHeart className="text-2xl text-red-300" />
          </div>
          <p className="text-gray-500 text-sm mb-4">Нет избранных материалов</p>
          <Link
            to="/calendar"
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Найти интересное
          </Link>
        </div>
      )}
    </div>
  );
};