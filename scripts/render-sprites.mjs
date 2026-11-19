// Exports every sprite (and tile) at 8x to /preview/*.png, plus contact sheets,
// so the art can be checked against the reference photos.
// Usage: node scripts/render-sprites.mjs [filter]
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { SPRITES, isOutlined } from '../src/art/sprites.js';
import { TILES } from '../src/art/tiles.js';
import { gridToRGBA, validateGrid } from '../src/art/pixels.js';

const OUT = path.resolve('preview');
const SCALE = 8;
fs.mkdirSync(OUT, { recursive: true });

// --- minimal PNG encoder -------------------------------------------------
const CRC_TABLE = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
export function encodePNG(w, h, rgba) {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0;
    Buffer.from(rgba.buffer, rgba.byteOffset + y * w * 4, w * 4).copy(raw, y * (w * 4 + 1) + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// Scale up with a soft checkerboard background so transparency is visible.
function scaled({ w, h, data }, s) {
  const W = w * s, H = h * s;
  const out = new Uint8ClampedArray(W * H * 4);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const si = (Math.floor(y / s) * w + Math.floor(x / s)) * 4;
      const di = (y * W + x) * 4;
      const checker = ((x >> 3) + (y >> 3)) & 1 ? 214 : 232;
      const a = data[si + 3] / 255;
      out[di] = data[si] * a + checker * (1 - a);
      out[di + 1] = data[si + 1] * a + checker * (1 - a);
      out[di + 2] = data[si + 2] * a + (checker + 10) * (1 - a);
      out[di + 3] = 255;
    }
  }
  return { w: W, h: H, data: out };
}

function sheet(entries, cols, s) {
  const cell = 32 * s + 8;
  const rows = Math.ceil(entries.length / cols);
  const W = cols * cell, H = rows * cell;
  const out = new Uint8ClampedArray(W * H * 4).fill(255);
  entries.forEach(({ img }, i) => {
    const big = scaled(img, s);
    const ox = (i % cols) * cell + 4, oy = Math.floor(i / cols) * cell + 4;
    for (let y = 0; y < big.h && y < cell - 8; y++) {
      for (let x = 0; x < big.w && x < cell - 8; x++) {
        const si = (y * big.w + x) * 4, di = ((oy + y) * W + ox + x) * 4;
        out.set(big.data.subarray(si, si + 4), di);
      }
    }
  });
  return { w: W, h: H, data: out };
}

const filter = process.argv[2];
let errors = 0;
const spriteEntries = [];
for (const [key, grid] of Object.entries(SPRITES)) {
  try { validateGrid(key, grid); } catch (e) { console.error(e.message); errors++; continue; }
  const img = gridToRGBA(grid, { outline: isOutlined(key) });
  spriteEntries.push({ key, img });
  if (!filter || key.includes(filter)) {
    const big = scaled(img, SCALE);
    fs.writeFileSync(path.join(OUT, `${key}.png`), encodePNG(big.w, big.h, big.data));
  }
}
const tileEntries = [];
for (const [key, grid] of Object.entries(TILES)) {
  try { validateGrid(key, grid); } catch (e) { console.error(e.message); errors++; continue; }
  tileEntries.push({ key, img: gridToRGBA(grid) });
}
const s1 = sheet(spriteEntries, 10, 3);
fs.writeFileSync(path.join(OUT, '_sprites_sheet.png'), encodePNG(s1.w, s1.h, s1.data));
const s2 = sheet(tileEntries, 10, 3);
fs.writeFileSync(path.join(OUT, '_tiles_sheet.png'), encodePNG(s2.w, s2.h, s2.data));
console.log(`Rendered ${spriteEntries.length} sprites and ${tileEntries.length} tiles to ${OUT}`);
if (errors) { console.error(`${errors} grid error(s)`); process.exit(1); }
