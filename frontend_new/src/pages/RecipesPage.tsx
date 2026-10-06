import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import type { FilterState, Recipe } from '../types';
import { sounds } from '../services/audio';
import { FilterDrawerModal } from '../components/FilterDrawer/FilterDrawerModal';
import {
  SlidersHorizontal,
  Clock,
  Flame,
  ChefHat,
  Info,
  Heart,
  Soup,
} from 'lucide-react';

const FILTER_CHIPS = ['All', 'Keto', 'Vegan', 'Gluten-Free', 'Under 20 Mins'];

export const RecipesPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    recipes,
    setActiveRecipe,
    bookmarkedRecipeIds,
    toggleBookmark,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'zero-waste' | 'quick-run'>('zero-waste');
  const [selectedChip, setSelectedChip] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  const [filterState, setFilterState] = useState<FilterState>({
    searchQuery: '',
    selectedTag: 'All',
    tab: 'zero-waste',
    maxCookTime: undefined,
    difficulty: undefined,
    spiceLevel: undefined,
  });

  const handleUpdateFilters = (updates: Partial<FilterState>) => {
    setFilterState((prev) => ({ ...prev, ...updates }));
  };

  const handleResetFilters = () => {
    setFilterState({
      searchQuery: '',
      selectedTag: 'All',
      tab: activeTab,
      maxCookTime: undefined,
      difficulty: undefined,
      spiceLevel: undefined,
    });
  };

  // Filter recipes based on tab, chip, search, and drawer filters
  const filteredRecipes = useMemo(() => {
    return recipes.filter((recipe) => {
      // 1. Tab Match
      if (recipe.matchType !== activeTab) return false;

      // 2. Chip Filter
      if (selectedChip === 'Under 20 Mins' && recipe.cookTimeMinutes > 20) {
        return false;
      } else if (selectedChip !== 'All' && selectedChip !== 'Under 20 Mins') {
        if (!recipe.dietaryTags.some((t) => t.toLowerCase() === selectedChip.toLowerCase())) {
          return false;
        }
      }

      // 3. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = recipe.title.toLowerCase().includes(q);
        const matchesIngredient = recipe.utilizedIngredients.some((ing) =>
          ing.toLowerCase().includes(q)
        );
        if (!matchesTitle && !matchesIngredient) return false;
      }

      // 4. Advanced Drawer Filters
      if (filterState.maxCookTime && recipe.cookTimeMinutes > filterState.maxCookTime) {
        return false;
      }
      if (filterState.difficulty && recipe.difficulty !== filterState.difficulty) {
        return false;
      }
      if (filterState.spiceLevel && recipe.spiceLevel !== filterState.spiceLevel) {
        return false;
      }

      return true;
    });
  }, [recipes, activeTab, selectedChip, searchQuery, filterState]);

  const zeroWasteCount = recipes.filter((r) => r.matchType === 'zero-waste').length;
  const quickRunCount = recipes.filter((r) => r.matchType === 'quick-run').length;

  const handleStartCooking = (recipe: Recipe) => {
    sounds.playTap();
    setActiveRecipe(recipe);
    navigate(`/cook/${recipe.id}`);
  };

  return (
    <div className="content-container">
      <div id="recipes-page-container">
        {/* 3.3 Dashboard Header */}
        <header id="dashboard-header">
          {/* Top Search Row */}
          <div id="top-search-row">
            <input
              type="search"
              id="recipe-search-input"
              placeholder="Search recipes or ingredients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search recipes"
            />
            <button
              id="btn-open-filter-drawer"
              title="Open filters"
              aria-label="Open filter drawer"
              onClick={() => {
                sounds.playTap();
                setIsFilterModalOpen(true);
              }}
            >
              <SlidersHorizontal size={20} className="icon-filter" />
            </button>
          </div>

          {/* Dietary Filter Quick Chips */}
          <div id="horizontal-filter-scroll" role="tablist" aria-label="Dietary filters">
            {FILTER_CHIPS.map((chip) => (
              <button
                key={chip}
                className={`chip-filter ${selectedChip === chip ? 'active' : ''}`}
                onClick={() => {
                  sounds.playTap();
                  setSelectedChip(chip);
                }}
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Segmented Tab Bar */}
          <div id="segmented-tab-container" role="tablist">
            <button
              id="tab-zero-waste"
              className={`tab-btn ${activeTab === 'zero-waste' ? 'active' : ''}`}
              onClick={() => {
                sounds.playTap();
                setActiveTab('zero-waste');
              }}
              role="tab"
              aria-selected={activeTab === 'zero-waste'}
            >
              Zero-Waste <span className="tab-badge-count">{zeroWasteCount} (100% Match)</span>
            </button>

            <button
              id="tab-quick-run"
              className={`tab-btn ${activeTab === 'quick-run' ? 'active' : ''}`}
              onClick={() => {
                sounds.playTap();
                setActiveTab('quick-run');
              }}
              role="tab"
              aria-selected={activeTab === 'quick-run'}
            >
              Quick Run <span className="tab-badge-count">{quickRunCount} (90%+ Match)</span>
            </button>
          </div>
        </header>

        {/* Recipe Card Grid */}
        <main id="recipe-card-grid">
          {filteredRecipes.length > 0 ? (
            filteredRecipes.map((recipe) => {
              const isBookmarked = bookmarkedRecipeIds.includes(recipe.id);

              return (
                <article key={recipe.id} className="recipe-card">
                  <div className="card-image-wrapper">
                    <img
                      className="recipe-cover-img"
                      src={recipe.imageUrl}
                      alt={recipe.title}
                      loading="lazy"
                    />

                    {/* Match Score Badge */}
                    <span
                      className={`badge-match-score ${
                        recipe.matchScore === 100 ? 'percent-100' : 'percent-90'
                      }`}
                    >
                      {recipe.matchScore === 100 ? '100% Pantry Match' : `${recipe.matchScore}% Match`}
                    </span>

                    {/* Bookmark Button */}
                    <button
                      className={`btn-bookmark-recipe ${isBookmarked ? 'active' : ''}`}
                      onClick={() => {
                        sounds.playTap();
                        toggleBookmark(recipe.id);
                      }}
                      title={isBookmarked ? 'Remove bookmark' : 'Bookmark recipe'}
                      aria-label="Bookmark recipe"
                    >
                      <Heart
                        size={18}
                        fill={isBookmarked ? '#E05A47' : 'none'}
                        color={isBookmarked ? '#E05A47' : 'currentColor'}
                      />
                    </button>
                  </div>

                  <div className="card-content-body">
                    <h3 className="recipe-title">{recipe.title}</h3>

                    <div className="recipe-meta-row">
                      <span className="meta-item cook-time">
                        <Clock size={15} /> {recipe.cookTimeMinutes} mins
                      </span>
                      <span className="meta-item spice-level">
                        <Flame size={15} /> {recipe.spiceLevel}
                      </span>
                      <span className="meta-item difficulty">
                        <ChefHat size={15} /> {recipe.difficulty}
                      </span>
                    </div>

                    <div className="utilized-ingredients-preview">
                      <span className="label">Uses from pantry:</span>
                      <div className="pill-group">
                        {recipe.utilizedIngredients.map((ing) => (
                          <span key={ing} className="pill-stock-used">
                            {ing}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Conditional Callout for Quick Run Tab / Substitutions */}
                    {recipe.substitutes && recipe.substitutes.length > 0 && (
                      <div className="substitution-callout-box warning-light">
                        <Info size={18} color="#E67E22" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <p className="substitution-text">
                          Missing: <strong>{recipe.substitutes[0].missing}</strong>.{' '}
                          <span className="sub-suggestion">
                            Substitute with {recipe.substitutes[0].use}.
                          </span>
                        </p>
                      </div>
                    )}
                  </div>

                  <footer className="card-footer-action">
                    <button
                      className="btn-start-cooking"
                      data-recipe-id={recipe.id}
                      onClick={() => handleStartCooking(recipe)}
                    >
                      Start Cooking
                    </button>
                  </footer>
                </article>
              );
            })
          ) : (
            /* Section 5.2: Empty State */
            <div className="empty-state-card" style={{ gridColumn: '1 / -1' }}>
              <div className="empty-state-icon">
                <Soup size={52} color="#E67E22" />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 800 }}>No Matching Recipes</h3>
              <p style={{ color: 'var(--color-text-muted)', maxWidth: '360px', fontSize: '14px' }}>
                {activeTab === 'zero-waste'
                  ? 'No 100% zero-waste recipes found for these exact ingredients.'
                  : 'No recipes matched your active search and filter constraints.'}
              </p>
              {activeTab === 'zero-waste' ? (
                <button
                  className="btn-primary"
                  onClick={() => {
                    sounds.playTap();
                    setActiveTab('quick-run');
                  }}
                >
                  Switch to Quick Run Tab
                </button>
              ) : (
                <button
                  className="btn-secondary"
                  onClick={() => {
                    sounds.playTap();
                    setSelectedChip('All');
                    setSearchQuery('');
                    handleResetFilters();
                  }}
                >
                  Clear All Filters
                </button>
              )}
            </div>
          )}
        </main>

        {/* Filter Drawer Modal */}
        <FilterDrawerModal
          isOpen={isFilterModalOpen}
          onClose={() => setIsFilterModalOpen(false)}
          filters={filterState}
          onUpdateFilters={handleUpdateFilters}
          onResetFilters={handleResetFilters}
        />
      </div>
    </div>
  );
};
