import React from 'react';
import { Link } from 'react-router-dom'; // <--- Импорт Link
import { 
  FiCheckCircle, 
  FiXCircle, 
  FiCalendar, 
  FiMapPin, 
  FiUser, 
  FiAlertCircle,
  FiExternalLink // <--- Импорт иконки
} from 'react-icons/fi';

export const EventsModerationSection = ({ events, loading, error, onApprove, onReject }) => {
  
  if (loading) return <div className="text-center py-10">Загрузка...</div>;
  
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 p-4 rounded-lg flex items-center gap-3 text-red-700">
        <FiAlertCircle className="text-xl" />
        <span>{error}</span>
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl shadow-sm">
        <FiCheckCircle className="mx-auto text-5xl text-green-500 mb-4" />
        <p className="text-gray-500 text-lg">Нет событий на модерации</p>
      </div>
    );
  }

  const handleRejectClick = (eventId) => {
    const reason = prompt('Укажите причину отклонения события:');
    if (reason === null) return;
    if (!reason.trim()) {
        alert('Причина обязательна!');
        return;
    }
    onReject(eventId, reason);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Модерация событий</h2>
      
      <div className="grid gap-6">
        {events.map(event => (
          <div key={event.id} className="bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
            <div className="flex flex-col md:flex-row justify-between gap-4">
              
              {/* Информация о событии */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                    {event.category || event.category_event_name || 'Событие'}
                  </span>
                  {event.date && (
                    <span className="text-sm text-gray-500 flex items-center gap-1">
                      <FiCalendar />
                      {new Date(event.date || event.date_event).toLocaleDateString()}
                    </span>
                  )}
                </div>

                {/* ЗАГОЛОВОК И ССЫЛКА */}
                <div className="flex items-start justify-between gap-4 mb-2">
                  <h3 className="text-xl font-bold text-gray-800">{event.title}</h3>
                  
                  {/* Кнопка просмотра */}
                  <Link 
                    to={`/events/${event.id}`} 
                    target="_blank"
                    className="flex-shrink-0 flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100"
                    title="Открыть страницу события в новой вкладке"
                  >
                    <FiExternalLink /> Просмотр
                  </Link>
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{event.description}</p>

                <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <FiMapPin className="text-blue-500" />
                    {event.city || event.city_name || 'Онлайн'}
                  </div>
                  <div className="flex items-center gap-1">
                    <FiUser className="text-blue-500" />
                    {event.organizer || 'Организатор не указан'}
                  </div>
                </div>
              </div>

              {/* Кнопки действий */}
              <div className="flex md:flex-col gap-3 justify-center min-w-[140px] border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-4">
                <button
                  onClick={() => onApprove(event.id)}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium shadow-sm"
                >
                  <FiCheckCircle /> Одобрить
                </button>
                <button
                  onClick={() => handleRejectClick(event.id)}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors font-medium"
                >
                  <FiXCircle /> Отклонить
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};