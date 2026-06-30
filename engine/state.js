// Central session/game state (T006). Plain data + a few helpers; no DOM/Canvas.

export const Screen = Object.freeze({
  LOADING: 'loading',
  START: 'start',
  RACING: 'racing',
  PAUSED_QUESTION: 'paused-question',
  RESULT: 'result',
  ERROR: 'error',
});

export function createState() {
  return {
    screen: Screen.LOADING,
    track: null,
    questionPool: [],
    powerups: [],
    cars: [],
    activeQuestion: null, // QuestionPresentation while paused
    pendingToken: null, // token index that triggered the current question
    pauseSnapshot: null, // race snapshot captured on pause
    recentQuestionIds: [], // for selectNext() no-immediate-repeat
    rng: null,
    raceTimeMs: 0,
    result: null, // RaceResult
    errorMessage: null,
    bestLapMs: null,
  };
}

export function player(state) {
  return state.cars.find((c) => c.isPlayer) || null;
}
