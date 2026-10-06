import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { Camera, BookOpen, Package, User, Sun, Moon } from 'lucide-react';
import { sounds } from '../../services/audio';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userProfile, setUserProfile, pantryStock } = useAppStore();

  const isDarkMode = userProfile.theme === 'dark';

  const toggleTheme = () => {
    sounds.playTap();
    setUserProfile({ theme: isDarkMode ? 'light' : 'dark' });
  };

  // Count expiring items (within 7 days) — use neutral badge, not red
  const expiringCount = pantryStock.filter((item) => {
    if (!item.expiryDate) return false;
    const diffDays = (new Date(item.expiryDate).getTime() - Date.now()) / (1000 * 3600 * 24);
    return diffDays <= 7 && diffDays >= -1;
  }).length;

  const isCookMode = location.pathname.startsWith('/cook/');

  return (
    <>
      {/* Desktop top bar */}
      <header id="app-header-nav">
        <div className="nav-inner-container">
          {/* Wordmark */}
          <NavLink
            to="/recipes"
            className="brand-wordmark"
            onClick={() => sounds.playTap()}
            aria-label="Smart Palette home"
          >
            Smart Palette
          </NavLink>

          {/* Desktop nav links */}
          {!isCookMode && (
            <nav className="desktop-nav-links" aria-label="Main navigation">
              <NavLink
                to="/recipes"
                className={({ isActive }) => `nav-link-item ${isActive ? 'active' : ''}`}
                onClick={() => sounds.playTap()}
              >
                <BookOpen size={16} />
                <span>Recipes</span>
              </NavLink>

              <NavLink
                to="/pantry"
                className={({ isActive }) => `nav-link-item ${isActive ? 'active' : ''}`}
                onClick={() => sounds.playTap()}
              >
                <Package size={16} />
                <span>Pantry</span>
                {expiringCount > 0 && (
                  <span
                    className="nav-count-badge"
                    title={`${expiringCount} items expiring soon`}
                    aria-label={`${expiringCount} items expiring soon`}
                  >
                    {expiringCount}
                  </span>
                )}
              </NavLink>

              <NavLink
                to="/profile"
                className={({ isActive }) => `nav-link-item ${isActive ? 'active' : ''}`}
                onClick={() => sounds.playTap()}
              >
                <User size={16} />
                <span>Preferences</span>
              </NavLink>
            </nav>
          )}

          {/* Action group */}
          <div className="header-action-group">
            <button
              className="theme-toggle-btn"
              onClick={toggleTheme}
              title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-label="Toggle color theme"
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* One primary action: Quick Scan — only when not already on scan or cook page */}
            {location.pathname !== '/' && !isCookMode && (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => {
                  sounds.playTap();
                  navigate('/');
                }}
                id="btn-quick-scan"
              >
                <Camera size={14} />
                <span>Quick scan</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile bottom tab bar */}
      {!isCookMode && (
        <nav id="mobile-bottom-nav" aria-label="Mobile navigation">
          <NavLink
            to="/"
            className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
            onClick={() => sounds.playTap()}
            aria-label="Scan"
          >
            <Camera size={20} />
            <span>Scan</span>
          </NavLink>

          <NavLink
            to="/recipes"
            className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
            onClick={() => sounds.playTap()}
            aria-label="Recipes"
          >
            <BookOpen size={20} />
            <span>Recipes</span>
          </NavLink>

          <NavLink
            to="/pantry"
            className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
            onClick={() => sounds.playTap()}
            aria-label="Pantry"
          >
            <Package size={20} />
            <span>Pantry</span>
          </NavLink>

          <NavLink
            to="/profile"
            className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
            onClick={() => sounds.playTap()}
            aria-label="Preferences"
          >
            <User size={20} />
            <span>Profile</span>
          </NavLink>
        </nav>
      )}
    </>
  );
};
