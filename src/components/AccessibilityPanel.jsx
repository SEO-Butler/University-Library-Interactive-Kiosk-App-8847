import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { useApp } from '../context/AppContext';

const { FiArrowLeft, FiSettings, FiEye, FiType, FiVolume2, FiRefreshCw } = FiIcons;

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
      description: 'Increases contrast for better visibility',
      icon: FiEye,
      enabled: state.accessibility.highContrast
    },
    {
      id: 'largeText',
      title: 'Large Text',
      description: 'Increases text size throughout the app',
      icon: FiType,
      enabled: state.accessibility.largeText
    },
    {
      id: 'audioEnabled',
      title: 'Audio Feedback',
      description: 'Enables sound effects and voice prompts',
      icon: FiVolume2,
      enabled: state.accessibility.audioEnabled
    }
  ];

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
          onClick={(e) => {
            e.preventDefault();
            actions.updateActivity();
            navigate('/');
          }}
        >
          <SafeIcon icon={FiArrowLeft} className="text-2xl" />
          <span className="text-xl font-medium">Back to Home</span>
        </Link>
        <h1 className="text-4xl font-bold text-primary-800">Accessibility</h1>
        <div className="w-32"></div>
      </div>

      <div className="max-w-3xl mx-auto">
        {/* Introduction */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-primary-50 rounded-2xl p-8 mb-8 text-center"
        >
          <SafeIcon icon={FiSettings} className="text-4xl text-primary-600 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-primary-800 mb-4">
            Customize Your Experience
          </h2>
          <p className="text-primary-700">
            Adjust these settings to make the kiosk more comfortable and accessible for you.
          </p>
        </motion.div>

        {/* Accessibility Options */}
        <div className="space-y-6">
          {accessibilityOptions.map((option, index) => (
            <motion.div
              key={option.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl shadow-lg p-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="bg-primary-100 p-3 rounded-xl">
                    <SafeIcon icon={option.icon} className="text-2xl text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-primary-800 mb-1">
                      {option.title}
                    </h3>
                    <p className="text-gray-600">
                      {option.description}
                    </p>
                  </div>
                </div>

                {/* Toggle Switch */}
                <button
                  onClick={() => toggleSetting(option.id)}
                  className={`relative w-16 h-8 rounded-full transition-colors touch-button ${option.enabled ? 'bg-primary-500' : 'bg-gray-300'}`}
                >
                  <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${option.enabled ? 'translate-x-9' : 'translate-x-1'}`} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Reset Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12 text-center"
        >
          <button
            onClick={resetSettings}
            className="flex items-center space-x-3 bg-gray-100 hover:bg-gray-200 text-gray-700 px-8 py-4 rounded-xl transition-colors touch-button mx-auto"
          >
            <SafeIcon icon={FiRefreshCw} className="text-xl" />
            <span className="font-medium">Reset to Default Settings</span>
          </button>
        </motion.div>

        {/* Help Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl shadow-lg p-8 mt-8"
        >
          <h3 className="text-xl font-semibold text-primary-800 mb-4">
            Additional Assistance
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <h4 className="font-semibold text-primary-800 mb-2">Physical Assistance</h4>
              <p className="text-gray-600">Visit our Information Desk on the ground floor for personalized help.</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <h4 className="font-semibold text-primary-800 mb-2">Technical Support</h4>
              <p className="text-gray-600">Call extension 2150 for immediate technical assistance.</p>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default AccessibilityPanel;