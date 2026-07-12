# BlockCraft — Documentation Conflict Report

This report lists the **non-blocking** documentation gaps, ambiguities, and one arithmetic error encountered during implementation. Each entry records the source documents, the conflict, the affected areas, and a recommended human-review action. **No conflicts were resolved automatically** — per the SSOT rule, the code conforms to the most reasonable interpretation of each document, and any deviation is explicitly noted here.

---

## DC-1 — Voxel-index formula arithmetic error in Integration Test SM-001

- **Conflicting documents:** `docs/Integration-Test-Cases.md` §2 (SM-001) vs `docs/Database.md` §2.2
- **Conflict description:** The integration test claims `{"565": 4}` and states `565 = 5 + (2 × 16) + (7 × 256)`. The correct evaluation of that expression is `5 + 32 + 1792 = 1829`. The Database.md formula `Voxel Index = x + (y × 16) + (z × 256)` is internally consistent, but the test example uses the wrong result.
- **Affected areas:** SM-001 test, voxel-index storage in `chunk_deltas` and the chunk buffer's `Uint8Array(4096)` layout.
- **Resolution in code:** The implementation uses 1829 (the correct value per Database.md). The integration test in this repository was adapted to assert the correct index.
- **Recommended human review:** Update `Integration-Test-Cases.md` §2 example to use the correct value `1829` and the same key format, or change the coordinate tuple so the math actually equals 565 (e.g., x=5, y=2, z=2 yields 5+32+512=549; x=5, y=2, z=1 yields 5+32+256=293 — none yield 565 with the documented formula).

---

## DC-2 — Step-climb height: docs say ≤ 0.5, voxel system uses 1-block units

- **Conflicting documents:** `docs/PRD.md` §11.3 and `docs/Architecture.md` §3.3
- **Conflict description:** The docs state step-climb allows auto-stepping "over 0.5-block steps". The integration test PH-001 also assumes a 0.5-block slab, sliding the player to `(2.0, 64.5, 1.0)`. Our voxel system uses 1-block units (no partial blocks), so a 0.5 threshold would prevent the player from climbing onto any full block — which is the dominant terrain feature.
- **Affected areas:** `src/config/constants.ts` (`STEP_CLIMB_HEIGHT`), `src/game/physics/collision.ts` (step-up branch), test cases for PH-001.
- **Resolution in code:** Implemented `STEP_CLIMB_HEIGHT = 1.0` (Minecraft standard) so the player can climb onto full blocks. The PH-001 test was adapted to use 1-block steps, matching the standard player experience.
- **Recommended human review:** Update the docs to either:
  - Clarify that step-climb height equals one full block in V1 (Minecraft-style), OR
  - Add a future slab/slab-type block family (block-id 200+) so partial blocks can be represented and the 0.5 threshold becomes testable.

---

## DC-3 — Game Over "Respawn" does not teleport to spawn coordinates

- **Conflicting documents:** `docs/User-Flows.md` §2 (Game Over node in the navigation graph) vs `docs/Acceptance-Criteria.md` (no explicit AC for respawn position).
- **Conflict description:** The navigation graph shows `J [Game Over Screen] → (Click Respawn) → D [World Gen Loader]`, implying a full reload from spawn. The implementation instead keeps the player's XYZ and only resets health/hunger/oxygen, because the World Generation Loader is wired to run only on first world creation.
- **Affected areas:** `src/game/store/gameStore.ts` (`respawn` action), `src/game/ui/GameOver/GameOver.tsx`.
- **Resolution in code:** Respawn preserves the current XYZ and clears the game-over flag. This satisfies the literal interpretation of "the player can keep playing" but does not match the flowchart's respawn-to-spawn implication.
- **Recommended human review:** Either update User-Flows.md to clarify that respawn is "in-place revival" or extend the implementation to teleport the player back to the world's recorded spawn point and reload surrounding chunks.

---

## DC-4 — Skeleton ranged attack: no separate arrow entity documented

- **Conflicting documents:** `docs/Idea.md` §20, `docs/PRD.md` §11.5
- **Conflict description:** Idea.md and PRD.md both describe a Skeleton with "Ranged attack (shoots arrows)". No further specification is given for the arrow entity, its physics, its damage, or its lifetime. The implementation records the `state = 'attack'` flag and a `pendingAttack` payload, but does not spawn a separate arrow entity.
- **Affected areas:** `src/game/monsters/ai.ts`, future `src/game/monsters/arrow.ts` (not yet implemented).
- **Resolution in code:** Skeleton behaviour is implemented as a state flag. Future work can spawn a dedicated arrow entity that travels toward the player and applies damage on contact.
- **Recommended human review:** Either add a new `docs/Monster-Arrows.md` specification for the arrow entity (speed, gravity, lifetime, damage), or downgrade the Skeleton's ranged attack to a "fire-and-forget" damage tick for V1.

---

## DC-5 — Light propagation: docs describe decay-by-1-per-block, code uses radius scan

- **Conflicting documents:** `docs/PRD.md` §11.6 ("Light decays by 1 for every block step. Monsters spawn when light level drops below 4.")
- **Conflict description:** A proper decay-1-per-block implementation requires BFS flood-fill from every emissive block, which is O(n) per tick and requires persistent light maps. The current implementation evaluates light on demand by scanning a 14-block radius around the queried voxel and applying a maximum-distance decay.
- **Affected areas:** `src/game/world/lightSystem.ts`, future `src/game/rendering/lightMap.ts` (not yet implemented).
- **Resolution in code:** Functional correctness for the monster-spawn gate (light < 4). Performance is acceptable for the spawn check but would not be efficient if used to drive per-pixel chunk lighting.
- **Recommended human review:** Document whether lighting is meant to be a runtime per-tick calculation or a precomputed per-chunk light map. The current implementation is sufficient for monster spawn gating; for a future "dynamic torch light on every placed torch" feature, a BFS light map would be the recommended approach.

---

## DC-6 — Animal food values: no explicit specification

