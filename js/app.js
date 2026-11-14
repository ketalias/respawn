// RESPAWN — screens and interaction.
import * as G from './game.js';
import { S, tg } from './game.js';
import { MODS, xpNeed, rankOf, nextRank, RANKS, CATS, DIFFS, SPHERE_QUESTS, BUBBLES, BUBBLES_HURT, GROUPS, SLOTS, ITEMS, ITEM, RAR, THEMES, ACHS, ACH, attrLevel, catOf, sphereOf, sphereXP, sphereLevel, skillLevel } from './data.js';
import { Stage, AURA, spriteCanvas, sceneCanvas, petCanvas } from './scene.js';
import moneyModule from './money.js';
import mindModule, { clockLong } from './mind.js';
import { $, esc, fmt, icon, buzz, sfx, confetti, rain, floatText, toast, openSheet, closeSheet, overlay, nextOverlay } from './ui.js';

const view = $('#view'), topEl = $('#top'), tabsEl = $('#tabs'), restEl = $('#rest');
// 4 tabs; the 5th place is kept for «Друзі». Money / focus / gym live inside «Сфери».
const TABS = [['home', 'home', 'База'], ['quests', 'sword', 'Квести'], ['spheres', 'hex', 'Сфери'], ['locker', 'shirt', 'Шафка']];
const ui = { tab: 'home', qtab: 'daily', slot: 'top', tryOn: null, exGroup: -1, exQuery: '', qf: null, rest: null, doneOpen: false, stab: 'spheres', sphere: null, sphereBack: null, lastCat: 'dis', lampOff: false, lampTaps: 0, verTaps: 0, heroTaps: 0 };

const acc = () => (THEMES[S.eq.theme] || THEMES.mono)[0];
const ask = msg => new Promise(res => { if (tg?.showConfirm && tg.isVersionAtLeast?.('6.2')) tg.showConfirm(msg, res); else res(confirm(msg)); });
const two = n => String(n).padStart(2, '0');
const clock = sec => `${two(Math.floor(sec / 60))}:${two(Math.floor(sec % 60))}`;
const dateUA = k => { const [y, m, d] = k.split('-').map(Number); return `${d} ${['січ', 'лют', 'бер', 'кві', 'тра', 'чер', 'лип', 'сер', 'вер', 'жов', 'лис', 'гру'][m - 1]}`; };
const kg = n => (Math.round(n * 10) / 10).toString().replace('.', ',');
const setLabel = (type, w, r) => (type === 't' ? `${kg(r)} хв` : type === 'bw' ? `${r} повт${w ? ` +${kg(w)} кг` : ''}` : `${kg(w)} кг × ${r}`);

/* ---------- canvases inside string templates ---------- */
let cvReg = {}, cvN = 0;
const cv = (make, cls = '') => { const id = 'k' + cvN++; cvReg[id] = make; return `<span class="cv ${cls}" data-cv="${id}"></span>`; };
function hydrate(root) {
  root.querySelectorAll('[data-cv]').forEach(el => { const make = cvReg[el.dataset.cv]; if (make) { el.appendChild(make()); delete cvReg[el.dataset.cv]; } el.removeAttribute('data-cv'); });
}
const stages = {};
function stage(name, eq = S.eq, opts) {
  const s = (stages[name] ||= (() => { const c = document.createElement('canvas'); c.className = 'stage-cv'; return { cv: c, st: new Stage(c, opts) }; })());
  s.st.set(G.lookOf(eq), eq.scene, eq.aura, acc(), eq.pet);
  return s;
}
const HEAD = [20, 2, 24, 26];
const CROP = { body: [16, 8, 32, 56], detail: HEAD, hair: HEAD, hairColor: HEAD, skin: HEAD, face: HEAD, head: [18, 0, 28, 28], top: [14, 22, 36, 24], bottom: [19, 40, 26, 24], shoes: [19, 46, 26, 18], back: [2, 6, 60, 58], hand: [28, 30, 24, 24] };

function applyTheme() {
  const [a, ink] = THEMES[S.eq.theme] || THEMES.mono;
  const st = document.documentElement.style;
  st.setProperty('--acc', a); st.setProperty('--acc-ink', ink);
}

/* ---------- shared fragments ---------- */
function questCard(q) {
  const done = G.isDone(q), D = DIFFS[q.diff] || DIFFS.m, C = catOf(q.cat);
  return `<div class="quest ${done ? 'done' : ''} d-${q.diff}">
    <button class="qcheck" data-act="quest-toggle" data-id="${q.id}" aria-label="Виконати">${icon('check')}</button>
    <div class="qbody" data-act="quest-edit" data-id="${q.id}">
      <div class="qtitle">${esc(q.title)}</div>
      <div class="qmeta"><span class="tag">${icon(C.icon)}${C.name}</span><span class="tag xp">+${Math.round(D.xp * G.combo())} XP</span><span class="tag coin">${icon('coin')}${D.coins}</span>${q.type === 'daily' && q.streak > 1 ? `<span class="tag fire">${icon('flame')}${q.streak}</span>` : ''}</div>
    </div>
  </div>`;
}
const sortQ = list => [...list].sort((a, b) => G.isDone(a) - G.isDone(b));
// Ukrainian plural: 1 квест · 2 квести · 5 квестів
const plural = (n, one, few, many) => (n % 10 === 1 && n % 100 !== 11 ? one : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? few : many);
const sec = (title, right = '') => `<div class="sec"><h3>${title}</h3>${right}</div>`;
const tile = (val, label, ic) => `<div class="tile"><div class="tile-v">${ic ? icon(ic) : ''}${val}</div><div class="tile-l">${label}</div></div>`;

/* ---------- header + tabs ---------- */
function renderTop() {
  const L = G.level(), r = G.rank();
  topEl.innerHTML = `<button class="who" data-act="go" data-tab="profile">
      ${cv(() => spriteCanvas(G.lookOf(), HEAD), 'ava')}
      <span class="who-t"><b>${esc(G.playerName())}</b><small>LV ${L.lv} · ${G.nm(r)}</small></span>
    </button>
    <div class="top-r">
      <span class="pill fire ${S.streak.cur ? '' : 'off'}">${icon('flame')}${S.streak.cur}</span>
      <button class="pill coin" data-act="wallet" aria-label="Монети">${icon('coin')}${fmt(S.coins)}</button>
    </div>`;
  hydrate(topEl);
}
function renderTabs() {
  tabsEl.innerHTML = TABS.map(([id, ic, name]) => `<button class="tab ${ui.tab === id ? 'on' : ''}" data-act="go" data-tab="${id}">${icon(ic)}<span>${name}</span></button>`).join('');
}

/* ---------- HOME ---------- */
function nextReward() {
  const lv = G.level().lv;
  const item = ITEMS.filter(i => i.src && i.src.lv > lv).sort((a, b) => a.src.lv - b.src.lv)[0];
  const rk = nextRank(lv);
  const at = Math.min(item ? item.src.lv : 99, rk ? rk.lv : 99);
  if (at === 99) return '';
  let left = -G.level().cur; for (let k = lv; k < at; k++) left += xpNeed(k);
  const items = ITEMS.filter(i => i.src && i.src.lv === at);
  const evo = rk && rk.lv === at ? rk : null;
  const first = items[0];
  const thumb = first && CROP[first.slot] ? cv(() => spriteCanvas(G.lookOf({ ...S.eq, [first.slot]: first.key }), CROP[first.slot]), 'nx-thumb') : `<span class="nx-thumb ph">${icon(evo ? 'bolt' : 'star')}</span>`;
  return `<section class="card next">
    ${thumb}
    <div class="nx-b">
      <div class="lbl">Наступна нагорода · LV ${at}</div>
      <div class="nx-t">${[evo ? `Ранг «${G.nm(evo)}»` : '', ...items.map(i => i.name)].filter(Boolean).join(' · ')}</div>
      <div class="nx-s">${icon('lock')}ще ${fmt(left)} XP</div>
    </div>
  </section>`;
}

