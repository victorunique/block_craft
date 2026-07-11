import { describe, it, expect } from 'vitest';
import { classifyDevice, estimateStorage } from '@/game/save/tierDetection';

describe('Tier 1 device detection', () => {
  it('classifies low-memory (< 4GB) as Tier 1', () => {
    const r = classifyDevice({ deviceMemory: 2 });
    expect(r.tier).toBe(1);
    expect(r.reasons).toContain('low-device-memory');
  });
  it('classifies mobile UA as Tier 1', () => {
    const r = classifyDevice({ userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)' });
    expect(r.tier).toBe(1);
  });
  it('classifies mobile GPU vendor as Tier 1', () => {
    const r = classifyDevice({ gpuVendor: 'Qualcomm Adreno (TM) 640' });
    expect(r.tier).toBe(1);
    expect(r.reasons).toContain('mobile-gpu');
  });
  it('classifies low max-renderbuffer as Tier 1', () => {
    const r = classifyDevice({ maxRenderbufferSize: 4096 });
    expect(r.tier).toBe(1);
  });
  it('classifies high-end desktop as Tier 2', () => {
    const r = classifyDevice({ userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', deviceMemory: 16, maxRenderbufferSize: 16384, gpuVendor: 'NVIDIA' });
    expect(r.tier).toBe(2);
  });
});

describe('Storage estimation (SM-002)', () => {
  it('reports warn flag when usage > 80%', async () => {
    const orig = (navigator as any).storage;
    (navigator as any).storage = {
      estimate: async () => ({ usage: 42 * 1024 * 1024, quota: 50 * 1024 * 1024 }),
    };
    try {
      const r = await estimateStorage();
      expect(r.warn).toBe(true);
      expect(r.percentUsed).toBeGreaterThan(80);
    } finally {
      (navigator as any).storage = orig;
    }
  });

  it('does not warn when usage is low', async () => {
    const orig = (navigator as any).storage;
    (navigator as any).storage = {
      estimate: async () => ({ usage: 1 * 1024 * 1024, quota: 100 * 1024 * 1024 }),
    };
    try {
      const r = await estimateStorage();
      expect(r.warn).toBe(false);
    } finally {
      (navigator as any).storage = orig;
    }
  });
});