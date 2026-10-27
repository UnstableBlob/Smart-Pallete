import {
  ArrowRight,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { sounds } from '../../services/audio';
import { getIngredientEmoji, INGREDIENT_EMOJIS } from '../../services/ingredientUtils';
import { useAppStore } from '../../store/useAppStore';

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRescan: () => void;
}

export const VerificationModal: React.FC<VerificationModalProps> = ({
  isOpen,
  onClose,
  onRescan,
}) => {
  const navigate = useNavigate();
  const {
    detectedBuffer,
    updateDetectedItem,
    removeDetectedItem,
    addDetectedItem,
    setPantryStock,
    addToast,
  } = useAppStore();

  const [quickAddInput, setQuickAddInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // Filter autocomplete suggestions based on user input
  const allKnownIngredients = Object.keys(INGREDIENT_EMOJIS);
  const filteredSuggestions = quickAddInput.trim()
    ? allKnownIngredients.filter((name) =>
        name.toLowerCase().includes(quickAddInput.toLowerCase().trim())
      )
    : [];

  const handleQuickAdd = (ingredientName?: string) => {
    const nameToAdd = (ingredientName || quickAddInput).trim();
    if (!nameToAdd) return;

    sounds.playTap();
    addDetectedItem({
      name: nameToAdd.charAt(0).toUpperCase() + nameToAdd.slice(1),
      quantity: 1,
      unit: 'pcs',
      category: 'Produce',
      emoji: getIngredientEmoji(nameToAdd),
    });

    setQuickAddInput('');
    setShowSuggestions(false);
  };

  const handleStepQuantity = (id: string, delta: number) => {
    sounds.playTap();
    const item = detectedBuffer.find((i) => i.id === id);
    if (!item) return;
    const nextQty = Math.max(1, (item.quantity || 1) + delta);
    updateDetectedItem(id, { quantity: nextQty });
  };

  const handleConfirmVerification = async () => {
    if (detectedBuffer.length === 0) {
      addToast('No ingredients in list to verify.', 'warning');
      return;
    }

    try {
      setIsSubmitting(true);
      sounds.playTap();

      // Sync with backend API
      try {
        await api.verifyAndSyncPantry(detectedBuffer);
        const inventory = await api.fetchPantryInventory();
        setPantryStock([...inventory.activeStock, ...inventory.expiringSoon]);
      } catch {
        // Fallback: update local store inventory optimistically
        const currentPantry = useAppStore.getState().pantryStock;
        setPantryStock([...detectedBuffer, ...currentPantry]);
      }

      addToast(`Added ${detectedBuffer.length} verified items to digital pantry!`, 'success');
      onClose();
      // Navigate directly to Recipe Catalog recommendations
      navigate('/recipes');
    } catch {
      addToast('Failed to sync ingredients to pantry', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="verification-drawer-backdrop"
      className="verification-sheet-overlay"
      onClick={onClose}
    >
      <div
        id="verification-drawer-container"
        className="verification-drawer-sheet"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
      >
        {/* Centered Drag Handle Pill (40px x 4px) */}
        <div className="sheet-drag-handle-bar">
          <div className="sheet-drag-pill" />
        </div>

        {/* Sheet Header Row */}
        <header className="sheet-header-row">
          <div className="header-info-group">
            <div className="header-title-flex">
              <h2 id="drawer-title" className="sheet-headline">
                Detected Ingredients
              </h2>
              {/* Pill Counter Chip */}
              <span className="sheet-counter-chip">
                <span className="material-symbols-outlined text-[15px] text-primary">eco</span>
                <span>{detectedBuffer.length} Items Found</span>
              </span>
            </div>
            <p className="sheet-subhead">
              Review and adjust quantities prior to zero-waste recipe matching.
            </p>
          </div>

          <button
            type="button"
            className="sheet-rescan-btn"
            onClick={() => {
              sounds.playTap();
              onRescan();
            }}
            title="Discard and rescan shelf"
          >
            <RotateCcw size={14} />
            <span>Rescan</span>
          </button>
        </header>

        {/* Scrollable List of Detected Items */}
        <div className="sheet-items-scrollable custom-scrollbar">
          {detectedBuffer.length === 0 ? (
            <div className="sheet-empty-placeholder">
              <Sparkles size={32} className="text-primary opacity-60" />
              <p className="empty-title">No ingredients detected yet.</p>
              <p className="empty-sub">
                Type an ingredient below to add it manually or tap Rescan to take another photo.
              </p>
            </div>
          ) : (
            detectedBuffer.map((item) => (
              <article key={item.id} className="ingredient-verification-card">
                {/* Left: Emoji Avatar + Editable Name */}
                <div className="card-left-section">
                  <div className="item-emoji-avatar">
                    {item.emoji || getIngredientEmoji(item.name)}
                  </div>
                  <input
                    type="text"
                    className="item-name-input"
                    value={item.name}
                    onChange={(e) => updateDetectedItem(item.id, { name: e.target.value })}
                    aria-label="Ingredient name"
                  />
                </div>

                {/* Right: Quantity Stepper + Unit Selector + Delete */}
                <div className="card-right-section">
                  {/* Segmented Stepper */}
                  <div className="segmented-stepper-wrap">
                    <button
                      type="button"
                      className="stepper-action-btn"
                      onClick={() => handleStepQuantity(item.id, -1)}
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <span className="stepper-val-text">{item.quantity}</span>
                    <button
                      type="button"
                      className="stepper-action-btn"
                      onClick={() => handleStepQuantity(item.id, 1)}
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>

                  {/* Unit Select Dropdown */}
                  <select
                    className="unit-select-field"
                    value={item.unit}
                    onChange={(e) => updateDetectedItem(item.id, { unit: e.target.value })}
                    aria-label="Unit of measure"
                  >
                    <option value="pcs">pcs</option>
                    <option value="g">g</option>
                    <option value="ml">ml</option>
                    <option value="tub">tub</option>
                    <option value="bunches">bunches</option>
                    <option value="heads">heads</option>
                    <option value="units">units</option>
                  </select>

                  {/* Red Single-Tap Delete Action */}
                  <button
                    type="button"
                    className="item-delete-btn"
                    onClick={() => {
                      sounds.playTap();
                      removeDetectedItem(item.id);
                    }}
                    aria-label={`Remove ${item.name}`}
                  >
                    <X size={16} />
                  </button>
                </div>
              </article>
            ))
          )}
        </div>

        {/* Quick Add Input Bar */}
        <div className="sheet-quick-add-section">
          <form
            className="quick-add-form-pill"
            onSubmit={(e) => {
              e.preventDefault();
              handleQuickAdd();
            }}
          >
            <div className="search-icon-slot">
              <Search size={18} />
            </div>
            <input
              type="text"
              className="quick-add-input"
              placeholder="Add missing ingredient (e.g. Garlic, Rosemary)..."
              value={quickAddInput}
              onChange={(e) => {
                setQuickAddInput(e.target.value);
                setShowSuggestions(e.target.value.trim().length > 0);
              }}
              onFocus={() => setShowSuggestions(quickAddInput.trim().length > 0)}
            />
            <button type="submit" className="quick-add-submit-btn">
              <Plus size={16} />
              <span>Add</span>
            </button>
          </form>

          {/* Autocomplete Suggestions Popover */}
          {showSuggestions && filteredSuggestions.length > 0 && (
            <div className="autocomplete-popover-tray">
              <ul className="suggestions-list">
                {filteredSuggestions.slice(0, 5).map((suggested) => (
                  <li
                    key={suggested}
                    className="suggestion-row"
                    onClick={() => handleQuickAdd(suggested)}
                  >
                    <span className="suggestion-emoji">{getIngredientEmoji(suggested)}</span>
                    <span className="suggestion-text">{suggested}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Action Footer */}
        <footer className="sheet-action-footer">
          <button
            type="button"
            id="submit-recipes-btn"
            className="sheet-confirm-cta"
            onClick={handleConfirmVerification}
            disabled={isSubmitting || detectedBuffer.length === 0}
          >
            <span>
              Find Matching Recipes ({detectedBuffer.length})
            </span>
            <ArrowRight size={20} />
          </button>

          <div className="zero-waste-footer-badge">
            <span className="material-symbols-outlined text-[15px] text-primary">eco</span>
            <span>Zero-waste optimization active</span>
          </div>
        </footer>
      </div>
    </div>
  );
};
