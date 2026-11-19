// The Shleepy Caves: four push-puzzle rooms (rules in levels/sokoban.js).
// Mr. Pig moves one tile at a time. Inputs are buffered so quick taps (or a replayed
// solution) are never lost. R restarts the room instantly.
import Phaser from 'phaser';
import BaseScene from './BaseScene.js';
import { CAVE_ROOMS } from '../levels/caves.js';
import { parseRoom, step, platesCovered, SLEEP_AFTER } from '../levels/sokoban.js';
import { caveCheeseSpots } from '../levels/cheese.js';
import { addText, panel, COLORS } from '../ui/text.js';
import { state, doPrank, hasPrank, collectCheese, setFlag, completeArea, PRANKS } from '../state.js';
import * as sfx from '../audio/sfx.js';

const T = 16;
const MOVE_MS = 105;
const KEY_DIRS = { KeyW: 'U', KeyS: 'D', KeyA: 'L', KeyD: 'R' };

export default class CavesScene extends BaseScene {
  constructor() {
    super('Caves');
  }

  create(data = {}) {
    this.roomIndex = Math.min(data.room ?? 0, CAVE_ROOMS.length - 1);
    this.def = CAVE_ROOMS[this.roomIndex];
    this.room = parseRoom(this.def.grid);
    this.ox = Math.floor((320 - this.room.w * T) / 2);
    this.oy = Math.floor((180 - this.room.h * T) / 2) + 8;
    this.drawRoom();

    this.player = this.add.sprite(0, 0, 'pig_down_0').setOrigin(0.5, 1);
    this.stone = this.add.sprite(0, 0, 'stone_awake').setOrigin(0.5, 1);
    this.rockSprites = this.room.start.rocks.map(() => this.add.image(0, 0, 'rock').setOrigin(0.5, 1));

    panel(this, 112, 2, 96, 22, { depth: 1500, alpha: 0.82 });
    this.title = addText(this, 160, 4, `Room ${this.roomIndex + 1} of 4`, { center: true, color: COLORS.gold, depth: 1501 });
    this.movesText = addText(this, 160, 13, '', { center: true, color: COLORS.white, depth: 1501 });

    this.queue = [];
    this.input.keyboard.on('keydown', (e) => {
      if (e.repeat) return;
      const d = KEY_DIRS[e.code];
      if (d) this.enqueue(d);
    });
    this.initBase({ music: 'caves' });
    this.resetRoom();
    this.intro();
  }

