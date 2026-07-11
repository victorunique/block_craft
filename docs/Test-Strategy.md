# BlockCraft QA Test Strategy

Version: 1.0  
Status: Initial Release  
Author: Antigravity (Senior QA Architect)  
Date: 2026-07-11  

---

## 1. Introduction & Objectives

This document defines the QA verification strategy for **BlockCraft**, a client-only procedural voxel sandbox game. The objective is to verify that the core voxel engine, collision physics, inventory systems, animal/monster AI, and storage serialization run correctly, performantly, and reliably inside the browser sandbox without a backend database.

Downstream development and automation agents must follow this strategy to align their Test-Driven Development (TDD) workflows with the test boundaries, priorities, and quality gates specified below.

---

## 2. Test Levels & Scopes

Testing is divided into four distinct phases, prioritizing automated verification where possible and establishing strict manual verification gates where automated browser tools cannot mock complex WebGL/Web Audio behaviors.

```
       ┌────────────────────────────────────────────────────────┐
       │                 End-to-End (E2E)                       │ ──► Manual / Playwright
       │       User Journeys, Import/Export, PWAs, Joysticks     │
       └────────────────────────────────────────────────────────┘
                  ┌───────────────────────────────────┐
                  │            Integration            │ ──► Jest / Vitest + Mock DB
                  │     Workers, Zustand, IndexedDB   │
                  └───────────────────────────────────┘
                             ┌─────────────┐
                             │    Unit     │ ──► Vitest / TDD
                             │ Physics, AI │
                             └─────────────┘
```

