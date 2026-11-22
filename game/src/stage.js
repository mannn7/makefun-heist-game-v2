// Staged screenshot scenes: each one plays the real rules forward from a
// fresh night for a fixed number of steps, steered by the autopilot, so
// the frame is what a short game really looks like — and the same seed
// always gives the same frame. Scenes: cover, smoke, alarm, getaway.
import { STEP, autopilot, createGame, stepGame } from './engine.js';
import { makeInput } from './input.js';
import { distance, lineIsClear } from './sight.js';

const SCENES = {
  cover: { night: 0, seconds: 9, reckless: false, gadget: null },
  smoke: { night: 0, seconds: 18, reckless: false, gadget: 'smoke' },
  alarm: { night: 0, seconds: 8, reckless: false, gadget: null },
  getaway: { night: 0, seconds: 400, reckless: false, gadget: null },
};

function pointIsFree(x, y, solids) {
  if (x < 60 || x > 1220 || y < 60 || y > 660) return false;
  for (let i = 0; i < solids.length; i += 1) {
    const r = solids[i];
    const cx = Math.max(r.x, Math.min(x, r.x + r.w));
    const cy = Math.max(r.y, Math.min(y, r.y + r.h));
    if ((x - cx) * (x - cx) + (y - cy) * (y - cy) < 20 * 20) return false;
  }
  return true;
}

/**
 * For the alarm scene, keep the thief standing in the north camera's cone
 * for a few seconds: cameras watch but never chase, so the alarm climbs
 * while the thief stays put in the open.
 */
function forceExposed(game, cam) {
  const thief = game.thief;
  thief.sneak = false;
  // Stay on the cone's centre line: try several distances along the
  // camera's current facing so the spot is open floor, not inside a case.
  for (const dist of [100, 80, 120, 60, 140]) {
    const x = cam.x + Math.cos(cam.dir) * dist;
    const y = cam.y + Math.sin(cam.dir) * dist;
    if (pointIsFree(x, y, game.world.solids) && lineIsClear(cam.x, cam.y, x, y, game.world.solids)) {
      thief.x = x;
      thief.y = y;
      thief.dir = Math.atan2(cam.y - y, cam.x - x);
      return;
    }
  }
}

/**
 * Set the game to the named scene and return the phase to draw.
 * Unknown names fall back to the cover scene.
 */
export function stageScene(name, game) {
  const scene = SCENES[name] || SCENES.cover;
  const fresh = createGame(scene.night);
  fresh.phase = 'play';
  const input = makeInput();
  const steps = Math.floor(scene.seconds / STEP);
  let usedGadget = false;
  for (let i = 0; i < steps; i += 1) {
    const pilot = autopilot(fresh, scene.reckless);
    // Smoke scene: pop the smoke bomb near the end so the cloud is still
    // thick when the frame is taken.
    if (scene.gadget === 'smoke' && !usedGadget && fresh.time > scene.seconds - 3.5 && fresh.thief.gadgets.smoke > 0) {
      pilot.useKind = 'smoke';
      usedGadget = true;
    }
    const event = stepGame(fresh, pilot, STEP);
    if (event) break;
  }
  if (name === 'alarm' && fresh.phase === 'play') {
    // Keep the thief standing in the north camera's sweeping cone so the
    // alarm climbs while nobody can grab them.
    const cam = fresh.cameras[0];
    const still = makeInput();
    for (let i = 0; i < Math.floor(2.5 / STEP); i += 1) {
      forceExposed(fresh, cam);
      if (stepGame(fresh, still, STEP)) break;
    }
  }
  // Copy the staged state into the game the renderer draws.
  game.world = fresh.world;
  game.thief = fresh.thief;
  game.guards = fresh.guards;
  game.cameras = fresh.cameras;
  game.alarm = fresh.alarm;
  game.timeLeft = fresh.timeLeft;
  game.time = fresh.time;
  game.score = fresh.score;
  game.smoke = fresh.smoke;
  game.noise = fresh.noise;
  game.armedNoise = false;
  game.exitOpen = fresh.exitOpen;
  // The getaway scene shows the thief at the open door with the loot done.
  game.phase = fresh.phase === 'play' ? 'play' : fresh.phase;
  game.result = fresh.result;
  return game.phase;
}
