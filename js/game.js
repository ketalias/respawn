// RESPAWN — state, persistence (localStorage + Telegram CloudStorage) and game rules.
import { levelInfo, rankOf, comboOf, DIFFS, STARTER_QUESTS, EXERCISES, GROUPS, ITEMS, ITEM, DEFAULT_EQ, ACHS, CATS, OLD_CATS, BIZ_ACTS, DEFAULT_SKILLS } from './data.js';

const KEY = 'respawn.v1';
export const tg = window.Telegram?.WebApp?.initData ? window.Telegram.WebApp : null;

const pad = n => String(n).padStart(2, '0');
export const dkey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const today = () => dkey();
export const ym = (k = today()) => k.slice(0, 7);
export const addDays = (key, n) => { const d = new Date(key + 'T12:00:00'); d.setDate(d.getDate() + n); return dkey(d); };
export const uid = () => Math.random().toString(36).slice(2, 9);
const num = v => { const n = parseFloat(String(v).replace(',', '.').replace(/\s/g, '')); return Number.isFinite(n) && n > 0 ? n : 0; };

const COUNTERS = ['quests', 'epics', 'perfect', 'crit', 'undos', 'workouts', 'prs', 'volume', 'sets', 'early', 'night', 'bought', 'loot', 'taps', 'maxCoins',
  'incomes', 'goals', 'overkill', 'ath', 'src3', 'acts', 'act_deal', 'drills', 'drillOk', 'drillPerfect', 'drillFast', 'focusMin', 'sessions', 'deep'];

function fresh() {
  return {
    v: 2, updatedAt: 0, createdAt: today(), name: '', xp: 0, coins: 0, maxLv: 1,
    stats: Object.fromEntries(Object.keys(CATS).map(k => [k, 0])),
    quests: STARTER_QUESTS.map(([title, cat, diff, type]) => ({ id: uid(), title, cat, diff, type, doneOn: null, streak: 0, last: null })),
    days: {}, streak: { cur: 0, best: 0, last: null },
    money: { goal: 0, cur: '₴', name: '', log: [], killed: {}, over: {}, src3: null, athOn: null },
    acts: { d: null, n: {} },
    skills: DEFAULT_SKILLS.map(([name, cat]) => ({ id: uid(), name, cat, mins: 0 })),
    focus: null, drill: { d: null, runs: 0 },
    workouts: [], customEx: [], prs: {}, draft: null,
    owned: [], eq: { ...DEFAULT_EQ }, manual: {}, ach: {},
    counters: Object.fromEntries(COUNTERS.map(k => [k, 0])),
    lootOn: null, coinOn: null, settings: { sound: true, haptics: true, rest: 90 },
  };
}
function hydrate(raw) {
  const f = fresh();
  if (!raw || typeof raw !== 'object') return f;
  const s = { ...f, ...raw };
  for (const k of ['streak', 'eq', 'counters', 'settings', 'money', 'acts', 'drill']) s[k] = { ...f[k], ...(raw[k] || {}) };
  // v1 saves had str/int/dis/vit — fold them into the new attributes.
  // Keys and categories from newer versions are kept as-is: never dropped, never remapped.
  const old = raw.stats || {};
  s.stats = { ...f.stats };
  for (const [k, v] of Object.entries(old)) { const to = OLD_CATS[k] || k; s.stats[to] = (s.stats[to] || 0) + (+v || 0); }
  for (const q of s.quests) if (OLD_CATS[q.cat]) q.cat = OLD_CATS[q.cat]; else if (!q.cat) q.cat = 'dis';
  if (!Array.isArray(s.skills)) s.skills = f.skills;
  s.v = Math.max(2, +raw.v || 0);
  return s;
}

export let S = fresh();
const listeners = new Set();
export const onChange = fn => listeners.add(fn);
const notify = () => listeners.forEach(fn => fn());

