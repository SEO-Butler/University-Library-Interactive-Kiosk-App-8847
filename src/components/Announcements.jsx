import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format, parseISO, isValid } from 'date-fns';
import { FiArrowLeft, FiBell, FiCalendar, FiInfo, FiStar, FiClock } from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import RefreshButton from './common/RefreshButton';
import ErrorBanner from './common/ErrorBanner';
import { useApp } from '../context/AppContext';
import { resolveMediaUrl } from '../lib/api';
import LoadingSpinner from './common/LoadingSpinner';

function toDate(value) {
  const date = typeof value === 'string' ? parseISO(value) : new Date(value);
  return isValid(date) ? date : null;
}

function formatDate(value, pattern = 'MMMM d, yyyy') {
  const date = toDate(value);
  return date ? format(date, pattern) : '';
}

const announcementTypes = [
  { id: 'all', label: 'All Updates', icon: FiBell },
  { id: 'info', label: 'Information', icon: FiInfo },
  { id: 'event', label: 'Events', icon: FiCalendar },
  { id: 'priority', label: 'Important', icon: FiStar }
];

const typeIcons = { info: FiInfo, event: FiCalendar };
const typeColors = { info: 'bg-blue-500', event: 'bg-green-500' };

function Announcements() {
  const navigate = useNavigate();
  const { state, actions } = useApp();
  const [selectedType, setSelectedType] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await actions.refreshData();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleBackToHome = (e) => {
    e.preventDefault();
    navigate('/');
  };

  const filteredAnnouncements = state.content.announcements.filter((announcement) => {
    if (selectedType === 'all') return true;
    if (selectedType === 'priority') return announcement.priority === 'high';
    return announcement.type === selectedType;
  });

  // The next two events that haven't happened yet.
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcomingEvents = state.content.announcements
    .filter((a) => a.type === 'event' && toDate(a.date) && toDate(a.date) >= today)
    .sort((a, b) => toDate(a.date) - toDate(b.date))
    .slice(0, 2);

  if (state.isLoading) {
    return <LoadingSpinner message="Loading announcements..." />;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen p-8"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Link
          to="/"
          className="flex items-center space-x-3 text-primary-600 hover:text-primary-700 transition-colors touch-button"
          onClick={handleBackToHome}
        >
          <SafeIcon icon={FiArrowLeft} className="text-2xl" />
          <span className="text-xl font-medium">Back to Home</span>
        </Link>
        <h1 className="text-4xl font-bold text-primary-800">News & Events</h1>
        <RefreshButton onClick={handleRefresh} isRefreshing={isRefreshing} />
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Filter Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-6 mb-8"
        >
          <div className="flex flex-wrap gap-4">
            {announcementTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={`flex items-center space-x-3 px-6 py-3 rounded-xl transition-colors touch-button ${
                  selectedType === type.id ? 'bg-primary-500 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                <SafeIcon icon={type.icon} className="text-lg" />
                <span className="font-medium">{type.label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Announcements List */}
        <div className="space-y-6">
          <ErrorBanner message={state.error} onRetry={handleRefresh} />

          {filteredAnnouncements.length > 0 ? (
            filteredAnnouncements.map((announcement, index) => {
              const imageUrl = resolveMediaUrl(announcement.imageUrl);
              const important = announcement.priority === 'high';
              return (
                <motion.div
                  key={announcement.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index, 5) * 0.1 }}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden"
                >
                  {imageUrl && (
                    <img
                      src={imageUrl}
                      alt=""
                      loading="lazy"
                      className="w-full max-h-72 object-cover"
                    />
                  )}
                  <div className="p-6">
                    <div className="flex items-start space-x-4">
                      {/* Icon */}
                      <div className={`${important ? 'bg-red-500' : typeColors[announcement.type] ?? 'bg-gray-500'} p-3 rounded-xl`}>
                        <SafeIcon
                          icon={typeIcons[announcement.type] ?? FiBell}
                          className="text-2xl text-white"
                        />
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-xl font-semibold text-primary-800">
                            {announcement.title}
                          </h3>
                          {important && (
                            <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                              Important
                            </span>
                          )}
                        </div>
                        <p className="text-gray-700 mb-4 leading-relaxed whitespace-pre-line">
                          {announcement.content}
                        </p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <SafeIcon icon={FiCalendar} />
                            <span>{formatDate(announcement.date)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <SafeIcon icon={FiClock} />
                            <span className="capitalize">{announcement.type}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-2xl shadow-lg p-12 text-center"
            >
              <SafeIcon icon={FiBell} className="text-6xl text-gray-400 mx-auto mb-4" />
              <h3 className="text-2xl font-semibold text-gray-600 mb-2">
                No announcements
              </h3>
              <p className="text-gray-500">
                There are no {selectedType === 'all' ? '' : `${selectedType} `}announcements at this time.
              </p>
            </motion.div>
          )}
        </div>

        {/* Upcoming events */}
        {upcomingEvents.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-8 mt-12 text-white"
          >
            <div className="text-center">
              <SafeIcon icon={FiStar} className="text-4xl mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-4">Upcoming Highlights</h3>
              <div className={`grid grid-cols-1 ${upcomingEvents.length > 1 ? 'md:grid-cols-2' : ''} gap-6`}>
                {upcomingEvents.map((event) => (
                  <div key={event.id} className="bg-white bg-opacity-10 rounded-xl p-4">
                    <h4 className="font-semibold mb-2">{event.title}</h4>
                    <p className="text-sm opacity-90">{formatDate(event.date, 'EEEE, MMMM do')}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

export default Announcements;
