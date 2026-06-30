// Random reward selection (T028). PURE given rng. Reachable ONLY after a correct answer
// (Principle II — Learning-Gated Rewards). There is intentionally no consolation path.

export function pickReward(powerups, rng) {
  if (!Array.isArray(powerups) || powerups.length === 0) {
    throw new Error('pickReward requires a non-empty powerup pool');
  }
  return rng.pick(powerups).id;
}
