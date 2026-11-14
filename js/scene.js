// RESPAWN — animated pixel stage: backdrop + aura + character.
import { compose, composePet, paint, SW, SH, FEET, PW, PH } from './sprite.js';

const rnd = i => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

export const AURA = {
  glow: '#ffffff', fire: '#ff9a3c', volt: '#6fe3ff', cosmic: '#b48cff',
  toxic: '#7dff5a', shadow: '#9a5cff', spark: '#ffe27a',
  money: '#4ade80', matrix: '#39ff7a', math: '#8fd3ff',
  hearts: '#ff6b9a', sakura: '#ffb7d0', stars: '#cfe3ff',
};
const HEART = '#.####.#.';
// 3×3 chalk glyphs for the "formulas" aura: + × = π <
const GLYPHS = ['.#.###.#.', '#.#.#.#.#', '###...###', '####.##.#', '..#.#...#'];

/* ---------- backdrops: (R, W, H, FY, t, acc) ---------- */
function stars(R, n, W, H, t, seed = 0) {
  for (let i = 0; i < n; i++) {
    const x = Math.floor(rnd(i + seed) * W), y = Math.floor(rnd(i * 3.3 + seed + 9) * H);
    const tw = (Math.floor(t / 5) + i) % 9;
    if (tw) R(x, y, 1, 1, tw > 6 ? '#ffffff' : i % 5 ? '#aab0d8' : '#ffe9a8');
  }
}
function disc(R, cx, cy, r, col) {
  for (let y = -r; y <= r; y++) { const w = Math.floor(Math.sqrt(r * r - y * y)); R(cx - w, cy + y, w * 2 + 1, 1, col); }
}

