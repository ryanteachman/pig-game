// Mr. Big Pig's Farm: four pranks in any order, then the Great Eating Contest.
import Phaser from 'phaser';
import Overworld, { tx, ty } from './Overworld.js';
import { FARM_MAP } from '../levels/maps.js';
import { COLORS } from '../ui/text.js';
import { state, doPrank, hasPrank, setFlag, save, PRANKS, completeArea } from '../state.js';
import * as sfx from '../audio/sfx.js';

const HOME = { x: 272, y: 192 };
const BASKET = { x: 280, y: 226 };
const SCARECROW = { x: tx(25), y: ty(7) };
const TROUGH = { x: 144, y: 256 };
const TOWEL = { x: 184, y: 256 };
const BELL = { x: tx(27), y: ty(13) };
const TABLE = { x: 376, y: 288 };
const HAT_LANDING = { x: 328, y: 206 };
const MUD_TILES = [[10, 14], [11, 14], [12, 14], [10, 15], [11, 15], [12, 15], [13, 15], [10, 16], [11, 16], [12, 16]];

export default class FarmScene extends Overworld {
  constructor() {
    super('Farm');
  }

  create(data = {}) {
    const spawn = data.spawn === 'contest'
      ? { x: HOME.x - 30, y: HOME.y + 20, facing: 'right' }
      : { x: 24, y: 11 * 16 + 8, facing: 'right' };
    this.createWorld({ map: FARM_MAP, area: 'farm', spawn, music: 'farm' });
    this.addExit(0, 10 * 16, 6, 32, () => this.go('Hub', { spawn: 'farm' }));

    // Props
    this.addProp('umbrella', TOWEL.x + 18, TOWEL.y - 2, { solid: [4, 4] });
    this.towel = this.addProp('towel', TOWEL.x, TOWEL.y, { depth: 0 });
    this.trough = this.addProp(state.flags.mud ? 'trough_tipped' : 'trough', TROUGH.x, TROUGH.y, { solid: [28, 8] });
    if (state.flags.mud) this.applyMud(false);
    this.scarecrow = this.addProp('scarecrow', SCARECROW.x, SCARECROW.y, { solid: [12, 6] });
    this.scarecrowHat = this.add.image(SCARECROW.x, SCARECROW.y - 24, 'straw_hat').setOrigin(0.5, 1).setDepth(SCARECROW.y + 1).setVisible(!!state.flags.hatOnScarecrow);
    this.bell = this.addProp('bell', BELL.x, BELL.y, { solid: [6, 4] });
    this.addProp('table', TABLE.x, TABLE.y, { solid: [28, 8] });
    this.basket = this.addProp(hasPrank('farm_snack') ? 'basket_empty' : 'basket', BASKET.x, BASKET.y, { solid: [14, 6] });

    // Mr. Big Pig
    this.bigPig = this.addNPC({ key: this.homeTexture(), x: HOME.x, y: HOME.y, solid: [28, 12], bob: false });
    this.bigPig.noStartle = true;
    this.hatOnHead = !state.flags.hatOff;
    this.hat = this.add.image(HOME.x, HOME.y - 26, 'straw_hat').setOrigin(0.5, 1).setVisible(this.hatOnHead);
    this.groundHat = this.add.image(HAT_LANDING.x, HAT_LANDING.y, 'straw_hat').setOrigin(0.5, 1).setDepth(HAT_LANDING.y)
      .setVisible(state.flags.hatOff && !state.flags.hatOnScarecrow && state.carrying !== 'straw_hat');
    this.butterfly = this.add.sprite(HOME.x, 118, 'butterfly_0').play('butterfly_flap').setDepth(400);
    this.distracted = true;
    this.bigPigBusy = false;
    this.cycleAt = this.time.now + 4500;

    // Interactions
    this.addInteract(HOME.x, HOME.y - 10, () => this.talkBigPig(), { r: 26, top: HOME.y - 36 });
    this.addInteract(BASKET.x, BASKET.y - 6, () => this.snackHeist(), { enabled: () => !hasPrank('farm_snack') });
    this.addInteract(HAT_LANDING.x, HAT_LANDING.y - 4, () => this.pickHat(), { enabled: () => this.groundHat.visible });
    this.addInteract(SCARECROW.x, SCARECROW.y - 4, () => this.scarecrowSwap(), { top: SCARECROW.y - 34 });
    this.addInteract(TROUGH.x, TROUGH.y - 6, () => this.mudSurprise(), { r: 24, enabled: () => !hasPrank('farm_mud') });
    this.addInteract(BELL.x, BELL.y - 4, () => this.dinnerBell(), { top: BELL.y - 26 });
    this.addInteract(TABLE.x, TABLE.y - 6, () => this.talk([['mrpig', 'A lovely table. Set for a dinner that is definitely, absolutely coming. Hee hee.']]), { r: 22 });
    this.addInteract(TOWEL.x, TOWEL.y - 8, () => this.talk([['mrpig', state.flags.mud ? 'Now THAT is a mud bath.' : "Big Pig's favorite sunbathing spot. Right next to the water trough..."]]), { enabled: () => true });

    this.arrival(data);
  }

