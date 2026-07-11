# BlockCraft Screen Specifications

Version: 1.0  
Status: Initial Release  
Author: Antigravity (Senior Product Designer)  
Date: 2026-07-11  

---

## 1. Main Menu Screen

### 1.1. Overview
* **Screen Name:** Main Menu Screen
* **Purpose:** The welcoming portal for the application. Allows players to launch a new game, resume their last saved world, customize game configurations, or import save backups.
* **User Goals:** Access gameplay instantly, adjust basic settings, or restore backup progress.

### 1.2. Layout & Hierarchy
* **Background:** A bright, cheerful Sky Biome panoramic background (light blue sky, puffy stylized white clouds, and rotating voxel sun).
* **Header Area:** Centered logo: **BlockCraft** in a chunky, playful typeface with subtle drop shadows and a green grass block icon next to it.
* **Primary Navigation Pane:** A centered container card with soft white/cream styling and rounded corners (`border-radius: 20px`), containing the primary action buttons stacked vertically.
* **Footer Area:** Versional information, privacy notice ("100% Offline, No Accounts Required!"), and developer credit in small, dark gray text.

### 1.3. Screen Components
1. **Logo Block:**
   * *Purpose:* Establish game branding.
   * *States:* Static.
2. **Continue Button:**
   * *Purpose:* Re-enter the last played world immediately.
   * *Behaviour:* Click to load `blockcraft_last_played` world ID.
   * *States:* 
     * **Active (Populated):** Cheerful bright green button with white text. Shows name of last saved world underneath (e.g., *"Resume: World Alpha"*).
     * **Disabled (Empty):** Grayed-out button with subtext: *"No save file found on this browser."*
3. **New Game Button:**
   * *Purpose:* Navigate to the World Creation Screen.
   * *States:* Active (bright sky blue button, hover scales button slightly up by 2%).
4. **Import Save Button:**
   * *Purpose:* Load a `.blockcraft` JSON file to populate IndexedDB.
   * *States:* Active (warm amber button). Clicking triggers native OS file picker.
5. **Settings Button:**
   * *Purpose:* Toggle settings overlay.
   * *States:* Active (clean white card button with dark gray border).

### 1.4. Validation & Rules
* Checks LocalStorage on mount for `blockcraft_last_played` UUID.
* Queries IndexedDB to verify the referenced world exists before enabling the "Continue" button.

### 1.5. Screen States
* **Loading:** Shows a spinning loading block for 100ms on initial asset load.
* **Populated:** Normal menu display.
* **Warning / Error Dialog:** If the imported save is corrupt or not valid, display a modal popup stating: *"Oops! We couldn't read that backup file. Make sure it's a valid BlockCraft save."*

### 1.6. Navigation
* **Previous Screens:** None (Entry Point).
* **Next Screens:** World Creation Screen, World Generation Loading Overlay, Settings Overlay.

---

## 2. World Creation Screen

### 2.1. Overview
* **Screen Name:** World Creation Screen
* **Purpose:** Collect parameters for generating a new procedural world.
* **User Goals:** Name their world, select the world size and difficulty, and choose a custom seed if desired.

### 2.2. Layout & Hierarchy
* **Layout:** Centered cream-colored container card. Responsive grid format displaying configuration fields, with the **Create World** action at the bottom.
* **Sections:**
  1. Header: "Create a New World" (Large, dark charcoal text).
  2. Input Fields: World Name, Custom Seed.
  3. Presets Selection: World Size, Difficulty.
  4. Actions: Create World, Cancel (Back).

### 2.3. Screen Components
1. **World Name Input Field:**
   * *Purpose:* Text box for custom name.
   * *Behaviour:* Limits input to 24 characters. Autopopulates with "My Voxel World".
2. **World Size Selector:**
   * *Purpose:* Choose boundaries for terrain.
   * *Visuals:* Group of three segment buttons: **Small (256x256)**, **Medium (512x512)**, and **Large (1024x1024)**.
   * *Default:* Medium.
3. **Difficulty Selector:**
   * *Purpose:* Choose game balance modifiers.
   * *Visuals:* Group of three buttons: **Easy** (Green), **Medium** (Yellow), and **Hard** (Red).
   * *Default:* Medium.
4. **Seed Input Field:**
   * *Purpose:* Optional seed input.
   * *Behaviour:* Limits input to numeric values. If left blank, automatically generates a random 8-digit seed.
