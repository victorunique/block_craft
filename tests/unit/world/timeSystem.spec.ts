import { describe, it, expect } from 'vitest';
import { getDayPhase, getSkyColor, getSunAngle, getSunIntensity } from '@/game/world/timeSystem';

describe('Day/Night time system', () => {
  it('classifies phases by time of day', () => {
    expect(getDayPhase(0)).toBe('sunrise');
    expect(getDayPhase(6000)).toBe('day');
    expect(getDayPhase(14400)).toBe('sunset');
    expect(getDayPhase(18000)).toBe('night');
    expect(getDayPhase(22000)).toBe('morning');
  });

  it('returns a sky color in [0,1] range', () => {
    const c = getSkyColor(6000);
    expect(c.r).toBeGreaterThanOrEqual(0);
    expect(c.r).toBeLessThanOrEqual(1);
  });

  it('sun intensity drops to 0 at deep night', () => {
    expect(getSunIntensity(18000)).toBe(0);
  });

  it('sun angle progresses linearly', () => {
    expect(getSunAngle(0)).toBeCloseTo(0);
    expect(getSunAngle(6000)).toBeCloseTo(Math.PI / 2, 2);
    expect(getSunAngle(12000)).toBeCloseTo(Math.PI, 2);
  });
});