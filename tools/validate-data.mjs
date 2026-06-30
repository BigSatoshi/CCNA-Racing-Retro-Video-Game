#!/usr/bin/env node
// Content integrity validator (T004). Zero dependencies.
// Enforces the invariants from contracts/engine-contracts.md and the JSON schemas.
// Exits non-zero on any violation so it can gate CI / local checks.

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DATA = join(ROOT, 'data');

const TOPICS = ['subnetting', 'routing', 'switching', 'osi-tcpip', 'protocols', 'security'];
const DIFFICULTIES = ['easy', 'medium', 'hard'];
const POWERUP_IDS = ['speed_boost', 'shield', 'oil_slick', 'homing_missile'];

const errors = [];
const fail = (msg) => errors.push(msg);

async function loadJson(rel) {
  try {
    return JSON.parse(await readFile(join(DATA, rel), 'utf8'));
  } catch (err) {
    fail(`Cannot read/parse data/${rel}: ${err.message}`);
    return null;
  }
}

function validateQuestions(questions) {
  if (!Array.isArray(questions) || questions.length < 1) {
    return fail('questions.json must be a non-empty array');
  }
  const ids = new Set();
  questions.forEach((q, i) => {
    const at = `questions[${i}] (${q?.id ?? '?'})`;
    if (typeof q.id !== 'string' || !q.id) fail(`${at}: missing id`);
    else if (ids.has(q.id)) fail(`${at}: duplicate id "${q.id}"`);
    else ids.add(q.id);
    if (!TOPICS.includes(q.topic)) fail(`${at}: invalid topic "${q.topic}"`);
    if (!DIFFICULTIES.includes(q.difficulty)) fail(`${at}: invalid difficulty "${q.difficulty}"`);
    if (typeof q.prompt !== 'string' || !q.prompt.trim()) fail(`${at}: empty prompt`);
    if (!Array.isArray(q.options) || q.options.length !== 4) {
      fail(`${at}: must have exactly 4 options`);
    } else {
      if (q.options.some((o) => typeof o !== 'string' || !o.trim())) fail(`${at}: empty option`);
      if (new Set(q.options).size !== q.options.length) fail(`${at}: duplicate option text`);
    }
    if (!Number.isInteger(q.correctIndex) || q.correctIndex < 0 || q.correctIndex > 3) {
      fail(`${at}: correctIndex must be an integer 0..3`);
    }
    if (typeof q.explanation !== 'string' || !q.explanation.trim()) fail(`${at}: empty explanation`);
    if (typeof q.source !== 'string' || !q.source.trim()) fail(`${at}: missing source (FR-018)`);
  });
  return questions.length;
}

function validatePowerups(items) {
  if (!Array.isArray(items) || items.length !== 4) {
    return fail('powerups.json must contain exactly 4 items');
  }
  const seen = new Set();
  items.forEach((p, i) => {
    const at = `powerups[${i}] (${p?.id ?? '?'})`;
    if (!POWERUP_IDS.includes(p.id)) fail(`${at}: invalid id "${p.id}"`);
    else seen.add(p.id);
    if (typeof p.name !== 'string' || !p.name.trim()) fail(`${at}: empty name`);
    if (!['self', 'offense'].includes(p.kind)) fail(`${at}: invalid kind "${p.kind}"`);
    if (!Number.isInteger(p.durationMs) || p.durationMs <= 0) fail(`${at}: durationMs must be > 0`);
    if (typeof p.params !== 'object' || p.params === null) fail(`${at}: params must be an object`);
    if (typeof p.icon !== 'string' || !p.icon.trim()) fail(`${at}: empty icon`);
  });
  for (const id of POWERUP_IDS) if (!seen.has(id)) fail(`powerups.json missing required id "${id}"`);
}

function isPoint(p) {
  return p && typeof p.x === 'number' && typeof p.y === 'number';
}
function isSegment(s) {
  return s && isPoint(s.a) && isPoint(s.b);
}

function validateTrack(t) {
  if (!t || typeof t !== 'object') return fail('track.json must be an object');
  if (typeof t.id !== 'string' || !t.id) fail('track: missing id');
  if (typeof t.name !== 'string' || !t.name) fail('track: missing name');
  if (t.lapsToWin !== 3) fail('track: lapsToWin must be 3 for v1');
  if (!Array.isArray(t.path) || t.path.length < 3 || !t.path.every(isPoint)) fail('track: path needs >= 3 points');
  if (typeof t.width !== 'number' || t.width <= 0) fail('track: width must be > 0');
  if (!isSegment(t.startLine)) fail('track: invalid startLine');
  if (!Array.isArray(t.checkpoints) || t.checkpoints.length < 1 || !t.checkpoints.every(isSegment)) fail('track: checkpoints needs >= 1 segment');
  if (!Array.isArray(t.startGrid) || t.startGrid.length < 4 || !t.startGrid.every(isPoint)) fail('track: startGrid needs >= 4 points');
  if (!Array.isArray(t.tokenSpawns) || t.tokenSpawns.length < 1 || !t.tokenSpawns.every(isPoint)) fail('track: tokenSpawns needs >= 1 point');
  if (!Array.isArray(t.aiWaypoints) || t.aiWaypoints.length < 3 || !t.aiWaypoints.every(isPoint)) fail('track: aiWaypoints needs >= 3 points');
}

const [questions, powerups, track] = await Promise.all([
  loadJson('questions.json'),
  loadJson('powerups.json'),
  loadJson('track.json'),
]);

let qCount = 0;
if (questions) qCount = validateQuestions(questions) || 0;
if (powerups) validatePowerups(powerups);
if (track) validateTrack(track);

if (errors.length) {
  console.error(`❌ Data validation FAILED (${errors.length} issue${errors.length === 1 ? '' : 's'}):`);
  for (const e of errors) console.error('  - ' + e);
  process.exit(1);
}
console.log(`✅ Data OK — questions: ${qCount}, powerups: 4, track: ${track.id}`);
