// RESPAWN — pixel character composer. Pure functions, no DOM (also used by tools/ in Node).
export const SW = 64, SH = 68, FEET = 63;
const CX = 32;
const INK = '#0b0b10';

const h2r = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const r2h = (...v) => '#' + v.map(n => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0')).join('');
export function tint(hex, f) {
  const [r, g, b] = h2r(hex);
  return f >= 0 ? r2h(r + (255 - r) * f, g + (255 - g) * f, b + (255 - b) * f) : r2h(r * (1 + f), g * (1 + f), b * (1 + f));
}
const mix = (a, b, t = 0.5) => { const A = h2r(a), Z = h2r(b); return r2h(...A.map((v, i) => v + (Z[i] - v) * t)); };
// material: base / highlight / shade / deep shade
const M = c => ({ b: c, h: tint(c, 0.25), s: tint(c, -0.25), d: tint(c, -0.5) });

export const SKIN = { s1: '#f3cfae', s2: '#e0ac84', s3: '#b47b52', s4: '#7b4f34' };
export const HAIRC = {
  black: '#2a2a35', brown: '#5c3d26', blond: '#e6c66e', white: '#ececf4',
  red: '#c8402f', teal: '#22c4a4', pink: '#f272ad', blue: '#4a78f5',
  copper: '#c0602a', ash: '#9c9890', lavender: '#b49be0',
};

const C = {
  gray: M('#8d8d98'), black: M('#2b2b35'), white: M('#e9e9ee'), cream: M('#ece7da'),
  light: M('#b9bcc6'), leather: M('#22222a'), red: M('#b8262f'), steel: M('#262a35'),
  gold: M('#e2b33c'), denim: M('#3e5f9e'), jog: M('#7d7d88'),
};
const NEON = '#35f0ff', DARK = '#3a3a45';

class Buf {
  constructor(w = SW, h = SH) { this.w = w; this.h = h; this.d = new Array(w * h).fill(null); }
  px(x, y, c) { if (c && x >= 0 && y >= 0 && x < this.w && y < this.h) this.d[y * this.w + x] = c; }
  rect(x, y, w, h, c) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.px(x + i, y + j, c); }
  clr(x, y, w = 1, h = 1) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const X = x + i, Y = y + j;
      if (X >= 0 && Y >= 0 && X < this.w && Y < this.h) this.d[Y * this.w + X] = null;
    }
  }
  // mirrored pair of rects; cR lets the right side be shaded differently
  sym(x, y, w, h, cL, cR = cL) { this.rect(x, y, w, h, cL); this.rect(SW - x - w, y, w, h, cR); }
  pts(list, c) { for (const [x, y] of list) this.px(x, y, c); }
}

// body A = the original build: gets broader & bulkier with rank.
// body B = narrower shoulders, waist and hips: gets toned and athletic with rank, not bulky.
const BODY = {
  a: { tw: [6, 7, 8, 9], aw: [3, 3, 4, 5] },
  b: { tw: [5, 5, 6, 6], aw: [2, 3, 3, 4] },
};
function geo(build, bob, body) {
  const b = body === 'b' ? 'b' : 'a', P = BODY[b];
  return { build, body: b, tw: P.tw[build], aw: P.aw[build], hy: 12 + bob, ty: 27 + bob, bob };
}
// torso half-width for row r (0 = shoulders … 15 = hips)
// 1px only: a deeper waist leaves a 2px gap to the straight arms that the outline fills solid black
const waistB = (G, r) => (r >= (G.build >= 2 ? 7 : 8) && r <= (G.build >= 2 ? 12 : 11) ? 1 : 0);
const thw = (G, r) => (G.body === 'b' ? G.tw - waistB(G, r) : G.tw - (G.build >= 2 && r >= 9 ? 1 : 0) - (G.build >= 3 && r >= 12 ? 1 : 0));

/* ---------- body parts ---------- */
function torso(K, m) {
  const { B, G } = K;
  for (let r = 0; r < 16; r++) {
    const hw = thw(G, r), y = G.ty + r;
    B.rect(CX - hw, y, hw * 2, 1, r === 15 ? m.s : m.b);
    B.rect(CX + hw - 2, y, 2, 1, m.s);
    B.px(CX - hw, y, m.h);
  }
  if (G.body === 'b') { const y = G.ty + 5; B.rect(CX - 4, y, 3, 1, m.s); B.rect(CX + 1, y, 3, 1, m.d); } // bust line
}

function arms(K, m, sleeve) { // sleeve = rows of cloth: 0 bare, 5 short, 14 long
  const { B, G, S } = K;
  const xL = CX - G.tw - G.aw, xR = CX + G.tw, y0 = G.ty;
  if (G.build >= 3 && G.body !== 'b') { const mm = sleeve ? m : S; B.sym(xL + 1, y0 - 1, G.aw, 1, mm.h, mm.b); }
  for (let r = 0; r < 17; r++) {
    const y = y0 + r, hand = r >= 14;
    const mm = r < sleeve ? m : S;
    const off = (r === 0 && G.build < 2) || (hand && G.aw > 3) ? 1 : 0;
    const w = G.aw - off;
    B.rect(xL + off, y, w, 1, mm.b); B.px(xL + off, y, mm.h); B.px(xL + G.aw - 1, y, mm.d);
    B.rect(xR, y, w, 1, mm.b); B.px(xR, y, mm.d); B.px(xR + w - 1, y, mm.s);
    if (sleeve && r === sleeve - 1) { B.rect(xL + off, y, w, 1, m.s); B.rect(xR, y, w, 1, m.d); }
  }
  if (!sleeve && G.build >= 2) { B.px(xL + 1, y0 + 4, S.h); B.px(xL + 1, y0 + 5, S.h); B.px(xR + 1, y0 + 6, S.s); }
}

function legs(K, m, style) { // baggy | slim | shorts
  const { B, S } = K;
  const lw = K.lw = style === 'baggy' ? 6 : 5;
  const xL = CX - 1 - lw, xR = CX + 1, len = style === 'shorts' ? 8 : 16;
  B.rect(xL, 43, lw * 2 + 2, 4, m.b);
  for (const x of [xL, xR]) { B.rect(x, 43, lw, len, m.b); B.rect(x + lw - 1, 43, 1, len, m.s); }
  B.rect(xL, 44, 1, len - 1, m.h);
  B.rect(xL, 43, lw * 2 + 2, 1, m.d);
  B.rect(CX - 1, 47, 2, 1, m.d);
  if (style === 'baggy') { B.rect(xL - 1, 56, 1, 3, m.b); B.rect(xR + lw, 56, 1, 3, m.s); B.rect(xL + 1, 54, 2, 1, m.s); B.rect(xR + 1, 55, 2, 1, m.s); }
  if (style === 'shorts') {
    B.rect(xL, 50, lw, 1, m.s); B.rect(xR, 50, lw, 1, m.s);
    B.rect(xL + 1, 51, lw - 1, 8, S.b); B.rect(xL + lw - 1, 51, 1, 8, S.s);
    B.rect(xR, 51, lw - 1, 8, S.b); B.rect(xR + lw - 2, 51, 1, 8, S.s);
  }
  return { xL, xR, lw };
}

function shoes(K, m, sole, tall = 0) {
  const { B } = K, lw = K.lw, xL = CX - 1 - lw, xR = CX + 1, y = 59 - tall, h = 3 + tall;
  B.rect(xL - 1, y, lw + 1, h, m.b); B.rect(xL - 1, y, 2, 1, m.h); B.rect(xL + lw - 1, y, 1, h, m.s);
  B.rect(xR, y, lw + 1, h, m.b); B.rect(xR + lw, y, 1, h, m.s); B.px(xR, y, m.h);
  B.rect(xL - 1, 62, lw + 1, 1, sole); B.rect(xR, 62, lw + 1, 1, sole);
}

function head(K) {
  const { B, G, S, look } = K, hx = CX - 7, hy = G.hy;
  B.rect(hx, hy, 14, 13, S.b);
  B.rect(hx + 13, hy + 1, 1, 10, S.s);
  B.rect(hx + 2, hy + 12, 10, 1, S.s);
  for (const [x, y] of [[0, 0], [13, 0], [0, 12], [13, 12], [1, 12], [12, 12], [0, 11], [13, 11]]) B.clr(hx + x, hy + y);
  B.rect(hx - 1, hy + 5, 1, 3, S.b); B.rect(hx + 14, hy + 5, 1, 3, S.s);
  // eyes
  const ey = hy + 6, eye = '#17171d';
  if (K.blink) B.sym(CX - 5, ey + 1, 2, 1, S.d);
  else { B.sym(CX - 5, ey, 2, 2, eye); B.px(CX - 5, ey, '#ffffff'); B.px(CX + 3, ey, '#ffffff'); }
  if (G.body === 'b') { const ly = K.blink ? ey + 1 : ey - 1; B.px(CX - 6, ly, eye); B.px(CX + 5, ly, eye); } // lashes
  B.px(CX, hy + 8, S.s);
  // mouth + brows by attitude
  const e = look.expr || 0, my = hy + 10;
  if (e === 0) B.rect(CX - 1, my, 2, 1, S.d);
  else if (e === 1) { B.rect(CX - 2, my, 4, 1, S.d); B.px(CX - 3, my - 1, S.d); B.px(CX + 2, my - 1, S.d); }
  else {
    B.rect(CX - 2, my, 4, 1, S.d); B.px(CX + 2, my - 1, S.d);
    B.pts([[CX - 6, ey - 3], [CX - 5, ey - 2], [CX - 4, ey - 2], [CX + 5, ey - 3], [CX + 4, ey - 2], [CX + 3, ey - 2]], S.d);
  }
}

/* ---------- hair ---------- */
const hairSides = (K, to) => { const { B, G, H } = K; B.rect(CX - 8, G.hy, 1, to, H.b); B.rect(CX + 7, G.hy, 1, to, H.s); };

