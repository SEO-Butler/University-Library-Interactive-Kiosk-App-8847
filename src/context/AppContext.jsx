import React, { createContext, useContext, useReducer, useEffect } from 'react';
import {
  fetchAnnouncements,
  fetchFAQs,
  fetchQRLinks,
  fetchLibraryFloors,
  fetchLibraryLocations,
  fetchKioskSettings,
  updateKioskSettings
} from '../services/kioskService';

const AppContext = createContext();

const initialState = {
  currentLanguage: 'en',
  accessibility: {
    highContrast: false,
    largeText: false,
    audioEnabled: false,
  },
  settings: {
    idleTimeout: 300000, // 5 minutes
    autoResetHome: true,
    kioskMode: true,
  },
  content: {
    announcements: [],
    faqs: [],
    qrLinks: [],
    floors: [],
    locations: []
  },
  isLoading: false,
  error: null,
  lastActivity: Date.now(),
  initialLoadComplete: false // Add this flag to track initial load state
};

function appReducer(state, action) {
  switch (action.type) {
    case 'SET_LANGUAGE':
      return { ...state, currentLanguage: action.payload };
    case 'UPDATE_ACCESSIBILITY':
      return { ...state, accessibility: { ...state.accessibility, ...action.payload } };
    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_ANNOUNCEMENTS':
      return { ...state, content: { ...state.content, announcements: action.payload } };
    case 'SET_FAQS':
      return { ...state, content: { ...state.content, faqs: action.payload } };
    case 'SET_QR_LINKS':
      return { ...state, content: { ...state.content, qrLinks: action.payload } };
    case 'SET_FLOORS':
      return { ...state, content: { ...state.content, floors: action.payload } };
    case 'SET_LOCATIONS':
      return { ...state, content: { ...state.content, locations: action.payload } };
    case 'UPDATE_ACTIVITY':
      return { ...state, lastActivity: Date.now() };
    case 'SET_INITIAL_LOAD_COMPLETE':
      return { ...state, initialLoadComplete: true };
    case 'RESET_TO_DEFAULT':
      return { ...initialState, lastActivity: Date.now(), initialLoadComplete: state.initialLoadComplete };
    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('kioskSettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        dispatch({ type: 'UPDATE_ACCESSIBILITY', payload: parsed.accessibility });
        dispatch({ type: 'UPDATE_SETTINGS', payload: parsed.settings });
      } catch (error) {
        console.error('Error loading saved settings:', error);
      }
    }
    // Load data from Supabase
    fetchData();
  }, []);

  // Save settings to localStorage when they change
  useEffect(() => {
    const settingsToSave = {
      accessibility: state.accessibility,
      settings: state.settings
    };
    localStorage.setItem('kioskSettings', JSON.stringify(settingsToSave));

    // Optionally sync settings with Supabase
    try {
      updateKioskSettings('accessibility', state.accessibility);
      updateKioskSettings('general', {
        idleTimeout: state.settings.idleTimeout,
        autoResetHome: state.settings.autoResetHome,
        kioskMode: state.settings.kioskMode,
        language: state.currentLanguage
      });
    } catch (error) {
      console.error('Error syncing settings with Supabase:', error);
    }
  }, [state.accessibility, state.settings, state.currentLanguage]);

  const fetchData = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      // Fetch all data in parallel
      const [announcements, faqs, qrLinks, floors, locations, settings] = await Promise.all([
        fetchAnnouncements(),
        fetchFAQs(),
        fetchQRLinks(),
        fetchLibraryFloors(),
        fetchLibraryLocations(),
        fetchKioskSettings()
      ]);

      dispatch({ type: 'SET_ANNOUNCEMENTS', payload: announcements });
      dispatch({ type: 'SET_FAQS', payload: faqs });
      dispatch({ type: 'SET_QR_LINKS', payload: qrLinks });
      dispatch({ type: 'SET_FLOORS', payload: floors });
      dispatch({ type: 'SET_LOCATIONS', payload: locations });

      // Process settings if available
      if (settings && settings.length > 0) {
        const accessibilitySetting = settings.find(s => s.setting_key === 'accessibility');
        if (accessibilitySetting) {
          dispatch({ type: 'UPDATE_ACCESSIBILITY', payload: accessibilitySetting.setting_value });
        }

        const generalSetting = settings.find(s => s.setting_key === 'general');
        if (generalSetting) {
          dispatch({
            type: 'UPDATE_SETTINGS',
            payload: {
              idleTimeout: generalSetting.setting_value.idleTimeout,
              autoResetHome: generalSetting.setting_value.autoResetHome,
              kioskMode: generalSetting.setting_value.kioskMode
            }
          });
          if (generalSetting.setting_value.language) {
            dispatch({ type: 'SET_LANGUAGE', payload: generalSetting.setting_value.language });
          }
        }
      }

      dispatch({ type: 'SET_ERROR', payload: null });
      dispatch({ type: 'SET_INITIAL_LOAD_COMPLETE', payload: true });
    } catch (error) {
      console.error('Error fetching data:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load data. Please try again later.' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const value = {
    state,
    dispatch,
    actions: {
      setLanguage: (language) => dispatch({ type: 'SET_LANGUAGE', payload: language }),
      updateAccessibility: (settings) => dispatch({ type: 'UPDATE_ACCESSIBILITY', payload: settings }),
      updateSettings: (settings) => dispatch({ type: 'UPDATE_SETTINGS', payload: settings }),
      updateActivity: () => dispatch({ type: 'UPDATE_ACTIVITY' }),
      resetToDefault: () => dispatch({ type: 'RESET_TO_DEFAULT' }),
      refreshData: fetchData
    }
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}