### SECTION 1: FRONTEND TECH STACK & LIBRARIES

#### Core Framework & Build Tooling

* **Framework**: React (Vite / Next.js App Router) or React Native (Expo) for cross-platform mobile.


* **Routing**: `react-router-dom` (Web) or `Expo Router` / `React Navigation` (Mobile).


* **State Management**: `Zustand` (Global UI & Pantry state) + `@tanstack/react-query` (API caching & server state management).

#### UI Utilities & Helper Libraries

* **Icons**: `lucide-react` or `react-native-vector-icons`.
* **Camera Integration**: `react-camera-pro` or `webcam-easy` (Web) / `expo-camera` (Mobile).


* **Image Processing & Compression**: `browser-image-resizer` (Web) or `expo-image-manipulator` (Mobile).
* **Animations & Transitions**: `framer-motion` (Web) or `react-native-reanimated` (Mobile).
* **Form & Validation**: `react-hook-form` + `zod` (for preference inputs and manual ingredient additions).
* **HTTP Client**: `axios` or native `fetch` wrapper with interceptors.
* **Timers & Audio**: `use-sound` or `expo-av` (for step-by-step cooking timers and audio alerts).

---

### SECTION 2: APP ROUTING & PAGE MAP

* `/` -> Home / Camera Scan View (Default route)
* `/recipes` -> Recipe Catalog & Recommendations
* `/cook/:recipeId` -> Step-by-Step Guided Cook Mode
* `/pantry` -> Digital Pantry & Inventory Management
* `/profile` -> User Preferences & Behavioral Profiling Settings

---

### SECTION 3: PAGE-BY-PAGE UI BLUEPRINT & DIV HIERARCHY

#### 3.1 Camera & Photo Scan Screen (`/scan`)

##### DIV Structure & Layout Tree

```text
<div id="camera-page-container">
  <header id="scan-header-bar">
    <button id="btn-close-camera" />
    <div id="camera-title-badge">Smart Palette Scan</div>
    <button id="btn-toggle-flash" />
  </header>

  <main id="viewfinder-wrapper">
    <div id="camera-feed-container">
      <video id="webcam-preview" /> <!-- or Expo Camera View -->
      <div id="viewfinder-overlay-frame">
        <div class="corner-bracket top-left" />
        <div class="corner-bracket top-right" />
        <div class="corner-bracket bottom-left" />
        <div class="corner-bracket bottom-right" />
        <p id="viewfinder-instruction-text">Align open fridge or pantry shelves within frame</p>
      </div>
    </div>
  </main>

  <footer id="camera-controls-bar">
    <div id="controls-wrapper">
      <button id="btn-gallery-picker">
        <input type="file" id="input-hidden-file" accept="image/*" />
      </button>
      <button id="btn-shutter-outer">
        <div id="btn-shutter-inner" />
      </button>
      <button id="btn-scanning-tips-modal" />
    </div>
  </footer>

  <!-- Modal Component Integration -->
  <VerificationModal />
</div>

```

##### UI Elements & Controls

* `btn-close-camera`: Icon button (X) to navigate back to `/pantry`.
* `btn-toggle-flash`: Toggles native device torch state (On/Off/Auto).
* `viewfinder-overlay-frame`: High-contrast dashed viewport guide.
* `btn-gallery-picker`: Opens system file gallery to select a pre-existing fridge photo.


* `btn-shutter-outer`: Triggers image frame capture, shutter animation, and haptic feedback.

##### Backend API Placeholders & Handlers

* `handleImageCapture(imageUri: string)`:
* `// PLACEHOLDER API CALL`: `POST /api/v1/vision/scan`
* `// PAYLOAD`: `{ imageUri: string, userId: string }`
* `// RESPONSE`: `Array<{ id: string, name: string, quantity: number, unit: string, confidence: number }>`


* `handleFileUpload(file: File)`:
* `// PLACEHOLDER API CALL`: `POST /api/v1/cloudinary/upload-unsigned`



