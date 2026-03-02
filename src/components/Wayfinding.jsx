import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { useApp } from '../context/AppContext';
import LoadingSpinner from './common/LoadingSpinner';

const { FiArrowLeft, FiMapPin, FiNavigation, FiLayers, FiRefreshCw, FiX, FiCornerRightDown } = FiIcons;

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
    entrance: { color: 'bg-emerald-500', ringColor: 'ring-emerald-400', textColor: 'text-emerald-700', bgLight: 'bg-emerald-50', icon: FiNavigation },
    service: { color: 'bg-blue-500', ringColor: 'ring-blue-400', textColor: 'text-blue-700', bgLight: 'bg-blue-50', icon: FiNavigation },
    amenity: { color: 'bg-amber-500', ringColor: 'ring-amber-400', textColor: 'text-amber-700', bgLight: 'bg-amber-50', icon: FiNavigation },
    collection: { color: 'bg-violet-500', ringColor: 'ring-violet-400', textColor: 'text-violet-700', bgLight: 'bg-violet-50', icon: FiNavigation },
    technology: { color: 'bg-rose-500', ringColor: 'ring-rose-400', textColor: 'text-rose-700', bgLight: 'bg-rose-50', icon: FiNavigation },
    study: { color: 'bg-yellow-500', ringColor: 'ring-yellow-400', textColor: 'text-yellow-700', bgLight: 'bg-yellow-50', icon: FiNavigation }
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
      className={`min-h-screen p-6 md:p-8 ${state.accessibility.highContrast ? 'high-contrast' : ''} ${state.accessibility.largeText ? 'large-text' : ''}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8 max-w-7xl mx-auto">
        <Link
          to="/"
          className="flex items-center gap-3 glass rounded-xl px-5 py-3 text-primary-700 hover:text-primary-800 hover:shadow-md transition-all duration-300 touch-button group"
          onClick={handleBackToHome}
        >
          <SafeIcon icon={FiArrowLeft} className="text-xl group-hover:-translate-x-1 transition-transform duration-300" />
          <span className="text-lg font-medium">Home</span>
        </Link>

        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl px-5 py-2.5 shadow-md shadow-primary-500/20">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
              <SafeIcon icon={FiMapPin} className="text-xl" />
              Library Map
            </h1>
          </div>
        </div>

        <button
          onClick={handleRefresh}
          className={`glass rounded-xl p-3 text-primary-600 hover:text-primary-700 hover:shadow-md transition-all duration-300 ${isRefreshing ? 'animate-spin' : ''}`}
          disabled={isRefreshing}
          aria-label="Refresh map data"
        >
          <SafeIcon icon={FiRefreshCw} className="text-xl" />
        </button>
      </div>

      {state.error && (
        <div className="max-w-md mx-auto glass rounded-2xl p-4 text-center mb-8 border border-red-200/50">
          <p className="text-red-700">{state.error}</p>
          <button
            onClick={handleRefresh}
            className="mt-2 text-red-600 hover:text-red-800 font-medium"
          >
            Try Again
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Floor Selection */}
        <div className="lg:col-span-1">
          <div className="glass-strong rounded-2xl shadow-lg p-5">
            <h3 className="text-lg font-bold text-primary-800 mb-4 flex items-center gap-2">
              <div className="bg-primary-100 text-primary-600 rounded-lg p-1.5">
                <SafeIcon icon={FiLayers} className="text-base" />
              </div>
              Select Floor
            </h3>
            <div className="space-y-2">
              {floors.map((floor) => (
                <motion.button
                  key={floor.id}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    setSelectedFloor(floor.id);
                    setSelectedLocation(null);
                  }}
                  className={`w-full p-4 rounded-xl transition-all duration-300 touch-button font-medium text-left ${
                    selectedFloor === floor.id
                      ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md shadow-primary-500/25'
                      : 'bg-white/60 hover:bg-white/80 text-secondary-700 hover:shadow-sm border border-transparent hover:border-primary-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{floor.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      selectedFloor === floor.id
                        ? 'bg-white/20 text-white'
                        : 'bg-secondary-100 text-secondary-500'
                    }`}>
                      {floor.locations.length}
                    </span>
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Legend */}
            <div className="mt-6 pt-5 border-t border-primary-100/50">
              <h4 className="text-sm font-bold text-primary-800 mb-3 uppercase tracking-wider">Legend</h4>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(locationTypes).map(([type, config]) => (
                  <div key={type} className="flex items-center gap-2 py-1">
                    <div className={`w-3 h-3 rounded-full ${config.color} ring-2 ${config.ringColor} ring-offset-1`} />
                    <span className="text-xs font-medium text-secondary-600 capitalize">{type.replace('-', ' ')}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Map Display */}
        <div className="lg:col-span-2">
          <div className="glass-strong rounded-2xl shadow-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-primary-800">
                {currentFloor.name}
              </h3>
              <span className="text-sm text-secondary-500 font-medium">
                {currentFloor.locations.length} location{currentFloor.locations.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Interactive Map */}
            <div className="relative bg-gradient-to-br from-secondary-50 to-primary-50/30 rounded-2xl aspect-square border border-primary-100/60 overflow-hidden shadow-inner">
              {/* Floor Plan Background Grid */}
              <div className="absolute inset-0">
                <svg className="w-full h-full opacity-[0.08]">
                  <defs>
                    <pattern
                      id="grid"
                      width="24"
                      height="24"
                      patternUnits="userSpaceOnUse"
                    >
                      <path
                        d="M 24 0 L 0 0 0 24"
                        fill="none"
                        stroke="#0ea5e9"
                        strokeWidth="0.5"
                      />
                    </pattern>
                    <pattern
                      id="gridLarge"
                      width="96"
                      height="96"
                      patternUnits="userSpaceOnUse"
                    >
                      <rect width="96" height="96" fill="url(#grid)" />
                      <path
                        d="M 96 0 L 0 0 0 96"
                        fill="none"
                        stroke="#0ea5e9"
                        strokeWidth="1"
                      />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#gridLarge)" />
                </svg>
              </div>

              {/* Location Markers */}
              <AnimatePresence mode="wait">
                {currentFloor.locations.map((location) => {
                  const typeConfig = locationTypes[location.type] || locationTypes.service;
                  const isSelected = selectedLocation && selectedLocation.id === location.id;
                  return (
                    <motion.button
                      key={location.id}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{
                        scale: isSelected ? 1.3 : 1,
                        opacity: 1,
                      }}
                      exit={{ scale: 0, opacity: 0 }}
                      whileHover={{ scale: isSelected ? 1.35 : 1.2 }}
                      whileTap={{ scale: 0.9 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      onClick={() => handleLocationClick(location)}
                      className={`absolute transform -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full ${typeConfig.color} text-white font-bold shadow-lg hover:shadow-xl transition-shadow duration-200 touch-button flex items-center justify-center ${
                        isSelected ? 'ring-4 ring-primary-300 ring-offset-2 z-20' : 'z-10'
                      }`}
                      style={{ left: `${location.x}%`, top: `${location.y}%` }}
                      title={location.name}
                    >
                      <SafeIcon icon={FiMapPin} className="text-base drop-shadow-sm" />

                      {/* Pulse ring on selected */}
                      {isSelected && (
                        <motion.span
                          className={`absolute inset-0 rounded-full ${typeConfig.color} opacity-40`}
                          animate={{ scale: [1, 2], opacity: [0.4, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
                        />
                      )}
                    </motion.button>
                  );
                })}
              </AnimatePresence>

              {/* Tap instruction when no selection */}
              {!selectedLocation && currentFloor.locations.length > 0 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 glass rounded-full px-4 py-2 text-sm text-secondary-500 font-medium pointer-events-none">
                  Tap a marker to see details
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Location Details */}
        <div className="lg:col-span-1">
          <div className="glass-strong rounded-2xl shadow-lg p-5 min-h-[200px]">
            <AnimatePresence mode="wait">
              {selectedLocation ? (
                <motion.div
                  key={selectedLocation.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ type: "spring", stiffness: 200, damping: 25 }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-primary-800 flex items-center gap-2">
                      <div className="bg-primary-100 text-primary-600 rounded-lg p-1.5">
                        <SafeIcon icon={FiNavigation} className="text-base" />
                      </div>
                      Details
                    </h3>
                    <button
                      onClick={() => setSelectedLocation(null)}
                      className="text-secondary-400 hover:text-secondary-600 p-1.5 rounded-lg hover:bg-secondary-100 transition-colors"
                      aria-label="Close details"
                    >
                      <SafeIcon icon={FiX} className="text-lg" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-bold text-xl text-secondary-800">{selectedLocation.name}</h4>
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className={`w-2.5 h-2.5 rounded-full ${(locationTypes[selectedLocation.type] || locationTypes.service).color}`} />
                        <span className={`text-sm font-medium capitalize ${(locationTypes[selectedLocation.type] || locationTypes.service).textColor}`}>
                          {selectedLocation.type.replace('-', ' ')}
                        </span>
                      </div>
                    </div>

                    <div className={`${(locationTypes[selectedLocation.type] || locationTypes.service).bgLight} rounded-xl p-4 border border-white/50`}>
                      <div className="flex items-start gap-2 mb-2">
                        <SafeIcon icon={FiCornerRightDown} className="text-sm text-secondary-400 mt-0.5 flex-shrink-0" />
                        <h5 className="font-semibold text-sm text-secondary-700">Directions</h5>
                      </div>
                      <p className="text-sm text-secondary-600 leading-relaxed pl-5">
                        {selectedLocation.directions || `${selectedLocation.name} is located on ${currentFloor.name}.`}
                      </p>
                    </div>

                    <button
                      onClick={() => setSelectedLocation(null)}
                      className="w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white py-3 px-4 rounded-xl transition-all duration-300 shadow-md shadow-primary-500/20 hover:shadow-lg touch-button font-medium"
                    >
                      Clear Selection
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-12 px-4"
                >
                  <div className="bg-primary-50 rounded-2xl p-5 mb-4">
                    <SafeIcon icon={FiMapPin} className="text-4xl text-primary-300" />
                  </div>
                  <p className="text-secondary-400 text-center font-medium leading-relaxed">
                    Tap a location marker on the map to see details and directions
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default Wayfinding;
