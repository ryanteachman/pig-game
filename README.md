# Mr. Pig's Mischief Quest 🐷

A ~30-minute cozy pixel-art browser game, made as a birthday gift for Annarose.

Annarose will only cuddle with **the most mischievous pig in the land**. Mr. Pig sets out to prove it's him
by pranking his rivals, Mr. Big Pig and Sir Oinks A Lot. His sleepy best friend, the Shleepy Stone, tags along.
No game overs, no failure screens: just mischief.

Built with **Phaser 3** and **Vite** in plain JavaScript. Every sprite, tile, font glyph, sound effect and song
is generated in code. There are no image, audio or font files.

## Run it

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually http://localhost:5173).

## Controls

| Key | Action |
|---|---|
| **W A S D** | Move |
| **Space** | Interact / talk / advance dialogue / confirm |
| **Shift** | Snort! Wakes the Shleepy Stone, startles pigs, distracts guards, poofs nightmares |
| **R** | Restart the current puzzle room or minigame |
| **M** | Mute / unmute (remembered) |
| **Esc** | Pause menu (Resume, Controls, Mute, Quit to Title) + prank checklist |

The game autosaves after every prank, cheese, puzzle and area. The title screen offers **Continue** and **New Game**.

## Build

```bash
npm run build
```

This writes a static site to `dist/`, then runs `scripts/check-dist.mjs`, which fails the build if anything from
`assets/references/` (or any image file at all) ended up in `dist/`. The build uses `base: './'`, so `dist/` works
from any folder on any static host.

To try the production build locally, run `npm run preview`.

## Deploy to GitHub Pages

1. Run `npm run build`.
2. Publish the contents of `dist/` to a `gh-pages` branch, for example:
   ```bash
   npx gh-pages -d dist
   ```
   Alternatively, use a GitHub Actions workflow that runs `npm ci && npm run build` and uploads `dist/` with
   `actions/upload-pages-artifact` + `actions/deploy-pages`.
3. In the repo's **Settings → Pages**, choose the `gh-pages` branch (or "GitHub Actions") as the source.

> **Privacy:** the reference photos in `assets/references/` are private. They are git-ignored, never imported
> by the game, blocked by the dev server, and checked for after every build. Only the generated pixel sprites ship.

## Tests & tools

| Command | What it does |
|---|---|
| `npm test` | Playwright end-to-end tests (boot without console errors, Intro to Hub, every area, cave solutions replayed as key presses, all three minigames, the finale's exact final message, save/load, pause/mute). Screenshots go to `preview/scenes/`. |
| `npm run solve` | BFS solver (models the Stone's 3-push sleep counter and snort wake-ups) that verifies every cave room is solvable and every cheese is reachable, and checks each room's stored solution. `node scripts/solve-caves.mjs --write` regenerates the solutions. |
| `npm run sprites` | Renders every sprite at 8× to `preview/*.png`, plus contact sheets of all sprites and tiles. |

The first time you run the tests, install the browser with `npx playwright install chromium`.

### Debug mode

Open the game with `?debug=1` (for example http://localhost:5173/?debug=1):

- **1–6** warp to Hub / Farm / Castle / Caves / Dream / Finale
- **G** grants 100 Mischief Points, **C** grants all 30 cheeses
- **F** completes the current area or minigame (using the same completion code as playing it)
- `window.__game` and `window.__state` are exposed for tests

Debug mode is off, and invisible, unless that query parameter is present.

## Project layout

```
assets/references/    private reference photos (never shipped, git-ignored)
docs/characters.md    visual notes on each character, written from the references
src/main.js           Phaser config + scene list, integer scaling
src/state.js          game state, ranks, pranks, save/load
src/art/              palette, pixel-grid sprites, tiles, texture builder
src/audio/            Web Audio SFX and the chiptune step sequencer + songs
src/ui/               pixel font, dialogue box, HUD, toasts, controls card
src/levels/           overworld maps, cave rooms, Sokoban rules + solver, cheese registry
src/scenes/           Boot, Title, Intro, Hub, Farm, EatingContest, Castle, Joust, Caves, Dream, Finale, Credits, Pause
scripts/              sprite preview renderer, cave solver, dist/ privacy check
tests/                Playwright smoke tests
```

Happy birthday, Annarose. ♥
