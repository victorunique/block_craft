import { STORAGE_WARN_PERCENT } from '../../config/constants';

export interface DeviceTier {
  tier: 1 | 2;
  reasons: string[];
}

export interface DeviceSignals {
  userAgent?: string;
  deviceMemory?: number;
  maxRenderbufferSize?: number;
  gpuVendor?: string;
  hasTouch?: boolean;
}

export function classifyDevice(signals: DeviceSignals): DeviceTier {
  const reasons: string[] = [];
  let tier: 1 | 2 = 2;
  const ua = (signals.userAgent ?? '').toLowerCase();
  const isMobileUA = /mobi|android|iphone|ipad|ipod/.test(ua);
  if (isMobileUA) {
    tier = 1;
    reasons.push('mobile-user-agent');
  }
  if (typeof signals.deviceMemory === 'number' && signals.deviceMemory < 4) {
    tier = 1;
    reasons.push('low-device-memory');
  }
  if (typeof signals.maxRenderbufferSize === 'number' && signals.maxRenderbufferSize <= 4096) {
    tier = 1;
    reasons.push('low-max-renderbuffer');
  }
  const gpuVendor = (signals.gpuVendor ?? '').toLowerCase();
  if (/mali|adreno|apple|powervr/.test(gpuVendor)) {
    tier = 1;
    reasons.push('mobile-gpu');
  }
  if (signals.hasTouch && tier === 2) {
    tier = 1;
    reasons.push('touch-input');
  }
  return { tier, reasons };
}

export async function getLiveDeviceSignals(): Promise<DeviceSignals> {
  const signals: DeviceSignals = {};
  if (typeof navigator !== 'undefined') {
    signals.userAgent = navigator.userAgent;
    const dm = (navigator as any).deviceMemory;
    if (typeof dm === 'number') signals.deviceMemory = dm;
    signals.hasTouch = (navigator as any).maxTouchPoints > 0;
  }
  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (gl) {
      const maxRb = gl.getParameter(gl.MAX_RENDERBUFFER_SIZE);
      if (typeof maxRb === 'number') signals.maxRenderbufferSize = maxRb;
      const dbg = gl.getExtension('WEBGL_debug_renderer_info');
      if (dbg) {
        const vendor = gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL);
        if (typeof vendor === 'string') signals.gpuVendor = vendor;
      }
    }
  }
  return signals;
}

export interface StorageEstimate {
  percentUsed: number;
  warn: boolean;
  usage?: number;
  quota?: number;
}

export async function estimateStorage(): Promise<StorageEstimate> {
  if (typeof navigator === 'undefined' || !navigator.storage?.estimate) {
    return { percentUsed: 0, warn: false };
  }
  try {
    const { usage, quota } = await navigator.storage.estimate();
    if (!usage || !quota) return { percentUsed: 0, warn: false };
    const percentUsed = (usage / quota) * 100;
    return { percentUsed, warn: percentUsed > STORAGE_WARN_PERCENT, usage, quota };
  } catch {
    return { percentUsed: 0, warn: false };
  }
}