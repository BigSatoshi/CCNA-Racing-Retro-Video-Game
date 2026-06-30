// Accessible multiple-choice question overlay (T031). Keyboard-operable; the ~30s countdown
// is cosmetic only (FR-024) — it never auto-submits, auto-fails, or affects scoring.

const LETTERS = ['A', 'B', 'C', 'D'];

// opts: {
//   presentation, topic, index, total,
//   onAnswer(displayIndex) -> { isCorrect, rewardName|null },   // host computes grade + reward
//   onClose(isCorrect)                                          // resume the race
// }
export function showQuestion(root, opts) {
  const { presentation: p, topic, index, total, onAnswer, onClose } = opts;
  let answered = false;
  let timerId = null;

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
    b.innerHTML = `<span class="key">${LETTERS[i]}</span>`;
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
    if (answered) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        finish();
      }
      return;
    }
    const idx = LETTERS.indexOf(e.key.toUpperCase());
    if (idx >= 0) {
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
      : `<b style="color:var(--pink)">Not quite.</b> The answer is <b>${LETTERS[p.correctDisplayIndex]}</b>. No power-up this time.`;
    fb.appendChild(head);
    fb.appendChild(textEl('div', '', p.explanation));
    dialog.appendChild(fb);

    const cont = el('button', 'btn primary');
    cont.type = 'button';
    cont.textContent = 'CONTINUE';
    cont.addEventListener('click', finish);
    dialog.appendChild(cont);
    cont.focus();
  }

  function finish() {
    document.removeEventListener('keydown', onKey);
    clearInterval(timerId);
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
