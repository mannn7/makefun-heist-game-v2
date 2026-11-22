// Gadgets: the thief's three tools. Each costs coins to buy and does one
// job — blind the cameras, pull a guard away, or hide in smoke.
// Using a gadget spends one charge; buying one spends coins.
import { GADGET } from './settings.js';
import { distance } from './sight.js';

export const GADGET_KINDS = ['emp', 'noise', 'smoke'];

export const GADGET_INFO = {
  emp: { name: 'EMP Burst', price: GADGET.empPrice, key: '1', blurb: 'Blinds every camera for 8s' },
  noise: { name: 'Noisemaker', price: GADGET.noisePrice, key: '2', blurb: 'Lures the nearest guard' },
  smoke: { name: 'Smoke Bomb', price: GADGET.smokePrice, key: '3', blurb: 'Hides you for 6s' },
};

/** Buy one charge of `kind` with coins. Returns true when it worked. */
export function buyGadget(thief, kind) {
  const price = GADGET_INFO[kind].price;
  if (thief.coins < price) return false;
  thief.coins -= price;
  thief.gadgets[kind] += 1;
  return true;
}

/**
 * Spend one charge of `kind`. Returns an effect object the engine applies:
 * emp blinds cameras, noise lures a guard to (tx, ty), smoke drops a cloud.
 * Returns null when the thief has no charge left.
 */
export function useGadget(thief, kind, tx, ty) {
  if (thief.gadgets[kind] <= 0) return null;
  thief.gadgets[kind] -= 1;
  if (kind === 'emp') return { kind: 'emp', seconds: GADGET.empSeconds };
  if (kind === 'smoke') {
    return { kind: 'smoke', x: thief.x, y: thief.y, radius: 95, left: GADGET.smokeSeconds };
  }
  return { kind: 'noise', x: tx ?? thief.x, y: ty ?? thief.y };
}

/** Send the nearest guard to investigate the noisemaker's landing spot. */
export function lureNearestGuard(guards, x, y) {
  let best = null;
  let bestD = Infinity;
  for (let i = 0; i < guards.length; i += 1) {
    const d = distance(guards[i].x, guards[i].y, x, y);
    if (d < bestD) {
      best = guards[i];
      bestD = d;
    }
  }
  if (best) {
    best.lure = { x, y };
    best.state = 'investigate';
  }
  return best;
}
