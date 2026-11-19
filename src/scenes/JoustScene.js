// Big Prank #2: The Joust. Side view, best of 3. Press SPACE while the marker is in the
// sweet spot as the riders charge. Sir Oinks is too embarrassed by his pink armor to aim,
// so the sweet spot is generous, and it grows a little after every lost match.
import BaseScene from './BaseScene.js';
import { addText, panel, COLORS } from '../ui/text.js';
import { state, doPrank, completeArea, save, hasPrank } from '../state.js';
import * as sfx from '../audio/sfx.js';

const BAR = { x: 60, y: 160, w: 200, h: 8 };
const CHARGE_MS = 2600;

export default class JoustScene extends BaseScene {
  constructor() {
    super('Joust');
  }

  create() {
    this.drawArena();
    this.pinkKey = hasPrank('castle_armor') ? 'oinks_pink_side_0' : 'oinks_side_0';
    this.pig = this.add.container(40, 120);
    this.pig.add([this.add.image(4, 6, 'hobby_horse').setFlipX(true).setOrigin(0.5, 1), this.add.image(0, 0, 'pig_side_0').setOrigin(0.5, 1)]);
    this.pigLance = this.add.rectangle(12, -8, 26, 2, 0xf1dfb6).setOrigin(0, 0.5);
    this.pig.add(this.pigLance).setScale(2).setDepth(10);
    this.oinks = this.add.container(280, 120);
    this.oinks.add([this.add.image(-4, 6, 'hobby_horse').setOrigin(0.5, 1), this.add.image(0, 0, this.pinkKey).setFlipX(true).setOrigin(0.5, 1)]);
    this.oinksLance = this.add.rectangle(-12, -8, 26, 2, 0xa06b42).setOrigin(1, 0.5);
    this.oinks.add(this.oinksLance).setScale(2).setDepth(10);

    panel(this, BAR.x - 6, BAR.y - 6, BAR.w + 12, BAR.h + 12, { depth: 30, alpha: 0.9 });
    this.add.rectangle(BAR.x, BAR.y, BAR.w, BAR.h, 0x3a2a5e).setOrigin(0).setDepth(31);
    this.zoneRect = this.add.rectangle(0, BAR.y, 0, BAR.h, 0x78b85a).setOrigin(0).setDepth(32);
    this.marker = this.add.rectangle(BAR.x, BAR.y - 2, 3, BAR.h + 4, 0xfffaf0).setOrigin(0.5, 0).setDepth(33);
    panel(this, 80, 4, 160, 14, { depth: 39, alpha: 0.9 });
    this.score = addText(this, 160, 7, '', { center: true, color: COLORS.white, depth: 40 });
    this.banner = addText(this, 160, 60, '', { center: true, scale: 2, color: COLORS.gold, depth: 40 });
    this.hint = addText(this, 160, 146, 'SPACE in the green zone!', { center: true, color: COLORS.cream, depth: 40 });

    this.initBase({ music: 'castle' });
    this.hud.setVisible(false);
    this.markerPos = 0;
    this.running = false;
    this.cutscene(async () => {
      await this.wait(300);
      await this.say([
        [this.oinksSpeaker, 'To the lists! The noble joust! Best of three! Oink!'],
        ['mrpig', 'Hee hee. Hit SPACE when the marker is in the green. His pink armor is very distracting...'],
        [this.oinksSpeaker, 'Do NOT look at my armor. Look at my LANCE. Oink!'],
      ]);
      this.startMatch();
    });
  }

  get oinksSpeaker() {
    return hasPrank('castle_armor') ? 'oinksPink' : 'oinks';
  }

  drawArena() {
    const g = this.add.graphics();
    g.fillStyle(0x8db8ec); g.fillRect(0, 0, 320, 90);
    g.fillStyle(0xb0abbd); g.fillRect(0, 50, 320, 40);
    g.fillStyle(0x6e6984);
    for (let x = 0; x < 320; x += 16) { g.fillRect(x, 50, 1, 40); g.fillRect(x + 8, 70, 1, 20); }
    g.fillRect(0, 70, 320, 1);
    for (let x = 0; x < 320; x += 16) g.fillRect(x, 44, 10, 6); // battlements
    g.fillStyle(0x78b85a); g.fillRect(0, 90, 320, 90);
    g.fillStyle(0x4a8448); g.fillRect(0, 122, 320, 2);
    // the tilt barrier
    g.fillStyle(0xa06b42); g.fillRect(0, 96, 320, 4);
    g.fillStyle(0xe2575e);
    for (let x = 0; x < 320; x += 20) g.fillRect(x, 96, 10, 4);
    // crowd of guards
    for (let i = 0; i < 9; i++) {
      const s = this.add.image(20 + i * 35, 92, i % 3 === 1 ? 'vg_down_0' : 'guard_down_0').setOrigin(0.5, 1);
      this.tweens.add({ targets: s, y: 89, yoyo: true, repeat: -1, duration: 300 + (i % 4) * 70, ease: 'Stepped' });
    }
    // pennants
    const cols = [0xe2575e, 0xf2c230, 0xf2a7b8];
    for (let i = 0; i < 16; i++) {
      g.fillStyle(cols[i % 3]);
      g.fillTriangle(i * 20 + 4, 30, i * 20 + 16, 30, i * 20 + 10, 40);
    }
  }

