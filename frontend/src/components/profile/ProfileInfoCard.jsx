// src/components/profile/ProfileInfoCard.jsx
import React, { useState } from 'react';
import { FiEdit, FiCheck, FiX } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext'; // Импортируем контекст

export const ProfileInfoCard = ({ user, cities, onUpdateCity }) => {
  const { updateUserName } = useAuth(); // Достаем функцию обновления имени

  // --- Состояния для Города ---
  const [isEditingCity, setIsEditingCity] = useState(false);
  const [newCityName, setNewCityName] = useState(user?.city_name || '');
  
  // --- Состояния для Имени (Новое) ---
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(user?.name || '');

  // Общие состояния сообщений
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // --- Логика сохранения ИМЕНИ ---
  const handleSaveName = async () => {
    setError('');
    setSuccess('');

    if (!newName || newName === user.name) {
      setIsEditingName(false);
      return;
    }

    // Вызываем функцию из контекста
    const result = await updateUserName(newName);

    if (result.success) {
      setSuccess('Имя успешно обновлено!');
      setIsEditingName(false);
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setError(result.error || 'Не удалось обновить имя');
      setNewName(user.name); // Возвращаем старое имя при ошибке
    }
  };

  const handleCancelName = () => {
    setIsEditingName(false);
    setNewName(user.name);
    setError('');
    setSuccess('');
  };

  // --- Логика сохранения ГОРОДА ---
  const handleSaveCity = async () => {
    setError('');
    setSuccess('');
    
    if (!newCityName || newCityName === user.city_name) {
      setIsEditingCity(false);
      return;
    }

    const result = await onUpdateCity(newCityName);
    
    if (result.success) {
      setSuccess('Город успешно обновлён!');
      setIsEditingCity(false);
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setError(result.message || 'Не удалось обновить город');
    }
  };

  const handleCancelCity = () => {
    setIsEditingCity(false);
    setNewCityName(user.city_name);
    setError('');
    setSuccess('');
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <FiEdit className="text-blue-600" />
        Основная информация
      </h2>
      
      <div className="space-y-5">
        {/* Email */}
        <div>
          <label className="block text-sm font-semibold text-gray-600 mb-2">
            Email адрес
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-gray-800 font-medium">{user.email}</p>
            </div>
            <div className="px-3 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium border border-green-200">
              Подтверждён
            </div>
          </div>
        </div>

        {/* Имя пользователя (С редактированием) */}
        <div>
          <label className="block text-sm font-semibold text-gray-600 mb-2">
            Имя пользователя
          </label>
          
          {isEditingName ? (
            <div className="space-y-3">
              <input
                type="text"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Введите ваше имя"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSaveName}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
                >
                  <FiCheck />
                  Сохранить
                </button>
                <button
                  onClick={handleCancelName}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors font-medium"
                >
                  <FiX />
                  Отмена
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex-1 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-gray-800 font-medium">{user.name || 'Не указано'}</p>
              </div>
              <button
                onClick={() => setIsEditingName(true)}
                className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors font-medium flex items-center gap-2"
              >
                <FiEdit />
                Изменить
              </button>
            </div>
          )}
        </div>

        {/* Город (С редактированием) */}
        <div>
          <label className="block text-sm font-semibold text-gray-600 mb-2">
            Ваш город
          </label>
          
          {isEditingCity ? (
            <div className="space-y-3">
              <select
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                value={newCityName}
                onChange={(e) => setNewCityName(e.target.value)}
              >
                <option value="">Выберите город</option>
                {cities.map((city) => (
                  <option key={city.id || city} value={city.name || city}>
                    {city.name || city}
                  </option>
                ))}
              </select>
              
              <div className="flex gap-2">
                <button
                  onClick={handleSaveCity}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
                >
                  <FiCheck />
                  Сохранить
                </button>
                <button
                  onClick={handleCancelCity}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors font-medium"
                >
                  <FiX />
                  Отмена
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex-1 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-gray-800 font-medium">{user.city_name || user.city || 'Не указан'}</p>
              </div>
              <button
                onClick={() => setIsEditingCity(true)}
                className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors font-medium flex items-center gap-2"
              >
                <FiEdit />
                Изменить
              </button>
            </div>
          )}
          
          {/* Сообщения об успехе/ошибке (общие для обоих полей) */}
          {error && (
            <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
          {success && (
            <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-600 text-sm">{success}</p>
            </div>
          )}
        </div>

        {/* Дата регистрации */}
        {user.registered_date && (
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-2">
              На платформе с
            </label>
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-gray-800 font-medium">
                {new Date(user.registered_date).toLocaleDateString('ru-RU', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};