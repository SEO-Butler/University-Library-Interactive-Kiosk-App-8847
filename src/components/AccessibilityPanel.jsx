import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { useApp } from '../context/AppContext';

const { FiArrowLeft, FiSettings, FiEye, FiType, FiVolume2, FiRefreshCw, FiHeart, FiMapPin, FiPhone, FiCheck } = FiIcons;

function AccessibilityPanel() {
  const navigate = useNavigate();
  const { state, actions } = useApp();

  React.useEffect(() => {
    actions.updateActivity();
  }, [actions]);

  const toggleSetting = (setting) => {
    actions.updateAccessibility({ [setting]: !state.accessibility[setting] });
  };

  const resetSettings = () => {
    actions.updateAccessibility({
      highContrast: false,
      largeText: false,
      audioEnabled: false
    });
  };

  const accessibilityOptions = [
    {
      id: 'highContrast',
      title: 'High Contrast Mode',
      description: 'Increases contrast between text and background for better visibility',
      icon: FiEye,
      enabled: state.accessibility.highContrast,
      color: { gradient: 'from-blue-500 to-cyan-500', bg: 'bg-blue-50', text: 'text-blue-600', ring: 'ring-blue-200' },
    },
    {
      id: 'largeText',
      title: 'Large Text',
      description: 'Increases text size throughout the kiosk for easier reading',
      icon: FiType,
      enabled: state.accessibility.largeText,
      color: { gradient: 'from-violet-500 to-purple-500', bg: 'bg-violet-50', text: 'text-violet-600', ring: 'ring-violet-200' },
    },
    {
      id: 'audioEnabled',
      title: 'Audio Feedback',
      description: 'Enables sound effects and spoken prompts for interactive guidance',
      icon: FiVolume2,
      enabled: state.accessibility.audioEnabled,
      color: { gradient: 'from-emerald-500 to-teal-500', bg: 'bg-emerald-50', text: 'text-emerald-600', ring: 'ring-emerald-200' },
    }
  ];

  const anySettingEnabled = accessibilityOptions.some(opt => opt.enabled);

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
          onClick={(e) => {
            e.preventDefault();
            actions.updateActivity();
            navigate('/');
          }}
        >
          <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary-50 group-hover:bg-primary-100 transition-colors">
            <SafeIcon icon={FiArrowLeft} className="text-xl" />
          </span>
          <span className="text-lg font-medium">Back to Home</span>
        </Link>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-cyan-500 flex items-center justify-center">
            <SafeIcon icon={FiSettings} className="text-xl text-white" />
          </div>
          <h1 className="text-3xl font-bold text-primary-800">Accessibility</h1>
        </div>
        <div className="w-28" />
      </div>

      <div className="max-w-3xl mx-auto">
        {/* Introduction */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-2xl overflow-hidden mb-10"
        >
          <div className="bg-gradient-to-r from-primary-600 via-primary-500 to-cyan-500 p-8 relative">
            <div className="absolute inset-0 pattern-dots opacity-15" />
            <div className="relative text-center">
              <div className="w-16 h-16 rounded-2xl bg-white/15 flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                <SafeIcon icon={FiHeart} className="text-3xl text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Customize Your Experience
              </h2>
              <p className="text-primary-100 max-w-md mx-auto">
                Adjust these settings to make the kiosk more comfortable and accessible for your needs.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Accessibility Options */}
        <div className="space-y-4">
          {accessibilityOptions.map((option, index) => (
            <motion.div
              key={option.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + index * 0.08 }}
              className={`glass-strong rounded-2xl shadow-card overflow-hidden transition-all duration-300 ${
                option.enabled ? `ring-2 ${option.color.ring} shadow-card-hover` : 'hover:shadow-card-hover'
              }`}
            >
              <div className="p-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center space-x-5">
                    {/* Icon with gradient background */}
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${option.color.gradient} flex items-center justify-center flex-shrink-0 transition-transform duration-300 ${
                      option.enabled ? 'scale-105' : ''
                    }`}>
                      <SafeIcon icon={option.icon} className="text-2xl text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 mb-1">
                        {option.title}
                      </h3>
                      <p className="text-gray-500 text-sm leading-relaxed">
                        {option.description}
                      </p>
                    </div>
                  </div>

                  {/* Enhanced Toggle Switch */}
                  <button
                    onClick={() => toggleSetting(option.id)}
                    className={`relative flex-shrink-0 w-20 h-11 rounded-full transition-all duration-350 touch-button toggle-track ${
                      option.enabled
                        ? `bg-gradient-to-r ${option.color.gradient} active`
                        : 'bg-gray-200 hover:bg-gray-300'
                    }`}
                    role="switch"
                    aria-checked={option.enabled}
                    aria-label={`Toggle ${option.title}`}
                  >
                    <motion.div
                      className="toggle-thumb absolute top-1.5 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center"
                      animate={{
                        x: option.enabled ? 40 : 4,
                      }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    >
                      <AnimatePresence mode="wait">
                        {option.enabled && (
                          <motion.div
                            key="check"
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            transition={{ duration: 0.15 }}
                          >
                            <SafeIcon icon={FiCheck} className={`text-sm ${option.color.text}`} />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  </button>
                </div>
              </div>

              {/* Active indicator bar */}
              <AnimatePresence>
                {option.enabled && (
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    exit={{ scaleX: 0 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className={`h-1 bg-gradient-to-r ${option.color.gradient} origin-left`}
                  />
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {/* Reset Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="mt-10 text-center"
        >
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={resetSettings}
            disabled={!anySettingEnabled}
            className={`inline-flex items-center space-x-3 px-8 py-4 rounded-xl font-medium transition-all duration-300 touch-button ${
              anySettingEnabled
                ? 'glass-strong shadow-card hover:shadow-card-hover text-gray-700 hover:text-gray-900 border border-gray-200/80 hover:border-gray-300'
                : 'bg-gray-50 text-gray-300 cursor-not-allowed border border-gray-100'
            }`}
          >
            <SafeIcon icon={FiRefreshCw} className="text-lg" />
            <span>Reset to Default Settings</span>
          </motion.button>
          {!anySettingEnabled && (
            <p className="text-xs text-gray-400 mt-3">All settings are at their defaults</p>
          )}
        </motion.div>

        {/* Help Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="glass-strong rounded-2xl shadow-card p-8 mt-10"
        >
          <div className="flex items-center space-x-2 mb-6">
            <div className="w-1.5 h-6 rounded-full bg-gradient-to-b from-primary-500 to-cyan-500" />
            <h3 className="text-xl font-bold text-gray-800">
              Additional Assistance
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-4 p-5 rounded-xl bg-white/70 border border-gray-100 hover:border-primary-200 hover:bg-white transition-all duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <SafeIcon icon={FiMapPin} className="text-xl text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-800">Physical Assistance</h4>
                <p className="text-gray-500 text-sm">Information Desk - Ground Floor</p>
              </div>
            </div>
            <div className="flex items-center space-x-4 p-5 rounded-xl bg-white/70 border border-gray-100 hover:border-primary-200 hover:bg-white transition-all duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <SafeIcon icon={FiPhone} className="text-xl text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-800">Technical Support</h4>
                <p className="text-gray-500 text-sm">Call extension 2150</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default AccessibilityPanel;
