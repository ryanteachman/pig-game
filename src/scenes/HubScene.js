// Pig Village: paths to the Farm (east), Castle (north), Caves (west) and Annarose's house (south).
import Overworld, { tx, ty } from './Overworld.js';
import { HUB_MAP } from '../levels/maps.js';
import { COLORS } from '../ui/text.js';
import { state, doPrank, hasPrank, setFlag, allBigPranksDone } from '../state.js';
import * as sfx from '../audio/sfx.js';

const SPAWNS = {
  hut: { x: tx(5), y: ty(5), facing: 'down' },
  farm: { x: 34 * 16, y: 12 * 16 + 8, facing: 'left' },
  castle: { x: 18 * 16, y: ty(1) + 4, facing: 'down' },
  caves: { x: 40, y: 12 * 16 + 8, facing: 'right' },
  anna: { x: 18 * 16, y: ty(22), facing: 'down' },
};

export default class HubScene extends Overworld {
  constructor() {
    super('Hub');
  }

  create(data = {}) {
    const spawn = SPAWNS[data.spawn] || SPAWNS.hut;
    this.createWorld({ map: HUB_MAP, area: 'hub', spawn, music: 'title' });

    // Exits
    this.addExit(35 * 16 + 4, 11 * 16, 12, 32, () => this.go('Farm', { spawn: 'hub' }));
    this.addExit(16 * 16, 0, 64, 8, () => this.go('Castle', { room: 'courtyard', entry: 'south' }), () => state.done.farm);
    this.addExit(0, 11 * 16, 6, 32, () => this.go('Caves', { room: 0 }), () => state.done.castle);

    this.addInteract(tx(5), ty(4) + 4, () => this.talk([['mrpig', 'My cozy mud-hut. No time for naps today. That is the Stone\'s job.']]), { top: ty(4) - 16 });
    this.addInteract(tx(29), ty(4) + 4, () => this.talk([['narrator', 'A sign on the door: "Gone truffle hunting. Back whenever."']]), { top: ty(4) - 16 });

    // Annarose's house
    this.addProp('signpost', tx(20) + 4, ty(22), { solid: [10, 4] });
    this.addInteract(tx(20) + 4, ty(22) - 6, () => this.talk([
      "ANNAROSE'S HOUSE. Only the MOST mischievous may enter.",
      '(No salespigs. No knights who say oink. Cheese deliveries welcome.)',
    ]));
    this.addInteract(18 * 16, ty(21) + 4, () => this.annaDoor(), { top: ty(21) - 16 });
    if (allBigPranksDone()) this.doorSparkle();

    // Castle gate guard (blocks the north path until the Farm is done)
    const gx = state.done.farm ? tx(21) : 18 * 16;
    const gy = state.done.farm ? ty(2) : ty(1);
    this.gateGuard = this.addNPC({ key: 'guard_down_0', x: gx, y: gy, solid: state.done.farm ? [12, 6] : [48, 8] });
    this.addInteract(gx, gy - 8, () => this.talkGuard(), { top: gy - 22 }).sprite = this.gateGuard;
    this.guardSpot = this.interactables[this.interactables.length - 1];

    // Sleepy boulder blocking the caves (until the Castle is done)
    if (!state.done.castle) {
      this.boulder = this.addProp('rock', 18, 13 * 16 + 4, { solid: [28, 34] }).setScale(2.2);
      this.addInteract(28, 12 * 16, () => this.talkBoulder(), { r: 26, top: 12 * 16 - 20 });
    }

    // Villagers
    const truffle = this.addNPC({ key: 'vg_down_0', x: tx(11), y: ty(9), name: 'villagerG' });
    this.addInteract(truffle.x, truffle.y - 8, () => this.talkTruffle());
    const granny = this.addNPC({ key: 'vr_down_0', x: tx(9), y: ty(19), name: 'villagerR' });
    this.addInteract(granny.x, granny.y - 8, () => this.talkGranny());
    const pip = this.addNPC({ key: 'vp_down_0', x: tx(25), y: ty(13), name: 'villagerP' });
    this.addInteract(pip.x, pip.y - 8, () => this.talkPip());

    // Napping villager (tutorial prank)
    this.napper = this.addNPC({ key: 'vg_down_0', x: tx(23), y: ty(5) - 2, bob: false, solid: [16, 8] });
    this.napper.noStartle = true;
    if (!hasPrank('hub_nap')) {
      this.napper.setAngle(-90).setOrigin(0.5, 0.6);
      this.napZ = this.time.addEvent({ delay: 1100, loop: true, callback: () => this.popText(this.napper.x + 8, this.napper.y - 14, 'z', COLORS.blue, { duration: 1300 }) });
    }
    this.addInteract(this.napper.x, this.napper.y - 6, () => this.talkNapper());

    this.arrival(data);
  }

