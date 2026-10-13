import { Check, ShieldAlert, Sliders, Sparkles, UserCheck } from 'lucide-react';
import React, { useState } from 'react';
import { sounds } from '../services/audio';
import { useAppStore } from '../store/useAppStore';
import type { ProfilePreferences } from '../types';

const DIETARY_OPTIONS = [
  { value: 'vegan', label: 'Vegan' },
  { value: 'gluten-free', label: 'Gluten-Free' },
  { value: 'nut-allergy', label: 'Nut Allergy' },
  { value: 'dairy-free', label: 'Dairy-Free' },
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'keto', label: 'Keto' },
];

export const ProfilePage: React.FC = () => {
  const { userProfile, setUserProfile } = useAppStore();

  const [dietary, setDietary] = useState<string[]>(userProfile.dietaryRestrictions || []);
  const [spice, setSpice] = useState<number>(userProfile.spiceLevel ?? 1);
  const [speed, setSpeed] = useState<'quick' | 'medium' | 'leisurely'>(
    userProfile.cookingSpeed || 'quick'
  );
  const [servings, setServings] = useState<number>(userProfile.defaultServings || 2);
  const [theme, setTheme] = useState<'light' | 'dark'>(userProfile.theme || 'light');
  const [isSaving, setIsSaving] = useState(false);

  const toggleDietary = (value: string) => {
    sounds.playTap();
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

    setUserProfile(updatedProfile);
    setIsSaving(false);
  };

  return (
    <div className="content-container">
      <div id="profile-page-container">
        {/* 3.6 Header */}
        <header id="profile-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-pill)',
                backgroundColor: 'var(--color-primary-light)',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <UserCheck size={22} />
            </div>
            <div>
              <h1>Taste & Preference Profile</h1>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', marginTop: '2px' }}>
                Tune multimodal AI recipe matching to your dietary needs and taste profile.
              </p>
            </div>
          </div>
        </header>

        {/* 3.6 Form Wrapper */}
        <main id="profile-form-wrapper">
          <form id="form-preferences" onSubmit={handleSave}>
            {/* Section: Static Hard Constraints */}
            <section className="pref-group-box">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldAlert size={18} color="#E05A47" />
                <h3>Dietary Restrictions & Allergies</h3>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                Recipes containing selected allergens will be strictly excluded from recommendations.
              </p>
              <div className="checkbox-grid">
                {DIETARY_OPTIONS.map((option) => {
                  const isChecked = dietary.includes(option.value);

                  return (
                    <label
                      key={option.value}
                      className={`checkbox-tile ${isChecked ? 'checked' : ''}`}
                    >
                      <input
                        type="checkbox"
                        name="diet"
                        value={option.value}
                        checked={isChecked}
                        onChange={() => toggleDietary(option.value)}
                      />
                      <span>{option.label}</span>
                    </label>
                  );
                })}
              </div>
            </section>

            {/* Section: Dynamic Preferences - Spice Tolerance */}
            <section className="pref-group-box">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sliders size={18} color="#E67E22" />
                <h3>Spice Tolerance</h3>
              </div>
              <input
                type="range"
                id="slider-spice-level"
                min="0"
                max="3"
                step="1"
                value={spice}
                onChange={(e) => {
                  sounds.playTap();
                  setSpice(parseInt(e.target.value));
                }}
                aria-label="Spice tolerance"
              />
              <div id="spice-labels-row">
                <span style={{ fontWeight: spice === 0 ? 800 : 500, color: spice === 0 ? 'var(--color-primary)' : undefined }}>
                  Mild
                </span>
                <span style={{ fontWeight: spice === 1 ? 800 : 500, color: spice === 1 ? 'var(--color-primary)' : undefined }}>
                  Medium
                </span>
                <span style={{ fontWeight: spice === 2 ? 800 : 500, color: spice === 2 ? '#E67E22' : undefined }}>
                  Hot
                </span>
                <span style={{ fontWeight: spice === 3 ? 800 : 500, color: spice === 3 ? '#E05A47' : undefined }}>
                  Extra Hot 🌶️
                </span>
              </div>
            </section>

            {/* Section: Target Cooking Speed */}
            <section className="pref-group-box">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={18} color="#3A7D44" />
                <h3>Target Cooking Speed</h3>
              </div>
              <select
                id="select-prep-speed"
                value={speed}
                onChange={(e) => setSpeed(e.target.value as 'quick' | 'medium' | 'leisurely')}
                aria-label="Target cooking speed"
              >
                <option value="quick">Quick (&lt; 20 mins)</option>
                <option value="medium">Standard (20-45 mins)</option>
                <option value="leisurely">No preference</option>
              </select>
            </section>

            {/* Section: Household Servings */}
            <section className="pref-group-box">
              <h3>Default Serving Size</h3>
              <div style={{ display: 'flex', gap: '10px' }}>
                {[1, 2, 4, 6].map((num) => (
                  <button
                    key={num}
                    type="button"
                    className={`chip-filter ${servings === num ? 'active' : ''}`}
                    onClick={() => {
                      sounds.playTap();
                      setServings(num);
                    }}
                    style={{ flex: 1, padding: '10px', textAlign: 'center' }}
                  >
                    {num} {num === 1 ? 'Person' : 'People'}
                  </button>
                ))}
              </div>
            </section>

            {/* Section: Interface Theme */}
            <section className="pref-group-box">
              <h3>App Theme</h3>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  className={`chip-filter ${theme === 'light' ? 'active' : ''}`}
                  onClick={() => {
                    sounds.playTap();
                    setTheme('light');
                  }}
                  style={{ flex: 1, padding: '10px' }}
                >
                  ☀️ Light Kitchen
                </button>
                <button
                  type="button"
                  className={`chip-filter ${theme === 'dark' ? 'active' : ''}`}
                  onClick={() => {
                    sounds.playTap();
                    setTheme('dark');
                  }}
                  style={{ flex: 1, padding: '10px' }}
                >
                  🌙 Night Cooking (Dark)
                </button>
              </div>
            </section>

            {/* 3.6 Form Footer */}
            <footer id="profile-form-footer">
              <button
                type="submit"
                id="btn-save-preferences"
                className="btn-primary"
                disabled={isSaving}
                style={{ width: '100%' }}
              >
                <Check size={18} />
                <span>{isSaving ? 'Saving...' : 'Save Preferences'}</span>
              </button>
            </footer>
          </form>
        </main>
      </div>
    </div>
  );
};
