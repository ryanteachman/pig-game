// Pure helpers for pixel-grid sprites. Shared by the game (buildTextures.js)
// and by node scripts (render-sprites.mjs), so no Phaser or DOM in here.
import { PALETTE, hexToRgb } from './palette.js';

const RGB = {};
for (const [k, v] of Object.entries(PALETTE)) RGB[k] = hexToRgb(v);

export function validateGrid(name, grid) {
  if (!Array.isArray(grid) || grid.length === 0) throw new Error(`Sprite ${name}: empty grid`);
  const w = grid[0].length;
  grid.forEach((row, y) => {
    if (row.length !== w) throw new Error(`Sprite ${name}: row ${y} is ${row.length} wide, expected ${w}`);
    for (const ch of row) {
      if (ch !== '.' && !RGB[ch]) throw new Error(`Sprite ${name}: unknown palette char '${ch}' in row ${y}`);
    }
  });
  return { w, h: grid.length };
}

// Adds a 1px outline (4-neighbour) around opaque pixels, in-place on a copy.
export function outlineGrid(grid, color = 'k') {
  const h = grid.length, w = grid[0].length;
  const out = grid.map((r) => r.split(''));
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (grid[y][x] !== '.') continue;
      const n = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => {
        const c = grid[y + dy]?.[x + dx];
        return c && c !== '.';
      });
      if (n) out[y][x] = color;
    }
  }
  return out.map((r) => r.join(''));
}

export function gridToRGBA(grid, { outline = false } = {}) {
  const g = outline ? outlineGrid(grid) : grid;
  const h = g.length, w = g[0].length;
  const data = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const ch = g[y][x];
      if (ch === '.') continue;
      const [r, gg, b] = RGB[ch];
      const i = (y * w + x) * 4;
      data[i] = r; data[i + 1] = gg; data[i + 2] = b; data[i + 3] = 255;
    }
  }
  return { w, h, data };
}

// Palette swap: map is { fromChar: toChar }
export function remap(grid, map) {
  return grid.map((row) => row.replace(/./g, (c) => map[c] ?? c));
}

export function flipH(grid) {
  return grid.map((row) => row.split('').reverse().join(''));
}

export function blank(w, h) {
  return Array.from({ length: h }, () => '.'.repeat(w));
}

// Draw `top` onto `base` at (dx, dy); '.' in top is transparent.
export function overlay(base, top, dx = 0, dy = 0) {
  const out = base.map((r) => r.split(''));
  top.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const c = row[x];
      const ty = y + dy, tx = x + dx;
      if (c === '.' || !out[ty] || tx < 0 || tx >= out[ty].length) continue;
      out[ty][tx] = c;
    }
  });
  return out.map((r) => r.join(''));
}

// Shift a grid by dy rows (positive = down), keeping the size.
export function shiftY(grid, dy) {
  const w = grid[0].length;
  const empty = '.'.repeat(w);
  if (dy > 0) return [...Array(dy).fill(empty), ...grid.slice(0, grid.length - dy)];
  return [...grid.slice(-dy), ...Array(-dy).fill(empty)];
}

// Tiny seeded RNG so procedural tiles look the same every boot.
export function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// A filled tile with random speckles: speckles = [[char, count], ...]
export function speckle(base, speckles, seed, w = 16, h = 16) {
  const rand = rng(seed);
  const rows = Array.from({ length: h }, () => base.repeat(w).split(''));
  for (const [ch, count] of speckles) {
    for (let i = 0; i < count; i++) {
      rows[Math.floor(rand() * h)][Math.floor(rand() * w)] = ch;
    }
  }
  return rows.map((r) => r.join(''));
}
