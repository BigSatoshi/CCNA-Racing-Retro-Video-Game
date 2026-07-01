// Canvas 2D rendering only (T017, T033, T039). Draws state; makes no game decisions.
import { PALETTE, drawBackground, drawCar, drawToken, drawMissile } from './retro.js';

function tracePath(ctx, path) {
  ctx.beginPath();
  ctx.moveTo(path[0].x, path[0].y);
  for (let i = 1; i < path.length; i++) ctx.lineTo(path[i].x, path[i].y);
  ctx.closePath();
}

export function render(ctx, state, now) {
  const { track, cars, tokens } = state;
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  drawBackground(ctx, w, h);
  if (!track) return;

  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  // Track edge glow, then surface.
  tracePath(ctx, track.path);
  ctx.strokeStyle = PALETTE.trackEdge;
  ctx.lineWidth = track.width + 8;
  ctx.stroke();
  tracePath(ctx, track.path);
  ctx.strokeStyle = PALETTE.track;
  ctx.lineWidth = track.width;
  ctx.stroke();

  // Dashed centerline.
  tracePath(ctx, track.path);
  ctx.strokeStyle = PALETTE.trackCenter;
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 14]);
  ctx.stroke();
  ctx.setLineDash([]);

  // Start / finish line.
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(track.startLine.a.x, track.startLine.a.y);
  ctx.lineTo(track.startLine.b.x, track.startLine.b.y);
  ctx.stroke();

  // Oil-slick hazards (active 'spin' offense drops rendered from state.hazards).
  for (const hz of state.hazards ?? []) {
    ctx.fillStyle = PALETTE.oil;
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.arc(hz.x, hz.y, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // Tokens.
  if (tokens) for (const t of tokens) if (t.available) drawToken(ctx, t.pos, now);

  // Cars (player first index, then CPUs). A finished opponent has left the track,
  // so it's no longer drawn — the cpu color index still advances to keep colors stable.
  let cpu = 0;
  for (const car of cars) {
    const color = car.isPlayer ? PALETTE.player : PALETTE.cpu[cpu++ % PALETTE.cpu.length];
    if (car.finished && !car.isPlayer) continue;
    drawCar(ctx, car, color);
  }

  // Homing missiles in flight (drawn over cars).
  for (const m of state.missiles ?? []) drawMissile(ctx, m, now);
}
