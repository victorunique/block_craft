import { estimateStorage } from './tierDetection';

export async function runStorageGuard(): Promise<void> {
  const est = await estimateStorage();
  if (est.warn) {
    console.warn('IndexedDB storage capacity running low.', { percentUsed: est.percentUsed, usage: est.usage, quota: est.quota });
  }
}