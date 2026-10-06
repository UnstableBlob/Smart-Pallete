SMART PALETTE: DESIGN LANGUAGE BLUEPRINT v1.0

======================================================================
0. DIAGNOSIS: WHY THE CURRENT DESIGN READS AS "AI SLOP"
======================================================================

1. Neon mint-green on navy is the default "AI app" palette. It has no brand point of view.
2. Every element is a pill or a heavily rounded card, so nothing has hierarchy.
3. Everything has the same visual weight. Filter chips, tabs, CTAs and badges all compete.
4. The accent color is used everywhere (nav, tags, buttons, ingredient chips), so it stops meaning "action".
5. The "Start Cooking" button is repeated three times at full width, and the cards feel like templates.
6. The unlabeled "+" glyphs, broken image (Garlic Butter Spinach Pasta shows alt text), and stray empty states show missing polish.
7. Dense dark UI with low-contrast gray metadata text hurts readability and accessibility.
8. The scan screen is a camera mock with floating chips, which feels gimmicky rather than functional.
9. Emoji used as food icons, mixed with line icons, creates visual inconsistency.

The fix is not "a new color". It is a system: restraint, a strict type scale, a spacing grid, one accent used sparingly, and real photography.

======================================================================
1. DESIGN PRINCIPLES
======================================================================

1. Food is the hero. UI chrome stays quiet so photography and content lead.
2. Calm, warm, editorial. Think a well-run food publication crossed with a precise productivity tool.
3. One action per area. Each view has exactly one primary action.
4. Information over decoration. If an element does not help the user decide or act, remove it.
5. Consistency beats cleverness. Same component, same behavior, everywhere.
6. Accessible by default. WCAG AA minimum for every text and control pair.

Reference mood (for the team, not to copy): Notion's restraint, Linear's precision, Apple Health's clarity, NYT Cooking's editorial warmth.

======================================================================
2. BRAND PERSONALITY
======================================================================

Voice: clear, friendly, practical. Never "magical" or "AI-powered" in UI copy.
Keywords: fresh, organized, unfussy, trustworthy.
Avoid: neon glows, gradients on surfaces, glassmorphism, emoji as UI icons, exclamation marks.

======================================================================
3. COLOR SYSTEM
======================================================================

Strategy: LIGHT theme is the default and primary design target. Dark is a secondary, properly designed theme (not an inverted afterthought). Neutrals do 90% of the work. One accent color does the rest.

3.1 NEUTRALS (warm gray, slightly warm to suit food)
  Light theme
    bg-canvas        #FAFAF8   page background
    bg-surface       #FFFFFF   cards, panels, inputs
    bg-subtle        #F4F3EF   hover rows, secondary fills, table stripes
    border-default   #E7E5DF   hairlines, card borders
    border-strong    #D2CFC6   inputs, dividers needing emphasis
    text-primary     #1B1B18   headings, body
    text-secondary   #5C5A52   metadata, helper text
    text-tertiary    #8A877D   placeholders, disabled (never for essential info)

  Dark theme
    bg-canvas        #121211
    bg-surface       #1A1A18
    bg-subtle        #232320
    border-default   #2E2E2A
    border-strong    #45443E
    text-primary     #F2F1EC
    text-secondary   #B3B0A5
    text-tertiary    #7F7C72

3.2 ACCENT (single brand color: deep herb green, not neon)
  accent-600  #2F6B4F   primary buttons, active nav indicator, links
  accent-700  #245540   hover / pressed
  accent-100  #E4F0E9   selected backgrounds, subtle highlights
  accent-50   #F1F8F4   very light tint
  On dark theme: accent-400 #5FAE8A for text and icons, accent-600 for filled buttons.

Rule: accent is for primary actions, selected state and focus only. It is never used for decoration, ingredient chips or card backgrounds.

3.3 SEMANTIC COLORS (muted, used only for status)
  success   #2E7D32  on  #E8F3E9
  warning   #B26A00  on  #FDF1DC   (expiring soon, 3-7 days)
  danger    #B3261E  on  #FBE9E7   (expired, errors, allergen conflict)
  info      #1F5F8B  on  #E6F0F7

Expiry scale for pantry: fresh (no color), soon (warning), today/expired (danger). Do not use red for "2 items expiring" banners unless something is actually expired.

3.4 CONTRAST RULES
  Body text on surfaces >= 4.5:1. Large text and UI borders >= 3:1.
  Never place accent-600 text on dark surfaces (use accent-400).

======================================================================
4. TYPOGRAPHY
======================================================================

