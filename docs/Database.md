# BlockCraft Local Storage & Database Schema

Version: 1.0  
Status: Initial Release  
Author: Antigravity (AI System Architect)  
Date: 2026-07-11  

---

## 1. Database Overview

BlockCraft is designed with a **no-backend architecture**. All game state persistence is stored locally inside the client's browser database sandbox using:
1. **IndexedDB:** For high-volume transactional data (world lists, player attributes, active voxel chunk deltas, and inventories).
2. **LocalStorage:** For low-volume global preferences (graphics configuration, mouse sensitivity, keyboard/touch layouts, and settings).

---

## 2. IndexedDB Schema: `BlockCraftDB` (v1)

The database utilizes three primary Object Stores. Transactions are managed asynchronously to prevent blocking the WebGL rendering thread.

### 2.1. Object Store: `worlds`
Stores metadata and player parameters for individual generated worlds.

* **Key Path:** `worldId` (DOMString - UUID v4 format)
* **Indexes:** None
* **Schema Definition:**

```json
{
  "worldId": "a9b8c7d6-e5f4-3c2b-1a09-876543210fed",
  "name": "Survival World Alpha",
  "seed": 18273910,
  "size": 512,
  "difficulty": "medium",
  "timeOfDay": 6000.0,
  "playerPos": [0.0, 72.5, 0.0],
  "playerRot": [0.0, 1.5707],
  "health": 20,
  "hunger": 20,
  "oxygen": 100,
  "lastSaved": 1783780800000
}
```

---

### 2.2. Object Store: `chunk_deltas`
Stores blocks modified, placed, or destroyed by the player. To optimize storage, the database **only** writes modifications, rather than storing full $16 \times 16 \times 16$ voxel arrays for unchanged chunks.

* **Key Path:** `id` (DOMString - format: `${worldId}_${chunkX}_${chunkY}_${chunkZ}`)
* **Indexes:**
  * `by_world`: Index on `worldId` (used for deleting all chunks when a world is deleted).
* **Schema Definition:**

```json
{
  "id": "a9b8c7d6-e5f4-3c2b-1a09-876543210fed_4_2_-1",
  "worldId": "a9b8c7d6-e5f4-3c2b-1a09-876543210fed",
  "x": 4,
  "y": 2,
  "z": -1,
  "deltas": {
    "123": 0,
    "124": 9,
    "1024": 5
  }
}
```

#### Voxel Indexing Calculation
The key in the `deltas` map represents the 1D index of the block inside the $16 \times 16 \times 16$ chunk block grid:
$$\text{Voxel Index} = x + (y \times 16) + (z \times 256)$$
Where:
* $x, y, z \in [0, 15]$ representing local coordinates inside the chunk.
* Value is the numeric **Block ID** (e.g., `0` for Air/Broken, `9` for placed Glass block).

---

### 2.3. Object Store: `inventories`
Stores the contents of the player's hotbar, storage slots, and tool status.

* **Key Path:** `worldId` (DOMString - UUID matching `worlds` store)
* **Indexes:** None
* **Schema Definition:**

```json
{
  "worldId": "a9b8c7d6-e5f4-3c2b-1a09-876543210fed",
  "activeSlot": 0,
  "hotbar": [
    { "id": "item_1", "blockId": 4, "count": 64 },
    { "id": "item_2", "blockId": 9, "count": 20 },
    { "id": "tool_1", "blockId": 18, "count": 1, "durability": 150 },
    null, null, null, null, null, null
  ],
  "storage": [
    { "id": "item_3", "blockId": 1, "count": 64 },
    null, null, null, null, null, null, null, null,
    null, null, null, null, null, null, null, null, null,
    null, null, null, null, null, null, null, null, null
  ],
  "armor": [
    null, null, null, null
  ]
}
```

---

## 3. LocalStorage Storage Properties

LocalStorage is accessed synchronously on startup to configure application preferences.

| LocalStorage Key | Data Type | Default Value | Description |
| :--- | :--- | :--- | :--- |
| `blockcraft_settings` | JSON String | See below | Stores sound settings, visual configurations, sensitivity, and layouts. |
| `blockcraft_last_played` | String (UUID) | `null` | References the last opened `worldId` to enable the "Continue" menu action. |

### `blockcraft_settings` Default Payload
```json
{
  "graphicsQuality": "medium",
  "renderDistance": 10,
  "soundVolume": 0.8,
  "mouseSensitivity": 1.0,
  "controlLayout": "right-handed"
}
```

---

## 4. Chunk Delta Storage & Generation Flow

When the player selects or continues a world:

```
                  [Load Chunk at coordinates x, y, z]
                                   │
                                   ▼
          Query `chunk_deltas` with key `${worldId}_${x}_${y}_${z}`
                                   │
                ┌──────────────────┴──────────────────┐
                ▼ (Found deltas)                      ▼ (No deltas found)
     Generate base chunk mesh              Generate base chunk mesh
         via Simplex Noise                     via Simplex Noise
                │                                     │
                ▼                                     ▼
     Overwrite base voxel IDs                Send completed mesh
     with delta block IDs                     directly to Renderer
                │
                ▼
     Send modified mesh
        to Renderer
```

---

## 5. Storage Life-Cycle & Backups

1. **Eviction Risk Mitigation:** iOS Safari automatically deletes IndexedDB storage if the browser origin remains unvisited for 7 days. To prevent silent data loss:
   * **Backup Alerts:** Prompt players to export save backups after significant progress milestones.
   * **Estimated Usage:** Check remaining storage allowances on startup:
     ```typescript
     if (navigator.storage && navigator.storage.estimate) {
       const { usage, quota } = await navigator.storage.estimate();
       const percentUsed = (usage / quota) * 100;
       if (percentUsed > 80.0) {
         console.warn("IndexedDB storage capacity running low.");
       }
     }
     ```
2. **Import/Export Format:** The Save Manager aggregates the data from `worlds`, `inventories`, and `chunk_deltas` filtered by `worldId` into a single JSON structure. This JSON structure is saved as a compressed text blob with a `.blockcraft` extension.
