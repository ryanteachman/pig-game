// Sir Oinks A Lot's Castle: four small stealth rooms, four pranks, then the Joust.
// Guards patrol with visible vision cones. Getting spotted just puts Mr. Pig back at the room
// entrance. Snorting near a guard (while unseen) makes him turn away for 3 seconds.
import Phaser from 'phaser';
import Overworld, { tx, ty } from './Overworld.js';
import { CASTLE_ROOMS } from '../levels/maps.js';
import { COLORS } from '../ui/text.js';
import { state, doPrank, hasPrank, setFlag, save, PRANKS, completeArea } from '../state.js';
import * as sfx from '../audio/sfx.js';

const ENTRIES = {
  courtyard: { south: { x: 160, y: 9 * 16 + 14, facing: 'up' }, north: { x: 160, y: 44, facing: 'down' } },
  hall: { south: { x: 160, y: 156, facing: 'up' }, north: { x: 160, y: 44, facing: 'down' }, west: { x: 22, y: 104, facing: 'right' } },
  armory: { east: { x: 298, y: 104, facing: 'left' } },
  throne: { south: { x: 160, y: 156, facing: 'up' } },
};

// Guard patrol routes (pixel waypoints) per room.
const GUARDS = {
  courtyard: [{ path: [[48, 96], [272, 96]], speed: 34 }],
  hall: [
    { path: [[232, 52], [232, 148]], speed: 30 },
    { path: [[36, 136], [132, 136]], speed: 28 },
  ],
  armory: [{ path: [[176, 52], [176, 148]], speed: 30 }],
  throne: [],
};

const CONE_LEN = 58;
const CONE_HALF = 0.5;

export default class CastleScene extends Overworld {
  constructor() {
    super('Castle');
  }

  create(data = {}) {
    this.roomName = data.room || 'courtyard';
    const entries = ENTRIES[this.roomName];
    this.entry = entries[data.entry] || Object.values(entries)[0];
    this.createWorld({ map: CASTLE_ROOMS[this.roomName], area: 'castle', room: this.roomName, spawn: this.entry, music: 'castle' });
    this.coneGfx = this.add.graphics().setDepth(5);
    this.guards = [];
    // Once Sir Oinks is beaten the guards stand down.
    if (!state.done.castle) for (const g of GUARDS[this.roomName]) this.addGuard(g);
    this[`setup_${this.roomName}`]();
    this.arrival(data);
  }

  talk(lines) {
    return this.cutscene(() => this.say(lines));
  }

  get oinksKey() {
    return hasPrank('castle_armor') ? 'oinksPink' : 'oinks';
  }

  castlePranksDone() {
    return PRANKS.castle.slice(0, 4).every((p) => hasPrank(p.id));
  }

  async arrival(data) {
    await this.wait(300);
    if (data.fromJoust) {
      await this.talk([
        [this.oinksKey, 'Defeated... by a piglet on a stick horse. In PINK armor. Oink.'],
        [this.oinksKey, 'Very well. You are a true menace, Mr. Pig. A magnificent, terrible menace. Oink!'],
        ['mrpig', 'Hee hee. Thank you, Sir Oinks. Your helmet is in the well, by the way.'],
        [this.oinksKey, 'I KNEW it was oinking at me! OINK!'],
      ]);
      this.toast.show('Castle complete! Head back to the village', COLORS.gold);
      return;
    }
    if (this.roomName === 'courtyard' && !state.flags.castleIntro) {
      setFlag('castleIntro');
      await this.talk([
        ['mrpig', "Sir Oinks A Lot's castle. Guards everywhere... Hee hee. Sneaky time."],
        ['mrpig', '(Four perfect pranks are hiding in here. Sir Oinks will never see them coming.)'],
        ['mrpig', '(His shiny armor... his heroic banner... his precious helmet... and his royal throne.)'],
        ['mrpig', '(The armory has a vat of PINK paint. And that well out here looks like a great hiding spot.)'],
        ['stoneAwake', 'Stay out of their yellow vision cones. If one is coming... a SNORT behind him makes him look away.'],
      ]);
      this.toast.show('Avoid the vision cones!', COLORS.gold);
    }
  }

  // ------------------------------------------------------------------ rooms
  setup_courtyard() {
    this.addExit(144, 172, 32, 6, () => this.go('Hub', { spawn: 'castle' }));
    this.addExit(144, 0, 32, 10, () => this.go('Castle', { room: 'hall', entry: 'south' }));
    this.well = this.addProp('well', tx(15), ty(7) + 2, { solid: [16, 8] });
    this.addInteract(tx(15), ty(7) - 2, () => this.helmetHide(), { top: ty(7) - 22 });
    this.addProp('banner', tx(4), 30, { depth: 1 });
    this.addProp('banner', tx(15), 30, { depth: 1 });
  }

