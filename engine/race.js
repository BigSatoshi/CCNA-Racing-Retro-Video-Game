// Race state: lap counting, finishing order, and pause/resume snapshots (T015, T029).
// Pure / DOM-free so it is the unit-tested single source of truth.

// Standard segment-intersection test (do p1->p2 and p3->p4 cross?).
export function segmentsIntersect(p1, p2, p3, p4) {
  const d = (a, b, c) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
  const d1 = d(p3, p4, p1);
  const d2 = d(p3, p4, p2);
  const d3 = d(p1, p2, p3);
  const d4 = d(p1, p2, p4);
  if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) {
    return true;
  }
  return false;
}

// Advance a car's lap progress given its previous position. Laps complete only when all
// checkpoints have been crossed in order and then the start/finish line is crossed.
// Returns { lapCompleted }.
export function advanceProgress(car, prevPos, track) {
  const n = track.checkpoints.length;
  const gate = car.nextCheckpoint < n ? track.checkpoints[car.nextCheckpoint] : track.startLine;
  if (segmentsIntersect(prevPos, car.pos, gate.a, gate.b)) {
    if (car.nextCheckpoint < n) {
      car.nextCheckpoint += 1;
    } else {
      car.nextCheckpoint = 0;
      car.lap += 1;
      return { lapCompleted: true };
    }
  }
  return { lapCompleted: false };
}

// Deterministic finishing order (no ties). Finished cars rank by finishRank; the rest by
// laps, then checkpoint progress, then a stable id tiebreak.
export function finishOrder(cars) {
  return [...cars]
    .sort((a, b) => {
      if (a.finishRank && b.finishRank) return a.finishRank - b.finishRank;
      if (a.finishRank) return -1;
      if (b.finishRank) return 1;
      if (b.lap !== a.lap) return b.lap - a.lap;
      if (b.nextCheckpoint !== a.nextCheckpoint) return b.nextCheckpoint - a.nextCheckpoint;
      return a.id < b.id ? -1 : 1;
    })
    .map((c) => c.id);
}

// Full race snapshot for Pause-to-Learn (Principle IV). Captures everything that affects
// the simulation so resume() restores the exact prior state with zero drift.
export function snapshot(state) {
  return {
    raceTimeMs: state.raceTimeMs,
    rngState: state.rng.getState(),
    cars: state.cars.map((c) => structuredClone(c)),
    tokens: state.tokens ? state.tokens.map((t) => structuredClone(t)) : null,
  };
}

export function resume(state, snap) {
  state.raceTimeMs = snap.raceTimeMs;
  state.rng.setState(snap.rngState);
  state.cars = snap.cars.map((c) => structuredClone(c));
  if (snap.tokens) state.tokens = snap.tokens.map((t) => structuredClone(t));
  return state;
}
