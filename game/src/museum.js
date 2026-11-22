// Museum layouts: three nights in one big gallery, each with three ways
// across — a north lane behind the statues, the open red carpet down the
// middle, and a south hall. Everything is data: rectangles for walls,
// display cases and statues, spots for loot and coins, patrol routes,
// camera mounts, the thief's door and the getaway door.
import { NIGHTS, VIEW, WALL } from './settings.js';

const ROOM = { x: WALL, y: WALL, w: VIEW.width - WALL * 2, h: VIEW.height - WALL * 2 };

function wallRects() {
  return [
    { x: 0, y: 0, w: VIEW.width, h: WALL },
    { x: 0, y: VIEW.height - WALL, w: VIEW.width, h: WALL },
    { x: 0, y: 0, w: WALL, h: VIEW.height },
    { x: VIEW.width - WALL, y: 0, w: WALL, h: VIEW.height },
  ];
}

// Interior furniture: display cases (long, low) and statues (square blocks).
// They block movement and sight, so they are the cover the thief hides in.
function furniture(night) {
  const cases = [
    { x: 300, y: 150, w: 150, h: 34 },
    { x: 560, y: 150, w: 150, h: 34 },
    { x: 820, y: 150, w: 150, h: 34 },
    { x: 300, y: 536, w: 150, h: 34 },
    { x: 560, y: 536, w: 150, h: 34 },
    { x: 820, y: 536, w: 150, h: 34 },
  ];
  const statues = [
    { x: 430, y: 300, w: 44, h: 44 },
    { x: 640, y: 300, w: 44, h: 44 },
    { x: 850, y: 300, w: 44, h: 44 },
  ];
  if (night >= 1) {
    cases.push({ x: 430, y: 420, w: 120, h: 30 });
    statues.push({ x: 250, y: 400, w: 44, h: 44 });
  }
  if (night >= 2) {
    cases.push({ x: 700, y: 420, w: 120, h: 30 });
    statues.push({ x: 1010, y: 400, w: 44, h: 44 });
    statues.push({ x: 1010, y: 260, w: 44, h: 44 });
  }
  return { cases, statues };
}

const LOOT_NAMES = [
  'The Sapphire Duchess',
  'The Gilded Falcon',
  'The Velvet Crown',
  'The Jade Panther',
  'The Opal of Ankara',
];
const LOOT_VALUES = [900, 700, 1200, 800, 1500];

function lootSpots(night) {
  const spots = [
    { x: 375, y: 250, name: 0 },
    { x: 635, y: 250, name: 0 },
    { x: 895, y: 250, name: 0 },
    { x: 490, y: 470, name: 0 },
    { x: 760, y: 470, name: 0 },
  ];
  const count = NIGHTS[night].masterpieces;
  return spots.slice(0, count).map((s, i) => ({
    x: s.x,
    y: s.y,
    name: LOOT_NAMES[i],
    value: LOOT_VALUES[i],
    taken: false,
  }));
}

function coinSpots(night) {
  const spots = [
    { x: 200, y: 120 }, { x: 1080, y: 120 }, { x: 200, y: 600 }, { x: 1080, y: 600 },
    { x: 500, y: 360 }, { x: 780, y: 360 }, { x: 940, y: 120 }, { x: 340, y: 600 },
    { x: 1080, y: 360 }, { x: 200, y: 360 },
  ];
  const count = 6 + night * 2;
  return spots.slice(0, count).map((s) => ({ x: s.x, y: s.y, taken: false }));
}

// Patrol routes sweep the three lanes; each guard pauses at every corner.
// The legs run through the clear lanes between the cases and statues —
// a leg that crossed furniture would wedge its guard against it.
function patrolRoutes(night) {
  const routes = [
    [[500, 110], [760, 110], [760, 240], [500, 240]],
    [[500, 610], [760, 610], [760, 480], [500, 480]],
    [[1000, 110], [1150, 110], [1150, 240], [1000, 240]],
    [[180, 360], [640, 360], [640, 480], [180, 480]],
  ];
  return routes.slice(0, NIGHTS[night].guards);
}

function cameraMounts(night) {
  // Mounts watch the approaches, never the doors themselves: the east
  // camera looks down the south-east lane and the west camera looks up
  // the north-west lane, so the spawn and the getaway stay fair.
  const mounts = [
    { x: 640, y: WALL + 4, base: Math.PI / 2, anchor: 'north' },
    { x: 640, y: VIEW.height - WALL - 4, base: -Math.PI / 2, anchor: 'south' },
    { x: VIEW.width - WALL - 4, y: 180, base: (Math.PI * 3) / 4, anchor: 'east' },
    { x: WALL + 4, y: VIEW.height - WALL - 4, base: -0.9, anchor: 'west' },
  ];
  return mounts.slice(0, NIGHTS[night].cameras);
}

/** Build one night's whole world from its number (0, 1 or 2). */
export function buildNight(night) {
  const info = NIGHTS[night];
  const { cases, statues } = furniture(night);
  const solids = wallRects().concat(cases, statues);
  return {
    night,
    name: info.name,
    seconds: info.seconds,
    room: ROOM,
    walls: wallRects(),
    cases,
    statues,
    solids,
    loot: lootSpots(night),
    coins: coinSpots(night),
    guards: patrolRoutes(night).map((path) => ({
      path,
      x: path[0][0],
      y: path[0][1],
      dir: 0,
      leg: 0,
      pauseLeft: 0,
      state: 'patrol',
      chaseLeft: 0,
      lure: null,
    })),
    cameras: cameraMounts(night).map((m) => ({
      x: m.x,
      y: m.y,
      base: m.base,
      dir: m.base,
      blinded: 0,
      phase: m.anchor === 'south' ? 1.6 : 0,
    })),
    spawn: { x: 70, y: 360 },
    exit: { x: VIEW.width - WALL - 46, y: 330, w: 46, h: 60 },
    required: info.masterpieces,
  };
}
