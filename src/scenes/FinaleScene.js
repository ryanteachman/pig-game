// Finale: Annarose's house. The rivals' weak "pranks", the montage, the final prank
// (a surprise birthday party), the cuddle, the cheese callout, and the final message.
import Phaser from 'phaser';
import BaseScene from './BaseScene.js';
import { FINALE_MAP, LEGEND } from '../levels/maps.js';
import { addText, panel, COLORS } from '../ui/text.js';
import { FONT_KEY } from '../ui/font.js';
import { state, settings, saveSettings, addMP, RANKS, cheeseCount, TOTAL_CHEESE, rankName, rankIndex, setFlag } from '../state.js';
import * as sfx from '../audio/sfx.js';
import { wantSong } from '../audio/music.js';

export const FINAL_MESSAGE = 'Annarose I love you so much. Happy Birthday.';

const MONTAGE = [
  { caption: 'The Snack Heist', sprites: [['bigpig_back', -14, 0], ['basket_empty', 18, 4]] },
  { caption: 'The Scarecrow Swap', sprites: [['scarecrow', 0, 6], ['straw_hat', 0, -18]] },
  { caption: 'The Mud Surprise', sprites: [['bigpig_muddy', 0, 0]] },
  { caption: 'The Dinner Bell', sprites: [['bell', -20, 4], ['table', 14, 4]] },
  { caption: 'The Great Eating Contest', sprites: [['pie_cardboard', 0, 0], ['bigpig_happy', 0, -14]] },
  { caption: 'Pink Armor', sprites: [['armor_stand_pink', -12, 4], ['oinks_pink_down_0', 14, 0]] },
  { caption: 'The Banner Swap', sprites: [['banner_doodle', 0, 4]] },
  { caption: 'The Helmet Hide', sprites: [['well', 0, 4], ['helmet', 0, -26]] },
  { caption: 'The Royal Whoopee Cushion', sprites: [['throne', 0, 4], ['whoopee', 0, -8]] },
  { caption: 'The Joust', sprites: [['hobby_horse', -8, 4], ['pig_side_0', 0, -4]] },
  { caption: 'The Bad Dreams', sprites: [['stone_awake', -14, 0], ['blob_0', 16, -6]] },
];

export default class FinaleScene extends BaseScene {
  constructor() {
    super('Finale');
  }

  create(data = {}) {
    // the room
    const rt = this.add.renderTexture(0, 0, 320, 176).setOrigin(0).setDepth(-1000);
    FINALE_MAP.forEach((row, y) => [...row].forEach((ch, x) => rt.draw(`t_${(LEGEND[ch] || LEGEND.o).tile}`, x * 16, y * 16)));
    this.add.rectangle(0, 176, 320, 4, 0x2a1b2d).setOrigin(0);
    this.add.image(40, 64, 'lamp').setOrigin(0.5, 1);
    this.add.image(282, 64, 'lamp').setOrigin(0.5, 1);
    this.add.image(250, 50, 'chest').setOrigin(0.5, 1);
    this.add.image(64, 50, 'bed').setOrigin(0.5, 1);

    this.anna = this.add.sprite(160, 62, 'anna_0').setOrigin(0.5, 1).setDepth(62);
    this.bigPig = this.add.image(76, 120, 'bigpig_0').setOrigin(0.5, 1).setDepth(120);
    this.oinks = this.add.image(244, 116, 'oinks_pink_down_0').setOrigin(0.5, 1).setDepth(116);
    this.pig = this.add.sprite(160, 200, 'pig_up_0').setOrigin(0.5, 1).setDepth(150);
    this.stone = this.add.image(176, 210, 'stone_awake').setOrigin(0.5, 1).setDepth(150);

    this.initBase({ music: 'finale', pausable: true });
    this.hud.setVisible(false);
    if (data.skipToMessage) {
      this.locked = true;
      this.finalMessage();
    } else {
      this.cutscene(() => this.play());
    }
  }

