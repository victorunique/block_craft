import { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PointerLockControls } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../../store/gameStore';
import { useSettingsStore } from '../../store/settingsStore';
import { ChunkManager, type ChunkEntry } from '../../world/chunkManager';
import { getChunkWorker } from '../../rendering/chunkWorkerClient';
import { getAtlas, ChunkMesh } from '../../rendering/chunkMesh';
import { buildTextureAtlas } from '../../rendering/textureAtlas';
import { updateEntityPosition } from '../../physics/collision';
import { raycastFromCamera, placeTargetFromHit } from '../../physics/raycast';
import { createTerrainGenerator } from '../../terrain/terrainGenerator';
import { audio } from '../../audio/audioManager';
import { DAY_LENGTH_TICKS, TICKS_PER_SECOND, INTERACTION_REACH } from '../../../config/constants';
import { BlockId, isAir, isLiquid } from '../../../config/blocks';
import { EntitySpawner } from '../../entities/spawner';
import { getSkyColor, getSunAngle, getSunIntensity } from '../../world/timeSystem';
import { useViewport } from '../../../hooks/useViewport';

const CHUNK_KEYS = new Set<string>();

function Player({ chunkManager, getHeight, getBiome }: { chunkManager: ChunkManager; getHeight: (x: number, z: number) => number; getBiome: (x: number, z: number) => string }) {
  const { camera, gl } = useThree();
  const playerPos = useGameStore((s) => s.playerPos);
  const updatePlayerTransform = useGameStore((s) => s.updatePlayerTransform);
  const isPaused = useGameStore((s) => s.isPaused);
  const screen = useGameStore((s) => s.screen);
  const setActiveSlot = useGameStore((s) => s.setActiveSlot);
  const settings = useSettingsStore((s) => s.settings);
  const hotbar = useGameStore((s) => s.hotbar);
  const addItemToInventory = useGameStore((s) => s.addItemToInventory);
  const removeItemFromInventory = useGameStore((s) => s.removeItemFromInventory);
  const applyDamageToTool = useGameStore((s) => s.applyDamageToTool);
  const damagePlayer = useGameStore((s) => s.damagePlayer);
  const tickHunger = useGameStore((s) => s.tickHunger);
  const viewport = useViewport();
  const chunkManagerRef = useRef(chunkManager);

  const velRef = useRef<[number, number, number]>([0, 0, 0]);
  const onGroundRef = useRef(false);
  const keysRef = useRef<{ [k: string]: boolean }>({});
  const mouseRef = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });
  const lastJumpRef = useRef(false);
  const breakingBlockRef = useRef<{ x: number; y: number; z: number; progress: number } | null>(null);
  const yawRef = useRef(0);
  const pitchRef = useRef(-0.15);
  const initializedRef = useRef(false);

  useEffect(() => {
    camera.position.set(playerPos[0], playerPos[1] + 1.62, playerPos[2]);
    camera.rotation.order = 'YXZ';
    camera.rotation.y = yawRef.current;
    camera.rotation.x = pitchRef.current;
    initializedRef.current = true;
  }, [camera, playerPos[0], playerPos[1], playerPos[2]]);

  useEffect(() => {
    chunkManagerRef.current = chunkManager;
  }, [chunkManager]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.code] = true;
      if (e.code === 'Digit1') setActiveSlot(0);
      if (e.code === 'Digit2') setActiveSlot(1);
      if (e.code === 'Digit3') setActiveSlot(2);
      if (e.code === 'Digit4') setActiveSlot(3);
      if (e.code === 'Digit5') setActiveSlot(4);
      if (e.code === 'Digit6') setActiveSlot(5);
      if (e.code === 'Digit7') setActiveSlot(6);
      if (e.code === 'Digit8') setActiveSlot(7);
      if (e.code === 'Digit9') setActiveSlot(8);
    };
    const onKeyUp = (e: KeyboardEvent) => { keysRef.current[e.code] = false; };
    const onMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement === gl.domElement) {
        mouseRef.current.dx += e.movementX;
        mouseRef.current.dy += e.movementY;
      }
    };
    const onWheel = (e: WheelEvent) => {
      const s = useGameStore.getState();
      if (e.deltaY > 0) s.setActiveSlot(Math.min(8, s.activeSlot + 1));
      else s.setActiveSlot(Math.max(0, s.activeSlot - 1));
    };
    const onMouseDown = (e: MouseEvent) => {
      const s = useGameStore.getState();
      if (e.button === 0) onLeftClick();
      if (e.button === 2) onRightClick();
    };
    const onContext = (e: Event) => e.preventDefault();
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('wheel', onWheel);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('contextmenu', onContext);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('contextmenu', onContext);
    };
  }, [gl, addItemToInventory]);

  useFrame((_, dt) => {
    if (isPaused || screen !== 'game') return;
    const cappedDt = Math.min(dt, 1 / 20);

    const cm = chunkManagerRef.current;
    const { cx, cy, cz } = cm.worldToChunk(playerPos[0], playerPos[1], playerPos[2]);
    const spawnChunk = cm.getChunk(cx, cy, cz);
    if (!spawnChunk || !spawnChunk.mesh) {
      camera.position.set(playerPos[0], playerPos[1] + 1.62, playerPos[2]);
      return;
    }

    const sens = settings.mouseSensitivity;
    yawRef.current -= (mouseRef.current.dx * sens) * 0.002;
    pitchRef.current -= (mouseRef.current.dy * sens) * 0.002;
    pitchRef.current = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, pitchRef.current));
    mouseRef.current.dx = 0;
    mouseRef.current.dy = 0;
    camera.rotation.order = 'YXZ';
    camera.rotation.y = yawRef.current;
    camera.rotation.x = pitchRef.current;

    const fwd = (keysRef.current['KeyW'] ? 1 : 0) - (keysRef.current['KeyS'] ? 1 : 0);
    const strafe = (keysRef.current['KeyD'] ? 1 : 0) - (keysRef.current['KeyA'] ? 1 : 0);
    const jump = keysRef.current['Space'];
    const sneak = keysRef.current['ShiftLeft'] || keysRef.current['ShiftRight'];
    const speed = sneak ? 1.3 : 4.3;

    const sinY = Math.sin(yawRef.current);
    const cosY = Math.cos(yawRef.current);
    const moveX = (strafe * cosY + fwd * sinY) * speed;
    const moveZ = (-strafe * sinY + fwd * cosY) * speed;
    velRef.current[0] = moveX;
    velRef.current[2] = moveZ;

    const result = updateEntityPosition(
      [camera.position.x, camera.position.y - 1.62, camera.position.z],
      velRef.current,
      [0.6, 1.8],
      cappedDt,
      (x, y, z) => chunkManager.getBlockAt(x, y, z),
      { jumpRequested: jump && !lastJumpRef.current },
    );
    lastJumpRef.current = jump;
    onGroundRef.current = result.isOnGround;
    camera.position.set(result.newPos[0], result.newPos[1] + 1.62, result.newPos[2]);
    updatePlayerTransform(
      [result.newPos[0], result.newPos[1], result.newPos[2]],
      [pitchRef.current, yawRef.current],
    );

    if (result.newPos[1] < -10) {
      const s = useGameStore.getState();
      const half = chunkManager.worldSize / 2;
      const safeX = Math.max(-half + 5, Math.min(half - 5, result.newPos[0]));
      const safeZ = Math.max(-half + 5, Math.min(half - 5, result.newPos[2]));
      const surface = getHeight(Math.floor(safeX), Math.floor(safeZ));
      useGameStore.setState({ playerPos: [safeX, surface + 4, safeZ] });
      camera.position.set(safeX, surface + 4 + 1.62, safeZ);
      velRef.current[1] = 0;
      s.damagePlayer(2, 'void');
    }

    tickHunger(cappedDt, useGameStore.getState().difficulty);
    void mouseRef;
    void onGroundRef;
    void viewport;
  });

  function getTargetBlock() {
    return raycastFromCamera(camera, (x, y, z) => chunkManager.getBlockAt(x, y, z), INTERACTION_REACH);
  }

  function onLeftClick() {
    const hit = getTargetBlock();
    if (!hit) return;
    const block = hit.block;
    if (block === BlockId.BEDROCK) return;
    audio.playBreak();
    const drop = dropForBlock(block);
    if (drop !== 0) {
      addItemToInventory(drop, 1);
    } else {
      addItemToInventory(block, 1);
    }
    chunkManager.setBlockAt(hit.position[0], hit.position[1], hit.position[2], 0);
    void chunkManager.rebuildDirty();
    const s = useGameStore.getState();
    const active = s.hotbar[s.activeSlot];
    if (active && active.blockId >= BlockId.TOOL_BASE) {
      s.applyDamageToTool('hotbar', s.activeSlot, 1);
    }
  }

  function onRightClick() {
    const hit = getTargetBlock();
    if (!hit) return;
    const target = placeTargetFromHit(hit);
    const s = useGameStore.getState();
    const item = s.hotbar[s.activeSlot];
    if (!item) return;
    const blockAtTarget = chunkManager.getBlockAt(target[0], target[1], target[2]);
    if (!isAir(blockAtTarget) && !isLiquid(blockAtTarget)) return;
    const placeId = item.blockId;
    if (placeId === BlockId.WATER || placeId === BlockId.AIR) return;
    audio.playPlace();
    chunkManager.setBlockAt(target[0], target[1], target[2], placeId);
    void chunkManager.rebuildDirty();
    s.removeItemFromInventory('hotbar', s.activeSlot, 1);
  }

  return null;
}