function home() {
  const L = G.level(), r = G.rank(), pct = Math.round((L.cur / L.need) * 100);
  const dailies = S.quests.filter(q => q.type === 'daily'), dDone = dailies.filter(G.isDone).length;
  const list = sortQ(S.quests.filter(q => q.type === 'daily' || !q.doneOn)).filter(q => !G.isDone(q)).slice(0, 4);
  const c = G.combo();
  return `<section class="stage-card">
    <div class="stage-wrap" data-act="hero-tap">
      ${cv(() => stage('home', S.eq, { w: 120, h: 100, floor: 15 }).cv)}
      <div class="scan"></div>
      <div class="hud tl"><div class="lvbig"><small>LV</small>${two(L.lv)}</div><div class="rank">${G.nm(r)}</div></div>
      <div class="hud tr">${c > 1 ? `<span class="chip combo">COMBO ×${c}</span>` : ''}${S.eq.aura && ITEM['aura:' + S.eq.aura] ? `<span class="chip" style="color:${AURA[S.eq.aura]}">${ITEM['aura:' + S.eq.aura].name}</span>` : ''}</div>
      <div class="bubble" id="bubble"></div>
    </div>
    <div class="xp">
      <div class="xp-bar"><i style="width:${pct}%"></i></div>
      <div class="xp-meta"><span><b>${fmt(L.cur)}</b> / ${fmt(L.need)} XP</span><span>до LV ${L.lv + 1}: ${fmt(L.need - L.cur)}</span></div>
    </div>
  </section>
  <div class="tiles">
    ${tile('+' + fmt(G.day().xp), 'XP сьогодні', 'bolt')}
    ${tile(`${dDone}/${dailies.length}`, 'щоденки', 'sword')}
    ${tile(S.streak.cur, S.streak.cur ? 'днів стрік' : 'стрік', 'flame')}
  </div>
  ${G.lootReady() ? `<button class="card loot" data-act="loot"><span class="loot-i">${icon('chest')}</span><span class="loot-t"><b>Денний лут</b><small>Тапни, щоб відкрити скриню</small></span><span class="loot-go">${icon('play')}</span></button>` : ''}
  ${S.draft ? `<button class="card loot live" data-act="go" data-tab="spheres" data-stab="body"><span class="loot-i">${icon('dumbbell')}</span><span class="loot-t"><b>Тренування триває</b><small>Повернутися до залу</small></span><span class="loot-go">${icon('play')}</span></button>` : ''}
  ${S.focus ? `<button class="card loot live" data-act="go" data-tab="spheres" data-stab="mind"><span class="loot-i">${icon('clock')}</span><span class="loot-t"><b>Фокус-сесія йде</b><small>${esc(S.skills.find(k => k.id === S.focus.skill)?.name || '')}</small></span><span class="loot-go">${icon('play')}</span></button>` : ''}

  ${sec('Квести дня', `<button class="link" data-act="go" data-tab="quests">усі →</button>`)}
  <div class="qlist">${list.length ? list.map(questCard).join('') : `<div class="empty">${icon('star')}<b>Усе закрито</b><span>${dailies.length ? 'Ідеальний день. Додай ще квест або відпочивай.' : 'Додай свої перші квести.'}</span></div>`}</div>
  ${S.mods.drill && G.drillFresh() ? mind.drillCard() : ''}
  ${S.mods.money ? money.homeCard() : ''}
  ${nextReward()}`;
}

/* ---------- QUESTS ---------- */
function quests() {
  const daily = S.quests.filter(q => q.type === 'daily'), once = S.quests.filter(q => q.type === 'once');
  const open = once.filter(q => !q.doneOn), closed = once.filter(q => q.doneOn);
  const dDone = daily.filter(G.isDone).length;
  const body = ui.qtab === 'daily'
    ? (daily.length ? `<div class="daybar"><div class="daybar-t"><span>Прогрес дня</span><b>${dDone}/${daily.length}</b></div><div class="segs">${daily.map((q, i) => `<i class="${i < dDone ? 'on' : ''}"></i>`).join('')}</div>${daily.length >= 3 ? `<small>${G.day().perfect ? 'Ідеальний день зараховано' : 'Закрий усі — бонус +50 XP і 20 монет'}</small>` : ''}</div>` : '')
      + `<div class="qlist">${sortQ(daily).map(questCard).join('') || `<div class="empty">${icon('sword')}<b>Порожньо</b><span>Щоденні квести оновлюються опівночі.</span></div>`}</div>`
    : `<div class="qlist">${open.map(questCard).join('') || `<div class="empty">${icon('target')}<b>Немає місій</b><span>Місія — разова ціль: закрив і забрав XP.</span></div>`}</div>
       ${closed.length ? `<button class="fold" data-act="done-toggle">${ui.doneOpen ? '▾' : '▸'} Виконані · ${closed.length}</button>${ui.doneOpen ? `<div class="qlist">${closed.map(questCard).join('')}</div>` : ''}` : ''}`;
  return `<div class="seg2">
      <button class="${ui.qtab === 'daily' ? 'on' : ''}" data-act="qtab" data-v="daily">Щоденні<i>${dDone}/${daily.length}</i></button>
      <button class="${ui.qtab === 'once' ? 'on' : ''}" data-act="qtab" data-v="once">Місії<i>${open.length}</i></button>
    </div>
    <button class="btn dashed" data-act="quest-new">${icon('plus')}Новий квест</button>
    ${body}`;
}

// ready-made quests of a sphere that the player doesn't have yet → [[title, diff, type], index][]
const freshIdeas = id => { const have = new Set(S.quests.map(q => q.title.trim().toLowerCase())); return (SPHERE_QUESTS[id] || []).map((x, i) => [x, i]).filter(([x]) => !have.has(x[0].toLowerCase())); };
const qfSum = f => { const D = DIFFS[f.diff] || DIFFS.m; return `${f.type === 'once' ? 'Місія' : 'Щоденний'} · ${D.name} · ${D.xp} XP`; };
const qfIdeas = f => freshIdeas(f.cat).map(([x, i]) => `<button class="chip-b sm" data-act="idea" data-s="${f.cat}" data-i="${i}">${esc(x[0])}</button>`).join('') || '<span class="note">Усі ідеї цієї сфери вже у твоїх квестах.</span>';
function questSheet(q, cat) {
  const f = ui.qf = q ? { id: q.id, title: q.title, cat: sphereOf(q.cat), diff: q.diff, type: q.type } : { title: '', cat: cat || ui.lastCat, diff: 'm', type: ui.qtab === 'once' ? 'once' : 'daily' };
  ui.sphereBack = $('#sph') ? ui.sphere : null; // opened from a sphere card → go back there after saving
  openSheet(`<h2>${q ? 'Редагувати квест' : 'Новий квест'}</h2>
    <input class="field" id="qf-title" maxlength="80" placeholder="Що треба зробити?" value="${esc(f.title)}" autocomplete="off">
    <div class="lbl">Сфера</div>
    <div class="chips three">${Object.entries(CATS).map(([v, c]) => `<button class="chip-b ${f.cat === v ? 'on' : ''}" data-act="qf" data-k="cat" data-v="${v}">${icon(c.icon)}${c.name}</button>`).join('')}</div>
    ${q ? '' : `<div class="lbl">Ідеї</div><div class="chips wrap ideas" id="qf-ideas">${qfIdeas(f)}</div>`}
    <button class="fold" data-act="qf-more">${q ? '▾' : '▸'} Більше · <span id="qf-sum">${qfSum(f)}</span></button>
    <div id="qf-more" ${q ? '' : 'hidden'}>
      <div class="lbl">Тип</div>
      <div class="chips" data-group="type">${[['daily', 'Щоденний'], ['once', 'Місія']].map(([v, n]) => `<button class="chip-b ${f.type === v ? 'on' : ''}" data-act="qf" data-k="type" data-v="${v}">${n}</button>`).join('')}</div>
      <div class="lbl">Складність</div>
      <div class="chips four">${Object.entries(DIFFS).map(([v, d]) => `<button class="chip-b col d-${v} ${f.diff === v ? 'on' : ''}" data-act="qf" data-k="diff" data-v="${v}"><b>${d.name}</b><small>${d.xp} XP</small></button>`).join('')}</div>
    </div>
    <div class="sheet-foot">${q ? `<button class="btn ghost danger" data-act="quest-del">${icon('trash')}</button>` : ''}<button class="btn solid grow" data-act="quest-save">${q ? 'Зберегти' : 'Додати квест'}</button></div>`);
}
const afterQuestSheet = () => { if (ui.sphereBack) sphereSheet(ui.sphereBack); else closeSheet(); ui.sphereBack = null; };

/* ---------- GYM ---------- */
function gym() {
  if (S.draft) return gymLive();
  const prs = Object.entries(S.prs).sort((a, b) => (b[1].d || '').localeCompare(a[1].d || '')).slice(0, 6);
  return `<section class="card gym-hero">
      <div class="lbl">Журнал заліза</div>
      <h2>${S.workouts.length ? G.g('Готовий до підходу?', 'Готова до підходу?') : 'Перше тренування'}</h2>
      <p>Кожен підхід — це XP. Побив рекорд — бонус +30 XP.</p>
      <button class="btn solid big" data-act="wk-start">${icon('play')}Почати тренування</button>
    </section>
    <div class="tiles">
      ${tile(S.counters.workouts, 'тренувань', 'dumbbell')}
      ${tile(kg(S.counters.volume / 1000), 'тонн піднято', 'bolt')}
      ${tile(S.counters.prs, 'рекордів', 'medal')}
    </div>
    ${prs.length ? sec('Рекорди') + `<div class="rows">${prs.map(([id, p]) => { const ex = G.exById(id); return `<button class="row" data-act="pr-open" data-id="${id}"><span class="row-i">${icon('medal')}</span><span class="row-t"><b>${esc(ex.name)}</b><small>${dateUA(p.d)}</small></span><span class="row-v">${setLabel(ex.type, p.w, p.r)}</span></button>`; }).join('')}</div>` : ''}
    ${sec('Історія')}
    <div class="rows">${S.workouts.slice(0, 30).map(w => `<button class="row" data-act="wk-open" data-id="${w.id}"><span class="row-i">${icon('dumbbell')}</span><span class="row-t"><b>${esc(w.name)}</b><small>${dateUA(w.d)} · ${w.dur} хв · ${w.sets} підх.${w.prs.length ? ` · ${w.prs.length} PR` : ''}</small></span><span class="row-v">+${w.xp} XP</span></button>`).join('') || `<div class="empty">${icon('dumbbell')}<b>Ще порожньо</b><span>Тут з'являться твої тренування.</span></div>`}</div>`;
}

