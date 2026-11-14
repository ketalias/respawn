// Save-migration tests: nobody's progress may change when a save is loaded by this build.
// Run: npm test   (plain Node, no deps; game.js runs with a tiny window/localStorage shim)
import { CATS, sphereXP, sphereOf } from '../js/data.js';

const store = {};
globalThis.window = {};
globalThis.localStorage = { getItem: k => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; }, clear: () => { for (const k in store) delete store[k]; } };
const G = await import('../js/game.js');

let fails = 0;
const ok = (cond, msg, extra = '') => { if (cond) console.log('  ok  ', msg); else { fails++; console.log('  FAIL', msg, extra); } };
const clone = o => JSON.parse(JSON.stringify(o));
// every leaf of `a` must exist with the same value in `b`
function missing(a, b, p = '') {
  if (a && typeof a === 'object') return Object.keys(a).flatMap(k => missing(a[k], b?.[k], p + '.' + k));
  return a === b ? [] : [`${p}: ${JSON.stringify(a)} → ${JSON.stringify(b)}`];
}
const load = raw => { localStorage.clear(); if (raw !== undefined) store['respawn.v1'] = JSON.stringify(raw); G.load(); G.flush(); return clone(G.S); };
const totalStats = st => Object.values(st || {}).reduce((a, v) => a + (+v || 0), 0);
const T = G.today(), Y = G.addDays(T, -1);

/* ---------- fixtures ---------- */
const v2 = { // a real-looking 2.x save (author-like)
  v: 2, updatedAt: 1731500000000, createdAt: '2026-10-01', name: 'Роман', xp: 18450, coins: 640, maxLv: 21, onboarded: true,
  stats: { biz: 4200, math: 1300, eng: 1700, dis: 900, body: 500 },
  quests: [
    { id: 'a1', title: 'Одна дія, що приносить гроші', cat: 'biz', diff: 'h', type: 'daily', doneOn: Y, streak: 9, last: Y },
    { id: 'a2', title: 'Задачі', cat: 'math', diff: 'm', type: 'daily', doneOn: null, streak: 0, last: null },
    { id: 'a3', title: 'Інженерія', cat: 'eng', diff: 'h', type: 'daily', doneOn: null, streak: 3, last: Y },
    { id: 'a4', title: 'Реліз', cat: 'eng', diff: 'x', type: 'once', doneOn: '2026-11-02', streak: 1, last: '2026-11-02' },
  ],
  days: { [Y]: { xp: 210, q: 4, w: 1, perfect: true } },
  streak: { cur: 9, best: 14, last: Y },
  money: { goal: 100000, cur: '₴', name: 'Студія', log: [{ id: 'm1', d: Y, amt: 18000, src: 'Клієнт', out: false }], killed: { '2026-10': true }, over: {}, src3: null, athOn: null },
  acts: { d: Y, n: { reach: 4 } },
  skills: [{ id: 's1', name: 'Математика', cat: 'math', mins: 760 }, { id: 's2', name: 'Програмування', cat: 'eng', mins: 2140 }, { id: 's3', name: 'Продажі', cat: 'biz', mins: 310 }],
  focus: null, drill: { d: Y, runs: 2 },
  workouts: [{ id: 'w1', d: Y, ts: 1, dur: 60, name: 'Ноги', entries: [{ ex: 'squat', sets: [[100, 5]] }], vol: 500, sets: 1, mins: 0, prs: [], xp: 96 }],
  customEx: [], prs: { squat: { w: 100, r: 5, score: 116.6, d: Y } }, draft: null,
  owned: ['top:hoodie', 'top:suit', 'aura:fire', 'head:hardhat'], eq: { top: 'suit', aura: 'fire', head: 'hardhat', scene: 'office', theme: 'cash' },
  manual: { top: true }, ach: { q1: 1, boss1: 2, engh10: 3 },
  counters: { quests: 88, perfect: 4, workouts: 14, focusMin: 3210, acts: 61, maxCoins: 900 },
  lootOn: Y, coinOn: null, settings: { sound: false, haptics: true, rest: 120 },
};
const v1 = { xp: 300, quests: [{ id: 'o1', title: 'x', cat: 'str', diff: 'e', type: 'daily' }, { id: 'o2', title: 'y', cat: 'int', diff: 'm', type: 'daily' }], stats: { str: 100, int: 50, dis: 20, vit: 30 } };
const future = { ...clone(v2), v: 4, stats: { ...v2.stats, mind: 40, calm: 10, travel: 7 }, quests: [...clone(v2.quests), { id: 'f1', title: 'Подорож', cat: 'travel', diff: 'm', type: 'once', doneOn: null, streak: 0, last: null, plan: 'p1' }], profile: { g: 'f', pro: true }, newThing: { a: 1 } };

