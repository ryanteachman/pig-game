import Phaser from 'phaser';
import { buildTextures } from '../art/buildTextures.js';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create() {
    buildTextures(this);
    this.scene.start('Title');
  }
}
