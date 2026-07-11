# BlockCraft Functional Test Cases

Version: 1.0  
Status: Initial Release  
Author: Antigravity (Senior QA Architect)  
Date: 2026-07-11  

---

## 1. Main Menu Screen (MM)

### Feature: Main Menu Screen
* **Test Case ID:** FT-MM-001  
* **Feature Name:** Continue Game Button State Resolution  
* **Preconditions:** Game loaded in browser. No prior save games exist in IndexedDB.  
* **Steps:**  
  1. Load the game URL `https://blockcraft.game`.  
  2. Observe the "Continue" button on the Main Menu.  
* **Expected Result:** The "Continue" button is disabled (grayed out). Subtext displays: *"No save file found on this browser."*  
* **Priority:** High  

* **Test Case ID:** FT-MM-002  
* **Feature Name:** Continue Game Active Load  
* **Preconditions:** An active save game exists in IndexedDB with UUID `a9b8c7d6-e5f4-3c2b-1a09-876543210fed`, and LocalStorage `blockcraft_last_played` is set to this UUID.  
* **Steps:**  
  1. Load the game URL.  
  2. Observe the "Continue" button.  
  3. Click the "Continue" button.  
* **Expected Result:** The "Continue" button is active (bright green). World name subtext (e.g., *"Resume: Survival World Alpha"*) is visible below the button. Clicking it transitions the screen to the World Generation Loading Overlay.  
* **Priority:** Critical  

* **Test Case ID:** FT-MM-003  
* **Feature Name:** Import Save File Picker  
* **Preconditions:** Browser file permissions allowed. User has a valid `${world_name}.blockcraft` file.  
* **Steps:**  
  1. Click **Import Save** button on the Main Menu.  
  2. Select the valid `.blockcraft` file in the OS file picker.  
  3. Confirm import.  
* **Expected Result:** Success modal pops up: *"World '${world_name}' imported successfully!"* showing a **Play Now!** button. The "Continue" button on the Main Menu is enabled and points to the imported world.  
* **Priority:** High  

* **Test Case ID:** FT-MM-004  
* **Feature Name:** Import Save Corrupt File Error  
* **Preconditions:** User has a corrupted or invalid text file renamed to `.blockcraft`.  
* **Steps:**  
  1. Click **Import Save** button.  
  2. Select the corrupted file.  
* **Expected Result:** Error dialog appears: *"Oops! We couldn't read that backup file. Make sure it's a valid BlockCraft save."* The Main Menu remains in its previous state with no world imported.  
* **Priority:** Medium  

---

## 2. World Creation Screen (WC)

### Feature: World Creation Screen
* **Test Case ID:** FT-WC-001  
* **Feature Name:** World Name Boundary Validation  
* **Preconditions:** Renders the World Creation Screen (Main Menu ➔ New Game).  
* **Steps:**  
  1. Select the "World Name" input field.  
  2. Clear the input and type a name exceeding 24 characters.  
  3. Clear the input entirely (leave empty) and click "Create World".  
* **Expected Result:** The input field prevents typing past 24 characters. If left empty, clicking "Create World" falls back to generating a world named "My World" instead of failing.  
* **Priority:** Medium  

* **Test Case ID:** FT-WC-002  
* **Feature Name:** Seed Input Validation  
* **Preconditions:** World Creation Screen open.  
* **Steps:**  
  1. Click on "Seed" input field.  
  2. Attempt to type alphabetic characters (e.g., "abc-xyz").  
  3. Leave blank and click "Create World".  
* **Expected Result:** The input filters out non-numeric characters. If left blank, the game generates a random 8-digit seed and proceeds.  
* **Priority:** Medium  

* **Test Case ID:** FT-WC-003  
* **Feature Name:** Cancel World Creation  
* **Preconditions:** World Creation Screen open.  
* **Steps:**  
  1. Click the **Cancel** button.  
* **Expected Result:** Renders the Main Menu Screen. All temporary inputs in fields are discarded.  
* **Priority:** High  

---

## 3. World Generation Loading Overlay (WG)

### Feature: World Generation Loading Overlay
* **Test Case ID:** FT-WG-001  
* **Feature Name:** Loader Progress & Stage Reporting  
* **Preconditions:** Parameters entered on World Creation Screen, click "Create World".  
* **Steps:**  
  1. Observe the progress bar and status text during loading.  
