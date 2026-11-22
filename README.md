# The Velvet Vault — a museum heist

[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/mannn7/makefun-heist-game-v2/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/mannn7/makefun-heist-game-v2/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)

**The Velvet Vault** is a top-down stealth game that runs offline in a desktop browser. You are the thief crossing a night museum: marble floors, a red carpet, display cases and statues to hide behind, guards walking patrols with sweeping vision cones, wall cameras sweeping their own cones, masterpieces to lift — and one big **ALARM** meter that decides whether you walk out rich or get caught.

## How to play

- **Move:** WASD or arrow keys. **Shift** to sneak (slower, harder to spot).
- **Lift loot:** walk up to a glowing masterpiece and press **E** (or Space).
- **Tools (buy with coins, use with keys 1/2/3):**
  - **EMP Burst** — blinds every camera for 8 seconds.
  - **Noisemaker** — press 2 to arm it, then click the floor to throw it; the nearest guard walks over to investigate.
  - **Smoke Bomb** — hides you inside a cloud for 6 seconds.
  - Buy more charges with **Shift+1/2/3** or Shift-click a tool card. Coins come from the small stacks scattered around the gallery.
- **Win a night:** lift the required masterpieces, then reach the glowing **GETAWAY** door on the east wall before the alarm hits 100 or the night runs out of time.
- **Lose:** the alarm meter hits 100 (lockdown), a guard grabs you, or dawn arrives.

## The three nights

1. **The Duchess Gallery** — two guards, two cameras, three masterpieces.
2. **The Vault Corridor** — three guards, three cameras, four masterpieces.
3. **The Grand Vault** — four guards, four cameras, five masterpieces.

Each night has three ways across the room — the north gallery behind the statues, the exposed red carpet down the middle, and the south hall — and every guard pauses at each patrol corner to look around, which is your fair window to slip past.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

No build step, no network requests: `game/` is plain static files, and all sound is synthesized with WebAudio (no audio files).

## Screenshots

The cover and the other shots are real renders of the game's own code, staged with `?shot=cover|smoke|alarm|getaway` (see `game/src/stage.js`).
