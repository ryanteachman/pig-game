import BaseScene from './BaseScene.js';
import { addText } from '../ui/text.js';

export default class CreditsScene extends BaseScene {
  constructor() {
    super('Credits');
  }

  create() {
    addText(this, 160, 80, 'Credits (todo)', { center: true });
    this.initBase({});
  }
}
