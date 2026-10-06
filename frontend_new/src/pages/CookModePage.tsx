import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { sounds } from '../services/audio';
import { api } from '../services/api';
import confetti from 'canvas-confetti';
import { Check, ArrowLeft, ArrowRight, Play, Pause, RotateCcw, PartyPopper } from 'lucide-react';

export const CookModePage: React.FC = () => {
  const { recipeId } = useParams<{ recipeId: string }>();
  const navigate = useNavigate();
  const {
    recipes,
    activeRecipe,
    setActiveRecipe,
    currentStepIndex,
    nextStep,
    prevStep,
    completeMeal,
  } = useAppStore();

  // Find target recipe if not already active
  const recipe = activeRecipe || recipes.find((r) => r.id === recipeId) || recipes[0];

  useEffect(() => {
    if (recipe && (!activeRecipe || activeRecipe.id !== recipe.id)) {
      setActiveRecipe(recipe);
    }
  }, [recipe, activeRecipe, setActiveRecipe]);

  const currentStep = recipe?.steps?.[currentStepIndex] || recipe?.steps?.[0];
  const totalSteps = recipe?.steps?.length || 1;
  const isFinalStep = currentStepIndex === totalSteps - 1;
  const progressPercent = Math.round(((currentStepIndex + 1) / totalSteps) * 100);

  // Embedded Step Timer State
  const initialSeconds = currentStep?.timerSeconds || 180;
  const [secondsRemaining, setSecondsRemaining] = useState(initialSeconds);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [checkedIngredients, setCheckedIngredients] = useState<Record<string, boolean>>({});
  const [isCompletedModalOpen, setIsCompletedModalOpen] = useState(false);

  // Reset timer whenever step changes
  useEffect(() => {
    setIsTimerRunning(false);
    setSecondsRemaining(currentStep?.timerSeconds || 180);
    setCheckedIngredients({});
  }, [currentStepIndex, currentStep]);

  // Timer Tick Hook
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isTimerRunning && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(interval!);
            setIsTimerRunning(false);
            sounds.playTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, secondsRemaining]);

  const formatTimerDigits = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleToggleCheck = (key: string) => {
    sounds.playTap();
    setCheckedIngredients((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCompleteMealAction = async () => {
    sounds.playMealComplete();

    // Trigger fireworks confetti celebration
    try {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#3A7D44', '#4ADE80', '#E67E22', '#FCD34D', '#E05A47'],
      });
    } catch {
      // Confetti fallback
    }

    // Call API: POST /api/v1/pantry/deduct-consumed
    try {
      const consumedList = recipe.ingredients.map((ing) => ({
        name: ing.name,
        quantity: typeof ing.quantity === 'number' ? ing.quantity : 1,
      }));
      await api.completeMealDeduct(recipe.id, consumedList);
      completeMeal(recipe.id, consumedList);
    } catch {
      completeMeal(recipe.id);
    }

    setIsCompletedModalOpen(true);
  };

  if (!recipe) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <h2>Recipe not found</h2>
        <button className="btn-primary" onClick={() => navigate('/recipes')} style={{ marginTop: '16px' }}>
          Back to Recipes
        </button>
      </div>
    );
  }

  return (
    <div className="content-container">
      <div id="cook-mode-page-container">
        {/* 3.4 Header */}
        <header id="cook-mode-header">
          <button
            id="btn-exit-cook-mode"
            onClick={() => {
              sounds.playTap();
              navigate('/recipes');
            }}
            title="Exit cooking mode"
            aria-label="Exit cooking mode"
          >
            ✕ Exit
          </button>

          <div id="recipe-progress-indicator">
            <span id="step-counter-text">
              Step {currentStepIndex + 1} of {totalSteps}
            </span>
            <div id="progress-bar-track">
              <div
                id="progress-bar-fill"
                style={{ width: `${progressPercent}%` }}
                role="progressbar"
                aria-valuenow={progressPercent}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
          </div>
        </header>

        {/* 3.4 Main Viewport */}
        <main id="cook-step-card-viewport">
          <div id="step-card-container" className="card-focus">
            <div id="step-number-badge">
              Step {String(currentStepIndex + 1).padStart(2, '0')}
            </div>

            <h2 id="step-instruction-heading">
              {currentStep?.instruction}
            </h2>

            {/* Embedded Step Timer (Rendered if step requires timing) */}
            {currentStep?.timerSeconds && (
              <div id="interactive-timer-widget">
                <div id="timer-display-digits" aria-live="off">
                  {formatTimerDigits(secondsRemaining)}
                </div>

                <div id="timer-controls-group">
                  {!isTimerRunning ? (
                    <button
                      id="btn-timer-start"
                      onClick={() => {
                        sounds.playTap();
                        setIsTimerRunning(true);
                      }}
                      aria-label="Start cooking timer"
                    >
                      <Play size={15} style={{ display: 'inline', marginRight: 4 }} />
                      Start Timer
                    </button>
                  ) : (
                    <button
                      id="btn-timer-pause"
                      onClick={() => {
                        sounds.playTap();
                        setIsTimerRunning(false);
                      }}
                      aria-label="Pause cooking timer"
                    >
                      <Pause size={15} style={{ display: 'inline', marginRight: 4 }} />
                      Pause
                    </button>
                  )}

                  <button
                    id="btn-timer-reset"
                    onClick={() => {
                      sounds.playTap();
                      setIsTimerRunning(false);
                      setSecondsRemaining(currentStep.timerSeconds || 180);
                    }}
                    aria-label="Reset cooking timer"
                  >
                    <RotateCcw size={15} style={{ display: 'inline', marginRight: 4 }} />
                    Reset
                  </button>
                </div>
              </div>
            )}

            {/* Step Specific Ingredients List */}
            {currentStep?.neededIngredients && currentStep.neededIngredients.length > 0 && (
              <div id="step-ingredients-checklist">
                <h3>Needed for this step:</h3>
                <ul id="checklist-group">
                  {currentStep.neededIngredients.map((item, idx) => {
                    const chkId = `chk-ing-${idx}`;
                    const isChecked = !!checkedIngredients[chkId];

                    return (
                      <li key={idx} className="checklist-item">
                        <input
                          type="checkbox"
                          id={chkId}
                          checked={isChecked}
                          onChange={() => handleToggleCheck(chkId)}
                        />
                        <label
                          htmlFor={chkId}
                          style={{
                            textDecoration: isChecked ? 'line-through' : 'none',
                            color: isChecked ? 'var(--color-text-muted)' : 'var(--color-text)',
                          }}
                        >
                          {item.name} ({item.amount})
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        </main>

        {/* 3.4 Navigation Bar */}
        <footer id="cook-mode-navigation-bar">
          <button
            id="btn-prev-step"
            className="btn-secondary"
            onClick={() => {
              sounds.playTap();
              prevStep();
            }}
            disabled={currentStepIndex === 0}
            style={{ opacity: currentStepIndex === 0 ? 0.4 : 1 }}
          >
            <ArrowLeft size={16} />
            <span>Previous</span>
          </button>

          {!isFinalStep ? (
            <button
              id="btn-next-step"
              className="btn-primary"
              onClick={() => {
                sounds.playTap();
                nextStep();
              }}
            >
              <span>Next Step</span>
              <ArrowRight size={16} />
            </button>
          ) : (
            <button
              id="btn-complete-meal"
              className="btn-success-block"
              onClick={handleCompleteMealAction}
            >
              <Check size={18} />
              <span>Finish & Complete Meal</span>
            </button>
          )}
        </footer>

        {/* Meal Completion Modal Dialog */}
        {isCompletedModalOpen && (
          <div
            className="modal-overlay"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.75)',
              backdropFilter: 'blur(8px)',
              zIndex: 70,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
            }}
          >
            <div
              style={{
                backgroundColor: 'var(--color-surface)',
                borderRadius: 'var(--radius-xl)',
                maxWidth: '480px',
                width: '100%',
                padding: '32px 24px',
                textAlign: 'center',
                boxShadow: 'var(--shadow-lg)',
                border: '1px solid var(--color-border)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '16px',
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '9999px',
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  color: '#10B981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <PartyPopper size={36} />
              </div>

              <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-text)' }}>
                Bon Appétit!
              </h2>

              <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', lineHeight: 1.5 }}>
                You completed <strong>{recipe.title}</strong>! Consumed ingredients have been automatically subtracted from your digital pantry.
              </p>

              <div
                style={{
                  width: '100%',
                  backgroundColor: 'var(--color-surface-alt)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px',
                  display: 'flex',
                  justifyContent: 'space-around',
                  fontSize: '13px',
                  fontWeight: 600,
                  marginTop: '8px',
                }}
              >
                <div>
                  <span style={{ display: 'block', color: 'var(--color-text-muted)', fontSize: '11px' }}>
                    Prep Time
                  </span>
                  <span>{recipe.cookTimeMinutes} mins</span>
                </div>
                <div>
                  <span style={{ display: 'block', color: 'var(--color-text-muted)', fontSize: '11px' }}>
                    Servings
                  </span>
                  <span>{recipe.servings} people</span>
                </div>
                <div>
                  <span style={{ display: 'block', color: 'var(--color-text-muted)', fontSize: '11px' }}>
                    Match Score
                  </span>
                  <span style={{ color: '#10B981' }}>{recipe.matchScore}%</span>
                </div>
              </div>

              <button
                className="btn-primary-block"
                style={{ marginTop: '12px' }}
                onClick={() => {
                  sounds.playTap();
                  setIsCompletedModalOpen(false);
                  navigate('/pantry?mealCompleted=true');
                }}
              >
                View Updated Pantry
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
