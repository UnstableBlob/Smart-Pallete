import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { api } from '../services/api';
import { sounds } from '../services/audio';
import type { ProfilePreferences } from '../types';
import { Check } from 'lucide-react';

const DIETARY_OPTIONS = [
  { value: 'vegan', label: 'Vegan', desc: 'No animal products' },
  { value: 'vegetarian', label: 'Vegetarian', desc: 'No meat or fish' },
  { value: 'gluten-free', label: 'Gluten-free', desc: 'No gluten-containing grains' },
  { value: 'dairy-free', label: 'Dairy-free', desc: 'No milk products' },
  { value: 'nut-allergy', label: 'Nut allergy', desc: 'Strictly excluded' },
  { value: 'keto', label: 'Keto', desc: 'Low carb, high fat' },
];

const SPICE_LABELS = ['Mild', 'Medium', 'Hot', 'Extra hot'];

const COOKING_SPEED_OPTIONS: Array<{ value: 'quick' | 'medium' | 'leisurely'; label: string; desc: string }> = [
  { value: 'quick', label: 'Quick', desc: '< 20 min' },
  { value: 'medium', label: 'Standard', desc: '20–45 min' },
  { value: 'leisurely', label: 'No preference', desc: 'Any length' },
];

const SERVINGS_OPTIONS = [1, 2, 4, 6];
const THEME_OPTIONS: Array<{ value: 'light' | 'dark'; label: string }> = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

