# BlockCraft UI Layouts Specification

Version: 1.0  
Status: Initial Release  
Author: Antigravity (Senior Product Designer)  
Date: 2026-07-11  

---

## 1. Global Navigation & Layout Regions

Because BlockCraft is a client-side game, all interfaces fall into two primary types of layout structures:
1. **Menu Viewport Layout:** A centered dialog card layout floating over a stylized 3D environment backdrop (Main Menu, World Creation, Settings).
2. **HUD Overlay Layout:** A transparent HUD grid pinned to the edges of the viewport directly over the active 3D gameplay canvas.

---

## 2. Menu Viewport Layout

Used for the **Main Menu** and **World Creation Screen**. It adapts from desktop wide monitors to tall smartphone screens.

### 2.1. Layout Grid Wireframe (Desktop)
```
+-------------------------------------------------------------+
|                                                             |
|                    [ Stylized 3D Sky Backdrop ]             |
|                                                             |
|                         +-----------+                       |
|                         |  LOGO     |                       |
|                         +-----------+                       |
|                                                             |
|                    +---------------------+                  |
|                    |     MENU CARD       |                  |
|                    |                     |                  |
|                    |  [ Continue Slot ]  |                  |
|                    |  [ New Game ]       |                  |
|                    |  [ Import Save ]    |                  |
|                    |  [ Settings ]       |                  |
|                    |                     |                  |
|                    +---------------------+                  |
|                                                             |
|  [Version v1.0 Beta]               [100% Offline / Privacy] |
+-------------------------------------------------------------+
```

### 2.2. Layout Grid Wireframe (Mobile & Tablet)
```
+-----------------------------------+
|    [ Stylized 3D Sky Backdrop ]   |
|                                   |
|            +-----------+          |
|            |  LOGO     |          |
|            +-----------+          |
|                                   |
|        +-------------------+      |
|        |     MENU CARD     |      |
|        |                   |      |
|        |  [ Continue ]     |      |
|        |  [ New Game ]     |      |
|        |  [ Import Save ]  |      |
|        |  [ Settings ]     |      |
|        +-------------------+      |
|                                   |
| [v1.0]           [Offline Privacy]|
+-----------------------------------+
```

### 2.3. Responsive Rules
* **Desktop & Tablet:** Center card width is fixed at `420px`. The card is centered vertically and horizontally.
* **Mobile (Viewport width < 480px):** Center card expands to `90vw`. Padding inside the card scales from `32px` down to `20px`. Font sizes scale down slightly to ensure all button text remains on a single line.

---

## 3. In-Game HUD Overlay Layout

Floating controls overlaid on top of the 3D viewport canvas. Pinned to screen edges using CSS Flexbox/Grid properties.

### 3.1. Desktop HUD Layout
```
+-------------------------------------------------------------+
| (Top-Left)                                     (Top-Right)  |
| [Time Wheel] [Biome Label]                     [FPS Tracker]|
|                                                             |
|                                                             |
|                              +                              |
|                         (Crosshair)                         |
|                                                             |
|                                                             |
|                                                             |
|                                                             |
|                        (Hearts) (Hunger)                    |
|                        vvvvvvvv vvvvvvvv                    |
|                      +-------------------+                  |
|                      | 1 | 2 | 3 | 4 | 5 |... (Hotbar)      |
|                      +-------------------+ [Autosave Disk]  |
+-------------------------------------------------------------+
```

### 3.2. Mobile & Tablet HUD Layouts

Mobile viewports include virtual joysticks and touch action buttons. The player's thumbs control movement and interaction.

#### Option A: Right-Handed Mode (Default Layout)
```
+-------------------------------------------------------------+
| (Top-Left)                                     (Top-Right)  |
| [Time Wheel]                                   [Pause] [Bag]|
|                                                             |
|                                                             |
|                              +                              |
|                                                             |
|                                                             |
|      +-----+                                                |
|      |  O  |                                  (Mine) (Place)|
|      |     |                                   (O)    (O)   |
|      +-----+                                        (Jump)  |
|   (Joystick Left)                                    (O)    |
|                        (Hearts) (Hunger)                    |
|                      +-------------------+                  |
|                      | 1 | 2 | 3 | 4 | 5 |... (Tappable)    |
+-------------------------------------------------------------+
```

#### Option B: Left-Handed Mode (Mirrored Layout)
```
+-------------------------------------------------------------+
| (Top-Left)                                     (Top-Right)  |
| [Time Wheel]                                   [Pause] [Bag]|
|                                                             |
|                                                             |
|                              +                              |
|                                                             |
|                                                             |
|                                                     +-----+ |
| (Place) (Mine)                                      |  O  | |
|   (O)    (O)                                        |     | |
|     (Jump)                                          +-----+ |
|      (O)                                    (Joystick Right)|
|                        (Hearts) (Hunger)                    |
|                      +-------------------+                  |
|                      | 1 | 2 | 3 | 4 | 5 |... (Tappable)    |
+-------------------------------------------------------------+
```

