// Top-down car movement & steering (T013). Pure update functions (mutate + return the car).

export const CAR = {
  maxSpeed: 260, // world units / second
  accel: 340,
  brake: 460,
  dragPerSec: 0.86, // velocity retained per second
  turnRate: 3.4, // radians / second at full steer & full grip
};

export function createCar(id, isPlayer, pos, heading = 0) {
  return {
    id,
    isPlayer,
    pos: { x: pos.x, y: pos.y },
    heading,
    speed: 0,
    lap: 0,
    nextCheckpoint: 0,
    finished: false,
    finishRank: null,
    lapStartMs: 0,
    bestLapMs: null,
    inventory: [],
    activeEffects: [],
    aiTargetIdx: 0,
  };
}

// controls: { throttle: -1..1, steer: -1..1 }; mods: { speedMul, spun } from items.effectMods
export function stepCar(car, controls, dtSec, mods = {}) {
  const maxSpeed = CAR.maxSpeed * (mods.speedMul ?? 1);
  let throttle = controls.throttle ?? 0;
  let steer = controls.steer ?? 0;

  if (mods.spun) {
    // spun out: no driver control and the car whips around, but it keeps its
    // momentum and slides — a spin-out, not a dead stop. Decay is dt-scaled so
    // the car resumes driving the instant the effect expires.
    car.speed *= Math.pow(0.6, dtSec);
    car.heading += 7 * dtSec;
  } else {
    if (throttle > 0) car.speed += CAR.accel * throttle * dtSec;
    else if (throttle < 0) car.speed += CAR.brake * throttle * dtSec;
    car.speed *= Math.pow(CAR.dragPerSec, dtSec);
    if (car.speed > maxSpeed) car.speed = maxSpeed;
    if (car.speed < -maxSpeed * 0.35) car.speed = -maxSpeed * 0.35;
    const grip = Math.min(1, Math.abs(car.speed) / 55);
    car.heading += steer * CAR.turnRate * grip * dtSec;
  }

  car.pos.x += Math.cos(car.heading) * car.speed * dtSec;
  car.pos.y += Math.sin(car.heading) * car.speed * dtSec;
  return car;
}

function hasShield(car) {
  return (car.activeEffects || []).some((e) => e.id === 'shield');
}

// Car-to-car bump (pure): if two cars overlap (centers within minDist), shove them
// apart along the contact normal and bleed the speed of any car that ISN'T shielded.
// A shield makes you immune — you neither slow down nor get pushed off your line; the
// other car absorbs the whole separation. Returns true if a collision was resolved.
export function resolveCarCollision(a, b, minDist = 24) {
  const dx = b.pos.x - a.pos.x;
  const dy = b.pos.y - a.pos.y;
  const dist = Math.hypot(dx, dy);
  if (dist === 0 || dist >= minDist) return false;
  const nx = dx / dist;
  const ny = dy / dist;
  const overlap = minDist - dist;
  const aShield = hasShield(a);
  const bShield = hasShield(b);

  // An immune (shielded) car holds its ground; the other absorbs the overlap.
  let aMove, bMove;
  if (aShield && !bShield) { aMove = 0; bMove = overlap; }
  else if (bShield && !aShield) { aMove = overlap; bMove = 0; }
  else { aMove = overlap / 2; bMove = overlap / 2; }
  a.pos.x -= nx * aMove; a.pos.y -= ny * aMove;
  b.pos.x += nx * bMove; b.pos.y += ny * bMove;

  // Only the unshielded cars take the speed hit from the bump.
  if (!aShield) a.speed *= 0.55;
  if (!bShield) b.speed *= 0.55;
  return true;
}

// Closest point to p on segment a->b (clamped to the segment ends).
function closestPointOnSeg(p, a, b) {
  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const len2 = abx * abx + aby * aby || 1;
  let t = ((p.x - a.x) * abx + (p.y - a.y) * aby) / len2;
  t = Math.max(0, Math.min(1, t));
  return { x: a.x + abx * t, y: a.y + aby * t };
}

// Hard track boundary (T013): the road is everything within track.width/2 of the closed
// centerline polyline. If a car's center strays past that (minus a small body margin), push
// it back onto the edge along the inward normal and bleed speed — a wall it can slide along.
export function constrainToTrack(car, track, margin = 6) {
  const path = track.path;
  const maxDist = track.width / 2 - margin;
  let best = null;
  let bestD2 = Infinity;
  for (let i = 0; i < path.length; i++) {
    const c = closestPointOnSeg(car.pos, path[i], path[(i + 1) % path.length]);
    const dx = car.pos.x - c.x;
    const dy = car.pos.y - c.y;
    const d2 = dx * dx + dy * dy;
    if (d2 < bestD2) {
      bestD2 = d2;
      best = c;
    }
  }
  const dist = Math.sqrt(bestD2) || 1;
  if (dist > maxDist) {
    const nx = (car.pos.x - best.x) / dist;
    const ny = (car.pos.y - best.y) / dist;
    car.pos.x = best.x + nx * maxDist;
    car.pos.y = best.y + ny * maxDist;
    car.speed *= 0.4; // scrape: bleed speed on wall contact
  }
  return car;
}
