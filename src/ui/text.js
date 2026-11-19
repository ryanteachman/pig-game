import { FONT_KEY } from './font.js';

export const COLORS = {
  white: 0xfffaf0,
  cream: 0xf1dfb6,
  gold: 0xf2c230,
  pink: 0xf2a7b8,
  lightPink: 0xfcd3dc,
  dark: 0x2a1b2d,
  blue: 0x8db8ec,
  green: 0xb6dc84,
  red: 0xe2575e,
  purple: 0x7a58a8,
  grey: 0xb0abbd,
};

// Pixel text. opts: { scale, color, shadow, center, ui, depth, align }
export function addText(scene, x, y, str, opts = {}) {
  const t = scene.add.bitmapText(x, y, FONT_KEY, str, 8 * (opts.scale || 1));
  if (opts.color !== undefined) t.setTint(opts.color);
  if (opts.shadow !== false && t.setDropShadow) t.setDropShadow(1, 1, COLORS.dark, 1);
  if (opts.center) {
    t.setOrigin(0.5, 0);
    t.setCenterAlign();
  }
  if (opts.ui !== false) t.setScrollFactor(0);
  if (opts.depth !== undefined) t.setDepth(opts.depth);
  return t;
}

// A rounded, bordered panel drawn with Graphics.
export function panel(scene, x, y, w, h, { fill = 0x2a1b2d, border = 0xf1dfb6, alpha = 0.94, ui = true, depth = 900 } = {}) {
  const g = scene.add.graphics();
  g.fillStyle(fill, alpha);
  g.fillRoundedRect(x, y, w, h, 3);
  g.lineStyle(1, border, 1);
  g.strokeRoundedRect(x + 0.5, y + 0.5, w - 1, h - 1, 3);
  if (ui) g.setScrollFactor(0);
  g.setDepth(depth);
  return g;
}
