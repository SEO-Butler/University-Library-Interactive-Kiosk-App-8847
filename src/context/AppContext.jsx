import React, { createContext, useContext, useReducer, useEffect, useMemo, useCallback, useRef } from 'react';
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

const SETTINGS_STORAGE_KEY = 'kioskSettings';
const CONTENT_STORAGE_KEY = 'kioskContentCache';
const REFRESH_INTERVAL_MS = 10 * 60 * 1000; // re-fetch content every 10 minutes

export const DEFAULT_IDLE_TIMEOUT = 300000; // 5 minutes
export const MIN_IDLE_TIMEOUT = 60000; // must exceed the 30s warning countdown
export const MAX_IDLE_TIMEOUT = 30 * 60000;

// Keeps a bad value (NaN, 0, a string) from Supabase, localStorage or the admin
// form from making the idle timer fire immediately on every page.
export function clampIdleTimeout(value) {
  const ms = Number(value);
  if (!Number.isFinite(ms) || ms <= 0) return DEFAULT_IDLE_TIMEOUT;
  return Math.min(MAX_IDLE_TIMEOUT, Math.max(MIN_IDLE_TIMEOUT, ms));
}

const defaultAccessibility = {
  highContrast: false,
  largeText: false,
  audioEnabled: false,
};

const emptyContent = {
  announcements: [],
  faqs: [],
  qrLinks: [],
  floors: [],
  locations: []
};

const initialState = {
  currentLanguage: 'en',
  accessibility: defaultAccessibility,
  settings: {
    idleTimeout: DEFAULT_IDLE_TIMEOUT,
    autoResetHome: true,
    kioskMode: true,
    language: 'en',
  },
  content: emptyContent,
  isLoading: false,
  error: null,
  initialLoadComplete: false
};

function sanitizeSettings(settings) {
  const clean = {};
  if (!settings || typeof settings !== 'object') return clean;
  if (settings.idleTimeout !== undefined) clean.idleTimeout = clampIdleTimeout(settings.idleTimeout);
  if (typeof settings.autoResetHome === 'boolean') clean.autoResetHome = settings.autoResetHome;
  if (typeof settings.kioskMode === 'boolean') clean.kioskMode = settings.kioskMode;
  if (typeof settings.language === 'string' && settings.language) clean.language = settings.language;
  return clean;
}

function readJSON(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.error(`Error reading ${key}:`, error);
    return null;
  }
}

