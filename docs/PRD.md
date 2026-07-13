# BlockCraft Product Requirements Document (PRD)

Version: 1.0  
Status: Initial Release  
Author: Antigravity (AI Product Manager)  
Date: 2026-07-11  

---

## 1. Executive Summary

BlockCraft is a browser-native 3D voxel sandbox game designed to deliver a high-quality, frictionless single-player survival and building experience. Built as a showcase of modern frontend technologies and AI-assisted software engineering, BlockCraft runs entirely in the client-side browser with **no backend servers, databases, or user accounts**. 

Designed for stable production performance, the game features procedural world generation, a core survival/crafting loop, animal and monster entities with basic AI, and automatic local saving. The architecture is engineered to run at a stable 60 FPS on desktop and 30+ FPS on mobile, maintaining a lightweight memory footprint under 500 MB.

---

## 2. Background

Voxel sandbox games like Minecraft have maintained massive global popularity, but they often come with high friction for casual play: large downloads, system installation steps, account creation requirements, and device resource limitations. 

BlockCraft addresses this friction by exploiting WebGL 2.0 and modern browser APIs to deliver a direct, instant-play web link. The project is designed from day one to be developed using an AI-first, modular architecture that supports Test-Driven Development (TDD) and clean segregation of subsystems.

---

## 3. Problem Statement

1. **High Play Friction:** Downloading desktop launchers, managing Java environments, or installing app packages restricts immediate accessibility.
2. **Account Fatigue & Privacy Concerns:** Mandatory account registration, cloud sign-in, and aggressive telemetry tracking turn away privacy-conscious casual players.
3. **Hardware Barriers:** Traditional 3D voxel render loops are highly resource-intensive, causing poor framerates and tab crashes on low-end laptops, Chromebooks, or mobile browsers.
4. **Data Ownership:** Lack of simple offline tools to backup, migrate, or share personal sandbox progress outside of proprietary cloud systems.

---

## 4. Product Vision Alignment

BlockCraft satisfies the vision of a **zero-install, zero-account, client-only** voxel experience:
* **Frictionless Play:** Accessible instantly via URL. No download, install, or account sign-up.
* **Privacy-First Design:** All data (inventories, worlds, settings) remains strictly in the user's browser sandbox. Inherently compliant with GDPR and COPPA.
* **Aesthetic Excellence:** Modern, premium React-based HUD overlaid on a polished 3D voxel world with smooth day/night transitions.
* **Production-Grade Quality:** Explicitly not a prototype; designed for stable, highly optimized long-term play.

---

## 5. Goals

### Core Capabilities (Version 1.0 / Beta)
* **Procedural Voxel World:** Randomly generated worlds featuring diverse terrain biomes using simplex noise.
* **Frictionless Sandbox Loop:** Gathering resources, destroying/placing blocks, crafting tools, and constructing shelters.
* **Survival Mechanics:** Real-time health and hunger simulation.
* **Entities & AI:** Peaceful animals (food/resource sources) and aggressive night monsters (combat challenge).
* **Tiered Difficulty:** Easy, Medium, and Hard difficulty levels.
* **Persistent Local Save:** Automatic local saving via IndexedDB, augmented by an export/import file backup utility.
* **Responsive HUD & Cross-Device Controls:** Unified UI layout supporting keyboard/mouse (PointerLock) and mobile touch controllers (Virtual Joystick).
* **PWA Capability:** Support offline play via Progressive Web App registration.

---

## 6. Non-goals

* **Multiplayer:** No peer-to-peer sync, WebSockets, or multi-user lobbies. Strictly offline single-player.
* **Cloud Accounts:** No centralized user accounts, cloud databases, or cross-device cloud sync.
* **Microtransactions:** No in-game stores, ads, cosmetics, or premium locking.
* **Ultra-Realistic Physics:** No fluid dynamics, structural gravity limits for blocks, or soft-body deformations.

---

## 7. Target Users

* **Casual Gamers & Families:** Seeking an instant-access, ad-free, child-safe sandbox environment.
* **Students & Chromebook Users:** Playing on hardware-restricted devices (e.g., school laptops) that block local installations.
* **Web & AI Developers:** Interested in studying a high-performance React Three Fiber game with modular components and clean state separation.

