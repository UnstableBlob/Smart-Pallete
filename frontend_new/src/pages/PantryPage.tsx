import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { sounds } from '../services/audio';
import type { PantryItem, CategoryType } from '../types';
import {
  Plus,
  Trash2,
  Edit2,
  AlertTriangle,
  Refrigerator,
  Check,
  X,
  Camera,
} from 'lucide-react';

const CATEGORIES: Array<{ label: string; value: string }> = [
  { label: 'All', value: 'All' },
  { label: 'Produce', value: 'Produce' },
  { label: 'Dairy', value: 'Dairy' },
  { label: 'Pantry Staples', value: 'Pantry Staples' },
  { label: 'Meat & Seafood', value: 'Meat/Seafood' },
  { label: 'Bakery', value: 'Bakery' },
];

function getExpiryDisplay(expiryDate: string | undefined): {
  label: string;
  cls: string;
} {
  if (!expiryDate) return { label: '—', cls: '' };

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const exp = new Date(expiryDate);
  exp.setHours(0, 0, 0, 0);
  const diffDays = Math.round((exp.getTime() - now.getTime()) / (1000 * 3600 * 24));

  if (diffDays < 0) return { label: 'Expired', cls: 'danger' };
  if (diffDays === 0) return { label: 'Today', cls: 'danger' };
  if (diffDays === 1) return { label: 'Tomorrow', cls: 'warning' };
  if (diffDays <= 7) return { label: `In ${diffDays} days`, cls: 'warning' };

  // Format date: "12 Oct"
  const formatted = exp.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  return { label: formatted, cls: '' };
}