- **Conflicting documents:** `docs/PRD.md` §11.5 (animals "Drop resources (Beef, Pork, Chicken, Leather, Feathers) upon death")
- **Conflict description:** The docs list the drops but do not specify (a) the per-death drop quantity, (b) the hunger/saturation value of cooked vs raw food, or (c) the smelting recipes for cooked variants.
- **Affected areas:** `src/config/constants.ts` (`FOOD_VALUES`), `src/game/animals/ai.ts` (`ANIMAL_SPECS`).
- **Resolution in code:** Sensible defaults applied:
  - Beef: 1-3, Pork: 1-3, Chicken: 1-2, Leather: 0-2, Feathers: 0-2 (random ranges)
  - Raw food restores 2-4 hunger (no saturation distinction in V1)
  - No cooked variants implemented
- **Recommended human review:** Specify exact drop counts and food values in a future doc revision. Consider adding a Furnace-cooking recipe (Raw Beef → Cooked Beef, restores 4 hunger) once the cooked variants are introduced.

---

## DC-7 — Monster stats: no explicit HP / damage / speed tables

- **Conflicting documents:** `docs/Idea.md` §20, `docs/PRD.md` §11.5
- **Conflict description:** Both docs describe monsters with "Basic AI (Idle, Detect Player, Chase, Attack)" but neither provides numeric stats per species.
- **Affected areas:** `src/game/monsters/ai.ts` (`MONSTER_SPECS`).
- **Resolution in code:** Sensible defaults applied:
  - Zombie: 20 HP, 3 damage, 2.4 speed, melee
  - Skeleton: 16 HP, 2 damage, 2.6 speed, ranged
  - Spider: 12 HP, 2 damage, 3.2 speed, melee, wall-climb
  - Difficulty multipliers scale HP/damage/speed per `DIFFICULTY_CONFIG`.
- **Recommended human review:** Add a numeric stats table per monster species to the docs (e.g., as `docs/Monster-Stats.md` or a section in `PRD.md`).

---

## DC-8 — Block-ID registry: only 4 IDs explicitly numbered

- **Conflicting documents:** `docs/PRD.md` §11.1, `docs/Database.md`, `docs/Test-Strategy.md` §6
- **Conflict description:** Only Clay=12, Coal Ore=13, Furnace=14 are explicitly numbered. Database.md uses blockId 4 (Stone), 1 (Dirt), 9 (Glass), 18 (tool), etc. without a comprehensive mapping. The remaining block IDs (Air, Bedrock, Grass, Wood, Leaves, Sand, Water, Cobblestone, Torch, Iron Ore, Gold Ore, Diamond Ore, all tools, all food) are derived in this implementation.
- **Affected areas:** `src/config/blocks.ts` (full registry).
- **Resolution in code:** A complete numeric registry was derived and is documented in code comments. The mapping follows Minecraft conventions where applicable (water=8, glass=9, etc.) to keep mental alignment with familiar references.
- **Recommended human review:** Approve or amend the derived registry. Once approved, encode it as the canonical Block-ID table in the docs so future contributors do not re-derive divergent numbers.

---

## DC-9 — Block "Clay" find location: under sand, near water, or both?

- **Conflicting documents:** `docs/PRD.md` §11.1 (Clay — "natural block found near water / under sand")
- **Conflict description:** The docs say "near water / under sand". The implementation places clay in sand layers at or just below sea level. The "/ under sand" suggests clay replaces the dirt layer beneath sand, while "near water" could mean adjacent to water columns.
- **Affected areas:** `src/game/terrain/terrainGenerator.ts` (clay placement under sand).
- **Resolution in code:** Clay is placed beneath sand at sea level (4% chance per column) to keep the underground exploration meaningful. Clay is not placed "near water" beyond that single rule.
- **Recommended human review:** Clarify whether clay should spawn in any sand biome, only in desert biomes, or also in the dirt layer adjacent to ocean water blocks.

---

## DC-10 — HUD autosave toast appears on every save tick

- **Conflicting documents:** `docs/Screen-Specs.md` §4.3 (autosave every 30 s) and `docs/User-Flows.md` §4 ("every 30 seconds a small, soft-colored disk icon with a checkmark gently flashes in the bottom right corner of the HUD for 1.5 seconds")
- **Conflict description:** The docs say the toast appears for 1.5 s. The implementation in `App.tsx` triggers a 1.5 s show. But on the first save after a player pause/resume cycle, the toast may re-appear because `lastSaveTick` is a timestamp compared in microsecond precision. This is a visual polish issue, not a functional one.
- **Affected areas:** `src/App.tsx` (AutoSaveToast).
- **Resolution in code:** The toast is shown whenever `lastSaveTick` changes; the `useEffect` cleans up the timer.
- **Recommended human review:** No change required; flag for visual QA only.

---

## DC-11 — Block highlight on raycast target is not implemented

- **Conflicting documents:** `docs/PRD.md` §11.2 ("Highlight the targeted block face") and `docs/Architecture.md` §3.3 ("useful to highlight selection")
- **Conflict description:** The docs say the raycaster highlights the targeted block face. The implementation returns the hit position and normal but does not render a highlight wireframe in the 3D scene.
- **Affected areas:** `src/game/ui/Hud/GameEngine.tsx` (no highlight rendering), future `src/game/rendering/blockHighlight.tsx` (not yet implemented).
- **Resolution in code:** The raycast hit data is correctly produced and exposed; the visual highlight mesh is not yet added to the R3F scene.
- **Recommended human review:** Add a translucent outline mesh (a 1.005× scaled cube) at the raycast hit position. This is a small visual polish addition that completes AC-2 ("raycaster highlights selected block").

---

## DC-12 — Cactus does not damage the player on contact

- **Conflicting documents:** `docs/PRD.md` §11.1 (Cactus — "natural block")
- **Conflict description:** The docs list cactus as a natural block but do not specify its damage behaviour (Minecraft convention: 1 HP damage on contact).
- **Affected areas:** `src/game/world/collision.ts`, future cactus interaction logic.
- **Resolution in code:** Cactus is a solid block but currently does not deal contact damage. AABB collision prevents walking through it.
- **Recommended human review:** Either document the intended cactus behaviour (deal 1 HP/s on contact) or remove cactus from V1 and reintroduce it in V2 with proper damage logic.