function gymLive() {
  const d = S.draft, st = G.draftStats();
  const est = Math.min(300, Math.round((20 + st.sets * 4 + Math.round(st.mins * 1.5)) * G.combo()));
  return `<section class="card wk-head">
      <div><div class="lbl">Тренування</div><div class="wk-time" id="wk-time">${clock((Date.now() - d.start) / 1000)}</div></div>
      <div class="wk-stats"><span><b>${st.sets}</b>підходів</span><span><b>${fmt(st.vol)}</b>кг</span></div>
    </section>
    ${d.entries.map((e, i) => {
      const ex = G.exById(e.ex), pr = S.prs[e.ex];
      return `<section class="card entry">
        <header><div><b>${esc(ex.name)}</b><small>${pr ? `Рекорд: ${setLabel(ex.type, pr.w, pr.r)}` : GROUPS[ex.g]}</small></div><button class="icon-b" data-act="entry-del" data-e="${i}" aria-label="Прибрати">${icon('x')}</button></header>
        <div class="sets">${e.sets.map((s, j) => `<div class="set ${s.done ? 'done' : ''}">
          <span class="set-n">${j + 1}</span>
          ${ex.type === 't' ? '' : `<input class="in" inputmode="decimal" placeholder="${ex.type === 'bw' ? '+кг' : 'кг'}" value="${esc(s.w)}" data-e="${i}" data-s="${j}" data-f="w"><span class="set-x">×</span>`}
          <input class="in" inputmode="decimal" placeholder="${ex.type === 't' ? 'хвилин' : 'повт'}" value="${esc(s.r)}" data-e="${i}" data-s="${j}" data-f="r">
          <button class="setck" data-act="set-toggle" data-e="${i}" data-s="${j}" aria-label="Готово">${icon('check')}</button>
        </div>`).join('')}</div>
        <div class="entry-foot"><button class="btn ghost sm" data-act="set-add" data-e="${i}">${icon('plus')}Підхід</button>${e.sets.length > 1 ? `<button class="btn ghost sm" data-act="set-rem" data-e="${i}">Прибрати останній</button>` : ''}</div>
      </section>`;
    }).join('')}
    <button class="btn dashed" data-act="wk-add">${icon('plus')}Додати вправу</button>
    <div class="wk-foot">
      <button class="btn ghost" data-act="wk-cancel">Скасувати</button>
      <button class="btn solid grow" data-act="wk-finish" ${st.sets || st.mins ? '' : 'disabled'}>Завершити${st.sets || st.mins ? ` · +${est} XP` : ''}</button>
    </div>
    <p class="note">Зараховуються лише підходи з галочкою.</p>`;
}

function exList() {
  const q = ui.exQuery.trim().toLowerCase();
  const list = G.allExercises().filter(e => (ui.exGroup < 0 || e.g === ui.exGroup) && (!q || e.name.toLowerCase().includes(q)));
  return list.map(e => `<button class="row" data-act="ex-pick" data-id="${e.id}"><span class="row-t"><b>${esc(e.name)}</b><small>${GROUPS[e.g]}${S.prs[e.id] ? ` · рекорд ${setLabel(e.type, S.prs[e.id].w, S.prs[e.id].r)}` : ''}</small></span><span class="row-v">${icon('plus')}</span></button>`).join('')
    || `<div class="empty"><span>Нічого не знайдено — додай свою вправу нижче.</span></div>`;
}
function exSheet() {
  ui.exQuery = '';
  openSheet(`<h2>Вправа</h2>
    <input class="field" id="ex-search" placeholder="Пошук…" autocomplete="off">
    <div class="chips scroll" id="ex-groups">${[['-1', 'Усі'], ...GROUPS.map((g, i) => [i, g])].map(([i, g]) => `<button class="chip-b sm ${+i === ui.exGroup ? 'on' : ''}" data-act="ex-group" data-v="${i}">${g}</button>`).join('')}</div>
    <div class="rows tall" id="ex-list">${exList()}</div>
    <div class="lbl">Своя вправа</div>
    <div class="custom"><input class="field" id="ex-name" maxlength="40" placeholder="Назва">
      <select class="field" id="ex-g">${GROUPS.map((g, i) => `<option value="${i}">${g}</option>`).join('')}</select>
      <select class="field" id="ex-type"><option value="w">Вага × повтори</option><option value="bw">Власна вага</option><option value="t">На час</option></select>
      <button class="btn solid" data-act="ex-custom">${icon('plus')}</button></div>`);
}

function spark(points) {
  if (points.length < 2) return '<div class="note">Графік з\'явиться після другого тренування з цією вправою.</div>';
  const vals = points.map(p => p.score), min = Math.min(...vals), max = Math.max(...vals), W = 300, H = 90;
  const xy = points.map((p, i) => [8 + (i / (points.length - 1)) * (W - 16), H - 10 - ((p.score - min) / (max - min || 1)) * (H - 24)]);
  let d = `M${xy[0][0]} ${xy[0][1]}`; for (let i = 1; i < xy.length; i++) d += `H${xy[i][0]}V${xy[i][1]}`;
  return `<svg class="spark" viewBox="0 0 ${W} ${H}"><path d="${d}V${H}H${xy[0][0]}z" class="spark-a"/><path d="${d}" class="spark-l"/>${xy.map(([x, y]) => `<rect x="${x - 3}" y="${y - 3}" width="6" height="6" class="spark-p"/>`).join('')}</svg>`;
}

/* ---------- LOCKER ---------- */
function itemState(it) {
  if (G.has(it.id)) return { owned: true };
  if (it.src.sp) return { sp: it.src.sp, at: it.src.at };
  if (it.src.coins) return { price: it.src.coins, ok: S.coins >= it.src.coins };
  if (it.src.lv) return { lv: it.src.lv };
  return { ach: ACH[it.src.ach] };
}
function itemThumb(it) {
  if (it.slot === 'scene') return cv(() => sceneCanvas(it.key, acc()), 'th scene');
  if (it.slot === 'pet') return cv(() => petCanvas(it.key), 'th pet');
  if (it.slot === 'aura' || it.slot === 'theme') return `<span class="th swatch" style="--sw:${it.sw}"><i></i></span>`;
  const eq = it.slot === 'body' ? { ...S.eq, top: 'tee_gray', back: null, hand: null, head: null } : S.eq; // silhouette shows best in a plain tee
  return cv(() => spriteCanvas(G.lookOf({ ...eq, [it.slot]: it.key }), CROP[it.slot]), it.slot === 'body' ? 'th full' : 'th');
}
function locker() {
  if (ui.tryOn && G.has(ui.tryOn)) ui.tryOn = null;
  const slot = SLOTS.find(s => s.id === ui.slot), t = ui.tryOn && ITEM[ui.tryOn];
  const eq = t ? { ...S.eq, [t.slot]: t.key } : S.eq;
  const st = t && itemState(t);
  const items = ITEMS.filter(i => i.slot === ui.slot);
  const r = G.rank(), ownedN = ITEMS.filter(i => G.has(i.id)).length;
  return `<section class="locker">
      <div class="locker-in ${ui.lampOff ? 'dark' : ''}">
        <button class="lamp" data-act="lamp" aria-label="Лампа"></button>
        ${cv(() => stage('locker', eq, { w: 96, h: 100, floor: 14 }).cv)}
        <div class="scan"></div>
      </div>
      <div class="locker-door">
        <div class="sticker big">${two(G.level().lv)}<small>LV</small></div>
        <div class="sticker tape">${G.nm(r)}</div>
        <div class="sticker dark">${ownedN}/${ITEMS.length}<small>скінів</small></div>
        <div class="vents"><i></i><i></i><i></i><i></i></div>
      </div>
    </section>
    ${t ? `<div class="tryon rar-${t.rar}">
        <div class="tryon-t"><small>Примірка · ${RAR[t.rar]}</small><b>${t.name}</b></div>
        ${st.price ? `<button class="btn solid" data-act="buy" data-id="${t.id}" ${st.ok ? '' : 'disabled'}>${icon('coin')}${st.price}${st.ok ? '' : ` · бракує ${st.price - S.coins}`}</button>`
          : `<span class="tryon-lock">${icon('lock')}${st.sp ? `Сфера «${CATS[st.sp].name}» LV ${st.at}` : st.lv ? `Відкриється на LV ${st.lv}` : `Ачівка «${st.ach.secret && !S.ach[st.ach.id] ? '???' : st.ach.name}»`}</span>`}
        <button class="icon-b" data-act="tryon-clear" aria-label="Зняти">${icon('x')}</button>
      </div>` : ''}
    <div class="chips scroll slots">${SLOTS.map(s => `<button class="chip-b sm ${s.id === ui.slot ? 'on' : ''}" data-act="slot" data-v="${s.id}">${s.name}</button>`).join('')}</div>
    <div class="items">
      ${slot.opt ? `<button class="item ${!S.eq[slot.id] && !t ? 'on' : ''}" data-act="item-none"><span class="th none">${icon('x')}</span><b>Нічого</b><small>зняти</small></button>` : ''}
      ${items.map(it => {
        const s = itemState(it), on = S.eq[it.slot] === it.key && s.owned;
        return `<button class="item rar-${it.rar} ${on ? 'on' : ''} ${s.owned ? '' : 'locked'} ${ui.tryOn === it.id ? 'try' : ''}" data-act="item" data-id="${it.id}">
          ${itemThumb(it)}<b>${it.name}</b>
          <small>${s.owned ? (on ? 'одягнено' : 'маєш') : s.sp ? `${icon(CATS[s.sp].icon)}LV ${s.at}` : s.price ? `${icon('coin')}${s.price}` : s.lv ? `${icon('lock')}LV ${s.lv}` : `${icon('medal')}ачівка`}</small>
        </button>`;
      }).join('')}
    </div>
    ${sec('Образи', '<span class="count">тап — надіти</span>')}
    <div class="looks">${[0, 1, 2].map(i => {
      const L = S.looks[i];
      return L ? `<div class="look"><button class="look-b" data-act="look-wear" data-i="${i}">${cv(() => spriteCanvas(G.lookOf({ ...S.eq, ...L.eq }), CROP.body), 'th full')}<b>Образ ${i + 1}</b></button><button class="look-x" data-act="look-del" data-i="${i}" aria-label="Видалити образ">${icon('x')}</button></div>`
        : `<button class="look empty" data-act="look-save" data-i="${i}">${icon('plus')}<b>Зберегти поточний</b></button>`;
    }).join('')}</div>`;
}

