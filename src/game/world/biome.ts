import { createTerrainGenerator } from '../terrain/terrainGenerator';
import { useGameStore } from '../store/gameStore';

const cache = new Map<string, ReturnType<typeof createTerrainGenerator>>();
let lastSeed = -1;
let lastSize = 0;
let lastGen: ReturnType<typeof createTerrainGenerator> | null = null;

function getGen(): ReturnType<typeof createTerrainGenerator> | null {
  const s = useGameStore.getState();
  if (!s.worldSeed) return null;
  if (s.worldSeed === lastSeed && s.worldSize === lastSize && lastGen) return lastGen;
  lastSeed = s.worldSeed;
  lastSize = s.worldSize;
  lastGen = createTerrainGenerator(s.worldSeed, s.worldSize);
  return lastGen;
}

export function getBiomeName(x: number, z: number): string {
  const g = getGen();
  if (!g) return 'Plains';
  const half = g.worldSize / 2;
  return capitalize(g.getBiomeAt(x, z));
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}