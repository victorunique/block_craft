# BlockCraft Visual Guidelines

Version: 1.0  
Status: Initial Release  
Author: Antigravity (Senior Product Designer)  
Date: 2026-07-11  

---

## 1. Design Philosophy

BlockCraft is designed with a **playful, bright, and modern voxel-retro** visual system. It blends pixelated grid elements of voxel sandboxes with clean, friendly modern web components. The aesthetic target is clean paper-like cards, smooth rounded corners, gentle light gradients, and highly recognizable icons. It prioritizes clarity and instant readability, making it accessible and welcoming for kids, families, and casual gamers alike.

### Core Visual Principles
1. **Friendly Geometry:** Avoid sharp corners in overlays; use generous border-radius values (12px to 24px) to make the UI feel soft and approachable.
2. **Clear Affordances:** Buttons look like tactile cards that press down when clicked. Active elements scale slightly or highlight with warm borders.
3. **Tactile Feedback:** Use micro-interactions (e.g., icons bounce when hover-focused, buttons slide down slightly on click).
4. **Vibrant Semantics:** Heart indicators are warm red, hunger bars are organic drumstick colors, and selected hotbar slots are framed in bright gold.

---

## 2. Color System (Light Theme)

To implement this design system in Vanilla CSS, use the following CSS Custom Properties:

```css
:root {
  /* --- Brand Primary & Accents --- */
  --color-primary: #4D96FF;         /* Voxel Sky Blue - primary brand color */
  --color-primary-hover: #357AE8;
  --color-secondary: #FFD93D;       /* Sunshine Amber - highlights & selection active state */
  --color-secondary-hover: #E8C430;
  
  /* --- Semantic Colors --- */
  --color-success: #6BCB77;         /* Fresh Grass Green - positive status, full checks */
  --color-danger: #FF6B6B;          /* Heart Red - health bars, warnings */
  --color-warning: #FF8C32;         /* Sweet Orange - warning labels, durability alerts */
  --color-oxygen: #54BAB9;          /* Bubble Teal - breathing/underwater indicator */
  
  /* --- Neutrals (Bright & Cheerful) --- */
  --color-bg-base: #F9F5F0;         /* Soft Sand - page background backdrop */
  --color-bg-card: #FFFFFF;         /* Paper White - menus, dialogs, buttons */
  --color-bg-overlay: rgba(255, 253, 250, 0.85); /* Semi-transparent cream overlay for HUD/blur */
  
  /* --- Borders & Outlines --- */
  --color-border-light: #EFE8DF;     /* Light Toast - border lines, dividers */
  --color-border-medium: #D0C3B1;    /* Toast Gray - input borders, slot boundaries */
  
  /* --- Typography --- */
  --color-text-main: #2C302E;       /* Charcoal - body text & headers (high contrast) */
  --color-text-muted: #6B706E;      /* Slate Gray - subtitles, versional labels */
  --color-text-white: #FFFFFF;      /* Absolute White - text on colored buttons */

  /* --- Shadows & Depth --- */
  --shadow-soft: 0 8px 24px rgba(180, 160, 140, 0.15);
  --shadow-medium: 0 12px 32px rgba(150, 130, 110, 0.25);
  --shadow-pressed: 0 2px 4px rgba(150, 130, 110, 0.1);
}
```

### Contrast Rules (WCAG Compliance)
* All text-on-background combinations must meet **WCAG 2.1 AA** targets (minimum contrast ratio of 4.5:1 for body text, 3:1 for large text).
* Text placed on top of `--color-primary` (Sky Blue) or `--color-danger` (Heart Red) must use `--color-text-white`.
* Text on top of `--color-secondary` (Sunshine Amber) must use `--color-text-main` (Charcoal) to maintain contrast readability.

---

## 3. Typography

The default typography is set to friendly, geometric sans-serif typefaces. **Outfit** is the preferred font for headings and active HUD numbers, with **Inter** or standard system sans-serif as the fallback for body copy and settings text.

| Text Style | Font Family | Weight | Size | Line Height | CSS Mapping |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Title / Logo** | Outfit | 800 (Extra Bold) | 36px | 1.2 | `font-size: 2.25rem; font-weight: 800;` |
| **Heading 1** | Outfit | 700 (Bold) | 24px | 1.3 | `font-size: 1.5rem; font-weight: 700;` |
| **Heading 2** | Outfit | 600 (Semi-Bold) | 18px | 1.4 | `font-size: 1.125rem; font-weight: 600;` |
| **Body Text** | Inter | 400 (Regular) | 14px | 1.5 | `font-size: 0.875rem; font-weight: 400;` |
| **Label / Button** | Inter | 600 (Semi-Bold) | 14px | 1.2 | `font-size: 0.875rem; font-weight: 600;` |
| **Small Caption** | Inter | 400 (Regular) | 12px | 1.4 | `font-size: 0.75rem; font-weight: 400;` |
| **HUD Counter** | Outfit | 700 (Bold) | 11px | 1.0 | `font-size: 0.6875rem; font-weight: 700;` |

