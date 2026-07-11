import { PNG } from 'pngjs';
import { readFileSync } from 'node:fs';

const files = [
  'artifacts/screenshots/01-main-menu.png',
  'artifacts/screenshots/02-world-creation.png',
  'artifacts/screenshots/03-loading.png',
  'artifacts/screenshots/04-game.png',
];

for (const f of files) {
  const data = readFileSync(f);
  const png = PNG.sync.read(data);
  let r = 0, g = 0, b = 0;
  const samplePoints = [
    [0.5, 0.15], [0.5, 0.5], [0.5, 0.85], [0.2, 0.85], [0.8, 0.85], [0.1, 0.5], [0.9, 0.5]
  ];
  const colors = [];
  for (const [fx, fy] of samplePoints) {
    const x = Math.floor(png.width * fx);
    const y = Math.floor(png.height * fy);
    const idx = (y * png.width + x) * 4;
    colors.push(`(${png.data[idx]},${png.data[idx+1]},${png.data[idx+2]})`);
  }
  console.log(f.split('/').pop(), colors.join(' '));
}
