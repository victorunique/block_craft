# BlockCraft Technical Architecture

Version: 1.0  
Status: Initial Release  
Author: Antigravity (AI System Architect)  
Date: 2026-07-11  

---

## 1. System Overview

BlockCraft is a browser-native 3D voxel sandbox game built entirely on client-side technologies. It features zero server dependencies, zero database services, and zero account sign-up requirements. All operations—including procedural world generation, voxel rendering, physics simulation, inventory management, entity AI, and world persistence—are processed locally within the user's browser sandbox.

### Core Architectural Goals
* **Smooth Rendering Performance:** Maintain a stable 60 FPS on desktop and 30+ FPS on mobile viewports.
* **Low Memory Footprint:** Maintain browser tab heap usage under 500 MB to avoid tab crashes on lower-spec hardware (e.g., Chromebooks, mobile devices).
* **Decoupled Modularity:** Segregate responsibilities cleanly between the 3D render loop, React state management, and thread-isolated computational heavy lifters (terrain height generation and greedy chunk meshing).
* **Frictionless Portability:** Provide offline play capabilities via Progressive Web App caching and allow saving/transferring worlds via lightweight local backups.

---

## 2. High-Level System Architecture

The game follows a strict unidirectional data flow for high-frequency ticks, bypassing standard React reconciliation during active gameplay to prevent performance drops. React components are utilized primarily as a declarative overlay for the Head-Up Display (HUD), Inventory, Crafting, and Game Menus, interacting with state stores via Zustand.

### Architecture Topology

```mermaid
graph TD
    subgraph Browser Client (Main Thread)
        UI[React UI Overlay / HUD / Menus] <--> |Zustand Store Actions| Store[Zustand Game Store]
        
        R3F[React Three Fiber Canvas] --> |Refs / useFrame Hook| Engine[Game Engine Manager]
        Engine <--> |Subscribe / Mutate| Store
        
        Engine --> Physics[Custom AABB Physics Module]
        Engine --> Audio[Web Audio API Manager]
        Engine --> Save[IndexedDB Save Manager]
        
        subgraph Three.js WebGL Renderer
            ChunkMesh[Chunk Mesh Manager] --> |Texture Atlas / InstancedMesh| GL[WebGL Context]
            EntityMesh[Entity Mesh Manager] --> GL
        end
        
        Engine --> ChunkMesh
        Engine --> EntityMesh
    end

    subgraph Background Web Workers (Worker Threads)
        Worker[Chunk Generator Web Worker] <--> |Message Passing / SharedBuffers| Engine
        Worker --> Simplex[Simplex Noise terrain generator]
        Worker --> MeshGen[Greedy Mesh & Hidden Face Culling Generator]
    end

    Save <--> |IndexedDB Transactions| IDB[(IndexedDB: BlockCraftDB)]
```

### High-Frequency Game Loop Sequence
```
[Browser RequestAnimationFrame] 
      │
      ▼
[useFrame Hook (Three.js Tick)]
      │
      ├──> Update Game Time & Environment (Day/Night transitions)
      │
      ├──> Perform Physics Tick (Player position, Custom AABB collision logic)
      │
      ├──> Run Entity AI Tick (Monsters chase, Animals wander, spawning limits)
      │
      ├──> Execute Raycaster Target Check (Block selection highlight, 5-block reach range)
      │
      └──> Check Chunk Load/Unload Queue (Stream chunks based on camera position)
```

---

## 3. Subsystem Decomposition

The codebase is organized into isolated directories inside `src/game/` according to responsibility:

```
src/
  game/
    animals/        # Peaceful animals (Cow, Pig, Chicken) schemas & behaviors
    audio/          # Sound effects and environment Web Audio API wrapper
    crafting/       # Recipe parsers and crafting transaction logic
    entities/       # Base entities, hitboxes, and state machines
    inventory/      # Hotbar and storage slot models, drag-drop state logic
    monsters/       # Aggressive monsters (Zombie, Skeleton, Spider) AI
    physics/        # Collision bounds, step climbing, gravity, raycast utils
    player/         # Desktop & mobile input mapping, player parameters
    rendering/      # Chunk geometry compilers, texture atlas UV configurations
    save/           # IndexedDB transactions and JSON export/import utilities
    terrain/        # Noise-based heightmap engines and biomes builders
    ui/             # React interface components (HUD, Inventory Grid, Menus)
    world/          # World controller coordinating active chunk instances
```

---