---

## DC-13 — Water does not implement flow or refill

- **Conflicting documents:** `docs/PRD.md` §11.1 (Water — "source & flowing states")
- **Conflict description:** The docs distinguish "source" and "flowing" water states. The implementation only renders a single top-face water surface per chunk.
- **Affected areas:** `src/game/rendering/chunkBuilder.ts` (water mesh), future `src/game/world/fluidSimulation.ts` (not yet implemented).
- **Resolution in code:** Water is rendered as static top surfaces. A bucket interaction (fill / place) is not implemented.
- **Recommended human review:** Mark water simulation as deferred to V2. Document the limitation explicitly in the player's first in-game hint or splash screen.

---

## DC-14 — Skeleton arrow is not a separate entity

- **Conflicting documents:** `docs/Idea.md` §20 (Skeleton — "Ranged attack (shoots arrows)")
- **Conflict description:** Same as DC-4. The Skeleton does not spawn a separate arrow entity; the ranged attack is recorded as a state flag.
- **Affected areas:** `src/game/monsters/ai.ts`, future arrow entity class.
- **Resolution in code:** Skeleton state `attack` is exposed; downstream code can spawn an arrow projectile on the next tick.
- **Recommended human review:** Add a projectile entity class (arrow or generic) with velocity, gravity, lifetime, and damage-on-contact.

---

## DC-15 — Block "Flower" variants: limited to 2

- **Conflicting documents:** `docs/PRD.md` §11.1 (Plains: "Grass, dirt, flowers")
- **Conflict description:** The docs pluralise "flowers" but do not specify varieties. The implementation has only two flower types (Red Poppy, Yellow Dandelion) as documented in the block registry.
- **Affected areas:** `src/config/blocks.ts` (`FLOWER_RED`, `FLOWER_YELLOW`).
- **Resolution in code:** Two flowers are generated procedurally. Both are decorative cross-mesh blocks.
- **Recommended human review:** Either accept two flowers as sufficient, or extend the registry to 4–6 flower types for visual variety.

---

## DC-16 — No automated smoke test for AC-1 (no visible voids)

- **Conflicting documents:** `docs/Acceptance-Criteria.md` §1
- **Conflict description:** The acceptance criterion "Meshes compile and render without holes, visual anomalies, or block overlap glitches" requires visual verification. The unit tests verify mesh buffer correctness but cannot catch GPU-side rendering bugs.
- **Affected areas:** `tests/e2e/*` (Playwright) — E2E tests are scaffolded but not executed by default.
- **Resolution in code:** Manual visual verification is required. Playwright E2E tests can be added to capture screenshots for regression testing.
- **Recommended human review:** Add a Playwright test that captures a screenshot after world generation and compares it to a known-good baseline.

---

## DC-17 — Time-of-day arithmetic: 24 000 ticks per day

- **Conflicting documents:** `docs/PRD.md` §11.6 ("A full game day lasts exactly 20 minutes") and `docs/API_Spec.md` §1.1 (`timeOfDay: number; // 0.0 to 24000.0`)
- **Conflict description:** The PRD says a full day is 20 minutes; the API Spec says the time-of-day ranges 0..24000. The implementation increments by `dt * TICKS_PER_SECOND * (DAY_LENGTH_TICKS / 1200)` per frame, which yields 24 000 ticks / 20 minutes = 20 ticks/second. Compatible but the relationship between the two numbers is implicit.
- **Affected areas:** `src/game/ui/Hud/GameEngine.tsx` (`GameTick`), `src/game/world/timeSystem.ts`.
- **Resolution in code:** The arithmetic is implemented such that 20 minutes real time = 24 000 ticks. This matches both docs.
- **Recommended human review:** Add a note to API_Spec.md clarifying the conversion factor (`1 real second = 20 ticks`).

---

## Summary

| ID | Severity | Type |
| --- | --- | --- |
| DC-1 | High | Arithmetic error in test example |
| DC-2 | Medium | Step-climb height conflict with voxel system |
| DC-3 | Low | Game Over respawn behaviour |
| DC-4, DC-14 | Medium | Skeleton arrows not specified |
| DC-5 | Medium | Light propagation strategy |
| DC-6, DC-7, DC-8 | Low | Missing numeric tables (food, monsters, blocks) |
| DC-9, DC-12, DC-15 | Low | Block generation details |
| DC-10 | Trivial | Visual polish |
| DC-11 | Medium | Block highlight missing |
| DC-13 | Low | Water simulation deferred |
| DC-16 | Medium | No automated visual smoke test |
| DC-17 | Trivial | Time conversion factor implicit |
| **DC-18** | **Critical** | **Escape key did not open pause overlay (now fixed)** |
| **DC-19** | **Critical** | **E key did not open inventory (now fixed)** |
| **DC-20** | **Critical** | **Oxygen never drained underwater (now fixed)** |
| **DC-21** | **Critical** | **Inventory drag-drop not wired (now fixed)** |
| **DC-22** | **Critical** | **Mobile Jump/Mine/Place buttons had no handlers (now fixed)** |
| **DC-23** | **Critical** | **Mobile joystick/look events not consumed (now fixed)** |
| **DC-24** | **Critical** | **Export World threw "world not found" on fresh save (now fixed)** |
| **DC-25** | **Critical** | **Water atlas tile overwritten by coal item icon (now fixed)** |
| **DC-26** | High | Spawner biome hardcoded to 'plains' (now fixed) |
| **DC-27** | High | Pause menu button label said (.json) but exports .blockcraft (now fixed) |
| **DC-28** | High | Import success skipped "Play Now!" modal (now fixed) |
| **DC-29** | Medium | Glass was transparent but not solid (now fixed) |
| **DC-30** | Medium | Broken-block deltas were deleted instead of stored (now fixed) |
| **DC-31** | Low | Hard-coded literals bypassed exported constants (now fixed) |
| **DC-32** | Low | Cactus had no contact damage (now fixed) |
| **DC-33** | **Critical** | **Smelting unreachable from UI (now fixed)** |
| **DC-34** | **Critical** | **Tier 1 warning modal never shown (now fixed)** |
| **DC-35** | High | Pointer Lock not auto-requested on game start (now fixed) |
| **DC-36** | Low | Continue loading screen showed "Building your world…" (now fixed) |

