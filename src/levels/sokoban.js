// Pure Sokoban rules for the Shleepy Caves, shared by the game, the solver and the tests.
// Grid chars: '#' wall, '.' floor, 'P' player, 'S' Shleepy Stone, 'O' rock, '_' plate,
// 's' Stone on plate, 'o' rock on plate, 'E' exit door, 'c' cheese, 'X' crystal, 'm' mushroom.
export const SLEEP_AFTER = 3; // pushes before the Stone falls asleep

export const DIRS = {
  U: [0, -1],
  D: [0, 1],
  L: [-1, 0],
  R: [1, 0],
};

export function parseRoom(grid) {
  const h = grid.length, w = grid[0].length;
  const walls = new Set();
  const plates = [];
  const cheese = [];
  const rocks = [];
  let player = null, stone = null, exit = null;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const c = grid[y][x];
      const k = y * w + x;
      if (c === '#' || c === 'X' || c === 'm') walls.add(k);
      if (c === '_' || c === 's' || c === 'o') plates.push(k);
      if (c === 'P') player = k;
      if (c === 'S' || c === 's') stone = k;
      if (c === 'O' || c === 'o') rocks.push(k);
      if (c === 'E') exit = k;
      if (c === 'c') cheese.push(k);
    }
  }
  return { w, h, walls, plates, cheese, exit, start: { player, stone, rocks: rocks.sort((a, b) => a - b), pushes: 0 } };
}

export function platesCovered(room, s) {
  return room.plates.every((p) => p === s.stone || s.rocks.includes(p));
}

// Apply one action ('U','D','L','R','Z') to state s. Returns { state, event } or null if nothing happens.
// event: 'move' | 'push' | 'pushStone' | 'sleep' | 'wake' | 'blocked' | 'asleep' | 'exit' | 'snort'
export function step(room, s, action) {
  const { w } = room;
  if (action === 'Z') {
    const asleep = s.pushes >= SLEEP_AFTER;
    if (asleep && adjacent(w, s.player, s.stone)) return { state: { ...s, pushes: 0 }, event: 'wake' };
    return { state: s, event: 'snort' };
  }
  const [dx, dy] = DIRS[action];
  const px = s.player % w, py = Math.floor(s.player / w);
  const nx = px + dx, ny = py + dy;
  if (nx < 0 || ny < 0 || nx >= room.w || ny >= room.h) return { state: s, event: 'blocked' };
  const n = ny * w + nx;
  if (n === room.exit) {
    if (platesCovered(room, s)) return { state: { ...s, player: n }, event: 'exit' };
    return { state: s, event: 'blocked' };
  }
  if (room.walls.has(n)) return { state: s, event: 'blocked' };
  const isStone = n === s.stone;
  const rockIdx = s.rocks.indexOf(n);
  if (!isStone && rockIdx < 0) return { state: { ...s, player: n }, event: 'move' };
  if (isStone && s.pushes >= SLEEP_AFTER) return { state: s, event: 'asleep' };
  const bx = nx + dx, by = ny + dy;
  if (bx < 0 || by < 0 || bx >= room.w || by >= room.h) return { state: s, event: 'blocked' };
  const b = by * w + bx;
  if (room.walls.has(b) || b === room.exit || b === s.stone || s.rocks.includes(b)) return { state: s, event: 'blocked' };
  if (isStone) {
    const pushes = s.pushes + 1;
    return { state: { ...s, player: n, stone: b, pushes }, event: pushes >= SLEEP_AFTER ? 'sleep' : 'pushStone' };
  }
  const rocks = s.rocks.slice();
  rocks[rockIdx] = b;
  rocks.sort((a, c) => a - c);
  return { state: { ...s, player: n, rocks }, event: 'push' };
}

function adjacent(w, a, b) {
  const ax = a % w, ay = Math.floor(a / w), bx = b % w, by = Math.floor(b / w);
  return Math.abs(ax - bx) + Math.abs(ay - by) === 1;
}

export const stateKey = (s) => `${s.player}|${s.stone}|${s.rocks.join(',')}|${s.pushes}`;

// Cells the player can walk to without pushing anything (typed-array flood fill).
function walkable(room, s) {
  const { w, h } = room;
  const n = w * h;
  if (!room._blocked) {
    room._blocked = new Uint8Array(n);
    for (const c of room.walls) room._blocked[c] = 1;
    if (room.exit !== null) room._blocked[room.exit] = 1;
    room._seen = new Int32Array(n);
    room._stamp = 0;
    room._q = new Int32Array(n);
  }
  const stamp = ++room._stamp;
  const seenArr = room._seen, q = room._q, blocked = room._blocked;
  seenArr[s.stone] = stamp;
  for (const r of s.rocks) seenArr[r] = stamp;
  const out = [s.player];
  seenArr[s.player] = stamp;
  q[0] = s.player;
  let head = 0, tail = 1, min = s.player;
  while (head < tail) {
    const c = q[head++];
    const x = c % w;
    const nb = [x > 0 ? c - 1 : -1, x < w - 1 ? c + 1 : -1, c >= w ? c - w : -1, c + w < n ? c + w : -1];
    for (const m of nb) {
      if (m < 0 || blocked[m] || seenArr[m] === stamp) continue;
      seenArr[m] = stamp;
      q[tail++] = m;
      out.push(m);
      if (m < min) min = m;
    }
  }
  const set = new Set(out);
  set.min = min;
  return set;
}

