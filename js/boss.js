// RESPAWN — boss of the month: pixel monster, lair, hit / heal / death animations and its lines.
// The arena is one long-lived object: the screen is re-rendered on every tap, the canvas and the animation state survive.

/* ---------- who you fight: a different villain every month, same body in that month's colours ---------- */
export const BOSS_NAMES = [
  'Святковий Борг', 'Лютий Податок', 'Квартальний Звіт', 'Інфляція', 'Шашличний Бюджет', 'Відпусткова Діра',
  'Спекотний Простій', 'Шкільні Витрати', 'Дедлайн', 'Підписочний Слиз', 'Чорна П\'ятниця', 'Подарунковий Дракон',
];
const HUES = [210, 265, 150, 25, 330, 190, 45, 95, 0, 285, 230, 355];
const pal = month => {
  const h = HUES[month % 12];
  return { b: `hsl(${h} 52% 40%)`, l: `hsl(${h} 62% 56%)`, d: `hsl(${h} 50% 25%)`, y: `hsl(${h} 58% 66%)` };
};

/* ---------- lines: [m|f] = he / she form, {name} {days} {need} {left} filled in ---------- */
export const LINES = {
  intro: ['Новий місяць — нові гроші. Мої.', 'Ну що, [готовий|готова] мене бити? Сумніваюсь.', 'Я — {name}. І твій гаманець теж мій.', 'Цей місяць я переживу. А ти?', '{left} HP. Удачі.'],
  idle: ['Тік-так. До кінця місяця {days} дн.', 'Тобі треба {need} на день. Смішно.', 'Знову дивишся на мене замість роботи?', 'Я нікуди не поспішаю.', 'Кава за дев\'яносто? Я ціную.', 'Б\'єш чи просто дивишся?'],
  small: ['Лоскотно.', 'Це що, здача?', 'Комариний укус.', 'І це все?', 'Ой, а я й не [помітив|помітив].'],
  mid: ['Ай! Звідки гроші?!', 'Нечесно!', 'Добре б\'єш. Для новач[ка|ки].', 'Ой. Це було відчутно.', 'Ще раз так — і я образжусь.'],
  big: ['КРИТ?! Хто тебе навчив?', 'Ти що, клієнта закри[в|ла]?!', 'Моє HP! Моє прекрасне HP!', 'Стоп-стоп, давай домовимось!', 'Оце удар!'],
  low: ['Стривай… може, поділимо?', 'Я ще повернусь наступного місяця!', 'Ще один удар — і все…', 'Мамо, забери мене звідси.', 'Лишилось {left}. Не смій.'],
  heal: ['Ха! Дякую за донат.', 'Мммм, витрати. Смачно.', 'Ще купи щось непотрібне.', 'Лікуюсь твоїми покупками.', 'Підписки — мої найкращі друзі.'],
  death: ['Неможливо… ти… закри[в|ла]… місяць…', 'Я… повернусь… першого числа…', 'Це… був… прибуток…'],
  dead: ['Я вже мертвий, досить!', 'Лежачого не б\'ють!', 'Все-все, здаюсь. До наступного місяця.', 'Оверкіл? Серйозно?'],
  deadHeal: ['Я мертвий, але за донат дякую.', 'Витрачай, витрачай. Мені вже все одно.'],
  sleep: ['Хррр… Постав ціль — і я прокинусь.', 'Zzz… (ціль прибутку не задана)'],
};
const pick = a => a[Math.floor(Math.random() * a.length)];