  async walk(s, x, y, ms = 900, anim = null) {
    if (anim) s.play(anim, true);
    await this.tweenP({ targets: s, x, y, duration: ms, onUpdate: () => s.setDepth(s.y) });
    s.anims?.stop();
  }

  async play() {
    // Mr. Pig and the Stone walk in
    this.walk(this.stone, 182, 132, 1300);
    await this.walk(this.pig, 160, 130, 1300, 'pig_walk_up');
    this.pig.setTexture('pig_up_0');
    await this.say([
      ['anna', 'Well, well, well. Mr. Big Pig. Sir Oinks A Lot. And... Mr. Pig.'],
      ['anna', 'So. You ALL think you are the most mischievous pig in the land. Hmm.'],
      ['anna', 'I am very hard to impress. Show me your best prank. Big Pig, you first.'],
    ]);
    await this.hop(this.bigPig);
    await this.say([
      ['bigpig', 'I... ate a whole pie?'],
      ['anna', "That's... just lunch, Big Pig."],
      ['bigpig', 'It was a very big pie.'],
    ]);
    await this.hop(this.oinks);
    await this.say([
      ['oinksPink', 'My lady! Behold my greatest prank: I said "oink" at a duck. Oink.'],
      ['anna', 'Did the duck at least jump?'],
      ['oinksPink', '...It did not. It just looked at me. Oink.'],
      ['anna', 'Unimpressive. Both of you. Very unimpressive.'],
      ['anna', 'Mr. Pig? I suppose it is your turn. Go on. Impress me. If you can.'],
      ['mrpig', 'Hee hee. Where do I even start?'],
    ]);
    await this.montage();
    await this.say([
      ['anna', '...'],
      ['anna', 'Okay. That is... actually a lot of pranks. Not bad, Mr. Pig. Not bad at all.'],
      ['anna', 'But a REAL menace always saves one final prank. Do you have one?'],
      ['mrpig', 'Hee hee. Just one.'],
    ]);
    await this.finalPrank();
    await this.cuddle();
    await this.cheeseCallout();
    await this.finalMessage();
  }

  async hop(s) {
    await this.tweenP({ targets: s, y: s.y - 6, yoyo: true, duration: 120 });
  }

  async montage() {
    const shade = this.add.rectangle(0, 0, 320, 180, 0x1a1220, 0).setOrigin(0).setDepth(3000);
    await this.tweenP({ targets: shade, fillAlpha: 0.92, duration: 400 });
    const frame = panel(this, 90, 26, 140, 96, { depth: 3001, fill: 0x3a2a5e, border: 0xf2c230 });
    const title = addText(this, 160, 8, "Mr. Pig's Greatest Hits", { center: true, color: COLORS.gold, depth: 3002 });
    const caption = addText(this, 160, 108, '', { center: true, color: COLORS.white, depth: 3002 });
    // the big Mischief Meter
    const meterBg = this.add.rectangle(40, 140, 240, 8, 0x3a2a5e).setOrigin(0).setDepth(3002);
    const meter = this.add.rectangle(41, 141, 0, 6, 0xf2a7b8).setOrigin(0).setDepth(3003);
    const rank = addText(this, 160, 152, rankName(), { center: true, color: COLORS.pink, depth: 3002 });
    const legendary = RANKS[RANKS.length - 1].mp;
    const target = Math.max(state.mp, legendary) + 25;
    const startMp = state.mp;
    const setMeter = (mp) => {
      meter.width = Math.min(238, Math.round((238 * mp) / target));
      rank.setText(rankName(mp));
    };
    setMeter(startMp);
    let shown = [];
    for (let i = 0; i < MONTAGE.length; i++) {
      const m = MONTAGE[i];
      shown.forEach((s) => s.destroy());
      shown = m.sprites.map(([key, dx, dy]) => this.add.image(160 + dx * 2, 92 + dy * 2, key).setOrigin(0.5, 1).setScale(2).setDepth(3003));
      shown.forEach((s) => { s.setAlpha(0); this.tweens.add({ targets: s, alpha: 1, duration: 150 }); });
      caption.setText(m.caption);
      sfx.prank();
      const mp = startMp + ((target - startMp) * (i + 1)) / MONTAGE.length;
      this.tweens.addCounter({ from: meter.width ? (meter.width * target) / 238 : startMp, to: mp, duration: 600, onUpdate: (tw) => setMeter(tw.getValue()) });
      await this.wait(1150);
    }
    shown.forEach((s) => s.destroy());
    addMP(target - state.mp);
    setMeter(target);
    caption.setText('');
    rank.setText(RANKS[RANKS.length - 1].name.toUpperCase()).setScale(1);
    this.tweens.add({ targets: rank, scale: 1.0, alpha: 0.4, yoyo: true, repeat: 3, duration: 150 });
    sfx.fanfare();
    this.cameras.main.shake(300, 0.006);
    const crown = this.add.image(160, 92, 'pig_down_0').setOrigin(0.5, 1).setScale(3).setDepth(3003);
    const c2 = this.add.image(160, 50, 'crown').setScale(2).setDepth(3004);
    this.sparkleBurst(160, 60, 'dot_gold', 20);
    await this.wait(2200);
    [frame, title, caption, meterBg, meter, rank, crown, c2].forEach((o) => o.destroy());
    await this.tweenP({ targets: shade, fillAlpha: 0, duration: 400 });
    shade.destroy();
    void rankIndex;
  }