### 3.1. Terrain & World Subsystem (`src/game/terrain/`, `src/game/world/`)
* **Role:** Procedurally generate blocks based on a seed and stream chunks in/out based on player location.
* **World representation:** Divided into vertical/horizontal chunks of dimensions $16 \times 16 \times 16$ blocks. The world boundary is bounded to Small ($256 \times 256$), Medium ($512 \times 512$), or Large ($1024 \times 1024$) block footprints, with a fixed depth of $128$ blocks ($8$ chunks vertically).
* **Chunk Storage:** Stored as flat `Uint8Array` arrays of size $4096$ inside the chunk model to save memory footprint (1 byte per block).
* **Biomes Generation:** Combines Simplex Noise heightmaps with humidity and temperature scales to place distinct block profiles:
  * **Plains:** Grass, dirt, flowers. Low vertical noise fluctuation.
  * **Forest:** Densely populated oak trees (procedurally spawned logs and leaves).
  * **Desert:** Sand blocks, cacti, sandstone. Flat height maps.
  * **Snow:** Pine trees, ice, snow layer on top of grass.
  * **Mountains:** High vertical noise scale, exposed stone faces, snow-capped peaks.
* **Worker Offloading:** Heavy terrain calculations and initial block structures are generated asynchronously inside the Web Worker threads to prevent main-thread UI frame dropping.

---

### 3.2. Voxel Rendering Subsystem (`src/game/rendering/`)
* **Role:** Compile 3D chunk geometries and render them efficiently to the GPU.
* **Texture Atlas:** All block face textures (dirt, grass, grass-sides, stone, wood-sides, wood-ends, leaves, sand, glass, bricks, water, torches) are compiled into a single master PNG texture atlas (e.g., $16 \times 16$ grid layouts). This maps coordinates via UV coordinates on a single material, minimizing GPU binding switches.
* **Hidden-Face Culling:** When compiling chunk geometry, faces that share borders with other solid blocks are omitted from the geometry buffers. Only exposed voxel boundaries are generated.
* **Greedy Meshing:** Combine adjacent identical voxel faces into larger quads (e.g., if a plane of $4 \times 4$ stone block faces is exposed, render it as one single quad with stretched UV coordinates instead of 16 individual quads). This reduces triangle indices by 70–80% and limits rendering to exactly one WebGL draw call per chunk mesh.
* **Water & Transparent Blocks:** Rendered as separate mesh passes with transparency and depth-writing enabled, avoiding visual sorting artifacts.

---

### 3.3. Physics & Collisions Subsystem (`src/game/physics/`)
* **Role:** Handle player/entity movement gravity, step climbing, and boundary collision.
* **Axis-Aligned Bounding Box (AABB):** Custom collision algorithm checking the bounding box of the player or entities ($0.6 \times 1.8 \times 0.6$ meters for player) against the AABB bounds of the solid blocks in a local $3 \times 3 \times 3$ grid surrounding their current coordinate.
* **Step Climbing:** If the player collides horizontally with a block height increment of $\le 0.5$ blocks (such as a single block height step when walking up slopes), the physics engine automatically slides the player upward onto the step.
* **Raycasting:** Originates a ray from the player camera forward up to a maximum distance of $5.0$ blocks. Intersects against exposed chunk voxel geometries, returning the targeted block coordinate and the hit face normal (useful to highlight selection and place blocks against the hit face).

---

### 3.4. Input & Control Subsystem (`src/game/player/`)
* **Role:** Map raw browser events (keyboard, mouse, touch) to player locomotion and interactions.
* **Desktop Controls:** Employs Three's `PointerLockControls` to capture mouse movement and bind keyboard inputs (`W`/`A`/`S`/`D` for translation, `Space` for jump, `Shift` for sneak).
* **Mobile Controls:** Renders a virtual joystick on the left side (for direction controls) and a virtual track-pad area on the right side of the touchscreen (for camera adjustments). Action buttons map to `Jump`, `Break`, `Place/Interact`.
* **Handedness Layout Toggling:** A setting configuration allows swapping the positioning of the movement joystick and action button panels, providing comfortable support for left-handed and right-handed players.

---

### 3.5. State Management Subsystem (`src/game/inventory/`, `src/game/crafting/`)
* **Role:** Manage transient variables (health, hunger, inventory contents, hotbar items, and active selections).
* **Zustand Store:** Holds state variables that React HUD components subscribe to (health, hunger, active hotbar slot, inventory items). High-frequency variables (like position vectors and orientation angles) are kept out of Zustand and mutated directly on Three.js objects.
* **Inventory Layout:** Renders as a 27-slot storage panel, a 9-slot hotbar, and 4 specialized slots (armor/tools). Blocks stack up to 64; tools (axes, pickaxes, swords) with durability parameters are non-stackable.
* **Crafting Logic:** Operates on JSON recipes. Instead of a grid-based interface, it displays a scrollable panel showing all craftable items based on materials present in the player's active inventory. Selecting an item executes ingredients validation and deducts components.

---

