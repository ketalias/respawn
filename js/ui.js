// RESPAWN — UI toolkit: pixel icons, chiptune sfx, haptics, confetti, toasts, sheets.
import { S, tg } from './game.js';

export const $ = (sel, root = document) => root.querySelector(sel);
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const fmt = n => Math.round(n).toLocaleString('uk-UA').replace(/ /g, ' ');

/* ---------- 12×12 pixel icons: # solid, o soft ---------- */
const ICONS = {
  home: '.....##.....|....####....|...######...|..########..|.##########.|############|..########..|..########..|..###..###..|..###..###..|..###..###..|............',
  sword: '.........###|........####|.......####.|......####..|.....####...|.#..####....|.######.....|..####......|..#####.....|.###.##.....|###.........|##..........',
  dumbbell: '............|............|.##......##.|.##......##.|####....####|############|############|####....####|.##......##.|.##......##.|............|............',
  shirt: '............|..##....##..|.####oo####.|############|############|##.######.##|...######...|...######...|...######...|...######...|...######...|............',
  trophy: '.##########.|###.####.###|#.#.####.#.#|#.#.####.#.#|###.####.###|.##.####.##.|....####....|.....##.....|.....##.....|....####....|...######...|...######...',
  coin: '....####....|..########..|.###oooo###.|.##oo##oo##.|##oo####oo##|##oo##oooo##|##oo##oooo##|##oo####oo##|.##oo##oo##.|.###oooo###.|..########..|....####....',
  flame: '.....#......|.....##.....|....###.....|....####.#..|...#####.##.|..######.##.|.###########|.####oo#####|.###oooo###.|.###oooo###.|..##oooo##..|...######...',
  bolt: '......###...|.....###....|....###.....|...###......|..########..|..########..|......###...|.....###....|....###.....|...###......|..##........|.#..........',
  check: '............|..........##|.........###|........###.|.......###..|##....###...|###..###....|.######.....|..####......|...##.......|............|............',
  plus: '............|.....##.....|.....##.....|.....##.....|.....##.....|.##########.|.##########.|.....##.....|.....##.....|.....##.....|.....##.....|............',
  lock: '...######...|..##....##..|..##....##..|..##....##..|.##########.|.##########.|.####..####.|.####..####.|.#####.####.|.##########.|.##########.|............',
  star: '.....##.....|.....##.....|....####....|############|.##########.|..########..|...######...|..########..|..###..###..|.###....###.|.##......##.|............',
  heart: '............|.###...###..|#####.#####.|###########.|###########.|###########.|.#########..|..#######...|...#####....|....###.....|.....#......|............',
  book: '............|.####..####.|#oooo##oooo#|#oooo##oooo#|#oooo##oooo#|#oooo##oooo#|#oooo##oooo#|#oooo##oooo#|############|.####..####.|............|............',
  target: '...######...|..#......#..|.#..####..#.|#..#....#..#|#.#..##..#.#|#.#.####.#.#|#.#.####.#.#|#.#..##..#.#|#..#....#..#|.#..####..#.|..#......#..|...######...',
  chest: '............|.##########.|#oooo##oooo#|#oooo##oooo#|############|#####oo#####|#oooo##oooo#|#oooooooooo#|#oooooooooo#|############|............|............',
  trash: '....####....|.##########.|............|..########..|..#.#..#.#..|..#.#..#.#..|..#.#..#.#..|..#.#..#.#..|..#.#..#.#..|..########..|...######...|............',
  x: '............|.##......##.|.###....###.|..###..###..|...######...|....####....|....####....|...######...|..###..###..|.###....###.|.##......##.|............',
  clock: '...######...|..#......#..|.#...##...#.|#....##....#|#....##....#|#....####..#|#....####..#|#..........#|#..........#|.#........#.|..#......#..|...######...',
  crown: '............|............|#....##....#|##..####..##|###.####.###|############|############|############|.##########.|.##########.|............|............',
  skull: '..########..|.##########.|############|##..####..##|##..####..##|############|#####..#####|.##########.|..#.#..#.#..|..#.#..#.#..|..########..|............',
  gear: '....####....|.##.####.##.|.##########.|..###..###..|###......###|###......###|###......###|###......###|..###..###..|.##########.|.##.####.##.|....####....',
  moon: '....#####...|..####......|.####.......|.###........|###.........|###.........|###.........|###........#|.###......##|.#####..###.|..########..|....####....',
  sun: '.....##.....|.#...##...#.|..#......#..|....####....|...######...|##.######.##|##.######.##|...######...|....####....|..#......#..|.#...##...#.|.....##.....',
  medal: '.##......##.|.###....###.|..###..###..|...######...|....####....|...######...|..########..|..###oo###..|..###oo###..|..########..|...######...|............',
  bag: '....####....|...#....#...|..#......#..|.##########.|.##########.|.##########.|.##########.|.##########.|.##########.|.##########.|.##########.|............',
  play: '............|..##........|..####......|..######....|..########..|..##########|..##########|..########..|..######....|..####......|..##........|............',
  more: '............|............|............|............|............|.##.##..##.#|.##.##..##.#|............|............|............|............|............',
  back: '............|.....##.....|....##......|...##.......|..##........|.##########.|.##########.|..##........|...##.......|....##......|.....##.....|............',
  user: '....####....|...######...|...######...|...######...|....####....|............|..########..|.##########.|############|############|############|............',
};
Object.assign(ICONS, {
  sigma: '............|.##########.|.##########.|..###.....#.|...###......|....###.....|....###.....|...###......|..###.....#.|.##########.|.##########.|............',
  cash: '............|............|############|#oooooooooo#|#ooo####ooo#|#oo##oo##oo#|#oo##oo##oo#|#ooo####ooo#|#oooooooooo#|############|............|............',
  brief: '............|....####....|...#....#...|.##########.|############|############|#####oo#####|############|############|.##########.|............|............',
  chart: '............|.........##.|.........##.|......##.##.|......##.##.|...##.##.##.|...##.##.##.|##.##.##.##.|##.##.##.##.|##.##.##.##.|############|............',
  minus: '............|............|............|............|............|.##########.|.##########.|............|............|............|............|............',
  del: '............|............|...#########|..##########|.###.##.####|#####..#####|#####..#####|.###.##.####|..##########|...#########|............|............',
  stop: '............|............|..########..|..########..|..########..|..########..|..########..|..########..|..########..|..########..|............|............',
});
ICONS.more = '............|............|............|............|............|##..##..##..|##..##..##..|............|............|............|............|............';

