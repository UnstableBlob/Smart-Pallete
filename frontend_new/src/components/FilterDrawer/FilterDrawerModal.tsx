import React from 'react';
import { X, Check } from 'lucide-react';
import type { FilterState } from '../../types';
import { sounds } from '../../services/audio';

interface FilterDrawerModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  onUpdateFilters: (updates: Partial<FilterState>) => void;
  onResetFilters: () => void;
}

export const FilterDrawerModal: React.FC<FilterDrawerModalProps> = ({
  isOpen,
  onClose,
  filters,
  onUpdateFilters,
  onResetFilters,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.7)',
        backdropFilter: 'blur(6px)',
        zIndex: 55,
        display: 'flex',
        justifyContent: 'flex-end',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '400px',
          height: '100%',
          backgroundColor: 'var(--color-surface)',
          borderLeft: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-drawer)',
          animation: 'slideInRight 250ms ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text)' }}>
            Filter Recipes
          </h2>
          <button
            onClick={() => {
              sounds.playTap();
              onClose();
            }}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-pill)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-text-muted)',
              backgroundColor: 'var(--color-surface-alt)',
            }}
          >
            <X size={18} />
          </button>
        </header>

        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
          }}
        >
          {/* Max Cooking Time Slider */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text)' }}>
                Max Prep / Cook Time
              </label>
              <span
                style={{
                  fontFamily: 'var(--font-family-mono)',
                  fontWeight: 700,
                  fontSize: '13px',
                  color: 'var(--color-primary)',
                }}
              >
                {filters.maxCookTime ? `< ${filters.maxCookTime} mins` : 'Any Time'}
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="60"
              step="5"
              value={filters.maxCookTime || 60}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                onUpdateFilters({ maxCookTime: val === 60 ? undefined : val });
              }}
              style={{ width: '100%', accentColor: 'var(--color-primary)' }}
            />
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '11px',
                color: 'var(--color-text-muted)',
                marginTop: '4px',
              }}
            >
              <span>10m</span>
              <span>20m</span>
              <span>30m</span>
              <span>45m</span>
              <span>60m+</span>
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: 700,
                color: 'var(--color-text)',
                marginBottom: '10px',
              }}
            >
              Cooking Difficulty
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {['All', 'Easy', 'Medium', 'Hard'].map((diff) => (
                <button
                  key={diff}
                  className={`chip-filter ${
                    (filters.difficulty === diff || (!filters.difficulty && diff === 'All'))
                      ? 'active'
                      : ''
                  }`}
                  onClick={() => {
                    sounds.playTap();
                    onUpdateFilters({ difficulty: diff === 'All' ? undefined : diff });
                  }}
                  style={{ flex: 1, textAlign: 'center' }}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>

          {/* Spice Level */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: 700,
                color: 'var(--color-text)',
                marginBottom: '10px',
              }}
            >
              Spice Tolerance
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
              {['All', 'Mild', 'Medium', 'Hot'].map((spice) => (
                <button
                  key={spice}
                  className={`chip-filter ${
                    (filters.spiceLevel === spice || (!filters.spiceLevel && spice === 'All'))
                      ? 'active'
                      : ''
                  }`}
                  onClick={() => {
                    sounds.playTap();
                    onUpdateFilters({ spiceLevel: spice === 'All' ? undefined : spice });
                  }}
                >
                  {spice}
                </button>
              ))}
            </div>
          </div>
        </div>

        <footer
          style={{
            padding: '16px 20px',
            borderTop: '1px solid var(--color-border)',
            display: 'flex',
            gap: '10px',
          }}
        >
          <button
            className="btn-secondary"
            onClick={() => {
              sounds.playTap();
              onResetFilters();
            }}
            style={{ flex: 1 }}
          >
            Reset
          </button>
          <button
            className="btn-primary"
            onClick={() => {
              sounds.playTap();
              onClose();
            }}
            style={{ flex: 2 }}
          >
            <Check size={16} />
            <span>Apply Filters</span>
          </button>
        </footer>
      </div>
    </div>
  );
};
