// src/components/profile/ModeratorPanelCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { FiShield, FiCheckCircle, FiArrowRight } from 'react-icons/fi';

export const ModeratorPanelCard = () => {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500 relative overflow-hidden group">
      {/* Декоративный фон */}
      <div className="absolute right-0 top-0 w-32 h-32 bg-purple-50 rounded-full -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-500"></div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <FiShield className="text-purple-600" />
            Панель модератора
          </h3>
        </div>

        <p className="text-gray-600 mb-6 text-sm">
          У вас есть права на проверку контента и заявок НКО.
        </p>

        <div className="flex gap-3">
          <Link
            to="/moderator"
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors shadow-md hover:shadow-lg"
          >
            Перейти в кабинет
            <FiArrowRight />
          </Link>
        </div>
      </div>
    </div>
  );
};