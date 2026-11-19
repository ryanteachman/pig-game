// Shared top-down overworld: tilemap rendering, Mr. Pig movement + collision, interaction
// prompts, cheese pickups, exits, NPC helpers, and the Shleepy Stone follower.
import Phaser from 'phaser';
import BaseScene from './BaseScene.js';
import { LEGEND, cheeseSpots } from '../levels/maps.js';
import { state, collectCheese, save } from '../state.js';
import * as sfx from '../audio/sfx.js';
import { addText, COLORS } from '../ui/text.js';

export const T = 16;
export const tx = (c) => c * T + T / 2; // tile centre x
export const ty = (r) => r * T + T; // tile bottom y (sprites use origin 0.5,1)

const SPEED = 74;

export default class Overworld extends BaseScene {
  createWorld({ map, area, room = 'main', spawn, music, legend = {}, follower = true, sleepy = true }) {
    this.area = area;
    this.room = room;
    this.mapRows = map;
    this.mapW = map[0].length;
    this.mapH = map.length;
    this.legend = { ...LEGEND, ...legend };
    this.solids = [];
    this.interactables = [];
    this.exits = [];
    this.npcs = [];
    this.cheeses = [];
    this.renderMap();

    // Mr. Pig
    this.px = spawn.x;
    this.py = spawn.y;
    this.facing = spawn.facing || 'down';
    this.player = this.add.sprite(this.px, this.py, `pig_${this.facing === 'left' || this.facing === 'right' ? 'side' : this.facing}_0`).setOrigin(0.5, 1);
    this.player.setFlipX(this.facing === 'left');
    this.carryIcon = this.add.image(0, 0, 'px').setVisible(false);

    if (follower) {
      this.follower = new Follower(this, this.px - 14, this.py + 2, sleepy);
    }

    this.cameras.main.setBounds(0, 0, this.mapW * T, this.mapH * T);
    this.cameras.main.startFollow(this.player, true, 0.15, 0.15);
    this.cameras.main.setRoundPixels(true);

    this.prompt = addText(this, 0, 0, '!', { color: COLORS.gold, ui: false, depth: 1200, center: true }).setScrollFactor(1).setVisible(false);
    this.tweens.add({ targets: this.prompt, alpha: 0.5, yoyo: true, repeat: -1, duration: 350 });

    this.initBase({ music });
    this.updateCarry();
  }

