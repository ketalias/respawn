// RESPAWN — static game data: levels, ranks, quests, exercises, items, achievements.

export const xpNeed = lv => 100 + (lv - 1) * 45;
export function levelInfo(xp) {
  let lv = 1, rest = Math.max(0, xp);
  while (rest >= xpNeed(lv)) { rest -= xpNeed(lv); lv++; }
  return { lv, cur: rest, need: xpNeed(lv) };
}

// rank = title + automatic body evolution (build 0..3, attitude 0..2)
export const RANKS = [
  { lv: 1, name: 'NPC', build: 0, expr: 0 },
  { lv: 3, name: 'Новачок', build: 0, expr: 1 },
  { lv: 6, name: 'Гравець', build: 1, expr: 1 },
  { lv: 10, name: 'Боєць', build: 1, expr: 2 },
  { lv: 15, name: 'Ветеран', build: 2, expr: 2 },
  { lv: 20, name: 'Еліта', build: 2, expr: 2 },
  { lv: 30, name: 'Майстер', build: 3, expr: 2 },
  { lv: 40, name: 'Легенда', build: 3, expr: 2 },
  { lv: 50, name: 'Фінальний бос', build: 3, expr: 2 },
];
export const rankOf = lv => RANKS.reduce((a, r) => (lv >= r.lv ? r : a), RANKS[0]);
export const nextRank = lv => RANKS.find(r => r.lv > lv) || null;

export const comboOf = streak => (streak >= 30 ? 2 : streak >= 14 ? 1.5 : streak >= 7 ? 1.25 : streak >= 3 ? 1.1 : 1);

export const CATS = {
  biz: { name: 'Гроші', attr: 'ГРОШІ', icon: 'cash' },
  math: { name: 'Математика', attr: 'МАТЕМ', icon: 'sigma' },
  eng: { name: 'Інженерія', attr: 'ІНЖЕНЕР', icon: 'gear' },
  dis: { name: 'Дисципліна', attr: 'ВОЛЯ', icon: 'target' },
  body: { name: 'Тіло', attr: 'ТІЛО', icon: 'heart' },
};
export const OLD_CATS = { str: 'body', vit: 'body', int: 'math' }; // saves from v1
export const attrLevel = xp => Math.floor(Math.sqrt(Math.max(0, xp) / 25)) + 1;

export const DIFFS = {
  e: { name: 'Легко', xp: 10, coins: 2 },
  m: { name: 'Норм', xp: 25, coins: 5 },
  h: { name: 'Хард', xp: 50, coins: 10 },
  x: { name: 'Епік', xp: 100, coins: 25 },
};

export const STARTER_QUESTS = [
  ['Одна дія, що приносить гроші', 'biz', 'h', 'daily'],
  ['Розв\'язати 3 задачі з математики', 'math', 'm', 'daily'],
  ['Година інженерної практики', 'eng', 'h', 'daily'],
  ['Записати доходи й витрати дня', 'biz', 'e', 'daily'],
  ['Рух: тренування або 30 хв ходьби', 'body', 'm', 'daily'],
  ['Поставити ціль доходу на місяць', 'biz', 'm', 'once'],
  ['Налаштувати квести і скіли під себе', 'dis', 'm', 'once'],
];
export const QUEST_IDEAS = [
  ['Написати 5 потенційним клієнтам', 'biz', 'm'], ['Виставити рахунок', 'biz', 'e'], ['Розібрати фінанси за тиждень', 'biz', 'm'], ['Підняти ціну', 'biz', 'h'],
  ['Запустити новий оффер', 'biz', 'x'], ['Розділ підручника з конспектом', 'math', 'h'], ['10 задач на ймовірність', 'math', 'm'], ['Розібрати доведення теореми', 'math', 'h'],
  ['Закомітити фічу', 'eng', 'm'], ['30 хв документації', 'eng', 'e'], ['Розібрати чужий код чи схему', 'eng', 'm'], ['Довести пет-проєкт до релізу', 'eng', 'x'],
  ['Глибока робота 2 год', 'dis', 'h'], ['Лягти до 23:00', 'dis', 'm'], ['8 годин сну', 'body', 'm'], ['10 000 кроків', 'body', 'm'],
];