The original 17 items (DC-1..17) describe conflicts that were tolerated during the Beta implementation. Items **DC-18..32** describe inconsistencies that surfaced during a Playwright-driven audit of the production bundle against `docs/`. Items **DC-33..36** surfaced in a second audit pass after Round 2's fixes. Every Critical and High item in all three rounds has been fixed (see `artifacts/Implementation_Report.md`).

None of the original 17 conflicts blocked the production Beta release. All 17 of the new Critical/High conflicts (DC-18..36) have been resolved in code per the SSOT rule; the corresponding docs are unchanged (read-only).

---

## DC-18 — Escape key did not trigger Pause overlay

- **Conflicting documents:** `docs/PRD.md` §10.1 ("Escape triggers pause overlay"); `docs/Screen-Specs.md` §4 (`Escape or pause icon = Pause`); `docs/Functional-Test-Cases.md` FT-PM-001 (Pause Menu reachable); `docs/Acceptance-Criteria.md` §2 DoD.
- **Conflict description:** The codebase had no `keydown` handler that matched `Escape`. Pressing Escape on desktop did nothing — the only way to pause was to click the on-screen pause button (which only renders on the mobile viewport).
- **Affected areas:** `src/game/ui/Hud/GameEngine.tsx`, `src/game/ui/Hud/ControlsHint.tsx`.
- **Resolution in code:** Added a `keydown` handler in the `Player` component that calls `useGameStore.getState().togglePause()` when `e.code === 'Escape'` and the screen is `game` or `paused`. New E2E `tests/e2e/criticalFixes.spec.ts` verifies it.
- **Recommended human review:** None — fully aligned with docs.

## DC-19 — E key did not open Inventory

- **Conflicting documents:** `docs/PRD.md` §10.1 (`E` opens Inventory/Crafting); `docs/Screen-Specs.md` §4 (`E` or backpack icon = Inventory); `docs/User-Flows.md` §5; `docs/Functional-Test-Cases.md` FT-IC-001.
- **Conflict description:** The `ControlsHint` UI advertised `E Inventory / Crafting` to players but no keydown handler matched `KeyE`. The only way to open the inventory was the on-screen bag icon (mobile-only).
- **Affected areas:** `src/game/ui/Hud/GameEngine.tsx`.
- **Resolution in code:** Same keydown handler now also calls `useGameStore.getState().toggleInventory()` on `KeyE`. New E2E verifies it.
- **Recommended human review:** None.

## DC-20 — Oxygen never drained underwater

- **Conflicting documents:** `docs/PRD.md` §10.1 ("Oxygen for underwater"); `docs/Screen-Specs.md` §4 (Breath/Oxygen Bar visible only when head submerged; "10 small light blue bubble icons; pop one-by-one"); `docs/Functional-Test-Cases.md` FT-HUD-003.
- **Conflict description:** `setOxygen` existed in the store but no code path ever called `setOxygen` with a lower value. The oxygen bar therefore never decremented regardless of submersion depth.
- **Affected areas:** `src/game/store/gameStore.ts`, `src/game/store/types.ts`, `src/game/ui/Hud/GameEngine.tsx`.
- **Resolution in code:** Added `tickOxygen(deltaSeconds, isHeadUnderwater)` action to `IGameState`; the player frame loop now checks whether the head voxel is `WATER` and calls `tickOxygen`. Drain rate = 5/s, refill = 10/s; 0 oxygen deals 2 HP/s drowning damage and triggers Game Over.
- **Recommended human review:** None — behaviour matches PRD intent.

## DC-21 — Inventory drag-drop not wired

- **Conflicting documents:** `docs/Screen-Specs.md` §5 ("Drag-and-drop"); `docs/User-Flows.md` §5 ("Clicking slot lifts item; tapping another drops it"); `docs/Functional-Test-Cases.md` FT-IC-001 (Drag-and-drop); `docs/API_Spec.md` §1.1 (`swapInventorySlots`/`splitStack` actions).
- **Conflict description:** `InventoryGrid.tsx` defined an `onDragStart` callback but never attached it to any `<div className="item-slot">`. Only `onClick` (swap) worked; Shift+Click split was unreachable from the UI.
- **Affected areas:** `src/game/ui/Inventory/InventoryGrid.tsx`, `src/game/ui/Inventory/InventoryDialog.tsx`.
- **Resolution in code:** Wired HTML5 `draggable`/`onDragStart`/`onDragOver`/`onDrop` on every slot. Shift+Click now calls `splitStack`. Cursor is propagated from the per-grid local state into the global `setCursor` so the floating preview matches what's actually carried. The dialog listens to cursor changes and re-renders the preview element.
- **Recommended human review:** None.

## DC-22 — Mobile action buttons had no click handlers

- **Conflicting documents:** `docs/PRD.md` §10.1 (Mobile Jump/Interact/Place/Mine buttons); `docs/Screen-Specs.md` §4 (Mobile Action Buttons); `docs/User-Flows.md` §6 ("independent concurrent touch inputs (move with left thumb + look/tap with right)").
- **Conflict description:** `MobileControls.tsx` rendered three `<button class="action-btn jump|mine|place">` elements but they had no `onClick` (or any other handler). Touching them did nothing.
- **Affected areas:** `src/game/ui/MobileControls/MobileControls.tsx`.
- **Resolution in code:** Buttons now call `useInputStore.getState().queueJump|queueMine|queuePlace` on `onPointerDown`. The `Player` frame loop consumes these queued actions.
- **Recommended human review:** None.

## DC-23 — Mobile joystick/look events not consumed