Typeface pairing (all free, Google Fonts / self-hostable):
  Display / headings: "Fraunces" (soft serif, adds editorial warmth). Use only for page titles and recipe titles.
  UI / body: "Inter" (variable). Everything else.
  Numeric / quantities: Inter with font-variant-numeric: tabular-nums.
  Drop the monospace used for quantity pills ("200 grams").

If you want a simpler single-family system: Inter only, with weight and size doing the hierarchy.

Type scale (rem, base 16px, line-height in parentheses)
  display     2.25 (1.2)   Fraunces 600   page titles
  h1          1.75 (1.25)  Fraunces 600   section titles
  h2          1.25 (1.35)  Inter 600      card titles, panel headers
  h3          1.0  (1.4)   Inter 600      subsection labels
  body        0.9375 (1.55) Inter 400     default text
  body-sm     0.8125 (1.5) Inter 400      metadata, helper text
  caption     0.75 (1.4)   Inter 500      labels, badges, uppercase labels with +0.04em tracking

Rules
  Max 2 weights per screen region (400 and 600).
  Line length for paragraphs: 60-72 characters.
  No all-caps except small captions/section labels.
  Sentence case everywhere ("Scan fridge", not "Scan Fridge").

======================================================================
5. LAYOUT, GRID AND SPACING
======================================================================

Base unit: 4px. Allowed spacing tokens:
  space-1 4 | space-2 8 | space-3 12 | space-4 16 | space-5 24 | space-6 32 | space-7 48 | space-8 64

Containers
  Max content width: 1120px (recipes/pantry), 720px (forms, preferences).
  Page horizontal padding: 24px desktop, 16px mobile.
  Top-level vertical rhythm: 32px between sections, 16px between related blocks.

Grid
  12-column, 24px gutter on desktop.
  Recipe grid: 3 columns >= 1024px, 2 columns >= 640px, 1 column below.
  Pantry: single-column list rows (not two-column cards), see section 8.

Breakpoints: 480 / 640 / 768 / 1024 / 1280.

======================================================================
6. SHAPE, ELEVATION AND BORDERS
======================================================================

Radius scale
  radius-sm 6px   inputs, chips, small buttons
  radius-md 10px  buttons, list rows
  radius-lg 14px  cards, modals
  radius-full     only avatars and toggles. Stop using full-pill for everything.

Borders: 1px solid border-default. Borders replace shadows as the main separator.

Elevation (use sparingly)
  shadow-sm  0 1px 2px rgba(20,20,15,0.06)             cards on hover
  shadow-md  0 4px 16px rgba(20,20,15,0.08)            popovers, dropdowns
  shadow-lg  0 12px 32px rgba(20,20,15,0.12)           modals
No glows, no colored shadows, no gradients on surfaces.

======================================================================
7. ICONOGRAPHY AND IMAGERY
======================================================================

Icons: one set only, Lucide (already likely in your stack). 20px default, 16px inline, 1.5px stroke. Color follows text-secondary unless active.
Replace emoji food icons with either (a) small neutral line icons per category or (b) no icon at all. Category label text is enough.

Photography
  Real, natural-light, top-down or 45 degree food photos. Consistent crop ratio of 4:3 for recipe cards.
  Never leave a card imageless: define a fallback (bg-subtle with a centered category icon) and handle load errors so alt text never shows.
  Add a subtle bottom-to-top scrim (rgba(0,0,0,0.35)) only when text overlays an image.

======================================================================
8. COMPONENT SPECIFICATIONS
======================================================================

8.1 APP SHELL / NAVIGATION
  Desktop: top bar, 64px tall, bg-surface, 1px bottom border. Left: wordmark (text "Smart Palette" in Fraunces 600, no green logo tile). Center-left: nav links. Right: theme toggle (icon button) and the single primary action.
  Nav links: text-secondary, 14px Inter 500. Active: text-primary with a 2px accent underline flush to the bottom border. No filled pill for active state.
  Pantry count: plain small number badge in bg-subtle, not a red dot. Red is reserved for danger.
  Mobile: bottom tab bar with 4 items (Scan, Recipes, Pantry, Profile), icon + 11px label, 56px tall.
  "Quick Scan" in the header is the one primary button. Remove the duplicate "Scan Fridge" nav link or make the nav item "Home".

8.2 BUTTONS
  Primary: accent-600 fill, white text, 40px height, radius-md, 14px Inter 600. Hover accent-700.
  Secondary: bg-surface, 1px border-strong, text-primary. Hover bg-subtle.
  Ghost: no border, text-secondary. Hover bg-subtle.
  Destructive: danger text on ghost; filled danger only in confirm dialogs.
  Sizes: sm 32px, md 40px, lg 48px. Icon buttons are square 36px with radius-md.
  Focus: 2px accent-600 outline with 2px offset, always visible on keyboard focus.
  Rule: max one primary button per viewport region.

