import {
    Clock,
    Heart,
    Info,
    RefreshCw,
    SlidersHorizontal,
    Soup,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FilterDrawerModal } from '../components/FilterDrawer/FilterDrawerModal';
import { api } from '../services/api';
import { sounds } from '../services/audio';
import { useAppStore } from '../store/useAppStore';
import type { FilterState, Recipe } from '../types';

const FILTER_CHIPS = ['All', 'Keto', 'Vegan', 'Gluten-Free', 'Under 20 Mins'];

export const RecipesPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    recipes,
    setActiveRecipe,
    bookmarkedRecipeIds,
    toggleBookmark,
    pantryStock,
    userProfile,
    setRecipes,
    addToast,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'zero-waste' | 'quick-run'>('zero-waste');
  const [selectedChip, setSelectedChip] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [regenerationKey, setRegenerationKey] = useState(0);
  const [generationMessage, setGenerationMessage] = useState('');
  const [suggestedIngredients, setSuggestedIngredients] = useState<string[]>([]);
  const [isLastResort, setIsLastResort] = useState(false);

  useEffect(() => {
    if (pantryStock.length === 0) {
      setRecipes([]);
      setGenerationMessage('Add ingredients to your pantry to find recipes.');
      setSuggestedIngredients([]);
      return;
    }

    let cancelled = false;
    setIsGenerating(true);
    // Fetch both zero-waste and quick-run in parallel (api.fetchRecipes handles both internally)
    void api.fetchRecipes(pantryStock, userProfile, 'zero-waste')
      .then((result) => {
        if (!cancelled) {
          setRecipes(result.recipes);
          setGenerationMessage(result.message);
          setSuggestedIngredients(result.suggestedIngredients);
          setIsLastResort(result.lastResort);
        }
      })
      .catch(() => {
        if (!cancelled) addToast('Could not generate recipes from your pantry.', 'error');
      })
      .finally(() => {
        if (!cancelled) setIsGenerating(false);
      });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pantryStock, userProfile, regenerationKey, setRecipes, addToast]);


  const regenerateRecipes = () => {
    sounds.playTap();
    setRegenerationKey((current) => current + 1);
  };

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
            <button
              id="btn-regenerate-recipes"
              title="Regenerate recipes"
              aria-label="Regenerate recipes"
              onClick={regenerateRecipes}
              disabled={isGenerating || pantryStock.length === 0}
            >
              <RefreshCw size={20} className={isGenerating ? 'spin' : undefined} />
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
            <>
              {!isGenerating && generationMessage && (!filteredRecipes.length || isLastResort) && (
                <div className="recipe-availability-notice" style={{ gridColumn: '1 / -1' }}>
                  <strong>{generationMessage}</strong>
                  {suggestedIngredients.length > 0 && (
                    <span> Consider adding: {suggestedIngredients.join(', ')}.</span>
                  )}
                </div>
              )}
              {filteredRecipes.map((recipe) => {
              const isBookmarked = bookmarkedRecipeIds.includes(recipe.id);

              return (
                <article
                  key={recipe.id}
                  className="recipe-card"
                  tabIndex={0}
                  onClick={() => handleStartCooking(recipe)}
                  onKeyDown={(event) => { if (event.key === 'Enter') handleStartCooking(recipe); }}
                >
                  <div className="card-image-wrapper">
                    {recipe.imageUrl ? (
                      <img
                        className="recipe-cover-img"
                        src={recipe.imageUrl}
                        alt={recipe.title}
                        loading="lazy"
                      />
                    ) : (
                      <div className="recipe-cover-img recipe-cover-placeholder" aria-hidden="true">
                        <Soup size={38} />
                      </div>
                    )}

                    {/* Bookmark Button */}
                    <button
                      className={`btn-bookmark-recipe ${isBookmarked ? 'active' : ''}`}
                      onClick={(event) => {
                        event.stopPropagation();
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

                  <div className="card-body">
                    <h2 className="card-title">{recipe.title}</h2>

                    <div className="card-meta-row">
                      <span><Clock size={14} /> {recipe.cookTimeMinutes} min</span>
                      <span className="card-meta-dot" />
                      <span>{recipe.difficulty}</span>
                    </div>

                    <p className="card-match-line">
                      {recipe.matchScore === 100 ? <span className="badge-pantry">In your pantry</span> : `Uses ${recipe.utilizedIngredients.length} of your ingredients`}
                    </p>
                    <p className="card-ingredient-list">{recipe.utilizedIngredients.join(', ')}</p>

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
                </article>
              );
              })}
            </>
          ) : (
            /* Section 5.2: Empty State */
            <div className="empty-state-card" style={{ gridColumn: '1 / -1' }}>
              <div className="empty-state-icon">
                <Soup size={52} color="#E67E22" />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 800 }}>No Matching Recipes</h3>
              <p style={{ color: 'var(--color-text-muted)', maxWidth: '420px', fontSize: '14px' }}>
                {generationMessage || (activeTab === 'zero-waste'
                  ? 'No 100% zero-waste recipes found for these exact ingredients.'
                  : 'No recipes matched your active search and filter constraints.')}
                {suggestedIngredients.length > 0 && ` Consider adding: ${suggestedIngredients.join(', ')}.`}
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
