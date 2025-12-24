// src/pages/HomePage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useCity } from '../contexts/CityContext';
import { usePublic } from '../contexts/PublicContext';
import { FiMapPin, FiBook, FiCalendar, FiFileText, FiArrowRight } from 'react-icons/fi';
import EventCard from '../components/Events/EventCard';
import NewsCard from '../components/News/NewsCard';
import NkoMap from '../components/Map/NkoMap';

const HomePage = () => {
  const { selectedCity, setSelectedCity, cities } = useCity();
  const { eventsList, newsList, nkoList } = usePublic();
  
  const [displayEvents, setDisplayEvents] = useState([]);
  const [displayNews, setDisplayNews] = useState([]);

  // Фильтрация событий
  useEffect(() => {
    if (!eventsList) return;
    
    let filtered = [...eventsList];
    if (selectedCity) {
      filtered = filtered.filter(e => 
        e.city === selectedCity || e.city === 'Все города'
      );
    }
    // Показываем только 3 ближайших события
    setDisplayEvents(filtered.slice(0, 3));
  }, [eventsList, selectedCity]);

  // Фильтрация новостей
  useEffect(() => {
    if (!newsList) return;
    
    let filtered = [...newsList];
    if (selectedCity) {
      filtered = filtered.filter(n => 
        n.city === selectedCity || n.city === 'Все города'
      );
    }
    // Показываем только 3 последние новости
    setDisplayNews(filtered.slice(0, 3));
  }, [newsList, selectedCity]);

  // Подсчет статистики
  const nkoCount = useMemo(() => {
    if (!nkoList) return 0;
    if (selectedCity) {
      return nkoList.filter(nko => {
        const nkoCity = nko.city_name || nko.city;
        return nkoCity === selectedCity || nkoCity === 'Все города';
      }).length;
    }
    return nkoList.length;
  }, [nkoList, selectedCity]);

  const citiesCount = cities ? cities.length : 0;

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Инлайн стили для кастомных анимаций */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
        }
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-300 { animation-delay: 0.3s; }
      `}</style>

      {/* Hero секция (z-0, чтобы не перекрывать UI элементы) */}
      <section className="bg-gradient-to-r from-blue-700 via-blue-600 to-blue-500 text-white relative overflow-hidden z-0">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl pointer-events-none"></div>

        <div className="container mx-auto px-4 py-16 relative z-10">
          <div className="max-w-4xl">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight animate-fade-in-up">
              Добрые дела Росатома
            </h1>
            <p className="text-2xl md:text-3xl font-light mb-4 text-blue-100 animate-fade-in-up delay-100">
              все инициативы вашего города в одном месте
            </p>
            <p className="text-lg md:text-xl text-blue-50 leading-relaxed max-w-3xl animate-fade-in-up delay-200">
              Единый портал для жителей, волонтёров и НКО, где собрана вся информация о социальных,
              экологических, культурных, образовательных и спортивных инициативах.
            </p>
          </div>
        </div>

        {/* Преимущества */}
        <div className="bg-white/10 backdrop-blur-sm border-t border-white/10">
          <div className="container mx-auto px-4 py-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                'Узнать, какие НКО и проекты работают в вашем городе',
                'Посмотреть актуальные мероприятия и события',
                'Найти полезные ресурсы и обучающие материалы',
                'Получить контакты координаторов для участия'
              ].map((text, index) => (
                <div 
                  key={index} 
                  className="flex items-start gap-3 animate-fade-in-up"
                  style={{ animationDelay: `${(index + 3) * 100}ms` }}
                >
                  <div className="flex-shrink-0 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold">{index + 1}</span>
                  </div>
                  <p className="text-white/90 text-sm leading-snug">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Основной контент с сайдбаром */}
      <section className="container mx-auto px-4 py-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Левая колонка: Основные разделы */}
          <div className="lg:col-span-2">
            <h2 className="text-3xl font-bold text-gray-800 mb-8 animate-fade-in-up">
              Станьте частью добрых дел!
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { to: "/nko", icon: FiMapPin, title: "Карта НКО", desc: "Найдите организации по городу и направлению" },
                { to: "/knowledge-base", icon: FiBook, title: "База знаний", desc: "Видео и материалы для скачивания" },
                { to: "/calendar", icon: FiCalendar, title: "Календарь", desc: "Интересные события, чтобы ничего не пропустить" },
                { to: "/news", icon: FiFileText, title: "Новости", desc: "Будьте в курсе последних инициатив" }
              ].map((item, idx) => (
                <Link 
                  key={idx} 
                  to={item.to} 
                  className="group animate-fade-in-up h-full"
                  style={{ animationDelay: `${(idx + 1) * 100}ms` }}
                >
                  <div className="bg-white rounded-xl shadow-md hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 p-6 h-full border-l-4 border-blue-600 relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 rounded-full bg-blue-50 transition-transform group-hover:scale-150 duration-500 z-0"></div>
                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-4">
                        <item.icon className="text-blue-600 text-4xl group-hover:scale-110 transition-transform duration-300" />
                        <FiArrowRight className="text-gray-300 text-2xl group-hover:text-blue-600 group-hover:translate-x-2 transition-all duration-300" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-blue-700 transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-gray-600 text-sm group-hover:text-gray-700">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Сайдбар: Выбор города (Sticky) */}
          {/* z-30: Выше контента, но ниже модалок/тултипов (которые z-50 или z-[9999] в портале) */}
          <aside className="lg:col-span-1 animate-fade-in-up delay-300 relative z-30">
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-xl p-6 text-white sticky top-24 transition-transform hover:shadow-2xl">
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <FiMapPin className="opacity-80" />
                Ваш город
              </h3>
              <div className="relative">
                <select
                  className="w-full p-3 pr-10 rounded-lg text-gray-800 font-medium focus:ring-4 focus:ring-blue-400 focus:outline-none transition-all appearance-none bg-white cursor-pointer hover:bg-gray-50 shadow-inner"
                  value={selectedCity || 'Все города'}
                  onChange={(e) => setSelectedCity(e.target.value === 'Все города' ? null : e.target.value)}
                >
                  <option value="Все города">Все города</option>
                  {cities && cities.map((city) => (
                    <option key={city.id} value={city.name}>
                      {city.name}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
              
              <div className="mt-4 p-4 bg-white/10 backdrop-blur-md rounded-lg transition-all border border-white/10">
                <p className="text-sm text-blue-100 mb-1">Сейчас показаны:</p>
                <p className="text-xl font-bold tracking-wide">{selectedCity || 'Все города'}</p>
              </div>
              
              <div className="mt-6 pt-6 border-t border-white/20">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-3xl font-bold">{nkoCount}</div>
                    <div className="text-sm text-blue-100">НКО</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold">{citiesCount}</div>
                    <div className="text-sm text-blue-100">Городов</div>
                  </div>
                </div>
              </div>
            </div>
          </aside>

        </div>
      </section>

      {/* Карта НКО */}
      <section className="bg-blue-50 py-12 border-y border-blue-100 relative z-10">
        <div className="container mx-auto px-4">
          <div className="animate-fade-in-up">
             <NkoMap selectedCity={selectedCity} />
          </div>
        </div>
      </section>

      {/* События и Новости */}
      <section className="bg-white py-12 relative z-10">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-gray-800 mb-8 animate-fade-in-up">
            Что происходит {selectedCity ? `в городе ${selectedCity}` : 'во всех городах'}
          </h2>

          {/* События */}
          <div className="mb-16">
            <div className="flex items-center justify-between mb-6 animate-fade-in-up">
              <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <span className="w-2 h-8 bg-blue-600 rounded-full inline-block"></span>
                Ближайшие события
              </h3>
              <Link to="/calendar" className="group text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors">
                Все события
                <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            {displayEvents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayEvents.map((event, idx) => (
                  <div 
                    key={event.id} 
                    className="animate-fade-in-up h-full"
                    style={{ animationDelay: `${idx * 150}ms` }}
                  >
                    {/* EventCard уже использует AuthTooltip с Portal, z-index проблем быть не должно */}
                    <EventCard event={event} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300 animate-fade-in-up">
                <FiCalendar className="mx-auto text-6xl text-gray-300 mb-4" />
                <p className="text-gray-500 font-medium">
                  {selectedCity ? `Пока нет событий для города ${selectedCity}` : 'Нет предстоящих событий'}
                </p>
              </div>
            )}
          </div>

          {/* Новости */}
          <div>
            <div className="flex items-center justify-between mb-6 animate-fade-in-up">
              <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                 <span className="w-2 h-8 bg-green-500 rounded-full inline-block"></span>
                 Последние новости
              </h3>
              <Link to="/news" className="group text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors">
                Все новости
                <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            {displayNews.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayNews.map((newsItem, idx) => (
                  <div 
                    key={newsItem.id} 
                    className="animate-fade-in-up h-full"
                    style={{ animationDelay: `${idx * 150}ms` }}
                  >
                    <NewsCard news={newsItem} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300 animate-fade-in-up">
                <FiFileText className="mx-auto text-6xl text-gray-300 mb-4" />
                <p className="text-gray-500 font-medium">
                  {selectedCity ? `Пока нет новостей для города ${selectedCity}` : 'Нет новостей'}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Призыв к действию */}
      <section className="bg-gradient-to-r from-blue-700 to-blue-600 text-white py-20 relative overflow-hidden z-0">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 animate-fade-in-up">Присоединяйтесь к добрым делам!</h2>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto animate-fade-in-up delay-100">
            Станьте частью волонтерского движения и помогите сделать мир лучше прямо сейчас
          </p>
          <div className="flex flex-col sm:flex-row gap-5 justify-center animate-fade-in-up delay-200">
            <Link 
              to="/register" 
              className="px-8 py-4 bg-white text-blue-700 rounded-xl font-bold hover:bg-blue-50 hover:scale-105 transition-all shadow-lg text-lg"
            >
              Зарегистрироваться
            </Link>
            <Link 
              to="/calendar" 
              className="px-8 py-4 bg-blue-800/50 backdrop-blur-sm border border-blue-400 text-white rounded-xl font-bold hover:bg-blue-800 hover:scale-105 transition-all text-lg"
            >
              Посмотреть события
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;