export const BUBBLES = [
  'Ще один квест?', 'Ти не NPC.', 'Грінд не чекає.', 'XP саме себе не зафармить.', 'Сьогодні +1%.', 'Дисципліна > мотивація.',
  'Легкий день був учора.', 'GG, продовжуй.', 'Не зливай стрік!', 'Хто, якщо не ти?', 'Респавн — і вперед.', 'Гроші люблять рахунок.',
  'Складний відсоток працює і на скіли.', 'Спершу порахуй, потім роби.', 'Працює? Не чіпай. Жартую, рефактор.', 'Маржа — це теж характер.',
  'Ділити на нуль не можна. Здаватись теж.', 'Кеш-флоу сам себе не зробить.', 'It works on my machine.', 'P ≠ NP, але ти спробуй.',
];
export const BUBBLES_HURT = ['Ай.', 'Досить.', 'Я рахую кожен тап.', 'Серйозно?', 'Іди зароби грошей.', 'Це не клікер.', 'Гаразд, це клікер.'];

/* ---------- business reps: quick-log actions (cap = rewarded per day) ---------- */
export const BIZ_ACTS = [
  { id: 'reach', name: 'Написав ліду', xp: 5, coins: 1, cap: 20, icon: 'bolt' },
  { id: 'meet', name: 'Дзвінок / зустріч', xp: 15, coins: 2, cap: 8, icon: 'user' },
  { id: 'content', name: 'Контент / пост', xp: 10, coins: 2, cap: 5, icon: 'star' },
  { id: 'ship', name: 'Здав роботу', xp: 25, coins: 4, cap: 5, icon: 'check' },
  { id: 'deal', name: 'Закрив угоду', xp: 60, coins: 12, cap: 5, icon: 'brief' },
];
export const CURRENCIES = ['₴', '$', '€', 'zł'];

/* ---------- skills: level from focused hours ---------- */
const SK_H = [0, 1, 3, 6, 10, 15, 25, 40, 60, 90, 130, 180, 250, 350, 500, 750, 1000];
export const skillLevel = mins => { const h = mins / 60; let l = 0; for (const t of SK_H) if (h >= t) l++; return l; };
export const skillSpan = mins => { const l = skillLevel(mins); return SK_H[l] === undefined ? null : [SK_H[l - 1], SK_H[l]]; };
export const DEFAULT_SKILLS = [['Математика: задачі й теорія', 'math'], ['Програмування', 'eng'], ['Фінанси та продажі', 'biz']];
export const SKILL_CATS = ['math', 'eng', 'biz'];

/* ---------- exercises: type w = вага×повтори, bw = власна вага, t = хвилини ---------- */
export const GROUPS = ['Груди', 'Спина', 'Ноги', 'Плечі', 'Руки', 'Прес', 'Кардіо'];
const E = (id, name, g, type = 'w') => ({ id, name, g, type });
export const EXERCISES = [
  E('bench', 'Жим лежачи', 0), E('db_bench', 'Жим гантелей лежачи', 0), E('incline', 'Жим на похилій лаві', 0), E('fly', 'Розведення гантелей', 0),
  E('dips', 'Бруси', 0, 'bw'), E('pushup', 'Віджимання', 0, 'bw'),
  E('deadlift', 'Станова тяга', 1), E('pullup', 'Підтягування', 1, 'bw'), E('row', 'Тяга штанги в нахилі', 1), E('lat', 'Тяга верхнього блоку', 1),
  E('db_row', 'Тяга гантелі однією рукою', 1), E('hyper', 'Гіперекстензія', 1, 'bw'),
  E('squat', 'Присідання зі штангою', 2), E('legpress', 'Жим ногами', 2), E('rdl', 'Румунська тяга', 2), E('lunge', 'Випади', 2),
  E('legext', 'Розгинання ніг', 2), E('legcurl', 'Згинання ніг', 2), E('calf', 'Підйом на носки', 2),
  E('ohp', 'Армійський жим', 3), E('db_press', 'Жим гантелей сидячи', 3), E('lateral', 'Махи в сторони', 3), E('facepull', 'Тяга до обличчя', 3),
  E('curl', 'Підйом штанги на біцепс', 4), E('hammer', 'Молотки', 4), E('french', 'Французький жим', 4), E('pushdown', 'Розгинання на блоці', 4),
  E('crunch', 'Скручування', 5, 'bw'), E('legraise', 'Підйом ніг у висі', 5, 'bw'), E('plank', 'Планка', 5, 't'),
  E('run', 'Біг', 6, 't'), E('bike', 'Велотренажер', 6, 't'), E('rope', 'Скакалка', 6, 't'),
];