/* ---------- PROFILE ---------- */
function radar() {
  const keys = Object.keys(CATS), n = keys.length, lv = keys.map(k => attrLevel(sphereXP(S.stats, k))), max = Math.max(5, ...lv) + 1, R = 64, c = 90;
  const xy = (i, k) => { const a = -Math.PI / 2 + (i * 2 * Math.PI) / n; return [+(c + Math.cos(a) * R * k).toFixed(1), +(c + 4 + Math.sin(a) * R * k).toFixed(1)]; };
  const poly = f => keys.map((_, i) => xy(i, f(i)).join(',')).join(' ');
  return `<svg class="radar" viewBox="0 0 180 180">${[1, 0.66, 0.33].map(k => `<polygon points="${poly(() => k)}" class="rd-g"/>`).join('')}
    ${keys.map((_, i) => { const [x, y] = xy(i, 1); return `<line x1="${c}" y1="${c + 4}" x2="${x}" y2="${y}" class="rd-g"/>`; }).join('')}
    <polygon points="${poly(i => Math.max(0.08, lv[i] / max))}" class="rd-v"/>
    ${lv.map((v, i) => { const [x, y] = xy(i, Math.max(0.08, v / max)); return `<rect x="${x - 3}" y="${y - 3}" width="6" height="6" class="rd-p"/>`; }).join('')}
  </svg>`;
}
function heat() {
  const t = new Date(); t.setHours(12, 0, 0, 0);
  const dow = (t.getDay() + 6) % 7, weeks = 17, cells = [];
  const start = new Date(t); start.setDate(t.getDate() - dow - (weeks - 1) * 7);
  for (let i = 0; i < weeks * 7; i++) {
    const d = new Date(start); d.setDate(start.getDate() + i);
    const k = G.dkey(d), xp = S.days[k]?.xp || 0;
    cells.push(d > t ? '<i class="f"></i>' : `<i class="h${xp >= 300 ? 4 : xp >= 150 ? 3 : xp >= 50 ? 2 : xp > 0 ? 1 : 0}${k === G.today() ? ' now' : ''}"></i>`);
  }
  return `<div class="heat">${cells.join('')}</div>`;
}
function profile() {
  const L = G.level(), r = G.rank(), nr = nextRank(L.lv), achs = ACHS.filter(a => !a.mod || S.mods[a.mod] || S.ach[a.id]), got = achs.filter(a => S.ach[a.id]).length;
  const days = Math.max(1, Math.round((Date.now() - new Date(S.createdAt + 'T00:00:00')) / 864e5) + 1);
  const row = (k, v) => `<div class="kv"><span>${k}</span><b>${v}</b></div>`;
  return `<section class="card prof">
      ${cv(() => spriteCanvas(G.lookOf(), [16, 0, 32, 44]), 'prof-ava')}
      <div class="prof-b">
        <div class="lbl">Online… день ${days}</div>
        <button class="prof-name" data-act="name-edit">${esc(G.playerName())}</button>
        <div class="prof-rank">LV ${L.lv} · ${G.nm(r)}</div>
        ${nr ? `<div class="ranks">${RANKS.map(x => `<i class="${L.lv >= x.lv ? 'on' : ''}" title="${G.nm(x)}"></i>`).join('')}</div><small>Наступний ранг: ${G.nm(nr)} на LV ${nr.lv}</small>` : '<small>Максимальний ранг. Ти і є фінальний бос.</small>'}
      </div>
    </section>
    <section class="card attrs">
      ${radar()}
      <div class="attr-l">${Object.entries(CATS).map(([k, c]) => `<div class="attr">${icon(c.icon)}<span>${c.attr}</span><b>${attrLevel(sphereXP(S.stats, k))}</b></div>`).join('')}</div>
    </section>
    <section class="card"><div class="lbl">Активність · 17 тижнів</div>${heat()}</section>
    ${sec('Ачівки', `<span class="count">${got}/${achs.length}</span>`)}
    <div class="achs">${achs.map(a => { const on = !!S.ach[a.id]; return `<button class="ach t-${a.tier} ${on ? 'on' : ''}" data-act="ach-open" data-id="${a.id}"><span class="ach-i">${icon(on ? a.icon : 'lock')}</span><small>${a.secret && !on ? '???' : G.nm(a)}</small></button>`; }).join('')}</div>
    ${sec('Статистика')}
    <section class="card kvs">
      ${row('Усього XP', fmt(S.xp))}${row('Квестів виконано', fmt(S.counters.quests))}${row('Ідеальних днів', S.counters.perfect)}
      ${row('Найдовший стрік', S.streak.best + ' дн.')}${row('Зароблено всього', fmt(S.money.log.reduce((a, e) => a + (e.out ? 0 : e.amt), 0)) + ' ' + esc(S.money.cur))}${row('Місячних босів убито', S.counters.goals)}
      ${row('Бізнес-дій', fmt(S.counters.acts))}${row('Годин фокусу', kg(S.counters.focusMin / 60))}${row('Розминок мозку', S.counters.drills)}${row('Тренувань', S.counters.workouts)}
    </section>
    ${sec('Налаштування')}
    <section class="card kvs">
      <div class="kv"><span>Звертання</span><div class="chips">${[['m', 'Він'], ['f', 'Вона']].map(([v, n]) => `<button class="chip-b sm ${S.profile.g === v ? 'on' : ''}" data-act="set-g" data-v="${v}">${n}</button>`).join('')}</div></div>
      ${MODS.map(([k, n, d]) => `<div class="kv"><span>${n}<small class="kv-s">${d}</small></span><button class="sw ${S.mods[k] ? 'on' : ''}" data-act="mod-toggle" data-k="${k}" aria-label="${n}"><i></i></button></div>`).join('')}
      <div class="kv"><span>Звук</span><button class="sw ${S.settings.sound ? 'on' : ''}" data-act="set-toggle-opt" data-k="sound" aria-label="Звук"><i></i></button></div>
      <div class="kv"><span>Вібрація</span><button class="sw ${S.settings.haptics ? 'on' : ''}" data-act="set-toggle-opt" data-k="haptics" aria-label="Вібрація"><i></i></button></div>
      <div class="kv"><span>Відпочинок між підходами</span><div class="chips">${[0, 60, 90, 120, 180].map(v => `<button class="chip-b sm ${S.settings.rest === v ? 'on' : ''}" data-act="set-rest" data-v="${v}">${v ? v + 'с' : 'вимк'}</button>`).join('')}</div></div>
      <div class="kv col"><span>Збереження${tg ? ' · синхронізується з Telegram' : ' · на цьому пристрої'}</span><div class="chips"><button class="chip-b sm" data-act="export">Експорт</button><button class="chip-b sm" data-act="import">Імпорт</button><button class="chip-b sm danger" data-act="reset">Скинути все</button></div></div>
    </section>
    <p class="note center"><button data-act="ver">RESPAWN · v2.0</button></p>`;
}

