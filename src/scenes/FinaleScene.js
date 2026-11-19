import BaseScene from './BaseScene.js';
import { addText } from '../ui/text.js';

export default class FinaleScene extends BaseScene {
  constructor() {
    super('Finale');
  }

  create() {
    addText(this, 160, 80, 'Finale (todo)', { center: true });
    this.initBase({});
  }
}
