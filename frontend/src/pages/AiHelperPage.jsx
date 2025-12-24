// src/pages/AiHelperPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { streamDialogueAnswer } from '../services/generationService';

const AiHelperPage = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Ref для авто-скролла
  const messagesEndRef = useRef(null);

  // Функция скролла вниз
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Скроллим вниз при изменении сообщений
  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    if (!input.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      text: input.trim(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);
    setError(null);

    const dialogueText = updatedMessages
      .map((m) => `${m.role === 'user' ? 'Пользователь' : 'ИИ'}: ${m.text}`)
      .join('\n');

    const aiMessageId = Date.now() + 1;
    setMessages((prev) => [
      ...prev,
      {
        id: aiMessageId,
        role: 'assistant',
        text: '',
      },
    ]);

    await streamDialogueAnswer(dialogueText, {
      onChunk: (_chunk, fullText) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiMessageId
              ? { ...m, text: fullText }
              : m,
          ),
        );
      },
      onComplete: () => {
        setIsLoading(false);
      },
      onError: (message) => {
        setMessages((prev) => prev.filter((m) => m.id !== aiMessageId));
        setError(message || 'Ошибка при получении ответа');
        setIsLoading(false);
      },
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-10">
      {/* Стили для анимаций */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in {
          animation: fadeInUp 0.6s ease-out forwards;
          opacity: 0;
        }
        .animate-message {
          animation: popIn 0.3s ease-out forwards;
        }
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-300 { animation-delay: 0.3s; }
      `}</style>

      {/* Заголовок с логотипом */}
      <div className="flex items-center gap-4 mb-6 animate-fade-in">
        <div className="shrink-0 rounded-2xl bg-white border border-blue-100 p-2 shadow-sm">
          <img
            src="/ai_logo.png"
            alt="Логотип ИИ помощника"
            className="w-10 h-10 sm:w-12 sm:h-12"
          />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            ИИ помощник
          </h1>
          <p className="text-gray-600 mt-2 text-sm sm:text-base">
            Задавайте вопросы о мероприятиях, НКО и возможностях участия. Ассистент постарается
            дать краткий и полезный ответ.
          </p>
        </div>
      </div>

      <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg border border-blue-50 flex flex-col animate-fade-in delay-100">
        <div className="px-4 pt-4 pb-2 border-b border-blue-50 flex items-center justify-between bg-gradient-to-r from-slate-50 to-blue-50 rounded-t-3xl">
          <div className="text-sm sm:text-base font-medium text-gray-800 flex items-center gap-2">
            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Онлайн-диалог с ассистентом
          </div>
          <span className="text-[11px] sm:text-xs text-gray-500">
            Ответы могут занимать несколько секунд
          </span>
        </div>

        {/* Область сообщений */}
        <div className="p-4 space-y-3 bg-slate-50 min-h-[300px] max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
          {messages.length === 0 && (
            <div className="text-center text-gray-400 text-sm mt-8 animate-fade-in delay-200">
              Начните диалог — задайте свой первый вопрос.
            </div>
          )}
          
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex w-full animate-message ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm sm:text-base shadow-sm leading-relaxed ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-sm'
                    : 'bg-white text-gray-900 border border-blue-100 rounded-bl-sm'
                }`}
              >
                <div className="whitespace-pre-wrap">{message.text}</div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start animate-message">
              <div className="max-w-[80%] bg-white text-gray-500 border border-blue-100 rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm shadow-sm italic flex items-center gap-2">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.15s'}}></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.3s'}}></span>
              </div>
            </div>
          )}
          
          {/* Невидимый блок для скролла */}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSend} className="border-t border-gray-200 p-3 sm:p-4 bg-white rounded-b-3xl">
          {error && (
            <div className="mb-2 text-sm text-red-600 animate-message">
              {error}
            </div>
          )}
          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  handleSend(e);
                }
              }}
              rows={1}
              className="flex-1 resize-none border border-gray-300 rounded-xl px-4 py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Напишите ваш вопрос... "
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-blue-600 text-white px-6 sm:px-8 py-2 rounded-xl text-sm sm:text-base font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95"
            >
              Отправить
            </button>
          </div>
        </form>
      </div>

      <p className="mt-4 text-xs sm:text-sm text-gray-400 text-center leading-snug animate-fade-in delay-300">
        Все ответы генерируются автоматически с использованием ИИ и могут содержать неточности.
        Пожалуйста, проверяйте важную информацию у администрации сайта.
      </p>
    </div>
  );
};

export default AiHelperPage;