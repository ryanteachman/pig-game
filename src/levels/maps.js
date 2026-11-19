// Overworld tilemaps as string arrays (one char = one 16x16 tile).
// Shared legend below; '*' is a cheese, '$' is a well-hidden cheese (only a sparkle shows).
// Objects (NPCs, props, exits) are placed by each scene in tile coordinates.

export const LEGEND = {
  ',': { tile: 'grass' },
  '"': { tile: 'grass2' },
  '.': { tile: 'path' },
  ':': { tile: 'cobble' },
  '~': { tile: 'water', solid: true },
  T: { tile: 'tree', solid: true },
  b: { tile: 'bush', solid: true },
  '=': { tile: 'fence', solid: true },
  f: { tile: 'field', solid: true },
  m: { tile: 'mud' },
  H: { tile: 'houseWall', solid: true },
  R: { tile: 'roof', solid: true },
  B: { tile: 'roofBlue', solid: true },
  K: { tile: 'roofPink', solid: true },
  D: { tile: 'door', solid: true },
  W: { tile: 'windowTile', solid: true },
  '+': { tile: 'bridge' },
  '%': { tile: 'flowerbed', solid: true },
  s: { tile: 'sand' },
  h: { tile: 'grass', prop: 'hay' },
  // castle
  C: { tile: 'castleWall', solid: true },
  c: { tile: 'castleWallTop', solid: true },
  _: { tile: 'castleFloor' },
  '|': { tile: 'carpet' },
  A: { tile: 'archway' },
  v: { tile: 'moat', solid: true },
  // intro hut
  '#': { tile: 'mudWall', solid: true },
  '-': { tile: 'strawFloor' },
  u: { tile: 'rug' },
  d: { tile: 'door' },
  // finale house
  w: { tile: 'wallpaper', solid: true },
  o: { tile: 'woodFloor' },
};

export const INTRO_MAP = [
  '####################',
  '####################',
  '##----------------##',
  '##----------------##',
  '##----------------##',
  '##------uuu-------##',
  '##------uuu-------##',
  '##----------------##',
  '##----------------##',
  '##----------------##',
  '#########dd#########',
];

export const HUB_MAP = [
  'TTTTTTTTTTTTTTTT....TTTTTTTTTTTTTTTT',
  'T,*,,,,,,,,,,,,b....b,,,,,,,,,,,,,,T',
  'T,,BBBBB,,"",,,,....,,,,,,RRRRRR,,$T',
  'T,,BBBBB,,,,,*,,....,,,,,,RRRRRR,,,T',
  'T,,HWDWH,,,,,,,,....,,,,,,HWHDWH,,,T',
  'T,,,,.,,,,,,,,,,....,,,,,,,,,.,,,,,T',
  'T,,,,.,,,,,,,,,,....,,,,,,,,,.,,,,,T',
  'T,,,,.........................,,,,,T',
  'T,,,,,,,,,,,,,,,....,,,,,,,,,,,,,,,T',
  'T,,b,,,,,,,,,::::::::::,,,,,,,"",,,T',
  'T,,,,,,,,,,,,::::::::::,,,,,,,,,,,,T',
  '.............::::::::::.............',
  '.............::::::::::.............',
  'T,,,,,,,,,,,,::::::::::,,,,~~~~~,,,T',
  'T,,,%%,,,,,,,::::::::::,,,,~~~~~,*,T',
  'T,,,,,,,,,,,,::::::::::,,,,~~~~~,,,T',
  'T,,RRRRRR,,,............,,,,,,,,,,,T',
  'T,,RRRRRR,,,............,,,,,,,,,,,T',
  'T,,HWHDWH,,,..KKKKKKKK..,,,,,,,,,,,T',
  'T,,,,,.,,,,,..KKKKKKKK..,,,,,,,$,,,T',
  'T,,,,,.,,,,,..HHWHHWHH..,,,,,,,,,,,T',
  'T,,,,,........HWHDDHWH..,,,,,,,,,,,T',
  'T,,,*,,,,,,,............,,,b,,,,,,,T',
  'T,,,,,,,,,,,............,,,,,,,,,,,T',
  'T,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,T',
  'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
];

