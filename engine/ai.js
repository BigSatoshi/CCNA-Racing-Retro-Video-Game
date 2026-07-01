// Opponent AI (T014): follow the racing line, slow for sharp turns, avoid oil slicks (T038),
// and steer around other cars so they don't lock together and shove each other (T041).

export function normalizeAngle(a) {
  while (a > Math.PI) a -= 2 * Math.PI;
  while (a < -Math.PI) a += 2 * Math.PI;
  return a;
}

// Returns controls { throttle, steer }.
//   opts.hazards: [{x,y}]         oil slicks to avoid.
//   opts.others:  [{x,y}]         other cars' positions to steer around.
export function aiControls(car, waypoints, opts = {}) {
  const reach = opts.reach ?? 52;
  let target = waypoints[car.aiTargetIdx % waypoints.length];
  const dx = target.x - car.pos.x;
  const dy = target.y - car.pos.y;
  if (Math.hypot(dx, dy) < reach) {
    car.aiTargetIdx = (car.aiTargetIdx + 1) % waypoints.length;
    target = waypoints[car.aiTargetIdx % waypoints.length];
  }

  let desired = Math.atan2(target.y - car.pos.y, target.x - car.pos.x);
  let avoidThrottle = 1;

  // Steer away from a nearby hazard directly ahead.
  for (const h of opts.hazards ?? []) {
    const hd = Math.hypot(h.x - car.pos.x, h.y - car.pos.y);
    if (hd < 70) {
      const toHaz = Math.atan2(h.y - car.pos.y, h.x - car.pos.x);
      if (Math.abs(normalizeAngle(toHaz - car.heading)) < 0.8) {
        desired += normalizeAngle(car.heading - toHaz) > 0 ? 0.6 : -0.6;
      }
    }
  }

  // Steer around other cars. The closer the car and the more directly ahead it
  // is, the harder we swerve — this breaks up the "push each other forever"
  // deadlocks by making the trailing car peel off to one side (and ease off the
  // throttle when something is right in its path).
  for (const o of opts.others ?? []) {
    const od = Math.hypot(o.x - car.pos.x, o.y - car.pos.y);
    if (od < 60 && od > 1e-3) {
      const toCar = Math.atan2(o.y - car.pos.y, o.x - car.pos.x);
      const rel = normalizeAngle(toCar - car.heading);
      if (Math.abs(rel) < 1.2) {
        const proximity = 1 - od / 60; // 0 far .. 1 touching
        // Push toward whichever side the car is NOT on; bias to a side when dead ahead.
        const side = Math.abs(rel) < 0.05 ? 1 : Math.sign(rel);
        desired -= side * (0.5 + 0.9 * proximity);
        if (Math.abs(rel) < 0.5) avoidThrottle = Math.min(avoidThrottle, 0.7 - 0.3 * proximity);
      }
    }
  }

  const diff = normalizeAngle(desired - car.heading);
  const steer = Math.max(-1, Math.min(1, diff * 2.2));
  const throttle = (Math.abs(diff) > 1.0 ? 0.5 : 1) * avoidThrottle;
  return { throttle, steer };
}
