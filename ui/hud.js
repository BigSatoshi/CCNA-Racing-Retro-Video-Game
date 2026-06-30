// HUD (T018, T033, T039): lap, position, time, current item, active effects. DOM only.

const $ = (id) => document.getElementById(id);

export function updateHud({ lap, laps, pos, total, timeMs, item, effects }) {
  $('hud-lap').textContent = `${Math.min(lap + 1, laps)}/${laps}`;
  $('hud-pos').textContent = `${pos}/${total}`;
  $('hud-time').textContent = (timeMs / 1000).toFixed(1);
  $('hud-inv').textContent = item || '—';
  $('hud-effects').textContent = effects || '';
}
