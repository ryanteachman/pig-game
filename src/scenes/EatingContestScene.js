// Big Prank #1: The Great Eating Contest. Press the shown W/A/S/D key to take a bite.
// At the halfway point Mr. Pig swaps Big Pig's pie for a cardboard one. Losing just retries
// with a slightly slower Big Pig, so nobody gets stuck.
import Phaser from 'phaser';
import BaseScene from './BaseScene.js';
import { addText, panel, COLORS } from '../ui/text.js';
import { state, doPrank, completeArea, save } from '../state.js';
import * as sfx from '../audio/sfx.js';

const BITES = 30;
const KEYS = ['W', 'A', 'S', 'D'];
const ARROWS = { W: '↑', A: '←', S: '↓', D: '→' };

export default class EatingContestScene extends BaseScene {
  constructor() {
    super('EatingContest');
  }

  create() {
    this.drawBackdrop();
    this.pig = this.add.image(84, 118, 'pig_down_0').setOrigin(0.5, 1).setScale(2).setDepth(10);
    this.big = this.add.image(236, 118, 'bigpig_0').setOrigin(0.5, 1).setScale(2).setDepth(10);
    this.pigPie = this.add.image(84, 160, 'pie_stack').setOrigin(0.5, 1).setScale(2).setDepth(20);
    this.bigPie = this.add.image(236, 160, 'pie_stack').setOrigin(0.5, 1).setScale(2).setDepth(20);

    panel(this, 8, 26, 130, 22, { depth: 30, alpha: 0.85 });
    panel(this, 182, 26, 130, 22, { depth: 30, alpha: 0.85 });
    addText(this, 14, 29, 'Mr. Pig', { color: COLORS.pink, depth: 31 });
    addText(this, 188, 29, 'Mr. Big Pig', { color: COLORS.lightPink, depth: 31 });
    this.add.rectangle(14, 40, 118, 4, 0x3a2a5e).setOrigin(0).setDepth(31);
    this.add.rectangle(188, 40, 118, 4, 0x3a2a5e).setOrigin(0).setDepth(31);
    this.pigBar = this.add.rectangle(14, 40, 0, 4, 0xf2a7b8).setOrigin(0).setDepth(32);
    this.bigBar = this.add.rectangle(188, 40, 0, 4, 0xfcd3dc).setOrigin(0).setDepth(32);

    this.bubble = panel(this, 140, 60, 40, 40, { depth: 40, fill: 0x3a2a5e, border: 0xf2c230 });
    this.letter = addText(this, 160, 66, '', { center: true, scale: 3, color: COLORS.gold, depth: 41 });
    this.arrow = addText(this, 160, 88, '', { center: true, color: COLORS.white, depth: 41 });
    this.info = addText(this, 160, 108, '', { center: true, color: COLORS.white, depth: 41 });

    this.input.keyboard.on('keydown', (e) => this.onKey(e));
    this.initBase({ music: 'farm' });
    this.hud.setVisible(false);

    this.cutscene(async () => {
      await this.wait(300);
      await this.say([
        ['bigpig', 'Welcome to THE GREAT EATING CONTEST! First to finish their pie stack wins.'],
        ['mrpig', 'Hee hee. Press the key that pops up to take a bite. Easy as pie.'],
      ]);
      this.startAttempt();
    });
  }

  drawBackdrop() {
    const g = this.add.graphics();
    g.fillStyle(0xa8456a); g.fillRect(0, 0, 320, 120);
    g.fillStyle(0x8a3a58);
    for (let x = 0; x < 320; x += 16) g.fillRect(x, 0, 2, 120);
    // bunting
    const cols = [0xe2575e, 0xf2c230, 0x2f62d0, 0xf2a7b8];
    for (let i = 0; i < 20; i++) {
      g.fillStyle(cols[i % 4]);
      g.fillTriangle(i * 16, 8, i * 16 + 14, 8, i * 16 + 7, 18);
    }
    g.fillStyle(0x6a4530); g.fillRect(0, 120, 320, 60);
    g.fillStyle(0xa06b42); g.fillRect(0, 120, 320, 6);
    g.fillStyle(0xf1dfb6); g.fillRect(0, 126, 320, 4);
    this.add.image(160, 118, 'umbrella').setOrigin(0.5, 1).setAlpha(0);
  }

  get bigInterval() {
    return (620 + 140 * state.contestLosses) * (this.twisted ? 2.6 : 1);
  }

  startAttempt() {
    this.playerBites = 0;
    this.bigBites = 0;
    this.twisted = false;
    this.running = false;
    this.won = false;
    this.stunnedUntil = 0;
    this.bigPie.setTexture('pie_stack');
    this.big.setTexture('bigpig_0');
    this.updateBars();
    this.bigTimer?.remove();
    this.countdown();
  }

  async countdown() {
    this.locked = true;
    for (const t of ['3', '2', '1']) {
      this.letter.setText(t).setTint(COLORS.white);
      this.arrow.setText('');
      sfx.move();
      await this.wait(450);
    }
    this.letter.setText('EAT!').setTint(COLORS.pink);
    sfx.select();
    await this.wait(400);
    this.locked = false;
    this.running = true;
    this.nextPrompt();
    this.scheduleBig();
  }

  scheduleBig() {
    this.bigTimer?.remove();
    this.bigTimer = this.time.addEvent({ delay: this.bigInterval, loop: true, callback: () => this.bigBite() });
  }

