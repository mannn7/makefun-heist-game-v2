// Boot: wires the game to the browser — canvas, keyboard, mouse, the
// animation loop, and the ?shot= scenes that render one deterministic
// frame for screenshots. No network, no build step.
import { STEP, autopilot, createGame, stepGame } from './engine.js';
import { clearEdge, keyDown, keyUp, makeInput } from './input.js';
import { drawGame } from './paint.js';
import { stageScene } from './stage.js';
import { playFlashes, playLose, playWin } from './tones.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const nightParam = Number(params.get('night') || '0');
const nightIndex = Number.isInteger(nightParam) && nightParam >= 0 && nightParam <= 2 ? nightParam : 0;

const game = createGame(nightIndex);
const input = makeInput();

// Gadget cards live along the bottom of the canvas: click to use one,
// Shift+click to buy one with coins.
const CARDS = [
  { kind: 'emp', x: 16, w: 92 },
  { kind: 'noise', x: 116, w: 92 },
  { kind: 'smoke', x: 216, w: 92 },
];
const CARD_TOP = 720 - 44;
const CARD_BOTTOM = 720 - 12;

function canvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * 1280,
    y: ((event.clientY - rect.top) / rect.height) * 720,
  };
}

function cardAt(point) {
  if (point.y < CARD_TOP || point.y > CARD_BOTTOM) return null;
  for (let i = 0; i < CARDS.length; i += 1) {
    if (point.x >= CARDS[i].x && point.x <= CARDS[i].x + CARDS[i].w) return CARDS[i].kind;
  }
  return null;
}

window.addEventListener('keydown', (event) => {
  if (event.code === 'KeyR' && game.phase !== 'play' && game.phase !== 'title') {
    restart();
    return;
  }
  if (game.phase === 'title') {
    input.anyKey = true;
    game.phase = 'play';
    return;
  }
  if (game.phase !== 'play') {
    input.anyKey = true;
    return;
  }
  keyDown(input, event.code, event.shiftKey);
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
    event.preventDefault();
  }
});

window.addEventListener('keyup', (event) => keyUp(input, event.code));

canvas.addEventListener('mousedown', (event) => {
  if (game.phase !== 'play') return;
  const point = canvasPoint(event);
  const card = cardAt(point);
  if (card) {
    if (event.shiftKey) input.buyKind = card;
    else input.card = card;
    return;
  }
  input.throwAt = point;
});

function restart() {
  const next = createGame(game.world.night);
  game.world = next.world;
  game.thief = next.thief;
  game.guards = next.guards;
  game.cameras = next.cameras;
  game.alarm = 0;
  game.timeLeft = next.timeLeft;
  game.time = 0;
  game.phase = 'play';
  game.score = 0;
  game.result = null;
  game.smoke = null;
  game.noise = null;
  game.armedNoise = false;
  game.exitOpen = false;
}

let last = performance.now();
let accumulator = 0;

function frame(now) {
  const elapsed = Math.min(0.1, (now - last) / 1000);
  last = now;
  accumulator += elapsed;
  while (accumulator >= STEP) {
    const event = stepGame(game, input, STEP);
    const flashes = game.flashes.splice(0);
    playFlashes(flashes);
    if (event === 'win') playWin();
    if (event === 'caught' || event === 'lockdown' || event === 'timeout') playLose();
    clearEdge(input);
    accumulator -= STEP;
  }
  drawGame(ctx, game);
  requestAnimationFrame(frame);
}

if (shot) {
  // Screenshot mode: stage the scene, draw exactly one frame, stop.
  document.title = `The Velvet Vault — ${shot}`;
  stageScene(shot, game);
  drawGame(ctx, game);
} else {
  drawGame(ctx, game);
  requestAnimationFrame(frame);
}