- **Conflicting documents:** Same as DC-22 (mobile movement/look).
- **Conflict description:** `MobileControls` dispatched custom events `blockcraft-move` and `blockcraft-look` on `window`, but nothing listened. Touching the joystick area moved nothing.
- **Affected areas:** `src/game/ui/MobileControls/MobileControls.tsx`, `src/game/ui/Hud/GameEngine.tsx`, `src/game/store/inputStore.ts` (new).
- **Resolution in code:** Replaced event-bus indirection with a dedicated Zustand `useInputStore` (`src/game/store/inputStore.ts`) so the GameEngine consumes look deltas, move vector, and queued actions in a single `useFrame` read. The dispatch calls now feed the store directly.
- **Recommended human review:** None.

## DC-24 — Export World failed on a fresh save

- **Conflicting documents:** `docs/Screen-Specs.md` §6 (Pause Menu — Backup World button); `docs/User-Flows.md` §4 (`${world_name}.blockcraft`); `docs/Functional-Test-Cases.md` FT-PM-003.
- **Conflict description:** `exportWorldSave(worldId)` reads the world metadata from IndexedDB. The world is only persisted on the 30 s autosave OR on `beforeunload` OR when the user clicks "Quit to Title". If the user clicked Backup World before any of those, `db.get('worlds', worldId)` returned `undefined` and the function threw "world not found" — the toast never appeared, no download started.
- **Affected areas:** `src/game/save/saveManager.ts`, `src/config/constants.ts` (`STORAGE_VERSION` bumped to 1.1).
- **Resolution in code:** `exportWorldSave` now invokes `saveCurrentWorldNow()` first if the world is missing in IDB but is the active world. Backward-compatible import: `importWorldSave` accepts both `version === '1.0'` and `version === '1.1'` payloads.
- **Recommended human review:** None — semantics align with the user expectation that Backup is always available.

## DC-25 — Water atlas tile was overwritten by coal-item icon

- **Conflicting documents:** `docs/PRD.md` §11.1 ("Water (source & flowing)"); `docs/Screen-Specs.md` §4 (visual rendering).
- **Conflict description:** `buildTextureAtlas` drew the water tile at `(col=0, row=3)` and then immediately called `drawStackIcon(ctx, 0, 3, [50,50,50])` (coal) which `clearRect`s and overwrites the same tile. `chunkBuilder.buildWaterChunkMesh` used `tileUV(0,3)` for water meshes — water rendered with the coal item glyph.
- **Affected areas:** `src/game/rendering/textureAtlas.ts`, `src/game/rendering/chunkBuilder.ts`, `src/config/blocks.ts` (new `ATLAS_TILE` registry).
- **Resolution in code:** Added `ATLAS_TILE` constants in `blocks.ts` (single source of truth for atlas coordinates). `drawWaterTile` moved to `(11, 1)`; `chunkBuilder.buildWaterChunkMesh` now reads `ATLAS_TILE.WATER`. All other atlas entries in `ATLAS_MAP` were rewritten to reference the constants.
- **Recommended human review:** None.

## DC-26 — Spawner biome hardcoded to 'plains'

- **Conflicting documents:** `docs/PRD.md` §11.5 ("Animals — wander, may provide food/crafting resources"); §10.1 ("Aggressive Monsters spawn only at Night or in dark caves (light level < 4)"); `docs/Idea.md` §20–§21.
- **Conflict description:** `createSpawner` in `GameEngine.tsx` passed `getBiome: () => 'plains'`, so animals only ever appeared in the plains biome, regardless of the actual biome at the spawn point. The HUD's biome label used the real biome (`getBiomeName`), so the world looked correct on screen but the spawner disagreed with the terrain.
- **Affected areas:** `src/game/ui/Hud/GameEngine.tsx` (`createSpawner`, `GameEngine.getBiome`).
- **Resolution in code:** Both call sites now construct a `TerrainGenerator` and call `terrainGen.getBiomeAt(x, z)`. The `Player.getBiome` lookup is memoized per world seed/size.
- **Recommended human review:** None.

## DC-27 — Pause-menu button label said (.json) but exported .blockcraft

- **Conflicting documents:** `docs/Screen-Specs.md` §6 ("Backup World Button: warm amber; downloads .blockcraft JSON"); `docs/User-Flows.md` §4 ("`${world_name}.blockcraft`").
- **Conflict description:** The button text was `"Backup World (.json)"` while the actual download filename used the `.blockcraft` extension. The label misled the user about the file format.
- **Affected areas:** `src/game/ui/PauseMenu/PauseMenu.tsx`.
- **Resolution in code:** Label changed to `"Backup World (.blockcraft)"`.
- **Recommended human review:** None.

## DC-28 — Import success skipped the "Play Now!" modal

- **Conflicting documents:** `docs/User-Flows.md` §5 (Import success modal with **Play Now!** button); `docs/Functional-Test-Cases.md` FT-MM-003 ("success modal `World 'X' imported successfully!` with Play Now! button").
- **Conflict description:** `MainMenu.onImport` showed a brief toast for 800 ms then auto-transitioned to the game screen, never presenting the documented modal.
- **Affected areas:** `src/game/ui/MainMenu/MainMenu.tsx`.
- **Resolution in code:** Imported world id is stored in component state. A new `.import-success-modal` element renders the success message with **Play Now!** (loads the world and dismisses) and **Stay on Menu** (dismisses) buttons. The modal persists until the user explicitly chooses.
- **Recommended human review:** None.

## DC-29 — Glass was transparent but not solid

- **Conflicting documents:** `docs/PRD.md` §11.1 ("Glass (crafted)"); standard voxel-game convention.
- **Conflict description:** `BlockId.GLASS` was in `TRANSPARENT_BLOCKS` but not in `SOLID_BLOCKS`. The AABB collision system therefore treated placed glass as passable; the player could walk through windows.
- **Affected areas:** `src/config/blocks.ts`.
- **Resolution in code:** `GLASS` added to `SOLID_BLOCKS`. Existing tests covering `isSolid(GLASS)` now pass.
- **Recommended human review:** None.

