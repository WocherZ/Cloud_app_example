import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, roles }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div>Загрузка...</div>; // Или спиннер
  }

  if (!user || !roles.includes(user.role)) {
    // Если пользователь не авторизован или его роль не подходит,
    // перенаправляем на главную страницу.
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;