export const SCENES = {
  room(R, W, H, FY, t, acc) {
    R(0, 0, W, H, '#1b1b21');
    for (let x = 4; x < W; x += 10) R(x, 0, 1, FY, '#1f1f26');
    // window
    R(8, 12, 32, 40, '#3b3b46'); R(10, 14, 28, 36, '#101730'); R(10, 34, 28, 16, '#18224a');
    stars((x, y, w, h, c) => R(10 + x, 14 + y, w, h, c), 9, 28, 20, t, 5);
    disc(R, 31, 22, 3, '#f1eed2'); R(32, 21, 1, 1, '#cfcbb0');
    for (const [x, w, h] of [[10, 6, 9], [17, 5, 14], [26, 7, 7], [33, 5, 11]]) R(x, 50 - h, w, h, '#0b0f20');
    R(18, 40, 1, 1, '#ffd76a'); R(20, 43, 1, 1, '#ffd76a'); R(35, 44, 1, 1, '#ffd76a'); R(28, 46, 1, 1, '#7fe3ff');
    R(23, 14, 2, 36, '#3b3b46'); R(10, 31, 28, 2, '#3b3b46'); R(6, 52, 36, 3, '#4a4a57'); R(6, 55, 36, 1, '#101014');
    // poster
    R(84, 15, 25, 31, '#d9d4c6'); R(86, 17, 21, 27, '#17171c');
    for (let i = 0; i < 6; i++) R(96 - i, 21 + i, 2 * i + 1, 1, acc);
    R(94, 27, 5, 7, acc); R(89, 37, 15, 1, '#d9d4c6'); R(91, 40, 11, 1, '#77747c');
    R(83, 14, 4, 3, '#e8d9a0'); R(106, 14, 4, 3, '#e8d9a0');
    // sticky notes
    R(68, 30, 6, 6, '#e9d36a'); R(69, 32, 4, 1, '#8a7a2a'); R(60, 38, 6, 6, '#e9896a'); R(61, 40, 3, 1, '#8a3f2a');
    // floor
    R(0, FY - 4, W, 4, '#111116'); R(0, FY - 4, W, 1, '#2c2c34');
    R(0, FY, W, H - FY, '#2a2a31'); R(0, FY, W, 1, '#3d3d48');
    for (let y = FY + 5, k = 0; y < H; y += 5, k++) { R(0, y, W, 1, '#222228'); for (let x = k % 2 ? 14 : 34; x < W; x += 40) R(x, y - 4, 1, 4, '#222228'); }
    // lamp cone
    for (let y = 0; y < H; y++) { const k = y / H; R(Math.floor(W / 2 - 12 - k * 26), y, Math.floor(24 + k * 52), 1, 'rgba(255,244,214,.04)'); }
  },

  gym(R, W, H, FY, t, acc) {
    R(0, 0, W, H, '#17171b');
    for (let y = 0, k = 0; y < FY; y += 6, k++) { R(0, y, W, 1, '#1f1f25'); for (let x = k % 2 ? 0 : 7; x < W; x += 14) R(x, y, 1, 6, '#1f1f25'); }
    // mirror
    R(5, 18, 28, 54, '#4a4a55'); R(7, 20, 24, 50, '#232a33');
    for (let i = 0; i < 16; i++) { R(10 + i, 40 - i, 1, 1, '#3a4452'); R(14 + i, 46 - i, 2, 1, '#313a47'); }
    // neon bolt sign
    const on = t % 47 > 2;
    const bolt = [[5, 0, 3], [4, 1, 3], [3, 2, 3], [2, 3, 6], [5, 4, 3], [4, 5, 3], [3, 6, 2], [2, 7, 2]];
    for (const [x, y, w] of bolt) R(54 + x, 8 + y * 2, w, 2, on ? acc : '#3a3a44');
    if (on) R(50, 6, 16, 20, 'rgba(255,255,255,.035)');
    // rack + barbell
    R(88, 28, 3, FY - 28, '#3f3f4a'); R(108, 28, 3, FY - 28, '#33333d'); R(88, 28, 23, 2, '#4a4a57');
    R(86, 46, 6, 2, '#5a5a66'); R(107, 46, 6, 2, '#5a5a66');
    R(78, 43, 42, 2, '#a5a8b5'); R(78, 44, 42, 1, '#6d7080');
    R(80, 36, 3, 16, '#111115'); R(83, 38, 2, 12, '#b8262f'); R(114, 38, 2, 12, '#8a1c23'); R(116, 36, 3, 16, '#0c0c10');
    // floor
    R(0, FY, W, H - FY, '#0f0f13'); R(0, FY, W, 1, '#2c2c34');
    for (let x = 6; x < W; x += 16) R(x, FY + 1, 1, H - FY, '#18181d');
    R(0, FY + 8, W, 1, '#18181d');
    // dumbbells + plate
    R(8, FY + 5, 3, 6, '#2c2c35'); R(11, FY + 7, 7, 2, '#8e93a8'); R(18, FY + 5, 3, 6, '#22222a');
    R(26, FY + 3, 2, 9, '#b8262f'); R(28, FY + 4, 1, 7, '#8a1c23');
  },

  roof(R, W, H, FY, t) {
    const bands = ['#090b1c', '#0e1230', '#161a46', '#22215c', '#352a70', '#4d3380'];
    const bh = Math.ceil((FY - 4) / bands.length);
    bands.forEach((c, i) => { R(0, i * bh, W, bh, c); if (i) for (let x = i % 2; x < W; x += 2) R(x, i * bh, 1, 1, bands[i - 1]); });
    stars(R, 34, W, FY - 30, t, 2);
    disc(R, 94, 20, 8, 'rgba(255,250,220,.07)'); disc(R, 94, 20, 6, '#f2efd8'); R(91, 18, 2, 2, '#d5d1b6'); R(96, 22, 2, 1, '#d5d1b6');
    // far + near skyline
    for (let i = 0, x = 0; x < W; i++) { const w = 8 + Math.floor(rnd(i + 40) * 9), h = 12 + Math.floor(rnd(i + 70) * 22); R(x, FY - 5 - h, w, h, '#1a1c3e'); x += w + 1; }
    for (let i = 0, x = -3; x < W; i++) {
      const w = 9 + Math.floor(rnd(i + 11) * 10), h = 8 + Math.floor(rnd(i + 23) * 30);
      R(x, FY - 5 - h, w, h, '#0b0c1a');
      for (let wy = FY - 3 - h; wy < FY - 8; wy += 4) for (let wx = x + 2; wx < x + w - 1; wx += 3) {
        const k = rnd(wx * 7.7 + wy * 3.1);
        if (k > 0.62 && (k < 0.97 || Math.floor(t / 14) % 2)) R(wx, wy, 1, 2, k > 0.9 ? '#7fe3ff' : '#ffd76a');
      }
      if (i % 3 === 1) { R(x + 3, FY - 5 - h - 6, 1, 6, '#0b0c1a'); if (Math.floor(t / 8) % 2) R(x + 3, FY - 5 - h - 7, 1, 1, '#ff4d5a'); }
      x += w + 1;
    }
    R(0, FY - 5, W, 5, '#24242d'); R(0, FY - 5, W, 1, '#3a3a47');
    for (let x = 10; x < W; x += 22) R(x, FY - 4, 1, 4, '#191920');
    R(0, FY, W, H - FY, '#15151b'); R(0, FY, W, 1, '#0c0c10');
    for (let i = 0; i < 26; i++) R(Math.floor(rnd(i + 300) * W), FY + 2 + Math.floor(rnd(i + 330) * (H - FY - 3)), 2, 1, '#1d1d25');
  },

  dojo(R, W, H, FY, t) {
    R(0, 0, W, H, '#34261b');
    for (let x = 0; x < W; x += 30) { R(x, 0, 3, FY, '#241910'); R(x + 3, 0, 1, FY, '#3f2f22'); }
    R(0, 6, W, 4, '#241910'); R(0, 10, W, 1, '#170f09');
    for (let x = 6; x < W; x += 30) for (let y = 16; y < FY - 8; y += 12) R(x + 4, y, 16, 1, '#2d2017');
    // scroll with red sun
    R(10, 14, 22, 2, '#170f09'); R(12, 16, 18, 38, '#e9dfc6'); R(10, 54, 22, 2, '#170f09');
    disc(R, 21, 27, 5, '#c8372d'); R(18, 38, 6, 1, '#1c1c22'); R(20, 41, 2, 6, '#1c1c22'); R(17, 44, 8, 1, '#1c1c22');
    // sword rack
    R(84, 26, 2, 16, '#170f09'); R(108, 26, 2, 16, '#170f09');
    R(82, 30, 30, 1, '#cfd3e2'); R(82, 30, 7, 1, '#b8262f'); R(89, 29, 1, 3, '#e2b33c');
    R(82, 38, 30, 1, '#22222a'); R(82, 38, 7, 1, '#3a3a45'); R(89, 37, 1, 3, '#e2b33c');
    // lantern
    const fl = t % 9 < 5;
    R(60, 10, 1, 6, '#170f09'); R(56, 16, 9, 2, '#170f09'); R(56, 18, 9, 10, fl ? '#f0a53a' : '#e8982c'); R(58, 18, 1, 10, '#c97a1c'); R(62, 18, 1, 10, '#c97a1c'); R(56, 28, 9, 2, '#170f09');
    disc(R, 60, 23, 13, 'rgba(255,170,60,.05)'); disc(R, 60, 23, 8, 'rgba(255,170,60,.06)');
    // tatami
    R(0, FY - 3, W, 3, '#170f09');
    R(0, FY, W, H - FY, '#7a6c43'); R(0, FY, W, 1, '#9a8a58');
    for (let x = 0; x < W; x += 40) R(x, FY + 1, 2, H - FY, '#3e3722');
    for (let y = FY + 3; y < H; y += 3) for (let x = (y % 2) * 2; x < W; x += 4) R(x, y, 1, 1, '#6c5f3a');
  },

  retro(R, W, H, FY, t, acc) {
    const hz = FY - 6;
    const sky = ['#0a0318', '#150528', '#240a3d', '#3b0f52', '#5a1463'];
    const bh = Math.ceil(hz / sky.length);
    sky.forEach((c, i) => R(0, i * bh, W, bh, c));
    stars(R, 22, W, hz - 30, t, 8);
    // striped sun
    const cx = W >> 1, r = 26;
    for (let y = -r; y <= 0; y++) {
      const w = Math.floor(Math.sqrt(r * r - y * y)), k = (y + r) / r;
      if (y > -12 && (y + 100) % 4 === 0) continue;
      const col = k < 0.35 ? '#ffe45c' : k < 0.6 ? '#ffb347' : k < 0.8 ? '#ff7a59' : '#ff4f8b';
      R(cx - w, hz + y, w * 2, 1, col);
    }
    // mountains
    for (let x = 0; x < W; x++) { const h = Math.floor(6 + 5 * Math.abs(Math.sin(x * 0.21)) + 4 * Math.abs(Math.sin(x * 0.57 + 1))); if (x < 30 || x > W - 30) R(x, hz - h, 1, h, '#12041f'); }
    // grid floor
    R(0, hz, W, H - hz, '#0b0214'); R(0, hz, W, 1, '#ff4fd8');
    const ph = (t % 8) / 8;
    for (let i = 0; i < 8; i++) { const y = hz + Math.floor(Math.pow((i + ph) / 8, 2.1) * (H - hz)); if (y > hz) R(0, y, W, 1, 'rgba(255,79,216,.55)'); }
    for (let i = -9; i <= 9; i++) for (let y = hz + 1; y < H; y++) { const x = Math.floor(cx + i * 5 * (1 + (y - hz) * 0.22)); if (x >= 0 && x < W) R(x, y, 1, 1, 'rgba(120,220,255,.38)'); }
  },

  space(R, W, H, FY, t) {
    R(0, 0, W, H, '#04040a');
    for (let i = 0; i < 26; i++) { const x = rnd(i + 500) * W, y = rnd(i + 520) * H * 0.8; disc(R, Math.floor(x), Math.floor(y), 5 + Math.floor(rnd(i + 540) * 7), i % 2 ? 'rgba(110,70,220,.035)' : 'rgba(60,120,255,.03)'); }
    stars(R, 70, W, H, t, 3);
    // planet with ring
    disc(R, 24, 26, 14, '#3a2a6a'); disc(R, 22, 24, 11, '#4b3888');
    for (const [y, x, w] of [[19, 13, 16], [24, 11, 22], [30, 14, 20], [35, 18, 12]]) R(x, y, w, 1, '#6a54ae');
    for (let y = -14; y <= 14; y++) { const w = Math.floor(Math.sqrt(196 - y * y)); R(24 + w - 3, 26 + y, 4, 1, 'rgba(0,0,0,.28)'); }
    for (let i = 0; i < 46; i++) { const a = i / 46 * Math.PI * 2, x = Math.round(24 + Math.cos(a) * 22), y = Math.round(27 + Math.sin(a) * 4 + Math.cos(a) * 3); if (Math.sin(a) > -0.1 || Math.abs(Math.cos(a)) > 0.72) R(x, y, 1, 1, '#d8c7ff'); }
    // shooting star
    const s = t % 90; if (s < 10) { R(W - 10 - s * 6, 8 + s * 2, 4, 1, '#ffffff'); R(W - 6 - s * 6, 7 + s * 2, 4, 1, 'rgba(255,255,255,.35)'); }
    // platform
    const fy = FY;
    R(18, fy, W - 36, 5, '#3b4058'); R(18, fy, W - 36, 1, '#6a7196'); R(22, fy + 5, W - 44, 2, '#262a3c'); R(30, fy + 7, W - 60, 2, '#191c2a');
    for (let x = 24, i = 0; x < W - 22; x += 9, i++) R(x, fy + 2, 2, 1, (Math.floor(t / 4) + i) % 5 ? '#35f0ff' : '#e6ffff');
    R((W >> 1) - 2, fy + 9, 4, 3 + (t % 6 < 3 ? 2 : 0), 'rgba(53,240,255,.6)');
  },

  office(R, W, H, FY, t, acc) {
    R(0, 0, W, H, '#191c25');
    // panoramic window with skyline
    R(4, 8, W - 8, 48, '#2b2f3c');
    const sky = ['#0c1022', '#131a38', '#1d2752', '#2c356b'];
    sky.forEach((c, i) => R(6, 10 + i * 11, W - 12, 11, c));
    stars((x, y, w, h, c) => R(6 + x, 10 + y, w, h, c), 14, W - 12, 18, t, 21);
    for (let i = 0, x = 6; x < W - 8; i++) {
      const w = 6 + Math.floor(rnd(i + 91) * 8), h = 8 + Math.floor(rnd(i + 97) * 26);
      R(x, 54 - h, Math.min(w, W - 6 - x), h, '#0a0c18');
      for (let wy = 56 - h; wy < 52; wy += 4) for (let wx = x + 1; wx < x + w - 1 && wx < W - 7; wx += 3) { const k = rnd(wx * 5.1 + wy * 2.3); if (k > 0.6) R(wx, wy, 1, 2, k > 0.92 ? '#7fe3ff' : '#ffd76a'); }
      x += w + 1;
    }
    for (let x = 4; x < W; x += 28) R(x, 8, 2, 48, '#2b2f3c');
    R(4, 54, W - 8, 2, '#3a3f50');
    // ceiling light
    R(30, 0, 60, 2, '#e9ecff'); R(26, 2, 68, 1, 'rgba(233,236,255,.15)');
    // desk with two monitors
    R(74, FY - 14, 44, 3, '#6b5338'); R(74, FY - 14, 44, 1, '#8a6c4a'); R(77, FY - 11, 2, 11, '#3d2f20'); R(113, FY - 11, 2, 11, '#3d2f20');
    R(78, FY - 30, 17, 12, '#0b0b10'); R(79, FY - 29, 15, 10, '#08130f'); R(85, FY - 18, 3, 4, '#2b2f3c');
    const pts = [7, 6, 6, 4, 5, 3, 3, 1]; pts.forEach((p, i) => R(80 + i * 2 - (i > 6 ? 1 : 0), FY - 29 + p + (i === ((t >> 3) % 8) ? -1 : 0), 2, 1, acc));
    R(98, FY - 28, 15, 10, '#0b0b10'); R(99, FY - 27, 13, 8, '#0c1020'); R(104, FY - 18, 3, 4, '#2b2f3c');
    [3, 5, 4, 7, 6].forEach((h, i) => R(100 + i * 2 + (i > 2 ? 1 : 0), FY - 19 - h, 2, h, i === 3 ? '#ffd76a' : '#5aa9ff'));
    R(81, FY - 16, 8, 1, '#c9c9d2'); R(101, FY - 16, 3, 2, '#f1f1f3');
    // plant
    R(8, FY - 8, 8, 8, '#8a4a2a'); R(8, FY - 8, 8, 1, '#b0623a');
    for (const [x, y, h] of [[11, 18, 10], [8, 15, 9], [14, 14, 8], [6, 11, 5], [16, 10, 5]]) R(x, FY - y, 2, h, y % 2 ? '#2f8f4a' : '#3ddc84');
    // carpet
    R(0, FY - 2, W, 2, '#11131a'); R(0, FY, W, H - FY, '#232633'); R(0, FY, W, 1, '#353a4c');
    for (let y = FY + 3; y < H; y += 4) for (let x = (y % 8) ? 2 : 6; x < W; x += 8) R(x, y, 2, 1, '#1c1f2a');
  },

  lab(R, W, H, FY, t) {
    R(0, 0, W, H, '#1a1f1d');
    for (let y = 6; y < FY; y += 12) R(0, y, W, 1, '#1e2422');
    // blackboard
    R(6, 10, 66, 42, '#6b4a2b'); R(8, 12, 62, 38, '#24332b'); R(8, 12, 62, 1, '#1a2620');
    const ch = '#e8efe9', dim = '#9fb3a6';
    R(12, 42, 26, 1, dim); R(14, 18, 1, 26, dim);                       // axes
    for (let x = 0; x < 22; x++) { const y = Math.round(22 - Math.pow((x - 4) / 5.2, 2) * 1.4 * (x > 4 ? 1 : 0.2)); R(15 + x, Math.max(16, y + 18 - (x > 4 ? 0 : 0)), 1, 1, ch); }
    // "E = mc²"-ish chalk marks and a sigma
    R(44, 17, 5, 1, ch); R(44, 17, 1, 7, ch); R(44, 20, 4, 1, ch); R(44, 23, 5, 1, ch);
    R(51, 19, 3, 1, ch); R(51, 22, 3, 1, ch);
    R(56, 20, 1, 4, ch); R(57, 19, 1, 1, ch); R(58, 20, 1, 4, ch); R(59, 19, 1, 1, ch); R(60, 20, 1, 4, ch);
    R(63, 19, 3, 1, ch); R(63, 23, 3, 1, ch); R(63, 19, 1, 3, ch); R(66, 16, 2, 1, dim); R(67, 17, 1, 1, dim); R(66, 18, 2, 1, dim);
    R(44, 30, 7, 1, ch); R(44, 30, 1, 1, ch); R(45, 31, 1, 1, ch); R(46, 32, 1, 1, ch); R(47, 33, 1, 1, ch); R(46, 34, 1, 1, ch); R(45, 35, 1, 1, ch); R(44, 36, 7, 1, ch);
    R(54, 32, 4, 1, dim); R(54, 35, 6, 1, dim); R(62, 33, 5, 1, dim); R(54, 40, 12, 1, dim); R(56, 44, 9, 1, dim);
    R(6, 52, 66, 2, '#4a3520'); R(20, 51, 5, 1, '#f1f1f3'); R(30, 51, 3, 1, '#ffd76a');
    // workbench: oscilloscope + soldering station
    R(78, FY - 13, 40, 3, '#6d717d'); R(78, FY - 13, 40, 1, '#8e93a8'); R(80, FY - 10, 2, 10, '#3d404a'); R(114, FY - 10, 2, 10, '#3d404a');
    R(82, FY - 28, 20, 15, '#2b2f3a'); R(84, FY - 26, 13, 10, '#06140c'); R(99, FY - 25, 2, 2, '#ff7a1a'); R(99, FY - 21, 2, 2, '#8e93a8'); R(99, FY - 17, 2, 2, '#8e93a8');
    for (let x = 0; x < 13; x++) R(84 + x, Math.round(FY - 21 + Math.sin((x + t) / 2) * 3.4), 1, 1, '#39ff7a');
    R(106, FY - 17, 7, 4, '#3d404a'); R(108, FY - 22, 1, 5, '#c9c9d2'); R(108, FY - 23, 1, 1, '#ff7a1a');
    if (t % 12 < 8) R(108 + ((t >> 2) % 2), FY - 26 - (t % 4), 1, 1, 'rgba(255,255,255,.35)');
    // shelf with parts
    R(78, 14, 38, 2, '#4a3520'); for (let i = 0; i < 6; i++) R(80 + i * 6, 8, 4, 6, ['#d8323c', '#4a78f5', '#f2c21a', '#3ddc84', '#aeb3c2', '#b77bff'][i]);
    // tiles
    R(0, FY - 2, W, 2, '#111514'); R(0, FY, W, H - FY, '#2a302d'); R(0, FY, W, 1, '#3b443f');
    for (let y = FY + 1, k = 0; y < H; y += 5, k++) for (let x = (k % 2) * 10; x < W; x += 20) R(x, y, 10, 5, '#252b28');
  },

  // ---- 2.0 ----
  cafe(R, W, H, FY, t, acc) {
    R(0, 0, W, H, '#2a1d17');
    for (let y = 4, k = 0; y < FY - 22; y += 8, k++) { R(0, y, W, 1, '#30221b'); for (let x = k % 2 ? 6 : 0; x < W; x += 12) R(x, y, 1, 8, '#30221b'); }
    R(0, FY - 22, W, 22, '#4a3326'); R(0, FY - 22, W, 1, '#6b4a33'); for (let x = 3; x < W; x += 8) R(x, FY - 20, 1, 18, '#3d2a1f');
    // chalkboard menu
    R(6, 12, 30, 26, '#6b4a2b'); R(8, 14, 26, 22, '#1f2a24'); R(11, 17, 13, 1, '#e8efe9');
    for (const [y, w] of [[21, 15], [25, 12], [29, 17], [33, 10]]) { R(11, y, w, 1, '#9fb3a6'); R(30, y, 2, 1, acc); }
    // window
    R(84, 10, 30, 30, '#5a3f2c'); R(86, 12, 26, 26, '#1d2a44'); stars((x, y, w, h, c) => R(86 + x, 12 + y, w, h, c), 7, 26, 12, t, 30);
    R(98, 12, 2, 26, '#5a3f2c'); R(86, 24, 26, 2, '#5a3f2c');
    // pendant lamps
    for (const x of [46, 74]) { R(x, 0, 1, 10, '#17110d'); R(x - 3, 10, 7, 3, '#d9a520'); R(x - 2, 13, 5, 1, '#fff2b8'); disc(R, x, 16, 9, 'rgba(255,214,120,.05)'); }
    // counter + espresso machine
    R(88, FY - 30, 32, 30, '#3a2a20'); R(88, FY - 31, 32, 2, '#c9b08a'); R(88, FY - 29, 32, 1, '#8a6a4a'); for (let x = 92; x < W; x += 9) R(x, FY - 26, 1, 24, '#30221b');
    R(96, FY - 44, 16, 13, '#aeb3c2'); R(96, FY - 44, 16, 2, '#d9dce8'); R(99, FY - 40, 4, 4, '#17171d'); R(105, FY - 38, 4, 2, '#3a3a45'); R(100, FY - 35, 2, 3, '#f1f1f3');
    if (t % 20 < 12) R(101, FY - 37 - (t % 4), 1, 1, 'rgba(255,255,255,.45)');
    R(90, FY - 34, 3, 3, '#f1f1f3'); R(115, FY - 34, 3, 3, '#f1f1f3');
    // little table with a cup
    R(8, FY - 16, 22, 2, '#6b4a33'); R(18, FY - 14, 2, 14, '#3d2a1f'); R(13, FY - 1, 12, 1, '#3d2a1f'); R(12, FY - 20, 4, 4, '#f1f1f3'); R(16, FY - 19, 1, 2, '#f1f1f3');
    // checker floor
    R(0, FY, W, H - FY, '#2b2b31'); R(0, FY, W, 1, '#4a4a55');
    for (let y = FY + 1, k = 0; y < H; y += 6, k++) for (let x = (k % 2) * 8; x < W; x += 16) R(x, y, 8, 6, '#3b3b44');
  },

  park(R, W, H, FY, t) {
    const sky = ['#2a3a6a', '#3d4a80', '#6a5a8f', '#a86a86', '#e08a72', '#f2b36a'], bh = Math.ceil((FY - 10) / sky.length);
    sky.forEach((c, i) => R(0, i * bh, W, bh, c));
    disc(R, 30, FY - 30, 10, 'rgba(255,240,200,.18)'); disc(R, 30, FY - 30, 6, '#ffe2a0');
    const cl = Math.floor((t / 3) % (W + 40)) - 20; R(cl, 14, 18, 3, 'rgba(255,255,255,.3)'); R(cl + 4, 12, 9, 2, 'rgba(255,255,255,.3)');
    for (let x = 0; x < W; x++) { const h = Math.floor(8 + 5 * Math.sin(x * 0.07) + 3 * Math.sin(x * 0.19)); R(x, FY - 10 - h, 1, h, '#3b5a4a'); }
    const tree = (x, s) => { R(x - 1, FY - 10 - s, 3, s + 10, '#3a2a20'); disc(R, x, FY - 14 - s, s, '#2f6a45'); disc(R, x - 3, FY - 12 - s, s - 3, '#3d8a55'); R(x - 2, FY - 18 - s, 2, 2, '#5aa86a'); };
    tree(12, 12); tree(106, 14); tree(90, 9);
    R(28, FY - 34, 2, 34, '#1c1c22'); R(25, FY - 38, 8, 4, '#1c1c22'); R(26, FY - 37, 6, 2, t % 30 < 28 ? '#ffe27a' : '#b89a3a'); disc(R, 29, FY - 36, 8, 'rgba(255,226,122,.07)');
    R(0, FY - 10, W, 10, '#3d7a4a'); for (let x = 1; x < W; x += 3) R(x, FY - 11 - (x % 2), 1, 2, '#4f9a5a');
    R(70, FY - 15, 22, 2, '#8a5a2b'); R(70, FY - 10, 22, 2, '#a06a33'); R(72, FY - 8, 2, 8, '#3a2a20'); R(88, FY - 8, 2, 8, '#3a2a20');
    R(0, FY, W, H - FY, '#3d7a4a'); R((W >> 1) - 22, FY, 44, H - FY, '#b8a07a'); R((W >> 1) - 22, FY, 44, 1, '#d8c29a');
    for (let i = 0; i < 18; i++) { const x = Math.floor(rnd(i + 900) * W); if (Math.abs(x - (W >> 1)) > 23) R(x, FY + 2 + Math.floor(rnd(i + 930) * (H - FY - 3)), 1, 1, rnd(i + 960) > 0.5 ? '#ffd84a' : '#ff8ab0'); }
  },

  yoga(R, W, H, FY, t) {
    R(0, 0, W, H, '#2c2731');
    // arched window at sunrise
    R(38, 22, 44, 38, '#4a4252'); disc(R, 60, 24, 22, '#4a4252');
    const g = ['#33335e', '#5a4478', '#9a5a80', '#d8847a', '#f2b884'];
    for (let i = 0; i < 5; i++) R(40, 24 + i * 7, 40, 7, g[i]);
    for (let y = -20; y < 0; y++) { const w = Math.floor(Math.sqrt(400 - y * y)); R(60 - w, 24 + y, w * 2, 1, g[0]); }
    disc(R, 60, 56, 7, '#ffe2b0'); R(40, 58, 40, 2, '#4a4252'); R(59, 4, 2, 54, '#4a4252'); R(40, 40, 40, 2, '#4a4252');
    // plants
    R(6, FY - 10, 10, 10, '#b0623a'); R(6, FY - 10, 10, 1, '#d07a4a');
    for (const [x, h, c] of [[8, 14, '#3d8a55'], [11, 20, '#2f6a45'], [14, 12, '#4f9a5a'], [10, 9, '#5aa86a']]) R(x, FY - 10 - h, 2, h, c);
    disc(R, 108, FY - 26, 9, '#2f6a45'); disc(R, 104, FY - 30, 6, '#3d8a55'); R(107, FY - 18, 2, 8, '#3a2a20'); R(101, FY - 10, 14, 10, '#d8c9a3');
    // rolled mats + candles
    R(88, FY - 24, 5, 24, '#8a5cd6'); R(88, FY - 25, 5, 2, '#b48cff'); R(94, FY - 20, 5, 20, '#22c4a4'); R(94, FY - 21, 5, 2, '#7ee8c4');
    for (const x of [22, 27]) { R(x, FY - 6, 3, 6, '#f2ead8'); R(x + 1, FY - 8 - (t % 6 < 3 ? 0 : 1), 1, 2, '#ffb347'); disc(R, x + 1, FY - 8, 4, 'rgba(255,180,80,.06)'); }
    // warm floor + light from the window
    R(0, FY, W, H - FY, '#6b4f3a'); R(0, FY, W, 1, '#8a6a4a');
    for (let y = FY + 4, k = 0; y < H; y += 4, k++) { R(0, y, W, 1, '#5a4130'); for (let x = k % 2 ? 10 : 30; x < W; x += 40) R(x, y - 3, 1, 3, '#5a4130'); }
    for (let y = FY + 1; y < H; y++) R(42 - (y - FY), y, 36 + (y - FY) * 2, 1, 'rgba(255,200,150,.05)');
  },

  library(R, W, H, FY, t) {
    R(0, 0, W, H, '#1f1915');
    const cols = ['#8a2a2a', '#2a4a8a', '#2a6a4a', '#8a6a2a', '#5a2a6a', '#c9b08a', '#3a3a45'];
    const shelf = (x0, w) => {
      R(x0, 6, w, FY - 6, '#3a2618'); R(x0, 6, w, 2, '#5a3a24');
      for (let sy = 10; sy < FY - 10; sy += 16) {
        R(x0 + 2, sy + 13, w - 4, 2, '#5a3a24');
        for (let x = x0 + 3; x < x0 + w - 5;) {
          const bw = 2 + Math.floor(rnd(x * 1.3 + sy) * 3), bh = 9 + Math.floor(rnd(x * 2.1 + sy) * 4);
          R(x, sy + 13 - bh, bw, bh, cols[Math.floor(rnd(x + sy * 7) * cols.length)]); R(x, sy + 15 - bh, bw, 1, 'rgba(255,230,160,.3)');
          x += bw + (rnd(x + sy) > 0.85 ? 2 : 0);
        }
      }
    };
    shelf(2, 34); shelf(84, 34);
    R(44, 8, 32, 34, '#3a2618'); disc(R, 60, 18, 14, '#3a2618'); R(47, 18, 26, 22, '#162040');
    for (let y = -12; y < 0; y++) { const w = Math.floor(Math.sqrt(144 - y * y)); R(60 - w, 18 + y, w * 2, 1, '#162040'); }
    stars((x, y, w, h, c) => R(48 + x, 8 + y, w, h, c), 7, 24, 30, t, 40); R(59, 6, 2, 34, '#3a2618'); R(47, 28, 26, 2, '#3a2618');
    disc(R, 66, 14, 2, '#f1eed2');
    // book stacks on the floor + a reading lamp glow
    for (let i = 0; i < 3; i++) R(36 - i, FY - 4 - i * 3, 9 - i * 2 + i, 3, cols[i]);
    for (let i = 0; i < 4; i++) R(78 + i, FY - 4 - i * 3, 8 - i * 2 + i, 3, cols[(i + 3) % cols.length]);
    disc(R, 60, 10, 18, 'rgba(255,220,150,.03)');
    // rug + floor
    R(0, FY, W, H - FY, '#2a2019'); R(0, FY, W, 1, '#4a3828');
    R(22, FY + 3, 76, H - FY - 5, '#5a2a2a'); R(24, FY + 5, 72, H - FY - 9, '#7a3a34'); for (let x = 27; x < 94; x += 6) { R(x, FY + 7, 2, 1, '#c9a13a'); R(x + 3, H - 6, 2, 1, '#c9a13a'); }
  },

  vault(R, W, H, FY, t) {
    R(0, 0, W, H, '#20232a');
    for (let x = 0; x < W; x += 24) { R(x, 0, 1, FY, '#2a2e37'); for (let y = 6; y < FY; y += 18) { R(x + 3, y, 1, 1, '#3b4050'); R(x + 20, y, 1, 1, '#3b4050'); } }
    for (let y = 0; y < FY; y += 18) R(0, y, W, 1, '#191b21');
    // round door
    const cx = W >> 1, cy = 42;
    disc(R, cx, cy, 34, '#14161b'); disc(R, cx, cy, 32, '#444a5a'); disc(R, cx, cy, 28, '#353a48'); disc(R, cx, cy, 26, '#3f4555');
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; R(Math.round(cx + Math.cos(a) * 29) - 1, Math.round(cy + Math.sin(a) * 29) - 1, 2, 2, '#8e93a8'); }
    const sp = t / 40;
    for (let i = 0; i < 3; i++) { const a = sp + (i * Math.PI) / 3; for (let r = -12; r <= 12; r++) R(Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r), 1, 1, '#aeb3c2'); }
    disc(R, cx, cy, 5, '#aeb3c2'); disc(R, cx, cy, 3, '#6d717d'); R(cx - 1, cy - 1, 2, 2, '#e2b33c');
    // floor
    R(0, FY - 3, W, 3, '#111318'); R(0, FY, W, H - FY, '#2b2f3a'); R(0, FY, W, 1, '#444a5a');
    for (let x = 12; x < W; x += 24) R(x, FY + 1, 1, H - FY, '#232630');
    // gold bars + coins
    const bar = (x, y) => { R(x, y, 9, 4, '#e2b33c'); R(x, y, 9, 1, '#ffe27a'); R(x + 7, y + 1, 2, 3, '#a8801e'); R(x, y + 3, 9, 1, '#a8801e'); };
    for (const [x0, n] of [[3, 3], [W - 33, 3]]) for (let row = 0; row < n; row++) for (let i = 0; i < n - row; i++) bar(x0 + row * 5 + i * 10, FY - 4 - row * 4);
    for (let i = 0; i < 9; i++) { const x = 6 + Math.floor(rnd(i + 700) * (W - 12)), y = FY + 3 + Math.floor(rnd(i + 720) * (H - FY - 6)); R(x, y, 3, 2, '#e2b33c'); R(x, y, 2, 1, '#ffe27a'); }
    const tw = (t >> 2) % 14, sx = [8, 26, W - 28, W - 10, 16, W - 18][tw % 6]; if (tw < 6) { R(sx, FY - 10, 1, 3, '#ffffff'); R(sx - 1, FY - 9, 3, 1, '#ffffff'); }
  },
};

