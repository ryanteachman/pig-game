# CLAUDE.md — "Mr. Pig's Mischief Quest"

A ~30-minute browser game made as a birthday gift for Annarose. Build the **entire game**, from an empty repo to a finished, playable, deployable build. Make reasonable decisions without stopping to ask. Where this file is silent, choose whatever makes the game more charming and more robust.

---

## 1. The Pitch

Annarose (a human) will only cuddle with **the most mischievous pig in the land**. Mr. Pig, a small, mischievous pig, sets out to prove he's the one. His rivals for her cuddles are Mr. Big Pig and Sir Oinks A Lot, so the best way to prove he's the most mischievous is to prank both of them. His sleepy best friend, the Shleepy Stone, tags along.

Tone: cozy, silly, affectionate. No violence, no failure screens, no game over. It's a love letter shaped like a game.

---

## 2. Characters

Reference photos live in `assets/references/`. **Look at each photo before drawing that character.** Before writing any sprite data, write `docs/characters.md` with a short visual description of each one: colors, silhouette, and 2–3 signature features to keep at pixel scale.

| Character | Reference file | Role | Personality |
|---|---|---|---|
| **Mr. Pig** | `mr-pig.jpg` | Player character | Small, mischievous, cheeky grin, bouncy walk |
| **Mr. Big Pig** | `mr-big-pig.jpg` | Rival #1, owns the Farm | Big (2× Mr. Pig's size), loves food, gullible, good-natured |
| **Sir Oinks A Lot** | `sir-oinks-a-lot.jpg` | Rival #2, lord of the Castle | Pompous knight, armor, says "oink" far too often in his dialogue |
| **The Shleepy Stone** | `shleepy-stone.jpg` | Companion, follows Mr. Pig | A friendly stone who keeps falling asleep mid-sentence. Closed eyes, floating "z"s |
| **Annarose** | `annarose.jpg` (if present) | Final judge, human | Mischievous herself and hard to impress, warm at the end |

- If any reference file is missing, draw that character from the description above.
- Refer to the Shleepy Stone as "she".
- **Privacy:** the reference photos must NEVER be copied into `public/`, bundled, or deployed. Only the generated sprites ship. Add `assets/references/` to the build's exclude list and double-check `dist/` at the end.

---

## 3. Tech Stack

- **Phaser 3** (latest 3.x) + **Vite**, plain JavaScript (ES modules). No TypeScript, no UI frameworks.
- Keep the code readable and practitioner-style: small scene files, no over-engineered abstractions.
- Vite `base: './'` so `dist/` works on GitHub Pages or any static host.
- No external runtime assets (no fonts or images from CDNs). Everything is generated in code or lives in the repo.
- Saving: `localStorage` autosave after every prank, cheese pickup, area completion, and puzzle solve. The title screen offers **Continue** / **New Game**.

### Project layout
```
/assets/references/      # input photos (never shipped)
/docs/characters.md      # visual notes written from the references
/src/main.js             # Phaser config, scene list
/src/state.js            # game state + save/load (mischief, cheese, flags)
/src/art/palette.js
/src/art/sprites.js      # pixel-grid sprite definitions
/src/art/tiles.js        # tile definitions
/src/art/buildTextures.js# turns grids into Phaser textures at boot
/src/audio/sfx.js        # Web Audio synthesized sound effects
/src/audio/music.js      # tiny chiptune sequencer + songs
/src/scenes/*.js         # Boot, Title, Intro, Hub, Farm, Castle, Caves, minigames, Finale, Credits
/src/ui/                 # dialogue box, mischief meter, cheese counter, toast
/src/levels/caves.js     # Sokoban room data
/scripts/render-sprites.mjs  # exports sprite previews to /preview/*.png
/scripts/solve-caves.mjs     # BFS solver that verifies every cave room
/tests/smoke.spec.js     # Playwright tests
```

---

## 4. Controls (keyboard only, no mobile support)

| Key | Action |
|---|---|
| **W A S D** | Move (4-directional, grid-free movement in the overworld) |
| **Space** | Interact / talk / advance dialogue / confirm |
| **Shift** | **Snort/Oink**: wakes the Shleepy Stone, startles NPCs, and is the main "attack" in the Dream minigame. Always plays an oink sound and shows a little "OINK!" pop text |
| **R** | Restart current puzzle room / minigame attempt |
| **M** | Mute / unmute |
| **Esc** | Pause menu (Resume, Controls, Mute, Quit to Title) |

Show a controls card in the Intro and in the pause menu.

---

## 5. Art Direction

