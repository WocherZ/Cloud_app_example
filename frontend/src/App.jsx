// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CityProvider } from './contexts/CityContext';
import { AuthProvider } from './contexts/AuthContext';
import { FavoritesProvider } from './contexts/FavoritesContext';
import NkoRegistrationPage from './pages/NkoRegistrationPage';
import NkoApplicationForm from './pages/NkoApplicationForm';
import RegistrationSuccessPage from './pages/RegistrationSuccessPage';
import { PublicProvider } from './contexts/PublicContext';

// Импортируем страницы
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import UserProfilePage from './pages/UserProfilePage';
import NewsListPage from './pages/NewsListPage';
import NewsDetailPage from './pages/NewsDetailPage';
import CalendarPage from './pages/CalendarPage';
import EventDetailPage from './pages/EventDetailPage';
import FavoritesPage from './pages/FavoritesPage'; 
import Header from './components/Layout/Header';
import Footer from './components/Layout/Footer';
import KnowledgeBasePage from './pages/KnowledgeBasePage';
import KnowledgeBaseDetailPage from './pages/KnowledgeBaseDetailPage';
import NkoListPage from './pages/NkoListPage';
import NkoDetailPage from './pages/NkoDetailPage';
import AdminPage from './pages/AdminPage';
import ProtectedRoute from './components/ProtectedRoute';
import NkoProfilePage from './pages/NkoProfilePage';
import CreateEventPage from './pages/CreateEventPage';
import ModeratorPage from './pages/ModeratorPage.jsx';
import AiHelperPage from './pages/AiHelperPage';


function App() {
  return (
    <Router>
      <AuthProvider>
        <CityProvider>
          <FavoritesProvider> 
            <PublicProvider>
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex-grow">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/profile" element={<UserProfilePage />} />
                  <Route path="/favorites" element={<FavoritesPage />} /> {/* Новый маршрут */}
                  
                  {/* Маршруты для новостей */}
                  <Route path="/news" element={<NewsListPage />} />
                  <Route path="/news/:id" element={<NewsDetailPage />} />
                  
                  {/* Маршруты для календаря и событий */}
                  <Route path="/calendar" element={<CalendarPage />} />
                  <Route path="/events/:id" element={<EventDetailPage />} />

                  {/* Заглушки для других маршрутов */}
                  <Route path="/knowledge-base" element={<KnowledgeBasePage />} />
                  <Route path="/knowledge-base/:id" element={<KnowledgeBaseDetailPage />} />

                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/register/nko" element={<NkoRegistrationPage />} />
                  <Route path="/register/nko/new" element={<NkoApplicationForm />} />
                  <Route path="/register/success" element={<RegistrationSuccessPage />} />
                  <Route path="/nko" element={<NkoListPage />} />
                  <Route path="/nko/:id" element={<NkoDetailPage />} />
                  <Route path="/ai_helper" element={<AiHelperPage />} />

                  <Route path="/admin" element={
                    <ProtectedRoute roles={['admin', 'moderator']}>
                      <AdminPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/nko-profile" element={
                    <ProtectedRoute roles={['nko']}>
                      <NkoProfilePage />
                  </ProtectedRoute>
                  } />
                  <Route path="/nko/events/create" element={
                    <ProtectedRoute roles={['nko']}>
                      <CreateEventPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/moderator" element={
                    <ProtectedRoute roles={['moderator']}>
                      <ModeratorPage />
                    </ProtectedRoute>
                  } />
                </Routes>
              </main>
              <Footer />
            </div>
            </PublicProvider>
          </FavoritesProvider>
        </CityProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
