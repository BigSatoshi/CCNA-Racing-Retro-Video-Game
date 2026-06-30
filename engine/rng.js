// Seedable, snapshot-able PRNG (T005, research D6).
// Mulberry32 — fast, deterministic, and its entire state is a single uint32,
// so getState()/setState() make pause/resume and tests fully reproducible.

export function createRng(seed) {
  let state = (seed >>> 0) || ((Math.random() * 2 ** 32) >>> 0);

  function next() {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  return {
    /** float in [0, 1) */
    next,
    /** integer in [0, maxExclusive) */
    int(maxExclusive) {
      return Math.floor(next() * maxExclusive);
    },
    /** pick a random element from a non-empty array */
    pick(arr) {
      return arr[this.int(arr.length)];
    },
    /** snapshot for pause/resume + tests */
    getState() {
      return state >>> 0;
    },
    setState(s) {
      state = s >>> 0;
    },
  };
}
