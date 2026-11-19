import BaseScene from './BaseScene.js';
import { addText } from '../ui/text.js';

export default class EatingContestScene extends BaseScene {
  constructor() {
    super('EatingContest');
  }

  create() {
    addText(this, 160, 80, 'EatingContest (todo)', { center: true });
    this.initBase({});
  }
}
