# BlockCraft E2E Test Scenarios

Version: 1.0  
Status: Initial Release  
Author: Antigravity (Senior QA Architect)  
Date: 2026-07-11  

---

## E2E-SC-001: New Game Setup, Smelting, and Voxel Placement Journey

**Objective:** Verify that a user can configure a new game, harvest resources, smelt materials, craft advanced tools, place blocks, and verify state modifications.

### 1. Journey Path & UI Transitions
```
[Main Menu] ──(Click "New Game")──► [World Creation Screen]
                                           │
                                    (Click "Create World")
                                           ▼
                                 [World Gen Loader Overlay]
                                           │
                                    (Fade to Black)
                                           ▼
                                    [HUD / Gameplay]
                                           │
                                  (Press E Key)
                                           ▼
                                  [Inventory / Crafting]
```

### 2. Scenario Steps
1. Navigate to the game URL.
2. Click **New Game** on the Main Menu.
3. On the World Creation Screen, input `"Alpha Realm"`, select **World Size: Medium (512x512)**, and select **Difficulty: Easy**. Click **Create World**.
4. Observe the World Gen Loader Overlay. Wait for the loading bar to fill to 100% and transition to 3D gameplay.
5. In active play, verify the player spawns with starting items (e.g., Wood Logs) on a grass biome.
6. Target a Stone block using the camera crosshair and hold **Left Click** to mine it. Verify stone block drops cobble items, which automatically enter the inventory hotbar.
7. Target a Sand block and a Clay block near a water source, mining them to collect Sand and Clay resource items.
8. Target a Coal Ore block in the stone cliffside, mining it to collect Coal.
9. Press **E** to open the Inventory.
10. In the Crafting Panel, search for **Furnace**, verify it is available, and click **Craft Item**. Verify 8 Stone items are consumed, and 1 Furnace block is placed in the inventory.
11. Close the inventory (Press **E**). Select the Furnace block from the hotbar, target a grass block, and **Right Click** to place the Furnace block in the world.
12. Target the placed Furnace block face and click **Right Click** to open its smelting configuration (or drag fuel/materials to it).
13. Smelt 1 Sand item with 1 Coal item. Verify it produces 1 Glass block.
14. Smelt 1 Clay item with 1 Coal item. Verify it produces 1 Brick block.
15. Collect Glass and Brick blocks. Select the Glass block and place it. Select the Brick block and place it.

### 3. Verification Criteria
* **UI Transitions:** Verify fade effects and loader animations render without screen tearing or visual glitching.
* **State Changes:** Zustand store inventory arrays show core counts decreasing/increasing correctly.
* **Persistence Check:** The world block registry updates to reflect the placement of the Furnace, Glass, and Brick blocks in the active coordinate maps.

---

## E2E-SC-002: Save Persistence and Autorecovery Loop

**Objective:** Verify that progress is preserved when the player exits the browser tab and resumes playing later.

### 1. Journey Path & UI Transitions
```
[Gameplay Loop] ──(Place Blocks)──► [Pause Menu Overlay]
                                           │
                                  (Click "Quit to Title")
                                           ▼
                                    [Main Menu]
                                           │
                                    (Click "Continue")
                                           ▼
                                 [World Gen Loader]
                                           ▼
                                    [Resume Game]
```

### 2. Scenario Steps
1. During active play in the world `"Alpha Realm"`, move the player coordinates to `(12.5, 68.0, -45.2)`.
2. Break 3 Dirt blocks directly beneath the player's view, creating a hole. Place 3 Torches on surrounding walls.
3. Open Pause Menu (Press **Escape**).
4. Click **Quit to Title Menu** to trigger save serialization and exit.
5. On the Main Menu, verify the **Continue** button is enabled, showing the world name subtext: *"Resume: Alpha Realm"*.
6. Close the browser tab.
7. Re-open the game URL. Verify the **Continue** button remains enabled.
8. Click **Continue**.
9. Wait for the World Gen Loader to fade out.

### 3. Verification Criteria
* **Position Consistency:** Verify player spawns exactly at coordinates `(12.5, 68.0, -45.2)`.
* **Environment State:** The 3 Dirt blocks remain missing (the hole is preserved), and the 3 Torches are in place and emitting light.
* **IndexedDB Verification:** Verify the `worlds` and `chunk_deltas` stores contain active entries matching the changes.

---

## E2E-SC-003: Device Save Migration (Export / Import Backup)

**Objective:** Verify that users can download world data and transfer progress between different browser sandbox instances.

### 1. Journey Path & UI Transitions
```
[Browser A - Pause Menu] ──(Click "Backup World")──► [Download File]
                                                             │
                                                     (Transfer File)
                                                             ▼
[Browser B - Main Menu] ◄──(Select File in Pick)─── [Click "Import Save"]
        │
(Success Toast Popup)
        ▼
   [Play Now!] ──────────────────────────────────► [Resume gameplay]
```

