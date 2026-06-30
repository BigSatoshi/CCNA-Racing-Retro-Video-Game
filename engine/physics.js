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
    // spun out: no driver control, bleed speed, rotate
    car.speed *= 0.95;
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