- **Pixel art.** Internal resolution **320×180**, integer-scaled to fit the window (`pixelArt: true`, `roundPixels: true`, letterbox to keep the aspect ratio).
- Tiles are 16×16. Mr. Pig, Sir Oinks A Lot, and the Stone are 16×16. Mr. Big Pig is 32×32. Annarose is 16×24.
- **Sprites are defined as string grids** (one char = one palette color, `.` = transparent) in `sprites.js` and turned into textures at boot. Example format:
  ```js
  mrPigIdle0: [
    '....pppp........',
    '...pPPPPp.......',
    // ...16 rows
  ]
  ```
- Palette: one shared cozy palette of about 24 colors (warm pinks for pigs, soft greens, cream, warm browns, stone greys, a twilight purple and blue range for the caves and dreams, gold for cheese). Define it in `palette.js`.
- Animation (keep it simple and cute):
  - Walking: 2 frames per direction (down/up/side; flip side for left).
  - Idle: a 1px bob.
  - Shleepy Stone: an awake frame and an asleep frame, with "z" particles drifting up while asleep.
  - Snort: a squash-and-stretch tween plus the pop text.
- Characters get a **1px dark outline** so they read clearly against any tile.
- Dialogue box: bottom of the screen, a portrait (the character sprite at 2×) on the left, and a typewriter text effect. Space skips or advances.
- Use a bitmap pixel font generated in code (a small 5×7 glyph set drawn into a texture), or a canvas-rendered font with no smoothing. Do not load a font from the web.

### Art self-check (required)
1. After writing the sprites, run `scripts/render-sprites.mjs` to export every sprite at 8× to `/preview/`.
2. **Look at each preview PNG next to its reference photo.** For each character, ask: are the signature features from `docs/characters.md` recognizable? Is the silhouette readable? Revise and re-render until yes. Do at least two revision passes on Mr. Pig and the Shleepy Stone, since they're on screen the most.
3. Also take in-game screenshots with Playwright (see §10) and check the scenes for clashing colors, unreadable text, and sprites blending into the ground.

---

## 6. Audio (all synthesized with the Web Audio API, no files)

- **SFX** (`sfx.js`): oink (a short sawtooth with a fast pitch drop and slight noise; give it 3 random pitch variations), cheese pickup (bright two-note chime), prank success (rising arpeggio + a "hee hee" blip), dialogue blip (soft per-character tick, pitch varies by speaker), Stone falling asleep (descending soft tone), Stone waking (boing), push stone (low thud), nightmare poof, menu select, Mischief Meter level-up fanfare.
- **Music** (`music.js`): a tiny step sequencer (square + triangle + noise channels). Write short looping tunes:
  - Title/Hub: bouncy and cheerful
  - Farm: country hoedown feel
  - Castle: sneaky pizzicato-ish march
  - Caves: slow, echoey, sleepy
  - Dream minigame: tense but still cute
  - Finale/Credits: sweet, slower, heartfelt
- Start audio only after the first keypress (browser autoplay rules). The title screen says "Press Space".
- Keep master volume modest. **M** toggles mute, and the setting is saved.

---

## 7. Game Structure & Content (~30 minutes total)

### Core systems
- **Mischief Meter** (top-left HUD): pranks and minigames award Mischief Points (MP). Show a rank title that rises with MP: *Innocent Piglet → Little Rascal → Troublemaker → Menace → Legendary Mischief Pig*.
- **Cheese collectibles** (top-right HUD 🧀 counter): **30 cheeses** hidden around the game (Hub 6, Farm 8, Castle 8, Caves 8). Cheese is optional. In the finale, Annarose comments on how many you found, and **finding all 30 unlocks a bonus cuddle scene with extra hearts**. Use a sparkle tile hint for well-hidden cheese.
- **Area gating:** the Castle unlocks after the Farm is complete, the Caves after the Castle, and the Finale after the Caves. Each area ends with a "Big Prank", which is its minigame.
- **Companion:** the Shleepy Stone follows Mr. Pig in the overworld with a short delay. Sometimes she falls asleep and stops. A snort wakes her, and she shuffles to catch up. This is flavor only; never block progress on it outside the Caves.

### Intro (~2 min)
Mr. Pig's little mud-hut bedroom. A letter or rumor arrives: *"Annarose will only cuddle with the most mischievous pig in the land."* Mr. Big Pig and Sir Oinks A Lot have both declared themselves the most mischievous. Mr. Pig wakes the Shleepy Stone (this teaches Shift), then they leave together (this teaches WASD and Space). Show the controls card.

### Hub: Pig Village (~2 min total across visits)
A small village with paths to the Farm (east), the Castle (north), the Caves (west), and Annarose's house (south, locked until the end, with a sign that reads "Only the MOST mischievous may enter"). Include a few ambient NPC pigs with one-line jokes, 6 cheeses, and one tiny prank (e.g. snort at a napping villager pig to make him jump) as a tutorial prank worth 5 MP.