---

## 8. Personas

### Persona A: Leo (8, Student)
* **Context:** Uses a school-issued Chromebook during free periods. Local installs and browser extensions are strictly locked down.
* **Needs:** Direct, instant access via URL. Simple, intuitive controls that run smoothly on low-spec integrated graphics. Safe environment with no chat or external advertisements.
* **Usage Journey:** Clicks the link, selects "Easy" and "Small World", builds a quick dirt house, and returns to class knowing the game autosaved.

### Persona B: Sarah (28, Casual Gamer)
* **Context:** Plays short 15-minute sessions on her iPad while commuting or relaxing. 
* **Needs:** Native-feeling touch controls, responsive UI, stable offline play, and absolute privacy.
* **Usage Journey:** Installs the PWA on her home screen. Plays offline during her train ride, harvesting wood and iron to upgrade her equipment.

### Persona C: Alex (23, Frontend Engineer)
* **Context:** Interested in game development but doesn't want to learn C++ or Unity. 
* **Needs:** A reference implementation of React Three Fiber, Zustand, and IndexedDB that uses clean directory structures and TDD.
* **Usage Journey:** Clones the codebase, reads the PRD, inspects the unit tests, and contributes a custom block type to the open-source repository.

---

## 9. User Journeys

### 9.1. Creating a New Game
```
1. User navigates to URL ➔ 2. Main Menu renders instantly (no loading screens) 
➔ 3. User clicks "New Game" ➔ 4. Chooses World Size (256x256, 512x512, 1024x1024) and Difficulty (Easy, Medium, Hard)
➔ 5. Loader displays procedural terrain generation ➔ 6. Player spawns in the world with initial hotbar items.
```

### 9.2. Resuming an Existing Game
```
1. User returns to URL ➔ 2. "Continue" button is active (checks IndexedDB check) 
➔ 3. User clicks "Continue" ➔ 4. Game loads world state, player coordinates, inventory, and time from IndexedDB 
➔ 5. Player resumes exactly where they left off.
```

### 9.3. Exporting & Importing Saves
```
1. In Settings, user clicks "Export Save" ➔ 2. A compressed JSON file (.blockcraft) downloads to disk
➔ 3. On a different device/browser, user visits main menu ➔ 4. Clicks "Import Save" and uploads file
➔ 5. Game populates IndexedDB and launches the imported world state.
```

---

## 10. User Stories

1. **As a player**, I want to explore a 3D world with distinct biomes (Plains, Forest, Desert, Snow, Mountains) so that the environment feels varied and visually engaging.
2. **As a player**, I want to destroy blocks by clicking on them so that I can harvest raw resources (Wood, Stone, Coal, Sand).
3. **As a player**, I want to place blocks from my inventory against existing blocks so that I can construct shelters and creative buildings.
4. **As a player**, I want to open an inventory screen to view all gathered items, reorganize them, and drag them onto my hotbar for quick access.
5. **As a player**, I want to craft stronger tools (Axes, Pickaxes, Swords) using raw materials so that I can mine blocks faster and fight monsters more effectively.
6. **As a player**, I want to manage health and hunger bars, eating food collected from peaceful animals, so that the survival mode feels challenging and active.
7. **As a player**, I want monsters (Zombies, Skeletons, Spiders) to spawn at night so that I must construct defensive structures or fight to survive.
8. **As a player**, I want my world, inventory, player position, and game time to automatically save in the background so that I never lose progress when closing the browser tab.
9. **As a player**, I want to adjust settings (graphics quality, render distance, mouse sensitivity, sound volume) in real-time to optimize game performance for my device.
10. **As a mobile player**, I want a virtual joystick and touch action buttons on my screen so that I can play comfortably without a keyboard and mouse.

---

## 11. Functional Requirements