---

#### 3.2 Interactive Ingredient Verification Drawer (`VerificationModal`)

##### DIV Structure & Layout Tree

```text
<div id="verification-drawer-backdrop" class="modal-overlay">
  <div id="verification-drawer-container" class="bottom-sheet">
    <div id="drawer-drag-handle" />

    <header id="drawer-header">
      <div id="header-text-group">
        <h2 id="drawer-title">Detected Ingredients</h2>
        <span id="badge-item-count">0 Items Found</span>
      </div>
      <button id="btn-reset-scan">Rescan</button>
    </header>

    <div id="scrollable-ingredient-list">
      <!-- Item Row Component Loop -->
      <div class="ingredient-card-row">
        <span class="item-icon-emoji">🥦</span>
        <input type="text" class="input-item-name" value="Broccoli" />
        <div class="quantity-stepper-group">
          <button class="btn-step-decrement">-</button>
          <input type="number" class="input-quantity-val" value="1" />
          <button class="btn-step-increment">+</button>
        </div>
        <select class="select-unit-type">
          <option value="pcs">pcs</option>
          <option value="grams">g</option>
          <option value="heads">heads</option>
        </select>
        <button class="btn-remove-item">✕</button>
      </div>
    </div>

    <div id="quick-add-bar-container">
      <input type="text" id="input-quick-add" placeholder="Add missing item (e.g., Milk)..." />
      <button id="btn-quick-add-submit">Add</button>
      <div id="autocomplete-suggestions-popover" class="hidden">
        <ul id="suggestions-list-group" />
      </div>
    </div>

    <footer id="drawer-footer-actions">
      <button id="btn-confirm-ingredients" class="btn-primary-block">
        Find Matching Recipes (<span id="confirmed-count-badge">0</span>)
      </button>
    </footer>
  </div>
</div>

```

##### UI Elements & Controls

* `drawer-drag-handle`: Swipeable bar to collapse/expand modal sheet.


* `ingredient-card-row`: Rendered list item containing editable text input, stepper control, unit selector, and single-tap delete.


* `input-quick-add`: Text field with live autocomplete to add obscured/unphotographed items.


* `btn-confirm-ingredients`: Submit button that saves confirmed stock and navigates to `/recipes`.



##### Backend API Placeholders & Handlers

* `handleConfirmVerification(verifiedItems: Array<Ingredient>)`:
* `// PLACEHOLDER API CALL`: `POST /api/v1/pantry/verify-and-sync`
* `// PAYLOAD`: `{ items: verifiedItems, userId: string }`
* `// SUCCESS CALLBACK`: `router.push('/recipes')`



---

#### 3.3 Recipe Recommendations Dashboard (`/recipes`)

##### DIV Structure & Layout Tree

