// src/components/Shared/ImageModal.jsx
import React, { useEffect, useCallback } from 'react';
import { FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const ImageModal = ({ isOpen, onClose, images, currentIndex, setCurrentIndex }) => {
  
  // 1. ХУКИ ДОЛЖНЫ БЫТЬ ВСЕГДА НАВЕРХУ
  
  const handlePrev = useCallback((e) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  }, [images.length, setCurrentIndex]);

  const handleNext = useCallback((e) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  }, [images.length, setCurrentIndex]);

  useEffect(() => {
    // Если модалка закрыта, не вешаем обработчики
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, handlePrev, handleNext]); // Добавил isOpen в зависимости

  // 2. ТЕПЕРЬ МОЖНО ДЕЛАТЬ РАННИЙ ВОЗВРАТ (Conditional Rendering)
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors p-2 bg-black/50 rounded-full z-50"
      >
        <FiX className="text-3xl" />
      </button>

      <div 
        className="relative flex items-center justify-center w-full h-full" 
        onClick={(e) => e.stopPropagation()}
      >
        {images.length > 1 && (
          <button
            onClick={handlePrev}
            className="absolute left-0 md:left-4 text-white/70 hover:text-white p-2 hover:bg-white/10 rounded-full transition-all z-50"
          >
            <FiChevronLeft className="text-4xl md:text-5xl" />
          </button>
        )}

        <img
          src={images[currentIndex]}
          alt={`Full screen ${currentIndex + 1}`}
          className="max-h-[85vh] max-w-[90vw] object-contain select-none rounded-lg shadow-2xl"
        />

        {images.length > 1 && (
          <button
            onClick={handleNext}
            className="absolute right-0 md:right-4 text-white/70 hover:text-white p-2 hover:bg-white/10 rounded-full transition-all z-50"
          >
            <FiChevronRight className="text-4xl md:text-5xl" />
          </button>
        )}

        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white/80 text-sm bg-black/50 px-3 py-1 rounded-full">
            {currentIndex + 1} / {images.length}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageModal;