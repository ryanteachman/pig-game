// Big Prank #3: The Bad Dreams. Protect the sleeping Shleepy Stone for 75 seconds across
// three waves. SHIFT releases a snort shockwave (radius ~2.5 tiles, 0.6s cooldown) that poofs
// nightmares. If she loses all 5 dream-hearts the wave restarts, a little easier.
import Phaser from 'phaser';
import BaseScene from './BaseScene.js';
import { addText, panel, COLORS } from '../ui/text.js';
import { state, doPrank, completeArea, save } from '../state.js';
import * as sfx from '../audio/sfx.js';

const WAVE_MS = 25000;
const RADIUS = 40;
const COOLDOWN = 600;
const SPEED = 92;
const CENTER = { x: 160, y: 100 };
const WAVES = [
  { every: 1500, kinds: ['blob'], speed: 20 },
  { every: 1150, kinds: ['blob', 'cloud'], speed: 24 },
  { every: 950, kinds: ['blob', 'cloud', 'clock'], speed: 27, boss: true },
];
const KIND = {
  blob: { key: 'blob_0', anim: 'blob_wobble', hp: 1, speedMul: 1 },
  cloud: { key: 'cloud', hp: 1, speedMul: 0.8 },
  clock: { key: 'clock', hp: 1, speedMul: 1.35 },
  boss: { key: 'rock_bottom', hp: 3, speedMul: 0.45 },
};

export default class DreamScene extends BaseScene {
  constructor() {
    super('Dream');
  }

  create() {
    this.drawDreamSky();
    this.stone = this.add.image(CENTER.x, CENTER.y + 10, 'stone_asleep').setOrigin(0.5, 1).setScale(2).setDepth(CENTER.y);
    this.time.addEvent({ delay: 900, loop: true, callback: () => !this.won && this.popText(CENTER.x + 12, CENTER.y - 24, 'z', COLORS.blue, { rise: 14, duration: 1400 }) });
    this.ring = this.add.graphics().setDepth(900);
    this.pig = this.add.sprite(CENTER.x, CENTER.y + 40, 'pig_down_0').setOrigin(0.5, 1).setDepth(500);
    this.px = CENTER.x; this.py = CENTER.y + 40;
    this.facing = 'down';
    this.enemies = [];

    this.heartIcons = [];
    panel(this, 112, 2, 96, 26, { depth: 1500, alpha: 0.85 });
    for (let i = 0; i < 5; i++) this.heartIcons.push(this.add.image(130 + i * 15, 10, 'heart').setDepth(1501));
    this.waveText = addText(this, 160, 16, '', { center: true, color: COLORS.cream, depth: 1501 });
    this.add.rectangle(116, 25, 88, 2, 0x3a2a5e).setOrigin(0).setDepth(1501);
    this.timeBar = this.add.rectangle(116, 25, 0, 2, 0xf2c230).setOrigin(0).setDepth(1502);

    this.initBase({ music: 'dream' });
    this.hud.setVisible(false);
    this.wave = 0;
    this.running = false;
    this.cutscene(async () => {
      await this.wait(300);
      await this.say([
        ['mrpig', "So this is the Shleepy Stone's dream. All twilight and stars... and NIGHTMARES."],
        ['mrpig', 'Move with W A S D. SHIFT lets out a snort shockwave that poofs bad dreams. Hee hee.'],
        ['stone', '...zzz... Monday... alarm clock... zzz... nooo...'],
        ['mrpig', 'Hang on, Shleepy Stone! Protect her for three waves!'],
      ]);
      this.startWave(0);
    });
  }

  drawDreamSky() {
    const g = this.add.graphics().setDepth(-100);
    const bands = [0x1e1838, 0x2a2050, 0x3a2a5e, 0x4b3478, 0x5e4290, 0x7a58a8];
    bands.forEach((c, i) => { g.fillStyle(c); g.fillRect(0, i * 30, 320, 30); });
    for (let i = 0; i < 50; i++) {
      const s = this.add.image(Phaser.Math.Between(0, 320), Phaser.Math.Between(0, 180), i % 7 ? 'px' : 'sparkle').setDepth(-90).setScale(i % 7 ? 1 : 0.5).setTint(0xfffaf0);
      this.tweens.add({ targets: s, alpha: 0.15, yoyo: true, repeat: -1, duration: Phaser.Math.Between(500, 1600) });
    }
    // floating dream clouds
    for (let i = 0; i < 5; i++) {
      const c = this.add.ellipse(Phaser.Math.Between(0, 320), Phaser.Math.Between(20, 170), 60, 18, 0x8f7cc0, 0.35).setDepth(-80);
      this.tweens.add({ targets: c, x: c.x + 340, duration: Phaser.Math.Between(20000, 40000), repeat: -1, onRepeat: () => { c.x = -60; } });
    }
    this.add.ellipse(CENTER.x, CENTER.y + 8, 70, 20, 0xc4a3d6, 0.5).setDepth(-50);
  }

  get easeFactor() {
    return Math.pow(0.85, state.dreamLosses);
  }

  startWave(i) {
    this.wave = i;
    this.dreamHearts = 5;
    this.updateHearts();
    this.enemies.forEach((e) => e.sprite.destroy());
    this.enemies = [];
    this.waveStart = this.time.now;
    this.nextSpawn = this.time.now + 600;
    this.bossSpawned = false;
    this.running = true;
    this.waveText.setText(`Wave ${i + 1} of 3`);
    this.banner(`WAVE ${i + 1}`);
  }

  banner(text) {
    const t = addText(this, 160, 60, text, { center: true, scale: 2, color: COLORS.gold, depth: 1600 });
    this.tweens.add({ targets: t, alpha: 0, y: 50, delay: 700, duration: 500, onComplete: () => t.destroy() });
  }

  spawn(kindName) {
    const kind = KIND[kindName];
    const side = Phaser.Math.Between(0, 3);
    const x = side === 0 ? -16 : side === 1 ? 336 : Phaser.Math.Between(0, 320);
    const y = side === 2 ? -16 : side === 3 ? 196 : Phaser.Math.Between(20, 170);
    const sprite = this.add.sprite(x, y, kind.key).setDepth(600);
    if (kind.anim) sprite.play(kind.anim);
    const w = WAVES[this.wave];
    this.enemies.push({ sprite, kind: kindName, hp: kind.hp, speed: w.speed * kind.speedMul * this.easeFactor, wobble: Math.random() * 6 });
  }

  update(time, delta) {
    const dt = Math.min(delta, 50) / 1000;
    // Mr. Pig moves freely (diagonals allowed in the dream)
    if (!this.locked && !this.dialogue.active) {
      let vx = 0, vy = 0;
      if (this.keys.A.isDown) vx -= 1;
      if (this.keys.D.isDown) vx += 1;
      if (this.keys.W.isDown) vy -= 1;
      if (this.keys.S.isDown) vy += 1;
      const len = Math.hypot(vx, vy) || 1;
      this.px = Phaser.Math.Clamp(this.px + (vx / len) * SPEED * dt, 8, 312);
      this.py = Phaser.Math.Clamp(this.py + (vy / len) * SPEED * dt, 24, 178);
      if (vx || vy) {
        this.facing = Math.abs(vx) > Math.abs(vy) ? (vx < 0 ? 'left' : 'right') : vy < 0 ? 'up' : 'down';
        const k = this.facing === 'left' || this.facing === 'right' ? 'side' : this.facing;
        this.pig.play(`pig_walk_${k}`, true).setFlipX(this.facing === 'left');
      } else this.pig.anims.stop();
    }
    this.pig.setPosition(Math.round(this.px), Math.round(this.py)).setDepth(this.py);
    this.drawRing(time);
    if (!this.running) return;

    const w = WAVES[this.wave];
    const elapsed = time - this.waveStart;
    this.timeBar.width = Math.round(88 * Math.min(1, elapsed / WAVE_MS));
    if (time > this.nextSpawn && elapsed < WAVE_MS - 1500) {
      this.spawn(Phaser.Utils.Array.GetRandom(w.kinds));
      this.nextSpawn = time + w.every / this.easeFactor;
    }
    if (w.boss && !this.bossSpawned && elapsed > 2500) {
      this.bossSpawned = true;
      this.spawn('boss');
      this.banner('ROCK BOTTOM!');
    }
    for (const e of this.enemies) {
      if (e.dead) continue;
      const s = e.sprite;
      const dx = CENTER.x - s.x, dy = CENTER.y - s.y;
      const d = Math.hypot(dx, dy);
      if (d < (e.kind === 'boss' ? 24 : 14)) { this.hurt(e); continue; }
      const wob = Math.sin(time / 300 + e.wobble) * 12;
      s.x += (dx / d) * e.speed * dt + (-dy / d) * wob * dt;
      s.y += (dy / d) * e.speed * dt + (dx / d) * wob * dt;
      s.setDepth(s.y);
      if (e.kind === 'clock') s.setAngle(Math.sin(time / 60) * 10);
    }
    this.enemies = this.enemies.filter((e) => !e.dead);
    // the wave ends once its time is up and the last nightmares are cleared
    if (elapsed >= WAVE_MS && this.enemies.every((e) => e.kind !== 'boss' || e.dead)) {
      this.enemies.forEach((e) => this.poof(e));
      if (this.wave < 2) {
        this.running = false;
        this.time.delayedCall(800, () => this.startWave(this.wave + 1));
      } else {
        this.win();
      }
    }
  }

  drawRing(time) {
    this.ring.clear();
    if (this.ringStart && time - this.ringStart < 300) {
      const t = (time - this.ringStart) / 300;
      this.ring.lineStyle(2, 0xfcd3dc, 1 - t);
      this.ring.strokeCircle(this.ringX, this.ringY, 6 + t * RADIUS);
      this.ring.lineStyle(1, 0xfffaf0, (1 - t) * 0.7);
      this.ring.strokeCircle(this.ringX, this.ringY, 2 + t * (RADIUS - 6));
    }
    const cd = this.lastShock ? Math.max(0, COOLDOWN - (time - this.lastShock)) : 0;
    if (cd > 0) {
      this.ring.fillStyle(0xfcd3dc, 0.6);
      this.ring.fillRect(this.px - 6, this.py + 2, 12 * (1 - cd / COOLDOWN), 1);
    }
  }

