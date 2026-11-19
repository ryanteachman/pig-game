// Pause menu overlay: Resume, Controls, Mute, Quit to Title + this area's prank checklist.
import Phaser from 'phaser';
import { addText, panel, COLORS } from '../ui/text.js';
import { showControlsCard } from '../ui/ControlsCard.js';
import { PRANKS, state, rankName } from '../state.js';
import * as sfx from '../audio/sfx.js';
import { stopSong } from '../audio/music.js';

const AREA_FOR_SCENE = {
  Hub: 'hub', Farm: 'farm', EatingContest: 'farm', Castle: 'castle', Joust: 'castle', Caves: 'caves', Dream: 'caves',
};

export default class PauseScene extends Phaser.Scene {
  constructor() {
    super('Pause');
  }

  init(data) {
    this.from = data.from;
  }

  create() {
    this.add.rectangle(0, 0, 320, 180, 0x120c16, 0.7).setOrigin(0);
    panel(this, 16, 20, 120, 100, { fill: 0x3a2a5e, depth: 0 });
    addText(this, 76, 26, 'Paused', { center: true, color: COLORS.gold });
    this.items = ['Resume', 'Controls', 'Mute', 'Quit to Title'];
    this.labels = this.items.map((t, i) => addText(this, 34, 44 + i * 16, t, { color: COLORS.cream }));
    this.cursor = addText(this, 24, 44, '→', { color: COLORS.pink });
    this.index = 0;
    addText(this, 76, 108, rankName(), { center: true, color: COLORS.pink });

    const area = AREA_FOR_SCENE[this.from];
    if (area) {
      panel(this, 144, 20, 166, 20 + PRANKS[area].length * 11, { fill: 0x3a2a5e, depth: 0 });
      addText(this, 227, 26, 'Mischief Checklist', { center: true, color: COLORS.gold });
      PRANKS[area].forEach((p, i) => {
        const done = state.pranks[p.id];
        addText(this, 150, 38 + i * 11, `${done ? '★' : '-'} ${p.name}`, { color: done ? COLORS.gold : COLORS.grey });
      });
    }
    this.refresh();
    this.input.keyboard.on('keydown', this.onKey, this);
  }

  refresh() {
    this.labels[2].setText(sfx.isMuted() ? 'Unmute' : 'Mute');
    this.cursor.setY(44 + this.index * 16);
    this.labels.forEach((l, i) => l.setTint(i === this.index ? COLORS.white : COLORS.cream));
  }

  onKey(e) {
    if (e.repeat) return;
    if (this.card) {
      if (e.code === 'Space' || e.code === 'Escape') { this.card.destroy(); this.card = null; sfx.select(); }
      return;
    }
    if (e.code === 'KeyW') { this.index = (this.index + 3) % 4; sfx.move(); }
    else if (e.code === 'KeyS') { this.index = (this.index + 1) % 4; sfx.move(); }
    else if (e.code === 'Escape') return this.resume();
    else if (e.code === 'KeyM') sfx.toggleMute();
    else if (e.code === 'Space') {
      sfx.select();
      const item = this.items[this.index];
      if (item === 'Resume') return this.resume();
      if (item === 'Controls') this.card = showControlsCard(this, { footer: 'SPACE to close' });
      if (item === 'Mute') sfx.toggleMute();
      if (item === 'Quit to Title') {
        stopSong();
        this.scene.stop(this.from);
        this.scene.start('Title');
        return;
      }
    }
    this.refresh();
  }

  resume() {
    this.scene.resume(this.from);
    this.scene.stop();
  }
}
