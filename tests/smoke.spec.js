// End-to-end smoke tests for Mr. Pig's Mischief Quest.
import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import { CAVE_ROOMS } from '../src/levels/caves.js';
import { allCheeseIds } from '../src/levels/cheese.js';
import { verify } from '../src/levels/sokoban.js';
import { HUB_MAP, FARM_MAP, CASTLE_ROOMS, LEGEND, cheeseSpots } from '../src/levels/maps.js';

const FINAL = 'Annarose I love you so much. Happy Birthday.';
fs.mkdirSync('preview/scenes', { recursive: true });

// Console noise from the browser/GPU itself is not game code.
const IGNORED = [/GL Driver Message/i, /GPU stall/i, /WebGL/i, /AudioContext was not allowed/i];

async function boot(page, { debug = true, clear = true } = {}) {
  const problems = [];
  page.on('console', (m) => {
    if ((m.type() === 'error' || m.type() === 'warning') && !IGNORED.some((r) => r.test(m.text()))) problems.push(`${m.type()}: ${m.text()}`);
  });
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
  await page.goto(debug ? '/?debug=1' : '/');
  if (clear) {
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  }
  if (debug) await page.waitForFunction(() => window.__game?.scene?.isActive('Title'));
  else await page.waitForTimeout(1500);
  return problems;
}

const active = (page) => page.evaluate(() => window.__game.scene.getScenes(true).map((s) => s.scene.key).filter((k) => k !== 'Pause')[0]);
const scene = (page, fn, arg) => page.evaluate(([f, a]) => {
  const s = window.__game.scene.getScenes(true).find((x) => x.scene.key !== 'Pause');
  return new Function('s', 'a', `return (${f})(s, a)`)(s, a);
}, [fn.toString(), arg]);

async function waitScene(page, key, timeout = 15000) {
  await page.waitForFunction((k) => window.__game.scene.isActive(k) && !window.__game.scene.getScene(k).transitioning, key, { timeout });
  await page.waitForTimeout(350);
}

async function startScene(page, key, data = {}) {
  await page.evaluate(([k, d]) => {
    const s = window.__game.scene.getScenes(true).find((x) => x.scene.key !== 'Pause');
    s.scene.start(k, d);
  }, [key, data]);
  await waitScene(page, key);
}

// Press Space while a dialogue is open (or the scene is in a cutscene) until it is free.
async function clearDialogue(page, maxMs = 20000) {
  const end = Date.now() + maxMs;
  while (Date.now() < end) {
    const st = await scene(page, (s) => ({ d: s.dialogue?.active, l: s.locked }));
    if (!st.d && !st.l) return;
    if (st.d) await page.keyboard.press('Space');
    await page.waitForTimeout(90);
  }
}

async function walkTo(page, x, y, tol = 4) {
  for (let i = 0; i < 30; i++) {
    const p = await scene(page, (s) => ({ x: s.px, y: s.py }));
    const dx = x - p.x, dy = y - p.y;
    if (Math.abs(dx) <= tol && Math.abs(dy) <= tol) return;
    const [key, dist] = Math.abs(dx) > tol ? [dx > 0 ? 'd' : 'a', Math.abs(dx)] : [dy > 0 ? 's' : 'w', Math.abs(dy)];
    await page.keyboard.down(key);
    await page.waitForTimeout(Math.max(30, (dist / 74) * 1000 - 20));
    await page.keyboard.up(key);
    await page.waitForTimeout(40);
  }
}

async function shot(page, name) {
  await page.waitForTimeout(400);
  await page.screenshot({ path: `preview/scenes/${name}.png` });
}

// Flood fill over walkable tiles: every overworld cheese must be reachable from the entrance.
function reachable(rows, sx, sy) {
  const seen = new Set([`${sx},${sy}`]);
  const q = [[sx, sy]];
  while (q.length) {
    const [x, y] = q.shift();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy, ch = rows[ny]?.[nx];
      if (!ch || seen.has(`${nx},${ny}`)) continue;
      if (ch !== '*' && ch !== '$' && (LEGEND[ch].solid || LEGEND[ch].prop)) continue;
      seen.add(`${nx},${ny}`);
      q.push([nx, ny]);
    }
  }
  return seen;
}

test('every overworld cheese is reachable', () => {
  const maps = [['hub', HUB_MAP, 5, 5], ['farm', FARM_MAP, 1, 10], ...Object.entries(CASTLE_ROOMS).map(([k, r]) => [k, r, 9, 5])];
  for (const [name, rows, sx, sy] of maps) {
    const seen = reachable(rows, sx, sy);
    for (const c of cheeseSpots(name, 'x', rows)) expect(seen.has(`${c.x},${c.y}`), `${name} cheese at ${c.x},${c.y}`).toBe(true);
  }
});

