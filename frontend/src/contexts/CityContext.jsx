// src/contexts/CityContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { cityService } from '../services/cityService'; 

const CityContext = createContext(null);

export const CityProvider = ({ children }) => {
  const { user } = useAuth();
  
  // Этот список будет использоваться в ШАПКЕ сайта (фильтр)
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState(null);

  // 1. Загружаем ТОЛЬКО города с организациями
  useEffect(() => {
    const loadCities = async () => {
      try {
        // ИЗМЕНЕНИЕ: Загружаем города с НКО
        const data = await cityService.getCitiesWithOrganizations();
        const citiesList = Array.isArray(data) ? data : (data.data || []);
        setCities(citiesList);
      } catch (error) {
        console.error("Failed to load cities context", error);
      } finally {
        setLoading(false);
      }
    };

    loadCities();
  }, []);

  // 2. Логика авто-выбора города (остается прежней)
  useEffect(() => {
    if (!loading && cities.length > 0 && user && user.city_name) {
      const cityExists = cities.some(city => city.name === user.city_name);
      if (cityExists) {
        setSelectedCity(user.city_name);
      } else {
        setSelectedCity(null);
      }
    } else if (!user) {
      setSelectedCity(null);
    }
  }, [user, cities, loading]);

  const value = {
    selectedCity,
    setSelectedCity,
    cities, // <--- Тут теперь только города с НКО
    isLoadingCities: loading
  };

  return (
    <CityContext.Provider value={value}>
      {children}
    </CityContext.Provider>
  );
};

export const useCity = () => useContext(CityContext);