### 3.3. HUD Components Layout Specifications
1. **Hearts Grid & Hunger Grid:**
   * Pinned to bottom center, centered horizontally.
   * On desktop: Stacked side-by-side above the hotbar.
   * On mobile: Stacked vertically above the hotbar to maximize side margins for thumbs.
2. **Oxygen Bubble Bar:**
   * Floats directly above the Hearts grid when submerged.
3. **Hotbar Grid:**
   * Grid size: `9 columns x 1 row`.
   * On mobile: Hotbar height remains exactly `48px` to ensure touch targets match accessibility standards. The player taps slots directly to switch items.

---

## 4. Inventory & Crafting Dialog Layout

A large split overlay layout showing the storage layout on the left, and the recipe system on the right.

### 4.1. Desktop Split-Screen Layout
```
+-----------------------------------------------------------------+
| INVENTORY & CRAFTING                                        [X] |
+-----------------------------------+-----------------------------+
| PLAYER STORAGE                    | CRAFTING RECIPES            |
|                                   |                             |
|  [Armor Slot Placeholder]         | +-------------------------+ |
|  [ ] [ ] [ ] [ ]                  | | Search/Filter Recipes   | |
|                                   | +-------------------------+ |
|  STORAGE GRID (9x3)               | Scrollable Recipes List:    |
|  [ ] [ ] [ ] [ ] [ ] [ ] [ ] [ ] [ ] | [ ] Planks    (Craftable)   |
|  [ ] [ ] [ ] [ ] [ ] [ ] [ ] [ ] [ ] | [ ] Stick     (Craftable)   |
|  [ ] [ ] [ ] [ ] [ ] [ ] [ ] [ ] [ ] | [ ] Iron Pick (Locked)      |
|                                   |                             |
|  HOTBAR GRID (9x1)                | SELECTED: Wooden Pickaxe    |
|  [1] [2] [3] [4] [5] [6] [7] [8] [9] | Needs: 3 Planks, 2 Sticks   |
|                                   | Status: [ 3/3 ]    [ 4/2 ]  |
|                                   |                             |
|                                   |             [ CRAFT ITEM ]  |
+-----------------------------------+-----------------------------+
```

### 4.2. Mobile Layout (Vertical Responsive Layout)
On mobile devices, the dialog collapses into a single-column container with tab buttons at the top: **[1. Inventory]** and **[2. Crafting]** to toggle between views without cluttering the small screen space.

```
+-----------------------------------+
| INVENTORY & CRAFTING          [X] |
+-----------------------------------+
|    [[ INVENTORY ]]    [ CRAFTING ]|  <-- Rounded Tab Selectors
+-----------------------------------+
| PLAYER STORAGE                    |
|  STORAGE GRID (9x3 scrollable)    |
|  [ ] [ ] [ ] [ ] [ ] [ ] [ ] [ ] [ ] |
|  [ ] [ ] [ ] [ ] [ ] [ ] [ ] [ ] [ ] |
|  [ ] [ ] [ ] [ ] [ ] [ ] [ ] [ ] [ ] |
|                                   |
|  HOTBAR GRID (9x1)                |
|  [1] [2] [3] [4] [5] [6] [7] [8] [9] |
+-----------------------------------+
```

---

## 5. Pause Menu & Settings Modal Layout

A unified settings dialog centered on the screen, blurring the gameplay background.

### 5.1. Desktop & Mobile Settings Layout
```
+-----------------------------------+
|           GAME PAUSED             |
+-----------------------------------+
|   SOUND VOLUME: [========--] 80%  |
|                                   |
|   RENDER DISTANCE:                |
|   [ 8 Chunks ]  [[ 10 ]]  [ 12 ]  |
|                                   |
|   GRAPHICS STYLING:               |
|   [ Low ]  [[ Medium ]]  [ High ] |
|                                   |
|   TOUCH JOYSTICK POSITION:        |
|   [ Left-Handed ]  [[ Right ]]    |
|                                   |
|   +---------------------------+   |
|   |       RESUME GAME         |   |
|   +---------------------------+   |
|   |  BACKUP WORLD (.blockcraft) |   |
|   +---------------------------+   |
|   |     QUIT TO TITLE MENU    |   |
|   +---------------------------+   |
+-----------------------------------+
```
* Note: The "Touch Joystick Position" configuration switch is hidden automatically when loading the game on desktop platforms (where touch controls are disabled).
