import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { useApp } from '../context/AppContext';
import LoadingSpinner from './common/LoadingSpinner';

const { FiArrowLeft, FiBell, FiCalendar, FiInfo, FiStar, FiClock, FiRefreshCw } = FiIcons;

function Announcements() {
  const navigate = useNavigate();
  const { state, actions } = useApp();
  const [selectedType, setSelectedType] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    actions.updateActivity();
  }, [actions]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await actions.refreshData();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleBackToHome = (e) => {
    e.preventDefault();
    actions.updateActivity();
    navigate('/');
  };

  const announcementTypes = [
    { id: 'all', label: 'All Updates', icon: FiBell },
    { id: 'info', label: 'Information', icon: FiInfo },
    { id: 'event', label: 'Events', icon: FiCalendar },
    { id: 'priority', label: 'Important', icon: FiStar }
  ];

  const filteredAnnouncements = state.content.announcements.filter(announcement => {
    if (selectedType === 'all') return true;
    if (selectedType === 'priority') return announcement.priority === 'high';
    return announcement.type === selectedType;
  });

  const getAnnouncementIcon = (type) => {
    const icons = { info: FiInfo, event: FiCalendar, priority: FiStar };
    return icons[type] || FiBell;
  };

  const getAnnouncementColor = (type, priority) => {
    if (priority === 'high') return 'bg-red-500';
    const colors = { info: 'bg-blue-500', event: 'bg-green-500', priority: 'bg-red-500' };
    return colors[type] || 'bg-gray-500';
  };

  if (state.isLoading) {
    return <LoadingSpinner message="Loading announcements..." />;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`min-h-screen p-8 ${state.accessibility.highContrast ? 'high-contrast' : ''} ${state.accessibility.largeText ? 'large-text' : ''}`}
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
        <button
          onClick={handleRefresh}
          className={`flex items-center space-x-2 text-primary-600 hover:text-primary-700 p-2 rounded-full transition-colors ${isRefreshing ? 'animate-spin' : ''}`}
          disabled={isRefreshing}
        >
          <SafeIcon icon={FiRefreshCw} className="text-xl" />
        </button>
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
                onClick={() => {
                  setSelectedType(type.id);
                  actions.updateActivity();
                }}
                className={`flex items-center space-x-3 px-6 py-3 rounded-xl transition-all touch-button ${
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
          {state.error && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 text-center">
              <p>{state.error}</p>
              <button
                onClick={handleRefresh}
                className="mt-2 text-red-600 hover:text-red-800 font-medium"
              >
                Try Again
              </button>
            </div>
          )}

          {filteredAnnouncements.length > 0 ? (
            filteredAnnouncements.map((announcement, index) => (
              <motion.div
                key={announcement.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl shadow-lg overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start space-x-4">
                    {/* Icon */}
                    <div className={`${getAnnouncementColor(announcement.type, announcement.priority)} p-3 rounded-xl`}>
                      <SafeIcon
                        icon={getAnnouncementIcon(announcement.type)}
                        className="text-2xl text-white"
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xl font-semibold text-primary-800">
                          {announcement.title}
                        </h3>
                        {announcement.priority === 'high' && (
                          <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                            Important
                          </span>
                        )}
                      </div>
                      <p className="text-gray-700 mb-4 leading-relaxed">
                        {announcement.content}
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <SafeIcon icon={FiCalendar} />
                          <span>{format(parseISO(announcement.date), 'MMMM d, yyyy')}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <SafeIcon icon={FiClock} />
                          <span className="capitalize">{announcement.type}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Bar */}
                {announcement.type === 'event' && (
                  <div className="bg-gray-50 px-6 py-4 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        Want to attend this event?
                      </span>
                      <button className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors touch-button">
                        Learn More
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            ))
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
                There are no {selectedType === 'all' ? '' : selectedType} announcements at this time.
              </p>
            </motion.div>
          )}
        </div>

        {/* Featured Events Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-8 mt-12 text-white"
        >
          <div className="text-center">
            <SafeIcon icon={FiStar} className="text-4xl mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-4">Upcoming Highlights</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white bg-opacity-10 rounded-xl p-4">
                <h4 className="font-semibold mb-2">Research Skills Workshop</h4>
                <p className="text-sm opacity-90">January 25th, 2:00 PM</p>
              </div>
              <div className="bg-white bg-opacity-10 rounded-xl p-4">
                <h4 className="font-semibold mb-2">Book Club Meeting</h4>
                <p className="text-sm opacity-90">January 30th, 6:00 PM</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default Announcements;