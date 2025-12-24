// src/components/VideoPlayers/VkVideoPlayer.jsx (или где он у вас лежит)
import React, { useRef, useEffect } from 'react';

/**
 * Извлекает oid, id и hash из URL-ссылки VK.
 */
const parseVkVideoUrl = (url) => {
  if (!url) return null;
  
  // 1. Ищем oid и id (стандартный паттерн video-XXXX_YYYY)
  const match = url.match(/video(-?\d+)_(\d+)/);
  
  // 2. Пытаемся найти hash в параметрах URL (он часто нужен для воспроизведения)
  let hash = null;
  try {
    // Если url полный, парсим параметры
    if (url.includes('?')) {
      const urlObj = new URL(url);
      hash = urlObj.searchParams.get('hash');
    }
  } catch (e) {
    // Игнорируем ошибки парсинга, если ссылка неполная
  }

  if (match && match[1] && match[2]) {
    return {
      oid: match[1],
      id: match[2],
      hash: hash // Может быть null, если хеша нет
    };
  }
  return null;
};

const VK_SCRIPT_ID = 'vk-video-player-script';

const VkVideoPlayer = ({ videoUrl }) => {
  const playerId = useRef(`vk_player_${Math.random().toString(36).substring(7)}`).current;
  const playerInitialized = useRef(false);
  // Храним экземпляр плеера, чтобы не создавать дубликаты
  const playerInstance = useRef(null);

  useEffect(() => {
    const videoInfo = parseVkVideoUrl(videoUrl);
    if (!videoInfo) return;

    const initializePlayer = () => {
      const container = document.getElementById(playerId);
      
      // Проверяем, загружен ли API, есть ли контейнер и не создан ли уже плеер
      if (window.VK && window.VK.Player && container && !playerInitialized.current) {
        try {
          // Очищаем контейнер перед инициализацией (на всякий случай)
          container.innerHTML = '';

          // Собираем строку параметров
          let videoString = `oid=${videoInfo.oid}&id=${videoInfo.id}`;
          
          // Добавляем hash, если нашли его
          if (videoInfo.hash) {
            videoString += `&hash=${videoInfo.hash}`;
          }

          // Создаем плеер
          playerInstance.current = new window.VK.Player(playerId, {
            video: videoString, // <-- ИСПОЛЬЗУЕМ ДИНАМИЧЕСКИЕ ДАННЫЕ
            width: '100%',      // Растягиваем по контейнеру
            height: '100%',     // Растягиваем по контейнеру
            autoplay: 0,
            // hd: 1, // Можно включить HD по умолчанию
          });

          playerInitialized.current = true;
        } catch (error) {
          console.error("Ошибка инициализации плеера VK:", error);
        }
      }
    };

    // Логика загрузки SDK
    if (!window.VK) {
      if (!document.getElementById(VK_SCRIPT_ID)) {
        const script = document.createElement('script');
        script.id = VK_SCRIPT_ID;
        script.src = 'https://vk.com/js/api/videoplayer.js';
        script.async = true;
        script.onload = initializePlayer;
        document.body.appendChild(script);
      } else {
        // Скрипт уже есть в DOM, но может еще не загрузился
        // Можно добавить слушатель или тайм-аут, но в React часто достаточно перерендера
        // Для надежности, если скрипт уже есть, пробуем инициализировать чуть позже
        const existingScript = document.getElementById(VK_SCRIPT_ID);
        existingScript.addEventListener('load', initializePlayer);
        // Если уже загружен (кэш)
        if (window.VK) initializePlayer();
      }
    } else {
      initializePlayer();
    }

    // Очистка при размонтировании
    return () => {
      // VK Player API не предоставляет явного метода .destroy(), 
      // но мы можем сбросить флаг
      playerInitialized.current = false;
      playerInstance.current = null;
    };
  }, [videoUrl, playerId]);

  if (!parseVkVideoUrl(videoUrl)) {
    return (
      <div className="aspect-video bg-gray-900 flex items-center justify-center text-white p-4 rounded-xl">
        Некорректная ссылка на VK видео.
      </div>
    );
  }

  return (
    <div className="aspect-video rounded-xl overflow-hidden shadow-lg bg-gray-900">
      <div id={playerId} className="w-full h-full" />
    </div>
  );
};

export default VkVideoPlayer;