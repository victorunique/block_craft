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
import { ANIMAL_SPECS, tickAnimalAI, rollAnimalDrops } from '../../animals/ai';
import { MONSTER_SPECS, tickMonsterAI, applyDifficulty } from '../../monsters/ai';

const CHUNK_KEYS = new Set<string>();

function Player({ chunkManager, spawner, getHeight, getBiome }: { chunkManager: ChunkManager; spawner: EntitySpawner; getHeight: (x: number, z: number) => number; getBiome: (x: number, z: number) => string }) {
  const { camera, gl, scene } = useThree();
  const playerPos = useGameStore((s) => s.playerPos);
  const updatePlayerTransform = useGameStore((s) => s.updatePlayerTransform);
  const isPaused = useGameStore((s) => s.isPaused);
  const screen = useGameStore((s) => s.screen);
  const showInventory = useGameStore((s) => s.showInventory);
  const showSmelting = useGameStore((s) => s.showSmelting);
  const setActiveSlot = useGameStore((s) => s.setActiveSlot);
  const activeSlot = useGameStore((s) => s.activeSlot);
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

  const swingProgressRef = useRef(0);
  const toolGroupRef = useRef<THREE.Group>(null);

  // Camera and held tool group are added to the scene graph declaratively via <primitive object={camera}> in JSX

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
      (window as any).__bcScene = scene;
    }
  }, [camera, scene]);

  useEffect(() => {
    chunkManagerRef.current = chunkManager;
  }, [chunkManager]);

  useEffect(() => {
    const isTesting = typeof navigator !== 'undefined' && navigator.webdriver;
    if (isTesting) return;
    if (screen !== 'game' || isPaused || showInventory || showSmelting) {
      if (document.pointerLockElement) {
        try {
          document.exitPointerLock();
        } catch (e) {
          // ignore
        }
      }
      return;
    }
    const canvas = gl.domElement;
    const tryLock = () => {
      if (document.pointerLockElement !== canvas) {
        try {
          const req = canvas.requestPointerLock();
          if (req && typeof (req as Promise<void>).catch === 'function') {
            (req as Promise<void>).catch(() => { /* user-gesture may not be available */ });
          }
        } catch (e) {
          // ignore
        }
      }
    };
    const timer = setTimeout(tryLock, 60);
    canvas.addEventListener('click', tryLock);
    return () => {
      clearTimeout(timer);
      canvas.removeEventListener('click', tryLock);
    };
  }, [gl, screen, isPaused, showInventory, showSmelting]);

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
      {
        jumpRequested: jump && !lastJumpRef.current,
        jumpHeld: jump,
      },
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

    if (swingProgressRef.current > 0) {
      swingProgressRef.current = Math.max(0, swingProgressRef.current - cappedDt * 6);
      useGameStore.setState({ swingProgress: swingProgressRef.current });
    }
    const progress = swingProgressRef.current;
    const swingFactor = Math.sin(progress * Math.PI);
    const side = settings.controlLayout === 'left-handed' ? -1 : 1;
    if (toolGroupRef.current) {
      toolGroupRef.current.position.copy(camera.position);
      toolGroupRef.current.quaternion.copy(camera.quaternion);
      toolGroupRef.current.translateX(0.25 * side - swingFactor * 0.15 * side);
      toolGroupRef.current.translateY(-0.25 + swingFactor * 0.08);
      toolGroupRef.current.translateZ(-0.45 + swingFactor * 0.1);
      toolGroupRef.current.rotateX(-swingFactor * 1.0);
      toolGroupRef.current.rotateY(swingFactor * 0.6 * side);
      toolGroupRef.current.rotateZ(-swingFactor * 0.3 * side);
    }

    void mouseRef;
    void onGroundRef;
    void viewport;
  });

  function getTargetBlock() {
    return raycastFromCamera(camera, (x, y, z) => chunkManager.getBlockAt(x, y, z), INTERACTION_REACH);
  }

  function handleEntityHit(entityId: string, kind: 'monster' | 'animal') {
    const s = useGameStore.getState();
    const active = s.hotbar[s.activeSlot];

    let damage = 2; // hand base damage
    if (active) {
      const blockId = active.blockId;
      if (blockId === BlockId.WOODEN_SWORD) damage = 5;
      else if (blockId === BlockId.STONE_SWORD) damage = 6;
      else if (blockId === BlockId.IRON_SWORD) damage = 8;
      else if (blockId === BlockId.WOODEN_AXE) damage = 4;
      else if (blockId === BlockId.STONE_AXE) damage = 5;
      else if (blockId === BlockId.IRON_AXE) damage = 6;
      else if (blockId === BlockId.WOODEN_PICKAXE) damage = 3;
      else if (blockId === BlockId.STONE_PICKAXE) damage = 4;
      else if (blockId === BlockId.IRON_PICKAXE) damage = 5;
    }

    audio.playBreak();

    let targetEntity: any = null;
    const list = kind === 'animal' ? spawner.getAnimals() : spawner.getMonsters();
    for (const ent of list) {
      if (ent.id === entityId) {
        targetEntity = ent;
        break;
      }
    }

    if (!targetEntity) return;

    targetEntity.health -= damage;

    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    const kPower = 4.0;
    targetEntity.vel[0] = dir.x * kPower;
    targetEntity.vel[2] = dir.z * kPower;
    targetEntity.vel[1] = 3.0;

    if (active && active.blockId >= BlockId.TOOL_BASE) {
      s.applyDamageToTool('hotbar', s.activeSlot, 1);
    }

    if (targetEntity.health <= 0) {
      audio.playBreak();
      if (kind === 'animal') {
        const spec = ANIMAL_SPECS[targetEntity.species];
        if (spec) {
          const drops = rollAnimalDrops(spec);
          for (const d of drops) {
            s.addItemToInventory(d.blockId, d.count);
          }
        }
      }
    } else {
      if (kind === 'animal') {
        targetEntity.state = 'flee';
        targetEntity.stateTimer = 3000;
      } else {
        targetEntity.state = 'chase';
      }
    }
  }

  function onLeftClick() {
    swingProgressRef.current = 1.0;
    useGameStore.getState().triggerSwing();

    const entityGroups: THREE.Object3D[] = [];
    scene.traverse((obj) => {
      if (obj.userData && obj.userData.entityId) {
        entityGroups.push(obj);
      }
    });

    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    const ray = new THREE.Raycaster(camera.position, dir, 0, INTERACTION_REACH);
    const intersects = ray.intersectObjects(entityGroups, true);

    const hit = getTargetBlock();
    const blockDist = hit ? Math.hypot(hit.position[0] + 0.5 - camera.position.x, hit.position[1] + 0.5 - camera.position.y, hit.position[2] + 0.5 - camera.position.z) : Infinity;

    if (intersects.length > 0 && intersects[0].distance < blockDist) {
      let parent: THREE.Object3D | null = intersects[0].object;
      while (parent && (!parent.userData || !parent.userData.entityId)) {
        parent = parent.parent;
      }
      if (parent) {
        const id = parent.userData.entityId;
        const kind = parent.userData.entityKind;
        handleEntityHit(id, kind);
        return;
      }
    }

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

  return (
    <group ref={toolGroupRef}>
      <HeldTool activeItem={hotbar[activeSlot]} />
    </group>
  );
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

interface ArrowState {
  id: string;
  pos: [number, number, number];
  vel: [number, number, number];
}

function EntityRunner({ spawner, chunkManager }: { spawner: EntitySpawner; chunkManager: ChunkManager }) {
  const [entities, setEntities] = useState<any[]>([]);
  const [arrows, setArrows] = useState<ArrowState[]>([]);
  const lastEntityCountRef = useRef(0);
  const entityRefs = useRef(new Map<string, THREE.Group>());
  const arrowsRef = useRef<ArrowState[]>([]);

  useFrame((_, dt) => {
    const cappedDt = Math.min(dt, 1 / 20);
    // Spawner tick spawns new entities and deletes dead ones in memory arrays
    spawner.tick(cappedDt * 1000);

    const currentAnimals = spawner.getAnimals();
    const currentMonsters = spawner.getMonsters();
    const totalCount = currentAnimals.length + currentMonsters.length;
    if (totalCount !== lastEntityCountRef.current) {
      lastEntityCountRef.current = totalCount;
      setEntities([...currentAnimals, ...currentMonsters]);
    }

    const playerPos = useGameStore.getState().playerPos;

    // 1. Tick peaceful animals AI & physics
    for (const a of currentAnimals) {
      const spec = ANIMAL_SPECS[a.species];
      if (spec) {
        const attacker = a.state === 'flee' ? playerPos : null;
        tickAnimalAI(a, spec, attacker, cappedDt * 1000);

        // Run terrain gravity / physics collision check
        const res = updateEntityPosition(
          a.pos,
          a.vel,
          [a.width, a.height],
          cappedDt,
          (x, y, z) => chunkManager.getBlockAt(x, y, z, true),
          {}
        );
        a.pos = res.newPos;
        a.vel = res.newVel;
      }
    }

    // 2. Tick aggressive monsters AI & physics
    for (const m of currentMonsters) {
      const spec = MONSTER_SPECS[m.species];
      if (spec) {
        tickMonsterAI(m, spec, playerPos, cappedDt * 1000);

        // Run terrain gravity / physics collision check
        const res = updateEntityPosition(
          m.pos,
          m.vel,
          [m.width, m.height],
          cappedDt,
          (x, y, z) => chunkManager.getBlockAt(x, y, z, true),
          {}
        );
        m.pos = res.newPos;
        m.vel = res.newVel;

        // Handle monster attack triggers
        if (m.state === 'attack' && (m as any).pendingAttack) {
          (m as any).pendingAttack = false;

          if (spec.ranged) {
            // Skeleton shoots a 3D arrow!
            const arrowId = `arr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
            const dx = playerPos[0] - m.pos[0];
            const dy = (playerPos[1] + 1.22) - m.pos[1]; // target upper chest/eyes
            const dz = playerPos[2] - m.pos[2];
            const dist = Math.hypot(dx, dy, dz) || 1;
            const arrowSpeed = 12.0; // speed in blocks/sec
            const vel: [number, number, number] = [
              (dx / dist) * arrowSpeed,
              (dy / dist) * arrowSpeed,
              (dz / dist) * arrowSpeed
            ];
            const newArrow: ArrowState = {
              id: arrowId,
              pos: [m.pos[0], m.pos[1] + 1.2, m.pos[2]],
              vel
            };
            arrowsRef.current.push(newArrow);
            setArrows([...arrowsRef.current]);
          } else {
            // Zombie / Spider melee attack
            const diff = useGameStore.getState().difficulty;
            const finalSpec = applyDifficulty(spec, diff);
            useGameStore.getState().damagePlayer(finalSpec.damage);
            audio.playHurt();
          }
        }
      }
    }

    // 3. Tick arrows movement & collisions
    const activeArrows = arrowsRef.current;
    for (let i = activeArrows.length - 1; i >= 0; i--) {
      const arr = activeArrows[i];
      arr.pos[0] += arr.vel[0] * cappedDt;
      arr.pos[1] += arr.vel[1] * cappedDt;
      arr.pos[2] += arr.vel[2] * cappedDt;

      const bx = Math.floor(arr.pos[0]);
      const by = Math.floor(arr.pos[1]);
      const bz = Math.floor(arr.pos[2]);
      const block = chunkManager.getBlockAt(bx, by, bz);

      const px = playerPos[0];
      const py = playerPos[1];
      const pz = playerPos[2];
      const distToPlayer = Math.hypot(arr.pos[0] - px, arr.pos[1] - (py + 0.9), arr.pos[2] - pz);

      let removeArrow = false;
      if (block !== 0 && block !== 8) {
        removeArrow = true;
      } else if (distToPlayer < 0.8) {
        removeArrow = true;
        const diff = useGameStore.getState().difficulty;
        const baseDmg = MONSTER_SPECS.skeleton.damage;
        const finalSpec = applyDifficulty({ damage: baseDmg } as any, diff);
        useGameStore.getState().damagePlayer(finalSpec.damage);
        audio.playHurt();
      }

      if (removeArrow) {
        activeArrows.splice(i, 1);
        setArrows([...activeArrows]);
      }
    }

    // 4. Synchronize 3D mesh translations and facing direction Y-rotations
    const allEntities = [...currentAnimals, ...currentMonsters];
    for (const ent of allEntities) {
      const groupObj = entityRefs.current.get(ent.id);
      if (groupObj) {
        groupObj.position.set(ent.pos[0], ent.pos[1], ent.pos[2]);

        const vx = ent.vel[0];
        const vz = ent.vel[2];
        if (Math.hypot(vx, vz) > 0.05) {
          groupObj.rotation.y = Math.atan2(vx, vz);
        }
      }
    }
  });

  return (
    <>
      {entities.map((ent) => (
        <EntityMesh key={ent.id} entity={ent} refsMap={entityRefs.current} />
      ))}
      {arrows.map((arr) => (
        <mesh key={arr.id} position={arr.pos}>
          <boxGeometry args={[0.08, 0.08, 0.4]} />
          <meshLambertMaterial color="#8b5a2b" />
        </mesh>
      ))}
    </>
  );
}

function EntityMesh({ entity, refsMap }: { entity: any; refsMap: Map<string, THREE.Group> }) {
  const species = entity.species;
  let model: React.ReactNode = null;

  if (species === 'cow') {
    model = (
      <group position={[0, -0.3, 0]}>
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[0.6, 0.45, 0.8]} />
          <meshLambertMaterial color="#5c4033" />
        </mesh>
        <mesh position={[0, 0.75, 0.45]}>
          <boxGeometry args={[0.3, 0.3, 0.3]} />
          <meshLambertMaterial color="#5c4033" />
        </mesh>
        <mesh position={[-0.2, 0.15, -0.25]}>
          <boxGeometry args={[0.12, 0.3, 0.12]} />
          <meshLambertMaterial color="#ffffff" />
        </mesh>
        <mesh position={[0.2, 0.15, -0.25]}>
          <boxGeometry args={[0.12, 0.3, 0.12]} />
          <meshLambertMaterial color="#ffffff" />
        </mesh>
        <mesh position={[-0.2, 0.15, 0.25]}>
          <boxGeometry args={[0.12, 0.3, 0.12]} />
          <meshLambertMaterial color="#ffffff" />
        </mesh>
        <mesh position={[0.2, 0.15, 0.25]}>
          <boxGeometry args={[0.12, 0.3, 0.12]} />
          <meshLambertMaterial color="#ffffff" />
        </mesh>
      </group>
    );
  } else if (species === 'pig') {
    model = (
      <group position={[0, -0.3, 0]}>
        <mesh position={[0, 0.4, 0]}>
          <boxGeometry args={[0.5, 0.4, 0.7]} />
          <meshLambertMaterial color="#ffb6c1" />
        </mesh>
        <mesh position={[0, 0.55, 0.38]}>
          <boxGeometry args={[0.25, 0.25, 0.25]} />
          <meshLambertMaterial color="#ffb6c1" />
        </mesh>
        <mesh position={[-0.15, 0.1, -0.2]}>
          <boxGeometry args={[0.1, 0.2, 0.1]} />
          <meshLambertMaterial color="#ffb6c1" />
        </mesh>
        <mesh position={[0.15, 0.1, -0.2]}>
          <boxGeometry args={[0.1, 0.2, 0.1]} />
          <meshLambertMaterial color="#ffb6c1" />
        </mesh>
        <mesh position={[-0.15, 0.1, 0.2]}>
          <boxGeometry args={[0.1, 0.2, 0.1]} />
          <meshLambertMaterial color="#ffb6c1" />
        </mesh>
        <mesh position={[0.15, 0.1, 0.2]}>
          <boxGeometry args={[0.1, 0.2, 0.1]} />
          <meshLambertMaterial color="#ffb6c1" />
        </mesh>
      </group>
    );
  } else if (species === 'chicken') {
    model = (
      <group position={[0, -0.4, 0]}>
        <mesh position={[0, 0.3, 0]}>
          <boxGeometry args={[0.25, 0.25, 0.3]} />
          <meshLambertMaterial color="#ffffff" />
        </mesh>
        <mesh position={[0, 0.45, 0.12]}>
          <boxGeometry args={[0.15, 0.18, 0.15]} />
          <meshLambertMaterial color="#ffffff" />
        </mesh>
        <mesh position={[0, 0.46, 0.22]}>
          <boxGeometry args={[0.08, 0.05, 0.08]} />
          <meshLambertMaterial color="#ff8c00" />
        </mesh>
        <mesh position={[-0.06, 0.1, 0]}>
          <boxGeometry args={[0.04, 0.18, 0.04]} />
          <meshLambertMaterial color="#ffa500" />
        </mesh>
        <mesh position={[0.06, 0.1, 0]}>
          <boxGeometry args={[0.04, 0.18, 0.04]} />
          <meshLambertMaterial color="#ffa500" />
        </mesh>
      </group>
    );
  } else if (species === 'zombie') {
    model = (
      <group position={[0, -0.9, 0]}>
        <mesh position={[0, 1.7, 0]}>
          <boxGeometry args={[0.25, 0.25, 0.25]} />
          <meshLambertMaterial color="#3cb371" />
        </mesh>
        <mesh position={[0, 1.25, 0]}>
          <boxGeometry args={[0.3, 0.6, 0.16]} />
          <meshLambertMaterial color="#0000ff" />
        </mesh>
        <mesh position={[-0.2, 1.25, 0.12]} rotation={[Math.PI / 2, 0, 0]}>
          <boxGeometry args={[0.1, 0.1, 0.3]} />
          <meshLambertMaterial color="#3cb371" />
        </mesh>
        <mesh position={[0.2, 1.25, 0.12]} rotation={[Math.PI / 2, 0, 0]}>
          <boxGeometry args={[0.1, 0.1, 0.3]} />
          <meshLambertMaterial color="#3cb371" />
        </mesh>
        <mesh position={[-0.08, 0.45, 0]}>
          <boxGeometry args={[0.1, 0.9, 0.1]} />
          <meshLambertMaterial color="#00008b" />
        </mesh>
        <mesh position={[0.08, 0.45, 0]}>
          <boxGeometry args={[0.1, 0.9, 0.1]} />
          <meshLambertMaterial color="#00008b" />
        </mesh>
      </group>
    );
  } else if (species === 'skeleton') {
    model = (
      <group position={[0, -0.9, 0]}>
        <mesh position={[0, 1.7, 0]}>
          <boxGeometry args={[0.25, 0.25, 0.25]} />
          <meshLambertMaterial color="#dcdcdc" />
        </mesh>
        <mesh position={[0, 1.25, 0]}>
          <boxGeometry args={[0.18, 0.6, 0.1]} />
          <meshLambertMaterial color="#dcdcdc" />
        </mesh>
        <mesh position={[-0.13, 1.25, 0.12]} rotation={[Math.PI / 2, 0, 0]}>
          <boxGeometry args={[0.05, 0.05, 0.3]} />
          <meshLambertMaterial color="#dcdcdc" />
        </mesh>
        <mesh position={[0.13, 1.25, 0.12]} rotation={[Math.PI / 2, 0, 0]}>
          <boxGeometry args={[0.05, 0.05, 0.3]} />
          <meshLambertMaterial color="#dcdcdc" />
        </mesh>
        <mesh position={[-0.06, 0.45, 0]}>
          <boxGeometry args={[0.05, 0.9, 0.05]} />
          <meshLambertMaterial color="#dcdcdc" />
        </mesh>
        <mesh position={[0.06, 0.45, 0]}>
          <boxGeometry args={[0.05, 0.9, 0.05]} />
          <meshLambertMaterial color="#dcdcdc" />
        </mesh>
      </group>
    );
  } else if (species === 'spider') {
    model = (
      <group position={[0, -0.15, 0]}>
        <mesh position={[0, 0.15, 0]}>
          <boxGeometry args={[0.5, 0.3, 0.6]} />
          <meshLambertMaterial color="#303030" />
        </mesh>
        <mesh position={[0, 0.15, 0.35]}>
          <boxGeometry args={[0.25, 0.2, 0.25]} />
          <meshLambertMaterial color="#000000" />
        </mesh>
        <mesh position={[-0.35, 0.1, 0]} rotation={[0, 0, Math.PI / 6]}>
          <boxGeometry args={[0.3, 0.05, 0.05]} />
          <meshLambertMaterial color="#000000" />
        </mesh>
        <mesh position={[0.35, 0.1, 0]} rotation={[0, 0, -Math.PI / 6]}>
          <boxGeometry args={[0.3, 0.05, 0.05]} />
          <meshLambertMaterial color="#000000" />
        </mesh>
        <mesh position={[-0.35, 0.1, 0.15]} rotation={[0, 0.2, Math.PI / 6]}>
          <boxGeometry args={[0.3, 0.05, 0.05]} />
          <meshLambertMaterial color="#000000" />
        </mesh>
        <mesh position={[0.35, 0.1, 0.15]} rotation={[0, -0.2, -Math.PI / 6]}>
          <boxGeometry args={[0.3, 0.05, 0.05]} />
          <meshLambertMaterial color="#000000" />
        </mesh>
        <mesh position={[-0.35, 0.1, -0.15]} rotation={[0, -0.2, Math.PI / 6]}>
          <boxGeometry args={[0.3, 0.05, 0.05]} />
          <meshLambertMaterial color="#000000" />
        </mesh>
        <mesh position={[0.35, 0.1, -0.15]} rotation={[0, 0.2, -Math.PI / 6]}>
          <boxGeometry args={[0.3, 0.05, 0.05]} />
          <meshLambertMaterial color="#000000" />
        </mesh>
      </group>
    );
  }

  return (
    <group
      ref={(el) => {
        if (el) refsMap.set(entity.id, el);
        else refsMap.delete(entity.id);
      }}
      position={entity.pos}
      userData={{ entityId: entity.id, entityKind: entity.kind }}
    >
      {model}
    </group>
  );
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
  const isPaused = useGameStore((s) => s.isPaused);
  const showInventory = useGameStore((s) => s.showInventory);
  const showSmelting = useGameStore((s) => s.showSmelting);
  const screen = useGameStore((s) => s.screen);

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
      <Player chunkManager={chunkManager} spawner={spawner} getHeight={getHeight} getBiome={getBiome} />
      <ChunkUpdater chunkManager={chunkManager} />
      <EntityRunner spawner={spawner} chunkManager={chunkManager} />
      <GameTick />
      {screen === 'game' && !isPaused && !showInventory && !showSmelting && <PointerLockControls />}
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

function HeldTool({ activeItem }: { activeItem: any }) {
  if (!activeItem) {
    // Bare Hand
    return (
      <mesh position={[0, -0.05, 0]}>
        <boxGeometry args={[0.07, 0.07, 0.25]} />
        <meshLambertMaterial color="#e0a96d" />
      </mesh>
    );
  }

  const blockId = activeItem.blockId;
  const isSword = [BlockId.WOODEN_SWORD, BlockId.STONE_SWORD, BlockId.IRON_SWORD].includes(blockId);
  const isPickaxe = [BlockId.WOODEN_PICKAXE, BlockId.STONE_PICKAXE, BlockId.IRON_PICKAXE].includes(blockId);
  const isAxe = [BlockId.WOODEN_AXE, BlockId.STONE_AXE, BlockId.IRON_AXE].includes(blockId);

  // Decide material color
  let matColor = '#ffffff';
  if (blockId === BlockId.WOODEN_SWORD || blockId === BlockId.WOODEN_PICKAXE || blockId === BlockId.WOODEN_AXE) {
    matColor = '#A0522D';
  } else if (blockId === BlockId.STONE_SWORD || blockId === BlockId.STONE_PICKAXE || blockId === BlockId.STONE_AXE) {
    matColor = '#808080';
  } else if (blockId === BlockId.IRON_SWORD || blockId === BlockId.IRON_PICKAXE || blockId === BlockId.IRON_AXE) {
    matColor = '#D3D3D3';
  }

  if (isSword) {
    return (
      <group rotation={[0, 0, 0]}>
        {/* Handle */}
        <mesh position={[0, 0, 0.05]}>
          <boxGeometry args={[0.02, 0.02, 0.12]} />
          <meshLambertMaterial color="#8B5A2B" />
        </mesh>
        {/* Guard */}
        <mesh position={[0, 0, -0.02]}>
          <boxGeometry args={[0.1, 0.03, 0.03]} />
          <meshLambertMaterial color="#8B5A2B" />
        </mesh>
        {/* Blade */}
        <mesh position={[0, 0, -0.25]}>
          <boxGeometry args={[0.04, 0.015, 0.42]} />
          <meshLambertMaterial color={matColor} />
        </mesh>
      </group>
    );
  }

  if (isPickaxe) {
    return (
      <group rotation={[0, 0, 0]}>
        {/* Handle */}
        <mesh position={[0, 0, -0.05]} rotation={[Math.PI / 4, 0, 0]}>
          <boxGeometry args={[0.02, 0.02, 0.3]} />
          <meshLambertMaterial color="#8B5A2B" />
        </mesh>
        {/* Head */}
        <mesh position={[0, 0.1, -0.15]} rotation={[0, 0, 0]}>
          <boxGeometry args={[0.22, 0.03, 0.03]} />
          <meshLambertMaterial color={matColor} />
        </mesh>
      </group>
    );
  }

  if (isAxe) {
    return (
      <group rotation={[0, 0, 0]}>
        {/* Handle */}
        <mesh position={[0, 0, -0.05]} rotation={[Math.PI / 4, 0, 0]}>
          <boxGeometry args={[0.02, 0.02, 0.3]} />
          <meshLambertMaterial color="#8B5A2B" />
        </mesh>
        {/* Head */}
        <mesh position={[0.04, 0.08, -0.15]}>
          <boxGeometry args={[0.08, 0.08, 0.03]} />
          <meshLambertMaterial color={matColor} />
        </mesh>
      </group>
    );
  }

  // Otherwise, it's a block or item. Render a small block!
  return (
    <mesh position={[0, 0, 0]}>
      <boxGeometry args={[0.12, 0.12, 0.12]} />
      <meshLambertMaterial color={getBlockColor(blockId)} />
    </mesh>
  );
}

function getBlockColor(blockId: number): string {
  switch (blockId) {
    case BlockId.DIRT: return '#865d36';
    case BlockId.GRASS: return '#557a46';
    case BlockId.STONE: return '#808080';
    case BlockId.WOOD: return '#8b5a2b';
    case BlockId.LEAVES: return '#3f5e2f';
    case BlockId.SAND: return '#e1c699';
    case BlockId.BRICK: return '#b22222';
    case BlockId.GLASS: return '#aed8f2';
    case BlockId.WATER: return '#3b5998';
    case BlockId.FURNACE: return '#5a5a5a';
    case BlockId.TORCH: return '#ffcc00';
    case BlockId.COBBLESTONE: return '#7a7a7a';
    case BlockId.CLAY: return '#9aa0a6';
    case BlockId.COAL_ORE: return '#4a4a4a';
    case BlockId.IRON_ORE: return '#d4af37';
    case BlockId.GOLD_ORE: return '#ffd700';
    case BlockId.DIAMOND_ORE: return '#00ffff';
    default: return '#ffffff';
  }
}