### 3.6. Persistence Subsystem (`src/game/save/`)
* **Role:** Manage persistence using browser database storage.
* **IndexedDB Architecture:** Utilizes the transactional browser-local IndexedDB database (`BlockCraftDB`).
* **Chunk Deltas Storage:** To avoid storing huge static worlds (which would consume $130+$ MB of space), the game only writes **deltas** (block modifications, blocks placed, blocks destroyed) relative to the height map seed. Unmodified chunks are not saved to database, keeping save files extremely lightweight ($< 1$ MB).
* **Autosave frequency:** Autosaves player position, world seed, inventory, time, and chunk modifications every 30 seconds, or explicitly during `beforeunload` events when the window is closed.
* **Local Save Backup:** Provides buttons to export the entire IndexedDB world state as a compressed `.blockcraft` JSON file or upload it back, bypassing browser-specific storage eviction limitations (like Safari's 7-day eviction rule).

---

### 3.7. Entity & AI Subsystem (`src/game/entities/`, `src/game/animals/`, `src/game/monsters/`)
* **Role:** Control spawning, movement, rendering, and pathfinding AI for peaceful animals and aggressive night monsters.
* **Base Entity System:** All entities (player, animals, monsters) inherit properties from a base `Entity` class (handling health, physics AABB updates, position, velocity, and hitboxes).
* **Peaceful Animals (Cows, Pigs, Chickens):** Spawn in daylight on grass blocks. Randomly wander. Run away for $3$ seconds when hit. Drop raw meat/leather/feathers directly into player inventory on death.
* **Aggressive Monsters (Zombies, Skeletons, Spiders):** Spawn when light levels drop below 4 (during night or inside deep caves). Chases player directly when player enters a $16$-block detection radius.
  * **Zombie:** Melee damage.
  * **Skeleton:** Ranged arrows (spawns 3D arrow meshes with linear physics, traveling towards the player and dealing damage on collision).
  * **Spider:** Fast, climbs solid blocks.
* **3D Rendering & Animations:**
  * Multi-box R3F visual components represent each species (brown boxy cows, pink pigs, white chickens, green zombies, light gray skeletons, black spiders).
  * Mesh rotations are interpolated based on velocity and direction.
  * Player's held tool (axe, pickaxe, sword, block, or bare hand) renders in the camera viewport and undergoes a rotational swing animation when left-clicked.
* **AABB Physics Simulation:** Runs physics ticks for all entities on the main thread inside the R3F frame loop to enforce gravity, vertical velocity, and solid block collision boundaries.
* **Cap Limits:** Restricts entities dynamically to 20 peaceful animals and 30 aggressive monsters to avoid CPU bottlenecks in single-threaded environments.

---

## 4. Web Worker Threading Model

To ensure rendering is never blocked, chunk generation is delegated to a background thread:

```
Main Thread (R3F Render Loop)                     Web Worker Thread
    │                                                     │
    │ ─── [Request Chunk (x, y, z, seed)] ──────────────> │
    │                                                     │ ─── Compute Simplex Heights
    │                                                     │ ─── Populate voxel Array
    │                                                     │ ─── Run Greedy Meshing
    │                                                     │
    │ <── [Return Compiled Geometry Buffers] ──────────── │ (Transferable objects)
    │                                                     │
    ▼                                                     ▼
Update WebGL Mesh geometry buffers
```

Transferable objects (such as typed arrays) are used to transfer memory buffers directly between the worker thread and main thread without duplicating memory allocations.

---

## 5. Non-Functional & Performance Guardrails

1. **Draw Call Optimization:** Restrict GPU drawing to exactly one draw call per active chunk by compiling unified geometries using the master texture atlas.
2. **Hidden Face Culling:** Cut chunk vertex counts by 75% by checking adjacent grid coordinates and culling internal blocks that are completely enclosed.
3. **Flat TypedArrays:** Keep voxel coordinates inside 1D `Uint8Array` sequences of size $4096$ per chunk instead of nested objects. This avoids garbage collection overhead and minimizes heap footprint.
4. **Collision Proximity Checking:** Constrain physics collisions to a $3 \times 3 \times 3$ voxel block region immediately surrounding the entity coordinate, bypassing checks against distant blocks.
5. **Dynamic Lodding:** Allow users to scale render distance in the settings between $8$ and $12$ chunks to matches GPU performance.
6. **Graceful Storage Eviction Mitigation:** Implement IndexedDB storage estimation via `navigator.storage` to warn user of storage limit risks and prompt local manual backup downloads.
7. **Device Performance & Memory Profiling:** Estimate client-side memory constraints using a multi-factor heuristics check:
   * **Direct API:** Read `navigator.deviceMemory` (if supported). Devices with `< 4` GB are classified as Low-End (Tier 1).
   * **WebGL Profiling:** Query WebGL capabilities (`gl.getParameter(gl.MAX_RENDERBUFFER_SIZE)` <= 4096) or check the GPU vendor string via `WEBGL_debug_renderer_info` extension for mobile GPU profiles (e.g., Mali, Adreno, Apple GPU).
   * **Platform Detection:** Check User-Agent for mobile OS (iOS/Android) combined with touchscreen detection. Mobile devices are treated as Tier 1 due to strict OS-level tab memory caps (e.g., Safari's ~1.5GB OOM limit).
   * **Enforcement:** If a Tier 1 device attempts to generate or load a Large world (1024x1024), trigger a protective warning dialog to prevent OOM termination.
