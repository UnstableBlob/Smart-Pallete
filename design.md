## Smart Palette Design System Blueprint

### 1. Design Philosophy & Visual Concept

Smart Palette operates on a **Modern Kitchen Minimalist** aesthetic. The visual language combines organic, fresh culinary tones with crisp digital utility to make cooking low-friction, appetizing, and effortless.

---

### 2. Color System & Semantic Palette

#### Primary & Secondary Palette

* **Fresh Sage (Primary Brand):** `#3A7D44` – *Used for primary CTAs, active tab indicators, 100% Zero-Waste badges, and active toggle states.*
* **Sage Light (Container Tint):** `#E8F5E9` – *Used for primary button backgrounds in secondary states, badge fills, and selected ingredient row highlights.*
* **Terracotta Coral (Accent / Energy):** `#E05A47` – *Used for urgent actions, expiration warnings (<48h), timer stop/reset, and delete actions.*
* **Warm Amber (Warning / Notice):** `#E67E22` – *Used for 90%+ Quick Run match badges, ingredient substitution callouts, and caution states.*
* **Deep Charcoal (Text / High Contrast):** `#1E293B` – *Used for primary headings, active item text, and high-readability cooking step text.*
* **Cool Muted Slate (Secondary Text):** `#64748B` – *Used for metadata (cook times, portion counts, timestamps, inactive icons).*

#### Neutral Surfaces (Light Mode)

* **App Background:** `#F8FAF9` – *Soft off-white with a subtle warm sage tint.*
* **Surface Cards / Modals:** `#FFFFFF` – *Pure white elevated cards.*
* **Subtle Borders & Dividers:** `#E2E8F0` – *1px low-contrast separation lines.*
* **Disabled / Inactive Fill:** `#F1F5F9` – *Disabled button states and empty input fields.*

#### Neutral Surfaces (Dark Mode / Night Cooking)

* **App Background:** `#0F172A` – *Deep slate navy.*
* **Surface Cards / Modals:** `#1E293B` – *Elevated slate cards.*
* **Subtle Borders & Dividers:** `#334155` – *Dark surface divider borders.*
* **High-Contrast Text:** `#F8FAFC` – *Pure off-white text for low-light kitchen reading.*

---

### 3. Typography System

**Primary Font Family:** `Plus Jakarta Sans` or `Inter` (Sans-Serif)

**Numeric / Timer Font Family:** `Space Grotesk` or `JetBrains Mono` (Tabular figures for kitchen timers and quantities)

| Role | Font Weight | Size | Line Height | Usage |
| --- | --- | --- | --- | --- |
| **Display Header** | 800 (Extra Bold) | 28px (1.75rem) | 34px | App section headers, primary modal titles |
| **Section Title** | 700 (Bold) | 20px (1.25rem) | 26px | Recipe titles, card headers, step headers |
| **Subheading / Label** | 600 (Semi-Bold) | 16px (1.00rem) | 22px | Button text, form labels, tab titles |
| **Body Large** | 500 (Medium) | 16px (1.00rem) | 24px | Cooking step instructions, modal body text |
| **Body Regular** | 400 (Regular) | 14px (0.875rem) | 20px | Ingredient descriptions, metadata, pantry notes |
| **Caption / Badge** | 700 (Bold) | 12px (0.75rem) | 16px | Match percentages, spice levels, expiry badges |
| **Timer Display** | 700 (Bold Monospace) | 48px (3.00rem) | 52px | Step countdown timer digits |

---

### 4. Corner Rounding & Geometry System

Smart Palette uses a progressive **Rounded Geometry Matrix** to create a friendly, tactile visual hierarchy:

* **Pill / Fully Rounded (`border-radius: 9999px`):**
* Filter chips, dietary restriction tags, category pills, match score badges, primary action buttons.


* **Extra Large Radius (`border-radius: 24px`):**
* Bottom sheet verification drawers, floating camera viewfinder frames, large recipe hero cards.


* **Large Radius (`border-radius: 16px`):**
* Standard recipe cards, cooking step focus containers, pantry item cards, modal dialogs.


* **Medium Radius (`border-radius: 12px`):**
* Text inputs, quick-add autocomplete search bars, quantity stepper groups (`-` `val` `+`), category selectors.


* **Small Radius (`border-radius: 8px`):**
* Inline tags, tooltips, secondary thumbnail wrappers.



---

### 5. Spacing, Layout & Grid Rules

#### Spacing Scale (4px / 8px Base Grid)

* `xs`: 4px
* `sm`: 8px
* `md`: 12px
* `lg`: 16px (Default container padding)
* `xl`: 24px (Section separation)
* `2xl`: 32px (Screen header spacing)

#### Screen & Layout Specifications

* **Mobile Screen Container:**
* Horizontal margins: `16px`
* Bottom navigation height: `64px` + Safe Area Inset
* Card-to-Card Vertical Gap: `12px`