/* ---------- persistence ---------- */
let saveTimer = null, cloudTimer = null, lastChunks = [];
const ascii = json => json.replace(/[\u007f-￿]/g, c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'));
const cloud = () => (tg && tg.isVersionAtLeast?.('6.9') && tg.CloudStorage) || null;
const cs = (fn, ...a) => new Promise(res => { try { cloud()[fn](...a, (err, val) => res(err ? null : val)); } catch { res(null); } });

function writeLocal() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { /* storage may be blocked */ } }
async function writeCloud() {
  if (!cloud()) return;
  const chunks = ascii(JSON.stringify(S)).match(/[\s\S]{1,3900}/g) || [];
  for (let i = 0; i < chunks.length; i++) if (chunks[i] !== lastChunks[i]) await cs('setItem', 'c' + i, chunks[i]);
  await cs('setItem', 'meta', JSON.stringify({ n: chunks.length, at: S.updatedAt }));
  lastChunks = chunks;
}
export function save(silent) {
  S.updatedAt = Date.now();
  S.counters.maxCoins = Math.max(S.counters.maxCoins || 0, S.coins);
  clearTimeout(saveTimer); saveTimer = setTimeout(writeLocal, 150);
  clearTimeout(cloudTimer); cloudTimer = setTimeout(writeCloud, 2500);
  if (!silent) notify();
}
export function flush() { clearTimeout(saveTimer); writeLocal(); }

export function load() {
  try { S = hydrate(JSON.parse(localStorage.getItem(KEY))); } catch { S = fresh(); }
  if (!S.name && tg?.initDataUnsafe?.user?.first_name) S.name = tg.initDataUnsafe.user.first_name;
  rollDay();
}
// pull a newer save from Telegram cloud (other device / cleared webview storage)
export async function syncCloud() {
  if (!cloud()) return false;
  const meta = JSON.parse((await cs('getItem', 'meta')) || 'null');
  if (!meta || !meta.n || meta.at <= S.updatedAt) return false;
  const keys = Array.from({ length: meta.n }, (_, i) => 'c' + i);
  const vals = await cs('getItems', keys);
  if (!vals) return false;
  try {
    const chunks = keys.map(k => vals[k] || '');
    S = hydrate(JSON.parse(chunks.join(''))); lastChunks = chunks;
    rollDay(); writeLocal(); notify();
    return true;
  } catch { return false; }
}
export const exportSave = () => JSON.stringify(S);
export function importSave(json) {
  const raw = JSON.parse(json);
  if (!raw || typeof raw.xp !== 'number' || !Array.isArray(raw.quests)) throw new Error('bad save');
  S = hydrate(raw); rollDay(); save();
}
export function resetAll() { const name = S.name; S = fresh(); S.name = name; lastChunks = []; save(); }

/* ---------- derived ---------- */
export const level = () => levelInfo(S.xp);
export const rank = () => rankOf(level().lv);
export const combo = () => comboOf(S.streak.cur);
export const has = id => !!ITEM[id] && (ITEM[id].src === 0 || S.owned.includes(id));
export const day = (k = today()) => (S.days[k] ||= { xp: 0, q: 0, w: 0 });
export const isDone = q => (q.type === 'daily' ? q.doneOn === today() : !!q.doneOn);
export function lookOf(eq = S.eq) {
  const r = rank();
  return { skin: eq.skin, hair: eq.hair, hairColor: eq.hairColor, face: eq.face, head: eq.head, top: eq.top, bottom: eq.bottom, shoes: eq.shoes, back: eq.back, hand: eq.hand, build: r.build, expr: r.expr };
}
export const allExercises = () => [...EXERCISES, ...S.customEx];
export const exById = id => allExercises().find(e => e.id === id) || { id, name: 'Вправа', g: 0, type: 'w' };

// streak breaks if a whole day was skipped
export function rollDay() {
  const t = today();
  if (S.streak.last && S.streak.last !== t && S.streak.last !== addDays(t, -1)) S.streak.cur = 0;
}

/* ---------- events for the UI (toasts, level-up screen …) ---------- */
let events = [];
export const drain = () => { const e = events; events = []; return e; };

function touchStreak() {
  const t = today();
  if (S.streak.last === t) return;
  S.streak.cur = S.streak.last === addDays(t, -1) ? S.streak.cur + 1 : 1;
  S.streak.last = t;
  S.streak.best = Math.max(S.streak.best, S.streak.cur);
}