### 11.1. World & Terrain Subsystem
* **World Sizes:** Restricted to three configurable bounds: Small (`256 × 256`), Medium (`512 × 512`), and Large (`1024 × 1024` blocks). The maximum world depth is fixed at `128` blocks (from bedrock to sky limit).
* **Procedural Noise:** Simplex-noise generated heightmaps determining terrain elevation, biome distribution, and cave density.
* **Biomes:** 
  * *Plains:* Flat terrain, grass, flowers.
  * *Forest:* Densely populated with Oak trees, high wood density.
  * *Desert:* Sand blocks, cacti, sandstone.
  * *Snow:* Snow-covered grass blocks, ice, pine trees.
  * *Mountains:* Extreme elevation heights, exposed stone cliff faces, snow caps.
* **Block Types:** 
  1. Bedrock (indestructible boundary layer at depth = 0)
  2. Dirt
  3. Grass
  4. Stone
  5. Wood (log)
  6. Leaves
  7. Sand
  8. Water (source & flowing states)
  9. Glass (crafted)
  10. Brick (crafted)
  11. Torch (source of local block light)
  12. Clay (natural block found near water / under sand)
  13. Coal Ore (natural block found in stone layers)
  14. Furnace (crafted block, heat source for smelting)
* **Chunking Architecture:** Split the world into vertical/horizontal chunks of `16 × 16 × 16` blocks. Stream chunks dynamically (load only chunks within render distance of the player, unload far chunks). Heavy processing tasks (simplex-noise heightmap calculations and greedy mesh extraction) are executed in asynchronous background Web Workers to prevent rendering thread blocks and guarantee framerate stability.

### 11.2. Player & Controller Subsystem
* **Desktop Control Scheme:**
  * Keyboard: `W/A/S/D` for movement, `Space` for jump, `Shift` for sneak.
  * Mouse: Camera look-around (bound via `PointerLockControls`).
  * Interaction: `Left Click` to break targeted block, `Right Click` to place active hotbar block.
  * Selection: `Scroll Wheel` or Keys `1-9` to cycle hotbar slots.
  * Interface toggles: `E` to open Inventory/Crafting, `Escape` to pause/exit pointer lock.
* **Mobile/Tablet Control Scheme:**
  * Left-side virtual joystick for movement (default).
  * Right-side drag zone for camera rotation.
  * On-screen action buttons: `Jump`, `Interact/Place`, `Attack/Destroy`.
  * Tap hotbar icons directly to select active slot.
  * **User-Friendly Layout Customization:** A single settings toggle allows the player to flip the joystick and action buttons for left-handed or right-handed comfort.
* **Player Attributes:**
  * Health (10 hearts / 20 HP). Decreased by monster damage, fall damage, drowning, or starvation. Recovers slowly when hunger is full.
  * Hunger (10 shanks / 20 points). Decreases over time and with movement/mining. Refilled by eating food.
  * Oxygen level for underwater submersions.
  * Spawning: Spawns at the highest solid block height at center coordinate `(0, y, 0)`.

### 11.3. Physics & Collisions
* **AABB Collisions:** Custom axis-aligned bounding box collision calculation. Check player bounding box against the immediately surrounding `3 × 3 × 3` solid blocks.
* **Movement Dynamics:** Standard acceleration, drag, gravity constant, and terminal velocity. Auto-stepping / automatic climbing is disabled; the player must actively jump to climb up one layer of solid block. When submerged in water, continuous jumping (swimming/rising) is supported, allowing players to emerge and jump ashore.
* **Raycasting:** Use a Three.js Raycaster originating from the player's camera to identify targeted blocks within a maximum interaction reach of `5` blocks. Highlight the targeted block face.

### 11.4. Inventory & Crafting
* **Inventory Layout:** 
  * Storage grid: 27 slots (9x3).
  * Hotbar: 9 slots (active slot selection is synchronized with active hand).
  * Tool/Armor slots: 4 slots.
