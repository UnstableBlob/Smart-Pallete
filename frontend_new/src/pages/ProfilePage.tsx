import {
  Check,
  ChefHat,
  Flame,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import React, { useState } from 'react';
import { sounds } from '../services/audio';
import { useAppStore } from '../store/useAppStore';
import type { ProfilePreferences } from '../types';

const DIETARY_OPTIONS = [
  { value: 'vegan', label: 'Vegan', emoji: '🌱' },
  { value: 'gluten-free', label: 'Gluten-Free', emoji: '🌾' },
  { value: 'nut-allergy', label: 'Nut Allergy', emoji: '🥜' },
  { value: 'dairy-free', label: 'Dairy-Free', emoji: '🥛' },
  { value: 'vegetarian', label: 'Vegetarian', emoji: '🥬' },
  { value: 'keto', label: 'Keto', emoji: '🥑' },
];

export const ProfilePage: React.FC = () => {
  const { userProfile, setUserProfile, addToast } = useAppStore();

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
    addToast('Taste & preference profile updated!', 'success');
  };

  return (
    <div className="profile-page-canvas">
      {/* Profile Header Card */}
      <header className="profile-header-card">
        <div className="profile-avatar-large">
          <ChefHat size={28} className="text-primary" />
        </div>
        <div>
          <span className="profile-eyebrow">Personalized AI Preferences</span>
          <h1 className="profile-headline">Taste & Dietary Profile</h1>
          <p className="profile-subtext">
            Tune multimodal zero-waste recipe recommendations and pantry telemetry to your dietary
            constraints and kitchen routine.
          </p>
        </div>
      </header>

      {/* Main Settings Form */}
      <main className="profile-form-container">
        <form onSubmit={handleSave} className="profile-settings-form">
          {/* Dietary Restrictions Section */}
          <section className="settings-section-card">
            <div className="section-title-line">
              <ShieldCheck size={18} className="text-primary" />
              <h2 className="section-title">Dietary Constraints & Allergies</h2>
            </div>
            <p className="section-desc">
              Recipes containing checked allergens or prohibited foods will be strictly excluded from
              recommendations.
            </p>

            <div className="dietary-chips-grid">
              {DIETARY_OPTIONS.map((option) => {
                const isChecked = dietary.includes(option.value);

                return (
                  <button
                    key={option.value}
                    type="button"
                    className={`dietary-select-chip ${isChecked ? 'active' : ''}`}
                    onClick={() => toggleDietary(option.value)}
                  >
                    <span className="chip-emoji">{option.emoji}</span>
                    <span className="chip-title">{option.label}</span>
                    {isChecked && <Check size={15} className="chip-check-icon" />}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Spice Tolerance Section */}
          <section className="settings-section-card">
            <div className="section-title-line">
              <Flame size={18} className="text-secondary" />
              <h2 className="section-title">Spice Tolerance</h2>
            </div>
            <p className="section-desc">
              Adjust your preferred heat scale for matching seasonings and peppers.
            </p>

            <div className="spice-slider-wrapper">
              <input
                type="range"
                min="0"
                max="3"
                step="1"
                value={spice}
                onChange={(e) => {
                  sounds.playTap();
                  setSpice(parseInt(e.target.value));
                }}
                className="spice-range-slider"
                aria-label="Spice level slider"
              />
              <div className="spice-labels-track">
                <span className={`spice-label ${spice === 0 ? 'active' : ''}`}>Mild</span>
                <span className={`spice-label ${spice === 1 ? 'active' : ''}`}>Medium</span>
                <span className={`spice-label ${spice === 2 ? 'active' : ''}`}>Hot 🔥</span>
                <span className={`spice-label ${spice === 3 ? 'active' : ''}`}>Extra Hot 🌶️</span>
              </div>
            </div>
          </section>

          {/* Target Cooking Speed Section */}
          <section className="settings-section-card">
            <div className="section-title-line">
              <Sparkles size={18} className="text-primary" />
              <h2 className="section-title">Target Cooking Speed</h2>
            </div>
            <div className="speed-pills-row">
              <button
                type="button"
                className={`speed-pill-btn ${speed === 'quick' ? 'active' : ''}`}
                onClick={() => {
                  sounds.playTap();
                  setSpeed('quick');
                }}
              >
                <strong>Quick Run</strong>
                <span>Under 20 mins</span>
              </button>

              <button
                type="button"
                className={`speed-pill-btn ${speed === 'medium' ? 'active' : ''}`}
                onClick={() => {
                  sounds.playTap();
                  setSpeed('medium');
                }}
              >
                <strong>Standard</strong>
                <span>20 – 45 mins</span>
              </button>

              <button
                type="button"
                className={`speed-pill-btn ${speed === 'leisurely' ? 'active' : ''}`}
                onClick={() => {
                  sounds.playTap();
                  setSpeed('leisurely');
                }}
              >
                <strong>Leisurely</strong>
                <span>No time limit</span>
              </button>
            </div>
          </section>

          {/* Household Servings Section */}
          <section className="settings-section-card">
            <div className="section-title-line">
              <Users size={18} className="text-primary" />
              <h2 className="section-title">Default Servings</h2>
            </div>
            <div className="servings-chips-row">
              {[1, 2, 4, 6].map((num) => (
                <button
                  key={num}
                  type="button"
                  className={`serving-number-chip ${servings === num ? 'active' : ''}`}
                  onClick={() => {
                    sounds.playTap();
                    setServings(num);
                  }}
                >
                  <span className="serving-digit">{num}</span>
                  <span className="serving-sub">{num === 1 ? 'Person' : 'People'}</span>
                </button>
              ))}
            </div>
          </section>

          {/* App Theme Section */}
          <section className="settings-section-card">
            <h2 className="section-title mb-2">Display Ambience</h2>
            <div className="theme-toggle-cards-row">
              <button
                type="button"
                className={`theme-ambience-card ${theme === 'light' ? 'active' : ''}`}
                onClick={() => {
                  sounds.playTap();
                  setTheme('light');
                }}
              >
                <div className="theme-preview light-preview" />
                <div className="theme-card-info">
                  <strong>☀️ Light Kitchen</strong>
                  <span>Porcelain & botanical tones</span>
                </div>
              </button>

              <button
                type="button"
                className={`theme-ambience-card ${theme === 'dark' ? 'active' : ''}`}
                onClick={() => {
                  sounds.playTap();
                  setTheme('dark');
                }}
              >
                <div className="theme-preview dark-preview" />
                <div className="theme-card-info">
                  <strong>🌙 Night Cooking</strong>
                  <span>Deep slate & glowing HUD</span>
                </div>
              </button>
            </div>
          </section>

          {/* Save Button */}
          <button type="submit" className="btn btn-primary-block btn-lg" disabled={isSaving}>
            <Check size={18} />
            <span>{isSaving ? 'Saving Preferences...' : 'Save Taste Profile'}</span>
          </button>
        </form>
      </main>
    </div>
  );
};
