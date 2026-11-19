// The controls card shown in the Intro and in the pause menu.
import { addText, panel, COLORS } from './text.js';

export const CONTROLS = [
  ['W A S D', 'Move'],
  ['SPACE', 'Interact / talk / confirm'],
  ['SHIFT', 'Snort! (wake, startle, OINK)'],
  ['R', 'Restart puzzle or minigame'],
  ['M', 'Mute / unmute'],
  ['ESC', 'Pause menu'],
];

export function showControlsCard(scene, { depth = 2500, title = 'Controls', footer = 'Press SPACE' } = {}) {
  const x = 60, y = 30, w = 200, h = 118;
  const objs = [];
  objs.push(scene.add.rectangle(0, 0, 320, 180, 0x1a1220, 0.6).setOrigin(0).setScrollFactor(0).setDepth(depth));
  objs.push(panel(scene, x, y, w, h, { depth, fill: 0x3a2a5e }));
  objs.push(addText(scene, 160, y + 6, title, { center: true, color: COLORS.gold, depth: depth + 1 }));
  CONTROLS.forEach(([key, what], i) => {
    const yy = y + 22 + i * 13;
    objs.push(panel(scene, x + 8, yy - 2, 50, 11, { depth: depth + 1, fill: 0x7a58a8, border: 0xfcd3dc }));
    objs.push(addText(scene, x + 33, yy, key, { center: true, color: COLORS.white, depth: depth + 2 }));
    objs.push(addText(scene, x + 64, yy, what, { color: COLORS.cream, depth: depth + 2 }));
  });
  if (footer) {
    const f = addText(scene, 160, y + h - 13, footer, { center: true, color: COLORS.pink, depth: depth + 2 });
    scene.tweens.add({ targets: f, alpha: 0.4, yoyo: true, repeat: -1, duration: 500 });
    objs.push(f);
  }
  return { destroy: () => objs.forEach((o) => o.destroy()), objects: objs };
}