/* ---------- render ---------- */
const ctx = { G, ui, icon, esc, fmt, tile, sec, openSheet, closeSheet, react, render, sfx, buzz, toast, ask, dateUA, confetti, rain, overlay, nextOverlay, $ };
const money = moneyModule(ctx), mind = mindModule(ctx);
/* ---------- SPHERES ---------- */
const sphereLv = id => sphereLevel(sphereXP(S.stats, id));
const activeIn = id => S.quests.filter(q => sphereOf(q.cat) === id && (q.type === 'daily' || !q.doneOn));
function sphereRow(id) {
  const c = CATS[id], L = sphereLv(id), qn = activeIn(id).length, kn = S.skills.filter(k => sphereOf(k.cat) === id).length, td = G.day().s?.[id] || 0;
  const meta = [qn ? `${qn} ${plural(qn, 'квест', 'квести', 'квестів')}` : 'квестів ще немає', kn ? `${kn} ${plural(kn, 'скіл', 'скіли', 'скілів')}` : '', td ? `+${fmt(td)} XP сьогодні` : ''].filter(Boolean).join(' · ');
  return `<div class="skill sph-row">
    <button class="skill-b" data-act="sphere-open" data-id="${id}">
      <div class="skill-t"><b>${icon(c.icon)}${c.name}</b><span>LV ${L.lv}</span></div>
      <div class="skill-bar"><i style="width:${Math.max(2, (L.cur / L.need) * 100)}%"></i></div>
      <small>${meta}</small>
    </button>
    <button class="skill-go" data-act="quest-new" data-cat="${id}" aria-label="Новий квест: ${c.name}">${icon('plus')}</button>
  </div>`;
}
function spheresHome() {
  const ids = Object.keys(CATS), lv = Object.fromEntries(ids.map(id => [id, sphereLv(id).lv]));
  const top = ids.reduce((a, b) => (lv[b] > lv[a] ? b : a)), low = ids.reduce((a, b) => (lv[b] < lv[a] ? b : a));
  const pill = id => `<b>${icon(CATS[id].icon)}${CATS[id].name}<i>LV ${lv[id]}</i></b>`;
  return `<section class="card attrs">${radar()}
      <div class="sph-sum">${lv[top] === lv[low] ? '<div class="lbl">Баланс</div><b>Усі сфери рівні</b><small>Почни з будь-якої — XP піде у її шестикутник.</small>'
        : `<div class="lbl">Найсильніша</div>${pill(top)}<div class="lbl">Підтягни</div>${pill(low)}`}</div>
    </section>
    <div class="skills">${ids.map(sphereRow).join('')}</div>
    <p class="note">Квест, скіл, тренування чи дохід приносять XP у свою сферу. Тапни сферу — там готові квести.</p>`;
}
function sphereBody(id) {
  const c = CATS[id], xp = sphereXP(S.stats, id), L = sphereLevel(xp), qs = sortQ(activeIn(id)), ks = S.skills.filter(k => sphereOf(k.cat) === id), tpl = freshIdeas(id);
  return `<h2 class="sph-h">${icon(c.icon)}${c.name}</h2>
    <div class="lbl">LV ${L.lv} · ${fmt(xp)} XP · до LV ${L.lv + 1}: ${fmt(L.left)} XP</div>
    <div class="xp-bar slim"><i style="width:${Math.max(2, (L.cur / L.need) * 100)}%"></i></div>
    ${sec('Квести', `<span class="count">${qs.length}</span>`)}
    <div class="qlist">${qs.map(questCard).join('') || `<div class="empty"><span>Тут ще порожньо — візьми готовий квест нижче.</span></div>`}</div>
    ${tpl.length ? `${sec('Готові квести')}<div class="chips wrap ideas">${tpl.map(([x, i]) => `<button class="chip-b sm" data-act="tpl-add" data-s="${id}" data-i="${i}">${icon('plus')}${esc(x[0])}</button>`).join('')}</div><p class="note">Тап — і квест одразу у твоєму списку.</p>` : ''}
    ${ks.length ? `${sec('Скіли')}<div class="rows">${ks.map(k => `<div class="row static"><span class="row-t"><b>${esc(k.name)}</b><small>LV ${skillLevel(k.mins)} · ${kg(k.mins / 60)} год фокусу</small></span></div>`).join('')}</div>` : ''}
    <div class="sheet-foot"><button class="btn solid grow" data-act="quest-new" data-cat="${id}">${icon('plus')}Свій квест</button></div>`;
}
function sphereSheet(id) { ui.sphere = id; openSheet(`<div id="sph">${sphereBody(id)}</div>`); }
function spheres() {
  const m = S.mods, seg = [['spheres', 'Сфери'], m.money && ['money', 'Гроші'], (m.focus || m.drill) && ['mind', m.focus ? 'Фокус' : 'Розминка'], m.gym && ['body', 'Зал']].filter(Boolean);
  if (!seg.some(([v]) => v === ui.stab)) ui.stab = 'spheres';
  const body = ui.stab === 'body' ? gym() : ui.stab === 'mind' ? mind.view() : ui.stab === 'money' ? money.view() : spheresHome();
  return `${seg.length > 1 ? `<div class="seg2 n${seg.length}">${seg.map(([v, n]) => `<button class="${ui.stab === v ? 'on' : ''}" data-act="stab" data-v="${v}">${n}</button>`).join('')}</div>` : ''}${body}`;
}
const VIEWS = { home, quests, money: money.view, spheres, locker, profile };
function render() {
  if (ui.tab === 'money') { ui.tab = 'spheres'; ui.stab = 'money'; } // old links / deep links
  applyTheme(); cvReg = {};
  renderTop(); renderTabs();
  view.dataset.tab = ui.tab;
  view.innerHTML = (VIEWS[ui.tab] || VIEWS.home)();
  hydrate(view);
  const sph = $('#sph'); if (sph && ui.sphere) sph.innerHTML = sphereBody(ui.sphere); // open sphere card follows the game state
  renderRest();
}
let enterTimer = null;
function enter() { view.classList.add('enter'); clearTimeout(enterTimer); enterTimer = setTimeout(() => view.classList.remove('enter'), 520); }
function go(tab) { if (ui.tab !== tab) { ui.tab = tab; ui.tryOn = null; render(); view.scrollTop = 0; enter(); } }

/* ---------- reactions to game events ---------- */
function react(pt) {
  const ev = G.drain(), levels = ev.filter(e => e.t === 'level');
  let delay = 0;
  for (const e of ev) {
    if (e.t === 'xp') {
      if (e.crit) { floatText(`КРИТ ×2 · +${e.xp} XP`, pt.x, pt.y - 10, 'crit'); confetti(pt.x, pt.y, 40, 9); sfx('pr'); buzz('heavy'); }
      else { floatText(`+${e.xp} XP`, pt.x, pt.y - 10); confetti(pt.x, pt.y, 14, 5); }
    }
    if (e.t === 'sphere') { setTimeout(() => { toast(`${icon(CATS[e.sp].icon)}<div><b>${CATS[e.sp].name} · LV ${e.at}</b><small>Новий скін «${e.item.name}» — у Шафці</small></div>`, 'gold', 3800); sfx('ach'); }, 600 + delay); delay += 900; }
    if (e.t === 'boss') setTimeout(() => overlay(root => bossDown(root, e)), 300);
    if (e.t === 'ath') { setTimeout(() => { toast(`${icon('chart')}<div><b>Новий ATH</b><small>Це твій найкращий місяць</small></div>`, 'gold', 3400); rain(60); }, 400 + delay); delay += 600; }
    if (e.t === 'perfect') { setTimeout(() => { toast(`${icon('star')}<div><b>Ідеальний день</b><small>+${e.xp} XP · +${e.coins} монет</small></div>`, 'gold', 3200); rain(70); sfx('ach'); }, 350); delay += 500; }
    if (e.t === 'ach') {
      setTimeout(() => { toast(`${icon(e.a.icon)}<div><b>Ачівка · ${G.nm(e.a)}</b><small>+${e.a.coins} монет${e.item ? ` · скін «${e.item.name}»` : ''}</small></div>`, 'gold', 3800); sfx('ach'); buzz('success'); }, 500 + delay);
      delay += 900;
    }
  }
  if (levels.length) setTimeout(() => overlay(root => levelUp(root, levels)), 450);
}

function bossDown(root, e) {
  root.innerHTML = `<div class="ov">
    <div class="ov-kicker">Ціль місяця закрито</div>
    <div class="lvup-title sm">БОСА ПЕРЕМОЖЕНО</div>
    <div class="boss-big">${icon('skull')}</div>
    <div class="loot-list">
      <div class="loot-row">${icon('cash')}<span>${fmt(G.monthSum().inc)} ${esc(S.money.cur)} за місяць</span></div>
      <div class="loot-row">${icon('bolt')}<span>+${e.xp} XP</span></div>
      <div class="loot-row">${icon('coin')}<span>+${e.coins} монет</span></div>
    </div>
    <p class="note">Усе, що зверху, — оверкіл. За ×2 від цілі дають монокль.</p>
    <button class="btn next big" data-act="overlay-next">Забрати</button>
  </div>`;
  sfx('level'); buzz('success'); rain(160);
}

function levelUp(root, levels) {
  const last = levels[levels.length - 1], first = levels[0];
  const items = levels.flatMap(l => l.items), coins = levels.reduce((a, l) => a + l.coins, 0);
  const rk = [...levels].reverse().find(l => l.rank)?.rank;
  root.innerHTML = `<div class="ov lvup">
    <div class="ov-kicker">${rk ? 'Еволюція' : 'Новий рівень'}</div>
    <div class="lvup-title">LEVEL UP!</div>
    <div class="lvup-stage">${cv(() => stage('lvup', S.eq, { w: 120, h: 96, floor: 14 }).cv)}<div class="scan"></div></div>
    <div class="lvup-num"><span>LV ${first.lv - 1}</span><i>→</i><b>LV ${last.lv}</b></div>
    ${rk ? `<div class="lvup-rank">Новий ранг: <b>${G.nm(rk)}</b></div>` : ''}
    <div class="loot-list">
      <div class="loot-row">${icon('coin')}<span>+${coins} монет</span></div>
      ${items.map(i => `<div class="loot-row rar-${i.rar}">${icon('star')}<span>${SLOTS.find(s => s.id === i.slot).name}: «${i.name}»</span><small>${RAR[i.rar]}</small></div>`).join('')}
    </div>
    <button class="btn next big" data-act="overlay-next">Далі</button>
  </div>`;
  hydrate(root);
  sfx('level'); buzz('success'); rain(140);
  setTimeout(() => stages.lvup?.st.jump(), 300);
}

function workoutDone(root, res) {
  const { w, prs, coins } = res;
  root.innerHTML = `<div class="ov">
    <div class="ov-kicker">${dateUA(w.d)} · ${esc(w.name)}</div>
    <div class="lvup-title sm">ЗАЛ ЗАКРИТО</div>
    <div class="tiles ov-tiles">${tile(w.dur, 'хв')}${tile(w.sets, 'підходів')}${tile(fmt(w.vol), 'кг тоннаж')}</div>
    <div class="loot-list">
      <div class="loot-row">${icon('bolt')}<span>+${w.xp} XP</span></div>
      <div class="loot-row">${icon('coin')}<span>+${coins} монет</span></div>
      ${prs.map(p => { const ex = G.exById(p.ex); return `<div class="loot-row rar-l">${icon('medal')}<span>Рекорд · ${esc(ex.name)}</span><small>${setLabel(ex.type, p.to.w, p.to.r)}</small></div>`; }).join('')}
    </div>
    <button class="btn next big" data-act="overlay-next">Забрати</button>
  </div>`;
  sfx(prs.length ? 'pr' : 'buy'); buzz('success'); rain(prs.length ? 120 : 60);
}

