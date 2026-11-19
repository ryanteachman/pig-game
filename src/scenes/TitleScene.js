import Phaser from 'phaser';
import BaseScene from './BaseScene.js';
import { addText, panel, COLORS } from '../ui/text.js';
import { hasSave, load, newGame, state, settings } from '../state.js';
import * as sfx from '../audio/sfx.js';

export default class TitleScene extends BaseScene {
  constructor() {
    super('Title');
  }

  create() {
    this.drawBackdrop();
    const t1 = addText(this, 160, 16, "Mr. Pig's", { center: true, scale: 2, color: COLORS.pink });
    const t2 = addText(this, 160, 36, 'Mischief Quest', { center: true, scale: 2, color: COLORS.gold });
    this.tweens.add({ targets: [t1, t2], y: '+=2', yoyo: true, repeat: -1, duration: 900, ease: 'Sine.InOut' });

    const pig = this.add.image(150, 128, 'pig_down_0').setOrigin(0.5, 1).setScale(3);
    this.tweens.add({ targets: pig, y: 125, yoyo: true, repeat: -1, duration: 400, ease: 'Stepped' });
    const stone = this.add.image(190, 128, 'stone_asleep').setOrigin(0.5, 1).setScale(2);
    this.time.addEvent({ delay: 1100, loop: true, callback: () => {
      const z = addText(this, 198, 92, 'z', { color: COLORS.blue });
      this.tweens.add({ targets: z, x: 208, y: 76, alpha: 0, duration: 1500, onComplete: () => z.destroy() });
    } });
    if (settings.crown) {
      const crown = this.add.image(150, 80, 'crown').setScale(2);
      this.tweens.add({ targets: crown, y: 77, yoyo: true, repeat: -1, duration: 400, ease: 'Stepped' });
      this.add.particles(150, 80, 'dot_gold', { speed: 12, lifespan: 700, frequency: 250, alpha: { start: 1, end: 0 } });
    }
    void stone;

    this.pressSpace = addText(this, 160, 146, 'Press Space', { center: true, color: COLORS.white });
    this.tweens.add({ targets: this.pressSpace, alpha: 0.2, yoyo: true, repeat: -1, duration: 600 });
    addText(this, 160, 168, 'A birthday gift for Annarose  ♥', { center: true, color: COLORS.lightPink });

    this.menu = null;
    this.initBase({ hud: false, pausable: false, toasts: false, music: 'title' });
    this.input.keyboard.on('keydown-W', () => this.moveCursor(-1));
    this.input.keyboard.on('keydown-S', () => this.moveCursor(1));
  }

  drawBackdrop() {
    const g = this.add.graphics();
    const bands = [0x3a2a5e, 0x4b3a78, 0x6a58a0, 0x8f7cc0, 0xc4a3d6, 0xf3c6d3];
    bands.forEach((c, i) => { g.fillStyle(c); g.fillRect(0, i * 16, 320, 16); });
    g.fillStyle(0xf3c6d3); g.fillRect(0, 96, 320, 20);
    // stars
    for (let i = 0; i < 30; i++) {
      const s = this.add.image(Phaser.Math.Between(0, 320), Phaser.Math.Between(0, 60), 'px').setTint(0xfffaf0);
      this.tweens.add({ targets: s, alpha: 0.2, yoyo: true, repeat: -1, duration: Phaser.Math.Between(400, 1400) });
    }
    // rolling hills
    g.fillStyle(0x4a8448);
    for (let x = 0; x < 320; x++) g.fillRect(x, 104 + Math.round(Math.sin(x / 30) * 6), 1, 80);
    g.fillStyle(0x78b85a);
    for (let x = 0; x < 320; x++) g.fillRect(x, 120 + Math.round(Math.sin(x / 22 + 2) * 4), 1, 60);
    // little houses on the hill
    [[40, 'roof'], [260, 'roofBlue'], [290, 'roofPink']].forEach(([x, roof]) => {
      this.add.image(x, 98, `t_${roof}`).setOrigin(0.5, 1);
      this.add.image(x, 112, 't_door').setOrigin(0.5, 1).setScale(0.75, 0.9);
    });
    this.add.image(20, 128, 't_tree').setOrigin(0.5, 1);
    this.add.image(300, 136, 't_tree').setOrigin(0.5, 1);
  }

  onSpace() {
    if (!this.menu) return this.openMenu();
    sfx.select();
    const choice = this.menu.options[this.menu.index];
    if (this.menu.confirm) {
      if (choice === 'Yes, start over') this.startNew();
      else this.openMenu();
      return;
    }
    if (choice === 'Continue') {
      load();
      this.go(state.scene || 'Hub', state.sceneData || {});
    } else if (choice === 'New Game') {
      if (hasSave()) this.openMenu(true);
      else this.startNew();
    }
  }

  startNew() {
    newGame();
    this.go('Intro');
  }

  openMenu(confirm = false) {
    sfx.select();
    this.pressSpace.setVisible(false);
    this.menu?.objs.forEach((o) => o.destroy());
    const options = confirm ? ['Yes, start over', 'No, go back'] : hasSave() ? ['Continue', 'New Game'] : ['New Game'];
    const objs = [];
    const h = 14 + options.length * 12 + (confirm ? 10 : 0);
    const py = 176 - h;
    objs.push(panel(this, 100, py, 120, h, { fill: 0x3a2a5e, depth: 50 }));
    let y = py + 5;
    if (confirm) { objs.push(addText(this, 160, y, 'Erase your save?', { center: true, color: COLORS.pink, depth: 51 })); y += 12; }
    const labels = options.map((o, i) => addText(this, 160, y + i * 12, o, { center: true, color: COLORS.cream, depth: 51 }));
    objs.push(...labels);
    const cursor = addText(this, 108, y, '→', { color: COLORS.pink, depth: 51 });
    objs.push(cursor);
    this.menu = { options, index: 0, labels, cursor, objs, confirm, y };
    this.moveCursor(0);
  }

  moveCursor(d) {
    if (!this.menu) return;
    const m = this.menu;
    m.index = (m.index + d + m.options.length) % m.options.length;
    if (d) sfx.move();
    m.cursor.setY(m.y + m.index * 12);
    m.labels.forEach((l, i) => l.setTint(i === m.index ? COLORS.white : COLORS.grey));
  }
}
