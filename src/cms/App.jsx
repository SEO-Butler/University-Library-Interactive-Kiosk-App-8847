import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, RequireAuth } from './auth';
import { ToastProvider } from './components/Toast';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AnnouncementsPage from './pages/AnnouncementsPage';
import FaqsPage from './pages/FaqsPage';
import QrLinksPage from './pages/QrLinksPage';
import MapPage from './pages/MapPage';
import MediaPage from './pages/MediaPage';
import SettingsPage from './pages/SettingsPage';
import UsersPage from './pages/UsersPage';
import AccountPage from './pages/AccountPage';

export default function CmsApp() {
  return (
    <ToastProvider>
      <AuthProvider>
        <HashRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/"
              element={
                <RequireAuth>
                  <Layout />
                </RequireAuth>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="announcements" element={<AnnouncementsPage />} />
              <Route path="faqs" element={<FaqsPage />} />
              <Route path="qr-links" element={<QrLinksPage />} />
              <Route path="map" element={<MapPage />} />
              <Route path="media" element={<MediaPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route
                path="users"
                element={
                  <RequireAuth role="admin">
                    <UsersPage />
                  </RequireAuth>
                }
              />
              <Route path="account" element={<AccountPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </HashRouter>
      </AuthProvider>
    </ToastProvider>
  );
}
