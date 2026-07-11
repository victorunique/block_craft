# BlockCraft
*A Pure Frontend AI-Native Voxel Sandbox Game*

Version: 1.1

---

# 1. Vision

Develop **BlockCraft**, a browser-based voxel sandbox game inspired by the core gameplay of Minecraft while intentionally remaining much simpler.

The game focuses on exploration, resource gathering, crafting, survival and building, while being designed from day one as an **AI-first software project**.

The project should:

- be developed almost entirely with AI Agents
- have **no backend**
- require **no database**
- require **no user accounts**
- run completely inside the browser
- be deployed directly to Cloudflare Pages
- target a high-quality, stable production launch (Version 1.0, starting as a Beta) rather than a simple MVP prototype

The project should become a showcase of AI-assisted software engineering and modern frontend game development.

---

# 2. Core Principles

This project does **not** aim to recreate Minecraft.

Instead, it extracts the core gameplay loop.

```
Explore

↓

Collect Resources

↓

Craft Better Tools

↓

Gather Better Resources

↓

Build

↓

Explore Further

↓

Fight Monsters

↓

Upgrade Equipment

↓

Repeat
```

If this gameplay loop is enjoyable, the game succeeds.

---

# 3. Project Goals

## Must Have

- Open world
- Random world generation
- Survival Mode
- Difficulty selection
- Block placement
- Block destruction
- Inventory
- Crafting
- Day/Night cycle
- Monsters
- Animals
- Save Game
- Browser playable
- Mobile friendly

---

## Nice to Have

- Creative Mode
- Weather
- Villages
- Farming
- Fishing
- Caves
- Rivers
- Mountains
- Additional biomes
- NPCs
- AI assistants

---

## Never Required

- Multiplayer
- Login
- Backend
- Cloud database
- Authentication
- Marketplace
- Blockchain
- Complex physics

---

# 4. Target Users

Primary users

- Children
- Families
- Casual gamers
- Builders
- Creative players

Secondary users

- AI enthusiasts
- Frontend developers
- Students
- Open source contributors

---

# 5. Technology Stack

## Frontend

- React
- TypeScript
- Vite

---

## 3D Engine

- Three.js
- React Three Fiber
- Drei

---

## State Management

- Zustand

---

## Physics

Initial version

- Custom lightweight collision detection

Future

- Rapier

---

## Storage

Primary

- IndexedDB

Fallback

- localStorage

---

## World Generation

- simplex-noise

---

## Deployment

- Cloudflare Pages

---

# 6. High-Level Architecture

```
React UI

↓

Game Manager

↓

World

↓

Chunks

↓

Blocks

↓

Renderer

↓

Three.js
```

Supporting systems

```
Inventory

Crafting

Player

Animals

Monsters

Save System

Lighting

Weather

Audio
```

---

# 7. Project Structure

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

---

# 8. Game Modes

## Version 1

Only **Survival Mode** is supported.

Creative Mode is intentionally postponed until a future release.

The objective is to survive, explore, gather resources and build shelters.

---

## Future Versions

Creative Mode

Features

- Unlimited resources
- Flying
- Instant block placement
- Instant block destruction
- Focus entirely on architecture and creativity

---

# 9. Difficulty Levels

Players select a difficulty before creating a world.

## Easy

- More natural resources
- Fewer monsters
- Slower monsters
- Lower monster damage
- Faster health recovery

Recommended for children and casual players.

---

## Medium

Balanced gameplay.

Designed as the default experience.

---

## Hard

- Scarcer resources
- More monsters
- Faster monsters
- Higher monster damage
- Greater survival challenge

Recommended for experienced players.

---

# 10. World

Maximum supported world size

```
1024 × 1024 blocks
```

Before starting a new game, players choose the world size.

Available presets

- 256 × 256
- 512 × 512
- 1024 × 1024

Smaller worlds provide faster loading and better performance on lower-end devices.

Future versions may introduce chunk streaming and larger procedural worlds.

---

# 11. Terrain Generation

Use Simplex Noise.

Generate

- Grass
- Dirt
- Stone
- Sand
- Water
- Mountains

Trees are generated separately.

---

# 12. World Biomes

Version 1

- Plains
- Forest
- Desert
- Snow
- Mountains

Future

- Swamp
- Jungle
- Ocean
- Volcano

---

# 13. Blocks

Initial block types

- Grass
- Dirt
- Stone
- Wood
- Leaves
- Water
- Sand
- Glass
- Brick
- Torch

Target

20–30 block types

---

# 14. Resources

Initial resources

- Wood
- Stone
- Coal
- Iron
- Gold
- Diamond