### Area 1: Mr. Big Pig's Farm (~8 min)
Pranks (each worth 10 MP, done in any order; a checklist shows in the pause menu):
1. **Snack Heist**: sneak behind Mr. Big Pig while he's distracted watching a butterfly, then interact with his snack basket.
2. **Scarecrow Swap**: put Mr. Big Pig's hat on the scarecrow, and his confusion dialogue plays.
3. **Mud Surprise**: knock over the water trough (interact) so it floods his favorite sunbathing spot into mud. He loves it anyway, which counts as a prank.
4. **Dinner Bell**: ring the dinner bell. He runs to the table and finds nothing. Hee hee.

**Big Prank minigame: The Great Eating Contest** (15 MP). Mr. Pig and Mr. Big Pig race to eat a pie stack. Arrow-style prompts appear using **W/A/S/D** letters; pressing the right key eats a bite. Mr. Big Pig eats at a steady pace that Mr. Pig can beat with moderate accuracy. The twist is that Mr. Pig wins by swapping Big Pig's pie for a cardboard pie at the halfway point (cutscene). Losing just restarts with a slightly slower Big Pig, so the player can never get stuck.

### Area 2: Sir Oinks A Lot's Castle (~8 min)
**Stealth:** guard pigs patrol with visible vision cones. If spotted, there's a short "HALT! OINK!" bit and Mr. Pig is placed back at the room entrance with no penalty. Snorting behind a guard distracts him and makes him turn around for 3 seconds. Keep rooms small (3–4 rooms) and patrols readable.

Pranks (10 MP each):
1. **Pink Armor**: sneak into the armory and dunk Sir Oinks's armor in pink paint.
2. **Banner Swap**: replace his heroic banner with a doodle of Mr. Pig.
3. **Helmet Hide**: hide his helmet in the moat-side well.
4. **Royal Whoopee Cushion**: put it on his throne, and he sits on it in a cutscene.

**Big Prank minigame: The Joust** (15 MP). A side view of the two charging on hobby horses. A timing bar has a sweet-spot zone, and pressing **Space** in the zone lands a hit. It's best of 3. Sir Oinks's armor is still pink and he's too embarrassed to aim straight, so the sweet spot is generous. If you lose, you simply re-joust.

### Area 3: The Shleepy Caves (~8 min)
The Shleepy Stone's home: glowing mushrooms, crystals, soft purple light.

**Push puzzles (Sokoban rules on a 16px grid), 4 rooms**, 5 MP each:
- Mr. Pig pushes the Shleepy Stone (and in later rooms, ordinary rocks) onto glowing pressure plates to open the exit door.
- **Shleepy mechanic:** after every **3 pushes**, the Stone falls asleep and can't be pushed. Snorting next to her wakes her. Ordinary rocks never sleep.
- Room 1 teaches pushing, Room 2 teaches the sleep/snort cycle, Room 3 adds ordinary rocks, and Room 4 combines everything (moderate, not brutal).
- **R** restarts a room instantly. Each room shows a move counter, but there's no move limit.
- Hide 2 cheeses per room, reachable without breaking the puzzle.
- **Every room must be verified as solvable by `scripts/solve-caves.mjs`** (a BFS over player position + rock positions; the solver has to model the sleep counter and snort wake-ups). Store the found solution next to each level, and run a Playwright test that replays it.
- Pranks in the caves (5 MP each): snort to make a sleeping bat drop its hat, and draw a mustache on a cave crystal (interact).

**Big Prank minigame: The Bad Dreams** (20 MP). After the last room, the Shleepy Stone falls into a deep sleep in her cozy nook and starts having bad dreams. Mr. Pig jumps into her dream to protect her.
- A top-down arena on a dreamy twilight background. The sleeping Stone sits in the center with **5 dream-hearts**.
- Nightmares (shadowy blobs, grumpy storm clouds, spiky "Monday" alarm clocks) drift toward her from the edges in waves.
- Mr. Pig moves with **WASD**. **Shift** releases a snort shockwave (radius around about 2.5 tiles, 0.6s cooldown, with a visible ring) that poofs nightmares into sparkles.
- Survive **75 seconds** across 3 escalating waves; the final wave includes one big "Rock Bottom" nightmare that takes 3 snorts.
- If she loses all her hearts, she shifts in her sleep and the wave restarts, with no penalty and a slightly easier difficulty.
- On success, the nightmares turn into pleasant dreams (floating cheese, little hearts, Mr. Pig dancing) and she wakes up smiling: *"Mr. Pig... I dreamed you were a hero. Zzz... I mean, a menace."*

The cave pranks are deliberately "gentle" mischief, since she's his friend.