* **Inventory Actions:** Drag-and-drop support, stack split (Shift+Click), and stack merging. Limit of 64 for blocks; tools are non-stackable.
* **Crafting Mechanism:** Simplified crafting UI showing a list of craftable items based on materials present in the inventory.
* **Crafting Recipes (JSON):**
  * Planks (requires 1 Wood Log ➔ outputs 4 Planks)
  * Sticks (requires 2 Planks ➔ outputs 4 Sticks)
  * Torch (requires 1 Coal + 1 Stick ➔ outputs 4 Torches. Coal drops from breaking Coal Ore blocks)
  * Wooden/Stone/Iron Pickaxe (requires Planks/Cobblestone/Iron + Sticks)
  * Wooden/Stone/Iron Axe (requires Planks/Cobblestone/Iron + Sticks)
  * Wooden/Stone/Iron Sword (requires Planks/Cobblestone/Iron + Sticks)
  * Furnace (requires 8 Cobblestone/Stone ➔ outputs 1 Furnace)
  * Glass (requires 1 Sand + 1 Coal fuel, smelted in a Furnace ➔ outputs 1 Glass)
  * Brick (requires 1 Clay + 1 Coal fuel, smelted in a Furnace ➔ outputs 1 Brick)
  * Steak (requires 1 Raw Beef + 1 Coal fuel, smelted in a Furnace ➔ outputs 1 Steak)
  * Cooked Porkchop (requires 1 Raw Pork + 1 Coal fuel, smelted in a Furnace ➔ outputs 1 Cooked Porkchop)
  * Cooked Chicken (requires 1 Raw Chicken + 1 Coal fuel, smelted in a Furnace ➔ outputs 1 Cooked Chicken)

### 11.5. Entities & Artificial Intelligence
* **Aggressive Monsters (Zombies, Skeletons, Spiders):**
  * Spawn only during the Night or in dark cave regions (light level < 4).
  * Zombie: Slow melee damage, chases player.
  * Skeleton: Ranged attack (shoots arrow entities targeting the player).
  * Spider: Fast, climbs vertical surfaces.
  * AI behavior: Wanders randomly when player is out of range. Chases player directly when within a 16-block detection sphere. Mutates AI tick functions on every frame update.
* **Peaceful Animals (Cows, Pigs, Chickens):**
  * Spawn during the Day on Grass biomes.
  * Wander randomly. Flee briefly when attacked.
  * Drop resources (Beef, Pork, Chicken, Leather, Feathers) upon death.
* **3D Entity Models & Rendering:**
  * Rendered as multi-box 3D models matching the Minecraft-like blocky aesthetic inside the 3D Canvas (Cows are brown, Pigs pink, Chickens white, Zombies green, Skeletons gray, Spiders black).
  * Entity physics collision and gravity checks run on the main thread via standard AABB calculations to prevent clipping through terrain.
* **First-Person Tool Swing Animation:**
  * A 3D visual first-person held tool or arm model is rendered in the bottom right corner (or bottom left, matching the handedness setting).
  * Triggers a smooth swing animation (rotation and displacement) when the player left-clicks to mine blocks or attack entities.
* **Entity Spawning Caps:** Restrict active monster count to 30 and active animal count to 20 to avoid CPU overhead.

### 11.6. Day/Night & Environment
* **Time Loop:** A full game day lasts exactly 20 minutes (10 mins day, 2 mins sunset, 6 mins night, 2 mins sunrise).
* **Visual Transitions:** Dynamic sun/moon rotation and interpolation of sky background color (blue ➔ orange ➔ dark purple).
* **Light Level Calculations:** Simplified block lighting propagation. Sun provides light level 15 during the day. Torches emit light level 14. Light decays by 1 for every block step. Monsters spawn when light level drops below 4.

### 11.7. Save & Persistence Subsystem
* **IndexedDB Store:** 
  * `world_metadata`: World seed, dimensions, difficulty, current time, player position, health, hunger.
  * `world_chunks`: Delta maps of modified, placed, or broken blocks (only save differences from the base procedural generation seed to minimize storage space).
  * `player_inventory`: Serialized inventory slots and durability items.
* **Autosave frequency:** Triggers automatically every 30 seconds, or explicitly when the player pauses the game / closes the tab (bound to `beforeunload`).
* **Backup Utilities:**
  * "Export World": Packages the seed, metadata, and chunk deltas into a single downloadable `.blockcraft` JSON file.
  * "Import World": Accepts a `.blockcraft` file, writes the data to IndexedDB, and loads the world.

---

## 12. Non-functional Requirements