export const PantryPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    pantryStock,
    addPantryItem,
    updatePantryItem,
    deletePantryItem,
  } = useAppStore();

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [editingItem, setEditingItem] = useState<PantryItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [itemName, setItemName] = useState('');
  const [itemQty, setItemQty] = useState(1);
  const [itemUnit, setItemUnit] = useState('pcs');
  const [itemCategory, setItemCategory] = useState<CategoryType>('Produce');
  const [itemExpiry, setItemExpiry] = useState('');

  // Items expiring within 7 days
  const expiringItems = useMemo(() => {
    return pantryStock.filter((item) => {
      if (!item.expiryDate) return false;
      const diffDays = (new Date(item.expiryDate).getTime() - Date.now()) / (1000 * 3600 * 24);
      return diffDays <= 7 && diffDays >= -1;
    });
  }, [pantryStock]);

  const filteredStock = useMemo(() => {
    if (selectedCategory === 'All') return pantryStock;
    return pantryStock.filter((item) =>
      item.category.toLowerCase().includes(selectedCategory.toLowerCase())
    );
  }, [pantryStock, selectedCategory]);

  const openAddModal = () => {
    sounds.playTap();
    setItemName('');
    setItemQty(1);
    setItemUnit('pcs');
    setItemCategory('Produce');
    setItemExpiry(new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0]);
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

  const closeModal = () => {
    setIsAddModalOpen(false);
    setEditingItem(null);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) return;
    sounds.playTap();

    if (editingItem) {
      updatePantryItem(editingItem.id, {
        name: itemName.trim(),
        quantity: itemQty,
        unit: itemUnit,
        category: itemCategory,
        expiryDate: itemExpiry || undefined,
      });
      setEditingItem(null);
    } else {
      addPantryItem({
        name: itemName.trim(),
        quantity: itemQty,
        unit: itemUnit,
        category: itemCategory,
        expiryDate: itemExpiry || undefined,
      });
      setIsAddModalOpen(false);
    }
  };

  const getCategoryCount = (value: string) => {
    if (value === 'All') return pantryStock.length;
    return pantryStock.filter((i) =>
      i.category.toLowerCase().includes(value.toLowerCase())
    ).length;
  };

  return (
    <div className="content-container">
      <div style={{ paddingBottom: 'var(--space-7)' }}>
        {/* Page header */}
        <div
          className="page-header"
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 'var(--space-3)',
          }}
        >
          <div>
            <h1 className="page-title">Pantry</h1>
            <p className="page-subtitle">{pantryStock.length} items tracked</p>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center', paddingTop: 'var(--space-6)' }}>
            <button
              className="btn btn-secondary"
              onClick={openAddModal}
              id="btn-add-pantry-item"
            >
              <Plus size={16} />
              <span>Add item</span>
            </button>
            <button
              id="btn-scan-fridge"
              className="btn btn-primary"
              onClick={() => {
                sounds.playTap();
                navigate('/');
              }}
            >
              <Camera size={16} />
              <span>Scan fridge</span>
            </button>
          </div>
        </div>

        {/* Expiry notice bar — warning tint, not red */}
        {expiringItems.length > 0 && (
          <div className="expiry-notice-bar" role="alert" aria-live="polite">
            <AlertTriangle size={16} aria-hidden="true" />
            <span>
              {expiringItems.length === 1
                ? `${expiringItems[0].name} is expiring soon`
                : `${expiringItems.length} items expiring soon — ${expiringItems.slice(0, 3).map((i) => i.name).join(', ')}`}
            </span>
            <button
              className="expiry-notice-link"
              onClick={() => {
                sounds.playTap();
                navigate('/recipes');
              }}
              aria-label="See recipes that use expiring items"
            >
              See recipes
            </button>
          </div>
        )}

        {/* Category tabs */}
        <div
          className="tab-bar"
          role="tablist"
          aria-label="Filter by category"
          style={{ marginBottom: 'var(--space-4)' }}
        >
          {CATEGORIES.map((cat) => {
            const count = getCategoryCount(cat.value);
            return (
              <button
                key={cat.value}
                className={`tab-item ${selectedCategory === cat.value ? 'active' : ''}`}
                onClick={() => {
                  sounds.playTap();
                  setSelectedCategory(cat.value);
                }}
                role="tab"
                aria-selected={selectedCategory === cat.value}
              >
                {cat.label}
                <span className="tab-count">{count}</span>
              </button>
            );
          })}
        </div>

        {/* Pantry list */}
        <main aria-label="Pantry inventory">
          {filteredStock.length > 0 ? (
            <div className="pantry-list">
              {filteredStock.map((item) => {
                const expiry = getExpiryDisplay(item.expiryDate);

                return (
                  <div key={item.id} className="pantry-row">
                    {/* Item info */}
                    <div>
                      <p className="pantry-item-name">{item.name}</p>
                      <p className="pantry-item-category">{item.category}</p>
                    </div>

                    {/* Quantity + Expiry */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                      <span className="pantry-item-qty">{item.quantity} {item.unit}</span>
                      <span className={`pantry-item-expiry ${expiry.cls}`}>{expiry.label}</span>
                    </div>

                    {/* Row actions */}
                    <div className="pantry-row-actions">
                      <button
                        className="pantry-row-btn"
                        onClick={() => openEditModal(item)}
                        title={`Edit ${item.name}`}
                        aria-label={`Edit ${item.name}`}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        className="pantry-row-btn danger"
                        onClick={() => {
                          sounds.playTap();
                          deletePantryItem(item.id);
                        }}
                        title={`Delete ${item.name}`}
                        aria-label={`Delete ${item.name}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">
                <Refrigerator size={40} aria-hidden="true" />
              </div>
              <p className="empty-state-title">Your pantry is empty</p>
              <p className="empty-state-desc">
                Scan your fridge or add items manually to start tracking ingredients.
              </p>
              <button
                className="btn btn-primary"
                onClick={() => {
                  sounds.playTap();
                  navigate('/');
                }}
              >
                <Camera size={16} />
                <span>Scan your fridge</span>
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Add / Edit modal */}
      {(isAddModalOpen || editingItem) && (
        <div
          className="modal-overlay"
          onClick={closeModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div
            className="modal-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2 className="modal-title" id="modal-title">
                {editingItem ? 'Edit item' : 'Add item'}
              </h2>
              <button
                className="btn btn-ghost btn-icon"
                onClick={closeModal}
                aria-label="Close dialog"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveItem}>
              <div className="modal-body">
                <div>
                  <label className="input-label" htmlFor="item-name-input">
                    Name
                  </label>
                  <input
                    id="item-name-input"
                    type="text"
                    required
                    autoFocus
                    className="input-field"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    placeholder="e.g. Baby spinach"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                  <div>
                    <label className="input-label" htmlFor="item-qty-input">
                      Quantity
                    </label>
                    <input
                      id="item-qty-input"
                      type="number"
                      min="0"
                      step="0.5"
                      required
                      className="input-field"
                      value={itemQty}
                      onChange={(e) => setItemQty(parseFloat(e.target.value) || 1)}
                    />
                  </div>
                  <div>
                    <label className="input-label" htmlFor="item-unit-select">
                      Unit
                    </label>
                    <select
                      id="item-unit-select"
                      className="input-field select-field"
                      value={itemUnit}
                      onChange={(e) => setItemUnit(e.target.value)}
                    >
                      <option value="pcs">pcs</option>
                      <option value="g">g</option>
                      <option value="kg">kg</option>
                      <option value="ml">ml</option>
                      <option value="L">L</option>
                      <option value="cups">cups</option>
                      <option value="tbsp">tbsp</option>
                      <option value="tsp">tsp</option>
                      <option value="slices">slices</option>
                      <option value="heads">heads</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                  <div>
                    <label className="input-label" htmlFor="item-category-select">
                      Category
                    </label>
                    <select
                      id="item-category-select"
                      className="input-field select-field"
                      value={itemCategory}
                      onChange={(e) => setItemCategory(e.target.value as CategoryType)}
                    >
                      <option value="Produce">Produce</option>
                      <option value="Dairy">Dairy</option>
                      <option value="Pantry Staples">Pantry Staples</option>
                      <option value="Meat/Seafood">Meat & Seafood</option>
                      <option value="Bakery">Bakery</option>
                    </select>
                  </div>
                  <div>
                    <label className="input-label" htmlFor="item-expiry-input">
                      Expiry date
                    </label>
                    <input
                      id="item-expiry-input"
                      type="date"
                      className="input-field"
                      value={itemExpiry}
                      onChange={(e) => setItemExpiry(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <Check size={16} />
                  <span>{editingItem ? 'Save changes' : 'Add to pantry'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