```text
<div id="recipes-page-container">
  <header id="dashboard-header">
    <div id="top-search-row">
      <input type="search" id="recipe-search-input" placeholder="Search recipes or ingredients..." />
      <button id="btn-open-filter-drawer">
        <span class="icon-filter" />
      </button>
    </div>

    <!-- Dietary Filter Quick Chips -->
    <div id="horizontal-filter-scroll">
      <button class="chip-filter active">All</button>
      <button class="chip-filter">Keto</button>
      <button class="chip-filter">Vegan</button>
      <button class="chip-filter">Gluten-Free</button>
      <button class="chip-filter">Under 20 Mins</button>
    </div>

    <!-- Segmented Tab Bar -->
    <div id="segmented-tab-container">
      <button id="tab-zero-waste" class="tab-btn active">
        Zero-Waste <span class="tab-badge-count">100% Match</span>
      </button>
      <button id="tab-quick-run" class="tab-btn">
        Quick Run <span class="tab-badge-count">90%+ Match</span>
      </button>
    </div>
  </header>

  <main id="recipe-card-grid">
    <!-- Recipe Card Template -->
    <article class="recipe-card">
      <div class="card-image-wrapper">
        <img class="recipe-cover-img" src="" alt="Recipe Name" />
        <span class="badge-match-score percent-100">100% Pantry Match</span>
        <button class="btn-bookmark-recipe">♥</button>
      </div>

      <div class="card-content-body">
        <h3 class="recipe-title">Garlic Butter Spinach Pasta</h3>
        <div class="recipe-meta-row">
          <span class="meta-item cook-time">⏱ 15 mins</span>
          <span class="meta-item spice-level">🌶 Medium</span>
          <span class="meta-item difficulty">Easy</span>
        </div>

        <div class="utilized-ingredients-preview">
          <span class="label">Uses from pantry:</span>
          <div class="pill-group">
            <span class="pill-stock-used">Spinach</span>
            <span class="pill-stock-used">Garlic</span>
            <span class="pill-stock-used">Pasta</span>
          </div>
        </div>

        <!-- Conditional Callout for Quick Run Tab -->
        <div class="substitution-callout-box warning-light">
          <span class="icon-info" />
          <p class="substitution-text">
            Missing: <strong>Sour Cream</strong>. 
            <span class="sub-suggestion">Substitute with Plain Yogurt in pantry.</span>
          </p>
        </div>
      </div>

      <footer class="card-footer-action">
        <button class="btn-start-cooking" data-recipe-id="rec_123">
          Start Cooking
        </button>
      </footer>
    </article>
  </main>
</div>

```

##### UI Elements & Controls

* `segmented-tab-container`: Switches between 100% matched recipes (Zero-Waste) and 90%+ matched recipes missing 1–2 minor items (Quick Run).


* `substitution-callout-box`: Highlight box detailing missing items and recommended in-pantry replacements.


* `btn-start-cooking`: Route handler button navigating directly to `/cook/:recipeId`.



##### Backend API Placeholders & Handlers

* `fetchRecipes(filters: FilterState)`:
* `// PLACEHOLDER API CALL`: `GET /api/v1/recipes/generate?tab=zero-waste`
* `// RESPONSE`: `Array<{ id: string, title: string, matchScore: number, missingItems: Array<string>, substitutes: Array<{ missing: string, use: string }> }>`



---

#### 3.4 Interactive Cooking Step Mode (`/cook/:recipeId`)

##### DIV Structure & Layout Tree

```text
<div id="cook-mode-page-container">
  <header id="cook-mode-header">
    <button id="btn-exit-cook-mode">✕ Exit</button>
    <div id="recipe-progress-indicator">
      <span id="step-counter-text">Step 2 of 5</span>
      <div id="progress-bar-track">
        <div id="progress-bar-fill" style="width: 40%" />
      </div>
    </div>
  </header>

  <main id="cook-step-card-viewport">
    <div id="step-card-container" class="card-focus">
      <div id="step-number-badge">Step 02</div>
      <h2 id="step-instruction-heading">
        Sauté chopped garlic and spinach in olive oil until wilted.
      </h2>

      <!-- Embedded Step Timer (Conditional rendering if step requires timing) -->
      <div id="interactive-timer-widget">
        <div id="timer-display-digits">03:00</div>
        <div id="timer-controls-group">
          <button id="btn-timer-start">Start Timer</button>
          <button id="btn-timer-pause">Pause</button>
          <button id="btn-timer-reset">Reset</button>
        </div>
      </div>

      <!-- Step Specific Ingredients List -->
      <div id="step-ingredients-checklist">
        <h3>Needed for this step:</h3>
        <ul id="checklist-group">
          <li class="checklist-item">
            <input type="checkbox" id="chk-ing-1" />
            <label for="chk-ing-1">2 cloves Garlic (Minced)</label>
          </li>
          <li class="checklist-item">
            <input type="checkbox" id="chk-ing-2" />
            <label for="chk-ing-2">200g Fresh Spinach</label>
          </li>
        </ul>
      </div>
    </div>
  </main>

  <footer id="cook-mode-navigation-bar">
    <button id="btn-prev-step" class="btn-secondary">Previous</button>
    <button id="btn-next-step" class="btn-primary">Next Step</button>
    
    <!-- Rendered on final step -->
    <button id="btn-complete-meal" class="btn-success-block hidden">
      Finish & Complete Meal
    </button>
  </footer>
</div>

```

