import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pickReward } from '../engine/rewards.js';
import { createRng } from '../engine/rng.js';

const POOL = [
  { id: 'speed_boost' },
  { id: 'shield' },
  { id: 'oil_slick' },
  { id: 'homing_missile' },
];

test('pickReward only returns ids from the provided pool', () => {
  const rng = createRng(42);
  const ids = new Set(POOL.map((p) => p.id));
  for (let i = 0; i < 100; i++) assert.ok(ids.has(pickReward(POOL, rng)));
});

test('pickReward is approximately uniform over the pool', () => {
  const rng = createRng(2024);
  const counts = {};
  const N = 4000;
  for (let i = 0; i < N; i++) {
    const id = pickReward(POOL, rng);
    counts[id] = (counts[id] || 0) + 1;
  }
  for (const p of POOL) {
    // expected N/4 = 1000; allow generous +-25% band
    assert.ok(counts[p.id] > 750 && counts[p.id] < 1250, `${p.id} got ${counts[p.id]}`);
  }
});

test('pickReward throws on an empty pool (no consolation path)', () => {
  const rng = createRng(1);
  assert.throws(() => pickReward([], rng));
});
