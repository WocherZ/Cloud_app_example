// src/components/profile/LogoutButton.jsx
import React from 'react';
import { FiLogOut, FiAlertCircle } from 'react-icons/fi';

export const LogoutButton = ({ onLogout }) => {
  const handleLogout = () => {
    if (window.confirm('Вы уверены, что хотите выйти из аккаунта?')) {
      onLogout();
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg transition-all font-medium shadow-md hover:shadow-lg group"
    >
      <FiLogOut className="group-hover:rotate-12 transition-transform" />
      Выйти из аккаунта
    </button>
  );
};
