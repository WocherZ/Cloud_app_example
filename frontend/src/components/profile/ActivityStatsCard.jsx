
// src/components/profile/ActivityStatsCard.jsx
import React from 'react';
import { FiTrendingUp, FiCalendar, FiHeart, FiAward } from 'react-icons/fi';

export const ActivityStatsCard = ({ attendingEventsCount, favoritesCount }) => {
  const stats = [
    {
      icon: FiCalendar,
      label: 'Запланировано событий',
      value: attendingEventsCount,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      icon: FiHeart,
      label: 'В избранном',
      value: favoritesCount,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
  ];

  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl shadow-md border border-green-200 hover:shadow-lg transition-shadow">
      <div className="flex items-center gap-2 mb-6">
        <FiTrendingUp className="text-2xl text-green-600" />
        <h3 className="text-xl font-bold text-gray-800">Активность</h3>
      </div>
      
      <div className="space-y-4">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                  <stat.icon className={stat.color} />
                </div>
                <span className="text-sm text-gray-600 font-medium">{stat.label}</span>
              </div>
            </div>
            <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
          </div>
        ))}

        {/* Прогресс-бар или достижения можно добавить */}
        <div className="mt-6 p-4 bg-white rounded-lg shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <FiAward className="text-yellow-500" />
            <span className="text-sm font-semibold text-gray-700">Уровень активности</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div 
              className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all"
              style={{ width: `${Math.min((attendingEventsCount / 10) * 100, 100)}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500">
            {attendingEventsCount < 10 
              ? `Ещё ${10 - attendingEventsCount} событий до следующего уровня`
              : 'Максимальный уровень достигнут! 🎉'
            }
          </p>
        </div>
      </div>
    </div>
  );
};