// Local-only helper (loaded on localhost with ?dev=…): seeds demo state for screenshots.
// Examples: ?dev=seed&lv=12&tab=locker   ?dev=seed&lv=31&ov=level   ?dev=fresh
import { ITEMS, xpNeed } from '../js/data.js';
const { G, ui, render, overlay, levelUp, workoutDone } = window.__app;
const q = new URLSearchParams(location.search);
if (q.get('still')) document.documentElement.classList.add('still');
const S = () => G.S;

if (q.get('dev') === 'fresh') { localStorage.clear(); G.resetAll(); }
if (q.get('dev') === 'seed') {
  localStorage.clear(); G.resetAll();
  const s = S(), lv = +q.get('lv') || 12;
  s.name = 'Демо'; s.onboarded = true;
  s.streak = { cur: 9, best: 14, last: G.today() };
  s.stats = { biz: 2200, math: 1300, eng: 1700, dis: 900, body: 500 };
  s.money = { ...s.money, goal: 100000, name: 'Студія', cur: '₴' };
  const inc = (d, amt, src, out) => s.money.log.push({ id: G.uid(), d: G.addDays(G.today(), -d), amt, src, out: !!out });
  inc(0, 18000, 'Клієнт А'); inc(2, 24500, 'Лендинг'); inc(5, 12000, 'Консультація'); inc(3, 6400, 'Сервери', true); inc(8, 9000, 'Клієнт А');
  [[35, 71000], [66, 54000], [96, 88000], [127, 43000], [157, 30000]].forEach(([d, a]) => inc(d, a, 'Проєкти'));
  s.acts = { d: G.today(), n: { reach: 4, meet: 1 } };
  s.skills[0].mins = 760; s.skills[1].mins = 2140; s.skills[2].mins = 310; s.skills.push({ id: G.uid(), name: 'Електроніка', cat: 'eng', mins: 95 });
  s.counters.focusMin = 3305; s.counters.acts = 61; s.counters.drills = 9;
  for (let i = 0; i < 100; i++) if (Math.sin(i * 1.7) > -0.5) s.days[G.addDays(G.today(), -i)] = { xp: Math.round(40 + Math.abs(Math.sin(i * 2.3)) * 320), q: 3, w: 0 };
  s.coins = 640;
  s.counters = { ...s.counters, quests: 88, perfect: 4, workouts: 14, prs: 3, volume: 61250, sets: 240, loot: 5 };
  const mk = (d, name, entries, extra = {}) => ({ id: G.uid(), d: G.addDays(G.today(), -d), ts: 0, dur: 62, name, entries, vol: 5400, sets: 12, mins: 0, prs: [], xp: 96, ...extra });
  s.workouts = [
    mk(1, 'Груди + Руки', [{ ex: 'bench', sets: [[80, 6], [80, 5], [75, 8]] }, { ex: 'curl', sets: [[35, 10], [35, 9]] }], { prs: ['bench'] }),
    mk(3, 'Ноги', [{ ex: 'squat', sets: [[100, 5], [100, 5], [100, 4]] }]),
    mk(5, 'Груди + Плечі', [{ ex: 'bench', sets: [[77.5, 6], [75, 6]] }, { ex: 'ohp', sets: [[45, 8]] }]),
    mk(8, 'Спина', [{ ex: 'bench', sets: [[72.5, 7]] }, { ex: 'pullup', sets: [[0, 12], [0, 10]] }]),
  ];
  s.prs = { bench: { w: 80, r: 6, score: 96, d: G.addDays(G.today(), -1) }, squat: { w: 100, r: 5, score: 116.6, d: G.addDays(G.today(), -3) }, pullup: { w: 0, r: 12, score: 12, d: G.addDays(G.today(), -8) } };
  s.quests[0].doneOn = G.today(); s.quests[0].streak = 9; s.quests[0].last = G.today(); s.quests[2].streak = 4;
  s.quests.push({ id: G.uid(), title: 'Закрити великий дедлайн', cat: 'int', diff: 'x', type: 'once', doneOn: null, streak: 0, last: null });
  // unlock level rewards the same way real play would have by now
  let base = 0; for (let k = 1; k < lv; k++) base += xpNeed(k);
  for (const it of ITEMS.filter(i => i.src && i.src.lv && i.src.lv <= lv).sort((x, y) => x.src.lv - y.src.lv)) { s.owned.push(it.id); s.eq[it.slot] = it.key; }
  s.maxLv = lv;
  const ov = q.get('ov');
  s.xp = ov === 'level' ? base + xpNeed(lv) - 5 : base + Math.round(xpNeed(lv) * 0.62);
  let evs = [];
  if (ov === 'level') { // trigger a genuine level-up
    s.quests.unshift({ id: 'seed', title: 'seed', cat: 'dis', diff: 'e', type: 'once', doneOn: null, streak: 0, last: null });
    G.completeQuest('seed'); S().quests = S().quests.filter(x => x.id !== 'seed'); evs = G.drain();
  }
  if (q.get('eq')) for (const pair of q.get('eq').split(',')) { const [slot, key] = pair.split(':'); s.eq[slot] = key === 'none' ? null : key; if (!s.owned.includes(pair)) s.owned.push(pair); }
  if (q.get('draft')) { G.startWorkout(); G.addEntry('bench'); G.addEntry('pullup'); const e = S().draft.entries[0]; e.sets[0].done = true; S().draft.start = Date.now() - 1385000; }
  G.save();
  if (ov === 'level') overlay(root => levelUp(root, evs.filter(e => e.t === 'level')));
  if (q.get('ov') === 'workout') overlay(root => workoutDone(root, { w: s.workouts[0], prs: [{ ex: 'bench', to: s.prs.bench }], coins: 16 }));
  window.__app.nextOverlay(); // dismiss the onboarding queued at boot
}
if (q.get('tab')) { ui.tab = q.get('tab'); }
if (q.get('stab')) ui.stab = q.get('stab');
if (q.get('focus')) { G.startFocus(G.S.skills[1].id); G.S.focus.start = Date.now() - 2712000; }
if (q.get('slot')) ui.slot = q.get('slot');
if (q.get('try')) ui.tryOn = q.get('try');
if (q.get('qtab')) ui.qtab = q.get('qtab');
render();
if (q.get('sheet') === 'quest') window.__app.A['quest-new']();
if (q.get('sheet') === 'ex') window.__app.A['wk-add']();
if (q.get('sheet') === 'ach') window.__app.A['ach-open']({ dataset: { id: q.get('id') || 'st7' } });
if (q.get('scroll')) setTimeout(() => { document.querySelector('#view').scrollTop = +q.get('scroll'); }, 50);

// scripted smoke test: ?do=selector|type:selector=value|…  (each step 350 ms apart)
if (q.get('do')) {
  const steps = q.get('do').split('|');
  const run = async () => {
    for (const step of steps) {
      await new Promise(r => setTimeout(r, 350));
      if (step.startsWith('type:')) {
        const body = step.slice(5), cut = body.lastIndexOf('='), sel = body.slice(0, cut), val = body.slice(cut + 1);
        const el = document.querySelector(sel);
        if (!el) { console.error('SMOKE missing', sel); continue; }
        el.value = val; el.dispatchEvent(new Event('input', { bubbles: true }));
      } else {
        const el = document.querySelector(step);
        if (!el) { console.error('SMOKE missing', step); continue; }
        el.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: 200, clientY: 400 }));
      }
    }
    console.log('SMOKE done', JSON.stringify({ xp: G.S.xp, coins: G.S.coins, lv: G.level().lv, workouts: G.S.workouts.length, ach: Object.keys(G.S.ach), eq: G.S.eq.top, draft: !!G.S.draft }));
  };
  run();
}
