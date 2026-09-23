import React from 'react';

const RECOVERY_DELAY_MS = 10000;

function returnHome() {
  window.location.hash = '#/';
  window.location.reload();
}

// An uncaught render error would otherwise leave an unattended kiosk on a blank
// screen. Show a message, then reload to the home screen.
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
    this.recoveryTimer = null;
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('Kiosk crashed, reloading:', error, info?.componentStack);
    this.recoveryTimer = setTimeout(returnHome, RECOVERY_DELAY_MS);
  }

  componentWillUnmount() {
    clearTimeout(this.recoveryTimer);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
        <h1 className="text-4xl font-bold text-primary-800 mb-4">Something went wrong</h1>
        <p className="text-xl text-gray-600 mb-8">The kiosk will restart in a few seconds.</p>
        <button
          onClick={returnHome}
          className="bg-primary-500 hover:bg-primary-600 text-white py-4 px-8 rounded-xl text-lg font-medium touch-button"
        >
          Restart now
        </button>
      </div>
    );
  }
}

export default ErrorBoundary;
