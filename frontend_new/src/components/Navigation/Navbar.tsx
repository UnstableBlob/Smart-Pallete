import { BookOpen, Camera, Moon, Package, Sun, User } from 'lucide-react';
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { sounds } from '../../services/audio';
import { useAppStore } from '../../store/useAppStore';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const { userProfile, setUserProfile, pantryStock } = useAppStore();

  const isDarkMode = userProfile.theme === 'dark';

  const toggleTheme = () => {
    sounds.playTap();
    setUserProfile({ theme: isDarkMode ? 'light' : 'dark' });
  };

  // Count expiring soon items (within 48h)
  const expiringCount = pantryStock.filter((item) => {
    if (!item.expiryDate) return false;
    const diffHours = (new Date(item.expiryDate).getTime() - Date.now()) / (1000 * 3600);
    return diffHours <= 48 && diffHours >= -24;
  }).length;

  return (
    <>
      {/* Top Header Bar for Desktop & Tablet */}
      <header id="app-header-nav">
        <div className="nav-inner-container">
          {/* Logo & Branding */}
          <NavLink to="/" className="brand-wordmark" onClick={() => sounds.playTap()}>Smart Palette</NavLink>

          {/* Desktop Nav Items */}
          <nav className="desktop-nav-links" aria-label="Main Navigation">
            <NavLink
              to="/"
              className={({ isActive }) => `nav-link-item ${isActive ? 'active' : ''}`}
              onClick={() => sounds.playTap()}
            >
              <Camera size={18} />
              <span>Scan</span>
            </NavLink>

            <NavLink
              to="/recipes"
              className={({ isActive }) => `nav-link-item ${isActive ? 'active' : ''}`}
              onClick={() => sounds.playTap()}
            >
              <BookOpen size={18} />
              <span>Recipes</span>
            </NavLink>

            <NavLink
              to="/pantry"
              className={({ isActive }) => `nav-link-item ${isActive ? 'active' : ''}`}
              onClick={() => sounds.playTap()}
            >
              <Package size={18} />
              <span>Pantry</span>
              {expiringCount > 0 && (
                <span
                  className="nav-count-badge"
                  title={`${expiringCount} items expiring soon`}
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
              <User size={18} />
              <span>Profile</span>
            </NavLink>
          </nav>

          {/* Action Group */}
          <div className="header-action-group">
            <button
              className="theme-toggle-btn"
              onClick={toggleTheme}
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle color theme"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {location.pathname !== '/' && (
              <NavLink
                to="/"
                className="btn btn-primary"
                onClick={() => sounds.playTap()}
              >
                <span>Quick scan</span>
              </NavLink>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav id="mobile-bottom-nav" aria-label="Mobile Navigation">
        <NavLink
          to="/recipes"
          className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
          onClick={() => sounds.playTap()}
        >
          <BookOpen size={20} />
          <span>Recipes</span>
        </NavLink>

        <NavLink
          to="/"
          className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
          aria-label="Scan Fridge"
          onClick={() => sounds.playTap()}
        >
          <Camera size={19} />
          <span>Scan</span>
        </NavLink>

        <NavLink
          to="/pantry"
          className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
          onClick={() => sounds.playTap()}
        >
          <Package size={20} />
          <span>Pantry</span>
        </NavLink>

        <NavLink
          to="/profile"
          className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
          onClick={() => sounds.playTap()}
        >
          <User size={20} />
          <span>Profile</span>
        </NavLink>
      </nav>
    </>
  );
};
