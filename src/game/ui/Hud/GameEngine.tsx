import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PointerLockControls } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../../store/gameStore';
import { useInputStore } from '../../store/inputStore';
import { useSettingsStore } from '../../store/settingsStore';
import { ChunkManager, type ChunkEntry } from '../../world/chunkManager';
import { getChunkWorker } from '../../rendering/chunkWorkerClient';
import { getAtlas, ChunkMesh } from '../../rendering/chunkMesh';
import { buildTextureAtlas } from '../../rendering/textureAtlas';
import { updateEntityPosition } from '../../physics/collision';
import { raycastFromCamera, placeTargetFromHit } from '../../physics/raycast';
import { createTerrainGenerator } from '../../terrain/terrainGenerator';
import { audio } from '../../audio/audioManager';
import { DAY_LENGTH_TICKS, TICKS_PER_SECOND, INTERACTION_REACH, PLAYER_EYE_HEIGHT, PLAYER_WIDTH, PLAYER_HEIGHT, WALK_SPEED, SNEAK_SPEED, FALL_DAMAGE_THRESHOLD, BLOCK_DROPS } from '../../../config/constants';
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
  const lastUpdateRef = useRef<number>(0);
  const lastStoredPosRef = useRef<[number, number, number]>([playerPos[0], playerPos[1], playerPos[2]]);

  useEffect(() => {
    const dist = Math.hypot(
      camera.position.x - playerPos[0],
      (camera.position.y - PLAYER_EYE_HEIGHT) - playerPos[1],
      camera.position.z - playerPos[2]
    );
    if (!initializedRef.current || dist > 2.0) {
      camera.position.set(playerPos[0], playerPos[1] + PLAYER_EYE_HEIGHT, playerPos[2]);
      camera.rotation.order = 'YXZ';
      camera.rotation.y = yawRef.current;
      camera.rotation.x = pitchRef.current;
      initializedRef.current = true;
      lastStoredPosRef.current = [playerPos[0], playerPos[1], playerPos[2]];
    }
  }, [camera, playerPos[0], playerPos[1], playerPos[2]]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__bcCamera = camera;
    }
  }, [camera]);

  useEffect(() => {
    chunkManagerRef.current = chunkManager;
  }, [chunkManager]);

  useEffect(() => {
    const isTesting = typeof navigator !== 'undefined' && navigator.webdriver;
    if (isTesting) return;
    if (screen !== 'game' || isPaused) return;
    const canvas = gl.domElement;
    const tryLock = () => {
      if (document.pointerLockElement !== canvas) {
        const req = canvas.requestPointerLock();
        if (req && typeof (req as Promise<void>).catch === 'function') {
          (req as Promise<void>).catch(() => { /* user-gesture may not be available */ });
        }
      }
    };
    const timer = setTimeout(tryLock, 60);
    canvas.addEventListener('click', tryLock);
    return () => {
      clearTimeout(timer);
      canvas.removeEventListener('click', tryLock);
    };
  }, [gl, screen, isPaused]);

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
      if (e.code === 'Escape') {
        const s = useGameStore.getState();
        if (s.screen === 'game' || s.screen === 'paused') {
          s.togglePause();
          e.preventDefault();
        }
      }
      if (e.code === 'KeyE') {
        const s = useGameStore.getState();
        if (s.screen === 'game' || s.screen === 'paused') {
          s.toggleInventory();
          e.preventDefault();
        }
      }
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
      const isTesting = typeof navigator !== 'undefined' && navigator.webdriver;
      if (document.pointerLockElement !== gl.domElement && !isTesting) return;
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
    const camFeetX = camera.position.x;
    const camFeetY = camera.position.y - PLAYER_EYE_HEIGHT;
    const camFeetZ = camera.position.z;
    const { cx, cy, cz } = cm.worldToChunk(camFeetX, camFeetY, camFeetZ);
    const spawnChunk = cm.getChunk(cx, cy, cz);
    if (!spawnChunk || !spawnChunk.mesh) {
      return;
    }

    const sens = settings.mouseSensitivity;
    const inputStore = useInputStore.getState();
    const lookDelta = inputStore.consumeLook();
    mouseRef.current.dx += lookDelta.dx;
    mouseRef.current.dy += lookDelta.dy;
    yawRef.current -= (mouseRef.current.dx * sens) * 0.002;
    pitchRef.current -= (mouseRef.current.dy * sens) * 0.002;
    pitchRef.current = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, pitchRef.current));
    mouseRef.current.dx = 0;
    mouseRef.current.dy = 0;
    camera.rotation.order = 'YXZ';
    camera.rotation.y = yawRef.current;
    camera.rotation.x = pitchRef.current;

    const kbFwd = (keysRef.current['KeyW'] ? 1 : 0) - (keysRef.current['KeyS'] ? 1 : 0);
    const kbStrafe = (keysRef.current['KeyD'] ? 1 : 0) - (keysRef.current['KeyA'] ? 1 : 0);
    const mobMove = inputStore.move;
    const fwd = kbFwd !== 0 ? kbFwd : -mobMove.y;
    const strafe = kbStrafe !== 0 ? kbStrafe : mobMove.x;
    const jumpKey = keysRef.current['Space'];
    const jumpQueued = inputStore.consumeJump();
    const jump = jumpKey || jumpQueued;
    const sneak = keysRef.current['ShiftLeft'] || keysRef.current['ShiftRight'];
    const speed = sneak ? SNEAK_SPEED : WALK_SPEED;

    const sinY = Math.sin(yawRef.current);
    const cosY = Math.cos(yawRef.current);
    const moveX = (strafe * cosY - fwd * sinY) * speed;
    const moveZ = (-strafe * sinY - fwd * cosY) * speed;
    velRef.current[0] = moveX;
    velRef.current[2] = moveZ;

    if (inputStore.consumeMine()) onLeftClick();
    if (inputStore.consumePlace()) onRightClick();

    const result = updateEntityPosition(
      [camera.position.x, camera.position.y - PLAYER_EYE_HEIGHT, camera.position.z],
      velRef.current,
      [PLAYER_WIDTH, PLAYER_HEIGHT],
      cappedDt,
      (x, y, z) => chunkManager.getBlockAt(x, y, z, true),
      { jumpRequested: jump && !lastJumpRef.current },
    );
    lastJumpRef.current = jump;
    onGroundRef.current = result.isOnGround;
    camera.position.set(result.newPos[0], result.newPos[1] + PLAYER_EYE_HEIGHT, result.newPos[2]);
    velRef.current[0] = result.newVel[0];
    velRef.current[1] = result.newVel[1];
    velRef.current[2] = result.newVel[2];
    const now = performance.now();
    const posChanged =
      Math.floor(result.newPos[0]) !== Math.floor(lastStoredPosRef.current[0]) ||
      Math.floor(result.newPos[1]) !== Math.floor(lastStoredPosRef.current[1]) ||
      Math.floor(result.newPos[2]) !== Math.floor(lastStoredPosRef.current[2]);
    if (posChanged || now - lastUpdateRef.current > 150) {
      lastUpdateRef.current = now;
      lastStoredPosRef.current = result.newPos;
      updatePlayerTransform(
        [result.newPos[0], result.newPos[1], result.newPos[2]],
        [pitchRef.current, yawRef.current],
      );
    }

    if (result.newPos[1] < -FALL_DAMAGE_THRESHOLD * 4) {
      const s = useGameStore.getState();
      const half = chunkManager.worldSize / 2;
      const safeX = Math.max(-half + 5, Math.min(half - 5, result.newPos[0]));
      const safeZ = Math.max(-half + 5, Math.min(half - 5, result.newPos[2]));
      const surface = getHeight(Math.floor(safeX), Math.floor(safeZ));
      useGameStore.setState({ playerPos: [safeX, surface + 4, safeZ] });
      camera.position.set(safeX, surface + 4 + PLAYER_EYE_HEIGHT, safeZ);
      velRef.current[1] = 0;
      s.damagePlayer(2, 'void');
    }

    tickHunger(cappedDt, useGameStore.getState().difficulty);

    const headX = Math.floor(camera.position.x);
    const headY = Math.floor(camera.position.y + 0.2);
    const headZ = Math.floor(camera.position.z);
    const headBlock = chunkManager.getBlockAt(headX, headY, headZ);
    const headUnderwater = headBlock === BlockId.WATER;
    useGameStore.getState().tickOxygen(cappedDt, headUnderwater);

    const feetY = Math.floor(camera.position.y - PLAYER_EYE_HEIGHT + 0.1);
    let touchingCactus = false;
    for (const [dx, dz] of [[-0.3, 0], [0.3, 0], [0, -0.3], [0, 0.3]] as const) {
      const x = Math.floor(camera.position.x + dx);
      const z = Math.floor(camera.position.z + dz);
      if (chunkManager.getBlockAt(x, feetY, z) === BlockId.CACTUS) { touchingCactus = true; break; }
      if (chunkManager.getBlockAt(x, feetY + 1, z) === BlockId.CACTUS) { touchingCactus = true; break; }
    }
    if (touchingCactus) damagePlayer(cappedDt, 'cactus');

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
    const s = useGameStore.getState();
    if (hit.block === BlockId.FURNACE) {
      s.openSmelting(true);
      return;
    }
    const target = placeTargetFromHit(hit);
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
  return BLOCK_DROPS[block] ?? 0;
}

