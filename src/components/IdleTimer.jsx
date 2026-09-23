import React, { useCallback, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { useApp } from '../context/AppContext';

const { FiClock, FiHome } = FiIcons;

const WARNING_SECONDS = 30;
const ACTIVITY_EVENTS = ['pointerdown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'wheel'];

function IdleTimer() {
  const navigate = useNavigate();
  const location = useLocation();
  const { state, actions } = useApp();
  const [showWarning, setShowWarning] = React.useState(false);
  const [countdown, setCountdown] = React.useState(WARNING_SECONDS);

  // Activity is tracked in refs so pointer and scroll events never re-render the app.
  const lastActivityRef = useRef(Date.now());
  const showWarningRef = useRef(false);
  const idleTimeoutRef = useRef(state.settings.idleTimeout);
  const pathnameRef = useRef(location.pathname);
  const sessionResetRef = useRef(false);
  idleTimeoutRef.current = state.settings.idleTimeout;
  pathnameRef.current = location.pathname;

  const hideWarning = useCallback(() => {
    showWarningRef.current = false;
    setShowWarning(false);
    setCountdown(WARNING_SECONDS);
  }, []);

  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    sessionResetRef.current = false;
    hideWarning();
  }, [hideWarning]);

  const handleTimeout = useCallback(() => {
    hideWarning();
    lastActivityRef.current = Date.now();
    sessionResetRef.current = true;
    actions.resetSession();
    navigate('/');
  }, [actions, hideWarning, navigate]);

  const handleContinue = () => {
    resetTimer();
  };

  // Record activity. While the warning is up the visitor has to answer it explicitly.
  useEffect(() => {
    const onActivity = () => {
      if (!showWarningRef.current) {
        lastActivityRef.current = Date.now();
        sessionResetRef.current = false;
      }
    };
    ACTIVITY_EVENTS.forEach((event) => {
      document.addEventListener(event, onActivity, { capture: true, passive: true });
    });
    return () => {
      ACTIVITY_EVENTS.forEach((event) => {
        document.removeEventListener(event, onActivity, { capture: true });
      });
    };
  }, []);

  // A single 1s tick. It only sets state when the warning is showing.
  useEffect(() => {
    const tick = setInterval(() => {
      const idleFor = Date.now() - lastActivityRef.current;
      const timeout = idleTimeoutRef.current;

      if (pathnameRef.current === '/') {
        // No warning on the home screen, but still clear the previous visitor's
        // accessibility and language choices once they have walked away.
        if (idleFor >= timeout && !sessionResetRef.current) {
          sessionResetRef.current = true;
          actions.resetSession();
        }
        return;
      }

      if (idleFor >= timeout) {
        handleTimeout();
      } else if (idleFor >= timeout - WARNING_SECONDS * 1000) {
        showWarningRef.current = true;
        setShowWarning(true);
        setCountdown(Math.max(0, Math.ceil((timeout - idleFor) / 1000)));
      }
    }, 1000);
    return () => clearInterval(tick);
  }, [actions, handleTimeout]);

  // Navigating counts as activity.
  useEffect(() => {
    resetTimer();
  }, [location.pathname, resetTimer]);

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
                  style={{ transformOrigin: 'left' }}
                  initial={{ scaleX: 1 }}
                  animate={{ scaleX: 0 }}
                  transition={{ duration: WARNING_SECONDS, ease: 'linear' }}
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