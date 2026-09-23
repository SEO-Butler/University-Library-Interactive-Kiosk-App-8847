import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  FiGrid, FiBell, FiHelpCircle, FiLink, FiMap, FiImage, FiSettings, FiUsers, FiUser, FiLogOut, FiMenu, FiX, FiExternalLink
} from 'react-icons/fi';
import { useAuth } from '../auth';
import { cx } from './ui';

const NAV = [
  { to: '/', label: 'Dashboard', icon: FiGrid, end: true },
  { to: '/announcements', label: 'Announcements', icon: FiBell },
  { to: '/faqs', label: 'FAQs', icon: FiHelpCircle },
  { to: '/qr-links', label: 'QR links', icon: FiLink },
  { to: '/map', label: 'Floors & map', icon: FiMap },
  { to: '/media', label: 'Images', icon: FiImage },
  { to: '/settings', label: 'Kiosk settings', icon: FiSettings },
  { to: '/users', label: 'Users', icon: FiUsers, role: 'admin' }
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const items = NAV.filter((item) => !item.role || item.role === user.role);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const nav = (
    <nav className="flex-1 px-3 py-4 space-y-1" aria-label="Main">
      {items.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={() => setMenuOpen(false)}
          className={({ isActive }) =>
            cx(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              isActive ? 'bg-primary-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            )
          }
        >
          <Icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
          {label}
        </NavLink>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen lg:flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex lg:w-60 lg:flex-col bg-gray-900 text-white">
        <div className="px-5 py-5 border-b border-gray-800">
          <p className="text-xs uppercase tracking-wider text-gray-400">Library kiosk</p>
          <p className="text-lg font-semibold">Content manager</p>
        </div>
        {nav}
        <div className="px-3 py-3 border-t border-gray-800">
          <a
            href="../"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white"
          >
            <FiExternalLink className="h-4 w-4" aria-hidden="true" /> Open kiosk screen
          </a>
        </div>
      </aside>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-30 lg:hidden">
          <div className="absolute inset-0 bg-gray-900/60" onClick={() => setMenuOpen(false)} aria-hidden="true" />
          <aside className="relative w-64 h-full bg-gray-900 text-white flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
              <p className="text-lg font-semibold">Content manager</p>
              <button type="button" onClick={() => setMenuOpen(false)} aria-label="Close menu" className="p-1 text-gray-300">
                <FiX className="h-5 w-5" />
              </button>
            </div>
            {nav}
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-4 bg-white border-b border-gray-200 px-4 sm:px-6 h-14">
          <button
            type="button"
            className="lg:hidden p-2 -ml-2 rounded-md text-gray-600 hover:bg-gray-100"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            <FiMenu className="h-5 w-5" />
          </button>
          <div className="flex-1" />
          <NavLink to="/account" className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-700">
              <FiUser className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="hidden sm:inline">
              {user.displayName || user.username}
              <span className="ml-1.5 text-xs text-gray-400 uppercase">{user.role}</span>
            </span>
          </NavLink>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <FiLogOut className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </header>
        <main className="flex-1 px-4 sm:px-6 py-6 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