### 12.1. Performance & Framerates
* **Target FPS:** Stable 60 FPS on mid-range desktop computers (Intel i5, integrated GPU); stable 30+ FPS on mobile devices.
* **Memory Limits:** Total browser heap usage must remain below 500 MB to prevent tab termination.
* **Initial Loading:** The application must load and become interactive in less than 5 seconds on a standard 3G/4G network connection.
* **Optimized Rendering:** Must implement a single combined Texture Atlas for all block faces to keep WebGL draw calls to exactly 1 draw call per active chunk geometry.

### 12.2. Reliability & Offline Play
* **Progressive Web App (PWA):** Must serve offline capabilities via service workers, caching all build assets (`.js`, `.css`, images, textures, audio).
* **IndexedDB Durability:** Use robust transaction scoping. If IndexedDB storage is evicted by browser policy (e.g. Safari 7-day rule), fail gracefully by notifying the player and prompting them to export save files.

### 12.3. Compatibility & UI Responsiveness
* **Cross-Browser support:** Fully functional in Chrome, Safari, Firefox, and Edge (both desktop and mobile viewports).
* **Aesthetic Standard:** Modern, dark-themed UI overlays featuring blur effects (glassmorphism), clean sans-serif typography (Outfit or Inter), and micro-animations for active buttons/tabs.

---

## 13. Business Rules

1. **Strictly Client-Side:** No server computation, backend database API, or cloud infrastructure costs.
2. **Zero Telemetry / Absolute Privacy:** No analytics tracker (e.g. Google Analytics), cookie warnings, or external server pings. Complete player privacy is a primary design tenet.
3. **No Account Paywall:** Full gameplay loop and features must be unlocked immediately without account signup or monetization barriers.

---

## 14. Assumptions & Dependencies

### Assumptions
* **WebGL Support:** The client device browser supports WebGL 2.0 with hardware acceleration active.
* **IndexedDB Quota:** The browser grants at least 50 MB of IndexedDB storage (standard browser allowance is 20-50% of available disk space, which is far higher).
* **Single-Player Demand:** A highly polished offline experience has substantial appeal to casual players.

### Dependencies
* **Core Framework:** React 18/19, TypeScript, Vite.
* **3D Stack:** Three.js, React Three Fiber (R3F), `@react-three/drei`.
* **State Management:** Zustand.
* **Math / Generation:** `simplex-noise`.

---

## 15. Technical Risks & Mitigations

| Risk | Impact | Mitigation Strategy |
| :--- | :--- | :--- |
| **R1: WebGL Draw-Call Bottleneck** | Catastrophic frame drops (< 5 FPS) if each voxel is a separate mesh. | **Greedy Meshing & Hidden Face Culling:** Combine adjacent faces of the same block type. Do not render block faces that touch other solid blocks. Use `THREE.InstancedMesh` for repeating entity geometries. |
| **R2: Safari Storage Eviction** | Silent deletion of user save data if the origin is inactive for 7 days. | **Manual Local Backups:** Provide a high-visibility "Export/Import Save" feature in the main menu and settings, prompting users on mobile to back up their worlds. |
| **R3: Memory Overrun (OOM)** | Browser tab crashes when storing large voxel arrays. | **Flat Typed Arrays & Chunk Loading:** Represent chunks using flat `Uint8Array` grids. Stream active chunks (9x9 chunk radius around player) and keep distant chunks serialized or purged from active RAM. |
| **R4: Custom Collision Lag** | Frame jitter during high-speed movements or falling. | **Proximity Grid Checks:** Restrict collision bounds calculation to a local `3x3x3` block radius immediately surrounding the player's position coordinate, ignoring distant blocks. |
| **R5: Single Texture Bindings** | High GPU state change overhead when switching textures. | **Texture Atlasing:** Merge all block face textures (dirt, grass, stone) into a single master PNG texture atlas, using texture coordinates (UV mapping) to slice block visuals. |

---

## 16. Acceptance Criteria