/* ---------- stage ---------- */
const stages = new Set();
let lastTick = 0;
function loop(ts) {
  if (ts - lastTick > 82) {
    lastTick = ts;
    for (const s of stages) if (s.cv.isConnected) s.tick(); // detached stages (other tabs) just pause
  }
  requestAnimationFrame(loop);
}
if (typeof requestAnimationFrame !== 'undefined') requestAnimationFrame(loop);

export class Stage {
  constructor(canvas, { w = 120, h = 110, floor = 16, bare = false } = {}) {
    this.cv = canvas; canvas.width = w; canvas.height = h;
    this.c = canvas.getContext('2d'); this.c.imageSmoothingEnabled = false;
    this.W = w; this.H = h; this.FY = h - floor; this.bare = bare;
    this.t = Math.floor(Math.random() * 40); this.parts = []; this.hop = 0;
    this.cache = new Map(); this.look = null; this.scene = 'room'; this.aura = null; this.acc = '#f4f4f5';
    stages.add(this);
  }
  set(look, scene, aura, acc, pet) {
    const key = JSON.stringify([look, scene, aura, acc, pet]);
    if (key === this.key) return;
    this.key = key;
    this.aura = AURA[aura] ? aura : null;
    this.look = { ...look, rim: this.aura ? AURA[this.aura] + 'b0' : null };
    this.scene = SCENES[scene] ? scene : 'room'; this.acc = acc || this.acc;
    this.pet = pet || null; this.petCache = {};
    this.cache.clear(); this.parts = [];
    if (this.c) this.draw();
  }
  jump() { if (!this.hop) this.hop = 1; }
  sprite(bob, blink) {
    const k = (bob ? 1 : 0) + (blink ? 2 : 0);
    let cv = this.cache.get(k);
    if (!cv) {
      cv = document.createElement('canvas'); cv.width = SW; cv.height = SH;
      paint(cv.getContext('2d'), compose(this.look, { bob, blink }));
      this.cache.set(k, cv);
    }
    return cv;
  }
  petSprite(f) {
    if (this.petCache[f] === undefined) {
      const buf = composePet(this.pet, f);
      if (!buf) return (this.petCache[f] = null);
      const cv = document.createElement('canvas'); cv.width = PW; cv.height = PH;
      paint(cv.getContext('2d'), buf); this.petCache[f] = cv;
    }
    return this.petCache[f];
  }
  tick() { this.t++; if (this.hop) this.hop = this.hop >= 7 ? 0 : this.hop + 1; this.draw(); }