function WorldChunks({ chunkManager }: { chunkManager: ChunkManager }) {
  const [atlas, setAtlas] = useState<{ canvas: HTMLCanvasElement; texture: THREE.Texture } | null>(null);
  const [chunks, setChunks] = useState<ChunkEntry[]>([]);
  const tickRef = useRef(0);
  const lastRevRef = useRef(0);

  useEffect(() => {
    void getAtlas().then((a) => setAtlas(a));
    if (typeof window !== 'undefined') {
      (window as any).__bcChunkManager = chunkManager;
    }
  }, []);

  useFrame(() => {
    tickRef.current = (tickRef.current + 1) % 60;
    const currentChunks = Array.from(chunkManager.entries()) as ChunkEntry[];
    const currentLoaded = currentChunks.filter((c) => c.mesh).length;
    const prevLoaded = chunks.filter((c) => c.mesh).length;

    if (currentChunks.length !== chunks.length || currentLoaded !== prevLoaded || chunkManager.revision !== lastRevRef.current) {
      lastRevRef.current = chunkManager.revision;
      setChunks(currentChunks);
    }

    if (typeof window !== 'undefined' && tickRef.current === 0) {
      const loaded = currentLoaded;
      const total = currentChunks.length;
      const cam = (window as any).__bcDebug;
      if (cam) cam({ loaded, total, pos: useGameStore.getState().playerPos });
    }
  });

  if (!atlas) return null;
  return (
    <>
      {chunks.map((entry) => (
        <ChunkMesh key={`${entry.cx},${entry.cy},${entry.cz}`} entry={entry} />
      ))}
    </>
  );
}