  renderMap() {
    const rt = this.add.renderTexture(0, 0, this.mapW * T, this.mapH * T).setOrigin(0).setDepth(-1000);
    this.solidGrid = this.mapRows.map((row) => row.split('').map(() => false));
    const spots = cheeseSpots(this.area, this.room, this.mapRows);
    this.mapRows.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        let ch = row[x];
        if (ch === '*' || ch === '$') ch = this.groundAround(x, y);
        const def = this.legend[ch];
        rt.draw(`t_${def.tile}`, x * T, y * T);
        this.solidGrid[y][x] = !!def.solid;
        if (def.prop) this.addProp(def.prop, tx(x), ty(y), { solid: [14, 10] });
      }
    });
    this.groundRT = rt;
    for (const c of spots) this.addCheese(c);
  }

  groundAround(x, y) {
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
      const ch = this.mapRows[y + dy]?.[x + dx];
      if (ch && this.legend[ch] && !this.legend[ch].solid) return ch;
    }
    return ',';
  }

  // Replace a tile at runtime (e.g. grass -> mud).
  setTile(x, y, ch) {
    const def = this.legend[ch];
    this.groundRT.draw(`t_${def.tile}`, x * T, y * T);
    this.solidGrid[y][x] = !!def.solid;
  }

  // ---------------------------------------------------------------- objects
  addProp(key, x, y, { solid = null, depth = null, flip = false } = {}) {
    const s = this.add.image(x, y, key).setOrigin(0.5, 1).setFlipX(flip);
    s.setDepth(depth ?? y);
    if (solid) s.solid = this.addSolid(x - solid[0] / 2, y - solid[1], solid[0], solid[1]);
    return s;
  }

  addSolid(x, y, w, h) {
    const r = { x, y, w, h, on: true };
    this.solids.push(r);
    return r;
  }

  addNPC({ key, x, y, anim = null, flip = false, solid = [12, 6], bob = true, name = null }) {
    const s = this.add.sprite(x, y, key).setOrigin(0.5, 1).setFlipX(flip).setDepth(y);
    if (anim) s.play(anim);
    if (solid) s.solid = this.addSolid(x - solid[0] / 2, y - solid[1], solid[0], solid[1]);
    if (bob) s.bob = this.tweens.add({ targets: s, y: y - 1, yoyo: true, repeat: -1, duration: 500 + Math.random() * 300, ease: 'Stepped' });
    s.npcName = name;
    this.npcs.push(s);
    return s;
  }

  moveSolid(sprite, w = 12, h = 6) {
    if (!sprite.solid) return;
    Object.assign(sprite.solid, { x: sprite.x - w / 2, y: sprite.y - h, w, h });
  }

  // fn is called on Space when Mr. Pig is close. top = y of the "!" prompt.
  addInteract(x, y, fn, { r = 20, top = null, enabled = null } = {}) {
    const it = { x, y, fn, r, top: top ?? y - 20, enabled };
    this.interactables.push(it);
    return it;
  }

  addExit(x, y, w, h, fn, enabled = null) {
    const e = { x, y, w, h, fn, enabled };
    this.exits.push(e);
    return e;
  }

  addCheese({ id, x, y, hidden }) {
    if (state.cheese[id]) return;
    const cx = tx(x), cy = y * T + 10;
    const s = this.add.image(cx, cy, 'cheese').setDepth(cy);
    s.cheeseId = id;
    if (hidden) {
      s.setAlpha(0);
      s.sparkler = this.time.addEvent({
        delay: 1400, loop: true, startAt: Math.random() * 1400,
        callback: () => {
          const sp = this.add.image(cx + Phaser.Math.Between(-4, 4), cy - Phaser.Math.Between(0, 6), 'sparkle').setDepth(cy + 1).setScale(0.4);
          this.tweens.add({ targets: sp, scale: 1, alpha: 0, duration: 600, onComplete: () => sp.destroy() });
        },
      });
    } else {
      this.tweens.add({ targets: s, y: cy - 2, yoyo: true, repeat: -1, duration: 600, ease: 'Sine.InOut' });
    }
    this.cheeses.push(s);
  }

  // ---------------------------------------------------------------- collision
  hitbox(x = this.px, y = this.py) {
    return { x: x - 5, y: y - 6, w: 10, h: 6 };
  }

  blocked(r) {
    const x0 = Math.floor(r.x / T), x1 = Math.floor((r.x + r.w - 0.01) / T);
    const y0 = Math.floor(r.y / T), y1 = Math.floor((r.y + r.h - 0.01) / T);
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        if (y < 0 || x < 0 || y >= this.mapH || x >= this.mapW) return true;
        if (this.solidGrid[y][x]) return true;
      }
    }
    for (const s of this.solids) {
      if (s.on && r.x < s.x + s.w && r.x + r.w > s.x && r.y < s.y + s.h && r.y + r.h > s.y) return true;
    }
    return false;
  }

  heldDir() {
    let best = null, t = -1;
    for (const [k, d] of [['W', 'up'], ['A', 'left'], ['S', 'down'], ['D', 'right']]) {
      const key = this.keys[k];
      if (key.isDown && key.timeDown > t) { best = d; t = key.timeDown; }
    }
    return best;
  }

  tryMove(dx, dy) {
    const nx = this.px + dx, ny = this.py + dy;
    if (!this.blocked(this.hitbox(nx, ny))) { this.px = nx; this.py = ny; return true; }
    // corner assist: slide around small overlaps
    for (let n = 1; n <= 5; n++) {
      for (const s of [-1, 1]) {
        const ax = dx ? 0 : s * n, ay = dy ? 0 : s * n;
        if (!this.blocked(this.hitbox(this.px + ax, this.py + ay)) && !this.blocked(this.hitbox(nx + ax, ny + ay))) {
          this.px += Math.sign(ax) * Math.min(1, Math.abs(ax));
          this.py += Math.sign(ay) * Math.min(1, Math.abs(ay));
          return true;
        }
      }
    }
    return false;
  }

  // ---------------------------------------------------------------- update
  update(time, delta) {
    if (!this.player) return;
    const free = !this.locked && !this.dialogue.active && !this.transitioning && !this.scriptedPlayer;
    let moving = false;
    if (free) {
      const dir = this.heldDir();
      if (dir) {
        this.facing = dir;
        const step = (SPEED * Math.min(delta, 50)) / 1000;
        const [dx, dy] = { up: [0, -step], down: [0, step], left: [-step, 0], right: [step, 0] }[dir];
        moving = this.tryMove(dx, dy);
        if (!moving) this.facing = dir;
      }
    }
    if (!this.scriptedPlayer) this.animatePlayer(moving || false, time);
    this.player.setDepth(this.py);
    this.updateCarry();

    if (this.follower) this.follower.update(time, delta);
    if (free) {
      this.checkCheese();
      this.checkExits();
    }
    this.updatePrompt(free);
    this.updateWorld?.(time, delta, free);
  }

  animatePlayer(moving, time) {
    const f = this.facing;
    const dirKey = f === 'left' || f === 'right' ? 'side' : f;
    this.player.setFlipX(f === 'left');
    if (moving) {
      this.player.play(`pig_walk_${dirKey}`, true);
      this.player.setPosition(Math.round(this.px), Math.round(this.py));
    } else {
      this.player.anims.stop();
      this.player.setTexture(`pig_${dirKey}_0`);
      const bob = Math.floor(time / 450) % 2;
      this.player.setPosition(Math.round(this.px), Math.round(this.py) - bob);
    }
  }

  // Walk Mr. Pig to a point in a cutscene.
  async walkPlayer(x, y, speed = 60) {
    this.scriptedPlayer = true;
    const pts = [[x, this.py], [x, y]];
    for (const [tx2, ty2] of pts) {
      const dist = Math.hypot(tx2 - this.px, ty2 - this.py);
      if (dist < 1) continue;
      const dir = Math.abs(tx2 - this.px) > Math.abs(ty2 - this.py) ? (tx2 > this.px ? 'right' : 'left') : ty2 > this.py ? 'down' : 'up';
      this.facing = dir;
      const dirKey = dir === 'left' || dir === 'right' ? 'side' : dir;
      this.player.setFlipX(dir === 'left').play(`pig_walk_${dirKey}`, true);
      await this.tweenP({
        targets: this, px: tx2, py: ty2, duration: (dist / speed) * 1000,
        onUpdate: () => this.player.setPosition(Math.round(this.px), Math.round(this.py)),
      });
    }
    this.player.anims.stop();
    this.scriptedPlayer = false;
  }

  face(dir) {
    this.facing = dir;
    this.animatePlayer(false, 0);
  }

  // Generic tween walk for NPC sprites.
  async walkSprite(s, x, y, speed = 50, animKey = null) {
    const dist = Math.hypot(x - s.x, y - s.y);
    if (animKey) s.play(animKey, true);
    if (x !== s.x) s.setFlipX(x < s.x);
    s.bob?.pause();
    await this.tweenP({ targets: s, x, y, duration: (dist / speed) * 1000, onUpdate: () => s.setDepth(s.y) });
    s.anims?.stop();
    if (s.solid) this.moveSolid(s, s.solid.w, s.solid.h);
  }

  checkCheese() {
    for (const c of this.cheeses) {
      if (!c.active || c.collected) continue;
      if (Math.abs(c.x - this.px) < 10 && Math.abs(c.y - (this.py - 4)) < 10) {
        c.collected = true;
        c.sparkler?.remove();
        collectCheese(c.cheeseId);
        this.sparkleBurst(c.x, c.y);
        c.setAlpha(1);
        this.tweens.add({ targets: c, y: c.y - 16, alpha: 0, scale: 1.5, duration: 400, onComplete: () => c.destroy() });
      }
    }
  }

  checkExits() {
    const hb = this.hitbox();
    for (const e of this.exits) {
      if (e.enabled && !e.enabled()) continue;
      if (hb.x < e.x + e.w && hb.x + hb.w > e.x && hb.y < e.y + e.h && hb.y + hb.h > e.y) {
        e.fn();
        return;
      }
    }
  }

  nearestInteract() {
    let best = null, bd = Infinity;
    const cx = this.px, cy = this.py - 6;
    for (const it of this.interactables) {
      if (it.enabled && !it.enabled()) continue;
      const d = Math.hypot(it.x - cx, it.y - cy);
      if (d < it.r && d < bd) { best = it; bd = d; }
    }
    return best;
  }

  updatePrompt(free) {
    const it = free ? this.nearestInteract() : null;
    this.prompt.setVisible(!!it);
    if (it) this.prompt.setPosition(it.x, it.top - 10);
  }

  onSpace() {
    const it = this.nearestInteract();
    if (it) it.fn();
  }

  onShift() {
    if (!this.snortFx(this.player)) return;
    const x = this.px, y = this.py - 8;
    if (this.follower?.asleep && Math.hypot(this.follower.sprite.x - x, this.follower.sprite.y - y) < 90) this.follower.wake();
    for (const n of this.npcs) {
      if (n.noStartle || !n.visible) continue;
      if (Math.hypot(n.x - x, n.y - 8 - y) < 44) this.startle(n);
    }
    this.onSnort?.(x, y);
  }

  startle(s) {
    const y0 = s.y;
    s.bob?.pause();
    this.popText(s.x, s.y - s.displayHeight - 6, '!', COLORS.gold, { rise: 6, duration: 600 });
    this.tweens.add({ targets: s, y: y0 - 5, yoyo: true, duration: 110, onComplete: () => { s.y = y0; s.bob?.resume(); } });
  }

  // Item carried above Mr. Pig's head (castle).
  updateCarry() {
    const key = state.carrying;
    if (!key) { this.carryIcon.setVisible(false); return; }
    if (this.carryIcon.texture.key !== key) this.carryIcon.setTexture(key);
    this.carryIcon.setVisible(true).setPosition(this.player.x, this.player.y - 20).setDepth(this.py + 1);
  }
}

