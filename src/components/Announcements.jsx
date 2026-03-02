import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { useApp } from '../context/AppContext';
import LoadingSpinner from './common/LoadingSpinner';

const { FiArrowLeft, FiBell, FiCalendar, FiInfo, FiStar, FiClock, FiRefreshCw, FiArrowRight, FiBookOpen } = FiIcons;

/** Returns icon, color scheme, and accent class for an announcement type */
function getAnnouncementStyle(type, priority) {
  if (priority === 'high') {
    return {
      icon: FiStar,
      iconBg: 'bg-gradient-to-br from-rose-500 to-pink-600',
      badge: 'bg-rose-50 text-rose-700 border-rose-200',
      accentClass: 'card-accent-left card-accent-red',
      label: 'Important',
    };
  }
  const styles = {
    info: {
      icon: FiInfo,
      iconBg: 'bg-gradient-to-br from-blue-500 to-cyan-500',
      badge: 'bg-blue-50 text-blue-700 border-blue-200',
      accentClass: 'card-accent-left card-accent-blue',
      label: 'Information',
    },
    event: {
      icon: FiCalendar,
      iconBg: 'bg-gradient-to-br from-emerald-500 to-teal-500',
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      accentClass: 'card-accent-left card-accent-green',
      label: 'Event',
    },
  };
  return styles[type] || {
    icon: FiBell,
    iconBg: 'bg-gradient-to-br from-gray-500 to-gray-600',
    badge: 'bg-gray-50 text-gray-700 border-gray-200',
    accentClass: 'card-accent-left card-accent-gray',
    label: 'Update',
  };
}

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
          className="flex items-center space-x-3 text-primary-600 hover:text-primary-700 transition-colors touch-button group"
          onClick={handleBackToHome}
        >
          <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary-50 group-hover:bg-primary-100 transition-colors">
            <SafeIcon icon={FiArrowLeft} className="text-xl" />
          </span>
          <span className="text-lg font-medium">Back to Home</span>
        </Link>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
            <SafeIcon icon={FiBell} className="text-xl text-white" />
          </div>
          <h1 className="text-3xl font-bold text-primary-800">News & Events</h1>
        </div>
        <button
          onClick={handleRefresh}
          className={`flex items-center justify-center w-10 h-10 rounded-xl bg-primary-50 hover:bg-primary-100 text-primary-600 transition-colors ${isRefreshing ? 'animate-spin' : ''}`}
          disabled={isRefreshing}
        >
          <SafeIcon icon={FiRefreshCw} className="text-lg" />
        </button>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Filter Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-strong rounded-2xl p-5 mb-8 shadow-card"
        >
          <div className="flex flex-wrap gap-3">
            {announcementTypes.map((type) => {
              const isActive = selectedType === type.id;
              const count = type.id === 'all'
                ? state.content.announcements.length
                : type.id === 'priority'
                  ? state.content.announcements.filter(a => a.priority === 'high').length
                  : state.content.announcements.filter(a => a.type === type.id).length;

              return (
                <motion.button
                  key={type.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setSelectedType(type.id);
                    actions.updateActivity();
                  }}
                  className={`flex items-center space-x-2.5 px-5 py-3 rounded-xl font-medium transition-all duration-300 touch-button ${
                    isActive
                      ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white pill-active'
                      : 'bg-white/70 hover:bg-white border border-gray-200/80 text-gray-600 hover:text-gray-800 hover:border-gray-300'
                  }`}
                >
                  <SafeIcon icon={type.icon} className="text-base" />
                  <span>{type.label}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                    isActive ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {count}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Announcements List */}
        <div className="space-y-5">
          {state.error && (
            <div className="glass-strong rounded-2xl border border-red-200/50 text-red-800 p-5 text-center">
              <p>{state.error}</p>
              <button
                onClick={handleRefresh}
                className="mt-3 text-red-600 hover:text-red-800 font-medium underline underline-offset-4"
              >
                Try Again
              </button>
            </div>
          )}

          <AnimatePresence mode="popLayout">
            {filteredAnnouncements.length > 0 ? (
              filteredAnnouncements.map((announcement, index) => {
                const style = getAnnouncementStyle(announcement.type, announcement.priority);
                return (
                  <motion.div
                    key={announcement.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: index * 0.06 }}
                    className={`glass-strong rounded-2xl shadow-card hover:shadow-card-hover overflow-hidden transition-shadow duration-300 ${style.accentClass}`}
                  >
                    <div className="p-6">
                      <div className="flex items-start space-x-5">
                        {/* Icon */}
                        <div className={`${style.iconBg} w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0`}>
                          <SafeIcon
                            icon={style.icon}
                            className="text-xl text-white"
                          />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2 gap-3">
                            <h3 className="text-xl font-bold text-gray-800 leading-snug">
                              {announcement.title}
                            </h3>
                            {announcement.priority === 'high' && (
                              <span className="flex-shrink-0 inline-flex items-center space-x-1.5 bg-rose-50 text-rose-700 px-3 py-1 rounded-lg text-xs font-semibold border border-rose-200 priority-pulse">
                                <SafeIcon icon={FiStar} className="text-xs" />
                                <span>Important</span>
                              </span>
                            )}
                          </div>

                          <p className="text-gray-600 mb-4 leading-relaxed">
                            {announcement.content}
                          </p>

                          <div className="flex items-center flex-wrap gap-4 text-sm">
                            <div className="flex items-center space-x-1.5 text-gray-400">
                              <SafeIcon icon={FiCalendar} className="text-xs" />
                              <span>{format(parseISO(announcement.date), 'MMMM d, yyyy')}</span>
                            </div>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${style.badge}`}>
                              {style.label}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Event Action Bar */}
                    {announcement.type === 'event' && (
                      <div className="border-t border-gray-100 bg-gradient-to-r from-emerald-50/50 to-teal-50/50 px-6 py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 text-emerald-700">
                            <SafeIcon icon={FiCalendar} className="text-sm" />
                            <span className="text-sm font-medium">
                              Interested in this event?
                            </span>
                          </div>
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            className="inline-flex items-center space-x-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-5 py-2.5 rounded-xl transition-all duration-300 touch-button font-medium text-sm shadow-md shadow-emerald-500/15"
                          >
                            <span>Learn More</span>
                            <SafeIcon icon={FiArrowRight} className="text-sm" />
                          </motion.button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-strong rounded-2xl shadow-card p-16 text-center"
              >
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mx-auto mb-6">
                  <SafeIcon icon={FiBell} className="text-4xl text-gray-400" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-600 mb-3">
                  No announcements
                </h3>
                <p className="text-gray-400 max-w-md mx-auto">
                  There are no {selectedType === 'all' ? '' : selectedType} announcements at this time. Check back later for updates.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Featured Events Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12 rounded-2xl overflow-hidden"
        >
          <div className="bg-gradient-to-br from-primary-600 via-primary-500 to-cyan-500 p-10 text-white relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute inset-0 pattern-dots opacity-15" />
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/5 rounded-full blur-xl" />
            <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-white/5 rounded-full blur-xl" />

            <div className="relative">
              <div className="text-center mb-8">
                <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                  <SafeIcon icon={FiStar} className="text-3xl" />
                </div>
                <h3 className="text-2xl font-bold mb-1">Upcoming Highlights</h3>
                <p className="text-primary-100 text-sm">Events you will not want to miss</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/10 hover:bg-white/15 backdrop-blur-sm rounded-xl p-5 border border-white/10 transition-colors duration-300 group">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                      <SafeIcon icon={FiBookOpen} className="text-xl" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1.5 text-lg">Research Skills Workshop</h4>
                      <div className="flex items-center space-x-2 text-sm text-primary-100">
                        <SafeIcon icon={FiClock} className="text-xs" />
                        <span>January 25th, 2:00 PM</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-white/10 hover:bg-white/15 backdrop-blur-sm rounded-xl p-5 border border-white/10 transition-colors duration-300 group">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                      <SafeIcon icon={FiBookOpen} className="text-xl" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1.5 text-lg">Book Club Meeting</h4>
                      <div className="flex items-center space-x-2 text-sm text-primary-100">
                        <SafeIcon icon={FiClock} className="text-xs" />
                        <span>January 30th, 6:00 PM</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default Announcements;
