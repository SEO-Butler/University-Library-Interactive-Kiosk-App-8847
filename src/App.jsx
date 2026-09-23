import React, { Suspense, lazy } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import HomeScreen from './components/HomeScreen';
import Wayfinding from './components/Wayfinding';
import FAQ from './components/FAQ';
import Announcements from './components/Announcements';
import LoadingSpinner from './components/common/LoadingSpinner';
import { AppProvider } from './context/AppContext';
import IdleTimer from './components/IdleTimer';
import ErrorBoundary from './components/ErrorBoundary';
import KioskEnvironment from './components/KioskEnvironment';
import './App.css';

// Less-used screens load on demand to keep start-up parsing small on the Pi.
const QRGenerator = lazy(() => import('./components/QRGenerator'));
const AdminPanel = lazy(() => import('./components/AdminPanel'));
const AccessibilityPanel = lazy(() => import('./components/AccessibilityPanel'));

// Wrapper component to handle route animations properly
const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/wayfinding" element={<Wayfinding />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/qr-generator" element={<QRGenerator />} />
          <Route path="/announcements" element={<Announcements />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/accessibility" element={<AccessibilityPanel />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </Suspense>
  );
};

// Fullscreen is handled by Chromium's --kiosk flag (see deploy/pi), not by the page.
function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <Router>
          <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
            <KioskEnvironment />
            <IdleTimer />
            <AnimatedRoutes />
          </div>
        </Router>
      </AppProvider>
    </ErrorBoundary>
  );
}

export default App;
