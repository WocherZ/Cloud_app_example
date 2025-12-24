// src/components/Shared/AuthTooltip.jsx
import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';

const AuthTooltip = ({ isVisible, anchorRef }) => {
  const tooltipRef = useRef(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [arrowPosition, setArrowPosition] = useState('top');

  useEffect(() => {
    if (isVisible && anchorRef?.current && tooltipRef.current) {
      const updatePosition = () => {
        const anchorRect = anchorRef.current.getBoundingClientRect();
        const tooltipRect = tooltipRef.current.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        const spacing = 12;
        let newTop = 0;
        let newLeft = 0;
        let arrow = 'top';

        // Попытка 1: Показать снизу от якоря
        newTop = anchorRect.bottom + spacing;
        newLeft = anchorRect.left + (anchorRect.width / 2) - (tooltipRect.width / 2);
        arrow = 'top';

        // Проверяем, помещается ли снизу
        if (newTop + tooltipRect.height > viewportHeight - 20) {
          // Попытка 2: Показать сверху от якоря
          newTop = anchorRect.top - tooltipRect.height - spacing;
          arrow = 'bottom';

          if (newTop < 20) {
            // Попытка 3: Показать справа
            newTop = anchorRect.top + (anchorRect.height / 2) - (tooltipRect.height / 2);
            newLeft = anchorRect.right + spacing;
            arrow = 'left';

            if (newLeft + tooltipRect.width > viewportWidth - 20) {
              // Попытка 4: Показать слева
              newLeft = anchorRect.left - tooltipRect.width - spacing;
              arrow = 'right';
            }
          }
        }

        // Корректируем горизонтальную позицию
        if (arrow === 'top' || arrow === 'bottom') {
          if (newLeft < 20) {
            newLeft = 20;
          } else if (newLeft + tooltipRect.width > viewportWidth - 20) {
            newLeft = viewportWidth - tooltipRect.width - 20;
          }
        }

        // Корректируем вертикальную позицию
        if (arrow === 'left' || arrow === 'right') {
          if (newTop < 20) {
            newTop = 20;
          } else if (newTop + tooltipRect.height > viewportHeight - 20) {
            newTop = viewportHeight - tooltipRect.height - 20;
          }
        }

        setPosition({ top: newTop, left: newLeft });
        setArrowPosition(arrow);
      };

      updatePosition();
      
      // Обновляем позицию при скролле
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);

      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [isVisible, anchorRef]);

  if (!isVisible) return null;

  const getArrowStyles = () => {
    switch (arrowPosition) {
      case 'top':
        return {
          top: '-6px',
          left: '50%',
          transform: 'translateX(-50%) rotate(45deg)',
          borderLeft: '1px solid #e5e7eb',
          borderTop: '1px solid #e5e7eb',
        };
      case 'bottom':
        return {
          bottom: '-6px',
          left: '50%',
          transform: 'translateX(-50%) rotate(45deg)',
          borderRight: '1px solid #e5e7eb',
          borderBottom: '1px solid #e5e7eb',
        };
      case 'left':
        return {
          left: '-6px',
          top: '50%',
          transform: 'translateY(-50%) rotate(45deg)',
          borderLeft: '1px solid #e5e7eb',
          borderBottom: '1px solid #e5e7eb',
        };
      case 'right':
        return {
          right: '-6px',
          top: '50%',
          transform: 'translateY(-50%) rotate(45deg)',
          borderRight: '1px solid #e5e7eb',
          borderTop: '1px solid #e5e7eb',
        };
      default:
        return {};
    }
  };

  const tooltipContent = (
    <div
      ref={tooltipRef}
      className="fixed bg-white rounded-lg shadow-xl border border-gray-200 p-4 min-w-[280px] max-w-[320px] animate-tooltip pointer-events-auto"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        zIndex: 99999,
      }}
    >
      {/* Стрелка */}
      <div
        className="absolute w-3 h-3 bg-white"
        style={getArrowStyles()}
      />

      {/* Контент */}
      <div className="relative z-10">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-800 mb-1">Требуется авторизация</h4>
            <p className="text-sm text-gray-600">
              Войдите, чтобы сохранить материал в избранное
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Link
            to="/login"
            className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors text-center"
          >
            Войти
          </Link>
          <Link
            to="/register"
            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors text-center"
          >
            Регистрация
          </Link>
        </div>
      </div>

      <style>{`
        @keyframes tooltip {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-tooltip {
          animation: tooltip 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );

  // Используем Portal для рендера вне иерархии компонента
  return createPortal(tooltipContent, document.body);
};

export default AuthTooltip;