5. **Create World Button:**
   * *Purpose:* Trigger generation.
   * *States:* Active (bright grass green).
6. **Cancel / Back Button:**
   * *Purpose:* Return to Main Menu.
   * *States:* Active (light gray card).

### 2.4. Validation & Rules
* **World Name:** Cannot be empty. If cleared, fallback to "My World" on save.
* **Seed Input:** Only numbers allowed; non-numeric values are filtered out.

### 2.5. Navigation
* **Previous Screen:** Main Menu.
* **Next Screen:** World Generation Loading Overlay.

---

## 3. World Generation Loading Overlay

### 3.1. Overview
* **Screen Name:** World Generation Loading Overlay
* **Purpose:** Keep the player engaged and informed during procedural generation.
* **User Goals:** Monitor loading progress.

### 3.2. Layout & Hierarchy
* **Layout:** Full screen overlay with a soft light blue background.
* **Visual Hierarchy:**
  1. Chunk-like stylized animated loading block spinning in the center.
  2. Main progress bar (rounded, bright sky blue track on white background).
  3. Status Text (e.g., "Sculpting hills...", "Spawning sheep...", "Hiding diamonds...").
  4. **Cancel** button at the bottom.

### 3.3. Screen Components & States
1. **Progress Bar:**
   * *Visuals:* Smooth CSS transition tracking generation percentage (0% to 100%).
2. **Status Log Text:**
   * *Visuals:* Gentle typography showing active Web Worker pipeline stage.
3. **Cancel Button:**
   * *Purpose:* Abort generation, terminate Web Workers, and return to Main Menu.
   * *States:* Active (light gray button).

### 3.4. Navigation
* **Previous Screen:** World Creation Screen or Main Menu.
* **Next Screen:** In-Game HUD (3D Gameplay).

---

## 4. In-Game HUD Overlay

### 4.1. Overview
* **Screen Name:** In-Game HUD Overlay
* **Purpose:** Provide critical player statistics, active inventory hotbar slots, and contextual action controls during active 3D gameplay.
* **User Goals:** Monitor survival parameters (health, hunger, oxygen), select active tools, interact with blocks.

### 4.2. Layout & Hierarchy
* **Layout:** Non-intrusive transparent layout overlaid on the Three.js viewport canvas. Responsive elements pinned to screen edges.
* **Visual Hierarchy:**
  * **Top Left:** Current Time of Day wheel indicator, Active Biome label, and FPS counter.
  * **Center:** Crosshair (subtle gray plus sign `+` at the center of the screen).
  * **Bottom Center:** Survival status bars stacked directly above the Item Hotbar.
  * **Bottom Right:** Autosave notification disk icon.
  * **Top Right:** Touch Menu controls (Inventory button, Pause button) - *visible on mobile viewports only*.
  * **Left Side & Right Side:** Virtual Joystick (movement) and Touch Action Buttons (Jump, Place/Interact, Mine/Attack) - *visible on mobile viewports only*.

### 4.3. Screen Components
1. **Health Bar (Hearts Grid):**
   * *Visuals:* 10 heart icons. Each heart represents 2 HP (total 20 HP).
   * *Interactions:* Shake animation when taking damage. Partial hearts fill or empty dynamically.
2. **Hunger Bar (Food Grid):**
   * *Visuals:* 10 drumstick icons. Each drumstick represents 2 points (total 20 points).
   * *Interactions:* Flash when hunger is empty to warn the player.
3. **Breath / Oxygen Bar:**
   * *Visuals:* A row of 10 small light blue bubble icons.
   * *Visibility:* Only visible when the player's head coordinate is submerged below water blocks.
4. **Hotbar (9 Slots):**
   * *Visuals:* Horizontal row of 9 rounded cream card squares with thin borders.
   * *Active Selection:* Selected slot has a highlighted gold border and scales up by 10%.
   * *Item Icons:* Displays item texture preview (e.g., grass block, wooden sword) and stack count number badge in the bottom-right corner.
   * *Tool Durability Bar:* Mini green-to-red horizontal progress bar beneath the tool icon.
5. **Autosave Toast:**
   * *Visuals:* Small green checkmark disk popping up in the bottom right corner: *"Progress Saved!"* every 30 seconds.
6. **Mobile Virtual Joystick:**
   * *Visuals:* Semi-transparent concentric circles on the lower left.
   * *Interactions:* Drag thumb icon to move player character in 360 degrees.