##### UI Elements & Controls

* `progress-bar-fill`: Visual bar tracking progress across recipe steps.


* `interactive-timer-widget`: Built-in timer with controls for time-sensitive tasks.


* `btn-complete-meal`: Prominent final action button triggering inventory subtraction.



##### Backend API Placeholders & Handlers

* `handleCompleteMeal(recipeId: string, usedIngredients: Array<Item>)`:
* `// PLACEHOLDER API CALL`: `POST /api/v1/pantry/deduct-consumed`
* `// PAYLOAD`: `{ recipeId: recipeId, consumed: usedIngredients, timestamp: Date.now() }`
* `// SUCCESS CALLBACK`: `router.push('/pantry?mealCompleted=true')`



---

#### 3.5 Digital Pantry & Expiry Dashboard (`/pantry`)

##### DIV Structure & Layout Tree

```text
<div id="pantry-page-container">
  <header id="pantry-dashboard-header">
    <div id="pantry-title-row">
      <h1>My Pantry Inventory</h1>
      <button id="btn-open-scan-page" class="btn-accent">+ Scan Fridge</button>
    </div>

    <!-- Alert Box for Expiring Stock -->
    <section id="expiry-warning-banner" class="banner-amber">
      <div id="warning-icon-group">⚠️️</div>
      <div id="warning-text-content">
        <h4>3 Items Expiring Soon</h4>
        <p>Milk, Spinach, and Tomatoes expire within 48 hours.</p>
      </div>
      <button id="btn-cook-expiring-items">Cook These Now</button>
    </section>

    <div id="pantry-category-pills">
      <button class="pill-category active">All (14)</button>
      <button class="pill-category">Produce</button>
      <button class="pill-category">Dairy</button>
      <button class="pill-category">Pantry Staples</button>
      <button class="pill-category">Meat/Seafood</button>
    </div>
  </header>

  <main id="pantry-inventory-list">
    <!-- Stock Item Row -->
    <div class="pantry-item-card">
      <span class="pantry-item-emoji">🥦</span>
      <div class="pantry-item-info">
        <h4 class="item-name">Broccoli</h4>
        <span class="item-meta">Added 2 days ago • Category: Produce</span>
      </div>
      <div class="pantry-item-qty">
        <span class="qty-label">1 head</span>
      </div>
      <div class="pantry-item-actions">
        <button class="btn-edit-stock">✎</button>
        <button class="btn-delete-stock">🗑</button>
      </div>
    </div>
  </main>
</div>

```

##### UI Elements & Controls

* `expiry-warning-banner`: Banner highlighting items near expiration (<= 48 hours).


* `btn-cook-expiring-items`: Quick filter button that passes expiring items into `/recipes`.
* `btn-open-scan-page`: Direct trigger navigating back to `/scan`.

##### Backend API Placeholders & Handlers

* `fetchPantryInventory()`:
* `// PLACEHOLDER API CALL`: `GET /api/v1/pantry/inventory`
* `// RESPONSE`: `{ activeStock: Array<Ingredient>, expiringSoon: Array<Ingredient> }`


* `handleUpdateStock(itemId: string, newQty: number)`:
* `// PLACEHOLDER API CALL`: `PATCH /api/v1/pantry/item/:itemId`



---

#### 3.6 User Preferences & Profile Page (`/profile`)

##### DIV Structure & Layout Tree

