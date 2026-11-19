// One shared cozy palette. One char = one color; '.' is transparent.
export const PALETTE = {
  k: '#2a1b2d', // outline / darkest plum
  x: '#1e1820', // black (eyes, Stone's hair)
  p: '#f2a7b8', // pig pink
  P: '#fcd3dc', // pig light pink
  q: '#d27f98', // pig shade
  n: '#a8456a', // nostril / deep pink
  w: '#fffaf0', // white
  c: '#f1dfb6', // cream
  b: '#2f62d0', // Duke blue
  B: '#1c3d8f', // dark blue
  l: '#8db8ec', // light blue (pajamas)
  g: '#78b85a', // grass green
  G: '#4a8448', // dark green
  h: '#b6dc84', // light green
  r: '#a06b42', // brown
  R: '#6a4530', // dark brown
  y: '#f2c230', // Stone yellow / gold
  Y: '#c48f1c', // yellow shade
  s: '#b0abbd', // stone grey
  S: '#6e6984', // dark grey
  u: '#7a58a8', // twilight purple
  U: '#3a2a5e', // deep purple
  v: '#405ca8', // night blue
  e: '#e2575e', // red
  o: '#f39a4b', // orange
  f: '#f3cfae', // skin
  F: '#d9a27c', // skin shade
  i: '#8ff0e6', // crystal cyan
  m: '#7d5134', // mud
  t: '#e9d27a', // straw / light gold
};

export function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