// ------------------------------------------------------------------ the Shleepy Stone
export class Follower {
  constructor(scene, x, y, sleepy = true) {
    this.scene = scene;
    this.sleepy = sleepy;
    this.sprite = scene.add.sprite(x, y, 'stone_awake').setOrigin(0.5, 1).setDepth(y);
    this.trail = [];
    this.asleep = false;
    this.lastX = scene.px;
    this.lastY = scene.py;
    this.nextSleep = scene.time.now + Phaser.Math.Between(25000, 45000);
    this.zTimer = null;
  }

  update(time, delta) {
    const sc = this.scene;
    if (Math.hypot(sc.px - this.lastX, sc.py - this.lastY) >= 2) {
      this.trail.push({ x: sc.px, y: sc.py + 1 });
      this.lastX = sc.px;
      this.lastY = sc.py;
      if (this.trail.length > 500) this.trail.shift();
    }
    const s = this.sprite;
    if (this.asleep) return;
    const behind = 10;
    let moved = false;
    if (this.trail.length > behind) {
      const speed = this.trail.length > 40 ? 170 : 78;
      let budget = (speed * Math.min(delta, 50)) / 1000;
      while (budget > 0 && this.trail.length > behind) {
        const p = this.trail[0];
        const d = Math.hypot(p.x - s.x, p.y - s.y);
        if (d <= budget) { s.setPosition(p.x, p.y); this.trail.shift(); budget -= d; }
        else { s.x += ((p.x - s.x) / d) * budget; s.y += ((p.y - s.y) / d) * budget; budget = 0; }
        moved = true;
      }
    }
    s.setDepth(s.y - 0.5);
    s.setTexture('stone_awake');
    if (moved) s.setOrigin(0.5, 1 + (Math.floor(time / 120) % 2) * 0.06);
    else s.setOrigin(0.5, 1);
    if (this.sleepy && !sc.locked && !sc.dialogue.active && time > this.nextSleep) this.fallAsleep();
  }

