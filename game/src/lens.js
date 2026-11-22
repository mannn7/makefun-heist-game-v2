// Wall cameras: they sweep their cone back and forth on their mount.
// An EMP blinds them for a while; while blinded they see nothing and
// their cone goes dark.
import { CAMERA } from './settings.js';
import { spotStrength } from './sight.js';

/** Advance one camera's sweep by dt seconds. */
export function stepCamera(cam, dt, time) {
  if (cam.blinded > 0) {
    cam.blinded = Math.max(0, cam.blinded - dt);
    return;
  }
  cam.dir = cam.base + Math.sin(time * CAMERA.sweep + cam.phase) * CAMERA.sweepAmp;
}

/** How strongly this camera spots the thief (0 when blinded or hidden). */
export function cameraSees(cam, thief, solids, inSmoke) {
  if (cam.blinded > 0 || inSmoke) return 0;
  return spotStrength(cam, CAMERA.coneRange, CAMERA.coneHalf, thief, solids, thief.sneak);
}