/* ---------- 1. v2 save → v3: nothing that existed changes ---------- */
console.log('v2 → v3');
const a = load(v2);
const keep = ['xp', 'coins', 'maxLv', 'name', 'createdAt', 'streak', 'money', 'acts', 'workouts', 'prs', 'owned', 'eq', 'manual', 'ach', 'counters', 'settings', 'skills', 'quests', 'drill', 'lootOn'];
for (const k of keep) { const m = missing(v2[k], a[k], k); ok(!m.length, `${k} unchanged`, m.join('; ')); }
ok(a.v === 3, 'v = 3');
ok(totalStats(a.stats) === totalStats(v2.stats), 'total sphere XP unchanged', `${totalStats(v2.stats)} → ${totalStats(a.stats)}`);
ok(sphereXP(a.stats, 'mind') === 1300 + 1700, 'Розум = Математика + Інженерія', sphereXP(a.stats, 'mind'));
ok(sphereXP(a.stats, 'biz') === 4200 && sphereXP(a.stats, 'dis') === 900 && sphereXP(a.stats, 'body') === 500, 'Гроші / Порядок / Тіло unchanged');
ok(sphereXP(a.stats, 'calm') === 0 && sphereXP(a.stats, 'people') === 0, 'Спокій / Люди start at 0');
ok(a.quests.find(q => q.id === 'a2').cat === 'math', 'old quest cat not rewritten (read through ALIAS)');
ok(a.profile.g === null && a.mods.money && a.mods.home.includes('money') && a.privacy.money === false && Array.isArray(a.looks), 'new v3 fields added with safe defaults');
ok(store['respawn.v1.bak2'] === JSON.stringify(v2), 'pre-2.0 backup written byte-for-byte');

/* ---------- 2. backup is taken once and never overwritten ---------- */
console.log('backup');
G.completeQuest('a2'); G.flush();
const again = JSON.parse(store['respawn.v1']); G.load();
ok(store['respawn.v1.bak2'] === JSON.stringify(v2), 'reloading a v3 save keeps the original backup');
ok(again.v === 3, 'saved as v3');
load(undefined);
ok(!store['respawn.v1.bak2'], 'no backup for a brand-new player');

/* ---------- 3. playing on v3 ---------- */
console.log('play');
load(v2);
G.completeQuest('a2');
let s = clone(G.S);
const got = s.stats.mind;
ok(got > 0 && s.stats.math === 1300, 'XP from an old "math" quest goes to Розум, legacy key untouched', `mind ${got}`);
ok(s.days[T].s?.mind === got, 'day breakdown days[k].s written');
G.undoQuest('a2'); s = clone(G.S);
ok(s.stats.mind === 0 && s.stats.math === 1300 && !s.days[T].s.mind, 'undo returns exactly to before');
// undo after migration day: XP was in legacy key, mind is 0 → taken from legacy, not lost/created
G.S.quests.find(q => q.id === 'a3').doneOn = T; G.S.quests.find(q => q.id === 'a3').undo = { xp: 50, coins: 10, streak: 3, last: Y };
G.undoQuest('a3'); s = clone(G.S);
ok(sphereXP(s.stats, 'mind') === 3000 - 50 && s.stats.eng + s.stats.math === 2950, 'undo of a pre-2.0 quest spills into legacy keys', JSON.stringify(s.stats));
const fz = G.logFocus('s3', 30); s = clone(G.S);
ok(fz.xp > 0 && s.stats.biz === 4200 + fz.xp, 'focus on a biz skill → Гроші', `+${fz.xp}`);
const r = G.finishDrill([{ attr: 'math', ok: true, ms: 3000 }, { attr: 'eng', ok: true, ms: 3000 }, { attr: 'biz', ok: true, ms: 9000 }]);
ok(Object.keys(r.gain).sort().join() === 'biz,mind', 'drill gains grouped by sphere', Object.keys(r.gain).join());

/* ---------- 4. v1 saves still fold like before ---------- */
console.log('v1');
const b = load(v1);
ok(sphereXP(b.stats, 'body') === 130 && sphereXP(b.stats, 'mind') === 50 && b.stats.dis === 20, 'str+vit → Тіло, int → Розум');
ok(b.quests[0].cat === 'body' && sphereOf(b.quests[1].cat) === 'mind', 'v1 quest cats');

/* ---------- 5. a save from a newer version survives this build ---------- */
console.log('future save');
const c = load(future);
const m = missing(future, c);
ok(!m.length, 'every field of a v4 save preserved', m.join('; '));
ok(c.v === 4, 'version not downgraded');
G.completeQuest('f1'); G.flush(); s = JSON.parse(store['respawn.v1']);
ok(s.quests.find(q => q.id === 'f1').cat === 'travel' && s.stats.travel > 7, 'unknown sphere keeps its id and XP');

/* ---------- 6. new player ---------- */
console.log('new player');
const n = load(undefined);
ok(Object.keys(n.stats).join() === Object.keys(CATS).join(), 'fresh stats = the 6 spheres');
ok(n.quests.every(q => CATS[q.cat]) && n.skills.every(k => CATS[k.cat]), 'starter quests & skills use canonical sphere ids');

console.log(fails ? `\n${fails} FAILED` : '\nALL PASSED');
process.exit(fails ? 1 : 0);
