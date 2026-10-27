import {
  CheckCircle,
  Clock,
  Heart,
  Info,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Soup,
  Sparkles,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FilterDrawerModal } from '../components/FilterDrawer/FilterDrawerModal';
import { api } from '../services/api';
import { sounds } from '../services/audio';
import { useAppStore } from '../store/useAppStore';
import type { FilterState, Recipe } from '../types';

const FILTER_CHIPS = ['All', 'Zero-Waste (100%)', 'Keto', 'Vegan', 'Under 20 Mins'];

const FALLBACK_RECIPE_IMAGES = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuA9HknND4oJoH3sLHqXFbUEMTwU7RLjc6gdhBpwXUvDmI-MYx-Oq5TlfvHdCOnzoVnXeANfA0rjdi8bqpw_3ADNM62IhmgGCx0RauAoP15cOEYcva4ZWIqqJbw-uKJP0hAlO1WB7ukdPB5Qw8Er_hio0694BneeZ3al27paxrhRYLJGtAJ40aYOsKKLl5y-eRiwXnASqMciYYDHo5PinN4zogJ2ZooT0UPZAZ5yflwnKOSU8ZZvhGnh',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuD92-MTwN0GrKA8e-B5Ppg7kFm00Pf87MeIF2VnGga91fkeEPLzyQEZf1YLfBZrlpRbcIAEP6gfYD5_p6mK9ICMFqxAVE1u1XNl5HBH7I_ihfQkIay7mkA37tPZ8v9UD5Vlj-t5l4Jxk8M1vnYLBvtlsFX8KoHw7jVYkKHbZzxkj3NKn51xzkeODSXCggY9m5oX8OT-JVnu4DBeWLa-Mis4ffplqubyqzXnJJvfg15FJq_hjP29KOev',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCCyJlQXjqLJflhgUlYxEgH2NllH1qwV9WUgK4vnwLFLp_rOvg4jQo5ypBIQE-mzqmbOkBM3gsrLd3GfmmQfd0Z3oCvBLsJXEasIJEF19Nai3mPa6_q3A-yVFKnVU1M2NfYqWVXO-DUd0FZ5id_7qAqG4i-T7Ze-r3pOJS0jclcnnx-MbvYiqX6uro3i9BczVhn4oJNsY9sW-x2asn6ytT0mEGbmSHv4AlS9fDEA6D-81gG5lsWw7lu',
];

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
      setGenerationMessage('Add ingredients to your pantry or scan your fridge to discover matching recipes.');
      setSuggestedIngredients([]);
      return;
    }

    let cancelled = false;
    setIsGenerating(true);

    void api
      .fetchRecipes(pantryStock, userProfile, 'zero-waste')
      .then((result) => {
        if (!cancelled) {
          setRecipes(result.recipes);
          setGenerationMessage(result.message);
          setSuggestedIngredients(result.suggestedIngredients);
          setIsLastResort(result.lastResort);
        }
      })
      .catch(() => {
        if (!cancelled) addToast('Could not generate recipes from pantry.', 'error');
      })
      .finally(() => {
        if (!cancelled) setIsGenerating(false);
      });

    return () => {
      cancelled = true;
    };
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
      if (selectedChip === 'Zero-Waste (100%)' && recipe.matchScore !== 100) {
        return false;
      } else if (selectedChip === 'Under 20 Mins' && recipe.cookTimeMinutes > 20) {
        return false;
      } else if (selectedChip !== 'All' && selectedChip !== 'Under 20 Mins' && selectedChip !== 'Zero-Waste (100%)') {
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
    <div className="recipes-catalog-page">
      {/* =========================================================================
          STICKY TOP SEARCH & FILTER STACK
          ========================================================================= */}
      <section className="recipes-sticky-search-stack" aria-label="Search and Filters">
        <div className="search-stack-container">
          {/* Main Search Pill Bar */}
          <div className="search-pill-bar">
            <Search size={18} className="search-pill-icon" />
            <input
              type="search"
              className="search-pill-input"
              placeholder="Search pantry matches, dishes, greens..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search recipes"
            />
            <button
              type="button"
              className="search-action-icon-btn"
              title="Open advanced filters"
              aria-label="Open filter drawer"
              onClick={() => {
                sounds.playTap();
                setIsFilterModalOpen(true);
              }}
            >
              <SlidersHorizontal size={17} />
            </button>
            <button
              type="button"
              className="search-action-icon-btn"
              title="Regenerate recipe recommendations"
              aria-label="Regenerate recipes"
              onClick={regenerateRecipes}
              disabled={isGenerating || pantryStock.length === 0}
            >
              <RefreshCw size={17} className={isGenerating ? 'spin' : ''} />
            </button>
          </div>

          {/* Horizontal Scrolling Filter Chips */}
          <div className="filter-chips-scroll-tray" role="tablist" aria-label="Category filter chips">
            {FILTER_CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                className={`filter-scroll-chip ${selectedChip === chip ? 'active' : ''}`}
                onClick={() => {
                  sounds.playTap();
                  setSelectedChip(chip);
                }}
              >
                {chip === 'Zero-Waste (100%)' && (
                  <span className="material-symbols-outlined text-[15px] mr-1">eco</span>
                )}
                <span>{chip}</span>
              </button>
            ))}
          </div>

          {/* Segmented Tab Container: Zero-Waste vs Quick Run */}
          <div className="segmented-tab-dock" role="tablist">
            <button
              type="button"
              className={`segmented-dock-tab ${activeTab === 'zero-waste' ? 'active' : ''}`}
              onClick={() => {
                sounds.playTap();
                setActiveTab('zero-waste');
              }}
              role="tab"
              aria-selected={activeTab === 'zero-waste'}
            >
              <span className="material-symbols-outlined text-[16px]">eco</span>
              <span>Zero-Waste ({zeroWasteCount})</span>
            </button>

            <button
              type="button"
              className={`segmented-dock-tab ${activeTab === 'quick-run' ? 'active' : ''}`}
              onClick={() => {
                sounds.playTap();
                setActiveTab('quick-run');
              }}
              role="tab"
              aria-selected={activeTab === 'quick-run'}
            >
              <span className="material-symbols-outlined text-[16px] text-secondary">bolt</span>
              <span>Quick Run ({quickRunCount})</span>
            </button>
          </div>
        </div>
      </section>

      {/* =========================================================================
          RECIPE FEED LIST / HIGH DENSITY RESPONSIVE GRID
          ========================================================================= */}
      <main className="recipes-content-canvas">
        {/* Availability / Last Resort Notice */}
        {!isGenerating && generationMessage && (!filteredRecipes.length || isLastResort) && (
          <div className="recipe-alert-banner">
            <Info size={18} className="text-primary flex-shrink-0" />
            <div>
              <strong>{generationMessage}</strong>
              {suggestedIngredients.length > 0 && (
                <p className="mt-1 text-sm text-secondary">
                  Consider adding: {suggestedIngredients.join(', ')}.
                </p>
              )}
            </div>
          </div>
        )}

        {filteredRecipes.length > 0 ? (
          <div className="recipes-card-grid">
            {filteredRecipes.map((recipe, index) => {
              const isBookmarked = bookmarkedRecipeIds.includes(recipe.id);
              const fallbackImage = FALLBACK_RECIPE_IMAGES[index % FALLBACK_RECIPE_IMAGES.length];
              const displayImage = recipe.imageUrl || fallbackImage;

              return (
                <article
                  key={recipe.id}
                  className="organic-recipe-card"
                  tabIndex={0}
                  onClick={() => handleStartCooking(recipe)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleStartCooking(recipe);
                  }}
                >
                  {/* Media Container 16:9 */}
                  <div className="card-media-wrapper">
                    <img
                      src={displayImage}
                      alt={recipe.title}
                      className="recipe-hero-image"
                      loading="lazy"
                    />

                    {/* Floating Top-Left Match Badge */}
                    <div className="badge-match-score">
                      <CheckCircle size={13} className="text-primary-dark" />
                      <span>{recipe.matchScore}% Pantry Match</span>
                    </div>

                    {/* Floating Top-Right Heart Bookmark Button */}
                    <button
                      type="button"
                      className={`btn-heart-bookmark ${isBookmarked ? 'active' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        sounds.playTap();
                        toggleBookmark(recipe.id);
                      }}
                      title={isBookmarked ? 'Remove bookmark' : 'Bookmark recipe'}
                      aria-label="Bookmark recipe"
                    >
                      <Heart
                        size={17}
                        fill={isBookmarked ? '#e85d04' : 'none'}
                        color={isBookmarked ? '#e85d04' : 'currentColor'}
                      />
                    </button>
                  </div>

                  {/* Recipe Body Details */}
                  <div className="card-recipe-body">
                    <h2 className="recipe-card-title">{recipe.title}</h2>

                    {/* Substitution Banner (for Quick Run recipes or recipes with substitutes) */}
                    {recipe.substitutes && recipe.substitutes.length > 0 ? (
                      <div className="substitution-alert-box">
                        <span className="material-symbols-outlined sub-icon">swap_horiz</span>
                        <p className="sub-text">
                          Missing {recipe.substitutes[0].missing}? Use{' '}
                          <strong>{recipe.substitutes[0].use}</strong> in your pantry.
                        </p>
                      </div>
                    ) : recipe.matchType === 'quick-run' && (recipe.missingItems?.length ?? 0) > 0 ? (
                      <div className="substitution-alert-box">
                        <span className="material-symbols-outlined sub-icon">swap_horiz</span>
                        <p className="sub-text">
                          Needs {recipe.missingItems?.[0]} (or pantry substitute)
                        </p>
                      </div>
                    ) : null}

                    {/* Metadata Tags Row */}
                    <div className="recipe-meta-chips-row">
                      <span className="meta-chip">
                        <Clock size={13} />
                        <span>{recipe.cookTimeMinutes} min</span>
                      </span>

                      <span className="meta-chip">
                        <span className="material-symbols-outlined text-[14px] text-primary">
                          speed
                        </span>
                        <span>{recipe.difficulty}</span>
                      </span>

                      <span className="meta-chip">
                        <span>🌶</span>
                        <span>{recipe.spiceLevel}</span>
                      </span>

                      <span className="waste-metric-pill">
                        {recipe.matchScore === 100 ? '0g Waste' : 'Root-to-stem'}
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          /* Empty State */
          <div className="recipe-empty-state-card">
            <div className="empty-icon-circle">
              <Soup size={48} className="text-primary" />
            </div>
            <h3 className="empty-heading">No Matching Recipes</h3>
            <p className="empty-description">
              {generationMessage ||
                (activeTab === 'zero-waste'
                  ? 'No 100% zero-waste recipes found for these exact ingredients.'
                  : 'No recipes matched your active search and filter constraints.')}
              {suggestedIngredients.length > 0 &&
                ` Consider adding: ${suggestedIngredients.join(', ')}.`}
            </p>

            <div className="empty-actions-row">
              {activeTab === 'zero-waste' ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    sounds.playTap();
                    setActiveTab('quick-run');
                  }}
                >
                  <Sparkles size={16} />
                  <span>Switch to Quick Run (90%+ Match)</span>
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-secondary"
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
          </div>
        )}
      </main>

      {/* Advanced Filter Drawer Modal */}
      <FilterDrawerModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        filters={filterState}
        onUpdateFilters={handleUpdateFilters}
        onResetFilters={handleResetFilters}
      />
    </div>
  );
};