function dropForBlock(block: number): number {
  const drops: Record<number, number> = {
    [BlockId.STONE]: BlockId.COBBLESTONE,
    [BlockId.COAL_ORE]: BlockId.COAL_ITEM,
    [BlockId.IRON_ORE]: BlockId.IRON_INGOT,
    [BlockId.GOLD_ORE]: BlockId.GOLD_INGOT,
    [BlockId.DIAMOND_ORE]: BlockId.DIAMOND,
    [BlockId.GRASS]: BlockId.DIRT,
    [BlockId.WOOD]: BlockId.PLANKS,
    [BlockId.PINE_WOOD]: BlockId.PLANKS,
  };
  return drops[block] ?? 0;
}

function WorldChunks({ chunkManager }: { chunkManager: ChunkManager }) {
  const [atlas, setAtlas] = useState<{ canvas: HTMLCanvasElement; texture: THREE.Texture } | null>(null);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    void getAtlas().then((a) => setAtlas(a));
    if (typeof window !== 'undefined') {
      (window as any).__bcChunkManager = chunkManager;
    }
  }, []);
  useFrame(() => {
    setTick((t) => (t + 1) % 60);
  });
  const chunks = Array.from(chunkManager.entries()) as ChunkEntry[];
  if (typeof window !== 'undefined' && tick === 0) {
    const loaded = chunks.filter((c) => c.mesh).length;
    const total = chunks.length;
    const cam = (window as any).__bcDebug;
    if (cam) cam({ loaded, total, pos: useGameStore.getState().playerPos });
  }
  if (!atlas) return null;
  return (
    <>
      {chunks.map((entry) => (
        <ChunkMesh key={`${entry.cx},${entry.cy},${entry.cz}`} entry={entry} />
      ))}
    </>
  );
}

