import BaseScene from './BaseScene.js';
import { addText } from '../ui/text.js';

export default class DreamScene extends BaseScene {
  constructor() {
    super('Dream');
  }

  create() {
    addText(this, 160, 80, 'Dream (todo)', { center: true });
    this.initBase({});
  }
}
