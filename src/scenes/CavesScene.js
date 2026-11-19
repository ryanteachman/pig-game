import BaseScene from './BaseScene.js';
import { addText } from '../ui/text.js';

export default class CavesScene extends BaseScene {
  constructor() {
    super('Caves');
  }

  create() {
    addText(this, 160, 80, 'Caves (todo)', { center: true });
    this.initBase({});
  }
}
