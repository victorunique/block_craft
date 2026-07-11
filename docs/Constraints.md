# BlockCraft Constraints

This document outlines the technical, architectural, and operational constraints that govern the development and execution of the BlockCraft project.

---

## Technology Constraints

* **Core Stack:** The application must be built using React, TypeScript, and Vite.
* **3D Rendering:** 3D rendering must be handled via Three.js, React Three Fiber (R3F), and `@react-three/drei`.
* **State Management:** All global client-side state must be managed using Zustand.
* **Physics & Collisions:**
  * **Initial Version:** Custom lightweight collision detection logic.
  * **Future Version:** Transition to Rapier.
* **World Generation:** Procedural generation must use the `simplex-noise` library.
* **Storage:**
  * **Primary:** IndexedDB must be used to store world data, player state, and inventories.
  * **Fallback:** LocalStorage may be used for settings and minor non-world variables.
* **Recipes:** Crafting recipes must be stored and processed as JSON structures.
* **Voxel Interactions:** Three.js Raycaster must be used to calculate and select the block coordinates for placement and destruction.

---

## Platform & Infrastructure Constraints

* **Pure Frontend Architecture:** The application must have **no backend database, server-side code, or API services**. All game loop processing, terrain generation, state management, and save/load logic must run entirely on the client side.
* **No Authentication:** The game must not implement user login, cloud authentication, or user accounts.
* **Browser Compatibility:** The application must run entirely inside modern web browsers across desktop and mobile devices.

---

## Deployment Constraints

* **Host Provider:** Deployed directly to Cloudflare Pages.
* **Continuous Integration/Deployment:** Main build and deployment pipeline is automated: `GitHub ➔ Cloudflare Pages ➔ Public Website`.
* **Zero Backend Costs:** Project deployment and hosting must remain within free tier limits of the selected providers.

---

## Performance Constraints

* **Frame Rate:** Maintain a stable 60 FPS on standard desktop browsers.
* **Render Distance:** Standard render distance must be configurable between 8 to 12 chunks.
* **Memory Limits:** Total browser memory usage must remain under 500 MB.
* **Initial Loading:** The application must load and become playable in less than 5 seconds on standard connections.
* **World Limits:**
  * Preset world sizes must be restricted to `256 × 256`, `512 × 512`, or `1024 × 1024` blocks.
  * Worlds are limited to a maximum boundaries of `1024 × 1024` blocks to ensure compatibility and stability in browser memory.

---

## Security Constraints

* **Client Sandboxing:** The application runs entirely within the client's browser sandbox.
* **Zero Secret Exposure:** No API keys, database credentials, or private access tokens should be included in the client bundle.

---

## Coding & Architectural Constraints

* **Project Directory Structure:** The codebase must adhere to the following directory layout:
  ```
  src/
      assets/
      components/
      config/
      game/
          animals/
          audio/
          crafting/
          entities/
          inventory/
          monsters/
          physics/
          player/
          rendering/
          save/
          terrain/
          ui/
          world/
      hooks/
      utils/
  ```
* **High-Level Data Flow:**
  ```
  React UI ➔ Game Manager ➔ World ➔ Chunks ➔ Blocks ➔ Renderer ➔ Three.js
  ```
* **AI-First Engineering Principles:**
  * **Single Responsibility:** Each subsystem (e.g., Terrain Generator, Inventory, Save System) must be isolated with clear inputs and outputs.
  * **Modularity:** Modules must be independent, allowing them to be generated, refactored, and tested with minimal coupling.
* **Production-Grade Quality Constraints:**
  * **Not an MVP:** Code must be written to production standards rather than temporary/hacky MVP prototypes.
  * **Robust Testing:** Strict adherence to TDD is mandatory; every component must be modular and independently testable.
  * **Beta/1.0 Stability:** Code must target high runtime stability, graceful error handling, and robust memory management suitable for beta testing and the final production release.

---

## Known Assumptions

* **Storage Reliability:** Local browser storage (IndexedDB) is assumed to be stable and sufficient for persistence. High-capacity game worlds will not exceed storage quotas.
* **WebGL Support:** Devices running the game are assumed to have modern browsers with active WebGL support and basic hardware acceleration.

---

## Explicit Non-Goals

* **Multiplayer Support:** Networking, web sockets, peer-to-peer syncing, or multiplayer features are out of scope.
* **Centralized Data Storage:** Syncing progress across different devices via a central database is not supported.
* **Complex Physics Engine:** Real-time fluid dynamics, soft-body physics, or advanced structural collapse mechanics are not required.
