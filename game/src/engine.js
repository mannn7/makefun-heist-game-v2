// The engine: the whole game as pure logic — no canvas, no DOM — so the
// same step function runs in the browser, in the screenshot stager and in
// a Node simulation. Phases: title, play, caught, win, lockdown, timeout.
import { ALARM, CAMERA, GADGET, GUARD, THIEF, VIEW } from './settings.js';
import { buildNight } from './museum.js';
import { angleGap, distance, insideCone, lineIsClear } from './sight.js';
import { cameraSees, stepCamera } from './lens.js';
import { guardSees, stepGuard } from './patrol.js';
import { insideSmoke, makeThief, moveThief, scoopCoins, tryGrab } from './burglar.js';
import { buyGadget, lureNearestGuard, useGadget } from './gadgets.js';

export const STEP = 1 / 60;

export function createGame(nightIndex) {
  const world = buildNight(nightIndex);
  return {
    world,
    thief: makeThief(world.spawn),
    guards: world.guards,
    cameras: world.cameras,
    alarm: 0,
    timeLeft: world.seconds,
    time: 0,
    phase: 'title',
    score: 0,
    result: null, // 'win' | 'caught' | 'lockdown' | 'timeout'
    smoke: null, // {x, y, radius, left}
    noise: null, // {x, y, left}
    armedNoise: false, // noisemaker armed, waiting for a click
    flashes: [], // one-frame event notes for sound: 'grab' | 'coin' | 'seen' | 'buy' | 'gadget'
    exitOpen: false,
  };
}

/** True when the thief has lifted every masterpiece this night asks for. */
export function lootDone(game) {
  return game.thief.lootTaken >= game.world.required;
}

function applyGadget(game, effect) {
  if (effect.kind === 'emp') {
    for (let i = 0; i < game.cameras.length; i += 1) game.cameras[i].blinded = effect.seconds;
    game.flashes.push('gadget');
  } else if (effect.kind === 'smoke') {
    game.smoke = { x: effect.x, y: effect.y, radius: effect.radius, left: effect.left };
    game.flashes.push('gadget');
  } else if (effect.kind === 'noise') {
    game.noise = { x: effect.x, y: effect.y, left: 4 };
    lureNearestGuard(game.guards, effect.x, effect.y);
    game.flashes.push('gadget');
  }
}

/**
 * Advance the game by dt seconds with the current input.
 * Returns an event string when the night ends ('win' | 'caught' |
 * 'lockdown' | 'timeout'), otherwise null.
 */
export function stepGame(game, input, dt) {
  if (game.phase !== 'play') return null;
  game.time += dt;
  game.timeLeft -= dt;
  if (game.timeLeft <= 0) {
    game.timeLeft = 0;
    game.phase = 'timeout';
    game.result = 'timeout';
    return 'timeout';
  }

  const thief = game.thief;
  if (thief.grabCooldown > 0) thief.grabCooldown -= dt;
  if (game.smoke) {
    game.smoke.left -= dt;
    if (game.smoke.left <= 0) game.smoke = null;
  }
  if (game.noise) {
    game.noise.left -= dt;
    if (game.noise.left <= 0) game.noise = null;
  }

  // Gadget keys: 1 EMP, 2 arms the noisemaker, 3 smoke. A click on the
  // floor throws an armed noisemaker to that spot.
  if (input.buyKind) {
    if (buyGadget(thief, input.buyKind)) game.flashes.push('buy');
  }
  if (input.useKind === 'emp' || input.useKind === 'smoke') {
    const effect = useGadget(thief, input.useKind);
    if (effect) applyGadget(game, effect);
  } else if (input.useKind === 'noise') {
    if (thief.gadgets.noise > 0) game.armedNoise = true;
  }
  if (game.armedNoise && input.throwAt) {
    const effect = useGadget(thief, 'noise', input.throwAt.x, input.throwAt.y);
    if (effect) applyGadget(game, effect);
    game.armedNoise = false;
  }
  if (input.card) {
    const effect = useGadget(thief, input.card);
    if (effect) applyGadget(game, effect);
  }

  moveThief(thief, input, dt, game.world.solids);
  if (input.grab) {
    const piece = tryGrab(thief, game.world.loot);
    if (piece) game.flashes.push('grab');
  }
  if (scoopCoins(thief, game.world.coins) > 0) game.flashes.push('coin');

  const hidden = insideSmoke(thief, game.smoke);

  // Cameras sweep and watch.
  let seen = 0;
  for (let i = 0; i < game.cameras.length; i += 1) {
    const cam = game.cameras[i];
    stepCamera(cam, dt, game.time);
    seen = Math.max(seen, cameraSees(cam, thief, game.world.solids, hidden));
  }

  // Guards patrol, chase, and watch. A catch ends the night at once.
  for (let i = 0; i < game.guards.length; i += 1) {
    const g = game.guards[i];
    const strength = guardSees(g, thief, game.world.solids, hidden);
    seen = Math.max(seen, strength);
    if (stepGuard(g, dt, thief, game.world.solids, strength) === 'caught') {
      game.phase = 'caught';
      game.result = 'caught';
      return 'caught';
    }
  }

  // The alarm climbs while anyone sees the thief, cools while nobody does.
  if (seen > 0) {
    const rate = seen >= 1 ? ALARM.guardRate : ALARM.guardRate * ALARM.sneakFactor;
    game.alarm = Math.min(ALARM.max, game.alarm + rate * dt);
    if (game.alarm > 55) game.flashes.push('seen');
  } else {
    game.alarm = Math.max(0, game.alarm - ALARM.decay * dt);
  }
  if (game.alarm >= ALARM.max) {
    game.phase = 'lockdown';
    game.result = 'lockdown';
    return 'lockdown';
  }

  // The getaway door opens once every masterpiece is lifted.
  game.exitOpen = lootDone(game);
  const exit = game.world.exit;
  if (
    game.exitOpen &&
    thief.x + THIEF.radius > exit.x - 10 &&
    thief.x - THIEF.radius < exit.x + exit.w + 10 &&
    thief.y + THIEF.radius > exit.y - 10 &&
    thief.y - THIEF.radius < exit.y + exit.h + 10
  ) {
    game.phase = 'win';
    game.result = 'win';
    game.score = thief.lootValue + thief.coins * GADGET.coinValue + Math.round(game.timeLeft) * 10;
    return 'win';
  }
  return null;
}