function grant(xp, coins, cat) {
  const before = level().lv;
  S.xp = Math.max(0, S.xp + xp); S.coins = Math.max(0, S.coins + coins);
  if (cat && cat in S.stats) S.stats[cat] = Math.max(0, S.stats[cat] + xp);
  day().xp = Math.max(0, day().xp + xp);
  const after = level().lv;
  for (let lv = Math.max(before, S.maxLv) + 1; lv <= after; lv++) {
    S.maxLv = lv;
    const bonus = 10 + lv * 2, items = [];
    S.coins += bonus;
    for (const it of ITEMS) if (it.src && it.src.lv === lv && !S.owned.includes(it.id)) { S.owned.push(it.id); items.push(it); if (!S.manual[it.slot]) S.eq[it.slot] = it.key; }
    const r = rankOf(lv);
    events.push({ t: 'level', lv, coins: bonus, items, rank: r.lv === lv ? r : null });
  }
}

function checkAchs() {
  for (let pass = 0; pass < 3; pass++) {
    let any = false;
    for (const a of ACHS) {
      if (S.ach[a.id]) continue;
      const [cur, goal] = a.prog(S);
      if (cur < goal) continue;
      S.ach[a.id] = Date.now(); S.coins += a.coins; any = true;
      const items = ITEMS.filter(i => i.src && i.src.ach === a.id);
      for (const item of items) if (!S.owned.includes(item.id)) S.owned.push(item.id);
      events.push({ t: 'ach', a, item: items[0] });
    }
    if (!any) break;
  }
}

/* ---------- secrets ---------- */
export function secret(id) {
  if (S.counters['s_' + id]) return false;
  S.counters['s_' + id] = 1; checkAchs(); save();
  return true;
}
export function timeSecrets() {
  const d = new Date(), hm = d.getHours() * 100 + d.getMinutes();
  if (d.getDay() === 5 && d.getDate() === 13) secret('f13');
  if (hm === 314 || hm === 1514 || (d.getMonth() === 2 && d.getDate() === 14)) secret('pi');
  if (/^(neo|нео|morpheus|морфеус|trinity|трініті)$/i.test((S.name || '').trim())) secret('neo');
}
// shaking the wallet: every 10th tap, once a day, a coin falls out
export function tapWallet() {
  S.coinTaps = (S.coinTaps || 0) + 1;
  if (S.coinTaps % 10 || S.coinOn === today()) { save(true); return false; }
  S.coinOn = today(); S.coins += 1; secret('coin'); save();
  return true;
}

/* ---------- quests ---------- */
export function addQuest({ title, cat, diff, type }) {
  S.quests.unshift({ id: uid(), title: title.trim(), cat, diff, type, doneOn: null, streak: 0, last: null });
  if (/hello,?\s*world/i.test(title)) secret('hello');
  save();
}
export function editQuest(id, patch) { const q = S.quests.find(q => q.id === id); if (q) Object.assign(q, patch); save(); }
export function deleteQuest(id) { S.quests = S.quests.filter(q => q.id !== id); save(); }

export function completeQuest(id) {
  const q = S.quests.find(q => q.id === id);
  if (!q || isDone(q)) return;
  const t = today(), D = DIFFS[q.diff] || DIFFS.m, hour = new Date().getHours();
  touchStreak();
  const crit = Math.random() < 0.08;
  const xp = Math.round(D.xp * combo()) * (crit ? 2 : 1);
  q.undo = { xp, coins: D.coins, streak: q.streak, last: q.last };
  q.streak = q.type === 'daily' && q.last === addDays(t, -1) ? q.streak + 1 : 1;
  q.doneOn = t; q.last = t;
  S.counters.quests++; if (q.diff === 'x') S.counters.epics++; if (crit) S.counters.crit++;
  if (hour < 4) S.counters.night++; else if (hour < 7) S.counters.early++;
  day().q++;
  events.push({ t: 'xp', xp, coins: D.coins, crit });
  grant(xp, D.coins, q.cat);
  const dailies = S.quests.filter(x => x.type === 'daily');
  if (q.type === 'daily' && dailies.length >= 3 && dailies.every(isDone) && !day().perfect) {
    day().perfect = true; S.counters.perfect++;
    events.push({ t: 'perfect', xp: 50, coins: 20 });
    grant(50, 20);
  }
  checkAchs(); save();
}
export function undoQuest(id) {
  const q = S.quests.find(q => q.id === id);
  if (!q || !isDone(q) || !q.undo) return;
  const u = q.undo;
  q.doneOn = null; q.streak = u.streak; q.last = u.last; delete q.undo;
  S.counters.quests = Math.max(0, S.counters.quests - 1); if (q.diff === 'x') S.counters.epics = Math.max(0, S.counters.epics - 1);
  S.counters.undos++;
  day().q = Math.max(0, day().q - 1);
  grant(-u.xp, -u.coins, q.cat);
  checkAchs(); save();
}