function SunAndSky() {
  const timeOfDay = useGameStore((s) => s.timeOfDay);
  const color = getSkyColor(timeOfDay);
  const intensity = getSunIntensity(timeOfDay);
  const angle = getSunAngle(timeOfDay);
  const sunPos: [number, number, number] = [Math.cos(angle) * 200, Math.sin(angle) * 200, 0];
  void CHUNK_KEYS;
  return (
    <>
      <color attach="background" args={[color.r, color.g, color.b]} />
      <ambientLight intensity={0.9} />
      <hemisphereLight args={['#aee0ff', '#776644', 0.5]} />
      <directionalLight position={sunPos} intensity={intensity} castShadow={false} />
    </>
  );
}

function ChunkUpdater({ chunkManager }: { chunkManager: ChunkManager }) {
  const playerPos = useGameStore((s) => s.playerPos);
  useFrame(() => {
    if (chunkManager.renderDistance > 0) {
      void chunkManager.updateAroundPlayer(playerPos[0], playerPos[1], playerPos[2]);
    }
  });
  return null;
}

function EntityRunner({ spawner }: { spawner: EntitySpawner }) {
  useFrame((_, dt) => {
    spawner.tick(dt * 1000);
  });
  return null;
}

function GameTick() {
  const tickTime = useGameStore((s) => s.tickTime);
  useFrame((_, dt) => {
    tickTime(dt * TICKS_PER_SECOND * (DAY_LENGTH_TICKS / 1200));
  });
  return null;
}