const HAIRS = {
  messy(K) {
    const { B, G, H } = K, y = G.hy;
    B.rect(24, y - 2, 16, 5, H.b); B.clr(24, y - 2); B.clr(39, y - 2);
    B.pts([[28, y - 3], [29, y - 3], [33, y - 3], [34, y - 3], [34, y - 4], [37, y - 3]], H.b);
    B.rect(25, y + 3, 14, 1, H.b); B.clr(29, y + 3); B.clr(34, y + 3);
    B.pts([[25, y + 4], [26, y + 4], [30, y + 4], [31, y + 4], [36, y + 4], [37, y + 4], [38, y + 4], [25, y + 5], [38, y + 5]], H.b);
    hairSides(K, 6);
    B.rect(38, y - 1, 2, 4, H.s);
    B.pts([[28, y - 1], [29, y - 1], [30, y], [33, y - 2], [34, y - 1]], H.h);
  },
  curly(K) {
    const { B, G, H } = K, y = G.hy;
    B.rect(23, y - 4, 18, 7, H.b);
    for (const x of [23, 24, 27, 31, 35, 39, 40]) B.clr(x, y - 4);
    B.clr(23, y - 3); B.clr(40, y - 3);
    B.pts([[22, y - 1], [22, y], [41, y - 1], [41, y], [22, y + 2], [41, y + 3]], H.b);
    B.rect(23, y + 3, 2, 4, H.b); B.rect(39, y + 3, 2, 4, H.s);
    B.rect(25, y + 3, 14, 1, H.b); B.clr(28, y + 3); B.clr(33, y + 3);
    B.pts([[26, y + 4], [27, y + 4], [31, y + 4], [35, y + 4], [36, y + 4]], H.b);
    B.pts([[26, y - 2], [30, y - 3], [34, y - 2], [37, y - 1], [28, y], [32, y], [36, y + 1], [24, y + 1]], H.h);
    B.pts([[25, y], [29, y + 1], [33, y - 1], [38, y + 1], [39, y - 2], [40, y]], H.s);
  },
  spiky(K) {
    const { B, G, H } = K, y = G.hy;
    B.rect(24, y - 1, 16, 4, H.b);
    const spikes = [[23, 4], [27, 6], [31, 5], [35, 7], [38, 3]];
    spikes.forEach(([x, h], i) => { for (let r = 0; r < h; r++) { const w = Math.max(1, 4 - Math.floor(r * 4 / h)); B.rect(i % 2 ? x + 4 - w : x, y - 2 - r, w, 1, H.b); } });
    B.rect(25, y + 3, 3, 1, H.b); B.rect(30, y + 3, 3, 1, H.b); B.rect(35, y + 3, 4, 1, H.b);
    B.pts([[26, y + 4], [31, y + 4], [36, y + 4], [37, y + 4], [37, y + 5]], H.b);
    hairSides(K, 5);
    B.pts([[28, y - 5], [28, y - 4], [36, y - 6], [36, y - 5], [32, y - 3], [26, y]], H.h);
    B.rect(38, y - 1, 2, 4, H.s);
  },
  buzz(K) {
    const { B, G, H, S } = K, y = G.hy, c = M(tint(H.b, -0.05));
    B.rect(25, y - 1, 14, 3, c.b); B.clr(25, y - 1); B.clr(38, y - 1);
    B.rect(25, y + 2, 14, 1, c.s);
    B.sym(25, y + 3, 1, 2, c.b, c.s);
    for (let x = 27; x < 38; x += 3) B.px(x, y, c.h);
  },
  long(K) {
    HAIRS.messy(K);
    const { B, G, H } = K, y = G.hy;
    B.rect(23, y + 1, 2, 15, H.b); B.rect(39, y + 1, 2, 15, H.s);
    B.px(25, y + 6, H.b); B.px(25, y + 7, H.b); B.px(38, y + 6, H.s);
    B.px(23, y + 5, H.h); B.px(23, y + 9, H.h);
  },
  mohawk(K) {
    const { B, G, H, S } = K, y = G.hy;
    B.rect(25, y, 14, 2, S.s); B.clr(25, y); B.clr(38, y);
    B.rect(30, y - 5, 4, 8, H.b); B.rect(31, y - 7, 3, 2, H.b); B.px(32, y - 8, H.b);
    B.rect(33, y - 5, 1, 8, H.s); B.px(30, y - 4, H.h); B.px(31, y - 6, H.h); B.px(30, y - 1, H.h);
  },
  slick(K) {
    const { B, G, H } = K, y = G.hy;
    B.rect(25, y - 3, 14, 5, H.b); B.rect(27, y - 4, 11, 1, H.b); B.clr(25, y - 3);
    B.rect(26, y + 2, 12, 1, H.b); B.rect(35, y + 3, 4, 1, H.b); B.px(38, y + 4, H.b);
    B.rect(25, y + 2, 1, 3, H.s); B.rect(38, y + 2, 1, 2, H.s);
    B.rect(28, y - 2, 7, 1, H.h); B.rect(30, y, 6, 1, H.s); B.rect(37, y - 3, 2, 5, H.s);
  },
  knot(K) {
    const { B, G, H } = K, y = G.hy;
    B.rect(25, y - 2, 14, 4, H.b); B.clr(25, y - 2); B.clr(38, y - 2);
    B.rect(30, y - 6, 4, 3, H.b); B.rect(31, y - 3, 2, 1, H.s); B.px(30, y - 6, H.h);
    B.rect(25, y + 2, 2, 3, H.b); B.rect(37, y + 2, 2, 3, H.s); B.px(27, y + 2, H.b); B.px(36, y + 2, H.b);
    B.rect(28, y - 1, 5, 1, H.h);
  },
  bald() {},
  // ---- 2.0 ----
  bob(K) { // каре: straight fringe, sides to the jaw
    const { B, G, H } = K, y = G.hy;
    B.rect(25, y - 2, 14, 4, H.b); B.clr(25, y - 2); B.clr(38, y - 2); B.rect(26, y - 3, 12, 1, H.b);
    B.rect(25, y + 2, 14, 2, H.b); B.px(28, y + 3, H.s); B.px(33, y + 3, H.s);
    B.rect(23, y + 1, 3, 10, H.b); B.rect(38, y + 1, 3, 10, H.s); B.rect(24, y - 1, 1, 2, H.b); B.rect(39, y - 1, 1, 2, H.s);
    B.rect(23, y + 11, 2, 1, H.s); B.rect(39, y + 11, 2, 1, H.d); B.rect(23, y + 3, 1, 6, H.h);
    B.rect(27, y - 2, 6, 1, H.h); B.px(26, y, H.h);
  },
  ponytail(K) { sleekTop(K); K.B.rect(39, K.G.hy - 1, 2, 2, '#d8323c'); K.B.px(39, K.G.hy - 1, '#ff6b76'); },
  braid(K) { // коса over the right shoulder
    const { B, G, H } = K, y = G.hy;
    sleekTop(K);
    for (let i = 0; i < 6; i++) { const x = 38 + (i % 2), yy = y + 4 + i * 3; B.rect(x, yy, 3, 3, H.b); B.px(x, yy, H.h); B.rect(x + 2, yy, 1, 3, H.s); B.rect(x, yy + 2, 3, 1, H.s); }
    B.rect(39, y + 22, 2, 1, '#d8323c'); B.rect(39, y + 23, 2, 2, H.b); B.px(40, y + 24, H.s);
  },
  bun(K) { sleekTop(K); const { B, G, H } = K, y = G.hy; B.rect(29, y - 7, 6, 4, H.b); B.rect(30, y - 8, 4, 1, H.b); B.rect(33, y - 7, 2, 4, H.s); B.px(30, y - 7, H.h); B.px(31, y - 6, H.h); B.rect(29, y - 3, 6, 1, H.d); },
  space_buns(K) {
    sleekTop(K); const { B, G, H } = K, y = G.hy;
    for (const x of [23, 37]) { B.rect(x, y - 6, 4, 4, H.b); B.rect(x + 1, y - 7, 2, 1, H.b); B.rect(x + 3, y - 6, 1, 4, H.s); B.px(x + 1, y - 6, H.h); }
  },
  pixie(K) {
    const { B, G, H } = K, y = G.hy;
    B.rect(25, y - 2, 14, 4, H.b); B.clr(25, y - 2); B.clr(38, y - 2); B.rect(27, y - 3, 10, 1, H.b);
    B.rect(25, y + 2, 9, 1, H.b); B.rect(25, y + 3, 6, 1, H.b); B.rect(25, y + 4, 3, 1, H.b); B.rect(36, y + 2, 3, 2, H.s);
    hairSides(K, 4); B.rect(29, y - 2, 6, 1, H.h); B.px(28, y - 1, H.h); B.rect(36, y - 2, 2, 3, H.s); B.px(30, y + 3, H.s);
  },
  curtain(K) { // чубчик-шторки, length to the chin
    const { B, G, H } = K, y = G.hy;
    B.rect(25, y - 2, 14, 4, H.b); B.clr(25, y - 2); B.clr(38, y - 2); B.rect(26, y - 3, 12, 1, H.b);
    B.rect(26, y + 2, 5, 1, H.b); B.rect(26, y + 3, 3, 1, H.b); B.px(26, y + 4, H.b);
    B.rect(33, y + 2, 5, 1, H.s); B.rect(35, y + 3, 3, 1, H.s); B.px(37, y + 4, H.s);
    B.rect(23, y + 1, 2, 12, H.b); B.rect(39, y + 1, 2, 12, H.s); B.px(25, y + 5, H.b); B.px(38, y + 5, H.s);
    B.rect(24, y - 1, 1, 2, H.b); B.rect(39, y - 1, 1, 2, H.s); B.px(31, y - 2, H.s); B.px(32, y - 1, H.s);
    B.rect(27, y - 2, 3, 1, H.h); B.rect(34, y - 2, 2, 1, H.h); B.rect(23, y + 4, 1, 5, H.h);
  },
  waves(K) { // довгі хвилі
    const { B, G, H } = K, y = G.hy;
    B.rect(25, y - 2, 14, 4, H.b); B.clr(25, y - 2); B.clr(38, y - 2); B.rect(26, y - 3, 12, 1, H.b);
    B.rect(25, y + 2, 4, 2, H.b); B.rect(35, y + 2, 4, 2, H.s); B.px(29, y + 2, H.b); B.px(25, y + 4, H.b);
    for (let r = 0; r < 18; r++) { const o = [0, 0, 1, 1, 0, -1, -1, 0][r % 8]; B.rect(23 + o, y + 1 + r, 2, 1, H.b); B.rect(39 - o, y + 1 + r, 2, 1, H.s); }
    B.rect(24, y - 1, 1, 3, H.b); B.rect(39, y - 1, 1, 3, H.s);
    B.px(23, y + 4, H.h); B.px(24, y + 11, H.h); B.px(23, y + 15, H.h); B.rect(28, y - 2, 4, 1, H.h); B.px(27, y - 1, H.h);
  },
};
// smooth top for tied-back styles (хвіст, коса, пучки)
function sleekTop(K) {
  const { B, G, H } = K, y = G.hy;
  B.rect(25, y - 2, 14, 4, H.b); B.clr(25, y - 2); B.clr(38, y - 2); B.rect(26, y - 3, 12, 1, H.b);
  B.rect(25, y + 2, 3, 2, H.b); B.rect(36, y + 2, 3, 2, H.s); B.px(25, y + 4, H.b); B.px(38, y + 4, H.s);
  B.px(31, y - 2, H.s); B.px(31, y - 1, H.s);
  B.rect(27, y - 2, 3, 1, H.h); B.px(28, y - 1, H.h); B.rect(34, y - 2, 2, 1, H.h);
}
const HAIR_BACK = {
  long(K) { const { B, G, H } = K; B.rect(24, G.hy + 8, 16, 8, H.d); },
  waves(K) { const { B, G, H } = K; B.rect(24, G.hy + 8, 16, 11, H.d); },
  curtain(K) { const { B, G, H } = K; B.rect(24, G.hy + 8, 16, 5, H.d); },
  ponytail(K) { // the tail hangs behind the head, right side
    const { B, G, H } = K, y = G.hy;
    B.rect(39, y, 3, 3, H.b); B.rect(40, y + 3, 3, 8, H.b); B.rect(42, y + 3, 1, 8, H.s); B.rect(41, y + 11, 2, 3, H.s); B.px(42, y + 14, H.d);
    B.px(40, y + 5, H.h); B.px(40, y + 8, H.h);
  },
};

