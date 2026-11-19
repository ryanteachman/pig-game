import BaseScene from './BaseScene.js';
import { addText, COLORS } from '../ui/text.js';
import { stopSong } from '../audio/music.js';

const LINES = [
  ['Starring', COLORS.gold],
  ['', 0],
  ['Mr. Pig', COLORS.pink],
  ['Mr. Big Pig', COLORS.lightPink],
  ['Sir Oinks A Lot', COLORS.grey],
  ['the Shleepy Stone', COLORS.gold],
  ['and Annarose', COLORS.blue],
  ['', 0],
  ['', 0],
  ['Thanks for playing  ♥', COLORS.white],
];

export default class CreditsScene extends BaseScene {
  constructor() {
    super('Credits');
  }

  create() {
    this.add.rectangle(0, 0, 320, 180, 0x2a1b2d).setOrigin(0);
    const cast = [['pig_down_0', 70], ['bigpig_happy', 110], ['oinks_pink_down_0', 150], ['stone_awake', 190], ['anna_laugh', 240]];
    cast.forEach(([k, x], i) => {
      const s = this.add.image(x, 172, k).setOrigin(0.5, 1);
      this.tweens.add({ targets: s, y: 168, yoyo: true, repeat: -1, duration: 300 + i * 40, ease: 'Stepped' });
    });
    const c = this.add.container(0, 180);
    LINES.forEach(([t, col], i) => {
      if (t) c.add(addText(this, 160, i * 13, t, { center: true, color: col, ui: false, scale: i === 0 ? 2 : 1 }));
    });
    this.initBase({ hud: false, pausable: false, toasts: false, music: 'finale' });
    this.tweens.add({ targets: c, y: 20, duration: 7000, ease: 'Sine.Out' });
    this.time.delayedCall(1500, () => { this.canSkip = true; });
    this.time.delayedCall(11000, () => this.finish());
  }

  onSpace() {
    if (this.canSkip) this.finish();
  }

  finish() {
    if (this.transitioning) return;
    stopSong();
    this.go('Title');
  }
}
