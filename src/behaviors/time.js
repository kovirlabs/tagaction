// <time datetime="…">:
// - A datetime with a time and a timezone (2026-11-06T17:00Z, …+01:00) is
//   shown in the reader's own timezone and language.
// - data-tag-time="relative" shows it as "3 hours ago" / "in 2 days",
//   kept up to date. The full date is in the title either way.

import { each, find, once } from '../core.js';

const ZONED = /T\d\d:\d\d.*(Z|[+-]\d\d:?\d\d)$/i;
const UNITS = [['year', 31536e6], ['month', 2592e6], ['week', 6048e5], ['day', 864e5], ['hour', 36e5], ['minute', 6e4], ['second', 1e3]];

export function relative(date, now = Date.now()) {
  const difference = date - now;
  const [unit, size] = UNITS.find(([, ms]) => Math.abs(difference) >= ms) ?? UNITS[UNITS.length - 1];
  return new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' }).format(Math.round(difference / size), unit);
}

function render(time) {
  const value = time.getAttribute('datetime').trim();
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return;
  const relativeMode = time.dataset.tagTime === 'relative';
  if (!relativeMode && !ZONED.test(value)) return; // a date or a local time: nothing to convert
  const full = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: ZONED.test(value) ? 'short' : undefined }).format(date);
  time.textContent = relativeMode ? relative(date) : full;
  if (!time.title) time.title = full;
}

export function init(root) {
  each(root, 'time[datetime]', 'time', render);
  if (find(document, 'time[data-tag-time="relative"]').length && once(document, 'time-tick')) {
    setInterval(() => find(document, 'time[datetime][data-tag-time="relative"]').forEach(render), 60000);
  }
}