/* ---------- face accessories ---------- */
const FACES = {
  glasses(K) {
    const { B, G } = K, y = G.hy + 5, f = '#101014';
    for (const x of [26, 33]) {
      B.rect(x, y, 5, 1, f); B.rect(x, y + 3, 5, 1, f); B.rect(x, y, 1, 4, f); B.rect(x + 4, y, 1, 4, f);
      B.px(x + 3, y + 1, 'rgba(255,255,255,.55)');
    }
    B.rect(31, y + 1, 2, 1, f); B.px(25, y + 1, f); B.px(38, y + 1, f);
  },
  shades_green(K) {
    const { B, G } = K, y = G.hy + 5, f = '#101014';
    B.rect(25, y, 14, 1, f);
    for (const x of [26, 33]) {
      B.rect(x, y, 5, 4, f); B.rect(x + 1, y + 1, 3, 2, '#2fd3b0');
      B.px(x + 1, y + 1, '#a8f7e3'); B.px(x + 3, y + 2, '#1a9a80');
    }
  },
  shades_black(K) {
    const { B, G } = K, y = G.hy + 5, f = '#0d0d12';
    B.rect(25, y, 14, 1, f); B.rect(26, y + 1, 5, 3, f); B.rect(33, y + 1, 5, 3, f);
    B.pts([[27, y + 1], [28, y + 2], [34, y + 1], [35, y + 2]], '#f4f4f8');
    B.px(26, y + 3, K.S.b); B.px(37, y + 3, K.S.b);
  },
  visor(K) {
    const { B, G } = K, y = G.hy + 5;
    B.rect(24, y, 16, 4, '#14141a'); B.rect(26, y + 1, 12, 2, NEON); B.rect(26, y + 2, 12, 1, '#1aa7c0');
    B.px(27, y + 1, '#e6ffff'); B.px(28, y + 1, '#e6ffff');
  },
  monocle(K) {
    const { B, G } = K, y = G.hy + 5, g = '#e2b33c';
    B.rect(33, y, 5, 1, g); B.rect(33, y + 3, 5, 1, '#a8801e'); B.rect(33, y, 1, 4, g); B.rect(37, y, 1, 4, '#a8801e');
    B.px(36, y + 1, 'rgba(255,255,255,.6)');
    B.pts([[38, y + 4], [38, y + 5], [37, y + 6], [37, y + 7], [36, y + 8]], '#c9a13a');
  },
  mask(K) {
    const { B, G } = K, y = G.hy + 8, m = C.black;
    B.rect(26, y, 12, 4, m.b); B.rect(27, y + 4, 10, 1, m.s); B.rect(36, y, 2, 4, m.s);
    B.rect(27, y + 2, 9, 1, m.h); B.px(25, y, m.d); B.px(38, y, m.d); B.px(25, y - 1, m.d); B.px(38, y - 1, m.d);
  },
};

/* ---------- face details (2.0): drawn right after the head, under hair & glasses ---------- */
const DETAILS = {
  stubble(K) {
    const { B, G, S, H } = K, y = G.hy, c = mix(S.s, H.d, 0.55);
    for (let x = 27; x <= 36; x += 2) B.px(x, y + 11, c);
    for (let x = 28; x <= 35; x += 2) B.px(x, y + 12, c);
    B.pts([[26, y + 10], [37, y + 10], [29, y + 9], [34, y + 9]], c);
  },
  beard(K) {
    const { B, G, S, H } = K, y = G.hy, my = y + 10;
    B.rect(25, y + 5, 1, 4, H.b); B.rect(38, y + 5, 1, 4, H.s);
    B.rect(25, y + 9, 14, 3, H.b); B.rect(26, y + 12, 12, 1, H.b); B.rect(28, y + 13, 8, 1, H.s); B.rect(36, y + 9, 3, 3, H.s);
    B.rect(29, y + 9, 6, 1, H.d); B.rect(CX - 2, my, 4, 1, S.d); B.px(CX - 1, my + 1, S.s); B.px(CX, my + 1, S.s);
    B.px(27, y + 10, H.h); B.px(30, y + 12, H.h);
  },
  mustache(K) { const { B, G, H } = K, y = G.hy; B.rect(29, y + 9, 6, 1, H.b); B.px(28, y + 10, H.b); B.px(35, y + 10, H.s); B.px(30, y + 9, H.h); },
  freckles(K) { const { B, G, S } = K, y = G.hy, c = mix(S.b, '#8a4a2a', 0.45); B.pts([[27, y + 8], [29, y + 8], [28, y + 9], [30, y + 9], [33, y + 9], [35, y + 8], [34, y + 8], [36, y + 9]], c); },
  blush(K) { const { B, G, S } = K, y = G.hy, c = mix(S.b, '#ff5f8f', 0.45); B.rect(26, y + 8, 2, 1, c); B.rect(36, y + 8, 2, 1, c); },
  lipstick(K) {
    const { B, G, look } = K, my = G.hy + 10, L = '#c8323f', e = look.expr || 0;
    if (e === 0) B.rect(CX - 1, my, 2, 1, L);
    else { B.rect(CX - 2, my, 4, 1, L); B.px(CX + 2, my - 1, L); if (e === 1) B.px(CX - 3, my - 1, L); }
    B.px(CX - 1, my, '#ff7a86');
  },
  piercing(K) { const { B, G } = K, y = G.hy; B.px(CX + 1, y + 9, '#e2e4ee'); B.px(24, y + 7, '#ffd84a'); B.px(39, y + 7, '#ffd84a'); },
};

