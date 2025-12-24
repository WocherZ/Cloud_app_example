// src/components/profile/NkoManagementCard.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiHome, FiEdit, FiPlus, FiUsers, FiCalendar, FiArrowRight } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

export const NkoManagementCard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ eventsCount: 0, participantsCount: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user?.organization_id) {
        setIsLoading(false);
        return;
      }

      try {
        // Получаем события организации
        let eventsCount = 0;
        try {
          const eventsResponse = await api.get(`/nko/events/${user.organization_id}`);
          eventsCount = eventsResponse.data?.length || 0;
        } catch (eventsError) {
          console.error('Ошибка загрузки событий организации:', eventsError);
        }

        // Получаем количество участников организации
        let participantsCount = 0;
        try {
          const membersResponse = await api.get(`/public/nkos/${user.organization_id}/members-count`);
          if (membersResponse.data && membersResponse.data.members_count !== undefined) {
            participantsCount = membersResponse.data.members_count;
          }
        } catch (membersError) {
          console.error('Ошибка загрузки количества участников организации:', membersError);
        }

        setStats({
          eventsCount,
          participantsCount
        });
      } catch (error) {
        console.error('Ошибка загрузки статистики НКО:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [user?.organization_id]);

  return (
    <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-6 rounded-xl shadow-md border-2 border-green-200 hover:shadow-xl transition-all">
      {/* Заголовок */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center shadow-lg">
          <FiHome className="text-2xl text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-800">
            Управление НКО
          </h3>
          <p className="text-sm text-gray-600">Представитель организации</p>
        </div>
      </div>

      {/* Описание */}
      <p className="text-gray-700 mb-6 leading-relaxed">
        Редактирование страницы вашей НКО, создание событий, управление участниками
      </p>

      {/* Быстрые действия */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-white p-3 rounded-lg shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <FiCalendar className="text-green-600" />
            <span className="text-xs text-gray-600 font-medium">События</span>
          </div>
          <div className="text-2xl font-bold text-green-600">
            {isLoading ? '...' : stats.eventsCount}
          </div>
        </div>
        
        <div className="bg-white p-3 rounded-lg shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <FiUsers className="text-green-600" />
            <span className="text-xs text-gray-600 font-medium">Участники</span>
          </div>
          <div className="text-2xl font-bold text-green-600">
            {isLoading ? '...' : stats.participantsCount}
          </div>
        </div>
      </div>

      {/* Кнопка просмотра профиля */}
      <div>
        <Link
          to="/nko-profile"
          className="group flex items-center justify-between w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all font-medium shadow-md hover:shadow-lg"
        >
          <span className="flex items-center gap-2">
            <FiHome />
            Просмотр профиля НКО
          </span>
          <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );
};