### 2.1. Unit Testing
* **Scope:** Mathematical algorithms, physics equations, terrain noise generation, inventory item stacking, entity AI transitions, and utility methods.
* **Key Components:**
  - Terrain Height & Biome functions ([ITerrainGenerator](file:///Users/victorxu/projects/block_craft/docs/API_Spec.md#L91-L116))
  - Collision Math & Physics Engine ([IPhysicsEngine](file:///Users/victorxu/projects/block_craft/docs/API_Spec.md#L118-L148))
  - State Store logic (Zustand state update reducers)
  - Recipe Validation utilities
* **TDD Requirement:** Coding agents must write Vitest/Jest unit tests *prior* to writing the matching implementation code.

### 2.2. Integration Testing
* **Scope:** Subsystem boundaries, database serialization, and Web Worker thread message passing.
* **Key Components:**
  - **IndexedDB Save Manager:** Validate that state objects (`worlds`, `inventories`, `chunk_deltas`) are correctly serialized, stored, and read back under mock conditions.
  - **Web Worker Protocols:** Verify that `WorkerRequest` and `WorkerResponse` messages are correctly serialized, and transferable array buffers (positions, normals, indices) transition ownership between threads.
  - **Zustand ↔ IndexedDB sync:** Test that autosave loops trigger properly every 30 seconds and persist delta chunks to IndexedDB.

### 2.3. System Testing
* **Scope:** Integrated execution of client-side loops, rendering frame rate checks, and input mappings.
* **Key Components:**
  - **HUD Overlays:** Assert state changes in Zustand trigger immediate React UI updates without browser rendering lags.
  - **PointerLock & Joystick Controls:** Verify mouse lock acquisition and multi-touch translation mapping.

### 2.4. End-to-End (E2E) Testing
* **Scope:** Full user journeys (e.g., start title menu, create world, play, save, export, import on a second browser instance).
* **Key Components:**
  - Desktop control loops & mobile control configurations.
  - Progressive Web App (PWA) asset caching and offline functionality.
  - Compressed `.blockcraft` backup file downloading and uploading.

---

## 3. Coverage Model & Risk-Based Prioritization

### 3.1. Risk Levels
Features are categorized by their risk to the stability of the game engine (performance degradation, save corruption, collision issues).

| Feature / Subsystem | Priority | Risk Profile | Primary Impact |
| :--- | :--- | :--- | :--- |
| **IndexedDB State & Autosaver** | **Critical** | High: safari eviction, file corruption | Player progress loss |
| **Physics Collision Logic (AABB)** | **Critical** | High: boundary clip, gravity jitter | Broken gameplay mechanics |
| **Terrain Mesh Geometry Compiler** | **High** | High: OOM crashes, low FPS | Severe framerate drops |
| **Inventory & Smelting Systems** | **High** | Medium: item duplication, recipe bugs | Core sandbox loop failure |
| **Entity Spawning & AI States** | **Medium** | Medium: entity leak, pathfinding loop | CPU thread lock |
| **HUD & Layout Layouts (PWA)** | **Medium** | Low: visual cutoffs, layout breaks | Poor mobile experience |
| **Audio Effects Manager** | **Low** | Low: web audio node leak | Audio stuttering / memory leak |

### 3.2. Business-Critical Paths
Verification must focus on three core user flows (minimum acceptable paths):
1. **The Core Loop:** Play ➔ Break Blocks ➔ Add to Inventory ➔ Craft Furnace/Pickaxe ➔ Smelt Clay/Sand ➔ Place blocks.
2. **The Save Lifecycle:** Play ➔ Autosave ➔ Close Browser ➔ Continue Game ➔ Verify state matches exactly.
3. **The Migration Path:** Play on Desktop ➔ Backup World (.blockcraft) ➔ Import on iPad ➔ Verify world loaded correctly.

---

## 4. Automation vs. Manual Verification Strategy

Due to the client-only rendering nature of BlockCraft (Three.js WebGL and Web Audio API), tests are split between automated execution and manual verification.

```
┌────────────────────────────────────────────────────────┐
│ AUTOMATED TESTS (Jest / Vitest / Playwright)           │
│ - Math & Physics logic (AABB intersections)            │
│ - Zustand store actions & state reducer validations   │
│ - JSON backup serialization and integrity validation   │
│ - IndexedDB transaction write/read loops               │
│ - Web Worker request/response serialization            │
└────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────┐
│ MANUAL VALIDATION GATES (Tester Playground / UI)       │
│ - 3D Visual verification (Terrain Biomes, Voids)       │
│ - PointerLockControls mouse acquisition / scroll       │
│ - Mobile virtual joystick multi-touch controls         │
│ - Web Audio API sound triggers (mining, steps)         │
│ - 60 FPS performance testing (Chrome DevTools Profiler)│
└────────────────────────────────────────────────────────┘
```

### 4.1. Automation Candidate Targets
- **Unit Logic:** 100% of core algorithms (AABB logic, recipe mapping, noise height computations) must be automated.
- **Store Actions:** 100% of `IGameState` state mutations must be covered by unit tests.
- **Save Integrity:** Schema validation for `.blockcraft` JSON imports must be automated to block corrupt files.

### 4.2. Manual Validation GATES
- **3D Graphics Verification:** Verifying that meshes render properly, hidden-face culling operates without voxel holes, and water block transparency sorting looks correct.
- **Performance Profiling:** Verified via Chrome DevTools (target: heap memory < 500MB, CPU long tasks <= 50ms, rendering FPS stable at 60 on desktop, 30+ on mobile).
- **Physical Controls:** Mouse Pointer Lock controls and multi-touch joystick controls.

---

## 5. Quality Gates & Release Readiness

To transition the product from development to release stages, the codebase must clear the following gates:

### 5.1. Code Check-In Gates (TDD)
- **Gate 1 (Red Phase):** Coding agents must commit failing unit test cases detailing the target functional addition before modifying `src/game/` source files.
- **Gate 2 (Green Phase):** Implementation code added must make all tests pass without introducing regression failures.
- **Gate 3 (Lint & TypeScript):** Zero TypeScript compilation warnings or errors allowed (`tsc --noEmit`).

### 5.2. Integration & Build Gates
- Production bundle size remains under 2.5 MB (excluding assets like textures/audio).
- Production build succeeds without errors (`vite build`).

### 5.3. Release Readiness (DoD)
1. **Automated Test Coverage:** >85% statement coverage for non-UI `src/game/` utilities.
2. **Persistence Integrity:** 100% success rate on backup roundtrip tests (Export ➔ Clear IndexedDB ➔ Import ➔ Verify).
3. **No OOM Crashes:** 10-minute continuous gameplay session on mobile (Tier 1 device configuration) must not exceed 500 MB heap memory or trigger browser tab crashes.
4. **Performance Gate:** Average rendering tick rate matches 60 FPS (desktop) or 30+ FPS (mobile).

---

## 6. Upstream Issue Log & Exclusions

The following design alignment decisions have been incorporated into this strategy following user confirmation:
- **Clay, Coal Ore, and Furnace Integration:** Standardized Block IDs (Clay=12, Coal Ore=13, Furnace=14) and smelting logic are mapped in functional and integration tests.
- **Armor State State Storage:** The state interface exposes `armor: (InventoryItem | null)[]` mapping, verified under inventories database tests.
- **Low-End Mobile Detection:** Memory limitation warning dialogs are verified by overriding WebGL parameters in test suites.
- **File Name Referencing:** All documents trace references to `docs/API_Spec.md`.
