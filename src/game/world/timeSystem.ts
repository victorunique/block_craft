import { DAY_LENGTH_TICKS } from '../../config/constants';

export type DayPhase = 'morning' | 'day' | 'sunset' | 'night' | 'sunrise';

export function getDayPhase(timeOfDay: number): DayPhase {
  const ratio = (timeOfDay % DAY_LENGTH_TICKS) / DAY_LENGTH_TICKS;
  if (ratio < 0.1) return 'sunrise';
  if (ratio < 0.5) return 'day';
  if (ratio < 0.65) return 'sunset';
  if (ratio < 0.9) return 'night';
  return 'morning';
}

export function getSkyColor(timeOfDay: number): { r: number; g: number; b: number } {
  const ratio = (timeOfDay % DAY_LENGTH_TICKS) / DAY_LENGTH_TICKS;
  const day = { r: 0.529, g: 0.808, b: 0.922 };
  const sunset = { r: 0.95, g: 0.55, b: 0.3 };
  const night = { r: 0.1, g: 0.12, b: 0.25 };
  const sunrise = { r: 0.85, g: 0.7, b: 0.55 };
  if (ratio < 0.08) return lerp(sunrise, day, ratio / 0.08);
  if (ratio < 0.5) return day;
  if (ratio < 0.6) return lerp(day, sunset, (ratio - 0.5) / 0.1);
  if (ratio < 0.65) return lerp(sunset, night, (ratio - 0.6) / 0.05);
  if (ratio < 0.9) return night;
  return lerp(night, sunrise, (ratio - 0.9) / 0.1);
}

export function getSunIntensity(timeOfDay: number): number {
  const ratio = (timeOfDay % DAY_LENGTH_TICKS) / DAY_LENGTH_TICKS;
  if (ratio < 0.1) return 0.5;
  if (ratio < 0.5) return 1;
  if (ratio < 0.6) return 0.6;
  if (ratio < 0.65) return 0.1;
  return 0;
}

export function getSunAngle(timeOfDay: number): number {
  return (timeOfDay / DAY_LENGTH_TICKS) * Math.PI * 2;
}

function lerp(a: { r: number; g: number; b: number }, b: { r: number; g: number; b: number }, t: number) {
  return { r: a.r + (b.r - a.r) * t, g: a.g + (b.g - a.g) * t, b: a.b + (b.b - a.b) * t };
}