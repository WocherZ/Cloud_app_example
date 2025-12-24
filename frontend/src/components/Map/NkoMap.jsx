// src/components/Map/NkoMap.jsx
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { usePublic } from '../../contexts/PublicContext';
import { FiMapPin, FiArrowRight } from 'react-icons/fi';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Исправление иконок Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// РАСШИРЕННЫЙ СПИСОК КООРДИНАТ
// Ключи должны быть названием города. Логика ниже приведет всё к нижнему регистру для сравнения.
const cityCoordinates = {
  "Ангарск": [52.5367, 103.8986],
  "Балаково": [52.0278, 47.8007],
  "Билибино": [68.0546, 166.4376],
  "Волгодонск": [47.5133, 42.1530],
  "Глазов": [58.1394, 52.6586],
  "Десногорск": [54.1495, 33.2924],
  "Димитровград": [54.2138, 49.6183],
  "Екатеринбург": [56.8389, 60.6057],
  "Заречный": [56.8046, 61.3161], // Свердловская обл
  "Заречный ЗАТО": [53.2028, 45.1928], // Пензенская обл (обычно просто Заречный)
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

// Функция нормализации названия города для сравнения
// Убирает "г.", "город", лишние пробелы и приводит к нижнему регистру
const normalizeCity = (cityName) => {
  if (!cityName) return '';
  return cityName
    .toLowerCase()
    .replace(/^(г\.|город)\s+/, '') // убирает "г. " в начале
    .trim();
};

// Кастомная иконка кластера
const customIcon = (count) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
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

const NkoMap = ({ selectedCity }) => {
  const navigate = useNavigate();
  const { nkoList } = usePublic(); 

  // Группировка НКО по городам
  const groupedNko = useMemo(() => {
    if (!nkoList) return {};

    const groups = {};
    
    // Нормализуем ключи координат для поиска
    const normalizedCoords = {};
    Object.keys(cityCoordinates).forEach(key => {
      normalizedCoords[normalizeCity(key)] = {
        originalName: key,
        coords: cityCoordinates[key]
      };
    });

    // Проходим по всем НКО и ищем их город в координатах
    nkoList.forEach(nko => {
      // Берем имя города из API (city_name) или резервное поле
      const rawCityName = nko.city_name || nko.city;
      if (!rawCityName) return;

      const cleanName = normalizeCity(rawCityName);
      
      // Ищем совпадение в координатах
      const foundCity = normalizedCoords[cleanName];

      if (foundCity) {
        // Используем оригинальное красивое имя из cityCoordinates как ключ группы
        const key = foundCity.originalName;
        
        if (!groups[key]) {
          groups[key] = [];
        }
        groups[key].push(nko);
      } else {
        console.warn(`Координаты для города "${rawCityName}" не найдены на карте.`);
      }
    });

    return groups;
  }, [nkoList]);

  // Центр России
  const defaultCenter = [55.7558, 37.6173];
  const defaultZoom = 4;

  const totalMapNkos = Object.values(groupedNko).reduce((acc, arr) => acc + arr.length, 0);

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4">
        <div className="flex items-center gap-2 text-white">
          <FiMapPin className="text-2xl flex-shrink-0" />
          <div className="min-w-0">
            <h3 className="text-xl font-bold">НКО на карте</h3>
            <p className="text-sm text-blue-100 truncate">
              {selectedCity ? `Показаны НКО в городе ${selectedCity}` : 'География добрых дел'}
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
          
          {Object.entries(groupedNko).map(([city, nkos]) => {
            const coords = cityCoordinates[city];
            
            // Фильтр по выбранному городу в селекте
            if (selectedCity && normalizeCity(city) !== normalizeCity(selectedCity)) return null;
            
            if (!coords) return null;

            return (
              <Marker 
                key={city} 
                position={coords}
                icon={customIcon(nkos.length)}
              >
                <Popup maxWidth={320} className="nko-popup">
                  <div className="p-1">
                    <h4 className="font-bold text-lg text-blue-600 mb-2 border-b pb-2">
                      {city}
                    </h4>
                    <p className="text-xs text-gray-500 mb-2">
                      Найдено организаций: <span className="font-semibold text-gray-700">{nkos.length}</span>
                    </p>
                    
                    <div className="max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                      <ul className="space-y-1">
                        {nkos.map((nko) => (
                          <li 
                            key={nko.id} 
                            className="group"
                          >
                            <button
                              onClick={() => navigate(`/nko/${nko.id}`)}
                              className="w-full text-left p-2 rounded-lg hover:bg-blue-50 transition-colors duration-200 flex items-start justify-between gap-2 group-hover:shadow-sm border border-transparent hover:border-blue-100"
                            >
                              <span className="text-sm text-gray-700 font-medium group-hover:text-blue-700 leading-tight">
                                {nko.organization_name || nko.name}
                              </span>
                              <FiArrowRight className="text-gray-300 group-hover:text-blue-500 flex-shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
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
            <div className="w-6 h-6 bg-blue-600 rounded-full border-2 border-white shadow flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              N
            </div>
            <span className="text-gray-600">Количество НКО в городе</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-500 font-medium">Городов с НКО: {Object.keys(groupedNko).length}</span>
            <span className="text-gray-500 font-medium">Всего НКО: {totalMapNkos}</span>
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

export default NkoMap;