import React from 'react';

const parseRutubeVideoUrl = (url) => {
  if (!url) return null;
  const match = url.match(/rutube\.ru\/(?:video|play\/embed)\/([a-zA-Z0-9_]+)/);
  return match && match[1] ? match[1] : null;
};

const RutubeVideoPlayer = ({ videoUrl }) => {
  const videoId = parseRutubeVideoUrl(videoUrl);

  if (!videoId) {
    return (
      <div className="aspect-video bg-gray-900 flex items-center justify-center text-white p-4 rounded-xl">
        Некорректная ссылка на Rutube видео.
      </div>
    );
  }

  const embedUrl = `https://rutube.ru/play/embed/${videoId}`;

  return (
    <div className="aspect-video rounded-xl overflow-hidden shadow-lg bg-gray-900">
      <iframe
        width="100%"
        height="100%"
        src={embedUrl}
        title="Rutube video player"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      ></iframe>
    </div>
  );
};

// --- УБЕДИТЕСЬ, ЧТО ЭКСПОРТ ИМЕННО ТАКОЙ ---
export default RutubeVideoPlayer;