test('data: 30 cheeses, solvable caves with stored solutions', () => {
  expect(allCheeseIds()).toHaveLength(30);
  expect(new Set(allCheeseIds()).size).toBe(30);
  for (const room of CAVE_ROOMS) expect(verify(room.grid, room.solution)).toBe(true);
});

test('boots with no console errors or warnings, debug hidden by default', async ({ page }) => {
  const problems = await boot(page, { debug: false });
  expect(await page.evaluate(() => typeof window.__game)).toBe('undefined');
  expect(await page.evaluate(() => typeof window.__state)).toBe('undefined');
  await page.keyboard.press('Space');
  await page.keyboard.press('Digit6');
  await page.waitForTimeout(800);
  await shot(page, '00-title');
  expect(problems).toEqual([]);
});

test('Title -> New Game -> Intro reaches the Hub', async ({ page }) => {
  const problems = await boot(page);
  await page.keyboard.press('Space'); // Press Space
  await page.waitForTimeout(200);
  await page.keyboard.press('Space'); // New Game
  await waitScene(page, 'Intro');
  // opening narration, then the controls card
  await page.waitForFunction(() => window.__game.scene.getScene('Intro').dialogue.active);
  await clearDialogue(page, 4000).catch(() => {});
  for (let i = 0; i < 40 && !(await scene(page, (s) => s.children.list.some((c) => c.text === 'How to Play'))); i++) {
    await page.keyboard.press('Space');
    await page.waitForTimeout(120);
  }
  await shot(page, '01-intro-controls');
  await page.keyboard.press('Space'); // close the controls card
  await clearDialogue(page);
  await page.waitForFunction(() => window.__game.scene.getScene('Intro').letter);
  await page.waitForTimeout(700);
  await walkTo(page, 160, 146, 5);
  await page.keyboard.press('Space'); // read the letter
  await clearDialogue(page);
  expect(await page.evaluate(() => window.__state.flags.introLetter)).toBe(true);
  await page.keyboard.press('Shift'); // wake the Stone
  await page.waitForTimeout(500);
  await clearDialogue(page);
  expect(await page.evaluate(() => window.__state.flags.stoneAwake)).toBe(true);
  await shot(page, '02-intro');
  await walkTo(page, 160, 175, 3);
  await page.keyboard.down('s');
  await page.waitForTimeout(400);
  await page.keyboard.up('s');
  await waitScene(page, 'Hub');
  await clearDialogue(page);
  await shot(page, '03-hub');
  expect(problems).toEqual([]);
});

test('each area loads via debug warp with its key NPCs and objects', async ({ page }) => {
  const problems = await boot(page);
  await page.keyboard.press('Space');
  await page.keyboard.press('Digit1');
  await waitScene(page, 'Hub');
  expect(await scene(page, (s) => ({ npcs: s.npcs.length, guard: !!s.gateGuard, napper: !!s.napper, cheese: s.cheeses.length })))
    .toEqual({ npcs: 5, guard: true, napper: true, cheese: 6 });

  await page.keyboard.press('Digit2');
  await waitScene(page, 'Farm');
  expect(await scene(page, (s) => ({
    big: s.bigPig.texture.key.startsWith('bigpig'), basket: !!s.basket, scarecrow: !!s.scarecrow, trough: !!s.trough, bell: !!s.bell, cheese: s.cheeses.length,
  }))).toEqual({ big: true, basket: true, scarecrow: true, trough: true, bell: true, cheese: 8 });
  await clearDialogue(page);
  await shot(page, '04-farm');

  await page.keyboard.press('Digit3');
  await waitScene(page, 'Castle');
  expect(await scene(page, (s) => ({ room: s.roomName, guards: s.guards.length, well: !!s.well }))).toEqual({ room: 'courtyard', guards: 1, well: true });
  await clearDialogue(page);
  await shot(page, '05-castle-courtyard');
  for (const [room, check] of [['hall', 'banner'], ['armory', 'armor'], ['throne', 'oinks']]) {
    await startScene(page, 'Castle', { room, entry: room === 'armory' ? 'east' : 'south' });
    expect(await scene(page, (s, k) => !!s[k], check)).toBe(true);
    await clearDialogue(page);
    await shot(page, `05-castle-${room}`);
  }

  await page.keyboard.press('Digit4');
  await waitScene(page, 'Caves');
  expect(await scene(page, (s) => ({ room: s.roomIndex, stone: !!s.stone, door: !!s.door }))).toEqual({ room: 0, stone: true, door: true });
  await clearDialogue(page);
  await shot(page, '06-caves');

  await page.keyboard.press('Digit5');
  await waitScene(page, 'Dream');
  expect(await scene(page, (s) => s.heartIcons.length)).toBe(5);
  await clearDialogue(page);
  await page.waitForTimeout(3500);
  await shot(page, '07-dream');

  await page.keyboard.press('Digit6');
  await waitScene(page, 'Finale');
  expect(await scene(page, (s) => !!(s.anna && s.bigPig && s.oinks && s.pig && s.stone))).toBe(true);
  await page.waitForTimeout(1600);
  await shot(page, '08-finale');
  expect(problems).toEqual([]);
});