8.3 INPUTS, SEARCH, CHECKBOXES
  Height 40px, radius-sm, 1px border-strong, bg-surface. Focus: border accent-600 plus 3px accent-100 ring.
  Search: leading search icon, placeholder text-tertiary, trailing clear button. Remove the stray "+" in the search field.
  Checkbox/toggle cards (dietary options): plain rows with a standard checkbox, label and optional description. Selected state is a checked box and accent-50 background, not a thick green border.

8.4 FILTER CHIPS
  Height 32px, radius-sm, 1px border-default, text-secondary.
  Selected: bg accent-100, border accent-600 at 40% opacity, text accent-700.
  Only the filter row uses chips. Do not reuse chip styling for ingredients or badges.

8.5 TABS / SEGMENTED CONTROL ("Zero-Waste" vs "Quick Run")
  Segmented control: bg-subtle track, 4px padding, radius-md. Selected segment is bg-surface with shadow-sm and text-primary. Counts shown as plain text in text-secondary ("Zero-waste 3").

8.6 RECIPE CARD
  Structure (top to bottom):
    Image 4:3, radius-lg top corners.
    Title: h2, max 2 lines, clamp.
    Meta row: "15 min · Easy" in body-sm text-secondary. Use a single separator dot. Drop the extra "Mild/Medium" label (move spice to the detail page).
    Match line: "Uses 4 of your ingredients" in body-sm. If it is a 100% match, show a small success text badge "In your pantry". Remove the badge overlaying the image.
    Ingredient list: plain comma-separated text ("Spinach, garlic, pasta, butter"), 1 line, truncate with "+2". No green chips.
  Card action: the entire card is clickable and goes to recipe detail. Remove the full-width "Start Cooking" button. The "Start cooking" action lives on the detail page as the primary button.
  Favorite: heart icon button, top-right on image, 32px circle, bg-surface at 90% opacity.
  Hover: border-strong plus shadow-sm. No lift or scale animation.
  Card: bg-surface, 1px border-default, radius-lg, no outer padding around image, 16px padding for text area.

8.7 PANTRY LIST
  Convert the two-column card grid into a clean table-like list.
  Columns: Item (name + category in secondary text), Quantity, Expires, Actions.
  Row height 56px, 1px bottom border, hover bg-subtle.
  Expiry shown as text ("Today", "In 2 days", "12 Oct") with a small status dot or text color only for warning/danger states.
  Row actions (edit, delete) appear on hover and always on mobile as a "..." menu.
  Quantity as plain text with unit, right-aligned, tabular numerals ("200 g").
  Group or filter by category using tabs at the top (underlined tabs, not chips).
  Expiring banner: a single compact notice bar at the top, warning tint (not red), one line of text and a text link "See recipes". Not a large red block with a loud button.
  Fix data issue: items showing past expiry dates (2026-10-02 vs today) must display as "Expired" in danger styling, and yesterday's items should be flagged consistently.

8.8 PREFERENCES / FORM PAGE
  Single column 720px, grouped into labeled sections separated by 32px and a hairline.
  Sections: Dietary needs, Taste, Cooking, Display.
  Dietary: checkbox list in a 2-column grid. "Vegan" and "Vegetarian" should be mutually aware (selecting Vegan auto-covers Vegetarian) and show helper text.
  Spice: slider with 4 labeled stops under the track, current value shown right-aligned. Track in border-strong, filled part accent-600, thumb white with 1px border and shadow-sm.
  Cooking time and servings: segmented controls or a plain select, matching component 8.5.
  Theme: segmented control (System / Light / Dark). Add "System".
  Save: sticky footer bar on mobile; on desktop, a right-aligned primary button. Show a subtle "Saved" confirmation inline for 2 seconds.

8.9 SCAN SCREEN (CAMERA / UPLOAD)
  Make this a functional, simple flow, not a camera mock overlay.
  Layout: centered 720px column.
    Step 1: large dashed drop zone (radius-lg, bg-subtle, 1px dashed border-strong) with text "Upload a photo of your fridge or pantry" and two buttons: "Take photo" (primary) and "Choose file" (secondary).
    Step 2 (after capture): image preview with detected items listed beside or under it as editable rows (name, quantity, remove). Confidence shown only if low, as "Check this".
    Step 3: "Add 9 items to pantry" primary button.
  Remove floating chip overlays ("Veggie & Produce Shelf", "Live Cam") unless they are real, functional controls. Remove the lightning button and close button clutter. Keep one close icon top-left of the flow.
  Show a stepper indicator ("1 Capture, 2 Review, 3 Confirm") in body-sm.

