// Generates PWA icons from the in-game sprite: `npm run icons`
import fs from 'node:fs';
import { compose } from '../js/sprite.js';
import { Canvas } from './png.mjs';

const look = { skin: 's2', hair: 'messy', hairColor: 'black', face: 'shades_green', top: 'hoodie', bottom: 'jeans', shoes: 'kicks_white', build: 1, expr: 2, head: 'halo' };
const buf = compose(look);
const crop = [16, 0, 32, 32]; // halo + head + shoulders

function icon(size, pad) {
  const cv = new Canvas(size, size, [8, 8, 10, 255]);
  // soft vignette bands + floor line for a bit of depth
  const bands = [[18, 18, 24], [22, 22, 30], [27, 27, 37]];
  bands.forEach((c, i) => { const m = Math.round(size * (0.08 + i * 0.07)); cv.fill(m, m, size - m * 2, size - m * 2, [...c, 255]); });
  const scale = Math.floor((size * (1 - pad * 2)) / crop[2]);
  const w = crop[2] * scale, ox = Math.round((size - w) / 2), oy = size - Math.round(size * pad) - crop[3] * scale;
  cv.sprite(buf, ox, oy, scale, crop);
  return cv.png();
}

const out = new URL('../icons/', import.meta.url).pathname;
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(out + 'icon-192.png', icon(192, 0.04));
fs.writeFileSync(out + 'icon-512.png', icon(512, 0.04));
fs.writeFileSync(out + 'icon-maskable-512.png', icon(512, 0.16));
fs.writeFileSync(out + 'apple-touch-icon.png', icon(180, 0.04));
console.log('icons written to', out);
