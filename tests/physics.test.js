import { test } from 'node:test';
import assert from 'node:assert/strict';
import { constrainToTrack, resolveCarCollision } from '../engine/physics.js';

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

test('cars that are far apart do not collide', () => {
  const a = { pos: { x: 0, y: 0 }, speed: 200, activeEffects: [] };
  const b = { pos: { x: 100, y: 0 }, speed: 200, activeEffects: [] };
  assert.equal(resolveCarCollision(a, b), false);
  assert.equal(a.speed, 200);
  assert.equal(b.speed, 200);
});

test('overlapping cars are shoved apart and both bleed speed', () => {
  const a = { pos: { x: 0, y: 0 }, speed: 200, activeEffects: [] };
  const b = { pos: { x: 10, y: 0 }, speed: 200, activeEffects: [] };
  assert.equal(resolveCarCollision(a, b, 24), true);
  assert.ok(a.pos.x < 0 && b.pos.x > 10); // pushed apart along the normal
  assert.equal(Math.round(b.pos.x - a.pos.x), 24); // separated to exactly minDist
  assert.ok(a.speed < 200 && b.speed < 200);
});

test('a shielded car is immune: it holds position and keeps its speed', () => {
  const a = { pos: { x: 0, y: 0 }, speed: 200, activeEffects: [{ id: 'shield' }] };
  const b = { pos: { x: 10, y: 0 }, speed: 200, activeEffects: [] };
  assert.equal(resolveCarCollision(a, b, 24), true);
  assert.deepEqual(a.pos, { x: 0, y: 0 }); // shielded car does not move
  assert.equal(a.speed, 200); // ...and does not slow down
  assert.equal(b.pos.x, 24); // the other car absorbs the full separation
  assert.ok(b.speed < 200); // ...and takes the speed hit
});
