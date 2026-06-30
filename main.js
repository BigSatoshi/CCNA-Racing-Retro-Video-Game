// Bootstraps the game and wires engine + render + ui together (T008, T010, T016, T020,
// T032, T034, T037, T038, T043). The engine modules remain the source of truth; this file
// only orchestrates and handles browser I/O.

import { createState, Screen, player } from './engine/state.js';
import { createRng } from './engine/rng.js';
import { createLoop } from './engine/loop.js';
import { createCar, stepCar, constrainToTrack } from './engine/physics.js';
import { aiControls, normalizeAngle } from './engine/ai.js';
import { advanceProgress, finishOrder, snapshot, resume } from './engine/race.js';
import { createTokens, checkCollect, consume, respawnAll } from './engine/tokens.js';
import { selectNext, present, grade } from './engine/quiz.js';
import { pickReward } from './engine/rewards.js';
import { applyEffect, tickEffects, effectMods } from './engine/items.js';
import { render } from './render/trackRenderer.js';
import { updateHud } from './ui/hud.js';
import { renderResult, showBestLap } from './ui/menu.js';
import { showQuestion } from './ui/questionOverlay.js';

const state = createState();
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const overlayRoot = document.getElementById('overlay-root');
const keys = new Set();
let powerMap = {};

const BEST_LAP_KEY = 'ccna-racing-best-lap';

// ---- Screen routing -------------------------------------------------------
const SCREEN_EL = {
  [Screen.LOADING]: 'screen-loading',
  [Screen.ERROR]: 'screen-error',
  [Screen.START]: 'screen-start',
  [Screen.RACING]: 'screen-game',
  [Screen.PAUSED_QUESTION]: 'screen-game',
  [Screen.RESULT]: 'screen-result',
};
function routeScreen(name) {
  const targetId = SCREEN_EL[name];
  document.querySelectorAll('.screen').forEach((s) => {
    s.classList.toggle('is-active', s.id === targetId);
  });
}

function showError(msg) {
  state.screen = Screen.ERROR;
  state.errorMessage = msg;
  document.getElementById('error-msg').textContent = msg;
  routeScreen(Screen.ERROR);
}

// ---- Data loading (T008) --------------------------------------------------
async function okJson(res, name) {
  if (!res.ok) throw new Error(`Failed to load ${name} (HTTP ${res.status})`);
  return res.json();
}
async function loadData() {
  const [track, questions, powerups] = await Promise.all([
    fetch('data/track.json').then((r) => okJson(r, 'track.json')),
    fetch('data/questions.json').then((r) => okJson(r, 'questions.json')),
    fetch('data/powerups.json').then((r) => okJson(r, 'powerups.json')),
  ]);
  // Light runtime guard; full integrity is enforced by tools/validate-data.mjs.
  if (!Array.isArray(questions) || questions.length === 0) throw new Error('No questions found');
  for (const q of questions) {
    if (!Array.isArray(q.options) || q.options.length !== 4) throw new Error(`Question ${q.id} must have 4 options`);
  }
  if (!Array.isArray(powerups) || powerups.length !== 4) throw new Error('Expected exactly 4 power-ups');
  return { track, questions, powerups };
}

async function boot() {
  state.screen = Screen.LOADING;
  routeScreen(Screen.LOADING);
  try {
    const { track, questions, powerups } = await loadData();
    state.track = track;
    state.questionPool = questions;
    state.powerups = powerups;
    powerMap = Object.fromEntries(powerups.map((p) => [p.id, p]));
    state.bestLapMs = Number(localStorage.getItem(BEST_LAP_KEY)) || null;
    showBestLap(state.bestLapMs);
    state.screen = Screen.START;
    routeScreen(Screen.START);
    loop.start();
  } catch (err) {
    showError(err.message || String(err));
  }
}

// ---- Race setup -----------------------------------------------------------
function headingToward(from, to) {
  return Math.atan2(to.y - from.y, to.x - from.x);
}

function startRace() {
  const t = state.track;
  state.rng = createRng(crypto.getRandomValues(new Uint32Array(1))[0]);
  const firstWp = t.aiWaypoints[1] || t.path[1];
  state.cars = t.startGrid.slice(0, 4).map((pos, i) => {
    const car = createCar(i === 0 ? 'player' : `cpu-${i}`, i === 0, pos, headingToward(pos, firstWp));
    car.aiTargetIdx = 1;
    return car;
  });
  state.tokens = createTokens(t);
  state.hazards = [];
  state.missiles = [];
  state.raceTimeMs = 0;
  state.finishCount = 0;
  state.questionsAsked = 0;
  state.recentQuestionIds = [];
  state.pendingReward = null;
  state.activeQuestion = null;
  state.pauseSnapshot = null;
  state.result = null;
  state.screen = Screen.RACING;
  routeScreen(Screen.RACING);
  updateHudFromState();
}