/* ---------- head accessories ---------- */
const clearAbove = (K, rows) => K.B.clr(18, 0, 28, K.G.hy + rows);
const HEADS = {
  cap(K) {
    const { B, G } = K, y = G.hy, m = C.black;
    clearAbove(K, 2);
    B.rect(24, y - 3, 16, 5, m.b); B.clr(24, y - 3); B.clr(39, y - 3); B.rect(26, y - 4, 12, 1, m.b);
    B.rect(37, y - 3, 3, 5, m.s); B.rect(27, y - 3, 5, 1, m.h);
    B.rect(22, y + 2, 20, 2, m.d); B.rect(22, y + 2, 20, 1, m.s);
    B.rect(30, y - 2, 4, 3, '#e9e9ee'); B.px(31, y - 1, m.b); B.px(32, y - 1, m.b);
  },
  beanie(K) {
    const { B, G } = K, y = G.hy, m = M('#4b4f5c');
    clearAbove(K, 2);
    B.rect(24, y - 4, 16, 6, m.b); B.clr(24, y - 4); B.clr(39, y - 4); B.clr(25, y - 4); B.clr(38, y - 4); B.clr(24, y - 3); B.clr(39, y - 3);
    B.rect(38, y - 2, 2, 4, m.s); B.rect(28, y - 3, 4, 1, m.h);
    B.rect(24, y + 1, 16, 3, m.h); B.rect(24, y + 3, 16, 1, m.b);
    for (let x = 25; x < 40; x += 2) B.px(x, y + 2, m.b);
  },
  phones(K) {
    const { B, G } = K, y = G.hy, m = C.black;
    B.rect(26, y - 5, 12, 1, m.h); B.pts([[25, y - 4], [24, y - 3], [24, y - 2], [23, y - 1], [23, y], [23, y + 1]], m.h);
    B.pts([[38, y - 4], [39, y - 3], [39, y - 2], [40, y - 1], [40, y], [40, y + 1]], m.b);
    B.sym(21, y + 2, 4, 7, m.b, m.s); B.sym(21, y + 3, 1, 5, m.h, m.b); B.sym(22, y + 4, 2, 3, NEON, '#1aa7c0');
  },
  bandana(K) {
    const { B, G } = K, y = G.hy, m = C.red;
    B.rect(24, y + 1, 16, 2, m.b); B.rect(24, y + 1, 16, 1, m.h); B.rect(38, y + 1, 2, 2, m.s);
    B.pts([[40, y + 2], [41, y + 3], [41, y + 4], [42, y + 5], [40, y + 3], [40, y + 4], [41, y + 6]], m.b);
    B.px(28, y + 2, '#fff'); B.px(33, y + 2, '#fff');
  },
  halo(K) {
    const { B, G } = K, y = 2 - G.bob, g = '#ffd84a';
    B.rect(27, y, 10, 1, '#fff6b8'); B.rect(25, y + 1, 2, 1, g); B.rect(37, y + 1, 2, 1, g);
    B.rect(27, y + 2, 10, 1, '#d9a520');
  },
  crown(K) {
    const { B, G } = K, y = G.hy - 6, m = C.gold;
    K.B.clr(18, 0, 28, y + 3);
    B.rect(26, y + 2, 12, 3, m.b); B.rect(26, y + 4, 12, 1, m.s); B.rect(36, y + 2, 2, 3, m.s);
    B.pts([[26, y], [26, y + 1], [27, y + 1], [31, y], [32, y], [31, y + 1], [32, y + 1], [31, y - 1], [37, y], [37, y + 1], [36, y + 1]], m.b);
    B.pts([[26, y], [31, y - 1], [27, y + 2], [28, y + 2]], m.h);
    B.px(29, y + 3, '#e23b4e'); B.px(34, y + 3, '#e23b4e'); B.rect(31, y + 3, 2, 1, '#4fd0ff');
  },
  hardhat(K) {
    const { B, G } = K, y = G.hy, m = M('#f2c21a');
    clearAbove(K, 1);
    B.rect(25, y - 4, 14, 5, m.b); B.clr(25, y - 4); B.clr(38, y - 4); B.rect(27, y - 5, 10, 1, m.b);
    B.rect(31, y - 6, 2, 7, m.h); B.rect(36, y - 3, 3, 4, m.s);
    B.rect(23, y + 1, 18, 1, m.b); B.rect(23, y + 2, 18, 1, m.d); B.rect(23, y + 1, 5, 1, m.h);
  },
  tophat(K) {
    const { B, G } = K, y = G.hy, m = M('#1f1f27');
    clearAbove(K, 1);
    B.rect(27, y - 9, 10, 10, m.b); B.rect(35, y - 9, 2, 10, m.s); B.rect(27, y - 9, 10, 1, m.h); B.rect(28, y - 7, 1, 4, m.h);
    B.rect(27, y - 2, 10, 2, '#b8262f'); B.rect(35, y - 2, 2, 2, '#8a1c23');
    B.rect(23, y, 18, 2, m.b); B.rect(23, y, 18, 1, m.h); B.rect(38, y, 3, 2, m.s);
  },
  gradcap(K) {
    const { B, G } = K, y = G.hy, m = M('#1f1f27');
    clearAbove(K, 1);
    B.rect(25, y - 2, 14, 3, m.b); B.rect(37, y - 2, 2, 3, m.s);
    B.rect(21, y - 4, 22, 2, m.b); B.rect(21, y - 4, 22, 1, m.h); B.rect(31, y - 5, 2, 1, m.h);
    B.pts([[41, y - 3], [42, y - 2], [42, y - 1], [42, y], [42, y + 1]], '#e2b33c'); B.rect(41, y + 2, 3, 2, '#ffd84a');
  },
  propeller(K) {
    const { B, G } = K, y = G.hy;
    clearAbove(K, 1);
    const cols = ['#d8323c', '#f2c21a', '#4a78f5', '#3ddc84'];
    for (let x = 25; x < 39; x++) B.rect(x, y - 3, 1, 4, cols[Math.floor((x - 25) / 3.5)]);
    B.clr(25, y - 3); B.clr(38, y - 3); B.rect(26, y - 4, 12, 1, '#f2c21a'); B.rect(24, y + 1, 16, 1, '#17171d');
    B.rect(31, y - 6, 2, 2, '#8e93a8');
    if (G.bob) B.rect(30, y - 7, 4, 1, '#d9dce8'); else { B.rect(26, y - 7, 12, 1, '#d9dce8'); B.rect(26, y - 7, 3, 1, '#ff4d5a'); B.rect(35, y - 7, 3, 1, '#4a78f5'); }
  },
  horns(K) {
    const { B, G } = K, y = G.hy, m = M('#c0283a');
    B.sym(23, y - 3, 2, 3, m.b, m.s); B.sym(22, y - 5, 2, 2, m.b, m.s); B.sym(22, y - 7, 1, 2, m.h, m.b);
  },
  ears(K) {
    const { B, G } = K, y = G.hy, m = C.black;
    for (let r = 0; r < 4; r++) B.sym(25 + (r > 1 ? 0 : 1) , y - 6 + r, 1 + r, 1, m.b, m.s);
    B.sym(26, y - 3, 2, 1, '#f08ab0'); B.sym(26, y - 4, 1, 1, '#f08ab0');
  },
  // ---- 2.0 ----
  headband(K) { const { B, G } = K, y = G.hy, m = M('#f272ad'); B.rect(26, y - 3, 12, 1, m.h); B.rect(25, y - 2, 14, 1, m.b); B.px(24, y - 1, m.b); B.px(39, y - 1, m.s); B.rect(35, y - 2, 4, 1, m.s); },
  bow(K) {
    const { B, G } = K, y = G.hy, m = M('#d8323c');
    B.rect(33, y - 5, 3, 4, m.b); B.rect(38, y - 5, 3, 4, m.s); B.rect(36, y - 4, 2, 2, m.d); B.px(33, y - 5, m.h); B.px(34, y - 4, m.h);
    B.px(35, y - 1, m.s); B.px(39, y - 1, m.d);
  },
  panama(K) { // bucket hat
    const { B, G } = K, y = G.hy, m = M('#d8c9a3');
    clearAbove(K, 2);
    B.rect(25, y - 4, 14, 5, m.b); B.clr(25, y - 4); B.clr(38, y - 4); B.rect(36, y - 4, 3, 5, m.s); B.rect(27, y - 4, 5, 1, m.h);
    B.rect(25, y, 14, 1, '#6b5a3a');
    B.rect(23, y + 1, 18, 1, m.b); B.rect(22, y + 2, 20, 1, m.s); B.rect(23, y + 1, 4, 1, m.h);
  },
};

