import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiMapPin, FiNavigation, FiLayers } from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import RefreshButton from './common/RefreshButton';
import ErrorBanner from './common/ErrorBanner';
import { useApp } from '../context/AppContext';
import { resolveMediaUrl } from '../lib/api';
import LoadingSpinner from './common/LoadingSpinner';

export const locationTypes = {
  entrance: { label: 'Entrance', color: 'bg-green-500' },
  service: { label: 'Service desk', color: 'bg-blue-500' },
  amenity: { label: 'Amenity', color: 'bg-orange-500' },
  collection: { label: 'Collection', color: 'bg-purple-500' },
  technology: { label: 'Technology', color: 'bg-red-500' },
  study: { label: 'Study space', color: 'bg-yellow-500' }
};

// Placeholder shown for floors without an uploaded plan.
function GridBackground() {
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200">
      <svg className="w-full h-full opacity-20" aria-hidden="true">
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#999" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
    </div>
  );
}

function Wayfinding() {
  const navigate = useNavigate();
  const { state, actions } = useApp();
  const [selectedFloorId, setSelectedFloorId] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await actions.refreshData();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleBackToHome = (e) => {
    e.preventDefault();
    navigate('/');
  };

  const floors = state.content.floors.map((floor) => ({
    ...floor,
    mapImageUrl: resolveMediaUrl(floor.mapImageUrl),
    locations: state.content.locations.filter((location) => location.floorId === floor.id)
  }));

  // Default to the first floor from the database rather than assuming an id.
  const selectedFloor = selectedFloorId ?? floors[0]?.id;
  const currentFloor = floors.find((f) => f.id === selectedFloor) || {
    id: null,
    name: 'No floor plans available',
    mapImageUrl: null,
    locations: []
  };

  const selectFloor = (floorId) => {
    setSelectedFloorId(floorId);
    setSelectedLocation(null);
  };

  if (state.isLoading) {
    return <LoadingSpinner message="Loading map data..." />;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen p-8"
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
        <RefreshButton onClick={handleRefresh} isRefreshing={isRefreshing} />
      </div>

      <ErrorBanner message={state.error} onRetry={handleRefresh} />

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
                  onClick={() => selectFloor(floor.id)}
                  className={`w-full p-4 rounded-xl transition-colors touch-button ${
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
                    <span className="text-sm">{config.label}</span>
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

            {/* Interactive Map. With a floor plan the box follows the image's shape;
                without one it is a square grid. Markers are placed in percent. */}
            <div
              className={`relative bg-gray-50 rounded-xl border-2 border-gray-200 overflow-hidden ${
                currentFloor.mapImageUrl ? '' : 'aspect-square'
              }`}
            >
              {currentFloor.mapImageUrl ? (
                <img
                  src={currentFloor.mapImageUrl}
                  alt={`Floor plan of ${currentFloor.name}`}
                  className="block w-full h-auto select-none"
                  draggable={false}
                />
              ) : (
                <GridBackground />
              )}

              {/* Location Markers */}
              {currentFloor.locations.map((location) => (
                <motion.button
                  key={location.id}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setSelectedLocation(location)}
                  className={`absolute transform -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full ${
                    locationTypes[location.type]?.color ?? 'bg-gray-500'
                  } text-white font-bold shadow-lg ring-2 ring-white flex items-center justify-center touch-button ${
                    selectedLocation?.id === location.id ? 'z-10' : ''
                  }`}
                  style={{ left: `${location.x}%`, top: `${location.y}%`, minWidth: 0, minHeight: 0 }}
                  aria-label={location.name}
                  aria-pressed={selectedLocation?.id === location.id}
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
                    <p className="text-gray-600">{locationTypes[selectedLocation.type]?.label ?? selectedLocation.type}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h5 className="font-medium mb-2">Directions:</h5>
                    <p className="text-sm text-gray-700 whitespace-pre-line">
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
                <p className="text-gray-500">
                  {currentFloor.locations.length
                    ? 'Tap a location marker to see details and directions'
                    : 'No locations have been added for this floor yet'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default Wayfinding;