function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing ${key}:`, error);
  }
}

function init(state) {
  // Start from the last good content so the kiosk still works if it boots offline.
  const cachedContent = readJSON(CONTENT_STORAGE_KEY) ?? {};
  const content = { ...emptyContent };
  Object.keys(emptyContent).forEach((key) => {
    if (Array.isArray(cachedContent[key])) content[key] = cachedContent[key];
  });
  const savedSettings = sanitizeSettings(readJSON(SETTINGS_STORAGE_KEY)?.settings);
  const settings = { ...state.settings, ...savedSettings };
  return {
    ...state,
    settings,
    currentLanguage: settings.language,
    content,
  };
}

function appReducer(state, action) {
  switch (action.type) {
    case 'SET_LANGUAGE':
      return { ...state, currentLanguage: action.payload };
    case 'UPDATE_ACCESSIBILITY':
      return { ...state, accessibility: { ...state.accessibility, ...action.payload } };
    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...sanitizeSettings(action.payload) } };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_CONTENT':
      return { ...state, content: { ...state.content, ...action.payload } };
    case 'SET_INITIAL_LOAD_COMPLETE':
      return { ...state, initialLoadComplete: true };
    case 'RESET_SESSION':
      // Clear only what the previous visitor changed. Content and admin settings stay.
      if (state.accessibility === defaultAccessibility && state.currentLanguage === state.settings.language) {
        return state;
      }
      return { ...state, accessibility: defaultAccessibility, currentLanguage: state.settings.language };
    default:
      return state;
  }
}

const CONTENT_FETCHERS = {
  announcements: fetchAnnouncements,
  faqs: fetchFAQs,
  qrLinks: fetchQRLinks,
  floors: fetchLibraryFloors,
  locations: fetchLibraryLocations,
};

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState, init);
  const stateRef = useRef(state);
  stateRef.current = state;
  const fetchingRef = useRef(false);

  const fetchData = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    // Pages show a full-screen spinner while loading, so only use it on a cold start
    // with nothing to show. Background refreshes happen silently.
    const { content, initialLoadComplete } = stateRef.current;
    const hasContent = Object.values(content).some((items) => items.length > 0);
    if (!initialLoadComplete && !hasContent) {
      dispatch({ type: 'SET_LOADING', payload: true });
    }
    try {
      const keys = Object.keys(CONTENT_FETCHERS);
      const [settingsResult, ...contentResults] = await Promise.allSettled([
        fetchKioskSettings(),
        ...keys.map((key) => CONTENT_FETCHERS[key]())
      ]);

      // Only replace sections that loaded. Failed ones keep the last good data.
      const loaded = {};
      contentResults.forEach((result, i) => {
        if (result.status === 'fulfilled') loaded[keys[i]] = result.value;
      });
      if (Object.keys(loaded).length > 0) {
        dispatch({ type: 'SET_CONTENT', payload: loaded });
        writeJSON(CONTENT_STORAGE_KEY, { ...stateRef.current.content, ...loaded });
      }

      if (settingsResult.status === 'fulfilled') {
        const general = settingsResult.value.find((s) => s.setting_key === 'general');
        if (general?.setting_value) {
          const remote = sanitizeSettings(general.setting_value);
          dispatch({ type: 'UPDATE_SETTINGS', payload: remote });
          writeJSON(SETTINGS_STORAGE_KEY, { settings: { ...stateRef.current.settings, ...remote } });
          // Only change the visible language if no visitor has picked one this session.
          if (remote.language && stateRef.current.currentLanguage === stateRef.current.settings.language) {
            dispatch({ type: 'SET_LANGUAGE', payload: remote.language });
          }
        }
      }

      const anyFailed = [settingsResult, ...contentResults].some((r) => r.status === 'rejected');
      dispatch({
        type: 'SET_ERROR',
        payload: anyFailed ? 'Some information could not be updated. Showing the most recent saved version.' : null
      });
      dispatch({ type: 'SET_INITIAL_LOAD_COMPLETE' });
    } finally {
      fetchingRef.current = false;
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  // Initial load, periodic refresh, and a retry as soon as the network comes back.
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, REFRESH_INTERVAL_MS);
    window.addEventListener('online', fetchData);
    return () => {
      clearInterval(interval);
      window.removeEventListener('online', fetchData);
    };
  }, [fetchData]);

  // Admin-only: save the kiosk settings locally and to Supabase. Visitors' accessibility
  // choices are never written anywhere, so they can't leak to the next user or other kiosks.
  const saveSettings = useCallback(async (settings) => {
    const next = { ...stateRef.current.settings, ...sanitizeSettings(settings) };
    dispatch({ type: 'UPDATE_SETTINGS', payload: next });
    dispatch({ type: 'SET_LANGUAGE', payload: next.language });
    writeJSON(SETTINGS_STORAGE_KEY, { settings: next });
    await updateKioskSettings('general', next);
  }, []);

  const actions = useMemo(() => ({
    setLanguage: (language) => dispatch({ type: 'SET_LANGUAGE', payload: language }),
    updateAccessibility: (settings) => dispatch({ type: 'UPDATE_ACCESSIBILITY', payload: settings }),
    saveSettings,
    resetSession: () => dispatch({ type: 'RESET_SESSION' }),
    refreshData: fetchData
  }), [fetchData, saveSettings]);

  const value = useMemo(() => ({ state, dispatch, actions }), [state, actions]);

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