/* ---------- tops ---------- */
// sports top: band over the chest, bare arms & stomach (also what «Аполлон» shows on figure B)
function sportsTop(K, m) {
  const { B, G, S } = K, y = G.ty;
  torso(K, S); arms(K, S, 0);
  for (let r = 2; r < 8; r++) { const w = thw(G, r); B.rect(CX - w, y + r, w * 2, 1, r === 7 ? m.s : m.b); B.px(CX - w, y + r, m.h); B.px(CX + w - 1, y + r, m.d); }
  B.rect(CX - 3, y, 1, 2, m.b); B.rect(CX + 2, y, 1, 2, m.s); B.rect(CX - 1, y + 2, 2, 1, S.s);
  B.rect(CX - 1, y + 9, 1, 5, S.s); if (G.build >= 2) for (const r of [10, 12]) { B.px(CX - 2, y + r, S.s); B.px(CX + 1, y + r, S.s); }
}
// one-piece tops that also cover the hips: the bottom slot is skipped and bare legs are drawn instead
export const FULL_TOPS = new Set(['dress', 'gown']);
function aSkirt(K, m, len, flare) { // A-line skirt from the waist (y 43) down `len` rows
  const { B } = K;
  for (let r = 0; r < len; r++) {
    const hw = 6 + Math.round((r / Math.max(1, len - 1)) * flare), y = 43 + r;
    B.rect(CX - hw, y, hw * 2, 1, r === len - 1 ? m.s : m.b); B.px(CX - hw, y, m.h); B.rect(CX + hw - 2, y, 2, 1, m.s);
  }
}
const TOPS = {
  tee_gray(K) { const { B, G, S } = K; torso(K, C.gray); arms(K, C.gray, 5); B.rect(CX - 2, G.ty, 4, 1, S.s); },
  tee_black(K) {
    const { B, G, S } = K; torso(K, C.black); arms(K, C.black, 5); B.rect(CX - 2, G.ty, 4, 1, S.s);
    B.rect(CX - 3, G.ty + 5, 6, 1, '#e9e9ee'); B.rect(CX - 2, G.ty + 7, 4, 1, '#e9e9ee');
  },
  hoodie(K) {
    const { B, G, S } = K, m = C.black, y = G.ty;
    torso(K, m); arms(K, m, 14);
    B.rect(CX - 5, y - 1, 10, 2, m.b); B.rect(CX - 5, y - 1, 10, 1, m.h); B.rect(CX + 3, y - 1, 2, 2, m.s);
    B.rect(CX - 1, y, 2, 2, S.s); B.px(CX - 2, y + 1, m.d); B.px(CX + 1, y + 1, m.d);
    B.rect(CX - 2, y + 3, 1, 4, '#d9d9e0'); B.rect(CX + 1, y + 3, 1, 3, '#d9d9e0');
    B.rect(CX - 4, y + 10, 8, 4, m.s); B.rect(CX - 4, y + 10, 8, 1, m.d);
  },
  jacket(K) {
    const { B, G } = K, m = C.light, y = G.ty;
    torso(K, m); arms(K, m, 14);
    B.rect(CX - 2, y, 4, 16, C.black.b); B.rect(CX - 3, y, 1, 16, m.s); B.rect(CX + 2, y, 1, 16, m.d);
    B.sym(CX - 5, y - 1, 3, 2, C.black.b, C.black.s);
    for (const r of [5, 8]) { const w = G.aw; B.rect(CX - G.tw - w, y + r, w, 1, DARK); B.rect(CX + G.tw, y + r, w, 1, DARK); }
    const hw = thw(G, 15); B.rect(CX - hw, y + 14, hw - 2, 2, DARK); B.rect(CX + 2, y + 14, hw - 2, 2, DARK);
    B.rect(CX - 1, y + 6, 2, 1, '#6b6b78');
  },
  tank(K) {
    const { B, G, S } = K, m = C.white, y = G.ty;
    torso(K, m); arms(K, m, 0);
    for (let r = 0; r < 5; r++) { const hw = thw(G, r), w = r < 3 ? 2 : 1; B.rect(CX - hw, y + r, w, 1, S.b); B.rect(CX + hw - w, y + r, w, 1, S.s); }
    B.rect(CX - 2, y, 4, 2, S.b); B.rect(CX - 1, y + 2, 2, 1, S.s);
  },
  track(K) {
    const { B, G } = K, m = C.black, y = G.ty;
    torso(K, m); arms(K, m, 14);
    B.rect(CX - 3, y - 1, 6, 1, m.h); B.rect(CX, y, 1, 16, '#d8d8de');
    B.rect(CX - G.tw - G.aw + (G.build < 2 ? 1 : 0), y + 1, 1, 12, '#f4f4f8'); B.rect(CX + G.tw + G.aw - 1, y + 1, 1, 12, '#c9c9d2');
    B.rect(CX - thw(G, 15), y + 15, thw(G, 15) * 2, 1, '#d8d8de');
  },
  leather(K) {
    const { B, G } = K, m = C.leather, y = G.ty;
    torso(K, m); arms(K, m, 14);
    B.rect(CX - 3, y, 6, 16, C.white.b); B.rect(CX + 1, y, 2, 16, C.white.s);
    B.sym(CX - 6, y - 1, 3, 3, m.h, m.b); B.sym(CX - 4, y + 2, 1, 4, m.h, m.b);
    for (let r = 4; r < 15; r += 2) B.px(CX + 3, y + r, '#b9bccb');
    B.sym(CX - G.tw - G.aw + 1, y + 1, 1, 1, '#c8cada');
    B.rect(CX - thw(G, 13), y + 13, thw(G, 13) - 3, 1, m.h);
  },
  gi(K) {
    const { B, G, S } = K, m = C.cream, y = G.ty;
    torso(K, m); arms(K, m, 11);
    B.rect(CX - 2, y, 4, 1, S.b); B.rect(CX - 1, y + 1, 3, 1, S.b); B.rect(CX, y + 2, 1, 2, S.s);
    for (let r = 0; r < 9; r++) B.px(CX + 3 - r, y + r + 1, m.d);
    for (let r = 0; r < 4; r++) B.px(CX - 3 + r, y + r, m.s);
    const hw = thw(G, 11); B.rect(CX - hw, y + 11, hw * 2, 2, '#191920'); B.rect(CX - hw, y + 11, hw * 2, 1, '#34343f');
    B.rect(CX - 2, y + 13, 1, 2, '#191920'); B.rect(CX + 1, y + 13, 1, 3, '#191920');
  },
  varsity(K) {
    const { B, G } = K, m = C.red, w = C.white, y = G.ty;
    torso(K, m); arms(K, w, 14);
    for (const x of [CX - G.tw - G.aw, CX + G.tw]) { B.rect(x, y + 12, G.aw, 2, m.b); B.rect(x, y + 13, G.aw, 1, m.s); }
    B.rect(CX - 3, y - 1, 6, 1, w.b);
    const hw = thw(G, 15); B.rect(CX - hw, y + 14, hw * 2, 1, w.b); B.rect(CX - hw, y + 15, hw * 2, 1, m.s);
    for (let r = 2; r < 13; r += 3) B.px(CX, y + r, w.b);
    B.rect(CX + 2, y + 3, 3, 4, w.b); B.px(CX + 3, y + 4, m.b); B.px(CX + 4, y + 6, m.b);
  },
  cyber(K) {
    const { B, G } = K, m = C.steel, y = G.ty, xL = CX - G.tw - G.aw;
    torso(K, m); arms(K, m, 14);
    B.sym(xL - 1, y - 1, G.aw + 1, 3, m.h, m.b); B.sym(xL - 1, y + 1, G.aw + 1, 1, NEON, '#1aa7c0');
    for (let r = 0; r < 4; r++) B.sym(CX - 5 + r, y + 2 + r, 1, 1, NEON, '#1aa7c0');
    B.rect(CX - 1, y + 6, 2, 2, '#e6ffff');
    B.rect(CX - 3, y + 10, 2, 1, NEON); B.rect(CX + 1, y + 10, 2, 1, '#1aa7c0');
    B.sym(xL, y + 9, G.aw - 1, 1, NEON, '#1aa7c0'); B.rect(CX - 1, y - 1, 2, 1, m.h);
    B.rect(CX - thw(G, 13), y + 13, thw(G, 13) * 2, 1, m.d);
  },
  gold(K) {
    const { B, G } = K, m = C.gold, y = G.ty, xL = CX - G.tw - G.aw;
    torso(K, m); arms(K, m, 14);
    B.rect(CX - 5, y + 1, 4, 4, m.h); B.rect(CX + 1, y + 1, 4, 4, m.b); B.rect(CX - 5, y + 5, 10, 1, m.d);
    B.rect(CX - 1, y + 2, 2, 2, '#e23b4e'); B.px(CX - 1, y + 2, '#ff9aa6');
    for (const r of [8, 11]) B.rect(CX - 4, y + r, 8, 1, m.d);
    B.rect(CX, y + 6, 1, 8, m.d);
    B.sym(xL - 1, y - 2, G.aw + 2, 4, m.b, m.s); B.sym(xL - 1, y - 2, G.aw + 2, 1, m.h, m.b); B.sym(xL - 1, y + 1, G.aw + 2, 1, m.d);
    for (const x of [xL, CX + G.tw]) { B.rect(x, y + 10, G.aw, 3, m.h); B.rect(x, y + 12, G.aw, 1, m.d); }
    B.rect(CX - 2, y - 1, 4, 1, m.s);
  },
  suit(K) {
    const { B, G } = K, m = M('#27304a'), y = G.ty, xL = CX - G.tw - G.aw;
    torso(K, m); arms(K, m, 14);
    for (let r = 0; r < 7; r++) { const w = Math.max(1, 3 - Math.floor(r / 2)); B.rect(CX - w, y + r, w * 2, 1, C.white.b); B.px(CX - w - 1, y + r, m.h); B.px(CX + w, y + r, m.d); }
    B.rect(CX - 1, y + 1, 2, 6, '#b8262f'); B.px(CX - 1, y + 1, '#e0525a'); B.rect(CX - 1, y, 2, 1, '#8a1c23');
    B.px(CX + 1, y + 9, m.h); B.px(CX + 1, y + 12, m.h); B.rect(CX, y + 7, 1, 9, m.d);
    B.rect(CX - 5, y + 4, 2, 1, C.white.b);
    B.rect(xL + (G.aw > 3 ? 1 : 0), y + 13, G.aw - (G.aw > 3 ? 1 : 0), 1, C.white.b); B.rect(CX + G.tw, y + 13, G.aw - (G.aw > 3 ? 1 : 0), 1, C.white.s);
    B.rect(CX - 3, y - 1, 6, 1, C.white.s);
  },
  turtleneck(K) {
    const { B, G } = K, m = M('#1e1e25'), y = G.ty;
    torso(K, m); arms(K, m, 14);
    B.rect(CX - 3, y - 2, 6, 3, m.b); B.rect(CX - 3, y - 2, 6, 1, m.h); B.rect(CX + 1, y - 2, 2, 3, m.s);
    for (const r of [4, 8, 12]) B.rect(CX - 3, y + r, 5, 1, m.s);
  },
  labcoat(K) {
    const { B, G } = K, m = M('#eef0f5'), y = G.ty;
    torso(K, m); arms(K, m, 14);
    B.rect(CX - 2, y, 4, 8, '#4a78f5'); B.rect(CX, y, 2, 8, '#3559c0'); B.rect(CX - 1, y, 2, 1, K.S.s);
    for (let r = 0; r < 8; r++) { B.px(CX - 3, y + r, m.s); B.px(CX + 2, y + r, m.d); }
    B.rect(CX, y + 8, 1, 8, m.d); B.px(CX - 2, y + 10, '#8e93a8'); B.px(CX - 2, y + 13, '#8e93a8');
    B.rect(CX + 2, y + 10, 4, 3, m.s); B.rect(CX + 2, y + 10, 4, 1, m.d);
    B.px(CX - 5, y + 3, '#d8323c'); B.px(CX - 4, y + 3, '#17171d'); B.rect(CX - 6, y + 4, 3, 1, m.s);
    // coat tails over the hips
    const lw = K.lw;
    B.rect(CX - 1 - lw, 43, lw, 9, m.b); B.rect(CX + 1, 43, lw, 9, m.b); B.rect(CX - 1 - lw, 43, 1, 9, m.h); B.rect(CX + lw, 43, 1, 9, m.s);
    B.rect(CX - 1 - lw, 51, lw, 1, m.s); B.rect(CX + 1, 51, lw, 1, m.d);
  },
  vc_vest(K) {
    const { B, G } = K, sh = M('#a9c4ee'), v = M('#3d4458'), y = G.ty;
    torso(K, v); arms(K, sh, 14);
    B.rect(CX - 2, y, 4, 2, sh.b); B.rect(CX - 3, y - 1, 6, 1, sh.h); B.rect(CX - 1, y, 2, 1, K.S.s);
    B.rect(CX, y + 2, 1, 14, v.d); B.rect(CX + 2, y + 4, 3, 2, '#e9e9ee'); B.px(CX + 3, y + 4, v.b);
    B.rect(CX - 5, y + 11, 3, 1, v.d); B.rect(CX + 2, y + 11, 3, 1, v.d);
    for (let r = 0; r < 16; r++) { B.px(CX - thw(G, r), y + r, v.h); }
  },
  pi_tee(K) {
    const { B, G, S } = K, m = C.white, y = G.ty, ink = '#17171d';
    torso(K, m); arms(K, m, 5); B.rect(CX - 2, y, 4, 1, S.s);
    B.rect(CX - 4, y + 4, 8, 1, ink); B.px(CX - 4, y + 5, ink);
    B.rect(CX - 2, y + 5, 1, 5, ink); B.px(CX - 3, y + 9, ink);
    B.rect(CX + 1, y + 5, 1, 5, ink); B.px(CX + 2, y + 9, ink);
  },
  hivis(K) {
    const { B, G } = K, base = M('#5b5f6b'), v = M('#ff7a1a'), y = G.ty, tape = '#e8f0c8';
    torso(K, v); arms(K, base, 14);
    B.rect(CX - 2, y, 4, 3, base.b); B.rect(CX - 1, y + 3, 2, 1, base.b); B.rect(CX, y + 4, 1, 12, v.d);
    for (const r of [7, 11]) { const hw = thw(G, r); B.rect(CX - hw, y + r, hw * 2, 1, tape); }
    B.rect(CX - 4, y, 1, 7, tape); B.rect(CX + 3, y, 1, 7, tape);
  },
  // ---- 2.0 ----
  crop(K) {
    const { B, G, S } = K, m = M('#b48cff'), y = G.ty;
    torso(K, S); arms(K, m, 5);
    for (let r = 0; r < 10; r++) { const hw = thw(G, r); B.rect(CX - hw, y + r, hw * 2, 1, r === 9 ? m.s : m.b); B.px(CX - hw, y + r, m.h); B.rect(CX + hw - 2, y + r, 2, 1, m.s); }
    B.rect(CX - 2, y, 4, 1, S.s); B.px(CX, y + 13, S.s); B.rect(CX - 3, y + 4, 2, 1, m.h);
  },
  sport_bra(K) { sportsTop(K, M('#22c4a4')); },
  sweater(K) { // oversize knit: no waist, longer hem, sleeves over the hands
    const { B, G, S } = K, m = M('#e3d2b4'), y = G.ty;
    for (let r = 0; r < 18; r++) { const yy = y + r, hw = G.tw; B.rect(CX - hw, yy, hw * 2, 1, r >= 16 ? m.s : m.b); B.px(CX - hw, yy, m.h); B.rect(CX + hw - 2, yy, 2, 1, m.s); }
    arms(K, m, 15);
    B.rect(CX - 3, y - 1, 6, 1, m.h); B.rect(CX - 2, y, 4, 1, S.s);
    for (let r = 3; r < 15; r += 3) for (let x = CX - G.tw + 2; x < CX + G.tw - 2; x += 3) B.px(x + (r % 2), y + r, m.s);
    B.rect(CX - G.tw, y + 17, G.tw * 2, 1, m.d);
  },
  blouse(K) {
    const { B, G, S } = K, m = M('#f2f0ec'), y = G.ty;
    torso(K, m); arms(K, m, 13);
    B.rect(CX, y + 3, 1, 13, m.s); B.rect(CX - 1, y, 2, 2, S.b); B.px(CX, y + 2, S.s);
    B.pts([[CX - 4, y], [CX - 3, y], [CX - 3, y + 1], [CX - 2, y + 2]], m.s); B.pts([[CX + 3, y], [CX + 2, y], [CX + 2, y + 1], [CX + 1, y + 2]], m.d);
    for (const r of [4, 7, 10, 13]) B.px(CX, y + r, '#b9b3a6');
  },
  cardigan(K) {
    const { B, G, S } = K, m = M('#7d9b84'), t = C.white, y = G.ty;
    torso(K, m); arms(K, m, 14);
    B.rect(CX - 2, y, 4, 16, t.b); B.rect(CX + 1, y, 1, 16, t.s); B.rect(CX - 1, y, 2, 1, S.s);
    B.rect(CX - 3, y, 1, 16, m.s); B.rect(CX + 2, y, 1, 16, m.d);
    for (const r of [3, 7, 11]) B.px(CX - 3, y + r, '#e6dcc6');
    const hw = thw(G, 15); B.rect(CX - hw, y + 14, hw - 3, 2, m.s); B.rect(CX + 3, y + 14, hw - 3, 2, m.d);
  },
  denim(K) {
    const { B, G } = K, m = C.denim, y = G.ty;
    torso(K, m); arms(K, m, 14);
    B.rect(CX - 2, y, 4, 16, '#22222a'); B.rect(CX - 3, y, 1, 16, m.s); B.rect(CX + 2, y, 1, 16, m.d);
    B.sym(CX - 5, y - 1, 3, 2, m.h, m.b); B.sym(CX - 5, y + 3, 2, 2, m.s, m.d); B.sym(CX - 5, y + 3, 2, 1, m.h, m.s);
    for (const r of [6, 10]) B.px(CX - 3, y + r, '#c9c9d2');
    const hw = thw(G, 15); B.rect(CX - hw, y + 14, hw * 2, 2, m.s); B.rect(CX - hw, y + 15, hw * 2, 1, m.d);
  },
  dress(K) { // sundress (full: hides the bottom)
    const { B, G, S } = K, m = M('#e0526a'), y = G.ty;
    torso(K, m); arms(K, S, 0);
    for (let r = 0; r < 3; r++) { const hw = thw(G, r); B.rect(CX - hw, y + r, hw * 2, 1, S.b); }
    B.rect(CX - 4, y, 1, 3, m.b); B.rect(CX + 3, y, 1, 3, m.s); B.rect(CX - 4, y + 3, 8, 1, m.h);
    const hb = thw(G, 10); B.rect(CX - hb, y + 10, hb * 2, 1, '#f4f4f8');
    aSkirt(K, m, 10, 3);
    for (const [dx, dy] of [[-4, 46], [1, 45], [4, 48], [-2, 50], [3, 51], [-6, 49]]) B.px(CX + dx, dy, '#ffd0d8');
  },
  gown(K) { // evening gown, floor length
    const { B, G, S } = K, m = M('#3a1f5c'), y = G.ty;
    torso(K, m); arms(K, S, 0);
    for (let r = 0; r < 3; r++) { const hw = thw(G, r); B.rect(CX - hw, y + r, hw * 2, 1, S.b); }
    B.pts([[CX - 2, y], [CX - 1, y + 1], [CX + 1, y], [CX, y + 1]], m.b); B.rect(CX - 3, y + 2, 6, 1, m.h);
    aSkirt(K, m, 18, 4);
    for (const [dx, dy] of [[-3, 31], [2, 34], [-1, 38], [3, 45], [-4, 49], [1, 52], [5, 55], [-2, 57]]) B.px(CX + dx, dy + (dy < 43 ? G.bob : 0), '#ffe27a');
  },
  shirtless(K) {
    const { B, G, S } = K, y = G.ty, hw = G.tw;
    torso(K, S); arms(K, S, 0);
    if (G.body === 'b') { sportsTop(K, C.black); return; } // body B: sports top + toned stomach instead of a bare chest
    B.rect(CX - hw + 1, y + 5, hw - 2, 1, S.s); B.rect(CX + 1, y + 5, hw - 2, 1, S.d);
    B.rect(CX - 1, y + 1, 2, 4, S.s); B.px(CX - 3, y + 2, S.h); B.px(CX - 4, y + 2, S.h);
    for (const r of [8, 10, 12]) { B.px(CX - 2, y + r, S.s); B.px(CX + 1, y + r, S.s); }
    B.rect(CX - 1, y + 7, 1, 7, S.s); B.px(CX - 1, y + 14, S.d);
  },
};

