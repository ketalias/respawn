// RESPAWN — skills screen: focus sessions per skill + daily brain warm-up mini-game.
import { CATS, SKILL_CATS, skillLevel, skillSpan, attrLevel, catOf } from './data.js';
import { makeRun, drillTier } from './drill.js';

const hrs = mins => (Math.round((mins / 60) * 10) / 10).toString().replace('.', ',');
export const clockLong = sec => {
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = Math.floor(sec % 60), p = n => String(n).padStart(2, '0');
  return h ? `${h}:${p(m)}:${p(s)}` : `${p(m)}:${p(s)}`;
};

export default function mindModule(c) {
  const { G, icon, esc, sec, openSheet, closeSheet, react, sfx, buzz, toast, ask, confetti, rain, overlay, nextOverlay, $ } = c;
  const S = () => G.S;
  let form = { cat: 'math', id: null }, run = null;

  function skillRow(k) {
    const lv = skillLevel(k.mins), span = skillSpan(k.mins), h = k.mins / 60;
    const pct = span ? ((h - span[0]) / (span[1] - span[0])) * 100 : 100, live = S().focus?.skill === k.id;
    return `<div class="skill ${live ? 'live' : ''}">
      <button class="skill-b" data-act="skill-open" data-id="${k.id}">
        <div class="skill-t"><b>${esc(k.name)}</b><span>LV ${lv}</span></div>
        <div class="skill-bar"><i style="width:${Math.max(2, pct)}%"></i></div>
        <small>${icon(catOf(k.cat).icon)}${catOf(k.cat).name} · ${hrs(k.mins)} год${span ? ` · до LV ${lv + 1}: ${hrs((span[1] - h) * 60)} год` : ''}</small>
      </button>
      <button class="skill-go" data-act="focus-start" data-id="${k.id}" aria-label="Почати фокус">${icon(live ? 'clock' : 'play')}</button>
    </div>`;
  }

  function drillCard() {
    const fresh = G.drillFresh();
    return `<button class="card loot brain ${fresh ? '' : 'done'}" data-act="drill-start"><span class="loot-i">${icon('sigma')}</span><span class="loot-t"><b>Розминка мозку</b><small>${fresh ? '5 задач: математика, інженерія, гроші' : 'Сьогодні пройдено. Ще раунд — для форми, майже без XP'}</small></span><span class="loot-go">${icon('play')}</span></button>`;
  }

  function view() {
    const s = S(), f = s.focus, fk = f && s.skills.find(k => k.id === f.skill);
    return `${drillCard()}
    ${fk ? `<section class="card wk-head focus"><div><div class="lbl">Фокус · ${esc(fk.name)}</div><div class="wk-time" id="focus-time">${clockLong((Date.now() - f.start) / 1000)}</div></div>
      <div class="focus-btns"><button class="btn solid sm" data-act="focus-stop">${icon('stop')}Завершити</button><button class="btn ghost sm" data-act="focus-cancel">Скасувати</button></div></section>` : ''}
    ${sec('Скіли', `<span class="count">${hrs(s.counters.focusMin)} год фокусу</span>`)}
    <div class="skills">${s.skills.map(skillRow).join('') || `<div class="empty">${icon('sigma')}<b>Скілів немає</b><span>Додай те, що реально качаєш.</span></div>`}</div>
    <button class="btn dashed" data-act="skill-new">${icon('plus')}Новий скіл</button>
    <p class="note">▶ запускає таймер фокусу. Хвилина фокусу = 1 XP у гілку скіла.</p>`;
  }

  /* ---------- warm-up mini-game ---------- */
  const key = n => `<button data-act="drill-key" data-k="${n}">${n}</button>`;
  function drawQ() {
    const q = run.qs[run.i];
    run.input = ''; run.locked = false; run.t0 = performance.now();
    run.root.innerHTML = `<div class="ov drill">
      <div class="drill-top"><button class="icon-b" data-act="drill-quit" aria-label="Вийти">${icon('x')}</button>
        <div class="dots">${run.qs.map((_, j) => `<i class="${j < run.i ? (run.results[j].ok ? 'ok' : 'bad') : j === run.i ? 'cur' : ''}"></i>`).join('')}</div>
        <span class="tag">${icon(catOf(q.attr).icon)}${catOf(q.attr).name}</span></div>
      <div class="drill-time"><i></i></div>
      <div class="drill-q ${q.text.length <= 12 ? 'big' : ''}">${esc(q.text).replace(/\n/g, '<br>')}</div>
      <div class="drill-a" id="drill-a"><span class="ph">?</span></div>
      <div class="pad">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(key).join('')}<button data-act="drill-key" data-k="del" aria-label="Стерти">${icon('del')}</button>${key(0)}<button class="ok" data-act="drill-key" data-k="ok">OK</button></div>
    </div>`;
    clearTimeout(run.timer); run.timer = setTimeout(() => answer(true), 45000);
  }
  function answer(timeout) {
    if (!run || run.locked) return;
    run.locked = true; clearTimeout(run.timer);
    const q = run.qs[run.i], ms = performance.now() - run.t0, ok = !timeout && run.input === q.answer;
    run.results.push({ attr: q.attr, ok, ms });
    if (!ok && run.input === '42') G.secret('42');
    const a = $('#drill-a');
    if (a) { a.classList.add(ok ? 'ok' : 'bad'); if (!ok) a.innerHTML = `<s>${esc(run.input || (timeout ? 'час' : '—'))}</s><b>${q.answer}</b>`; }
    run.root.querySelector('.drill-time')?.classList.add('stop');
    sfx(ok ? 'done' : 'err'); buzz(ok ? 'medium' : 'error');
    if (ok) confetti(innerWidth / 2, innerHeight * 0.42, 10, 5);
    setTimeout(() => { if (!run) return; run.i++; if (run.i < run.qs.length) drawQ(); else finish(); }, ok ? 520 : 1400);
  }
  function finish() {
    const res = G.finishDrill(run.results), root = run.root;
    run = null;
    root.innerHTML = `<div class="ov">
      <div class="ov-kicker">Розминка мозку</div>
      <div class="lvup-title ${res.perfect ? '' : 'sm'}">${res.perfect ? 'ІДЕАЛЬНО' : `${res.okN} / ${res.n}`}</div>
      <div class="loot-list">
        ${Object.entries(res.gain).map(([attr, xp]) => `<div class="loot-row">${icon(catOf(attr).icon)}<span>${catOf(attr).name}</span><small>+${xp} XP</small></div>`).join('')}
        ${res.perfect && res.first ? `<div class="loot-row rar-l">${icon('star')}<span>Без помилок</span><small>+20 XP</small></div>` : ''}
        ${res.coins ? `<div class="loot-row">${icon('coin')}<span>+${res.coins} монет</span></div>` : ''}
        ${res.okN ? '' : `<div class="loot-row">${icon('skull')}<span>Мозок ще спить. Завтра реванш.</span></div>`}
      </div>
      ${res.first ? '' : '<p class="note">Це був тренувальний раунд: повний XP — раз на день.</p>'}
      <button class="btn next big" data-act="overlay-next">Далі</button>
    </div>`;
    sfx(res.perfect ? 'level' : 'buy'); if (res.perfect) rain(110);
    react({ x: innerWidth / 2, y: innerHeight / 2 });
  }

  const actions = {
    'drill-start': () => {
      const tier = drillTier(attrLevel(S().stats.math));
      run = { qs: makeRun(tier), i: 0, input: '', results: [], root: null };
      sfx('buy'); buzz('medium');
      overlay(root => { run.root = root; drawQ(); });
    },
    'drill-key': el => {
      if (!run || run.locked) return;
      const k = el.dataset.k;
      if (k === 'ok') { if (run.input) answer(false); return; }
      run.input = k === 'del' ? run.input.slice(0, -1) : (run.input + k).slice(0, 8);
      sfx('tap'); buzz('light');
      $('#drill-a').innerHTML = run.input ? esc(run.input) : '<span class="ph">?</span>';
    },
    'drill-quit': () => { if (run) clearTimeout(run.timer); run = null; nextOverlay(); },

    'focus-start': el => {
      const s = S();
      if (s.focus) { toast(`${icon('clock')}<div><b>Фокус уже йде</b><small>Спершу заверши поточну сесію</small></div>`); return; }
      G.startFocus(el.dataset.id); sfx('buy'); buzz('medium');
    },
    'focus-cancel': async () => { if (await ask('Скасувати сесію без запису?')) G.cancelFocus(); },
    'focus-stop': (el, e) => {
      const res = G.stopFocus(); if (!res) return;
      if (!res.mins) { toast(`${icon('clock')}<div><b>Менше хвилини</b><small>Сесію не зараховано</small></div>`); return; }
      sfx('ach'); buzz('success'); confetti(e.clientX, e.clientY, 26, 7);
      toast(`${icon('clock')}<div><b>${res.mins} хв фокусу</b><small>${esc(res.sk.name)} · +${res.xp} XP</small></div>`, 'gold', 3200);
      react({ x: e.clientX, y: e.clientY });
    },
    'skill-open': el => {
      const k = S().skills.find(x => x.id === el.dataset.id); if (!k) return;
      form.id = k.id;
      openSheet(`<h2>${esc(k.name)}</h2><div class="lbl">${catOf(k.cat).name} · LV ${skillLevel(k.mins)} · ${hrs(k.mins)} год</div>
        <div class="lbl">Записати вже зроблене</div>
        <div class="chips wrap">${[15, 25, 30, 45, 60, 90, 120].map(m => `<button class="chip-b" data-act="skill-log" data-m="${m}">${m} хв</button>`).join('')}</div>
        <div class="custom two"><input class="field" id="sk-min" inputmode="numeric" placeholder="Своє, хв"><button class="btn solid" data-act="skill-log">${icon('plus')}</button></div>
        <div class="sheet-foot"><button class="btn ghost danger" data-act="skill-del">${icon('trash')}Видалити скіл</button></div>`);
    },
    'skill-log': (el, e) => {
      const mins = +(el.dataset.m || $('#sk-min')?.value.replace(',', '.') || 0);
      if (!(mins > 0)) { sfx('err'); return; }
      const res = G.logFocus(form.id, mins); if (!res) return;
      closeSheet(); sfx('done'); buzz('medium');
      toast(`${icon('clock')}<div><b>+${res.mins} хв</b><small>${esc(res.sk.name)} · +${res.xp} XP</small></div>`, 'gold');
      react({ x: e.clientX, y: e.clientY });
    },
    'skill-del': async () => { if (await ask('Видалити скіл разом із годинами? XP залишиться.')) { G.deleteSkill(form.id); closeSheet(); } },
    'skill-new': () => {
      form.cat = 'eng';
      openSheet(`<h2>Новий скіл</h2><input class="field" id="sk-name" maxlength="40" placeholder="Наприклад, лінійна алгебра" autocomplete="off">
        <div class="lbl">Гілка</div>
        <div class="chips">${SKILL_CATS.map(v => `<button class="chip-b ${v === form.cat ? 'on' : ''}" data-act="skill-cat" data-v="${v}">${icon(CATS[v].icon)}${CATS[v].name}</button>`).join('')}</div>
        <div class="sheet-foot"><button class="btn solid grow" data-act="skill-save">Додати</button></div>`);
    },
    'skill-cat': el => { form.cat = el.dataset.v; el.parentElement.querySelectorAll('.chip-b').forEach(b => b.classList.toggle('on', b === el)); },
    'skill-save': () => { const name = $('#sk-name').value.trim(); if (!name) { $('#sk-name').classList.add('shake'); sfx('err'); return; } G.addSkill(name, form.cat); closeSheet(); sfx('buy'); },
  };
  return { view, drillCard, actions };
}
