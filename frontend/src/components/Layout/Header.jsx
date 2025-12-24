// src/components/Layout/Header.jsx
import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCity } from '../../contexts/CityContext';
import { useAuth } from '../../contexts/AuthContext';

const Header = () => {
  const { selectedCity, setSelectedCity, cities } = useCity();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Синхронизация города пользователя с выбранным городом в Header
  useEffect(() => {
    if (user && user.city_name && user.city_name !== selectedCity) {
      setSelectedCity(user.city_name);
    }
  }, [user, user?.city_name]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      {/* Инлайн стили для анимаций */}
      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes slideInFromLeft {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes slideInFromRight {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-slide-down {
          animation: slideDown 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-fade-in {
          animation: fadeIn 0.8s ease-out forwards;
        }
        .animate-slide-left {
          animation: slideInFromLeft 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-slide-right {
          animation: slideInFromRight 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .nav-link {
          position: relative;
          transition: all 0.3s ease;
        }
        .nav-link::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 50%;
          width: 0;
          height: 2px;
          background: white;
          transition: all 0.3s ease;
          transform: translateX(-50%);
        }
        .nav-link:hover::after {
          width: 80%;
        }
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-300 { animation-delay: 0.3s; }
      `}</style>

      <header className="bg-gradient-to-r from-blue-700 to-blue-600 text-white shadow-lg">
        <div className="container mx-auto">
          {/* Верхняя часть header */}
          <div className="flex justify-between items-center p-4">
            {/* Логотип */}
            <Link 
              to="/" 
              className="flex items-center gap-1 xs:gap-2 sm:gap-3 hover:opacity-90 transition-all duration-300 hover:scale-105 animate-slide-left"
            >
              <img
                src="/LOGO_ROSATOM_WHITE.png"
                alt="Logo"
                className="h-7 xs:h-8 sm:h-10 w-auto transition-transform duration-300 hover:rotate-6"
              />
              <div className="text-lg xs:text-xl sm:text-2xl font-bold">
                Росатом
              </div>
              <div className="hidden md:block text-sm xs:text-base text-blue-100 border-l border-blue-400 pl-2 xs:pl-3 sm:pl-4">
                Добрые Дела
              </div>
            </Link>

            {/* Выбор города и авторизация */}
            <div className="flex items-center gap-4 animate-slide-right">
              <select
                className="bg-blue-800/50 backdrop-blur-sm text-white p-1.5 xs:p-2 rounded-lg border border-blue-400/30 focus:outline-none focus:ring-2 focus:ring-white/50 cursor-pointer appearance-none pr-8 xs:pr-10 bg-[length:12px_12px] xs:bg-[length:16px_16px] bg-[center_right_8px] xs:bg-[center_right_12px] bg-no-repeat text-sm xs:text-base transition-all duration-300 hover:bg-blue-800/70 hover:border-blue-300/50 hover:shadow-lg"
                style={{ backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23ffffff' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e\")" }}
                value={selectedCity || ''}
                onChange={(e) => setSelectedCity(e.target.value)}
              >
                <option value="" disabled>Город</option>
                {cities.map((city) => (
                  <option key={city.id} value={city.name}>
                    {city.name}
                  </option>
                ))}
              </select>

              {user ? (
                <div className="flex items-center gap-3">
                  <Link
                    to="/profile"
                    className="hidden md:block text-blue-100 hover:text-white transition-all duration-300 hover:scale-105"
                  >
                    {user.name || user.email}
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="bg-blue-800 hover:bg-blue-900 px-4 py-2 rounded-lg transition-all duration-300 hover:shadow-lg hover:scale-105"
                  >
                    Выход
                  </button>
                </div>
              ) : (
                <Link 
                  to="/login" 
                  className="bg-white text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg font-medium transition-all duration-300 hover:shadow-lg hover:scale-105"
                >
                  Вход
                </Link>
              )}
            </div>
          </div>

          {/* Навигация */}
          <nav className="border-t border-blue-500/30 animate-slide-down">
            <div className="flex gap-1 p-2 overflow-x-auto">
              {[
                { to: '/', label: 'Главная' },
                { to: '/nko', label: 'НКО' },
                { to: '/knowledge-base', label: 'База знаний' },
                { to: '/calendar', label: 'Календарь' },
                { to: '/news', label: 'Новости' },
                { to: '/ai_helper', label: 'ИИ помощник' },
                user && { to: '/profile', label: 'Профиль' },
                user?.role === 'admin' && { to: '/admin', label: 'Админ-панель' },
              ].filter(Boolean).map((item, idx) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="nav-link px-4 py-2 rounded-lg hover:bg-blue-800/50 transition-all duration-300 text-sm font-medium whitespace-nowrap flex items-center gap-1 animate-fade-in hover:scale-105"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <span>{item.label}</span>
                  {item.to === '/ai_helper' && (
                    <img
                      src="/ai_logo_white.png"
                      alt="ИИ помощник"
                      className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 group-hover:rotate-12"
                    />
                  )}
                </Link>
              ))}
            </div>
          </nav>
        </div>
      </header>
    </>
  );
};

export default Header;