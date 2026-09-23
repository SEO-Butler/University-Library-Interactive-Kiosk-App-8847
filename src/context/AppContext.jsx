import React, { createContext, useContext, useReducer, useEffect, useMemo, useCallback, useRef } from 'react';
import { fetchKioskContent } from '../lib/api';

const AppContext = createContext();

// Bumped whenever the cached shape changes so an old cache is ignored.
const CACHE_STORAGE_KEY = 'kioskContentCache.v2';
const REFRESH_INTERVAL_MS = 10 * 60 * 1000; // re-fetch content every 10 minutes

export const DEFAULT_IDLE_TIMEOUT = 300000; // 5 minutes
export const MIN_IDLE_TIMEOUT = 60000; // must exceed the 30s warning countdown
export const MAX_IDLE_TIMEOUT = 30 * 60000;

// Keeps a bad value (NaN, 0, a string) from the server or localStorage from making
// the idle timer fire immediately on every page.
export function clampIdleTimeout(value) {
  const ms = Number(value);
  if (!Number.isFinite(ms) || ms <= 0) return DEFAULT_IDLE_TIMEOUT;
  return Math.min(MAX_IDLE_TIMEOUT, Math.max(MIN_IDLE_TIMEOUT, ms));
}

const defaultAccessibility = {
  highContrast: false,
  largeText: false,
  audioEnabled: false
};

const emptyContent = {
  announcements: [],
  faqs: [],
  qrLinks: [],
  floors: [],
  locations: []
};

// Kiosk behaviour, edited in the CMS under Settings.
const defaultSettings = {
  idleTimeout: DEFAULT_IDLE_TIMEOUT,
  autoResetHome: true
};

// Library details shown on the screens, edited in the CMS under Settings.
export const defaultSite = {
  libraryName: 'University Library',
  welcomeMessage: 'Welcome! How can we help you today?',
  openingHours: '',
  wifiNetwork: '',
  helpDeskName: 'Information Desk',
  helpDeskLocation: 'Ground Floor',
  helpPhone: ''
};

const initialState = {
  accessibility: defaultAccessibility,
  settings: defaultSettings,
  site: defaultSite,
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
  return clean;
}

function sanitizeSite(site) {
  const clean = {};
  if (!site || typeof site !== 'object') return clean;
  Object.keys(defaultSite).forEach((key) => {
    if (typeof site[key] === 'string') clean[key] = site[key];
  });
  return clean;
}

function sanitizeContent(content) {
  const clean = {};
  if (!content || typeof content !== 'object') return clean;
  Object.keys(emptyContent).forEach((key) => {
    if (Array.isArray(content[key])) clean[key] = content[key];
  });
  return clean;
}

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.error('Error reading content cache:', error);
    return null;
  }
}

function writeCache(value) {
  try {
    localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(value));
  } catch (error) {
    console.error('Error writing content cache:', error);
  }
}

function init(state) {
  // Caches written by the previous (Supabase-based) version are no longer read.
  try {
    localStorage.removeItem('kioskSettings');
    localStorage.removeItem('kioskContentCache');
  } catch {
    // storage unavailable; nothing to clean
  }
  // Start from the last good content so the kiosk still works if it boots offline.
  const cached = readCache() ?? {};
  return {
    ...state,
    content: { ...emptyContent, ...sanitizeContent(cached.content) },
    settings: { ...defaultSettings, ...sanitizeSettings(cached.settings) },
    site: { ...defaultSite, ...sanitizeSite(cached.site) }
  };
}

function appReducer(state, action) {
  switch (action.type) {
    case 'UPDATE_ACCESSIBILITY':
      return { ...state, accessibility: { ...state.accessibility, ...action.payload } };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_REMOTE':
      return {
        ...state,
        content: { ...emptyContent, ...action.payload.content },
        settings: { ...defaultSettings, ...action.payload.settings },
        site: { ...defaultSite, ...action.payload.site }
      };
    case 'SET_INITIAL_LOAD_COMPLETE':
      return { ...state, initialLoadComplete: true };
    case 'RESET_SESSION':
      // Clear only what the previous visitor changed. Content and settings stay.
      if (state.accessibility === defaultAccessibility) return state;
      return { ...state, accessibility: defaultAccessibility };
    default:
      return state;
  }
}

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
      const bundle = await fetchKioskContent();
      const next = {
        content: sanitizeContent(bundle),
        settings: sanitizeSettings(bundle.settings?.general),
        site: sanitizeSite(bundle.settings?.site)
      };
      dispatch({ type: 'SET_REMOTE', payload: next });
      writeCache(next);
      dispatch({ type: 'SET_ERROR', payload: null });
    } catch (error) {
      // Keep the last good content instead of silently swapping in placeholder data.
      console.error('Content refresh failed:', error);
      dispatch({
        type: 'SET_ERROR',
        payload: 'Some information could not be updated. Showing the most recent saved version.'
      });
    } finally {
      dispatch({ type: 'SET_INITIAL_LOAD_COMPLETE' });
      dispatch({ type: 'SET_LOADING', payload: false });
      fetchingRef.current = false;
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

  // Visitors' accessibility choices live only in memory, so they can't leak to the
  // next user or to other kiosks.
  const actions = useMemo(() => ({
    updateAccessibility: (settings) => dispatch({ type: 'UPDATE_ACCESSIBILITY', payload: settings }),
    resetSession: () => dispatch({ type: 'RESET_SESSION' }),
    refreshData: fetchData
  }), [fetchData]);

  const value = useMemo(() => ({ state, actions }), [state, actions]);

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