* **Web / Tablet Responsive Multi-Column Layout:**
* Max Content Width: `1200px` centered
* Sidebar Width (Left Navigation / Active Pantry): `320px` fixed
* Main Content Area (Recipe Grid / Cooking Mode): Flexible (`1fr`)
* Grid Columns: 2-column on Tablet (`>= 768px`), 3-column on Desktop (`>= 1024px`)



---

### 6. Shadows, Elevation & Borders

#### Elevation Scale

* **Level 0 (Flat):** `border: 1px solid #E2E8F0; shadow: none;` (Used for inactive inputs, table rows).
* **Level 1 (Card Rest):** `box-shadow: 0px 2px 8px rgba(0, 0, 0, 0.04); border: 1px solid #F1F5F9;` (Used for recipe cards, pantry item rows).
* **Level 2 (Hover / Active):** `box-shadow: 0px 8px 16px rgba(0, 0, 0, 0.08);` (Used for elevated cards, active drag targets).
* **Level 3 (Modals / Drawers):** `box-shadow: 0px -4px 24px rgba(0, 0, 0, 0.12);` (Used for UI-2 Bottom sheet verification drawer).

#### Border Stroke Styles

* **Camera Focus Bracket:** `2px solid #FFFFFF` with semi-transparent backdrop overlay `rgba(0, 0, 0, 0.45)`.
* **Scanning Laser Line:** `2px solid #3A7D44` with a linear gradient glow `rgba(58, 125, 68, 0.3)`.
* **Focus Ring (Form Controls):** `2px solid #3A7D44` with `2px` offset.

---

### 7. Component-Specific Styling Rules

#### UI-1: Viewfinder Camera Overlay

* **Frame:** Centered overlay container with `border-radius: 24px` and white `24px` corner bracket icons.
* **Shutter Button:** Outer ring `72px x 72px` with `border: 4px solid #FFFFFF`, inner core `58px x 58px` filled with solid `#3A7D44` (or `#FF6B57` when capturing).
* **Flash / Close Buttons:** Floating circles `40px x 40px` with background `rgba(0, 0, 0, 0.5)` and white line icons (`Lucide`).

#### UI-2: Interactive Verification Bottom Drawer

* **Header Drag Handle:** `40px x 4px` rounded bar centered at top with background `#CBD5E1`.
* **Ingredient Item Rows:**
* Background `#FFFFFF`, padding `12px 16px`, `border-radius: 12px`, border `1px solid #E2E8F0`.
* Left emoji / icon container: `36px x 36px` circle with background `#F1F5F9`.
* Quantity Stepper Group: Segmented pill container background `#F8FAF9`, border `1px solid #CBD5E1`. Stepper buttons `-` and `+` are `28px x 28px` with hover state `#E2E8F0`.
* Delete Trigger (`✕`): Soft pink background `#FEE2E2` on hover, icon color `#E05A47`.



#### UI-3: Recipe Catalog Cards & Badges

* **Match Score Badges:**
* *Zero-Waste (100% Match):* Solid `#3A7D44` fill, white bold text, pill shape (`border-radius: 9999px`), padding `4px 10px`.
* *Quick Run (90%+ Match):* Solid `#E67E22` fill, white bold text, pill shape.


* **Substitution Callout Container:**
* Light amber tint background `#FFFBEB`, border `1px solid #FCD34D`, `border-radius: 12px`, padding `12px`, left-border accent `4px solid #E67E22`.



#### UI-4: Interactive Cook Mode

* **Progress Bar Track:** Height `8px`, background `#E2E8F0`, `border-radius: 9999px`. Active fill `#3A7D44`.
* **Timer Card Widget:**
* Background `#0F172A` (Dark slate container for high visibility in bright kitchen light).
* Monospace digits (`48px`) in `#4ADE80` (Bright mint green).
* Timer Controls: Circular icon buttons `48px x 48px`.



#### UI-5: Pantry Inventory & Expiry Banner

* **Expiry Banner Container:**
* Soft red-amber tint `#FEF2F2`, border `1px solid #FCA5A5`, `border-radius: 16px`, left-accent bar `6px solid #E05A47`.


* **Stock Category Pills:** Inactive background `#F1F5F9`, text `#64748B`; Active background `#3A7D44`, text `#FFFFFF`.

---

### 8. Micro-Interactions & Animation Standards

* **Button Press Feedback:** Scale transform down to `0.97` on tap/click with duration `100ms ease-out`.
* **Drawer Slide Transition:** Spring animation (`stiffness: 300`, `damping: 30`) sliding up from `translateY(100%)` to `translateY(0%)`.
* **Item Delete Exit:** Slide out left `translateX(-100%)` + opacity fade to `0` over `200ms ease-in-out`.
* **Scanning Overlay Loop:** Vertical linear translation across camera feed over `2000ms infinite linear alternate`.