import BaseScene from './BaseScene.js';
import { addText } from '../ui/text.js';

export default class FarmScene extends BaseScene {
  constructor() {
    super('Farm');
  }

  create() {
    addText(this, 160, 80, 'Farm (todo)', { center: true });
    this.initBase({});
  }
}
