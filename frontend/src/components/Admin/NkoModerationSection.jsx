// src/components/admin/NkoModerationSection.jsx
import React, { useState } from 'react';
import {
  FiCheckCircle,
  FiXCircle,
  FiSearch,
  FiMapPin,
  FiMail,
  FiAlertCircle,
} from 'react-icons/fi';

export const NkoModerationSection = ({
  pendingNkos,
  loading,
  error,
  onApprove,
  onReject,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNkoId, setSelectedNkoId] = useState(null); // Храним ID, а не весь объект
  const [rejectionReason, setRejectionReason] = useState('');

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Укажите причину отклонения');
      return;
    }
    await onReject(selectedNkoId, rejectionReason);
    setSelectedNkoId(null);
    setRejectionReason('');
  };

  const filteredNkos = pendingNkos.filter(nko => {
    const term = searchTerm.toLowerCase();
    return (
      (nko.organization_name || '').toLowerCase().includes(term) ||
      (nko.email || '').toLowerCase().includes(term) ||
      (nko.city || '').toLowerCase().includes(term)
    );
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-center gap-3">
        <FiAlertCircle className="text-red-600 text-2xl" />
        <div>
          <p className="font-semibold text-red-800">Ошибка загрузки</p>
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Модерация НКО</h2>
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Поиск..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {filteredNkos.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <FiCheckCircle className="mx-auto text-6xl text-green-500 mb-4" />
          <p className="text-xl text-gray-600">
            {searchTerm ? 'Ничего не найдено' : 'Новых заявок нет'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNkos.map((nko) => (
            // Используем ID как ключ
            <div
              key={nko.id || nko.organization_id} 
              className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                      {nko.organization_name || nko.name || 'Без названия'}
                    </h3>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {nko.category && (
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          {nko.category}
                        </span>
                      )}
                      {nko.city && (
                        <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium flex items-center gap-1">
                          <FiMapPin className="text-xs" />
                          {nko.city}
                        </span>
                      )}
                    </div>
                  </div>
                  {nko.submitted_date && (
                    <div className="text-sm text-gray-500">
                      {new Date(nko.submitted_date).toLocaleDateString('ru-RU')}
                    </div>
                  )}
                </div>

                <div className="mb-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FiMail className="text-gray-400" />
                    <span>{nko.email}</span>
                  </div>
                  {nko.description && (
                    <p className="text-gray-700">{nko.description}</p>
                  )}
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    // Передаем ID
                    onClick={() => onApprove(nko.id || nko.organization_id)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                  >
                    <FiCheckCircle />
                    Одобрить
                  </button>
                  <button
                    // Передаем ID
                    onClick={() => setSelectedNkoId(nko.id || nko.organization_id)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                  >
                    <FiXCircle />
                    Отклонить
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Модальное окно отклонения */}
      {selectedNkoId && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                Причина отклонения
              </h3>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows="4"
                placeholder="Опишите, что нужно исправить в профиле..."
              />
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => {
                    setSelectedNkoId(null);
                    setRejectionReason('');
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors"
                >
                  Отмена
                </button>
                <button
                  onClick={handleReject}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                >
                  Отклонить заявку
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};