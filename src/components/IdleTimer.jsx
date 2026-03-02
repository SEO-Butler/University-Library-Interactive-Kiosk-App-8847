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

  // SVG circle parameters for the countdown ring
  const circleRadius = 54;
  const circumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circumference - (countdown / 30) * circumference;

  return (
    <AnimatePresence>
      {showWarning && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
        >
          {/* Backdrop with blur */}
          <motion.div
            initial={{ backdropFilter: 'blur(0px)' }}
            animate={{ backdropFilter: 'blur(12px)' }}
            exit={{ backdropFilter: 'blur(0px)' }}
            className="absolute inset-0 bg-secondary-900/60"
          />

          {/* Warning Card */}
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="relative glass-strong rounded-3xl p-10 max-w-lg mx-4 text-center shadow-2xl"
          >
            {/* Countdown Ring */}
            <div className="relative inline-flex items-center justify-center mb-8">
              <svg width="140" height="140" className="-rotate-90">
                {/* Background ring */}
                <circle
                  cx="70"
                  cy="70"
                  r={circleRadius}
                  fill="none"
                  stroke="rgba(14, 165, 233, 0.1)"
                  strokeWidth="8"
                />
                {/* Progress ring */}
                <motion.circle
                  cx="70"
                  cy="70"
                  r={circleRadius}
                  fill="none"
                  stroke={countdown <= 10 ? '#f43f5e' : countdown <= 20 ? '#f59e0b' : '#0ea5e9'}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  animate={{ strokeDashoffset }}
                  transition={{ duration: 0.8, ease: "easeInOut" }}
                />
              </svg>
              {/* Countdown number */}
              <motion.div
                key={countdown}
                initial={{ scale: 1.3, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <span className={`text-5xl font-extrabold tabular-nums ${
                  countdown <= 10 ? 'text-rose-500' : countdown <= 20 ? 'text-amber-500' : 'text-primary-600'
                }`}>
                  {countdown}
                </span>
              </motion.div>
            </div>

            <h3 className="text-2xl font-bold text-secondary-800 mb-3">
              Still there?
            </h3>

            <p className="text-secondary-500 mb-8 text-lg leading-relaxed">
              This session will return to the home screen in{' '}
              <strong className={`${countdown <= 10 ? 'text-rose-600' : 'text-secondary-700'}`}>
                {countdown}
              </strong>{' '}
              seconds due to inactivity.
            </p>

            <div className="space-y-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleContinue}
                className="w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white py-4 px-6 rounded-2xl transition-all duration-300 touch-button text-lg font-semibold shadow-lg shadow-primary-500/25"
              >
                Continue Using Kiosk
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleTimeout}
                className="w-full glass hover:bg-white/80 text-secondary-600 py-3.5 px-6 rounded-2xl transition-all duration-300 touch-button flex items-center justify-center gap-2 font-medium"
              >
                <SafeIcon icon={FiHome} className="text-lg" />
                <span>Return to Home</span>
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default IdleTimer;
