// RESPAWN — money & business: the monthly profit goal is a boss you fight on its own screen, quick business reps, ledger.
import { BIZ_ACTS, CURRENCIES } from './data.js';
import { BossArena, BOSS_NAMES, bossIcon, line } from './boss.js';
import { floatText } from './ui.js';

const MONTHS = ['січень', 'лютий', 'березень', 'квітень', 'травень', 'червень', 'липень', 'серпень', 'вересень', 'жовтень', 'листопад', 'грудень'];
const MSHORT = ['січ', 'лют', 'бер', 'кві', 'тра', 'чер', 'лип', 'сер', 'вер', 'жов', 'лис', 'гру'];
export const short = n => {
  const a = Math.abs(n), sign = n < 0 ? '−' : '';
  if (a >= 1e6) return sign + (Math.round(a / 1e5) / 10).toString().replace('.', ',') + 'M';
  if (a >= 1e4) return sign + Math.round(a / 1e3) + 'k';
  return sign + Math.round(a).toLocaleString('uk-UA').replace(/ /g, ' ');
};

export default function moneyModule(c) {
  const { G, ui, icon, esc, fmt, tile, sec, openSheet, closeSheet, react, sfx, buzz, toast, ask, dateUA, confetti, cv, go, $ } = c;
  const S = () => G.S;
  const money = n => `${fmt(n)} ${esc(S().money.cur)}`;
  let form = { out: false, cur: '₴' };
  const mon = () => new Date().getMonth();
  const daysLeft = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate() - d.getDate() + 1; };
  const bossName = () => BOSS_NAMES[mon()];

  /* ---------- the boss arena: one long-lived canvas; HP bar and speech bubble are painted every tick ---------- */
  let arena = null;
  const A = () => { if (!arena) { arena = new BossArena(); arena.onTick = paintHp; } return arena; };
  const vars = st => ({ name: bossName(), days: daysLeft(), need: money(Math.ceil(st.hp / daysLeft())), left: money(Math.round(st.hp)) });
  const say = (pool, st = G.bossState(), ms) => A().talk(line(pool, G.isF(), vars(st)), ms);
  const moodPool = st => (!st.goal ? 'sleep' : st.dead ? 'dead' : st.net <= 0 ? 'intro' : st.hp / st.goal < 0.25 ? 'low' : Math.random() < 0.5 ? 'intro' : 'idle');
  function paintHp(a) {
    const fill = $('#ar-fill'); if (!fill) return;
    const g = a.goal || 1;
    fill.style.width = `${(a.shown / g) * 100}%`; $('#ar-ghost').style.width = `${(a.ghost / g) * 100}%`;
    $('#ar-hp-v').textContent = a.goal ? fmt(Math.round(a.shown)) : '—';
    $('#ar-hpbox').classList.toggle('heal', a.heal > 0);
    const b = $('#ar-say'), on = Date.now() < a.sayUntil;
    if (b) { if (on && b.textContent !== a.say) b.textContent = a.say; b.classList.toggle('on', on); }
  }

  function boss() {
    const m = S().money, st = G.bossState(), month = MONTHS[mon()];
    if (!m.goal) {
      return `<section class="card boss"><div class="boss-top"><div class="boss-i">${cv(() => bossIcon(mon(), false), 'boss-px')}</div><div class="boss-b">
        <div class="lbl">Бос місяця · ${month}</div><h2>Бос спить</h2>
        <small>Постав ціль прибутку на місяць — і бос прокинеться. Дохід знімає йому HP, витрати лікують.</small></div></div>
        <button class="btn solid" data-act="boss-open">${icon('skull')}До боса</button></section>`;
    }
    const pct = Math.round((Math.max(0, st.net) / m.goal) * 100);
    return `<button class="card boss ${st.dead ? 'dead' : ''}" data-act="boss-open">
      <div class="boss-top"><div class="boss-i">${cv(() => bossIcon(mon(), st.dead), 'boss-px')}</div>
        <div class="boss-b"><div class="lbl">Бос місяця · ${month}</div>
          <h2>${st.dead ? 'Переможено' : esc(bossName())}</h2>
          <small>${st.dead ? `Прибуток ${money(st.net)} — ${pct}% цілі` : `HP ${money(st.hp)} · ${daysLeft()} дн. до кінця`}</small></div>
        <span class="boss-go">${icon('play')}</span></div>
      <div class="hp"><i style="width:${st.dead ? 100 : (st.hp / m.goal) * 100}%"></i></div>
      <div class="xp-meta"><span>прибуток <b>${fmt(st.net)}</b> / ${fmt(m.goal)} ${esc(m.cur)}</span><span>${pct}%</span></div>
    </button>`;
  }

  // compact version for the home screen
  function homeCard() {
    const m = S().money, st = G.bossState();
    if (!m.goal) return `<button class="card loot" data-act="boss-open"><span class="loot-i">${icon('skull')}</span><span class="loot-t"><b>Бос місяця</b><small>Постав ціль прибутку — і зноси йому HP</small></span><span class="loot-go">${icon('play')}</span></button>`;
    return `<button class="card mini-boss ${st.dead ? 'dead' : ''}" data-act="boss-open">
      <div class="mini-top"><span class="lbl">${icon(st.dead ? 'crown' : 'skull')} ${st.dead ? 'Бос переможений' : esc(bossName())}</span><b>${st.dead ? `+${short(st.net)} ${esc(m.cur)}` : `HP ${short(st.hp)} ${esc(m.cur)}`}</b></div>
      <div class="hp slim"><i style="width:${st.dead ? 100 : (st.hp / m.goal) * 100}%"></i></div></button>`;
  }

  // the fight screen
  function arenaView() {
    const m = S().money, st = G.bossState(), a = A(), mo = mon();
    a.sync(st, mo);
    const pct = x => (m.goal ? (x / m.goal) * 100 : 0);
    const log = S().money.log.filter(e => e.d.startsWith(st.m)).slice(0, 30), src = G.recentSources();
    return `<div class="ar-head">
        <button class="icon-b" data-act="boss-back" aria-label="Назад">${icon('back')}</button>
        <div class="ar-title"><div class="lbl">Бос місяця · ${MONTHS[mo]}</div><b>${esc(BOSS_NAMES[mo])}</b></div>
        <button class="icon-b" data-act="money-set" aria-label="Ціль боса">${icon('gear')}</button>
      </div>
      <section class="arena ${st.dead ? 'dead' : ''}">
        <div class="ar-hp" id="ar-hpbox"><span>HP</span><div class="ar-bar"><i class="ar-ghost" id="ar-ghost" style="width:${pct(a.ghost)}%"></i><i class="ar-fill" id="ar-fill" style="width:${pct(a.shown)}%"></i></div><b id="ar-hp-v">${m.goal ? fmt(Math.round(a.shown)) : '—'}</b></div>
        <div class="ar-stage" data-act="boss-poke">${cv(() => a.cv)}<div class="scan"></div><div class="bubble ar-say ${Date.now() < a.sayUntil ? 'on' : ''}" id="ar-say">${esc(a.say)}</div></div>
      </section>
      ${m.goal ? `<div class="tiles">${tile(short(st.net), 'прибуток', 'chart')}${tile(daysLeft(), 'днів лишилось', 'clock')}${tile(st.dead ? '—' : short(Math.ceil(st.hp / daysLeft())), 'треба на день', 'bolt')}</div>
      <section class="card ar-form">
        <input class="field big" id="ar-amt" inputmode="decimal" placeholder="Сума, ${esc(m.cur)}" autocomplete="off">
        <input class="field" id="ar-src" maxlength="40" placeholder="Звідки чи на що — необов'язково" autocomplete="off">
        ${src.length ? `<div class="chips wrap">${src.map(x => `<button class="chip-b sm" data-act="ar-src" data-v="${esc(x)}">${esc(x)}</button>`).join('')}</div>` : ''}
        <div class="row2 ar-btns"><button class="btn solid" data-act="boss-hit">${icon('sword')}${st.dead ? 'Добити' : 'Вдарити'}</button><button class="btn ghost" data-act="boss-heal">${icon('minus')}Витрата</button></div>
        <p class="note">Дохід знімає HP, витрата лікує боса. HP = ціль − прибуток за місяць.</p>
      </section>
      ${sec('Удари за місяць', `<span class="count">${log.length}</span>`)}
      <div class="rows">${log.map(e => `<button class="row" data-act="money-open" data-id="${e.id}"><span class="row-i ${e.out ? 'neg' : 'pos'}">${icon(e.out ? 'plus' : 'sword')}</span><span class="row-t"><b>${esc(e.src || (e.out ? 'Витрата' : 'Дохід'))}</b><small>${dateUA(e.d)} · ${e.out ? 'бос лікується' : 'удар'}</small></span><span class="row-v ${e.out ? 'neg' : 'pos'}">${e.out ? '+' : '−'}${fmt(e.amt)} HP</span></button>`).join('') || `<div class="empty">${icon('sword')}<b>Ще жодного удару</b><span>Запиши перший дохід цього місяця.</span></div>`}</div>`
      : `<section class="card ar-form">
        <div class="lbl">Ціль прибутку на місяць</div>
        <input class="field big" id="ar-goal" inputmode="decimal" placeholder="Наприклад, 30000" autocomplete="off">
        <div class="chips">${CURRENCIES.map(x => `<button class="chip-b ${x === form.cur ? 'on' : ''}" data-act="money-cur" data-v="${x}">${x}</button>`).join('')}</div>
        <button class="btn solid" data-act="boss-summon">${icon('skull')}Розбудити боса</button>
        <p class="note">Прибуток = дохід − витрати. Скільки заробиш понад витрати — стільки HP і знесеш.</p>
      </section>`}`;
  }
  function strike(out) {
    const amtEl = $('#ar-amt'), before = G.bossState();
    const res = G.addMoney({ amt: amtEl?.value, src: $('#ar-src')?.value, out });
    if (!res) { amtEl?.classList.add('shake'); sfx('err'); buzz('error'); return; }
    document.activeElement?.blur?.();
    const after = G.bossState(), a = A(), amt = res.e.amt, pt = a.point();
    if (out) {
      a.healed(); say(before.dead ? 'deadHeal' : 'heal', after);
      floatText(`+${fmt(amt)} HP`, pt.x, pt.y, 'heal'); sfx('undo'); buzz('light');
      react({ x: pt.x, y: pt.y + 60 });
      return;
    }
    const frac = before.goal ? amt / before.goal : 0, crit = frac >= 0.2 || res.boss;
    a.hit(frac);
    say(before.dead ? 'dead' : res.boss ? 'death' : frac >= 0.2 ? 'big' : after.hp / after.goal < 0.25 && Math.random() < 0.6 ? 'low' : frac >= 0.03 ? 'mid' : 'small', after, res.boss ? 4400 : 3200);
    floatText(`−${fmt(amt)}`, pt.x, pt.y, crit ? 'dmg crit' : 'dmg');
    sfx(crit ? 'pr' : 'coin'); buzz(crit ? 'heavy' : 'medium');
    if (crit) confetti(pt.x, pt.y, 24, 7);
    setTimeout(() => react({ x: pt.x, y: pt.y + 60 }), res.boss ? 2300 : 450); // XP, level-up and «Боса переможено» after the hit lands
  }

  function view() {
    const sum = G.monthSum(), months = G.monthsBack(6), max = Math.max(1, ...months.map(x => x.inc)), log = S().money.log.slice(0, 25);
    const today = BIZ_ACTS.reduce((a, x) => a + G.actCount(x.id), 0);
    return `${boss()}
    <div class="row2"><button class="btn solid grow" data-act="money-add" data-out="0">${icon('plus')}Дохід</button><button class="btn ghost" data-act="money-add" data-out="1">${icon('minus')}Витрата</button></div>
    <div class="tiles">${tile(short(sum.inc), 'дохід', 'cash')}${tile(short(sum.out), 'витрати')}${tile(short(sum.net), 'прибуток', 'chart')}</div>
    ${sec('Бізнес-дії', `<span class="count">сьогодні ${today}</span>`)}
    <div class="acts">${BIZ_ACTS.map(a => { const n = G.actCount(a.id); return `<button class="act ${n ? 'on' : ''}" data-act="biz-act" data-id="${a.id}"><span class="act-i">${icon(a.icon)}</span><span class="act-t"><b>${G.nm(a)}</b><small>+${Math.round(a.xp * G.combo())} XP</small></span>${n ? `<em>×${n}</em>` : ''}</button>`; }).join('')}</div>
    ${sec('Пів року · дохід')}
    <section class="card bars">${months.map(x => `<div class="bar ${x.m === G.ym() ? 'now' : ''}"><span>${x.inc ? short(x.inc) : ''}</span><i style="height:${Math.max(3, (x.inc / max) * 70)}%"></i><small>${MSHORT[+x.m.slice(5) - 1]}</small></div>`).join('')}</section>
    ${sec('Записи')}
    <div class="rows">${log.map(e => `<button class="row" data-act="money-open" data-id="${e.id}"><span class="row-i ${e.out ? 'neg' : 'pos'}">${icon(e.out ? 'minus' : 'plus')}</span><span class="row-t"><b>${esc(e.src || (e.out ? 'Витрата' : 'Дохід'))}</b><small>${dateUA(e.d)}</small></span><span class="row-v ${e.out ? 'neg' : 'pos'}">${e.out ? '−' : '+'}${fmt(e.amt)}</span></button>`).join('') || `<div class="empty">${icon('cash')}<b>Каса порожня</b><span>Запиши перший дохід — отримаєш XP і першого пета.</span></div>`}</div>`;
  }

  const actions = {
    'boss-open': () => {
      const st = G.bossState(); A().open(st, mon()); form.cur = S().money.cur;
      if (ui.tab !== 'boss') ui.bossBack = ui.tab;
      say(moodPool(st), st, 3600); sfx('tap'); buzz('light'); go('boss');
    },
    'boss-back': () => { sfx('tap'); go(ui.bossBack && ui.bossBack !== 'boss' ? ui.bossBack : 'home'); },
    'boss-poke': () => { const st = G.bossState(); A().poked(); say(!st.goal ? 'sleep' : st.dead ? 'dead' : st.hp / st.goal < 0.25 ? 'low' : 'idle', st); sfx('tap'); buzz('light'); },
    'boss-hit': () => strike(false),
    'boss-heal': () => strike(true),
    'ar-src': el => { $('#ar-src').value = el.dataset.v; sfx('tap'); },
    'boss-summon': () => {
      const el = $('#ar-goal'), v = parseFloat(String(el?.value || '').replace(',', '.').replace(/\s/g, ''));
      if (!(v > 0)) { el?.classList.add('shake'); sfx('err'); return; }
      G.setMoney({ goal: v, cur: form.cur }); A().poked(); say('intro'); sfx('level'); buzz('heavy');
    },
    'money-add': el => {
      form.out = el.dataset.out === '1';
      const src = form.out ? [] : G.recentSources();
      openSheet(`<h2>${form.out ? 'Витрата' : 'Дохід'}</h2>
        <input class="field big" id="m-amt" inputmode="decimal" placeholder="Сума, ${esc(S().money.cur)}" autocomplete="off">
        <input class="field" id="m-src" maxlength="40" placeholder="${form.out ? 'На що' : 'Звідки: клієнт, проєкт, продукт'}" autocomplete="off">
        ${src.length ? `<div class="chips wrap">${src.map(x => `<button class="chip-b sm" data-act="money-src" data-v="${esc(x)}">${esc(x)}</button>`).join('')}</div>` : ''}
        <div class="sheet-foot"><button class="btn solid grow" data-act="money-save">Записати</button></div>`);
    },
    'money-src': el => { $('#m-src').value = el.dataset.v; },
    'money-save': (el, e) => {
      const res = G.addMoney({ amt: $('#m-amt').value, src: $('#m-src').value, out: form.out });
      if (!res) { $('#m-amt').classList.add('shake'); sfx('err'); return; }
      closeSheet();
      if (form.out) sfx('undo'); else { sfx('coin'); buzz('medium'); }
      react({ x: e.clientX, y: e.clientY });
    },
    'money-open': el => {
      const e = S().money.log.find(x => x.id === el.dataset.id); if (!e) return;
      openSheet(`<h2>${e.out ? '−' : '+'}${money(e.amt)}</h2><div class="lbl">${e.out ? 'Витрата' : 'Дохід'} · ${dateUA(e.d)}${e.src ? ' · ' + esc(e.src) : ''}</div>
        <div class="sheet-foot"><button class="btn ghost danger" data-act="money-del" data-id="${e.id}">${icon('trash')}Видалити запис</button></div>`);
    },
    'money-del': async el => { if (await ask('Видалити запис? Отриманий XP залишиться.')) { G.deleteMoney(el.dataset.id); closeSheet(); } },
    'money-set': () => {
      const m = S().money; form.cur = m.cur;
      openSheet(`<h2>Бос місяця</h2>
        <div class="lbl">Ціль прибутку на місяць</div>
        <input class="field big" id="g-goal" inputmode="decimal" placeholder="Наприклад, 100000" value="${m.goal || ''}" autocomplete="off">
        <div class="lbl">Валюта</div>
        <div class="chips">${CURRENCIES.map(x => `<button class="chip-b ${x === m.cur ? 'on' : ''}" data-act="money-cur" data-v="${x}">${x}</button>`).join('')}</div>
        <div class="lbl">Назва бізнесу чи проєкту</div>
        <input class="field" id="g-name" maxlength="30" placeholder="Необов'язково" value="${esc(m.name)}" autocomplete="off">
        <div class="sheet-foot"><button class="btn solid grow" data-act="money-set-save">Зберегти</button></div>`);
    },
    'money-cur': el => { form.cur = el.dataset.v; el.parentElement.querySelectorAll('.chip-b').forEach(b => b.classList.toggle('on', b === el)); },
    'money-set-save': (el, e) => { G.setMoney({ goal: $('#g-goal').value, cur: form.cur, name: $('#g-name').value }); closeSheet(); sfx('buy'); react({ x: e.clientX, y: e.clientY }); },
    'biz-act': (el, e) => {
      const r = G.doAct(el.dataset.id); if (!r) return;
      if (r.capped) { sfx('tap'); toast(`${icon('clock')}<div><b>Ліміт на сьогодні</b><small>Дія записана, але XP за неї вже вибрано</small></div>`); }
      else { sfx(el.dataset.id === 'deal' ? 'coin' : 'done'); buzz('medium'); }
      react({ x: e.clientX, y: e.clientY });
    },
  };
  return { view, homeCard, arena: arenaView, actions };
}