/* ---------- bottoms ---------- */
const BOTTOMS = {
  jeans(K) { const { B } = K, m = C.denim, L = legs(K, m, 'baggy'); B.rect(L.xL + 2, 49, 2, 3, m.h); B.rect(L.xR + 1, 50, 2, 2, m.h); B.px(L.xL + 1, 45, m.s); B.px(L.xR + 4, 45, m.d); },
  cargo(K) { const { B } = K, m = C.black, L = legs(K, m, 'baggy'); B.rect(L.xL - 1, 49, 3, 4, m.h); B.rect(L.xL - 1, 49, 3, 1, m.b); B.rect(L.xR + 4, 49, 3, 4, m.s); B.rect(L.xR + 4, 49, 3, 1, m.d); B.rect(CX - 2, 43, 4, 1, '#8a8a96'); },
  joggers(K) { const { B } = K, m = C.jog, L = legs(K, m, 'slim'); B.rect(L.xL, 57, 5, 2, m.d); B.rect(L.xR, 57, 5, 2, m.d); B.px(CX - 1, 44, '#f0f0f4'); B.px(CX, 45, '#f0f0f4'); },
  shorts(K) { const { B } = K, m = C.black, L = legs(K, m, 'shorts'); B.rect(L.xL, 44, 1, 6, '#e9e9ee'); B.rect(L.xR + 4, 44, 1, 6, '#c9c9d2'); },
  gi_pants(K) { legs(K, C.cream, 'baggy'); },
  suit_pants(K) { const { B } = K, m = M('#27304a'), L = legs(K, m, 'slim'); B.rect(L.xL + 2, 47, 1, 12, m.h); B.rect(L.xR + 2, 47, 1, 12, m.h); B.rect(CX - 1, 43, 2, 1, '#8e93a8'); },
  track_pants(K) { const { B } = K, L = legs(K, C.black, 'slim'); B.rect(L.xL, 44, 1, 15, '#f4f4f8'); B.rect(L.xR + 4, 44, 1, 15, '#c9c9d2'); },
  cyber_legs(K) { const { B } = K, m = C.steel, L = legs(K, m, 'slim'); for (const x of [L.xL, L.xR]) { B.rect(x, 49, 5, 3, m.h); B.rect(x + 1, 50, 3, 1, NEON); B.rect(x + 2, 54, 1, 4, '#1aa7c0'); } },
  gold_legs(K) { const { B } = K, m = C.gold, L = legs(K, m, 'slim'); for (const x of [L.xL, L.xR]) { B.rect(x, 49, 5, 3, m.h); B.rect(x, 51, 5, 1, m.d); B.rect(x, 55, 5, 1, m.d); } B.rect(L.xL, 43, 12, 1, m.d); B.rect(CX - 1, 44, 2, 2, '#e23b4e'); },
  // ---- 2.0 ----
  skirt(K) { const { B } = K, m = M('#2f3a66'); legs(K, K.S, 'slim'); aSkirt(K, m, 11, 3); for (const dx of [-4, -1, 2]) B.rect(CX + dx, 45, 1, 9, m.s); B.rect(CX - 6, 43, 12, 1, m.d); },
  mini(K) { const { B } = K, m = C.black; legs(K, K.S, 'slim'); aSkirt(K, m, 6, 1); B.rect(CX - 6, 43, 12, 1, m.d); B.px(CX + 3, 44, '#c9c9d2'); },
  leggings(K) { const { B } = K, m = M('#1c1c24'), L = legs(K, m, 'slim'); B.rect(L.xL, 44, 1, 15, m.h); B.rect(L.xR + L.lw - 1, 44, 1, 15, '#2c2c38'); },
  bike(K) {
    const { B, S } = K, m = M('#202028'), L = legs(K, m, 'slim');
    for (const x of [L.xL, L.xR]) { B.rect(x, 50, L.lw, 9, S.b); B.rect(x + L.lw - 1, 50, 1, 9, S.s); B.rect(x, 49, L.lw, 1, m.s); }
    B.rect(L.xL, 44, 1, 5, '#ff7ab0'); B.rect(L.xR + L.lw - 1, 44, 1, 5, '#c85a88');
  },
  flare(K) {
    const { B } = K, m = M('#6f8fc4'), L = legs(K, m, 'slim');
    B.rect(L.xL - 1, 54, 1, 5, m.b); B.rect(L.xR + L.lw, 54, 1, 5, m.s); B.rect(L.xL - 2, 57, 1, 2, m.b); B.rect(L.xR + L.lw + 1, 57, 1, 2, m.s);
    B.rect(L.xL + 1, 47, 1, 6, m.h); B.rect(L.xR + 1, 47, 1, 6, m.h);
  },
};

