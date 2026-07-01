// Accessible multiple-choice question overlay (T031). Keyboard-operable; the ~30s countdown
// is cosmetic only (FR-024) — it never auto-submits, auto-fails, or affects scoring.

// opts: {
//   presentation, topic, index, total,
//   onAnswer(displayIndex) -> { isCorrect, rewardName|null },   // host computes grade + reward
//   onClose(isCorrect)                                          // resume the race
// }
const RESUME_DELAY_S = 3; // auto-resume the race this long after an answer (no keypress needed)

export function showQuestion(root, opts) {
  const { presentation: p, topic, index, total, onAnswer, onClose } = opts;
  let answered = false;
  let done = false;
  let timerId = null;
  let resumeId = null;

  root.innerHTML = '';

  const backdrop = el('div', 'q-backdrop');
  const dialog = el('div', 'q-dialog');
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');
  dialog.setAttribute('aria-label', 'CCNA question');

  const top = el('div', 'q-top');
  top.append(textEl('span', 'q-topic', topic || 'CCNA'), textEl('span', 'q-count', `Q ${index}/${total}`));

  const timer = textEl('div', 'q-timer', '');
  const prompt = textEl('div', 'q-prompt', p.prompt);

  const optionsWrap = el('div', 'q-options');
  const buttons = p.displayOptions.map((opt, i) => {
    const b = el('button', 'q-opt');
    b.type = 'button';
    b.innerHTML = `<span class="key">${i + 1})</span>`;
    b.append(document.createTextNode(opt));
    b.addEventListener('click', () => choose(i));
    optionsWrap.appendChild(b);
    return b;
  });

  dialog.append(top, prompt, optionsWrap, timer);
  backdrop.appendChild(dialog);
  root.appendChild(backdrop);
  buttons[0].focus();

  // Cosmetic countdown.
  let remaining = Math.round((p.countdownMs ?? 30000) / 1000);
  const renderTimer = () => {
    timer.textContent = remaining > 0 ? `Take your time — ${remaining}s` : "Time's up — answer when ready";
  };
  renderTimer();
  timerId = setInterval(() => {
    if (remaining > 0) remaining -= 1;
    renderTimer();
  }, 1000);

  function onKey(e) {
    // Once answered, swallow keys so a stray Enter/Space can't bleed into the
    // race (which auto-resumes on its own after a short delay).
    if (answered) {
      if (e.key === 'Enter' || e.key === ' ') e.preventDefault();
      return;
    }
    // Accept the number keys (1–4).
    const idx = /^[1-4]$/.test(e.key) ? Number(e.key) - 1 : -1;
    if (idx >= 0 && idx < buttons.length) {
      e.preventDefault();
      choose(idx);
    }
  }
  document.addEventListener('keydown', onKey);

  function choose(i) {
    if (answered) return;
    answered = true;
    clearInterval(timerId);
    const { isCorrect, rewardName } = onAnswer(i);

    buttons.forEach((b, bi) => {
      b.disabled = true;
      if (bi === p.correctDisplayIndex) b.classList.add('correct');
      else if (bi === i) b.classList.add('wrong');
    });

    const fb = el('div', 'q-feedback ' + (isCorrect ? 'good' : 'bad'));
    const head = el('div');
    head.innerHTML = isCorrect
      ? `<b style="color:var(--green)">Correct!</b> ${rewardName ? `You earned <span class="q-reward">${rewardName}</span>.` : ''}`
      : `<b style="color:var(--pink)">Not quite.</b> The answer is <b>${p.correctDisplayIndex + 1})</b>. No power-up this time.`;
    fb.appendChild(head);
    fb.appendChild(textEl('div', '', p.explanation));
    dialog.appendChild(fb);

    // Auto-resume after a short delay so the player doesn't have to press a key
    // (a stray Enter/Space used to leak into the race). Purely cosmetic — the
    // race stays fully paused until finish() runs.
    const resumeNote = textEl('div', 'q-resume', '');
    dialog.appendChild(resumeNote);
    let left = RESUME_DELAY_S;
    const renderResume = () => {
      resumeNote.textContent = `Resuming in ${left}…`;
    };
    renderResume();
    resumeId = setInterval(() => {
      left -= 1;
      if (left <= 0) {
        finish();
        return;
      }
      renderResume();
    }, 1000);
  }

  function finish() {
    if (done) return;
    done = true;
    document.removeEventListener('keydown', onKey);
    clearInterval(timerId);
    clearInterval(resumeId);
    const wasCorrect = root.querySelector('.q-feedback.good') !== null;
    root.innerHTML = '';
    onClose(wasCorrect);
  }
}

function el(tag, cls) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  return e;
}
function textEl(tag, cls, text) {
  const e = el(tag, cls);
  e.textContent = text;
  return e;
}
