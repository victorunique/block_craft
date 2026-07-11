# BlockCraft Vision

BlockCraft is a browser-based voxel sandbox game inspired by the core gameplay of Minecraft while intentionally remaining much simpler. Designed from day one as an AI-first software project, it focuses on delivering a compelling core sandbox loop entirely within the client-side browser environment, serving as a showcase of modern frontend game development and AI-assisted software engineering.

## Product Vision

The goal of BlockCraft is to extract the essential, high-leverage mechanics of voxel sandbox games—exploration, resource gathering, crafting, survival, and building—and deliver them in a friction-free, instantly playable web experience. 

It does not aim to replicate the complexity of established sandbox games, but rather to prove that a focused, highly polished core loop can be engaging, lightweight, and built entirely without server dependencies.

> [!IMPORTANT]
> **Production Target & Release Strategy:** 
> BlockCraft is engineered from the ground up for a stable, high-performance production launch. It is explicitly **not** a simple Minimum Viable Product (MVP) or prototype. The project will start as a robust, fully-featured **Beta version** to validate performance across various devices, leading directly to a polished **Production Version 1.0**. All architecture, optimizations, and features are designed to meet production-grade standards from day one.

### Core Gameplay Loop
```
Explore ➔ Collect Resources ➔ Craft Better Tools ➔ Gather Better Resources ➔ Build ➔ Explore Further ➔ Fight Monsters ➔ Upgrade Equipment ➔ Repeat
```

---

## Target Users

### Primary Audience
* **Casual Gamers & Builders:** Players looking for a quick, zero-install creative or survival experience directly in their web browser.
* **Families & Children:** Users who want an accessible, safe, and simplified sandbox game.

### Secondary Audience
* **AI & Software Enthusiasts:** Developers, students, and open-source contributors interested in analyzing or participating in an AI-first, modularly designed codebase.

---

## User Problems Solved

1. **High Friction to Play:** Many modern voxel games require heavy downloads, system installations, account registration, and complex setups. BlockCraft runs instantly in any modern web browser.
2. **Privacy and Account Fatigue:** Players are increasingly weary of creating accounts, managing passwords, and sharing personal data. BlockCraft requires no signup, no login, and no user accounts.
3. **Hardware Accessibility:** Modern 3D sandbox games can be resource-intensive. BlockCraft is designed to run efficiently on standard desktop browsers, laptops, mobile devices, and tablets.

---

## Product Goals

### Core Capabilities (Version 1)
* **Open Voxel World:** Procedurally generated 3D worlds featuring diverse environments.
* **Survival Gameplay:** A survival loop with health and hunger mechanics where players must gather resources and construct shelters.
* **Difficulty Modes:** Tiered difficulty settings (Easy, Medium, Hard) to accommodate players of all skill levels.
* **Block Mechanics:** Complete support for destroying blocks in the world and placing blocks from the inventory.
* **Inventory & Crafting:** A responsive inventory management system with a simplified crafting interface to construct tools and utility blocks.
* **Dynamic World State:** A functioning day/night cycle that dictates monster spawning patterns.
* **World Entities:** Monsters (e.g., Zombies, Skeletons, Spiders) with basic AI behaviors and peaceful animals (e.g., Cows, Pigs, Chickens) that roam the world.
* **Local Save System:** Automatic background saving of player status, world data, inventory, and environment state.
* **Cross-Device UI:** Responsive HUD and controls optimized for both keyboard/mouse (desktop) and touch controls (mobile/tablet).

### Out-of-Scope (Version 1 & Core Definition)
* **Multiplayer:** BlockCraft is strictly a single-player experience.
* **User Accounts:** No login, user authentication, or cloud-synced accounts.
* **Marketplaces:** No in-game stores, microtransactions, or digital asset economies.

---

## Future Direction

While Version 1 focuses strictly on the Survival mode, the following features are planned for subsequent iterations:
* **Creative Mode:** A sandbox mode with unlimited resources, flight capabilities, and instant block placement/destruction.
* **Extended World & Terrain:** Weather cycles, rivers, caves, and additional biomes (e.g., swamps, jungles, oceans, volcanoes).
* **Enhanced Gameplay Loops:** Farming, fishing, NPC interactions, and AI-driven assistants.
* **Expanded Content:** Additional block types, rarer resources (e.g., emerald, copper, quartz), and advanced tools.