8.10 BADGES / STATUS
  Height 22px, radius-sm, caption type, semantic tint background with matching darker text. Max one badge per item.

8.11 EMPTY, LOADING, ERROR STATES
  Skeletons: bg-subtle blocks with a slow 1.4s shimmer, matching final layout.
  Empty states: simple line icon (40px), one-line title, one-line explanation, one action.
  Errors: inline, danger text with an icon, plus a retry link. No alert popups.

8.12 MODALS AND TOASTS
  Modal: max 480px, radius-lg, shadow-lg, scrim rgba(20,20,15,0.5). Title, body, right-aligned buttons (secondary left, primary right).
  Toast: bottom-center, bg text-primary with inverted text, radius-md, auto-dismiss 4s, with optional "Undo".

======================================================================
9. MOTION
======================================================================

Durations: 120ms (hover, color), 200ms (menus, tabs), 280ms (modals, page transitions).
Easing: cubic-bezier(0.2, 0, 0, 1) for entering, cubic-bezier(0.4, 0, 1, 1) for exiting.
Rules: animate opacity and transform only. No bouncing, no scaling cards on hover, no pulsing glows.
Respect prefers-reduced-motion: disable all non-essential motion.

======================================================================
10. PAGE-BY-PAGE LAYOUT SUMMARY
======================================================================

HOME / SCAN
  Header, page title "Scan your kitchen" (display), subtitle one line, upload zone, small "Recent scans" list below.

RECIPES
  Title "Recipes", search bar plus filter button on one row, filter chips row, segmented control (Zero-waste / Quick), 3-column card grid. Pagination or infinite scroll with skeletons.

RECIPE DETAIL (new, needed)
  Hero image (16:9), title in display, meta row, primary "Start cooking" button, two-column body: ingredients (with "in your pantry" check marks and missing items highlighted) on the left, numbered steps on the right.

PANTRY
  Title "Pantry" plus item count, actions (Add item secondary, Scan fridge primary), expiry notice, category tabs, list rows.

PREFERENCES
  Title, sectioned single-column form, save button.

======================================================================
11. DESIGN TOKENS (IMPLEMENTATION CHEAT SHEET)
======================================================================

Define everything as CSS custom properties on :root and [data-theme="dark"], then map into Tailwind config (or your styling system) so no hard-coded hex values appear in components.

  --color-bg-canvas, --color-bg-surface, --color-bg-subtle
  --color-border-default, --color-border-strong
  --color-text-primary, --color-text-secondary, --color-text-tertiary
  --color-accent-50 / 100 / 600 / 700
  --color-success / warning / danger / info (+ -bg variants)
  --radius-sm / md / lg
  --shadow-sm / md / lg
  --space-1 ... --space-8
  --font-display, --font-ui
  --text-display, --text-h1 ... --text-caption

Suggested stack: React + Tailwind + shadcn/ui (Radix primitives) + Lucide icons. shadcn gives accessible, unstyled-by-default components you theme with the tokens above, which is the fastest route to an industry-grade result.

======================================================================
12. ACCESSIBILITY AND QUALITY CHECKLIST
======================================================================

  All interactive elements reachable by keyboard with visible focus.
  Tap targets >= 44px on mobile.
  Color is never the only status signal (pair with text or icon).
  All images have meaningful alt text and error fallbacks.
  Form fields have visible labels (not placeholder-only).
  Test both themes at 200% zoom.
  Run Lighthouse accessibility (target >= 95) and axe before each release.

======================================================================
13. DO / DON'T QUICK REFERENCE
======================================================================

DO
  Use whitespace generously. Let content breathe.
  Use one accent color, sparingly.
  Use real photography and consistent crops.
  Use sentence case and short, plain copy.
  Make whole cards clickable.

DON'T
  Don't use neon green, glows, gradients or glassmorphism.
  Don't make everything a pill.
  Don't repeat the same CTA on every card.
  Don't mix emoji and line icons.
  Don't use red unless something is actually wrong.
  Don't use monospace for ordinary quantities.

======================================================================
14. ROLLOUT ORDER (SUGGESTED)
======================================================================

  1. Add tokens (colors, type, spacing, radius) and swap theme variables.
  2. Rebuild primitives: Button, Input, Checkbox, Chip, Segmented, Badge.
  3. Rebuild shell: top nav and mobile tab bar.
  4. Rebuild Pantry (list), then Recipes (card), then Preferences.
  5. Redesign the Scan flow and add the Recipe Detail page.
  6. Polish: empty/loading/error states, motion, accessibility pass.

End of blueprint.