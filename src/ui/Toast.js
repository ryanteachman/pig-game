// Small notifications that slide in under the HUD, one at a time.
import { addText, panel, COLORS } from './text.js';
import { measure } from './font.js';

export class Toast {
  constructor(scene) {
    this.scene = scene;
    this.queue = [];
    this.busy = false;
  }

  show(message, color = COLORS.white) {
    this.queue.push({ message, color });
    if (!this.busy) this.next();
  }

  next() {
    const item = this.queue.shift();
    if (!item) { this.busy = false; return; }
    this.busy = true;
    const scene = this.scene;
    const w = measure(item.message) + 12;
    const x = Math.round(160 - w / 2);
    const bg = panel(scene, 0, 0, w, 13, { depth: 1800, fill: 0x3a2a5e });
    const t = addText(scene, 6, 2, item.message, { color: item.color, depth: 1801, ui: false });
    const c = scene.add.container(x, -16, [bg, t]).setScrollFactor(0).setDepth(1800);
    scene.tweens.add({
      targets: c, y: 26, duration: 220, ease: 'Back.Out',
      onComplete: () => scene.tweens.add({
        targets: c, alpha: 0, delay: 1700, duration: 250,
        onComplete: () => { c.destroy(); this.next(); },
      }),
    });
  }
}