  async finalPrank() {
    this.pig.setTexture('pig_down_0');
    this.lastSnort = 0;
    this.snortFx(this.pig);
    await this.wait(300);
    sfx.lightsOut();
    const dark = this.add.rectangle(0, 0, 320, 180, 0x050307, 1).setOrigin(0).setDepth(1990); // above the HUD (1500), below the dialogue box (2000)
    await this.wait(600);
    await this.say([
      ['anna', 'Hey! Who turned off the lights?!'],
      ['bigpig', 'I am scared of the dark. And also hungry.'],
      ['oinksPink', 'Do not panic! I am... a little panicked. Oink!'],
      ['stoneAwake', '*whisper* Now?  ...Now!'],
    ]);
    // set up the party while it's dark
    this.party = [];
    const balloons = ['balloon_red', 'balloon_blue', 'balloon_yellow', 'balloon_purple'];
    for (let i = 0; i < 10; i++) {
      const b = this.add.image(20 + i * 31, 40 + (i % 3) * 8, balloons[i % 4]).setDepth(70);
      this.tweens.add({ targets: b, y: b.y - 4, yoyo: true, repeat: -1, duration: 700 + i * 50, ease: 'Sine.InOut' });
      this.party.push(b);
    }
    const cake = this.add.image(120, 92, 'cake').setOrigin(0.5, 1).setDepth(96);
    const table = this.add.image(120, 100, 'table').setOrigin(0.5, 1).setDepth(95);
    this.party.push(cake, table);
    this.bigPig.setPosition(110, 128).setTexture('bigpig_happy').setDepth(128);
    this.oinks.setPosition(214, 124).setDepth(124);
    this.pig.setPosition(150, 140);
    this.stone.setPosition(176, 140);
    this.anna.setPosition(176, 98).setDepth(98);
    // a bunting banner
    const g = this.add.graphics().setDepth(60);
    const cols = [0xe2575e, 0xf2c230, 0x2f62d0, 0xf2a7b8, 0x7a58a8];
    for (let i = 0; i < 20; i++) { g.fillStyle(cols[i % 5]); g.fillTriangle(i * 16, 28, i * 16 + 14, 28, i * 16 + 7, 38); }
    const sign = addText(this, 160, 6, 'HAPPY BIRTHDAY ANNAROSE!', { center: true, color: COLORS.gold, depth: 2400, ui: false });
    void sign;

    await this.wait(400);
    dark.destroy();
    sfx.surprise();
    wantSong('finale');
    const surprise = addText(this, 160, 34, 'SURPRISE!', { center: true, scale: 3, color: COLORS.pink, depth: 2600 });
    this.tweens.add({ targets: surprise, scale: 3.4, yoyo: true, repeat: 2, duration: 200, onComplete: () => this.tweens.add({ targets: surprise, alpha: 0, delay: 800, duration: 400 }) });
    this.confetti = this.add.particles(0, -4, 'confetti', {
      frame: [0, 1, 2, 3, 4, 5, 6, 7],
      x: { min: 0, max: 320 }, speedY: { min: 30, max: 70 }, speedX: { min: -20, max: 20 }, rotate: { min: 0, max: 360 },
      lifespan: 4000, frequency: 40,
    }).setDepth(2300);
    this.cameras.main.shake(300, 0.005);
    [this.bigPig, this.oinks, this.pig, this.stone].forEach((s, i) => this.tweens.add({ targets: s, y: s.y - 5, yoyo: true, repeat: 5, duration: 160, delay: i * 60 }));
    await this.wait(1600);
    await this.say([
      ['anna', 'A... a surprise birthday party? For ME?'],
      ['bigpig', 'Mr. Pig planned the whole thing. We just brought the cake. I only ate a little of it.'],
      ['oinksPink', 'Happy birthday, my lady! OINK OINK HOORAY!'],
      ['stoneAwake', 'Happy birth... zzz... DAY! Happy birthday, Annarose!'],
      ['mrpig', "Hee hee. Happy birthday, Annarose. Gotcha."],
    ]);
  }