/* ---------- shoes ---------- */
const SHOES = {
  kicks_white: K => shoes(K, C.white, '#a9a9b4'),
  boots: K => { shoes(K, C.leather, '#0d0d12', 2); K.B.rect(CX - 1 - K.lw, 57, K.lw, 1, '#4a4a57'); K.B.rect(CX + 1, 57, K.lw, 1, '#3a3a45'); },
  kicks_red: K => { shoes(K, M('#d8323c'), '#f4f4f8'); K.B.px(CX - K.lw, 60, '#fff'); K.B.px(CX + 3, 60, '#fff'); },
  kicks_neon: K => shoes(K, C.steel, NEON),
  gold_boots: K => shoes(K, C.gold, '#8a6a14', 2),
  // ---- 2.0 ----
  kedy: K => { shoes(K, M('#2b2b35'), '#f4f4f8', 1); const { B } = K; B.px(CX - K.lw, 59, '#f4f4f8'); B.px(CX + 3, 59, '#f4f4f8'); B.rect(CX - 2 - K.lw, 61, 2, 1, '#f4f4f8'); B.rect(CX + K.lw, 61, 2, 1, '#f4f4f8'); },
  heels: K => { shoes(K, M('#b8262f'), '#5a0f15'); const { B } = K; B.clr(CX - K.lw + 1, 62); B.clr(CX + 2, 62); B.px(CX - K.lw, 60, '#ff7a86'); B.px(CX + 2, 60, '#ff7a86'); },
  ankle: K => { shoes(K, M('#6b4a2b'), '#2a1a10', 2); const { B } = K; B.clr(CX - K.lw + 1, 62); B.clr(CX + 2, 62); B.rect(CX - 1 - K.lw, 57, K.lw, 1, '#8a6a4a'); B.rect(CX + 1, 57, K.lw, 1, '#5a3a20'); },
  cowboy: K => {
    shoes(K, M('#8a5a2b'), '#3a2412', 3); const { B } = K;
    B.px(CX - 2 - K.lw, 61, '#8a5a2b'); B.px(CX + K.lw + 1, 61, '#6b4220'); B.rect(CX - K.lw, 57, 3, 1, '#c99a5a'); B.rect(CX + 2, 57, 3, 1, '#a07840');
  },
};

/* ---------- back items (drawn first, behind the body) ---------- */
function wing(K, m, tip) {
  const { B, G } = K, y0 = 16 - G.bob;
  const rows = [[6, 9], [5, 12], [4, 15], [4, 18], [4, 20], [5, 22], [5, 24], [6, 26], [6, 26], [7, 26], [7, 26], [8, 26], [8, 26], [9, 26], [9, 26], [10, 26], [11, 26], [12, 26], [13, 26], [15, 26], [17, 26], [19, 26], [21, 26]];
  rows.forEach(([a, b], r) => {
    const y = y0 + r;
    for (let x = a; x <= b; x++) {
      let c = m.b;
      if (r > 5 && (x + r * 2) % 5 === 0) c = m.s;
      if (x === a || (r < 6 && x < a + 2)) c = r < 8 ? m.h : tip;
      B.px(x, y, c); B.px(SW - 1 - x, y, c === m.h ? m.b : c);
    }
  });
}
const BACKS = {
  cape(K) {
    const { B, G } = K, m = C.red, y0 = G.ty - 1;
    for (let r = 0; r < 31; r++) {
      const hw = G.tw + G.aw - 1 + Math.floor(r / 6), y = y0 + r;
      if (r === 30) { for (let x = CX - hw; x < CX + hw; x++) if ((x + G.bob) % 4 < 2) B.px(x, y, m.s); continue; }
      B.rect(CX - hw, y, hw * 2, 1, m.b);
      for (let x = CX - hw + 2; x < CX + hw; x += 4) B.px(x, y, m.s);
      B.px(CX - hw, y, m.h); B.rect(CX + hw - 2, y, 2, 1, m.d);
    }
  },
  katana(K) {
    const { B, G } = K, d = G.bob;
    for (let t = 0; t < 36; t++) {
      const x = 15 + t, y = 12 + t + d;
      const c = t < 7 ? (t % 2 ? '#22222a' : '#b8262f') : t < 9 ? '#e2b33c' : '#d9dce8';
      B.px(x, y, c); B.px(x + 1, y, t < 7 ? '#17171c' : t < 9 ? '#a8801e' : '#8e93a8');
      if (t >= 7 && t < 9) { B.px(x - 1, y + 1, '#e2b33c'); B.px(x + 2, y - 1, '#a8801e'); }
    }
  },
  wings(K) { wing(K, M('#f2f4ff'), '#b9c2e0'); },
  wings_dark(K) { wing(K, M('#3a2038'), '#c0283a'); },
  barbell(K) {
    const { B, G } = K, y = G.ty - 2;
    B.rect(6, y, 52, 2, '#a5a8b5'); B.rect(6, y + 1, 52, 1, '#6d7080');
    B.sym(7, y - 6, 3, 14, '#1c1c22', '#141418'); B.sym(7, y - 6, 1, 14, '#3d3d48', '#26262e');
    B.sym(10, y - 4, 2, 10, '#b8262f', '#8a1c23'); B.sym(5, y - 1, 2, 4, '#a5a8b5', '#6d7080');
  },
  // ---- 2.0 ----
  backpack(K) { const { B, G } = K, m = M('#e2b33c'), y = G.ty - 3; B.rect(CX - 6, y, 12, 14, m.b); B.rect(CX - 6, y, 12, 1, m.h); B.rect(CX + 4, y, 2, 14, m.s); B.rect(CX - 1, y, 2, 2, '#6b4a2b'); },
  guitar(K) {
    const { B, G } = K, d = G.bob, wood = M('#c07a3a');
    for (let t = 0; t < 26; t++) { const x = 17 + t, y = 9 + Math.round(t * 1.25) + d; B.px(x, y, '#5a3a20'); B.px(x + 1, y, '#3a2412'); }
    B.rect(15, 6 + d, 3, 4, '#3a2412'); B.pts([[14, 7 + d], [14, 9 + d], [18, 7 + d]], '#d9dce8');
    const cx = 44, cy = 44 + d;
    for (let r = -6; r <= 6; r++) { const hw = Math.round(Math.sqrt(36 - r * r) * 1.1) + (r > 0 ? 1 : 0); B.rect(cx - hw, cy + r, hw * 2, 1, r < -3 ? wood.h : r > 3 ? wood.s : wood.b); }
    B.rect(cx - 1, cy - 1, 3, 3, '#2a1a10'); B.rect(cx - 3, cy + 3, 6, 1, '#3a2412');
  },
  yoga_mat(K) {
    const { B, G } = K, m = M('#8a5cd6'), y = G.ty - 9 + G.bob;
    B.rect(39, y, 4, 22, m.b); B.rect(42, y, 1, 22, m.s); B.rect(39, y, 1, 22, m.h);
    B.rect(39, y - 1, 4, 2, m.h); B.px(40, y, m.d); B.px(41, y - 1, m.s); B.rect(39, y + 6, 4, 1, '#2b2b35'); B.rect(39, y + 15, 4, 1, '#2b2b35');
  },
};
// front parts of back items (straps), drawn over the top
const BACK_FRONT = {
  backpack(K) { const { B, G } = K, y = G.ty, s = '#6b4a2b'; for (const x of [CX - 4, CX + 2]) { B.rect(x, y, 2, 11, s); B.px(x, y + 7, '#e2b33c'); } },
  guitar(K) { const { B, G } = K; for (let r = 0; r < 16; r++) B.px(CX - G.tw + 1 + Math.round(r * (2 * G.tw - 3) / 15), G.ty + r, '#3a2412'); },
};

