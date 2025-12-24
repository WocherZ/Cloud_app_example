// src/components/profile/QuickActionsCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { FiCalendar, FiFileText, FiMapPin, FiBook } from 'react-icons/fi';

export const QuickActionsCard = () => {
  const actions = [
    {
      icon: FiCalendar,
      label: 'События',
      description: 'Найти мероприятия',
      link: '/calendar',
      color: 'from-blue-500 to-blue-600',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
    {
      icon: FiFileText,
      label: 'Новости',
      description: 'Читать новости',
      link: '/news',
      color: 'from-green-500 to-green-600',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
    },
    {
      icon: FiMapPin,
      label: 'НКО',
      description: 'Все организации',
      link: '/nko',
      color: 'from-purple-500 to-purple-600',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
    },
    {
      icon: FiBook,
      label: 'База знаний',
      description: 'Полезная информация',
      link: '/knowledge-base',
      color: 'from-orange-500 to-orange-600',
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
    },
  ];

  return (
    <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
      <h3 className="text-xl font-bold text-gray-800 mb-4">Быстрые действия</h3>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action, index) => (
          <Link
            key={index}
            to={action.link}
            className="group p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-all border border-gray-200 hover:border-gray-300"
          >
            <div className={`w-10 h-10 ${action.iconBg} rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
              <action.icon className={`${action.iconColor} text-xl`} />
            </div>
            <div className="font-semibold text-gray-800 mb-1">{action.label}</div>
            <div className="text-xs text-gray-600">{action.description}</div>
          </Link>
        ))}
      </div>
    </div>
  );
};