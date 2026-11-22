// The thief: movement with wall sliding, sneaking, lifting masterpieces
// and scooping up coin stacks. Movement is axis-separated so the thief
// slides along display cases instead of catching on their corners.
import { THIEF, VIEW, WALL } from './settings.js';
import { distance } from './sight.js';

export function makeThief(spawn) {
  return {
    x: spawn.x,
    y: spawn.y,
    dir: 0,
    sneak: false,
    moving: false,
    coins: 0,
    lootTaken: 0,
    lootValue: 0,
    gadgets: { emp: 0, noise: 0, smoke: 1 },
    smokeLeft: 0,
    grabCooldown: 0,
  };
}

function hitsSolid(x, y, solids) {
  for (let i = 0; i < solids.length; i += 1) {
    const r = solids[i];
    const cx = Math.max(r.x, Math.min(x, r.x + r.w));
    const cy = Math.max(r.y, Math.min(y, r.y + r.h));
    if ((x - cx) * (x - cx) + (y - cy) * (y - cy) < THIEF.radius * THIEF.radius) return true;
  }
  return false;
}

/** Move the thief by the held keys for dt seconds. */
export function moveThief(thief, input, dt, solids) {
  let dx = 0;
  let dy = 0;
  if (input.left) dx -= 1;
  if (input.right) dx += 1;
  if (input.up) dy -= 1;
  if (input.down) dy += 1;
  thief.moving = dx !== 0 || dy !== 0;
  if (!thief.moving) return;
  const len = Math.hypot(dx, dy);
  const speed = (input.sneak ? THIEF.sneak : THIEF.walk) * dt;
  thief.sneak = !!input.sneak;
  const mx = (dx / len) * speed;
  const my = (dy / len) * speed;
  thief.dir = Math.atan2(dy, dx);
  const nx = Math.max(WALL + THIEF.radius, Math.min(VIEW.width - WALL - THIEF.radius, thief.x + mx));
  if (!hitsSolid(nx, thief.y, solids)) thief.x = nx;
  const ny = Math.max(WALL + THIEF.radius, Math.min(VIEW.height - WALL - THIEF.radius, thief.y + my));
  if (!hitsSolid(thief.x, ny, solids)) thief.y = ny;
}

/**
 * Lift the nearest masterpiece in reach when the player presses grab.
 * Returns the piece lifted, or null.
 */
export function tryGrab(thief, loot) {
  if (thief.grabCooldown > 0) return null;
  let best = null;
  let bestD = THIEF.grabRange;
  for (let i = 0; i < loot.length; i += 1) {
    const piece = loot[i];
    if (piece.taken) continue;
    const d = distance(thief.x, thief.y, piece.x, piece.y);
    if (d < bestD) {
      best = piece;
      bestD = d;
    }
  }
  if (!best) return null;
  best.taken = true;
  thief.lootTaken += 1;
  thief.lootValue += best.value;
  thief.grabCooldown = 0.35;
  return best;
}

/** Scoop up every coin stack the thief walks over. Returns coins gained. */
export function scoopCoins(thief, coins) {
  let gained = 0;
  for (let i = 0; i < coins.length; i += 1) {
    const coin = coins[i];
    if (coin.taken) continue;
    if (distance(thief.x, thief.y, coin.x, coin.y) < THIEF.coinRange) {
      coin.taken = true;
      gained += 1;
    }
  }
  thief.coins += gained;
  return gained;
}

/** True when the thief stands inside the smoke cloud. */
export function insideSmoke(thief, cloud) {
  if (!cloud || cloud.left <= 0) return false;
  return distance(thief.x, thief.y, cloud.x, cloud.y) < cloud.radius;
}
