// src/pages/CalendarPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCity } from '../contexts/CityContext';
import { usePublic } from '../contexts/PublicContext';
import { 
  FiChevronLeft, 
  FiChevronRight, 
  FiFilter, 
  FiChevronDown, 
  FiCheck 
} from 'react-icons/fi';

// Маппинг категорий на иконки
const categoryIcons = {
  'Волонтерство': '🤝',
  'Экология': '♻️',
  'Благотворительность': '💝',
  'Спорт': '🏃',
  'Образование': '🎓',
  'Культура': '🎨',
  'Здоровье': '🏥',
  'Дети': '👶',
};

// Маппинг категорий на цвета
const categoryColors = {
  'Волонтерство': 'text-purple-600',
  'Экология': 'text-green-600',
  'Благотворительность': 'text-red-500',
  'Спорт': 'text-orange-600',
  'Образование': 'text-blue-600',
  'Культура': 'text-pink-600',
  'Здоровье': 'text-teal-600',
  'Дети': 'text-yellow-600',
};

// Компонент Tooltip
const EventTooltip = ({ event, position }) => {
  const tooltipRef = React.useRef(null);
  const [adjustedPosition, setAdjustedPosition] = React.useState(position);

  React.useEffect(() => {
    if (tooltipRef.current) {
      const tooltip = tooltipRef.current;
      const rect = tooltip.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      let newLeft = position.x;
      let newTop = position.y;
      
      // Проверка по горизонтали
      if (rect.right > viewportWidth - 20) {
        // Тултип уезжает вправо - показываем слева от иконки
        newLeft = position.x - rect.width - 20;
      }
      
      // Проверка если тултип теперь уезжает влево
      if (newLeft < 20) {
        newLeft = 20;
      }
      
      // Проверка по вертикали
      if (rect.bottom > viewportHeight - 20) {
        newTop = viewportHeight - rect.height - 20;
      }
      
      if (newTop < 20) {
        newTop = 20;
      }
      
      setAdjustedPosition({ x: newLeft, y: newTop });
    }
  }, [position]);

  return (
    <div 
      ref={tooltipRef}
      className="fixed z-[9999] bg-white rounded-lg shadow-2xl border border-gray-200 p-4 min-w-[280px] max-w-[320px] animate-tooltip"
      style={{
        top: adjustedPosition.y,
        left: adjustedPosition.x,
        transform: 'translateY(-50%)'
      }}
    >
      <div className="flex items-start gap-3 mb-2">
        <span className="text-3xl">{categoryIcons[event.category] || '📅'}</span>
        <div className="flex-1">
          <h4 className="font-bold text-gray-800 mb-1">{event.title}</h4>
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
            {event.category}
          </span>
        </div>
      </div>
      <div className="space-y-2 text-sm text-gray-600 mt-3">
        <div className="flex items-center gap-2">
          <span className="font-medium">🕐</span>
          <span>{event.time}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-medium">📍</span>
          <span className="line-clamp-1">{event.location}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-medium">👥</span>
          <span className="line-clamp-1">{event.organizer}</span>
        </div>
      </div>
      <p className="text-xs text-gray-500 mt-2 line-clamp-2">
        {event.description}
      </p>
    </div>
  );
};