  async cuddle() {
    this.anna.setTexture('anna_laugh');
    sfx.prank();
    await this.say([
      ['annaLaugh', 'Hahaha! Okay, okay. You got me. You REALLY got me.'],
      ['annaLaugh', 'Mr. Pig, I hereby declare you... THE MOST MISCHIEVOUS PIG IN THE LAND!'],
      ['annaLaugh', 'Now come here, you little menace.'],
    ]);
    await this.walk(this.anna, 160, 136, 700, 'anna_walk');
    this.anna.setTexture('anna_laugh');
    this.pig.setTexture('pig_down_0');
    await this.tweenP({ targets: this.pig, x: 160, y: 128, duration: 300 });
    this.pig.setDepth(140);
    sfx.heartBurst();
    this.cameras.main.shake(200, 0.004);
    for (let i = 0; i < 3; i++) {
      this.hearts(160, 110, 14, 2600);
      await this.wait(350);
    }
    const big = this.add.image(160, 90, 'heart').setScale(0).setDepth(2600);
    await this.tweenP({ targets: big, scale: 5, alpha: 0.9, duration: 500, ease: 'Back.Out' });
    this.tweens.add({ targets: big, alpha: 0, scale: 7, duration: 600, delay: 400 });
    setFlag('cuddled');
    await this.say([['mrpig', '...Best. Prank. Ever. Hee hee.']]);
  }

  async cheeseCallout() {
    const n = cheeseCount();
    if (n >= TOTAL_CHEESE) {
      await this.say([
        ['annaLaugh', `Wait... you found ${n} of ${TOTAL_CHEESE} cheeses?! ALL of them?!`],
        ['annaLaugh', 'You really do know the way to my heart. Everybody, get in here! GROUP CUDDLE!'],
      ]);
      // bonus cuddle pile
      sfx.heartBurst();
      await Promise.all([
        this.walk(this.bigPig, 136, 140, 600),
        this.walk(this.oinks, 186, 140, 600),
        this.walk(this.stone, 168, 146, 600),
      ]);
      for (let i = 0; i < 6; i++) {
        this.hearts(150 + Phaser.Math.Between(-30, 30), 116, 16, 2600);
        if (i % 2 === 0) sfx.heartBurst();
        await this.wait(300);
      }
      await this.say([['bigpig', 'This is the best day of my life. Again.'], ['oinksPink', 'Oink. ♥']]);
    } else {
      await this.say([
        ['anna', `And you found ${n} of ${TOTAL_CHEESE} cheeses! Mmm, thank you.`],
        ['anna', n >= 20 ? 'So close! Next time bring me ALL of them. Hee hee.' : 'Next time... bring me MORE cheese. A girl has needs.'],
      ]);
    }
  }

