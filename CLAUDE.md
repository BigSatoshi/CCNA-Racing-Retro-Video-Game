# CLAUDE.md

Guidance for working in this repository.

## Project

**CCNA Racing Retro Video Game** — a top-down 2D retro racer that teaches CCNA networking.
Players race 3 AI opponents over 3 laps; collecting a power-up token pauses the race and asks a
CCNA multiple-choice question (4 options, 1 correct). A correct answer grants 1 of 4 random
power-ups/weapons; a wrong answer grants nothing. The race resumes from the exact paused state.

Built with Spec-Driven Development (Spec Kit). Source of truth, in order:
`.specify/memory/constitution.md` → `specs/001-ccna-racing-game/{spec,plan,research,data-model}.md`
and `specs/001-ccna-racing-game/contracts/`.

## Tech stack & conventions

- **Vanilla** HTML5 + CSS3 + JavaScript (ES2022 modules). **No frameworks, no build tools, no
  bundler, no package manager** for shipped code.
- **Canvas 2D** for the real-time race; **DOM/HTML overlays** for menu/HUD/question (so they stay
  keyboard-accessible).
- All content in auditable `data/*.json` (questions, powerups, track) — **no logic in data**.
  Each question carries a `source`. Validate with `node tools/validate-data.mjs`.
- `engine/` is **DOM/Canvas-free** and is the single source of truth for correctness; `render/`
  only draws; `ui/` only presents/handles input. `quiz.js`, `rewards.js`, `items.js`, `race.js`
  are pure and unit-tested with `node --test`.

## Non-negotiables (from the constitution)

- Never present incorrect networking info; grading is deterministic and **local** (no runtime
  external/AI grading).
- Rewards come **only** from a correct answer (`rewards.pickReward` is reachable only on the
  correct branch).
- Questions: exactly 4 options, exactly 1 correct, **shuffled** display order each time.
- The race fully **pauses** during questions; resume restores exact state; the ~30s answer
  countdown is **cosmetic** and never affects scoring.
- Keyboard-operable; runs in-browser with no install; explicit loading/paused/error/empty/result
  states.

## Common commands

```bash
python3 -m http.server 8000   # serve & play at http://localhost:8000
node tools/validate-data.mjs  # validate content invariants
node --test                   # run engine unit tests
```