/* ---------- daily loot ---------- */
export const lootReady = () => S.lootOn !== today();
export function claimLoot() {
  if (!lootReady()) return null;
  const coins = 10 + Math.floor(Math.random() * 16) + Math.min(20, S.streak.cur * 2), xp = 5 + Math.floor(Math.random() * 11);
  S.lootOn = today(); S.counters.loot++;
  grant(xp, coins);
  checkAchs(); save();
  return { coins, xp };
}

export function tapHero() { S.counters.taps++; checkAchs(); save(true); }

/* ---------- items ---------- */
export function buy(id) {
  const it = ITEM[id];
  if (!it || has(id) || !it.src.coins || S.coins < it.src.coins) return false;
  S.coins -= it.src.coins; S.owned.push(id); S.counters.bought++;
  S.eq[it.slot] = it.key; S.manual[it.slot] = true;
  checkAchs(); save();
  return true;
}
export function equip(slot, key) { S.eq[slot] = key; S.manual[slot] = true; save(); }

/* ---------- money: the monthly income goal is a boss, every income is a hit ---------- */
export function monthSum(m = ym()) {
  let inc = 0, out = 0; const src = new Set();
  for (const e of S.money.log) if (e.d.startsWith(m)) { if (e.out) out += e.amt; else { inc += e.amt; if (e.src) src.add(e.src.toLowerCase()); } }
  return { inc, out, net: inc - out, src: src.size };
}
export function monthsBack(n = 6) {
  const out = [], d = new Date(); d.setDate(1);
  for (let i = 0; i < n; i++) { const k = `${d.getFullYear()}-${pad(d.getMonth() + 1)}`; out.unshift({ m: k, ...monthSum(k) }); d.setMonth(d.getMonth() - 1); }
  return out;
}
const bestOtherMonth = () => { const by = {}; for (const e of S.money.log) if (!e.out && ym(e.d) !== ym()) by[ym(e.d)] = (by[ym(e.d)] || 0) + e.amt; return Math.max(0, ...Object.values(by)); };
export const recentSources = () => [...new Set(S.money.log.filter(e => e.src && !e.out).map(e => e.src))].slice(0, 6);

export function setMoney({ goal, cur, name }) {
  if (goal !== undefined) S.money.goal = Math.round(num(goal));
  if (cur) S.money.cur = cur;
  if (name !== undefined) S.money.name = String(name).trim().slice(0, 30);
  checkAchs(); save();
}
export function addMoney({ amt, src, out }) {
  amt = Math.round(num(amt) * 100) / 100;
  if (!amt) return null;
  const m = ym(), before = monthSum().inc;
  const e = { id: uid(), d: today(), amt, src: String(src || '').trim().slice(0, 40), out: !!out };
  S.money.log.unshift(e);
  const res = { e, xp: 0, boss: false };
  if (amt === 1337) secret('leet'); if (amt === 404) secret('404'); if (amt === 69 || amt === 420) secret('nice');
  if (!out) {
    touchStreak();
    const g = S.money.goal;
    res.xp = Math.round((g ? Math.max(5, Math.min(400, (amt / g) * 1500)) : 15) * combo());
    const coins = Math.max(1, Math.round(res.xp / 8));
    S.counters.incomes++;
    events.push({ t: 'xp', xp: res.xp, coins });
    grant(res.xp, coins, 'biz');
    const now = monthSum();
    if (g && now.inc >= g && !S.money.killed[m]) {
      S.money.killed[m] = true; S.counters.goals++; res.boss = true;
      events.push({ t: 'boss', xp: 500, coins: 150 });
      grant(500, 150, 'biz');
    }
    if (g && now.inc >= g * 2 && !S.money.over[m]) { S.money.over[m] = true; S.counters.overkill++; }
    if (now.src >= 3 && S.money.src3 !== m) { S.money.src3 = m; S.counters.src3++; }
    const best = bestOtherMonth();
    if (best > 0 && before <= best && now.inc > best && S.money.athOn !== m) { S.money.athOn = m; S.counters.ath++; events.push({ t: 'ath' }); }
  }
  checkAchs(); save();
  return res;
}
export function deleteMoney(id) { S.money.log = S.money.log.filter(e => e.id !== id); save(); }

