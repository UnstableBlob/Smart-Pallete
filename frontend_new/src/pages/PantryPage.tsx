import {
    AlertTriangle,
    Check,
    Edit2,
    Plus,
    Refrigerator,
    Sparkles,
    Trash2,
    X,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sounds } from '../services/audio';
import { getIngredientEmoji } from '../services/mockData';
import { useAppStore } from '../store/useAppStore';
import type { CategoryType, PantryItem } from '../types';

const CATEGORIES = ['All', 'Produce', 'Dairy', 'Pantry Staples', 'Meat/Seafood', 'Bakery'];

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

  // Form states for Add/Edit
  const [itemName, setItemName] = useState('');
  const [itemQty, setItemQty] = useState(1);
  const [itemUnit, setItemUnit] = useState('pcs');
  const [itemCategory, setItemCategory] = useState<CategoryType>('Produce');
  const [itemExpiry, setItemExpiry] = useState('');

  // Expiring items calculation (within 48 hours)
  const expiringItems = useMemo(() => {
    return pantryStock.filter((item) => {
      if (!item.expiryDate) return false;
      const expiryTime = new Date(item.expiryDate).getTime();
      const now = Date.now();
      const diffHours = (expiryTime - now) / (1000 * 3600);
      return diffHours <= 48;
    });
  }, [pantryStock]);

  const expiryLabel = (expiryDate?: string) => {
    if (!expiryDate) return 'No expiry date';
    const days = Math.ceil((new Date(expiryDate).getTime() - Date.now()) / (1000 * 3600 * 24));
    if (days < 0) return 'Expired';
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    if (days <= 7) return `In ${days} days`;
    return new Date(expiryDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  };

  // Filtered inventory list
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
        emoji: getIngredientEmoji(itemName.trim()),
      });
      setEditingItem(null);
    } else {
      addPantryItem({
        name: itemName.trim(),
        quantity: itemQty,
        unit: itemUnit,
        category: itemCategory,
        expiryDate: itemExpiry || undefined,
        emoji: getIngredientEmoji(itemName.trim()),
      });
      setIsAddModalOpen(false);
    }
  };

  return (
    <div className="content-container">
      <div id="pantry-page-container">
        {/* 3.5 Header */}
        <header id="pantry-dashboard-header">
          <div id="pantry-title-row">
            <h1>My Pantry Inventory</h1>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="btn-secondary"
                style={{ padding: '8px 14px', fontSize: '13px' }}
                onClick={openAddModal}
              >
                <Plus size={16} />
                <span>Add Item</span>
              </button>
              <button
                id="btn-open-scan-page"
                className="btn-accent"
                onClick={() => {
                  sounds.playTap();
                  navigate('/');
                }}
              >
                + Scan Fridge
              </button>
            </div>
          </div>

          {/* Section: Alert Box for Expiring Stock */}
          {expiringItems.length > 0 && (
            <section id="expiry-warning-banner" className="banner-amber">
              <div id="warning-icon-group">
                <AlertTriangle size={28} color="#E05A47" />
              </div>
              <div id="warning-text-content">
                <h4>
                  {expiringItems.length}{' '}
                  {expiringItems.length === 1 ? 'Item' : 'Items'} Expiring Soon
                </h4>
                <p>
                  {expiringItems.map((i) => i.name).slice(0, 3).join(', ')} expire within 48 hours.
                </p>
              </div>
              <button
                id="btn-cook-expiring-items"
                onClick={() => {
                  sounds.playTap();
                  navigate('/recipes');
                }}
              >
                Cook These Now
              </button>
            </section>
          )}

          {/* Category Filter Pills */}
          <div id="pantry-category-pills" role="tablist">
            {CATEGORIES.map((cat) => {
              const count =
                cat === 'All'
                  ? pantryStock.length
                  : pantryStock.filter((i) => i.category.toLowerCase().includes(cat.toLowerCase())).length;

              return (
                <button
                  key={cat}
                  className={`pill-category ${selectedCategory === cat ? 'active' : ''}`}
                  onClick={() => {
                    sounds.playTap();
                    setSelectedCategory(cat);
                  }}
                  role="tab"
                  aria-selected={selectedCategory === cat}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>
        </header>

        {/* 3.5 Inventory List */}
        <main id="pantry-inventory-list">
          {filteredStock.length > 0 ? (
            filteredStock.map((item) => {
              const isExpiring = expiringItems.some((e) => e.id === item.id);
              const isExpired = item.expiryDate ? new Date(item.expiryDate).getTime() < Date.now() : false;

              return (
                <div
                  key={item.id}
                  className="pantry-item-card"
                  style={{
                    borderLeft: isExpiring ? '4px solid #E05A47' : undefined,
                  }}
                >
                  <span className="pantry-item-emoji">
                    {item.emoji || getIngredientEmoji(item.name)}
                  </span>

                  <div className="pantry-item-info">
                    <h4 className="item-name">
                      {item.name}
                      {isExpiring && (
                          <span
                          style={{
                            marginLeft: '8px',
                            fontSize: '11px',
                            fontWeight: 800,
                            color: isExpired ? 'var(--color-danger)' : 'var(--color-warning)',
                            backgroundColor: '#FEF2F2',
                            padding: '2px 6px',
                            borderRadius: '9999px',
                          }}
                        >
                          {isExpired ? 'Expired' : 'Expiring Soon'}
                        </span>
                      )}
                    </h4>
                    <span className="item-meta">
                      {item.addedAt || 'In stock'} • {item.category}
                    </span>
                  </div>

                  <div className="pantry-item-qty">
                    <span className="qty-label">
                      {item.quantity} {item.unit}
                    </span>
                    <span className={`pantry-expiry-text ${isExpired ? 'danger' : isExpiring ? 'warning' : ''}`}>
                      {expiryLabel(item.expiryDate)}
                    </span>
                  </div>

                  <div className="pantry-item-actions">
                    <button
                      className="btn-edit-stock"
                      onClick={() => openEditModal(item)}
                      title={`Edit ${item.name}`}
                      aria-label={`Edit ${item.name}`}
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      className="btn-delete-stock"
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
            })
          ) : (
            /* Section 5.2: Empty Pantry View */
            <div className="empty-state-card" style={{ gridColumn: '1 / -1' }}>
              <div className="empty-state-icon">
                <Refrigerator size={56} color="#3A7D44" />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 800 }}>
                Your digital pantry is currently empty.
              </h3>
              <p style={{ color: 'var(--color-text-muted)', maxWidth: '360px', fontSize: '14px' }}>
                Scan your refrigerator or kitchen shelves to instantly track ingredients, minimize food waste, and receive personalized recipes.
              </p>
              <button
                className="btn-primary"
                onClick={() => {
                  sounds.playTap();
                  navigate('/');
                }}
              >
                <Sparkles size={16} />
                <span>Take a Photo of Your Fridge</span>
              </button>
            </div>
          )}
        </main>

        {/* Add / Edit Item Modal */}
        {(isAddModalOpen || editingItem) && (
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
              zIndex: 65,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
            }}
            onClick={() => {
              setIsAddModalOpen(false);
              setEditingItem(null);
            }}
          >
            <div
              style={{
                backgroundColor: 'var(--color-surface)',
                borderRadius: 'var(--radius-xl)',
                maxWidth: '460px',
                width: '100%',
                padding: '24px',
                boxShadow: 'var(--shadow-lg)',
                border: '1px solid var(--color-border)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '20px',
                }}
              >
                <h3 style={{ fontSize: '18px', fontWeight: 800 }}>
                  {editingItem ? 'Edit Pantry Item' : 'Add New Pantry Item'}
                </h3>
                <button
                  onClick={() => {
                    sounds.playTap();
                    setIsAddModalOpen(false);
                    setEditingItem(null);
                  }}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: 'var(--radius-pill)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'var(--color-surface-alt)',
                  }}
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSaveItem} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                    Ingredient Name
                  </label>
                  <input
                    type="text"
                    required
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    placeholder="e.g. Baby Spinach, Whole Milk"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                      backgroundColor: 'var(--color-input-bg)',
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                      Quantity
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={itemQty}
                      onChange={(e) => setItemQty(parseInt(e.target.value) || 1)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border)',
                        backgroundColor: 'var(--color-input-bg)',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                      Unit
                    </label>
                    <select
                      value={itemUnit}
                      onChange={(e) => setItemUnit(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border)',
                        backgroundColor: 'var(--color-input-bg)',
                      }}
                    >
                      <option value="pcs">pcs</option>
                      <option value="grams">grams</option>
                      <option value="heads">heads</option>
                      <option value="ml">ml</option>
                      <option value="slices">slices</option>
                      <option value="tbsp">tbsp</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                      Category
                    </label>
                    <select
                      value={itemCategory}
                      onChange={(e) => setItemCategory(e.target.value as CategoryType)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border)',
                        backgroundColor: 'var(--color-input-bg)',
                      }}
                    >
                      <option value="Produce">Produce</option>
                      <option value="Dairy">Dairy</option>
                      <option value="Pantry Staples">Pantry Staples</option>
                      <option value="Meat/Seafood">Meat/Seafood</option>
                      <option value="Bakery">Bakery</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                      Expiry Date
                    </label>
                    <input
                      type="date"
                      value={itemExpiry}
                      onChange={(e) => setItemExpiry(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border)',
                        backgroundColor: 'var(--color-input-bg)',
                      }}
                    />
                  </div>
                </div>

                <button type="submit" className="btn-primary-block" style={{ marginTop: '8px' }}>
                  <Check size={18} />
                  <span>{editingItem ? 'Save Changes' : 'Add to Inventory'}</span>
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
