import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import QRCode from 'react-qr-code';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { useApp } from '../context/AppContext';
import LoadingSpinner from './common/LoadingSpinner';

const { FiArrowLeft, FiQrCode, FiExternalLink, FiX, FiSmartphone, FiRefreshCw, FiMaximize2, FiCheck } = FiIcons;

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
          className="flex items-center space-x-3 text-primary-600 hover:text-primary-700 transition-colors touch-button group"
          onClick={handleBackToHome}
        >
          <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary-50 group-hover:bg-primary-100 transition-colors">
            <SafeIcon icon={FiArrowLeft} className="text-xl" />
          </span>
          <span className="text-lg font-medium">Back to Home</span>
        </Link>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <SafeIcon icon={FiQrCode} className="text-xl text-white" />
          </div>
          <h1 className="text-3xl font-bold text-primary-800">Quick Links</h1>
        </div>
        <button
          onClick={handleRefresh}
          className={`flex items-center justify-center w-10 h-10 rounded-xl bg-primary-50 hover:bg-primary-100 text-primary-600 transition-colors ${isRefreshing ? 'animate-spin' : ''}`}
          disabled={isRefreshing}
        >
          <SafeIcon icon={FiRefreshCw} className="text-lg" />
        </button>
      </div>

      <div className="max-w-6xl mx-auto">
        {/* Instructions Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-2xl overflow-hidden mb-10"
        >
          <div className="bg-gradient-to-r from-violet-600 via-purple-500 to-primary-500 p-8 relative">
            <div className="absolute inset-0 pattern-dots opacity-15" />
            <div className="relative flex items-center justify-center space-x-6">
              <div className="hidden md:flex w-16 h-16 rounded-2xl bg-white/15 items-center justify-center backdrop-blur-sm animate-bounce-gentle">
                <SafeIcon icon={FiSmartphone} className="text-4xl text-white" />
              </div>
              <div className="text-center md:text-left">
                <h2 className="text-2xl font-bold text-white mb-1.5">
                  Scan with Your Phone
                </h2>
                <p className="text-purple-100 max-w-md">
                  Select a service below to generate a QR code. Scan it with your phone camera to open the link instantly.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {state.error && (
          <div className="glass-strong rounded-2xl border border-red-200/50 text-red-800 p-5 text-center mb-8">
            <p>{state.error}</p>
            <button
              onClick={handleRefresh}
              className="mt-3 text-red-600 hover:text-red-800 font-medium underline underline-offset-4"
            >
              Try Again
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Links Selection */}
          <div>
            <div className="flex items-center space-x-2 mb-6">
              <div className="w-1.5 h-6 rounded-full bg-gradient-to-b from-primary-500 to-violet-500" />
              <h3 className="text-xl font-bold text-gray-800">Available Services</h3>
            </div>
            <div className="space-y-3">
              {state.content.qrLinks.map((link, index) => {
                const isSelected = selectedLink?.id === link.id;
                return (
                  <motion.button
                    key={link.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.06 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleLinkSelect(link)}
                    className={`w-full p-5 rounded-2xl text-left transition-all duration-300 touch-button group ${
                      isSelected
                        ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/25 scale-[1.01]'
                        : 'glass-strong hover:bg-white/90 text-gray-800 shadow-card hover:shadow-card-hover'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 flex-shrink-0 ${
                          isSelected
                            ? 'bg-white/20 backdrop-blur-sm'
                            : 'bg-gradient-to-br from-primary-50 to-primary-100 group-hover:from-primary-100 group-hover:to-primary-200'
                        }`}
                      >
                        <SafeIcon
                          icon={FiExternalLink}
                          className={`text-xl ${
                            isSelected ? 'text-white' : 'text-primary-600'
                          }`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-lg font-semibold mb-0.5 truncate">{link.name}</h4>
                        <p
                          className={`text-sm truncate ${
                            isSelected ? 'text-primary-100' : 'text-gray-500'
                          }`}
                        >
                          {link.description}
                        </p>
                      </div>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0"
                        >
                          <SafeIcon icon={FiCheck} className="text-white text-sm" />
                        </motion.div>
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* QR Code Display */}
          <div className="lg:sticky lg:top-8 lg:self-start">
            <AnimatePresence mode="wait">
              {selectedLink ? (
                <motion.div
                  key={selectedLink.id}
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                  className="glass-strong rounded-2xl shadow-elevated p-8"
                >
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">
                      {selectedLink.name}
                    </h3>
                    <p className="text-gray-500 mb-8">{selectedLink.description}</p>

                    {/* QR Code with decorative frame */}
                    <div className="relative inline-block">
                      {/* Decorative corner accents */}
                      <div className="absolute -top-2 -left-2 w-6 h-6 border-t-3 border-l-3 border-primary-400 rounded-tl-lg" />
                      <div className="absolute -top-2 -right-2 w-6 h-6 border-t-3 border-r-3 border-primary-400 rounded-tr-lg" />
                      <div className="absolute -bottom-2 -left-2 w-6 h-6 border-b-3 border-l-3 border-primary-400 rounded-bl-lg" />
                      <div className="absolute -bottom-2 -right-2 w-6 h-6 border-b-3 border-r-3 border-primary-400 rounded-br-lg" />

                      <div className="bg-white p-6 rounded-2xl qr-glow">
                        <QRCode
                          value={selectedLink.url}
                          size={200}
                          level="M"
                          includeMargin={true}
                        />
                      </div>
                    </div>

                    {/* URL Display */}
                    <div className="mt-8 bg-gray-50/80 rounded-xl p-4 border border-gray-100">
                      <p className="text-xs text-gray-400 mb-1 font-medium uppercase tracking-wider">Link URL</p>
                      <p className="text-sm text-gray-600 break-all font-mono">
                        {selectedLink.url}
                      </p>
                    </div>

                    {/* Fullscreen button */}
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={showFullscreenQR}
                      className="w-full mt-6 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white py-4 px-6 rounded-xl transition-all duration-300 touch-button text-lg font-semibold shadow-lg shadow-primary-500/20 hover:shadow-primary-500/30 flex items-center justify-center space-x-3"
                    >
                      <SafeIcon icon={FiMaximize2} className="text-xl" />
                      <span>Show Fullscreen QR</span>
                    </motion.button>
                    <p className="text-xs text-gray-400 mt-3">
                      Auto-closes after 30 seconds
                    </p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="glass rounded-2xl shadow-card p-16 text-center"
                >
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mx-auto mb-6 animate-bounce-gentle">
                    <SafeIcon icon={FiQrCode} className="text-4xl text-gray-400" />
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-600 mb-2">
                    Select a Service
                  </h3>
                  <p className="text-gray-400 max-w-sm mx-auto">
                    Choose a service from the list to generate its QR code for easy mobile access
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
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
            {/* Subtle background pattern */}
            <div className="absolute inset-0 pattern-dots opacity-30" />

            <button
              onClick={() => setShowFullscreen(false)}
              className="absolute top-8 right-8 w-14 h-14 bg-gray-100 hover:bg-gray-200 rounded-2xl flex items-center justify-center transition-colors touch-button"
            >
              <SafeIcon icon={FiX} className="text-2xl text-gray-600" />
            </button>
            <div className="text-center relative">
              <h2 className="text-4xl font-bold text-gray-800 mb-3">
                {selectedLink.name}
              </h2>
              <p className="text-xl text-gray-500 mb-12">
                {selectedLink.description}
              </p>
              <div className="bg-white p-10 rounded-3xl qr-glow inline-block">
                <QRCode
                  value={selectedLink.url}
                  size={400}
                  level="M"
                  includeMargin={true}
                />
              </div>
              <div className="mt-10 flex items-center justify-center space-x-3 text-gray-400">
                <SafeIcon icon={FiSmartphone} className="text-2xl" />
                <p className="text-lg">
                  Point your phone camera here to open this link
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default QRGenerator;
