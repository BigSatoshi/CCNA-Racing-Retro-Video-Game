import { test } from 'node:test';
import assert from 'node:assert/strict';
import { selectNext, present, grade } from '../engine/quiz.js';
import { createRng } from '../engine/rng.js';

const q = {
  id: 'q1',
  options: ['alpha', 'bravo', 'charlie', 'delta'],
  correctIndex: 2, // 'charlie'
  prompt: 'pick',
  explanation: 'because charlie',
};

test('present() returns a valid permutation of the 4 options', () => {
  const rng = createRng(7);
  for (let i = 0; i < 50; i++) {
    const p = present(q, rng);
    assert.equal(p.displayOptions.length, 4);
    assert.deepEqual([...p.displayOptions].sort(), [...q.options].sort());
  }
});

test('the correct option is tracked across positions and lands in >=3 slots (SC-005)', () => {
  const rng = createRng(99);
  const positions = new Set();
  for (let i = 0; i < 200; i++) {
    const p = present(q, rng);
    assert.equal(p.displayOptions[p.correctDisplayIndex], 'charlie');
    positions.add(p.correctDisplayIndex);
  }
  assert.ok(positions.size >= 3, `correct answer only appeared in ${positions.size} positions`);
});

test('grade() is true only for the correct display index', () => {
  const rng = createRng(1);
  const p = present(q, rng);
  for (let i = 0; i < 4; i++) {
    assert.equal(grade(p, i), i === p.correctDisplayIndex);
  }
});

test('selectNext() avoids immediate repeats and reuses when exhausted', () => {
  const rng = createRng(5);
  const pool = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
  for (let i = 0; i < 30; i++) {
    const picked = selectNext(pool, rng, ['a', 'b']);
    assert.equal(picked.id, 'c'); // only fresh option
  }
  // Exhausted (all recent) -> falls back to the full pool rather than failing.
  const picked = selectNext(pool, rng, ['a', 'b', 'c']);
  assert.ok(['a', 'b', 'c'].includes(picked.id));
});
