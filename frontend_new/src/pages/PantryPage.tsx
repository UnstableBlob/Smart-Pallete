import {
  AlertTriangle,
  Check,
  Edit2,
  Mic,
  Plus,
  QrCode,
  Refrigerator,
  Search,
  Soup,
  Trash2,
  X,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sounds } from '../services/audio';
import { getIngredientEmoji } from '../services/ingredientUtils';
import { useAppStore } from '../store/useAppStore';
import type { CategoryType, PantryItem } from '../types';

const CATEGORIES = ['All', 'Produce', 'Dairy', 'Pantry Staples', 'Meat & Seafood', 'Bakery'];

export const PantryPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    pantryStock,
    addPantryItem,
    updatePantryItem,
    deletePantryItem,
    addToast,
  } = useAppStore();

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingItem, setEditingItem] = useState<PantryItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form states for Add/Edit
  const [itemName, setItemName] = useState('');
  const [itemQty, setItemQty] = useState(1);
  const [itemUnit, setItemUnit] = useState('pcs');
  const [itemCategory, setItemCategory] = useState<CategoryType>('Produce');
  const [itemExpiry, setItemExpiry] = useState('');

  const [referenceTime] = useState(() => Date.now());

  // Expiring items calculation (within 48 hours)
  const expiringItems = useMemo(() => {
    return pantryStock.filter((item) => {
      if (!item.expiryDate) return false;
      const expiryTime = new Date(item.expiryDate).getTime();
      const diffHours = (expiryTime - referenceTime) / (1000 * 3600);
      return diffHours <= 48 && diffHours >= -24;
    });
  }, [pantryStock, referenceTime]);

  const getStatusBadge = (item: PantryItem) => {
    if (!item.expiryDate) {
      return {
        type: 'stable',
        label: 'Stable (60+ days)',
        telemetry: 'Dry Pantry',
        telemetryIcon: 'inventory_2',
      };
    }
    const days = Math.ceil((new Date(item.expiryDate).getTime() - referenceTime) / (1000 * 3600 * 24));
    if (days <= 0) {
      return {
        type: 'expired',
        label: 'Expired Today',
        telemetry: 'Immediate Cook',
        telemetryIcon: 'local_fire_department',
      };
    }
    if (days <= 2) {
      return {
        type: 'urgent',
        label: `Expires in ${days * 24}h`,
        telemetry: 'Crispness 35%',
        telemetryIcon: 'thermostat',
      };
    }
    if (days <= 5) {
      return {
        type: 'fresh',
        label: `Peak Fresh (${days} days)`,
        telemetry: 'Optimal Ripe',
        telemetryIcon: 'eco',
      };
    }
    return {
      type: 'stable',
      label: `Good for ${days} days`,
      telemetry: 'Chilled 2°C',
      telemetryIcon: 'ac_unit',
    };
  };

  // Filtered inventory list
  const filteredStock = useMemo(() => {
    return pantryStock.filter((item) => {
      // Category filter
      if (selectedCategory !== 'All') {
        const matchesCategory = item.category?.toLowerCase().includes(selectedCategory.toLowerCase());
        if (!matchesCategory) return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesCat = item.category?.toLowerCase().includes(q);
        if (!matchesName && !matchesCat) return false;
      }
      return true;
    });
  }, [pantryStock, selectedCategory, searchQuery]);

  const openAddModal = () => {
    sounds.playTap();
    setItemName('');
    setItemQty(1);
    setItemUnit('pcs');
    setItemCategory('Produce');
    setItemExpiry(new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString().split('T')[0]);
    setIsAddModalOpen(true);
  };

  const openEditModal = (item: PantryItem) => {
    sounds.playTap();
    setEditingItem(item);
    setItemName(item.name);
    setItemQty(item.quantity);
    setItemUnit(item.unit);
    setItemCategory((item.category as CategoryType) || 'Produce');
    setItemExpiry(item.expiryDate || '');
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) return;

    sounds.playTap();
    try {
      if (editingItem) {
        await updatePantryItem(editingItem.id, {
          name: itemName.trim(),
          quantity: itemQty,
          unit: itemUnit,
          category: itemCategory,
          expiryDate: itemExpiry || undefined,
          emoji: getIngredientEmoji(itemName.trim()),
        });
        setEditingItem(null);
      } else {
        await addPantryItem({
          name: itemName.trim(),
          quantity: itemQty,
          unit: itemUnit,
          category: itemCategory,
          expiryDate: itemExpiry || undefined,
          emoji: getIngredientEmoji(itemName.trim()),
        });
        setIsAddModalOpen(false);
      }
    } catch {
      addToast('Could not save pantry item.', 'error');
    }
  };

  return (
    <div className="pantry-dashboard-canvas">
      {/* =========================================================================
          TOP CONTEXT HEADER: TITLE, SEARCH, AND INGESTION ACTIONS
          ========================================================================= */}
      <section className="pantry-context-header">
        <div className="pantry-title-row">
          <div>
            <span className="pantry-eyebrow">Real-Time Inventory</span>
            <h1 className="pantry-headline">Smart Pantry</h1>
          </div>

          <div className="pantry-actions-group">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={openAddModal}
            >
              <Plus size={16} />
              <span>Add Item</span>
            </button>

            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => {
                sounds.playTap();
                navigate('/');
              }}
            >
              <QrCode size={16} />
              <span>Scan Item</span>
            </button>
          </div>
        </div>

        {/* Search & Voice Filter Bar */}
        <div className="pantry-search-container">
          <Search size={18} className="pantry-search-icon" />
          <input
            type="search"
            className="pantry-search-input"
            placeholder={`Search ${pantryStock.length} ingredients, herbs, dairy...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search pantry inventory"
          />
          <div className="search-trailing-actions">
            <button
              type="button"
              className="search-aux-icon"
              title="Voice filter"
              onClick={() => {
                sounds.playTap();
                addToast('Voice filter ready: speak ingredient name', 'info');
              }}
            >
              <Mic size={17} />
            </button>
            <button
              type="button"
              className="search-aux-icon"
              title="Sort and filter options"
              onClick={() => sounds.playTap()}
            >
              <span className="material-symbols-outlined text-[18px]">tune</span>
            </button>
          </div>
        </div>
      </section>

      {/* =========================================================================
          PROMINENT EXPIRY ALERT BANNER
          ========================================================================= */}
      {expiringItems.length > 0 && (
        <section className="pantry-expiry-alert-banner">
          <div className="alert-banner-inner">
            <div className="alert-left-content">
              <div className="alert-warning-circle">
                <AlertTriangle size={22} />
              </div>
              <div>
                <div className="alert-flag-row">
                  <span className="alert-flag-title">Critical Expiry Flag</span>
                  <span className="alert-countdown-pill">48h remaining</span>
                </div>
                <h2 className="alert-heading">
                  {expiringItems.length} {expiringItems.length === 1 ? 'Item' : 'Items'} Expiring Soon
                </h2>
                <p className="alert-items-list">
                  {expiringItems.map((i) => i.name).slice(0, 4).join(', ')}
                </p>
              </div>
            </div>

            <button
              type="button"
              className="alert-cook-cta-btn"
              onClick={() => {
                sounds.playTap();
                navigate('/recipes');
              }}
            >
              <span>Cook Expiring Items Now</span>
              <span>🔥</span>
            </button>
          </div>

          {/* Metric Micro-Bar for Food Rescue */}
          <div className="alert-metric-bar">
            <div className="metric-tag-left">
              <span className="material-symbols-outlined text-[15px] text-primary">eco</span>
              <span>
                Prevents <strong>$14.20</strong> waste & <strong>1.8 kg CO₂e</strong>
              </span>
            </div>
            <span className="metric-time-right">T-minus 22h</span>
          </div>
        </section>
      )}

      {/* =========================================================================
          CATEGORY FILTER PILLS (HORIZONTAL SCROLLING)
          ========================================================================= */}
      <section className="pantry-category-chips-dock" role="tablist">
        <div className="category-scroll-track">
          {CATEGORIES.map((cat) => {
            const count =
              cat === 'All'
                ? pantryStock.length
                : pantryStock.filter((i) => i.category?.toLowerCase().includes(cat.toLowerCase())).length;

            return (
              <button
                key={cat}
                type="button"
                className={`category-pill-tab ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => {
                  sounds.playTap();
                  setSelectedCategory(cat);
                }}
                role="tab"
                aria-selected={selectedCategory === cat}
              >
                <span>{cat}</span>
                <span className="category-count-badge">{count}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* =========================================================================
          TACTICAL INVENTORY CARDS LIST
          ========================================================================= */}
      <main className="pantry-items-list-container">
        {filteredStock.length > 0 ? (
          <div className="pantry-cards-grid">
            {filteredStock.map((item) => {
              const status = getStatusBadge(item);

              return (
                <article
                  key={item.id}
                  className={`pantry-tactical-card status-${status.type}`}
                >
                  {/* Left Color Accent Bar */}
                  <div className={`card-accent-bar bar-${status.type}`} />

                  {/* Left: Emoji Avatar Box + Info */}
                  <div className="card-identity-group">
                    <div className="pantry-item-emoji-avatar">
                      {item.emoji || getIngredientEmoji(item.name)}
                    </div>

                    <div className="pantry-item-details">
                      <div className="item-name-row">
                        <h3 className="item-title">{item.name}</h3>
                        <span className={`item-status-pill pill-${status.type}`}>
                          {status.label}
                        </span>
                      </div>

                      <div className="item-meta-line">
                        <span className="item-qty-pill">
                          {item.quantity} {item.unit}
                        </span>
                        <span className="meta-dot">•</span>
                        <span className="item-age">{item.addedAt || 'In stock'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Freshness Telemetry + Actions */}
                  <div className="card-actions-group">
                    <span className={`item-telemetry-pill tel-${status.type}`}>
                      <span className="material-symbols-outlined text-[15px]">
                        {status.telemetryIcon}
                      </span>
                      <span>{status.telemetry}</span>
                    </span>

                    <div className="actions-button-pair">
                      <button
                        type="button"
                        className="btn-item-cook"
                        onClick={() => {
                          sounds.playTap();
                          navigate('/recipes');
                        }}
                        title={`Find recipes using ${item.name}`}
                      >
                        <Soup size={15} />
                        <span>Cook</span>
                      </button>

                      <button
                        type="button"
                        className="btn-item-edit"
                        onClick={() => openEditModal(item)}
                        title={`Edit ${item.name}`}
                      >
                        <Edit2 size={15} />
                      </button>

                      <button
                        type="button"
                        className="btn-item-delete"
                        onClick={() => {
                          sounds.playTap();
                          deletePantryItem(item.id);
                        }}
                        title={`Delete ${item.name}`}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          /* Empty State */
          <div className="pantry-empty-state">
            <div className="empty-avatar-circle">
              <Refrigerator size={52} className="text-primary" />
            </div>
            <h3 className="empty-title">Your digital pantry is currently empty</h3>
            <p className="empty-subtitle">
              Scan your refrigerator or kitchen shelves to instantly track ingredients, minimize food
              waste, and receive personalized recipes.
            </p>
            <button
              type="button"
              className="btn btn-primary mt-3"
              onClick={() => {
                sounds.playTap();
                navigate('/');
              }}
            >
              <QrCode size={17} />
              <span>Scan Your Refrigerator</span>
            </button>
          </div>
        )}
      </main>

      {/* =========================================================================
          MICRO ZERO-WASTE KITCHEN SCORE FOOTPRINT WIDGET
          ========================================================================= */}
      <section className="pantry-footprint-widget">
        <div className="footprint-left">
          <div className="footprint-icon-circle">
            <span className="material-symbols-outlined text-[24px]">savings</span>
          </div>
          <div>
            <h4 className="footprint-title">Weekly Pantry Preservation</h4>
            <p className="footprint-description">
              You have kept 91% of purchased goods out of compost this month.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="footprint-cta-btn"
          onClick={() => {
            sounds.playTap();
            addToast('Pantry preservation metrics: 91% zero-waste rating this week', 'success');
          }}
        >
          View Waste Metrics
        </button>
      </section>

      {/* =========================================================================
          THUMB-FRIENDLY FLOATING ACTION BUTTON (+)
          ========================================================================= */}
      <div className="pantry-fab-wrapper">
        <button
          type="button"
          className="pantry-fab-btn"
          onClick={openAddModal}
          aria-label="Add new pantry item"
          title="Add pantry item manually"
        >
          <Plus size={24} />
        </button>
      </div>

      {/* =========================================================================
          ADD / EDIT ITEM MODAL DIALOG
          ========================================================================= */}
      {(isAddModalOpen || editingItem) && (
        <div
          className="modal-backdrop-overlay"
          onClick={() => {
            setIsAddModalOpen(false);
            setEditingItem(null);
          }}
        >
          <div
            className="pantry-modal-dialog"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-header-line">
              <h3 className="modal-title">
                {editingItem ? 'Edit Pantry Item' : 'Add New Pantry Item'}
              </h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => {
                  sounds.playTap();
                  setIsAddModalOpen(false);
                  setEditingItem(null);
                }}
              >
                <X size={17} />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="modal-form-body">
              <div className="form-field-group">
                <label className="field-label">Ingredient Name</label>
                <input
                  type="text"
                  required
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="e.g. Baby Spinach, Haas Avocado, Oat Milk"
                  className="field-text-input"
                />
              </div>

              <div className="form-grid-pair">
                <div className="form-field-group">
                  <label className="field-label">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={itemQty}
                    onChange={(e) => setItemQty(parseInt(e.target.value) || 1)}
                    className="field-text-input"
                  />
                </div>
                <div className="form-field-group">
                  <label className="field-label">Unit</label>
                  <select
                    value={itemUnit}
                    onChange={(e) => setItemUnit(e.target.value)}
                    className="field-select-input"
                  >
                    <option value="pcs">pcs</option>
                    <option value="g">grams (g)</option>
                    <option value="ml">milliliters (ml)</option>
                    <option value="tub">tub</option>
                    <option value="heads">heads</option>
                    <option value="bunches">bunches</option>
                    <option value="slices">slices</option>
                    <option value="tbsp">tbsp</option>
                  </select>
                </div>
              </div>

              <div className="form-grid-pair">
                <div className="form-field-group">
                  <label className="field-label">Category</label>
                  <select
                    value={itemCategory}
                    onChange={(e) => setItemCategory(e.target.value as CategoryType)}
                    className="field-select-input"
                  >
                    <option value="Produce">Produce</option>
                    <option value="Dairy">Dairy</option>
                    <option value="Pantry Staples">Pantry Staples</option>
                    <option value="Meat/Seafood">Meat & Seafood</option>
                    <option value="Bakery">Bakery</option>
                  </select>
                </div>
                <div className="form-field-group">
                  <label className="field-label">Expiry Date</label>
                  <input
                    type="date"
                    value={itemExpiry}
                    onChange={(e) => setItemExpiry(e.target.value)}
                    className="field-text-input"
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary-block mt-3">
                <Check size={18} />
                <span>{editingItem ? 'Save Changes' : 'Add to Pantry'}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
