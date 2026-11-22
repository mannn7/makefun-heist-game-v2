// Sight math: vision cones and line of sight against the museum's walls.
// Everything here is pure geometry — no canvas, no DOM — so the same code
// drives the game, the autopilot and the Node simulation.
export function angleTo(x1, y1, x2, y2) {
  return Math.atan2(y2 - y1, x2 - x1);
}

/** Smallest absolute difference between two angles, in [0, PI]. */
export function angleGap(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return Math.abs(d);
}

export function distance(x1, y1, x2, y2) {
  return Math.hypot(x2 - x1, y2 - y1);
}

/** True when (tx, ty) sits inside the cone from (ox, oy) facing `dir`. */
export function insideCone(ox, oy, dir, range, half, tx, ty) {
  const d = distance(ox, oy, tx, ty);
  if (d > range) return false;
  if (d < 1) return true;
  return angleGap(angleTo(ox, oy, tx, ty), dir) <= half;
}

/** True when segment (x1,y1)-(x2,y2) hits the axis-aligned rectangle r. */
function segmentHitsRect(x1, y1, x2, y2, r) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  let tmin = 0;
  let tmax = 1;
  if (dx === 0) {
    if (x1 < r.x || x1 > r.x + r.w) return false;
  } else {
    let t1 = (r.x - x1) / dx;
    let t2 = (r.x + r.w - x1) / dx;
    if (t1 > t2) {
      const tmp = t1;
      t1 = t2;
      t2 = tmp;
    }
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return false;
  }
  if (dy === 0) {
    if (y1 < r.y || y1 > r.y + r.h) return false;
  } else {
    let t1 = (r.y - y1) / dy;
    let t2 = (r.y + r.h - y1) / dy;
    if (t1 > t2) {
      const tmp = t1;
      t1 = t2;
      t2 = tmp;
    }
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return false;
  }
  return true;
}

/**
 * True when nothing solid stands between the watcher and the point.
 * `solids` are the wall rectangles plus display cases and statues.
 */
export function lineIsClear(x1, y1, x2, y2, solids) {
  for (let i = 0; i < solids.length; i += 1) {
    if (segmentHitsRect(x1, y1, x2, y2, solids[i])) return false;
  }
  return true;
}

/**
 * How strongly a watcher spots the thief: 0 when out of cone, out of range
 * or behind cover, otherwise 1, halved while the thief sneaks.
 */
export function spotStrength(watcher, range, half, thief, solids, sneaking) {
  if (!insideCone(watcher.x, watcher.y, watcher.dir, range, half, thief.x, thief.y)) return 0;
  if (!lineIsClear(watcher.x, watcher.y, thief.x, thief.y, solids)) return 0;
  return sneaking ? 0.4 : 1;
}