  homeTexture() {
    return state.flags.mud ? 'bigpig_muddy' : 'bigpig_0';
  }

  talk(lines) {
    return this.cutscene(() => this.say(lines));
  }

  farmPranksDone() {
    return PRANKS.farm.slice(0, 4).every((p) => hasPrank(p.id));
  }

  async arrival(data) {
    await this.wait(350);
    if (data.fromContest) {
      await this.talk([
        ['bigpig', 'That was the best contest ever. Even if my pie was... crunchy.'],
        ['bigpig', 'Wait. Was my pie CARDBOARD?... ...It was still delicious.'],
        ['bigpig', 'Okay, Mr. Pig. You win. You are a real menace. Go show that castle knight how it is done.'],
      ]);
      this.toast.show('Farm complete! Head back to the village', COLORS.gold);
      return;
    }
    if (!state.flags.farmIntro) {
      setFlag('farmIntro');
      await this.talk([
        ['bigpig', 'Oh, hi Mr. Pig. I am watching a butterfly. It is very... flappy.'],
        ['mrpig', '(Hee hee. Four perfect pranks are just waiting to happen on this farm.)'],
        ['mrpig', '(His snack basket... his hat... that water trough... and that dinner bell.)'],
      ]);
      this.toast.show('ESC shows your prank checklist', COLORS.cream);
    }
  }

  // ------------------------------------------------------------------ Big Pig behaviour
  updateWorld(time) {
    const bp = this.bigPig;
    if (this.hatOnHead) this.hat.setPosition(bp.x, bp.y - 26).setDepth(bp.depth + 1);
    // butterfly flutters above the flowerbed
    this.butterfly.setPosition(HOME.x - 16 + Math.sin(time / 700) * 26, 116 + Math.sin(time / 260) * 6);
    if (!this.allDoneToast && !state.done.farm && !this.locked && this.farmPranksDone()) {
      this.allDoneToast = true;
      this.toast.show('All farm pranks done! Talk to Mr. Big Pig', COLORS.pink);
    }
    if (this.bigPigBusy || state.done.farm) return;
    if (time > this.cycleAt) {
      this.distracted = !this.distracted;
      this.cycleAt = time + (this.distracted ? 4500 : 2600);
      if (!this.distracted) this.popText(bp.x, bp.y - 40, '?', COLORS.white, { rise: 6 });
      else this.popText(bp.x, bp.y - 40, '♥', COLORS.pink, { rise: 10 });
    }
    bp.setTexture(this.distracted ? 'bigpig_back' : this.homeTexture());
    bp.setY(HOME.y - (Math.floor(time / 600) % 2));
  }

  bigPigFacing(front = true) {
    this.bigPig.setTexture(front ? this.homeTexture() : 'bigpig_back');
  }

  async talkBigPig() {
    if (state.done.farm) {
      return this.talk([['bigpig', 'Want to watch the butterfly with me? It is still very flappy.']]);
    }
    this.bigPigBusy = true;
    this.bigPigFacing(true);
    if (this.farmPranksDone()) {
      await this.talk([
        ['bigpig', 'Mr. Pig... my snacks vanished. My hat is on a scarecrow. My sunbathing spot is MUD.'],
        ['bigpig', 'And the dinner bell lied to me. Was that... all you?'],
        ['mrpig', 'Hee hee. Maybe.'],
        ['bigpig', "Hmm. Annarose likes mischief... but I'm the most mischievous pig. I'm sure of it."],
        ['bigpig', 'Let us settle this the farm way. THE GREAT EATING CONTEST!'],
      ]);
      this.go('EatingContest');
      return;
    }
    const n = PRANKS.farm.slice(0, 4).filter((p) => hasPrank(p.id)).length;
    await this.talk([
      ['bigpig', n === 0 ? 'I am very mischievous, you know. This morning I ate breakfast... TWICE.' : 'Is it just me, or is today a very strange day?'],
      ['bigpig', 'Annarose is going to cuddle ME. The most mischievous pig. Probably. Mmm, snacks.'],
    ]);
    this.bigPigBusy = false;
  }

