// Keyboard and mouse input: one small object the engine reads every step.
// Arrow keys and WASD move, Shift sneaks, E or Space grabs loot, 1/2/3 use
// a gadget, Shift+1/2/3 buys one, and a click throws the noisemaker or
// uses the gadget card under the cursor.
export function makeInput() {
  return {
    left: false,
    right: false,
    up: false,
    down: false,
    sneak: false,
    grab: false,
    useKind: null, // 'emp' | 'noise' | 'smoke' when a gadget key was pressed
    buyKind: null, // gadget kind to buy with Shift+number
    throwAt: null, // {x, y} in canvas pixels when the mouse clicked the floor
    card: null, // gadget kind when a HUD card was clicked
    anyKey: false,
  };
}

const KEYMAP = {
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
  ArrowUp: 'up',
  KeyW: 'up',
  ArrowDown: 'down',
  KeyS: 'down',
  ShiftLeft: 'sneak',
  ShiftRight: 'sneak',
  KeyE: 'grab',
  Space: 'grab',
};

const GADGET_KEYS = { Digit1: 'emp', Digit2: 'noise', Digit3: 'smoke' };

export function keyDown(input, code, shift) {
  input.anyKey = true;
  if (GADGET_KEYS[code]) {
    if (shift) input.buyKind = GADGET_KEYS[code];
    else input.useKind = GADGET_KEYS[code];
    return;
  }
  const field = KEYMAP[code];
  if (field) input[field] = true;
}

export function keyUp(input, code) {
  const field = KEYMAP[code];
  if (field) input[field] = false;
}

/** Clear the one-shot fields after the engine has read them. */
export function clearEdge(input) {
  input.grab = false;
  input.useKind = null;
  input.buyKind = null;
  input.throwAt = null;
  input.card = null;
}
