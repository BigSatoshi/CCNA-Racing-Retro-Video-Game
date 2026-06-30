// Question selection, presentation (shuffle), and grading (T027). PURE — the only place an
// answer is judged correct (Principle I). No DOM, no network (FR-019).

// Pick the next question from the pool, avoiding immediate repeats; reuse when exhausted.
export function selectNext(pool, rng, recentIds = []) {
  const fresh = pool.filter((q) => !recentIds.includes(q.id));
  const choices = fresh.length ? fresh : pool;
  return rng.pick(choices);
}

// Shuffle the 4 options each presentation so answer position can't be memorized (FR-009).
export function present(question, rng) {
  const order = [0, 1, 2, 3];
  for (let i = order.length - 1; i > 0; i--) {
    const j = rng.int(i + 1);
    [order[i], order[j]] = [order[j], order[i]];
  }
  return {
    questionId: question.id,
    prompt: question.prompt,
    displayOptions: order.map((i) => question.options[i]),
    correctDisplayIndex: order.indexOf(question.correctIndex),
    explanation: question.explanation,
    countdownMs: 30000, // cosmetic only (FR-024)
  };
}

// True iff the selected display slot is the correct one. Deterministic, no side effects.
export function grade(presentation, selectedDisplayIndex) {
  return selectedDisplayIndex === presentation.correctDisplayIndex;
}
