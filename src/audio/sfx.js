// Synthesized sound effects (Web Audio API, no files).
// The AudioContext is created on the first keypress (browser autoplay rules).
import { settings, saveSettings } from '../state.js';

let ctx = null;
let master = null;
let sfxBus = null;
let musicBus = null;
let noiseBuffer = null;

const MASTER_VOLUME = 0.32;

export function unlockAudio() {
  if (ctx) {
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = settings.muted ? 0 : MASTER_VOLUME;
  master.connect(ctx.destination);
  sfxBus = ctx.createGain();
  sfxBus.gain.value = 0.9;
  sfxBus.connect(master);
  musicBus = ctx.createGain();
  musicBus.gain.value = 0.55;
  musicBus.connect(master);
  noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const d = noiseBuffer.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return ctx;
}

export const audio = {
  get ctx() { return ctx; },
  get musicBus() { return musicBus; },
  get noise() { return noiseBuffer; },
};

export function isMuted() {
  return settings.muted;
}

export function setMuted(m) {
  settings.muted = m;
  saveSettings();
  if (master && ctx) master.gain.setTargetAtTime(m ? 0 : MASTER_VOLUME, ctx.currentTime, 0.02);
}

export function toggleMute() {
  setMuted(!settings.muted);
  return settings.muted;
}

export function setMusicVolume(v) {
  if (musicBus && ctx) musicBus.gain.setTargetAtTime(v, ctx.currentTime, 0.1);
}

// --- building blocks --------------------------------------------------------
function tone({ type = 'square', freq = 440, to = null, start = 0, dur = 0.1, vol = 0.3, attack = 0.005, bus = sfxBus }) {
  if (!ctx) return;
  const t = ctx.currentTime + start;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (to) osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(bus);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

function noise({ start = 0, dur = 0.1, vol = 0.2, filter = 2000, type = 'lowpass', bus = sfxBus }) {
  if (!ctx) return;
  const t = ctx.currentTime + start;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer;
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.frequency.value = filter;
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(bus);
  src.start(t, Math.random() * 0.5);
  src.stop(t + dur + 0.02);
}

const note = (n) => 440 * Math.pow(2, (n - 69) / 12);

// --- the sound effects ---------------------------------------------------------
const OINK_PITCHES = [1, 1.18, 0.86];
export function oink() {
  if (!ctx) return;
  const p = OINK_PITCHES[Math.floor(Math.random() * OINK_PITCHES.length)];
  tone({ type: 'sawtooth', freq: 380 * p, to: 150 * p, dur: 0.16, vol: 0.28 });
  tone({ type: 'square', freq: 190 * p, to: 90 * p, dur: 0.14, vol: 0.12 });
  noise({ dur: 0.09, vol: 0.12, filter: 1400 });
}

export function cheese() {
  tone({ type: 'square', freq: note(84), dur: 0.08, vol: 0.18 });
  tone({ type: 'square', freq: note(91), start: 0.07, dur: 0.16, vol: 0.18 });
  tone({ type: 'triangle', freq: note(96), start: 0.07, dur: 0.2, vol: 0.12 });
}

export function prank() {
  [72, 76, 79, 84].forEach((n, i) => tone({ type: 'square', freq: note(n), start: i * 0.06, dur: 0.1, vol: 0.16 }));
  // "hee hee"
  tone({ type: 'triangle', freq: note(88), to: note(86), start: 0.3, dur: 0.07, vol: 0.2 });
  tone({ type: 'triangle', freq: note(88), to: note(86), start: 0.42, dur: 0.07, vol: 0.2 });
}

const BLIP_PITCH = { mrpig: 620, stone: 300, stoneAwake: 340, bigpig: 180, oinks: 440, oinksPink: 440, anna: 760, annaLaugh: 800, narrator: 520, guard: 260, villagerG: 500, villagerR: 470, villagerP: 540 };
export function blip(speaker = 'narrator') {
  const f = BLIP_PITCH[speaker] ?? 520;
  tone({ type: 'square', freq: f * (0.95 + Math.random() * 0.1), dur: 0.035, vol: 0.06 });
}

export function sleep() {
  tone({ type: 'triangle', freq: note(72), to: note(60), dur: 0.5, vol: 0.18 });
  tone({ type: 'sine', freq: note(67), to: note(55), start: 0.25, dur: 0.5, vol: 0.12 });
}

export function wake() {
  tone({ type: 'square', freq: 200, to: 900, dur: 0.12, vol: 0.14 });
  tone({ type: 'triangle', freq: 900, to: 500, start: 0.1, dur: 0.12, vol: 0.12 });
}

export function push() {
  tone({ type: 'sine', freq: 110, to: 55, dur: 0.12, vol: 0.35 });
  noise({ dur: 0.08, vol: 0.14, filter: 400 });
}

export function poof() {
  noise({ dur: 0.22, vol: 0.2, filter: 3000, type: 'bandpass' });
  tone({ type: 'triangle', freq: 600, to: 1400, dur: 0.15, vol: 0.1 });
}

export function select() {
  tone({ type: 'square', freq: note(79), dur: 0.05, vol: 0.12 });
  tone({ type: 'square', freq: note(84), start: 0.05, dur: 0.07, vol: 0.12 });
}

export function move() {
  tone({ type: 'square', freq: note(72), dur: 0.035, vol: 0.08 });
}

export function fanfare() {
  const seq = [[72, 0], [76, 0.1], [79, 0.2], [84, 0.3], [79, 0.45], [84, 0.55]];
  seq.forEach(([n, s], i) => tone({ type: 'square', freq: note(n), start: s, dur: i === seq.length - 1 ? 0.45 : 0.12, vol: 0.15 }));
  [60, 64, 67].forEach((n) => tone({ type: 'triangle', freq: note(n), start: 0.55, dur: 0.5, vol: 0.12 }));
}

export function bump() {
  tone({ type: 'square', freq: 140, to: 90, dur: 0.06, vol: 0.08 });
}

export function halt() {
  tone({ type: 'square', freq: note(76), dur: 0.12, vol: 0.18 });
  tone({ type: 'square', freq: note(72), start: 0.14, dur: 0.2, vol: 0.18 });
}

export function chomp() {
  noise({ dur: 0.06, vol: 0.18, filter: 900 });
  tone({ type: 'square', freq: 260, to: 180, dur: 0.05, vol: 0.08 });
}

export function wrong() {
  tone({ type: 'sawtooth', freq: 160, to: 110, dur: 0.15, vol: 0.12 });
}

export function hit() {
  noise({ dur: 0.15, vol: 0.3, filter: 1800 });
  tone({ type: 'square', freq: 300, to: 80, dur: 0.2, vol: 0.18 });
}

export function whoosh() {
  noise({ dur: 0.3, vol: 0.12, filter: 1200, type: 'bandpass' });
}

export function pffft() {
  if (!ctx) return;
  tone({ type: 'sawtooth', freq: 90, to: 60, dur: 0.6, vol: 0.2 });
  noise({ dur: 0.6, vol: 0.12, filter: 300 });
}

export function ring() {
  [0, 0.35].forEach((s) => {
    tone({ type: 'triangle', freq: note(88), start: s, dur: 0.6, vol: 0.18 });
    tone({ type: 'sine', freq: note(95), start: s, dur: 0.5, vol: 0.08 });
  });
}

export function splash() {
  noise({ dur: 0.5, vol: 0.25, filter: 1600 });
  tone({ type: 'sine', freq: 300, to: 120, dur: 0.3, vol: 0.12 });
}

export function sparkle() {
  [96, 100, 103].forEach((n, i) => tone({ type: 'triangle', freq: note(n), start: i * 0.05, dur: 0.12, vol: 0.06 }));
}

export function lightsOut() {
  tone({ type: 'square', freq: 220, to: 60, dur: 0.3, vol: 0.15 });
}

export function surprise() {
  noise({ dur: 0.3, vol: 0.25, filter: 4000, type: 'highpass' });
  fanfare();
}

export function heartBurst() {
  [84, 88, 91, 96, 91, 96].forEach((n, i) => tone({ type: 'triangle', freq: note(n), start: i * 0.07, dur: 0.18, vol: 0.12 }));
}
