# BlockCraft Integration Test Cases

Version: 1.0  
Status: Initial Release  
Author: Antigravity (Senior QA Architect)  
Date: 2026-07-11  

---

## 1. Zustand Store ↔ Component Actions (ZS)

Validates that state transitions triggered in the React UI propagate to the global Zustand state store and adhere to core game rules.

### Test Scenario: ZS-001 - Player Damage & Death State Sync
* **System Boundaries:** React UI (Hearts Grid) ↔ Zustand `IGameState` ↔ Game Loop Timer.  
* **Contract Validation:**
  - `damagePlayer(amount: number, source: string)` updates `health` state.
  - Value must remain bounded: $0 \le health \le 20$.
* **Steps:**
  1. Initialize session with `health = 20`.
  2. Invoke `damagePlayer(15, "fall_damage")`.
  3. Verify `health` updates to `5` in store. Verify heart grid reflects empty/half hearts.
  4. Invoke `damagePlayer(10, "zombie_attack")`.
* **Expected Failure/Boundary Result:** `health` drops to `0`. Store automatically sets `isPaused` to `true` (game over freeze). Renders Game Over overlay. Value does not drop below `0`.
* **Data Consistency:** Game tick calculations stop.

### Test Scenario: ZS-002 - Smelting Crafting Transaction
* **System Boundaries:** Inventory grid UI ↔ Crafting Manager ↔ Zustand inventory state arrays.  
* **Contract Validation:**
  - `craftItem(recipeId: string)` takes resources from `storage`/`hotbar` and inserts output block.
* **Steps:**
  1. Seed inventory state with exactly: 1 Clay block (blockId 12), 1 Coal item (blockId 13) in slot 0, and 1 Furnace block (blockId 14) in slot 1.
  2. Execute `craftItem("brick")`.
* **Expected Result:**
  - The recipe search maps Clay and Coal fuel in proximity to the Furnace.
  - Clay and Coal count are reduced by 1.
  - 1 Brick item (blockId 10) is added to the inventory.
  - Return value of `craftItem` is `true`.
* **Partial Failure Resilience:** If the item cannot be added (inventory full), resources are NOT deducted, and `craftItem` returns `false`.

---

## 2. Save Manager ↔ IndexedDB Storage (SM)

Validates persistence transactions against browser storage limitations.

### Test Scenario: SM-001 - Delta Chunk Saving Consistency
* **System Boundaries:** Voxel mesh editor ➔ `ISaveManager` ➔ IndexedDB `chunk_deltas` store.  
* **Contract Validation:**
  - Saves delta map in layout: `${worldId}_${chunkX}_${chunkY}_${chunkZ}` with modified block indexes.
* **Steps:**
  1. Generate world from seed.
  2. Player places stone block (blockId 4) at local chunk coordinates (5, 2, 7) inside chunk (0, 4, -1).
  3. Autosave triggers.
  4. Query IndexedDB `chunk_deltas` for key `"a9b8...fed_0_4_-1"`.
* **Expected Result:**
  - IndexedDB returns record.
  - Deltas map contains record: `{"565": 4}` where $565 = 5 + (2 \times 16) + (7 \times 256)$.
  - Base chunk array is not written to DB (only delta map exists to keep footprint under 1 MB).
* **Failure Handling:** If IndexedDB transaction is blocked/fails, the manager catches the error, increments a retry counter (max 3 times), and queues the write buffer for the next autosave loop.

### Test Scenario: SM-002 - Browser Storage Eviction Recovery
* **System Boundaries:** Startup initialization check ↔ Browser Storage Estimate API ↔ IndexedDB.  
* **Steps:**
  1. Mock `navigator.storage.estimate` to report `usage = 42MB` and `quota = 50MB` (84% capacity used).
  2. Load game main page.
* **Expected Result:**
  - Initialization scanner detects usage exceeds the 80% warning threshold.
  - Generates console warnings and triggers a notification toast: *"Browser storage capacity running low. Please back up your worlds!"*
  - The system remains fully functional but prioritizes manual backup notifications.

---

## 3. Web Worker ↔ Render Thread Coordination (WK)

Validates off-loading geometry calculations to background threads using Transferable objects.

### Test Scenario: WK-001 - Procedural Chunk Pipeline Roundtrip
* **System Boundaries:** Game Engine Tick ↔ Web Worker postMessage ↔ Terrain height calculation.  
* **Contract Validation:**
  - `WorkerRequest` structured message containing correlation ID, seed, and chunk coords.
  - `WorkerResponse` returning compiled float arrays for geometry.
* **Steps:**
  1. Main thread dispatches message: `{ id: "req_99", type: "GENERATE_CHUNK_DATA", payload: { seed: 12345, chunkX: 2, chunkY: 1, chunkZ: 0 } }`.
  2. Worker thread receives message, computes terrain using simplex noise, and compiles voxel data array.
  3. Worker thread dispatches mesh geometry back using `postMessage(response, [positions.buffer, indices.buffer])`.
* **Expected Result:**
  - Message received by main thread with matching correlation ID `"req_99"`.
  - Geometry arrays are type `Float32Array` (positions) and `Uint32Array` (indices).
  - The buffers on the worker thread are marked as *detached* (memory ownership transferred to main thread in exactly 1 tick, preventing GC pauses).

---

## 4. Physics Engine ↔ World Block Interface (PH)

Validates custom AABB locomotion physics calculations.

### Test Scenario: PH-001 - AABB Step-Climbing Transition
* **System Boundaries:** Physics locomotion loop ↔ Chunk block coordinate map.  
* **Steps:**
  1. Place the player AABB box at coordinate `(1.0, 64.0, 1.0)`.
  2. Set block at `(2.0, 64.0, 1.0)` to Stone (1 block high).
  3. Move player velocity vector towards positive X.
  4. Run physics engine loop update.
* **Expected Result:**
  - Player bounding box collides with block horizontally.
  - Step height is checked: $1.0$ block exceeds step-climbing threshold ($\le 0.5$ blocks).
  - Player horizontal movement is blocked (velocity along X goes to 0).
  - Repeat the test with a half-block slab or slope ($\le 0.5$). Player automatically slides upward to `(2.0, 64.5, 1.0)` without collision blocking.
* **Partial Failure/Boundary Resilience:** If player stands near bedrock boundary (y = 0), collision boundaries lock movement in the negative Y axis (gravity constant terminates acceleration).
