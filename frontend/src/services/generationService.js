const API_BASE_URL = 'http://localhost:8000';

const getAuthToken = () => localStorage.getItem('authToken');

const authFetch = async (url, options = {}) => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  return response;
};

export const generateNewsContent = async (title) => {
  try {
    const response = await authFetch(`${API_BASE_URL}/generation/news`, {
      method: 'POST',
      body: JSON.stringify({ title }),
    });

    const data = await response.json();
    if (!response.ok) {
      const message = data?.detail || data?.message || 'Не удалось сгенерировать текст';
      return { success: false, message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Generation API error:', error);
    return { success: false, message: error.message || 'Ошибка генерации' };
  }
};

export const generateDialogueAnswer = async (dialogue) => {
  try {
    const response = await authFetch(`${API_BASE_URL}/generation/dialogue`, {
      method: 'POST',
      body: JSON.stringify({ dialogue }),
    });

    const data = await response.json();
    if (!response.ok) {
      const message = data?.detail || data?.message || 'Не удалось получить ответ от ИИ';
      return { success: false, message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Dialogue generation API error:', error);
    return { success: false, message: error.message || 'Ошибка генерации ответа' };
  }
};

/**
 * Стриминговый вызов диалогового ассистента.
 * Вызывает колбэки по мере прихода chunk'ов текста.
 *
 * @param {string} dialogue - полный текст диалога
 * @param {Object} callbacks
 * @param {(chunk: string, fullText: string) => void} [callbacks.onChunk] - вызывается на каждый chunk
 * @param {(fullText: string) => void} [callbacks.onComplete] - вызывается по завершении стрима
 * @param {(message: string) => void} [callbacks.onError] - вызывается при ошибке
 */
export const streamDialogueAnswer = async (
  dialogue,
  { onChunk, onComplete, onError } = {},
) => {
  try {
    const response = await authFetch(`${API_BASE_URL}/generation/dialogue/stream`, {
      method: 'POST',
      body: JSON.stringify({ dialogue }),
    });

    if (!response.ok) {
      // Пытаемся прочитать тело как JSON с detail/message, если есть
      let message = 'Не удалось получить стриминговый ответ от ИИ';
      try {
        const data = await response.json();
        message = data?.detail || data?.message || message;
      } catch {
        // тело не JSON — оставляем дефолтное сообщение
      }
      if (onError) onError(message);
      return;
    }

    if (!response.body || typeof response.body.getReader !== 'function') {
      const message = 'Браузер не поддерживает потоковое чтение ответа';
      if (onError) onError(message);
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let fullText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      if (chunk) {
        fullText += chunk;
        if (onChunk) onChunk(chunk, fullText);
      }
    }

    if (onComplete) onComplete(fullText);
  } catch (error) {
    console.error('Dialogue streaming API error:', error);
    if (onError) onError(error.message || 'Ошибка стриминговой генерации ответа');
  }
};

export const editNewsContent = async (newsText, userRequest, action) => {
  try {
    const response = await authFetch(`${API_BASE_URL}/generation/news/edit`, {
      method: 'POST',
      body: JSON.stringify({
        news_text: newsText,
        user_request: userRequest,
        action: action,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      const message = data?.detail || data?.message || 'Не удалось отредактировать текст';
      return { success: false, message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('News edit API error:', error);
    return { success: false, message: error.message || 'Ошибка редактирования текста' };
  }
};