  setup_hall() {
    this.addExit(144, 172, 32, 6, () => this.go('Castle', { room: 'courtyard', entry: 'north' }));
    this.addExit(144, 0, 32, 10, () => this.go('Castle', { room: 'throne', entry: 'south' }));
    this.addExit(0, 80, 6, 32, () => this.go('Castle', { room: 'armory', entry: 'east' }));
    this.banner = this.addProp(hasPrank('castle_banner') ? 'banner_doodle' : 'banner', tx(13), 34, { depth: 1 });
    this.addInteract(tx(13), ty(2) - 4, () => this.bannerSwap(), { top: 24 });
    this.addProp('lamp', tx(1), ty(3));
    this.addProp('lamp', tx(18), ty(3));
  }

  setup_armory() {
    this.addExit(314, 80, 6, 32, () => this.go('Castle', { room: 'hall', entry: 'west' }));
    this.armor = this.addProp(hasPrank('castle_armor') ? 'armor_stand_pink' : 'armor_stand', tx(3), ty(3) + 6, { solid: [12, 6] });
    this.addProp('paint_vat', tx(5), ty(3) + 6, { solid: [14, 8] });
    this.chest = this.addProp('chest', tx(15), ty(2) + 4, { solid: [14, 8] });
    this.addProp('armor_stand', tx(9), ty(2) + 6, { solid: [12, 6] });
    this.addProp('armor_stand', tx(12), ty(2) + 6, { solid: [12, 6] });
    this.addInteract(tx(4), ty(3) - 2, () => this.pinkArmor(), { r: 22, top: ty(3) - 28 });
    this.addInteract(tx(15), ty(2) + 2, () => this.openChest(), { top: ty(2) - 12 });
  }

  setup_throne() {
    this.addExit(144, 172, 32, 6, () => this.go('Castle', { room: 'hall', entry: 'north' }));
    this.throne = this.addProp('throne', 160, ty(2) + 4, { solid: [16, 6] });
    this.cushion = this.add.image(160, ty(2) - 2, 'whoopee').setDepth(ty(2) + 5).setVisible(!!state.flags.cushionPlaced && !hasPrank('castle_cushion'));
    // a mirror on the wall that Sir Oinks admires himself in
    const g = this.add.graphics().setDepth(2);
    g.fillStyle(0xf2c230); g.fillRoundedRect(tx(13) - 1, 6, 20, 26, 4);
    g.fillStyle(0x8fd0ee); g.fillRoundedRect(tx(13) + 2, 9, 14, 20, 3);
    g.fillStyle(0xfffaf0); g.fillRect(tx(13) + 5, 12, 2, 8);
    this.oinksSpot = { x: tx(13) + 9, y: ty(3) };
    this.oinks = this.addNPC({ key: hasPrank('castle_armor') ? 'oinks_pink_up' : 'oinks_up', x: this.oinksSpot.x, y: this.oinksSpot.y, solid: [12, 6] });
    this.oinks.noStartle = true;
    this.addInteract(this.oinksSpot.x, this.oinksSpot.y - 8, () => this.talkOinks(), { r: 22 });
    if (!hasPrank('castle_helmet') && state.carrying !== 'helmet') {
      this.helmetPedestal = this.add.image(tx(3), ty(3) - 6, 'helmet').setDepth(ty(3));
      this.tweens.add({ targets: this.helmetPedestal, y: this.helmetPedestal.y - 2, yoyo: true, repeat: -1, duration: 600 });
    }
    this.addProp('chest', tx(3), ty(3) + 8, { solid: [14, 8] });
    this.addInteract(tx(3), ty(3) - 2, () => this.takeHelmet(), { enabled: () => !!this.helmetPedestal?.visible, top: ty(3) - 20 });
    this.addInteract(160, ty(2) + 4, () => this.throneInteract(), { top: ty(2) - 20 });
    this.speechTimer = this.time.addEvent({ delay: 3500, loop: true, callback: () => {
      if (this.locked) return;
      const lines = ['Magnificent. Oink.', 'Such a noble snout.', 'Oink! Oink! ...Oink.', 'Who is the bravest? Me. Oink.'];
      this.popText(this.oinks.x, this.oinks.y - 22, Phaser.Utils.Array.GetRandom(lines), COLORS.grey, { rise: 6, duration: 1800 });
    } });
  }

