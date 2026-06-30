// Retro render helpers (T007): palette + small pixel/sprite drawing utilities.
// Pure drawing helpers — they take a 2D context but make no game decisions.

export const PALETTE = {
  bg: '#0d0221',
  bgGrid: '#241734',
  track: '#3a3f5a',
  trackEdge: '#ff2e97',
  trackCenter: '#f9f871',
  player: '#2ee6a6',
  cpu: ['#ff5d5d', '#ffae34', '#6ca9ff'],
  token: '#f9f871',
  tokenGlow: '#ff2e97',
  oil: '#1a1a1a',
  missile: '#ff2e97',
  shield: '#6cf6ff',
  boost: '#2ee6a6',
  text: '#f4f4f8',
  textDim: '#9b8fb0',
};

export const FONT = '"Courier New", monospace';

export function clear(ctx, w, h) {
  ctx.fillStyle = PALETTE.bg;
  ctx.fillRect(0, 0, w, h);
}

// Faux-retro scanline / grid wash for the background.
export function drawBackground(ctx, w, h) {
  clear(ctx, w, h);
  ctx.strokeStyle = PALETTE.bgGrid;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 0; x <= w; x += 32) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
  }
  for (let y = 0; y <= h; y += 32) {
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
  }
  ctx.stroke();
}

// A blocky car sprite drawn centered at (0,0), pointing +x, rotated by heading.
export function drawCar(ctx, car, color) {
  ctx.save();
  ctx.translate(car.pos.x, car.pos.y);
  ctx.rotate(car.heading);
  // body
  ctx.fillStyle = color;
  ctx.fillRect(-12, -8, 24, 16);
  // windshield
  ctx.fillStyle = '#0d0221';
  ctx.fillRect(2, -5, 6, 10);
  // shield aura
  if (car.activeEffects?.some((e) => e.id === 'shield')) {
    ctx.strokeStyle = PALETTE.shield;
    ctx.lineWidth = 2;
    ctx.strokeRect(-15, -11, 30, 22);
  }
  ctx.restore();
}

export function drawToken(ctx, p, t) {
  const pulse = 4 + Math.sin(t / 150) * 2;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.fillStyle = PALETTE.tokenGlow;
  ctx.globalAlpha = 0.5;
  ctx.beginPath();
  ctx.arc(0, 0, 10 + pulse, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = PALETTE.token;
  ctx.fillRect(-6, -6, 12, 12);
  ctx.fillStyle = '#0d0221';
  ctx.font = `bold 10px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('?', 0, 1);
  ctx.restore();
}