// ---- Input ----------------------------------------------------------------
function playerControls() {
  const up = keys.has('arrowup') || keys.has('w');
  const down = keys.has('arrowdown') || keys.has('s');
  const left = keys.has('arrowleft') || keys.has('a');
  const right = keys.has('arrowright') || keys.has('d');
  return { throttle: (up ? 1 : 0) + (down ? -1 : 0), steer: (right ? 1 : 0) + (left ? -1 : 0) };
}

function nearestOpponent(p) {
  let best = null;
  let bestD = Infinity;
  for (const c of state.cars) {
    if (c.isPlayer || c.finished) continue;
    const d = Math.hypot(c.pos.x - p.pos.x, c.pos.y - p.pos.y);
    if (d < bestD) {
      bestD = d;
      best = c;
    }
  }
  return best;
}

// US3 — activate an owned item (FR-015). Empty inventory is a harmless no-op.
function useItem() {
  if (state.screen !== Screen.RACING) return;
  const p = player(state);
  if (!p || p.finished || p.inventory.length === 0) return;
  const def = powerMap[p.inventory.shift()];
  const now = state.raceTimeMs;
  if (def.kind === 'self') {
    applyEffect(def, p, null, now);
  } else if (def.id === 'oil_slick') {
    state.hazards.push({
      x: p.pos.x - Math.cos(p.heading) * 28,
      y: p.pos.y - Math.sin(p.heading) * 28,
      owner: p.id,
      expiresAt: now + 8000,
    });
  } else {
    // homing_missile: launch a projectile that flies toward the nearest opponent and
    // applies its spin on impact (engine/items.js handles the shield cancel there).
    const target = nearestOpponent(p);
    if (target) {
      state.missiles.push({
        x: p.pos.x + Math.cos(p.heading) * 14,
        y: p.pos.y + Math.sin(p.heading) * 14,
        heading: p.heading,
        speed: 520,
        targetId: target.id,
        owner: p.id,
        expiresAt: now + 4000, // safety lifetime if it never connects
      });
    }
  }
  updateHudFromState();
}

// ---- Question flow (US2) --------------------------------------------------
function triggerQuestion(tokenIdx) {
  consume(state.tokens, tokenIdx);
  // Advance the question rng BEFORE snapshotting so resume() leaves the rng moved forward
  // by exactly one question (no repeats), while still restoring race position/time.
  const q = selectNext(state.questionPool, state.rng, state.recentQuestionIds);
  state.recentQuestionIds.push(q.id);
  if (state.recentQuestionIds.length > 8) state.recentQuestionIds.shift();
  const presentation = present(q, state.rng);

  state.activeQuestion = presentation;
  state.pendingToken = tokenIdx;
  state.pauseSnapshot = snapshot(state); // Principle IV: full freeze
  state.screen = Screen.PAUSED_QUESTION;

  showQuestion(overlayRoot, {
    presentation,
    topic: q.topic,
    index: state.questionsAsked + 1,
    total: state.questionPool.length,
    onAnswer(displayIndex) {
      const isCorrect = grade(presentation, displayIndex); // single source of truth
      state.questionsAsked += 1;
      // Reward is selected only on a correct answer (Principle II) and held until resume.
      state.pendingReward = isCorrect ? pickReward(state.powerups, state.rng) : null;
      return { isCorrect, rewardName: state.pendingReward ? powerMap[state.pendingReward].name : null };
    },
    onClose() {
      resume(state, state.pauseSnapshot); // exact race state restored (FR-012)
      if (state.pendingReward) player(state).inventory.push(state.pendingReward);
      state.pendingReward = null;
      state.activeQuestion = null;
      state.pendingToken = null;
      state.pauseSnapshot = null;
      state.screen = Screen.RACING;
      updateHudFromState();
    },
  });
}

// ---- Lap / finish ---------------------------------------------------------
function onLap(car, now) {
  const lapTime = now - car.lapStartMs;
  car.lapStartMs = now;
  if (car.isPlayer) {
    respawnAll(state.tokens); // tokens respawn each new lap (FR-006)
    if (!state.bestLapMs || lapTime < state.bestLapMs) {
      state.bestLapMs = lapTime;
      localStorage.setItem(BEST_LAP_KEY, String(Math.round(lapTime)));
    }
  }
  if (car.lap >= state.track.lapsToWin) {
    car.finished = true;
    car.finishRank = ++state.finishCount;
  }
}

function endRace() {
  state.screen = Screen.RESULT;
  const order = finishOrder(state.cars);
  const pos = order.indexOf('player') + 1;
  state.result = { playerRank: pos, order };
  renderResult({
    title: pos === 1 ? 'YOU WIN!' : 'FINISH',
    detail: `You placed ${ordinal(pos)} of ${order.length}` + (state.bestLapMs ? ` · best lap ${(state.bestLapMs / 1000).toFixed(2)}s` : ''),
    order,
    playerId: 'player',
  });
  showBestLap(state.bestLapMs);
  routeScreen(Screen.RESULT);
}

function ordinal(n) {
  return ['', '1st', '2nd', '3rd', '4th'][n] || `${n}th`;
}

