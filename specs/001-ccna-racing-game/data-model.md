# Phase 1 Data Model: CCNA Racing Retro Video Game

Two kinds of data: **content** (static, authored, lives in `/data/*.json`, validated against
`/contracts/*.schema.json`) and **runtime state** (in-memory, owned by `engine/state.js` and
`engine/race.js`). Field names are camelCase to match the JS engine.

---

## Content entities (static JSON)

### Question  → `data/questions.json` (array)

| Field | Type | Rules |
|-------|------|-------|
| `id` | string | Unique across the file (e.g., `"subnet-001"`). |
| `topic` | string (enum) | One of: `subnetting`, `routing`, `switching`, `osi-tcpip`, `protocols`, `security`. |
| `difficulty` | string (enum) | `easy` \| `medium` \| `hard`. Retained for future tiering; v1 uses a mixed pool. |
| `prompt` | string | The question text. Non-empty. |
| `options` | string[] | **Exactly 4** entries, all non-empty, no duplicates within the question. |
| `correctIndex` | integer | `0..3`; identifies the correct entry in `options` (authoring order). |
| `explanation` | string | Shown as feedback after answering; explains why the correct answer is correct. |
| `source` | string | Non-empty citation (CCNA topic ref, RFC, curriculum, or URL). Auditable (FR-018). |

**Invariants (enforced by `tools/validate-data.mjs`)**: `options.length === 4`;
`0 <= correctIndex <= 3`; option texts unique within a question; `source` non-empty; `id` unique.

> Correctness is stored as an authoring-order index. `quiz.js` shuffles display order at
> presentation time and maps `correctIndex` to the shuffled slot, so answer position is never
> fixed (FR-009, SC-005).

### PowerUpDefinition  → `data/powerups.json` (array of 4)

| Field | Type | Rules |
|-------|------|-------|
| `id` | string (enum) | `speed_boost` \| `shield` \| `oil_slick` \| `homing_missile`. Exactly these 4. |
| `name` | string | Display name (e.g., "Speed Boost"). |
| `kind` | string (enum) | `self` (speed_boost, shield) \| `offense` (oil_slick, homing_missile). |
| `durationMs` | integer | > 0. How long the effect lasts once active. |
| `params` | object | Effect tuning (e.g., `{ "speedMultiplier": 1.4 }`, `{ "spinMs": 1200 }`). |
| `icon` | string | Sprite/asset key for the HUD. |

### Track  → `data/track.json` (single object)

| Field | Type | Rules |
|-------|------|-------|
| `id` | string | Track identifier. |
| `name` | string | Display name. |
| `lapsToWin` | integer | `3` for v1. |
| `path` | Point[] | Ordered centerline polygon defining the loop. ≥ 3 points. |
| `width` | number | Track width in world units. |
| `startLine` | Segment | `{ a: Point, b: Point }`; also the finish line. |
| `checkpoints` | Segment[] | Ordered gates used for lap validation and anti-cut detection. |
| `startGrid` | Point[] | ≥ 4 start positions (player + 3 opponents). |
| `tokenSpawns` | Point[] | Power-up token positions along the track. |
| `aiWaypoints` | Point[] | Racing line for opponent AI (D7). |

`Point = { x: number, y: number }`. `Segment = { a: Point, b: Point }`.

---

## Runtime entities (in-memory)

### Session / GameState  (`engine/state.js`)

| Field | Type | Notes |
|-------|------|-------|
| `screen` | enum | `loading` \| `start` \| `racing` \| `paused-question` \| `result` \| `error`. Drives FR-023 states. |
| `track` | Track | Loaded content. |
| `cars` | Car[] | Index 0 = player; 1..3 = opponents. |
| `questionPool` | Question[] | Loaded + validated questions. |
| `powerups` | PowerUpDefinition[] | The 4 loaded items. |
| `activeQuestion` | QuestionPresentation \| null | Set while `screen === 'paused-question'`. |
| `rng` | PRNG state | Seedable; snapshotted on pause (D5/D6). |
| `result` | RaceResult \| null | Set when `screen === 'result'`. |

### Car  (`engine/race.js`)

| Field | Type | Notes |
|-------|------|-------|
| `id` | string | `player` \| `cpu-1..3`. |
| `isPlayer` | boolean | |
| `pos` | Point | World position. |
| `heading` | number | Radians. |
| `velocity` | Point | Current velocity vector. |
| `lap` | integer | Completed laps (0..`lapsToWin`). |
| `nextCheckpoint` | integer | Index into `track.checkpoints` for valid lap counting. |
| `finished` | boolean | Crossed finish after final lap. |
| `finishRank` | integer \| null | 1..4 once finished. |
| `inventory` | string[] | Player only: owned power-up ids (per-race; FR-014). |
| `activeEffects` | ActiveEffect[] | Timed effects currently applied to this car. |

`ActiveEffect = { sourceId: string, expiresAt: number, ...params }`.

### QuestionPresentation  (`engine/quiz.js` output)

| Field | Type | Notes |
|-------|------|-------|
| `questionId` | string | |
| `prompt` | string | |
| `displayOptions` | string[] | The 4 options in **shuffled** display order. |
| `correctDisplayIndex` | integer | Where the correct option landed after shuffle (kept out of the DOM until answered). |
| `explanation` | string | Revealed as feedback. |
| `countdownMs` | integer | ~30000; cosmetic only (FR-024). |

### RaceResult

| Field | Type | Notes |
|-------|------|-------|
| `playerRank` | integer | 1..4. |
| `order` | string[] | Car ids in finishing order (deterministic; no ties — edge case). |
| `bestLapMs` | number | Optional; may persist to `localStorage`. |

---

## State transitions

### Screen / session flow

```text
loading ──data loaded──▶ start ──begin race──▶ racing
  │ (load error)                                   │
  └──────────────▶ error                           │ collect token
                                                    ▼
                                          paused-question
                                                    │ answer submitted (or overlay dismissed)
                                                    ▼
                                          racing (resume exact snapshot)
racing ──player completes lap 3 & crosses finish──▶ result ──race again──▶ racing
                                                       └──menu──▶ start
```

Guard: while `screen === 'paused-question'`, token collection and new-question triggers are
ignored (FR-013).

### Answer resolution (the integrity-critical path)

```text
selectOption(displayIndex)
  └─ quiz.grade(presentation, displayIndex) ──▶ isCorrect: boolean   (PURE, tested)
        ├─ true  → rewards.pickReward(powerups, rng) ──▶ add to player.inventory (FR-010)
        │          show "correct" feedback + explanation
        └─ false → no reward (FR-010); show "incorrect" + correct answer + explanation (FR-011)
  └─ resume race from snapshot (FR-012)
```

`rewards.pickReward` is **only** reachable from the `true` branch — structurally enforcing
Principle II (Learning-Gated Rewards).

### Car lap lifecycle

```text
nextCheckpoint advances only when the car crosses checkpoints in order →
crossing startLine with nextCheckpoint wrapped == lap complete → lap++ →
lap === lapsToWin → finished = true, assign finishRank by completion order.
```

Ordered-checkpoint validation prevents counting a lap when a token-pause near the finish line
resumes mid-segment (spec edge case: "token collected on the final stretch").
