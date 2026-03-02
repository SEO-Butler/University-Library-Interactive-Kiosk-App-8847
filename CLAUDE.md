# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

University Library Interactive Kiosk App — a touch-friendly React SPA designed for physical kiosk hardware in a university library. It displays wayfinding maps, FAQs, announcements, QR codes for mobile links, and includes an admin panel for content management. Deployed to Netlify.

## Commands

- `npm run dev` — Start Vite dev server
- `npm run build` — Lint then build for production (outputs to `dist/`)
- `npm run lint` — ESLint (flat config, `eslint.config.js`)
- `npm run lint:error` — ESLint errors only (no warnings)
- `npm run preview` — Preview production build locally

No test framework is configured.

## Architecture

**Stack:** React 18 + Vite + Tailwind CSS 3 + Supabase + Framer Motion. Uses HashRouter (not BrowserRouter) for Netlify SPA compatibility.

**Path alias:** `@` maps to `./src` (configured in `vite.config.js`).

### State Management

Single `useReducer`-based context in `src/context/AppContext.jsx`. All app state flows through `AppProvider` → `useApp()` hook. The context exposes `state`, `dispatch`, and a convenience `actions` object (setLanguage, updateAccessibility, updateSettings, updateActivity, resetToDefault, refreshData). Settings persist to both localStorage and Supabase.

### Data Flow

`src/services/kioskService.js` contains all Supabase queries. Every fetch function returns hardcoded fallback data on error, so the app works offline. Supabase tables: `announcements_kiosk`, `faqs_kiosk`, `qr_links_kiosk`, `library_floors_kiosk`, `library_locations_kiosk`, `kiosk_settings`. The Supabase client is initialized in `src/lib/supabase.js` with hardcoded credentials (anon key).

### Routing

All routes defined in `App.jsx` via `AnimatedRoutes` wrapper (Framer Motion `AnimatePresence`):
- `/` — HomeScreen (navigation tiles, clock, quick info)
- `/wayfinding` — Interactive floor map with location markers
- `/faq` — Searchable/filterable FAQ accordion
- `/qr-generator` — QR code generator for library service links
- `/announcements` — Filterable news/events feed
- `/admin` — Password-protected CRUD panel (password: `admin123`)
- `/accessibility` — Toggle high contrast, large text, audio feedback

### Key Patterns

- **SafeIcon** (`src/common/SafeIcon.jsx`): Wrapper around `react-icons/fi` that gracefully falls back to a warning icon. All icons are imported via `* as FiIcons` then destructured — this avoids tree-shaking issues with react-icons.
- **IdleTimer** (`src/components/IdleTimer.jsx`): Global inactivity detector that shows a 30-second countdown warning then navigates home. Only active on non-home routes. Timeout is configurable via settings (default 5 min).
- **Touch-friendly UI**: All interactive elements use the `touch-button` CSS class (60px min touch target, 80px on mobile).
- **Accessibility CSS**: `.high-contrast` and `.large-text` classes applied at component root level, defined in `App.css`.

### Tailwind Theme

Custom `primary` (sky blue) and `secondary` (zinc) color scales, Inter font family, and custom animations (`fade-in`, `slide-up`, `pulse-slow`) in `tailwind.config.js`.
