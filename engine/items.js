// Power-up / weapon effect application (T036). PURE: mutates + returns the affected cars.
// kind 'self' → speed_boost, shield; kind 'offense' → oil_slick, homing_missile.

function setEffect(car, eff) {
  car.activeEffects = car.activeEffects || [];
  // No stacking: a repeated activation replaces the same-id effect rather than piling up.
  const i = car.activeEffects.findIndex((e) => e.id === eff.id);
  if (i >= 0) car.activeEffects[i] = eff;
  else car.activeEffects.push(eff);
}

export function applyEffect(def, sourceCar, targetCar, now) {
  if (def.kind === 'self') {
    if (def.id === 'speed_boost') {
      setEffect(sourceCar, {
        id: 'speed_boost',
        expiresAt: now + def.durationMs,
        speedMul: def.params.speedMultiplier ?? 1.4,
      });
    } else if (def.id === 'shield') {
      setEffect(sourceCar, { id: 'shield', expiresAt: now + def.durationMs });
    }
  } else {
    // offense: needs a target
    if (!targetCar) return { sourceCar, targetCar };
    const effects = targetCar.activeEffects || (targetCar.activeEffects = []);
    // Shield cancels exactly one incoming hostile effect.
    const shieldIdx = effects.findIndex((e) => e.id === 'shield');
    if (shieldIdx >= 0) {
      effects.splice(shieldIdx, 1);
      return { sourceCar, targetCar };
    }
    setEffect(targetCar, {
      id: 'spin',
      expiresAt: now + (def.params.spinMs ?? def.durationMs),
    });
  }
  return { sourceCar, targetCar };
}

// Remove expired effects.
export function tickEffects(car, now) {
  car.activeEffects = (car.activeEffects || []).filter((e) => e.expiresAt > now);
  return car;
}

// Derive movement modifiers for physics.stepCar from a car's active effects.
export function effectMods(car) {
  let speedMul = 1;
  let spun = false;
  for (const e of car.activeEffects || []) {
    if (e.id === 'speed_boost') speedMul *= e.speedMul ?? 1.4;
    if (e.id === 'spin') spun = true;
  }
  return { speedMul, spun };
}