/* ---------- held items (viewer's right hand) ---------- */
const HANDS = {
  briefcase(K) {
    const { B, G } = K, x = CX + G.tw - 2, y = G.ty + 17, m = M('#6b4a2b');
    B.rect(x + 2, y - 1, 4, 1, m.d); B.rect(x, y, 8, 6, m.b); B.rect(x, y, 8, 1, m.h); B.rect(x + 6, y, 2, 6, m.s); B.rect(x, y + 5, 8, 1, m.s);
    B.rect(x + 3, y + 2, 2, 1, '#e2b33c');
  },
  laptop(K) {
    const { B, G } = K, x = CX + G.tw + G.aw - 2, y = G.ty + 8, m = M('#aeb3c2');
    B.rect(x, y, 6, 8, m.b); B.rect(x, y, 6, 1, m.h); B.rect(x + 4, y, 2, 8, m.s); B.rect(x + 2, y + 3, 2, 2, '#f4f4f8');
  },
  coffee(K) {
    const { B, G } = K, x = CX + G.tw + G.aw - 1, y = G.ty + 12;
    B.rect(x, y, 4, 5, '#f1f1f3'); B.rect(x, y, 4, 1, '#6b4a2b'); B.rect(x + 3, y + 1, 1, 4, '#c9c9d2'); B.rect(x, y + 2, 4, 2, '#8a6a4a'); B.px(x + 1, y + 2, '#3ddc84');
  },
  wrench(K) {
    const { B, G } = K, x = CX + G.tw + G.aw - 1, y = G.ty + 4, m = M('#aeb3c2');
    B.rect(x, y + 3, 2, 12, m.b); B.rect(x + 1, y + 3, 1, 12, m.s);
    B.rect(x - 1, y, 4, 3, m.b); B.clr(x, y, 2, 1); B.px(x - 1, y, m.h); B.px(x + 2, y + 1, m.s);
  },
  moneybag(K) {
    const { B, G } = K, x = CX + G.tw - 1, y = G.ty + 16, m = M('#b8935a'), g = '#1f6b3a';
    B.rect(x + 2, y, 3, 1, m.d); B.rect(x + 1, y + 1, 5, 1, m.b); B.rect(x, y + 2, 7, 5, m.b); B.rect(x + 5, y + 2, 2, 5, m.s); B.rect(x, y + 6, 7, 1, m.s); B.px(x, y + 2, m.h);
    B.rect(x + 3, y + 2, 1, 5, g); B.rect(x + 2, y + 3, 3, 1, g); B.rect(x + 2, y + 5, 3, 1, g); B.px(x + 2, y + 4, m.b);
  },
  calculator(K) {
    const { B, G } = K, x = CX + G.tw + G.aw - 2, y = G.ty + 10;
    B.rect(x, y, 5, 8, '#2b2b35'); B.rect(x + 4, y, 1, 8, '#1a1a22'); B.rect(x + 1, y + 1, 3, 2, '#9ff5a8');
    for (const r of [4, 6]) { B.px(x + 1, y + r, '#d9dce8'); B.px(x + 3, y + r, '#d9dce8'); }
    B.px(x + 3, y + 6, '#ff7a1a');
  },
  // ---- 2.0 ----
  phone(K) { const { B, G } = K, x = CX + G.tw + G.aw - 1, y = G.ty + 12; B.rect(x, y, 3, 5, '#17171d'); B.rect(x, y + 1, 2, 3, '#7ecbff'); B.px(x, y + 1, '#e6f6ff'); },
  matcha(K) {
    const { B, G } = K, x = CX + G.tw + G.aw - 1, y = G.ty + 11;
    B.rect(x, y + 1, 4, 6, '#d7ecdf'); B.rect(x, y + 3, 4, 4, '#7cc46a'); B.rect(x + 3, y + 3, 1, 4, '#5aa04c'); B.rect(x, y + 1, 4, 1, '#f4f4f8'); B.rect(x + 2, y - 2, 1, 3, '#f272ad');
  },
  book(K) { const { B, G } = K, x = CX + G.tw + G.aw - 2, y = G.ty + 10; B.rect(x, y, 5, 7, '#4a78f5'); B.rect(x, y, 1, 7, '#3559c0'); B.rect(x + 4, y + 1, 1, 5, '#f4f1e6'); B.rect(x + 1, y + 2, 2, 1, '#e2b33c'); },
  handbag(K) {
    const { B, G } = K, x = CX + G.tw - 2, y = G.ty + 16, m = M('#f272ad');
    B.pts([[x + 1, y], [x + 2, y - 1], [x + 3, y - 1], [x + 4, y - 1], [x + 5, y]], m.d);
    B.rect(x, y + 1, 7, 5, m.b); B.rect(x, y + 1, 7, 1, m.h); B.rect(x + 5, y + 1, 2, 5, m.s); B.px(x + 3, y + 3, '#ffd84a');
  },
  bouquet(K) {
    const { B, G } = K, x = CX + G.tw + G.aw - 3, y = G.ty + 6;
    B.rect(x + 2, y + 6, 1, 6, '#3ddc84'); B.rect(x + 3, y + 7, 1, 5, '#2a9a5a');
    for (let r = 0; r < 5; r++) B.rect(x + 1 + Math.floor(r / 2), y + 8 + r, 4 - Math.floor(r / 2) * 2 + 1, 1, r === 4 ? '#d9d2c0' : '#f4f1e6');
    B.pts([[x, y + 3], [x + 1, y + 2], [x + 2, y + 4]], '#ff4d5a'); B.pts([[x + 3, y + 1], [x + 4, y + 2], [x + 3, y + 3]], '#ffd84a'); B.pts([[x + 5, y + 4], [x + 4, y + 5], [x + 1, y + 5]], '#f29ab8');
    B.pts([[x + 2, y + 1], [x + 5, y + 2], [x, y + 5]], '#ffffff');
  },
};

/* ---------- pets: small companions, own 18×16 buffer ---------- */
const PETS = {
  duck(B, f) {
    const y = 5 + f, m = M('#ffd23a');
    B.rect(3, y + 4, 10, 5, m.b); B.rect(4, y + 9, 8, 1, m.s); B.rect(11, y + 4, 2, 5, m.s); B.px(2, y + 4, m.b); B.px(1, y + 3, m.b);
    B.rect(8, y, 5, 5, m.b); B.clr(8, y); B.rect(12, y + 1, 1, 3, m.s); B.px(9, y + 1, m.h);
    B.px(11, y + 1, '#17171d'); B.rect(13, y + 2, 2, 2, '#ff8a2a'); B.rect(5, y + 6, 4, 2, m.s);
  },
  cat(B, f) {
    const m = M('#2a2a33');
    B.rect(4, 9, 8, 6, m.b); B.rect(10, 9, 2, 6, m.s); B.rect(4, 4, 8, 6, m.b); B.rect(11, 5, 1, 4, m.s);
    B.pts([[4, 3], [5, 3], [4, 2], [11, 3], [10, 3], [11, 2]], m.b); B.px(5, 3, '#f08ab0');
    B.px(6, 6, '#7dff5a'); B.px(9, 6, '#7dff5a'); B.px(7, 8, '#f08ab0'); B.rect(5, 14, 2, 1, m.h); B.rect(9, 14, 2, 1, m.h);
    B.pts(f ? [[12, 13], [13, 12], [14, 11], [14, 10]] : [[12, 13], [13, 13], [14, 12], [15, 11]], m.b);
  },
  drone(B, f) {
    const m = M('#3b4058');
    B.rect(5, 6, 8, 5, m.b); B.rect(5, 6, 8, 1, m.h); B.rect(11, 6, 2, 5, m.s); B.rect(8, 8, 2, 2, NEON); B.px(8, 8, '#e6ffff');
    B.rect(2, 5, 3, 1, m.s); B.rect(13, 5, 3, 1, m.s);
    if (f) { B.rect(0, 4, 5, 1, '#d9dce8'); B.rect(13, 4, 5, 1, '#d9dce8'); } else { B.rect(1, 4, 3, 1, '#8e93a8'); B.rect(14, 4, 3, 1, '#8e93a8'); }
    B.px(6, 11, m.d); B.px(11, 11, m.d); B.px(9, 11, f ? '#ff4d5a' : '#7a1c22');
  },
  piggy(B, f) {
    const m = M('#f29ab8');
    B.rect(3, 7, 11, 6, m.b); B.rect(4, 6, 9, 1, m.b); B.rect(12, 7, 2, 6, m.s); B.rect(4, 13, 9, 1, m.s); B.rect(4, 7, 3, 1, m.h);
    B.rect(4, 14, 2, 1, m.d); B.rect(10, 14, 2, 1, m.d); B.rect(14, 9, 2, 3, m.h); B.px(15, 10, m.d);
    B.px(11, 8, '#17171d'); B.px(10, 5, m.s); B.px(11, 5, m.b); B.rect(6, 6, 3, 1, '#17171d'); B.px(2, 9, m.s);
    B.rect(7, f ? 2 : 3, 2, 2, '#ffd23a'); B.px(7, f ? 2 : 3, '#fff6c2');
  },
};
export const PW = 18, PH = 16;
export function composePet(id, f) {
  if (!PETS[id]) return null;
  const B = new Buf(PW, PH); PETS[id](B, f ? 1 : 0); outline(B, INK);
  return B;
}

function outline(B, color) {
  const src = B.d.slice(), { w, h } = B;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x;
    if (src[i]) continue;
    if ((x > 0 && src[i - 1]) || (x < w - 1 && src[i + 1]) || (y > 0 && src[i - w]) || (y < h - 1 && src[i + w])) B.d[i] = color;
  }
}

/**
 * look: { body 'a'|'b', skin, hair, hairColor, face, detail, head, top, bottom, shoes, back, build 0..3, expr 0..2, rim }
 * frame: { bob, blink }
 */
export function compose(look, frame = {}) {
  const bob = frame.bob ? 1 : 0;
  const B = new Buf(), G = geo(Math.max(0, Math.min(3, look.build || 0)), bob, look.body);
  const K = { B, G, look, blink: !!frame.blink, lw: 6, S: M(SKIN[look.skin] || SKIN.s2), H: M(HAIRC[look.hairColor] || HAIRC.black) };
  BACKS[look.back]?.(K);
  HAIR_BACK[look.hair]?.(K);
  if (FULL_TOPS.has(look.top)) legs(K, K.S, 'slim'); // dress: bare legs instead of the bottom slot
  else (BOTTOMS[look.bottom] || BOTTOMS.jeans)(K);
  (SHOES[look.shoes] || SHOES.kicks_white)(K);
  B.rect(CX - 2, G.hy + 12, 4, 4, K.S.s);
  (TOPS[look.top] || TOPS.tee_gray)(K);
  BACK_FRONT[look.back]?.(K);
  HANDS[look.hand]?.(K);
  head(K);
  DETAILS[look.detail]?.(K);
  (HAIRS[look.hair] || HAIRS.messy)(K);
  FACES[look.face]?.(K);
  HEADS[look.head]?.(K);
  outline(B, INK);
  if (look.rim) outline(B, look.rim);
  return B;
}

export function paint(ctx, buf, ox = 0, oy = 0) {
  const { w, h, d } = buf;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const c = d[y * w + x];
    if (c) { ctx.fillStyle = c; ctx.fillRect(ox + x, oy + y, 1, 1); }
  }
}