  // ------------------------------------------------------------------ pranks
  async distantOinks(lines) {
    await this.say(lines.map((t) => [this.oinksKey, t]));
  }

  async pinkArmor() {
    if (hasPrank('castle_armor')) return this.talk([['mrpig', 'So pink. So shiny. So... Sir Oinks. Hee hee.']]);
    await this.cutscene(async () => {
      sfx.splash();
      this.sparkleBurst(this.armor.x, this.armor.y - 14, 'dot_pink', 16);
      await this.tweenP({ targets: this.armor, y: this.armor.y + 6, duration: 200, yoyo: true });
      this.armor.setTexture('armor_stand_pink');
      doPrank('castle_armor', 10, 'Pink Armor');
      await this.say([['mrpig', 'One dip in the pink paint vat... and voila! Hee hee.']]);
      await this.distantOinks([
        '(from far away) OINK?! WHO TURNED MY ARMOR PINK?!',
        '...Actually, it brings out my eyes. But I am still FURIOUS. Oink!',
      ]);
    });
    this.checkAll();
  }

  async bannerSwap() {
    if (hasPrank('castle_banner')) return this.talk([['mrpig', 'A true masterpiece. The likeness is uncanny.']]);
    await this.cutscene(async () => {
      sfx.whoosh();
      await this.tweenP({ targets: this.banner, scaleY: 0, duration: 200 });
      this.banner.setTexture('banner_doodle');
      await this.tweenP({ targets: this.banner, scaleY: 1, duration: 200 });
      doPrank('castle_banner', 10, 'Banner Swap');
      await this.say([['mrpig', 'Out with the heroic banner... in with my self-portrait. I nailed the snout.']]);
      await this.distantOinks([
        '(from the throne room) Guards! Why is there a PIGLET on my banner?!',
        'He is... he is very handsome, actually. But that is not the POINT. Oink!',
      ]);
    });
    this.checkAll();
  }

  async takeHelmet() {
    if (state.carrying) return this.talk([['mrpig', 'My hooves are full! I should drop this off first.']]);
    this.helmetPedestal.setVisible(false);
    state.carrying = 'helmet';
    save();
    sfx.select();
    this.toast.show('Got the helmet! Hide it somewhere sneaky...', COLORS.gold);
  }

  async helmetHide() {
    if (hasPrank('castle_helmet')) return this.talk([['narrator', 'From deep in the well: "...oink... oink..." It is the echo of a very shiny helmet.']]);
    if (state.carrying !== 'helmet') return this.talk([['mrpig', 'The old moat-side well. Very deep. Very echoey. A perfect hiding spot for... something.']]);
    await this.cutscene(async () => {
      state.carrying = null;
      const h = this.add.image(this.px, this.py - 20, 'helmet').setDepth(500);
      await this.tweenP({ targets: h, x: this.well.x, y: this.well.y - 12, duration: 300, ease: 'Quad.Out' });
      await this.tweenP({ targets: h, y: this.well.y - 4, scale: 0.4, alpha: 0, duration: 300 });
      h.destroy();
      sfx.splash();
      doPrank('castle_helmet', 10, 'Helmet Hide');
      await this.say(['*Plunk!*  ...oink... oink... oink... (the well echoes)']);
      await this.distantOinks([
        '(from the castle) Has anyone seen my HELMET?! I can hear it oinking at me. From SOMEWHERE. OINK!',
      ]);
    });
    this.checkAll();
  }

  async openChest() {
    if (state.flags.gotCushion) return this.talk([['narrator', 'The chest is empty now. Just a note: "Property of the Royal Prank Department (closed)."']]);
    if (state.carrying) return this.talk([['mrpig', 'My hooves are full!']]);
    sfx.select();
    state.carrying = 'whoopee';
    setFlag('gotCushion');
    await this.talk([
      ['narrator', 'Inside the chest: a royal whoopee cushion! Embroidered with a tiny crown.'],
      ['mrpig', "Hee hee. This belongs on a very important seat. A THRONE, maybe."],
    ]);
  }

