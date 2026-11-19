import BaseScene from './BaseScene.js';
import { addText } from '../ui/text.js';

export default class JoustScene extends BaseScene {
  constructor() {
    super('Joust');
  }

  create() {
    addText(this, 160, 80, 'Joust (todo)', { center: true });
    this.initBase({});
  }
}
