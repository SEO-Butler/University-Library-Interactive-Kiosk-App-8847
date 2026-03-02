import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { useApp } from '../context/AppContext';
import LoadingSpinner from './common/LoadingSpinner';

const { FiMap, FiHelpCircle, FiQrCode, FiBell, FiSettings, FiClock, FiCalendar, FiRefreshCw, FiChevronRight, FiWifi, FiPhone, FiSun } = FiIcons;

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
      gradient: 'from-sky-500 to-blue-600',
      shadowColor: 'shadow-blue-500/25',
      iconBg: 'bg-white/20',
      path: '/wayfinding'
    },
    {
      id: 'faq',
      title: 'Help & FAQ',
      subtitle: 'Get answers quickly',
      icon: FiHelpCircle,
      gradient: 'from-emerald-500 to-teal-600',
      shadowColor: 'shadow-emerald-500/25',
      iconBg: 'bg-white/20',
      path: '/faq'
    },
    {
      id: 'qr',
      title: 'Quick Links',
      subtitle: 'QR codes for mobile',
      icon: FiQrCode,
      gradient: 'from-violet-500 to-purple-600',
      shadowColor: 'shadow-violet-500/25',
      iconBg: 'bg-white/20',
      path: '/qr-generator'
    },
    {
      id: 'announcements',
      title: 'News & Events',
      subtitle: 'Latest updates',
      icon: FiBell,
      gradient: 'from-amber-500 to-orange-600',
      shadowColor: 'shadow-amber-500/25',
      iconBg: 'bg-white/20',
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

  const headerVariants = {
    hidden: { y: -30, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 80, damping: 20, delay: 0.1 } }
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
      className={`min-h-screen p-6 md:p-8 flex flex-col ${state.accessibility.highContrast ? 'high-contrast' : ''} ${state.accessibility.largeText ? 'large-text' : ''}`}
    >
      {/* Hero Header */}
      <motion.header variants={headerVariants} className="text-center mb-10 relative pt-4">
        {/* Refresh Button */}
        <button
          onClick={handleRefresh}
          className={`absolute top-4 right-0 text-primary-500/70 hover:text-primary-600 p-3 rounded-full glass transition-all duration-300 hover:shadow-md ${isRefreshing ? 'animate-spin' : ''}`}
          disabled={isRefreshing}
          aria-label="Refresh data"
        >
          <SafeIcon icon={FiRefreshCw} className="text-xl" />
        </button>

        {/* Time Display - top accent bar */}
        <motion.div
          variants={tileVariants}
          className="inline-flex items-center gap-6 glass rounded-full px-8 py-3 mb-8 shadow-sm"
        >
          <div className="flex items-center gap-2 text-primary-700">
            <SafeIcon icon={FiCalendar} className="text-primary-500" />
            <span className="font-medium">{format(currentTime, 'EEEE, MMMM do')}</span>
          </div>
          <div className="w-px h-5 bg-primary-200" />
          <div className="flex items-center gap-2 text-primary-700">
            <SafeIcon icon={FiClock} className="text-primary-500" />
            <span className="font-semibold tabular-nums">{format(currentTime, 'h:mm a')}</span>
          </div>
        </motion.div>

        {/* Main heading */}
        <h1 className="text-5xl md:text-6xl font-extrabold mb-4 bg-gradient-to-r from-primary-800 via-primary-600 to-primary-800 bg-clip-text text-transparent leading-tight">
          University Library
        </h1>
        <p className="text-xl md:text-2xl text-secondary-500 font-light tracking-wide">
          Welcome! How can we help you today?
        </p>
      </motion.header>

      {state.error && (
        <div className="max-w-md mx-auto glass rounded-2xl p-4 text-center mb-8 border border-red-200/50">
          <p className="text-red-700">{state.error}</p>
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
        className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 mb-10 flex-1 w-full"
      >
        {navigationTiles.map((tile) => (
          <motion.div
            key={tile.id}
            variants={tileVariants}
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => handleTileClick(tile.path)}
            className={`relative bg-gradient-to-br ${tile.gradient} text-white rounded-3xl p-8 cursor-pointer shadow-xl ${tile.shadowColor} transition-all duration-300 touch-button group overflow-hidden`}
            role="button"
            tabIndex={0}
            aria-label={`Navigate to ${tile.title}`}
          >
            {/* Decorative background shapes */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/5 rounded-full translate-y-1/2 -translate-x-1/4" />

            <div className="relative flex items-center gap-6">
              <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-5 shadow-inner border border-white/20 group-hover:bg-white/25 transition-colors duration-300">
                <SafeIcon icon={tile.icon} className="text-4xl md:text-5xl text-white drop-shadow-sm" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-2xl md:text-3xl font-bold mb-1 tracking-tight">{tile.title}</h3>
                <p className="text-base md:text-lg text-white/80 font-light">{tile.subtitle}</p>
              </div>
              <div className="bg-white/10 rounded-full p-2 group-hover:bg-white/20 group-hover:translate-x-1 transition-all duration-300">
                <SafeIcon icon={FiChevronRight} className="text-2xl text-white/80 group-hover:text-white" />
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Quick Info Bar */}
      <motion.div
        variants={tileVariants}
        className="max-w-4xl mx-auto w-full glass-strong rounded-2xl shadow-lg p-6 mb-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div className="flex flex-col items-center gap-2">
            <div className="bg-primary-100 text-primary-600 rounded-xl p-2.5 mb-1">
              <SafeIcon icon={FiSun} className="text-xl" />
            </div>
            <h4 className="font-semibold text-primary-800 text-sm uppercase tracking-wider">Today's Hours</h4>
            <p className="text-secondary-600 font-medium">7:00 AM - 11:00 PM</p>
          </div>
          <div className="flex flex-col items-center gap-2 md:border-x md:border-primary-100/60 md:px-6">
            <div className="bg-violet-100 text-violet-600 rounded-xl p-2.5 mb-1">
              <SafeIcon icon={FiWifi} className="text-xl" />
            </div>
            <h4 className="font-semibold text-primary-800 text-sm uppercase tracking-wider">WiFi Network</h4>
            <p className="text-secondary-600 font-medium">University-WiFi</p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="bg-emerald-100 text-emerald-600 rounded-xl p-2.5 mb-1">
              <SafeIcon icon={FiPhone} className="text-xl" />
            </div>
            <h4 className="font-semibold text-primary-800 text-sm uppercase tracking-wider">Need Help?</h4>
            <p className="text-secondary-600 font-medium">Front Desk: Ext. 2150</p>
          </div>
        </div>
      </motion.div>

      {/* Admin and Accessibility Buttons */}
      <div className="fixed bottom-8 right-8 flex flex-col space-y-3 z-40">
        <motion.button
          variants={tileVariants}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            actions.updateActivity();
            navigate('/admin');
          }}
          className="glass bg-secondary-700/80 hover:bg-secondary-800/90 text-white rounded-full p-4 shadow-lg transition-all duration-300 touch-button border border-white/10"
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
          className="bg-gradient-to-br from-primary-500 to-primary-700 hover:from-primary-600 hover:to-primary-800 text-white rounded-full p-4 shadow-lg shadow-primary-500/25 transition-all duration-300 touch-button border border-white/10"
          aria-label="Accessibility Options"
        >
          <SafeIcon icon={FiHelpCircle} className="text-2xl" />
        </motion.button>
      </div>
    </motion.div>
  );
}

export default HomeScreen;
