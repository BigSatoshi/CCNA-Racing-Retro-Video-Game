---

description: "Task list for CCNA Racing Retro Video Game implementation"
---

# Tasks: CCNA Racing Retro Video Game

**Input**: Design documents from `/specs/001-ccna-racing-game/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: Test tasks ARE included for the pure engine modules only — the project constitution
(Principle I "Educational Integrity First" and the Development Workflow gates) requires the
answer-grading, reward-on-correct, and pause/resume behaviors to be covered by tests. UI/render
behavior is validated manually via `quickstart.md`.

**Organization**: Tasks are grouped by user story (US1 → US2 → US3) so each story is an
independently testable increment.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: US1 / US2 / US3 (Setup, Foundational, and Polish phases have no story label)
- Paths follow the single-project static-web layout in plan.md (repo root: `engine/`, `render/`,
  `ui/`, `data/`, `tools/`, `tests/`).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project skeleton and content-integrity tooling (no game logic yet).

- [X] T001 Create the project structure at repo root: `index.html`, `style.css`, `main.js`, and empty dirs `engine/`, `render/`, `ui/`, `data/`, `data/schemas/`, `tools/`, `tests/`
- [X] T002 [P] Establish retro base theme (palette, pixel font, layout shell, screen containers) in `style.css`
- [X] T003 [P] Copy the three JSON schemas from `specs/001-ccna-racing-game/contracts/` into `data/schemas/` (`questions.schema.json`, `powerups.schema.json`, `track.schema.json`)
- [X] T004 [P] Implement the content validator in `tools/validate-data.mjs` per `contracts/engine-contracts.md` (schema + invariants: 4 options / 1 in-range `correctIndex` / unique option texts / non-empty `source` / unique ids; exactly the 4 powerup ids; `lapsToWin === 3`)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core runtime that every user story depends on.

**⚠️ CRITICAL**: No user-story work can begin until this phase is complete.

- [X] T005 Implement a seedable, snapshot-able PRNG in `engine/rng.js` (seed, next, getState/setState) — basis for shuffle, reward selection, and pause/resume determinism (research D6)
- [X] T006 [P] Implement central session/game state (screen enum `loading|start|racing|paused-question|result|error`, cars, pools, activeQuestion, rng, result) in `engine/state.js`
- [X] T007 [P] Implement retro render helpers (palette, pixel/sprite drawing) in `render/retro.js`
- [X] T008 Implement the data loader in `main.js` (or `engine/dataLoader.js`): fetch `data/*.json`, validate against `data/schemas/`, and route to the `error` screen with an explicit message on failure (FR-023, FR-019)
- [X] T009 Implement the fixed-timestep, pause-aware game loop in `engine/loop.js`
- [X] T010 Implement screen routing + canvas/DOM bootstrap in `main.js` and `index.html` (loading→start→racing→result→error; a `<canvas>` for the race plus DOM overlay containers for menu/HUD/question)
- [X] T011 Author a valid v1 track `data/track.json` (loop path, width, start/finish line, ordered checkpoints, ≥4 `startGrid` points, `tokenSpawns`, `aiWaypoints`) and confirm `node tools/validate-data.mjs` passes

**Checkpoint**: App boots to a start screen, loads validated data, and can run/stop a loop.

---

## Phase 3: User Story 1 - Race to the finish (Priority: P1) 🎯 MVP

**Goal**: A playable top-down retro race: the player vs. 3 AI cars over 3 laps, ending on a
result screen with finishing position.

**Independent Test**: Start a race, drive with the keyboard for 3 laps against 3 opponents, cross
the finish line, and see a result screen with the player's position (1–4). No tokens/questions.

### Tests for User Story 1

> Write these FIRST and ensure they FAIL before implementation.

- [X] T012 [P] [US1] Lap & finish tests in `tests/race.test.js`: laps count only on in-order checkpoint crossings, and `finishOrder` is deterministic with no ties (spec edge cases)

### Implementation for User Story 1

- [X] T013 [P] [US1] Implement top-down car movement & steering (pure update functions) in `engine/physics.js`
- [X] T014 [P] [US1] Implement opponent AI (waypoint/racing-line following + rubber-banding) in `engine/ai.js` (research D7)
- [X] T015 [US1] Implement race state in `engine/race.js`: car list, `advanceLap`, `finishOrder`, `finishRank` (depends on T012, T013)
- [X] T016 [US1] Implement player keyboard input (accelerate/brake/steer) in `main.js` input handling (FR-002)
- [X] T017 [P] [US1] Implement track + car rendering (canvas, top-down) in `render/trackRenderer.js`
- [X] T018 [P] [US1] Implement HUD (lap counter, current position) in `ui/hud.js`
- [X] T019 [P] [US1] Implement start screen and result screen (start race; show position; race-again / menu) in `ui/menu.js`
- [X] T020 [US1] Wire the race: spawn 4 cars on `startGrid`, run the loop for 3 laps, transition to result (in `main.js`, depends on T015–T019)
- [X] T021 [US1] Verify US1: `node --test tests/race.test.js` passes; play a full race keyboard-only to the result screen (SC-001)

**Checkpoint**: User Story 1 is fully functional and independently testable (MVP).

---

## Phase 4: User Story 2 - Earn power-ups by answering CCNA questions (Priority: P2)

**Goal**: Collecting a token pauses the race and shows a 4-option CCNA question; a correct answer
grants one random power-up, a wrong answer grants nothing; the race resumes from the exact state.

**Independent Test**: Drive over a token, confirm the race fully pauses with a 4-option question,
verify correct→one item / wrong→none, and confirm resume restores the prior race state exactly.

### Tests for User Story 2

> Write these FIRST and ensure they FAIL before implementation.

- [X] T022 [P] [US2] `tests/quiz.test.js`: `present()` produces a valid 4-item permutation, tracks the correct option across positions (SC-005); `grade()` returns true only for the matching display index (Principle I); and `selectNext()` avoids immediate repeats and falls back to reuse when the pool is exhausted (spec edge case)
- [X] T023 [P] [US2] `tests/rewards.test.js`: `pickReward()` returns a valid pool id with ~uniform distribution and is never invoked on a wrong answer (Principle II)
- [X] T024 [P] [US2] Extend `tests/race.test.js`: `pause()`→`resume()` restores the full snapshot with zero position/lap drift (FR-012, SC-003)

### Implementation for User Story 2

- [X] T025 [P] [US2] Author `data/questions.json` (≥40 questions spanning all 6 topics; each with exactly 4 options, one `correctIndex`, `explanation`, and a real `source`); confirm `node tools/validate-data.mjs` passes (FR-008/017/018/020, SC-007)
- [X] T026 [P] [US2] Author `data/powerups.json` defining the 4 items (`speed_boost`, `shield`, `oil_slick`, `homing_missile`) per `powerups.schema.json` (research D8)
- [X] T027 [P] [US2] Implement `engine/quiz.js`: `selectNext(pool, rng, recentIds)` (picks the next question, avoiding immediate repeats; reuses when exhausted), `present()` (shuffle via rng), and `grade()` — pure, no DOM/network (FR-009, FR-019, spec edge case "exhausted pool → reuse")
- [X] T028 [P] [US2] Implement `engine/rewards.js`: `pickReward(powerups, rng)` — pure (FR-010)
- [X] T029 [US2] Implement `pause()`/`resume()` snapshots (cars, effects, rng, race time) in `engine/race.js` (FR-007, FR-012; depends on T024)
- [X] T030 [P] [US2] Implement token placement + collection detection (from `track.tokenSpawns`) in `engine/tokens.js`, including per-lap lifecycle: a collected token is unavailable for the rest of the lap and respawns at the start of each new lap (FR-006)
- [X] T031 [US2] Implement the accessible question overlay in `ui/questionOverlay.js`: 4 keyboard-selectable options, cosmetic ~30s countdown that never auto-fails or auto-submits (FR-024), and correct/incorrect feedback with explanation (FR-011)
- [X] T032 [US2] Wire the gated-reward flow in `main.js`: token collect → `race.pause` → `quiz.selectNext` → `quiz.present` → `quiz.grade` → on correct `rewards.pickReward` into player inventory / on wrong nothing → `race.resume`; block a second trigger while the overlay is open (FR-013); add per-race inventory to player state (FR-014)
- [X] T033 [US2] Render token sprites + collected state in `render/trackRenderer.js` and show the inventory in `ui/hud.js`
- [X] T034 [US2] Verify US2: `node --test` (quiz/rewards/race) and `node tools/validate-data.mjs` pass; play to confirm pause, correct→item, wrong→none, and exact resume (SC-002/003/004)

**Checkpoint**: User Stories 1 AND 2 both work independently.

---

## Phase 5: User Story 3 - Use power-ups and weapons against opponents (Priority: P3)

**Goal**: Activate earned items to boost/defend the player or hinder opponents; items are consumed
on use; effects last a bounded duration.

**Independent Test**: With an item in inventory, activate it and observe its effect (and consumption);
with an empty inventory, activation is a harmless no-op.

### Tests for User Story 3

> Write these FIRST and ensure they FAIL before implementation.

- [X] T035 [P] [US3] `tests/items.test.js`: `applyEffect` routes to the correct car by `kind`, `tickEffects` expires effects on time, `shield` cancels exactly one hostile effect, and repeated activation does not stack (spec edge case)

### Implementation for User Story 3

- [X] T036 [US3] Implement `engine/items.js`: `applyEffect` and `tickEffects` — pure (FR-016; depends on T035)
- [X] T037 [US3] Implement activation input + inventory consume in `main.js` / `engine/state.js` (activate selected item; empty inventory = no-op) (FR-015)
- [X] T038 [US3] Integrate effects into the loop in `engine/loop.js`/`engine/race.js`: apply boost/shield to the player and oil_slick/homing_missile vs opponents; have `engine/ai.js` avoid oil slicks; call `tickEffects` each frame
- [X] T039 [US3] Render active effects and projectiles (missile, oil slick) in `render/trackRenderer.js` and show active-effect indicators in `ui/hud.js`
- [X] T040 [US3] Verify US3: `node --test tests/items.test.js` passes; play to confirm effects apply, items are consumed, durations are bounded, and empty-inventory activation is a no-op

**Checkpoint**: All three user stories are independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Consistency, explicit states, and end-to-end validation.

- [X] T041 [P] Polish explicit loading / error / empty-inventory / paused / result state visuals in `style.css` and the `ui/` overlays (FR-023)
- [X] T042 [P] Tune retro aesthetic consistency across menu, track, HUD, and question overlay in `render/retro.js` and `style.css` (Principle V)
- [X] T043 Persist optional best-lap time and settings to `localStorage` in `engine/state.js` / `ui/menu.js` (no accounts/backend)
- [X] T044 [P] Confirm the full quality gate is green: `node --test` (all suites) and `node tools/validate-data.mjs`
- [ ] T045 Run all `quickstart.md` validation scenarios A–F end to end (keyboard-only), including Scenario F: verify load-to-interactive < 10s (SC-008), the "quit mid-question" and "power-up at race end" edge cases, and a human spot-check that question distractors are plausible (Principle III)
- [X] T046 [P] Update `README.md` with how to serve, play, validate data, and run tests; include a short glossary canonicalizing terms (token, power-up/weapon, reward, inventory) to resolve terminology drift across the spec/plan/tasks

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately.
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories.
- **User Stories (Phase 3–5)**: All depend on Foundational. US1 is the MVP; US2 builds on US1's
  race; US3 builds on US2's inventory. Stories are independently testable but were prioritized to
  layer naturally (P1 → P2 → P3).
- **Polish (Phase 6)**: Depends on the desired user stories being complete.

### User Story Dependencies

- **US1 (P1)**: Only needs Foundational. No dependency on other stories.
- **US2 (P2)**: Needs Foundational; consumes US1's race (`race.js`, loop) and extends it with
  `pause()/resume()`. Independently testable via the token→question→reward→resume loop.
- **US3 (P3)**: Needs Foundational; consumes US2's inventory to have items to activate.
  Independently testable by pre-seeding an item and activating it.

### Within Each User Story

- Engine tests are written first and must FAIL before implementation.
- Pure engine modules (physics/ai/quiz/rewards/items/race) before wiring in `main.js`.
- Rendering/HUD/overlay after the engine produces state to draw.
- Story verification task closes the phase.

### Parallel Opportunities

- Setup: T002, T003, T004 in parallel after T001.
- Foundational: T006, T007 in parallel; T005 precedes shuffle/reward/pause work.
- US1: T012 (test), T013 (physics), T014 (ai), T017 (renderer), T018 (HUD), T019 (menu) are
  different files → parallel; T015/T016/T020 integrate and are sequential.
- US2: tests T022/T023/T024 parallel; content T025/T026 parallel; pure modules T027/T028 and
  `tokens.js` T030 parallel; T029/T031/T032/T033 integrate.
- US3: T035 (test) then T036; T037–T039 integrate.
- Different developers can own US1/US2/US3 once Foundational is done.

---

## Parallel Example: User Story 2

```bash
# Engine tests (write first, expect FAIL):
Task: "tests/quiz.test.js — present()/grade() behavior"
Task: "tests/rewards.test.js — pickReward() distribution & gating"
Task: "tests/race.test.js — pause()/resume() zero-drift"

# Content + pure modules in parallel (different files):
Task: "Author data/questions.json"
Task: "Author data/powerups.json"
Task: "Implement engine/quiz.js"
Task: "Implement engine/rewards.js"
Task: "Implement engine/tokens.js"
```

---

## Implementation Strategy

### MVP First (User Story 1 only)

1. Phase 1: Setup → 2. Phase 2: Foundational (CRITICAL) → 3. Phase 3: US1.
4. **STOP and VALIDATE**: play a full keyboard-only race to the result screen.
5. Demo the retro racer as the MVP.

### Incremental Delivery

1. Setup + Foundational → foundation ready.
2. US1 → test → demo (MVP: a playable retro race).
3. US2 → test → demo (the learning gate: questions grant power-ups).
4. US3 → test → demo (items used against opponents — the full loop).

### Constitution gate (every increment)

- `node --test` green for the engine modules touched, and `node tools/validate-data.mjs` green,
  before a story is considered done. Grading/rewards stay pure and local; pause never affects
  scoring.

---

## Notes

- [P] = different files, no incomplete-task dependencies.
- Tests are scoped to the integrity-critical pure modules per the constitution, not full TDD.
- `engine/` stays DOM/Canvas-free so it remains unit-testable and is the single source of truth.
- Commit after each task or logical group; stop at any checkpoint to validate a story in isolation.