export const ProfilePage: React.FC = () => {
  const { userProfile, setUserProfile, userId, addToast } = useAppStore();

  const [dietary, setDietary] = useState<string[]>(userProfile.dietaryRestrictions || []);
  const [spice, setSpice] = useState<number>(userProfile.spiceLevel ?? 1);
  const [speed, setSpeed] = useState<'quick' | 'medium' | 'leisurely'>(
    userProfile.cookingSpeed || 'quick'
  );
  const [servings, setServings] = useState<number>(userProfile.defaultServings || 2);
  const [theme, setTheme] = useState<'light' | 'dark'>(userProfile.theme || 'light');
  const [isSaving, setIsSaving] = useState(false);
  const [savedIndicator, setSavedIndicator] = useState(false);

  const toggleDietary = (value: string) => {
    sounds.playTap();
    // Vegan implies vegetarian
    if (value === 'vegan') {
      setDietary((prev) => {
        if (prev.includes('vegan')) {
          return prev.filter((d) => d !== 'vegan');
        }
        return [...new Set([...prev, 'vegan', 'vegetarian'])];
      });
      return;
    }
    setDietary((prev) =>
      prev.includes(value) ? prev.filter((d) => d !== value) : [...prev, value]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playTap();
    setIsSaving(true);

    const updatedProfile: ProfilePreferences = {
      dietaryRestrictions: dietary,
      spiceLevel: spice,
      cookingSpeed: speed,
      defaultServings: servings,
      theme,
    };

    try {
      await api.savePreferences(userId || 'usr_kitchen_master_01', updatedProfile);
      setUserProfile(updatedProfile);
    } catch {
      setUserProfile(updatedProfile);
    } finally {
      setIsSaving(false);
      setSavedIndicator(true);
      setTimeout(() => setSavedIndicator(false), 2000);
    }
  };

  const sliderPct = `${(spice / 3) * 100}%`;

  return (
    <div className="content-container">
      <div className="pref-page-container" style={{ paddingBottom: 'var(--space-7)' }}>
        {/* Page header */}
        <div className="page-header">
          <h1 className="page-title">Preferences</h1>
          <p className="page-subtitle">
            Tune recipe matching to your dietary needs and taste.
          </p>
        </div>

        <form id="form-preferences" onSubmit={handleSave}>
          {/* Section: Dietary needs */}
          <section className="pref-section" aria-labelledby="dietary-section-title">
            <p className="pref-section-label">Dietary needs</p>
            <h2 className="pref-section-title" id="dietary-section-title">
              Restrictions & allergies
            </h2>
            <p className="pref-section-desc">
              Recipes containing selected restrictions will be excluded from recommendations.
            </p>
            <div className="dietary-grid" role="group" aria-label="Dietary restrictions">
              {DIETARY_OPTIONS.map((option) => {
                const isChecked = dietary.includes(option.value);
                const isImplied = option.value === 'vegetarian' && dietary.includes('vegan') && !dietary.includes('vegetarian');

                return (
                  <label
                    key={option.value}
                    className={`dietary-row ${(isChecked || isImplied) ? 'checked' : ''}`}
                    htmlFor={`dietary-${option.value}`}
                  >
                    <input
                      type="checkbox"
                      id={`dietary-${option.value}`}
                      name="dietary"
                      value={option.value}
                      checked={isChecked || isImplied}
                      onChange={() => toggleDietary(option.value)}
                      style={{ display: 'none' }}
                    />
                    <span className="dietary-checkbox" aria-hidden="true">
                      {(isChecked || isImplied) && (
                        <Check size={10} strokeWidth={3} color="white" />
                      )}
                    </span>
                    <div>
                      <p className="dietary-label">{option.label}</p>
                      {isImplied && (
                        <p style={{ fontSize: 'var(--text-caption-size)', color: 'var(--color-text-tertiary)', marginTop: '1px' }}>
                          Covered by Vegan
                        </p>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          </section>

          {/* Section: Spice */}
          <section className="pref-section" aria-labelledby="spice-section-title">
            <p className="pref-section-label">Taste</p>
            <h2 className="pref-section-title" id="spice-section-title">
              Spice tolerance
              <span
                style={{
                  marginLeft: 'var(--space-3)',
                  fontSize: 'var(--text-body-sm-size)',
                  fontWeight: 400,
                  color: 'var(--color-text-secondary)',
                }}
              >
                {SPICE_LABELS[spice]}
              </span>
            </h2>
            <input
              type="range"
              id="slider-spice-level"
              className="spice-slider"
              min="0"
              max="3"
              step="1"
              value={spice}
              style={{ '--slider-pct': sliderPct } as React.CSSProperties}
              onChange={(e) => {
                sounds.playTap();
                setSpice(parseInt(e.target.value));
              }}
              aria-label="Spice tolerance"
              aria-valuetext={SPICE_LABELS[spice]}
            />
            <div className="spice-labels" aria-hidden="true">
              {SPICE_LABELS.map((label, i) => (
                <span key={label} className={spice === i ? 'active' : ''}>{label}</span>
              ))}
            </div>
          </section>

          {/* Section: Cooking */}
          <section className="pref-section" aria-labelledby="cooking-section-title">
            <p className="pref-section-label">Cooking</p>
            <h2 className="pref-section-title" id="cooking-section-title">Cooking time</h2>
            <p className="pref-section-desc" style={{ marginBottom: 'var(--space-3)' }}>
              How much time do you usually have to cook?
            </p>
            <div className="segmented-control" role="group" aria-label="Cooking time preference">
              {COOKING_SPEED_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`seg-btn ${speed === opt.value ? 'active' : ''}`}
                  onClick={() => {
                    sounds.playTap();
                    setSpeed(opt.value);
                  }}
                  aria-pressed={speed === opt.value}
                >
                  {opt.label}
                  <span className="seg-count">{opt.desc}</span>
                </button>
              ))}
            </div>

            <h2
              className="pref-section-title"
              style={{ marginTop: 'var(--space-5)' }}
              id="servings-title"
            >
              Default servings
            </h2>
            <div
              className="segmented-control"
              style={{ marginTop: 'var(--space-3)' }}
              role="group"
              aria-label="Default number of servings"
            >
              {SERVINGS_OPTIONS.map((num) => (
                <button
                  key={num}
                  type="button"
                  className={`seg-btn ${servings === num ? 'active' : ''}`}
                  onClick={() => {
                    sounds.playTap();
                    setServings(num);
                  }}
                  aria-pressed={servings === num}
                >
                  {num} {num === 1 ? 'person' : 'people'}
                </button>
              ))}
            </div>
          </section>

          {/* Section: Display */}
          <section className="pref-section" aria-labelledby="display-section-title">
            <p className="pref-section-label">Display</p>
            <h2 className="pref-section-title" id="display-section-title">Theme</h2>
            <p className="pref-section-desc" style={{ marginBottom: 'var(--space-3)' }}>
              Choose your preferred color scheme.
            </p>
            <div className="segmented-control" role="group" aria-label="Color theme">
              {THEME_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`seg-btn ${theme === opt.value ? 'active' : ''}`}
                  onClick={() => {
                    sounds.playTap();
                    setTheme(opt.value);
                    // Apply immediately for preview
                    document.documentElement.setAttribute('data-theme', opt.value);
                  }}
                  aria-pressed={theme === opt.value}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </section>

          {/* Save action */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 'var(--space-3)',
              paddingTop: 'var(--space-5)',
            }}
          >
            {savedIndicator && (
              <span className="inline-confirm" aria-live="polite">
                <Check size={14} />
                Saved
              </span>
            )}
            <button
              type="submit"
              id="btn-save-preferences"
              className="btn btn-primary"
              disabled={isSaving}
            >
              <Check size={16} />
              <span>{isSaving ? 'Saving…' : 'Save preferences'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
