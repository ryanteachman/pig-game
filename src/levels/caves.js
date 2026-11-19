// The four Shleepy Caves push-puzzle rooms. Rules live in sokoban.js.
// '#' wall, '.' floor, 'P' Mr. Pig, 'S' Shleepy Stone, 'O' rock, '_' plate, 'E' exit,
// 'c' cheese, 'X' crystal (Crystal Mustache prank), 'm' glowing mushroom.
// `solution` is filled in from scripts/solve-caves.mjs (U/D/L/R moves, Z = snort).
export const CAVE_ROOMS = [
  {
    name: 'Room 1: A Gentle Push',
    hint: 'Walk into the Shleepy Stone to push her onto the glowing plate.',
    grid: [
      '###########',
      '#c...m....#',
      '#.........#',
      '#.P.S.._..E',
      '#.........#',
      '#m.......c#',
      '###########',
    ],
    solution: 'RRRRURRDRR',
  },
  {
    name: 'Room 2: Shleepy Pushes',
    hint: 'After 3 pushes she dozes off. Stand next to her and SNORT (SHIFT)!',
    bat: [6, 0],
    grid: [
      '#############',
      '#c..#...#...#',
      '#...#...#._.#',
      '#.P.S.......E',
      '#...#...#...#',
      '#.......#..c#',
      '#############',
    ],
    solution: 'RRRRURZLDRRRURZLDDRURR',
  },
  {
    name: 'Room 3: Rock Friends',
    hint: 'Ordinary rocks never get sleepy. Every plate needs something on it.',
    grid: [
      '#############',
      '#c....#.....#',
      '#..O..#.....#',
      '#......O..._#',
      '#.P.S.......E',
      '#.......X...#',
      '#_.....m...c#',
      '#############',
    ],
    solution: 'URRDDRDLUUURRRRRRDLLLDLLLLZRDLLUURRRRRRRRRR',
  },
  {
    name: 'Room 4: The Cozy Nook',
    hint: 'Three plates, two rocks, one very sleepy friend.',
    grid: [
      '##############',
      '#c..#....#...#',
      '#.O.#.##.#._.#',
      '#.P..S.......E',
      '##.##.O.##...#',
      '#_....._##..c#',
      '##############',
    ],
    solution: 'RRRRDURDLLDRUULLLUULDDDURRRDDLLLUURRRUURRRDZULLLDDRRRRRURZLDDRURR',
  },
];