  async throneInteract() {
    if (hasPrank('castle_cushion')) return this.talk([['mrpig', 'The throne of the royal trumpet. Hee hee.']]);
    if (state.carrying !== 'whoopee') return this.talk([['mrpig', "Sir Oinks's throne. It looks so... comfy. It's missing a little something."]]);
    await this.cutscene(async () => {
      state.carrying = null;
      state.flags.cushionPlaced = true;
      save();
      this.cushion.setVisible(true);
      sfx.select();
      await this.say([['mrpig', '(Placed it! Now to look very, very innocent.)']]);
      await this.walkPlayer(tx(6), ty(6));
      this.face('right');
      await this.wait(300);
      this.speechTimer.paused = true;
      this.oinks.setTexture(hasPrank('castle_armor') ? 'oinks_pink_down_0' : 'oinks_down_0');
      await this.say([[this.oinksKey, 'Ahh. Enough admiring myself. Time to rest my noble bottom upon my noble throne. Oink.']]);
      await this.walkSprite(this.oinks, 160, ty(2) + 6, 40);
      this.cushion.setVisible(false);
      sfx.pffft();
      this.cameras.main.shake(400, 0.008);
      this.popText(160, ty(2) - 24, 'PFFFFFT!', COLORS.pink, { rise: 20, duration: 1400, scale: 2 });
      await this.tweenP({ targets: this.oinks, y: this.oinks.y - 14, yoyo: true, duration: 200 });
      doPrank('castle_cushion', 10, 'Royal Whoopee Cushion');
      await this.say([
        [this.oinksKey, 'OINK?!'],
        [this.oinksKey, '...'],
        [this.oinksKey, 'That was... the royal trumpet. Yes. Very regal. Announcing... ME. Oink.'],
        ['mrpig', 'Hee hee hee hee.'],
      ]);
      await this.walkSprite(this.oinks, this.oinksSpot.x, this.oinksSpot.y, 40);
      this.oinks.setTexture(hasPrank('castle_armor') ? 'oinks_pink_up' : 'oinks_up');
      this.speechTimer.paused = false;
    });
    this.checkAll();
  }

  async talkOinks() {
    this.speechTimer.paused = true;
    this.oinks.setTexture(hasPrank('castle_armor') ? 'oinks_pink_down_0' : 'oinks_down_0');
    if (state.done.castle) {
      await this.talk([[this.oinksKey, 'A rematch? Never! I mean... later. My armor is still drying. Oink.']]);
    } else if (this.castlePranksDone()) {
      await this.talk([
        [this.oinksKey, 'YOU! Pink armor. My banner. My helmet. The... royal trumpet. It was YOU all along! Oink!'],
        ['mrpig', 'Hee hee. Guilty.'],
        [this.oinksKey, 'I, Sir Oinks A Lot, am the most mischievous pig in the land! I challenge you to a JOUST! OINK!'],
      ]);
      this.go('Joust');
      return;
    } else {
      await this.talk([
        [this.oinksKey, 'Ah, a visitor! Behold: Sir Oinks A Lot, bravest knight in the land. Oink.'],
        [this.oinksKey, 'And the MOST mischievous! Just yesterday I said "oink" during a very quiet moment. Oink!'],
        [this.oinksKey, 'Now begone, little pig. I must practice my speech for Annarose. Oink. Oink. Ahem. OINK.'],
      ]);
    }
    this.oinks.setTexture(hasPrank('castle_armor') ? 'oinks_pink_up' : 'oinks_up');
    this.speechTimer.paused = false;
  }

  checkAll() {
    if (this.castlePranksDone() && !state.done.castle) this.toast.show('All castle pranks done! Find Sir Oinks', COLORS.pink);
  }

  // ------------------------------------------------------------------ guards
  addGuard({ path, speed }) {
    const [sx, sy] = path[0];
    const s = this.add.sprite(sx, sy, 'guard_down_0').setOrigin(0.5, 1);
    const g = { sprite: s, path, speed, target: 1, dir: new Phaser.Math.Vector2(0, 1), distractedUntil: 0, x: sx, y: sy };
    this.guards.push(g);
    return g;
  }

  resetGuards() {
    for (const g of this.guards) {
      [g.x, g.y] = g.path[0];
      g.target = 1;
      g.distractedUntil = 0;
    }
  }

