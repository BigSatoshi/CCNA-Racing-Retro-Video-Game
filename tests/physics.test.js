import { test } from 'node:test';
import assert from 'node:assert/strict';
import { constrainToTrack } from '../engine/physics.js';

// A straight 40-wide road centred on the x-axis from (0,0) to (100,0).
const track = { path: [{ x: 0, y: 0 }, { x: 100, y: 0 }], width: 40 };

test('a car on the centerline is left untouched', () => {
  const car = { pos: { x: 50, y: 0 }, speed: 200 };
  constrainToTrack(car, track, 0);
  assert.deepEqual(car.pos, { x: 50, y: 0 });
  assert.equal(car.speed, 200);
});

test('a car within the road is left untouched', () => {
  const car = { pos: { x: 50, y: 15 }, speed: 200 };
  constrainToTrack(car, track, 0);
  assert.deepEqual(car.pos, { x: 50, y: 15 });
  assert.equal(car.speed, 200);
});

test('a car past the edge is pushed back onto the boundary and loses speed', () => {
  const car = { pos: { x: 50, y: 30 }, speed: 200 };
  constrainToTrack(car, track, 0); // half-width 20, margin 0
  assert.equal(car.pos.x, 50);
  assert.equal(car.pos.y, 20); // clamped to the edge along the inward normal
  assert.ok(car.speed < 200);
});

test('the body margin tightens the drivable half-width', () => {
  const car = { pos: { x: 50, y: 18 }, speed: 100 };
  constrainToTrack(car, track, 6); // drivable half-width = 20 - 6 = 14
  assert.equal(car.pos.y, 14);
});
