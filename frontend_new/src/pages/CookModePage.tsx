import confetti from 'canvas-confetti';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Flame,
  Lightbulb,
  Mic,
  PartyPopper,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Timer,
  X,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../services/api';
import { sounds } from '../services/audio';
import { useAppStore } from '../store/useAppStore';

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
    addToast,
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
  const initialSeconds = currentStep?.timerSeconds || 285; // 04:45 by default
  const [secondsRemaining, setSecondsRemaining] = useState(initialSeconds);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [isCompletedModalOpen, setIsCompletedModalOpen] = useState(false);
  const [voiceActive, setVoiceActive] = useState(false);

  const [prevStepIndex, setPrevStepIndex] = useState(currentStepIndex);
  if (prevStepIndex !== currentStepIndex) {
    setPrevStepIndex(currentStepIndex);
    setIsTimerRunning(false);
    setSecondsRemaining(currentStep?.timerSeconds || 285);
    setCheckedItems({});
  }

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
    setCheckedItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCompleteMealAction = async () => {
    sounds.playMealComplete();

    try {
      const consumedList = recipe.ingredients.map((ing) => ({
        name: ing.name,
        quantity: typeof ing.quantity === 'number' ? ing.quantity : 1,
        unit: ing.unit,
      }));
      await api.completeMealDeduct(recipe.id, consumedList);
      completeMeal(recipe.id, consumedList);
    } catch {
      addToast('Syncing meal with local pantry.', 'info');
      completeMeal(recipe.id);
    }

    try {
      confetti({
        particleCount: 140,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#3A7D44', '#4ADE80', '#E85D04', '#FCD34D', '#E05A47'],
      });
    } catch {
      // Confetti fallback
    }

    setIsCompletedModalOpen(true);
  };

  if (!recipe) {
    return (
      <div className="cook-empty-wrapper">
        <h2>No Active Recipe Selected</h2>
        <p>Please select a recipe from the catalog to enter Cook HUD.</p>
        <button
          type="button"
          className="btn btn-primary mt-4"
          onClick={() => navigate('/recipes')}
        >
          Browse Recipes
        </button>
      </div>
    );
  }

  // Fallback ingredients for step prep if none provided
  const stepIngredients =
    currentStep?.neededIngredients && currentStep.neededIngredients.length > 0
      ? currentStep.neededIngredients
      : recipe.ingredients.slice(0, 4).map((ing) => ({
          name: ing.name,
          amount: `${ing.quantity || 1} ${ing.unit || 'pcs'}`,
        }));

  const checkedCount = Object.values(checkedItems).filter(Boolean).length;

  return (
    <div className="cook-mode-hud-canvas">
      {/* =========================================================================
          TOP PROGRESS HEADER (Distraction-free Kitchen Execution HUD)
          ========================================================================= */}
      <header className="cook-hud-topbar">
        <div className="cook-hud-topbar-inner">
          {/* Exit Button */}
          <button
            type="button"
            className="hud-exit-btn"
            onClick={() => {
              sounds.playTap();
              navigate('/recipes');
            }}
            title="Exit cooking mode"
            aria-label="Exit cooking mode"
          >
            <X size={20} />
          </button>

          {/* Recipe & Step Metadata (Arm's-length legibility) */}
          <div className="hud-title-metadata">
            <div className="hud-step-pill-line">
              <span className="hud-live-beacon" />
              <span className="hud-step-number">
                Step {currentStepIndex + 1} of {totalSteps}
              </span>
              <span className="hud-separator">•</span>
              <span className="hud-phase-label">
                {currentStep?.instruction?.slice(0, 32)}...
              </span>
            </div>
            <h1 className="hud-recipe-headline">{recipe.title}</h1>
          </div>

          {/* Hands-Free Kitchen HUD Actions */}
          <div className="hud-actions-right">
            <button
              type="button"
              className={`hud-aux-btn ${voiceActive ? 'active-voice' : ''}`}
              onClick={() => {
                sounds.playTap();
                setVoiceActive((prev) => !prev);
                addToast(
                  voiceActive ? 'Voice control paused' : 'Voice command listener active: say "Next"',
                  'info'
                );
              }}
              title="Kitchen Voice Control"
              aria-label="Kitchen voice control"
            >
              <Mic size={19} />
            </button>
            <button
              type="button"
              className="hud-aux-btn"
              onClick={() => {
                sounds.playTap();
                addToast('Chef note: maintain steady burner flame for even heat.', 'info');
              }}
              title="Chef Cooking Notes"
              aria-label="Chef notes"
            >
              <Lightbulb size={19} />
            </button>
          </div>
        </div>

        {/* 4px Sage Green Horizontal Progress Bar */}
        <div className="hud-progress-track">
          <div
            className="hud-progress-fill"
            style={{ width: `${progressPercent}%` }}
            role="progressbar"
            aria-valuenow={progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      </header>

      {/* =========================================================================
          MAIN COOKING HUD VIEWPORT
          ========================================================================= */}
      <main className="cook-hud-body">
        {/* HERO STEP FOCUS CARD */}
        <section className="hero-step-card">
          <div className="step-card-status-bar">
            <div className="active-step-pill">
              <span className="material-symbols-outlined text-[15px]">skillet</span>
              <span>ACTIVE COOK STEP</span>
            </div>
            <div className="step-heat-indicator">
              <Flame size={16} className="text-secondary" />
              <span>Medium-High Heat</span>
            </div>
          </div>

          {/* Large High-Legibility Instruction Text (24px, 1.5 line height) */}
          <div className="step-instruction-container">
            <p className="large-instruction-text">
              {currentStep?.instruction || 'Prepare and combine the designated ingredients carefully.'}
            </p>
          </div>

          {/* Chef's Visual Cue Note */}
          <div className="arms-length-check-note">
            <span className="material-symbols-outlined text-[19px] text-primary">visibility</span>
            <p className="check-note-text">
              <strong>Arm's Length Check:</strong> Watch for crisp golden caramelized edges before
              lowering flame or advancing to the next cooking phase.
            </p>
          </div>
        </section>

        {/* TWO-COLUMN BENTO: DYNAMIC SLATE TIMER CARD & STEP INGREDIENTS CHECKLIST */}
        <div className="bento-kitchen-row">
          {/* TIMER CARD: Standout Dark Slate Navy Container (#0F172A) */}
          <section className="dark-slate-timer-card">
            <div className="timer-radial-aura" />

            <div className="timer-card-header">
              <div className="timer-header-title">
                <Timer size={19} className="text-tertiary" />
                <span className="timer-eyebrow">CRISP & CHAR INTERVAL</span>
              </div>
              <span className="auto-sync-pill">Auto-Sync</span>
            </div>

            {/* Massive 48px JetBrains Mono Glowing Mint Numbers */}
            <div className="timer-numbers-hero">
              <div className="timer-glowing-digits" id="timer-display">
                {formatTimerDigits(secondsRemaining)}
              </div>
              <p className="timer-phase-subtitle">
                <span className="timer-ping-dot" />
                <span>Active Cooking Telemetry</span>
              </p>
            </div>

            {/* Tactile Start, Pause, and Reset Pill Buttons (44px+ touch targets) */}
            <div className="timer-pill-controls-grid">
              <button
                type="button"
                className="timer-control-pill reset-btn"
                onClick={() => {
                  sounds.playTap();
                  setIsTimerRunning(false);
                  setSecondsRemaining(currentStep?.timerSeconds || 285);
                }}
                aria-label="Reset timer"
              >
                <RotateCcw size={16} />
                <span>Reset</span>
              </button>

              <button
                type="button"
                className="timer-control-pill pause-btn"
                onClick={() => {
                  sounds.playTap();
                  setIsTimerRunning(false);
                }}
                aria-label="Pause timer"
              >
                <Pause size={16} />
                <span>Pause</span>
              </button>

              <button
                type="button"
                className={`timer-control-pill start-btn ${isTimerRunning ? 'running' : ''}`}
                onClick={() => {
                  sounds.playTap();
                  setIsTimerRunning(true);
                }}
                aria-label="Start timer"
              >
                <Play size={17} />
                <span>{isTimerRunning ? 'Running' : 'Start'}</span>
              </button>
            </div>
          </section>

          {/* STEP INGREDIENTS & TOOLS CHECKLIST */}
          <section className="step-prep-checklist-card">
            <div>
              <div className="checklist-header-row">
                <div className="checklist-title-group">
                  <span className="material-symbols-outlined text-[19px] text-primary">
                    checklist
                  </span>
                  <h2 className="checklist-title">Station Prep</h2>
                </div>
                <span className="checklist-counter-pill">
                  {checkedCount} / {stepIngredients.length} ready
                </span>
              </div>
              <p className="checklist-subtitle">Single-tap items as they go into the pan:</p>

              {/* Interactive Large Checkable Pills */}
              <div className="checklist-pills-stack">
                {stepIngredients.map((item, idx) => {
                  const isChecked = !!checkedItems[`item-${idx}`];

                  return (
                    <button
                      key={idx}
                      type="button"
                      className={`prep-check-pill ${isChecked ? 'checked' : ''}`}
                      onClick={() => handleToggleCheck(`item-${idx}`)}
                    >
                      <div className="check-pill-left">
                        <span className="check-pill-circle">
                          {isChecked && <Check size={14} className="check-icon" />}
                        </span>
                        <span className="check-pill-name">{item.name}</span>
                      </div>
                      <span className="check-pill-qty">{item.amount}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Zero Waste Micro-Tip */}
            <div className="zero-waste-micro-tip">
              <span className="material-symbols-outlined text-[16px] text-primary">eco</span>
              <span>Zero-Waste Tip: Sauté chopped broccoli stalks first for maximum tenderness.</span>
            </div>
          </section>
        </div>

        {/* CONTEXTUAL STEP FLOW OVERVIEW */}
        <section className="step-breadcrumbs-dock">
          <div className="breadcrumbs-track">
            {recipe.steps.map((step, idx) => (
              <React.Fragment key={idx}>
                <div
                  className={`breadcrumb-step ${
                    idx === currentStepIndex
                      ? 'current'
                      : idx < currentStepIndex
                      ? 'completed'
                      : 'upcoming'
                  }`}
                  onClick={() => {
                    sounds.playTap();
                    useAppStore.getState().setCurrentStepIndex(idx);
                  }}
                >
                  <span className="step-number-dot">{idx + 1}</span>
                  <span className="step-short-name">
                    {step.instruction?.slice(0, 22)}...
                  </span>
                </div>
                {idx < recipe.steps.length - 1 && (
                  <span className="breadcrumb-arrow">›</span>
                )}
              </React.Fragment>
            ))}
          </div>
        </section>
      </main>

      {/* =========================================================================
          STICKY BOTTOM ACTION BAR (Touch-first kitchen navigation dock)
          ========================================================================= */}
      <footer className="cook-sticky-dock">
        <div className="cook-dock-container">
          {/* Previous Step */}
          <button
            type="button"
            className="btn-dock-secondary"
            onClick={() => {
              sounds.playTap();
              prevStep();
            }}
            disabled={currentStepIndex === 0}
          >
            <ArrowLeft size={18} />
            <span className="dock-btn-text">Previous Step</span>
          </button>

          {/* Quick Voice Cue */}
          <div className="dock-voice-cue">
            <span className="cue-dot" />
            <span>Say "Next" or tap to advance</span>
          </div>

          {/* Next Step or Complete Meal */}
          {!isFinalStep ? (
            <button
              type="button"
              className="btn-dock-primary"
              onClick={() => {
                sounds.playTap();
                nextStep();
              }}
            >
              <span>Next Step ({currentStepIndex + 2}/{totalSteps})</span>
              <ArrowRight size={18} />
            </button>
          ) : (
            <button
              type="button"
              className="btn-dock-finish"
              onClick={handleCompleteMealAction}
            >
              <Check size={18} />
              <span>Finish & Complete Meal</span>
            </button>
          )}
        </div>
      </footer>

      {/* Meal Completion Modal Dialog */}
      {isCompletedModalOpen && (
        <div className="completion-modal-overlay">
          <div className="completion-modal-card">
            <div className="completion-party-icon">
              <PartyPopper size={36} />
            </div>

            <h2 className="completion-title">Bon Appétit!</h2>

            <p className="completion-sub">
              You completed <strong>{recipe.title}</strong>! Consumed ingredients have been
              automatically subtracted from your digital pantry.
            </p>

            <div className="completion-summary-row">
              <div className="summary-col">
                <span className="summary-label">Prep Time</span>
                <span className="summary-val">{recipe.cookTimeMinutes} mins</span>
              </div>
              <div className="summary-col">
                <span className="summary-label">Servings</span>
                <span className="summary-val">{recipe.servings} people</span>
              </div>
              <div className="summary-col">
                <span className="summary-label">Match Score</span>
                <span className="summary-val text-primary">{recipe.matchScore}%</span>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-primary-block mt-4"
              onClick={() => {
                sounds.playTap();
                setIsCompletedModalOpen(false);
                navigate('/pantry?mealCompleted=true');
              }}
            >
              <Sparkles size={18} />
              <span>View Updated Pantry</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
