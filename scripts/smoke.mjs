import { chromium } from '@playwright/test';
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';

const PORT = '4173';
const BASE = `http://localhost:${PORT}`;
const outDir = path.resolve(process.cwd(), 'artifacts/screenshots');
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
const page = await context.newPage();
const errors = [];
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(`[console] ${msg.text()}`);
  if (msg.type() === 'log') console.log(`[browser]`, msg.text());
});
page.on('pageerror', (err) => errors.push(`[pageerror] ${err.message}`));

await page.goto(BASE + '/');
await page.waitForLoadState('networkidle');
await page.screenshot({ path: path.join(outDir, '01-main-menu.png') });

await page.getByRole('button', { name: 'Create new world' }).click();
await page.waitForTimeout(300);
await page.screenshot({ path: path.join(outDir, '02-world-creation.png') });

await page.getByRole('button', { name: 'Create World' }).click();
await page.waitForTimeout(2000);
await page.screenshot({ path: path.join(outDir, '03-loading.png') });

await page.waitForTimeout(15000);
await page.screenshot({ path: path.join(outDir, '04-game.png') });

// Examine the actual pixel data of the game screenshot
const png = PNG.sync.read(readFileSync(path.join(outDir, '04-game.png')));
const w = png.width, h = png.height;
console.log(`Game screenshot: ${w}x${h}`);

const colorBuckets = { sky: 0, sand: 0, stone: 0, grass: 0, water: 0, dirt: 0, other: 0 };
for (let y = 0; y < h; y++) {
  for (let x = 0; x < w; x++) {
    const idx = (y * w + x) * 4;
    const r = png.data[idx], g = png.data[idx + 1], b = png.data[idx + 2];
    if (b > 200 && g > 180 && r < 150) colorBuckets.sky++;
    else if (r > 200 && g > 180 && b < 150) colorBuckets.sand++;
    else if (r > 100 && r < 200 && g > 100 && g < 200 && b > 100 && b < 200) colorBuckets.stone++;
    else if (g > 150 && r < 100) colorBuckets.grass++;
    else if (b > 150 && g > 100 && r < 100) colorBuckets.water++;
    else if (r > 130 && g > 80 && g < 130 && b < 100) colorBuckets.dirt++;
    else colorBuckets.other++;
  }
}
console.log('Color histogram:', JSON.stringify(colorBuckets));

// Sample some specific points
const points = [
  ['top-center', 0.5, 0.1],
  ['upper-center', 0.5, 0.3],
  ['mid-center', 0.5, 0.5],
  ['lower-center', 0.5, 0.7],
  ['bottom-center', 0.5, 0.9],
  ['bottom-left', 0.2, 0.95],
  ['bottom-right', 0.8, 0.95],
];
console.log('Pixel samples:');
for (const [name, fx, fy] of points) {
  const x = Math.floor(w * fx);
  const y = Math.floor(h * fy);
  const idx = (y * w + x) * 4;
  console.log(`  ${name} (${x},${y}): rgb(${png.data[idx]}, ${png.data[idx + 1]}, ${png.data[idx + 2]})`);
}

writeFileSync(path.join(outDir, 'errors.txt'), errors.join('\n'));
console.log('Errors:', errors.length);
errors.forEach((e) => console.log(e));

await browser.close();
console.log('Done');