  talk(lines) {
    return this.cutscene(() => this.say(lines));
  }

  async arrival(data) {
    await this.wait(350);
    if (!state.flags.hubIntro) {
      setFlag('hubIntro');
      await this.talk([
        ['stoneAwake', 'Ahh, Pig Village. Where to first, Mr. Pig?'],
        ['mrpig', "Mr. Big Pig's farm is to the EAST. He's first on my list. Hee hee."],
        ['stoneAwake', 'Ooh. And I heard there is cheese hidden all over the land... Look for sparkles... zzz...'],
      ]);
      this.toast.show('Head EAST to the Farm', COLORS.gold);
      return;
    }
    if (state.done.farm && !state.flags.castleOpened) {
      setFlag('castleOpened');
      await this.talk([
        ['guard', "Halt! Oh, it's you. Word travels fast: you pranked Mr. Big Pig silly!"],
        ['guard', 'Sir Oinks A Lot has... reluctantly... opened the castle to you. Oink.'],
      ]);
      await this.walkSprite(this.gateGuard, tx(21), ty(2), 50);
      this.gateGuard.solid.w = 12; this.moveSolid(this.gateGuard, 12, 6);
      this.guardSpot.x = this.gateGuard.x; this.guardSpot.y = this.gateGuard.y - 8; this.guardSpot.top = this.gateGuard.y - 22;
      this.toast.show('The Castle (NORTH) is open!', COLORS.gold);
      return;
    }
    if (state.done.castle && !state.flags.cavesOpened) {
      setFlag('cavesOpened');
      await this.talk([
        ['stoneAwake', 'Mr. Pig! The boulder by the west path... that is my cousin Gerald.'],
        ['stoneAwake', 'He only moves for true menaces. After that castle caper... I think you qualify.'],
      ]);
      return;
    }
    if (allBigPranksDone() && !state.flags.houseOpened) {
      setFlag('houseOpened');
      await this.talk([
        ['stoneAwake', "Mr. Pig... I hear music coming from Annarose's house, to the SOUTH."],
        ['mrpig', "This is it. Time to show her who the most mischievous pig in the land is. Hee hee."],
      ]);
      this.toast.show("Annarose's house (SOUTH) is open!", COLORS.pink);
    }
  }

  updateWorld() {
    // Gerald the boulder rolls away once the castle is done (checked live for debug completes too).
    if (this.boulder && state.done.castle && !this.boulderMoving) {
      this.boulderMoving = true;
      sfx.push();
      this.tweens.add({ targets: this.boulder, x: 20, y: 9 * 16 + 4, angle: -180, duration: 900, onComplete: () => {
        this.boulder.solid.on = false;
        this.boulder.setDepth(this.boulder.y);
        this.toast.show('The Caves (WEST) are open!', COLORS.gold);
      } });
    }
  }

  talkGuard() {
    if (!state.done.farm) {
      return this.talk([
        ['guard', 'Halt! None may enter Sir Oinks A Lot\'s castle! Oink.'],
        ['guard', 'Only pigs of PROVEN mischief. Go prank Mr. Big Pig at the farm first. Oink.'],
      ]);
    }
    return this.talk([['guard', 'Go on through, prankster. And please, be gentle with Sir Oinks. He bruises easily. Oink.']]);
  }