export function actCount(id) { return S.acts.d === today() ? S.acts.n[id] || 0 : 0; }
export function doAct(id) {
  const a = BIZ_ACTS.find(a => a.id === id); if (!a) return null;
  if (S.acts.d !== today()) S.acts = { d: today(), n: {} };
  const n = (S.acts.n[id] = (S.acts.n[id] || 0) + 1);
  S.counters.acts++; S.counters['act_' + id] = (S.counters['act_' + id] || 0) + 1;
  touchStreak();
  const xp = n <= a.cap ? Math.round(a.xp * combo()) : 0;
  if (xp) { events.push({ t: 'xp', xp, coins: a.coins }); grant(xp, a.coins, 'biz'); }
  checkAchs(); save();
  return { xp, n, capped: !xp };
}

/* ---------- skills & focus sessions ---------- */
export function addSkill(name, cat) { const k = { id: uid(), name: name.trim().slice(0, 40), cat, mins: 0 }; S.skills.push(k); save(); return k; }
export function deleteSkill(id) { S.skills = S.skills.filter(k => k.id !== id); if (S.focus?.skill === id) S.focus = null; save(); }
export function startFocus(skillId) { S.focus = { skill: skillId, start: Date.now() }; save(); }
export function cancelFocus() { S.focus = null; save(); }
export function logFocus(skillId, mins) {
  const sk = S.skills.find(k => k.id === skillId); if (!sk) return null;
  mins = Math.max(1, Math.min(600, Math.round(num(mins))));
  touchStreak();
  sk.mins += mins; S.counters.focusMin += mins; S.counters.sessions++; if (mins >= 90) S.counters.deep++;
  const xp = Math.round(Math.min(mins, 240) * combo()), coins = Math.round(mins / 10);
  grant(xp, coins, sk.cat);
  checkAchs(); save();
  return { mins, xp, coins, sk };
}
export function stopFocus() {
  const f = S.focus; if (!f) return null;
  const mins = Math.round((Date.now() - f.start) / 60000);
  S.focus = null;
  if (mins < 1) { save(); return { mins: 0 }; }
  return logFocus(f.skill, mins);
}

/* ---------- brain warm-up ---------- */
export const drillFresh = () => S.drill.d !== today();
export function finishDrill(results) { // [{ attr, ok, ms }]
  const first = drillFresh();
  if (first) S.drill = { d: today(), runs: 0 };
  S.drill.runs++;
  const okN = results.filter(r => r.ok).length, perfect = okN === results.length;
  if (okN) touchStreak();
  const gain = {};
  for (const r of results) if (r.ok) {
    gain[r.attr] = (gain[r.attr] || 0) + (first ? Math.round((8 + (r.ms < 5000 ? 2 : 0)) * combo()) : 1);
    if (r.ms < 2000) S.counters.drillFast++;
  }
  S.counters.drills++; S.counters.drillOk += okN; if (perfect) S.counters.drillPerfect++;
  let xp = 0;
  for (const [attr, v] of Object.entries(gain)) { grant(v, 0, attr); xp += v; }
  const bonus = perfect && first ? 20 : 0, coins = first ? okN * 2 + (perfect ? 10 : 0) : 0;
  grant(bonus, coins, 'math');
  checkAchs(); save();
  return { okN, n: results.length, xp: xp + bonus, coins, perfect, first, gain };
}

