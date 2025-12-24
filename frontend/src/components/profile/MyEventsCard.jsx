// src/components/profile/MyEventsCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { FiCalendar, FiClock, FiMapPin, FiX, FiUsers } from 'react-icons/fi';

export const MyEventsCard = ({ events, onCancelEvent }) => {
  const handleCancel = (eventId, eventTitle) => {
    if (window.confirm(`Вы уверены, что хотите отменить участие в событии "${eventTitle}"?`)) {
      onCancelEvent(eventId);
    }
  };

  // Сортируем события по дате (ближайшие первыми)
  const sortedEvents = [...events].sort((a, b) => 
    new Date(a.date) - new Date(b.date)
  );

  // Разделяем на предстоящие и прошедшие
  const now = new Date();
  const upcomingEvents = sortedEvents.filter(e => new Date(e.date) >= now);
  const pastEvents = sortedEvents.filter(e => new Date(e.date) < now);

  return (
    <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
      <div className="flex items-center gap-2 mb-6">
        <FiCalendar className="text-2xl text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-800">Мои события</h2>
        <span className="ml-auto text-sm font-semibold px-3 py-1 bg-blue-100 text-blue-700 rounded-full">
          {events.length}
        </span>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiCalendar className="text-4xl text-gray-400" />
          </div>
          <p className="text-gray-500 mb-2 font-medium">Вы пока не записались ни на одно событие</p>
          <p className="text-gray-400 text-sm mb-6">Найдите интересные события в календаре</p>
          <Link
            to="/calendar"
            className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition-all font-medium shadow-md hover:shadow-lg"
          >
            Найти события
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Предстоящие события */}
          {upcomingEvents.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Предстоящие ({upcomingEvents.length})
              </h3>
              <div className="space-y-3">
                {upcomingEvents.map(event => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onCancel={handleCancel}
                    isUpcoming={true}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Прошедшие события */}
          {pastEvents.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Прошедшие ({pastEvents.length})
              </h3>
              <div className="space-y-3">
                {pastEvents.map(event => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onCancel={handleCancel}
                    isUpcoming={false}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Компонент карточки события
const EventCard = ({ event, onCancel, isUpcoming }) => {
  return (
    <div className={`border rounded-lg p-4 hover:shadow-md transition-all ${
      isUpcoming ? 'border-blue-200 bg-blue-50/30' : 'border-gray-200 bg-gray-50/50 opacity-75'
    }`}>
      <div className="flex items-start gap-4">
        {/* Дата в виде календарика */}
        <div className={`w-16 h-16 rounded-lg flex flex-col items-center justify-center flex-shrink-0 ${
          isUpcoming ? 'bg-blue-600 text-white' : 'bg-gray-400 text-white'
        }`}>
          <span className="text-xs font-medium">
            {new Date(event.date).toLocaleDateString('ru-RU', { month: 'short' })}
          </span>
          <span className="text-2xl font-bold">
            {new Date(event.date).getDate()}
          </span>
        </div>

        {/* Информация о событии */}
        <div className="flex-1 min-w-0">
          <Link
            to={`/events/${event.id}`}
            className="text-lg font-semibold text-gray-800 hover:text-blue-600 transition-colors block mb-2"
          >
            {event.title}
          </Link>
          
          <div className="space-y-1 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <FiClock className="text-blue-500 flex-shrink-0" />
              <span>{event.time}</span>
            </div>
            <div className="flex items-center gap-2">
              <FiMapPin className="text-blue-500 flex-shrink-0" />
              <span className="truncate">{event.location}</span>
            </div>
            {event.participants && (
              <div className="flex items-center gap-2">
                <FiUsers className="text-blue-500 flex-shrink-0" />
                <span>{event.participants} участников</span>
              </div>
            )}
          </div>
        </div>

        {/* Кнопка отмены (только для предстоящих) */}
        {isUpcoming && (
          <button
            onClick={() => onCancel(event.id, event.title)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
            title="Отменить участие"
          >
            <FiX className="text-xl" />
          </button>
        )}
      </div>
    </div>
  );
};