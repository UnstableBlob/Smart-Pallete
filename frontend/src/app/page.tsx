"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  Upload, 
  Info, 
  Sparkles, 
  Plus, 
  Minus, 
  Trash2, 
  Edit2, 
  Search, 
  Filter, 
  Check, 
  Play, 
  Pause, 
  RotateCcw, 
  User, 
  ChefHat, 
  ShoppingBag, 
  Clock, 
  Flame, 
  ArrowLeft, 
  AlertTriangle, 
  CheckCircle2, 
  ChevronRight, 
  Monitor, 
  Smartphone, 
  X,
  RefreshCw,
  Award
} from 'lucide-react';
import { Ingredient, Recipe, HistoryItem, RestockItem, TasteProfile } from '../types';
import { 
  initialIngredients, 
  mockDetectedIngredients, 
  initialRecipes, 
  initialHistory, 
  initialRestockList, 
  initialTasteProfile, 
  ingredientCategories,
  categoryEmojis
} from '../data/mockData';

// Map of recipes to their detailed ingredient requirements (for servings scaling and deduction)
const recipeRequirements: Record<string, Array<{ name: string; qty: number; unit: string; category: string }>> = {
  rec_omelette: [
    { name: 'Eggs', qty: 3, unit: 'pcs', category: 'Dairy' },
    { name: 'Fresh Spinach', qty: 1, unit: 'bag', category: 'Produce' },
    { name: 'Cheddar Cheese', qty: 100, unit: 'g', category: 'Dairy' },
    { name: 'Butter', qty: 0.25, unit: 'block', category: 'Dairy' }
  ],
  rec_pasta: [
    { name: 'Fresh Spinach', qty: 0.5, unit: 'bag', category: 'Produce' },
    { name: 'Whole Milk', qty: 250, unit: 'ml', category: 'Dairy' },
    { name: 'Penne Pasta', qty: 200, unit: 'g', category: 'Pantry' },
    { name: 'Garlic', qty: 2, unit: 'cloves', category: 'Produce' },
    { name: 'Butter', qty: 0.25, unit: 'block', category: 'Dairy' }
  ],
  rec_yogurt_dip: [
    { name: 'Plain Yogurt', qty: 1, unit: 'cup', category: 'Dairy' },
    { name: 'Fresh Spinach', qty: 0.25, unit: 'bag', category: 'Produce' },
    { name: 'Garlic', qty: 1, unit: 'cloves', category: 'Produce' }
  ],
  rec_chicken_garlic: [
    { name: 'Chicken Breast', qty: 2, unit: 'pcs', category: 'Meat' },
    { name: 'Garlic', qty: 2, unit: 'cloves', category: 'Produce' },
    { name: 'Butter', qty: 0.5, unit: 'block', category: 'Dairy' }
  ]
};

// Autocomplete suggestions for manually adding ingredients
const autocompleteSuggestions = [
  { name: 'Fresh Spinach', category: 'Produce', unit: 'bag' },
  { name: 'Whole Milk', category: 'Dairy', unit: 'ml' },
  { name: 'Eggs', category: 'Dairy', unit: 'pcs' },
  { name: 'Cheddar Cheese', category: 'Dairy', unit: 'g' },
  { name: 'Penne Pasta', category: 'Pantry', unit: 'g' },
  { name: 'Garlic', category: 'Produce', unit: 'cloves' },
  { name: 'Butter', category: 'Dairy', unit: 'block' },
  { name: 'Chicken Breast', category: 'Meat', unit: 'pcs' },
  { name: 'Plain Yogurt', category: 'Dairy', unit: 'cup' },
  { name: 'Olive Oil', category: 'Condiments', unit: 'bottle' },
  { name: 'Salt & Pepper', category: 'Condiments', unit: 'pinch' },
  { name: 'Onion', category: 'Produce', unit: 'pcs' },
  { name: 'Tomato', category: 'Produce', unit: 'pcs' }
];