/* ---------- items ---------- */
export const SLOTS = [
  { id: 'hair', name: 'Зачіска' }, { id: 'hairColor', name: 'Колір' }, { id: 'skin', name: 'Шкіра' },
  { id: 'face', name: 'Обличчя', opt: true }, { id: 'head', name: 'Голова', opt: true },
  { id: 'top', name: 'Верх' }, { id: 'bottom', name: 'Низ' }, { id: 'shoes', name: 'Взуття' },
  { id: 'hand', name: 'В руці', opt: true }, { id: 'back', name: 'Спина', opt: true }, { id: 'pet', name: 'Пет', opt: true }, { id: 'aura', name: 'Аура', opt: true },
  { id: 'scene', name: 'Локація' }, { id: 'theme', name: 'Тема' },
];
export const RAR = { c: 'Звичайний', r: 'Рідкісний', e: 'Епічний', l: 'Легендарний' };

// src: 0 = стартовий, {lv} = нагорода за рівень, {coins} = магазин, {ach} = за ачівку
const I = (slot, key, name, src = 0, rar = 'c', extra = {}) => ({ id: `${slot}:${key}`, slot, key, name, src, rar, ...extra });
const lv = n => ({ lv: n }), $ = n => ({ coins: n }), ach = id => ({ ach: id });

