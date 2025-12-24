// src/pages/NkoApplicationForm.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiHome, FiMapPin, FiMail, FiPhone, FiFileText, FiGlobe, FiUpload } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { getNkoCategories } from '../mock/nkoData'; 

const NkoApplicationForm = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { registerNewNkoApplication } = useAuth(); 
  const userData = location.state || {};

  useEffect(() => {
    if (!userData.email || !userData.password) {
      console.warn("User data is missing, redirecting to register page.");
      navigate('/register');
    }
  }, [userData, navigate]);
  
  const [formData, setFormData] = useState({
    organizationName: '',
    category: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    foundedYear: '',
    volunteersCount: '',
  });

  const [logo, setLogo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const categories = getNkoCategories().filter(cat => cat !== 'Все категории');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogo(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Валидация обязательных полей
    if (!formData.organizationName || !formData.category || !formData.description || !formData.email) {
      setError('Заполните все обязательные поля, включая Email организации');
      return;
    }

    setIsLoading(true);

    // Подготовка данных для отправки
    const applicationData = {
      user_email: userData.email,
      user_password: userData.password,
      user_city: userData.city,
      user_name: userData.name,
      organization_name: formData.organizationName,
      category: formData.category,
      description: formData.description,
      nko_email: formData.email,
      address: formData.address || '',
      phone: formData.phone || '',
      website: formData.website || '',
      founded_year: formData.foundedYear || '',
      volunteers_count: formData.volunteersCount || ''
    };

    try {
      const result = await registerNewNkoApplication(applicationData, logo);
      
      setIsLoading(false);

      if (result.success) {
        navigate('/register/success', { 
          state: { message: 'Ваша заявка успешно отправлена на модерацию!' }
        });
      } else {
        setError(result.message || 'Ошибка отправки заявки');
      }
    } catch (err) {
      setIsLoading(false);
      setError('Произошла непредвиденная ошибка');
      console.error('Submit error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Заголовок */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-8 text-white">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-blue-100 hover:text-white mb-4 transition-colors"
            >
              <FiArrowLeft />
              <span>Назад</span>
            </button>
            <h1 className="text-3xl font-bold mb-2">Заявка на регистрацию новой НКО</h1>
            <p className="text-blue-100">Заполните информацию о вашей организации</p>
          </div>

          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Название организации */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Название организации <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FiHome className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    name="organizationName"
                    value={formData.organizationName}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Полное название организации"
                    required
                  />
                </div>
              </div>

              {/* Категория */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Направление деятельности <span className="text-red-500">*</span>
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Выберите категорию</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Описание */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Описание деятельности <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FiFileText className="absolute left-3 top-3 text-gray-400" />
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="4"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Кратко опишите деятельность вашей организации и роль волонтеров"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">2-3 предложения о том, чем занимается организация</p>
              </div>

              {/* Адрес */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Адрес офиса
                </label>
                <div className="relative">
                  <FiMapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="г. Ангарск, ул. Примерная, д. 1"
                  />
                </div>
              </div>

              {/* Телефон */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Контактный телефон
                </label>
                <div className="relative">
                  <FiPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="+7 (___) ___-__-__"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email организации <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="info@organization.ru"
                    required
                  />
                </div>
              </div>

              {/* Веб-сайт */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Веб-сайт
                </label>
                <div className="relative">
                  <FiGlobe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://organization.ru"
                  />
                </div>
              </div>

              {/* Год основания и количество волонтеров */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Год основания
                  </label>
                  <input
                    type="number"
                    name="foundedYear"
                    value={formData.foundedYear}
                    onChange={handleChange}
                    min="1900"
                    max={new Date().getFullYear()}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="2020"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Количество волонтеров
                  </label>
                  <input
                    type="number"
                    name="volunteersCount"
                    value={formData.volunteersCount}
                    onChange={handleChange}
                    min="0"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="50"
                  />
                </div>
              </div>

              {/* Логотип */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Логотип организации
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                    <FiUpload className="text-gray-600" />
                    <span className="text-gray-700">Выбрать файл</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="hidden"
                    />
                  </label>
                  {logo && (
                    <span className="text-sm text-gray-600">{logo.name}</span>
                  )}
                </div>
              </div>

              {/* Ошибка */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              {/* Информация */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-900">
                  <strong>Важно:</strong> После отправки заявки она будет рассмотрена администратором. 
                  Решение о регистрации придет на email <strong>{userData.email}</strong> в течение 3 рабочих дней.
                </p>
              </div>

              {/* Кнопка */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
              >
                {isLoading ? 'Отправка заявки...' : 'Отправить заявку на модерацию'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NkoApplicationForm;