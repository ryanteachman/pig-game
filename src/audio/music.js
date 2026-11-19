// A tiny step sequencer: square lead, triangle bass, optional square harmony, noise drums.
// Each token is one 8th note: a note name (C5, F#4, Bb3), '.' for rest, '-' to hold the previous note.
// Drum tokens: k = kick, s = snare, h = hat, '.' = rest.
import { audio } from './sfx.js';

const SONGS = {
  title: {
    bpm: 132,
    lead: `C5 . E5 G5 . E5 C5 . | D5 . F5 A5 . F5 D5 . | E5 G5 C6 - B5 - G5 . | A5 G5 F5 E5 D5 - . .
           C5 . E5 G5 . E5 C5 . | F5 . A5 C6 . A5 F5 . | G5 F5 E5 D5 E5 - C5 . | D5 - G4 - C5 - . .`,
    bass: `C3 . G3 . C3 . G3 . | D3 . A3 . D3 . A3 . | C3 . G3 . E3 . G3 . | F3 . C4 . G3 . B2 .
           C3 . G3 . C3 . G3 . | F3 . C4 . F3 . A3 . | G3 . D4 . C3 . E3 . | G2 . B2 . C3 . G2 .`,
    drums: 'k . h . s . h . | k . h . s . h k',
  },
  farm: {
    bpm: 152,
    lead: `G4 B4 D5 B4 G4 B4 D5 G5 | E5 D5 B4 G4 A4 - . . | A4 C5 E5 C5 A4 C5 E5 A5 | G5 F#5 E5 D5 G4 - . .
           D5 D5 B4 D5 E5 D5 B4 G4 | C5 C5 A4 C5 D5 C5 A4 F#4 | G4 B4 D5 G5 E5 C5 A4 F#4 | G4 - D4 - G4 - . .`,
    bass: `G2 . D3 . G2 . D3 . | C3 . G2 . D3 . A2 . | A2 . E3 . A2 . E3 . | D3 . A2 . D3 . F#3 .
           G2 . D3 . G2 . D3 . | D3 . A2 . D3 . A2 . | G2 . B2 . C3 . D3 . | G2 . D3 . G2 . . .`,
    drums: 'k h s h k h s h',
  },
  castle: {
    bpm: 112,
    pluck: true,
    lead: `A4 . . C5 . . E5 . | D#5 . E5 . C5 . A4 . | F4 . . A4 . . C5 . | B4 . C5 . A4 . E4 .
           A4 . . C5 . . E5 . | F5 . E5 . D5 . C5 . | B4 . G#4 . A4 . B4 . | A4 . . . E4 . . .`,
    bass: `A2 . E3 . A2 . E3 . | A2 . E3 . A2 . E3 . | F2 . C3 . F2 . C3 . | E2 . B2 . E2 . G#2 .
           A2 . E3 . A2 . E3 . | D3 . A3 . D3 . F3 . | E3 . B2 . E3 . E2 . | A2 . E3 . A2 . . .`,
    drums: 'k . . s k . s .',
  },
  caves: {
    bpm: 78,
    echo: true,
    leadType: 'triangle',
    lead: `F5 - - - A5 - G5 - | F5 - E5 - D5 - - - | C5 - - - F5 - E5 - | D5 - - - - - . .
           F5 - - - A5 - C6 - | Bb5 - A5 - G5 - - - | A5 - G5 - E5 - F5 - | F5 - - - - - . .`,
    bass: `D3 - - - A3 - - - | Bb2 - - - F3 - - - | C3 - - - G3 - - - | D3 - - - A2 - - -
           F2 - - - C3 - - - | G2 - - - D3 - - - | A2 - - - C#3 - - - | D3 - - - - - - -`,
    drums: 'h . . . . . . .',
  },
  dream: {
    bpm: 140,
    lead: `E5 . G5 . B5 . A5 G5 | F#5 . D5 . E5 - . . | E5 . G5 . B5 . D6 C6 | B5 . A5 . B5 - . .
           C6 . B5 . A5 . G5 . | A5 . G5 . F#5 . D5 . | E5 . F#5 . G5 . A5 . | B5 - - - B4 - . .`,
    bass: `E3 E3 E3 E3 E3 E3 E3 E3 | D3 D3 D3 D3 D3 D3 D3 D3 | E3 E3 E3 E3 E3 E3 E3 E3 | B2 B2 B2 B2 B2 B2 B2 B2
           C3 C3 C3 C3 C3 C3 C3 C3 | D3 D3 D3 D3 D3 D3 D3 D3 | E3 E3 E3 E3 C3 C3 C3 C3 | B2 B2 B2 B2 B2 B2 B2 B2`,
    drums: 'k h s h k k s h',
  },
  finale: {
    bpm: 92,
    leadType: 'triangle',
    harmony: true,
    lead: `E5 - - G5 E5 - D5 - | C5 - - - - - . . | D5 - - E5 F5 - E5 - | D5 - - - G4 - . .
           E5 - - G5 C6 - B5 - | A5 - - - F5 - - - | G5 - - E5 D5 - C5 - | C5 - - - - - . .`,
    bass: `C3 - G3 - E3 - G3 - | A2 - E3 - A3 - E3 - | F2 - C3 - F3 - C3 - | G2 - D3 - G3 - D3 -
           C3 - G3 - E3 - G3 - | F2 - C3 - A3 - C3 - | G2 - D3 - G3 - B2 - | C3 - G3 - C4 - - -`,
    drums: 'h . . . h . . .',
  },
};

