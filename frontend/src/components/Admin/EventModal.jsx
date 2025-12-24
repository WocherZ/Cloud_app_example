// src/components/admin/EventModal.jsx
import React, { useState, useEffect } from 'react';
import { FiX, FiUpload, FiTrash2, FiCalendar, FiClock, FiEdit2, FiPlus } from 'react-icons/fi';
import { uploadEventImage, deleteEventImage } from '../../services/AdminAPI';
import { getFileUrl, handleImageError } from '../../utils/apiUtils';
import { usePublic } from '../../contexts/PublicContext';

// Вспомогательная функция для форматирования даты под input datetime-local
// Превращает "2025-01-21T15:30:00Z" или Date object в "2025-01-21T15:30"
const formatDateForInput = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  
  // Проверка на валидность даты
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
  // Проверка на валидность
  if (isNaN(date.getTime())) return null;
  // Конвертируем в ISO строку (например: 2025-01-21T15:30:00.000Z)
  return date.toISOString();
};


export const EventModal = ({ event, onSave, onClose }) => {
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
    images: [],
    organization_id: 0,
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Списки для выпадающих меню (лучше получать их из API, но пока хардкод)
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

  // Эффект для заполнения формы при открытии редактирования
  useEffect(() => {
    if (event) {
      // Ищем дату в разных возможных полях
      const rawDate = event.event_datetime || event.event_date || event.date;
      const rawDeadline = event.registration_deadline;

      setFormData({
        title: event.title || '',
        description: event.description || '',
        full_description: event.full_description || '',
        // Форматируем даты специально для input
        event_datetime: formatDateForInput(rawDate),
        registration_deadline: formatDateForInput(rawDeadline),
        
        address: event.address || event.location || '',
        type_event_id: event.type_event_id || 0,
        type_event_name: event.type_event_name || '',
        category_event_id: event.category_event_id || 0,
        category_event_name: event.category_event_name || '',
        quantity_participant: event.quantity_participant || 0,
        images: event.images || [],
        organization_id: event.organization_id || 0,
      });

      // Установить превью существующего изображения
      // Проверяем массив images, url, image_url или image
      const existingImage = (event.images && event.images.length > 0) ? event.images[0] : (event.image || event.image_url);
      
      if (existingImage) {
        setImagePreview(getFileUrl(existingImage));
      }
    }
  }, [event]);

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

  const handleOrganizationChange = (e) => {
    const selectedId = parseInt(e.target.value);
    setFormData((prev) => ({
      ...prev,
      organization_id: selectedId,
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

  const handleRemoveImage = async () => {
    if (event?.id && formData.images.length > 0) {
      if(window.confirm('Вы уверены, что хотите удалить текущее изображение?')) {
        const imagePath = formData.images[0];
        const result = await deleteEventImage(event.id, imagePath);
        if (result.success) {
          setFormData((prev) => ({ ...prev, images: [] }));
          setImagePreview(null);
        } else {
          alert(result.message || 'Ошибка удаления изображения');
        }
      }
    } else {
      // Если это просто превью загружаемого файла (еще не сохранено)
      setImageFile(null);
      setImagePreview(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Подготовка данных для API
      // Важно: конвертируем строки из инпутов в форматы, которые ждет Swagger
      const apiData = {
        ...formData,
        // 1. Конвертируем даты в ISO формат
        event_datetime: formatDateForApi(formData.event_datetime),
        registration_deadline: formatDateForApi(formData.registration_deadline),
        
        // 2. Убеждаемся, что числа это числа (input type="number" возвращает строку)
        quantity_participant: parseInt(formData.quantity_participant) || 0,
        type_event_id: parseInt(formData.type_event_id) || 0,
        category_event_id: parseInt(formData.category_event_id) || 0,
        organization_id: parseInt(formData.organization_id) || 0,
      };

      // Если дедлайн пустой, удаляем поле или шлем null (зависит от бэка, попробуем null)
      if (!formData.registration_deadline) {
        apiData.registration_deadline = null;
      }

      console.log('Отправляемые данные:', apiData); // Для отладки в консоли

      // 1. Сохраняем основные данные события
      const savedEvent = await onSave(apiData);
      
      const targetEventId = savedEvent?.id || event?.id;

      // 2. Загрузка изображения (остается без изменений)
      if (imageFile && targetEventId) {
        setUploadingImage(true);
        const uploadResult = await uploadEventImage(targetEventId, imageFile);
        setUploadingImage(false);
        
        if (!uploadResult.success) {
          alert(`Событие сохранено, но ошибка загрузки изображения: ${uploadResult.message}`);
        }
      }

      onClose();
    } catch (error) {
      console.error('Ошибка при сохранении:', error);
      // Если ошибка от сервера содержит детали
      const errorMessage = error.response?.data?.detail 
        ? JSON.stringify(error.response.data.detail) 
        : error.message;
      alert('Ошибка сохранения: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-8 animate-fade-in-up">
        {/* Шапка */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex items-center justify-between rounded-t-2xl z-10 shadow-md">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            {event ? <FiEdit2 className="text-blue-200" /> : <FiPlus className="text-blue-200" />}
            {event ? 'Редактировать событие' : 'Создать событие'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <FiX className="text-2xl" />
          </button>
        </div>

        {/* Форма */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[calc(90vh-120px)] overflow-y-auto">
          
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
                <div className="relative">
                  <FiClock className="absolute top-3.5 left-3 text-gray-400 hidden" /> 
                  {/* Иконку можно поменять на MapPin, но нужен импорт */}
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
                  Организатор *
                </label>
                <select
                  value={formData.organization_id}
                  onChange={handleOrganizationChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value={0}>Выберите НКО</option>
                  {nkoList.map((nko) => (
                    <option key={nko.id} value={nko.id}>
                      {nko.name || nko.organization_name}
                    </option>
                  ))}
                </select>
              </div>
          </div>

          {/* Кнопки */}
          <div className="flex gap-4 pt-4 border-t sticky bottom-0 bg-white z-10 pb-2">
            <button
              type="button"
              onClick={onClose}
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
                  Сохранение...
                </>
              ) : (
                'Сохранить'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};