interface Props {
  chunkManager: ChunkManager;
  spawner: EntitySpawner;
}

export default function GameEngine({ chunkManager, spawner }: Props) {
  const worldSeed = useGameStore((s) => s.worldSeed);
  const worldSize = useGameStore((s) => s.worldSize);
  const settings = useSettingsStore((s) => s.settings);
  const setRenderDistance = (distance: number) => chunkManager.setRenderDistance(distance);
  useEffect(() => {
    setRenderDistance(settings.renderDistance);
  }, [settings.renderDistance]);
  void buildTextureAtlas;
  const getHeight = (x: number, z: number) => getSurfaceHeight(chunkManager, x, z);
  const getBiome = (x: number, z: number) => {
    return 'plains';
  };
  return (
    <Canvas
      camera={{ fov: 75, near: 0.1, far: 1000, position: [0, 72, 0] }}
      gl={{ antialias: false, powerPreference: 'high-performance' }}
      shadows={false}
    >
      <SunAndSky />
      <WorldChunks chunkManager={chunkManager} />
      <Player chunkManager={chunkManager} getHeight={getHeight} getBiome={getBiome} />
      <ChunkUpdater chunkManager={chunkManager} />
      <EntityRunner spawner={spawner} />
      <GameTick />
      <PointerLockControls />
    </Canvas>
  );
}

export function createChunkManagerForWorld(seed: number, worldSize: number, renderDistance: number) {
  return new ChunkManager({ seed, worldSize, renderDistance, worker: getChunkWorker() });
}

export function getSurfaceHeight(chunkManager: ChunkManager, x: number, z: number): number {
  const half = chunkManager.worldSize / 2;
  if (x < -half || x >= half || z < -half || z >= half) return 64;
  for (let y = 120; y >= 0; y--) {
    if (chunkManager.getBlockAt(x, y, z) !== 0 && chunkManager.getBlockAt(x, y, z) !== 8) {
      return y + 1;
    }
  }
  return 64;
}

export function createSpawner(chunkManager: ChunkManager, seed: number, worldSize: number) {
  return new EntitySpawner({
    seed,
    difficulty: useGameStore.getState().difficulty,
    getHeight: (x, z) => getSurfaceHeight(chunkManager, x, z),
    getBiome: () => 'plains',
    isLit: (x, y, z) => {
      let lit = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dz = -1; dz <= 1; dz++) {
          for (let dx = -1; dx <= 1; dx++) {
            const b = chunkManager.getBlockAt(x + dx, y + dy, z + dz);
            if (b === 15) lit += 1;
          }
        }
      }
      return lit > 0;
    },
    playerPos: () => useGameStore.getState().playerPos,
    timeOfDay: () => useGameStore.getState().timeOfDay,
    worldSize,
  });
}