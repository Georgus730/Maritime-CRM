import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { LanguageProvider } from './contexts/LanguageContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './layouts/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import SailorsPage from './pages/SailorsPage';
import SailorDetailPage from './pages/SailorDetailPage';
import CompaniesPage from './pages/CompaniesPage';
import VacanciesPage from './pages/VacanciesPage';
import ContractsPage from './pages/ContractsPage';
import PipelinePage from './pages/PipelinePage';
import SettingsPage from './pages/SettingsPage';
import './App.css';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-maritime-deep flex items-center justify-center">
        <div className="text-primary text-xl">Загрузка...</div>
      </div>
    );
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={
        <PrivateRoute>
          <Layout>
            <DashboardPage />
          </Layout>
        </PrivateRoute>
      } />
      <Route path="/sailors" element={
        <PrivateRoute>
          <Layout>
            <SailorsPage />
          </Layout>
        </PrivateRoute>
      } />
      <Route path="/sailors/:id" element={
        <PrivateRoute>
          <Layout>
            <SailorDetailPage />
          </Layout>
        </PrivateRoute>
      } />
      <Route path="/companies" element={
        <PrivateRoute>
          <Layout>
            <CompaniesPage />
          </Layout>
        </PrivateRoute>
      } />
      <Route path="/vacancies" element={
        <PrivateRoute>
          <Layout>
            <VacanciesPage />
          </Layout>
        </PrivateRoute>
      } />
      <Route path="/contracts" element={
        <PrivateRoute>
          <Layout>
            <ContractsPage />
          </Layout>
        </PrivateRoute>
      } />
      <Route path="/pipeline" element={
        <PrivateRoute>
          <Layout>
            <PipelinePage />
          </Layout>
        </PrivateRoute>
      } />
      <Route path="/settings" element={
        <PrivateRoute>
          <Layout>
            <SettingsPage />
          </Layout>
        </PrivateRoute>
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-maritime-deep">
            <AppRoutes />
            <Toaster 
              position="top-right" 
              theme="dark"
              toastOptions={{
                style: {
                  background: '#0F172A',
                  border: '1px solid #1E293B',
                  color: '#E2E8F0',
                }
              }}
            />
          </div>
        </Router>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;