test('every cave room is solved by replaying its stored solution as key presses', async ({ page }) => {
  const problems = await boot(page);
  await page.keyboard.press('Space');
  const KEYS = { U: 'w', D: 's', L: 'a', R: 'd', Z: 'Shift' };
  for (let i = 0; i < CAVE_ROOMS.length; i++) {
    await startScene(page, 'Caves', { room: i });
    await clearDialogue(page);
    for (const a of CAVE_ROOMS[i].solution) {
      // wait for the previous move to finish and any cutscene (sleep tip, bat) to be read
      for (;;) {
        const st = await scene(page, (s) => ({ busy: s.moving || s.queue.length > 0, d: s.dialogue.active, l: s.locked }));
        if (st.d) { await page.keyboard.press('Space'); await page.waitForTimeout(80); continue; }
        if (st.busy || st.l) { await page.waitForTimeout(25); continue; }
        break;
      }
      await page.keyboard.press(KEYS[a]);
      await page.waitForTimeout(20);
    }
    await page.waitForFunction(() => window.__game.scene.getScene('Caves').completed, null, { timeout: 5000 });
    expect(await page.evaluate((n) => window.__state.pranks[`caves_room${n}`], i + 1)).toBe(true);
    if (i === 3) await shot(page, '06-caves-room4-solved');
  }
  expect(problems).toEqual([]);
});

test('Eating Contest can be won with scripted inputs', async ({ page }) => {
  const problems = await boot(page);
  await page.keyboard.press('Space');
  await startScene(page, 'EatingContest');
  let shotTaken = false;
  for (let i = 0; i < 600; i++) {
    const st = await scene(page, (s) => ({ won: s.won, run: s.running, k: s.expected, d: s.dialogue.active, stun: s.time.now < s.stunnedUntil }));
    if (st.won) break;
    if (st.d) { await page.keyboard.press('Space'); await page.waitForTimeout(80); continue; }
    if (st.run && !st.stun) {
      await page.keyboard.press(`Key${st.k}`);
      if (!shotTaken && i > 30) { shotTaken = true; await shot(page, '09-eating-contest'); }
    }
    await page.waitForTimeout(60);
  }
  expect(await page.evaluate(() => window.__state.pranks.farm_contest)).toBe(true);
  expect(await page.evaluate(() => window.__state.done.farm)).toBe(true);
  expect(problems).toEqual([]);
});

test('The Joust can be won with timed SPACE presses', async ({ page }) => {
  const problems = await boot(page);
  await page.keyboard.press('Space');
  await startScene(page, 'Joust');
  let shotTaken = false;
  for (let i = 0; i < 1500; i++) {
    const st = await scene(page, (s) => ({ done: s.done, run: s.running, p: s.pressed, m: s.markerPos, z: s.zone, d: s.dialogue.active }));
    if (st.done) break;
    if (st.d) { await page.keyboard.press('Space'); await page.waitForTimeout(80); continue; }
    if (st.run && st.p === null && st.m > st.z.start + 0.06 && st.m < st.z.end - 0.06) {
      await page.keyboard.press('Space');
      if (!shotTaken) { shotTaken = true; await shot(page, '10-joust'); }
    }
    await page.waitForTimeout(15);
  }
  await page.waitForFunction(() => window.__state.done.castle, null, { timeout: 20000 });
  expect(await page.evaluate(() => window.__state.pranks.castle_joust)).toBe(true);
  expect(problems).toEqual([]);
});