  updateWorld(time, delta, free) {
    this.coneGfx.clear();
    for (const g of this.guards) {
      const distracted = time < g.distractedUntil;
      if (!distracted && !this.locked) {
        const [txp, typ] = g.path[g.target];
        const dx = txp - g.x, dy = typ - g.y;
        const d = Math.hypot(dx, dy);
        const step = (g.speed * Math.min(delta, 50)) / 1000;
        if (d <= step) {
          g.x = txp; g.y = typ;
          g.target = (g.target + 1) % g.path.length;
        } else {
          g.x += (dx / d) * step;
          g.y += (dy / d) * step;
          g.dir.set(dx / d, dy / d);
        }
      }
      const s = g.sprite;
      s.setPosition(Math.round(g.x), Math.round(g.y)).setDepth(g.y);
      const ax = Math.abs(g.dir.x), ay = Math.abs(g.dir.y);
      const dirKey = ax > ay ? 'side' : g.dir.y < 0 ? 'up' : 'down';
      s.setFlipX(dirKey === 'side' && g.dir.x < 0);
      if (distracted || this.locked) s.anims.stop(), s.setTexture(`guard_${dirKey}_0`);
      else s.play(`guard_walk_${dirKey}`, true);
      this.drawCone(g, distracted);
      if (free && !this.caught && this.sees(g)) this.spotted(g);
    }
  }

  coneOrigin(g) {
    return { x: g.x, y: g.y - 8 };
  }

  drawCone(g, distracted) {
    const o = this.coneOrigin(g);
    const a = Math.atan2(g.dir.y, g.dir.x);
    const pts = [o];
    for (let i = 0; i <= 8; i++) {
      const t = a - CONE_HALF + (i / 8) * CONE_HALF * 2;
      const len = this.rayLength(o, t, CONE_LEN);
      pts.push({ x: o.x + Math.cos(t) * len, y: o.y + Math.sin(t) * len });
    }
    this.coneGfx.fillStyle(distracted ? 0x8db8ec : 0xf2c230, distracted ? 0.18 : 0.28);
    this.coneGfx.fillPoints(pts, true);
  }

  rayLength(o, angle, max) {
    for (let d = 4; d <= max; d += 4) {
      const x = o.x + Math.cos(angle) * d, y = o.y + Math.sin(angle) * d;
      const cx = Math.floor(x / 16), cy = Math.floor(y / 16);
      if (this.solidGrid[cy]?.[cx] !== false) return d;
    }
    return max;
  }

  sees(g) {
    const o = this.coneOrigin(g);
    const px = this.px, py = this.py - 5;
    const dx = px - o.x, dy = py - o.y;
    const dist = Math.hypot(dx, dy);
    if (dist > CONE_LEN || dist < 1) return dist < 7;
    const ang = Math.atan2(dy, dx) - Math.atan2(g.dir.y, g.dir.x);
    const diff = Math.abs(Math.atan2(Math.sin(ang), Math.cos(ang)));
    if (diff > CONE_HALF) return false;
    return this.rayLength(o, Math.atan2(dy, dx), dist) >= dist - 2;
  }

  async spotted(g) {
    this.caught = true;
    sfx.halt();
    g.dir.set(this.px - g.x, this.py - g.y).normalize();
    this.popText(g.x, g.y - 24, '!', COLORS.red, { rise: 8 });
    await this.cutscene(async () => {
      await this.say([['guard', Phaser.Utils.Array.GetRandom([
        'HALT! OINK! No piglets in the castle halls!',
        'HALT! OINK! Back to the entrance with you!',
        'HALT! OINK! ...You are very small. But still: HALT!',
      ])]]);
      this.cameras.main.fadeOut(200, 26, 18, 32);
      await this.wait(220);
      this.px = this.entry.x;
      this.py = this.entry.y;
      this.facing = this.entry.facing;
      this.resetGuards();
      if (this.follower) {
        this.follower.trail = [];
        this.follower.sprite.setPosition(this.px - 12, this.py + 2);
      }
      this.cameras.main.fadeIn(200, 26, 18, 32);
    });
    this.caught = false;
  }

  onSnort(x, y) {
    for (const g of this.guards) {
      const d = Math.hypot(g.x - x, g.y - 8 - y);
      if (d > 72 || this.sees(g)) continue;
      g.distractedUntil = this.time.now + 3000;
      // turn to look away from where Mr. Pig is
      g.dir.set(g.x - x, g.y - y).normalize();
      if (Math.abs(g.dir.x) > Math.abs(g.dir.y)) g.dir.set(Math.sign(g.dir.x), 0);
      else g.dir.set(0, Math.sign(g.dir.y));
      this.popText(g.x, g.y - 24, '?', COLORS.white, { rise: 8 });
      this.time.delayedCall(400, () => this.popText(g.x, g.y - 26, 'Who goes there?', COLORS.grey, { rise: 4, duration: 1200 }));
    }
  }

  debugComplete() {
    PRANKS.castle.forEach((p) => doPrank(p.id, p.mp, p.name));
    state.carrying = null;
    completeArea('castle');
    this.toast.show('DEBUG: Castle complete', COLORS.green);
  }
}