/** True when the probe point is inside a solid (inflated by the thief). */
function probeBlocked(x, y, solids) {
  for (let i = 0; i < solids.length; i += 1) {
    const r = solids[i];
    const cx = Math.max(r.x, Math.min(x, r.x + r.w));
    const cy = Math.max(r.y, Math.min(y, r.y + r.h));
    const rr = THIEF.radius + 4;
    if ((x - cx) * (x - cx) + (y - cy) * (y - cy) < rr * rr) return true;
  }
  return false;
}

/** Danger of standing at (x, y): cones covering it, or a guard too close.
 * A brief cone crossing costs little alarm, so cones are a nudge, not a
 * wall; only a guard close enough to grab is a hard stop. */
function probeDanger(x, y, game) {
  let danger = 0;
  for (let i = 0; i < game.guards.length; i += 1) {
    const g = game.guards[i];
    if (
      insideCone(g.x, g.y, g.dir, GUARD.coneRange, GUARD.coneHalf, x, y) &&
      lineIsClear(g.x, g.y, x, y, game.world.solids)
    ) {
      danger += 120;
    }
    const d = distance(x, y, g.x, g.y);
    if (d < 45) danger += 500;
    else if (d < 110) danger += 100;
  }
  for (let i = 0; i < game.cameras.length; i += 1) {
    const cam = game.cameras[i];
    if (cam.blinded > 0) continue;
    if (
      insideCone(cam.x, cam.y, cam.dir, CAMERA.coneRange, CAMERA.coneHalf, x, y) &&
      lineIsClear(cam.x, cam.y, x, y, game.world.solids)
    ) {
      danger += 100;
    }
  }
  return danger;
}

/**
 * A simple autopilot for staged screenshots and simulations: steer toward
 * the nearest objective (loot, then the exit) while dodging vision cones.
 * It waits in cover when every way forward is watched, and dashes in when
 * the cone sweeps away. Returns an input object for one step.
 */