/* ---------- onboarding: 3 short steps (name → character → quests) ---------- */
let obRoot = null;
const OB = { step: 0, q: null };
const OB_LOOK = [
  ['body', 'Фігура', [['a', 'A'], ['b', 'B']]],
  ['skin', 'Шкіра', ['s1', 's2', 's3', 's4']],
  ['hair', 'Зачіска', [['messy', 'Хаос'], ['buzz', 'Їжачок'], ['bob', 'Каре'], ['ponytail', 'Хвіст'], ['braid', 'Коса'], ['bald', 'Лисий']]],
  ['hairColor', 'Колір', ['black', 'brown']],
];
const obDots = () => `<div class="ob-dots">${[0, 1, 2].map(i => `<i class="${i === OB.step ? 'on' : i < OB.step ? 'done' : ''}"></i>`).join('')}</div>`;
const obStage = () => `<div class="lvup-stage">${cv(() => stage('intro', S.eq, { w: 120, h: 96, floor: 14 }).cv)}<div class="scan"></div></div>`;
function onboarding(root) {
  obRoot = root;
  if (!OB.q) OB.q = new Set(Object.keys(CATS).map(id => `${id}:0`)); // one main daily per sphere preselected
  const gChips = act => `<div class="chips two">${[['m', 'Він'], ['f', 'Вона']].map(([v, n]) => `<button class="chip-b ${S.profile.g === v ? 'on' : ''}" data-act="${act}" data-v="${v}">${n}</button>`).join('')}</div>`;
  const steps = [
    () => `<div class="logo">RESPAWN</div>${obStage()}
      <p>Зараз ти <b>NPC</b> у сірій футболці.<br>Закривай квести у 6 сферах життя, фарм XP — і персонаж еволюціонує разом із тобою.</p>
      <input class="field" id="ob-name" maxlength="20" placeholder="Як тебе звати?" value="${esc(S.name)}" autocomplete="off">
      <div class="ob-g"><span>Як до тебе звертатись?</span>${gChips('ob-g')}</div>
      <button class="btn next big" data-act="ob-next">Далі</button>`,
    () => `<div class="ov-kicker">Крок 2 / 3</div><div class="lvup-title sm">Твій персонаж</div>${obStage()}
      ${OB_LOOK.map(([slot, name, opts]) => `<div class="ob-g"><span>${name}</span><div class="chips wrap ob-opts">${opts.map(o => {
        const [v, n] = Array.isArray(o) ? o : [o, ''], it = ITEM[`${slot}:${v}`], on = S.eq[slot] === v;
        return `<button class="chip-b sm ${on ? 'on' : ''}" data-act="ob-eq" data-slot="${slot}" data-v="${v}">${it?.sw ? `<i class="dot" style="--sw:${it.sw}"></i>` : ''}${n || it?.name || v}</button>`;
      }).join('')}</div></div>`).join('')}
      <p class="note">Усе це можна змінити в Шафці. Там же — ще 160 скінів.</p>
      <div class="ob-nav"><button class="btn ghost" data-act="ob-back">Назад</button><button class="btn next big grow" data-act="ob-next">Далі</button></div>`,
    () => `<div class="ov-kicker">Крок 3 / 3</div><div class="lvup-title sm">Що качаємо?</div>
      <p>Обери кілька щоденних квестів — по одному на сферу вже вибрано. Раджу 3–6, решту додаси потім.</p>
      <div class="ob-qs">${Object.entries(CATS).map(([id, c]) => `<div class="ob-sp"><div class="ob-sp-t">${icon(c.icon)}${c.name}</div><div class="chips wrap">${SPHERE_QUESTS[id].slice(0, 3).map((x, i) => `<button class="chip-b sm ${OB.q.has(`${id}:${i}`) ? 'on' : ''}" data-act="ob-q" data-k="${id}:${i}">${esc(x[0])}</button>`).join('')}</div></div>`).join('')}</div>
      <div class="ob-g"><span>Ще в грі є — вимкни зайве</span><div class="chips wrap">${MODS.map(([k, n]) => `<button class="chip-b sm ${S.mods[k] ? 'on' : ''}" data-act="ob-mod" data-k="${k}">${n}</button>`).join('')}</div></div>
      <div class="ob-nav"><button class="btn ghost" data-act="ob-back">Назад</button><button class="btn next big grow" data-act="onboard">Почати гру · ${OB.q.size}</button></div>`,
  ];
  root.innerHTML = `<div class="ov intro ob">${OB.step ? obDots() : ''}${steps[OB.step]()}</div>`;
  hydrate(root);
}
const obRender = () => { if (obRoot) { onboarding(obRoot); obRoot.scrollTop = 0; } };

/* ---------- «Що нового» for players from 1.x (once) ---------- */
function whatsNew(root) {
  const got = S.owned.map(id => ITEM[id]).filter(it => it?.src?.sp);
  const thumbs = got.slice(0, 6).map(it => `<span class="news-it">${itemThumb(it)}</span>`).join('');
  const gChips = `<div class="chips two">${[['m', 'Він'], ['f', 'Вона']].map(([v, n]) => `<button class="chip-b ${S.profile.g === v ? 'on' : ''}" data-act="news-g" data-v="${v}">${n}</button>`).join('')}</div>`;
  const bChips = `<div class="chips two">${[['a', 'Фігура A'], ['b', 'Фігура B']].map(([v, n]) => `<button class="chip-b ${S.eq.body === v ? 'on' : ''}" data-act="news-body" data-v="${v}">${n}</button>`).join('')}</div>`;
  root.innerHTML = `<div class="ov news">
    <div class="ov-kicker">Оновлення</div>
    <div class="lvup-title sm">RESPAWN 2.0</div>
    <div class="lvup-stage">${cv(() => stage('news', S.eq, { w: 120, h: 96, floor: 14 }).cv)}<div class="scan"></div></div>
    <div class="news-list">
      <div class="news-row">${icon('hex')}<div><b>6 сфер замість 5</b><small>Математика й Інженерія тепер — <b>Розум</b>, Дисципліна — <b>Порядок</b>. Нові сфери: <b>Спокій</b> і <b>Люди</b>. Твій XP і квести на місці.</small></div></div>
      <div class="news-row">${icon('shirt')}<div><b>+52 скіни, 2 фігури, образи</b><small>${got.length ? `За рівні твоїх сфер уже відкрито ${got.length} ${plural(got.length, 'скін', 'скіни', 'скінів')} — вони в Шафці:` : 'Нові речі — у магазині та за рівні сфер.'}</small>${thumbs ? `<div class="news-its">${thumbs}</div>` : ''}</div></div>
      <div class="news-row">${icon('cash')}<div><b>Гроші, Фокус і Зал — у «Сферах»</b><small>Бос місяця лишився на Базі. Непотрібні модулі вимикаються в Профілі.</small></div></div>
    </div>
    <div class="ob-g"><span>Як до тебе звертатись?</span>${gChips}</div>
    <div class="ob-g"><span>Фігура</span>${bChips}</div>
    <button class="btn next big" data-act="news-ok">Погнали</button>
  </div>`;
  hydrate(root);
}

/* ---------- rest timer ---------- */
function renderRest() {
  const r = ui.rest;
  if (!r) { restEl.innerHTML = ''; return; }
  const left = Math.max(0, (r.end - Date.now()) / 1000);
  restEl.innerHTML = `<div class="rest-pill"><i class="rest-bar" style="width:${(left / r.total) * 100}%"></i>${icon('clock')}<span>Відпочинок</span><b>${clock(Math.ceil(left))}</b><button data-act="rest-add">+15</button><button data-act="rest-skip" aria-label="Пропустити">${icon('x')}</button></div>`;
}
let seenDay = G.today(), seenMin = -1;
setInterval(() => {
  if (G.today() !== seenDay) { seenDay = G.today(); G.rollDay(); render(); } // midnight: dailies reset
  const ft = $('#focus-time'); if (ft && S.focus) ft.textContent = clockLong((Date.now() - S.focus.start) / 1000);
  const min = new Date().getMinutes(); if (min !== seenMin) { seenMin = min; G.timeSecrets(); if (S.onboarded && !$('#overlay.open')) react({ x: innerWidth / 2, y: innerHeight / 3 }); }
  const el = $('#wk-time'); if (el && S.draft) el.textContent = clock((Date.now() - S.draft.start) / 1000);
  if (ui.rest) {
    if (Date.now() >= ui.rest.end) { ui.rest = null; sfx('rest'); buzz('success'); toast(`${icon('clock')}<div><b>${G.g('Відпочив', 'Відпочила')}</b><small>Наступний підхід</small></div>`); }
    renderRest();
  }
}, 500);

