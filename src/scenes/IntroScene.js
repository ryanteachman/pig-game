// Mr. Pig's mud-hut bedroom. Teaches WASD, Space and Shift, then heads out to the village.
import Overworld, { tx, ty, Follower } from './Overworld.js';
import { INTRO_MAP } from '../levels/maps.js';
import { showControlsCard } from '../ui/ControlsCard.js';
import { COLORS } from '../ui/text.js';
import { setFlag, state } from '../state.js';
import * as sfx from '../audio/sfx.js';

export default class IntroScene extends Overworld {
  constructor() {
    super('Intro');
  }

  create() {
    this.createWorld({
      map: INTRO_MAP, area: 'intro', spawn: { x: tx(5), y: ty(4), facing: 'down' }, music: 'title', follower: false,
    });
    this.addProp('bed', tx(3), ty(3), { solid: [14, 14] });
    this.addProp('lamp', tx(16), ty(2), { solid: [6, 4] });
    this.addProp('chest', tx(7), ty(2), { solid: [14, 8] });
    this.addProp('hay', tx(17), ty(8), { solid: [14, 10] });
    this.stone = this.addNPC({ key: 'stone_asleep', x: tx(15), y: ty(5), bob: false, solid: [12, 8] });
    this.stone.noStartle = true;
    this.zTimer = this.time.addEvent({ delay: 1000, loop: true, callback: () => this.puffZ() });
    this.addInteract(tx(15), ty(5) - 8, () => this.talkStone(), { top: ty(5) - 16 });

    this.addExit(tx(9) - 8, ty(10) - 6, 32, 6, () => this.go('Hub', { spawn: 'hut' }), () => this.ready);
    this.addInteract(tx(9) + 8, ty(9), () => this.doorHint(), { enabled: () => !this.ready, top: ty(9) - 8 });

    this.cutscene(async () => {
      await this.wait(400);
      await this.say([
        'Once upon a time, in a little mud-hut in Pig Village...',
        ['mrpig', 'Mmmh. What a lovely morning for mischief. Hee hee.'],
      ]);
      const card = showControlsCard(this, { title: 'How to Play' });
      await new Promise((r) => this.input.keyboard.once('keydown-SPACE', r));
      sfx.select();
      card.destroy();
      await this.wait(300);
      sfx.bump(); await this.wait(180); sfx.bump();
      await this.say(['*Knock knock!* Something slides under the door...']);
      this.letter = this.addProp('letter', tx(9) + 8, ty(9) + 6);
      this.tweens.add({ targets: this.letter, y: ty(9) - 4, duration: 500, ease: 'Quad.Out' });
      this.letterSpot = this.addInteract(tx(9) + 8, ty(9) - 8, () => this.readLetter(), { enabled: () => !this.letterRead });
      await this.wait(500);
      await this.say([['mrpig', 'Ooh, mail! Nobody ever sends me mail. Except the mud-of-the-month club.']]);
      this.toast.show('Walk with W A S D, read with SPACE', COLORS.gold);
    });
  }

  puffZ() {
    if (!this.stone?.visible) return;
    this.popText(this.stone.x + 6, this.stone.y - 18, 'z', COLORS.blue, { rise: 14, duration: 1400 });
  }

  async readLetter() {
    this.letterRead = true;
    this.letter.destroy();
    await this.cutscene(async () => {
      await this.say([
        'HEAR YE, HEAR YE! By royal(ish) decree:',
        'Annarose will only cuddle with THE MOST MISCHIEVOUS PIG IN THE LAND.',
        'P.S. Mr. Big Pig says it is him. Sir Oinks A Lot says it is him. Oink.',
        ['mrpig', 'Big Pig? Mischievous? He once apologized to a puddle for stepping in it.'],
        ['mrpig', "And Sir Oinks A Lot's idea of a prank is saying \"oink\" a bit louder."],
        ['mrpig', "Hee hee. The most mischievous pig in the land is obviously ME. Time to prove it."],
        ['mrpig', 'First, I need my partner in crime. The Shleepy Stone is still snoozing...'],
      ]);
    });
    this.toast.show('Press SHIFT to SNORT and wake her!', COLORS.pink);
    setFlag('introLetter');
  }

  async talkStone() {
    if (this.stoneAwake) return;
    await this.cutscene(() => this.say([['stone', 'Zzz... five more minutes... zzz... maybe six...']]));
    if (this.letterRead) this.toast.show('A good loud SNORT (SHIFT) should do it', COLORS.pink);
  }

  onSnort() {
    if (this.stoneAwake) return;
    if (!this.letterRead) {
      this.cutscene(() => this.say([['stone', 'Mmf... zzz... not yet, Mr. Pig... it is still... zzz...']]));
      return;
    }
    this.wakeStone();
  }

  async wakeStone() {
    this.stoneAwake = true;
    this.zTimer.remove();
    sfx.wake();
    this.stone.setTexture('stone_awake');
    await this.tweenP({ targets: this.stone, y: this.stone.y - 8, yoyo: true, duration: 140 });
    await this.cutscene(async () => {
      await this.say([
        ['stoneAwake', "Mmh? Mr. Pig! Is it breakfast? Is it a quest? Is it a breakfast quest?"],
        ['mrpig', "It's a MISCHIEF quest. We're going to prank Mr. Big Pig and Sir Oinks A Lot!"],
        ['mrpig', 'Then Annarose will see who the most mischievous pig in the land really is.'],
        ['stoneAwake', "Ooh, I love pranks. And I love Annarose. And I love... zzz..."],
        ['stoneAwake', "...I'm up! I'm up. Lead the way. I'll follow right behind you."],
      ]);
    });
    this.stone.solid.on = false;
    this.stone.destroy();
    this.follower = new Follower(this, tx(15), ty(5), false);
    this.ready = true;
    setFlag('stoneAwake');
    this.toast.show('Head out the door!', COLORS.gold);
    void state;
  }

  doorHint() {
    this.cutscene(() => this.say([['mrpig', this.letterRead ? "Can't leave without the Shleepy Stone. SNORT to wake her!" : 'I should read that letter first.']]));
  }

  debugComplete() {
    this.go('Hub', { spawn: 'hut' });
  }
}