### Finale: Annarose's House (~4 min)
- The house unlocks once all 3 Big Pranks are done. Mr. Big Pig and Sir Oinks A Lot are already there, each trying to impress her with an unimpressive "prank" (Big Pig: "I... ate a whole pie?"; Sir Oinks: "I said oink at a duck. Oink.").
- Annarose judges them both and is unimpressed. Mr. Pig steps up, and a montage of his best pranks plays as quick vignettes using the earlier sprites, while his Mischief Meter fills to *Legendary Mischief Pig*.
- **The final prank:** Mr. Pig snorts, the lights go out, and when they come back on the whole cast has thrown a surprise birthday party (balloons, cake, confetti; even the rivals join in).
- Annarose laughs and declares Mr. Pig the most mischievous pig in the land, then she **cuddles Mr. Pig** with a big heart burst.
- Cheese callout: *"You found X of 30 cheeses!"* With all 30, the bonus cuddle plays (extra hearts, and the Shleepy Stone and rivals join a group cuddle pile).
- **Final screen:** the scene fades to a soft background with floating hearts and pigs, and shows this message centered, large, typed out slowly:

  > **Annarose I love you so much. Happy Birthday.**

  The message must be **exactly** that text. Hold it on screen until the player presses Space, then roll short credits ("Starring: Mr. Pig, Mr. Big Pig, Sir Oinks A Lot, the Shleepy Stone, and Annarose") and return to the title. After completion, the title screen shows a little crown on Mr. Pig.

---

## 8. Writing Guidelines
- Short dialogue lines (fits the 320px box, max ~3 lines per page).
- Each character has a voice: Mr. Pig is cheeky ("Hee hee."), Mr. Big Pig is slow and food-focused, Sir Oinks A Lot is grandiose with constant "oink"s, and the Stone trails off into "zzz..." mid-sentence. Annarose is playful, teasing, and impressed only at the end.
- Kind humor only. Nobody is mean; the rivals are lovable.
- Every prank gets a funny reaction line from its victim.

---

## 9. Build Order (commit after each milestone with a descriptive message)
1. Scaffold Vite + Phaser, scaling/letterbox, scene list, input mapping, pause menu, save/load state.
2. Palette, sprite grid system, texture builder, preview render script. Draw all characters → **art self-check pass**.
3. Dialogue box, HUD (Mischief Meter, cheese counter), toast notifications, bitmap font.
4. Audio: SFX + music sequencer + all songs, mute toggle.
5. Title, Intro, Hub (tilemaps defined in code as arrays).
6. Farm + pranks + Eating Contest.
7. Castle + stealth + pranks + Joust.
8. Caves + Sokoban rooms + solver verification + Bad Dreams minigame.
9. Finale, final message, credits, post-game title.
10. Polish: screen transitions (fade), particles (mud splash, confetti, z's, sparkles), small camera shake on big moments, and balance the playtime to about 30 minutes.
11. Full test pass (§10), fix everything, production build, check `dist/`.

---

## 10. Testing & Verification (required before calling it done)
- **Debug mode** via `?debug=1`: number keys **1–6** warp to Hub/Farm/Castle/Caves/Dream/Finale, **G** grants 100 MP, **C** grants all cheese, **F** completes the current area. Debug must be off by default and invisible in normal play.
- Expose `window.__game` and `window.__state` in debug mode only, so tests can read state.
- **Playwright tests** (`npm test`):
  - Boots with zero console errors or warnings from game code.
  - Title → New Game → Intro reaches the Hub.
  - Each area loads via debug warp and its key NPCs and objects exist.
  - Each cave room's stored solution, replayed as key presses, solves the room.
  - Eating Contest, Joust, and Bad Dreams can each be completed (scripted inputs, or debug auto-win hooks that call the same completion code path).
  - The Finale reaches the final message, and the rendered text exactly equals `Annarose I love you so much. Happy Birthday.`
  - Save/load: complete the Farm, reload the page, Continue, and the Farm is still complete.
  - Take screenshots of every scene into `/preview/scenes/` and **look at them** for visual bugs.
- `node scripts/solve-caves.mjs` must report every room as solvable.
- `npm run build` succeeds, and `dist/` contains **no** files from `assets/references/`.
- Do a final read-through of all dialogue for typos.

---

## 11. Definition of Done
- [ ] The game can be played start to finish in about 30 minutes with no soft-locks.
- [ ] All characters are drawn from their references and recognizable, with the self-check done.
- [ ] 30 cheeses placed, all reachable, counter accurate, and the all-cheese bonus works.
- [ ] WASD / Space / Shift controls work everywhere, along with R, M, and Esc.
- [ ] Synthesized music and SFX in every scene, with mute saved.
- [ ] Autosave and Continue work.
- [ ] The final message is shown exactly as specified.
- [ ] All tests pass, the solver passes, the build passes, and no reference photos are in `dist/`.
- [ ] A `README.md` covering: how to run (`npm install && npm run dev`), how to build, how to deploy to GitHub Pages, and the controls.