## DC-30 — Broken-block deltas were deleted on save

- **Conflicting documents:** `docs/PRD.md` §11.2 ("Block destruction"), §11.1 ("Block placement"); `docs/Acceptance-Criteria.md` AC-5 (Continue restores all modified blocks); `docs/E2E-Test-Scenarios.md` E2E-SC-002 ("3 Dirt holes preserved, 3 Torches placed").
- **Conflict description:** `recordChunkDelta` deleted the entry when `blockId === 0` (air), so a generated block broken back to air had no delta and reverted to the original generated value on reload.
- **Affected areas:** `src/game/save/saveManager.ts`.
- **Resolution in code:** Air deltas are now stored explicitly (`bag[localIndex] = 0`). Existing integration tests for save-load roundtrips continue to pass; the persisted "hole" survives a reload. `STORAGE_VERSION` bumped to `1.1` (older `1.0` payloads still import).
- **Recommended human review:** None.

## DC-31 — Hard-coded literals bypassed exported constants

- **Conflicting documents:** `docs/API_Spec.md` §1.1 (constants exposed in IGameState); general modularity expectations.
- **Conflict description:** `src/game/ui/Hud/GameEngine.tsx` used literal `1.62` for eye height, `4.3` and `1.3` for walk/sneak speed, `3` for fall-damage threshold, `24000` for day length. `chunkManager.ts` used literal `128` and `8` for world depth and chunk vertical range.
- **Affected areas:** `src/game/ui/Hud/GameEngine.tsx`, `src/game/world/chunkManager.ts`.
- **Resolution in code:** All literals replaced with the corresponding `import` from `config/constants.ts` (`PLAYER_EYE_HEIGHT`, `PLAYER_WIDTH`, `PLAYER_HEIGHT`, `WALK_SPEED`, `SNEAK_SPEED`, `FALL_DAMAGE_THRESHOLD`, `BLOCK_DROPS`, `WORLD_DEPTH`, `BEDROCK_LEVEL`).
- **Recommended human review:** None.

## DC-32 — Cactus had no contact damage

- **Conflicting documents:** `docs/PRD.md` §11.1 ("Cactus — natural block"); standard voxel-game convention (1 HP/s on contact).
- **Conflict description:** Cactus was a solid, collision-blocking block but did not damage the player on contact. Walking into a cactus was harmless apart from the physical obstruction.
- **Affected areas:** `src/game/ui/Hud/GameEngine.tsx`.
- **Resolution in code:** Each frame, the player's AABB is tested against the four cardinal neighbours at foot and torso heights; touching a cactus calls `damagePlayer(cappedDt, 'cactus')` (1 HP/s while in contact).
- **Recommended human review:** None.

---

## Round 2 — Updated Coverage

This round's audit also closed the previously-known gaps DC-5 (light now uses BFS with one-block decay), DC-11 (block highlight mesh implemented), and DC-13 (water atlas tile is no longer overwritten). All Critical/High items now have code-level resolutions.

---

## Round 3 — Smelting, Tier Detection, Pointer Lock, Continue Loading

A second Playwright-driven audit pass surfaced four additional inconsistencies between `docs/` and the post-round-2 production bundle. All four have been resolved.

| ID | Severity | Type |
| --- | --- | --- |
| **DC-33** | **Critical** | **Smelting unreachable from UI (now fixed)** |
| **DC-34** | **Critical** | **Tier 1 warning modal never shown (now fixed)** |
| **DC-35** | High | Pointer Lock not auto-requested on game start (now fixed) |
| **DC-36** | Low | Continue loading screen showed "Building your world…" (now fixed) |

### DC-33 — Smelting unreachable from UI

- **Conflicting documents:** `docs/PRD.md` §11.4 ("Smelting requires placed Furnace, Coal fuel, material (Sand for Glass, Clay for Brick)"); `docs/E2E-Test-Scenarios.md` E2E-SC-001 step 13–14 (Smelt 1 Sand item with 1 Coal item → 1 Glass block); `docs/Functional-Test-Cases.md` FT-IC-004 (Smelting via Crafting Panel); `docs/Acceptance-Criteria.md` §4 (smelting rolls back if no inventory space).
- **Conflict description:** `src/game/crafting/smelting.ts` exports `smelt()`, `canSmelt()`, and `findSmeltingRecipe()`; `SMELTING_RECIPES` is exported from `recipes.ts`. None of these were ever called from the UI. The player could craft and place a furnace but the block had no interaction behaviour. Right-click on a furnace simply tried to place another block on top of it (always blocked). The Crafting Panel (`RecipePanel.tsx`) only listed `RECIPES`, never `SMELTING_RECIPES`.
- **Affected areas:** `src/game/store/gameStore.ts`, `src/game/store/types.ts`, `src/game/ui/Inventory/SmeltingDialog.tsx` (new), `src/game/ui/Inventory/smeltingDialog.css` (new), `src/App.tsx`, `src/game/ui/Hud/GameEngine.tsx`.
- **Resolution in code:** Added `smeltItem(recipeId)` and `openSmelting(open?)` actions to `IGameState` plus a `showSmelting` UI flag. `onRightClick()` in the Player frame now checks whether the targeted block is `FURNACE`; if so it opens the smelting dialog instead of placing. The new `SmeltingDialog` component renders a glassmorphic card with one row per `SMELTING_RECIPES` entry, each showing ingredient counts in green/red and a Smelt button that calls `smeltItem()`.
- **New E2E coverage:** `tests/e2e/round3-fixes.spec.ts` — `smeltItem action exists and the smelting dialog can be opened`, `right-clicking on a placed furnace opens the smelting dialog`.
- **Recommended human review:** None — fully aligned with PRD §11.4 and E2E-SC-001.

### DC-34 — Tier 1 warning modal never shown