/* ---------- actions ---------- */
let bubbleTimer = null;
const A = {
  go: el => {
    const same = ui.tab === el.dataset.tab;
    if (el.dataset.stab) ui.stab = el.dataset.stab;
    go(el.dataset.tab); if (same && el.dataset.stab) render();
    sfx('tap'); buzz('light');
  },
  stab: el => { ui.stab = el.dataset.v; sfx('tap'); render(); view.scrollTop = 0; },
  wallet: (el, e) => { sfx('tap'); if (G.tapWallet()) { sfx('coin'); buzz('success'); floatText('+1', e.clientX, e.clientY + 30); react({ x: e.clientX, y: e.clientY + 40 }); } },
  lamp: (el, e) => {
    ui.lampOff = !ui.lampOff; ui.lampTaps++; sfx(ui.lampOff ? 'undo' : 'tap'); buzz('light');
    if (ui.lampTaps >= 6) { G.secret('lamp'); react({ x: e.clientX, y: e.clientY }); }
    render();
  },
  ver: (el, e) => { if (++ui.verTaps >= 7 && G.secret('dev')) { sfx('level'); react({ x: e.clientX, y: e.clientY }); } else if (ui.verTaps < 7) sfx('tap'); },
  'sheet-close': () => closeSheet(),
  'overlay-next': () => { sfx('tap'); nextOverlay(); render(); },
  'ob-next': () => { const nm = $('#ob-name'); if (nm) S.name = nm.value.trim() || S.name; G.save(true); OB.step = Math.min(2, OB.step + 1); sfx('tap'); buzz('light'); obRender(); },
  'ob-back': () => { OB.step = Math.max(0, OB.step - 1); sfx('tap'); obRender(); },
  'ob-eq': el => { const { slot, v } = el.dataset; S.eq[slot] = v; S.manual[slot] = true; G.save(true); sfx('tap'); buzz('light'); obRender(); stage('intro', S.eq, { w: 120, h: 96, floor: 14 }).st.jump(); },
  'ob-q': el => { const k = el.dataset.k; if (OB.q.has(k)) OB.q.delete(k); else OB.q.add(k); sfx('tap'); obRender(); },
  'ob-mod': el => { S.mods[el.dataset.k] = !S.mods[el.dataset.k]; G.save(true); sfx('tap'); obRender(); },
  onboard: () => {
    const picked = [...OB.q].map(k => { const [id, i] = k.split(':'), [title, diff, type] = SPHERE_QUESTS[id][+i]; return [title, id, diff, type]; });
    if (picked.length) G.setStarterQuests(picked);
    S.onboarded = true; S.seen.v2 = 1; G.save(); sfx('buy'); buzz('medium'); nextOverlay(); G.timeSecrets(); react({ x: innerWidth / 2, y: innerHeight / 3 });
  },
  'news-g': el => { G.setGender(el.dataset.v); el.parentElement.querySelectorAll('.chip-b').forEach(b => b.classList.toggle('on', b === el)); sfx('tap'); buzz('light'); },
  'news-body': el => { G.equip('body', el.dataset.v); el.parentElement.querySelectorAll('.chip-b').forEach(b => b.classList.toggle('on', b === el)); stage('news', S.eq, { w: 120, h: 96, floor: 14 }).st.jump(); sfx('tap'); buzz('light'); },
  'news-ok': () => { S.seen.v2 = 1; G.save(); sfx('buy'); buzz('medium'); nextOverlay(); react({ x: innerWidth / 2, y: innerHeight / 3 }); },

  'hero-tap': (el, e) => {
    stages.home?.st.jump(); G.tapHero(); sfx('tap'); buzz('light');
    const b = $('#bubble'); if (!b) return;
    const pool = ++ui.heroTaps > 12 && ui.heroTaps % 3 === 0 ? BUBBLES_HURT : BUBBLES;
    b.textContent = pool[Math.floor(Math.random() * pool.length)]; b.classList.add('on');
    clearTimeout(bubbleTimer); bubbleTimer = setTimeout(() => b.classList.remove('on'), 2200);
    react({ x: e.clientX, y: e.clientY });
  },
  loot: (el, e) => {
    const res = G.claimLoot(); if (!res) return;
    sfx('coin'); buzz('medium'); confetti(e.clientX, e.clientY, 30, 8);
    toast(`${icon('chest')}<div><b>Денний лут</b><small>+${res.coins} монет · +${res.xp} XP</small></div>`, 'gold', 3000);
    react({ x: e.clientX, y: e.clientY });
  },

  'quest-toggle': (el, e) => {
    const q = S.quests.find(q => q.id === el.dataset.id); if (!q) return;
    const pt = { x: e.clientX, y: e.clientY };
    if (G.isDone(q)) { G.undoQuest(q.id); sfx('undo'); buzz('light'); G.drain(); }
    else { G.completeQuest(q.id); sfx('done'); buzz('medium'); react(pt); }
  },
  'quest-new': el => { sfx('tap'); questSheet(null, el?.dataset?.cat); },
  'quest-edit': el => questSheet(S.quests.find(q => q.id === el.dataset.id)),
  qf: el => {
    ui.qf[el.dataset.k] = el.dataset.v; el.parentElement.querySelectorAll('.chip-b').forEach(b => b.classList.toggle('on', b === el)); sfx('tap');
    if (el.dataset.k === 'cat' && $('#qf-ideas')) { ui.qf.title = $('#qf-title').value; $('#qf-ideas').innerHTML = qfIdeas(ui.qf); }
    $('#qf-sum').textContent = qfSum(ui.qf);
  },
  'qf-more': el => { const box = $('#qf-more'); box.hidden = !box.hidden; el.firstChild.textContent = box.hidden ? '▸ Більше · ' : '▾ Більше · '; sfx('tap'); },
  idea: el => { const [title, diff, type = 'daily'] = SPHERE_QUESTS[el.dataset.s][+el.dataset.i]; Object.assign(ui.qf, { title, cat: el.dataset.s, diff, type }); refreshQuestForm(); sfx('tap'); },
  'sphere-open': el => { sfx('tap'); buzz('light'); sphereSheet(el.dataset.id); },
  'tpl-add': el => {
    const [title, diff, type = 'daily'] = SPHERE_QUESTS[el.dataset.s][+el.dataset.i];
    G.addQuest({ title, cat: el.dataset.s, diff, type }); sfx('buy'); buzz('light');
    toast(`${icon('plus')}<div><b>${esc(title)}</b><small>Додано в ${type === 'once' ? 'місії' : 'щоденні'}</small></div>`);
  },
  'quest-save': () => {
    const title = $('#qf-title').value.trim();
    if (!title) { $('#qf-title').classList.add('shake'); setTimeout(() => $('#qf-title')?.classList.remove('shake'), 400); sfx('err'); return; }
    const f = { ...ui.qf, title };
    if (f.id) G.editQuest(f.id, { title, cat: f.cat, diff: f.diff, type: f.type }); else { G.addQuest(f); ui.qtab = f.type; }
    ui.lastCat = f.cat;
    sfx('buy'); buzz('light'); afterQuestSheet(); render();
  },
  'quest-del': async () => { if (await ask('Видалити квест?')) { G.deleteQuest(ui.qf.id); afterQuestSheet(); } },
  qtab: el => { ui.qtab = el.dataset.v; sfx('tap'); render(); },
  'done-toggle': () => { ui.doneOpen = !ui.doneOpen; render(); },

  'wk-start': () => { G.startWorkout(); sfx('buy'); buzz('medium'); exSheet(); },
  'wk-cancel': async () => { if (await ask('Скасувати тренування? Підходи не збережуться.')) { ui.rest = null; G.cancelWorkout(); } },
  'wk-add': () => exSheet(),
  'wk-finish': () => {
    const res = G.finishWorkout(); if (!res) return;
    ui.rest = null;
    overlay(root => workoutDone(root, res));
    react({ x: innerWidth / 2, y: innerHeight / 2 });
  },
  'ex-group': el => { ui.exGroup = +el.dataset.v; $('#ex-groups').querySelectorAll('.chip-b').forEach(b => b.classList.toggle('on', b === el)); $('#ex-list').innerHTML = exList(); },
  'ex-pick': el => { G.addEntry(el.dataset.id); sfx('tap'); buzz('light'); closeSheet(); setTimeout(() => { view.scrollTop = view.scrollHeight; }, 60); },
  'ex-custom': () => { const name = $('#ex-name').value.trim(); if (!name) { sfx('err'); return; } const ex = G.addCustomExercise(name, +$('#ex-g').value, $('#ex-type').value); G.addEntry(ex.id); closeSheet(); },
  'entry-del': async el => { if (await ask('Прибрати вправу з тренування?')) { S.draft.entries.splice(+el.dataset.e, 1); G.save(); } },
  'set-add': el => { const e = S.draft.entries[+el.dataset.e], last = e.sets[e.sets.length - 1]; e.sets.push({ w: last?.w ?? '', r: last?.r ?? '', done: false }); sfx('tap'); G.save(); },
  'set-rem': el => { S.draft.entries[+el.dataset.e].sets.pop(); G.save(); },
  'set-toggle': (el, e) => {
    const en = S.draft.entries[+el.dataset.e], s = en.sets[+el.dataset.s];
    if (!s.done && !parseFloat(String(s.r).replace(',', '.'))) { sfx('err'); buzz('error'); el.closest('.set').classList.add('shake'); return; }
    s.done = !s.done;
    if (s.done) {
      sfx('done'); buzz('medium'); confetti(e.clientX, e.clientY, 8, 4);
      if (!en.pr && G.beatsRecord(en.ex, s.w, s.r)) { en.pr = true; setTimeout(() => { toast(`${icon('medal')}<div><b>Новий рекорд!</b><small>${esc(G.exById(en.ex).name)}</small></div>`, 'gold', 3200); sfx('pr'); buzz('success'); rain(50); }, 250); }
      if (S.settings.rest) ui.rest = { end: Date.now() + S.settings.rest * 1000, total: S.settings.rest };
    } else sfx('undo');
    G.save();
  },
  'rest-add': () => { if (ui.rest) { ui.rest.end += 15000; ui.rest.total += 15; renderRest(); } },
  'rest-skip': () => { ui.rest = null; renderRest(); },
  'wk-open': el => {
    const w = S.workouts.find(w => w.id === el.dataset.id); if (!w) return;
    openSheet(`<h2>${esc(w.name)}</h2><div class="lbl">${dateUA(w.d)} · ${w.dur} хв · ${fmt(w.vol)} кг · +${w.xp} XP</div>
      <div class="rows">${w.entries.map(e => { const ex = G.exById(e.ex); return `<div class="row static"><span class="row-t"><b>${esc(ex.name)}${w.prs.includes(e.ex) ? ' <em class="pr">PR</em>' : ''}</b><small>${e.sets.map(s => setLabel(ex.type, s[0], s[1])).join(' · ')}</small></span></div>`; }).join('')}</div>
      <div class="sheet-foot"><button class="btn ghost danger" data-act="wk-del" data-id="${w.id}">${icon('trash')}Видалити запис</button></div>`);
  },
  'wk-del': async el => { if (await ask('Видалити тренування з історії? XP залишиться.')) { G.deleteWorkout(el.dataset.id); closeSheet(); } },
  'pr-open': el => {
    const ex = G.exById(el.dataset.id), h = G.exHistory(ex.id), p = S.prs[ex.id];
    openSheet(`<h2>${esc(ex.name)}</h2><div class="lbl">Рекорд · ${setLabel(ex.type, p.w, p.r)} · ${dateUA(p.d)}</div>${spark(h)}
      <div class="rows">${h.slice().reverse().slice(0, 8).map(x => `<div class="row static"><span class="row-t"><b>${setLabel(ex.type, x.top[0], x.top[1])}</b><small>${dateUA(x.d)}</small></span></div>`).join('')}</div>`);
  },

  slot: el => { ui.slot = el.dataset.v; ui.tryOn = null; sfx('tap'); render(); },
  item: el => {
    const it = ITEM[el.dataset.id];
    if (G.has(it.id)) { ui.tryOn = null; G.equip(it.slot, it.key); sfx('done'); buzz('light'); stages.locker?.st.jump(); }
    else { ui.tryOn = it.id; sfx('tap'); buzz('light'); render(); view.scrollTop = 0; }
  },
  'look-save': el => { G.saveLook(+el.dataset.i); sfx('buy'); buzz('light'); toast(`${icon('shirt')}<div><b>Образ ${+el.dataset.i + 1} збережено</b><small>Тап по ньому — і він на тобі</small></div>`); },
  'look-wear': el => { if (G.wearLook(+el.dataset.i)) { sfx('done'); buzz('light'); stages.locker?.st.jump(); } },
  'look-del': async el => { if (await ask(`Видалити образ ${+el.dataset.i + 1}?`)) { G.deleteLook(+el.dataset.i); sfx('undo'); } },
  'item-none': () => { ui.tryOn = null; G.equip(ui.slot, null); sfx('undo'); },
  'tryon-clear': () => { ui.tryOn = null; render(); },
  buy: (el, e) => {
    const it = ITEM[el.dataset.id];
    if (!G.buy(it.id)) { sfx('err'); buzz('error'); return; }
    sfx('buy'); buzz('success'); confetti(e.clientX, e.clientY, 34, 8); stages.locker?.st.jump();
    toast(`${icon('bag')}<div><b>${it.name}</b><small>Куплено й одягнено</small></div>`, 'gold');
    react({ x: e.clientX, y: e.clientY });
  },

  'ach-open': el => {
    const a = ACH[el.dataset.id], on = S.ach[a.id], [cur, goal] = a.prog(S), hide = a.secret && !on;
    const item = ITEMS.find(i => i.src && i.src.ach === a.id);
    openSheet(`<div class="ach-big t-${a.tier} ${on ? 'on' : ''}"><span class="ach-i">${icon(on ? a.icon : 'lock')}</span></div>
      <h2 class="center">${hide ? '???' : G.nm(a)}</h2><p class="center mut">${hide ? `Секретна ачівка. ${G.g('Шукай сам.', 'Шукай сама.')}` : a.desc}</p>
      ${hide ? '' : `<div class="xp-bar slim"><i style="width:${Math.min(100, (cur / goal) * 100)}%"></i></div><div class="xp-meta"><span>${fmt(Math.min(cur, goal))} / ${fmt(goal)}</span><span>${on ? 'Отримано' : ''}</span></div>`}
      <div class="loot-list"><div class="loot-row">${icon('coin')}<span>+${a.coins} монет</span></div>${item ? `<div class="loot-row rar-${item.rar}">${icon('star')}<span>Скін «${hide ? '???' : item.name}»</span><small>${RAR[item.rar]}</small></div>` : ''}</div>`);
  },
  'ob-g': el => { const nm = $('#ob-name'); if (nm) S.name = nm.value.trim() || S.name; G.setGender(el.dataset.v); if (!S.manual.body) { S.eq.body = el.dataset.v === 'f' ? 'b' : 'a'; if (!S.manual.hair) S.eq.hair = el.dataset.v === 'f' ? 'ponytail' : 'messy'; G.save(); stage('intro', S.eq, { w: 120, h: 96, floor: 14 }).st.jump(); } el.parentElement.querySelectorAll('.chip-b').forEach(b => b.classList.toggle('on', b === el)); sfx('tap'); buzz('light'); },
  'mod-toggle': el => { S.mods[el.dataset.k] = !S.mods[el.dataset.k]; G.save(); sfx('tap'); buzz('light'); },
  'set-g': el => { G.setGender(el.dataset.v); sfx('tap'); buzz('light'); },
  'set-toggle-opt': el => { S.settings[el.dataset.k] = !S.settings[el.dataset.k]; G.save(); sfx('tap'); buzz('light'); },
  'set-rest': el => { S.settings.rest = +el.dataset.v; G.save(); },
  'name-edit': () => openSheet(`<h2>${G.g('Ім\'я гравця', 'Ім\'я гравчині')}</h2><input class="field" id="nm" maxlength="20" value="${esc(S.name)}" autocomplete="off"><div class="sheet-foot"><button class="btn solid grow" data-act="name-save">Зберегти</button></div>`),
  'name-save': (el, e) => { S.name = $('#nm').value.trim() || S.name; G.save(); closeSheet(); G.timeSecrets(); react({ x: e.clientX, y: e.clientY }); },
  export: async () => {
    const json = G.exportSave();
    try { await navigator.clipboard.writeText(json); toast(`${icon('check')}<div><b>Скопійовано</b><small>Збереження в буфері обміну</small></div>`); }
    catch { openSheet(`<h2>Експорт</h2><p class="mut">Скопіюй цей текст і збережи.</p><textarea class="field area" readonly>${esc(json)}</textarea>`); }
  },
  import: () => openSheet(`<h2>Імпорт</h2><p class="mut">Встав текст збереження. Поточний прогрес буде замінено.</p><textarea class="field area" id="imp" placeholder="{…}"></textarea><div class="sheet-foot"><button class="btn solid grow" data-act="import-go">Завантажити</button></div>`),
  'import-go': () => { try { G.importSave($('#imp').value); closeSheet(); toast(`${icon('check')}<div><b>Готово</b><small>Збереження завантажено</small></div>`); } catch { sfx('err'); toast(`${icon('x')}<div><b>Не вийшло</b><small>Це не схоже на збереження RESPAWN</small></div>`); } },
  reset: async () => { if (await ask('Скинути ВЕСЬ прогрес? Це не можна скасувати.')) { G.resetAll(); ui.tab = 'home'; render(); } },
};
function refreshQuestForm() {
  const f = ui.qf; $('#qf-title').value = f.title;
  document.querySelectorAll('#sheet [data-act="qf"]').forEach(b => b.classList.toggle('on', f[b.dataset.k] === b.dataset.v));
  if ($('#qf-ideas')) $('#qf-ideas').innerHTML = qfIdeas(f);
  $('#qf-sum').textContent = qfSum(f);
}

