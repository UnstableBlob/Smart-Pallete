import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import type { FilterState, Recipe } from '../types';
import { sounds } from '../services/audio';
import { FilterDrawerModal } from '../components/FilterDrawer/FilterDrawerModal';
import {
  SlidersHorizontal,
  Clock,
  ChefHat,
  Heart,
  Soup,
  Search,
  Info,
} from 'lucide-react';

const FILTER_CHIPS = ['All', 'Keto', 'Vegan', 'Gluten-Free', 'Under 20 mins'];

function formatIngredients(ingredients: string[], maxShow = 4): string {
  if (ingredients.length <= maxShow) return ingredients.join(', ');
  const shown = ingredients.slice(0, maxShow);
  const remaining = ingredients.length - maxShow;
  return `${shown.join(', ')} +${remaining}`;
}

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
    setSelectedChip('All');
    setSearchQuery('');
  };

  const filteredRecipes = useMemo(() => {
    return recipes.filter((recipe) => {
      if (recipe.matchType !== activeTab) return false;

      if (selectedChip === 'Under 20 mins' && recipe.cookTimeMinutes > 20) return false;
      else if (selectedChip !== 'All' && selectedChip !== 'Under 20 mins') {
        if (!recipe.dietaryTags.some((t) => t.toLowerCase() === selectedChip.toLowerCase())) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = recipe.title.toLowerCase().includes(q);
        const matchesIngredient = recipe.utilizedIngredients.some((ing) =>
          ing.toLowerCase().includes(q)
        );
        if (!matchesTitle && !matchesIngredient) return false;
      }

      if (filterState.maxCookTime && recipe.cookTimeMinutes > filterState.maxCookTime) return false;
      if (filterState.difficulty && recipe.difficulty !== filterState.difficulty) return false;
      if (filterState.spiceLevel && recipe.spiceLevel !== filterState.spiceLevel) return false;

      return true;
    });
  }, [recipes, activeTab, selectedChip, searchQuery, filterState]);

  const zeroWasteCount = recipes.filter((r) => r.matchType === 'zero-waste').length;
  const quickRunCount = recipes.filter((r) => r.matchType === 'quick-run').length;

  const handleCardClick = (recipe: Recipe) => {
    sounds.playTap();
    setActiveRecipe(recipe);
    navigate(`/cook/${recipe.id}`);
  };

  const handleFavorite = (e: React.MouseEvent, recipeId: string) => {
    e.stopPropagation();
    sounds.playTap();
    toggleBookmark(recipeId);
  };

  return (
    <div className="content-container">
      <div style={{ paddingBottom: 'var(--space-7)' }}>
        {/* Page header */}
        <div className="page-header">
          <h1 className="page-title">Recipes</h1>
        </div>

        {/* Search + filter button row */}
        <div
          style={{
            display: 'flex',
            gap: 'var(--space-2)',
            marginBottom: 'var(--space-3)',
          }}
        >
          <div className="search-wrapper" style={{ flex: 1 }}>
            <Search size={16} className="search-icon" />
            <input
              type="search"
              id="recipe-search-input"
              className="search-input"
              placeholder="Search recipes or ingredients"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search recipes"
            />
          </div>
          <button
            id="btn-open-filter-drawer"
            className="btn btn-secondary btn-icon"
            title="Open filters"
            aria-label="Open filter drawer"
            onClick={() => {
              sounds.playTap();
              setIsFilterModalOpen(true);
            }}
          >
            <SlidersHorizontal size={16} />
          </button>
        </div>

        {/* Filter chips */}
        <div
          className="filter-chips-row"
          role="group"
          aria-label="Dietary filters"
          style={{ marginBottom: 'var(--space-4)' }}
        >
          {FILTER_CHIPS.map((chip) => (
            <button
              key={chip}
              className={`chip-filter ${selectedChip === chip ? 'active' : ''}`}
              onClick={() => {
                sounds.playTap();
                setSelectedChip(chip);
              }}
              aria-pressed={selectedChip === chip}
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Segmented control */}
        <div
          className="segmented-control"
          role="tablist"
          aria-label="Recipe match type"
          style={{ marginBottom: 'var(--space-5)' }}
        >
          <button
            id="tab-zero-waste"
            className={`seg-btn ${activeTab === 'zero-waste' ? 'active' : ''}`}
            onClick={() => {
              sounds.playTap();
              setActiveTab('zero-waste');
            }}
            role="tab"
            aria-selected={activeTab === 'zero-waste'}
          >
            Zero-waste
            <span className="seg-count">{zeroWasteCount}</span>
          </button>

          <button
            id="tab-quick-run"
            className={`seg-btn ${activeTab === 'quick-run' ? 'active' : ''}`}
            onClick={() => {
              sounds.playTap();
              setActiveTab('quick-run');
            }}
            role="tab"
            aria-selected={activeTab === 'quick-run'}
          >
            Quick run
            <span className="seg-count">{quickRunCount}</span>
          </button>
        </div>

        {/* Recipe grid */}
        <main id="recipe-card-grid" aria-label="Recipe list">
          {filteredRecipes.length > 0 ? (
            filteredRecipes.map((recipe) => {
              const isBookmarked = bookmarkedRecipeIds.includes(recipe.id);
              const isFullMatch = recipe.matchScore === 100;

              return (
                <article
                  key={recipe.id}
                  className="recipe-card"
                  onClick={() => handleCardClick(recipe)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleCardClick(recipe);
                    }
                  }}
                  aria-label={`${recipe.title} — ${recipe.cookTimeMinutes} minutes, ${recipe.difficulty}`}
                >
                  {/* Card image */}
                  <div className="card-image-wrapper">
                    {recipe.imageUrl ? (
                      <img
                        className="recipe-cover-img"
                        src={recipe.imageUrl}
                        alt={recipe.title}
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="card-img-fallback" aria-hidden="true">
                        <Soup size={36} />
                        <span>{recipe.dietaryTags[0] || 'Recipe'}</span>
                      </div>
                    )}

                    {/* Favorite button */}
                    <button
                      className={`btn-card-favorite ${isBookmarked ? 'favorited' : ''}`}
                      onClick={(e) => handleFavorite(e, recipe.id)}
                      aria-label={isBookmarked ? 'Remove from favorites' : 'Add to favorites'}
                      aria-pressed={isBookmarked}
                    >
                      <Heart
                        size={16}
                        fill={isBookmarked ? 'currentColor' : 'none'}
                        strokeWidth={2}
                      />
                    </button>
                  </div>

                  {/* Card body */}
                  <div className="card-body">
                    <h2 className="card-title">{recipe.title}</h2>

                    {/* Meta row: time · difficulty */}
                    <div className="card-meta-row">
                      <Clock size={13} aria-hidden="true" />
                      <span>{recipe.cookTimeMinutes} min</span>
                      <span className="card-meta-dot" aria-hidden="true" />
                      <ChefHat size={13} aria-hidden="true" />
                      <span>{recipe.difficulty}</span>
                    </div>

                    {/* Match line */}
                    <div className="card-match-line">
                      {isFullMatch ? (
                        <span className="badge-pantry">In your pantry</span>
                      ) : (
                        <span>Uses {recipe.utilizedIngredients.length} of your ingredients</span>
                      )}
                    </div>

                    {/* Ingredient list */}
                    <p className="card-ingredient-list" aria-label="Key ingredients">
                      {formatIngredients(recipe.utilizedIngredients)}
                    </p>

                    {/* Substitution callout */}
                    {recipe.substitutes && recipe.substitutes.length > 0 && (
                      <div className="card-sub-callout" role="note">
                        <Info size={14} style={{ flexShrink: 0, marginTop: 1 }} aria-hidden="true" />
                        <span>
                          Missing <strong>{recipe.substitutes[0].missing}</strong> — substitute with {recipe.substitutes[0].use}
                        </span>
                      </div>
                    )}
                  </div>
                </article>
              );
            })
          ) : (
            <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
              <div className="empty-state-icon">
                <Soup size={40} aria-hidden="true" />
              </div>
              <p className="empty-state-title">No recipes found</p>
              <p className="empty-state-desc">
                {activeTab === 'zero-waste'
                  ? 'No 100% pantry-match recipes for these filters.'
                  : 'No recipes matched your search and filter settings.'}
              </p>
              {activeTab === 'zero-waste' ? (
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    sounds.playTap();
                    setActiveTab('quick-run');
                  }}
                >
                  Try quick run
                </button>
              ) : (
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    sounds.playTap();
                    handleResetFilters();
                  }}
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}
        </main>

        {/* Filter drawer */}
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
