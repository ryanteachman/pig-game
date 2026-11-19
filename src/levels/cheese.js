// Every cheese in the game, gathered from the maps. Used by debug "C" and by the tests.
import { HUB_MAP, FARM_MAP, CASTLE_ROOMS, cheeseSpots } from './maps.js';
import { CAVE_ROOMS } from './caves.js';

export function caveCheeseSpots(index) {
  const out = [];
  CAVE_ROOMS[index].grid.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) if (row[x] === 'c') out.push({ id: `caves-${index}-${out.length}`, x, y });
  });
  return out;
}

export function allCheeseIds() {
  const ids = [
    ...cheeseSpots('hub', 'main', HUB_MAP),
    ...cheeseSpots('farm', 'main', FARM_MAP),
    ...Object.entries(CASTLE_ROOMS).flatMap(([room, rows]) => cheeseSpots('castle', room, rows)),
    ...CAVE_ROOMS.flatMap((_, i) => caveCheeseSpots(i)),
  ].map((c) => c.id);
  return ids;
}