Object.assign(A, money.actions, mind.actions);

document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if (!el || el.disabled) return;
  const fn = A[el.dataset.act]; if (fn) fn(el, e);
});
document.addEventListener('input', e => {
  const t = e.target;
  if (t.dataset.f && S.draft) { const s = S.draft.entries[+t.dataset.e]?.sets[+t.dataset.s]; if (s) { s[t.dataset.f] = t.value; G.save(true); } }
  else if (t.id === 'ex-search') { ui.exQuery = t.value; $('#ex-list').innerHTML = exList(); }
});
document.addEventListener('animationend', e => e.target.classList?.remove('shake'));
document.addEventListener('visibilitychange', () => { if (document.hidden) G.flush(); else { G.rollDay(); render(); } });

/* ---------- boot ---------- */
// keep bottom sheets above the on-screen keyboard
const vv = window.visualViewport;
const fitVV = () => document.documentElement.style.setProperty('--vvh', (vv ? vv.height : innerHeight) + 'px');
vv?.addEventListener('resize', fitVV); fitVV();
G.load();
if (tg) {
  try {
    tg.ready(); tg.expand();
    tg.setHeaderColor?.('#08080a'); tg.setBackgroundColor?.('#08080a'); tg.setBottomBarColor?.('#08080a');
    tg.disableVerticalSwipes?.();
  } catch { /* older clients */ }
  document.documentElement.classList.add('in-tg');
}
G.onChange(render);
render(); enter();
if (!S.onboarded) overlay(onboarding);
else if (!S.seen?.v2) overlay(whatsNew);
G.syncCloud().then(changed => { if (changed && S.onboarded) { nextOverlay(); if (!S.seen?.v2) overlay(whatsNew); } });
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});

if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname) && location.search.includes('dev')) {
  window.__app = { G, ui, render, go, A, overlay, nextOverlay, levelUp, workoutDone, bossDown };
  import('../tools/dev.js').catch(() => {});
}