const pathCache = {};
function iconPaths(name) {
  if (pathCache[name]) return pathCache[name];
  const rows = (ICONS[name] || ICONS.star).split('|'); let a = '', b = '';
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length;) {
      const ch = row[x];
      if (ch === '.') { x++; continue; }
      let n = 1; while (row[x + n] === ch) n++;
      const p = `M${x} ${y}h${n}v1h-${n}z`;
      if (ch === '#') a += p; else b += p;
      x += n;
    }
  });
  return (pathCache[name] = [a, b]);
}
export function icon(name, cls = '') {
  const [a, b] = iconPaths(name);
  return `<svg class="ico ${cls}" viewBox="0 0 12 12" shape-rendering="crispEdges" aria-hidden="true"><path d="${a}"/>${b ? `<path d="${b}" opacity=".42"/>` : ''}</svg>`;
}

/* ---------- haptics ---------- */
export function buzz(kind = 'light') {
  if (!S.settings.haptics) return;
  try {
    if (tg?.HapticFeedback) {
      if (['success', 'warning', 'error'].includes(kind)) tg.HapticFeedback.notificationOccurred(kind);
      else tg.HapticFeedback.impactOccurred(kind);
    } else navigator.vibrate?.(kind === 'heavy' || kind === 'success' ? [18, 40, 24] : 10);
  } catch { /* ignore */ }
}

/* ---------- chiptune sfx ---------- */
let ac = null;
function tone(freq, t0, dur, type = 'square', vol = 0.06) {
  const o = ac.createOscillator(), g = ac.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, ac.currentTime + t0);
  g.gain.setValueAtTime(vol, ac.currentTime + t0);
  g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + t0 + dur);
  o.connect(g).connect(ac.destination); o.start(ac.currentTime + t0); o.stop(ac.currentTime + t0 + dur + 0.02);
}
const SEQ = {
  tap: [[660, 0, 0.05]],
  done: [[660, 0, 0.07], [990, 0.07, 0.12]],
  undo: [[440, 0, 0.07], [330, 0.07, 0.1]],
  coin: [[988, 0, 0.06], [1319, 0.06, 0.18]],
  buy: [[523, 0, 0.07], [659, 0.07, 0.07], [784, 0.14, 0.07], [1047, 0.21, 0.2]],
  err: [[160, 0, 0.14, 'sawtooth']],
  ach: [[784, 0, 0.09], [988, 0.09, 0.09], [1175, 0.18, 0.09], [1568, 0.27, 0.28]],
  level: [[523, 0, 0.1], [659, 0.1, 0.1], [784, 0.2, 0.1], [1047, 0.3, 0.12], [784, 0.42, 0.08], [1047, 0.5, 0.4]],
  pr: [[880, 0, 0.08], [1109, 0.08, 0.08], [1319, 0.16, 0.25]],
  rest: [[880, 0, 0.12], [880, 0.2, 0.12], [1319, 0.4, 0.3]],
};
export function sfx(name) {
  if (!S.settings.sound) return;
  try {
    ac ||= new (window.AudioContext || window.webkitAudioContext)();
    if (ac.state === 'suspended') ac.resume();
    for (const [f, t, d, type] of SEQ[name] || SEQ.tap) tone(f, t, d, type);
  } catch { /* audio unavailable */ }
}

