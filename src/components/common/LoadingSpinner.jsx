import React from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';

const { FiLoader } = FiIcons;

function LoadingSpinner({ message = 'Loading...' }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 p-8"
    >
      <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
        <div className="loading-spinner mx-auto mb-6"></div>
        <h3 className="text-2xl font-semibold text-primary-800 mb-2">
          {message}
        </h3>
        <p className="text-gray-600">
          Please wait while we prepare your information.
        </p>
      </div>
    </motion.div>
  );
}

export default LoadingSpinner;