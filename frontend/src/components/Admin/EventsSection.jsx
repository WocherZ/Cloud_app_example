// src/components/admin/EventsSection.jsx
import React, { useState } from 'react';
import {
  FiCalendar,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiMapPin,
  FiAlertCircle,
  FiUsers,
} from 'react-icons/fi';
import { EventModal } from './EventModal';
import { getFileUrl, handleImageError } from '../../utils/apiUtils';

export const EventsSection = ({ events, loading, error, onSave, onDelete }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  const handleEdit = (eventItem) => {
    setEditingEvent(eventItem);
    setShowModal(true);
  };

  const handleCreate = () => {
    setEditingEvent(null);
    setShowModal(true);
  };

  const handleSave = async (eventData) => {
    await onSave(eventData, editingEvent?.id);
    setShowModal(false);
    setEditingEvent(null);
  };

  const handleDelete = async (eventId) => {
    if (window.confirm('Удалить это событие? Это действие нельзя отменить.')) {
      await onDelete(eventId);
    }
  };

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
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Управление событиями</h2>
          <p className="text-gray-600 mt-1">Всего событий: {events.length}</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-medium transition-all shadow-lg hover:shadow-xl"
        >
          <FiPlus className="text-xl" />
          Создать событие
        </button>
      </div>

      {events.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <FiCalendar className="mx-auto text-6xl text-gray-300 mb-4" />
          <p className="text-xl text-gray-600 mb-2">Событий пока нет</p>
          <p className="text-gray-500 mb-6">Создайте первое событие для вашей организации</p>
          <button
            onClick={handleCreate}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Создать первое событие
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((item) => {
            // Обработка изображения через утилиту
            const rawImage = item.image || item.image_url || (item.images && item.images.length > 0 ? item.images[0] : null);
            const imageUrl = getFileUrl(rawImage);
            
            // ИСПРАВЛЕНИЕ ЗДЕСЬ: добавлено item.date как в работающем примере
            const eventDate = item.date || item.event_date || item.event_datetime;
            
            const formattedDate = eventDate 
              ? new Date(eventDate).toLocaleDateString('ru-RU', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })
              : 'Дата не указана';

            return (
              <div
                key={item.id}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100"
              >
                {/* Изображение */}
                {rawImage ? (
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={imageUrl}
                      alt={item.title}
                      onError={handleImageError}
                      className="w-full h-full object-cover"
                    />
                    {/* Категория */}
                    {item.category_event_name && (
                      <div className="absolute top-3 left-3">
                        <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg">
                          {item.category_event_name}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-48 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                    <FiCalendar className="text-6xl text-blue-300" />
                  </div>
                )}

                {/* Контент */}
                <div className="p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2">
                    {item.title}
                  </h3>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {item.description}
                  </p>

                  <div className="space-y-2 mb-4">
                    {/* Дата */}
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <FiCalendar className="text-blue-500" />
                      <span>{formattedDate}</span>
                    </div>

                    {/* Адрес */}
                    {item.address && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <FiMapPin className="text-blue-500" />
                        <span className="line-clamp-1">{item.address}</span>
                      </div>
                    )}

                    {/* Участники */}
                    {item.quantity_participant > 0 && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <FiUsers className="text-blue-500" />
                        <span>До {item.quantity_participant} участников</span>
                      </div>
                    )}
                  </div>

                  {/* Кнопки действий */}
                  <div className="flex gap-2 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => handleEdit(item)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-sm font-medium transition-colors"
                    >
                      <FiEdit2 />
                      Редактировать
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="flex items-center justify-center px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-medium transition-colors"
                      title="Удалить событие"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Модальное окно */}
      {showModal && (
        <EventModal
          event={editingEvent}
          onSave={handleSave}
          onClose={() => {
            setShowModal(false);
            setEditingEvent(null);
          }}
        />
      )}
    </div>
  );
};