// src/components/Layout/Footer.jsx
import React from 'react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <>
      {/* Инлайн стили для анимаций */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .footer-animate {
          animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
        }
        .footer-link {
          position: relative;
          transition: all 0.3s ease;
        }
        .footer-link::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 0;
          height: 1px;
          background: currentColor;
          transition: width 0.3s ease;
        }
        .footer-link:hover::after {
          width: 100%;
        }
        .social-icon {
          transition: all 0.3s ease;
        }
        .social-icon:hover {
          transform: translateY(-3px) scale(1.1);
        }
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-300 { animation-delay: 0.3s; }
      `}</style>

      <footer className="bg-blue-900 text-white mt-auto relative overflow-hidden">
        {/* Декоративные элементы */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-700/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-600/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl pointer-events-none"></div>

        <div className="container mx-auto px-4 py-8 relative z-10">
          {/* Основное содержимое подвала */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            
            {/* Информация о проекте + ЛОГОТИП */}
            <div className="lg:col-span-2 footer-animate">
              
              {/* --- Добавлен блок с логотипом --- */}
              <div className="flex items-center gap-3 mb-3">
                <img 
                  src="/LOGO_ROSATOM_WHITE.png" 
                  alt="Росатом" 
                  className="h-10 w-auto object-contain"
                />
                <h3 className="text-xl font-bold text-white leading-tight">
                  Добрые дела Росатома
                </h3>
              </div>
              {/* ---------------------------------- */}

              <p className="text-blue-100 mb-4 leading-relaxed">
                Единый портал для волонтёров, НКО и жителей городов присутствия ГК Росатом. 
                Объединяем социальные, экологические, культурные и образовательные инициативы.
              </p>
              
              <div className="flex space-x-4">
                <a 
                  href="#" 
                  className="social-icon text-blue-100 hover:text-white"
                  aria-label="ВКонтакте"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M15.07 2H8.93C3.33 2 2 3.33 2 8.93V15.07C2 20.67 3.33 22 8.93 22H15.07C20.67 22 22 20.67 22 15.07V8.93C22 3.33 20.67 2 15.07 2M18.15 16.27H16.69C16.14 16.27 15.97 15.82 15 14.83C14.12 14 13.74 13.88 13.53 13.88C13.24 13.88 13.15 13.96 13.15 14.38V15.69C13.15 16.04 13.04 16.26 12.11 16.26C10.57 16.26 8.86 15.32 7.66 13.59C5.85 11.05 5.36 9.13 5.36 8.75C5.36 8.54 5.43 8.34 5.85 8.34H7.32C7.69 8.34 7.83 8.5 7.97 8.9C8.69 10.96 9.87 12.76 10.38 12.76C10.57 12.76 10.65 12.66 10.65 12.25V10.1C10.6 9.12 10.07 9.03 10.07 8.68C10.07 8.5 10.21 8.34 10.44 8.34H12.73C13.04 8.34 13.15 8.5 13.15 8.88V11.77C13.15 12.08 13.28 12.19 13.38 12.19C13.56 12.19 13.72 12.08 14.05 11.75C15.1 10.65 16 8.87 16 8.87C16.1 8.67 16.29 8.34 16.71 8.34H18.15C18.46 8.34 18.57 8.56 18.47 8.85C18.19 9.56 16.41 11.84 16.41 11.84C16.2 12.07 16.07 12.19 16.28 12.5C16.45 12.76 17.47 14.04 18.04 14.77C18.53 15.41 19.08 16.27 18.15 16.27Z"/>
                  </svg>
                </a>
                <a 
                  href="#" 
                  className="social-icon text-blue-100 hover:text-white"
                  aria-label="Telegram"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.78 5.42-.9 6.8-.06.67-.36.89-.89.56-2.45-1.83-3.57-2.98-5.79-4.78-.51-.45-.87-.69-.84-1.09.03-.31.46-.45.83-.34 2.48.78 4.19 1.67 6.9 2.78.34.12.61.06.78-.24.3-.49.9-1.73.9-1.73s-4.38-1.56-5.72-2.29c-.34-.2-.73-.3-1.08-.29-.54.02-1.54.33-1.54.33s-1.1.35-1.1.35c0 .7 1.12.8 1.12.8l2.52.8c.64 1.05 1.56 2.45 1.56 2.45.28.45.92.67 1.46.67h.03c.44 0 .88-.17 1.22-.5.62-.62 1.3-1.5 1.3-1.5.28-.34.56-.34.56-.34z"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* Навигация по разделам */}
            <div className="footer-animate delay-100">
              <h4 className="font-semibold mb-4 text-white">Разделы сайта</h4>
              <ul className="space-y-2">
                {[
                  { href: "/", label: "Главная" },
                  { href: "/nko", label: "НКО и организации" },
                  { href: "/knowledge-base", label: "База знаний" },
                  { href: "/calendar", label: "Календарь событий" },
                  { href: "/news", label: "Новости" }
                ].map((link, idx) => (
                  <li key={idx}>
                    <a 
                      href={link.href} 
                      className="footer-link text-blue-100 hover:text-white text-sm inline-block"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Контакты и поддержка */}
            <div className="footer-animate delay-200">
              <h4 className="font-semibold mb-4 text-white">Контакты</h4>
              <ul className="space-y-2 text-sm">
                {[
                  { href: "mailto:info@rosatom-dobro.ru", label: "info@rosatom-dobro.ru" },
                  { href: "tel:+78001234567", label: "8 (800) 123-45-67" },
                  { href: "/support", label: "Техническая поддержка" },
                  { href: "/partnership", label: "Сотрудничество" }
                ].map((link, idx) => (
                  <li key={idx}>
                    <a 
                      href={link.href}
                      className="footer-link text-blue-100 hover:text-white inline-block"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Нижняя часть подвала */}
          <div className="border-t border-blue-700 pt-6 footer-animate delay-300">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <div className="text-blue-200 text-sm">
                © {currentYear} Госкорпорация «Росатом». Все права защищены.
              </div>
              <div className="flex space-x-6 text-sm">
                {[
                  { href: "/privacy", label: "Политика конфиденциальности" },
                  { href: "/terms", label: "Пользовательское соглашение" },
                  { href: "/sitemap", label: "Карта сайта" }
                ].map((link, idx) => (
                  <a 
                    key={idx}
                    href={link.href} 
                    className="footer-link text-blue-200 hover:text-white"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Footer;