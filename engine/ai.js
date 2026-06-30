// Opponent AI (T014): follow the racing line, slow for sharp turns, avoid oil slicks (T038).

export function normalizeAngle(a) {
  while (a > Math.PI) a -= 2 * Math.PI;
  while (a < -Math.PI) a += 2 * Math.PI;
  return a;
}

// Returns controls { throttle, steer }. hazards: [{x,y}] oil slicks to avoid.
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

  const diff = normalizeAngle(desired - car.heading);
  const steer = Math.max(-1, Math.min(1, diff * 2.2));
  const throttle = Math.abs(diff) > 1.0 ? 0.5 : 1;
  return { throttle, steer };
}
