import { describe, test, expect, vi, beforeEach } from 'vitest';
import { getChunkWorker } from '../../../src/game/rendering/chunkWorkerClient';

describe('ChunkWorkerClient Singleton and Disposal', () => {
  beforeEach(() => {
    vi.stubGlobal('Worker', vi.fn().mockImplementation(() => ({
      addEventListener: vi.fn(),
      postMessage: vi.fn(),
      terminate: vi.fn(),
    })));
  });

  test('getChunkWorker returns the same singleton instance', () => {
    const worker1 = getChunkWorker();
    const worker2 = getChunkWorker();
    expect(worker1).toBe(worker2);
  });

  test('dispose terminates the worker and resets the singleton', () => {
    const worker1 = getChunkWorker();
    const terminateSpy = vi.spyOn((worker1 as any).worker, 'terminate');
    
    worker1.dispose();
    
    expect(terminateSpy).toHaveBeenCalled();
    
    // getChunkWorker should now return a new instance
    const worker2 = getChunkWorker();
    expect(worker1).not.toBe(worker2);
  });
});
