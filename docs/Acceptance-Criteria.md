# BlockCraft Acceptance Criteria

Version: 1.0  
Status: Initial Release  
Author: Antigravity (Senior QA Architect)  
Date: 2026-07-11  

---

## 1. Procedural World & Voxel Rendering Subsystem

### Feature Name: Procedural World Generation & Streaming
* **Acceptance Conditions:**
  - Procedural world elevation and biome profiles are determined strictly from the world seed using simplex noise equations.
  - Generates five distinct biomes: Plains, Forest, Desert, Snow, and Mountains, verified by distinct color maps and block distributions.
  - Chunk data is divided into vertical/horizontal cells of $16 \times 16 \times 16$ blocks.
  - Chunks stream dynamically: loaded when inside render distance of player position and unloaded when outside.
  - Heavy terrain calculations and chunk mesh compiles must execute asynchronously in Web Workers to prevent main rendering thread stutter.
  - Hidden-Face Culling is active, removing internal non-exposed block faces from geometry compile passes.
  - Identical exposed block faces are merged using quad greedy meshing.
* **Definition of Done (DoD):**
  - Meshes compile and render without holes, visual anomalies, or block overlap glitches.
  - GPU rendering is limited to exactly 1 draw call per active chunk (excluding transparent water pass).
  - Average main thread frame time stays under 16.6ms (desktop) during active chunk streaming.

---

## 2. Player Input & Locomotion Controller

### Feature Name: Desktop & Mobile Control Schemes
* **Acceptance Conditions:**
  - **Desktop:** Keyboard translation (`W`/`A`/`S`/`D` movement, `Space` jump, `Shift` sneak) operates. Mouse pointer lock bounds camera control on click and triggers Pause overlay on escape.
  - **Mobile:** Renders Virtual Joystick on left side (for locomotion) and drag zone on right (for camera direction).
  - Tapping on-screen action buttons (`Jump`, `Interact/Place`, `Mine/Attack`) maps inputs correctly.
  - A settings configuration toggle allows swapping the positions of the Virtual Joystick and Action Buttons (Left-Handed vs. Right-Handed layout comfort).
* **Definition of Done (DoD):**
  - Control layout changes apply instantly without requiring browser refreshes.
  - Joystick supports 360-degree translation movement vectors.
  - Keyboard and touch inputs operate simultaneously without blocking thread states.

---

## 3. Collision Physics & Raycasting Engine

### Feature Name: Custom AABB Physics & Targeted Block Raycasting
* **Acceptance Conditions:**
  - Entity collisions are evaluated against block bounding boxes in a local $3 \times 3 \times 3$ grid surrounding the entity.
  - Acceleration, gravity, drag constants, and terminal velocity constants govern motion.
  - Auto-stepping / automatic climbing is disabled; players must actively press jump to scale solid blocks. Continuous jump is supported in water to swim/ascend and jump onto land.
  - Three.js camera Raycaster highlights the targeted block face within a maximum interaction range of 5 blocks.
* **Definition of Done (DoD):**
  - Collision calculations prevent clipping through solid blocks (walls, ceilings, floors).
  - Landing on solid blocks halts downward speed and does not bounce player through bedrock floor boundary ($y = 0$).
  - Raycaster returns target coordinates and surface normals on every render tick.

---

## 4. Inventory, Crafting, and Smelting System

### Feature Name: Storage grids, Smelting transactions, and Durability
* **Acceptance Conditions:**
  - Inventory includes: 27 storage slots, 9 hotbar slots, and 4 specialized slots (armor/tools).
  - Block items stack up to 64; tool items (Axes, Pickaxes, Swords) are non-stackable and carry durability ratings.
  - Drag-and-drop interactions swap items between grids, and Shift+Click splits item stacks.
  - Crafting panel lists recipes, showing red/green status badges for required ingredients.
  - Smelting requires a placed Furnace block, fuel (Coal), and material (Sand for Glass; Clay for Brick).
* **Definition of Done (DoD):**
  - Crafting consumes materials and yields output in the exact quantities specified in JSON recipe configs.
  - Smelting transactions fail and preserve materials if outputs cannot fit in inventory (partial transaction rollback).
  - Tool usage decreases durability; items disappear when durability drops to 0.

---

## 5. Persistent Local Save Subsystem

### Feature Name: IndexedDB Save & File Backups
* **Acceptance Conditions:**
  - Autosaver serializes player state (health, hunger, time, coordinates, active slot, inventory items) and modified chunk blocks to IndexedDB every 30 seconds.
  - Chunk saving only records deltas (placed, broken, or modified blocks) relative to the noise seed to optimize space.
  - "Export World" compiles seed, metadata, and chunk deltas into a downloadable `.blockcraft` JSON backup file.
  - "Import World" uploads a backup file, runs validation checks, and overwrites target stores.
* **Definition of Done (DoD):**
  - Save operations complete asynchronously without halting rendering ticks.
  - Corrupt or invalid JSON backup files are rejected during import, displaying a clear error dialog.
  - Restoring saves loads all modified blocks, player attributes, and position coordinate arrays.

---

## 6. Progressive Web App (PWA) & Performance

### Feature Name: Offline Play & Performance Guardrails
* **Acceptance Conditions:**
  - Service Workers cache build assets (`.js`, `.css`, PNG textures, audio) to support full offline gameplay.
  - Startup checks query storage estimation via `navigator.storage` to display eviction warning dialogs if limit is reached.
  - Low-spec devices (Tier 1) are warning-warned before generating a Large (1024x1024) world.
* **Definition of Done (DoD):**
  - Application becomes interactive in less than 5 seconds.
  - Heap memory usage remains strictly below 500 MB.
  - Target rendering framerate remains stable at 60 FPS (desktop) and 30+ FPS (mobile).