  drawRoom() {
    const rt = this.add.renderTexture(0, 0, 320, 180).setOrigin(0).setDepth(-1000);
    for (let y = 0; y < 12; y++) for (let x = 0; x < 20; x++) rt.draw('t_darkness', x * T, y * T);
    this.plateImgs = new Map();
    const { grid } = this.def;
    grid.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const c = row[x];
        const px = this.ox + x * T, py = this.oy + y * T;
        if (c === '#') { rt.draw('t_caveWall', px, py); continue; }
        rt.draw('t_caveFloor', px, py);
        if ('_so'.includes(c)) this.plateImgs.set(y * this.room.w + x, this.add.image(px, py, 't_plate').setOrigin(0).setDepth(-900));
        if (c === 'X') {
          this.crystal = this.add.image(px + 8, py + 16, hasPrank('caves_mustache') ? 'crystal_mustache' : 'crystal').setOrigin(0.5, 1).setDepth(py + 16);
          this.crystalCell = y * this.room.w + x;
        }
        if (c === 'm') this.add.image(px + 8, py + 16, 'mushroom').setOrigin(0.5, 1).setDepth(py + 16);
      }
    });
    const ex = this.room.exit;
    this.door = this.add.image(this.ox + (ex % this.room.w) * T, this.oy + Math.floor(ex / this.room.w) * T, 't_caveDoor').setOrigin(0).setDepth(-850);
    // soft glow particles
    this.add.particles(0, 0, 'dot_purple', {
      x: { min: 0, max: 320 }, y: { min: 0, max: 180 }, lifespan: 3000, speedY: { min: -6, max: -2 },
      alpha: { start: 0.6, end: 0 }, frequency: 300, quantity: 1,
    }).setDepth(-800);
    // cheese
    this.cheeseSprites = [];
    for (const c of caveCheeseSpots(this.roomIndex)) {
      if (state.cheese[c.id]) continue;
      const s = this.add.image(this.ox + c.x * T + 8, this.oy + c.y * T + 10, 'cheese').setDepth(this.oy + c.y * T + 8);
      s.cell = c.y * this.room.w + c.x;
      s.cheeseId = c.id;
      this.tweens.add({ targets: s, y: s.y - 2, yoyo: true, repeat: -1, duration: 600 });
      this.cheeseSprites.push(s);
    }
    // bat (Room 2)
    if (this.def.bat) {
      const [bx, by] = this.def.bat;
      const hasHat = !hasPrank('caves_bat');
      this.bat = this.add.sprite(this.ox + bx * T + 8, this.oy + by * T + 14, 'bat_0').setDepth(500).setFlipY(true).play(hasHat ? 'bat_flap' : 'bat_nohat_flap');
      this.batCell = { x: bx, y: by };
    }
  }

  cellPos(k) {
    const x = k % this.room.w, y = Math.floor(k / this.room.w);
    return { x: this.ox + x * T + 8, y: this.oy + y * T + 16 };
  }

  resetRoom() {
    this.sok = { ...this.room.start, rocks: [...this.room.start.rocks] };
    this.moves = 0;
    this.moving = false;
    this.completed = false;
    this.queue = [];
    this.facing = 'down';
    this.syncSprites(true);
    this.updateHud();
  }

  syncSprites(instant = false) {
    const place = (sprite, k) => {
      const p = this.cellPos(k);
      if (instant) sprite.setPosition(p.x, p.y);
      else this.tweens.add({ targets: sprite, x: p.x, y: p.y, duration: MOVE_MS });
      sprite.setDepth(p.y);
    };
    place(this.player, this.sok.player);
    place(this.stone, this.sok.stone);
    this.sok.rocks.forEach((r, i) => place(this.rockSprites[i], r));
    const asleep = this.sok.pushes >= SLEEP_AFTER;
    this.stone.setTexture(asleep ? 'stone_asleep' : 'stone_awake');
    if (asleep && !this.zTimer) this.zTimer = this.time.addEvent({ delay: 800, loop: true, callback: () => this.popText(this.stone.x + 6, this.stone.y - 18, 'z', COLORS.blue, { rise: 12, duration: 1200 }) });
    if (!asleep && this.zTimer) { this.zTimer.remove(); this.zTimer = null; }
    // plates & door
    const occupied = new Set([this.sok.stone, ...this.sok.rocks]);
    for (const [k, img] of this.plateImgs) img.setTexture(occupied.has(k) ? 't_plateOn' : 't_plate');
    const open = platesCovered(this.room, this.sok);
    if (open !== this.doorOpen) {
      if (open && this.doorOpen === false) { sfx.sparkle(); this.toast.show('The door is open!', COLORS.gold); }
      this.doorOpen = open;
      this.door.setTexture(open ? 't_caveDoorOpen' : 't_caveDoor');
    }
  }

  updateHud() {
    const pushesLeft = Math.max(0, SLEEP_AFTER - this.sok.pushes);
    this.movesText.setText(`Moves ${this.moves}  ${pushesLeft ? 'z'.repeat(SLEEP_AFTER - pushesLeft) : 'ZZZ'}`);
  }

  async intro() {
    this.locked = true;
    await this.wait(300);
    const lines = [[`narrator`, this.def.name], ['narrator', this.def.hint]];
    if (this.roomIndex === 0 && !state.flags.cavesIntro) {
      setFlag('cavesIntro');
      lines.unshift(
        ['stoneAwake', 'Welcome to the Shleepy Caves... my home. Isn\'t it cozy? Glowing mushrooms, sparkly crystals...'],
        ['stoneAwake', 'The doors here only open when every glowing plate has something heavy on it. Like... me.'],
        ['mrpig', 'Push you? Are you sure?'],
        ['stoneAwake', 'I love being pushed. It is like a little ride. But it makes me... very... sleepy... zzz.'],
        ['mrpig', '(Hee hee. Even a cozy cave has room for a little mischief. Gentle mischief. She is my friend.)'],
        ['mrpig', '(A bat napping upside down in a hat... a SNORT would wake him right up.)'],
        ['mrpig', '(And one of these crystals is just begging for a mustache.)'],
      );
    }
    await this.say(lines);
    this.locked = false;
    this.toast.show('R restarts the room', COLORS.cream);
  }

  enqueue(a) {
    if (this.completed || this.transitioning) return;
    if (this.queue.length < 6) this.queue.push(a);
  }

  onShift() {
    this.enqueue('Z');
  }

  onSpace() {
    // Draw a mustache on the crystal if standing next to it.
    if (this.crystalCell === undefined || hasPrank('caves_mustache')) return;
    const w = this.room.w;
    const p = this.sok.player, c = this.crystalCell;
    if (Math.abs((p % w) - (c % w)) + Math.abs(Math.floor(p / w) - Math.floor(c / w)) !== 1) return;
    this.cutscene(async () => {
      sfx.select();
      this.crystal.setTexture('crystal_mustache');
      this.sparkleBurst(this.crystal.x, this.crystal.y - 8, 'dot_white', 10);
      doPrank('caves_mustache', 5, 'Crystal Mustache');
      await this.say([
        ['mrpig', 'A dashing mustache for a dashing crystal. Hee hee.'],
        ['stoneAwake', 'Mr. Pig! That crystal is my Aunt Quartzine! ...She looks distinguished. She approves.'],
      ]);
    });
  }

  onRestart() {
    if (this.completed) return;
    this.resetRoom();
    this.toast.show('Room restarted', COLORS.cream);
  }

  update(time) {
    if (this.moving || this.locked || this.dialogue.active || this.completed || this.transitioning) return;
    let a = this.queue.shift();
    if (!a) {
      // holding a direction keeps walking
      for (const [code, d] of Object.entries(KEY_DIRS)) {
        const key = this.keys[code.replace('Key', '')];
        if (key.isDown && time - key.timeDown > 220) { a = d; break; }
      }
    }
    if (a) this.act(a);
  }

  act(a) {
    const res = step(this.room, this.sok, a);
    if (a === 'Z') {
      this.snortFx(this.player);
      this.batCheck();
      if (res.event === 'wake') {
        this.sok = res.state;
        sfx.wake();
        this.tweens.add({ targets: this.stone, y: this.stone.y - 6, yoyo: true, duration: 120 });
        this.popText(this.stone.x, this.stone.y - 22, '!', COLORS.gold, { rise: 6 });
        this.syncSprites();
        this.updateHud();
      }
      return;
    }
    const dirName = { U: 'up', D: 'down', L: 'left', R: 'right' }[a];
    this.face(dirName);
    if (res.event === 'blocked') { sfx.bump(); return; }
    if (res.event === 'asleep') {
      sfx.bump();
      this.popText(this.stone.x, this.stone.y - 20, 'zzz...', COLORS.blue, { rise: 6 });
      if (!this.sleepHinted) { this.sleepHinted = true; this.toast.show('She is asleep! SNORT (SHIFT) next to her', COLORS.pink); }
      return;
    }
    this.sok = res.state;
    this.moves++;
    this.moving = true;
    this.player.play(`pig_walk_${dirName === 'left' || dirName === 'right' ? 'side' : dirName}`, true);
    this.time.delayedCall(MOVE_MS, () => {
      this.moving = false;
      this.player.anims.stop();
      this.face(dirName);
    });
    if (res.event === 'push' || res.event === 'pushStone' || res.event === 'sleep') sfx.push();
    if (res.event === 'sleep') this.onStoneSleep();
    this.syncSprites();
    this.updateHud();
    this.collectAt(this.sok.player);
    if (res.event === 'exit') this.complete();
  }

  face(dir) {
    const key = dir === 'left' || dir === 'right' ? 'side' : dir;
    this.player.setTexture(`pig_${key}_0`).setFlipX(dir === 'left');
  }

  onStoneSleep() {
    sfx.sleep();
    if (!state.flags.caveSleepTalk) {
      setFlag('caveSleepTalk');
      this.time.delayedCall(MOVE_MS + 20, () => this.cutscene(() => this.say([
        ['stone', 'Wheee... that was fun... three pushes... is my limit... zzz...'],
        ['mrpig', 'She fell asleep! Hee hee. I know just the cure: stand next to her and SNORT (SHIFT)!'],
      ])));
    }
  }

  collectAt(cell) {
    for (const c of this.cheeseSprites) {
      if (c.cell === cell && !c.got) {
        c.got = true;
        collectCheese(c.cheeseId);
        this.sparkleBurst(c.x, c.y);
        this.tweens.add({ targets: c, y: c.y - 14, alpha: 0, duration: 400, onComplete: () => c.destroy() });
      }
    }
  }

  batCheck() {
    if (!this.bat || hasPrank('caves_bat')) return;
    const p = this.sok.player, w = this.room.w;
    const dx = (p % w) - this.batCell.x, dy = Math.floor(p / w) - this.batCell.y;
    if (Math.hypot(dx, dy) > 2.6) return;
    this.cutscene(async () => {
      this.bat.play('bat_nohat_flap');
      const hat = this.add.image(this.bat.x, this.bat.y + 4, 'top_hat').setDepth(600);
      await this.tweenP({ targets: hat, y: this.bat.y + 30, angle: 200, duration: 500, ease: 'Bounce.Out' });
      doPrank('caves_bat', 5, 'Bat Hat Drop');
      await this.say([
        ['narrator', 'EEEK! The sleepy bat flaps awake and drops his tiny top hat.'],
        ['stoneAwake', 'That is Sir Flaps. He wears that hat to bed every day. ...Now he has hat hair. Hee hee.'],
      ]);
      this.tweens.add({ targets: hat, alpha: 0, duration: 800 });
    });
  }

  async complete() {
    this.completed = true;
    this.queue = [];
    sfx.fanfare();
    const n = this.roomIndex + 1;
    doPrank(`caves_room${n}`, 5, `Cave Room ${n}`);
    await this.wait(300);
    if (this.roomIndex < CAVE_ROOMS.length - 1) {
      this.go('Caves', { room: this.roomIndex + 1 });
    } else {
      await this.nookCutscene();
      this.go('Dream');
    }
  }

  async nookCutscene() {
    this.locked = true;
    const cx = 160, cy = 110;
    const shade = this.add.rectangle(0, 0, 320, 180, 0x1a1220, 0).setOrigin(0).setDepth(1000);
    await this.tweenP({ targets: shade, fillAlpha: 0.85, duration: 400 });
    const nook = this.add.image(cx, cy + 8, 'nook').setDepth(1001);
    const st = this.add.image(cx, cy + 4, 'stone_awake').setOrigin(0.5, 1).setDepth(1002).setScale(2);
    const pig = this.add.image(cx - 50, cy + 4, 'pig_side_0').setOrigin(0.5, 1).setDepth(1002).setScale(2);
    void nook;
    await this.say([
      ['stoneAwake', 'We made it... my cozy nook. Thank you for all the pushes, Mr. Pig.'],
      ['stoneAwake', 'I am so... so... sleepy... zzz...'],
    ]);
    st.setTexture('stone_asleep');
    sfx.sleep();
    await this.wait(800);
    this.tweens.add({ targets: st, angle: 4, yoyo: true, repeat: 5, duration: 120 });
    await this.say([
      ['mrpig', "Uh oh. She's tossing and turning... she's having bad dreams!"],
      ['mrpig', "Don't worry, Shleepy Stone. I'm coming in. Nobody bothers my best friend. Not even nightmares."],
    ]);
    await this.tweenP({ targets: pig, scale: 0, angle: 360, x: cx, y: cy - 6, duration: 600 });
  }

  debugComplete() {
    PRANKS.caves.slice(0, 6).forEach((p) => doPrank(p.id, p.mp, p.name));
    this.go('Dream');
  }
}
void Phaser;
void completeArea;