export function autopilot(game, reckless) {
  const thief = game.thief;
  const input = {
    left: false, right: false, up: false, down: false,
    sneak: false, grab: false, useKind: null, buyKind: null, throwAt: null, card: null, anyKey: true,
  };
  let target = null;
  // Flee: while a guard chases, or one is close enough to walk into the
  // thief, run at full speed away from them — a sneaking thief can never
  // outrun a chasing guard, and a guard's patrol can turn into you.
  let chaser = null;
  for (let i = 0; i < game.guards.length; i += 1) {
    const g = game.guards[i];
    if (g.state === 'chase' || distance(thief.x, thief.y, g.x, g.y) < 100) {
      chaser = g;
      break;
    }
  }
  if (chaser) {
    let bestD = -Infinity;
    let bestAngle = null;
    for (let k = 0; k < 8; k += 1) {
      const a = (k / 8) * Math.PI * 2;
      let px = thief.x + Math.cos(a) * 60;
      let py = thief.y + Math.sin(a) * 60;
      px = Math.max(24 + THIEF.radius, Math.min(VIEW.width - 24 - THIEF.radius, px));
      py = Math.max(24 + THIEF.radius, Math.min(VIEW.height - 24 - THIEF.radius, py));
      if (probeBlocked(px, py, game.world.solids)) continue;
      // Flee from the guard, but prefer open floor toward the room's
      // centre over backing into a corner.
      const d = distance(px, py, chaser.x, chaser.y) - 0.3 * distance(px, py, 640, 360);
      if (d > bestD) {
        bestD = d;
        bestAngle = a;
      }
    }
    if (bestAngle !== null) {
      const dx = Math.cos(bestAngle);
      const dy = Math.sin(bestAngle);
      input.left = dx < -0.3;
      input.right = dx > 0.3;
      input.up = dy < -0.3;
      input.down = dy > 0.3;
      input.sneak = false;
    }
    return input;
  }
  if (!lootDone(game)) {
    let bestD = Infinity;
    for (let i = 0; i < game.world.loot.length; i += 1) {
      const piece = game.world.loot[i];
      if (piece.taken) continue;
      const d = distance(thief.x, thief.y, piece.x, piece.y);
      if (d < bestD) {
        bestD = d;
        target = piece;
      }
    }
    if (target && bestD < THIEF.grabRange) input.grab = true;
  } else {
    const exit = game.world.exit;
    target = { x: exit.x + exit.w / 2, y: exit.y + exit.h / 2 };
  }
  if (!target) return input;
  const distToTarget = distance(thief.x, thief.y, target.x, target.y);

  // Stuck rescue: when the thief has pushed for a while without getting
  // closer, sidestep along a perpendicular lane for a moment, then resume.
  if (!game.pilot) game.pilot = { last: Infinity, still: 0, detour: 0, angle: 0 };
  const pilot = game.pilot;
  if (pilot.detour > 0) {
    pilot.detour -= 1;
    const dx = Math.cos(pilot.angle);
    const dy = Math.sin(pilot.angle);
    input.left = dx < -0.3;
    input.right = dx > 0.3;
    input.up = dy < -0.3;
    input.down = dy > 0.3;
    input.sneak = true;
    return input;
  }

  // Try eight headings; score each by danger (cones) plus distance left.
  // Headings into a wall are skipped, and the probe is clamped to the
  // walkable floor so the exit door on the east wall stays reachable.
  // A small bonus for keeping the current heading stops the thief from
  // jittering between two equally good ways around an obstacle.
  let bestScore = Infinity;
  let bestAngle = null;
  let bestDanger = 0;
  for (let k = 0; k < 8; k += 1) {
    const a = (k / 8) * Math.PI * 2;
    let px = thief.x + Math.cos(a) * 60;
    let py = thief.y + Math.sin(a) * 60;
    px = Math.max(24 + THIEF.radius, Math.min(VIEW.width - 24 - THIEF.radius, px));
    py = Math.max(24 + THIEF.radius, Math.min(VIEW.height - 24 - THIEF.radius, py));
    if (probeBlocked(px, py, game.world.solids)) continue;
    const danger = reckless ? 0 : probeDanger(px, py, game);
    let score = distance(px, py, target.x, target.y) + danger;
    if (Math.abs(angleGap(a, thief.dir)) < 0.8) score -= 15;
    if (score < bestScore) {
      bestScore = score;
      bestAngle = a;
      bestDanger = danger;
    }
  }
  if (bestAngle === null) return input;
  // Wait in cover only when the way forward is genuinely hot (a guard
  // close enough to grab, or overlapping cones) and the goal is far;
  // a lone cone is cheap alarm, so cross it and keep moving. Never wait
  // when a guard is close enough to walk into the hiding spot.
  let nearestGuard = Infinity;
  for (let i = 0; i < game.guards.length; i += 1) {
    nearestGuard = Math.min(nearestGuard, distance(thief.x, thief.y, game.guards[i].x, game.guards[i].y));
  }
  if (!reckless && bestDanger >= 300 && probeDanger(thief.x, thief.y, game) === 0 && distToTarget > 80 && nearestGuard > 130) {
    input.sneak = true;
    pilot.still = 0;
    return input;
  }
  const dx = Math.cos(bestAngle);
  const dy = Math.sin(bestAngle);
  input.left = dx < -0.3;
  input.right = dx > 0.3;
  input.up = dy < -0.3;
  input.down = dy > 0.3;
  input.sneak = !reckless;
  // Track progress: if the goal is not getting closer, sidestep soon.
  if (distToTarget < pilot.last - 2) {
    pilot.last = distToTarget;
    pilot.still = 0;
  } else {
    pilot.still += 1;
    if (pilot.still > 90) {
      pilot.still = 0;
      pilot.detour = 50;
      const toTarget = Math.atan2(target.y - thief.y, target.x - thief.x);
      pilot.angle = toTarget + Math.PI / 2;
      for (const side of [toTarget + Math.PI / 2, toTarget - Math.PI / 2]) {
        const px = thief.x + Math.cos(side) * 60;
        const py = thief.y + Math.sin(side) * 60;
        if (!probeBlocked(px, py, game.world.solids)) {
          pilot.angle = side;
          break;
        }
      }
    }
  }
  return input;
}
