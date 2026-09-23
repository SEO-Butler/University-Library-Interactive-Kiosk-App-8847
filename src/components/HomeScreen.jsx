import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { FiMap, FiHelpCircle, FiBell, FiClock, FiCalendar } from 'react-icons/fi';
import { MdQrCode2, MdAccessibilityNew } from 'react-icons/md';
import SafeIcon from '../common/SafeIcon';
import RefreshButton from './common/RefreshButton';
import ErrorBanner from './common/ErrorBanner';
import { useApp } from '../context/AppContext';
import LoadingSpinner from './common/LoadingSpinner';

// The clock re-renders on its own, so the rest of the home screen doesn't redraw every
// tick. It updates once a minute, aligned to the minute boundary.
function Clock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let interval;
    const timeout = setTimeout(() => {
      setNow(new Date());
      interval = setInterval(() => setNow(new Date()), 60000);
    }, 60000 - (Date.now() % 60000));
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="flex justify-center items-center space-x-8 text-lg text-secondary-500">
      <div className="flex items-center space-x-2">
        <SafeIcon icon={FiCalendar} className="text-primary-500" />
        <span>{format(now, 'EEEE, MMMM do, yyyy')}</span>
      </div>
      <div className="flex items-center space-x-2">
        <SafeIcon icon={FiClock} className="text-primary-500" />
        <span>{format(now, 'h:mm a')}</span>
      </div>
    </div>
  );
}

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
    icon: MdQrCode2,
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

// Tailwind only generates classes it can see, so the column count can't be interpolated.
const quickInfoColumns = { 1: 'md:grid-cols-1', 2: 'md:grid-cols-2', 3: 'md:grid-cols-3' };

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
  exit: { opacity: 0 }
};

const tileVariants = {
  hidden: { y: 50, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100, damping: 15 } }
};

function HomeScreen() {
  const navigate = useNavigate();
  const { state, actions } = useApp();
  const { site } = state;
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await actions.refreshData();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // The quick info bar shows only the details the library has filled in.
  const quickInfo = [
    { title: "Today's Hours", value: site.openingHours },
    { title: 'WiFi Network', value: site.wifiNetwork },
    {
      title: 'Need Help?',
      value: [site.helpDeskName, site.helpPhone].filter(Boolean).join(': ')
    }
  ].filter((item) => item.value);

  // Only show loading spinner if we're actually loading data from the API
  // and not just on initial render
  if (state.isLoading && state.initialLoadComplete === false) {
    return <LoadingSpinner message={`Welcome to the ${site.libraryName}`} />;
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={containerVariants}
      className="min-h-screen p-8"
    >
      {/* Header */}
      <motion.header variants={tileVariants} className="text-center mb-12 relative">
        <h1 className="text-6xl font-bold text-primary-800 mb-4">
          {site.libraryName}
        </h1>
        <p className="text-2xl text-secondary-600 mb-8">
          {site.welcomeMessage}
        </p>

        <Clock />

        {/* Refresh Button */}
        <RefreshButton onClick={handleRefresh} isRefreshing={isRefreshing} />
      </motion.header>

      <ErrorBanner message={state.error} onRetry={handleRefresh} className="max-w-md mx-auto" />

      {/* Navigation Grid */}
      <motion.div
        variants={containerVariants}
        className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 mb-12"
      >
        {navigationTiles.map((tile) => (
          <motion.div
            key={tile.id}
            variants={tileVariants}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(tile.path)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') navigate(tile.path);
            }}
            className={`${tile.color} ${tile.hoverColor} text-white rounded-3xl p-8 cursor-pointer shadow-xl transition-colors touch-button group`}
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
      {quickInfo.length > 0 && (
        <motion.div
          variants={tileVariants}
          className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-6"
        >
          <div className={`grid grid-cols-1 ${quickInfoColumns[quickInfo.length]} gap-6 text-center`}>
            {quickInfo.map((item) => (
              <div key={item.title} className="space-y-2">
                <h4 className="font-semibold text-primary-800">{item.title}</h4>
                <p className="text-secondary-600">{item.value}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Accessibility Button */}
      <div className="fixed bottom-8 right-8 flex flex-col space-y-4">
        <motion.button
          variants={tileVariants}
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate('/accessibility')}
          className="bg-primary-600 hover:bg-primary-700 text-white rounded-full p-4 shadow-lg transition-colors touch-button"
          aria-label="Accessibility Options"
        >
          <SafeIcon icon={MdAccessibilityNew} className="text-2xl" />
        </motion.button>
      </div>
    </motion.div>
  );
}

export default HomeScreen;
