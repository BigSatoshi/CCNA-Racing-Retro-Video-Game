import { test } from 'node:test';
import assert from 'node:assert/strict';
import { advanceProgress, finishOrder, snapshot, resume, segmentsIntersect } from '../engine/race.js';
import { createRng } from '../engine/rng.js';

// Vertical gates at x = 0 (start/finish), 10, 20, 30.
const vgate = (x) => ({ a: { x, y: -10 }, b: { x, y: 10 } });
const track = {
  startLine: vgate(0),
  checkpoints: [vgate(10), vgate(20), vgate(30)],
};

function move(car, fromX, toX) {
  const prev = { x: fromX, y: 0 };
  car.pos = { x: toX, y: 0 };
  return advanceProgress(car, prev, track);
}

test('a lap counts only when checkpoints are crossed in order then the finish line', () => {
  const car = { pos: { x: 5, y: 0 }, lap: 0, nextCheckpoint: 0 };
  assert.equal(move(car, 5, 15).lapCompleted, false); // cross cp0
  assert.equal(car.nextCheckpoint, 1);
  assert.equal(move(car, 15, 25).lapCompleted, false); // cross cp1
  assert.equal(car.nextCheckpoint, 2);
  assert.equal(move(car, 25, 35).lapCompleted, false); // cross cp2 -> expecting finish
  assert.equal(car.nextCheckpoint, 3);
  const r = move(car, -5, 5); // cross start/finish line
  assert.equal(r.lapCompleted, true);
  assert.equal(car.lap, 1);
  assert.equal(car.nextCheckpoint, 0);
});

test('crossing the finish line early (checkpoints not done) does not count a lap', () => {
  const car = { pos: { x: 0, y: 0 }, lap: 0, nextCheckpoint: 0 };
  const r = move(car, -5, 5); // crosses start line but expected gate is cp0
  assert.equal(r.lapCompleted, false);
  assert.equal(car.lap, 0);
  assert.equal(car.nextCheckpoint, 0);
});

test('segmentsIntersect detects a clear crossing and rejects a non-crossing', () => {
  assert.equal(segmentsIntersect({ x: -1, y: 0 }, { x: 1, y: 0 }, { x: 0, y: -1 }, { x: 0, y: 1 }), true);
  assert.equal(segmentsIntersect({ x: 2, y: 0 }, { x: 4, y: 0 }, { x: 0, y: -1 }, { x: 0, y: 1 }), false);
});

test('finishOrder is deterministic with no ties', () => {
  const cars = [
    { id: 'cpu-1', finishRank: 2, lap: 3, nextCheckpoint: 0 },
    { id: 'player', finishRank: 1, lap: 3, nextCheckpoint: 0 },
    { id: 'cpu-2', finishRank: null, lap: 2, nextCheckpoint: 1 },
    { id: 'cpu-3', finishRank: null, lap: 2, nextCheckpoint: 1 }, // tie broken by id
  ];
  assert.deepEqual(finishOrder(cars), ['player', 'cpu-1', 'cpu-2', 'cpu-3']);
});

test('pause snapshot then resume restores exact state with zero drift', () => {
  const state = {
    raceTimeMs: 1000,
    rng: createRng(123),
    cars: [{ id: 'player', pos: { x: 12.5, y: 34.5 }, heading: 0.3, speed: 88, lap: 1, nextCheckpoint: 2, activeEffects: [] }],
    tokens: [{ pos: { x: 1, y: 2 }, available: true }],
  };
  const snap = snapshot(state);
  const beforeRng = state.rng.getState();

  // Simulate time passing while "paused-question" is open.
  state.cars[0].pos.x = 999;
  state.cars[0].lap = 9;
  state.raceTimeMs = 50000;
  state.rng.next();
  state.tokens[0].available = false;

  resume(state, snap);
  assert.equal(state.cars[0].pos.x, 12.5);
  assert.equal(state.cars[0].lap, 1);
  assert.equal(state.cars[0].nextCheckpoint, 2);
  assert.equal(state.raceTimeMs, 1000);
  assert.equal(state.rng.getState(), beforeRng);
  assert.equal(state.tokens[0].available, true);
});
