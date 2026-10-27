import {
  AlertTriangle,
  BookOpen,
  Camera,
  Moon,
  Package,
  Sparkles,
  Sun,
  User,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { sounds } from '../../services/audio';
import { useAppStore } from '../../store/useAppStore';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userProfile, setUserProfile, pantryStock } = useAppStore();

  const isDarkMode = userProfile.theme === 'dark';

  const toggleTheme = () => {
    sounds.playTap();
    setUserProfile({ theme: isDarkMode ? 'light' : 'dark' }, false);
  };

  const [referenceTime] = useState(() => Date.now());

  // Count expiring soon items (within 48h)
  const expiringCount = useMemo(() => {
    return pantryStock.filter((item) => {
      if (!item.expiryDate) return false;
      const diffHours = (new Date(item.expiryDate).getTime() - referenceTime) / (1000 * 3600);
      return diffHours <= 48 && diffHours >= -24;
    }).length;
  }, [pantryStock, referenceTime]);

  const isCookMode = location.pathname.startsWith('/cook');

  return (
    <>
      {/* =========================================================================
          DESKTOP SIDEBAR NAVIGATION RAIL (>= 1024px)
          ========================================================================= */}
      <aside className="desktop-sidebar-rail" aria-label="Desktop Navigation Rail">
        {/* Brand Wordmark & Organic Emblem */}
        <div className="sidebar-brand-container">
          <NavLink
            to="/"
            className="brand-anchor"
            onClick={() => sounds.playTap()}
          >
            <div className="brand-logo-mark">
              <span className="material-symbols-outlined brand-leaf-icon">eco</span>
            </div>
            <div className="brand-text-block">
              <span className="brand-title">Smart Palette</span>
              <span className="brand-tagline">Organic Culinary AI</span>
            </div>
          </NavLink>
        </div>

        {/* Primary Route Navigation Links */}
        <nav className="sidebar-nav-menu" aria-label="Main Route Links">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
            onClick={() => sounds.playTap()}
          >
            <div className="nav-item-icon-wrap">
              <Camera size={19} />
            </div>
            <span className="nav-item-label">Scan & Ingestion</span>
          </NavLink>

          <NavLink
            to="/recipes"
            className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
            onClick={() => sounds.playTap()}
          >
            <div className="nav-item-icon-wrap">
              <BookOpen size={19} />
            </div>
            <span className="nav-item-label">Recipe Catalog</span>
          </NavLink>

          <NavLink
            to="/pantry"
            className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
            onClick={() => sounds.playTap()}
          >
            <div className="nav-item-icon-wrap">
              <Package size={19} />
            </div>
            <span className="nav-item-label">Digital Pantry</span>
            {expiringCount > 0 && (
              <span className="sidebar-badge-warning" title={`${expiringCount} items expiring soon`}>
                {expiringCount}
              </span>
            )}
          </NavLink>

          <NavLink
            to="/profile"
            className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
            onClick={() => sounds.playTap()}
          >
            <div className="nav-item-icon-wrap">
              <User size={19} />
            </div>
            <span className="nav-item-label">Taste Profile</span>
          </NavLink>
        </nav>

        {/* Quick Pantry Snapshot Widget */}
        <div className="sidebar-pantry-widget">
          <div className="widget-header">
            <span className="widget-eyebrow">Real-Time Pantry</span>
            <span className="widget-count">{pantryStock.length} items</span>
          </div>

          {expiringCount > 0 ? (
            <div className="widget-alert-pill">
              <AlertTriangle size={14} className="alert-icon" />
              <span>{expiringCount} items expire soon</span>
            </div>
          ) : (
            <div className="widget-healthy-pill">
              <Sparkles size={14} className="healthy-icon" />
              <span>All items fresh</span>
            </div>
          )}

          <div className="widget-actions">
            {expiringCount > 0 ? (
              <button
                type="button"
                className="widget-cta-btn"
                onClick={() => {
                  sounds.playTap();
                  navigate('/recipes');
                }}
              >
                Cook Expiring Items 🔥
              </button>
            ) : (
              <button
                type="button"
                className="widget-cta-btn"
                onClick={() => {
                  sounds.playTap();
                  navigate('/');
                }}
              >
                Scan New Groceries +
              </button>
            )}
          </div>
        </div>

        {/* Sidebar Footer: Theme Toggle & Chef Profile */}
        <div className="sidebar-footer">
          <button
            type="button"
            className="sidebar-theme-toggle"
            onClick={toggleTheme}
            title={isDarkMode ? 'Switch to Light Kitchen Mode' : 'Switch to Dark Cooking Mode'}
            aria-label="Toggle theme mode"
          >
            {isDarkMode ? <Sun size={17} /> : <Moon size={17} />}
            <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
          </button>

          <div
            className="sidebar-user-pill"
            onClick={() => {
              sounds.playTap();
              navigate('/profile');
            }}
          >
            <div className="user-avatar-circle">
              <span className="material-symbols-outlined text-[18px]">person</span>
            </div>
            <div className="user-info-text">
              <span className="user-name">Executive Chef</span>
              <span className="user-role">Zero-Waste Active</span>
            </div>
          </div>
        </div>
      </aside>

      {/* =========================================================================
          MOBILE STICKY TOPBAR (< 1024px)
          ========================================================================= */}
      {!isCookMode && (
        <header className="mobile-sticky-topbar">
          <NavLink to="/" className="mobile-brand-link" onClick={() => sounds.playTap()}>
            <span className="material-symbols-outlined brand-leaf-icon">eco</span>
            <span className="mobile-brand-text">Smart Palette</span>
          </NavLink>

          <div className="mobile-topbar-actions">
            <button
              type="button"
              className="mobile-icon-btn"
              onClick={toggleTheme}
              aria-label="Toggle theme mode"
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <NavLink
              to="/profile"
              className="mobile-avatar-btn"
              onClick={() => sounds.playTap()}
              aria-label="Go to profile"
            >
              <span className="material-symbols-outlined text-[18px]">person</span>
            </NavLink>
          </div>
        </header>
      )}

      {/* =========================================================================
          MOBILE FLOATING GLASSMORHPIC BOTTOM NAVIGATION (< 1024px)
          ========================================================================= */}
      {!isCookMode && (
        <nav className="mobile-floating-dock" aria-label="Mobile Navigation Dock">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `mobile-dock-tab ${isActive ? 'active' : ''}`}
            onClick={() => sounds.playTap()}
          >
            <div className="dock-icon-holder">
              <Camera size={18} />
            </div>
            <span className="dock-tab-label">Scan</span>
          </NavLink>

          <NavLink
            to="/recipes"
            className={({ isActive }) => `mobile-dock-tab ${isActive ? 'active' : ''}`}
            onClick={() => sounds.playTap()}
          >
            <div className="dock-icon-holder">
              <BookOpen size={18} />
            </div>
            <span className="dock-tab-label">Recipes</span>
          </NavLink>

          <NavLink
            to="/pantry"
            className={({ isActive }) => `mobile-dock-tab ${isActive ? 'active' : ''}`}
            onClick={() => sounds.playTap()}
          >
            <div className="dock-icon-holder">
              <Package size={18} />
              {expiringCount > 0 && <span className="dock-alert-dot" />}
            </div>
            <span className="dock-tab-label">Pantry</span>
          </NavLink>

          <NavLink
            to="/profile"
            className={({ isActive }) => `mobile-dock-tab ${isActive ? 'active' : ''}`}
            onClick={() => sounds.playTap()}
          >
            <div className="dock-icon-holder">
              <User size={18} />
            </div>
            <span className="dock-tab-label">Profile</span>
          </NavLink>
        </nav>
      )}
    </>
  );
};
