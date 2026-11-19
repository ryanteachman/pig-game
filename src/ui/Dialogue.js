// Bottom-of-screen dialogue box with a 2x portrait, name tag and typewriter text.
// show([[speaker, text], ...]) returns a Promise that resolves when the player has read everything.
import { addText, panel, COLORS } from './text.js';
import { wrap } from './font.js';
import { PORTRAITS } from '../art/sprites.js';
import * as sfx from '../audio/sfx.js';

export const SPEAKERS = {
  mrpig: { name: 'Mr. Pig', color: COLORS.pink },
  stone: { name: 'Shleepy Stone', color: COLORS.gold },
  stoneAwake: { name: 'Shleepy Stone', color: COLORS.gold },
  bigpig: { name: 'Mr. Big Pig', color: COLORS.lightPink },
  oinks: { name: 'Sir Oinks A Lot', color: COLORS.grey },
  oinksPink: { name: 'Sir Oinks A Lot', color: COLORS.pink },
  anna: { name: 'Annarose', color: COLORS.blue },
  annaLaugh: { name: 'Annarose', color: COLORS.blue },
  villagerG: { name: 'Farmer Truffle', color: COLORS.green },
  villagerR: { name: 'Granny Hamhock', color: COLORS.red },
  villagerP: { name: 'Pip', color: COLORS.purple },
  guard: { name: 'Guard', color: COLORS.grey },
  narrator: { name: null, color: COLORS.white },
};

const BOX = { x: 4, y: 128, w: 312, h: 48 };
const LINES_PER_PAGE = 3;
const CHARS_PER_SEC = 55;

export class Dialogue {
  constructor(scene) {
    this.scene = scene;
    this.active = false;
    this.items = [];
    const depth = 2000;
    this.container = scene.add.container(0, 0).setScrollFactor(0).setDepth(depth).setVisible(false);
    this.bg = panel(scene, BOX.x, BOX.y, BOX.w, BOX.h, { depth });
    this.portraitBg = panel(scene, BOX.x + 5, BOX.y + 6, 36, 36, { fill: 0x7a58a8, border: 0xf1dfb6, depth });
    this.portrait = scene.add.image(BOX.x + 23, BOX.y + 24, 'px').setScrollFactor(0).setDepth(depth);
    this.nameBg = panel(scene, BOX.x + 4, BOX.y - 9, 80, 11, { fill: 0x7a58a8, depth });
    this.name = addText(scene, BOX.x + 8, BOX.y - 8, '', { depth: depth + 1 });
    this.text = addText(scene, 0, BOX.y + 7, '', { depth: depth + 1 });
    this.more = addText(scene, BOX.x + BOX.w - 9, BOX.y + BOX.h - 10, '↓', { color: COLORS.gold, depth: depth + 1 });
    this.container.add([this.bg, this.portraitBg, this.portrait, this.nameBg, this.name, this.text, this.more]);
    scene.tweens.add({ targets: this.more, y: '+=2', yoyo: true, repeat: -1, duration: 300 });
  }

  // lines: array of [speaker, text] (or plain strings for narration)
  show(lines) {
    this.queue = [];
    for (const line of lines) {
      const [speaker, text] = typeof line === 'string' ? ['narrator', line] : line;
      const hasPortrait = !!PORTRAITS[speaker];
      const width = hasPortrait ? BOX.w - 58 : BOX.w - 20;
      const wrapped = wrap(text, width);
      for (let i = 0; i < wrapped.length; i += LINES_PER_PAGE) {
        this.queue.push({ speaker, text: wrapped.slice(i, i + LINES_PER_PAGE).join('\n'), hasPortrait });
      }
    }
    this.active = true;
    this.container.setVisible(true);
    return new Promise((resolve) => {
      this.resolve = resolve;
      this.nextPage();
    });
  }

  nextPage() {
    const page = this.queue.shift();
    if (!page) return this.close();
    const sp = SPEAKERS[page.speaker] || SPEAKERS.narrator;
    this.speaker = page.speaker;
    const key = PORTRAITS[page.speaker];
    const showPortrait = !!key;
    this.portrait.setVisible(showPortrait);
    this.portraitBg.setVisible(showPortrait);
    if (showPortrait) {
      const tex = this.scene.textures.get(key).getSourceImage();
      const scale = tex.width >= 32 ? 1 : 2;
      this.portrait.setTexture(key).setScale(scale);
      // Tall sprites (Annarose) show head and shoulders.
      if (tex.height > tex.width) this.portrait.setCrop(0, 0, tex.width, 16).setY(BOX.y + 24 + (tex.height - 16));
      else this.portrait.setCrop().setY(BOX.y + 24);
    }
    this.nameBg.setVisible(!!sp.name);
    this.name.setText(sp.name || '').setTint(sp.color);
    this.text.setX(showPortrait ? BOX.x + 48 : BOX.x + 10);
    this.full = page.text;
    this.shown = 0;
    this.text.setText('');
    this.more.setVisible(false);
    this.typing = true;
    this.typeTimer?.remove();
    this.typeTimer = this.scene.time.addEvent({
      delay: 1000 / CHARS_PER_SEC,
      loop: true,
      callback: () => this.typeChar(),
    });
  }

  typeChar() {
    this.shown++;
    const ch = this.full[this.shown - 1];
    if (ch && ch !== ' ' && ch !== '\n' && this.shown % 2 === 0) sfx.blip(this.speaker);
    this.text.setText(this.full.slice(0, this.shown));
    if (this.shown >= this.full.length) this.finishTyping();
  }

  finishTyping() {
    this.typeTimer?.remove();
    this.typing = false;
    this.text.setText(this.full);
    this.more.setVisible(true);
  }

  advance() {
    if (!this.active) return;
    if (this.typing) this.finishTyping();
    else this.nextPage();
  }

  close() {
    this.active = false;
    this.container.setVisible(false);
    this.typeTimer?.remove();
    const r = this.resolve;
    this.resolve = null;
    // Resolve on the next tick so the same Space press doesn't also trigger an interaction.
    this.scene.time.delayedCall(30, () => r?.());
  }
}