  async snackHeist() {
    if (this.bigPigBusy) return;
    if (!this.distracted) {
      this.bigPigBusy = true;
      this.bigPigFacing(true);
      await this.talk([['bigpig', "Oh! Hi, Mr. Pig. That's my snack basket. Hooves off, please. I am watching it. And the butterfly."]]);
      this.bigPigBusy = false;
      this.cycleAt = this.time.now + 1500;
      return;
    }
    await this.cutscene(async () => {
      this.bigPigBusy = true;
      this.basket.setTexture('basket_empty');
      sfx.chomp(); await this.wait(150); sfx.chomp(); await this.wait(150); sfx.chomp();
      this.sparkleBurst(BASKET.x, BASKET.y - 8, 'dot_gold', 8);
      doPrank('farm_snack', 10, 'Snack Heist');
      await this.say([['mrpig', 'Nom nom nom. Hee hee. Apples, bread, and a little cheese. Delicious.']]);
      await this.wait(300);
      this.bigPigFacing(true);
      this.popText(this.bigPig.x, this.bigPig.y - 40, '!', COLORS.gold);
      await this.say([
        ['bigpig', 'Hm? My snack basket is... empty?'],
        ['bigpig', 'Did my snacks... evaporate? It IS very sunny today. Poor little snacks.'],
      ]);
      this.bigPigBusy = false;
      this.distracted = false;
      this.cycleAt = this.time.now + 1500;
    });
  }

  async onSnort(x, y) {
    const bp = this.bigPig;
    if (this.bigPigBusy || Math.hypot(bp.x - x, bp.y - 16 - y) > 50) return;
    this.bigPigBusy = true;
    await this.cutscene(async () => {
      const y0 = bp.y;
      await this.tweenP({ targets: bp, y: y0 - 10, yoyo: true, duration: 140 });
      if (this.hatOnHead) {
        this.hatOnHead = false;
        state.flags.hatOff = true;
        save();
        sfx.whoosh();
        await this.tweenP({ targets: this.hat, x: HAT_LANDING.x, y: HAT_LANDING.y, angle: 360, duration: 600, ease: 'Quad.Out' });
        this.hat.setVisible(false).setAngle(0);
        this.groundHat.setVisible(true);
        this.bigPigFacing(true);
        await this.say([
          ['bigpig', 'WHOA! Oh, it was just a hiccup. Hic.'],
          ['bigpig', '...Hey, where did my hat go? Oh well. Hats come back. Like boomerangs.'],
        ]);
        this.toast.show('His hat flew off! Pick it up with SPACE', COLORS.gold);
      } else {
        this.bigPigFacing(true);
        await this.say([['bigpig', 'Gah! Mr. Pig, you snort like a tractor. A very cute tractor.']]);
      }
    });
    this.bigPigBusy = false;
  }

  pickHat() {
    if (state.carrying) return this.talk([['mrpig', 'My hooves are full!']]);
    this.groundHat.setVisible(false);
    state.carrying = 'straw_hat';
    save();
    sfx.select();
    this.toast.show('Got Big Pig\'s hat! Now... the scarecrow', COLORS.gold);
  }

  async scarecrowSwap() {
    if (hasPrank('farm_scarecrow')) {
      return this.talk([['mrpig', 'Looking sharp, Mr. Scarecrow. Very Big-Pig-ish. Hee hee.']]);
    }
    if (state.carrying !== 'straw_hat') {
      return this.talk([['mrpig', state.flags.hatOff ? 'This scarecrow needs a hat. I know just the one.' : 'A scarecrow with no hat. If only Big Pig\'s hat would fly off... maybe if something STARTLED him?']]);
    }
    await this.cutscene(async () => {
      state.carrying = null;
      state.flags.hatOnScarecrow = true;
      this.scarecrowHat.setVisible(true);
      sfx.select();
      doPrank('farm_scarecrow', 10, 'Scarecrow Swap');
      await this.wait(400);
      this.bigPigBusy = true;
      this.bigPigFacing(true);
      await this.walkSprite(this.bigPig, SCARECROW.x - 30, SCARECROW.y + 26, 45, 'bigpig_walk');
      this.bigPig.setTexture(this.homeTexture());
      await this.say([
        ['bigpig', 'Huh? Who is that handsome fella?'],
        ['bigpig', 'He is wearing MY hat. ...He has great taste. We have the same great taste.'],
        ['bigpig', 'Hello, friend! ...He is very quiet. I like him. You keep the hat, buddy.'],
      ]);
      await this.walkSprite(this.bigPig, HOME.x, HOME.y, 45, 'bigpig_walk');
      this.bigPigBusy = false;
    });
  }