* **Expected Result:** A smooth sky-blue progress bar fills from 0% to 100%. Dynamic status messages update periodically, e.g., "Sculpting hills...", "Spawning sheep...", "Hiding diamonds...".  
* **Priority:** Medium  

* **Test Case ID:** FT-WG-002  
* **Feature Name:** Cancel Generation Thread Cleanup  
* **Preconditions:** World Generation Loader active. Web Workers running in background threads.  
* **Steps:**  
  1. Click the **Cancel** button on the loading screen.  
* **Expected Result:** Terrain generation is aborted, Web Workers are terminated, memory buffers are cleaned up, and the screen returns to the Main Menu.  
* **Priority:** High  

---

## 4. In-Game HUD Overlay (HUD)

### Feature: In-Game HUD Overlay
* **Test Case ID:** FT-HUD-001  
* **Feature Name:** Health Bar Heart Grid Updates  
* **Preconditions:** Active 3D gameplay. Player HP = 20 (10 full hearts).  
* **Steps:**  
  1. Trigger damage (e.g., jump from a height of 5 blocks, triggering fall damage).  
  2. Observe the heart icons grid.  
* **Expected Result:** Heart icons shake dynamically when damage is taken. 2 HP loss empties one full heart icon. If health drops to 0, transitions to the Game Over Screen.  
* **Priority:** Critical  

* **Test Case ID:** FT-HUD-002  
* **Feature Name:** Hunger Bar Warning Flash  
* **Preconditions:** Active gameplay. Player hunger level is decreasing.  
* **Steps:**  
  1. Wait/walk until player hunger points drop to 0.  
* **Expected Result:** The drumstick icons empty. The hunger bar flashes to alert the player. Player starts taking starvation damage slowly (1 HP per 2 seconds).  
* **Priority:** High  

* **Test Case ID:** FT-HUD-003  
* **Feature Name:** Underwater Oxygen Bubbles Visibility  
* **Preconditions:** Active gameplay. Player is standing on land.  
* **Steps:**  
  1. Move the player's head coordinates beneath a Water block.  
  2. Observe the HUD.  
  3. Move the player's head back above water.  
* **Expected Result:** The 10 bubble icons float directly above the hearts grid when submerged. Oxygen bubbles pop one by one over time. When emerging, the bubble bar immediately disappears.  
* **Priority:** High  

* **Test Case ID:** FT-HUD-004  
* **Feature Name:** Hotbar Selection Feedback  
* **Preconditions:** Player has items in hotbar slots.  
* **Steps:**  
  1. Scroll the mouse wheel, or press keys `1` to `9`.  
* **Expected Result:** The selected slot index shifts. The selected hotbar card scales up by 10% and outlines in gold. The player's 3D hand updates to display the active item.  
* **Priority:** Critical  

* **Test Case ID:** FT-HUD-005  
* **Feature Name:** Mobile HUD Layout Swapping (Left vs. Right Handed)  
* **Preconditions:** Loaded on mobile viewport width (< 480px) in Landscape orientation. Right-Handed mode is active.  
* **Steps:**  
  1. Access Settings from the pause menu.  
  2. Toggle Touch Joystick Position to "Left-Handed".  
  3. Save settings and return to HUD view.  
* **Expected Result:** The Virtual Joystick swaps to the lower right corner, and the Touch Action buttons (Jump, Place, Mine) move to the lower left. Touch input mapping coordinates update accordingly.  
* **Priority:** High  

---

## 5. Inventory & Crafting Dialog (IC)

### Feature: Inventory & Crafting Dialog
* **Test Case ID:** FT-IC-001  
* **Feature Name:** Inventory Drag and Drop Swap  
* **Preconditions:** Inventory dialog open (Key E or Backpack tapped). Item A is in slot 1. Item B is in slot 2.  
* **Steps:**  
  1. Click and drag Item A from slot 1.  
  2. Hover and drop Item A on slot 2 containing Item B.  
* **Expected Result:** Item A and Item B swap slots successfully. Durability parameters and stack count numbers remain bound to their respective items.  
* **Priority:** High  

* **Test Case ID:** FT-IC-002  
* **Feature Name:** Shift+Click Stack Splitting  
* **Preconditions:** Inventory open. A stack of 64 Wood Logs is in slot 1. Slot 2 is empty.  
* **Steps:**  
  1. Hold Shift and click the Wood Log stack in slot 1.  
