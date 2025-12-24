// src/pages/RegisterPage.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { cityService } from '../services/cityService'; 
import { FiUser, FiUsers, FiMail, FiLock, FiMapPin } from 'react-icons/fi';

const RegisterPage = () => {
  const { registerUser, login } = useAuth(); 
  const navigate = useNavigate();

  const [allCities, setAllCities] = useState([]);
  const [citiesLoading, setCitiesLoading] = useState(true);

  useEffect(() => {
    const fetchCities = async () => {
      const data = await cityService.getAllCities();
      const list = Array.isArray(data) ? data : (data.data || []);
      setAllCities(list);
      setCitiesLoading(false);
    };
    fetchCities();
  }, []);

  const [userType, setUserType] = useState('user');
  const [formData, setFormData] = useState({
    email: '', password: '', confirmPassword: '', name: '', city: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.password || !formData.name || !formData.city) {
      setError('Заполните все поля');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }
    if (formData.password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов');
      return;
    }

    if (userType === 'nko') {
      navigate('/register/nko', { state: { ...formData } });
      return;
    }

    setIsLoading(true);
    
    const result = await registerUser(formData.email, formData.password, formData.city, formData.name);

    if (result.success) {
      try {
        const loginResult = await login(formData.email, formData.password);
        setIsLoading(false);
        if (loginResult.success) navigate('/');
        else navigate('/login', { state: { message: 'Успешно! Войдите вручную.' } });
      } catch (loginError) {
        setIsLoading(false);
        navigate('/login', { state: { message: 'Успешно! Войдите вручную.' } });
      }
    } else {
      setIsLoading(false);
      setError(result.message || 'Ошибка регистрации');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 py-12 px-4">
      {/* Стили анимаций */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up { animation: fadeInUp 0.6s ease-out forwards; opacity: 0; }
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-300 { animation-delay: 0.3s; }
        .delay-400 { animation-delay: 0.4s; }
      `}</style>

      <div className="container mx-auto max-w-2xl">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden animate-fade-in-up">
          {/* Заголовок */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-8 text-white">
            <h1 className="text-3xl font-bold mb-2">Регистрация</h1>
            <p className="text-blue-100">Присоединяйтесь к платформе "Добрые дела Росатома"</p>
          </div>

          <div className="p-8">
            {/* Выбор типа регистрации */}
            <div className="mb-8 animate-fade-in-up delay-100">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Кто вы?
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setUserType('user')}
                  className={`p-6 rounded-xl border-2 transition-all transform duration-200 ${
                    userType === 'user'
                      ? 'border-blue-600 bg-blue-50 scale-[1.02] shadow-md'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <FiUser className={`text-4xl mx-auto mb-3 ${
                    userType === 'user' ? 'text-blue-600' : 'text-gray-400'
                  }`} />
                  <h3 className="font-semibold text-gray-800 mb-1">Пользователь</h3>
                  <p className="text-sm text-gray-600">Хочу участвовать в мероприятиях</p>
                </button>

                <button
                  type="button"
                  onClick={() => setUserType('nko')}
                  className={`p-6 rounded-xl border-2 transition-all transform duration-200 ${
                    userType === 'nko'
                      ? 'border-blue-600 bg-blue-50 scale-[1.02] shadow-md'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <FiUsers className={`text-4xl mx-auto mb-3 ${
                    userType === 'nko' ? 'text-blue-600' : 'text-gray-400'
                  }`} />
                  <h3 className="font-semibold text-gray-800 mb-1">Представитель НКО</h3>
                  <p className="text-sm text-gray-600">Представляю организацию</p>
                </button>
              </div>
            </div>

            {/* Форма */}
            <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in-up delay-200">
              {/* Имя */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ваше имя
                </label>
                <div className="relative group">
                  <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                    placeholder="Иван Иванов"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative group">
                  <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                    placeholder="your@email.com"
                    required
                  />
                </div>
              </div>

              {/* Город */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ваш город
                </label>
                <div className="relative group">
                  <FiMapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  <select
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    disabled={citiesLoading}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 transition-all outline-none bg-white"
                    required
                  >
                    <option value="">{citiesLoading ? 'Загрузка...' : 'Выберите город'}</option>
                    {allCities.map((city) => (
                      <option key={city.id} value={city.name}>
                        {city.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Пароль */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Пароль
                </label>
                <div className="relative group">
                  <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                    placeholder="Минимум 6 символов"
                    required
                  />
                </div>
              </div>

              {/* Подтверждение пароля */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Подтвердите пароль
                </label>
                <div className="relative group">
                  <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                    placeholder="Повторите пароль"
                    required
                  />
                </div>
              </div>

              {/* Ошибка */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 animate-fade-in-up">
                  <p className="text-red-800 text-sm text-center">{error}</p>
                </div>
              )}

              {/* Кнопка */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-50 transform hover:scale-[1.02]"
              >
                {isLoading ? 'Обработка...' : userType === 'nko' ? 'Продолжить' : 'Зарегистрироваться'}
              </button>
            </form>

            {/* Ссылка на вход */}
            <p className="mt-6 text-center text-gray-600 animate-fade-in-up delay-300">
              Уже есть аккаунт?{' '}
              <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium hover:underline">
                Войти
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;