export const ITEMS = [
  I('hair', 'messy', 'Хаос'), I('hair', 'buzz', 'Їжачок'), I('hair', 'bald', 'Лисий'),
  I('hair', 'curly', 'Кучері', $(60)), I('hair', 'spiky', 'Шипи', $(80), 'r'), I('hair', 'slick', 'Андеркат', $(80), 'r'),
  I('hair', 'long', 'Довге', $(100), 'r'), I('hair', 'knot', 'Самурай', $(120), 'r'), I('hair', 'mohawk', 'Ірокез', $(150), 'e'),

  I('hairColor', 'black', 'Чорний', 0, 'c', { sw: '#2a2a35' }), I('hairColor', 'brown', 'Каштан', 0, 'c', { sw: '#5c3d26' }),
  I('hairColor', 'blond', 'Блонд', $(30), 'c', { sw: '#e6c66e' }), I('hairColor', 'red', 'Рудий', $(30), 'c', { sw: '#c8402f' }),
  I('hairColor', 'white', 'Срібло', $(60), 'r', { sw: '#ececf4' }), I('hairColor', 'teal', 'Кислота', $(60), 'r', { sw: '#22c4a4' }),
  I('hairColor', 'pink', 'Рожевий', $(60), 'r', { sw: '#f272ad' }), I('hairColor', 'blue', 'Синій', $(60), 'r', { sw: '#4a78f5' }),

  I('skin', 's1', 'Тон 1', 0, 'c', { sw: '#f3cfae' }), I('skin', 's2', 'Тон 2', 0, 'c', { sw: '#e0ac84' }),
  I('skin', 's3', 'Тон 3', 0, 'c', { sw: '#b47b52' }), I('skin', 's4', 'Тон 4', 0, 'c', { sw: '#7b4f34' }),

  I('face', 'glasses', 'Окуляри'), I('face', 'mask', 'Маска', $(70), 'c'), I('face', 'shades_green', 'Зелені лінзи', lv(8), 'r'),
  I('face', 'shades_black', 'Deal with it', $(140), 'r'), I('face', 'monocle', 'Монокль', ach('over'), 'e'), I('face', 'visor', 'Візор', lv(25), 'e'),

  I('head', 'cap', 'Кепка', $(90), 'c'), I('head', 'beanie', 'Шапка', $(90), 'c'), I('head', 'bandana', 'Бандана', $(110), 'r'),
  I('head', 'phones', 'Навушники', $(160), 'r'), I('head', 'ears', 'Котячі вушка', ach('tap'), 'e'), I('head', 'horns', 'Роги', ach('st30'), 'e'),
  I('head', 'gradcap', 'Конфедератка', ach('dr100'), 'r'), I('head', 'hardhat', 'Каска інженера', ach('engh10'), 'r'), I('head', 'tophat', 'Циліндр', ach('ath'), 'e'),
  I('head', 'propeller', 'Кепка з пропелером', ach('s_dev'), 'e'), I('head', 'halo', 'Німб', lv(30), 'l'), I('head', 'crown', 'Корона', lv(50), 'l'),

  I('top', 'tee_gray', 'Сіра футболка'), I('top', 'tee_black', 'Чорна футболка', lv(2)), I('top', 'hoodie', 'Чорне худі', lv(3)),
  I('top', 'jacket', 'Куртка 2004', lv(6), 'r'), I('top', 'track', 'Спортивка', $(140), 'r'), I('top', 'varsity', 'Бомбер', $(180), 'r'),
  I('top', 'tank', 'Майка', ach('w10'), 'r'), I('top', 'gi', 'Кімоно', $(220), 'e'), I('top', 'leather', 'Шкірянка', lv(15), 'e'),
  I('top', 'hivis', 'Сигнальний жилет', $(120), 'c'), I('top', 'turtleneck', 'Чорний гольф', $(160), 'r'), I('top', 'vc_vest', 'Жилетка інвестора', $(200), 'r'),
  I('top', 'pi_tee', 'Футболка π', ach('s_pi'), 'e'), I('top', 'labcoat', 'Халат', ach('mathh10'), 'e'), I('top', 'suit', 'Костюм CEO', ach('boss1'), 'e'),
  I('top', 'shirtless', 'Аполлон', ach('w25'), 'e'), I('top', 'cyber', 'Кібер-броня', lv(25), 'e'), I('top', 'gold', 'Золота броня', lv(40), 'l'),

  I('bottom', 'jeans', 'Широкі джинси'), I('bottom', 'joggers', 'Джогери', $(60)), I('bottom', 'shorts', 'Шорти', $(60)),
  I('bottom', 'cargo', 'Карго', lv(6), 'r'), I('bottom', 'track_pants', 'Спортивні', $(100), 'r'), I('bottom', 'gi_pants', 'Хакама', $(120), 'r'), I('bottom', 'suit_pants', 'Брюки', $(120), 'r'),
  I('bottom', 'cyber_legs', 'Кібер-ноги', lv(25), 'e'), I('bottom', 'gold_legs', 'Золоті поножі', lv(40), 'l'),

  I('shoes', 'kicks_white', 'Білі кроси'), I('shoes', 'boots', 'Берці', $(90)), I('shoes', 'kicks_red', 'Червоні кроси', $(130), 'r'),
  I('shoes', 'kicks_neon', 'Неон', lv(25), 'e'), I('shoes', 'gold_boots', 'Золоті чоботи', lv(40), 'l'),

  I('hand', 'coffee', 'Кава', $(60)), I('hand', 'wrench', 'Гайковий ключ', $(90)), I('hand', 'laptop', 'Ноутбук', $(180), 'r'),
  I('hand', 'briefcase', 'Кейс', ach('act50'), 'r'), I('hand', 'calculator', 'Калькулятор', ach('fast'), 'e'), I('hand', 'moneybag', 'Мішок грошей', ach('m25'), 'e'),

  I('pet', 'piggy', 'Скарбничка', ach('m1'), 'r'), I('pet', 'duck', 'Гумова качка', ach('f1'), 'r'), I('pet', 'cat', 'Чорний кіт', $(300), 'e'), I('pet', 'drone', 'Дрон', $(450), 'e'),

  I('back', 'barbell', 'Штанга', ach('pr1'), 'r'), I('back', 'cape', 'Плащ', $(260), 'e'), I('back', 'katana', 'Катана', lv(18), 'e'),
  I('back', 'wings_dark', 'Темні крила', $(600), 'l'), I('back', 'wings', 'Крила', lv(40), 'l'),

  I('aura', 'glow', 'Сяйво', lv(5), 'r', { sw: '#ffffff' }), I('aura', 'fire', 'Полум\'я', lv(10), 'e', { sw: '#ff9a3c' }),
  I('aura', 'toxic', 'Токсик', $(240), 'e', { sw: '#7dff5a' }), I('aura', 'shadow', 'Тінь', ach('night'), 'e', { sw: '#9a5cff' }),
  I('aura', 'math', 'Формули', ach('drp5'), 'e', { sw: '#8fd3ff' }), I('aura', 'money', 'Грошопад', ach('boss3'), 'l', { sw: '#4ade80' }), I('aura', 'matrix', 'Матриця', ach('s_neo'), 'l', { sw: '#39ff7a' }),
  I('aura', 'volt', 'Блискавка', lv(20), 'e', { sw: '#6fe3ff' }), I('aura', 'spark', 'Золотий пил', lv(35), 'l', { sw: '#ffe27a' }),
  I('aura', 'cosmic', 'Космос', lv(45), 'l', { sw: '#b48cff' }),

  I('scene', 'room', 'Кімната'), I('scene', 'gym', 'Качалка', lv(4)), I('scene', 'roof', 'Нічний дах', lv(12), 'r'),
  I('scene', 'office', 'Офіс', $(280), 'r'), I('scene', 'lab', 'Лабораторія', $(280), 'r'), I('scene', 'vault', 'Сховище', ach('boss6'), 'l'),
  I('scene', 'dojo', 'Додзьо', $(200), 'r'), I('scene', 'retro', 'Ретровейв', $(320), 'e'), I('scene', 'space', 'Орбіта', lv(35), 'l'),

  I('theme', 'mono', 'Моно', 0, 'c', { sw: '#f4f4f5' }), I('theme', 'ps2', 'PS2', $(50), 'c', { sw: '#3fe0c0' }),
  I('theme', 'acid', 'Кислота', $(80), 'r', { sw: '#c6ff4a' }), I('theme', 'gold', 'Золото', $(80), 'r', { sw: '#ffd257' }),
  I('theme', 'blood', 'Кров', $(80), 'r', { sw: '#ff4d5a' }), I('theme', 'ice', 'Лід', $(80), 'r', { sw: '#7ecbff' }),
  I('theme', 'cash', 'Кеш', $(80), 'r', { sw: '#4ade80' }), I('theme', 'blueprint', 'Кресленик', $(80), 'r', { sw: '#5aa9ff' }), I('theme', 'amber', 'Термінал', ach('s_leet'), 'e', { sw: '#ffb347' }),
  I('theme', 'vapor', 'Вейпор', $(120), 'e', { sw: '#c78bff' }),
];
export const ITEM = Object.fromEntries(ITEMS.map(i => [i.id, i]));
export const THEMES = {
  mono: ['#f4f4f5', '#0a0a0c'], ps2: ['#3fe0c0', '#04110e'], acid: ['#c6ff4a', '#0c1200'], gold: ['#ffd257', '#161000'],
  blood: ['#ff4d5a', '#16000a'], ice: ['#7ecbff', '#00101c'], vapor: ['#c78bff', '#0e0018'],
  cash: ['#4ade80', '#03140a'], blueprint: ['#5aa9ff', '#00101e'], amber: ['#ffb347', '#1a0e00'],
};
export const DEFAULT_EQ = {
  hair: 'messy', hairColor: 'black', skin: 's2', face: 'glasses', head: null, top: 'tee_gray', bottom: 'jeans',
  shoes: 'kicks_white', hand: null, back: null, pet: null, aura: null, scene: 'room', theme: 'mono',
};

