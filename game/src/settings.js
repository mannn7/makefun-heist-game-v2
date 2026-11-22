// The Velvet Vault — shared tuning numbers for the museum heist.
// One place for every speed, range, price and timer so the game stays fair.
export const VIEW = { width: 1280, height: 720 };
export const WALL = 24; // thickness of the museum's outer wall

export const THIEF = {
  radius: 13,
  walk: 168, // px per second
  sneak: 92,
  grabRange: 46, // how close a masterpiece must be to lift it
  coinRange: 30,
};

export const GUARD = {
  radius: 14,
  patrol: 96,
  chase: 138,
  catchRange: 30, // touching the thief ends the night
  coneRange: 235,
  coneHalf: 0.56, // radians, about 32 degrees each side
  pause: 1.4, // seconds a guard stops at each patrol corner to look around
  scan: 0.9, // radians per second while scanning at a corner
  chaseTime: 3.2, // seconds a guard keeps chasing after losing sight
};

export const CAMERA = {
  coneRange: 215,
  coneHalf: 0.5,
  sweep: 0.55, // radians per second of sweep
  sweepAmp: 0.7, // radians each side of its base angle
};

export const ALARM = {
  guardRate: 26, // points per second while a guard sees the thief
  cameraRate: 19,
  sneakFactor: 0.4, // sneaking cuts how fast the alarm climbs
  decay: 4, // points per second the alarm cools while unseen
  max: 100,
};

export const GADGET = {
  empSeconds: 8,
  smokeSeconds: 6,
  empPrice: 150,
  noisePrice: 100,
  smokePrice: 75,
  coinValue: 25,
};

// Three nights, each harder than the last: guards, cameras, masterpieces.
export const NIGHTS = [
  { guards: 2, cameras: 2, masterpieces: 3, seconds: 150, name: 'The Duchess Gallery' },
  { guards: 3, cameras: 3, masterpieces: 4, seconds: 165, name: 'The Vault Corridor' },
  { guards: 4, cameras: 4, masterpieces: 5, seconds: 180, name: 'The Grand Vault' },
];

export const PALETTE = {
  floor: '#171224',
  floorTile: '#1d1830',
  carpet: '#7a1f2b',
  carpetEdge: '#a83240',
  wall: '#3a2f52',
  wallTop: '#574a75',
  gold: '#e8b64c',
  goldDim: '#8a6d2f',
  marble: '#cfc8de',
  statue: '#8d86a3',
  caseGlass: '#9fd8e8',
  guard: '#c94f43',
  guardCone: 'rgba(255, 190, 90, 0.20)',
  cameraCone: 'rgba(255, 120, 90, 0.16)',
  thief: '#4cc2a1',
  smoke: 'rgba(200, 200, 210, 0.55)',
  alarm: '#ff5347',
  hud: '#efe9dc',
  dim: '#8f86a8',
};