```text
<div id="profile-page-container">
  <header id="profile-header">
    <h1>Taste & Preference Profile</h1>
  </header>

  <main id="profile-form-wrapper">
    <form id="form-preferences">
      <!-- Section: Static Hard Constraints -->
      <section class="pref-group-box">
        <h3>Dietary Restrictions & Allergies</h3>
        <div class="checkbox-grid">
          <label class="checkbox-tile">
            <input type="checkbox" name="diet" value="vegan" />
            <span>Vegan</span>
          </label>
          <label class="checkbox-tile">
            <input type="checkbox" name="diet" value="gluten-free" />
            <span>Gluten-Free</span>
          </label>
          <label class="checkbox-tile">
            <input type="checkbox" name="diet" value="nut-allergy" />
            <span>Nut Allergy</span>
          </label>
        </div>
      </section>

      <!-- Section: Dynamic Preferences -->
      <section class="pref-group-box">
        <h3>Spice Tolerance</h3>
        <input type="range" id="slider-spice-level" min="0" max="3" step="1" />
        <div id="spice-labels-row">
          <span>Mild</span>
          <span>Medium</span>
          <span>Hot</span>
          <span>Extra Hot</span>
        </div>
      </section>

      <section class="pref-group-box">
        <h3>Target Cooking Speed</h3>
        <select id="select-prep-speed">
          <option value="quick">Quick (< 20 mins)</option>
          <option value="medium">Standard (20-45 mins)</option>
          <option value="leisurely">No preference</option>
        </select>
      </section>

      <footer id="profile-form-footer">
        <button type="submit" id="btn-save-preferences" class="btn-primary">
          Save Preferences
        </button>
      </footer>
    </form>
  </main>
</div>

```

##### UI Elements & Controls

* `slider-spice-level`: Slider mapping spice levels to user preference vectors.


* `checkbox-tile`: Toggle selector for dietary restrictions.



##### Backend API Placeholders & Handlers

* `handleSavePreferences(formData: ProfilePreferences)`:
* `// PLACEHOLDER API CALL`: `PUT /api/v1/user/preferences`
* `// PAYLOAD`: `{ userId: string, preferences: formData }`



---

### SECTION 4: GLOBAL STATE MANAGEMENT (ZUSTAND STORE SPECIFICATION)

```typescript
// PLACEHOLDER: Global State Store Blueprint (store/useAppStore.ts)

interface PantryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  addedAt: string;
  expiryDate?: string;
}

interface AppState {
  // User Authentication
  userId: string | null;
  
  // Active Scan Buffer
  isScanning: boolean;
  detectedBuffer: PantryItem[];
  setDetectedBuffer: (items: PantryItem[]) => void;
  
  // Active Pantry Inventory
  pantryStock: PantryItem[];
  setPantryStock: (stock: PantryItem[]) => void;
  
  // Active Cooking Session
  activeRecipe: any | null;
  currentStepIndex: number;
  setActiveRecipe: (recipe: any) => void;
  nextStep: () => void;
  prevStep: () => void;
}

```

---

### SECTION 5: UI SYSTEM STATES & SKELETON LOADERS

#### 5.1 Scan & Inference Loading State

When the user triggers the shutter button in `/scan`:

1. Render a full-screen blurred backdrop overlay over the video camera view.
2. Render an animated glowing scanning line overlay moving vertically across the view.
3. Display pulsing status text messages cycling every 800ms:
* *"Analyzing fridge snapshot..."*
* *"Identifying ingredients..."*
* *"Matching pantry inventory..."*



#### 5.2 Empty States

* **Empty Pantry View (`/pantry`)**: Render a graphic illustration of an open empty fridge, accompanied by body text: *"Your digital pantry is currently empty."* and a primary call-to-action button: **"Take a Photo of Your Fridge"**.


* **Zero Recipe Matches (`/recipes`)**: Render an icon illustration of a mixing bowl, body text: *"No 100% zero-waste recipes found for these exact ingredients."*, and an action button: **"Switch to Quick Run Tab"**.