function BlockHighlight({ chunkManager }: { chunkManager: ChunkManager }) {
  const { camera } = useThree();
  const isPaused = useGameStore((s) => s.isPaused);
  const screen = useGameStore((s) => s.screen);
  const ref = useRef<THREE.LineSegments>(null);

  useFrame(() => {
    if (!ref.current) return;
    if (isPaused || screen !== 'game') {
      ref.current.visible = false;
      return;
    }
    const hit = raycastFromCamera(camera, (x, y, z) => chunkManager.getBlockAt(x, y, z), INTERACTION_REACH);
    if (!hit) {
      ref.current.visible = false;
      return;
    }
    ref.current.visible = true;
    ref.current.position.set(hit.position[0] + 0.5, hit.position[1] + 0.5, hit.position[2] + 0.5);
  });

  const edges = useMemo(() => {
    const g = new THREE.EdgesGeometry(new THREE.BoxGeometry(1.005, 1.005, 1.005));
    return g;
  }, []);

  return (
    <lineSegments ref={ref} geometry={edges} renderOrder={2}>
      <lineBasicMaterial color="#000000" transparent opacity={0.8} depthTest={true} />
    </lineSegments>
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
  const lastChunkPos = useRef<{ cx: number; cz: number } | null>(null);
  const updating = useRef(false);

  useFrame(() => {
    if (chunkManager.renderDistance > 0 && !updating.current) {
      const { cx, cz } = chunkManager.worldToChunk(playerPos[0], playerPos[1], playerPos[2]);
      if (!lastChunkPos.current || lastChunkPos.current.cx !== cx || lastChunkPos.current.cz !== cz) {
        updating.current = true;
        chunkManager.updateAroundPlayer(playerPos[0], playerPos[1], playerPos[2])
          .then(() => {
            lastChunkPos.current = { cx, cz };
          })
          .catch((err) => {
            console.error('updateAroundPlayer failed', err);
          })
          .finally(() => {
            updating.current = false;
          });
      }
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
  const terrainGen = useMemo(
    () => createTerrainGenerator(worldSeed, worldSize),
    [worldSeed, worldSize],
  );
  const getBiome = (x: number, z: number) => terrainGen.getBiomeAt(x, z);
  return (
    <Canvas
      camera={{ fov: 75, near: 0.1, far: 1000, position: [0, 72, 0] }}
      gl={{ antialias: false, powerPreference: 'high-performance' }}
      shadows={false}
    >
      <SunAndSky />
      <WorldChunks chunkManager={chunkManager} />
      <BlockHighlight chunkManager={chunkManager} />
      <Player chunkManager={chunkManager} getHeight={getHeight} getBiome={getBiome} />
      <ChunkUpdater chunkManager={chunkManager} />
      <EntityRunner spawner={spawner} />
      <GameTick />
      <PointerLockControls />
    </Canvas>
  );
}

export function createChunkManagerForWorld(seed: number, worldSize: number, renderDistance: number, worldId?: string) {
  return new ChunkManager({ seed, worldSize, renderDistance, worker: getChunkWorker(), worldId });
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
  const terrainGen = createTerrainGenerator(seed, worldSize);
  return new EntitySpawner({
    seed,
    difficulty: useGameStore.getState().difficulty,
    getHeight: (x, z) => getSurfaceHeight(chunkManager, x, z),
    getBiome: (x, z) => terrainGen.getBiomeAt(x, z),
    isLit: (x, y, z) => {
      let lit = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dz = -1; dz <= 1; dz++) {
          for (let dx = -1; dx <= 1; dx++) {
            const b = chunkManager.getBlockAt(x + dx, y + dy, z + dz);
            if (b === BlockId.TORCH) lit += 1;
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