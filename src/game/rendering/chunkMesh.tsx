import * as THREE from 'three';
import { useMemo, useEffect, useState } from 'react';
import type { ThreeElements } from '@react-three/fiber';
import type { ChunkEntry } from '../world/chunkManager';
import { buildTextureAtlas } from './textureAtlas';

declare global {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {}
  }
}

let _atlas: { canvas: HTMLCanvasElement; texture: THREE.Texture } | null = null;
let _atlasPromise: Promise<{ canvas: HTMLCanvasElement; texture: THREE.Texture }> | null = null;

export function getAtlas(): Promise<{ canvas: HTMLCanvasElement; texture: THREE.Texture }> {
  if (_atlas) return Promise.resolve(_atlas);
  if (!_atlasPromise) {
    _atlasPromise = new Promise((resolve) => {
      const r = buildTextureAtlas();
      _atlas = r;
      resolve(r);
    });
  }
  return _atlasPromise;
}

export function getAtlasSync(): { canvas: HTMLCanvasElement; texture: THREE.Texture } | null {
  return _atlas;
}

interface ChunkMeshProps {
  entry: ChunkEntry;
}

export function ChunkMesh({ entry }: ChunkMeshProps) {
  const geometry = useMemo(() => new THREE.BufferGeometry(), []);
  const waterGeometry = useMemo(() => new THREE.BufferGeometry(), []);
  const crossGeometry = useMemo(() => new THREE.BufferGeometry(), []);
  const [atlas, setAtlas] = useState<{ canvas: HTMLCanvasElement; texture: THREE.Texture } | null>(_atlas);

  useEffect(() => {
    if (_atlas && !atlas) setAtlas(_atlas);
    else if (!_atlas) {
      void getAtlas().then((a) => setAtlas(a));
    }
  }, [atlas]);

  useEffect(() => {
    if (!entry.mesh) return;
    const m = entry.mesh;
    geometry.setAttribute('position', new THREE.BufferAttribute(m.positions, 3));
    geometry.setAttribute('normal', new THREE.BufferAttribute(m.normals, 3));
    geometry.setAttribute('uv', new THREE.BufferAttribute(m.uvs, 2));
    geometry.setIndex(new THREE.BufferAttribute(m.indices, 1));
    geometry.computeBoundingSphere();

    waterGeometry.setAttribute('position', new THREE.BufferAttribute(m.waterPositions, 3));
    waterGeometry.setAttribute('normal', new THREE.BufferAttribute(m.waterNormals, 3));
    waterGeometry.setAttribute('uv', new THREE.BufferAttribute(m.waterUvs, 2));
    waterGeometry.setIndex(new THREE.BufferAttribute(m.waterIndices, 1));
    waterGeometry.computeBoundingSphere();

    crossGeometry.setAttribute('position', new THREE.BufferAttribute(m.crossPositions, 3));
    crossGeometry.setAttribute('normal', new THREE.BufferAttribute(m.crossNormals, 3));
    crossGeometry.setAttribute('uv', new THREE.BufferAttribute(m.crossUvs, 2));
    crossGeometry.setIndex(new THREE.BufferAttribute(m.crossIndices, 1));
    crossGeometry.computeBoundingSphere();
  }, [entry.mesh, geometry, waterGeometry, crossGeometry]);

  useEffect(() => {
    return () => {
      geometry.dispose();
      waterGeometry.dispose();
      crossGeometry.dispose();
    };
  }, [geometry, waterGeometry, crossGeometry]);

  if (!atlas || !entry.mesh) return null;
  const hasSolid = entry.mesh.indices.length > 0;
  const hasWater = entry.mesh.waterIndices.length > 0;
  const hasCross = entry.mesh.crossIndices.length > 0;
  if (!hasSolid && !hasWater && !hasCross) return null;

  return (
    <group>
      {hasSolid && (
        <mesh geometry={geometry} frustumCulled>
          <meshLambertMaterial map={atlas.texture} vertexColors={false} />
        </mesh>
      )}
      {hasWater && (
        <mesh geometry={waterGeometry} frustumCulled>
          <meshLambertMaterial map={atlas.texture} transparent opacity={0.7} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      )}
      {hasCross && (
        <mesh geometry={crossGeometry} frustumCulled>
          <meshLambertMaterial map={atlas.texture} transparent depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
}