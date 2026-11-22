// Painting: everything the player sees, drawn on one canvas — the marble
// floor and red carpet, the walls and furniture, the guards with their
// cones, the cameras, the glowing loot, the thief, and the HUD with the
// alarm meter, loot, coins, tools and timer.
import { CAMERA, GUARD, PALETTE, THIEF, VIEW, WALL } from './settings.js';
import { angleTo } from './sight.js';

function conePath(ctx, x, y, dir, range, half) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, dir - half, dir + half);
  ctx.closePath();
}

function drawFloor(ctx, world) {
  ctx.fillStyle = PALETTE.floor;
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  // Marble tiles.
  ctx.fillStyle = PALETTE.floorTile;
  for (let x = WALL; x < VIEW.width - WALL; x += 80) {
    for (let y = WALL; y < VIEW.height - WALL; y += 80) {
      if (((x + y) / 80) % 2 === 0) ctx.fillRect(x + 2, y + 2, 76, 76);
    }
  }
  // The red carpet down the middle — the exposed route.
  ctx.fillStyle = PALETTE.carpet;
  ctx.fillRect(560, WALL, 160, VIEW.height - WALL * 2);
  ctx.fillStyle = PALETTE.carpetEdge;
  ctx.fillRect(560, WALL, 6, VIEW.height - WALL * 2);
  ctx.fillRect(714, WALL, 6, VIEW.height - WALL * 2);
  // Gold trim on the carpet.
  ctx.fillStyle = PALETTE.goldDim;
  for (let y = WALL + 40; y < VIEW.height - WALL; y += 90) {
    ctx.fillRect(632, y, 16, 10);
  }
}

