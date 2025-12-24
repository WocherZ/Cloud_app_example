// src/pages/UserProfilePage.jsx
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCity } from '../contexts/CityContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { adminService } from '../services/statisticService';
import { ProfileHeader } from '../components/profile/ProfileHeader';
import { ProfileInfoCard } from '../components/profile/ProfileInfoCard';
import { MyEventsCard } from '../components/profile/MyEventsCard';
import { FavoritesCard } from '../components/profile/FavoritesCard';
import { ActivityStatsCard } from '../components/profile/ActivityStatsCard';
import { NkoManagementCard } from '../components/profile/NkoManagementCard';
import { AdminPanelCard } from '../components/profile/AdminPanelCard';
import { LogoutButton } from '../components/profile/LogoutButton';
import { QuickActionsCard } from '../components/profile/QuickActionsCard';
import { ModeratorPanelCard } from '../components/profile/ModeratorPanelCard'; 

const UserProfilePage = () => {
  const { 
    user, isLoading, logout, 
    updateUserCity, 
    isAdmin, isNkoRepresentative, isModerator // <--- Добавили isModerator
  } = useAuth();
  
  const { cities } = useCity();
  
  const { 
    favoriteNews, favoriteEvents, favoriteKnowledgeBase, favoriteNkos,
    attendingEvents, 
    toggleAttendingEvent 
  } = useFavorites();

  const [adminStats, setAdminStats] = useState(null);

  // Загрузка статистики для админа
  useEffect(() => {
    let isMounted = true;
    if (isAdmin) {
      const fetchAdminStats = async () => {
        try {
          const data = await adminService.getStatistics();
          if (isMounted) {
            setAdminStats(data);
          }
        } catch (e) {
          console.error("Failed to load admin stats", e);
        }
      };
      fetchAdminStats();
    }
    return () => { isMounted = false; };
  }, [isAdmin]);

  const handleUpdateCity = async (newCityName) => {
    return await updateUserCity(newCityName);
  };

  const handleCancelEvent = (eventId) => {
    toggleAttendingEvent(eventId);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const totalFavorites = favoriteNews.length + favoriteEvents.length + favoriteKnowledgeBase.length + favoriteNkos.length;

  return (
    <div className="min-h-screen bg-gray-50/50 py-8">
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up { animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-300 { animation-delay: 0.3s; }
      `}</style>

      <div className="container mx-auto px-4 max-w-7xl">
        
        <div className="animate-fade-in-up">
          <ProfileHeader user={user} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
          
          {/* ЛЕВАЯ КОЛОНКА */}
          <div className="lg:col-span-4 space-y-6 animate-fade-in-up delay-100">
            <ProfileInfoCard
              user={user}
              cities={cities}
              onUpdateCity={handleUpdateCity}
            />
            <ActivityStatsCard
              attendingEventsCount={attendingEvents.length}
              favoritesCount={totalFavorites}
            />
            <QuickActionsCard />
            <LogoutButton onLogout={logout} />
          </div>

          {/* ПРАВАЯ КОЛОНКА */}
          <div className="lg:col-span-8 space-y-6 animate-fade-in-up delay-200">
            
            {/* --- ПАНЕЛИ УПРАВЛЕНИЯ --- */}
            
            {/* Если НКО */}
            {isNkoRepresentative && (
              <div className="transform hover:-translate-y-1 transition-transform duration-300">
                <NkoManagementCard nkoData={{ eventsCount: 5, participantsCount: 124 }} />
              </div>
            )}

            {/* Если Модератор */}
            {isModerator && (
              <div className="transform hover:-translate-y-1 transition-transform duration-300">
                <ModeratorPanelCard />
              </div>
            )}

            {/* Если Админ */}
            {isAdmin && (
              <div className="transform hover:-translate-y-1 transition-transform duration-300">
                <AdminPanelCard stats={adminStats} />
              </div>
            )}
            
            {/* ------------------------ */}

            <MyEventsCard
              events={attendingEvents} 
              onCancelEvent={handleCancelEvent}
            />

            <FavoritesCard
              events={favoriteEvents}
              news={favoriteNews}
              kb={favoriteKnowledgeBase}
              nkos={favoriteNkos}
            />

            {attendingEvents.length === 0 && totalFavorites === 0 && !isAdmin && !isModerator && !isNkoRepresentative && (
              <div className="mt-8 p-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 text-center animate-fade-in-up delay-300">
                <h3 className="text-xl font-bold text-gray-800 mb-3">
                  👋 Добро пожаловать, {user.name}!
                </h3>
                <p className="text-gray-600 mb-6 max-w-lg mx-auto">
                  Ваш профиль пока выглядит немного пустым. Начните своё путешествие: запишитесь на события или добавьте интересные материалы в избранное.
                </p>
                <div className="flex justify-center gap-4">
                  <a href="/calendar" className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium shadow-lg shadow-blue-200">
                    Найти события
                  </a>
                  <a href="/news" className="px-6 py-2.5 bg-white text-blue-600 border border-blue-200 rounded-xl hover:bg-blue-50 transition-colors font-medium">
                    Читать новости
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;