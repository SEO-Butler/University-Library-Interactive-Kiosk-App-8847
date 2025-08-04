import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import QRCode from 'react-qr-code';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { useApp } from '../context/AppContext';
import LoadingSpinner from './common/LoadingSpinner';

const { FiArrowLeft, FiQrCode, FiExternalLink, FiX, FiSmartphone, FiRefreshCw } = FiIcons;

function QRGenerator() {
  const navigate = useNavigate();
  const { state, actions } = useApp();
  const [selectedLink, setSelectedLink] = useState(null);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    actions.updateActivity();
  }, [actions]);

  const handleLinkSelect = (link) => {
    setSelectedLink(link);
    actions.updateActivity();
  };

  const showFullscreenQR = () => {
    setShowFullscreen(true);
    actions.updateActivity();
    // Auto-hide after 30 seconds
    setTimeout(() => {
      setShowFullscreen(false);
    }, 30000);
  };

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

  if (state.isLoading) {
    return <LoadingSpinner message="Loading QR links..." />;
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
        <h1 className="text-4xl font-bold text-primary-800">Quick Links</h1>
        <button
          onClick={handleRefresh}
          className={`flex items-center space-x-2 text-primary-600 hover:text-primary-700 p-2 rounded-full transition-colors ${isRefreshing ? 'animate-spin' : ''}`}
          disabled={isRefreshing}
        >
          <SafeIcon icon={FiRefreshCw} className="text-xl" />
        </button>
      </div>

      <div className="max-w-6xl mx-auto">
        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-primary-50 rounded-2xl p-6 mb-8 text-center"
        >
          <SafeIcon icon={FiSmartphone} className="text-4xl text-primary-600 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-primary-800 mb-2">
            Scan with Your Phone
          </h2>
          <p className="text-primary-700">
            Select a service below to generate a QR code. Scan it with your phone's camera to access the link directly.
          </p>
        </motion.div>

        {state.error && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 text-center mb-8">
            <p>{state.error}</p>
            <button
              onClick={handleRefresh}
              className="mt-2 text-red-600 hover:text-red-800 font-medium"
            >
              Try Again
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Links Selection */}
          <div>
            <h3 className="text-2xl font-semibold text-primary-800 mb-6">Available Services</h3>
            <div className="space-y-4">
              {state.content.qrLinks.map((link) => (
                <motion.button
                  key={link.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleLinkSelect(link)}
                  className={`w-full p-6 rounded-2xl text-left transition-all touch-button ${
                    selectedLink?.id === link.id
                      ? 'bg-primary-500 text-white shadow-lg'
                      : 'bg-white hover:bg-gray-50 text-gray-800 shadow-md'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div
                      className={`p-3 rounded-xl ${
                        selectedLink?.id === link.id ? 'bg-white bg-opacity-20' : 'bg-primary-100'
                      }`}
                    >
                      <SafeIcon
                        icon={FiExternalLink}
                        className={`text-2xl ${
                          selectedLink?.id === link.id ? 'text-white' : 'text-primary-600'
                        }`}
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xl font-semibold mb-1">{link.name}</h4>
                      <p
                        className={`${
                          selectedLink?.id === link.id ? 'text-white text-opacity-90' : 'text-gray-600'
                        }`}
                      >
                        {link.description}
                      </p>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* QR Code Display */}
          <div>
            {selectedLink ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl shadow-lg p-8"
              >
                <div className="text-center">
                  <h3 className="text-2xl font-semibold text-primary-800 mb-4">
                    {selectedLink.name}
                  </h3>
                  <p className="text-gray-600 mb-8">{selectedLink.description}</p>

                  {/* QR Code */}
                  <div className="bg-white p-6 rounded-xl shadow-inner mb-6 inline-block">
                    <QRCode
                      value={selectedLink.url}
                      size={200}
                      level="M"
                      includeMargin={true}
                    />
                  </div>

                  {/* URL Display */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <p className="text-sm text-gray-600 break-all">
                      {selectedLink.url}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="space-y-3">
                    <button
                      onClick={showFullscreenQR}
                      className="w-full bg-primary-500 hover:bg-primary-600 text-white py-4 px-6 rounded-xl transition-colors touch-button text-lg font-medium"
                    >
                      Show Fullscreen QR Code
                    </button>
                    <p className="text-sm text-gray-500">
                      Fullscreen QR code will automatically close after 30 seconds
                    </p>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                <SafeIcon icon={FiQrCode} className="text-6xl text-gray-400 mx-auto mb-4" />
                <h3 className="text-2xl font-semibold text-gray-600 mb-2">
                  Select a Service
                </h3>
                <p className="text-gray-500">
                  Choose a service from the left to generate its QR code
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fullscreen QR Modal */}
      <AnimatePresence>
        {showFullscreen && selectedLink && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white z-50 flex items-center justify-center"
          >
            <button
              onClick={() => setShowFullscreen(false)}
              className="absolute top-8 right-8 bg-gray-100 hover:bg-gray-200 p-4 rounded-full transition-colors touch-button"
            >
              <SafeIcon icon={FiX} className="text-3xl text-gray-600" />
            </button>
            <div className="text-center">
              <h2 className="text-4xl font-bold text-primary-800 mb-4">
                {selectedLink.name}
              </h2>
              <p className="text-xl text-gray-600 mb-12">
                {selectedLink.description}
              </p>
              <div className="bg-white p-8 rounded-2xl shadow-2xl inline-block">
                <QRCode
                  value={selectedLink.url}
                  size={400}
                  level="M"
                  includeMargin={true}
                />
              </div>
              <p className="text-lg text-gray-500 mt-8">
                Scan with your phone's camera to access this service
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default QRGenerator;