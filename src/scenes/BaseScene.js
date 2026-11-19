// Shared plumbing for every gameplay scene: input routing, dialogue, HUD, toasts,
// pause/mute, debug keys, fades and little helpers for async cutscenes.
import Phaser from 'phaser';
import { Dialogue } from '../ui/Dialogue.js';
import { Hud } from '../ui/Hud.js';
import { Toast } from '../ui/Toast.js';
import { addText, COLORS } from '../ui/text.js';
import * as sfx from '../audio/sfx.js';
import { wantSong, startWanted } from '../audio/music.js';
import { DEBUG, state, onChange, addMP, collectCheese, setLocation } from '../state.js';
import { allCheeseIds } from '../levels/cheese.js';

const WARPS = { Digit1: 'Hub', Digit2: 'Farm', Digit3: 'Castle', Digit4: 'Caves', Digit5: 'Dream', Digit6: 'Finale' };

export default class BaseScene extends Phaser.Scene {
  initBase({ hud = true, music = null, pausable = true, toasts = true } = {}) {
    this.locked = false;
    this.transitioning = false;
    this.pausable = pausable;
    this.keys = this.input.keyboard.addKeys('W,A,S,D,SPACE,SHIFT,R,M,ESC');
    this.input.keyboard.addCapture('SPACE,SHIFT,W,A,S,D,ESC');
    this.dialogue = new Dialogue(this);
    this.toast = new Toast(this);
    this.hud = hud ? new Hud(this) : null;

    this.input.keyboard.on('keydown', this.handleKey, this);
    this.events.on('resume', () => this.input.keyboard.resetKeys());
    this.events.once('shutdown', () => {
      this.input.keyboard.off('keydown', this.handleKey, this);
      this.unsub?.();
    });
    if (toasts) {
      this.unsub = onChange((type, d) => {
        if (type === 'prank') {
          this.toast.show(`+${d.mp} MP  ${d.name || 'Prank!'}`, COLORS.gold);
          sfx.prank();
        }
        if (type === 'mp' && d.rankUp) {
          this.toast.show(`Rank up: ${d.rankUp}!`, COLORS.pink);
          this.time.delayedCall(500, () => sfx.fanfare());
          this.cameras.main.shake(200, 0.004);
        }
        if (type === 'cheese') {
          sfx.cheese();
          this.toast.show(`Cheese! ${d.count}/30`, COLORS.gold);
        }
      });
    }
    if (music) wantSong(music);
    this.cameras.main.fadeIn(300, 26, 18, 32);
    if (DEBUG) window.__game = this.game;
  }

  handleKey(e) {
    if (sfx.unlockAudio()) startWanted();
    if (e.repeat) return;
    switch (e.code) {
      case 'KeyM': {
        const muted = sfx.toggleMute();
        this.toast.show(muted ? 'Sound off' : 'Sound on', COLORS.cream);
        return;
      }
      case 'Escape':
        if (this.pausable && !this.transitioning) this.openPause();
        return;
      case 'Space':
        if (this.dialogue.active) this.dialogue.advance();
        else if (!this.locked && !this.transitioning) this.onSpace?.();
        return;
      case 'ShiftLeft':
      case 'ShiftRight':
        if (!this.dialogue.active && !this.transitioning && !this.locked) this.onShift?.();
        return;
      case 'KeyR':
        if (!this.dialogue.active && !this.transitioning && !this.locked) this.onRestart?.();
        return;
      default:
        break;
    }
    if (!DEBUG) return;
    if (WARPS[e.code]) {
      this.go(WARPS[e.code]);
    } else if (e.code === 'KeyG') {
      addMP(100);
      this.toast.show('DEBUG +100 MP', COLORS.green);
    } else if (e.code === 'KeyC') {
      allCheeseIds().forEach((id) => collectCheese(id));
    } else if (e.code === 'KeyF') {
      this.debugComplete?.();
    }
  }

  openPause() {
    if (this.scene.isActive('Pause')) return;
    this.scene.launch('Pause', { from: this.scene.key });
    this.scene.pause();
  }

  // Fade out then start another scene.
  go(key, data = {}) {
    if (this.transitioning) return;
    this.transitioning = true;
    this.locked = true;
    this.cameras.main.fadeOut(300, 26, 18, 32);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      if (['Hub', 'Farm', 'Castle', 'Caves'].includes(key)) setLocation(key, data);
      this.scene.start(key, data);
    });
  }

  // ---- async helpers for cutscenes ----
  say(lines) {
    return this.dialogue.show(lines);
  }

  wait(ms) {
    return new Promise((r) => this.time.delayedCall(ms, r));
  }

  tweenP(cfg) {
    return new Promise((r) => this.tweens.add({ ...cfg, onComplete: () => r() }));
  }

  async cutscene(fn) {
    this.locked = true;
    try { await fn(); } finally { this.locked = false; }
  }

  popText(x, y, str, color = COLORS.white, { rise = 14, duration = 800, scale = 1, ui = false } = {}) {
    const t = addText(this, x, y, str, { center: true, color, depth: 1400, scale, ui });
    if (!ui) t.setScrollFactor(1);
    this.tweens.add({ targets: t, y: y - rise, alpha: 0, duration, ease: 'Quad.Out', onComplete: () => t.destroy() });
    return t;
  }

  // Squash-and-stretch + "OINK!" pop text. Returns false if on cooldown.
  snortFx(sprite) {
    const now = this.time.now;
    if (this.lastSnort && now - this.lastSnort < 300) return false;
    this.lastSnort = now;
    sfx.oink();
    const sx = sprite.scaleX, sy = sprite.scaleY;
    this.tweens.add({
      targets: sprite, scaleX: sx * 1.3, scaleY: sy * 0.75, duration: 70, yoyo: true,
      onComplete: () => sprite.setScale(sx, sy),
    });
    this.popText(sprite.x, sprite.y - sprite.displayHeight - 8, 'OINK!', COLORS.pink);
    return true;
  }

  sparkleBurst(x, y, texture = 'dot_gold', count = 10) {
    const p = this.add.particles(x, y, texture, {
      speed: { min: 20, max: 60 }, lifespan: 500, quantity: count, alpha: { start: 1, end: 0 }, emitting: false,
    }).setDepth(1300);
    p.explode(count);
    this.time.delayedCall(700, () => p.destroy());
  }

  hearts(x, y, count = 8, depth = 1300) {
    for (let i = 0; i < count; i++) {
      const h = this.add.image(x, y, i % 2 ? 'heart' : 'heart_small').setDepth(depth);
      const ang = Phaser.Math.FloatBetween(-Math.PI * 0.9, -Math.PI * 0.1);
      const dist = Phaser.Math.Between(20, 60);
      this.tweens.add({
        targets: h, x: x + Math.cos(ang) * dist, y: y + Math.sin(ang) * dist - 10, alpha: 0,
        duration: Phaser.Math.Between(700, 1200), ease: 'Quad.Out', onComplete: () => h.destroy(),
      });
    }
  }
}

export { state };
