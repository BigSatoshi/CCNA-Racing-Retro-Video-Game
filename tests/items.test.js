import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyEffect, tickEffects, effectMods } from '../engine/items.js';

const DEFS = {
  speed_boost: { id: 'speed_boost', kind: 'self', durationMs: 3000, params: { speedMultiplier: 1.5 } },
  shield: { id: 'shield', kind: 'self', durationMs: 5000, params: {} },
  oil_slick: { id: 'oil_slick', kind: 'offense', durationMs: 1500, params: { spinMs: 1200 } },
  homing_missile: { id: 'homing_missile', kind: 'offense', durationMs: 1500, params: { spinMs: 1000 } },
};

const car = () => ({ activeEffects: [] });

test('self effects apply to the source car only', () => {
  const me = car();
  applyEffect(DEFS.speed_boost, me, null, 0);
  assert.equal(me.activeEffects.length, 1);
  assert.equal(me.activeEffects[0].id, 'speed_boost');
  assert.equal(me.activeEffects[0].expiresAt, 3000);
  assert.equal(effectMods(me).speedMul, 1.5);
});

test('offense effects spin the target car', () => {
  const me = car();
  const foe = car();
  applyEffect(DEFS.oil_slick, me, foe, 100);
  assert.equal(me.activeEffects.length, 0);
  assert.equal(foe.activeEffects[0].id, 'spin');
  assert.equal(foe.activeEffects[0].expiresAt, 100 + 1200);
  assert.equal(effectMods(foe).spun, true);
});

test('a shield cancels exactly one incoming hostile effect (and is consumed)', () => {
  const me = car();
  const foe = car();
  applyEffect(DEFS.shield, foe, null, 0); // foe shields up
  applyEffect(DEFS.homing_missile, me, foe, 0); // hits the shield
  assert.equal(foe.activeEffects.length, 0, 'shield consumed, no spin applied');
  // A second hit gets through.
  applyEffect(DEFS.homing_missile, me, foe, 0);
  assert.equal(foe.activeEffects.some((e) => e.id === 'spin'), true);
});

test('repeated activation does not stack the same effect', () => {
  const me = car();
  applyEffect(DEFS.speed_boost, me, null, 0);
  applyEffect(DEFS.speed_boost, me, null, 500);
  const boosts = me.activeEffects.filter((e) => e.id === 'speed_boost');
  assert.equal(boosts.length, 1);
  assert.equal(boosts[0].expiresAt, 500 + 3000); // refreshed, not duplicated
});

test('tickEffects removes only expired effects', () => {
  const me = car();
  applyEffect(DEFS.speed_boost, me, null, 0); // expires at 3000
  tickEffects(me, 2999);
  assert.equal(me.activeEffects.length, 1);
  tickEffects(me, 3000);
  assert.equal(me.activeEffects.length, 0);
});
