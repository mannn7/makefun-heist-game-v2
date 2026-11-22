// Guards: they walk their patrol route, pause at each corner to scan the
// room, chase a thief they can see, and walk to a noise they heard.
// All movement is axis-separated so a guard slides along walls instead of
// sticking to them.
import { GUARD } from './settings.js';
import { angleGap, angleTo, distance, lineIsClear, spotStrength } from './sight.js';

function blocked(x, y, radius, solids) {
  for (let i = 0; i < solids.length; i += 1) {
    const r = solids[i];
    const cx = Math.max(r.x, Math.min(x, r.x + r.w));
    const cy = Math.max(r.y, Math.min(y, r.y + r.h));
    if ((x - cx) * (x - cx) + (y - cy) * (y - cy) < radius * radius) return true;
  }
  return false;
}

function slideMove(body, dx, dy, radius, solids) {
  const nx = body.x + dx;
  if (!blocked(nx, body.y, radius, solids)) body.x = nx;
  const ny = body.y + dy;
  if (!blocked(body.x, ny, radius, solids)) body.y = ny;
}

/** One patrol step: walk toward the next corner, pause and scan there. */
function patrolStep(g, dt, solids) {
  const target = g.path[(g.leg + 1) % g.path.length];
  if (g.pauseLeft > 0) {
    g.pauseLeft -= dt;
    g.dir += GUARD.scan * dt;
    return;
  }
  const d = distance(g.x, g.y, target[0], target[1]);
  const speed = GUARD.patrol * dt;
  if (d <= speed) {
    g.x = target[0];
    g.y = target[1];
    g.leg = (g.leg + 1) % g.path.length;
    g.pauseLeft = GUARD.pause;
    return;
  }
  const a = angleTo(g.x, g.y, target[0], target[1]);
  g.dir = a;
  slideMove(g, Math.cos(a) * speed, Math.sin(a) * speed, GUARD.radius, solids);
}

/**
 * Step one guard for dt seconds. Returns 'caught' when the guard grabs the
 * thief, otherwise null. `seen` is how strongly this guard spots the thief
 * right now (0 when hidden).
 */
export function stepGuard(g, dt, thief, solids, seen) {
  if (g.state === 'chase') {
    g.chaseLeft -= dt;
    if (seen > 0) g.chaseLeft = GUARD.chaseTime;
    if (g.chaseLeft <= 0) g.state = 'patrol';
  } else if (seen > 0.55 && distance(g.x, g.y, thief.x, thief.y) < GUARD.coneRange * 0.8) {
    g.state = 'chase';
    g.chaseLeft = GUARD.chaseTime;
  } else if (g.lure) {
    g.state = 'investigate';
  }

  if (g.state === 'chase') {
    const a = angleTo(g.x, g.y, thief.x, thief.y);
    g.dir = a;
    const speed = GUARD.chase * dt;
    slideMove(g, Math.cos(a) * speed, Math.sin(a) * speed, GUARD.radius, solids);
  } else if (g.state === 'investigate' && g.lure) {
    const d = distance(g.x, g.y, g.lure.x, g.lure.y);
    if (d < 24) {
      g.lure = null;
      g.state = 'patrol';
      g.pauseLeft = GUARD.pause;
    } else {
      const a = angleTo(g.x, g.y, g.lure.x, g.lure.y);
      g.dir = a;
      const speed = GUARD.patrol * 1.25 * dt;
      slideMove(g, Math.cos(a) * speed, Math.sin(a) * speed, GUARD.radius, solids);
    }
  } else {
    g.state = 'patrol';
    patrolStep(g, dt, solids);
  }

  if (distance(g.x, g.y, thief.x, thief.y) < GUARD.catchRange) return 'caught';
  return null;
}

/** How strongly this guard spots the thief (0 when hidden). */
export function guardSees(g, thief, solids, inSmoke) {
  if (inSmoke) return 0;
  return spotStrength(g, GUARD.coneRange, GUARD.coneHalf, thief, solids, thief.sneak);
}

/** True when the thief stands in a guard's cone with a clear line of sight. */
export function guardHasLine(g, thief, solids) {
  return (
    distance(g.x, g.y, thief.x, thief.y) < GUARD.coneRange &&
    angleGap(angleTo(g.x, g.y, thief.x, thief.y), g.dir) <= GUARD.coneHalf &&
    lineIsClear(g.x, g.y, thief.x, thief.y, solids)
  );
}
