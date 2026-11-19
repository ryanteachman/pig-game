import Phaser from 'phaser';
import { loadSettings, DEBUG } from './state.js';
import BootScene from './scenes/BootScene.js';
import TitleScene from './scenes/TitleScene.js';
import IntroScene from './scenes/IntroScene.js';
import HubScene from './scenes/HubScene.js';
import FarmScene from './scenes/FarmScene.js';
import EatingContestScene from './scenes/EatingContestScene.js';
import CastleScene from './scenes/CastleScene.js';
import JoustScene from './scenes/JoustScene.js';
import CavesScene from './scenes/CavesScene.js';
import DreamScene from './scenes/DreamScene.js';
import FinaleScene from './scenes/FinaleScene.js';
import CreditsScene from './scenes/CreditsScene.js';
import PauseScene from './scenes/PauseScene.js';

export const WIDTH = 320;
export const HEIGHT = 180;

loadSettings();

// Largest integer zoom that fits the window; the canvas is centred (letterboxed).
function fitZoom() {
  return Math.max(1, Math.floor(Math.min(window.innerWidth / WIDTH, window.innerHeight / HEIGHT)));
}

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: WIDTH,
  height: HEIGHT,
  backgroundColor: '#1a1220',
  pixelArt: true,
  roundPixels: true,
  banner: false,
  audio: { noAudio: true },
  scale: {
    mode: Phaser.Scale.NONE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    zoom: fitZoom(),
  },
  input: { keyboard: true, mouse: false, touch: false, gamepad: false },
  scene: [
    BootScene, TitleScene, IntroScene, HubScene, FarmScene, EatingContestScene, CastleScene,
    JoustScene, CavesScene, DreamScene, FinaleScene, CreditsScene, PauseScene,
  ],
});

window.addEventListener('resize', () => game.scale.setZoom(fitZoom()));
window.addEventListener('contextmenu', (e) => e.preventDefault());

if (DEBUG) window.__game = game;