  get zone() {
    const width = Math.min(0.62, 0.36 + 0.08 * state.joustLosses);
    const start = 0.5 - width / 2;
    return { start, end: start + width };
  }

  startMatch() {
    this.wins = 0;
    this.losses = 0;
    this.round = 0;
    this.done = false;
    this.nextRound();
  }

  async nextRound() {
    this.round++;
    this.updateScore();
    const z = this.zone;
    this.zoneRect.setPosition(BAR.x + z.start * BAR.w, BAR.y).setSize((z.end - z.start) * BAR.w, BAR.h);
    this.pig.setPosition(40, 120).setAngle(0);
    this.oinks.setPosition(280, 120).setAngle(0);
    this.banner.setText(`Round ${this.round}`);
    this.locked = true;
    await this.wait(700);
    this.banner.setText('CHARGE!');
    sfx.select();
    await this.wait(300);
    this.banner.setText('');
    this.locked = false;
    this.pressed = null;
    this.running = true;
    this.chargeStart = this.time.now;
  }

  update(time) {
    if (!this.running) return;
    const t = (time - this.chargeStart) / CHARGE_MS;
    // marker sweeps back and forth across the bar
    const phase = ((time - this.chargeStart) / 700) % 2;
    this.markerPos = phase < 1 ? phase : 2 - phase;
    if (this.pressed === null) this.marker.x = BAR.x + this.markerPos * BAR.w;
    const k = Math.min(1, t);
    this.pig.x = 40 + k * 96;
    this.oinks.x = 280 - k * 96;
    const bob = Math.floor(time / 100) % 2;
    this.pig.y = 120 - bob;
    this.oinks.y = 120 - (1 - bob);
    if (t >= 1) this.clash();
  }

  onSpace() {
    if (!this.running || this.pressed !== null) return;
    const z = this.zone;
    this.pressed = this.markerPos >= z.start && this.markerPos <= z.end;
    this.marker.setFillStyle(this.pressed ? 0xf2c230 : 0xe2575e);
    sfx.move();
  }

  async clash() {
    this.running = false;
    const hit = this.pressed === true;
    this.marker.setFillStyle(0xfffaf0);
    sfx.hit();
    this.cameras.main.shake(250, 0.01);
    this.sparkleBurst(160, 100, 'dot_white', 14);
    if (hit) {
      this.wins++;
      this.banner.setText('HIT!').setTint(COLORS.gold);
      this.popText(this.oinks.x, 70, 'OINK!', COLORS.pink, { ui: true });
      await this.tweenP({ targets: this.oinks, x: this.oinks.x + 40, y: 130, angle: 80, duration: 400, ease: 'Quad.Out' });
    } else {
      this.losses++;
      this.banner.setText(this.pressed === null ? 'TOO LATE!' : 'MISS!').setTint(COLORS.red);
      this.popText(this.pig.x, 70, 'oof!', COLORS.white, { ui: true });
      await this.tweenP({ targets: this.pig, x: this.pig.x - 40, y: 130, angle: -80, duration: 400, ease: 'Quad.Out' });
    }
    this.updateScore();
    await this.wait(900);
    this.banner.setTint(COLORS.gold);
    if (this.wins >= 2) return this.win();
    if (this.losses >= 2) return this.lose();
    this.nextRound();
  }

  updateScore() {
    this.score.setText(`Mr. Pig  ${'★'.repeat(this.wins)}${'-'.repeat(2 - this.wins)}      ${'★'.repeat(this.losses)}${'-'.repeat(2 - this.losses)}  Sir Oinks`);
  }

  async lose() {
    state.joustLosses++;
    save();
    await this.cutscene(() => this.say([
      [this.oinksSpeaker, 'HUZZAH! Victory is mine! Oink! ...Wait, you want a re-joust? Very well. Honor demands it.'],
      ['mrpig', 'Re-joust! (Hee hee. He keeps peeking at his pink armor. The green zone looks bigger now.)'],
    ]));
    this.startMatch();
  }

  onRestart() {
    if (this.done) return;
    this.running = false;
    this.toast.show('Re-joust!', COLORS.cream);
    this.startMatch();
  }

  async win() {
    if (this.done) return;
    this.done = true;
    this.running = false;
    this.banner.setText('VICTORY!').setTint(COLORS.gold);
    this.hearts(this.pig.x, 80, 10);
    sfx.fanfare();
    doPrank('castle_joust', 15, 'The Joust');
    completeArea('castle');
    await this.cutscene(() => this.say([
      [this.oinksSpeaker, 'Unhorsed! By a piglet! On a STICK! ...in front of my own guards. Oink.'],
      ['mrpig', 'Hee hee. Good joust, Sir Oinks.'],
    ]));
    this.go('Castle', { room: 'throne', entry: 'south', fromJoust: true });
  }

  debugComplete() {
    this.win();
  }
}
