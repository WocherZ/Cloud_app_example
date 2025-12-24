import React from 'react';
import VkVideoPlayer from './VkVideoPlayer';
import RutubeVideoPlayer from './RutubeVideoPlayer';

const UniversalVideoPlayer = ({ videoUrl }) => {
  // Проверяем, содержит ли ссылка домен VK
  if (videoUrl.includes('vk.com') || videoUrl.includes('vkvideo.ru')) {
    return <VkVideoPlayer videoUrl={videoUrl} />;
  }

  // Проверяем, содержит ли ссылка домен Rutube
  if (videoUrl.includes('rutube.ru')) {
    return <RutubeVideoPlayer videoUrl={videoUrl} />;
  }

  // Если сервис не опознан, показываем сообщение
  return (
    <div className="aspect-video bg-gray-900 flex flex-col items-center justify-center text-center text-white p-4 rounded-xl">
      <h3 className="text-xl font-bold mb-2">Видеосервис не поддерживается</h3>
      <p className="text-sm text-gray-300">
        Не удалось определить плеер для этой ссылки. Вы можете попробовать открыть её вручную.
      </p>
      <a 
        href={videoUrl} 
        target="_blank" 
        rel="noopener noreferrer"
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Открыть ссылку
      </a>
    </div>
  );
};

export default UniversalVideoPlayer;