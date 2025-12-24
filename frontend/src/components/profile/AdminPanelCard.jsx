// src/components/profile/AdminPanelCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { FiShield, FiUsers, FiHome, FiFileText, FiCalendar, FiArrowRight, FiAlertCircle } from 'react-icons/fi';

export const AdminPanelCard = ({ stats }) => {
  const quickStats = [
    {
      icon: FiUsers,
      label: 'Пользователи',
      value: stats?.totalUsers || 0,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      icon: FiHome,
      label: 'НКО',
      value: stats?.totalNko || 0,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      icon: FiAlertCircle,
      label: 'На модерации',
      value: stats?.pendingNko || 0,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  return (
    <div className="bg-gradient-to-br from-purple-50 via-violet-50 to-indigo-50 p-6 rounded-xl shadow-md border-2 border-purple-200 hover:shadow-xl transition-all">
      {/* Заголовок */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center shadow-lg">
          <FiShield className="text-2xl text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-800">
            Панель администратора
          </h3>
          <p className="text-sm text-gray-600">Полный доступ к управлению</p>
        </div>
      </div>

      {/* Описание */}
      <p className="text-gray-700 mb-6 leading-relaxed">
        Управление пользователями, НКО, событиями, новостями и модерация контента
      </p>

      {/* Быстрая статистика */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        {quickStats.map((stat, index) => (
          <div key={index} className="bg-white p-3 rounded-lg shadow-sm text-center">
            <div className={`w-8 h-8 ${stat.bgColor} rounded-lg flex items-center justify-center mx-auto mb-2`}>
              <stat.icon className={stat.color} />
            </div>
            <div className={`text-xl font-bold ${stat.color} mb-1`}>
              {stat.value}
            </div>
            <div className="text-xs text-gray-600">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Кнопка перехода */}
      <Link
        to="/admin"
        className="group flex items-center justify-between w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all font-medium shadow-md hover:shadow-lg"
      >
        <span className="flex items-center gap-2">
          <FiShield />
          Перейти в админ-панель
        </span>
        <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
      </Link>

      {/* Быстрые ссылки */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Link
          to="/admin?tab=nko"
          className="text-center px-3 py-2 bg-white hover:bg-gray-50 text-purple-600 rounded-lg transition-all text-sm font-medium border border-purple-200"
        >
          Модерация
        </Link>
        <Link
          to="/admin?tab=stats"
          className="text-center px-3 py-2 bg-white hover:bg-gray-50 text-purple-600 rounded-lg transition-all text-sm font-medium border border-purple-200"
        >
          Статистика
        </Link>
      </div>
    </div>
  );
};