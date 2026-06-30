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
