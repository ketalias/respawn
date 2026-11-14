// RESPAWN — money & business screen: monthly income goal as a boss fight, quick business reps, ledger.
import { BIZ_ACTS, CURRENCIES } from './data.js';

const MONTHS = ['січень', 'лютий', 'березень', 'квітень', 'травень', 'червень', 'липень', 'серпень', 'вересень', 'жовтень', 'листопад', 'грудень'];
const MSHORT = ['січ', 'лют', 'бер', 'кві', 'тра', 'чер', 'лип', 'сер', 'вер', 'жов', 'лис', 'гру'];
export const short = n => {
  const a = Math.abs(n), sign = n < 0 ? '−' : '';
  if (a >= 1e6) return sign + (Math.round(a / 1e5) / 10).toString().replace('.', ',') + 'M';
  if (a >= 1e4) return sign + Math.round(a / 1e3) + 'k';
  return sign + Math.round(a).toLocaleString('uk-UA').replace(/ /g, ' ');
};

export default function moneyModule(c) {
  const { G, icon, esc, fmt, tile, sec, openSheet, closeSheet, react, sfx, buzz, toast, ask, dateUA, $ } = c;
  const S = () => G.S;
  const money = n => `${fmt(n)} ${esc(S().money.cur)}`;
  let form = { out: false, cur: '₴' };

  function boss() {
    const m = S().money, sum = G.monthSum(), now = new Date(), month = MONTHS[now.getMonth()];
    if (!m.goal) {
      return `<section class="card boss"><div class="boss-top"><div class="boss-i">${icon('skull')}</div><div class="boss-b">
        <div class="lbl">Бос місяця · ${month}</div><h2>Цілі ще немає</h2>
        <small>Постав дохід, який хочеш зробити за місяць. Це буде бос: кожен записаний дохід знімає йому HP.</small></div></div>
        <button class="btn solid" data-act="money-set">${icon('target')}Поставити ціль</button></section>`;
    }
    const left = Math.max(0, m.goal - sum.inc), pct = Math.min(100, (sum.inc / m.goal) * 100), dead = sum.inc >= m.goal;
    const daysLeft = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate() + 1;
    return `<section class="card boss ${dead ? 'dead' : ''}">
      <div class="boss-top"><div class="boss-i">${icon(dead ? 'crown' : 'skull')}</div>
        <div class="boss-b"><div class="lbl">Бос місяця · ${month}${m.name ? ' · ' + esc(m.name) : ''}</div>
          <h2>${dead ? 'Переможено' : money(left)}</h2>
          <small>${dead ? `Зроблено ${money(sum.inc)} — ${Math.round((sum.inc / m.goal) * 100)}% цілі` : `HP боса · ${daysLeft} дн. до кінця · треба ${money(Math.ceil(left / daysLeft))} на день`}</small></div>
        <button class="icon-b" data-act="money-set" aria-label="Налаштувати ціль">${icon('gear')}</button></div>
      <div class="hp"><i style="width:${dead ? 100 : 100 - pct}%"></i></div>
      <div class="xp-meta"><span><b>${fmt(sum.inc)}</b> / ${fmt(m.goal)} ${esc(m.cur)}</span><span>${Math.round(pct)}%</span></div>
    </section>`;
  }

  // compact version for the home screen
  function homeCard() {
    const m = S().money, sum = G.monthSum();
    if (!m.goal) return `<button class="card loot" data-act="go" data-tab="spheres" data-stab="money"><span class="loot-i">${icon('skull')}</span><span class="loot-t"><b>Бос місяця</b><small>Постав ціль доходу — і бий її записами</small></span><span class="loot-go">${icon('play')}</span></button>`;
    const pct = Math.min(100, (sum.inc / m.goal) * 100), dead = sum.inc >= m.goal;
    return `<button class="card mini-boss ${dead ? 'dead' : ''}" data-act="go" data-tab="spheres" data-stab="money">
      <div class="mini-top"><span class="lbl">${icon(dead ? 'crown' : 'skull')} Бос місяця</span><b>${dead ? 'переможено' : `${short(sum.inc)} / ${short(m.goal)} ${esc(m.cur)}`}</b></div>
      <div class="hp slim"><i style="width:${dead ? 100 : 100 - pct}%"></i></div></button>`;
  }

  function view() {
    const sum = G.monthSum(), months = G.monthsBack(6), max = Math.max(1, ...months.map(x => x.inc)), log = S().money.log.slice(0, 25);
    const today = BIZ_ACTS.reduce((a, x) => a + G.actCount(x.id), 0);
    return `${boss()}
    <div class="row2"><button class="btn solid grow" data-act="money-add" data-out="0">${icon('plus')}Дохід</button><button class="btn ghost" data-act="money-add" data-out="1">${icon('minus')}Витрата</button></div>
    <div class="tiles">${tile(short(sum.inc), 'дохід', 'cash')}${tile(short(sum.out), 'витрати')}${tile(short(sum.net), 'прибуток', 'chart')}</div>
    ${sec('Бізнес-дії', `<span class="count">сьогодні ${today}</span>`)}
    <div class="acts">${BIZ_ACTS.map(a => { const n = G.actCount(a.id); return `<button class="act ${n ? 'on' : ''}" data-act="biz-act" data-id="${a.id}"><span class="act-i">${icon(a.icon)}</span><span class="act-t"><b>${G.nm(a)}</b><small>+${Math.round(a.xp * G.combo())} XP</small></span>${n ? `<em>×${n}</em>` : ''}</button>`; }).join('')}</div>
    ${sec('Пів року')}
    <section class="card bars">${months.map(x => `<div class="bar ${x.m === G.ym() ? 'now' : ''}"><span>${x.inc ? short(x.inc) : ''}</span><i style="height:${Math.max(3, (x.inc / max) * 70)}%"></i><small>${MSHORT[+x.m.slice(5) - 1]}</small></div>`).join('')}</section>
    ${sec('Записи')}
    <div class="rows">${log.map(e => `<button class="row" data-act="money-open" data-id="${e.id}"><span class="row-i ${e.out ? 'neg' : 'pos'}">${icon(e.out ? 'minus' : 'plus')}</span><span class="row-t"><b>${esc(e.src || (e.out ? 'Витрата' : 'Дохід'))}</b><small>${dateUA(e.d)}</small></span><span class="row-v ${e.out ? 'neg' : 'pos'}">${e.out ? '−' : '+'}${fmt(e.amt)}</span></button>`).join('') || `<div class="empty">${icon('cash')}<b>Каса порожня</b><span>Запиши перший дохід — отримаєш XP і першого пета.</span></div>`}</div>`;
  }

  const actions = {
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
        <div class="lbl">Ціль доходу на місяць</div>
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
  return { view, homeCard, actions };
}
