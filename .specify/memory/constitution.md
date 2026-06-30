<!--
SYNC IMPACT REPORT
==================
Version change: (uninitialized template) → 1.0.0
Rationale: Initial ratification of the project constitution. MAJOR baseline
  established from the project's root CONSTITUTION.md philosophy and the
  user-described CCNA Racing game mechanics.

Modified principles: N/A (initial adoption)
Added sections:
  - Core Principles (5): Educational Integrity First; Learning-Gated Rewards;
    Fair Multiple-Choice Question Design; Pause-to-Learn; Retro Feel & Accessibility
  - Content & Data Standards
  - Development Workflow & Quality Gates
  - Governance
Removed sections: N/A

Templates requiring updates:
  - .specify/templates/plan-template.md ✅ no change needed (reads constitution generically via Constitution Check gate)
  - .specify/templates/spec-template.md ✅ no change needed (generic placeholders)
  - .specify/templates/tasks-template.md ✅ no change needed (no principle references)
  - .specify/templates/checklist-template.md ✅ no change needed (no principle references)

Notes:
  - The root CONSTITUTION.md preferred "recall over recognition" and discouraged pure
    multiple choice. The user has explicitly chosen 4-option single-answer multiple
    choice as the power-up gate. Principle III adapts that constraint with anti-guessing
    safeguards (randomized order, plausible distractors, source-backed answers) so the
    spirit of educational integrity is preserved within the chosen mechanic.

Follow-up TODOs: None.
-->

# CCNA Racing Retro Video Game Constitution

## Core Principles

### I. Educational Integrity First (NON-NEGOTIABLE)

The game is a teacher before it is entertainment. It MUST never present incorrect
networking information, even under time pressure or to be "more fun."

- Every question MUST have exactly one objectively correct answer and three
  objectively incorrect answers. No fuzzy grading, no partial credit, no ambiguity
  that could reinforce a misconception.
- Answer correctness MUST be evaluated deterministically against authored data — the
  same answer always yields the same verdict.
- Question content MUST be technically accurate against authoritative CCNA sources.
  When correctness is uncertain, the question is excluded, not guessed.

Rationale: A player who internalizes a wrong fact from a game is worse off than one
who never played. Accuracy is the product; the racing is the delivery vehicle.

### II. Learning-Gated Rewards

Power-ups and weapons are earned through demonstrated knowledge, never gifted.

- Collecting a power-up token on the track MUST trigger a CCNA question before any
  reward is granted.
- A correct answer grants a randomly selected power-up or weapon. An incorrect answer
  grants nothing — there is no consolation reward and no "try again to lower the bar."
- No mechanic may bypass the question gate to obtain a reward.

Rationale: Tying every competitive advantage to a correct answer makes learning the
literal path to winning, aligning the player's incentive with the educational goal.

### III. Fair Multiple-Choice Question Design

The question gate uses multiple choice, and that format MUST be implemented to test
knowledge rather than reward guessing or pattern-matching.

- Every question MUST present exactly 4 choices with exactly 1 correct answer.
- Answer-option order MUST be randomized per presentation so position cannot be memorized.
- Distractors MUST be plausible and topically relevant (common misconceptions or
  related-but-wrong concepts), never obvious throwaways.
- Questions MUST map to genuine CCNA exam topics (e.g., subnetting, routing, switching,
  protocols, the OSI/TCP-IP models, network services and security fundamentals).
- Question and answer data MUST live in a separate, editable data file — never hardcoded
  inside game or race logic.

Rationale: Multiple choice is the chosen mechanic for fast, pause-friendly play;
these safeguards keep it from inflating confidence through recognition or luck.

### IV. Pause-to-Learn

Knowledge checks are never raced against the clock.

- Entering the question-and-answer interaction MUST pause the race, the timer, all
  opponent movement, and all hazards until the player answers or dismisses the question.
- Resuming the race MUST restore exact prior state (positions, speeds, cooldowns) with
  no advantage or penalty derived from how long the player spent thinking.
- Racing reflexes belong to the race; recall belongs to the paused quiz. The two MUST
  NOT be blended such that answering speed affects answer correctness scoring.

Rationale: Forcing players to answer while steering would test reflexes, not networking
knowledge, and would push players to guess — violating Principles I and III.

### V. Retro Feel & Accessibility

The game MUST deliver a cohesive retro racing experience that anyone can play.

- The visual and audio style MUST be consistently retro (pixel/arcade aesthetic) across
  menus, track, HUD, and the question overlay.
- The game MUST run in a standard desktop web browser with no install step.
- All core interactions — racing, collecting power-ups, and answering questions — MUST
  be fully keyboard operable.
- Loading, error, empty, paused, and post-race states MUST each have an explicit,
  designed presentation. No undefined or blank states.

Rationale: A retro racer is the hook that makes the learning enjoyable; accessibility
ensures the educational value reaches the widest audience.

## Content & Data Standards

- All Q&A content lives in a versioned, human-editable data file (JSON or JS module),
  separate from game logic. Adding or revising questions means editing data, not code.
- Each question record MUST include a `source` field (CCNA topic reference, RFC number,
  vendor/curriculum citation, or authoritative URL) for auditability, even if the source
  is not displayed to the player.
- Power-up and weapon definitions are likewise data-driven so the reward pool can be
  tuned without code changes.
- No external quiz APIs, runtime AI-generated questions, or network-fetched content may
  determine answer correctness. Ground truth is local and audited.
- Questions SHOULD be tagged by CCNA topic and difficulty to support balanced selection
  and future level design.

## Development Workflow & Quality Gates

- Every feature begins as a spec (`/speckit-specify`) and plan (`/speckit-plan`); the
  Constitution Check gate in the plan MUST pass before implementation.
- Changes touching question data MUST be reviewed for technical accuracy and for the
  exactly-4-choices / exactly-1-correct invariant before merge.
- Automated checks SHOULD validate the question data shape: 4 options, one and only one
  flagged correct, non-empty `source`, and no duplicate option text within a question.
- The pause-on-question behavior (Principle IV) and the reward-only-on-correct behavior
  (Principle II) MUST each have at least one test or documented manual verification step.
- Player-facing copy is plain and calm. Wrong answers are learning moments, never
  scolding.

## Governance

This constitution supersedes other practices and conventions for this project. When a
proposed change conflicts with a principle, the principle wins unless the constitution
is formally amended.

- Amendments MUST be proposed as a documented change, reviewed, and recorded with a
  version bump and date in this file.
- Versioning follows semantic versioning: MAJOR for backward-incompatible principle
  removals or redefinitions; MINOR for newly added principles or materially expanded
  guidance; PATCH for clarifications and wording fixes.
- All plans, reviews, and merges MUST verify compliance with the Core Principles.
  Complexity or deviation MUST be justified in the plan's Complexity Tracking section.
- The non-negotiable status of Principle I may only be removed by a MAJOR amendment with
  explicit written justification.

**Version**: 1.0.0 | **Ratified**: 2026-07-01 | **Last Amended**: 2026-07-01
