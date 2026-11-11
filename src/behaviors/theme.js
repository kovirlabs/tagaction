// A light/dark switch, remembered across visits. It sets data-theme on <html>,
// which TagBrush.css (and any stylesheet keyed on it) follows.
// - <select data-tag-theme aria-label="Color scheme"><option value="">Auto</option>
//   <option value="light">Light</option><option value="dark">Dark</option></select>
//   An empty value follows the system setting.
// - <button data-tag-theme>Dark mode</button> switches between light and dark,
//   starting from whatever the page shows now, with aria-pressed when dark.
// The control only works with JavaScript, so it can carry `hidden`; TagAction
// shows it. The saved choice is applied as soon as TagAction loads.

import { each, find, once, reveal, store } from '../core.js';

const KEY = 'tagaction:theme';

function apply(theme) {
  if (theme === 'light' || theme === 'dark') document.documentElement.dataset.theme = theme;
  else delete document.documentElement.dataset.theme;
  for (const control of find(document, '[data-tag-theme]')) sync(control);
}

function current() {
  const set = document.documentElement.dataset.theme;
  if (set === 'light' || set === 'dark') return set;
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function sync(control) {
  if (control.matches('select')) control.value = document.documentElement.dataset.theme ?? '';
  else control.setAttribute('aria-pressed', String(current() === 'dark'));
}

function choose(theme) {
  store.set(KEY, theme);
  apply(theme);
}

export function init(root) {
  if (once(document, 'theme')) {
    const saved = store.get(KEY);
    if (saved !== null) apply(saved);
  }
  each(root, 'select[data-tag-theme], button[data-tag-theme]', 'theme', (control) => {
    reveal(control);
    sync(control);
    if (control.matches('select')) control.addEventListener('change', () => choose(control.value));
    else control.addEventListener('click', () => choose(current() === 'dark' ? 'light' : 'dark'));
  });
}