// ---- Simulation step ------------------------------------------------------
function progressOf(c) {
  return c.lap * 1000 + c.nextCheckpoint;
}
function rubberBand(car) {
  const p = player(state);
  const d = progressOf(p) - progressOf(car);
  if (d > 0) return 1.05;
  if (d < 0) return 0.97;
  return 1;
}

function update(dtMs) {
  if (state.screen !== Screen.RACING) return;
  const dt = dtMs / 1000;
  state.raceTimeMs += dtMs;
  const now = state.raceTimeMs;
  const t = state.track;
  state.hazards = (state.hazards || []).filter((h) => h.expiresAt > now);

  for (const car of state.cars) {
    tickEffects(car, now);
    if (car.finished) {
      car.speed *= Math.pow(0.85, dt);
      car.pos.x += Math.cos(car.heading) * car.speed * dt;
      car.pos.y += Math.sin(car.heading) * car.speed * dt;
      constrainToTrack(car, t);
      continue;
    }
    const mods = effectMods(car);
    let controls;
    if (car.isPlayer) {
      controls = playerControls();
    } else {
      controls = aiControls(car, t.aiWaypoints, { hazards: state.hazards });
      mods.speedMul *= rubberBand(car);
    }
    const prev = { x: car.pos.x, y: car.pos.y };
    stepCar(car, controls, dt, mods);
    constrainToTrack(car, t); // hard wall: keep the car on the road
    const res = advanceProgress(car, prev, t);
    if (res.lapCompleted) onLap(car, now);

    // Oil-slick hazard collisions (a shield blocks one).
    for (const h of state.hazards) {
      if (h.owner === car.id || h.expiresAt <= now) continue;
      if (Math.hypot(h.x - car.pos.x, h.y - car.pos.y) < 18) {
        const eff = car.activeEffects;
        const sIdx = eff.findIndex((e) => e.id === 'shield');
        if (sIdx >= 0) eff.splice(sIdx, 1);
        else if (!eff.some((e) => e.id === 'spin')) eff.push({ id: 'spin', expiresAt: now + 1300 });
        h.expiresAt = 0;
      }
    }
  }

  // Homing missiles in flight (US3): steer toward the live target, spin it on impact.
  state.missiles = (state.missiles || []).filter((m) => m.expiresAt > now);
  for (const m of state.missiles) {
    const target = state.cars.find((c) => c.id === m.targetId && !c.finished);
    if (target) {
      const desired = Math.atan2(target.pos.y - m.y, target.pos.x - m.x);
      const maxTurn = 6 * dt; // homing agility (rad/s)
      m.heading += Math.max(-maxTurn, Math.min(maxTurn, normalizeAngle(desired - m.heading)));
    }
    m.x += Math.cos(m.heading) * m.speed * dt;
    m.y += Math.sin(m.heading) * m.speed * dt;
    if (target && Math.hypot(target.pos.x - m.x, target.pos.y - m.y) < 16) {
      const owner = state.cars.find((c) => c.id === m.owner) || null;
      applyEffect(powerMap.homing_missile, owner, target, now); // shield cancel handled here
      m.expiresAt = 0; // consumed
    }
  }
  state.missiles = state.missiles.filter((m) => m.expiresAt > now);

  // Player collects a token -> pause for a question (FR-013: ignored while one is open).
  const p = player(state);
  if (!p.finished) {
    const idx = checkCollect(state.tokens, p);
    if (idx >= 0) triggerQuestion(idx);
  }

  if (p.finished && state.screen === Screen.RACING) endRace();
  updateHudFromState();
}

function renderFrame(now) {
  if (state.screen === Screen.RACING || state.screen === Screen.PAUSED_QUESTION) {
    render(ctx, state, now);
  }
}

// ---- HUD ------------------------------------------------------------------
function effectLabel(p) {
  const out = [];
  for (const e of p.activeEffects || []) {
    if (e.id === 'speed_boost') out.push('BOOST');
    if (e.id === 'shield') out.push('SHIELD');
    if (e.id === 'spin') out.push('SPUN!');
  }
  return out.join(' ');
}
function updateHudFromState() {
  const p = player(state);
  if (!p) return;
  const order = finishOrder(state.cars);
  updateHud({
    lap: p.lap,
    laps: state.track.lapsToWin,
    pos: order.indexOf('player') + 1,
    total: state.cars.length,
    timeMs: state.raceTimeMs,
    item: p.inventory.length ? powerMap[p.inventory[0]].name : null,
    effects: effectLabel(p),
  });
}

// ---- Wiring ---------------------------------------------------------------
const loop = createLoop({ update, render: renderFrame });

const DRIVE_KEYS = ['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '];
window.addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  if ((state.screen === Screen.RACING) && DRIVE_KEYS.includes(k)) e.preventDefault();
  keys.add(k);
  if ((k === ' ' || k === 'f') && !e.repeat) useItem();
});
window.addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));

document.getElementById('btn-start').addEventListener('click', startRace);
document.getElementById('btn-again').addEventListener('click', startRace);
document.getElementById('btn-menu').addEventListener('click', () => {
  state.screen = Screen.START;
  routeScreen(Screen.START);
});
document.getElementById('btn-retry').addEventListener('click', boot);

boot();
