// src/pages/CreateEventPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiUpload, FiTrash2, FiCalendar, FiClock } from 'react-icons/fi';
import { createEvent, uploadEventImage } from '../services/AdminAPI';
import { getFileUrl, handleImageError } from '../utils/apiUtils';
import { useAuth } from '../contexts/AuthContext';
import { usePublic } from '../contexts/PublicContext';

// Вспомогательная функция для форматирования даты под input datetime-local
const formatDateForInput = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  
  if (isNaN(date.getTime())) return '';

  const pad = (num) => num.toString().padStart(2, '0');
  
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());

  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const formatDateForApi = (dateString) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return null;
  return date.toISOString();
};

const CreateEventPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { nkoList } = usePublic();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    full_description: '',
    event_datetime: '',
    registration_deadline: '',
    address: '',
    type_event_id: 0,
    type_event_name: '',
    category_event_id: 0,
    category_event_name: '',
    quantity_participant: 0,
    organization_id: user?.organization_id || 0,
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState('');

  // Списки для выпадающих меню
  const eventTypes = [
    { id: 1, name: 'Волонтерство' },
    { id: 2, name: 'Образование' },
    { id: 3, name: 'Культура' },
  ];

  const eventCategories = [
    { id: 1, name: 'Экология' },
    { id: 2, name: 'Социальная помощь' },
    { id: 3, name: 'Спорт' },
  ];

  // Устанавливаем organization_id при загрузке и проверяем наличие организации
  useEffect(() => {
    if (user?.organization_id) {
      setFormData(prev => ({
        ...prev,
        organization_id: user.organization_id
      }));
    } else {
      // Если у пользователя нет организации, показываем ошибку
      setError('У вас нет привязанной организации. Обратитесь к администратору.');
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleTypeChange = (e) => {
    const selectedId = parseInt(e.target.value);
    const selectedType = eventTypes.find(t => t.id === selectedId);
    setFormData((prev) => ({
      ...prev,
      type_event_id: selectedId,
      type_event_name: selectedType?.name || '',
    }));
  };

  const handleCategoryChange = (e) => {
    const selectedId = parseInt(e.target.value);
    const selectedCategory = eventCategories.find(c => c.id === selectedId);
    setFormData((prev) => ({
      ...prev,
      category_event_id: selectedId,
      category_event_name: selectedCategory?.name || '',
    }));
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Проверяем наличие организации у пользователя
      if (!user?.organization_id) {
        setError('У вас нет привязанной организации. Обратитесь к администратору.');
        setLoading(false);
        return;
      }

      // Проверяем обязательные поля
      if (!formData.title || !formData.description || !formData.event_datetime) {
        setError('Заполните все обязательные поля');
        setLoading(false);
        return;
      }

      // Подготовка данных для API
      // Используем organization_id из user, а не из formData
      const apiData = {
        title: formData.title,
        description: formData.description,
        full_description: formData.full_description,
        address: formData.address,
        // Конвертируем даты в ISO формат
        event_datetime: formatDateForApi(formData.event_datetime),
        registration_deadline: formatDateForApi(formData.registration_deadline),
        
        // Убеждаемся, что числа это числа
        quantity_participant: parseInt(formData.quantity_participant) || 0,
        type_event_id: parseInt(formData.type_event_id) || 0,
        category_event_id: parseInt(formData.category_event_id) || 0,
        // Используем organization_id из user
        organization_id: user.organization_id,
      };

      // Если дедлайн пустой, отправляем null
      if (!formData.registration_deadline) {
        apiData.registration_deadline = null;
      }

      // Сохраняем основные данные события
      const result = await createEvent(apiData);
      
      if (!result.success) {
        setError(result.message || 'Ошибка создания события');
        setLoading(false);
        return;
      }

      const targetEventId = result.data?.id;

      // Загрузка изображения
      if (imageFile && targetEventId) {
        setUploadingImage(true);
        const uploadResult = await uploadEventImage(targetEventId, imageFile);
        setUploadingImage(false);
        
        if (!uploadResult.success) {
          alert(`Событие создано, но ошибка загрузки изображения: ${uploadResult.message}`);
        }
      }

      // Успешно создано - перенаправляем на профиль НКО
      navigate('/nko-profile', { 
        state: { 
          message: 'Событие успешно создано! Оно будет отправлено на модерацию.' 
        } 
      });
    } catch (error) {
      console.error('Ошибка при создании события:', error);
      const errorMessage = error.response?.data?.detail 
        ? JSON.stringify(error.response.data.detail) 
        : error.message || 'Неизвестная ошибка';
      setError('Ошибка сохранения: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Заголовок */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/nko-profile')}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4 transition-colors font-medium"
          >
            <FiArrowLeft />
            <span>Назад к профилю НКО</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-800">Создание события</h1>
          <p className="text-gray-600 mt-2">Заполните форму для создания нового события</p>
        </div>

        {/* Форма */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Ошибка */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Левая колонка: Изображение */}
              <div className="lg:col-span-1 space-y-3">
                <label className="block text-sm font-semibold text-gray-700">
                  Обложка события
                </label>
                
                {imagePreview ? (
                  <div className="relative rounded-xl overflow-hidden group border border-gray-200 shadow-sm">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      onError={handleImageError}
                      className="w-full h-48 lg:h-64 object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="p-3 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors shadow-lg transform hover:scale-110"
                        title="Удалить изображение"
                      >
                        <FiTrash2 className="text-xl" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-48 lg:h-64 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all">
                    <FiUpload className="text-4xl text-gray-400 mb-2" />
                    <span className="text-sm font-medium text-gray-600">Загрузить фото</span>
                    <span className="text-xs text-gray-400 mt-1">JPG, PNG до 5MB</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Правая колонка: Основные поля */}
              <div className="lg:col-span-2 space-y-4">
                {/* Название */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Название события *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                    placeholder="Например: Благотворительный забег"
                  />
                </div>

                {/* Краткое описание */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Краткое описание *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    required
                    rows={2}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                    placeholder="Что будет происходить (отображается на карточке)"
                  />
                </div>

                {/* Адрес */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Адрес проведения
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                    placeholder="Город, улица, дом"
                  />
                </div>
              </div>
            </div>

            {/* Полное описание */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Полное описание
              </label>
              <textarea
                name="full_description"
                value={formData.full_description}
                onChange={handleChange}
                rows={5}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                placeholder="Подробная программа мероприятия, условия участия и т.д."
              />
            </div>

            {/* Сетка: Дата, Тип, Организация */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  <FiCalendar className="inline mr-2 text-blue-600" />
                  Дата и время начала *
                </label>
                <input
                  type="datetime-local"
                  name="event_datetime"
                  value={formData.event_datetime}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  <FiClock className="inline mr-2 text-red-500" />
                  Дедлайн регистрации
                </label>
                <input
                  type="datetime-local"
                  name="registration_deadline"
                  value={formData.registration_deadline}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Тип события
                </label>
                <select
                  value={formData.type_event_id}
                  onChange={handleTypeChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value={0}>Не выбрано</option>
                  {eventTypes.map((type) => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Категория
                </label>
                <select
                  value={formData.category_event_id}
                  onChange={handleCategoryChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value={0}>Не выбрано</option>
                  {eventCategories.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Участников (0 = безлимит)
                </label>
                <input
                  type="number"
                  name="quantity_participant"
                  value={formData.quantity_participant}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Организатор
                </label>
                <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700">
                  {user?.organization_id ? (
                    <div className="flex items-center justify-between">
                      <span className="font-medium">
                        {nkoList.find(n => n.id === user.organization_id)?.organization_name || 'Ваша организация'}
                      </span>
                      <span className="text-xs text-gray-500 bg-green-100 text-green-700 px-2 py-1 rounded">
                        Автоматически
                      </span>
                    </div>
                  ) : (
                    <span className="text-gray-500 italic">Организация не найдена</span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Событие будет создано от имени вашей организации
                </p>
              </div>
            </div>

            {/* Кнопки */}
            <div className="flex gap-4 pt-4 border-t">
              <button
                type="button"
                onClick={() => navigate('/nko-profile')}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={loading || uploadingImage}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-medium transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
              >
                {loading || uploadingImage ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Создание...
                  </>
                ) : (
                  'Создать событие'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateEventPage;

