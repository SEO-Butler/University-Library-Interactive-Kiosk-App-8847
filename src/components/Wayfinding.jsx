import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { useApp } from '../context/AppContext';
import LoadingSpinner from './common/LoadingSpinner';

const { FiArrowLeft, FiMapPin, FiNavigation, FiLayers, FiRefreshCw } = FiIcons;

function Wayfinding() {
  const navigate = useNavigate();
  const { state, actions } = useApp();
  const [selectedFloor, setSelectedFloor] = useState(1);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    actions.updateActivity();
  }, [actions]);

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

  const locationTypes = {
    entrance: { color: 'bg-green-500', icon: '🚪' },
    service: { color: 'bg-blue-500', icon: '🛎️' },
    amenity: { color: 'bg-orange-500', icon: '☕' },
    collection: { color: 'bg-purple-500', icon: '📚' },
    technology: { color: 'bg-red-500', icon: '💻' },
    study: { color: 'bg-yellow-500', icon: '📖' }
  };

  // Transform the database data into the format expected by the component
  const floors = state.content.floors.map(floor => ({
    id: floor.id,
    name: floor.name,
    locations: state.content.locations
      .filter(location => location.floor_id === floor.id)
      .map(location => ({
        id: location.location_id,
        name: location.name,
        x: location.x_position,
        y: location.y_position,
        type: location.type,
        directions: location.directions
      }))
  }));

  const currentFloor = floors.find(f => f.id === selectedFloor) || {
    id: 1,
    name: 'Ground Floor',
    locations: []
  };

  const handleLocationClick = (location) => {
    setSelectedLocation(location);
    actions.updateActivity();
  };

  if (state.isLoading) {
    return <LoadingSpinner message="Loading map data..." />;
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
        <h1 className="text-4xl font-bold text-primary-800">Library Map</h1>
        <button
          onClick={handleRefresh}
          className={`flex items-center space-x-2 text-primary-600 hover:text-primary-700 p-2 rounded-full transition-colors ${isRefreshing ? 'animate-spin' : ''}`}
          disabled={isRefreshing}
        >
          <SafeIcon icon={FiRefreshCw} className="text-xl" />
        </button>
      </div>

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

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Floor Selection */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-primary-800 mb-4 flex items-center">
              <SafeIcon icon={FiLayers} className="mr-2" />
              Select Floor
            </h3>
            <div className="space-y-3">
              {floors.map((floor) => (
                <button
                  key={floor.id}
                  onClick={() => setSelectedFloor(floor.id)}
                  className={`w-full p-4 rounded-xl transition-all touch-button ${
                    selectedFloor === floor.id
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  {floor.name}
                </button>
              ))}
            </div>

            {/* Legend */}
            <div className="mt-8">
              <h4 className="text-lg font-semibold text-primary-800 mb-3">Legend</h4>
              <div className="space-y-2">
                {Object.entries(locationTypes).map(([type, config]) => (
                  <div key={type} className="flex items-center space-x-2">
                    <div className={`w-4 h-4 rounded-full ${config.color}`}></div>
                    <span className="text-sm capitalize">{type.replace('-', ' ')}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Map Display */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-primary-800 mb-4">
              {currentFloor.name}
            </h3>

            {/* Interactive Map */}
            <div className="relative bg-gray-50 rounded-xl aspect-square border-2 border-gray-200 overflow-hidden">
              {/* Floor Plan Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200">
                {/* Simulated floor plan lines */}
                <svg className="w-full h-full opacity-20">
                  <defs>
                    <pattern
                      id="grid"
                      width="20"
                      height="20"
                      patternUnits="userSpaceOnUse"
                    >
                      <path
                        d="M 20 0 L 0 0 0 20"
                        fill="none"
                        stroke="#999"
                        strokeWidth="1"
                      />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>
              </div>

              {/* Location Markers */}
              {currentFloor.locations.map((location) => (
                <motion.button
                  key={location.id}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleLocationClick(location)}
                  className={`absolute transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full ${
                    locationTypes[location.type].color
                  } text-white font-bold shadow-lg hover:shadow-xl transition-all touch-button`}
                  style={{ left: `${location.x}%`, top: `${location.y}%` }}
                  title={location.name}
                >
                  <SafeIcon icon={FiMapPin} className="text-sm" />
                </motion.button>
              ))}

              {/* Selected Location Highlight */}
              {selectedLocation && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 border-4 border-primary-500 rounded-full pointer-events-none"
                  style={{ left: `${selectedLocation.x}%`, top: `${selectedLocation.y}%` }}
                />
              )}
            </div>
          </div>
        </div>

        {/* Location Details */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            {selectedLocation ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h3 className="text-xl font-semibold text-primary-800 mb-4 flex items-center">
                  <SafeIcon icon={FiNavigation} className="mr-2" />
                  Location Details
                </h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-lg">{selectedLocation.name}</h4>
                    <p className="text-gray-600 capitalize">{selectedLocation.type.replace('-', ' ')}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h5 className="font-medium mb-2">Directions:</h5>
                    <p className="text-sm text-gray-700">
                      {selectedLocation.directions || `${selectedLocation.name} is located on ${currentFloor.name}.`}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedLocation(null)}
                    className="w-full bg-primary-500 hover:bg-primary-600 text-white py-3 px-4 rounded-lg transition-colors touch-button"
                  >
                    Clear Selection
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="text-center py-12">
                <SafeIcon icon={FiMapPin} className="text-4xl text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Click on a location marker to see details and directions</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default Wayfinding;