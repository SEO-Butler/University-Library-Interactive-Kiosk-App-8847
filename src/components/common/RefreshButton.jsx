import React from 'react';
import { FiRefreshCw } from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';

function RefreshButton({ onClick, isRefreshing, className = '' }) {
  return (
    <button
      onClick={onClick}
      disabled={isRefreshing}
      aria-label="Refresh information"
      className={`flex items-center justify-center text-primary-600 hover:text-primary-700 rounded-full transition-colors touch-button ${className}`}
    >
      <SafeIcon icon={FiRefreshCw} className={`text-2xl ${isRefreshing ? 'animate-spin' : ''}`} />
    </button>
  );
}

export default RefreshButton;
