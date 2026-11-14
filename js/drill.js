// RESPAWN — "розминка мозку": generated mental-math questions with integer answers.
// attr decides which attribute the XP goes to: math / eng / biz. `min` = difficulty tier (1..3).
const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = arr => arr[ri(0, arr.length - 1)];
const comb = (n, k) => { let r = 1; for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i; return Math.round(r); };

const GEN = [
  { attr: 'math', min: 1, f: L => { const a = ri(11, 19 + L * 8), b = ri(3, 9); return [`${a} × ${b}`, a * b]; } },
  { attr: 'math', min: 3, f: L => { const a = ri(11, 21 + L * 3), b = ri(11, 19); return [`${a} × ${b}`, a * b]; } },
  { attr: 'math', min: 1, f: () => { const p = pick([5, 10, 15, 20, 25, 30, 40, 50, 75]), n = ri(2, 40) * 20; return [`${p}% від ${n}`, (p * n) / 100]; } },
  { attr: 'math', min: 1, f: () => { const a = ri(11, 25); return [`${a}²`, a * a]; } },
  { attr: 'math', min: 2, f: () => { const a = ri(12, 31); return [`√${a * a}`, a]; } },
  { attr: 'math', min: 1, f: () => { const k = ri(2, 9), x = ri(2, 15), b = ri(1, 20); return [`${k}x + ${b} = ${k * x + b}\nx = ?`, x]; } },
  { attr: 'math', min: 2, f: () => { const a = ri(2, 6), b = ri(1, 9), x = ri(2, 6); return [`f(x) = ${a}x² + ${b}x\nf′(${x}) = ?`, 2 * a * x + b]; } },
  { attr: 'math', min: 1, f: () => { const m = ri(3, 12), a = ri(20, 150); return [`${a} mod ${m}`, a % m]; } },
  { attr: 'math', min: 2, f: () => { const n = pick([10, 20, 30, 40, 50, 100]); return [`1 + 2 + … + ${n}`, (n * (n + 1)) / 2]; } },
  { attr: 'math', min: 3, f: () => { const n = ri(5, 8), k = ri(2, 3); return [`C(${n}, ${k})\nскільки способів обрати ${k} з ${n}?`, comb(n, k)]; } },
  { attr: 'math', min: 2, f: () => { const a = ri(2, 5), n = ri(3, 5); return [`${a}^${n}`, a ** n]; } },

  { attr: 'eng', min: 1, f: () => { const n = ri(5, 63); return [`0b${n.toString(2)}\nу десятковій = ?`, n]; } },
  { attr: 'eng', min: 2, f: () => { const n = ri(17, 255); return [`0x${n.toString(16).toUpperCase()}\nу десятковій = ?`, n]; } },
  { attr: 'eng', min: 1, f: () => { const e = ri(5, 12); return [`2^${e}`, 2 ** e]; } },
  { attr: 'eng', min: 2, f: () => { const e = ri(6, 16); return [`log₂ ${2 ** e}`, e]; } },
  { attr: 'eng', min: 1, f: () => { const i = ri(2, 8), r = ri(2, 12); return [`R = ${r} Ом, I = ${i} А\nU = ? В`, i * r]; } },
  { attr: 'eng', min: 2, f: () => { const [a, b, r] = pick([[6, 3, 2], [12, 6, 4], [10, 10, 5], [20, 5, 4], [30, 15, 10], [12, 4, 3]]); return [`Паралельно ${a} Ом і ${b} Ом\nR = ? Ом`, r]; } },
  { attr: 'eng', min: 1, f: () => { const v = pick([36, 54, 72, 90, 108, 144]); return [`${v} км/год\n= ? м/с`, (v * 5) / 18]; } },
  { attr: 'eng', min: 2, f: () => { const g = ri(2, 16); return [`${g} ГіБ\n= ? МіБ`, g * 1024]; } },
  { attr: 'eng', min: 2, f: () => { const u = pick([5, 9, 12, 24]), i = ri(2, 6); return [`U = ${u} В, I = ${i} А\nP = ? Вт`, u * i]; } },
  { attr: 'eng', min: 3, f: () => { const b = ri(3, 7); return [`Скільки різних значень\nу ${b + 5} бітах?`, 2 ** (b + 5)]; } },

  { attr: 'biz', min: 1, f: () => { const price = ri(2, 20) * 100, m = pick([10, 20, 25, 30, 40, 50, 60]); return [`Собівартість ${(price * (100 - m)) / 100}, ціна ${price}\nМаржа, % = ?`, m]; } },
  { attr: 'biz', min: 1, f: () => { const cost = ri(4, 30) * 20, k = pick([10, 25, 50, 75, 100, 150]); return [`Собівартість ${cost}, націнка ${k}%\nЦіна = ?`, (cost * (100 + k)) / 100]; } },
  { attr: 'biz', min: 1, f: () => { const inv = ri(2, 20) * 100, r = pick([10, 20, 25, 50, 80, 120, 200]); return [`Вкладено ${inv}, повернулось ${(inv * (100 + r)) / 100}\nROI, % = ?`, r]; } },
  { attr: 'biz', min: 2, f: () => { const mu = pick([20, 25, 40, 50, 100, 125]), n = ri(20, 200); return [`Постійні витрати ${mu * n}\nмаржа з одиниці ${mu}\nБеззбитковість, шт = ?`, n]; } },
  { attr: 'biz', min: 2, f: () => { const p = pick([10, 20, 50]), s = pick([1000, 2000, 5000]); return [`${s} під ${p}% річних\n2 роки, складний відсоток\nСума = ?`, (s * (100 + p) * (100 + p)) / 10000]; } },
  { attr: 'biz', min: 1, f: () => { const cac = ri(2, 20) * 10, k = ri(3, 8); return [`CAC = ${cac}, LTV = ${cac * k}\nLTV / CAC = ?`, k]; } },
  { attr: 'biz', min: 2, f: () => { const v = ri(5, 40) * 100, c = pick([2, 4, 5, 10, 20, 25]); return [`${v} відвідувачів\nконверсія ${c}%\nПродажів = ?`, (v * c) / 100]; } },
  { attr: 'biz', min: 1, f: () => { const mrr = ri(2, 40) * 100; return [`MRR = ${mrr}\nARR = ?`, mrr * 12]; } },
  { attr: 'biz', min: 3, f: () => { const rate = pick([20, 40, 50, 60]), h = ri(3, 8) * 10, tax = pick([5, 10, 20]); return [`${h} год × ${rate}/год\nподаток ${tax}%\nЧистими = ?`, (h * rate * (100 - tax)) / 100]; } },
];

// tier 1..3 from the player's math attribute level
export const drillTier = mathLevel => Math.max(1, Math.min(3, 1 + Math.floor((mathLevel - 1) / 3)));

// one run: 2 math, 1 eng, 1 biz, 1 wildcard — shuffled, no repeated generator
export function makeRun(tier, n = 5) {
  const pool = GEN.filter(g => g.min <= tier), used = new Set(), out = [];
  const take = attr => {
    const opts = pool.filter(g => !used.has(g) && (!attr || g.attr === attr));
    const g = pick(opts.length ? opts : pool);
    used.add(g);
    const [text, answer] = g.f(tier);
    out.push({ text, answer: String(answer), attr: g.attr });
  };
  ['math', 'math', 'eng', 'biz'].forEach(take);
  while (out.length < n) take(null);
  for (let i = out.length - 1; i > 0; i--) { const j = ri(0, i); [out[i], out[j]] = [out[j], out[i]]; }
  return out.slice(0, n);
}
export const _GEN = GEN; // for tests