function drawWalls(ctx, world) {
  ctx.fillStyle = PALETTE.wall;
  for (let i = 0; i < world.walls.length; i += 1) {
    const r = world.walls[i];
    ctx.fillRect(r.x, r.y, r.w, r.h);
  }
  ctx.fillStyle = PALETTE.wallTop;
  ctx.fillRect(0, 0, VIEW.width, 6);
  ctx.fillRect(0, VIEW.height - 6, VIEW.width, 6);
  // Display cases: glass tops with a gold frame.
  for (let i = 0; i < world.cases.length; i += 1) {
    const c = world.cases[i];
    ctx.fillStyle = PALETTE.goldDim;
    ctx.fillRect(c.x - 3, c.y - 3, c.w + 6, c.h + 6);
    ctx.fillStyle = PALETTE.caseGlass;
    ctx.fillRect(c.x, c.y, c.w, c.h);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(c.x + 6, c.y + 4, c.w - 12, 5);
  }
  // Statues: pale marble busts on dark plinths.
  for (let i = 0; i < world.statues.length; i += 1) {
    const s = world.statues[i];
    ctx.fillStyle = '#241d33';
    ctx.fillRect(s.x - 4, s.y - 4, s.w + 8, s.h + 8);
    ctx.fillStyle = PALETTE.statue;
    ctx.beginPath();
    ctx.arc(s.x + s.w / 2, s.y + s.h / 2, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.marble;
    ctx.beginPath();
    ctx.arc(s.x + s.w / 2 - 4, s.y + s.h / 2 - 4, 6, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawLoot(ctx, world, time) {
  for (let i = 0; i < world.loot.length; i += 1) {
    const piece = world.loot[i];
    if (piece.taken) continue;
    const pulse = 0.6 + 0.4 * Math.sin(time * 3 + i * 1.7);
    ctx.save();
    ctx.globalAlpha = 0.25 + 0.3 * pulse;
    ctx.fillStyle = PALETTE.gold;
    ctx.beginPath();
    ctx.arc(piece.x, piece.y, 30 + 8 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // The masterpiece itself: a little golden diamond.
    ctx.save();
    ctx.translate(piece.x, piece.y);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = PALETTE.gold;
    ctx.fillRect(-11, -11, 22, 22);
    ctx.fillStyle = '#fff3c4';
    ctx.fillRect(-5, -5, 10, 10);
    ctx.restore();
    ctx.fillStyle = PALETTE.hud;
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`$${piece.value}`, piece.x, piece.y - 34);
  }
  for (let i = 0; i < world.coins.length; i += 1) {
    const coin = world.coins[i];
    if (coin.taken) continue;
    ctx.fillStyle = PALETTE.gold;
    ctx.beginPath();
    ctx.arc(coin.x, coin.y, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff3c4';
    ctx.beginPath();
    ctx.arc(coin.x - 2, coin.y - 2, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawCones(ctx, game) {
  for (let i = 0; i < game.guards.length; i += 1) {
    const g = game.guards[i];
    ctx.fillStyle = PALETTE.guardCone;
    conePath(ctx, g.x, g.y, g.dir, GUARD.coneRange, GUARD.coneHalf);
    ctx.fill();
  }
  for (let i = 0; i < game.cameras.length; i += 1) {
    const cam = game.cameras[i];
    if (cam.blinded > 0) continue;
    ctx.fillStyle = PALETTE.cameraCone;
    conePath(ctx, cam.x, cam.y, cam.dir, CAMERA.coneRange, CAMERA.coneHalf);
    ctx.fill();
  }
}

function drawGuards(ctx, game) {
  for (let i = 0; i < game.guards.length; i += 1) {
    const g = game.guards[i];
    // Body: a red-uniformed guard with a cap.
    ctx.fillStyle = '#7e2f28';
    ctx.beginPath();
    ctx.arc(g.x, g.y, GUARD.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.guard;
    ctx.beginPath();
    ctx.arc(g.x, g.y, GUARD.radius - 4, 0, Math.PI * 2);
    ctx.fill();
    // Facing tick.
    ctx.strokeStyle = '#ffd9d0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(g.x, g.y);
    ctx.lineTo(g.x + Math.cos(g.dir) * (GUARD.radius + 6), g.y + Math.sin(g.dir) * (GUARD.radius + 6));
    ctx.stroke();
    if (g.state === 'chase') {
      ctx.fillStyle = '#ff5347';
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', g.x, g.y - GUARD.radius - 8);
    } else if (g.state === 'investigate') {
      ctx.fillStyle = '#ffd27a';
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('?', g.x, g.y - GUARD.radius - 8);
    }
  }
}

function drawCameras(ctx, game) {
  for (let i = 0; i < game.cameras.length; i += 1) {
    const cam = game.cameras[i];
    ctx.fillStyle = cam.blinded > 0 ? '#5a5468' : '#2b2b33';
    ctx.beginPath();
    ctx.arc(cam.x, cam.y, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = cam.blinded > 0 ? '#8f86a8' : '#ff6a5e';
    ctx.beginPath();
    ctx.arc(cam.x, cam.y, 4, 0, Math.PI * 2);
    ctx.fill();
    // Lens direction tick.
    ctx.strokeStyle = '#d8d2e8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cam.x, cam.y);
    ctx.lineTo(cam.x + Math.cos(cam.dir) * 16, cam.y + Math.sin(cam.dir) * 16);
    ctx.stroke();
  }
}

function drawExit(ctx, game) {
  const exit = game.world.exit;
  const open = game.exitOpen;
  ctx.fillStyle = open ? '#2fae7d' : '#4a4458';
  ctx.fillRect(exit.x, exit.y, exit.w, exit.h);
  ctx.fillStyle = open ? '#a9f5d2' : '#8f86a8';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.save();
  ctx.translate(exit.x + exit.w / 2, exit.y + exit.h / 2);
  ctx.rotate(Math.PI / 2);
  ctx.fillText(open ? 'GETAWAY' : 'LOCKED', 0, 5);
  ctx.restore();
  if (open) {
    ctx.strokeStyle = 'rgba(169, 245, 210, 0.7)';
    ctx.lineWidth = 3;
    ctx.strokeRect(exit.x - 4, exit.y - 4, exit.w + 8, exit.h + 8);
  }
}

function drawThief(ctx, game) {
  const t = game.thief;
  if (game.smoke) {
    ctx.fillStyle = PALETTE.smoke;
    ctx.beginPath();
    ctx.arc(game.smoke.x, game.smoke.y, game.smoke.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  // The thief: a teal cloak with a hood, facing the way they move.
  ctx.fillStyle = '#1d6f5c';
  ctx.beginPath();
  ctx.arc(t.x, t.y, THIEF.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.thief;
  ctx.beginPath();
  ctx.arc(t.x, t.y, THIEF.radius - 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#d9fff4';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(t.x, t.y);
  ctx.lineTo(t.x + Math.cos(t.dir) * (THIEF.radius + 5), t.y + Math.sin(t.dir) * (THIEF.radius + 5));
  ctx.stroke();
  if (t.sneak) {
    ctx.fillStyle = PALETTE.hud;
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('sneaking', t.x, t.y + THIEF.radius + 13);
  }
  if (game.armedNoise) {
    ctx.fillStyle = '#ffd27a';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('click to throw the noisemaker', t.x, t.y - THIEF.radius - 10);
  }
}

function drawHud(ctx, game) {
  const t = game.thief;
  // Top bar.
  ctx.fillStyle = 'rgba(10, 8, 18, 0.78)';
  ctx.fillRect(0, 0, VIEW.width, 54);
  ctx.fillStyle = PALETTE.hud;
  ctx.font = 'bold 17px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`Night ${game.world.night + 1} — ${game.world.name}`, 16, 22);
  ctx.font = '13px sans-serif';
  ctx.fillStyle = PALETTE.dim;
  const mins = Math.floor(game.timeLeft / 60);
  const secs = Math.floor(game.timeLeft % 60);
  ctx.fillText(`⏱ ${mins}:${String(secs).padStart(2, '0')}   ◆ loot ${t.lootTaken}/${game.world.required}   ● $${t.lootValue}   ○ coins ${t.coins}`, 16, 42);

  // Alarm meter, top right — the number that decides the night.
  const ax = VIEW.width - 330;
  ctx.fillStyle = PALETTE.hud;
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('ALARM', ax, 22);
  ctx.fillStyle = '#241d33';
  ctx.fillRect(ax + 70, 10, 220, 16);
  const frac = game.alarm / 100;
  ctx.fillStyle = frac > 0.66 ? '#ff5347' : frac > 0.33 ? '#ff9a3d' : '#e8b64c';
  ctx.fillRect(ax + 70, 10, 220 * frac, 16);
  ctx.fillStyle = PALETTE.hud;
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText(`${Math.round(game.alarm)}`, ax + 298, 23);

  // Gadget cards, bottom left: click to use, Shift+click to buy.
  const cards = [
    { kind: 'emp', label: '1 EMP', x: 16 },
    { kind: 'noise', label: '2 Noise', x: 116 },
    { kind: 'smoke', label: '3 Smoke', x: 216 },
  ];
  ctx.font = '12px sans-serif';
  for (let i = 0; i < cards.length; i += 1) {
    const c = cards[i];
    const count = t.gadgets[c.kind];
    ctx.fillStyle = count > 0 ? 'rgba(60, 48, 90, 0.9)' : 'rgba(30, 25, 45, 0.9)';
    ctx.fillRect(c.x, VIEW.height - 44, 92, 32);
    ctx.strokeStyle = count > 0 ? PALETTE.gold : '#4a4458';
    ctx.lineWidth = 1;
    ctx.strokeRect(c.x, VIEW.height - 44, 92, 32);
    ctx.fillStyle = PALETTE.hud;
    ctx.textAlign = 'left';
    ctx.fillText(`${c.label} ×${count}`, c.x + 8, VIEW.height - 24);
  }
  ctx.fillStyle = PALETTE.dim;
  ctx.font = '11px sans-serif';
  ctx.fillText('click a card to use · Shift+1/2/3 to buy · E grabs loot', 320, VIEW.height - 24);
}

function drawOverlay(ctx, title, lines) {
  ctx.fillStyle = 'rgba(8, 6, 14, 0.72)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.fillStyle = PALETTE.hud;
  ctx.font = 'bold 44px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, VIEW.width / 2, 300);
  ctx.font = '18px sans-serif';
  for (let i = 0; i < lines.length; i += 1) {
    ctx.fillText(lines[i], VIEW.width / 2, 350 + i * 30);
  }
}

/** Draw the whole game for the current phase. */
export function drawGame(ctx, game) {
  const world = game.world;
  drawFloor(ctx, world);
  drawCones(ctx, game);
  drawWalls(ctx, world);
  drawLoot(ctx, world, game.time);
  drawExit(ctx, game);
  drawCameras(ctx, game);
  drawGuards(ctx, game);
  drawThief(ctx, game);
  if (game.noise) {
    ctx.fillStyle = '#ffd27a';
    ctx.beginPath();
    ctx.arc(game.noise.x, game.noise.y, 6 + 2 * Math.sin(game.time * 10), 0, Math.PI * 2);
    ctx.fill();
  }
  drawHud(ctx, game);

  if (game.phase === 'title') {
    drawOverlay(ctx, 'THE VELVET VAULT', [
      `Night ${world.night + 1} — ${world.name}`,
      'WASD or arrows to move · Shift to sneak · E to lift loot',
      '1/2/3 use gadgets · Shift+1/2/3 buys them with coins',
      `Lift ${world.required} masterpieces, then reach the GETAWAY door.`,
      'Press any key to begin the night.',
    ]);
  } else if (game.phase === 'win') {
    drawOverlay(ctx, 'CLEAN GETAWAY!', [
      `You slipped out with $${game.score} of loot.`,
      'Press R to play the next night, or any key for the menu.',
    ]);
  } else if (game.phase === 'caught') {
    drawOverlay(ctx, 'CAUGHT!', [
      'A guard grabbed you in the gallery.',
      'Press R to try this night again.',
    ]);
  } else if (game.phase === 'lockdown') {
    drawOverlay(ctx, 'LOCKDOWN!', [
      'The alarm hit 100 and the vault sealed itself.',
      'Press R to try this night again.',
    ]);
  } else if (game.phase === 'timeout') {
    drawOverlay(ctx, 'DAWN BREAKS', [
      'The cleaners arrived before you got out.',
      'Press R to try this night again.',
    ]);
  }
}
