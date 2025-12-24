// src/pages/NkoRegistrationPage.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { FiSearch, FiPlus, FiArrowLeft, FiCheckCircle } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';

const NkoRegistrationPage = () => {
  const { getApprovedNkos, registerNkoRepresentative } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const userData = location.state || {};
  const [nkoList, setNkoList] = useState([]);
  const [filteredNko, setFilteredNko] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNko, setSelectedNko] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [listLoading, setListLoading] = useState(true); // Состояние для загрузки списка
  const [error, setError] = useState('');


  // Проверка наличия данных пользователя
  useEffect(() => {
    if (!userData.email || !userData.password || !userData.city) {
      navigate('/register');
    }
  }, [userData, navigate]);

  // Загрузка НКО по городу
    useEffect(() => {
    const fetchNkos = async () => {
      setListLoading(true);
      const result = await getApprovedNkos();
      console.log("Данные, полученные от API:", result.data);
      console.log("Фильтруем по городу:", `"${userData.city}"`); 
      if (result.success) {
        // Фильтруем по городу на фронтенде
        const cityNko = result.data.filter(nko => nko.city_name === userData.city);
        console.log("Результат фильтрации:", cityNko);
        setNkoList(cityNko);
        setFilteredNko(cityNko);
      } else {
        setError('Не удалось загрузить список организаций.');
      }
      setListLoading(false);
    };

    fetchNkos();
  }, [getApprovedNkos, userData.city]);

  // Поиск
  useEffect(() => {
    if (searchTerm) {
      const filtered = nkoList.filter(nko =>
        (nko.organization_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (nko.category || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredNko(filtered);
    } else {
      setFilteredNko(nkoList);
    }
  }, [searchTerm, nkoList]);

  const handleSelectNko = async () => {
    if (!selectedNko) {
      setError('Выберите организацию');
      return;
    }

    setIsLoading(true);
    setError('');

    // Вызываем новую функцию из контекста, передавая данные пользователя и email НКО
    const result = await registerNkoRepresentative(userData, selectedNko.email);

    setIsLoading(false);

    if (result.success) {
      navigate('/login', { 
        state: { 
          message: 'Регистрация успешна! Ваша заявка отправлена на модерацию. Ответ придет на email.' 
        } 
      });
    } else {
      setError(result.message || 'Ошибка регистрации');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Заголовок */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-8 text-white">
            <button
              onClick={() => navigate('/register')}
              className="flex items-center gap-2 text-blue-100 hover:text-white mb-4 transition-colors"
            >
              <FiArrowLeft />
              <span>Назад</span>
            </button>
            <h1 className="text-3xl font-bold mb-2">Регистрация представителя НКО</h1>
            <p className="text-blue-100">Выберите вашу организацию в городе {userData.city}</p>
          </div>

          <div className="p-8">
            {/* Поиск */}
            <div className="mb-6">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
                <input
                  type="text"
                  placeholder="Поиск организации..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Список НКО */}
           <div className="mb-6">
  <h2 className="text-xl font-semibold text-gray-800 mb-4">
    Организации в вашем городе ({filteredNko.length})
  </h2>

  {listLoading ? (
    <div className="text-center py-8">
      <p>Загрузка организаций...</p>
    </div>
  ) : filteredNko.length === 0 ? (
    <div className="text-center py-8 bg-gray-50 rounded-xl">
      <p className="text-gray-500 mb-4">НКО в вашем городе не найдены</p>
    </div>
  ) : (
    <div className="space-y-3 max-h-96 overflow-y-auto">
      {filteredNko.map((nko) => (
        <button
          key={nko.email}
          onClick={() => setSelectedNko(nko)}
          className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
            selectedNko?.id === nko.id
              ? 'border-blue-600 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-800 mb-1">{nko.organization_name}</h3>
              <p className="text-sm text-gray-600 mb-2">{nko.category}</p>
              <p className="text-xs text-gray-500 line-clamp-2">{nko.description}</p>
            </div>
            {selectedNko?.id === nko.id && (
              <FiCheckCircle className="text-blue-600 text-2xl ml-3" />
            )}
          </div>
        </button>
      ))}
    </div>
  )}
</div>


            {/* Ошибка */}
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            {/* Кнопки */}
            <div className="space-y-3">
              <button
                onClick={handleSelectNko}
                disabled={!selectedNko || isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Отправка заявки...' : 'Подать заявку на представительство'}
              </button>

              <Link
                to="/register/nko/new"
                state={userData}
                className="w-full flex items-center justify-center gap-2 bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-50 py-3 rounded-lg font-semibold transition-all"
              >
                <FiPlus />
                Моей организации нет в списке
              </Link>
            </div>

            {/* Информация */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                <strong>Обратите внимание:</strong> После подачи заявки ваш аккаунт будет отправлен на модерацию. 
                Решение придет на указанный email в течение 3 рабочих дней.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NkoRegistrationPage;
