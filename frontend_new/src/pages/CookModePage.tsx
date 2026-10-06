import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { sounds } from '../services/audio';
import { api } from '../services/api';
import confetti from 'canvas-confetti';
import {
  Check,
  ArrowLeft,
  ArrowRight,
  Play,
  Pause,
  RotateCcw,
  PartyPopper,
  X,
  ChefHat,
} from 'lucide-react';

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

  const initialSeconds = currentStep?.timerSeconds || 0;
  const [secondsRemaining, setSecondsRemaining] = useState(initialSeconds);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [checkedIngredients, setCheckedIngredients] = useState<Record<string, boolean>>({});
  const [isCompletedModalOpen, setIsCompletedModalOpen] = useState(false);

  useEffect(() => {
    setIsTimerRunning(false);
    setSecondsRemaining(currentStep?.timerSeconds || 0);
    setCheckedIngredients({});
  }, [currentStepIndex, currentStep]);

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
    return () => { if (interval) clearInterval(interval); };
  }, [isTimerRunning, secondsRemaining]);

  const formatTimer = (total: number) => {
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleCompleteMeal = async () => {
    sounds.playMealComplete();
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#2F6B4F', '#5FAE8A', '#E4F0E9', '#B26A00', '#FDF1DC'],
      });
    } catch { /* no-op */ }

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
      <div className="content-container">
        <div className="empty-state" style={{ paddingTop: 'var(--space-8)' }}>
          <div className="empty-state-icon"><ChefHat size={40} /></div>
          <p className="empty-state-title">Recipe not found</p>
          <button className="btn btn-primary" onClick={() => navigate('/recipes')}>
            Back to recipes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="content-container">
      <div style={{ paddingBottom: 'var(--space-7)' }}>
        {/* Cook mode header */}
        <div className="cook-header">
          <button
            id="btn-exit-cook-mode"
            className="btn btn-ghost btn-icon"
            onClick={() => {
              sounds.playTap();
              navigate('/recipes');
            }}
            title="Exit cooking mode"
            aria-label="Exit cooking mode"
          >
            <X size={18} />
          </button>

          <span className="cook-step-label">
            Step {currentStepIndex + 1} of {totalSteps}
          </span>

          <div className="cook-progress-bar" role="progressbar" aria-valuenow={progressPercent} aria-valuemin={0} aria-valuemax={100}>
            <div
              className="cook-progress-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <span className="cook-step-label">{progressPercent}%</span>
        </div>

        {/* Recipe title (compact) */}
        <p
          style={{
            fontSize: 'var(--text-body-sm-size)',
            color: 'var(--color-text-secondary)',
            padding: 'var(--space-3) 0 0',
            fontStyle: 'italic',
          }}
        >
          {recipe.title}
        </p>

        {/* Step card */}
        <main id="cook-step-card-viewport">
          <div className="step-card">
            <div className="step-number-badge" aria-hidden="true">
              Step {String(currentStepIndex + 1).padStart(2, '0')}
            </div>

            <p className="step-instruction" id="step-instruction">
              {currentStep?.instruction}
            </p>

            {/* Timer */}
            {currentStep?.timerSeconds && currentStep.timerSeconds > 0 && (
              <div className="timer-widget" aria-label="Cooking timer">
                <div
                  className="timer-digits"
                  aria-live="off"
                  aria-label={`Time remaining: ${formatTimer(secondsRemaining)}`}
                >
                  {formatTimer(secondsRemaining)}
                </div>
                <div className="timer-controls">
                  {!isTimerRunning ? (
                    <button
                      id="btn-timer-start"
                      className="btn btn-primary btn-sm"
                      onClick={() => {
                        sounds.playTap();
                        setIsTimerRunning(true);
                      }}
                      aria-label="Start timer"
                    >
                      <Play size={13} />
                      <span>Start</span>
                    </button>
                  ) : (
                    <button
                      id="btn-timer-pause"
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        sounds.playTap();
                        setIsTimerRunning(false);
                      }}
                      aria-label="Pause timer"
                    >
                      <Pause size={13} />
                      <span>Pause</span>
                    </button>
                  )}
                  <button
                    id="btn-timer-reset"
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      sounds.playTap();
                      setIsTimerRunning(false);
                      setSecondsRemaining(currentStep.timerSeconds || 0);
                    }}
                    aria-label="Reset timer"
                  >
                    <RotateCcw size={13} />
                    <span>Reset</span>
                  </button>
                </div>
              </div>
            )}

            {/* Ingredient checklist for this step */}
            {currentStep?.neededIngredients && currentStep.neededIngredients.length > 0 && (
              <div className="step-checklist">
                <p
                  style={{
                    fontSize: 'var(--text-body-sm-size)',
                    fontWeight: 600,
                    color: 'var(--color-text-secondary)',
                    marginBottom: 'var(--space-3)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    fontSize: 'var(--text-caption-size)',
                  }}
                >
                  Needed for this step
                </p>
                <ul aria-label="Ingredients for this step">
                  {currentStep.neededIngredients.map((item, idx) => {
                    const chkId = `chk-ing-${idx}`;
                    const isChecked = !!checkedIngredients[chkId];
                    return (
                      <li key={idx} className="checklist-item">
                        <input
                          type="checkbox"
                          id={chkId}
                          checked={isChecked}
                          onChange={() => {
                            sounds.playTap();
                            setCheckedIngredients((prev) => ({ ...prev, [chkId]: !prev[chkId] }));
                          }}
                          style={{ width: 16, height: 16, accentColor: 'var(--color-accent-600)', flexShrink: 0 }}
                        />
                        <label
                          htmlFor={chkId}
                          style={{
                            textDecoration: isChecked ? 'line-through' : 'none',
                            color: isChecked ? 'var(--color-text-tertiary)' : 'var(--color-text-primary)',
                          }}
                        >
                          {item.name} — {item.amount}
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        </main>

        {/* Navigation footer */}
        <footer className="cook-nav-bar">
          <button
            id="btn-prev-step"
            className="btn btn-secondary"
            onClick={() => {
              sounds.playTap();
              prevStep();
            }}
            disabled={currentStepIndex === 0}
            aria-label="Previous step"
          >
            <ArrowLeft size={16} />
            <span>Previous</span>
          </button>

          {!isFinalStep ? (
            <button
              id="btn-next-step"
              className="btn btn-primary"
              style={{ flex: 1 }}
              onClick={() => {
                sounds.playTap();
                nextStep();
              }}
              aria-label="Next step"
            >
              <span>Next step</span>
              <ArrowRight size={16} />
            </button>
          ) : (
            <button
              id="btn-complete-meal"
              className="btn btn-primary"
              style={{ flex: 1, backgroundColor: 'var(--color-success)' }}
              onClick={handleCompleteMeal}
              aria-label="Complete meal"
            >
              <Check size={16} />
              <span>Complete meal</span>
            </button>
          )}
        </footer>

        {/* Completion modal */}
        {isCompletedModalOpen && (
          <div
            className="modal-overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby="completion-title"
          >
            <div className="modal-panel" style={{ textAlign: 'center' }}>
              <div className="modal-body" style={{ alignItems: 'center', gap: 'var(--space-4)' }}>
                <div
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: 'var(--color-success-bg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-success)',
                  }}
                  aria-hidden="true"
                >
                  <PartyPopper size={32} />
                </div>

                <h2
                  id="completion-title"
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'var(--text-h1-size)',
                    fontWeight: 600,
                    letterSpacing: '-0.01em',
                  }}
                >
                  Bon appétit!
                </h2>

                <p
                  style={{
                    fontSize: 'var(--text-body-sm-size)',
                    color: 'var(--color-text-secondary)',
                    maxWidth: 320,
                    lineHeight: 1.6,
                  }}
                >
                  You completed <strong>{recipe.title}</strong>. Used ingredients have been
                  subtracted from your pantry.
                </p>

                <div
                  style={{
                    display: 'flex',
                    gap: 'var(--space-5)',
                    justifyContent: 'center',
                    width: '100%',
                    backgroundColor: 'var(--color-bg-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: 'var(--space-4)',
                  }}
                >
                  {[
                    { label: 'Cook time', value: `${recipe.cookTimeMinutes} min` },
                    { label: 'Servings', value: `${recipe.servings}` },
                    { label: 'Match', value: `${recipe.matchScore}%` },
                  ].map((stat) => (
                    <div key={stat.label} style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: 'var(--text-caption-size)', color: 'var(--color-text-tertiary)' }}>
                        {stat.label}
                      </p>
                      <p style={{ fontSize: 'var(--text-h3-size)', fontWeight: 600, marginTop: 2 }}>
                        {stat.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="modal-footer" style={{ justifyContent: 'center' }}>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    sounds.playTap();
                    setIsCompletedModalOpen(false);
                    navigate('/pantry');
                  }}
                >
                  View updated pantry
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
