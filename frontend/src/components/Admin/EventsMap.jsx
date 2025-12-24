// src/components/Admin/EventsMap.jsx
import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { usePublic } from '../../contexts/PublicContext';
import { FiMapPin, FiCalendar } from 'react-icons/fi';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Исправление иконок Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Координаты городов (из NkoMap)
const cityCoordinates = {
  "Ангарск": [52.5367, 103.8986],
  "Балаково": [52.0278, 47.8007],
  "Билибино": [68.0546, 166.4376],
  "Волгодонск": [47.5133, 42.1530],
  "Глазов": [58.1394, 52.6586],
  "Десногорск": [54.1495, 33.2924],
  "Димитровград": [54.2138, 49.6183],
  "Екатеринбург": [56.8389, 60.6057],
  "Заречный": [56.8046, 61.3161],
  "Заречный ЗАТО": [53.2028, 45.1928],
  "Железногорск": [56.2531, 93.5325],
  "Зеленогорск": [56.1128, 94.5886],
  "Краснокаменск": [50.0976, 118.0362],
  "Курчатов": [51.6607, 35.6526],
  "Лесной": [58.6392, 59.7992],
  "Москва": [55.7558, 37.6173],
  "Нижний Новгород": [56.3269, 44.0075],
  "Нововоронеж": [51.3138, 39.2113],
  "Новоуральск": [57.2454, 60.0891],
  "Обнинск": [55.0969, 36.6103],
  "Озерск": [55.7558, 60.7028],
  "Омск": [54.9885, 73.3242],
  "Полярные Зори": [67.3667, 32.4982],
  "Певек": [69.7008, 170.3131],
  "Ростов-на-Дону": [47.2357, 39.7015],
  "Санкт-Петербург": [59.9343, 30.3351],
  "Саров": [54.9317, 43.3300],
  "Северск": [56.6003, 84.8544],
  "Снежинск": [56.0850, 60.7306],
  "Сосновый Бор": [59.9016, 29.0891],
  "Трехгорный": [54.8130, 58.4525],
  "Удомля": [57.8786, 34.9932],
  "Усолье-Сибирское": [52.7517, 103.6453],
  "Электросталь": [55.7933, 38.4398]
};

// Функция нормализации названия города
const normalizeCity = (cityName) => {
  if (!cityName) return '';
  return cityName
    .toLowerCase()
    .replace(/^(г\.|город)\s+/, '')
    .trim();
};

// Кастомная иконка для событий
const customIcon = (count) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background: linear-gradient(135deg, #9333ea 0%, #7e22ce 100%);
        color: white;
        width: 40px;
        height: 40px;
        border-radius: 50% 50% 50% 0;
        border: 3px solid white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 14px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.3);
        transform: rotate(-45deg);
      ">
        <span style="transform: rotate(45deg);">${count}</span>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
  });
};

const EventsMap = ({ startDate, endDate }) => {
  const { eventsList } = usePublic();

  // Фильтрация и группировка событий по городам
  const groupedEvents = useMemo(() => {
    if (!eventsList || eventsList.length === 0) return {};

    const groups = {};
    
    // Нормализуем ключи координат для поиска
    const normalizedCoords = {};
    Object.keys(cityCoordinates).forEach(key => {
      normalizedCoords[normalizeCity(key)] = {
        originalName: key,
        coords: cityCoordinates[key]
      };
    });

    // Фильтруем события по временному интервалу
    const filteredEvents = eventsList.filter(event => {
      if (!event.date) return false;
      
      const eventDate = new Date(event.date);
      
      // Если указан начальный период, проверяем
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (eventDate < start) return false;
      }
      
      // Если указан конечный период, проверяем
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (eventDate > end) return false;
      }
      
      return true;
    });

    // Группируем события по городам
    filteredEvents.forEach(event => {
      const rawCityName = event.city || event.city_name;
      if (!rawCityName) return;

      const cleanName = normalizeCity(rawCityName);
      
      // Ищем совпадение в координатах
      const foundCity = normalizedCoords[cleanName];

      if (foundCity) {
        const key = foundCity.originalName;
        
        if (!groups[key]) {
          groups[key] = [];
        }
        groups[key].push(event);
      } else {
        console.warn(`Координаты для города "${rawCityName}" не найдены на карте.`);
      }
    });

    return groups;
  }, [eventsList, startDate, endDate]);

  // Центр России
  const defaultCenter = [55.7558, 37.6173];
  const defaultZoom = 4;

  const totalEvents = Object.values(groupedEvents).reduce((acc, arr) => acc + arr.length, 0);
  const citiesCount = Object.keys(groupedEvents).length;

  // Форматирование даты для отображения
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-4">
        <div className="flex items-center gap-2 text-white">
          <FiMapPin className="text-2xl flex-shrink-0" />
          <div className="min-w-0">
            <h3 className="text-xl font-bold">События на карте</h3>
            <p className="text-sm text-purple-100 truncate">
              {startDate && endDate 
                ? `Период: ${formatDate(startDate)} - ${formatDate(endDate)}`
                : startDate 
                  ? `С ${formatDate(startDate)}`
                  : endDate
                    ? `До ${formatDate(endDate)}`
                    : 'Все события'}
            </p>
          </div>
        </div>
      </div>

      <div className="relative" style={{ height: '500px', width: '100%' }}>
        <MapContainer
          center={defaultCenter}
          zoom={defaultZoom}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={false}
          attributionControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {Object.entries(groupedEvents).map(([city, events]) => {
            const coords = cityCoordinates[city];
            
            if (!coords) return null;

            return (
              <Marker 
                key={city} 
                position={coords}
                icon={customIcon(events.length)}
              >
                <Popup maxWidth={320} className="events-popup">
                  <div className="p-1">
                    <h4 className="font-bold text-lg text-purple-600 mb-2 border-b pb-2">
                      {city}
                    </h4>
                    <p className="text-xs text-gray-500 mb-2">
                      Событий: <span className="font-semibold text-gray-700">{events.length}</span>
                    </p>
                    
                    <div className="max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                      <ul className="space-y-1">
                        {events.map((event) => (
                          <li 
                            key={event.id} 
                            className="group"
                          >
                            <div className="w-full text-left p-2 rounded-lg hover:bg-purple-50 transition-colors duration-200 border border-transparent hover:border-purple-100">
                              <div className="flex items-start gap-2">
                                <FiCalendar className="text-purple-400 flex-shrink-0 mt-0.5" />
                                <div className="flex-1 min-w-0">
                                  <span className="text-sm text-gray-700 font-medium group-hover:text-purple-700 leading-tight block">
                                    {event.title || event.name}
                                  </span>
                                  {event.date && (
                                    <span className="text-xs text-gray-500 mt-1 block">
                                      {formatDate(event.date)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-purple-600 rounded-full border-2 border-white shadow flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              E
            </div>
            <span className="text-gray-600">Количество событий в городе</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-500 font-medium">Городов со событиями: {citiesCount}</span>
            <span className="text-gray-500 font-medium">Всего событий: {totalEvents}</span>
          </div>
        </div>
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
};

export default EventsMap;





