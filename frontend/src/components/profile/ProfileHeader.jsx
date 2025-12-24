// src/components/profile/ProfileHeader.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { FiMail, FiMapPin, FiAward } from 'react-icons/fi';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

export const ProfileHeader = ({ user }) => {
  // Генерируем аватар из первой буквы имени
  const avatar = (user.name || user.email).charAt(0).toUpperCase();
  const [isAvatarBroken, setIsAvatarBroken] = useState(false);

  useEffect(() => {
    setIsAvatarBroken(false);
  }, [user?.user_photo]);

  const avatarUrl = useMemo(() => {
    if (!user?.user_photo) return null;
    const normalizedPath = user.user_photo
      .replace(/^(\.\/)+/, '') // убираем ./ в начале
      .replace(/^\/+/, '') // убираем / в начале, иначе backend вернет 403
      .replace(/\\/g, '/'); // windows-пути приводим к unix стилю
    return `${API_BASE_URL}/public/files?file_path=${encodeURIComponent(normalizedPath)}`;
  }, [user?.user_photo]);

  // Определяем цвет значка роли
  const getRoleBadgeColor = (role) => {
    const colors = {
      admin: 'bg-purple-100 text-purple-800 border-purple-300',
      nko: 'bg-green-100 text-green-800 border-green-300',
      moderator: 'bg-blue-100 text-blue-800 border-blue-300',
      user: 'bg-gray-100 text-gray-800 border-gray-300',
    };
    return colors[role] || colors.user;
  };

  const getRoleLabel = (role) => {
    const labels = {
      admin: 'Администратор',
      nko: 'Представитель НКО',
      moderator: 'Модератор',
      user: 'Пользователь',
    };
    return labels[role] || 'Пользователь';
  };

  return (
    <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 rounded-2xl p-8 mb-8 text-white shadow-xl relative overflow-hidden">
      {/* Декоративные элементы */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>
      
      <div className="relative flex items-start gap-6">
        {/* Аватар */}
        <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-4xl font-bold border-4 border-white/30 shadow-lg overflow-hidden">
          {avatarUrl && !isAvatarBroken ? (
            <img
              src={avatarUrl}
              alt="Аватар пользователя"
              className="w-full h-full object-cover"
              onError={() => setIsAvatarBroken(true)}
            />
          ) : (
            <span>{avatar}</span>
          )}
        </div>

        {/* Информация */}
        <div className="flex-1">
          <h1 className="text-4xl font-bold mb-2">
            {user.name || 'Пользователь'}
          </h1>
          
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <div className="flex items-center gap-2 text-blue-100">
              <FiMail className="text-lg" />
              <span>{user.email}</span>
            </div>
            
            {user.city_name && (
              <div className="flex items-center gap-2 text-blue-100">
                <FiMapPin className="text-lg" />
                <span>{user.city_name}</span>
              </div>
            )}
          </div>

          {/* Роль */}
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 ${getRoleBadgeColor(user.role)} backdrop-blur-sm`}>
            <FiAward />
            <span className="font-semibold">{getRoleLabel(user.role)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};