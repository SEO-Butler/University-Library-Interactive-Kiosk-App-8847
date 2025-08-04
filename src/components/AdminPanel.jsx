import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { useApp } from '../context/AppContext';
import {
  addAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  addFAQ,
  updateFAQ,
  deleteFAQ,
  addQRLink,
  updateQRLink,
  deleteQRLink
} from '../services/kioskService';
import LoadingSpinner from './common/LoadingSpinner';

const { 
  FiArrowLeft, FiLock, FiSettings, FiUsers, FiEdit, 
  FiTrash2, FiPlus, FiSave, FiX, FiRefreshCw, FiCheck 
} = FiIcons;

function AdminPanel() {
  const navigate = useNavigate();
  const { state, actions } = useApp();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('announcements');
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  useEffect(() => {
    actions.updateActivity();
  }, [actions]);

  const handleLogin = (e) => {
    e.preventDefault();
    // Simple password check - in production, use proper authentication
    if (password === 'admin123') {
      setIsAuthenticated(true);
      setPassword('');
    } else {
      alert('Invalid password');
    }
  };

  const tabs = [
    { id: 'announcements', label: 'Announcements', icon: FiEdit },
    { id: 'faqs', label: 'FAQs', icon: FiEdit },
    { id: 'qrlinks', label: 'QR Links', icon: FiEdit },
    { id: 'settings', label: 'Settings', icon: FiSettings }
  ];

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleAdd = () => {
    let initialData = {};
    
    if (activeTab === 'announcements') {
      initialData = {
        title: '',
        content: '',
        type: 'info',
        date: new Date().toISOString().split('T')[0],
        priority: 'medium'
      };
    } else if (activeTab === 'faqs') {
      initialData = {
        category: 'General',
        question: '',
        answer: ''
      };
    } else if (activeTab === 'qrlinks') {
      initialData = {
        name: '',
        url: '',
        description: ''
      };
    }
    
    setFormData(initialData);
    setEditingItem('new');
  };

  const handleEdit = (item) => {
    setFormData({ ...item });
    setEditingItem(item.id);
  };

  const handleCancel = () => {
    setEditingItem(null);
    setFormData({});
  };

  const handleSave = async () => {
    setIsProcessing(true);
    setStatusMessage(null);
    
    try {
      if (activeTab === 'announcements') {
        if (editingItem === 'new') {
          await addAnnouncement(formData);
        } else {
          await updateAnnouncement(editingItem, formData);
        }
      } else if (activeTab === 'faqs') {
        if (editingItem === 'new') {
          await addFAQ(formData);
        } else {
          await updateFAQ(editingItem, formData);
        }
      } else if (activeTab === 'qrlinks') {
        if (editingItem === 'new') {
          await addQRLink(formData);
        } else {
          await updateQRLink(editingItem, formData);
        }
      }
      
      await actions.refreshData();
      setStatusMessage({ type: 'success', text: 'Changes saved successfully!' });
      setEditingItem(null);
      setFormData({});
    } catch (error) {
      console.error('Error saving data:', error);
      setStatusMessage({ type: 'error', text: 'Error saving changes. Please try again.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
      return;
    }
    
    setIsProcessing(true);
    setStatusMessage(null);
    
    try {
      if (activeTab === 'announcements') {
        await deleteAnnouncement(id);
      } else if (activeTab === 'faqs') {
        await deleteFAQ(id);
      } else if (activeTab === 'qrlinks') {
        await deleteQRLink(id);
      }
      
      await actions.refreshData();
      setStatusMessage({ type: 'success', text: 'Item deleted successfully!' });
    } catch (error) {
      console.error('Error deleting item:', error);
      setStatusMessage({ type: 'error', text: 'Error deleting item. Please try again.' });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="min-h-screen p-8 flex items-center justify-center"
      >
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <SafeIcon icon={FiLock} className="text-6xl text-primary-600 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-primary-800 mb-2">Admin Access</h2>
            <p className="text-gray-600">Enter password to access admin panel</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <input
              type="password"
              placeholder="Admin Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-lg"
            />
            
            <button
              type="submit"
              className="w-full bg-primary-500 hover:bg-primary-600 text-white py-4 px-6 rounded-xl transition-colors touch-button text-lg font-medium"
            >
              Login
            </button>
          </form>
          
          <button
            onClick={() => navigate('/')}
            className="w-full mt-4 text-gray-500 hover:text-gray-700 transition-colors"
          >
            Back to Home
          </button>
        </div>
      </motion.div>
    );
  }

  if (state.isLoading) {
    return <LoadingSpinner message="Loading admin panel..." />;
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
        <button
          onClick={() => navigate('/')}
          className="flex items-center space-x-3 text-primary-600 hover:text-primary-700 transition-colors touch-button"
        >
          <SafeIcon icon={FiArrowLeft} className="text-2xl" />
          <span className="text-xl font-medium">Back to Home</span>
        </button>
        <h1 className="text-4xl font-bold text-primary-800">Admin Panel</h1>
        <button
          onClick={() => setIsAuthenticated(false)}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Logout
        </button>
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Status Message */}
        <AnimatePresence>
          {statusMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`mb-6 p-4 rounded-lg flex items-center justify-between ${
                statusMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}
            >
              <div className="flex items-center space-x-2">
                <SafeIcon icon={statusMessage.type === 'success' ? FiCheck : FiX} />
                <span>{statusMessage.text}</span>
              </div>
              <button onClick={() => setStatusMessage(null)}>
                <SafeIcon icon={FiX} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab Navigation */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-wrap gap-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-3 px-6 py-3 rounded-xl transition-all touch-button ${
                  activeTab === tab.id
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                <SafeIcon icon={tab.icon} className="text-lg" />
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {state.error && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 text-center mb-8">
            <p>{state.error}</p>
            <button 
              onClick={actions.refreshData}
              className="mt-2 text-red-600 hover:text-red-800 font-medium"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Content Area */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {isProcessing && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
              <div className="bg-white p-6 rounded-xl">
                <div className="loading-spinner mx-auto mb-4"></div>
                <p className="text-gray-800">Processing...</p>
              </div>
            </div>
          )}
          
          {activeTab === 'announcements' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-semibold text-primary-800">Manage Announcements</h3>
                {!editingItem && (
                  <button 
                    onClick={handleAdd}
                    className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <SafeIcon icon={FiPlus} />
                    <span>Add New</span>
                  </button>
                )}
              </div>
              
              {editingItem && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gray-50 p-6 rounded-xl mb-6"
                >
                  <h4 className="text-lg font-semibold mb-4">
                    {editingItem === 'new' ? 'Add New Announcement' : 'Edit Announcement'}
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                      <input
                        type="text"
                        name="title"
                        value={formData.title || ''}
                        onChange={handleFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                      <textarea
                        name="content"
                        value={formData.content || ''}
                        onChange={handleFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        rows="4"
                        required
                      ></textarea>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                        <select
                          name="type"
                          value={formData.type || 'info'}
                          onChange={handleFormChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        >
                          <option value="info">Information</option>
                          <option value="event">Event</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                        <input
                          type="date"
                          name="date"
                          value={formData.date || ''}
                          onChange={handleFormChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                        <select
                          name="priority"
                          value={formData.priority || 'medium'}
                          onChange={handleFormChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex justify-end space-x-3 pt-4">
                      <button
                        onClick={handleCancel}
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg flex items-center space-x-2"
                      >
                        <SafeIcon icon={FiSave} />
                        <span>Save</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
              
              <div className="space-y-4">
                {state.content.announcements.map((announcement) => (
                  <div key={announcement.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-semibold text-lg">{announcement.title}</h4>
                          {announcement.priority === 'high' && (
                            <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                              Important
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 text-sm mb-2">{announcement.content}</p>
                        <div className="flex items-center text-xs text-gray-500">
                          <span className="mr-3">{new Date(announcement.date).toLocaleDateString()}</span>
                          <span className="capitalize">{announcement.type}</span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleEdit(announcement)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <SafeIcon icon={FiEdit} />
                        </button>
                        <button 
                          onClick={() => handleDelete(announcement.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                        >
                          <SafeIcon icon={FiTrash2} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'faqs' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-semibold text-primary-800">Manage FAQs</h3>
                {!editingItem && (
                  <button 
                    onClick={handleAdd}
                    className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <SafeIcon icon={FiPlus} />
                    <span>Add New</span>
                  </button>
                )}
              </div>
              
              {editingItem && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gray-50 p-6 rounded-xl mb-6"
                >
                  <h4 className="text-lg font-semibold mb-4">
                    {editingItem === 'new' ? 'Add New FAQ' : 'Edit FAQ'}
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                      <select
                        name="category"
                        value={formData.category || 'General'}
                        onChange={handleFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="General">General</option>
                        <option value="Technology">Technology</option>
                        <option value="Services">Services</option>
                        <option value="Policies">Policies</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Question</label>
                      <input
                        type="text"
                        name="question"
                        value={formData.question || ''}
                        onChange={handleFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Answer</label>
                      <textarea
                        name="answer"
                        value={formData.answer || ''}
                        onChange={handleFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        rows="4"
                        required
                      ></textarea>
                    </div>
                    <div className="flex justify-end space-x-3 pt-4">
                      <button
                        onClick={handleCancel}
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg flex items-center space-x-2"
                      >
                        <SafeIcon icon={FiSave} />
                        <span>Save</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
              
              <div className="space-y-4">
                {state.content.faqs.map((faq) => (
                  <div key={faq.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="bg-primary-100 text-primary-800 text-xs px-2 py-1 rounded-full">
                            {faq.category}
                          </span>
                        </div>
                        <h4 className="font-semibold text-lg mb-2">{faq.question}</h4>
                        <p className="text-gray-600 text-sm">{faq.answer}</p>
                      </div>
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleEdit(faq)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <SafeIcon icon={FiEdit} />
                        </button>
                        <button 
                          onClick={() => handleDelete(faq.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                        >
                          <SafeIcon icon={FiTrash2} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'qrlinks' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-semibold text-primary-800">Manage QR Links</h3>
                {!editingItem && (
                  <button 
                    onClick={handleAdd}
                    className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <SafeIcon icon={FiPlus} />
                    <span>Add New</span>
                  </button>
                )}
              </div>
              
              {editingItem && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gray-50 p-6 rounded-xl mb-6"
                >
                  <h4 className="text-lg font-semibold mb-4">
                    {editingItem === 'new' ? 'Add New QR Link' : 'Edit QR Link'}
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name || ''}
                        onChange={handleFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                      <input
                        type="url"
                        name="url"
                        value={formData.url || ''}
                        onChange={handleFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea
                        name="description"
                        value={formData.description || ''}
                        onChange={handleFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        rows="2"
                        required
                      ></textarea>
                    </div>
                    <div className="flex justify-end space-x-3 pt-4">
                      <button
                        onClick={handleCancel}
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg flex items-center space-x-2"
                      >
                        <SafeIcon icon={FiSave} />
                        <span>Save</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
              
              <div className="space-y-4">
                {state.content.qrLinks.map((link) => (
                  <div key={link.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg mb-1">{link.name}</h4>
                        <p className="text-gray-600 text-sm mb-2">{link.description}</p>
                        <p className="text-blue-600 text-xs break-all">{link.url}</p>
                      </div>
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleEdit(link)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <SafeIcon icon={FiEdit} />
                        </button>
                        <button 
                          onClick={() => handleDelete(link.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                        >
                          <SafeIcon icon={FiTrash2} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div>
              <h3 className="text-2xl font-semibold text-primary-800 mb-6">Kiosk Settings</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Idle Timeout (minutes)
                    </label>
                    <input
                      type="number"
                      value={state.settings.idleTimeout / 60000}
                      onChange={(e) => actions.updateSettings({
                        idleTimeout: parseInt(e.target.value) * 60000
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="autoReset"
                      checked={state.settings.autoResetHome}
                      onChange={(e) => actions.updateSettings({
                        autoResetHome: e.target.checked
                      })}
                      className="rounded"
                    />
                    <label htmlFor="autoReset" className="text-sm font-medium text-gray-700">
                      Auto-reset to home screen
                    </label>
                  </div>

                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="kioskMode"
                      checked={state.settings.kioskMode}
                      onChange={(e) => actions.updateSettings({
                        kioskMode: e.target.checked
                      })}
                      className="rounded"
                    />
                    <label htmlFor="kioskMode" className="text-sm font-medium text-gray-700">
                      Enable kiosk mode
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Language
                    </label>
                    <select
                      value={state.currentLanguage}
                      onChange={(e) => actions.setLanguage(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                    </select>
                  </div>

                  <button
                    onClick={actions.resetToDefault}
                    className="mt-4 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg"
                  >
                    Reset to Default Settings
                  </button>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Current Status</h4>
                  <div className="space-y-2 text-sm">
                    <p>Language: {state.currentLanguage}</p>
                    <p>High Contrast: {state.accessibility.highContrast ? 'On' : 'Off'}</p>
                    <p>Large Text: {state.accessibility.largeText ? 'On' : 'Off'}</p>
                    <p>Audio Feedback: {state.accessibility.audioEnabled ? 'On' : 'Off'}</p>
                    <p>Idle Timeout: {state.settings.idleTimeout / 60000} minutes</p>
                    <p>Auto-Reset: {state.settings.autoResetHome ? 'Enabled' : 'Disabled'}</p>
                    <p>Kiosk Mode: {state.settings.kioskMode ? 'Enabled' : 'Disabled'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default AdminPanel;