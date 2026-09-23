import React from 'react';

function ErrorBanner({ message, onRetry, className = '' }) {
  if (!message) return null;

  return (
    <div className={`bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 text-center mb-8 ${className}`}>
      <p>{message}</p>
      <button
        onClick={onRetry}
        className="mt-2 px-6 text-red-600 hover:text-red-800 font-medium touch-button"
      >
        Try Again
      </button>
    </div>
  );
}

export default ErrorBanner;