// Shortest walking path (as U/D/L/R) from a to b with the current blockers.
function walkPath(room, s, a, b) {
  if (a === b) return '';
  const { w, h } = room;
  const prev = new Map([[a, null]]);
  const q = [a];
  while (q.length) {
    const c = q.shift();
    const x = c % w, y = Math.floor(c / w);
    for (const [d, [dx, dy]] of Object.entries(DIRS)) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      const n = ny * w + nx;
      if (prev.has(n) || room.walls.has(n) || n === room.exit || n === s.stone || s.rocks.includes(n)) continue;
      prev.set(n, [c, d]);
      if (n === b) {
        let out = '';
        let k = b;
        while (prev.get(k)) { out = prev.get(k)[1] + out; k = prev.get(k)[0]; }
        return out;
      }
      q.push(n);
    }
  }
  return null;
}

const OFFSETS = (w) => ({ U: -w, D: w, L: -1, R: 1 });

// Push-level breadth-first search: states are (stone, rocks, sleep counter, player region),
// edges are pushes and snort wake-ups. Returns the full move string (U/D/L/R/Z) for the
// fewest-pushes solution, and whether every cheese tile is reachable.
export function solve(grid, { maxStates = 500_000 } = {}) {
  const room = parseRoom(grid);
  const { w } = room;
  const off = OFFSETS(w);
  const norm = (s, reach) => ({ ...s, player: reach.min });
  const startReach = walkable(room, room.start);
  const start = room.start;
  const key0 = stateKey(norm(start, startReach));
  const seen = new Map([[key0, null]]);
  const queue = [{ s: start, reach: startReach, key: key0 }];
  const reached = new Set(startReach);
  const cheeseLeft = () => room.cheese.some((c) => !reached.has(c));
  let goal = null;
  let head = 0;
  while (head < queue.length && seen.size < maxStates) {
    const { s, reach, key } = queue[head++];
    if (!goal && platesCovered(room, s)) {
      const ex = room.exit;
      for (const [d, o] of Object.entries(off)) {
        const from = ex - o;
        if (reach.has(from)) { goal = { key, from, d, s }; break; }
      }
    }
    if (goal && !cheeseLeft()) break;
    const tryAdd = (ns, action, from) => {
      const nreach = walkable(room, ns);
      const nk = stateKey(norm(ns, nreach));
      if (seen.has(nk)) return;
      seen.set(nk, { prev: key, from, action, s });
      for (const c of nreach) reached.add(c);
      queue.push({ s: ns, reach: nreach, key: nk });
    };
    for (const r of reach) {
      for (const [d, o] of Object.entries(off)) {
        const n = r + o;
        if (n !== s.stone && !s.rocks.includes(n)) continue;
        const res = step(room, { ...s, player: r }, d);
        if (res.event === 'push' || res.event === 'pushStone' || res.event === 'sleep') tryAdd(res.state, d, r);
      }
    }
    if (s.pushes >= SLEEP_AFTER) {
      for (const o of Object.values(off)) {
        const r = s.stone + o;
        if (reach.has(r)) { tryAdd({ ...s, player: r, pushes: 0 }, 'Z', r); break; }
      }
    }
  }
  let solution = null;
  if (goal) {
    const macro = [];
    let k = goal.key;
    while (seen.get(k)) {
      const e = seen.get(k);
      macro.push(e);
      k = e.prev;
    }
    macro.reverse();
    let cur = room.start;
    let out = '';
    for (const e of macro) {
      out += walkPath(room, cur, cur.player, e.from);
      cur = { ...cur, player: e.from };
      out += e.action;
      cur = step(room, cur, e.action).state;
    }
    out += walkPath(room, cur, cur.player, goal.from) + goal.d;
    solution = out;
  }
  return { solvable: !!goal, solution, states: seen.size, cheeseReachable: !cheeseLeft(), cheeseCount: room.cheese.length };
}

// Replays a solution string; returns true if it exits the room.
export function verify(grid, solution) {
  const room = parseRoom(grid);
  let s = room.start;
  for (const a of solution) {
    const r = step(room, s, a);
    if (r.event === 'exit') return true;
    s = r.state;
  }
  return false;
}