const NOTE_INDEX = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
function noteFreq(name) {
  const m = /^([A-G])(#|b)?(-?\d)$/.exec(name);
  if (!m) return null;
  let n = NOTE_INDEX[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
  const midi = (parseInt(m[3], 10) + 1) * 12 + n;
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function tokens(str) {
  return str.replace(/\|/g, ' ').split(/\s+/).filter(Boolean);
}

// Convert a token list into [{step, freq, len}] events.
function parseTrack(str) {
  const t = tokens(str);
  const events = [];
  t.forEach((tok, i) => {
    if (tok === '.' || tok === '-') return;
    let len = 1;
    while (t[i + len] === '-') len++;
    events.push({ step: i, freq: noteFreq(tok), len });
  });
  return { events, length: t.length };
}

const compiled = {};
function compile(name) {
  if (compiled[name]) return compiled[name];
  const s = SONGS[name];
  const lead = parseTrack(s.lead);
  const bass = parseTrack(s.bass);
  const drums = tokens(s.drums);
  compiled[name] = { ...s, lead, bass, drums, length: Math.max(lead.length, bass.length) };
  return compiled[name];
}

let current = null; // { name, song, step, nextTime, out }
let timer = null;

function playNote(out, type, freq, t, dur, vol, pluck) {
  const ctx = audio.ctx;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  const end = pluck ? t + Math.min(dur, 0.18) : t + dur * 0.92;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
  if (pluck) g.gain.exponentialRampToValueAtTime(0.0001, end);
  else {
    g.gain.setValueAtTime(vol, Math.max(t + 0.011, end - 0.04));
    g.gain.exponentialRampToValueAtTime(0.0001, end);
  }
  osc.connect(g).connect(out);
  osc.start(t);
  osc.stop(end + 0.02);
}

function playDrum(out, kind, t) {
  const ctx = audio.ctx;
  if (kind === 'k') {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.12);
    g.gain.setValueAtTime(0.5, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
    osc.connect(g).connect(out);
    osc.start(t);
    osc.stop(t + 0.15);
    return;
  }
  const src = ctx.createBufferSource();
  src.buffer = audio.noise;
  const f = ctx.createBiquadFilter();
  f.type = kind === 'h' ? 'highpass' : 'bandpass';
  f.frequency.value = kind === 'h' ? 7000 : 1800;
  const g = ctx.createGain();
  const dur = kind === 'h' ? 0.04 : 0.12;
  g.gain.setValueAtTime(kind === 'h' ? 0.08 : 0.22, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(out);
  src.start(t, Math.random() * 0.5);
  src.stop(t + dur + 0.01);
}

function makeOutput(song) {
  const ctx = audio.ctx;
  const out = ctx.createGain();
  out.gain.value = 0;
  out.gain.setTargetAtTime(1, ctx.currentTime, 0.15);
  out.connect(audio.musicBus);
  let leadOut = out;
  if (song.echo) {
    const delay = ctx.createDelay(1);
    delay.delayTime.value = (60 / song.bpm) * 0.75;
    const fb = ctx.createGain();
    fb.gain.value = 0.38;
    const wet = ctx.createGain();
    wet.gain.value = 0.5;
    leadOut = ctx.createGain();
    leadOut.connect(out);
    leadOut.connect(delay);
    delay.connect(fb).connect(delay);
    delay.connect(wet).connect(out);
  }
  return { out, leadOut };
}

function tick() {
  const ctx = audio.ctx;
  if (!ctx || !current) return;
  const { song } = current;
  const stepDur = 60 / song.bpm / 2;
  while (current.nextTime < ctx.currentTime + 0.2) {
    const step = current.step % song.length;
    const t = current.nextTime;
    for (const e of song.lead.events) {
      if (e.step === step) {
        playNote(current.leadOut, song.leadType || 'square', e.freq, t, e.len * stepDur, song.leadType === 'triangle' ? 0.2 : 0.07, song.pluck);
        if (song.harmony) playNote(current.out, 'square', e.freq / 2, t, e.len * stepDur, 0.025, false);
      }
    }
    for (const e of song.bass.events) {
      if (e.step === step) playNote(current.out, 'triangle', e.freq, t, e.len * stepDur, 0.22, song.pluck);
    }
    const d = song.drums[step % song.drums.length];
    if (d && d !== '.') playDrum(current.out, d, t);
    current.step++;
    current.nextTime += stepDur;
  }
}

export function playSong(name) {
  if (!audio.ctx || !SONGS[name]) return;
  if (current?.name === name) return;
  stopSong();
  const song = compile(name);
  const { out, leadOut } = makeOutput(song);
  current = { name, song, step: 0, nextTime: audio.ctx.currentTime + 0.08, out, leadOut };
  if (!timer) timer = setInterval(tick, 30);
  tick();
}

export function stopSong() {
  if (!current) return;
  const { out } = current;
  const ctx = audio.ctx;
  out.gain.setTargetAtTime(0, ctx.currentTime, 0.08);
  setTimeout(() => out.disconnect(), 600);
  current = null;
}

export function currentSong() {
  return current?.name ?? null;
}

// Remember the wanted song even before audio is unlocked, then start it on unlock.
let wanted = null;
export function wantSong(name) {
  wanted = name;
  if (audio.ctx) playSong(name);
}
export function startWanted() {
  if (wanted) playSong(wanted);
}

export const SONG_NAMES = Object.keys(SONGS);