7. **Mobile Action Buttons:**
   * *Visuals:* Large circular buttons on the lower right (`48px` diameter): **Jump** (up arrow icon), **Interact/Place** (plus `+` icon), **Mine/Attack** (pickaxe/sword icon).

### 4.4. Navigation
* **Pause Overlay Trigger:** Press `Escape` or tap pause icon.
* **Inventory Dialog Trigger:** Press `E` or tap backpack icon.

---

## 5. Inventory & Crafting Dialog

### 5.1. Overview
* **Screen Name:** Inventory & Crafting Dialog
* **Purpose:** Manage gathered resources and craft items.
* **User Goals:** Organize storage inventory, move items to hotbar, craft tools, blocks, or light sources.

### 5.2. Layout & Hierarchy
* **Layout:** Centered modal container with light cream background and soft drop shadows (`box-shadow: 0 10px 30px rgba(0,0,0,0.1)`). Splits into two panels:
  * **Left Panel:** Inventory slots layout. Shows Player character preview, 4 Armor slots (optional placeholder), 27 storage slots (9x3 grid), and 9 hotbar slots.
  * **Right Panel:** Crafting interface. Shows a scrollable recipe list, selected recipe details, input material card counters, and the "Craft" button.

### 5.3. Screen Components
1. **Inventory Slots (Grid):**
   * *Behaviour:* Support drag-and-drop actions. Clicking on a slot lifts the item. Tapping another slot drops it. Shift+Click splits item stack in half.
2. **Recipe List:**
   * *Visuals:* Vertical scrolling grid list of items craftable.
   * *States:* 
     * **Available:** Full-color icon.
     * **Locked / Insufficient Materials:** Desaturated item preview icon.
3. **Recipe Details Panel:**
   * *Visuals:* Large preview of output item, description, and list of required ingredients.
   * *Ingredient Cards:* Show quantity status (e.g., *"Wood: 3 required, 2 owned"* with a red warning badge or green check icon).
4. **Craft Button:**
   * *States:* 
     * **Active (Green):** Enabled when all recipe ingredients are in the player inventory. Clicking plays success pop audio.
     * **Disabled (Gray):** Enabled state is false when ingredients are lacking.

### 5.4. Navigation
* **Exit Actions:** Press `E`, press `Escape`, or click the top-right rounded close button "X" to return to active gameplay.

---

## 6. Pause Menu & Settings Screen

### 6.1. Overview
* **Screen Name:** Pause Menu & Settings Screen
* **Purpose:** Temporarily suspend active gameplay, adjust device-specific options, back up saves, or quit to the main menu.
* **User Goals:** Adjust volume, toggle comfort settings, download world backup, resume or exit safely.

### 6.2. Layout & Hierarchy
* **Layout:** Centered modal card overlaid on top of a blurred gameplay freeze-frame. Clean typography, bright accents.
* **Sections:**
  1. Main Title: "Game Paused" (Charcoal gray text, friendly font).
  2. Settings Configuration Panel (Volume slider, Graphics selector, Render Distance, Left-Handed Layout switch).
  3. Action Row: Resume Game, Export Save, Exit to Main Menu.

### 6.3. Screen Components
1. **Volume Control:**
   * *Visuals:* Horizontal slider bar (0.0 to 1.0) with clean icon indicators (Muted to Speaker).
2. **Render Distance Selector:**
   * *Visuals:* Horizontal segmented selectors: **8 Chunks**, **10 Chunks**, or **12 Chunks**.
3. **Control Layout Toggle:**
   * *Purpose:* Flip mobile HUD controls layout.
   * *Visuals:* Toggle switch: **Left-Handed** vs. **Right-Handed**.
   * *Behaviour:* Swaps the position of Virtual Joystick and Action Buttons instantly on screen mapping.
4. **Backup World Button:**
   * *Purpose:* Trigger immediate download of `.blockcraft` JSON file.
   * *States:* Active (warm amber button).
5. **Resume Button:**
   * *Purpose:* Unfreeze game state and close modal.
   * *States:* Active (bright grass green).
6. **Exit to Main Menu Button:**
   * *Purpose:* Save active progress to IndexedDB, clean up memory, and return to Main Menu.
   * *States:* Active (light gray card button with red border).

### 6.4. Screen States & Validation
* Automatically executes a state-save to IndexedDB on entry to the Pause Menu to ensure safety.

### 6.5. Navigation
* **Destinations:** In-Game HUD, Main Menu Screen.
