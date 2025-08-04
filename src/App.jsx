import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import HomeScreen from './components/HomeScreen';
import Wayfinding from './components/Wayfinding';
import FAQ from './components/FAQ';
import QRGenerator from './components/QRGenerator';
import Announcements from './components/Announcements';
import AdminPanel from './components/AdminPanel';
import AccessibilityPanel from './components/AccessibilityPanel';
import { AppProvider } from './context/AppContext';
import IdleTimer from './components/IdleTimer';
import './App.css';

// Wrapper component to handle route animations properly
const AnimatedRoutes = () => {
  const location = useLocation();
  
  // Use key to force re-render on route changes
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.key || location.pathname}>
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
  );
};

function App() {
  const [isKioskMode, setIsKioskMode] = useState(true);

  useEffect(() => {
    // Enable fullscreen on load for kiosk mode
    if (isKioskMode && document.documentElement.requestFullscreen) {
      try {
        document.documentElement.requestFullscreen().catch(err => {
          console.log("Fullscreen error:", err);
        });
      } catch (error) {
        console.log("Error requesting fullscreen:", error);
      }
    }
    
    // Ensure the app knows it should use hash-based routing
    console.log("App initialized with HashRouter");
  }, [isKioskMode]);

  return (
    <AppProvider>
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
          <IdleTimer />
          <AnimatedRoutes />
        </div>
      </Router>
    </AppProvider>
  );
}

export default App;