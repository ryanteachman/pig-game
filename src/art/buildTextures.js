// Turns the pixel-grid sprites and tiles into Phaser canvas textures at boot.
import { SPRITES, isOutlined } from './sprites.js';
import { TILES } from './tiles.js';
import { gridToRGBA, validateGrid } from './pixels.js';
import { PALETTE } from './palette.js';
import { buildFont } from '../ui/font.js';

function addGrid(scene, key, grid, outline) {
  validateGrid(key, grid);
  const { w, h, data } = gridToRGBA(grid, { outline });
  const tex = scene.textures.createCanvas(key, w, h);
  tex.getContext().putImageData(new ImageData(data, w, h), 0, 0);
  tex.refresh();
}

function addRect(scene, key, w, h, color) {
  const tex = scene.textures.createCanvas(key, w, h);
  const ctx = tex.getContext();
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, w, h);
  tex.refresh();
}

export function buildTextures(scene) {
  for (const [key, grid] of Object.entries(SPRITES)) addGrid(scene, key, grid, isOutlined(key));
  for (const [key, grid] of Object.entries(TILES)) addGrid(scene, `t_${key}`, grid, false);

  // Small solid textures for particles and UI.
  addRect(scene, 'px', 1, 1, '#ffffff');
  const confetti = ['e', 'y', 'b', 'p', 'h', 'u', 'o', 'i'];
  confetti.forEach((c, i) => addRect(scene, `confetti_${i}`, 2, 3, PALETTE[c]));
  addRect(scene, 'dot_mud', 2, 2, PALETTE.m);
  addRect(scene, 'dot_water', 2, 2, PALETTE.l);
  addRect(scene, 'dot_white', 2, 2, PALETTE.w);
  addRect(scene, 'dot_pink', 2, 2, PALETTE.p);
  addRect(scene, 'dot_gold', 2, 2, PALETTE.y);
  addRect(scene, 'dot_purple', 2, 2, PALETTE.u);

  buildFont(scene);
  buildAnims(scene);
}

function anim(scene, key, frames, frameRate = 6, repeat = -1) {
  if (scene.anims.exists(key)) return;
  scene.anims.create({ key, frames: frames.map((k) => ({ key: k })), frameRate, repeat });
}

function buildAnims(scene) {
  for (const prefix of ['pig', 'guard']) {
    for (const dir of ['down', 'up', 'side']) {
      anim(scene, `${prefix}_walk_${dir}`, [`${prefix}_${dir}_0`, `${prefix}_${dir}_1`], 6);
    }
  }
  anim(scene, 'oinks_walk_down', ['oinks_down_0', 'oinks_down_1'], 5);
  anim(scene, 'oinks_walk_side', ['oinks_side_0', 'oinks_side_1'], 8);
  anim(scene, 'oinks_pink_walk_down', ['oinks_pink_down_0', 'oinks_pink_down_1'], 5);
  anim(scene, 'oinks_pink_walk_side', ['oinks_pink_side_0', 'oinks_pink_side_1'], 8);
  anim(scene, 'bigpig_walk', ['bigpig_0', 'bigpig_1'], 5);
  anim(scene, 'anna_walk', ['anna_0', 'anna_1'], 5);
  for (const v of ['vg', 'vr', 'vp']) anim(scene, `${v}_walk_down`, [`${v}_down_0`, `${v}_down_1`], 4);
  anim(scene, 'butterfly_flap', ['butterfly_0', 'butterfly_1'], 8);
  anim(scene, 'bat_flap', ['bat_0', 'bat_1'], 4);
  anim(scene, 'bat_nohat_flap', ['bat_nohat_0', 'bat_nohat_1'], 4);
  anim(scene, 'blob_wobble', ['blob_0', 'blob_1'], 4);
}