  nextPrompt() {
    let k;
    do { k = Phaser.Utils.Array.GetRandom(KEYS); } while (k === this.expected && Math.random() < 0.6);
    this.expected = k;
    this.letter.setText(k).setTint(COLORS.gold);
    this.arrow.setText(ARROWS[k]);
  }

  onKey(e) {
    if (!this.running || this.locked || this.dialogue.active || e.repeat) return;
    const k = e.code.replace('Key', '');
    if (!KEYS.includes(k)) return;
    if (this.time.now < this.stunnedUntil) return;
    if (k === this.expected) {
      this.playerBites++;
      sfx.chomp();
      this.tweens.add({ targets: this.pig, scaleX: 2.3, scaleY: 1.8, duration: 60, yoyo: true, onComplete: () => this.pig.setScale(2) });
      this.crumbs(84, 128);
      this.updateBars();
      if (this.playerBites >= BITES) return this.win();
      if (this.playerBites === BITES / 2 && !this.twisted) return this.twist();
      this.nextPrompt();
    } else {
      sfx.wrong();
      this.stunnedUntil = this.time.now + 450;
      this.letter.setTint(COLORS.red);
      this.popText(84, 70, 'hic!', COLORS.white, { ui: true });
      this.time.delayedCall(450, () => this.running && this.letter.setTint(COLORS.gold));
    }
  }

  bigBite() {
    if (!this.running) return;
    this.bigBites++;
    if (this.twisted) this.popText(236, 44, 'crunch', COLORS.cream, { ui: true });
    this.tweens.add({ targets: this.big, scaleX: 2.15, scaleY: 1.85, duration: 70, yoyo: true, onComplete: () => this.big.setScale(2) });
    this.crumbs(236, 128);
    this.updateBars();
    if (this.bigBites >= BITES) this.lose();
  }

  crumbs(x, y) {
    const p = this.add.particles(x, y, 'dot_gold', { speed: { min: 20, max: 50 }, angle: { min: 200, max: 340 }, lifespan: 300, gravityY: 200, emitting: false }).setDepth(50);
    p.explode(5);
    this.time.delayedCall(400, () => p.destroy());
  }

  updateBars() {
    this.pigBar.width = Math.round((118 * this.playerBites) / BITES);
    this.bigBar.width = Math.round((118 * this.bigBites) / BITES);
    this.pigPie.setCrop(0, Math.floor(16 * (this.playerBites / BITES) * 0.8), 16, 16);
    this.bigPie.setCrop(0, Math.floor(16 * (this.bigBites / BITES) * 0.8), 16, 16);
  }

  // The halfway twist: swap Big Pig's pie for a cardboard one.
  async twist() {
    this.running = false;
    this.twisted = true;
    this.bigTimer?.remove();
    await this.cutscene(async () => {
      this.letter.setText('');
      this.arrow.setText('');
      await this.say([['mrpig', '(Halfway there... time for a little mischief. Hee hee.)']]);
      this.popText(236, 40, 'Look! A butterfly!', COLORS.white, { ui: true, rise: 4, duration: 1400 });
      this.big.setTexture('bigpig_back');
      await this.wait(500);
      await this.tweenP({ targets: this.pig, x: 200, duration: 220 });
      sfx.whoosh();
      this.bigPie.setTexture('pie_cardboard').setScale(2.4).setCrop();
      this.sparkleBurst(236, 140);
      await this.tweenP({ targets: this.pig, x: 84, duration: 220 });
      this.big.setTexture('bigpig_0');
      await this.wait(300);
      await this.say([
        ['bigpig', 'Huh, no butterfly. Back to eating! *CRUNCH*'],
        ['bigpig', 'Mmm... this pie is very... crunchy. Tastes like... box. I love it. Chewing... chewing...'],
      ]);
    });
    this.running = true;
    this.nextPrompt();
    this.scheduleBig();
  }

  async lose() {
    this.running = false;
    this.bigTimer?.remove();
    state.contestLosses++;
    save();
    this.big.setTexture('bigpig_happy');
    await this.cutscene(() => this.say([
      ['bigpig', 'BURP! I win! ...Oh, but that was so fun. Let us go again!'],
      ['mrpig', 'Rematch! (He looks a little full. He will be slower this time.)'],
    ]));
    this.startAttempt();
  }

  onRestart() {
    if (this.won) return;
    this.running = false;
    this.bigTimer?.remove();
    this.toast.show('Restarting the contest!', COLORS.cream);
    this.startAttempt();
  }

  async win() {
    if (this.won) return;
    this.won = true;
    this.running = false;
    this.bigTimer?.remove();
    this.letter.setText('');
    this.arrow.setText('');
    this.info.setText('MR. PIG WINS!').setTint(COLORS.gold);
    this.hearts(84, 80, 10);
    sfx.fanfare();
    doPrank('farm_contest', 15, 'The Great Eating Contest');
    completeArea('farm');
    await this.cutscene(() => this.say([
      ['bigpig', 'You... finished first? But I am a professional eater!'],
      ['mrpig', 'Hee hee hee. Good game, Big Pig. How was your pie?'],
      ['bigpig', 'Crunchy. Delicious. Strangely... flat.'],
    ]));
    this.go('Farm', { spawn: 'contest', fromContest: true });
  }

  debugComplete() {
    this.win();
  }
}