export default function SmartPaletteApp() {
  // Navigation & View Toggles
  const [viewMode, setViewMode] = useState<'desktop' | 'simulator'>('desktop');
  const [activeTab, setActiveTab] = useState<'recipes' | 'pantry' | 'profile'>('recipes');
  
  // Mobile Camera Scan States
  const [scannedImage, setScannedImage] = useState<string | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Automatically switch to simulator view on mobile devices on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      setViewMode('simulator');
    }
  }, []);
  
  // App States
  const [pantry, setPantry] = useState<Ingredient[]>(initialIngredients);
  const [recipes, setRecipes] = useState<Recipe[]>(initialRecipes);
  const [history, setHistory] = useState<HistoryItem[]>(initialHistory);
  const [restockList, setRestockList] = useState<RestockItem[]>(initialRestockList);
  const [tasteProfile, setTasteProfile] = useState<TasteProfile>(initialTasteProfile);
  const [xp, setXp] = useState<number>(145);
  
  // Cooking step state
  const [cookingRecipe, setCookingRecipe] = useState<Recipe | null>(null);
  const [cookingStep, setCookingStep] = useState<number>(0);
  const [servings, setServings] = useState<Record<string, number>>({
    rec_omelette: 2,
    rec_pasta: 2,
    rec_yogurt_dip: 2,
    rec_chicken_garlic: 2
  });
  const [stepCheckedItems, setStepCheckedItems] = useState<Record<number, Record<string, boolean>>>({});
  
  // Timer States
  const [timerSeconds, setTimerSeconds] = useState<number>(120); // 2 minutes default
  const [timerRunning, setTimerRunning] = useState<boolean>(false);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Filter States
  const [pantryCategory, setPantryCategory] = useState<string>('All');
  const [recipeSearch, setRecipeSearch] = useState<string>('');
  const [dietaryFilters, setDietaryFilters] = useState<Record<string, boolean>>({
    vegan: false,
    glutenFree: false,
    nutFree: false
  });
  const [maxSpice, setMaxSpice] = useState<'Low' | 'Medium' | 'High'>('High');
  
  // Scanning Overlay states
  const [showCamera, setShowCamera] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [cameraFlash, setCameraFlash] = useState<boolean>(false);
  const [showTips, setShowTips] = useState<boolean>(false);
  const [showVerify, setShowVerify] = useState<boolean>(false);
  const [detectedItems, setDetectedItems] = useState<Ingredient[]>([]);
  const [isGalleryUploading, setIsGalleryUploading] = useState<boolean>(false);
  
  // Interactive UI Modal States
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [successModalData, setSuccessModalData] = useState<{
    recipeTitle: string;
    xpGained: number;
    deducted: Array<{ name: string; qty: number; unit: string }>;
  } | null>(null);
  
  // Manual Entry States
  const [quickAddText, setQuickAddText] = useState<string>('');
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [editingIngredientId, setEditingIngredientId] = useState<string | null>(null);
  const [editingQty, setEditingQty] = useState<number>(0);

  // Recalculate recipe match percentages dynamically when pantry updates!
  useEffect(() => {
    const updatedRecipes = recipes.map(recipe => {
      const reqs = recipeRequirements[recipe.id] || [];
      if (reqs.length === 0) return recipe;
      
      let matchedCount = 0;
      const missingIngredients: string[] = [];
      
      reqs.forEach(req => {
        const pantryItem = pantry.find(p => p.name.toLowerCase() === req.name.toLowerCase());
        if (pantryItem && pantryItem.quantity > 0) {
          matchedCount++;
        } else {
          missingIngredients.push(req.name);
        }
      });
      
      const matchPercentage = Math.round((matchedCount / reqs.length) * 100);
      const matchType = (matchPercentage >= 100 ? 'Zero-Waste' : 'Quick Run') as 'Zero-Waste' | 'Quick Run';
      
      return {
        ...recipe,
        matchPercentage,
        matchType,
        missingIngredients
      };
    });
    setRecipes(updatedRecipes);
  }, [pantry]);

  // Timer Countdown Logic
  useEffect(() => {
    if (timerRunning) {
      timerIntervalRef.current = setInterval(() => {
        setTimerSeconds(prev => {
          if (prev <= 1) {
            setTimerRunning(false);
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
            // play double pulse visual or sound effect placeholder
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [timerRunning]);

  // Handle shutter capture
  const handleShutterClick = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setShowCamera(false);
      setDetectedItems([...mockDetectedIngredients]);
      setShowVerify(true);
    }, 2500); // 2.5s scanning effect
  };

  // Handle Gallery Upload simulation
  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setIsGalleryUploading(true);
      setTimeout(() => {
        setIsGalleryUploading(false);
        setShowCamera(false);
        setDetectedItems([...mockDetectedIngredients]);
        setShowVerify(true);
      }, 1800);
    }
  };

  // Handle file capture from mobile camera app
  const handleMobileCameraScan = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const imageUrl = URL.createObjectURL(file);
      setScannedImage(imageUrl);
      setShowCamera(true);
      setIsScanning(true);
      
      setTimeout(() => {
        setIsScanning(false);
        setShowCamera(false);
        setDetectedItems([...mockDetectedIngredients]);
        setShowVerify(true);
      }, 2500); // 2.5s scanning effect
    }
  };

  const triggerCameraScan = () => {
    if (cameraInputRef.current) {
      cameraInputRef.current.click();
    }
  };

  // Save verified ingredients from vision model sheet to pantry
  const handleConfirmVerifiedItems = () => {
    const updatedPantry = [...pantry];
    detectedItems.forEach(detected => {
      const existing = updatedPantry.find(p => p.name.toLowerCase() === detected.name.toLowerCase());
      if (existing) {
        existing.quantity += detected.quantity;
        if (detected.expiryHours) {
          existing.expiryHours = existing.expiryHours !== undefined
            ? Math.min(existing.expiryHours, detected.expiryHours)
            : detected.expiryHours;
        }
      } else {
        updatedPantry.push({
          ...detected,
          id: `ing_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          addedDate: new Date().toISOString().split('T')[0]
        });
      }
    });
    setPantry(updatedPantry);
    setShowVerify(false);
    
    // Add scanned items back to history/stats or just notify
    setXp(prev => prev + 10);
  };

  // Quantity adjusting for verification list
  const updateDetectedQty = (index: number, change: number) => {
    setDetectedItems(prev => prev.map((item, idx) => {
      if (idx === index) {
        const newQty = Math.max(0.5, item.quantity + change);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  // Name editing for verification list
  const updateDetectedName = (index: number, newName: string) => {
    setDetectedItems(prev => prev.map((item, idx) => {
      if (idx === index) {
        return { ...item, name: newName };
      }
      return item;
    }));
  };

  // Remove item from verification list
  const removeDetectedItem = (index: number) => {
    setDetectedItems(prev => prev.filter((_, idx) => idx !== index));
  };

  // Quick Add autocomplete click
  const handleQuickAddSelect = (item: { name: string; category: string; unit: string }) => {
    const existing = pantry.find(p => p.name.toLowerCase() === item.name.toLowerCase());
    if (existing) {
      setPantry(prev => prev.map(p => {
        if (p.id === existing.id) {
          return { ...p, quantity: p.quantity + 1 };
        }
        return p;
      }));
    } else {
      setPantry(prev => [
        ...prev,
        {
          id: `ing_${Date.now()}`,
          name: item.name,
          quantity: item.unit === 'pcs' || item.unit === 'bag' || item.unit === 'block' || item.unit === 'cup' ? 1 : 100,
          unit: item.unit,
          category: item.category,
          addedDate: new Date().toISOString().split('T')[0]
        }
      ]);
    }
    setQuickAddText('');
    setShowSuggestions(false);
  };

  // Quick add manual enter submit
  const handleQuickAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAddText.trim()) return;

    // Search for closest match in autocomplete list
    const exactMatch = autocompleteSuggestions.find(
      s => s.name.toLowerCase() === quickAddText.trim().toLowerCase()
    );

    if (exactMatch) {
      handleQuickAddSelect(exactMatch);
    } else {
      // Add custom ingredient
      setPantry(prev => [
        ...prev,
        {
          id: `ing_${Date.now()}`,
          name: quickAddText.trim(),
          quantity: 1,
          unit: 'units',
          category: 'Other',
          addedDate: new Date().toISOString().split('T')[0]
        }
      ]);
      setQuickAddText('');
    }
  };

  // Inline editing in pantry
  const handleStartPantryEdit = (id: string, currentQty: number) => {
    setEditingIngredientId(id);
    setEditingQty(currentQty);
  };

  const handleSavePantryEdit = (id: string) => {
    setPantry(prev => prev.map(p => {
      if (p.id === id) {
        return { ...p, quantity: editingQty };
      }
      return p;
    }));
    setEditingIngredientId(null);
  };

  const handleDeletePantryItem = (id: string) => {
    setPantry(prev => prev.filter(p => p.id !== id));
  };

  // Scaled ingredient value calculator
  const getScaledQtyText = (recipeId: string, ingredientName: string) => {
    const baseServings = 2;
    const currentServings = servings[recipeId] || 2;
    const reqs = recipeRequirements[recipeId] || [];
    const itemReq = reqs.find(r => r.name.toLowerCase() === ingredientName.toLowerCase());
    
    if (!itemReq) return '';
    const scaledVal = (itemReq.qty / baseServings) * currentServings;
    return `${scaledVal % 1 === 0 ? scaledVal : scaledVal.toFixed(1)} ${itemReq.unit}`;
  };

  // Launch Cooking Mode
  const startCooking = (recipe: Recipe) => {
    setCookingRecipe(recipe);
    setCookingStep(0);
    setStepCheckedItems({});
    // Reset timer to appropriate step time or default 2 minutes
    setTimerSeconds(120);
    setTimerRunning(false);
    if (viewMode === 'simulator') {
      // In simulator, keep screen focused on cooking (handled by rendering cooking component in main screen)
    }
  };

  // Handle checklist checkbox toggle
  const toggleChecklist = (stepIdx: number, itemName: string) => {
    setStepCheckedItems(prev => {
      const stepItems = prev[stepIdx] || {};
      return {
        ...prev,
        [stepIdx]: {
          ...stepItems,
          [itemName]: !stepItems[itemName]
        }
      };
    });
  };

  // Complete Cooking & Deduct Ingredients
  const handleCompleteMeal = () => {
    if (!cookingRecipe) return;

    const currentRecipeServings = servings[cookingRecipe.id] || 2;
    const multiplier = currentRecipeServings / 2; // base servings is 2
    const reqs = recipeRequirements[cookingRecipe.id] || [];

    const deductedList: Array<{ name: string; qty: number; unit: string }> = [];
    const updatedPantry = pantry.map(pantryItem => {
      const recipeItem = reqs.find(r => r.name.toLowerCase() === pantryItem.name.toLowerCase());
      if (recipeItem) {
        const requiredQty = recipeItem.qty * multiplier;
        const remainingQty = Math.max(0, pantryItem.quantity - requiredQty);
        deductedList.push({
          name: pantryItem.name,
          qty: Math.min(pantryItem.quantity, requiredQty),
          unit: pantryItem.unit
        });
        return {
          ...pantryItem,
          quantity: remainingQty
        };
      }
      return pantryItem;
    }).filter(p => p.quantity > 0); // remove items fully depleted

    // Calculate taste profile re-clustering weight shift
    const updatedProfile = { ...tasteProfile };
    let cuisineType = 'Western';
    if (cookingRecipe.id === 'rec_pasta') cuisineType = 'Italian';
    if (cookingRecipe.id === 'rec_omelette') cuisineType = 'Western';
    if (cookingRecipe.id === 'rec_yogurt_dip') cuisineType = 'Indian';
    if (cookingRecipe.id === 'rec_chicken_garlic') cuisineType = 'Western';
    
    // Shift weights toward this cuisine
    const cuisinesList = Object.keys(updatedProfile.cuisines) as Array<keyof typeof updatedProfile.cuisines>;
    cuisinesList.forEach(c => {
      if (c === cuisineType) {
        updatedProfile.cuisines[c] = Math.min(100, updatedProfile.cuisines[c] + 8);
      } else {
        updatedProfile.cuisines[c] = Math.max(5, updatedProfile.cuisines[c] - 2);
      }
    });

    // Save States
    setPantry(updatedPantry);
    setTasteProfile(updatedProfile);
    
    // Add to History list
    const newHistoryItem: HistoryItem = {
      id: `h_${Date.now()}`,
      title: cookingRecipe.title,
      date: new Date().toISOString().split('T')[0],
      xpEarned: 15,
      cuisine: cuisineType
    };
    setHistory([newHistoryItem, ...history]);
    
    // Set up success modal feedback data
    setSuccessModalData({
      recipeTitle: cookingRecipe.title,
      xpGained: 15,
      deducted: deductedList
    });
    setXp(prev => prev + 15);
    setShowSuccessModal(true);
    setCookingRecipe(null);
  };

  // Filter recipes based on search, dietary preferences and spice
  const filteredRecipes = recipes.filter(recipe => {
    // Search filter
    if (recipeSearch && !recipe.title.toLowerCase().includes(recipeSearch.toLowerCase())) {
      return false;
    }
    
    // Spice filter
    if (maxSpice === 'Low' && recipe.spiceLevel !== 'Low') return false;
    if (maxSpice === 'Medium' && recipe.spiceLevel === 'High') return false;

    // Dietary constraint filters
    if (dietaryFilters.vegan) {
      // Vegan cannot have Chicken or Eggs/Milk (unless substituted, but for strict filter we flag animal ingredients)
      const nonVeganList = ['chicken breast', 'eggs', 'whole milk', 'cheddar cheese', 'butter'];
      const hasNonVegan = recipeRequirements[recipe.id]?.some(req => 
        nonVeganList.includes(req.name.toLowerCase())
      );
      if (hasNonVegan) return false;
    }

    if (dietaryFilters.glutenFree) {
      // Gluten free cannot have pasta
      const hasGluten = recipeRequirements[recipe.id]?.some(req => 
        req.name.toLowerCase().includes('pasta') || req.name.toLowerCase().includes('wheat')
      );
      if (hasGluten) return false;
    }

    return true;
  });

  // Expiring items selection (expires in <= 48 hours)
  const expiringPantryItems = pantry.filter(p => p.expiryHours !== undefined && p.expiryHours <= 48);

  // SVG Taste Profile Radar Graph calculation helper
  // Draws a pentagon coordinate diagram for: Italian, Mexican, Asian, Western, Indian
  const getRadarPoints = () => {
    const center = 100;
    const rBase = 70;
    const keys = ['Italian', 'Mexican', 'Asian', 'Western', 'Indian'] as const;
    const angles = [0, 72, 144, 216, 288]; // Pentagon vertices angles
    
    const points = angles.map((angle, idx) => {
      const key = keys[idx];
      const weight = tasteProfile.cuisines[key] / 100; // factor 0 to 1
      const radius = rBase * weight;
      const rad = (angle - 90) * (Math.PI / 180);
      const x = center + radius * Math.cos(rad);
      const y = center + radius * Math.sin(rad);
      return `${x},${y}`;
    });
    
    return points.join(' ');
  };

  // Draws base pentagon grid line layers
  const getGridPoints = (scale: number) => {
    const center = 100;
    const radius = 70 * scale;
    const angles = [0, 72, 144, 216, 288];
    const points = angles.map(angle => {
      const rad = (angle - 90) * (Math.PI / 180);
      const x = center + radius * Math.cos(rad);
      const y = center + radius * Math.sin(rad);
      return `${x},${y}`;
    });
    return points.join(' ');
  };

  // Restock item refill handler (adds back to pantry)
  const refillRestockItem = (item: RestockItem) => {
    const detail = autocompleteSuggestions.find(s => s.name === item.name);
    const existing = pantry.find(p => p.name.toLowerCase() === item.name.toLowerCase());
    
    if (existing) {
      setPantry(prev => prev.map(p => {
        if (p.id === existing.id) {
          return { ...p, quantity: p.quantity + (p.unit === 'pcs' || p.unit === 'bag' ? 4 : 250) };
        }
        return p;
      }));
    } else {
      setPantry(prev => [
        ...prev,
        {
          id: `ing_${Date.now()}`,
          name: item.name,
          quantity: detail?.unit === 'pcs' ? 6 : detail?.unit === 'bag' ? 1 : 200,
          unit: detail?.unit || 'units',
          category: detail?.category || 'Pantry',
          addedDate: new Date().toISOString().split('T')[0]
        }
      ]);
    }

    // Remove from restock list
    setRestockList(prev => prev.filter(r => r.id !== item.id));
  };

  // Formatter for timer minutes and seconds
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Render main layout content depending on active views
  const renderDashboardMain = () => {
    if (cookingRecipe) {
      const stepCount = cookingRecipe.instructions.length;
      const activeStepInst = cookingRecipe.instructions[cookingStep];
      const isLastStep = cookingStep === stepCount - 1;
      const progressPercent = Math.round(((cookingStep + 1) / stepCount) * 100);

      // Extract step specific checklists (Mocking tools and ingredient checkboxes)
      const currentStepIngredients = recipeRequirements[cookingRecipe.id]?.filter((_, idx) => {
        // mock split ingredients between steps for demo UI
        return (cookingStep + idx) % 2 === 0;
      }) || [];

      return (
        <div className="cook-container">
          <div className="cook-header-row">
            <button className="cook-back-btn" onClick={() => setCookingRecipe(null)}>
              <ArrowLeft size={16} /> Exit Cook Mode
            </button>
            <div className="cook-recipe-title">{cookingRecipe.title}</div>
            <div className="cook-step-tracker">Step {cookingStep + 1}/{stepCount}</div>
          </div>

          <div className="cook-progress-bar-container">
            <div className="cook-progress-bar" style={{ width: `${progressPercent}%` }} />
          </div>

          <div className="step-card">
            <div className="step-instruction-title">Instruction</div>
            <div className="step-instruction-text">{activeStepInst}</div>

            {/* Embedded Timer simulation for active cooking step */}
            <div className="timer-widget">
              <div className="timer-left">
                <Clock className="timer-icon" />
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>STEP TIMER</div>
                  <div className="timer-digits">{formatTime(timerSeconds)}</div>
                </div>
              </div>
              <div className="timer-controls">
                <button 
                  className={`timer-btn ${timerRunning ? 'pause' : 'start'}`}
                  onClick={() => setTimerRunning(!timerRunning)}
                >
                  {timerRunning ? <Pause size={14} style={{ display: 'inline', marginRight: '4px' }} /> : <Play size={14} style={{ display: 'inline', marginRight: '4px' }} />}
                  {timerRunning ? 'Pause' : 'Start'}
                </button>
                <button 
                  className="timer-btn reset" 
                  onClick={() => { setTimerRunning(false); setTimerSeconds(120); }}
                >
                  <RotateCcw size={12} />
                </button>
              </div>
            </div>

            {/* Step specific checklist item */}
            <div className="checklist-container">
              <div className="checklist-title">Ingredients Needed For This Step</div>
              <div className="checklist-items">
                {currentStepIngredients.map((ing, idx) => {
                  const checkKey = `${cookingStep}-${ing.name}`;
                  const isChecked = stepCheckedItems[cookingStep]?.[ing.name] || false;
                  return (
                    <label 
                      key={idx} 
                      className={`checkbox-label ${isChecked ? 'checked' : ''}`}
                    >
                      <input 
                        type="checkbox" 
                        className="checkbox-input" 
                        checked={isChecked}
                        onChange={() => toggleChecklist(cookingStep, ing.name)}
                      />
                      <span>{getScaledQtyText(cookingRecipe.id, ing.name) || `1 ${ing.unit}`} {ing.name}</span>
                    </label>
                  );
                })}
                <label className={`checkbox-label ${stepCheckedItems[cookingStep]?.['pan'] ? 'checked' : ''}`}>
                  <input 
                    type="checkbox" 
                    className="checkbox-input" 
                    checked={stepCheckedItems[cookingStep]?.['pan'] || false}
                    onChange={() => toggleChecklist(cookingStep, 'pan')}
                  />
                  <span>Cooking Pan / Skillet</span>
                </label>
              </div>
            </div>
          </div>

          <div className="cook-footer">
            <button 
              className="cook-nav-btn"
              disabled={cookingStep === 0}
              onClick={() => setCookingStep(prev => Math.max(0, prev - 1))}
              style={{ opacity: cookingStep === 0 ? 0.4 : 1 }}
            >
              Previous Step
            </button>

            {!isLastStep ? (
              <button 
                className="cook-nav-btn primary"
                onClick={() => {
                  setCookingStep(prev => prev + 1);
                  setTimerSeconds(120); // reset timer for next step
                  setTimerRunning(false);
                }}
              >
                Next Step <ChevronRight size={16} />
              </button>
            ) : (
              <button className="finish-meal-btn" onClick={handleCompleteMeal}>
                <Award size={18} /> Finish & Complete Meal
              </button>
            )}
          </div>
        </div>
      );
    }

    if (activeTab === 'recipes') {
      return (
        <div className="recipe-panel">
          {/* Filters & Search */}
          <div className="filter-bar">
            <div className="search-input-wrapper">
              <Search className="search-icon" />
              <input 
                type="text" 
                placeholder="Search recipes..." 
                className="search-bar"
                value={recipeSearch}
                onChange={(e) => setRecipeSearch(e.target.value)}
              />
            </div>
            
            <div className="dietary-dropdown" style={{ position: 'relative' }}>
              <Filter size={16} /> 
              <span>Diet: {dietaryFilters.vegan ? 'Vegan' : dietaryFilters.glutenFree ? 'GF' : 'All'}</span>
            </div>
          </div>

          {/* Recipe List segment switches */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="recipes-tabs">
              <button className="recipe-tab active">All Matches ({filteredRecipes.length})</button>
            </div>
            
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '13px' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Spice Limit:</span>
              <select 
                value={maxSpice} 
                onChange={(e: any) => setMaxSpice(e.target.value)}
                style={{ 
                  backgroundColor: 'var(--bg-surface)', 
                  border: '1px solid var(--bg-border)', 
                  padding: '4px 8px', 
                  borderRadius: '6px', 
                  fontSize: '12px',
                  fontWeight: 700
                }}
              >
                <option value="Low">Low Spice</option>
                <option value="Medium">Medium Spice</option>
                <option value="High">High Spice (All)</option>
              </select>
            </div>
          </div>

          {/* Recipes Card Grid */}
          <div className="recipes-grid">
            {filteredRecipes.length > 0 ? (
              filteredRecipes.map((recipe) => {
                const expiringIngredientsUsed = recipe.usedIngredients.filter(name => 
                  expiringPantryItems.some(epi => epi.name.toLowerCase() === name.toLowerCase())
                );
                
                return (
                  <div key={recipe.id} className="recipe-card">
                    <div className="recipe-img-container">
                      <img 
                        className="recipe-img" 
                        src={recipe.image} 
                        alt={recipe.title} 
                      />
                      <div className="recipe-badges">
                        <span className={`match-badge ${recipe.matchType === 'Zero-Waste' ? 'zero-waste' : 'quick-run'}`}>
                          {recipe.matchPercentage}% Match
                        </span>
                        {expiringIngredientsUsed.length > 0 && (
                          <span className="match-badge" style={{ backgroundColor: '#D97706', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <AlertTriangle size={10} /> Expiring Soon
                          </span>
                        )}
                      </div>
                      <span className="time-chip">{recipe.prepTimeMinutes} mins</span>
                    </div>

                    <div className="recipe-content">
                      <h3 className="recipe-title">{recipe.title}</h3>
                      
                      <div className="recipe-meta-row">
                        <span className="meta-item">🔥 {recipe.spiceLevel} Spice</span>
                        <span className="meta-item">🍳 {recipe.difficulty}</span>
                      </div>

                      {/* Display used ingredients */}
                      <div className="recipe-ingredients-summary">
                        <div className="ingredients-title">Ingredients Used from Pantry</div>
                        <div className="ingredients-chips">
                          {recipe.usedIngredients.map((name, idx) => {
                            const isExpiring = expiringPantryItems.some(epi => epi.name.toLowerCase() === name.toLowerCase());
                            return (
                              <span key={idx} className={`ing-chip ${isExpiring ? 'expiring' : ''}`}>
                                {isExpiring && '⚠️ '}{name}
                              </span>
                            );
                          })}
                        </div>
                      </div>

                      {/* Missing Ingredients or Substitutions box */}
                      {recipe.missingIngredients.length > 0 && (
                        <div className="substitution-banner">
                          <span className="sub-missing">Missing: {recipe.missingIngredients.join(', ')}</span>
                          {recipe.substitutions.length > 0 ? (
                            recipe.substitutions.map((sub, idx) => (
                              <span key={idx} className="sub-suggested">
                                💡 Substitute {sub.missing} with: <strong>{sub.suggestedSubstitute}</strong>
                              </span>
                            ))
                          ) : (
                            <span className="sub-suggested">💡 Double check other kitchen cabinets!</span>
                          )}
                        </div>
                      )}

                      {/* Servings control and start cooking trigger */}
                      <div className="scaler-row">
                        <div className="servings-control">
                          <button 
                            className="servings-btn"
                            onClick={() => setServings(prev => ({
                              ...prev,
                              [recipe.id]: Math.max(1, (prev[recipe.id] || 2) - 1)
                            }))}
                          >
                            -
                          </button>
                          <span className="servings-count">{(servings[recipe.id] || 2)} Servings</span>
                          <button 
                            className="servings-btn"
                            onClick={() => setServings(prev => ({
                              ...prev,
                              [recipe.id]: (prev[recipe.id] || 2) + 1
                            }))}
                          >
                            +
                          </button>
                        </div>

                        <button 
                          className="start-cooking-btn"
                          onClick={() => startCooking(recipe)}
                        >
                          Cook <ChefHat size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="empty-state">
                <span className="empty-state-icon">🍳</span>
                <h3>No Matching Recipes Found</h3>
                <p>Try broadening your searches, toggling dietary restrictions, or scanning more items in your fridge.</p>
                <label htmlFor="mobile-camera-input" className="empty-state-btn" style={{ display: 'inline-block', cursor: 'pointer', textAlign: 'center' }}>
                  Scan Refrigerator
                </label>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (activeTab === 'pantry') {
      // Just a larger placeholder list for Digital Pantry in Mobile / Tab view
      return (
        <div style={{ animation: 'floatUp var(--transition-normal)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="pantry-card" style={{ boxShadow: 'none' }}>
            <div className="pantry-header">
              <h2>Digital Inventory Manager</h2>
            </div>
            
            {renderPantryListSection()}
          </div>
        </div>
      );
    }

    if (activeTab === 'profile') {
      return (
        <div className="profile-panel">
          {/* Preferences and SVG Taste Profile Vector embeds */}
          <div className="profile-card-left">
            <h2 className="section-title"><User size={18} color="var(--primary)" /> Taste Vector Profile</h2>
            
            <div className="chart-container">
              {/* Clean SVG Radar Chart */}
              <svg width="200" height="200" style={{ transform: 'rotate(0deg)' }}>
                {/* Background Pentagon Lines */}
                <polygon points={getGridPoints(1)} fill="none" stroke="var(--bg-border)" strokeWidth="1" />
                <polygon points={getGridPoints(0.7)} fill="none" stroke="var(--bg-border)" strokeWidth="1" />
                <polygon points={getGridPoints(0.4)} fill="none" stroke="var(--bg-border)" strokeWidth="1" strokeDasharray="2" />
                
                {/* Axes lines */}
                {[[100,30], [166,78], [141,157], [59,157], [34,78]].map((pt, idx) => (
                  <line key={idx} x1="100" y1="100" x2={pt[0]} y2={pt[1]} stroke="var(--bg-border)" strokeWidth="1" />
                ))}

                {/* Axis Labels */}
                <text x="100" y="22" textAnchor="middle" fontSize="9" fontWeight="700" fill="var(--text-secondary)">ITA</text>
                <text x="175" y="78" textAnchor="start" fontSize="9" fontWeight="700" fill="var(--text-secondary)">MEX</text>
                <text x="145" y="170" textAnchor="start" fontSize="9" fontWeight="700" fill="var(--text-secondary)">ASI</text>
                <text x="55" y="170" textAnchor="end" fontSize="9" fontWeight="700" fill="var(--text-secondary)">WES</text>
                <text x="25" y="78" textAnchor="end" fontSize="9" fontWeight="700" fill="var(--text-secondary)">IND</text>

                {/* Filled Taste Polygon */}
                <polygon 
                  points={getRadarPoints()} 
                  fill="rgba(78, 135, 82, 0.4)" 
                  stroke="var(--primary)" 
                  strokeWidth="2.5" 
                  style={{ transition: 'all 0.5s ease' }}
                />
              </svg>
            </div>

            <div className="chart-legend">
              <span className="legend-item"><span className="legend-dot" style={{ backgroundColor: 'var(--primary)' }} /> Cuisines Affinity Score (XP updated)</span>
            </div>

            {/* Static constraints switches */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>DIETARY LOCKS (STATIC PREFERENCES)</div>
              <div className="pref-toggles">
                <button 
                  className={`pref-toggle-btn ${dietaryFilters.vegan ? 'active' : ''}`}
                  onClick={() => setDietaryFilters(prev => ({ ...prev, vegan: !prev.vegan }))}
                >
                  <span>🌱 Vegan</span>
                  <div className="toggle-switch-dot" />
                </button>
                <button 
                  className={`pref-toggle-btn ${dietaryFilters.glutenFree ? 'active' : ''}`}
                  onClick={() => setDietaryFilters(prev => ({ ...prev, glutenFree: !prev.glutenFree }))}
                >
                  <span>🌾 Gluten-Free</span>
                  <div className="toggle-switch-dot" />
                </button>
              </div>
            </div>
          </div>

          <div className="profile-card-right">
            {/* Purchase Intelligence Predictions */}
            <h2 className="section-title"><ShoppingBag size={18} color="var(--secondary)" /> Purchase Intelligence</h2>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Based on your cooking rates, these ingredients may need restocking soon:</div>
            
            <div className="restock-list">
              {restockList.length > 0 ? (
                restockList.map((item) => (
                  <div key={item.id} className="restock-item">
                    <span className="restock-name">{item.emoji} {item.name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span className="restock-rate">{item.consumptionRate}</span>
                      <button className="restock-add-btn" onClick={() => refillRestockItem(item)}>
                        Refill
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '20px', textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>
                  All predicted items are currently well-stocked!
                </div>
              )}
            </div>

            {/* History */}
            <h2 className="section-title" style={{ marginTop: '12px' }}><Sparkles size={18} color="#F59E0B" /> Cooking History</h2>
            <div className="history-list">
              {history.map((h) => (
                <div key={h.id} className="history-item">
                  <div className="history-info">
                    <span className="history-title">{h.title}</span>
                    <span className="history-date">{h.date} • {h.cuisine}</span>
                  </div>
                  <span className="history-xp">+{h.xpEarned} XP</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }
  };

  // Reusable Pantry inventory renderer (both for Desktop Sidebar and Fullscreen tab view)
  const renderPantryListSection = () => {
    // Filter pantry items by category
    const filteredPantry = pantry.filter(p => {
      if (pantryCategory === 'All') return true;
      return p.category.toLowerCase() === pantryCategory.toLowerCase();
    });

    return (
      <>
        {/* Expiring warnings */}
        {expiringPantryItems.length > 0 && (
          <div className="expiry-box">
            <h3>⚠️ Expiring Soon ({expiringPantryItems.length})</h3>
            <div className="expiry-list">
              {expiringPantryItems.map((item) => (
                <div key={item.id} className="expiry-item">
                  <span className="expiry-name">🥬 {item.name} ({item.quantity} {item.unit})</span>
                  <span className="expiry-time">expires in {item.expiryHours}h</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Category Pill Filters */}
        <div className="category-chips">
          {ingredientCategories.map((cat) => (
            <button 
              key={cat} 
              className={`chip ${pantryCategory === cat ? 'active' : ''}`}
              onClick={() => setPantryCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* List of active pantry inventory */}
        <div className="pantry-list">
          {filteredPantry.length > 0 ? (
            filteredPantry.map((item) => (
              <div key={item.id} className="pantry-item-row">
                <div className="pantry-item-info">
                  <span className="pantry-item-icon">{categoryEmojis[item.category] || '🍽️'}</span>
                  {editingIngredientId === item.id ? (
                    <input 
                      type="number"
                      value={editingQty}
                      className="quick-add-input"
                      style={{ width: '60px', padding: '4px' }}
                      onChange={(e) => setEditingQty(parseFloat(e.target.value) || 0)}
                    />
                  ) : (
                    <span className="pantry-item-name">{item.name}</span>
                  )}
                  <span className="pantry-item-qty">{item.quantity} {item.unit}</span>
                </div>

                <div className="pantry-item-actions">
                  {editingIngredientId === item.id ? (
                    <button 
                      className="action-icon-btn" 
                      onClick={() => handleSavePantryEdit(item.id)}
                      style={{ color: 'var(--primary)' }}
                    >
                      <Check size={14} />
                    </button>
                  ) : (
                    <button 
                      className="action-icon-btn" 
                      onClick={() => handleStartPantryEdit(item.id, item.quantity)}
                    >
                      <Edit2 size={12} />
                    </button>
                  )}
                  <button 
                    className="action-icon-btn delete" 
                    onClick={() => handleDeletePantryItem(item.id)}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: '13px' }}>
              No items in this category.
            </div>
          )}
        </div>

        {/* Quick manual entry input */}
        <div className="autocomplete-wrapper">
          <form className="quick-add-form" onSubmit={handleQuickAddSubmit}>
            <input 
              type="text" 
              placeholder="+ Add hidden/missing item..." 
              className="quick-add-input"
              value={quickAddText}
              onChange={(e) => {
                setQuickAddText(e.target.value);
                setShowSuggestions(e.target.value.length > 0);
              }}
              onFocus={() => setShowSuggestions(quickAddText.length > 0)}
            />
            <button type="submit" className="quick-add-submit">Add</button>
          </form>

          {/* Autocomplete suggestion drop drawer */}
          {showSuggestions && (
            <div 
              style={{
                position: 'absolute',
                bottom: '100%',
                left: 0,
                width: '100%',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--bg-border)',
                borderRadius: '8px',
                boxShadow: 'var(--shadow-lg)',
                zIndex: 50,
                maxHeight: '180px',
                overflowY: 'auto',
                marginBottom: '4px'
              }}
            >
              {autocompleteSuggestions
                .filter(s => s.name.toLowerCase().includes(quickAddText.toLowerCase()))
                .map((s, idx) => (
                  <div 
                    key={idx}
                    style={{
                      padding: '10px 12px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: 600,
                      borderBottom: '1px solid var(--bg-border)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                    onClick={() => handleQuickAddSelect(s)}
                    className="pantry-item-row"
                  >
                    <span>{categoryEmojis[s.category] || '🍽️'} {s.name}</span>
                    <span style={{ fontSize: '10px', opacity: 0.6 }}>({s.unit})</span>
                  </div>
                ))
              }
            </div>
          )}
        </div>
      </>
    );
  };

  return (
    <div className="app-container">
      {/* Top Header Section */}
      <header className="app-header">
        <div className="brand">
          <div className="brand-icon">🎨</div>
          <div>
            <h1 className="brand-name">Smart Palette</h1>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>AI Fridge-to-Plate culinary scanner</p>
          </div>
        </div>

        <div className="header-actions">
          {/* XP level indicator badge */}
          <div className="xp-badge">
            <Sparkles size={14} /> Level {Math.floor(xp / 100) + 1} ({xp % 100}/100 XP)
          </div>

          {/* Selector toggle for Desktop dashboard vs Mobile simulation */}
          <div className="simulator-toggle">
            <button 
              className={`toggle-btn ${viewMode === 'desktop' ? 'active' : ''}`}
              onClick={() => setViewMode('desktop')}
            >
              <Monitor size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
              Desktop View
            </button>
            <button 
              className={`toggle-btn ${viewMode === 'simulator' ? 'active' : ''}`}
              onClick={() => setViewMode('simulator')}
            >
              <Smartphone size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
              Simulator View
            </button>
          </div>
        </div>
      </header>

      {/* Main Container Layout */}
      {viewMode === 'desktop' ? (
        /* Multi-Column Desktop layout adapt */
        <div className="dashboard-grid">
          
          {/* Left panel: Inventory + Expiring alerts */}
          <div className="left-panel">
            <div className="pantry-card">
              <div className="pantry-header">
                <h2>Digital Pantry</h2>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 700 }}>
                  {pantry.length} ITEMS
                </div>
              </div>

              {renderPantryListSection()}
            </div>

            {/* Smart fridge camera scanner call to action */}
            <div className="scan-cta-card">
              <h3>Snap Fridge Photo</h3>
              <p>Skip typing. AI Vision extracts items, logs expiries, and updates recipe matches instantly.</p>
              <label htmlFor="mobile-camera-input" className="scan-cta-button" style={{ display: 'flex', cursor: 'pointer', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Camera size={16} /> Scan Kitchen Fridge
              </label>
            </div>
          </div>

          {/* Right main panel: Tab navigation + Content */}
          <div className="main-dashboard-panel">
            <div className="navigation-bar">
              <div className="nav-tabs">
                <button 
                  className={`nav-tab ${activeTab === 'recipes' ? 'active' : ''}`}
                  onClick={() => { setActiveTab('recipes'); setCookingRecipe(null); }}
                >
                  <ChefHat size={16} /> Recipes Catalog
                </button>
                <button 
                  className={`nav-tab ${activeTab === 'profile' ? 'active' : ''}`}
                  onClick={() => { setActiveTab('profile'); setCookingRecipe(null); }}
                >
                  <User size={16} /> Profile & Preferences
                </button>
              </div>

              <div className="mode-badge">
                <Sparkles size={14} /> Groq Llama-3.2-Vision Powered
              </div>
            </div>

            {renderDashboardMain()}
          </div>
        </div>
      ) : (
        /* Mobile Simulator Shell */
        <div className="simulator-layout">
          <div className="phone-shell">
            <div className="phone-notch" />
            <div className="phone-screen">
              
              {/* Screen Top Header info */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                <span style={{ fontSize: '13px', fontWeight: 800 }}>🎨 Smart Palette</span>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#F59E0B' }}>⭐ {xp} XP</span>
              </div>

              {/* Simulated navigation inside screen */}
              {cookingRecipe ? (
                // Render Cook mode inside mobile screen directly
                renderDashboardMain()
              ) : (
                <>
                  <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--bg-border)', paddingBottom: '10px' }}>
                    <button 
                      onClick={() => setActiveTab('recipes')}
                      style={{ 
                        flex: 1, 
                        textAlign: 'center', 
                        fontSize: '12px', 
                        fontWeight: 700, 
                        color: activeTab === 'recipes' ? 'var(--primary)' : 'var(--text-secondary)',
                        paddingBottom: '4px',
                        borderBottom: activeTab === 'recipes' ? '2px solid var(--primary)' : 'none'
                      }}
                    >
                      Cook Recipes
                    </button>
                    <button 
                      onClick={() => setActiveTab('pantry')}
                      style={{ 
                        flex: 1, 
                        textAlign: 'center', 
                        fontSize: '12px', 
                        fontWeight: 700, 
                        color: activeTab === 'pantry' ? 'var(--primary)' : 'var(--text-secondary)',
                        paddingBottom: '4px',
                        borderBottom: activeTab === 'pantry' ? '2px solid var(--primary)' : 'none'
                      }}
                    >
                      Pantry ({pantry.length})
                    </button>
                    <button 
                      onClick={() => setActiveTab('profile')}
                      style={{ 
                        flex: 1, 
                        textAlign: 'center', 
                        fontSize: '12px', 
                        fontWeight: 700, 
                        color: activeTab === 'profile' ? 'var(--primary)' : 'var(--text-secondary)',
                        paddingBottom: '4px',
                        borderBottom: activeTab === 'profile' ? '2px solid var(--primary)' : 'none'
                      }}
                    >
                      Preferences
                    </button>
                  </div>

                  {/* Scan fridge overlay trigger on mobile */}
                  {activeTab !== 'profile' && (
                    <label 
                      htmlFor="mobile-camera-input"
                      style={{ 
                        width: '100%', 
                        background: 'linear-gradient(135deg, var(--primary), #3b6b3e)',
                        color: 'white',
                        padding: '12px',
                        borderRadius: '10px',
                        fontWeight: 700,
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      <Camera size={14} /> Scan Fridge Photo
                    </label>
                  )}

                  {/* Main screen scrolling layout */}
                  <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {renderDashboardMain()}
                  </div>
                </>
              )}
            </div>
            <div className="phone-home-indicator" />
          </div>
        </div>
      )}

      {/* ==========================================================================
         UI-1: Simulated Camera Viewfinder Overlay Modal
         ========================================================================== */}
      {showCamera && (
        <div className="scanner-overlay">
          <div className="scanner-container">
            
            {/* Camera Floating Header */}
            <div className="scanner-header">
              <button className="scanner-close" onClick={() => setShowCamera(false)}>
                <X size={18} />
              </button>
              <span style={{ fontSize: '14px', fontWeight: 700, alignSelf: 'center' }}>FRIDGE VISION SCANNER</span>
              <button 
                className="scanner-flash" 
                onClick={() => setCameraFlash(!cameraFlash)}
                style={{ backgroundColor: cameraFlash ? 'var(--primary)' : 'rgba(255,255,255,0.2)' }}
              >
                ⚡
              </button>
            </div>

            {/* Viewfinder display area */}
            <div 
              className="scanner-viewfinder"
              style={{ backgroundImage: `url(${scannedImage || '/images/fridge_interior.png'})` }}
            >
              <div className="viewfinder-frame">
                <span className="viewfinder-text">Align shelves inside frame</span>
              </div>
              
              {/* Animated laser & pulse scan line */}
              {isScanning && <div className="scan-laser-line" />}
              {isScanning && <div className="scanner-pulse-glow" />}

              {/* Uploading loader */}
              {isGalleryUploading && (
                <div style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  backgroundColor: 'rgba(0,0,0,0.6)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  gap: '12px',
                  zIndex: 20
                }}>
                  <RefreshCw className="spin" size={32} style={{ animation: 'spin 2s linear infinite' }} />
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>Analyzing uploaded image...</span>
                </div>
              )}
            </div>

            {/* Scanner Controls Footer */}
            <div className="scanner-footer">
              <label className="scanner-upload-btn" style={{ cursor: 'pointer' }}>
                <input 
                  type="file" 
                  accept="image/*" 
                  style={{ display: 'none' }} 
                  onChange={handleGalleryUpload}
                  disabled={isScanning || isGalleryUploading}
                />
                <span><Upload size={18} /></span>
                Upload
              </label>

              <button 
                className={`shutter-btn ${isScanning ? 'scanning' : ''}`}
                onClick={handleShutterClick}
                disabled={isScanning || isGalleryUploading}
              >
                <div className="shutter-inner" />
              </button>

              <button 
                className="scanner-tips-btn"
                onClick={() => setShowTips(true)}
              >
                <span><Info size={18} /></span>
                Tips
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Camera Guidance Tips Box */}
      {showTips && (
        <div className="scanner-overlay" style={{ zIndex: 1005 }}>
          <div className="tips-dialog">
            <div className="tips-header">
              <h3>💡 Scan Recommendations</h3>
              <button onClick={() => setShowTips(false)}><X size={18} /></button>
            </div>
            <div className="tips-body">
              <div className="tips-item">
                <div className="tips-num">1</div>
                <div>Open the fridge door fully and verify objects are not stacked block-behind-block.</div>
              </div>
              <div className="tips-item">
                <div className="tips-num">2</div>
                <div>Ensure good lighting inside or turn on the flash toggle.</div>
              </div>
              <div className="tips-item">
                <div className="tips-num">3</div>
                <div>Keep the phone lens clean and steady to allow Llama-3.2-Vision to properly calculate quantities.</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================================================
         UI-2: Interactive Verification Drawer Modal
         ========================================================================== */}
      {showVerify && (
        <div className="verify-sheet-backdrop">
          <div className="verify-sheet">
            <div className="verify-grabber" />
            
            <div className="verify-header">
              <h2>Verify Detected Items</h2>
              <p>AI parsed 4 items. Tap +/- to adjust or name to edit.</p>
            </div>

            <div className="verify-content">
              {/* Highlight low confidence scores */}
              <div className="confidence-banner">
                <span>⚠️</span>
                <div>
                  <strong>Low-Confidence item:</strong> Cheddar Cheese (84%). Please verify packaging quantities below.
                </div>
              </div>

              {/* Detected list */}
              <div className="detected-items-list">
                {detectedItems.map((item, idx) => {
                  const isLowConfidence = item.confidence && item.confidence < 0.90;
                  return (
                    <div 
                      key={idx} 
                      className={`detected-item-card ${isLowConfidence ? 'low-confidence' : ''}`}
                    >
                      <div className="detected-item-left">
                        <span className="detected-item-emoji">
                          {categoryEmojis[item.category] || '🥬'}
                        </span>
                        <div className="detected-item-details">
                          <input 
                            type="text" 
                            className="detected-item-name-input"
                            value={item.name}
                            onChange={(e) => updateDetectedName(idx, e.target.value)}
                          />
                          <span className="detected-item-unit">
                            {isLowConfidence ? `⚠️ confidence: ${(item.confidence! * 100).toFixed(0)}%` : `detected unit: ${item.unit}`}
                          </span>
                        </div>
                      </div>

                      <div className="detected-item-right">
                        <div className="verify-stepper">
                          <button className="stepper-btn" onClick={() => updateDetectedQty(idx, -1)}>-</button>
                          <span className="stepper-count">{item.quantity}</span>
                          <button className="stepper-btn" onClick={() => updateDetectedQty(idx, 1)}>+</button>
                        </div>

                        <button className="verify-delete-btn" onClick={() => removeDetectedItem(idx)}>
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="verify-footer">
              <button className="verify-action-btn" onClick={handleConfirmVerifiedItems}>
                <span>Add & Confirm Items</span>
                <span className="verify-badge">{detectedItems.length} Items</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================================================
         Meal Completion Success Splash Modal
         ========================================================================== */}
      {showSuccessModal && successModalData && (
        <div className="success-modal-backdrop">
          <div className="success-modal">
            <span className="success-icon">🎉</span>
            <h2 className="success-title">Chef Level Up!</h2>
            <p className="success-desc">
              You cooked <strong>{successModalData.recipeTitle}</strong>. Your pantry has been updated automatically.
            </p>

            <div className="success-stats">
              <div className="success-stat-item">
                <span className="success-stat-val">+{successModalData.xpGained}</span>
                <span className="success-stat-lbl">XP Earned</span>
              </div>
              <div className="success-stat-item">
                <span className="success-stat-val">-{successModalData.deducted.length}</span>
                <span className="success-stat-lbl">Items Used</span>
              </div>
              <div className="success-stat-item">
                <span className="success-stat-val">Decreased</span>
                <span className="success-stat-lbl">Waste Risk</span>
              </div>
            </div>

            <div style={{ width: '100%', textAlign: 'left', fontSize: '12px' }}>
              <div style={{ fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '6px' }}>DEDUCTED FROM STOCK:</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '100px', overflowY: 'auto' }}>
                {successModalData.deducted.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-primary)' }}>
                    <span>• {item.name}</span>
                    <span>{item.qty} {item.unit}</span>
                  </div>
                ))}
              </div>
            </div>

            <button className="success-btn" onClick={() => setShowSuccessModal(false)}>
              Back to Dashboard
            </button>
          </div>
        </div>
      )}
      <input 
        type="file" 
        accept="image/*" 
        capture="environment" 
        ref={cameraInputRef} 
        id="mobile-camera-input"
        style={{ display: 'none' }} 
        onChange={handleMobileCameraScan}
      />
    </div>
  );
}
