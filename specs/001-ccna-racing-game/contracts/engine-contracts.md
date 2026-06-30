# Engine Module Contracts

These are the behavioral contracts for the pure, unit-tested engine modules (no DOM, no Canvas).
They are the constitution's "single source of truth." Signatures are illustrative (JS, ES
modules); the binding contract is the described behavior, inputs, outputs, and invariants.

---

## `engine/quiz.js`

### `selectNext(pool, rng, recentIds) → Question`
- **Input**: the validated `pool` of questions, a seedable PRNG, and `recentIds` (ids shown
  recently, to avoid immediate repeats).
- **Output**: one `Question` chosen from `pool`.
- **Invariants**: never returns a question whose `id` is in `recentIds` while any non-recent
  question remains; when every question is "recent" (pool exhausted), it falls back to reuse
  rather than returning null/undefined (spec edge case "exhausted pool → reuse"); PURE given `rng`.

### `present(question, rng) → QuestionPresentation`
- **Input**: one `Question` record (authoring order) + a seedable PRNG.
- **Output**: a `QuestionPresentation` whose `displayOptions` is a shuffled permutation of the
  question's 4 options, with `correctDisplayIndex` pointing at the slot holding the originally
  correct option.
- **Invariants**:
  - `displayOptions` is a permutation of `question.options` (same multiset, length 4).
  - `displayOptions[correctDisplayIndex] === question.options[question.correctIndex]`.
  - Over many calls with varied RNG state, the correct option appears in all 4 positions
    (supports SC-005). Must not always return the authoring order.

### `grade(presentation, selectedDisplayIndex) → boolean`
- **Output**: `true` iff `selectedDisplayIndex === presentation.correctDisplayIndex`.
- **Invariants**: PURE and deterministic; no side effects; never consults any external service
  (FR-019). This is the only place an answer is judged correct.

---

## `engine/rewards.js`

### `pickReward(powerups, rng) → string`  (a power-up `id`)
- **Precondition (caller-enforced)**: invoked **only** after `grade(...) === true` (Principle II).
- **Output**: one `id` selected from the 4 `powerups` using `rng`.
- **Invariants**: returns a valid id from the provided pool; selection distribution is
  approximately uniform over many seeded calls (testable); PURE given `rng`.

> Contract note: there is intentionally **no** "consolation" entry point. Wrong answers never
> call this function (FR-010).

---

## `engine/items.js`

### `applyEffect(powerupDef, sourceCar, targetCar, now) → { sourceCar, targetCar }`
- **Behavior**: applies a power-up's effect to the correct car(s) per `kind`:
  - `self` (speed_boost, shield): mutates `sourceCar` (boost adds a timed speed effect; shield
    adds a timed block of the next hostile effect).
  - `offense` (oil_slick, homing_missile): produces/affects `targetCar` (timed spin/slow).
- **Invariants**: effects carry an `expiresAt = now + durationMs`; a `shield` on the target
  cancels exactly one incoming hostile effect; PURE (returns new state, no I/O). Idempotent
  guards prevent a single activation from stacking multiple copies (spec edge case: rapid input).

### `tickEffects(car, now) → car`
- Removes expired effects (`expiresAt <= now`) and recomputes derived stats (e.g., current top
  speed). PURE.

---

## `engine/race.js`

### `pause(state) → PausedSnapshot`
- Captures every car's `pos`, `heading`, `velocity`, `lap`, `nextCheckpoint`, `activeEffects`,
  plus the `rng` state and elapsed race time. Halts the loop and the race timer (FR-007).

### `resume(state, snapshot) → state`
- Restores the snapshot **exactly**; no drift in position or lap counts (FR-012, SC-003). The
  duration spent paused does not alter any car state or scoring.

### `advanceLap(car, crossedCheckpointIndex, track) → car`
- Increments `nextCheckpoint` only on in-order checkpoint crossings; completes a lap only when the
  car crosses the start/finish line with all checkpoints satisfied. Prevents false laps from a
  near-finish pause/resume (spec edge case).

### `finishOrder(cars) → string[]`
- Returns car ids in a **deterministic** finishing order with no ties (spec edge case: tie at the
  line resolves deterministically, e.g., by exact crossing time then a stable tiebreak).

---

## Data validator — `tools/validate-data.mjs` (contract)

Exits non-zero (failing CI / local check) unless ALL hold:
1. `questions.json` matches `questions.schema.json`; every question has exactly 4 options, one
   in-range `correctIndex`, unique option texts, non-empty `source`; all `id`s unique.
2. `powerups.json` matches `powerups.schema.json`; exactly the 4 required ids present.
3. `track.json` matches `track.schema.json`; `startGrid` has ≥ 4 positions; `lapsToWin === 3`
   for v1.

This validator is the executable form of Principles I & III and Content & Data Standards.
