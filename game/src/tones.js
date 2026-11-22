// Sound, synthesized live with WebAudio — no audio files, no network.
// The synth starts lazily on the first user gesture; in headless shots
// and Node it simply stays silent.
let audio = null;

function ensureAudio() {
  if (audio) return audio;
  try {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return null;
    audio = new Ctor();
  } catch {
    return null;
  }
  return audio;
}

function tone(freq, seconds, type, gain, when) {
  const ctx = ensureAudio();
  if (!ctx) return;
  try {
    if (ctx.state === 'suspended') void ctx.resume();
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    amp.gain.setValueAtTime(gain, ctx.currentTime + when);
    amp.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + when + seconds);
    osc.connect(amp);
    amp.connect(ctx.destination);
    osc.start(ctx.currentTime + when);
    osc.stop(ctx.currentTime + when + seconds);
  } catch {
    // Sound is garnish; a failure here must never break the game.
  }
}

/** Play the sounds queued by the engine's flashes for this frame. */
export function playFlashes(flashes) {
  if (!flashes || flashes.length === 0) return;
  for (let i = 0; i < flashes.length; i += 1) {
    const kind = flashes[i];
    if (kind === 'grab') tone(880, 0.12, 'sine', 0.12, 0);
    else if (kind === 'coin') tone(1320, 0.07, 'triangle', 0.08, 0);
    else if (kind === 'buy') tone(660, 0.1, 'square', 0.06, 0);
    else if (kind === 'gadget') tone(440, 0.16, 'sawtooth', 0.07, 0);
    else if (kind === 'seen') tone(220, 0.25, 'sawtooth', 0.1, 0);
  }
}

/** A short rising fanfare for a clean getaway. */
export function playWin() {
  tone(523, 0.14, 'sine', 0.12, 0);
  tone(659, 0.14, 'sine', 0.12, 0.12);
  tone(784, 0.22, 'sine', 0.12, 0.24);
}

/** A low two-note sting for getting caught or locked down. */
export function playLose() {
  tone(196, 0.25, 'sawtooth', 0.1, 0);
  tone(147, 0.4, 'sawtooth', 0.1, 0.2);
}