const CalendarPage = () => {
  const { selectedCity, cities } = useCity();
  const navigate = useNavigate();
  const { eventsList, nkoList, loading, error, fetchAllEvents, fetchAllNkos } = usePublic();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [hoveredEvent, setHoveredEvent] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  // --- Состояния фильтров ---
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [filterCities, setFilterCities] = useState([]); 
  const [filterNkos, setFilterNkos] = useState([]);
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  // UI состояние для дропдаунов
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  const [isNkoDropdownOpen, setIsNkoDropdownOpen] = useState(false);
  
  const cityDropdownRef = useRef(null);
  const nkoDropdownRef = useRef(null);

  const monthNames = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];

  const weekDays = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];

  // Загрузка НКО при старте
  useEffect(() => {
    if ((!nkoList || nkoList.length === 0) && fetchAllNkos) {
      fetchAllNkos();
    }
  }, [nkoList, fetchAllNkos]);

  // Закрытие дропдаунов при клике вне
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(event.target)) {
        setIsCityDropdownOpen(false);
      }
      if (nkoDropdownRef.current && !nkoDropdownRef.current.contains(event.target)) {
        setIsNkoDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Логика переключения Городов
  const toggleCity = (cityName) => {
    setFilterCities(prev => {
      if (prev.includes(cityName)) return prev.filter(c => c !== cityName);
      else return [...prev, cityName];
    });
  };

  // Логика переключения НКО
  const toggleNko = (nkoId) => {
    setFilterNkos(prev => {
      if (prev.includes(nkoId)) return prev.filter(id => id !== nkoId);
      else return [...prev, nkoId];
    });
  };

  // --- Основная логика фильтрации ---
  useEffect(() => {
    if (!eventsList) return;

    let result = [...eventsList];

    // 1. Фильтр по городам
    if (filterCities.length > 0) {
      result = result.filter(e => 
        filterCities.includes(e.city) || e.city === 'Все города'
      );
    }

    // 2. Фильтр по НКО
    if (filterNkos.length > 0) {
      result = result.filter(e => {
        const orgId = e.organization_id || e.organizationId || (e.nko && e.nko.id) || (e.organization && e.organization.id);
        return filterNkos.includes(Number(orgId));
      });
    }

    // 3. Фильтр по дате ОТ
    if (filterDateFrom) {
      const fromDate = new Date(filterDateFrom);
      fromDate.setHours(0, 0, 0, 0);
      
      result = result.filter(e => {
        const eventDate = new Date(e.date);
        eventDate.setHours(0, 0, 0, 0);
        return eventDate >= fromDate;
      });
    }

    // 4. Фильтр по дате ДО
    if (filterDateTo) {
      const toDate = new Date(filterDateTo);
      toDate.setHours(23, 59, 59, 999);

      result = result.filter(e => {
        const eventDate = new Date(e.date);
        return eventDate <= toDate;
      });
    }

    setFilteredEvents(result);
  }, [eventsList, filterCities, filterNkos, filterDateFrom, filterDateTo]);

  // При выборе "Дата от" переключаем календарь
  useEffect(() => {
    if (filterDateFrom) {
      const newDate = new Date(filterDateFrom);
      if (!isNaN(newDate.getTime())) {
        setCurrentDate(newDate);
      }
    }
  }, [filterDateFrom]);

  // Сброс фильтров
  const resetFilters = () => {
    setFilterCities([]);
    setFilterNkos([]);
    setFilterDateFrom('');
    setFilterDateTo('');
    setCurrentDate(new Date());
  };

  // Вспомогательные функции календаря
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) days.push(null);
    for (let day = 1; day <= daysInMonth; day++) days.push(new Date(year, month, day));
    return days;
  };

  const getEventsForDate = (date) => {
    if (!date || !filteredEvents) return [];
    return filteredEvents.filter(event => {
      const eventDate = new Date(event.date);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const isToday = (date) => {
    if (!date) return false;
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  const goToToday = () => setCurrentDate(new Date());

  const handleDayClick = (date) => {
    if (!date) return;
    const dayEvents = getEventsForDate(date);
    if (dayEvents.length >= 1) {
      navigate(`/events/${dayEvents[0].id}`);
    }
  };

  const handleEventHover = (event, e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPosition({ x: rect.right + 10, y: rect.top + rect.height / 2 });
    setHoveredEvent(event);
  };

  const days = getDaysInMonth(currentDate);

  const getNkoNameById = (id) => {
    const nko = nkoList?.find(n => n.id === id);
    return nko ? (nko.organization_name || nko.name) : 'НКО';
  };

  if (loading && (!eventsList || eventsList.length === 0)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Загрузка событий...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-xl shadow-md">
          <p className="text-red-600 text-lg mb-4">Ошибка загрузки: {error}</p>
          <button onClick={() => fetchAllEvents()} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Инлайн стили для анимаций */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInFromLeft {
          from { opacity: 0; transform: translateX(-30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes tooltip {
          from { opacity: 0; transform: translateY(-50%) scale(0.95); }
          to { opacity: 1; transform: translateY(-50%) scale(1); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
        }
        .animate-slide-left {
          animation: slideInFromLeft 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
        }
        .animate-scale-in {
          animation: scaleIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
        }
        .animate-tooltip {
          animation: tooltip 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-300 { animation-delay: 0.3s; }
        .delay-400 { animation-delay: 0.4s; }
        .calendar-day {
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .calendar-day:hover {
          transform: translateY(-2px);
        }
        .event-icon {
          transition: all 0.3s ease;
        }
        .event-icon:hover {
          transform: scale(1.3) rotate(10deg);
        }
      `}</style>

      <div className="container mx-auto px-4 py-8 relative">
        <div className="mb-8 animate-fade-in-up">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Календарь событий</h1>
          <p className="text-gray-600">Мероприятия и события в {selectedCity || 'вашем городе'}</p>
        </div>

        {/* --- БЛОК ФИЛЬТРОВ --- */}
        <div className="bg-white p-6 rounded-xl shadow-md mb-8 relative z-20 animate-slide-left delay-100">
          <div className="flex items-center gap-2 mb-4">
            <FiFilter className="text-xl text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-800">Фильтры</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            {/* Города */}
            <div className="relative" ref={cityDropdownRef}>
              <label className="block text-sm font-medium text-gray-700 mb-2">Города</label>
              <button onClick={() => setIsCityDropdownOpen(!isCityDropdownOpen)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-left flex items-center justify-between transition-all hover:border-blue-400 hover:shadow-md">
                <span className="truncate">{filterCities.length === 0 ? 'Все города' : `Выбрано: ${filterCities.length}`}</span>
                <FiChevronDown className={`transition-transform ${isCityDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {isCityDropdownOpen && (
                <div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto z-30 animate-scale-in">
                  <div className="p-2">
                    <div className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer transition-colors" onClick={() => setFilterCities([])}>
                      <div className={`w-4 h-4 border rounded mr-2 flex items-center justify-center transition-all ${filterCities.length === 0 ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                        {filterCities.length === 0 && <FiCheck className="text-white text-xs" />}
                      </div>
                      <span className={filterCities.length === 0 ? 'font-medium text-blue-600' : 'text-gray-700'}>Все города</span>
                    </div>
                    <div className="my-1 border-t border-gray-100"></div>
                    {cities.map(city => (
                      <div key={city.id} className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer transition-colors" onClick={() => toggleCity(city.name)}>
                        <div className={`w-4 h-4 border rounded mr-2 flex items-center justify-center transition-all ${filterCities.includes(city.name) ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                          {filterCities.includes(city.name) && <FiCheck className="text-white text-xs" />}
                        </div>
                        <span className="text-gray-700">{city.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* НКО */}
            <div className="relative" ref={nkoDropdownRef}>
              <label className="block text-sm font-medium text-gray-700 mb-2">Организации</label>
              <button onClick={() => setIsNkoDropdownOpen(!isNkoDropdownOpen)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-left flex items-center justify-between transition-all hover:border-blue-400 hover:shadow-md">
                <span className="truncate">{filterNkos.length === 0 ? 'Все НКО' : `Выбрано: ${filterNkos.length}`}</span>
                <FiChevronDown className={`transition-transform ${isNkoDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {isNkoDropdownOpen && (
                <div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto z-30 animate-scale-in">
                  <div className="p-2">
                    <div className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer transition-colors" onClick={() => setFilterNkos([])}>
                      <div className={`w-4 h-4 border rounded mr-2 flex items-center justify-center transition-all ${filterNkos.length === 0 ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                        {filterNkos.length === 0 && <FiCheck className="text-white text-xs" />}
                      </div>
                      <span className={filterNkos.length === 0 ? 'font-medium text-blue-600' : 'text-gray-700'}>Все организации</span>
                    </div>
                    <div className="my-1 border-t border-gray-100"></div>
                    
                    {nkoList && nkoList.length > 0 ? (
                      nkoList.map(nko => (
                        <div key={nko.id} className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer transition-colors" onClick={() => toggleNko(nko.id)}>
                          <div className={`w-4 h-4 border rounded mr-2 flex items-center justify-center transition-all ${filterNkos.includes(nko.id) ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                            {filterNkos.includes(nko.id) && <FiCheck className="text-white text-xs" />}
                          </div>
                          <span className="text-gray-700 truncate">{nko.organization_name || nko.name}</span>
                        </div>
                      ))
                    ) : (
                      <div className="p-2 text-gray-500 text-sm">Нет организаций</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Дата от */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Дата от</label>
              <input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:border-blue-400 hover:shadow-md" />
            </div>

            {/* Дата до */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Дата до</label>
              <input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:border-blue-400 hover:shadow-md" />
            </div>
          </div>

          {/* Теги выбранных фильтров */}
          {(filterCities.length > 0 || filterNkos.length > 0) && (
            <div className="mt-4 flex flex-wrap gap-2">
              {filterCities.map(city => (
                <span key={city} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 animate-scale-in hover:bg-blue-200 transition-colors">
                  {city} <button onClick={() => toggleCity(city)} className="ml-2 text-blue-600 hover:text-blue-800 transition-colors">×</button>
                </span>
              ))}
              {filterNkos.map(id => (
                <span key={id} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 animate-scale-in hover:bg-purple-200 transition-colors">
                  {getNkoNameById(id)} <button onClick={() => toggleNko(id)} className="ml-2 text-purple-600 hover:text-purple-800 transition-colors">×</button>
                </span>
              ))}
            </div>
          )}

          {/* Сброс */}
          {(filterCities.length > 0 || filterNkos.length > 0 || filterDateFrom || filterDateTo) && (
            <button onClick={resetFilters} className="mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium transition-all hover:scale-105">Сбросить фильтры</button>
          )}
        </div>

        {/* Календарь */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden relative z-0 animate-fade-in-up delay-200">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6">
            <div className="flex items-center justify-between">
              <button onClick={prevMonth} className="p-2 hover:bg-white/20 rounded-full transition-all hover:scale-110"><FiChevronLeft className="w-6 h-6 text-white" /></button>
              <div className="text-center">
                <h2 className="text-2xl font-semibold text-white">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h2>
              </div>
              <button onClick={nextMonth} className="p-2 hover:bg-white/20 rounded-full transition-all hover:scale-110"><FiChevronRight className="w-6 h-6 text-white" /></button>
            </div>
            <div className="mt-4 text-center">
              <button onClick={goToToday} className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-full text-sm font-medium transition-all hover:scale-105">Сегодня</button>
            </div>
          </div>

          <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
            {weekDays.map((day) => <div key={day} className="p-4 text-center text-sm font-semibold text-gray-600">{day}</div>)}
          </div>

          <div className="grid grid-cols-7">
            {days.map((date, index) => {
              const isTodayDate = isToday(date);
              const dayEvents = getEventsForDate(date);
              return (
                <div key={index} onClick={() => handleDayClick(date)} className={`calendar-day min-h-[120px] p-3 border-b border-r border-gray-100 ${date ? 'cursor-pointer hover:bg-blue-50' : 'bg-gray-50'} ${isTodayDate ? 'bg-blue-50 border-2 border-blue-400' : ''}`}>
                  {date && (
                    <div className="h-full flex flex-col">
                      <div className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium mb-2 transition-all ${isTodayDate ? 'bg-blue-600 text-white' : 'text-gray-700'}`}>{date.getDate()}</div>
                      {dayEvents.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-1">
                          {dayEvents.map((event, idx) => (
                            <div key={idx} className="relative" onMouseEnter={(e) => handleEventHover(event, e)} onMouseLeave={() => setHoveredEvent(null)}>
                              <span className={`event-icon text-2xl cursor-pointer ${categoryColors[event.category] || 'text-gray-600'}`} title={event.title}>
                                {categoryIcons[event.category] || '📅'}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

          {hoveredEvent && <EventTooltip event={hoveredEvent} position={tooltipPosition} />}

        <div className="mt-8 bg-white p-6 rounded-lg shadow-md animate-fade-in-up delay-300">
          <h3 className="text-lg font-semibold mb-4">Категории событий</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(categoryIcons).map(([category, icon]) => (
              <div key={category} className="flex items-center gap-2 hover:scale-105 transition-transform cursor-default">
                <span className="text-2xl">{icon}</span>
                <span className="text-sm text-gray-700">{category}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default CalendarPage;