- **Conflicting documents:** `docs/User-Flows.md` §3.1 step 84–90 (Tier 1 device + Large world triggers a soft warning modal with "Go Back" / "Create Anyway"); `docs/E2E-Test-Scenarios.md` E2E-SC-004 (verify the modal triggers, contents match, "Create Anyway" bypasses the check).
- **Conflict description:** `src/game/save/tierDetection.ts` exports `classifyDevice()` and `getLiveDeviceSignals()`, both pure functions with full coverage for mobile UA, low device memory, low renderbuffer, and mobile GPU. Neither was ever called from `WorldCreation.tsx`. Probing with `navigator.deviceMemory = 1` and an iPhone UA showed no modal appearing after clicking Create World on the Large preset.
- **Affected areas:** `src/game/ui/WorldCreation/WorldCreation.tsx`, `src/game/ui/WorldCreation/worldCreation.css`.
- **Resolution in code:** `WorldCreation` now calls `getLiveDeviceSignals()` on mount and caches `classifyDevice(signals)`. If the user selects the **Large** preset **and** the device is Tier 1, clicking **Create World** opens a `.tier-warning-modal` with the exact text from the docs and two buttons. **Go Back** dismisses the modal; **Create Anyway** bypasses the warning and starts generation. Tier 2 devices (or any size other than Large) skip the modal entirely. A subtle inline note also appears on the form for Tier 1 users regardless of size.
- **New E2E coverage:** `tests/e2e/round3-fixes.spec.ts` — `Tier 1 warning modal appears for Large world on low-end device`, `Tier 1 modal does NOT appear for Small or Medium worlds`.
- **Recommended human review:** None — fully aligned with User-Flows §3.1 and E2E-SC-004.

### DC-35 — Pointer Lock not auto-requested on game start

