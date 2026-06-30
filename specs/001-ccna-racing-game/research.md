# Phase 0 Research: CCNA Racing Retro Video Game

All open technical decisions are resolved below. No `NEEDS CLARIFICATION` markers remain
(spec clarifications of 2026-07-01 fixed perspective, opponents, laps, answer timing, item
set, and topic scope).

## D1. Rendering engine for the top-down 2D race

- **Decision**: HTML5 **Canvas 2D** for the real-time race, with **DOM/HTML overlays** for
  menus, HUD, and the question dialog.
- **Rationale**: The spec clarified a top-down 2D bird's-eye view. Canvas 2D gives a clean
  60 fps game loop with crisp retro pixel rendering and **zero dependencies**, which best honors
  `PLAN.md`'s "vanilla, no frameworks, no build tools" intent. Keeping menus/HUD/question UI in
  the DOM keeps those interactions natively keyboard- and screen-reader-accessible (Principle V),
  which a pure-canvas UI would not.
- **Alternatives considered**:
  - **THREE.js** (named in `PLAN.md`): a 3D engine; usable for 2D but adds a sizable dependency
    and conflicts with the "no frameworks" stance for a game that is explicitly top-down 2D.
    Rejected as overkill for v1. *If the user later wants a pseudo-3D/OutRun look, revisit this.*
  - **Pure DOM/SVG rendering** (as Packet Quest's `PLAN.md` used): great for a static topology
    puzzle, impractical for animating 4 cars + projectiles at 60 fps. Rejected for the race layer;
    retained for the overlay layer.

## D2. No build tooling / module strategy

- **Decision**: Native **ES modules** (`<script type="module">`), served as static files. No
  bundler, transpiler, or package manager for shipped code.
- **Rationale**: Matches `PLAN.md` and Principle V (runs in-browser, no install). Modern target
  browsers support ES modules natively. Simplifies auditing and lowers the barrier for editing
  content/data.
- **Alternatives considered**: Vite/webpack (adds build step, rejected); single concatenated
  file (hurts readability/testability, rejected).

## D3. Testing approach for a no-build project

- **Decision**: **`node:test` + `node:assert`** for pure engine modules; manual `quickstart.md`
  scenarios for browser/UX behavior.
- **Rationale**: Node's built-in runner needs no dependencies and runs ES modules directly,
  preserving "no build tools." The constitution requires the grading and reward-on-correct paths
  to be tested; isolating them in DOM-free modules makes that straightforward.
- **Alternatives considered**: Jest/Vitest (extra dependency + config, rejected); browser-only
  manual testing (insufficient for the non-negotiable integrity guarantees, rejected as the sole
  method).

## D4. Question data shape & integrity enforcement

- **Decision**: `data/questions.json` is an array of records, each with `id`, `topic`, `prompt`,
  an `options` array of exactly 4 strings, a `correctIndex` (0–3), and a `source`. A
  `tools/validate-data.mjs` script asserts: exactly 4 options, a single in-range `correctIndex`,
  no duplicate option text within a question, non-empty `source`, and unique `id`s.
- **Rationale**: Directly enforces Principles I & III and FR-008/009/017/018. Storing the correct
  answer as an index (not a position-bound flag) lets `quiz.js` shuffle option order at runtime
  while tracking which shuffled slot is correct — so position can never be memorized (FR-009).
- **Alternatives considered**: Marking correctness with a boolean per option (works but easier to
  mis-author two "true"s; the validator would still need to catch it). Index + validator chosen
  for clarity. Authoring answers in fixed order with runtime shuffle chosen over pre-shuffled data
  so the same record can vary between presentations.

## D5. Pause/resume fidelity (Principle IV)

- **Decision**: `race.pause()` stops the loop and captures a structured snapshot (each car's
  position, heading, velocity, lap/checkpoint progress, active-effect timers, and the RNG state);
  `race.resume()` restores it verbatim. The question's ~30s countdown (FR-024) runs only in the
  overlay and feeds nothing back into race state or scoring.
- **Rationale**: Guarantees "resume from exact paused state" (FR-012, SC-003) and keeps answer
  timing non-scoring, satisfying the pause-to-learn principle.
- **Alternatives considered**: Letting the loop free-run with opponents frozen (risks drift/desync
  on the final stretch — edge case in spec); rejected in favor of a full halt + snapshot.

## D6. Deterministic randomness for testability

- **Decision**: A small **seedable PRNG** module powers option shuffling and reward selection.
  Production seeds from `crypto.getRandomValues`; tests inject a fixed seed.
- **Rationale**: Lets unit tests assert shuffle distribution (SC-005) and reward-pool fairness
  deterministically while keeping real play unpredictable. Snapshotting the PRNG state also makes
  pause/resume fully reproducible (D5).
- **Alternatives considered**: Raw `Math.random()` (not seedable, untestable distribution),
  rejected.

## D7. Opponent AI for v1

- **Decision**: Waypoint / racing-line following with simple rubber-banding and basic avoidance of
  hazards (oil slicks). Three opponents.
- **Rationale**: Enough to make finishing position meaningful and weapons impactful (FR-003,
  US3) without the cost of full physics-based racing AI. Data-driven waypoints live in
  `track.json`.
- **Alternatives considered**: Pathfinding/steering-behavior stacks (more than v1 needs);
  scripted ghosts (no real competition). Rejected.

## D8. Power-up / weapon model (the 4 v1 items)

- **Decision**: Define in `data/powerups.json`: `speed_boost` (self: temporary top-speed/accel
  increase), `shield` (self: blocks the next hostile effect for a duration), `oil_slick` (offense:
  drops a hazard that spins/slows a car that hits it), `homing_missile` (offense: targets the
  nearest car ahead, briefly spins it out). Each item declares `type` (self/offense), `effect`
  parameters, and `durationMs`. `items.js` applies effects purely against car state.
- **Rationale**: Matches the clarified "balanced mix of 4" and FR-016; data-driven so balancing is
  a content edit, not a code change (Content & Data Standards).
- **Alternatives considered**: Larger 6-item set (more balancing/art, deferred); minimal 2-item
  set (less reward variety). Rejected per clarification.

## Open items deferred to planning of later versions (not v1 blockers)

- Multiple tracks / level progression and difficulty tiering (tags already in the data model).
- Audio/music (out of scope per assumptions; `PLAN.md` likewise defers audio).
- Touch/gamepad input, mobile layout (out of scope v1).
