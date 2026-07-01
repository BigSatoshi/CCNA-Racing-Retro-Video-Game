# CCNA Racing Retro Video Game

A top-down, retro arcade racer that teaches **CCNA networking**. You race three AI cars over
3 laps. Power-up tokens (`?`) sit on the track — grab one and the race **pauses** for a CCNA
multiple-choice question. Answer correctly to win a random power-up or weapon; answer wrong and
you get nothing. The race resumes exactly where it left off.

Built with [Spec Kit](https://github.com/github/spec-kit) Spec-Driven Development. The full
spec, plan, and tasks live in [`specs/001-ccna-racing-game/`](specs/001-ccna-racing-game/), and
the project rules are in [`.specify/memory/constitution.md`](.specify/memory/constitution.md).

## Play

No install, no build step — it's vanilla HTML/CSS/JavaScript. Serve the folder over HTTP and open
it in a desktop browser:

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

### Controls

| Key | Action |
|-----|--------|
| Arrow keys / WASD | Drive (accelerate, brake, steer) |
| Space or F | Use your current power-up |
| 1 / 2 / 3 / 4 (or click) | Answer a question |

After you answer, the race resumes automatically after a few seconds — no keypress needed.

Everything is keyboard-operable.

## Power-ups

| Item | Type | Effect |
|------|------|--------|
| Speed Boost | self | Temporary top-speed increase |
| Shield | self | Blocks the next hostile hit |
| Oil Slick | offense | Drops a hazard that spins out cars behind you |
| Homing Missile | offense | Spins out the nearest opponent ahead |

## Develop

```bash
node tools/validate-data.mjs   # validate question/power-up/track content integrity
node --test                    # run the engine unit tests
```

### Project layout

- `engine/` — game logic and the **single source of truth** for correctness. DOM/Canvas-free and
  unit-tested (`quiz`, `rewards`, `items`, `race`).
- `render/` — Canvas 2D drawing only.
- `ui/` — accessible DOM overlays (menu, HUD, question dialog).
- `data/` — auditable content (`questions.json`, `powerups.json`, `track.json`); no logic.
- `tools/validate-data.mjs` — enforces content invariants (4 options / 1 correct / a `source`).
- `tests/` — `node:test` suites for the pure engine modules.

## Glossary

To keep terminology consistent across the spec, plan, and code:

- **Token** — the `?` pickup on the track. Collecting one triggers a question. Tokens respawn each
  lap.
- **Power-up / weapon** — the reward you can earn (the four items above). "Weapon" just means an
  offense-type power-up; both are stored the same way.
- **Reward** — the single power-up granted for a correct answer.
- **Inventory** — the power-ups you currently hold (per race; not carried between races).

## Constitution highlights

- The game never presents incorrect networking info; grading is deterministic and **local** (no
  runtime AI/external grading).
- Rewards come **only** from a correct answer.
- Questions always have exactly 4 options with 1 correct answer, shuffled each time.
- The race fully **pauses** during a question; the ~30s countdown is cosmetic and never penalizes.
