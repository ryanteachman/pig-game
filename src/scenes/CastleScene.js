import BaseScene from './BaseScene.js';
import { addText } from '../ui/text.js';

export default class CastleScene extends BaseScene {
  constructor() {
    super('Castle');
  }

  create() {
    addText(this, 160, 80, 'Castle (todo)', { center: true });
    this.initBase({});
  }
}
