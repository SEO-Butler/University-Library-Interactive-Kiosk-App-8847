import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { useApp } from '../context/AppContext';

const { FiClock, FiHome } = FiIcons;

function IdleTimer() {
  const navigate = useNavigate();
  const location = useLocation();
  const { state, actions } = useApp();
  const [showWarning, setShowWarning] = React.useState(false);
  const [countdown, setCountdown] = React.useState(30);
  const timeoutRef = useRef(null);
  const warningTimeoutRef = useRef(null);
  const countdownRef = useRef(null);

  const resetTimer = () => {
    actions.updateActivity();
    setShowWarning(false);
    setCountdown(30);
    
    // Clear existing timers
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);

    // Don't set timer on home page
    if (location.pathname === '/') return;

    // Set warning timer (show warning 30 seconds before timeout)
    warningTimeoutRef.current = setTimeout(() => {
      setShowWarning(true);
      setCountdown(30);
      
      // Start countdown
      countdownRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            handleTimeout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, state.settings.idleTimeout - 30000);

    // Set main timeout
    timeoutRef.current = setTimeout(handleTimeout, state.settings.idleTimeout);
  };

  const handleTimeout = () => {
    setShowWarning(false);
    setCountdown(30);
    
    // Clear all timers
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    
    // Navigate to home
    navigate('/');
    actions.resetToDefault();
  };

  const handleContinue = () => {
    resetTimer();
  };

  // Set up event listeners for user activity
  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const resetOnActivity = () => {
      if (showWarning) return; // Don't reset if warning is showing
      resetTimer();
    };

    events.forEach(event => {
      document.addEventListener(event, resetOnActivity, true);
    });

    // Initial timer setup
    resetTimer();

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, resetOnActivity, true);
      });
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [location.pathname, showWarning]);

  // Reset timer when location changes
  useEffect(() => {
    resetTimer();
  }, [location.pathname]);

  return (
    <AnimatePresence>
      {showWarning && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl p-8 max-w-md mx-4 text-center shadow-2xl"
          >
            <SafeIcon icon={FiClock} className="text-6xl text-orange-500 mx-auto mb-6" />
            
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              Session Timeout Warning
            </h3>
            
            <p className="text-gray-600 mb-6">
              You will be returned to the home screen in <strong>{countdown}</strong> seconds due to inactivity.
            </p>
            
            <div className="space-y-4">
              <button
                onClick={handleContinue}
                className="w-full bg-primary-500 hover:bg-primary-600 text-white py-4 px-6 rounded-xl transition-colors touch-button text-lg font-medium"
              >
                Continue Using Kiosk
              </button>
              
              <button
                onClick={handleTimeout}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-6 rounded-xl transition-colors touch-button flex items-center justify-center space-x-2"
              >
                <SafeIcon icon={FiHome} />
                <span>Return to Home Now</span>
              </button>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-6">
              <div className="bg-gray-200 rounded-full h-2">
                <motion.div
                  className="bg-orange-500 h-2 rounded-full"
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{ duration: 30, ease: 'linear' }}
                />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default IdleTimer;