Future

- Emerald
- Copper
- Quartz

---

# 15. Tools

- Wooden Pickaxe
- Stone Pickaxe
- Iron Pickaxe

- Wooden Axe
- Stone Axe
- Iron Axe

- Wooden Sword
- Stone Sword
- Iron Sword

---

# 16. Inventory

Simple inventory

```
36 slots
```

Features

- Drag & Drop
- Stackable items
- Hotbar

---

# 17. Crafting

Recipes are stored as JSON.

Example

```json
{
  "input": {
    "wood": 3
  },
  "output": {
    "wood_pickaxe": 1
  }
}
```

Version 1 uses a simplified crafting interface rather than a full crafting grid.

---

# 18. Building

Mouse controls

Left Click

Destroy block

Right Click

Place block

Three.js Raycaster determines the selected block.

---

# 19. Day/Night Cycle

Simple time progression.

```
Morning

↓

Day

↓

Sunset

↓

Night

↓

Morning
```

Monsters spawn primarily during the night.

---

# 20. Monsters

Initial monsters

- Zombie
- Skeleton
- Spider

Basic AI

```
Idle

↓

Detect Player

↓

Chase

↓

Attack
```

Monster attributes are influenced by the selected difficulty level.

---

# 21. Animals

Initial animals

- Cow
- Pig
- Chicken

Animals wander randomly and may provide food or crafting resources.

---

# 22. Combat

Simple melee combat.

Features

- Sword damage
- Monster health
- Knockback
- Basic hit detection

No complex combat animations in Version 1.

---

# 23. Health

Player attributes

- Health
- Hunger

Future

- Armor
- Status effects

---

# 24. Save System

Automatically save

- Player
- Inventory
- World
- Buildings
- Time
- Monsters

Primary storage

- IndexedDB

---

# 25. Rendering

React Three Fiber

Features

- Voxel rendering
- Chunk rendering
- Frustum culling

Future

- Instancing
- LOD
- Performance optimisation

---

# 26. Audio

Initial sounds

- Footsteps
- Mining
- Placing blocks
- Breaking blocks
- Monsters
- Ambient sounds

---

# 27. User Interface

Main Menu

- New Game
- Continue
- Settings
- Exit

New Game

Players choose

- Difficulty
- World Size

HUD

- Crosshair
- Health
- Hunger
- Hotbar
- Selected item
- Time

---

# 28. Settings

- Graphics Quality
- Sound Volume
- Mouse Sensitivity
- Render Distance
- Language

---

# 29. Mobile Support

Version 1 includes mobile support.

Target platforms

- Desktop browsers
- Mobile browsers
- Tablets

Mobile controls

- Virtual joystick
- Touch camera control
- Touch block placement
- Touch block destruction
- Responsive inventory interface

Performance should automatically adjust according to device capability.

---

# 30. AI-First Development Philosophy

The project is intentionally designed for AI-assisted development.

Each subsystem should be independently generated, tested and refined.

Example modules

```
Terrain Generator

Inventory

Crafting

Player Controller

Chunk Loader

Save System

Rendering

Animals

Monsters

Lighting

Audio

UI
```

Every module should have

- Single responsibility
- Clear interfaces
- Independent testing
- High maintainability

---

# 31. Performance Targets

Desktop

- 60 FPS

Render distance

- 8–12 chunks

Memory usage

- Less than 500 MB

Initial loading

- Less than 5 seconds

The game should scale gracefully across desktop and mobile devices.

---

# 32. Development Roadmap

## Phase 1

- Project initialisation
- React
- Vite
- Three.js
- Scene
- Camera
- Lighting

---

## Phase 2

- Voxel rendering
- Block placement
- Block destruction

---

## Phase 3

- Terrain generation
- Trees
- Water
- Biomes

---

## Phase 4

- Player controller
- Collision
- Inventory

---

## Phase 5

- Crafting
- Resources
- Tools

---

## Phase 6

- Monsters
- Animals
- Combat
- Difficulty system

---

## Phase 7

- Save system
- IndexedDB
- Settings
- Mobile optimisation

---

## Phase 8

- Audio
- Polish
- Performance optimisation

---

# 33. Deployment

```
GitHub

↓

Cloudflare Pages

↓

Public Website
```

No backend.

No server.

No authentication.

No database.

Everything runs inside the browser.

---

# 34. Long-Term Vision

BlockCraft is not intended to become another Minecraft.

Instead, it aims to become

- a browser-native voxel sandbox
- a showcase of AI-assisted software engineering
- a fully frontend, serverless gaming platform
- an educational project demonstrating modern web technologies