  fallAsleep() {
    if (this.asleep) return;
    this.asleep = true;
    this.sprite.setTexture('stone_asleep').setOrigin(0.5, 1);
    sfx.sleep();
    this.zTimer = this.scene.time.addEvent({ delay: 900, loop: true, callback: () => this.puffZ() });
    this.puffZ();
    if (!state.flags.stoneNapHint) {
      state.flags.stoneNapHint = true;
      save();
      this.scene.toast.show('The Stone dozed off! SHIFT near her to wake her', COLORS.gold);
    }
  }

  puffZ() {
    const s = this.sprite;
    const z = addText(this.scene, s.x + 5, s.y - 16, 'z', { color: COLORS.blue, ui: false, depth: s.depth + 1 }).setScrollFactor(1);
    this.scene.tweens.add({ targets: z, x: z.x + 8, y: z.y - 14, alpha: 0, duration: 1400, onComplete: () => z.destroy() });
  }

  wake() {
    if (!this.asleep) return;
    this.asleep = false;
    this.zTimer?.remove();
    this.sprite.setTexture('stone_awake');
    sfx.wake();
    const y0 = this.sprite.y;
    this.scene.tweens.add({ targets: this.sprite, y: y0 - 6, yoyo: true, duration: 120 });
    this.scene.popText(this.sprite.x, this.sprite.y - 24, '!', COLORS.gold, { rise: 6 });
    this.nextSleep = this.scene.time.now + Phaser.Math.Between(25000, 45000);
  }

  sleepNow() {
    this.nextSleep = 0;
    this.fallAsleep();
  }
}