  draw() {
    if (!this.look) return;
    const { c, W, H, FY, t } = this;
    const R = (x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
    c.clearRect(0, 0, W, H);
    if (!this.bare) SCENES[this.scene](R, W, H, FY, t, this.acc);
    const lift = [0, 3, 6, 8, 8, 6, 3, 1][this.hop] || 0;
    const ox = (W - SW) >> 1, oy = FY + 4 - FEET - lift;
    const cx = W >> 1, col = this.aura ? AURA[this.aura] : null;
    // ground shadow
    const sw = 15 - Math.floor(lift / 2);
    R(cx - sw, FY + 4, sw * 2, 2, 'rgba(0,0,0,.35)'); R(cx - sw + 3, FY + 6, sw * 2 - 6, 1, 'rgba(0,0,0,.25)');
    this.fx(R, cx, oy, col, false);
    const bob = Math.floor(t / 7) % 2 === 1 && !this.hop, blink = t % 46 < 2;
    c.drawImage(this.sprite(bob, blink), ox, oy);
    if (this.pet) {
      const img = this.petSprite(Math.floor(t / 5) % 2);
      if (img) {
        const fly = this.pet === 'drone', px = cx - 36 - (W > 110 ? 2 : -6);
        const py = fly ? oy + 10 + Math.round(Math.sin(t / 6) * 2) : FY + 5 - PH;
        if (!fly) R(px + 3, FY + 5, 12, 1, 'rgba(0,0,0,.3)');
        c.drawImage(img, px, py);
      }
    }
    this.fx(R, cx, oy, col, true);
  }

  // aura particles; front=false draws behind the character
  fx(R, cx, oy, col, front) {
    const a = this.aura, t = this.t, P = this.parts, feet = oy + FEET;
    if (!a) return;
    if (!front) {
      if (a === 'glow' || a === 'spark' || a === 'money' || a === 'math' || a === 'hearts' || a === 'stars') {
        const r = 30 + (Math.floor(t / 6) % 2) * 2;
        for (let i = 0; i < 3; i++) disc(R, cx, oy + 36, r - i * 7, a === 'glow' ? 'rgba(255,255,255,.045)' : a === 'money' ? 'rgba(74,222,128,.045)' : a === 'math' ? 'rgba(143,211,255,.04)' : a === 'hearts' ? 'rgba(255,107,154,.045)' : a === 'stars' ? 'rgba(150,180,255,.04)' : 'rgba(255,226,122,.05)');
      }
      if (a === 'hearts' && t % 3 === 0) P.push({ x: cx - 24 + Math.random() * 48, y: feet - 8 - Math.random() * 24, vx: 0, vy: -0.5 - Math.random() * 0.4, l: 0, m: 26 + Math.random() * 18, f: Math.random() < 0.4, s: Math.random() * 6 });
      if (a === 'sakura' && t % 2 === 0) P.push({ x: cx - 40 + Math.random() * 64, y: oy - 8 - Math.random() * 6, vx: 0.3 + Math.random() * 0.3, vy: 0.55 + Math.random() * 0.45, l: 0, m: 140, f: Math.random() < 0.4, s: Math.random() * 6, k: Math.random() < 0.5 });
      if (a === 'stars') {
        if (t % 7 === 0) P.push({ x: cx - 44 + Math.random() * 40, y: oy - 8 + Math.random() * 24, vx: 1.9, vy: 1.2, l: 0, m: 26, f: Math.random() < 0.5, tail: true });
        if (t % 3 === 0) P.push({ x: cx - 26 + Math.random() * 52, y: oy + 2 + Math.random() * 60, vx: 0, vy: 0, l: 0, m: 8 + Math.random() * 6, f: Math.random() < 0.5 });
      }
      // spawn
      if (a === 'fire') for (let i = 0; i < 3; i++) P.push({ x: cx - 16 + Math.random() * 32, y: feet - Math.random() * 6, vx: (Math.random() - 0.5) * 0.6, vy: -1.2 - Math.random() * 1.6, l: 0, m: 10 + Math.random() * 12, f: Math.random() < 0.25 });
      if (a === 'toxic' && t % 2 === 0) P.push({ x: cx - 20 + Math.random() * 40, y: feet, vx: 0, vy: -0.5 - Math.random() * 0.7, l: 0, m: 30 + Math.random() * 30, f: Math.random() < 0.4, s: Math.random() * 6 });
      if (a === 'shadow') for (let i = 0; i < 2; i++) P.push({ x: cx - 18 + Math.random() * 36, y: feet - Math.random() * 10, vx: (Math.random() - 0.5) * 0.4, vy: -0.6 - Math.random() * 0.8, l: 0, m: 22 + Math.random() * 16, f: Math.random() < 0.2 });
      if (a === 'cosmic' && t % 2 === 0) P.push({ x: cx - 22 + Math.random() * 44, y: feet - Math.random() * 50, vx: 0, vy: -0.4, l: 0, m: 16 + Math.random() * 10, f: Math.random() < 0.5 });
      if (a === 'spark' && t % 2 === 0) P.push({ x: cx - 26 + Math.random() * 52, y: oy + 4 + Math.random() * 58, vx: 0, vy: -0.15, l: 0, m: 9 + Math.random() * 6, f: Math.random() < 0.5 });
      if (a === 'money' && t % 2 === 0) P.push({ x: cx - 30 + Math.random() * 60, y: oy - 6, vx: 0, vy: 1 + Math.random() * 1.4, l: 0, m: 60, f: Math.random() < 0.4, s: Math.random() * 6, k: Math.random() < 0.3 });
      if (a === 'matrix') P.push({ x: Math.round(cx - 30 + Math.random() * 60), y: oy - 8 - Math.random() * 10, vx: 0, vy: 2.2 + Math.random() * 1.6, l: 0, m: 34, f: Math.random() < 0.35, n: 3 + Math.floor(Math.random() * 5) });
      if (a === 'math' && t % 4 === 0) P.push({ x: cx - 28 + Math.random() * 56, y: feet - 4 - Math.random() * 44, vx: (Math.random() - 0.5) * 0.3, vy: -0.45, l: 0, m: 26 + Math.random() * 12, f: Math.random() < 0.4, g: Math.floor(Math.random() * GLYPHS.length) });
      if (a === 'volt' && t % 3 === 0) {
        const side = Math.random() < 0.5 ? -1 : 1; let x = cx + side * (14 + Math.random() * 8), y = oy + 6 + Math.random() * 20; const seg = [];
        for (let i = 0; i < 5; i++) { const nx = x + (Math.random() - 0.5) * 9, ny = y + 5 + Math.random() * 5; seg.push([x, y, nx, ny]); x = nx; y = ny; }
        P.push({ bolt: seg, l: 0, m: 3, f: Math.random() < 0.5 });
      }
      for (const p of P) { if ((a === 'money' || a === 'matrix' || a === 'sakura' || a === 'stars') && p.y > feet + 2) p.l = p.m; p.l++; if (!p.bolt) { p.x += p.vx + (p.s !== undefined ? Math.sin((t + p.s * 9) / 5) * 0.4 : 0); p.y += p.vy; } }
      for (let i = P.length - 1; i >= 0; i--) if (P[i].l > P[i].m) P.splice(i, 1);
      if (P.length > 160) P.splice(0, P.length - 160);
    }
    for (const p of P) {
      if (!!p.f !== front) continue;
      const k = p.l / p.m, x = Math.round(p.x), y = Math.round(p.y);
      if (p.bolt) {
        for (const [x1, y1, x2, y2] of p.bolt) { const n = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1)) | 0; for (let i = 0; i <= n; i++) { const px = Math.round(x1 + (x2 - x1) * i / n), py = Math.round(y1 + (y2 - y1) * i / n); R(px, py, 1, 1, p.l < 2 ? '#ffffff' : col); if (p.l < 2) R(px + 1, py, 1, 1, 'rgba(111,227,255,.5)'); } }
      } else if (a === 'fire') R(x, y, k < 0.5 ? 2 : 1, k < 0.5 ? 2 : 1, k < 0.2 ? '#fff6c2' : k < 0.45 ? '#ffd24a' : k < 0.75 ? '#ff8a2a' : '#c8322a');
      else if (a === 'toxic') { const s = k < 0.7 ? 2 : 1; R(x, y, s, s, k < 0.5 ? '#7dff5a' : '#3fae2a'); if (s === 2) R(x, y, 1, 1, '#d6ffc8'); }
      else if (a === 'shadow') { const s = k < 0.4 ? 3 : 2; R(x, y, s, s, k < 0.5 ? 'rgba(120,60,220,.55)' : 'rgba(40,12,80,.6)'); }
      else if (a === 'cosmic') R(x, y, 1, 1, k < 0.5 ? '#e7d9ff' : '#8a5cf0');
      else if (a === 'money') { if (p.k) { R(x, y, 2, 2, '#e2b33c'); R(x, y, 1, 1, '#fff6c2'); } else { const w = (t + Math.floor(p.s)) % 6 < 3 ? 4 : 2; R(x, y, w, 2, '#3ddc84'); R(x + (w >> 1) - 1, y, 1, 2, '#1f6b3a'); } }
      else if (a === 'matrix') { for (let i = 0; i < p.n; i++) R(x, y - i * 2, 1, 1, i === 0 ? '#e6ffe9' : i < 3 ? '#39ff7a' : '#147a35'); }
      else if (a === 'math') { const g = GLYPHS[p.g], c2 = k > 0.8 ? 'rgba(143,211,255,.4)' : p.g % 2 ? '#ffffff' : '#8fd3ff'; for (let i = 0; i < 9; i++) if (g[i] === '#') R(x + (i % 3), y + Math.floor(i / 3), 1, 1, c2); }
      else if (a === 'hearts') { const c2 = k < 0.6 ? '#ff6b9a' : '#c8456e'; for (let i = 0; i < 9; i++) if (HEART[i] === '#') R(x + (i % 3), y + Math.floor(i / 3), 1, 1, c2); if (k < 0.5) R(x, y, 1, 1, '#ffd0e0'); }
      else if (a === 'sakura') { const w = (t + Math.floor(p.s * 3)) % 8 < 4; R(x, y, w ? 2 : 1, w ? 1 : 2, p.k ? '#ffb7d0' : '#ffd6e4'); R(x, y, 1, 1, '#ff8ab0'); }
      else if (a === 'stars') {
        if (p.tail) { R(x, y, 1, 1, '#ffffff'); for (let i = 1; i < 6; i++) R(Math.round(p.x - i * 1.6), Math.round(p.y - i), 1, 1, `rgba(207,227,255,${(0.8 - i * 0.14).toFixed(2)})`); }
        else { const on = k > 0.3 && k < 0.7; R(x, y, 1, 1, '#cfe3ff'); if (on) { R(x - 1, y, 3, 1, 'rgba(207,227,255,.6)'); R(x, y - 1, 1, 3, 'rgba(207,227,255,.6)'); } }
      }
      else if (a === 'spark') { const on = k > 0.25 && k < 0.75; R(x, y, 1, 1, '#fff6c2'); if (on) { R(x - 1, y, 3, 1, '#ffe27a'); R(x, y - 1, 1, 3, '#ffe27a'); R(x, y, 1, 1, '#ffffff'); } }
    }
    if (a === 'cosmic') {
      for (let i = 0; i < 6; i++) {
        const ang = t / 9 + i * Math.PI / 3, z = Math.sin(ang);
        if ((z > 0) !== front) continue;
        const x = Math.round(cx + Math.cos(ang) * 27), y = Math.round(oy + 36 + z * 7 + Math.cos(ang) * 5);
        R(x, y, 2, 2, i % 2 ? '#ffe27a' : '#b48cff'); R(x, y, 1, 1, '#ffffff');
        R(Math.round(cx + Math.cos(ang - 0.18) * 27), Math.round(oy + 36 + Math.sin(ang - 0.18) * 7 + Math.cos(ang - 0.18) * 5), 1, 1, 'rgba(180,140,255,.5)');
      }
    }
  }
}

// one-shot thumbnails -------------------------------------------------------
export function spriteCanvas(look, crop = [0, 0, SW, SH]) {
  const full = document.createElement('canvas'); full.width = SW; full.height = SH;
  paint(full.getContext('2d'), compose(look));
  const [x, y, w, h] = crop;
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  cv.getContext('2d').drawImage(full, x, y, w, h, 0, 0, w, h);
  return cv;
}
export function sceneCanvas(id, acc, w = 60, h = 44) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const c = cv.getContext('2d');
  const big = document.createElement('canvas'); big.width = 120; big.height = 110;
  const bc = big.getContext('2d');
  SCENES[id]((x, y, ww, hh, col) => { bc.fillStyle = col; bc.fillRect(x, y, ww, hh); }, 120, 110, 94, 12, acc);
  c.imageSmoothingEnabled = false; c.drawImage(big, 0, 14, 120, 88, 0, 0, w, h);
  return cv;
}
export function petCanvas(id) {
  const cv = document.createElement('canvas'); cv.width = PW; cv.height = PH;
  const buf = composePet(id, 0); if (buf) paint(cv.getContext('2d'), buf);
  return cv;
}