  onShift() {
    const now = this.time.now;
    if (this.lastShock && now - this.lastShock < COOLDOWN) return;
    this.lastShock = now;
    this.lastSnort = 0;
    this.snortFx(this.pig);
    this.ringStart = now;
    this.ringX = this.px;
    this.ringY = this.py - 8;
    for (const e of this.enemies) {
      if (e.dead) continue;
      const d = Math.hypot(e.sprite.x - this.ringX, e.sprite.y - this.ringY);
      if (d <= RADIUS + (e.kind === 'boss' ? 12 : 4)) {
        e.hp--;
        if (e.hp <= 0) this.poof(e);
        else {
          sfx.hit();
          const ang = Math.atan2(e.sprite.y - this.ringY, e.sprite.x - this.ringX);
          this.tweens.add({ targets: e.sprite, x: e.sprite.x + Math.cos(ang) * 30, y: e.sprite.y + Math.sin(ang) * 30, duration: 200 });
          e.sprite.setTint(0xfcd3dc);
          this.time.delayedCall(150, () => e.sprite.clearTint());
          this.popText(e.sprite.x, e.sprite.y - 24, `${e.hp} more!`, COLORS.white);
        }
      }
    }
  }

  poof(e) {
    if (e.dead) return;
    e.dead = true;
    sfx.poof();
    this.sparkleBurst(e.sprite.x, e.sprite.y - 6, 'dot_white', e.kind === 'boss' ? 24 : 8);
    this.tweens.add({ targets: e.sprite, scale: 0, alpha: 0, duration: 200, onComplete: () => e.sprite.destroy() });
  }

  hurt(e) {
    this.poof(e);
    this.dreamHearts -= e.kind === 'boss' ? 2 : 1;
    this.updateHearts();
    this.cameras.main.shake(150, 0.006);
    this.cameras.main.flash(120, 120, 60, 140);
    this.tweens.add({ targets: this.stone, angle: 6, yoyo: true, repeat: 1, duration: 80 });
    if (this.dreamHearts <= 0) this.waveLost();
  }

  updateHearts() {
    this.heartIcons.forEach((h, i) => h.setTexture(i < this.dreamHearts ? 'heart' : 'heart_empty'));
  }

  async waveLost() {
    this.running = false;
    state.dreamLosses++;
    save();
    this.enemies.forEach((e) => this.poof(e));
    await this.cutscene(() => this.say([
      ['stone', 'Mmmf... zzz... *rolls over*... zzz...'],
      ['mrpig', 'Phew, she just shifted in her sleep. The dream is calming down. Let\'s try that wave again!'],
    ]));
    this.startWave(this.wave);
  }

  onRestart() {
    if (this.won || !this.running) return;
    this.toast.show('Restarting the wave', COLORS.cream);
    this.startWave(this.wave);
  }

  async win() {
    if (this.won) return;
    this.won = true;
    this.running = false;
    this.enemies.forEach((e) => this.poof(e));
    this.waveText.setText('Sweet dreams!');
    this.timeBar.width = 88;
    sfx.fanfare();
    doPrank('caves_dream', 20, 'The Bad Dreams');
    completeArea('caves');
    await this.cutscene(async () => {
      // nightmares become pleasant dreams
      for (let i = 0; i < 16; i++) {
        const key = i % 3 === 0 ? 'cheese' : i % 3 === 1 ? 'heart' : 'heart_small';
        const s = this.add.image(Phaser.Math.Between(20, 300), 190, key).setDepth(800);
        this.tweens.add({ targets: s, y: -10, x: s.x + Phaser.Math.Between(-30, 30), duration: Phaser.Math.Between(2500, 4500), delay: i * 120 });
      }
      this.tweens.add({ targets: this.pig, y: this.pig.y - 8, yoyo: true, repeat: 7, duration: 160, ease: 'Quad.Out' });
      this.tweens.add({ targets: this.pig, angle: 15, yoyo: true, repeat: 7, duration: 160 });
      await this.wait(1800);
      this.stone.setTexture('stone_awake');
      sfx.wake();
      this.heartBurst();
      await this.say([
        ['stoneAwake', 'Mr. Pig... I dreamed you were a hero.'],
        ['stoneAwake', 'Zzz... I mean, a menace. A heroic menace. My favorite kind.'],
        ['mrpig', 'Hee hee. Anything for my best friend. Now... to Annarose!'],
      ]);
    });
    this.go('Hub', { spawn: 'caves' });
  }

  heartBurst() {
    this.hearts(CENTER.x, CENTER.y - 20, 12);
  }

  debugComplete() {
    this.win();
  }
}
