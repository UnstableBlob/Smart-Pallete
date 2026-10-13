import { Check, Plus, RotateCcw } from 'lucide-react';
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

      // Placeholder API call: POST /api/v1/pantry/verify-and-sync
      await api.verifyAndSyncPantry(detectedBuffer);
      const inventory = await api.fetchPantryInventory();
      setPantryStock([...inventory.activeStock, ...inventory.expiringSoon]);
      addToast(`Added ${detectedBuffer.length} items to pantry inventory!`, 'success');
      onClose();
      // Route to recipes recommendations dashboard as per blueprint
      navigate('/recipes');
    } catch {
      addToast('Failed to sync ingredients', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="verification-drawer-backdrop" className="modal-overlay verification-overlay" onClick={onClose}>
      <div
        id="verification-drawer-container"
        className="bottom-sheet"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
      >
        <div id="drawer-drag-handle" />

        <header id="drawer-header">
          <div id="header-text-group">
            <h2 id="drawer-title">Detected Ingredients</h2>
            <span id="badge-item-count">
              {detectedBuffer.length} {detectedBuffer.length === 1 ? 'Item' : 'Items'} Found
            </span>
          </div>
          <button
            id="btn-reset-scan"
            onClick={() => {
              sounds.playTap();
              onRescan();
            }}
          >
            <RotateCcw size={14} style={{ display: 'inline', marginRight: 4 }} />
            Rescan
          </button>
        </header>

        <div id="scrollable-ingredient-list">
          {detectedBuffer.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--color-text-muted)' }}>
              <p>No ingredients detected yet.</p>
              <p style={{ fontSize: '13px', marginTop: '6px' }}>
                Use the search bar below to add ingredients manually or rescan.
              </p>
            </div>
          ) : (
            detectedBuffer.map((item) => (
              <div key={item.id} className="ingredient-card-row">
                <span className="item-icon-emoji">{item.emoji || getIngredientEmoji(item.name)}</span>

                <input
                  type="text"
                  className="input-item-name"
                  value={item.name}
                  onChange={(e) => updateDetectedItem(item.id, { name: e.target.value })}
                  aria-label="Ingredient name"
                />

                <div className="quantity-stepper-group">
                  <button
                    className="btn-step-decrement"
                    onClick={() => handleStepQuantity(item.id, -1)}
                    aria-label="Decrease quantity"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    className="input-quantity-val"
                    value={item.quantity}
                    onChange={(e) =>
                      updateDetectedItem(item.id, {
                        quantity: Math.max(1, parseInt(e.target.value) || 1),
                      })
                    }
                    min="1"
                    aria-label="Quantity"
                  />
                  <button
                    className="btn-step-increment"
                    onClick={() => handleStepQuantity(item.id, 1)}
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>

                <select
                  className="select-unit-type"
                  value={item.unit}
                  onChange={(e) => updateDetectedItem(item.id, { unit: e.target.value })}
                  aria-label="Unit of measure"
                >
                  <option value="pcs">pcs</option>
                  <option value="grams">g</option>
                  <option value="heads">heads</option>
                  <option value="ml">ml</option>
                  <option value="slices">slices</option>
                  <option value="tbsp">tbsp</option>
                </select>

                <button
                  className="btn-remove-item"
                  onClick={() => {
                    sounds.playTap();
                    removeDetectedItem(item.id);
                  }}
                  aria-label={`Remove ${item.name}`}
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>

        {/* Quick Add Bar Container */}
        <div id="quick-add-bar-container">
          <input
            type="text"
            id="input-quick-add"
            placeholder="Add missing item (e.g., Milk)..."
            value={quickAddInput}
            onChange={(e) => {
              setQuickAddInput(e.target.value);
              setShowSuggestions(e.target.value.trim().length > 0);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleQuickAdd();
              }
            }}
            onFocus={() => setShowSuggestions(quickAddInput.trim().length > 0)}
          />
          <button id="btn-quick-add-submit" onClick={() => handleQuickAdd()}>
            <Plus size={16} style={{ display: 'inline', marginRight: 4 }} />
            Add
          </button>

          {/* Autocomplete Suggestions Popover */}
          <div
            id="autocomplete-suggestions-popover"
            className={showSuggestions && filteredSuggestions.length > 0 ? '' : 'hidden'}
          >
            <ul id="suggestions-list-group">
              {filteredSuggestions.slice(0, 6).map((suggested) => (
                <li
                  key={suggested}
                  className="suggestion-list-item"
                  onClick={() => handleQuickAdd(suggested)}
                >
                  <span>{getIngredientEmoji(suggested)}</span>
                  <span style={{ textTransform: 'capitalize' }}>{suggested}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <footer id="drawer-footer-actions">
          <button
            id="btn-confirm-ingredients"
            className="btn-primary-block"
            onClick={handleConfirmVerification}
            disabled={isSubmitting || detectedBuffer.length === 0}
          >
            <Check size={18} />
            <span>
              Find Matching Recipes (<span id="confirmed-count-badge">{detectedBuffer.length}</span>)
            </span>
          </button>
        </footer>
      </div>
    </div>
  );
};