/* ---------- sprite: 48×46 role buffer → colours per frame, auto outline ---------- */
const BW = 48, BH = 46, CX = 24;
function body(face) {
  const B = Array.from({ length: BH }, () => Array(BW).fill(null));
  const set = (x, y, r) => { if (x >= 0 && y >= 0 && x < BW && y < BH) B[y][x] = r; };
  // horns first (body overlaps their roots)
  for (const s of [-1, 1]) for (let i = 0; i < 11; i++) {
    const x = CX + s * (11 + Math.round(i * 0.45 + i * i * 0.035)), y = 15 - i, w = i < 4 ? 3 : i < 8 ? 2 : 1;
    for (let k = 0; k < w; k++) set(x + s * k, y, i > 8 ? 'k' : k === w - 1 ? 'h' : 'H');
  }
  // egg body, flat base
  for (let y = 12; y <= 41; y++) {
    const hw = Math.floor(18 * Math.sqrt(Math.max(0, 1 - ((y - 28) / 16.5) ** 2)));
    for (let x = CX - hw; x < CX + hw; x++) {
      const dx = x - CX + 0.5, belly = ((dx / 9.5) ** 2 + ((y - 34) / 6.5) ** 2) < 1;
      set(x, y, belly ? 'y' : (dx < -hw * 0.35 && y < 25) ? 'l' : (y > 37 || dx > hw * 0.62) ? 'd' : 'b');
    }
  }
  for (const x0 of [13, 29]) for (let y = 41; y <= 43; y++) for (let x = x0; x < x0 + 6; x++) set(x, y, 'd'); // feet
  // gold chain + coin medallion
  for (let x = 12; x <= 35; x += 2) set(x, 33 + Math.round((1 - ((x - 23.5) / 12) ** 2) * 3), 'g'); // hangs lowest in the middle
  for (let y = 36; y <= 40; y++) for (let x = 22; x <= 26; x++) if (!((y === 36 || y === 40) && (x === 22 || x === 26))) set(x, y, x === 24 && y === 38 ? 'G' : 'g');
  // brows
  const brow = face.dead ? 0 : face.low ? -1 : 1; // angry slants down to the middle, worried slants up
  for (const s of [-1, 1]) for (let i = 0; i < 7; i++) set(CX + s * (10 - i) - (s > 0 ? 1 : 0), 20 + (brow > 0 ? Math.floor(i / 3) : brow < 0 ? 2 - Math.floor(i / 3) : 1), 'r');
  // eyes
  for (const s of [-1, 1]) {
    const ex = s < 0 ? 15 : 27; // 6 wide, 4 tall: x ex..ex+5, y 22..25
    if (face.dead) { for (let i = 0; i < 5; i++) { set(ex + i, 22 + i, 'r'); set(ex + 4 - i, 22 + i, 'r'); } }
    else if (face.hurt) { for (let i = 0; i < 3; i++) { set(ex + (s < 0 ? i : 4 - i) + 1, 22 + i, 'r'); set(ex + (s < 0 ? i : 4 - i) + 1, 26 - i, 'r'); } }
    else if (face.blink || face.sleep) for (let x = ex; x < ex + 6; x++) set(x, 24, 'r');
    else {
      for (let y = 22; y < 26; y++) for (let x = ex; x < ex + 6; x++) set(x, y, (y === 22 || y === 25) && (x === ex || x === ex + 5) ? null : 'E');
      set(ex + 1, 23, 'W'); set(ex + 2, 23, 'W');
      const px = ex + (s < 0 ? 3 : 2); set(px, 23, 'p'); set(px, 24, 'p'); set(px + 1, 23, 'p'); set(px + 1, 24, 'p');
    }
  }
  // mouth: wide toothy grin; open wider while talking / hurt
  const open = face.dead ? 1 : face.talk || face.hurt ? 2 : 0;
  for (let x = 16; x <= 31; x++) {
    const mid = 1 - Math.abs(x - 23.5) / 8, bot = 29 + Math.round(mid * (2 + open));
    for (let y = 29; y <= bot; y++) set(x, y, 'm');
    if (!face.sleep && x % 2 === 0 && x > 16 && x < 31) set(x, 29, 't');
  }
  if (!face.sleep && !face.dead) { set(18, 30, 't'); set(18, 31, 't'); set(29, 30, 't'); set(29, 31, 't'); } // fangs
  if (face.dead) { set(23, 31, 'n'); set(24, 31, 'n'); set(23, 32, 'n'); set(24, 32, 'n'); set(24, 33, 'n'); } // tongue out
  if (face.low && !face.dead) { set(34, 17, 'S'); set(34, 18, 'S'); set(33, 18, 'S'); } // sweat
  // outline
  const O = B.map(r => r.slice());
  for (let y = 0; y < BH; y++) for (let x = 0; x < BW; x++) if (!B[y][x] && ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => B[y + b]?.[x + a]))) O[y][x] = 'o';
  return O;
}
const GREY = { b: '#5d5a63', l: '#7a7781', d: '#3d3b42', y: '#8a8790' };
function colors(month, mode) {
  const p = mode === 'dead' ? GREY : pal(month);
  return {
    ...p, H: '#e9dfc6', h: '#b9aa8a', k: '#6b5a44', E: mode === 'dead' ? '#8a8790' : '#ffe066', W: '#ffffff', p: '#16060c', r: '#16060c',
    m: '#2a0a14', t: '#f6f1e4', g: '#f2c14e', G: '#9c6a1c', n: '#ff7a9a', S: '#8fd3ff', o: mode === 'heal' ? '#37d67a' : '#0b0610',
  };
}
const cache = new Map();
function bossCanvas(month, face, mode) {
  const key = `${month}|${JSON.stringify(face)}|${mode}`;
  let cv = cache.get(key);
  if (cv) return cv;
  if (cache.size > 120) cache.clear();
  const roles = body(face), C = colors(month, mode);
  cv = document.createElement('canvas'); cv.width = BW; cv.height = BH;
  const c = cv.getContext('2d');
  for (let y = 0; y < BH; y++) for (let x = 0; x < BW; x++) {
    const r = roles[y][x]; if (!r) continue;
    c.fillStyle = mode === 'flash' && r !== 'o' ? '#ffffff' : C[r]; c.fillRect(x, y, 1, 1);
  }
  cache.set(key, cv);
  return cv;
}

