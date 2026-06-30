// Power-up token placement, collection detection, and per-lap lifecycle (T030).
// A collected token is gone for the rest of the lap and respawns at the start of each new lap
// (FR-006). Pure data helpers.

export function createTokens(track) {
  return track.tokenSpawns.map((p) => ({ pos: { x: p.x, y: p.y }, available: true }));
}

// Returns the index of a collectible token the car is touching, or -1.
export function checkCollect(tokens, car, radius = 24) {
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (!t.available) continue;
    if (Math.hypot(t.pos.x - car.pos.x, t.pos.y - car.pos.y) <= radius) return i;
  }
  return -1;
}

export function consume(tokens, i) {
  if (tokens[i]) tokens[i].available = false;
}

export function respawnAll(tokens) {
  for (const t of tokens) t.available = true;
}
