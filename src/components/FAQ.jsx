import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { useApp } from '../context/AppContext';
import LoadingSpinner from './common/LoadingSpinner';

const { FiArrowLeft, FiSearch, FiChevronDown, FiChevronUp, FiHelpCircle, FiRefreshCw } = FiIcons;

function FAQ() {
  const navigate = useNavigate();
  const { state, actions } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    actions.updateActivity();
  }, [actions]);

  // Get unique categories from the data
  const categories = ['All', ...new Set(state.content.faqs.map(faq => faq.category))];

  const filteredFAQs = state.content.faqs.filter(faq => {
    const matchesSearch = 
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) || 
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleExpanded = (id) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
    actions.updateActivity();
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    actions.updateActivity();
  };

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

  if (state.isLoading) {
    return <LoadingSpinner message="Loading FAQs..." />;
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
        <h1 className="text-4xl font-bold text-primary-800">Help & FAQ</h1>
        <button
          onClick={handleRefresh}
          className={`flex items-center space-x-2 text-primary-600 hover:text-primary-700 p-2 rounded-full transition-colors ${isRefreshing ? 'animate-spin' : ''}`}
          disabled={isRefreshing}
        >
          <SafeIcon icon={FiRefreshCw} className="text-xl" />
        </button>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Search and Filter */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <SafeIcon icon={FiSearch} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
              <input
                type="text"
                placeholder="Search for answers..."
                value={searchTerm}
                onChange={handleSearch}
                className="w-full pl-12 pr-4 py-4 text-lg border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-3">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => {
                    setSelectedCategory(category);
                    actions.updateActivity();
                  }}
                  className={`px-6 py-3 rounded-xl transition-all touch-button ${
                    selectedCategory === category ? 'bg-primary-500 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {state.error && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 text-center">
              <p>{state.error}</p>
              <button
                onClick={handleRefresh}
                className="mt-2 text-red-600 hover:text-red-800 font-medium"
              >
                Try Again
              </button>
            </div>
          )}

          {filteredFAQs.length > 0 ? (
            filteredFAQs.map((faq) => (
              <motion.div
                key={faq.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-lg overflow-hidden"
              >
                <button
                  onClick={() => toggleExpanded(faq.id)}
                  className="w-full p-6 text-left hover:bg-gray-50 transition-colors touch-button"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm font-medium">
                          {faq.category}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-primary-800">
                        {faq.question}
                      </h3>
                    </div>
                    <SafeIcon
                      icon={expandedItems.has(faq.id) ? FiChevronUp : FiChevronDown}
                      className="text-2xl text-gray-400 ml-4"
                    />
                  </div>
                </button>

                <AnimatePresence>
                  {expandedItems.has(faq.id) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-6 pt-2">
                        <div className="bg-gray-50 rounded-xl p-4">
                          <p className="text-gray-700 leading-relaxed">
                            {faq.answer}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-2xl shadow-lg p-12 text-center"
            >
              <SafeIcon icon={FiHelpCircle} className="text-6xl text-gray-400 mx-auto mb-4" />
              <h3 className="text-2xl font-semibold text-gray-600 mb-2">No results found</h3>
              <p className="text-gray-500">
                Try adjusting your search terms or selecting a different category.
              </p>
            </motion.div>
          )}
        </div>

        {/* Help Contact */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-primary-50 rounded-2xl p-8 mt-8 text-center"
        >
          <h3 className="text-2xl font-semibold text-primary-800 mb-4">
            Still need help?
          </h3>
          <p className="text-primary-700 mb-6">
            Our friendly staff are here to assist you with any questions.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl p-4">
              <h4 className="font-semibold text-primary-800">Visit Us</h4>
              <p className="text-primary-600">Information Desk - Ground Floor</p>
            </div>
            <div className="bg-white rounded-xl p-4">
              <h4 className="font-semibold text-primary-800">Call Us</h4>
              <p className="text-primary-600">Extension 2150</p>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default FAQ;