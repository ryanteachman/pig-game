// Game state + localStorage save/load. Plain JS, no Phaser.
const SAVE_KEY = 'mrpig-save-v1';
const SETTINGS_KEY = 'mrpig-settings-v1';

export const DEBUG = typeof location !== 'undefined' && new URLSearchParams(location.search).get('debug') === '1';

export const RANKS = [
  { mp: 0, name: 'Innocent Piglet' },
  { mp: 20, name: 'Little Rascal' },
  { mp: 60, name: 'Troublemaker' },
  { mp: 110, name: 'Menace' },
  { mp: 200, name: 'Legendary Mischief Pig' },
];

export const TOTAL_CHEESE = 30;
export const CHEESE_PER_AREA = { hub: 6, farm: 8, castle: 8, caves: 8 };

// Prank checklists shown in the pause menu.
export const PRANKS = {
  hub: [{ id: 'hub_nap', name: 'Startle the Napper', mp: 5 }],
  farm: [
    { id: 'farm_snack', name: 'Snack Heist', mp: 10 },
    { id: 'farm_scarecrow', name: 'Scarecrow Swap', mp: 10 },
    { id: 'farm_mud', name: 'Mud Surprise', mp: 10 },
    { id: 'farm_bell', name: 'Dinner Bell', mp: 10 },
    { id: 'farm_contest', name: 'BIG: The Great Eating Contest', mp: 15 },
  ],
  castle: [
    { id: 'castle_armor', name: 'Pink Armor', mp: 10 },
    { id: 'castle_banner', name: 'Banner Swap', mp: 10 },
    { id: 'castle_helmet', name: 'Helmet Hide', mp: 10 },
    { id: 'castle_cushion', name: 'Royal Whoopee Cushion', mp: 10 },
    { id: 'castle_joust', name: 'BIG: The Joust', mp: 15 },
  ],
  caves: [
    { id: 'caves_room1', name: 'Cave Room 1', mp: 5 },
    { id: 'caves_room2', name: 'Cave Room 2', mp: 5 },
    { id: 'caves_room3', name: 'Cave Room 3', mp: 5 },
    { id: 'caves_room4', name: 'Cave Room 4', mp: 5 },
    { id: 'caves_bat', name: 'Bat Hat Drop', mp: 5 },
    { id: 'caves_mustache', name: 'Crystal Mustache', mp: 5 },
    { id: 'caves_dream', name: 'BIG: The Bad Dreams', mp: 20 },
  ],
};

function fresh() {
  return {
    mp: 0,
    cheese: {}, // id -> true
    pranks: {}, // id -> true
    flags: {}, // misc story flags
    done: { farm: false, castle: false, caves: false },
    scene: 'Hub',
    sceneData: {},
    carrying: null,
    contestLosses: 0,
    joustLosses: 0,
    dreamLosses: 0,
  };
}

export const state = fresh();
export const settings = { muted: false, crown: false };

const listeners = new Set();
export function onChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
function emit(type, detail) {
  for (const fn of listeners) fn(type, detail);
}

function storage() {
  try { return window.localStorage; } catch { return null; }
}

export function save() {
  storage()?.setItem(SAVE_KEY, JSON.stringify(state));
}

export function hasSave() {
  return !!storage()?.getItem(SAVE_KEY);
}

export function load() {
  const raw = storage()?.getItem(SAVE_KEY);
  if (!raw) return false;
  try {
    const data = JSON.parse(raw);
    Object.assign(state, fresh(), data);
    state.done = { ...fresh().done, ...data.done };
    emit('load');
    return true;
  } catch {
    return false;
  }
}

export function newGame() {
  Object.assign(state, fresh());
  save();
  emit('load');
}

export function loadSettings() {
  try {
    Object.assign(settings, JSON.parse(storage()?.getItem(SETTINGS_KEY) || '{}'));
  } catch { /* ignore bad settings */ }
}
export function saveSettings() {
  storage()?.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function rankIndex(mp = state.mp) {
  let idx = 0;
  RANKS.forEach((r, i) => { if (mp >= r.mp) idx = i; });
  return idx;
}
export const rankName = (mp = state.mp) => RANKS[rankIndex(mp)].name;

export function addMP(n) {
  const before = rankIndex();
  state.mp += n;
  const after = rankIndex();
  emit('mp', { amount: n, rankUp: after > before ? RANKS[after].name : null });
  return after > before;
}

export function cheeseCount() {
  return Object.keys(state.cheese).length;
}

export function collectCheese(id) {
  if (state.cheese[id]) return false;
  state.cheese[id] = true;
  save();
  emit('cheese', { id, count: cheeseCount() });
  return true;
}

export function hasPrank(id) {
  return !!state.pranks[id];
}

// Awards a prank once; returns false if it was already done.
export function doPrank(id, mp, name) {
  if (state.pranks[id]) return false;
  state.pranks[id] = true;
  emit('prank', { id, mp, name });
  addMP(mp);
  save();
  return true;
}

export function setFlag(key, value = true) {
  state.flags[key] = value;
  save();
}

export function completeArea(area) {
  state.done[area] = true;
  save();
  emit('area', { area });
}

export function setLocation(scene, data = {}) {
  state.scene = scene;
  state.sceneData = data;
  save();
}

export function allBigPranksDone() {
  return state.done.farm && state.done.castle && state.done.caves;
}

if (DEBUG && typeof window !== 'undefined') {
  window.__state = state;
}
