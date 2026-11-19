// Top-left Mischief Meter (rank + bar) and top-right cheese counter.
import { addText, panel, COLORS } from './text.js';
import { state, RANKS, rankIndex, cheeseCount, TOTAL_CHEESE, onChange } from '../state.js';

export class Hud {
  constructor(scene) {
    this.scene = scene;
    const d = 1500;
    this.items = [];
    this.items.push(panel(scene, 2, 2, 104, 21, { depth: d, alpha: 0.82 }));
    this.rank = addText(scene, 6, 4, '', { color: COLORS.gold, depth: d + 1 });
    this.barBg = scene.add.rectangle(6, 15, 62, 5, 0x3a2a5e).setOrigin(0).setScrollFactor(0).setDepth(d + 1);
    this.bar = scene.add.rectangle(7, 16, 0, 3, 0xf2a7b8).setOrigin(0).setScrollFactor(0).setDepth(d + 2);
    this.mp = addText(scene, 72, 13, '', { color: COLORS.white, depth: d + 1 });
    this.items.push(panel(scene, 268, 2, 50, 15, { depth: d, alpha: 0.82 }));
    this.cheeseIcon = scene.add.image(279, 9, 'cheese').setScrollFactor(0).setDepth(d + 1);
    this.cheese = addText(scene, 287, 5, '', { color: COLORS.white, depth: d + 1 });
    this.items.push(this.rank, this.barBg, this.bar, this.mp, this.cheeseIcon, this.cheese);
    this.refresh();
    this.unsub = onChange((type) => {
      if (type === 'cheese' || type === 'mp' || type === 'load') this.refresh(type);
    });
    scene.events.once('shutdown', () => this.unsub());
  }

  refresh(type) {
    const idx = rankIndex();
    const r = RANKS[idx];
    const next = RANKS[idx + 1];
    const frac = next ? (state.mp - r.mp) / (next.mp - r.mp) : 1;
    // Rank names can be long; shorten the legendary one to fit the meter.
    this.rank.setText(r.name === 'Legendary Mischief Pig' ? 'LEGENDARY PIG' : r.name);
    this.mp.setText(`${state.mp}`);
    this.scene.tweens.add({ targets: this.bar, width: Math.max(0, Math.min(60, Math.round(60 * frac))), duration: 300 });
    this.cheese.setText(`${cheeseCount()}/${TOTAL_CHEESE}`);
    if (type === 'cheese') this.scene.tweens.add({ targets: this.cheeseIcon, scale: 1.6, yoyo: true, duration: 120 });
    if (type === 'mp') this.scene.tweens.add({ targets: this.bar, alpha: 0.3, yoyo: true, repeat: 2, duration: 80 });
  }

  setVisible(v) {
    this.items.forEach((i) => i.setVisible(v));
  }
}
