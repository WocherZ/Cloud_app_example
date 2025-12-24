// src/components/admin/NewsSection.jsx
import React, { useState, useMemo } from 'react';
import {
  FiFileText,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiAlertCircle,
} from 'react-icons/fi';
import { NewsModal } from './NewsModal';

const formatDate = (value) => {
  if (!value) return 'Дата не указана';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Дата не указана';
  return date.toLocaleDateString('ru-RU');
};

export const NewsSection = ({ news, loading, error, onSave, onDelete }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingNews, setEditingNews] = useState(null);
  const formattedNews = useMemo(
    () =>
      news.map((item) => ({
        ...item,
        formattedDate: formatDate(item.publishDate || item.date_event || item.dateEvent),
      })),
    [news]
  );

  const handleEdit = (newsItem) => {
    setEditingNews(newsItem);
    setShowModal(true);
  };

  const handleCreate = () => {
    setEditingNews(null);
    setShowModal(true);
  };

  const handleSave = async (newsData) => {
    await onSave(newsData, editingNews?.id);
    setShowModal(false);
    setEditingNews(null);
  };

  const handleDelete = async (newsId) => {
    if (window.confirm('Удалить эту новость?')) {
      await onDelete(newsId);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-center gap-3">
        <FiAlertCircle className="text-red-600 text-2xl" />
        <div>
          <p className="font-semibold text-red-800">Ошибка загрузки</p>
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Управление новостями</h2>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          <FiPlus />
          Создать новость
        </button>
      </div>

      {formattedNews.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <FiFileText className="mx-auto text-6xl text-gray-300 mb-4" />
          <p className="text-xl text-gray-600">Новостей пока нет</p>
          <button
            onClick={handleCreate}
            className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Создать первую новость
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {formattedNews.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden"
            >
              {item.image_url && (
                <img
                  src={item.image_url}
                  alt={item.title}
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-2">
                  {item.title}
                </h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {item.content}
                </p>
                <div className="text-xs text-gray-500 mb-4">{item.formattedDate}</div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(item)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-sm font-medium transition-colors"
                  >
                    <FiEdit2 />
                    Редактировать
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="flex items-center justify-center px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-medium transition-colors"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <NewsModal
          news={editingNews}
          onSave={handleSave}
          onClose={() => {
            setShowModal(false);
            setEditingNews(null);
          }}
        />
      )}
    </div>
  );
};