// small still of this month's boss for cards
export function bossThumb(month, dead) { return bossCanvas(month, { blink: false, talk: false, hurt: false, dead, sleep: false, low: false }, dead ? 'dead' : 'normal'); }
const copy = src => { const cv = document.createElement('canvas'); cv.width = src.width; cv.height = src.height; cv.getContext('2d').drawImage(src, 0, 0); return cv; };
export const bossIcon = (month, dead) => copy(bossThumb(month, dead));

/* ---------- the arena ---------- */
const W = 96, H = 72, FY = 62, MID = W / 2;
const rnd = i => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
export class BossArena {
  constructor() {
    this.cv = document.createElement('canvas'); this.cv.width = W; this.cv.height = H; this.cv.className = 'stage-cv';
    this.c = this.cv.getContext('2d'); this.c.imageSmoothingEnabled = false;
    this.t = 0; this.parts = []; this.key = null;
    this.hurt = 0; this.heal = 0; this.dying = 0; this.poke = 0;
    this.say = ''; this.sayUntil = 0; this.onTick = null;
    let last = 0;
    const loop = ts => { if (ts - last > 82) { last = ts; if (this.cv.isConnected) this.tick(); } requestAnimationFrame(loop); };
    if (typeof requestAnimationFrame !== 'undefined') requestAnimationFrame(loop);
  }
  // fresh look at a month: no animation, bars where they are
  open(st, month) {
    this.key = `${st.m}|${st.goal}`; this.month = month;
    this.goal = st.goal; this.hp = this.shown = this.ghost = st.hp; this.hold = 0;
    this.dead = st.dead; this.dying = 0; this.hurt = this.heal = this.poke = 0; this.parts = [];
  }
  // every re-render: new target HP; a kill seen here starts the death animation
  sync(st, month) {
    if (this.key !== `${st.m}|${st.goal}`) return this.open(st, month);
    if (st.hp !== this.hp) { if (st.hp < this.hp) this.hold = 6; this.hp = st.hp; }
    if (st.dead && !this.dead && !this.dying) this.dying = 26;
  }
  talk(text, ms = 3200) { this.say = text; this.sayUntil = Date.now() + ms; }
  hit(frac) { this.hurt = 8; if (frac >= 0.2) this.burst(18); else if (frac >= 0.03) this.burst(8); }
  healed() { this.heal = 12; }
  poked() { this.poke = 5; }
  burst(n) { for (let i = 0; i < n; i++) this.parts.push({ x: MID + (Math.random() - 0.5) * 20, y: FY - 30, vx: (Math.random() - 0.5) * 4, vy: -2 - Math.random() * 3, l: 0, m: 40, coin: true }); }
  // where the boss's head is on screen (for floating numbers)
  point() {
    const r = this.cv.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height * ((FY - 34) / H) };
  }
  tick() {
    this.t++;
    const t = this.t;
    // bars: the red fill follows fast, the pale "ghost" waits a beat and then drains slowly
    this.shown += (this.hp - this.shown) * 0.35; if (Math.abs(this.hp - this.shown) < this.goal / 2000) this.shown = this.hp;
    if (this.hp > this.ghost) this.ghost = this.shown;
    else if (this.hold > 0) this.hold--;
    else { this.ghost += (this.shown - this.ghost) * 0.15; if (Math.abs(this.ghost - this.shown) < this.goal / 2000) this.ghost = this.shown; }
    if (this.hurt) this.hurt--; if (this.heal) this.heal--; if (this.poke) this.poke--;
    if (this.dying) { this.dying--; if (this.dying === 6) this.burst(40); if (!this.dying) this.dead = true; }
    this.draw();
    this.onTick?.(this);
  }
  draw() {
    const { c, t } = this, R = (x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
    // lair: dark wall with bricks, two torches, coin piles, floor
    for (let y = 0; y < FY; y++) R(0, y, W, 1, `rgb(${18 + y * 0.18 | 0},${6 + y * 0.04 | 0},${16 + y * 0.1 | 0})`);
    for (let r = 0; r < 6; r++) for (let i = 0; i < 8; i++) { const x = i * 16 - (r % 2) * 8, y = 6 + r * 11; R(x, y, 15, 1, 'rgba(0,0,0,.25)'); R(x + 15, y - 10, 1, 11, 'rgba(0,0,0,.18)'); }
    for (const tx of [9, W - 9]) {
      R(tx - 1, 24, 3, 10, '#3a2418'); R(tx - 2, 23, 5, 2, '#5a3a24');
      const f = (t + tx) % 4;
      R(tx - 2, 18 - (f > 1 ? 1 : 0), 5, 5, '#ff8a2a'); R(tx - 1, 16 - f % 2, 3, 4, '#ffd24a'); R(tx, 17, 1, 2, '#fff6c2');
      for (let k = 0; k < 3; k++) R(tx - 9 + k * 3, 12 + k, 18 - k * 6, 1, 'rgba(255,140,40,.05)');
    }
    for (const [x0, w] of [[0, 22], [W - 22, 22]]) for (let i = 0; i < w; i++) {
      const h = Math.round(6 * Math.sin((i / w) * Math.PI)) + (rnd(i + x0) > 0.7 ? 1 : 0);
      R(x0 + i, FY - h, 1, h, i % 3 ? '#c9952e' : '#f2c14e'); if (rnd(i * 3 + x0) > 0.8) R(x0 + i, FY - h, 1, 1, '#fff2b0');
    }
    R(0, FY, W, H - FY, '#1a0c14'); R(0, FY, W, 1, '#3a1626');
    for (let i = 0; i < 18; i++) R(Math.floor(rnd(i + 70) * W), FY + 3 + Math.floor(rnd(i + 90) * (H - FY - 4)), 3, 1, '#24101b');
    // boss
    const asleep = !this.goal, dead = this.dead && !this.dying, dyingNow = this.dying > 0;
    const shake = this.hurt ? [0, -3, 3, -2, 2, -1, 1, 0, 0][this.hurt] : dyingNow && this.dying > 6 ? (t % 2 ? 2 : -2) : this.poke ? (this.poke % 2 ? 1 : -1) : 0;
    const bob = asleep || dead ? 0 : Math.floor(t / 6) % 2;
    const ox = MID - 24 + shake, oy = FY - 43 + bob + (dead ? 3 : 0);
    R(ox + 9, FY + 1, 30, 2, 'rgba(0,0,0,.45)');
    const low = this.goal && !dead && this.hp / this.goal < 0.25;
    const face = { blink: t % 52 < 2, talk: Date.now() < this.sayUntil && Math.floor(t / 2) % 2 === 0, hurt: this.hurt > 0 || dyingNow, dead, sleep: asleep, low };
    const mode = dead ? 'dead' : (this.hurt > 6 || (dyingNow && t % 2)) ? 'flash' : this.heal % 4 > 1 ? 'heal' : 'normal';
    if (!(dyingNow && this.dying <= 6)) c.drawImage(bossCanvas(this.month, face, mode), ox, oy);
    // particles: coins (gravity, bounce), heal pluses, sleepy Z, dizzy stars
    if (this.heal && t % 2) this.parts.push({ x: MID - 14 + Math.random() * 28, y: FY - 10 - Math.random() * 20, vx: 0, vy: -0.8, l: 0, m: 14, plus: true });
    if (asleep && t % 14 === 0) this.parts.push({ x: MID + 10, y: FY - 34, vx: 0.4, vy: -0.5, l: 0, m: 26, z: true });
    if (!asleep && !dead && t % 9 === 0) this.parts.push({ x: Math.random() * W, y: FY - 2, vx: 0, vy: -0.4 - Math.random() * 0.3, l: 0, m: 60, ember: true });
    for (const p of this.parts) {
      p.l++; p.x += p.vx; p.y += p.vy;
      if (p.coin) { p.vy += 0.35; if (p.y > FY - 1) { p.y = FY - 1; p.vy *= -0.45; p.vx *= 0.7; } }
    }
    this.parts = this.parts.filter(p => p.l < p.m).slice(-150);
    for (const p of this.parts) {
      const x = Math.round(p.x), y = Math.round(p.y);
      if (p.coin) { R(x, y, 2, 2, '#f2c14e'); R(x, y, 1, 1, '#fff2b0'); }
      else if (p.plus) { R(x - 1, y, 3, 1, '#37d67a'); R(x, y - 1, 1, 3, '#37d67a'); }
      else if (p.z) { const s = p.l < 13 ? 3 : 4; R(x, y, s, 1, '#cfd3ff'); R(x + s - 1 - 1, y + 1, 1, 1, '#cfd3ff'); R(x, y + 2, s, 1, '#cfd3ff'); }
      else if (p.ember) R(x, y, 1, 1, p.l < 30 ? '#ff8a2a' : '#7a2a1a');
    }
    if (dead) for (let i = 0; i < 3; i++) { const a = t / 5 + i * 2.1, x = Math.round(MID + Math.cos(a) * 12), y = Math.round(oy + 8 + Math.sin(a) * 3); R(x, y, 1, 1, '#ffe066'); if (t % 4 < 2) { R(x - 1, y, 3, 1, '#ffe066'); R(x, y - 1, 1, 3, '#ffe066'); } }
  }
}

// fill in a line: [m|f] by the player's form, {key} from vars
export function line(pool, isF, vars = {}) {
  return pick(LINES[pool]).replace(/\[([^|\]]*)\|([^\]]*)\]/g, (_, m, f) => (isF ? f : m)).replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
}