/* ---------- confetti (pixel squares) ---------- */
const fxCv = $('#fx'), fxC = fxCv.getContext('2d');
let bits = [], fxOn = false;
const COLORS = ['#ffd257', '#ff4d5a', '#3fe0c0', '#7ecbff', '#c78bff', '#f4f4f5', '#c6ff4a'];
function fxLoop() {
  const w = fxCv.width = innerWidth, h = fxCv.height = innerHeight;
  fxC.clearRect(0, 0, w, h);
  for (const b of bits) {
    b.vy += 0.32; b.x += b.vx; b.y += b.vy; b.vx *= 0.985; b.l++;
    const s = b.s * (b.l % 12 < 6 ? 1 : 0.55);
    fxC.fillStyle = b.c; fxC.fillRect(Math.round(b.x / 3) * 3, Math.round(b.y / 3) * 3, b.s, Math.max(2, s));
  }
  bits = bits.filter(b => b.y < h + 20 && b.l < 220);
  if (bits.length) requestAnimationFrame(fxLoop); else { fxOn = false; fxC.clearRect(0, 0, w, h); }
}
export function confetti(x = innerWidth / 2, y = innerHeight / 3, n = 26, power = 7) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, v = power * (0.35 + Math.random());
    bits.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - power * 0.7, s: 3 + Math.floor(Math.random() * 3) * 3, c: COLORS[i % COLORS.length], l: 0 });
  }
  if (!fxOn) { fxOn = true; requestAnimationFrame(fxLoop); }
}
export function rain(n = 120) {
  for (let i = 0; i < n; i++) bits.push({ x: Math.random() * innerWidth, y: -20 - Math.random() * 300, vx: (Math.random() - 0.5) * 2, vy: 1 + Math.random() * 3, s: 3 + Math.floor(Math.random() * 3) * 3, c: COLORS[i % COLORS.length], l: 0 });
  if (!fxOn) { fxOn = true; requestAnimationFrame(fxLoop); }
}

/* ---------- floating "+25 XP" ---------- */
export function floatText(text, x, y, cls = '') {
  const el = document.createElement('div');
  el.className = 'float ' + cls; el.textContent = text;
  el.style.left = Math.max(40, Math.min(innerWidth - 40, x)) + 'px'; el.style.top = y + 'px';
  document.body.appendChild(el); setTimeout(() => el.remove(), 1100);
}

/* ---------- toasts ---------- */
export function toast(html, cls = '', ms = 2600) {
  const el = document.createElement('div');
  el.className = 'toast ' + cls; el.innerHTML = html;
  const box = $('#toasts');
  while (box.children.length >= 3) box.firstChild.remove(); // never bury the screen in toasts
  box.appendChild(el);
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 260); }, ms);
}

/* ---------- bottom sheet ---------- */
const sheetEl = $('#sheet');
let backBound = false;
function tgBack(show) {
  const bb = tg?.BackButton; if (!bb) return;
  try { if (!backBound) { bb.onClick(() => closeSheet()); backBound = true; } show ? bb.show() : bb.hide(); } catch { /* older clients */ }
}
export function openSheet(html) {
  tgBack(true);
  sheetEl.innerHTML = `<div class="sheet-dim" data-act="sheet-close"></div><div class="sheet-body"><div class="sheet-grip"></div>${html}</div>`;
  sheetEl.classList.add('open');
  return $('.sheet-body', sheetEl);
}
export function closeSheet() { tgBack(false); sheetEl.classList.remove('open'); setTimeout(() => { if (!sheetEl.classList.contains('open')) sheetEl.innerHTML = ''; }, 240); }

/* ---------- fullscreen overlay queue (level up, workout summary) ---------- */
const overlayEl = $('#overlay');
const queue = []; let showing = false;
export function overlay(build) { queue.push(build); if (!showing) nextOverlay(); }
export function nextOverlay() {
  const build = queue.shift();
  if (!build) { showing = false; overlayEl.classList.remove('open'); overlayEl.innerHTML = ''; return; }
  showing = true; overlayEl.innerHTML = ''; overlayEl.classList.add('open');
  build(overlayEl);
}
