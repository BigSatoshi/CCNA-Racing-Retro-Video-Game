// Start + result screen helpers (T019). DOM only.

export function carLabel(id) {
  return id === 'player' ? 'YOU' : 'CPU ' + id.replace('cpu-', '');
}

export function renderResult({ title, detail, order, playerId }) {
  document.getElementById('result-title').textContent = title;
  document.getElementById('result-detail').textContent = detail;
  const ol = document.getElementById('result-order');
  ol.innerHTML = '';
  order.forEach((id, i) => {
    const li = document.createElement('li');
    li.textContent = `${i + 1}. ${carLabel(id)}`;
    if (id === playerId) li.className = 'you';
    ol.appendChild(li);
  });
}

export function showBestLap(ms) {
  const el = document.getElementById('best-lap');
  el.textContent = ms ? `Best lap: ${(ms / 1000).toFixed(2)}s` : '';
}