/* ---------- gym ---------- */
// score used for records: estimated 1RM for weights, reps for bodyweight, minutes for timed
export const setScore = (type, w, r) => (type === 'w' ? (w > 0 && r > 0 ? w * (1 + r / 30) : 0) : type === 'bw' ? (r > 0 ? r + (w || 0) * 0.5 : 0) : r || 0);
export const lastSets = exId => { for (const w of S.workouts) { const e = w.entries.find(e => e.ex === exId); if (e) return e.sets; } return null; };

export function startWorkout() { S.draft = { start: Date.now(), entries: [] }; save(); }
export function cancelWorkout() { S.draft = null; save(); }
export function addEntry(exId) {
  const prev = lastSets(exId), type = exById(exId).type;
  const sets = prev ? prev.map(([w, r]) => ({ w, r, done: false })) : Array.from({ length: type === 't' ? 1 : 3 }, () => ({ w: '', r: '', done: false }));
  S.draft.entries.push({ ex: exId, sets }); save();
}
export function addCustomExercise(name, g, type) { const ex = { id: 'c_' + uid(), name: name.trim(), g, type }; S.customEx.push(ex); save(true); return ex; }

export const draftStats = () => {
  let sets = 0, vol = 0, mins = 0;
  for (const e of S.draft?.entries || []) { const type = exById(e.ex).type; for (const s of e.sets) if (s.done && num(s.r)) { if (type === 't') mins += num(s.r); else { sets++; vol += num(s.w) * num(s.r); } } }
  return { sets, vol, mins };
};
// returns true when a checked set beats the stored record (for the live "new record" toast)
export function beatsRecord(exId, w, r) { const pr = S.prs[exId]; return !!pr && setScore(exById(exId).type, num(w), num(r)) > pr.score + 1e-6; }

export function finishWorkout() {
  const d = S.draft; if (!d) return null;
  const { sets, vol, mins } = draftStats();
  if (!sets && !mins) return null;
  const t = today(), entries = [], prs = [], groups = {};
  for (const e of d.entries) {
    const ex = exById(e.ex), done = e.sets.filter(s => s.done && num(s.r)).map(s => [num(s.w), num(s.r)]);
    if (!done.length) continue;
    entries.push({ ex: e.ex, sets: done });
    groups[ex.g] = (groups[ex.g] || 0) + done.length;
    let best = null;
    for (const [w, r] of done) { const sc = setScore(ex.type, w, r); if (!best || sc > best.score) best = { w, r, score: sc, d: t }; }
    const old = S.prs[e.ex];
    if (best && best.score > 0 && (!old || best.score > old.score + 1e-6)) { if (old) prs.push({ ex: e.ex, from: old, to: best }); S.prs[e.ex] = best; }
  }
  touchStreak();
  const base = 20 + sets * 4 + Math.round(mins * 1.5) + prs.length * 30;
  const xp = Math.min(300, Math.round(base * combo())), coins = Math.round(xp / 6);
  const name = Object.entries(groups).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([g]) => GROUPS[g]).join(' + ') || 'Тренування';
  const w = { id: uid(), d: t, ts: Date.now(), dur: Math.max(1, Math.round((Date.now() - d.start) / 60000)), name, entries, vol: Math.round(vol), sets, mins, prs: prs.map(p => p.ex), xp };
  S.workouts.unshift(w); S.draft = null;
  S.counters.workouts++; S.counters.sets += sets; S.counters.volume += vol; S.counters.prs += prs.length;
  day().w++;
  grant(xp, coins, 'body');
  checkAchs(); save();
  return { w, prs, coins };
}
export function deleteWorkout(id) { S.workouts = S.workouts.filter(w => w.id !== id); save(); }
// best score per session for one exercise, oldest → newest
export function exHistory(exId) {
  const type = exById(exId).type, out = [];
  for (let i = S.workouts.length - 1; i >= 0; i--) {
    const e = S.workouts[i].entries.find(e => e.ex === exId);
    if (e) out.push({ d: S.workouts[i].d, score: Math.max(...e.sets.map(([w, r]) => setScore(type, w, r))), top: e.sets.reduce((a, s) => (setScore(type, ...s) > setScore(type, ...a) ? s : a)) });
  }
  return out;
}