  talkBoulder() {
    if (state.done.castle) return;
    return this.talk([
      'A big, sleepy boulder blocks the path to the Shleepy Caves.',
      ['stoneAwake', 'Cousin Gerald! Wake up! ...Nope. He only moves for true menaces.'],
      ['stoneAwake', 'Prank the farm AND the castle first, and he will roll right over. Zzz...'],
    ]);
  }

  async annaDoor() {
    if (allBigPranksDone()) {
      await this.talk([['mrpig', 'Here goes. Deep breath. Most. Mischievous. Pig. Hee hee.']]);
      this.go('Finale');
      return;
    }
    const left = ['farm', 'castle', 'caves'].filter((a) => !state.done[a]).length;
    await this.talk([
      'The door is locked tight.',
      ['mrpig', `Only the MOST mischievous may enter... I still have ${left} big prank${left === 1 ? '' : 's'} to pull off.`],
    ]);
  }

  doorSparkle() {
    this.time.addEvent({ delay: 500, loop: true, callback: () => {
      const s = this.add.image(18 * 16 + Math.random() * 20 - 10, ty(21) - Math.random() * 16, 'sparkle').setDepth(2000);
      this.tweens.add({ targets: s, alpha: 0, y: s.y - 8, duration: 700, onComplete: () => s.destroy() });
    } });
  }

  talkTruffle() {
    const lines = state.done.castle
      ? [['villagerG', 'You pranked a KNIGHT? Respect. I once pranked a turnip. It did not notice.']]
      : state.done.farm
        ? [['villagerG', 'I heard Big Pig ate a cardboard pie and asked for seconds. Legend.']]
        : [['villagerG', 'Morning, Mr. Pig! I planted a joke in my garden.'], ['villagerG', "It hasn't come up yet. Needs more mud."]];
    return this.talk(lines);
  }

  talkGranny() {
    return this.talk([
      ['villagerR', 'Back in my day we pranked with REAL mud. Uphill. Both ways.'],
      ['villagerR', 'Annarose? Oh, she is a tough one to impress. She once out-pranked a goose.'],
    ]);
  }

  talkPip() {
    return this.talk(state.done.farm
      ? [['villagerP', 'Sir Oinks A Lot says "oink" four hundred times a day. I counted. Twice.']]
      : [['villagerP', 'Psst! Hidden cheese twinkles. Look for little sparkles in odd corners!']]);
  }

  talkNapper() {
    if (!hasPrank('hub_nap')) {
      return this.talk([['villagerG', 'Zzz... truffles... zzz... so many truffles...'], ['mrpig', 'Hee hee. A good SNORT would really wake him up...']]);
    }
    return this.talk([['villagerG', "Next time you wake me up, bring truffles. That's the rule."]]);
  }

  async onSnort(x, y) {
    if (hasPrank('hub_nap') || this.napperBusy) return;
    if (Math.hypot(this.napper.x - x, this.napper.y - y) > 48) return;
    this.napperBusy = true;
    this.napZ?.remove();
    await this.cutscene(async () => {
      this.napper.setAngle(0).setOrigin(0.5, 1);
      await this.tweenP({ targets: this.napper, y: this.napper.y - 12, yoyo: true, duration: 160 });
      this.popText(this.napper.x, this.napper.y - 24, 'WAH!', COLORS.gold);
      doPrank('hub_nap', 5, 'Startle the Napper');
      await this.wait(400);
      await this.say([
        ['villagerG', "WAH! A BEAR! A HUNGRY BEAR!... Oh. It's you, Mr. Pig."],
        ['villagerG', 'I was dreaming about truffles. Big ones. And you SNORTED them away.'],
        ['mrpig', 'Hee hee. Practice prank. Gotta warm up the snorter.'],
      ]);
    });
  }

  debugComplete() {
    this.toast.show('DEBUG: nothing to complete in the village', COLORS.green);
  }
}
