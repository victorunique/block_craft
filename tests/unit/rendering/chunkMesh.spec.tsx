import { describe, test, expect, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import React from 'react';
import { ChunkMesh } from '../../../src/game/rendering/chunkMesh';
import type { ChunkEntry } from '../../../src/game/world/chunkManager';

// Mock buildTextureAtlas to return dummy canvas and texture objects to prevent running real canvas logic in node environment
vi.mock('../../../src/game/rendering/textureAtlas', () => {
  return {
    buildTextureAtlas: () => ({
      canvas: {
        getContext: () => ({
          drawImage: () => {},
          fillRect: () => {},
          clearRect: () => {},
          putImageData: () => {},
          getImageData: () => ({ data: new Uint8ClampedArray(4) }),
          createImageData: () => ({ data: new Uint8ClampedArray(4) }),
        }),
      } as any,
      texture: {
        dispose: () => {},
      } as any,
    }),
  };
});

describe('ChunkMesh', () => {

  test('renders successfully when there are only water blocks and no solid blocks', async () => {
    const mockEntry: ChunkEntry = {
      cx: 0,
      cy: 0,
      cz: 0,
      voxels: new Uint8Array(0),
      mesh: {
        chunkX: 0,
        chunkY: 0,
        chunkZ: 0,
        positions: new Float32Array(0),
        normals: new Float32Array(0),
        uvs: new Float32Array(0),
        indices: new Uint32Array(0), // No solid blocks
        waterPositions: new Float32Array([0, 0, 0, 1, 0, 0, 1, 0, 1]),
        waterNormals: new Float32Array([0, 1, 0, 0, 1, 0, 0, 1, 0]),
        waterUvs: new Float32Array([0, 0, 1, 0, 1, 1]),
        waterIndices: new Uint32Array([0, 1, 2]), // Has water blocks
        crossPositions: new Float32Array(0),
        crossNormals: new Float32Array(0),
        crossUvs: new Float32Array(0),
        crossIndices: new Uint32Array(0),
      },
      generation: null,
    };

    const { container } = render(<ChunkMesh entry={mockEntry} />);

    // Wait for atlas loading promise to resolve and component to re-render
    await waitFor(() => {
      expect(container.firstChild).not.toBeNull();
    });
  });
});