---

## 4. Layout & Spacing System

The interface elements align to a strict 8px layout grid (8px, 16px, 24px, 32px, 48px).

### 4.1. Overlay Dialog Structure
* **Max Widths:**
  * Settings / Pause Modal: `max-width: 480px;` (fits perfectly on mobile and centered on desktop).
  * Inventory Screen: `max-width: 800px;` (horizontal splitscreen on desktop, full-width responsive grids on mobile).
* **Borders & Corners:**
  * Modals and Cards: `border-radius: 20px; border: 4px solid var(--color-border-light);`
  * Buttons and Input Fields: `border-radius: 12px;`

### 4.2. Glassmorphism & Backdrop Filters
For overlays appearing over the active 3D viewport (e.g. Pause Menu, HUD dialogs), apply a soft light blur to separate UI layer context from 3D pixels:
```css
.modal-overlay {
  background-color: rgba(255, 253, 250, 0.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}
```

---

## 5. Component Styling

### 5.1. Buttons (Tactile Cards)
Buttons behave like physical cards that sink slightly when pressed.

```css
.btn-primary {
  background-color: var(--color-primary);
  color: var(--color-text-white);
  border: none;
  border-bottom: 4px solid var(--color-primary-hover);
  padding: 12px 24px;
  border-radius: 12px;
  font-weight: 600;
  transition: transform 0.1s ease, border-bottom-width 0.1s ease;
  box-shadow: var(--shadow-soft);
}

.btn-primary:hover {
  transform: translateY(-2px);
  border-bottom-width: 6px;
  box-shadow: var(--shadow-medium);
}

.btn-primary:active {
  transform: translateY(2px);
  border-bottom-width: 0px;
  box-shadow: var(--shadow-pressed);
}

.btn-disabled {
  background-color: #E2DDD5;
  color: #9A9388;
  border-bottom: 4px solid #C8BFB2;
  cursor: not-allowed;
  transform: none !important;
}
```

### 5.2. Item Slots (Hotbar & Inventory)
Item slots are square frames configured to display active items, stacks, and tool properties.

```css
.item-slot {
  width: 56px;
  height: 56px;
  background-color: var(--color-bg-base);
  border: 3px solid var(--color-border-medium);
  border-radius: 12px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  transition: background-color 0.15s ease;
}

.item-slot:hover {
  background-color: #F0E8DC;
}

.item-slot.selected {
  border-color: var(--color-secondary);
  box-shadow: 0 0 12px rgba(255, 217, 61, 0.6);
  transform: scale(1.08);
  cursor: grabbing;
}

/* Stack Count Badge */
.stack-count {
  position: absolute;
  bottom: 4px;
  right: 6px;
  font-family: 'Outfit', sans-serif;
  font-size: 12px;
  font-weight: 700;
  color: var(--color-text-main);
  background-color: var(--color-bg-overlay);
  padding: 1px 4px;
  border-radius: 6px;
}

/* Tool Durability Progress */
.durability-bar {
  position: absolute;
  bottom: 2px;
  left: 6px;
  width: 44px;
  height: 3px;
  background-color: rgba(0, 0, 0, 0.15);
  border-radius: 2px;
}

.durability-fill {
  height: 100%;
  border-radius: 2px;
  /* Decays dynamically in JS from --color-success to --color-warning to --color-danger */
}
```

---

## 6. Accessibility Specifications

1. **Large Touch Targets:** 
   * On mobile viewports, all interactive elements, buttons, and HUD slots must maintain a minimum bounding dimension of `48px` width and height (matching touch target standard boundaries).
2. **Keyboard Focus States:**
   * Do not remove native focus borders. Provide a custom outline styling matching `--color-primary` (Sky Blue) for focus loops:
     ```css
     *:focus-visible {
       outline: 3px solid var(--color-primary);
       outline-offset: 2px;
     }
     ```
3. **Screen Reader Labels:**
   * Icons used in the HUD and inventory grids must expose descriptive label properties. (e.g. `<button aria-label="Open Inventory Backpack" ...>`)
   * Hotbar slots must report item contents: `<div aria-label="Hotbar Slot 1: Wood Block, 64 items" ...>`
4. **Volume Control Accessibility:**
   * Range sliders for audio configurations must support keyboard arrow key steps (+5% per press) and announce active numeric percentages.
