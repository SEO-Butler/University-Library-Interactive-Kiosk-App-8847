import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { useApp } from '../context/AppContext';
import LoadingSpinner from './common/LoadingSpinner';

const { FiMap, FiHelpCircle, FiQrCode, FiBell, FiSettings, FiClock, FiCalendar, FiRefreshCw } = FiIcons;

function HomeScreen() {
  const navigate = useNavigate();
  const { state, actions } = useApp();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    actions.updateActivity();
  }, [actions]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await actions.refreshData();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const navigationTiles = [
    {
      id: 'wayfinding',
      title: 'Library Map',
      subtitle: 'Find your way around',
      icon: FiMap,
      color: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600',
      path: '/wayfinding'
    },
    {
      id: 'faq',
      title: 'Help & FAQ',
      subtitle: 'Get answers quickly',
      icon: FiHelpCircle,
      color: 'bg-green-500',
      hoverColor: 'hover:bg-green-600',
      path: '/faq'
    },
    {
      id: 'qr',
      title: 'Quick Links',
      subtitle: 'QR codes for mobile',
      icon: FiQrCode,
      color: 'bg-purple-500',
      hoverColor: 'hover:bg-purple-600',
      path: '/qr-generator'
    },
    {
      id: 'announcements',
      title: 'News & Events',
      subtitle: 'Latest updates',
      icon: FiBell,
      color: 'bg-orange-500',
      hoverColor: 'hover:bg-orange-600',
      path: '/announcements'
    }
  ];

  const handleTileClick = (path) => {
    console.log("Navigating to", path);
    actions.updateActivity();
    // Force a small delay before navigation to ensure context updates are processed
    setTimeout(() => {
      navigate(path);
    }, 10);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
    exit: { opacity: 0 }
  };

  const tileVariants = {
    hidden: { y: 50, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100, damping: 15 } }
  };

  // Only show loading spinner if we're actually loading data from the API
  // and not just on initial render
  if (state.isLoading && state.initialLoadComplete === false) {
    return <LoadingSpinner message="Welcome to the Library Kiosk" />;
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={containerVariants}
      className={`min-h-screen p-8 ${state.accessibility.highContrast ? 'high-contrast' : ''} ${state.accessibility.largeText ? 'large-text' : ''}`}
    >
      {/* Header */}
      <motion.header variants={tileVariants} className="text-center mb-12 relative">
        <h1 className="text-6xl font-bold text-primary-800 mb-4">
          University Library
        </h1>
        <p className="text-2xl text-secondary-600 mb-8">
          Welcome! How can we help you today?
        </p>

        {/* Date and Time Display */}
        <div className="flex justify-center items-center space-x-8 text-lg text-secondary-500">
          <div className="flex items-center space-x-2">
            <SafeIcon icon={FiCalendar} className="text-primary-500" />
            <span>{format(currentTime, 'EEEE, MMMM do, yyyy')}</span>
          </div>
          <div className="flex items-center space-x-2">
            <SafeIcon icon={FiClock} className="text-primary-500" />
            <span>{format(currentTime, 'h:mm:ss a')}</span>
          </div>
        </div>

        {/* Refresh Button */}
        <button
          onClick={handleRefresh}
          className={`absolute top-0 right-0 text-primary-600 hover:text-primary-700 p-2 rounded-full transition-colors ${isRefreshing ? 'animate-spin' : ''}`}
          disabled={isRefreshing}
        >
          <SafeIcon icon={FiRefreshCw} className="text-xl" />
        </button>
      </motion.header>

      {state.error && (
        <div className="max-w-md mx-auto bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 text-center mb-8">
          <p>{state.error}</p>
          <button
            onClick={handleRefresh}
            className="mt-2 text-red-600 hover:text-red-800 font-medium"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Navigation Grid */}
      <motion.div
        variants={containerVariants}
        className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 mb-12"
      >
        {navigationTiles.map((tile) => (
          <motion.div
            key={tile.id}
            variants={tileVariants}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleTileClick(tile.path)}
            className={`${tile.color} ${tile.hoverColor} text-white rounded-3xl p-8 cursor-pointer shadow-xl transition-all duration-300 touch-button group`}
            role="button"
            tabIndex={0}
            aria-label={`Navigate to ${tile.title}`}
          >
            <div className="flex items-center space-x-6">
              <div className="bg-white bg-opacity-20 rounded-2xl p-6">
                <SafeIcon icon={tile.icon} className="text-5xl text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-3xl font-bold mb-2">{tile.title}</h3>
                <p className="text-xl opacity-90">{tile.subtitle}</p>
              </div>
              <div className="text-3xl opacity-60 group-hover:opacity-100 transition-opacity">
                →
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Quick Info Bar */}
      <motion.div
        variants={tileVariants}
        className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div className="space-y-2">
            <h4 className="font-semibold text-primary-800">Today's Hours</h4>
            <p className="text-secondary-600">7:00 AM - 11:00 PM</p>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold text-primary-800">WiFi Network</h4>
            <p className="text-secondary-600">University-WiFi</p>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold text-primary-800">Need Help?</h4>
            <p className="text-secondary-600">Front Desk: Ext. 2150</p>
          </div>
        </div>
      </motion.div>

      {/* Admin and Accessibility Buttons */}
      <div className="fixed bottom-8 right-8 flex flex-col space-y-4">
        <motion.button
          variants={tileVariants}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            actions.updateActivity();
            navigate('/admin');
          }}
          className="bg-gray-700 hover:bg-gray-800 text-white rounded-full p-4 shadow-lg transition-colors touch-button"
          aria-label="Admin Panel"
        >
          <SafeIcon icon={FiSettings} className="text-2xl" />
        </motion.button>
        <motion.button
          variants={tileVariants}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            actions.updateActivity();
            navigate('/accessibility');
          }}
          className="bg-primary-600 hover:bg-primary-700 text-white rounded-full p-4 shadow-lg transition-colors touch-button"
          aria-label="Accessibility Options"
        >
          <SafeIcon icon={FiHelpCircle} className="text-2xl" />
        </motion.button>
      </div>
    </motion.div>
  );
}

export default HomeScreen;