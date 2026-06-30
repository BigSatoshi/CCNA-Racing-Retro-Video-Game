# Quickstart & Validation Guide: CCNA Racing Retro Video Game

This guide proves the feature works end to end. It assumes the source layout from
[plan.md](./plan.md) and the contracts in [contracts/](./contracts/). No build step is required.

## Prerequisites

- A modern desktop browser (Chrome, Firefox, Edge, or Safari).
- Node.js 18+ (only for running the data validator and unit tests — not needed to play).
- No package install: the game ships as static files with zero runtime dependencies.

## Run the game

From the repo root, serve the static files and open the page:

```bash
# any static server works; example using Python
python3 -m http.server 8000
# then open http://localhost:8000 in a browser
```

Expected: the **start screen** appears in a retro style with a "Start Race" control reachable by
keyboard (Tab/Enter).

## Validate content integrity (Principles I & III)

```bash
node tools/validate-data.mjs
```

Expected: exits `0` and prints a summary (e.g., "questions: N OK, powerups: 4 OK, track OK").
To confirm the gate actually bites, temporarily give a question 3 options or two correct answers
and re-run — it MUST exit non-zero with a clear message. Restore afterward.

## Run engine unit tests (the single source of truth)

```bash
node --test
```

Expected: all suites pass, covering at minimum:
- `quiz.test.js` — shuffle is a valid permutation; correct option tracked across positions;
  `grade()` is correct only for the matching display index.
- `rewards.test.js` — only returns valid pool ids; approximately uniform; never reachable for a
  wrong answer (verified by call-path test/fake).
- `items.test.js` — effects apply to the right car, expire on time, shield cancels one hostile
  effect, no stacking on repeated activation.
- `race.test.js` — `pause`→`resume` restores state with zero drift; laps only count on in-order
  checkpoints; `finishOrder` is deterministic with no ties.

## End-to-end acceptance scenarios

Map directly to the spec's user stories and success criteria.

### Scenario A — Race to the finish (US1, SC-001)
1. Start a race. **Then** the player car + 3 opponents appear on a top-down retro track.
2. Drive with the keyboard (accelerate/brake/steer). **Then** the car responds.
3. Complete 3 laps. **Then** a result screen shows the player's finishing position (1–4).
4. **Verify**: a first-time player can reach the result screen within ~2 minutes.

### Scenario B — Earn a power-up by answering (US2, SC-002/003/004)
1. Drive over a power-up token. **Then** the race, opponents, and race timer fully **pause** and
   a question overlay appears with **exactly 4 options**.
2. Note each car's position. Wait > 30s so the cosmetic countdown expires. **Then** the overlay
   stays open and you can still answer (FR-024).
3. Answer **correctly**. **Then** you receive **one** random power-up in the HUD inventory and see
   "correct" feedback + explanation.
4. Re-trigger a token and answer **incorrectly**. **Then** you receive **nothing** and see the
   correct answer + explanation.
5. **Verify on resume**: cars are exactly where they were at pause — no position or lap drift.

### Scenario C — Use a power-up against opponents (US3)
1. With an item in inventory, activate it. **Then** its effect applies (boost/shield to you, or
   oil slick/missile against an opponent) and the item is consumed.
2. With an empty inventory, press the activate control. **Then** nothing happens (no error state).

### Scenario D — Integrity & fairness spot checks
- Present the **same** question several times. **Then** the correct answer is not always in the
  same position (SC-005).
- Audit `data/questions.json`. **Then** every entry has a non-empty `source` (SC-007).
- Confirm no network request is made to grade an answer (offline after first load) (FR-019).

### Scenario E — Explicit UI states (FR-023)
Confirm designed presentations exist for: loading, start, paused-question, empty-inventory,
error (e.g., force a data load failure), and post-race result.

### Scenario F — Non-functional & remaining edge cases
- **Load time (SC-008)**: from a cold cache, measure time to interactive start screen on a
  typical broadband connection. **Then** it is under 10 seconds.
- **Quit mid-question (edge case)**: open a question overlay, then refresh/close the tab. **Then**
  reopening returns to a safe state (start screen) with **no** reward granted and no corrupt race.
- **Power-up at race end (edge case)**: activate an item in the instant the race ends. **Then**
  the result screen is correct and no effect carries into it.
- **Distractor plausibility review (Principle III)**: spot-check a sample of `data/questions.json`
  entries. **Then** each wrong option is topically plausible (a real misconception or related
  concept), not an obvious throwaway. This is a human review the data validator cannot perform.

## Definition of Done (per the project's `PLAN.md` discipline)

- All engine unit tests pass (`node --test`) and the data validator passes (`node tools/validate-data.mjs`).
- Every question reviewed for accuracy and carries a verified `source`.
- The full loop (race → token → pause → question → reward/none → resume → finish) is playable
  with the **keyboard only**.
- Pause/resume shows no measurable state drift; the answer countdown never affects scoring.