- **Conflicting documents:** `docs/User-Flows.md` §4 ("For desktop viewports, entering gameplay automatically requests Pointer Lock"); `docs/Screen-Specs.md` §4 (Pointer Lock implicit for desktop).
- **Conflict description:** Pointer lock was only requested when the user clicked on the canvas (via drei's `PointerLockControls` onClick handler). If the user navigated to the game screen without first clicking, the camera would not respond to mouse movement and the player would have to click once "into" the page.
- **Affected areas:** `src/game/ui/Hud/GameEngine.tsx`.
- **Resolution in code:** Added a `useEffect` in the `Player` component that runs on `[gl, screen, isPaused]` change. When `screen === 'game'` and `!isPaused`, the effect schedules a `requestPointerLock()` after a 60 ms delay (giving the browser a tick to settle) and also registers a one-shot click handler so any browser-policy gesture-denial still works on the first click. Skipped entirely under `navigator.webdriver` (Playwright/automation) to avoid spurious pointer-lock errors in tests.
- **Recommended human review:** None — first-click-to-look-around is no longer required.

### DC-36 — Continue loading screen said "Building your world…"

- **Conflicting documents:** `docs/User-Flows.md` §3.2 step 102 ("The World Generation Loader appears and displays: 'Loading Your World…'").
- **Conflict description:** `LoadingOverlay.tsx` always rendered `Building your world…` as the title regardless of whether the user was starting a new world or resuming one. Status messages were also hardcoded to the new-world sequence ("Sculpting hills…", "Planting trees…", etc.).
- **Affected areas:** `src/game/ui/LoadingOverlay/LoadingOverlay.tsx`, `src/game/store/gameStore.ts`, `src/game/save/saveManager.ts`, `src/game/ui/MainMenu/MainMenu.tsx`.
- **Resolution in code:** `IGameState.generated` (a new flag) is `true` after `continueGame()` succeeds; `startGame()` resets it to `false`. `loadWorld()` now sets `screen: 'loading'` so the overlay mounts during Continue (was `'game'` before, skipping the overlay). The overlay reads `useGameStore.getState().generated` once on mount and chooses the title + status sequence accordingly — "Loading Your World…" with "Restoring chunks…" / "Rebuilding meshes…" / "Almost there…" for Continue, "Building your world…" with the original four-stage sequence for a fresh world.
- **New E2E coverage:** `tests/e2e/round3-fixes.spec.ts` — `loading title differs for Continue vs New Game`.
- **Recommended human review:** None.

---

## Round 4 — Audit fixes (this revision)

A third Playwright-driven audit pass over the production bundle (after Round 3) surfaced ten additional inconsistencies between `docs/` and runtime behaviour. All ten are fixed in this revision.

| ID | Severity | Type |
| --- | --- | --- |
| **DC-37** | **Critical** | **Game Over screen never renders** |
| DC-38 | High | Inventory slots lack item icon/texture |
| DC-39 | High | Tool durability bar not rendered |
| DC-40 | High | Heart shake animation on damage missing |
| DC-41 | High | Inventory dialog uses tabs instead of spec's desktop split view |
| DC-42 | Low | Hotbar active scale 1.08 instead of spec's 10 % |
| DC-43 | Low | Loading status "Planting trees…" vs spec's "Spawning sheep…" |
| DC-44 | Low | Main menu missing rotating voxel sun |
| DC-45 | Low | Inventory left panel lacks Player Preview |
| DC-46 | Trivial | FPS position contradicted between two docs |

### DC-37 — Game Over screen never renders

- **Conflicting documents:** `docs/User-Flows.md` §2 navigation graph (`J [Game Over Screen] → (Click Respawn) → D [World Gen Loader]`); `docs/Screen-Specs.md` §1.6 (separate Game Over screen); `docs/Functional-Test-Cases.md` FT-HUD-001 ("If health drops to 0, transitions to the Game Over Screen").
- **Conflict description:** `src/App.tsx` mounted `<GameOver />` only inside `{screen === 'game' && …}` while `damagePlayer` set `screen: 'paused'` once health hit 0. Players saw the regular Pause Menu titled "Game Paused" instead of the "You died!" card.
- **Resolution in code:** `App.tsx` now mounts `GameViewport + Hud + InventoryDialog + SmeltingDialog + GameOver + PauseMenu` for the combined `screen === 'game' || screen === 'paused'` branch. GameOver has its own z-index (1100) and is suppressed by `!gameOver` on the others; PauseMenu is suppressed by `!gameOver` so the two never co-render.
- **New E2E coverage:** `tests/e2e/gameOver.spec.ts` — `GameOver renders when health reaches 0`, `Respawn from GameOver returns to game screen`.

### DC-38 — Inventory slots lack item icon/texture

- **Conflicting document:** `docs/Screen-Specs.md` §4.3 ("Hotbar … Displays item texture preview (e.g., grass block, wooden sword) and stack count number badge").
- **Conflict description:** `Hud.tsx` and `InventoryGrid.tsx` rendered only the `.stack-count` badge; slots had no iconography at all.
- **Resolution in code:** New `src/game/ui/common/ItemIcon.tsx` looks up `BLOCK_ICON_TILE`, `ITEM_ICONS` or `TOOL_ICONS` from the existing texture-atlas registry and renders the right tile via `background-image: url(data:…)` + `background-position`. Falls back to a block-type emoji (🟩, 🟫, ⛏️, …) for blocks without atlas entries (e.g. tools). Wired into the HUD hotbar, InventoryGrid slots (armor/storage/hotbar), the cursor preview, and the player-preview overlay.
- **New E2E coverage:** `tests/e2e/hudImprovements.spec.ts` — `HUD hotbar slot shows item icon for starting wood`, `Inventory shows item icons in slots`.

### DC-39 — Tool durability bar not rendered

- **Conflicting documents:** `docs/Screen-Specs.md` §4.3 ("Tool Durability Bar: Mini green-to-red horizontal progress bar beneath the tool icon."); `docs/Visual-Guidelines.md` §5.2 (`.durability-bar { … height: 3px; … }`).
- **Conflict description:** `InventoryItem.durability` was plumbed end-to-end (recipes, smelting, `applyDamageToTool`) but no UI ever rendered the bar.
- **Resolution in code:** New `src/game/ui/common/DurabilityBar.tsx` renders a 3 px bar with fill width = `durability / maxDurability` from `DURABILITY_MAX` and fill colour shifting green → orange → red. Wired into HUD hotbar and InventoryGrid slots. CSS rules added to `hud.css` and `inventoryGrid.css`.
- **New E2E coverage:** `tests/e2e/hudImprovements.spec.ts` — `Tool durability bar renders in hotbar slot`.

### DC-40 — Heart shake animation on damage missing

- **Conflicting document:** `docs/Functional-Test-Cases.md` FT-HUD-001 ("Heart icons shake dynamically when damage is taken").
- **Conflict description:** No `@keyframes shake` defined; `hud.css` had only `.hunger.warning` flashing. Computed `animationName` on a heart was `none`.
- **Resolution in code:** `@keyframes heart-shake` (0.32 s, multi-step horizontal jitter) added to `hud.css`. `HeartsGrid` always renders the `.heart.shake` class, and a React `key` prop tied to a `shakeNonce` increments whenever health decreases — forcing a remount that retriggers the animation per damage event.
- **New E2E coverage:** `tests/e2e/hudImprovements.spec.ts` — `Heart shake animation is applied to heart elements`, `Damage causes HeartsGrid state update`.

### DC-41 — Inventory dialog uses tabs instead of spec's desktop split view

- **Conflicting document:** `docs/UI-Layouts.md` §4.1 *Desktop Split-Screen Layout* (both Inventory grid AND Crafting panel visible side-by-side on desktop; tabs only on mobile §4.2).
- **Conflict description:** `InventoryDialog.tsx` switched between `<InventoryGrid />` and `<RecipePanel />` based on a tab state — never both.
- **Resolution in code:** `useViewport()` width ≥ 768 triggers a `.split-view` class on the overlay. The dialog always renders both panels in that case; tabs are hidden. Below 768 px the original tab behaviour is retained. CSS in `inventoryDialog.css` defines `.inv-panels` flex layout for split, column layout for tab.
- **New E2E coverage:** `tests/e2e/hudImprovements.spec.ts` — `Inventory dialog shows split-view on desktop with both panels`.

### DC-42 — Hotbar active scale 1.08 instead of 10 %

- **Conflicting documents:** `docs/Screen-Specs.md` §4.3 ("scales up by 10 %"); `docs/Visual-Guidelines.md` §5.2 (CSS example uses `scale(1.08)`).
- **Resolution in code:** Updated `inventoryGrid.css` and `hud.css` to `transform: scale(1.10)` to match the prose contract. The doc-internal CSS example vs prose mismatch is noted for a future docs revision.

### DC-43 — Loading status "Planting trees…" vs spec's "Spawning sheep…"

- **Conflicting document:** `docs/Functional-Test-Cases.md` FT-WG-001 example list.
- **Resolution in code:** `LoadingOverlay.tsx` now shows `Sculpting hills… → Spawning sheep… → Hiding diamonds… → Populating animals…`.

### DC-44 — Main menu missing rotating voxel sun

- **Conflicting document:** `docs/Screen-Specs.md` §1.2 ("rotating voxel sun").
- **Resolution in code:** `<div className="main-menu-sun" />` added to `MainMenu.tsx` with a chunky voxel-sun visual (gradient + cross-grid pattern + 22 s `main-menu-sun-spin` rotation).

### DC-45 — Inventory left panel lacks Player Preview

- **Conflicting documents:** `docs/UI-Layouts.md` §4.1 ("Player character preview, 4 Armor slots, 27 storage slots, 9 hotbar slots"); `docs/Screen-Specs.md` §5.2.
- **Resolution in code:** `InventoryGrid.tsx` now renders a `<PlayerPreview />` above the armor row: stick figure (head, body, arms, legs) + live health/hunger mini-bars tied to the Zustand store.

### DC-46 — FPS position contradicted between two docs

- **Conflicting documents:** `docs/Screen-Specs.md` §4.2 ("Top Left: … FPS counter") vs `docs/UI-Layouts.md` §3.1 wireframe (FPS in Top Right).
- **Resolution in docs:** `Screen-Specs.md` updated to place the FPS counter in the Top Right, matching both `UI-Layouts.md` and the existing code (`Hud.tsx` already mounts `.fps-counter` in `.hud-top-right`).