| ID | Feature | Acceptance Criteria |
| :--- | :--- | :--- |
| **AC-1** | World Generation | Procedural world generates with 5 biomes. Chunks load/unload based on distance. No visible voids. |
| **AC-2** | Block Interactions | Raycaster highlights selected block. Left-click breaks the block and adds it to inventory. Right-click places the active block. |
| **AC-3** | Survival Cycle | Player takes damage from fall heights, monsters, and hunger depletion. Eating food restores hunger. |
| **AC-4** | Crafting Subsystem | Crafting screen displays recipes. Selecting a recipe consumes correct items and outputs crafted tool/block. |
| **AC-5** | State Persistence | Closing browser tab and clicking "Continue" restores player coordinates, inventory, and modified blocks. |
| **AC-6** | Device Responsiveness | HUD adaptively resizes. Virtual joystick registers movement inputs correctly on touch screens. |

---

## 17. Success Metrics

1. **Performance:** Maintain a stable 60 FPS on average desktop environments with standard render distance.
2. **Frictionless Loading:** Initial page load is complete and interactive in less than 3 seconds under normal network conditions.
3. **Robust Storage:** Zero reported occurrences of world save file corruption during standard import/export tests.
4. **Clean Code & Modularity:** Subsystems achieve high unit test coverage (following TDD workflows) with clear interfaces between world generation, physics, and UI components.

---

## 18. Scope Breakdown & Development Roadmap

### Phase 1: Core Engine & Voxel Rendering
* Initialize project with React, TypeScript, and Vite.
* Configure Three.js, React Three Fiber, and single Texture Atlas.
* Build chunk mesh generator with hidden-face culling.
* Implement Simplex Noise terrain elevation.

### Phase 2: Player Controller & Collisions
* Implement keyboard/mouse (PointerLock) input controller.
* Implement gravity and custom lightweight AABB collision detection.
* Implement Raycaster targeting for block highlight, placement, and destruction.

### Phase 3: Inventory, UI & HUD
* Set up Zustand global state store for inventory slots and health/hunger.
* Build modern React HUD overlay (health, hunger, hotbar active slots).
* Develop main menu screen (New Game with world size/difficulty, Continue, Settings).
* Add Virtual Joystick and touch layouts for mobile views.

### Phase 4: Crafting, Resources & Equipment
* Add resource drops when blocks are destroyed.
* Implement JSON recipe loading system.
* Build crafting interface overlay (interactive recipe list).
* Implement tool types (Pickaxes, Axes, Swords) with durability properties.

### Phase 5: Entities & AI
* Implement base Entity controller class.
* Build Aggressive Monsters (Zombies, Skeletons) with night spawning mechanics.
* Build Peaceful Animals (Cows, Pigs) with daytime spawning and resource drops.
* Add simple melee combat, hit detection, and damage feedback.

### Phase 6: Persistence & Backups
* Build IndexedDB adapter saving world changes, player state, and inventories.
* Add autosave trigger loops.
* Implement "Export Save" and "Import Save" JSON utility buttons.
* Setup Progressive Web App (PWA) config for offline capability.

### Phase 7: Audio & Polish
* Integrate Web Audio API for stepping, mining, placing, combat, and environment.
* Optimize render buffers, compile production build, and deploy to Cloudflare Pages.

---

## 19. Resolved Product Design Decisions

1. **Mobile Controls Layout:** Standardized on virtual joysticks and action buttons with a simple Settings toggle to swap left/right-handed control positions for maximum user comfort.
2. **Chunk Threading via Web Workers:** Implemented Web Workers for terrain generation and greedy meshing algorithms to guarantee stable performance (60 FPS on desktop, 30+ FPS on mobile) and prevent rendering stutters.
3. **Vertical Height Limit:** The vertical world height is fixed at `128` blocks for the first release (V1 Beta/Production). Vertical streaming is deferred to future scopes.

---

## 20. Change Log

| Timestamp | Type | Summary | Sections |
| :--- | :--- | :--- | :--- |
| 2026-07-11T05:36:13Z | Add | Initialized Product Requirements Document (PRD) for BlockCraft. | All |
| 2026-07-11T05:39:33Z | Replace | Resolved open questions regarding controls, Web Workers, and vertical depth. | Subsystems, Open Questions, Change Log |
