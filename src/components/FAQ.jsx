import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { useApp } from '../context/AppContext';
import LoadingSpinner from './common/LoadingSpinner';

const { FiArrowLeft, FiSearch, FiChevronDown, FiChevronUp, FiHelpCircle, FiRefreshCw, FiMessageCircle, FiPhone, FiMapPin, FiX } = FiIcons;

/** Maps FAQ categories to gradient color pairs for visual distinction */
const categoryColors = {
  'All': { bg: 'from-primary-500 to-primary-600', light: 'bg-primary-50 text-primary-700 border-primary-200' },
  'General': { bg: 'from-blue-500 to-blue-600', light: 'bg-blue-50 text-blue-700 border-blue-200' },
  'Services': { bg: 'from-emerald-500 to-teal-600', light: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  'Technology': { bg: 'from-violet-500 to-purple-600', light: 'bg-violet-50 text-violet-700 border-violet-200' },
  'Spaces': { bg: 'from-amber-500 to-orange-600', light: 'bg-amber-50 text-amber-700 border-amber-200' },
  'Policies': { bg: 'from-rose-500 to-pink-600', light: 'bg-rose-50 text-rose-700 border-rose-200' },
};

function getCategoryStyle(category) {
  return categoryColors[category] || { bg: 'from-gray-500 to-gray-600', light: 'bg-gray-50 text-gray-700 border-gray-200' };
}

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

  const clearSearch = () => {
    setSearchTerm('');
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
          className="flex items-center space-x-3 text-primary-600 hover:text-primary-700 transition-colors touch-button group"
          onClick={handleBackToHome}
        >
          <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary-50 group-hover:bg-primary-100 transition-colors">
            <SafeIcon icon={FiArrowLeft} className="text-xl" />
          </span>
          <span className="text-lg font-medium">Back to Home</span>
        </Link>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
            <SafeIcon icon={FiHelpCircle} className="text-xl text-white" />
          </div>
          <h1 className="text-3xl font-bold text-primary-800">Help & FAQ</h1>
        </div>
        <button
          onClick={handleRefresh}
          className={`flex items-center justify-center w-10 h-10 rounded-xl bg-primary-50 hover:bg-primary-100 text-primary-600 transition-colors ${isRefreshing ? 'animate-spin' : ''}`}
          disabled={isRefreshing}
        >
          <SafeIcon icon={FiRefreshCw} className="text-lg" />
        </button>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Search and Filter - Frosted Glass Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-strong rounded-2xl p-6 mb-8 shadow-card"
        >
          <div className="space-y-5">
            {/* Search Bar */}
            <div className="relative search-glow rounded-2xl transition-all duration-300">
              <div className="absolute left-5 top-1/2 transform -translate-y-1/2 flex items-center justify-center w-8 h-8 rounded-lg bg-primary-100">
                <SafeIcon icon={FiSearch} className="text-primary-500 text-lg" />
              </div>
              <input
                type="text"
                placeholder="Search for answers..."
                value={searchTerm}
                onChange={handleSearch}
                className="w-full pl-16 pr-14 py-5 text-lg bg-white/60 border border-gray-200/80 rounded-2xl focus:outline-none focus:border-primary-300 focus:bg-white/90 transition-all duration-300 placeholder:text-gray-400"
              />
              {searchTerm && (
                <button
                  onClick={clearSearch}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                >
                  <SafeIcon icon={FiX} className="text-gray-500 text-sm" />
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-3">
              {categories.map((category) => {
                const isActive = selectedCategory === category;
                return (
                  <motion.button
                    key={category}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setSelectedCategory(category);
                      actions.updateActivity();
                    }}
                    className={`px-5 py-3 rounded-xl font-medium transition-all duration-300 touch-button text-sm ${
                      isActive
                        ? `bg-gradient-to-r ${getCategoryStyle(category).bg} text-white pill-active`
                        : 'bg-white/70 hover:bg-white border border-gray-200/80 text-gray-600 hover:text-gray-800 hover:border-gray-300'
                    }`}
                  >
                    {category}
                    {isActive && (
                      <span className="ml-2 bg-white/25 text-white text-xs px-2 py-0.5 rounded-full">
                        {category === 'All' ? state.content.faqs.length : filteredFAQs.length}
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Results count */}
        {searchTerm && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-gray-500 mb-4 pl-1"
          >
            {filteredFAQs.length} result{filteredFAQs.length !== 1 ? 's' : ''} found
            {searchTerm && <span> for "<strong className="text-gray-700">{searchTerm}</strong>"</span>}
          </motion.p>
        )}

        {/* FAQ Items */}
        <div className="space-y-4">
          {state.error && (
            <div className="glass-strong rounded-2xl border border-red-200/50 text-red-800 p-5 text-center">
              <p>{state.error}</p>
              <button
                onClick={handleRefresh}
                className="mt-3 text-red-600 hover:text-red-800 font-medium underline underline-offset-4"
              >
                Try Again
              </button>
            </div>
          )}

          <AnimatePresence mode="popLayout">
            {filteredFAQs.length > 0 ? (
              filteredFAQs.map((faq, index) => {
                const isExpanded = expandedItems.has(faq.id);
                const catStyle = getCategoryStyle(faq.category);
                return (
                  <motion.div
                    key={faq.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: index * 0.04 }}
                    className={`glass-strong rounded-2xl shadow-card overflow-hidden transition-shadow duration-300 ${
                      isExpanded ? 'shadow-card-hover ring-1 ring-primary-200/50' : 'hover:shadow-card-hover'
                    }`}
                  >
                    <button
                      onClick={() => toggleExpanded(faq.id)}
                      className="w-full p-6 text-left transition-colors touch-button"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3 mb-2.5">
                            <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold border ${catStyle.light}`}>
                              {faq.category}
                            </span>
                          </div>
                          <h3 className="text-lg font-semibold text-gray-800 leading-snug">
                            {faq.question}
                          </h3>
                        </div>
                        <motion.div
                          animate={{ rotate: isExpanded ? 180 : 0 }}
                          transition={{ duration: 0.3, ease: 'easeInOut' }}
                          className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-300 ${
                            isExpanded ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-400'
                          }`}
                        >
                          <SafeIcon icon={FiChevronDown} className="text-xl" />
                        </motion.div>
                      </div>
                    </button>

                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                          className="overflow-hidden"
                        >
                          <div className="px-6 pb-6">
                            <div className="bg-gradient-to-br from-primary-50/80 to-blue-50/60 rounded-xl p-5 border border-primary-100/50">
                              <p className="text-gray-700 leading-relaxed">
                                {faq.answer}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-strong rounded-2xl shadow-card p-16 text-center"
              >
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mx-auto mb-6">
                  <SafeIcon icon={FiSearch} className="text-4xl text-gray-400" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-700 mb-3">No results found</h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  We could not find any FAQs matching your search. Try different keywords or browse a different category.
                </p>
                <button
                  onClick={() => { setSearchTerm(''); setSelectedCategory('All'); }}
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-primary-50 hover:bg-primary-100 text-primary-700 rounded-xl font-medium transition-colors"
                >
                  <SafeIcon icon={FiRefreshCw} className="text-sm" />
                  <span>Clear filters</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Help Contact Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12 rounded-2xl overflow-hidden"
        >
          {/* Gradient header strip */}
          <div className="bg-gradient-to-r from-primary-600 via-primary-500 to-cyan-500 p-8 text-white text-center relative overflow-hidden">
            <div className="absolute inset-0 pattern-dots opacity-20" />
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                <SafeIcon icon={FiMessageCircle} className="text-3xl text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-2">
                Still need help?
              </h3>
              <p className="text-primary-100 max-w-lg mx-auto">
                Our friendly library staff are always here to assist you with any questions.
              </p>
            </div>
          </div>
          {/* Contact cards */}
          <div className="glass-strong p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-4 p-5 rounded-xl bg-white/70 border border-gray-100 hover:border-primary-200 hover:bg-white transition-all duration-300 group">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <SafeIcon icon={FiMapPin} className="text-xl text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">Visit Us</h4>
                  <p className="text-gray-500 text-sm">Information Desk - Ground Floor</p>
                </div>
              </div>
              <div className="flex items-center space-x-4 p-5 rounded-xl bg-white/70 border border-gray-100 hover:border-primary-200 hover:bg-white transition-all duration-300 group">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <SafeIcon icon={FiPhone} className="text-xl text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">Call Us</h4>
                  <p className="text-gray-500 text-sm">Extension 2150</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default FAQ;