export const FARM_MAP = [
  'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
  'T,,RRRRRRR,,,,,,,,,,===========,,T',
  'T,,RRRRRRR,,,,,,,,,,=fffffffff=,*T',
  'T,,HHWHWHH,,,,,,,,,,=fffffffff=,,T',
  'T,,HHHDHHH,,,,,,,,,,=fffffffff=,,T',
  'T,,,,,.,,,,,,,,,,,,,=fffffffff=,,T',
  'T,*,,,.,,,,,,,,,,,,,===========,,T',
  'T,,,,,.,,,,,,,,,,,,,,,,,,,,,,,,,,T',
  'T,,,,,.,,,,,,,%%%%,,,,,,,,,,,,*,,T',
  'T,,,,,.,,,,,,,,,,,,,,,,,,,,,,,,,,T',
  '.......,,,,,,,,,,,,,,,,,,,,,,,,$,T',
  '.......,,,,,,,,,,,,,,,,,,,,,,,,,,T',
  'T,,,,,.,,,,,,,,,,,,,,,,,,,,,,,,,,T',
  'T,,,,,.,,,,,,,,,,,,,,,,,,,,,,,,,,T',
  'T,,,,,.,,,,,,,,,,,,,,,,,,,,,,,,,,T',
  'T,hh,,,,,,,,,,,,,,,,,,,,,,,,,,,*,T',
  'T,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,T',
  'T,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,T',
  'T,*,,,,,,,,,,,,,,,~~~~,,,,,,,,,,,T',
  'T,,,,,,,,,,$,,,,,,~~~~,,,,,,,*,,,T',
  'T,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,T',
  'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
];

export const CASTLE_ROOMS = {
  courtyard: [
    'cccccccccAAccccccccc',
    'CCCCCCCCCAACCCCCCCCC',
    'C,,,,,,,,::,,,,,,,*C',
    'C,,,,,,,,::,,,,,,,,C',
    'C,,b,,,,,::,,,,,b,,C',
    'C,,,,,,,,::,,,,,,,,C',
    'C,,,,,,,,::,,,,,,,,C',
    'C,$,,,,,,::,,,,,,,,C',
    'C,,,,,,,,::,,,,,,,,C',
    'vvvvvvvvv++vvvvvvvvv',
    'vvvvvvvvv++vvvvvvvvv',
  ],
  hall: [
    'cccccccccAAccccccccc',
    'CCCCCCCCC||CCCCCCCCC',
    'C________||_______*C',
    'C__C_____||_____C__C',
    'C________||________C',
    'A________||________C',
    'A________||________C',
    'C__C_____||_____C__C',
    'C$_______||________C',
    'CCCCCCCCC||CCCCCCCCC',
    'cccccccccAAccccccccc',
  ],
  armory: [
    'cccccccccccccccccccc',
    'CCCCCCCCCCCCCCCCCCCC',
    'C__________________C',
    'C__________________C',
    'C__________________C',
    'C__________________A',
    'C__________________A',
    'C__________________C',
    'C*_______________$_C',
    'CCCCCCCCCCCCCCCCCCCC',
    'cccccccccccccccccccc',
  ],
  throne: [
    'cccccccccccccccccccc',
    'CCCCCCCCCCCCCCCCCCCC',
    'C________||_______*C',
    'C________||________C',
    'C________||________C',
    'C________||________C',
    'C________||________C',
    'C________||________C',
    'C$_______||________C',
    'CCCCCCCCC||CCCCCCCCC',
    'cccccccccAAccccccccc',
  ],
};

export const FINALE_MAP = [
  'wwwwwwwwwwwwwwwwwwww',
  'wwwwwwwwwwwwwwwwwwww',
  'wooooooooooooooooow',
  'woooooooooooooooooow',
  'woooooooooooooooooow',
  'woooooooouuooooooow',
  'woooooooouuooooooow',
  'woooooooooooooooooow',
  'woooooooooooooooooow',
  'woooooooooooooooooow',
  'wwwwwwwwwwwwwwwwwwww',
].map((r) => r.padEnd(20, 'w').slice(0, 20));

// Cheese ids are "<area>-<room>-<index>" in reading order.
export function cheeseSpots(area, room, rows) {
  const out = [];
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      if (row[x] === '*' || row[x] === '$') out.push({ id: `${area}-${room}-${out.length}`, x, y, hidden: row[x] === '$' });
    }
  });
  return out;
}
