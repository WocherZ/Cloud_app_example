// src/components/admin/KnowledgeBaseModal.jsx
import React, { useState, useEffect } from 'react';
import { FiX, FiSave, FiUpload, FiTrash2, FiLink, FiVideo, FiFileText } from 'react-icons/fi';
import { uploadKbFile } from '../../services/AdminAPI'; // Импорт метода загрузки

export const KnowledgeBaseModal = ({ item, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    category_knowledge_base_name: '', // Для простоты используем имя
    type_material_name: 'document',   // video, link, document
    video_url: '',
    material_url: '', // Внешняя ссылка
    files: [],        // Массив строк (путей)
  });

  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (item) {
      setFormData({
        title: item.title || '',
        description: item.description || '',
        content: item.content || '',
        category_knowledge_base_name: item.category || '',
        type_material_name: item.type || 'document',
        video_url: item.videoUrl || '',
        material_url: item.externalLink || '',
        files: item.files || [], // Предполагаем массив путей
      });
    }
  }, [item]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const result = await uploadKbFile(file);
    
    if (result.success) {
      // Добавляем путь к файлу в массив
      // Проверяем, что вернул сервер: объект или строку
      const filePath = result.data.file_path || result.data; 
      setFormData(prev => ({
        ...prev,
        files: [...prev.files, filePath]
      }));
    } else {
      alert('Ошибка загрузки файла');
    }
    setUploading(false);
    e.target.value = ''; // Сброс инпута
  };

  const removeFile = (indexToRemove) => {
    setFormData(prev => ({
      ...prev,
      files: prev.files.filter((_, index) => index !== indexToRemove)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl my-8 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-2xl font-bold text-gray-800">
            {item ? 'Редактировать материал' : 'Создать материал'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <FiX className="text-xl text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Заголовок */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Заголовок *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Категория и Тип */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Категория</label>
              <input
                type="text"
                name="category_knowledge_base_name"
                value={formData.category_knowledge_base_name}
                onChange={handleChange}
                placeholder="Например: Экология"
                className="w-full p-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Тип материала</label>
              <select
                name="type_material_name"
                value={formData.type_material_name}
                onChange={handleChange}
                className="w-full p-2 border rounded-lg"
              >
                <option value="document">📄 Документ</option>
                <option value="video">🎥 Видео</option>
                <option value="link">🔗 Ссылка</option>
              </select>
            </div>
          </div>

          {/* Описание */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Краткое описание</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="2"
              className="w-full p-2 border rounded-lg"
            />
          </div>

          {/* Полный текст */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Полный текст / Статья</label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleChange}
              rows="5"
              className="w-full p-2 border rounded-lg"
            />
          </div>

          {/* Поля в зависимости от типа */}
          {formData.type_material_name === 'video' && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-blue-800 mb-1 flex items-center gap-2">
                <FiVideo /> Ссылка на видео (VK/YouTube)
              </label>
              <input
                type="url"
                name="video_url"
                value={formData.video_url}
                onChange={handleChange}
                placeholder="https://..."
                className="w-full p-2 border rounded-lg"
              />
            </div>
          )}

          {formData.type_material_name === 'link' && (
            <div className="bg-green-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-green-800 mb-1 flex items-center gap-2">
                <FiLink /> Внешняя ссылка
              </label>
              <input
                type="url"
                name="material_url"
                value={formData.material_url}
                onChange={handleChange}
                placeholder="https://..."
                className="w-full p-2 border rounded-lg"
              />
            </div>
          )}

          {/* Загрузка файлов */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Файлы</label>
            <div className="space-y-3">
              {/* Список файлов */}
              {formData.files.map((file, idx) => (
                <div key={idx} className="flex items-center justify-between bg-gray-50 p-2 rounded-lg border">
                  <span className="text-sm truncate max-w-[80%]">{file}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              ))}

              {/* Кнопка загрузки */}
              <label className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg cursor-pointer transition-colors">
                <FiUpload />
                {uploading ? 'Загрузка...' : 'Загрузить файл'}
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
              </label>
            </div>
          </div>

          {/* Футер */}
          <div className="pt-4 flex gap-3 border-t mt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
            >
              <FiSave /> Сохранить
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};