* **Expected Result:** The stack splits exactly in half. 32 Wood Logs remain in slot 1, and 32 Wood Logs are placed in the cursor buffer or the first empty storage slot.  
* **Priority:** Medium  

* **Test Case ID:** FT-IC-003  
* **Feature Name:** Mobile Tab Switching  
* **Preconditions:** Mobile viewport active. Inventory Dialog open.  
* **Steps:**  
  1. Tap **[2. Crafting]** tab header.  
  2. Tap **[1. Inventory]** tab header.  
* **Expected Result:** The overlay layout collapses to single-column view. Tapping "Crafting" hides the player inventory grid and displays the recipes list. Tapping "Inventory" restores the storage and hotbar grids.  
* **Priority:** Critical  

* **Test Case ID:** FT-IC-004  
* **Feature Name:** Crafting Transaction Resolution  
* **Preconditions:** Inventory open. Player has 8 Stone blocks, 1 Coal, and 1 Stick.  
* **Steps:**  
  1. Open the Crafting Panel.  
  2. Select the **Furnace** recipe (requires 8 Stone).  
  3. Observe item availability indicator.  
  4. Click the **Craft Item** button.  
  5. Select the **Torch** recipe (requires 1 Coal + 1 Stick).  
  6. Click **Craft Item**.  
* **Expected Result:** Furnace recipe displays active color (available). Clicking "Craft" deducts 8 Stone, updates inventory slots, adds 1 Furnace block, and plays pop sound. Torch recipe displays active color. Clicking it deducts 1 Coal and 1 Stick, and outputs 4 Torches.  
* **Priority:** Critical  

* **Test Case ID:** FT-IC-005  
* **Feature Name:** Crafting Locked Recipe Validation  
* **Preconditions:** Player has 1 Wood Log (can craft Planks, but lacks resources for Wooden Pickaxe).  
* **Steps:**  
  1. Open the Crafting Panel.  
  2. Select the **Wooden Pickaxe** recipe.  
  3. Observe required ingredient card counts.  
  4. Attempt to click the **Craft Item** button.  
* **Expected Result:** The Wooden Pickaxe icon is desaturated. Material card counter shows: *"Planks: 0/3"* (red badge). The **Craft Item** button is disabled (grayed out) and does not respond to clicks.  
* **Priority:** High  

---

## 6. Pause Menu & Settings Screen (PM)

### Feature: Pause Menu & Settings Screen
* **Test Case ID:** FT-PM-001  
* **Feature Name:** Render Distance Segment Selection  
* **Preconditions:** Pause Menu open. Current render distance is 10 chunks.  
* **Steps:**  
  1. Click the **12 Chunks** segmented button.  
  2. Click **Resume Game** to return to play.  
* **Expected Result:** The segment highlights "12 Chunks". Upon resuming, the Game Engine recalculates chunk bounds, streaming in new chunks within the 12-chunk viewport and unloading distant ones.  
* **Priority:** Medium  

* **Test Case ID:** FT-PM-002  
* **Feature Name:** In-Game Volume Slider Update  
* **Preconditions:** Active gameplay with sound playing. Pause Menu open.  
* **Steps:**  
  1. Drag the volume slider from 80% to 20%.  
  2. Release the slider.  
* **Expected Result:** The Web Audio API master gain node volume updates immediately to 20%. Step, mining, and ambient sound effects are attenuated.  
* **Priority:** Low  

* **Test Case ID:** FT-PM-003  
* **Feature Name:** Backup World Download  
* **Preconditions:** Pause Menu open. Active worldId is set in save database.  
* **Steps:**  
  1. Click **Backup World (.json)** button.  
* **Expected Result:** The browser triggers a file download of a file named `${world_name}.blockcraft` containing the JSON representation of world metadata, inventories, and chunk modifications. A toast appears: *"Backup saved! Save this file to keep your progress safe."*  
* **Priority:** Critical  

* **Test Case ID:** FT-PM-004  
* **Feature Name:** Quit Title Menu Autosaver  
* **Preconditions:** Active gameplay. Player has placed 5 stone blocks in the last 10 seconds. Pause Menu open.  
* **Steps:**  
  1. Click **Quit to Title Menu** button.  
* **Expected Result:** The Save Manager immediately triggers a synchronous write of player attributes and chunk modifications to IndexedDB, clears active game memory, releases WebGL buffers, and loads the Main Menu.  
* **Priority:** Critical  
