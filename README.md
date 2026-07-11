# BlockCraft

A browser-native 3D voxel sandbox game. Pure frontend, no backend, no accounts.

## Quick start

```bash
npm install
npm run dev         # local dev server
npm test            # unit + integration tests (Vitest)
npm run build       # production bundle (dist/)
npm run preview     # preview the production build
npm run typecheck   # TypeScript type-check
```

## Project Structure

```
src/
  assets/                 # generated textures, audio
  components/             # small presentational helpers
  config/                 # constants, block registry, recipe data
  hooks/                  # React hooks
  utils/                  # pure helpers (RNG, math, UUID)
  styles/                 # global + design-token CSS
  workers/                # Web Worker source (chunk gen + greedy meshing)
  game/
    store/                # Zustand stores (game + settings)
    terrain/              # simplex-noise heightmap, biomes, generator
    rendering/            # texture atlas, greedy mesher, chunk builder
    world/                # chunk manager, time system, light system
    physics/              # AABB, step climb, raycast
    player/               # desktop + mobile input, handedness
    inventory/            # slots, drag-drop, durability
    crafting/             # JSON recipes, smelting
    entities/             # base entity + spawner
    animals/              # cow, pig, chicken AI + drops
    monsters/             # zombie, skeleton, spider AI
    audio/                # Web Audio API procedural SFX
    save/                 # IndexedDB autosave, .blockcraft export/import, tier detection
    ui/                   # React UI: MainMenu, WorldCreation, Loading, Hud, Inventory, Pause, GameOver, MobileControls
  App.tsx                 # top-level router
  main.tsx                # entry point + PWA registration

tests/
  unit/                   # Vitest unit tests
  integration/            # Vitest integration tests (IDB, workers)
  e2e/                    # Playwright E2E
```

## Deployment

Built artefacts in `dist/` are fully static and can be deployed to Cloudflare Pages, GitHub Pages, Netlify, or any static host. See `artifacts/Deployment_Report.md`.

## License

Source provided as a reference implementation. No warranty.
