# Implementation Plan: CCNA Racing Retro Video Game

**Branch**: `001-ccna-racing-game` | **Date**: 2026-07-01 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-ccna-racing-game/spec.md`

## Summary

A top-down 2D retro racing game for desktop web browsers in which the player races three
AI opponents over 3 laps. Power-up tokens on the track gate a CCNA multiple-choice question
(exactly 4 options, 1 correct); a correct answer grants one of four random power-ups/weapons,
a wrong answer grants nothing. The race fully pauses during questions and resumes from the
exact prior state. Technical approach (adapting the project's `PLAN.md` philosophy): a
zero-dependency vanilla HTML/CSS/JavaScript app with no build tools, a real-time Canvas 2D
render layer for the race, accessible DOM overlays for menus/HUD/questions, all content in
auditable `/data/*.json` files, and a pure, unit-tested engine that is the single source of
truth for correctness (the UI never decides whether an answer is right).

## Technical Context

**Language/Version**: JavaScript (ES2022 modules), HTML5, CSS3. No TypeScript, no transpile step.

**Primary Dependencies**: None at runtime. No frameworks, no bundler, no package manager for
shipping code. (Adapts `PLAN.md`'s "vanilla, no build tools" stance; see Research for why
THREE.js — mentioned in `PLAN.md` — was evaluated and not adopted for a 2D racer.)

**Storage**: Static JSON files under `/data` for questions, power-ups, and track layout.
Browser `localStorage` for optional best-lap time and settings only. No backend, no accounts.

**Testing**: Node.js built-in test runner (`node:test` + `node:assert`) for pure engine modules
(question grading, option shuffling, reward selection, item effects, lap/finish logic). No test
framework dependency. Manual quickstart scenarios for browser/UX validation.

**Target Platform**: Current desktop browsers (Chrome, Firefox, Edge, Safari) with keyboard
input. Served as static files over HTTP (any static server / `python -m http.server`).

**Project Type**: Single-project static web application (client-only).

**Performance Goals**: 60 fps race loop on a typical laptop; first interactive load < 10s on
broadband (SC-008); input-to-reaction latency imperceptible (< 50ms).

**Constraints**: No install step; no runtime network calls for answer correctness (FR-019);
all core interactions keyboard-operable (FR-002, Principle V); offline-capable after first load.

**Scale/Scope**: v1 = 1 track, 4 cars, 3 laps, 4 power-up types, a single mixed-domain question
pool (target ~40+ authored questions). Single local player; no concurrency concerns.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution v1.0.0. Each principle maps to a concrete, verifiable design gate:

| Principle | Gate (how this plan satisfies it) | Status |
|-----------|-----------------------------------|--------|
| I. Educational Integrity First (NON-NEGOTIABLE) | Grading lives in pure `quiz.js`, unit-tested; answer correctness is deterministic and local (FR-019). A data-validation step asserts every question has exactly 4 options, exactly 1 correct, and a non-empty `source`. | ✅ PASS |
| II. Learning-Gated Rewards | `rewards.js` is only invoked on a verified-correct answer; no other code path grants items. Tested that a wrong/`null` result yields no reward. | ✅ PASS |
| III. Fair Multiple-Choice Question Design | Question schema enforces 4 options / 1 correct; `quiz.js` shuffles option order per presentation (tested for distribution); content authored with plausible distractors and CCNA topic tags. Data-driven in `/data/questions.json`. | ✅ PASS |
| IV. Pause-to-Learn | `race.pause()` snapshots full race state and halts the loop, opponents, hazards, and race timer; `race.resume()` restores the snapshot exactly. The on-question countdown is cosmetic only (FR-024) and never affects scoring. | ✅ PASS |
| V. Retro Feel & Accessibility | Canvas 2D retro palette/pixel rendering; DOM overlays for menu/HUD/question are fully keyboard-operable; runs in-browser with no install; explicit loading/paused/error/empty/post-race states (FR-023). | ✅ PASS |

**Content & Data Standards**: All Q&A and item data in editable `/data/*.json`, separate from
logic (FR-017); each question carries a `source` (FR-018); no external/AI runtime grading
(FR-019). ✅ PASS

**Development Workflow & Quality Gates**: Pure engine modules are unit-tested; pause and
reward-on-correct behaviors each have tests; a question-data validator enforces invariants
pre-commit/CI. ✅ PASS

**Result**: No violations. Complexity Tracking is empty.

## Project Structure

### Documentation (this feature)

```text
specs/001-ccna-racing-game/
├── plan.md              # This file (/speckit-plan output)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (data schemas + engine module contracts)
│   ├── questions.schema.json
│   ├── powerups.schema.json
│   ├── track.schema.json
│   └── engine-contracts.md
├── checklists/
│   └── requirements.md  # Spec quality checklist (already created)
└── tasks.md             # Created later by /speckit-tasks (NOT here)
```

### Source Code (repository root)

```text
index.html               # Single entry point; loads CSS + ES module graph
style.css                # Retro theme: palette, pixel font, layout, UI states

main.js                  # Bootstraps app; screen routing (start → race → result)

engine/                  # Game logic (the single source of truth; UI never decides correctness)
├── rng.js               # Seedable, snapshot-able PRNG (shuffle, rewards, pause/resume determinism)
├── state.js             # Central game/session state
├── loop.js              # Fixed-timestep game loop (start/stop/pause-aware)
├── race.js              # Cars, laps, finishing order, pause()/resume() snapshots
├── physics.js           # Top-down car movement & steering (pure update functions)
├── ai.js                # Opponent car AI (waypoint/racing-line following)
├── tokens.js            # Power-up token placement + collision/collection detection
├── quiz.js              # Question pick + option shuffle + grade() (PURE, tested)
├── rewards.js           # Random reward selection from item pool (PURE, tested)
└── items.js             # Power-up/weapon effect application (PURE, tested)

render/                  # Canvas 2D drawing only (no game decisions here)
├── trackRenderer.js     # Draws track, cars, tokens, projectiles
└── retro.js             # Retro palette, pixel/sprite helpers

ui/                      # Accessible DOM overlays (keyboard-operable)
├── menu.js              # Start screen + result screen
├── hud.js               # Lap counter, position, inventory
└── questionOverlay.js   # Multiple-choice question + cosmetic countdown + feedback

data/                    # Auditable content; NO logic
├── questions.json       # CCNA questions (4 options, 1 correct, source, topic)
├── powerups.json        # The 4 power-up/weapon definitions + effects
└── track.json           # Track geometry, finish line, token positions

data/schemas/            # Runtime/validation schemas (mirrors contracts/)
├── questions.schema.json
├── powerups.schema.json
└── track.schema.json

tools/
└── validate-data.mjs    # CI/local validator: enforces question + item + track invariants

tests/                   # node:test suites for pure engine modules
├── quiz.test.js
├── rewards.test.js
├── items.test.js
└── race.test.js
```

**Structure Decision**: Single-project static web app. The codebase is split by responsibility
so the constitution's "engine is the single source of truth" rule is structurally enforced:
`engine/` holds all rules and is framework- and DOM-free (so it is unit-testable under
`node:test`); `render/` only draws; `ui/` only presents and captures input; `data/` only
declares content. Correctness logic (`quiz.js`, `rewards.js`, `items.js`, `race.js`) has zero
DOM/Canvas dependencies.

## Complexity Tracking

> No constitution violations — no entries required.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| (none)    | —          | —                                    |