### 2. Scenario Steps
1. In Browser A, play BlockCraft. Create a world named `"Migration World"`. Modify several blocks in the terrain.
2. Open the Pause Menu and click **Backup World (.blockcraft)**.
3. Browser downloads `Migration World.blockcraft` containing serialized structures.
4. Launch Browser B (clean state, no saves). Verify the **Continue** button is disabled.
5. Click **Import Save** on the Main Menu. Select `Migration World.blockcraft` in the OS file picker.
6. Verify success modal displays: *"World 'Migration World' imported successfully!"*.
7. Click the **Play Now!** button.

### 3. Verification Criteria
* **Schema Conformity:** Save Manager validates the backup format version and layout matching the database specifications.
* **State Recovery:** World seed, inventory items, player health/hunger, and all block delta modifications are successfully written to Browser B's IndexedDB.
* **Launch Success:** The world loads, and the player resumes gameplay with all changes intact.

---

## E2E-SC-004: Tier 1 Mobile Device OOM Prevention Warning

**Objective:** Verify that low-spec or mobile devices are protected from tab crashes when attempting to generate large worlds.

### 1. Journey Path & UI Transitions
```
[World Creation Screen] ──(Select Large World + Create)──► [Soft Warning Modal]
                                                                  │
                                                          (Click "Go Back")
                                                                  ▼
                                                      [World Creation Screen]
```

### 2. Scenario Steps
1. Emulate a Tier 1 mobile device (User-Agent: iOS Safari Mobile, WebGL max renderbuffer size: 4096).
2. Navigate to the game URL, click **New Game**.
3. Select **Large (1024x1024)** world size.
4. Click **Create World**.
5. Observe the UI response.
6. Click **Go Back** on the warning modal. Verify it returns to the World Creation Screen.
7. Click **Create World** again, but this time click **Create Anyway** on the warning modal.

### 3. Verification Criteria
* **Modal Triggering:** The soft warning modal interrupts the generation flow instantly when a Tier 1 device selects the Large world size.
* **Modal Contents:** The modal warns: *"This device has limited memory. We recommend a Small or Medium world for the best performance. A Large world might cause the browser tab to restart."*
* **Generation Execution:** Clicking "Create Anyway" bypasses the check, launching the loading loop while adjusting WebGL memory allocations to match performance guardrails.

---

## E2E-SC-005: 3D Mob Combat, Projectiles, and Saturation Smelting

**Objective:** Verify first-person held items display and handedness transitions, 3D entity movement/physics, combat interactions (melee raycasting, knockback, animal flee / monster chase), Skeleton 3D arrow attacks, and furnace food smelting.

### 1. Journey Path & UI Transitions
```
[Gameplay Loop] ──(Select Sword)──► [Held Item Model Displays]
        │
(Left-Click Mobs) ──(Mob Dies)──► [Direct Inventory Drop Reward]
        │
(Take Damage) ──(Health Declines) ──► [Furnace Smelting GUI]
                                             │
                                     (Cook Raw Beef)
                                             ▼
                                     [Consume Steak]
                                             │
                                   (Saturation Restored)
```

### 2. Scenario Steps
1. Navigate to Settings and set Handedness to **Right-Handed**. Return to gameplay.
2. Select a Wooden Sword in the hotbar. Observe the sword rendering on the lower right of the camera viewport.
3. Click **Left Click** and verify the sword plays a swinging rotation and translation arc.
4. Toggle Handedness to **Left-Handed** in Settings. Observe that the sword instantly mirrors to the left of the screen and swings from the left on left click.
5. Target a Cow spawned nearby. Attack it using the sword. Verify the cow receives knockback velocity, plays a hit sound, and flee-wanders away for 3 seconds.
6. Continue attacking the cow until its health drops to 0. Verify the cow is removed from the world, and Raw Beef and Leather are added directly to the inventory.
7. Open the placed Furnace GUI. Place Coal in the fuel slot and Raw Beef in the smelting input slot.
8. Observe the burning animation and progress bar. Once completed, verify Raw Beef is consumed and 1 Steak is placed in the output slot.
9. Take damage from a Zombie or Skeleton arrow until health is reduced.
10. Put Steak in the active hotbar slot, and right-click to eat it. Verify hunger saturation increases and health regenerates.

### 3. Verification Criteria
* **Swing Geometry Alignment:** Held item positions align precisely with the chosen handedness setting and update orientation dynamically on click.
* **Combat Raycasting Resolution:** Hit checks trigger on closest targeted entity within reach. Block breaking is bypassed during mob hit rays.
* **Drop Logic Execution:** Animal resource drops are added directly to Zustand store inventory arrays without physical drops spawning.
* **Smelting Saturation Mechanics:** Cooked foods yield significantly higher hunger saturation values than raw ingredients when consumed.
