// src/components/admin/NewsModal.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { FiX, FiSave, FiTrash2, FiPaperclip, FiEdit3 } from 'react-icons/fi';
import { generateNewsContent, editNewsContent } from '../../services/generationService';
// --- ИСПРАВЛЕНИЕ 1: Импортируем сервис, а не функцию ---
import { cityService } from '../../services/cityService';

const formatDateForInput = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 16);
};

export const NewsModal = ({ news, onSave, onClose }) => {
  const initialDate = useMemo(
    () => formatDateForInput(news?.date_event || news?.publishDate),
    [news]
  );
  const initialCityName = useMemo(() => news?.city || '', [news]);
  const initialFiles = useMemo(() => news?.files || [], [news]);
  
  const [formData, setFormData] = useState({
    title: news?.title || '',
    content: news?.content || '',
    category: news?.category || '',
    dateEvent: initialDate,
    cityId: '',
    cityName: initialCityName,
  });
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [cities, setCities] = useState([]);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [citiesError, setCitiesError] = useState('');
  const [existingFiles, setExistingFiles] = useState(initialFiles);
  const [filesToDelete, setFilesToDelete] = useState([]);
  const [newFiles, setNewFiles] = useState([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editRequest, setEditRequest] = useState('');
  const [editAction, setEditAction] = useState('Длиннее');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setFormData({
      title: news?.title || '',
      content: news?.content || '',
      category: news?.category || '',
      dateEvent: initialDate,
      cityId: '',
      cityName: initialCityName,
    });
    setImageFile(null);
    setExistingFiles(initialFiles);
    setFilesToDelete([]);
    setNewFiles([]);
  }, [news, initialDate, initialCityName, initialFiles]);

  // --- ИСПРАВЛЕНИЕ 2: Обновленная логика загрузки городов ---
  useEffect(() => {
    let isMounted = true;
    
    const loadCities = async () => {
      setCitiesLoading(true);
      setCitiesError('');
      
      try {
        // Используем новый метод сервиса
        const data = await cityService.getAllCities();
        
        if (!isMounted) return;

        // Приводим данные к массиву (API может вернуть массив или объект {data: []})
        const citiesList = Array.isArray(data) ? data : (data.data || []);
        
        setCities(citiesList);

        // Логика авто-подстановки города
        setFormData((prev) => {
          if (!prev.cityId && prev.cityName) {
            const match = citiesList.find(
              (city) => city.name?.toLowerCase() === prev.cityName.toLowerCase()
            );
            if (match) {
              return { ...prev, cityId: String(match.id) };
            }
          }
          return prev;
        });

      } catch (error) {
        if (isMounted) {
          console.error("Failed to load cities", error);
          setCitiesError('Не удалось загрузить список городов');
        }
      } finally {
        if (isMounted) setCitiesLoading(false);
      }
    };

    loadCities();
    
    return () => {
      isMounted = false;
    };
  }, [initialCityName]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('Заполните обязательные поля');
      return;
    }
    onSave({ ...formData, imageFile, newFiles, filesToDelete });
  };

  const handleGenerateContent = async () => {
    if (!formData.title.trim()) {
      alert('Сначала заполните заголовок новости');
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateNewsContent(formData.title.trim());
      if (result.success && result.data?.content) {
        setFormData((prev) => ({ ...prev, content: result.data.content }));
      } else {
        alert(result.message || 'Не удалось сгенерировать текст');
      }
    } catch (error) {
      console.error('Generation error:', error);
      alert('Произошла ошибка при генерации текста');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEditNews = async () => {
    if (!formData.content.trim()) {
      alert('Сначала заполните содержание новости');
      return;
    }

    if (!editRequest.trim()) {
      alert('Введите запрос для редактирования');
      return;
    }

    setIsEditing(true);
    try {
      const result = await editNewsContent(
        formData.content.trim(),
        editRequest.trim(),
        editAction
      );
      if (result.success && result.data?.content) {
        setFormData((prev) => ({ ...prev, content: result.data.content }));
        setIsEditModalOpen(false);
        setEditRequest('');
      } else {
        alert(result.message || 'Не удалось отредактировать текст');
      }
    } catch (error) {
      console.error('Edit error:', error);
      alert('Произошла ошибка при редактировании текста');
    } finally {
      setIsEditing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl my-8">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold text-gray-800">
              {news ? 'Редактировать новость' : 'Создать новость'}
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FiX className="text-xl text-gray-600" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Заголовок *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Введите заголовок новости"
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Содержание *
              </label>
              <button
                type="button"
                onClick={handleGenerateContent}
                disabled={isGenerating}
                className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 disabled:text-gray-400"
              >
                <span>{isGenerating ? 'Генерация...' : 'Сгенерировать содержание'}</span>
                {!isGenerating && (
                  <img
                    src="/ai_logo.png"
                    alt="AI"
                    className="w-4 h-4 object-contain"
                  />
                )}
              </button>
            </div>
            <textarea
              value={formData.content}
              onChange={(e) =>
                setFormData({ ...formData, content: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows="8"
              placeholder="Введите текст новости"
              required
            />
            {formData.content.trim() && (
              <div className="mt-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(true)}
                  className="inline-flex items-center gap-2 text-sm font-medium text-green-600 hover:text-green-700"
                >
                  <span>Изменить</span>
                  <img
                    src="/ai_logo_green.png"
                    alt="AI"
                    className="w-4 h-4 object-contain"
                  />
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Файл изображения
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                setImageFile(file || null);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {imageFile && (
              <p className="text-xs text-gray-500 mt-1">
                Выбран файл: {imageFile.name}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Дата события
            </label>
            <input
              type="datetime-local"
              value={formData.dateEvent}
              onChange={(e) =>
                setFormData({ ...formData, dateEvent: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Документы
            </label>
            <div className="space-y-3">
              <div>
                <label className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer text-sm font-medium text-gray-700">
                  <FiPaperclip />
                  Добавить файл
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      if (files.length) {
                        setNewFiles((prev) => [...prev, ...files]);
                        e.target.value = '';
                      }
                    }}
                  />
                </label>
                {newFiles.length > 0 && (
                  <span className="ml-3 text-xs text-gray-500">
                    Добавлено файлов: {newFiles.length}
                  </span>
                )}
              </div>

              {newFiles.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg divide-y">
                  {newFiles.map((file, idx) => (
                    <div
                      key={`${file.name}-${idx}`}
                      className="flex items-center justify-between px-4 py-2"
                    >
                      <span className="text-sm text-gray-700 truncate">{file.name}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setNewFiles((prev) => prev.filter((_, fileIdx) => fileIdx !== idx))
                        }
                        className="text-red-500 hover:text-red-600 text-sm flex items-center gap-1"
                      >
                        <FiTrash2 />
                        Удалить
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {existingFiles.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg divide-y">
                  {existingFiles.map((filePath) => (
                    <div key={filePath} className="flex items-center justify-between px-4 py-2">
                      <span className="text-sm text-gray-700 truncate">
                        {filePath.split('/').pop()}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setExistingFiles((prev) => prev.filter((path) => path !== filePath));
                          setFilesToDelete((prev) =>
                            prev.includes(filePath) ? prev : [...prev, filePath]
                          );
                        }}
                        className="text-red-500 hover:text-red-600 text-sm flex items-center gap-1"
                      >
                        <FiTrash2 />
                        Удалить
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Категория
            </label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Например: Анонсы, Волонтёрство, Экология"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Город
            </label>
            <select
              value={formData.cityId}
              onChange={(e) => {
                const selectedCity = cities.find(
                  (city) => String(city.id) === e.target.value
                );
                setFormData({
                  ...formData,
                  cityId: e.target.value,
                  cityName: selectedCity?.name || '',
                });
              }}
              disabled={citiesLoading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="">
                {citiesLoading ? 'Загрузка...' : 'Не выбран'}
              </option>
              {cities.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.name}
                </option>
              ))}
            </select>
            {citiesError && (
              <p className="text-xs text-red-500 mt-1">{citiesError}</p>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              <FiSave />
              Сохранить
            </button>
          </div>
        </form>
      </div>

      {/* Модальное окно для редактирования новости */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-800">
                  Редактировать новость
                </h3>
                <button
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditRequest('');
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FiX className="text-xl text-gray-600" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ваш запрос
                </label>
                <textarea
                  value={editRequest}
                  onChange={(e) => setEditRequest(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows="3"
                  placeholder="Опишите, что нужно изменить в тексте..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Действие
                </label>
                <select
                  value={editAction}
                  onChange={(e) => setEditAction(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value="Длиннее">Длиннее</option>
                  <option value="короче">Короче</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditRequest('');
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="button"
                  onClick={handleEditNews}
                  disabled={isEditing}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isEditing ? 'Обработка...' : 'Перегенерировать'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};