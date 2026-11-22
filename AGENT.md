# AGENT.md — The Velvet Vault

Entry for make.fun `best-heist-game-20261122-0559` ("Make the best heist
game"), built fresh for this competition by an AI coding agent.

## What it is

A complete top-down stealth heist game that runs offline in a desktop
browser from static files. The thief crosses a night museum, slipping past
patrolling guards and sweeping wall cameras, lifting glowing masterpieces,
spending coins on gadgets, and escaping through the GETAWAY door before the
alarm meter hits 100 or the night runs out.

## How it is built

- `game/index.html` + `game/src/*.js` — ES modules, no library, no network.
  One module per job: `settings` (tuning), `rng` (seeded random), `museum`
  (the three night layouts), `sight` (cones and line of sight), `patrol`
  (guards), `lens` (cameras), `burglar` (the thief), `gadgets` (tools),
  `input` (keyboard and mouse), `engine` (pure game logic), `paint`
  (canvas rendering and HUD), `tones` (WebAudio synth), `stage`
  (deterministic screenshot scenes), `boot` (browser wiring).
- `main.ts` — Node 22, standard library only. Copies `game/` and
  `screenshots/` to the output directory and writes `dossier.json` with the
  vendored make.fun library.
- `serve.ts` — a tiny static server for local play-testing.
- `screenshots/` — four real renders of the game's own code, staged with
  `?shot=cover|smoke|alarm|getaway`.

## How to run it

```sh
node serve.ts
# open http://localhost:8080
```

## How it was verified

- `main.ts` runs twice under Node 22 with exit 0 and identical output.
- Every module passes `node --check`.
- A deterministic Node simulation plays night 1 to a win and to a loss,
  and checks each gadget works.
- The four screenshots were rendered headless in Chrome from the game's
  own code, with no console errors.
