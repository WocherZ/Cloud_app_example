// src/components/admin/KnowledgeBaseSection.jsx
import React, { useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiVideo, FiFileText, FiLink } from 'react-icons/fi';
import { KnowledgeBaseModal } from './KnowledgeBaseModal';

export const KnowledgeBaseSection = ({ items, loading, error, onSave, onDelete }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const handleEdit = (item) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedItem(null);
    setIsModalOpen(true);
  };

  const handleSave = async (data) => {
    // Передаем ID если это редактирование, иначе null
    await onSave(data, selectedItem?.id);
    setIsModalOpen(false);
  };

  // Иконка по типу
  const getTypeIcon = (type) => {
    if (type === 'video') return <FiVideo className="text-red-500" />;
    if (type === 'link') return <FiLink className="text-blue-500" />;
    return <FiFileText className="text-gray-500" />;
  };

  if (loading) return <div className="text-center py-10">Загрузка...</div>;
  if (error) return <div className="text-center text-red-500 py-10">{error}</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">База знаний</h2>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <FiPlus /> Добавить материал
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="p-4 font-semibold text-gray-600">Название</th>
              <th className="p-4 font-semibold text-gray-600">Категория</th>
              <th className="p-4 font-semibold text-gray-600">Тип</th>
              <th className="p-4 font-semibold text-gray-600 text-right">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                <td className="p-4 font-medium text-gray-800 max-w-xs truncate" title={item.title}>
                  {item.title}
                </td>
                <td className="p-4 text-gray-600">
                  <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs">
                    {item.category}
                  </span>
                </td>
                <td className="p-4 text-gray-600 flex items-center gap-2">
                  {getTypeIcon(item.type)}
                  <span className="capitalize">{item.type === 'link' ? 'Ссылка' : item.type === 'video' ? 'Видео' : 'Документ'}</span>
                </td>
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => handleEdit(item)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Редактировать"
                    >
                      <FiEdit2 />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('Удалить этот материал?')) onDelete(item.id);
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Удалить"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan="4" className="p-8 text-center text-gray-500">
                  Нет материалов
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <KnowledgeBaseModal
          item={selectedItem}
          onSave={handleSave}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
};