// BFS solver: verifies that every Shleepy Caves room is solvable (modelling the Stone's
// sleep counter and snort wake-ups), that every cheese is reachable, and that the stored
// solution in src/levels/caves.js still works.
// Usage: node scripts/solve-caves.mjs [--write]   (--write stores fresh solutions in caves.js)
import fs from 'node:fs';
import { CAVE_ROOMS } from '../src/levels/caves.js';
import { solve, verify, parseRoom, step } from '../src/levels/sokoban.js';

const write = process.argv.includes('--write');
let ok = true;
const solutions = [];

CAVE_ROOMS.forEach((room, i) => {
  const t0 = Date.now();
  const r = solve(room.grid);
  const ms = Date.now() - t0;
  const pushes = r.solution ? countPushes(room.grid, r.solution) : 0;
  const snorts = r.solution ? [...r.solution].filter((c) => c === 'Z').length : 0;
  console.log(
    `${room.name}: ${r.solvable ? 'SOLVABLE' : 'UNSOLVABLE'}  moves=${r.solution?.length ?? '-'} snorts=${snorts} pushes=${pushes} ` +
      `states=${r.states} cheese=${r.cheeseCount} reachable=${r.cheeseReachable} (${ms}ms)`,
  );
  if (r.solution) console.log(`   shortest: ${r.solution}`);
  if (!r.solvable || !r.cheeseReachable) ok = false;
  if (r.cheeseCount !== 2) { console.log('   expected exactly 2 cheeses'); ok = false; }
  if (room.solution && !write) {
    const good = verify(room.grid, room.solution);
    console.log(`   stored solution: ${good ? 'OK' : 'FAILS'}`);
    if (!good) ok = false;
  } else if (!room.solution && !write) {
    console.log('   stored solution: MISSING (run with --write)');
    ok = false;
  }
  solutions.push(r.solution);
});

function countPushes(grid, sol) {
  const room = parseRoom(grid);
  let st = room.start, n = 0;
  for (const a of sol) {
    const r = step(room, st, a);
    if (['push', 'pushStone', 'sleep'].includes(r.event)) n++;
    st = r.state;
  }
  return n;
}

if (write) {
  const file = new URL('../src/levels/caves.js', import.meta.url);
  let src = fs.readFileSync(file, 'utf8');
  let idx = 0;
  src = src.replace(/solution: '[A-Z]*'/g, () => `solution: '${solutions[idx++] ?? ''}'`);
  fs.writeFileSync(file, src);
  console.log('Wrote solutions to src/levels/caves.js');
}

const total = CAVE_ROOMS.reduce((n, r) => n + parseRoom(r.grid).cheese.length, 0);
console.log(`Cheese in caves: ${total}`);
if (!ok) {
  console.error('Some rooms FAILED verification');
  process.exit(1);
}
console.log('All cave rooms verified solvable.');
