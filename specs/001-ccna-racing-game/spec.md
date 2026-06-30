# Feature Specification: CCNA Racing Retro Video Game

**Feature Branch**: `001-ccna-racing-game`

**Created**: 2026-07-01

**Status**: Draft

**Input**: User description: "A retro-themed racing game where the player races against opponent cars on a track. Power-up tokens are placed along the track; collecting one pauses the race and presents a CCNA multiple-choice question (4 choices, exactly 1 correct). A correct answer grants a random power-up or weapon to use against opponents; a wrong answer grants nothing. The race resumes from its paused state once the question is resolved."

## Overview

The CCNA Racing Retro Video Game teaches Cisco Certified Network Associate (CCNA)
networking concepts through an arcade-style retro racing game. The player drives against
opponent cars and competes to finish first. The only way to gain a competitive
advantage — a power-up or weapon — is to correctly answer a networking question, so every
advantage on the track is earned through demonstrated knowledge. Knowledge checks happen
while the race is paused, so the player is never asked to recall facts and steer at the
same time. The experience should feel like a fun retro racer that happens to make the
player better at networking.

## Clarifications

### Session 2026-07-01

- Q: What visual perspective should the retro racer use? → A: Top-down 2D (bird's-eye, whole track visible)
- Q: How many opponent (AI) cars in v1? → A: 3 opponents (a four-car field)
- Q: How long is a single race? → A: 3 laps; finishing order by lap completion
- Q: Is there a time limit on answering a question? → A: Generous ~30s countdown for pacing only — no penalty; timing out still lets the player answer and keep any reward
- Q: Which power-up/weapon set should v1 support? → A: Balanced mix of 4 — speed boost and shield (self), oil slick and homing missile (offense)
- Q: What CCNA topic scope for the v1 question pool? → A: All CCNA domains in one mixed pool (subnetting, routing, switching, OSI/TCP-IP, protocols, security fundamentals)
- Q: Do power-up tokens respawn across laps? → A: Yes — a collected token is gone for the rest of that lap and respawns at the start of each new lap, so each token position can be collected at most once per lap
- Q: How is the next question chosen from the pool? → A: The game selects from the mixed pool avoiding immediate repeats; if the pool is exhausted it reuses questions rather than showing a blank/broken overlay

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Race to the finish (Priority: P1)

A player starts a race on a retro track and competes against opponent cars, steering their
car around the course to complete the required laps and finish the race, seeing whether
they placed first.

**Why this priority**: The racing loop is the foundation and the hook. Without a playable
race, no other mechanic has a home. A complete, winnable race is a viable product slice on
its own.

**Independent Test**: Start a race, drive the car around the full track for the required
laps against opponents, cross the finish line, and see a result screen with the player's
finishing position. No power-ups or questions required.

**Acceptance Scenarios**:

1. **Given** the player is on the start screen, **When** they begin a race, **Then** their
   car and at least one opponent car appear on a retro-styled track and the race begins.
2. **Given** the race is in progress, **When** the player uses the controls, **Then** their
   car accelerates, brakes, and steers responsively around the track.
3. **Given** the player and opponents are racing, **When** the player completes the required
   number of laps, **Then** the race ends and a result screen shows the player's finishing
   position relative to the opponents.
4. **Given** the race has ended, **When** the result screen is shown, **Then** the player can
   start a new race or return to the start screen.

---

### User Story 2 - Earn power-ups by answering CCNA questions (Priority: P2)

While racing, the player drives over a power-up token on the track. The race pauses and a
CCNA multiple-choice question appears. The player selects one of four answers. A correct
answer awards a randomly selected power-up or weapon; a wrong answer awards nothing. The
race then resumes exactly where it left off.

**Why this priority**: This is the defining educational mechanic and the reason the game
exists. It depends on the racing loop (P1) being in place but delivers the core learning
value.

**Independent Test**: During a race, drive over a power-up token, confirm the race fully
pauses, answer the presented question, and verify that a correct answer yields a power-up
in the player's inventory while a wrong answer yields none — then confirm the race resumes
from the same state.

**Acceptance Scenarios**:

1. **Given** the player is racing, **When** their car collects a power-up token, **Then** the
   race, timer, opponents, and hazards all pause and a question overlay appears.
2. **Given** the question overlay is shown, **When** it renders, **Then** it presents exactly
   four answer choices with exactly one correct answer, drawn from CCNA topic content.
3. **Given** the question is shown, **When** the player selects the correct answer, **Then**
   they are awarded one randomly selected power-up or weapon and given immediate feedback
   that the answer was correct.
4. **Given** the question is shown, **When** the player selects an incorrect answer, **Then**
   no reward is granted and they are given immediate feedback indicating the correct answer.
5. **Given** the question has been resolved (correct or incorrect), **When** the overlay
   closes, **Then** the race resumes from the exact state it was paused in (positions,
   speeds, lap counts unchanged).
6. **Given** the same question appears again, **When** it is presented, **Then** the order of
   the four answer choices may differ so answer position cannot be memorized.

---

### User Story 3 - Use power-ups and weapons against opponents (Priority: P3)

Having earned power-ups or weapons, the player activates them during the race to gain speed,
defend themselves, or hinder opponent cars, improving their chances of finishing first.

**Why this priority**: This closes the loop between learning and winning, making correct
answers feel rewarding. It depends on both the race (P1) and the earning mechanic (P2).

**Independent Test**: With at least one power-up in inventory, activate it during a race and
observe its effect on the player's car or on opponents, then confirm it is consumed.

**Acceptance Scenarios**:

1. **Given** the player holds at least one power-up or weapon, **When** they activate it,
   **Then** its effect is applied (e.g., speed boost to the player or a hindrance to an
   opponent) and the item is consumed from inventory.
2. **Given** the player holds no power-ups, **When** they attempt to activate one, **Then**
   nothing happens and no error state is shown.
3. **Given** a weapon is used against an opponent, **When** it lands, **Then** the opponent
   car is visibly affected (e.g., slowed or spun) for a bounded duration before recovering.

---

### Edge Cases

- **Token while a question is pending**: The player cannot collect a second token or trigger
  a second question while a question overlay is open.
- **Quitting mid-question**: If the player exits or refreshes during a paused question, the
  race does not award a reward and returns to a safe state (start screen or restart).
- **Empty or exhausted question pool for a topic**: The game still presents a valid question;
  if a topic is exhausted it reuses questions rather than showing a blank or broken overlay.
- **Tie at the finish line**: The result screen resolves and displays a deterministic finishing
  order with no ambiguous "no result" state.
- **Token collected on the final stretch**: Pausing for a question must not skip the player
  past the finish line or desync lap counting on resume.
- **Power-up activated at race end**: Activating an item as the race ends does not corrupt the
  result or carry effects into the result screen.
- **Rapid repeated input**: Mashing the answer or activation controls does not submit multiple
  answers or consume multiple items from a single action.
- **Question countdown expiry**: When the ~30s pacing countdown reaches zero, the overlay stays
  open and the player can still answer; expiry never auto-submits, auto-fails, or grants a reward.

## Requirements *(mandatory)*

### Functional Requirements

#### Racing

- **FR-001**: System MUST present a retro-styled racing track rendered in a top-down (bird's-eye)
  2D view, on which the player's car and the opponent cars race.
- **FR-002**: System MUST let the player control their car (accelerate, brake, steer) via the
  keyboard, with all core interactions keyboard-operable.
- **FR-003**: System MUST run exactly three AI-controlled opponent cars (a four-car field
  including the player) that move around the track and compete for a finishing position.
- **FR-004**: System MUST track laps and determine a finishing order, ending the race when the
  player completes 3 laps; finishing position is determined by lap-completion order.
- **FR-005**: System MUST display a result screen showing the player's finishing position and
  an option to race again or return to the start screen.

#### Knowledge-gated power-ups

- **FR-006**: System MUST place collectible power-up tokens along the track that the player can
  drive over. A collected token MUST be unavailable for the remainder of the current lap and MUST
  respawn at the start of each new lap (each token position is collectible at most once per lap).
- **FR-007**: System MUST, upon a token being collected, pause the race, timer, opponent
  movement, and all hazards before any reward is granted.
- **FR-008**: System MUST present a CCNA-topic multiple-choice question with exactly four
  answer choices and exactly one correct answer whenever a token is collected.
- **FR-009**: System MUST randomize the display order of the four answer choices each time a
  question is presented.
- **FR-010**: System MUST grant exactly one randomly selected power-up or weapon when the
  player answers correctly, and grant nothing when the player answers incorrectly.
- **FR-011**: System MUST give immediate feedback after an answer, confirming correctness and,
  on a wrong answer, indicating the correct answer in a calm, non-scolding tone.
- **FR-012**: System MUST resume the race from the exact paused state (car positions, speeds,
  lap counts, cooldowns) once the question is resolved, granting no advantage or penalty based
  on how long the player took to answer.
- **FR-013**: System MUST prevent a second token collection or question from triggering while a
  question overlay is open.
- **FR-024**: System MUST display a relaxed countdown (approximately 30 seconds) on the question
  overlay for pacing only. The countdown MUST be cosmetic: if it reaches zero, the player MUST
  still be able to select an answer and MUST keep any reward earned by a correct answer — timing
  out MUST NOT count as a wrong answer or apply any penalty.

#### Power-up usage

- **FR-014**: System MUST maintain a per-race inventory of the power-ups and weapons the player
  has earned.
- **FR-015**: Players MUST be able to activate an owned power-up or weapon during the race, with
  its effect applied and the item consumed.
- **FR-016**: System MUST support exactly four power-up/weapon types in v1: a **speed boost** and a
  **shield** (self-affecting), and an **oil slick** and a **homing missile** (opponent-affecting).
  Each effect applies for a bounded duration.

#### Content & integrity

- **FR-017**: System MUST store all question-and-answer content in a separate, editable data
  source rather than embedding it in game logic.
- **FR-018**: Each question record MUST carry a source reference (CCNA topic, RFC, curriculum, or
  authoritative citation) for auditability, whether or not it is shown to the player.
- **FR-019**: System MUST determine answer correctness locally and deterministically, never via a
  runtime external service or generated content.
- **FR-020**: Questions MUST map to genuine CCNA exam topics, drawn for v1 from a single mixed pool
  covering all core domains: subnetting and IP addressing, routing, switching, the OSI/TCP-IP
  models, common protocols, and network security fundamentals.

#### Experience & states

- **FR-021**: System MUST present a consistent retro arcade aesthetic across menus, the track,
  the HUD, and the question overlay.
- **FR-022**: System MUST run in a standard desktop web browser with no install step.
- **FR-023**: System MUST provide explicit, designed presentations for loading, paused (question),
  error, empty-inventory, and post-race states — no blank or undefined states.

### Key Entities

- **Race / Session**: A single playthrough; tracks lap count, the cars in play, the player's
  inventory, and the current state (racing, paused-for-question, ended).
- **Car**: The player's vehicle or an opponent vehicle; has position, speed, lap progress, and
  (for the player) an inventory of earned items.
- **Track**: The course layout, including the placement of power-up tokens and the finish line.
- **Power-up Token**: A collectible point on the track that, when collected, triggers a question.
- **Question**: A CCNA-topic item with prompt text, exactly four answer options, an identified
  correct option, a topic tag, and a source reference.
- **Answer Option**: One of four choices for a question; exactly one is flagged correct.
- **Power-up / Weapon**: One of four v1 reward types — speed boost, shield, oil slick, homing
  missile — each with a defined effect (on the player or opponents) and a bounded duration; held
  in inventory until activated.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new player can start and complete a full race (cross the finish line) within
  2 minutes of opening the game, without instructions.
- **SC-002**: 100% of presented questions display exactly four choices with exactly one correct
  answer.
- **SC-003**: In 100% of cases, collecting a power-up token fully pauses the race before a
  question is shown, and resuming restores the prior race state with no measurable position or
  lap drift.
- **SC-004**: A correct answer grants a power-up in 100% of cases; an incorrect answer grants a
  power-up in 0% of cases.
- **SC-005**: Across repeated presentations of the same question, the correct answer appears in
  at least three of the four possible positions over the course of normal play (order is
  genuinely randomized, not fixed).
- **SC-006**: At least 90% of first-time players report the controls felt responsive and the
  game looked and felt "retro" in informal playtesting.
- **SC-007**: 100% of question content entries carry a valid source reference when audited.
- **SC-008**: The game loads and becomes playable in a standard desktop browser with no install,
  in under 10 seconds on a typical broadband connection.

## Assumptions

- **Single-player vs. AI**: Version 1 is single-player against three AI-controlled opponent cars
  (a four-car field); no online or local human-vs-human multiplayer.
- **Win condition**: A race is 3 laps and finishing position is determined by lap-completion
  order. (Lap count may be made configurable later but is fixed at 3 for v1.)
- **Token consumption**: A collected token is consumed whether the player answers correctly or
  not, so it does not re-trigger a question on the same pass. Tokens respawn at the start of each
  new lap, giving a 3-lap race multiple learning moments per token position.
- **Inventory scope**: Earned power-ups persist only for the duration of the current race; they
  do not carry across races in v1.
- **Question selection**: Questions are drawn from the local content set as a single mixed pool
  spanning all core CCNA domains; topic/difficulty tagging is retained to support balanced
  selection and future level design.
- **Platform**: Top-down 2D presentation in a standard desktop web browser with keyboard input is
  the primary target; touch/mobile and gamepad support are out of scope for v1.
- **Accounts**: No login, accounts, or server-side persistence are required for v1.
