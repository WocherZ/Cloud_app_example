// src/pages/RegistrationSuccessPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { FiCheckCircle, FiMail, FiHome } from 'react-icons/fi';

const RegistrationSuccessPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-12 text-center">
          {/* Иконка успеха */}
          <div className="mb-8">
            <div className="mx-auto w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
              <FiCheckCircle className="text-green-600 text-6xl" />
            </div>
          </div>

          {/* Заголовок */}
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            Заявка успешно отправлена!
          </h1>

          {/* Описание */}
          <div className="mb-8 space-y-4">
            <p className="text-lg text-gray-600">
              Ваша заявка на регистрацию представителя НКО отправлена на модерацию.
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <div className="flex items-start gap-3 text-left">
                <FiMail className="text-blue-600 text-2xl mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Что дальше?</h3>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li>• Вы получите email с подтверждением получения заявки</li>
                    <li>• Администратор рассмотрит вашу заявку в течение 3 рабочих дней</li>
                    <li>• Решение о регистрации придет на указанный email</li>
                    <li>• После одобрения вы сможете войти в систему</li>
                  </ul>
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-500">
              Проверьте папку "Спам", если письмо не пришло в течение нескольких минут
            </p>
          </div>

          {/* Кнопки */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl"
            >
              <FiHome />
              На главную
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-50 rounded-lg font-semibold transition-all"
            >
              Войти в систему
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistrationSuccessPage;