test('Bad Dreams: snorts poof nightmares and the completion hook finishes the caves', async ({ page }) => {
  const problems = await boot(page);
  await page.keyboard.press('Space');
  await startScene(page, 'Dream');
  await clearDialogue(page);
  // play a little for real: wait for nightmares, walk toward one and snort
  await page.waitForFunction(() => window.__game.scene.getScene('Dream').enemies.length > 0, null, { timeout: 8000 });
  for (let i = 0; i < 40; i++) {
    const e = await scene(page, (s) => { const n = s.enemies.find((x) => !x.dead); return n ? { x: n.sprite.x, y: n.sprite.y, px: s.px, py: s.py } : null; });
    if (!e) break;
    const dx = e.x - e.px, dy = e.y - (e.py - 8);
    if (Math.hypot(dx, dy) < 30) { await page.keyboard.press('Shift'); break; }
    const k = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'd' : 'a') : dy > 0 ? 's' : 'w';
    await page.keyboard.down(k); await page.waitForTimeout(120); await page.keyboard.up(k);
  }
  await page.waitForTimeout(300);
  await shot(page, '07-dream-snort');
  await page.keyboard.press('KeyF'); // debug: same win() path as surviving all 3 waves
  for (let i = 0; i < 200 && (await active(page)) === 'Dream'; i++) {
    if (await scene(page, (s) => s.dialogue?.active)) await page.keyboard.press('Space');
    await page.waitForTimeout(100);
  }
  await waitScene(page, 'Hub');
  expect(await page.evaluate(() => [window.__state.done.caves, window.__state.pranks.caves_dream])).toEqual([true, true]);
  expect(problems).toEqual([]);
});

test('Finale reaches the final message with the exact text', async ({ page }) => {
  const problems = await boot(page);
  await page.keyboard.press('Space');
  await page.keyboard.press('KeyC'); // all cheese -> bonus cuddle path
  await page.waitForTimeout(200);
  await startScene(page, 'Finale');
  let party = false, dark = false;
  for (let i = 0; i < 1200; i++) {
    const st = await scene(page, (s) => ({ done: s.finalDone, d: s.dialogue.active, party: !!s.confetti, line: s.dialogue.text.text }));
    if (st.done) break;
    if (!dark && st.line.includes('turned off the lights')) {
      dark = true;
      await page.waitForTimeout(1200); // let the line finish typing
      await shot(page, '08-finale-lights-out');
    }
    if (st.party && !party) { party = true; await shot(page, '08-finale-party'); }
    if (st.d) await page.keyboard.press('Space');
    await page.waitForTimeout(110);
  }
  expect(dark).toBe(true);
  expect(await scene(page, (s) => s.finalDone)).toBe(true);
  const text = await scene(page, (s) => s.finalText.text);
  expect(text).toBe(FINAL);
  await shot(page, '11-final-message');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('mrpig-settings-v1')).crown)).toBe(true);
  await page.keyboard.press('Space');
  await waitScene(page, 'Credits');
  await page.waitForTimeout(3000);
  await shot(page, '12-credits');
  await page.waitForTimeout(500);
  await page.keyboard.press('Space');
  await waitScene(page, 'Title');
  await shot(page, '13-title-crown');
  expect(problems).toEqual([]);
});

test('save/load: complete the Farm, reload, Continue, Farm still complete', async ({ page }) => {
  const problems = await boot(page);
  await page.keyboard.press('Space');
  await page.keyboard.press('Digit2');
  await waitScene(page, 'Farm');
  await clearDialogue(page);
  await page.keyboard.press('KeyF');
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => window.__state.done.farm)).toBe(true);
  await page.reload();
  await page.waitForFunction(() => window.__game?.scene?.isActive('Title'));
  expect(await page.evaluate(() => window.__state.done.farm)).toBe(false); // not loaded yet
  await page.keyboard.press('Space'); // Press Space -> menu
  await page.waitForTimeout(200);
  await page.keyboard.press('Space'); // Continue
  await waitScene(page, 'Farm');
  expect(await page.evaluate(() => window.__state.done.farm)).toBe(true);
  expect(await page.evaluate(() => window.__state.pranks.farm_contest)).toBe(true);
  expect(problems).toEqual([]);
});

test('pause menu opens with Esc and mute is saved', async ({ page }) => {
  const problems = await boot(page);
  await page.keyboard.press('Space');
  await page.keyboard.press('Digit3');
  await waitScene(page, 'Castle');
  await clearDialogue(page);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => window.__game.scene.isActive('Pause'))).toBe(true);
  await shot(page, '14-pause');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => window.__game.scene.isActive('Pause'))).toBe(false);
  await page.keyboard.press('KeyM');
  await page.waitForTimeout(100);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('mrpig-settings-v1')).muted)).toBe(true);
  await page.keyboard.press('KeyM');
  expect(problems).toEqual([]);
});