  applyMud(animate = true) {
    MUD_TILES.forEach(([x, y]) => this.setTile(x, y, 'm'));
    this.towel?.setVisible(false);
    if (animate) {
      const p = this.add.particles(TROUGH.x + 30, TROUGH.y - 8, 'dot_water', {
        speed: { min: 30, max: 90 }, angle: { min: -40, max: 40 }, lifespan: 600, quantity: 30, emitting: false, gravityY: 120,
      }).setDepth(2000);
      p.explode(40);
      this.time.delayedCall(800, () => p.destroy());
    }
  }

  async mudSurprise() {
    await this.cutscene(async () => {
      this.trough.setTexture('trough_tipped');
      sfx.splash();
      this.applyMud(true);
      state.flags.mud = true;
      save();
      this.cameras.main.shake(200, 0.004);
      await this.wait(500);
      await this.say([['mrpig', 'Oops! Hee hee. The water went right onto his sunbathing spot.']]);
      this.bigPigBusy = true;
      this.bigPigFacing(true);
      await this.walkSprite(this.bigPig, TOWEL.x + 6, TOWEL.y - 2, 50, 'bigpig_walk');
      this.bigPig.setTexture('bigpig_0');
      await this.say([
        ['bigpig', 'My sunbathing spot! It is... it is...'],
        ['bigpig', 'It is MUD!'],
      ]);
      await this.tweenP({ targets: this.bigPig, angle: 15, yoyo: true, repeat: 2, duration: 150 });
      const p = this.add.particles(this.bigPig.x, this.bigPig.y - 4, 'dot_mud', {
        speed: { min: 20, max: 60 }, angle: { min: 200, max: 340 }, lifespan: 500, quantity: 20, emitting: false, gravityY: 150,
      }).setDepth(2000);
      p.explode(24);
      this.bigPig.setTexture('bigpig_muddy');
      doPrank('farm_mud', 10, 'Mud Surprise');
      await this.say([
        ['bigpig', 'This is the BEST DAY OF MY LIFE. A mud bath! Right where I like to lie!'],
        ['mrpig', '...He loves it. That still counts as a prank. Right? Hee hee.'],
      ]);
      await this.walkSprite(this.bigPig, HOME.x, HOME.y, 50, 'bigpig_walk');
      this.bigPig.setTexture(this.homeTexture());
      this.bigPigBusy = false;
    });
  }

  async dinnerBell() {
    if (hasPrank('farm_bell')) {
      return this.talk([['mrpig', "I'd better not ring it again. He might actually cry. Or worse... bring a fork."]]);
    }
    await this.cutscene(async () => {
      sfx.ring();
      await this.tweenP({ targets: this.bell, angle: 8, yoyo: true, repeat: 3, duration: 80 });
      this.bell.setAngle(0);
      this.bigPigBusy = true;
      this.bigPigFacing(true);
      this.popText(this.bigPig.x, this.bigPig.y - 40, '!!', COLORS.gold);
      await this.say([['bigpig', 'DINNER?! DINNER! I am coming, dinner!']]);
      await this.walkSprite(this.bigPig, TABLE.x, TABLE.y - 12, 110, 'bigpig_walk');
      this.bigPig.setTexture(this.homeTexture());
      await this.wait(400);
      await this.say([
        ['bigpig', '...'],
        ['bigpig', 'There is no dinner. There is only... table.'],
        ['bigpig', '*grumble grumble* That is my tummy. It is very disappointed in the bell.'],
      ]);
      doPrank('farm_bell', 10, 'Dinner Bell');
      await this.say([['mrpig', 'Hee hee hee. Ding ding!']]);
      await this.walkSprite(this.bigPig, HOME.x, HOME.y, 40, 'bigpig_walk');
      this.bigPig.setTexture(this.homeTexture());
      this.bigPigBusy = false;
    });
  }

  debugComplete() {
    PRANKS.farm.forEach((p) => doPrank(p.id, p.mp, p.name));
    completeArea('farm');
    this.toast.show('DEBUG: Farm complete', COLORS.green);
  }
}
void Phaser;
