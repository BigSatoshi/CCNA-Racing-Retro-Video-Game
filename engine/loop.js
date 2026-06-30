// Fixed-timestep, pause-aware game loop (T009). Browser-only (rAF), no game rules here.

export function createLoop({ update, render, stepMs = 1000 / 60 }) {
  let rafId = null;
  let running = false;
  let last = 0;
  let acc = 0;

  function frame(now) {
    if (!running) return;
    if (!last) last = now;
    let delta = now - last;
    last = now;
    if (delta > 250) delta = 250; // clamp after tab-switch / long pause
    acc += delta;
    while (acc >= stepMs) {
      update(stepMs);
      acc -= stepMs;
    }
    render(now);
    rafId = requestAnimationFrame(frame);
  }

  return {
    start() {
      if (running) return;
      running = true;
      last = 0;
      acc = 0;
      rafId = requestAnimationFrame(frame);
    },
    stop() {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null;
    },
    get running() {
      return running;
    },
  };
}