  async finalMessage() {
    await this.wait(600);
    const fade = this.add.rectangle(0, 0, 320, 180, 0xfcd3dc, 0).setOrigin(0).setDepth(4000);
    await this.tweenP({ targets: fade, fillAlpha: 1, duration: 1200 });
    this.confetti?.stop();
    // soft background with floating hearts and pigs
    const g = this.add.graphics().setDepth(4001);
    [0xfcd3dc, 0xf9c4d2, 0xf5b5c8, 0xf2a7b8, 0xe998b0, 0xdf8aa8].forEach((c, i) => { g.fillStyle(c); g.fillRect(0, i * 30, 320, 30); });
    const floaters = ['heart', 'heart_small', 'pig_down_0', 'heart', 'stone_awake', 'heart_small', 'oinks_pink_down_0', 'anna_laugh', 'cheese'];
    for (let i = 0; i < 18; i++) {
      const key = floaters[i % floaters.length];
      const s = this.add.image(Phaser.Math.Between(10, 310), 200 + Phaser.Math.Between(0, 180), key).setDepth(4002).setAlpha(0.55);
      this.tweens.add({ targets: s, y: -30, duration: Phaser.Math.Between(9000, 15000), repeat: -1, delay: i * 400, onRepeat: () => { s.y = 200; s.x = Phaser.Math.Between(10, 310); } });
    }
    settings.crown = true;
    saveSettings();

    // The message: one bitmap text holding exactly FINAL_MESSAGE; characters are revealed one
    // at a time by hiding the not-yet-typed glyphs, so the layout never jumps.
    const t = this.add.dynamicBitmapText(160, 0, FONT_KEY, FINAL_MESSAGE, 16).setOrigin(0.5, 0).setCenterAlign().setMaxWidth(260).setDepth(4005);
    t.setTint(0x7a2a52);
    t.setY(90 - t.height / 2);
    let shown = 0;
    t.setDisplayCallback((d) => {
      if (d.index >= shown) d.scale = 0;
      return d;
    });
    this.finalText = t;
    await this.wait(600);
    for (let i = 0; i <= FINAL_MESSAGE.length; i++) {
      shown = i;
      if (FINAL_MESSAGE[i - 1] && FINAL_MESSAGE[i - 1] !== ' ') sfx.blip('anna');
      await this.wait(FINAL_MESSAGE[i - 1] === '.' ? 500 : 110);
    }
    shown = Infinity;
    this.finalDone = true;
    this.time.addEvent({ delay: 700, loop: true, callback: () => {
      const h = this.add.image(Phaser.Math.Between(40, 280), Phaser.Math.Between(40, 150), 'heart').setDepth(4004).setScale(0);
      this.tweens.add({ targets: h, scale: 1.5, alpha: 0, duration: 1200, onComplete: () => h.destroy() });
    } });
    const hint = addText(this, 160, 164, 'press space', { center: true, color: COLORS.dark, depth: 4006, shadow: false });
    hint.setAlpha(0);
    this.tweens.add({ targets: hint, alpha: 0.5, delay: 2500, duration: 1000 });
    this.locked = false;
    this.awaitingCredits = true;
  }

  onSpace() {
    if (this.awaitingCredits && this.finalDone && !this.transitioning) {
      this.awaitingCredits = false;
      sfx.select();
      this.go('Credits');
    }
  }

  debugComplete() {
    // skip straight to the final message
    if (this.finalDone) return;
    this.scene.restart({ skipToMessage: true });
  }
}
