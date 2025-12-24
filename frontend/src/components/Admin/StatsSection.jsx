// src/components/admin/StatsSection.jsx
import React, { useState } from 'react';
import { FiUsers, FiHome, FiShield, FiCalendar, FiFileText, FiTrendingUp, FiX } from 'react-icons/fi';
import { StatCard } from './StatCard';
import EventsMap from './EventsMap';

export const StatsSection = ({ stats }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleDateRangeChange = (type, value) => {
    if (type === 'start') {
      setStartDate(value);
      // Если конечная дата раньше начальной, сбрасываем её
      if (endDate && value && new Date(value) > new Date(endDate)) {
        setEndDate('');
      }
    } else {
      setEndDate(value);
      // Если начальная дата позже конечной, сбрасываем её
      if (startDate && value && new Date(value) < new Date(startDate)) {
        setStartDate('');
      }
    }
  };

  const clearDateRange = () => {
    setStartDate('');
    setEndDate('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Общая статистика</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard
            title="Всего пользователей"
            value={stats.totalUsers || 0}
            icon={FiUsers}
            color="from-blue-500 to-blue-600"
            subtitle="Зарегистрировано в системе"
          />
          <StatCard
            title="НКО в системе"
            value={stats.totalNko || 0}
            icon={FiHome}
            color="from-green-500 to-green-600"
            subtitle="Активных организаций"
          />
          <StatCard
            title="Заявок на модерацию"
            value={stats.pendingNko || 0}
            icon={FiShield}
            color="from-orange-500 to-orange-600"
            subtitle="Требуют проверки"
          />
          <StatCard
            title="Событий"
            value={stats.totalEvents || 0}
            icon={FiCalendar}
            color="from-purple-500 to-purple-600"
            subtitle="Опубликовано"
          />
          <StatCard
            title="Новостей"
            value={stats.totalNews || 0}
            icon={FiFileText}
            color="from-pink-500 to-pink-600"
            subtitle="Опубликовано"
          />
          <StatCard
            title="База знаний"
            value={stats.totalKnowledgeBase || 0}
            icon={FiTrendingUp}
            color="from-teal-500 to-teal-600"
            subtitle="Записей"
          />
        </div>
      </div>

      {/* Карта событий */}
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">География событий</h2>
          
          {/* Выбор временного интервала */}
          <div className="bg-gradient-to-br from-white to-purple-50 rounded-xl shadow-lg p-6 border border-purple-100">
            <div className="flex flex-col gap-4">
              {/* Заголовок */}
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <FiCalendar className="text-purple-600 text-xl" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Выберите период</h3>
                  <p className="text-sm text-gray-500">Отфильтруйте события по дате проведения</p>
                </div>
              </div>

              {/* Поля выбора даты */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                {/* Дата начала */}
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Дата начала
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-500 pointer-events-none">
                      <FiCalendar className="text-lg" />
                    </div>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => handleDateRangeChange('start', e.target.value)}
                      max={endDate || undefined}
                      className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-lg 
                               focus:ring-2 focus:ring-purple-500 focus:border-purple-500 
                               text-sm font-medium text-gray-700
                               transition-all duration-200
                               hover:border-purple-300
                               bg-white shadow-sm"
                    />
                  </div>
                </div>

                {/* Стрелка между датами */}
                <div className="hidden sm:flex items-end pb-8">
                  <div className="text-purple-400 text-2xl">→</div>
                </div>

                {/* Дата окончания */}
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Дата окончания
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-500 pointer-events-none">
                      <FiCalendar className="text-lg" />
                    </div>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => handleDateRangeChange('end', e.target.value)}
                      min={startDate || undefined}
                      className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-lg 
                               focus:ring-2 focus:ring-purple-500 focus:border-purple-500 
                               text-sm font-medium text-gray-700
                               transition-all duration-200
                               hover:border-purple-300
                               bg-white shadow-sm"
                    />
                  </div>
                </div>

                {/* Кнопка сброса */}
                {(startDate || endDate) && (
                  <div className="flex items-end">
                    <button
                      onClick={clearDateRange}
                      className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 
                               text-white font-medium rounded-lg 
                               hover:from-red-600 hover:to-red-700 
                               focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
                               transition-all duration-200
                               shadow-md hover:shadow-lg
                               flex items-center justify-center gap-2
                               whitespace-nowrap"
                    >
                      <FiX className="text-lg" />
                      <span>Сбросить</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Индикатор активного фильтра */}
              {(startDate || endDate) && (
                <div className="mt-2 p-3 bg-purple-100 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-2 text-sm text-purple-700">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="font-medium">
                      Активный фильтр: 
                      {startDate && endDate 
                        ? ` ${new Date(startDate).toLocaleDateString('ru-RU')} - ${new Date(endDate).toLocaleDateString('ru-RU')}`
                        : startDate 
                          ? ` с ${new Date(startDate).toLocaleDateString('ru-RU')}`
                          : ` до ${new Date(endDate).toLocaleDateString('ru-RU')}`
                      }
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <EventsMap startDate={startDate} endDate={endDate} />
      </div>
    </div>
  );
};