/* ---------- achievements: prog(state) -> [current, goal] ---------- */
const A = (id, name, desc, icon, tier, coins, prog, extra = {}) => ({ id, name, desc, icon, tier, coins, prog, ...extra });
const cnt = (k, n) => s => [s.counters[k] || 0, n];
const catHours = cat => s => Math.floor(s.skills.filter(k => k.cat === cat).reduce((a, k) => a + k.mins, 0) / 60);
const S1 = { secret: true };
export const ACHS = [
  // ритм
  A('q1', 'Перша кров', 'Виконай перший квест', 'sword', 'b', 10, cnt('quests', 1)),
  A('q25', 'У ритмі', 'Виконай 25 квестів', 'sword', 's', 30, cnt('quests', 25)),
  A('q100', 'Сотка', 'Виконай 100 квестів', 'sword', 'g', 80, cnt('quests', 100)),
  A('q500', 'Машина', 'Виконай 500 квестів', 'sword', 'g', 250, cnt('quests', 500)),
  A('epic1', 'Бос повержений', 'Виконай епічний квест', 'skull', 's', 40, cnt('epics', 1)),
  A('crit', 'Критичний удар', 'Вибий крит ×2 XP на квесті', 'bolt', 'b', 15, cnt('crit', 1)),
  A('perf1', 'Ідеальний день', 'Закрий усі щоденні квести за день', 'star', 'b', 20, cnt('perfect', 1)),
  A('perf7', 'Перфекціоніст', '7 ідеальних днів', 'star', 'g', 100, cnt('perfect', 7)),
  A('st3', 'Розігрів', 'Стрік 3 дні', 'flame', 'b', 15, s => [s.streak.best, 3]),
  A('st7', 'Тиждень вогню', 'Стрік 7 днів', 'flame', 's', 50, s => [s.streak.best, 7]),
  A('st30', 'Незламний', 'Стрік 30 днів', 'flame', 'g', 200, s => [s.streak.best, 30]),
  A('st100', 'Сто днів', 'Стрік 100 днів', 'flame', 'g', 500, s => [s.streak.best, 100]),
  // гроші та бізнес
  A('m1', 'Перша копійка', 'Запиши перший дохід', 'cash', 'b', 15, cnt('incomes', 1)),
  A('m25', 'Грошовий потік', '25 записів доходу', 'cash', 's', 60, cnt('incomes', 25)),
  A('goalset', 'План є', 'Постав ціль доходу на місяць', 'target', 'b', 10, s => [s.money.goal > 0 ? 1 : 0, 1]),
  A('boss1', 'Бос місяця', 'Закрий місячну ціль доходу', 'skull', 's', 100, cnt('goals', 1)),
  A('boss3', 'Серійний убивця цілей', 'Закрий місячну ціль 3 рази', 'skull', 'g', 250, cnt('goals', 3)),
  A('boss6', 'Пів року в плюсі', 'Закрий місячну ціль 6 разів', 'crown', 'g', 500, cnt('goals', 6)),
  A('over', 'Оверкіл', 'Зроби ×2 від місячної цілі', 'chart', 'g', 200, cnt('overkill', 1)),
  A('ath', 'Новий ATH', 'Побий свій найкращий місяць', 'chart', 's', 80, cnt('ath', 1)),
  A('src3', 'Диверсифікація', '3 різні джерела доходу за місяць', 'brief', 's', 60, cnt('src3', 1)),
  A('act50', 'Двигун продажів', '50 бізнес-дій', 'brief', 'b', 40, cnt('acts', 50)),
  A('act500', 'Машина лідогенерації', '500 бізнес-дій', 'brief', 'g', 200, cnt('acts', 500)),
  A('deal10', 'Закривач', 'Закрий 10 угод', 'brief', 's', 120, cnt('act_deal', 10)),
  // математика
  A('dr1', 'Розминка', 'Пройди першу розминку мозку', 'sigma', 'b', 15, cnt('drills', 1)),
  A('dr100', 'Сто правильних', '100 правильних відповідей у розминках', 'sigma', 's', 60, cnt('drillOk', 100)),
  A('dr1000', 'Тисяча', '1000 правильних відповідей у розминках', 'sigma', 'g', 250, cnt('drillOk', 1000)),
  A('drp5', 'Без помилок', '5 ідеальних розминок', 'star', 's', 80, cnt('drillPerfect', 5)),
  A('fast', 'Людина-калькулятор', 'Правильна відповідь швидше ніж за 2 секунди', 'bolt', 's', 40, cnt('drillFast', 1)),
  A('mathh10', 'Десять годин математики', '10 годин фокусу на математиці', 'clock', 's', 80, s => [catHours('math')(s), 10]),
  // інженерія та фокус
  A('f1', 'Метод гумової качки', 'Заверши першу фокус-сесію', 'clock', 'b', 15, cnt('sessions', 1)),
  A('f90', 'Глибоке занурення', 'Фокус-сесія на 90+ хвилин', 'clock', 's', 60, cnt('deep', 1)),
  A('engh10', 'Десять годин інженерії', '10 годин фокусу на інженерії', 'gear', 's', 80, s => [catHours('eng')(s), 10]),
  A('h100', 'Сто годин', '100 годин фокусу сумарно', 'gear', 'g', 300, s => [Math.floor((s.counters.focusMin || 0) / 60), 100]),
  A('sk5', 'Стек', 'Прокачай 3 скіли до 5 рівня', 'sigma', 'g', 150, s => [s.skills.filter(k => skillLevel(k.mins) >= 5).length, 3]),
  // тіло
  A('w1', 'Перший підхід', 'Заверши перше тренування', 'dumbbell', 'b', 15, cnt('workouts', 1)),
  A('w10', 'Завсідник', '10 тренувань', 'dumbbell', 's', 60, cnt('workouts', 10)),
  A('w25', 'Залізна звичка', '25 тренувань', 'dumbbell', 'g', 120, cnt('workouts', 25)),
  A('pr1', 'Новий рекорд', 'Побий свій рекорд у вправі', 'medal', 'b', 20, cnt('prs', 1)),
  // рівні
  A('lv5', 'Вже не NPC', 'Досягни 5 рівня', 'bolt', 'b', 25, s => [levelInfo(s.xp).lv, 5]),
  A('lv10', 'Двозначний', 'Досягни 10 рівня', 'bolt', 's', 50, s => [levelInfo(s.xp).lv, 10]),
  A('lv20', 'Еліта', 'Досягни 20 рівня', 'bolt', 'g', 100, s => [levelInfo(s.xp).lv, 20]),
  A('lv30', 'Майстер', 'Досягни 30 рівня', 'bolt', 'g', 200, s => [levelInfo(s.xp).lv, 30]),
  A('lv50', 'Фінальний бос', 'Досягни 50 рівня', 'crown', 'g', 500, s => [levelInfo(s.xp).lv, 50]),
  // різне
  A('early', 'Рання пташка', 'Виконай квест до 7:00', 'sun', 's', 30, cnt('early', 1)),
  A('night', 'Нічна зміна', 'Виконай квест після півночі', 'moon', 's', 30, cnt('night', 1)),
  A('shop1', 'Шопоголік', 'Купи перший скін', 'bag', 'b', 10, cnt('bought', 1)),
  A('own25', 'Колекціонер', 'Збери 25 куплених чи здобутих скінів', 'shirt', 's', 80, s => [s.owned.length, 25]),
  A('rich', 'Скрудж', 'Накопич 500 монет', 'coin', 's', 50, s => [Math.min(500, s.counters.maxCoins || 0), 500]),
  A('loot7', 'Лутер', 'Забери денний лут 7 разів', 'chest', 'b', 30, cnt('loot', 7)),
  A('attr5', 'Гармонія', 'Усі атрибути 5 рівня', 'heart', 'g', 120, s => [Math.min(...Object.keys(CATS).map(k => attrLevel(s.stats[k] || 0))), 5]),
  // секрети — умови приховані, поки не знайдеш
  A('tap', 'Не чіпай мене', 'Тапнути персонажа 50 разів', 'skull', 's', 30, cnt('taps', 50), S1),
  A('s_leet', 'L33T', 'Записати суму 1337', 'gear', 's', 37, cnt('s_leet', 1), S1),
  A('s_nice', 'Nice.', 'Записати суму 69 або 420', 'star', 'b', 69, cnt('s_nice', 1), S1),
  A('s_404', 'Гроші не знайдено', 'Записати суму 404', 'x', 'b', 40, cnt('s_404', 1), S1),
  A('s_42', 'Відповідь на все', 'Відповісти 42 там, де це неправильно', 'sigma', 'b', 42, cnt('s_42', 1), S1),
  A('s_f13', 'П\'ятниця, 13-те', 'Зайти в гру в п\'ятницю 13-го', 'moon', 's', 131, cnt('s_f13', 1), S1),
  A('s_pi', 'Трохи більше трьох', 'Зайти о 3:14 чи 15:14 або 14 березня', 'sigma', 's', 31, cnt('s_pi', 1), S1),
  A('s_dev', 'Режим розробника', 'Сім разів тапнути версію в профілі', 'gear', 's', 30, cnt('s_dev', 1), S1),
  A('s_neo', 'Прокинься, Нео', 'Назватись Нео', 'bolt', 'g', 101, cnt('s_neo', 1), S1),
  A('s_hello', 'Hello, World', 'Створити квест «Hello, World»', 'check', 'b', 20, cnt('s_hello', 1), S1),
  A('s_lamp', 'Електрик', 'Доклацатись до лампи в шафці', 'bolt', 'b', 20, cnt('s_lamp', 1), S1),
  A('s_undo', 'Туди-сюди', 'Скасувати квест 10 разів', 'back', 'b', 10, cnt('undos', 10), S1),
  A('s_coin', 'Дрібняк', 'Натрусити монетку з гаманця', 'coin', 'b', 5, cnt('s_coin', 1), S1),
];
export const ACH = Object.fromEntries(ACHS.map(a => [a.id, a]));
