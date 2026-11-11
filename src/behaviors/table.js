// <table>:
// - Sorting: every table with a <thead> and rows in <tbody> gets a button in
//   each header cell. Clicking sorts ascending, then descending, and sets
//   aria-sort. Numbers sort as numbers; <data value>, <time datetime>, and
//   <meter>/<progress> values in a cell are used as its sort key.
//   Under data-tag-remember (on the table or a container), a table with an
//   id keeps its sort order across visits.
// - Filtering: <input type="search" aria-controls="table-id"> hides rows that
//   don't contain every typed word. It also filters the <li>s of a list. A
//   list written with `hidden` shows only while there's a search (results).
//   A role="status" line after the table or list says "No matches for …"
//   when nothing matches, and otherwise tells screen readers how many rows
//   are shown ("3 of 12 shown") while staying out of sight.
//   Matching words are highlighted with the CSS Custom Highlight API
//   (::highlight(tagaction-match)), without changing the page's HTML.
//   A filter box with a name starts from ?name=… in the address and keeps
//   it up to date (history.replaceState), so a filtered view survives a
//   reload and can be shared.
// - Number columns: a column whose body cells all hold numbers (or a <data
//   value> number) gets data-tag="num" on its header and cells, and the
//   injected styles line it up on the right in tabular figures. An align
//   attribute or the page's own text-align wins.

import { each, h, reveal, store } from '../core.js';

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
const NUMBER = /^[^\d\s-]{0,3}\s*[-−]?\d[\d,\s]*(\.\d+)?\s*[%a-zA-Z]{0,3}$/;

function sortKey(cell) {
  if (!cell) return '';
  const valued = cell.querySelector('data[value], time[datetime], meter, progress');
  if (valued) return valued.getAttribute('value') ?? valued.getAttribute('datetime') ?? '';
  return cell.textContent.trim();
}

// Stricter than the sort's test: only a sign and a currency sign may lead,
// not a letter or a "#" ("Q1", "Mar 2", "#1042" are labels). "−$5.00",
// "-$5.00", "$-5", and an accounting "($5.00)" are numbers.
const ALIGNED = /^(?:[-−+]?\p{Sc}?\s*[-−+]?\d[\d,\s]*(\.\d+)?\s*[%a-zA-Z]{0,3}|\(\p{Sc}?\s*\d[\d,\s]*(\.\d+)?\))$/u;
const isNumber = (cell) => {
  if (cell.querySelector('time, meter, progress')) return false;
  const data = cell.querySelector('data[value]');
  return ALIGNED.test(data ? data.getAttribute('value') : cell.textContent.trim());
};

// Mark the columns where every non-empty body cell is a number. A column
// once marked stays marked, and rows added later (a --clone row, an htmx
// swap) get the mark in it whatever they hold. Rows with a colspan are skipped.
function markNumbers(table) {
  const headerRow = table.tHead?.rows[table.tHead.rows.length - 1];
  if (!headerRow) return;
  const rows = [...table.tBodies].flatMap((body) => [...body.rows]).filter((row) => ![...row.cells].some((cell) => cell.colSpan > 1));
  if (!rows.length) return;
  [...headerRow.cells].forEach((th, index) => {
    if (th.colSpan > 1) return;
    const cells = rows.map((row) => row.cells[index]).filter((cell) => cell && cell.textContent.trim());
    if (th.dataset.tag !== 'num' && (!cells.length || !cells.every(isNumber))) return;
    for (const cell of [th, ...cells]) if (!cell.dataset.tag) cell.dataset.tag = 'num';
  });
}

// Every row added (at load or later) asks for its table to be checked once,
// after the current batch of additions.
const pending = new Set();
function schedule(table) {
  if (!pending.size) queueMicrotask(() => { for (const t of pending) markNumbers(t); pending.clear(); });
  pending.add(table);
}

function compare(a, b) {
  if (NUMBER.test(a) && NUMBER.test(b)) {
    const number = (text) => parseFloat(text.replace(/[^\d.−-]/g, '').replace('−', '-'));
    return number(a) - number(b);
  }
  if (a === '' || b === '') return a === '' ? (b === '' ? 0 : 1) : -1; // empty cells last
  return collator.compare(a, b);
}

const sortKeyFor = (table) => `tagaction:sort:${location.pathname}#${table.id}`;
const remembered = (table) => table.id && table.closest('[data-tag-remember]');

function sort(table, header, order) {
  const descending = order ? order === 'descending' : header.getAttribute('aria-sort') === 'ascending';
  if (remembered(table)) store.set(sortKeyFor(table), `${header.cellIndex} ${descending ? 'descending' : 'ascending'}`);
  for (const th of header.parentElement.children) th.removeAttribute('aria-sort');
  header.setAttribute('aria-sort', descending ? 'descending' : 'ascending');
  const index = header.cellIndex;
  for (const body of table.tBodies) {
    const rows = [...body.rows];
    rows.sort((a, b) => compare(sortKey(a.cells[index]), sortKey(b.cells[index])) * (descending ? -1 : 1));
    body.append(...rows);
  }
}

const results = new WeakSet(); // lists written hidden: shown only while there's a search
const statuses = new WeakMap(); // target -> its role="status" line
const timers = new WeakMap(); // status line -> its pending count update

function statusFor(target) {
  let status = statuses.get(target);
  if (!status) {
    status = h('p', { role: 'status', 'data-tag': 'filter-status' });
    target.after(status);
    statuses.set(target, status);
  }
  return status;
}

// Highlighted ranges per filtered element, joined into one named highlight.
const matches = new Map();
function highlight(target, items, words) {
  if (!globalThis.CSS?.highlights || typeof Highlight === 'undefined') return;
  const ranges = [];
  for (const item of items) {
    if (item.hidden || !words.length) continue;
    const walker = document.createTreeWalker(item, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const text = node.data.toLowerCase();
      for (const word of words) {
        for (let at = text.indexOf(word); at !== -1; at = text.indexOf(word, at + word.length)) {
          const range = new Range();
          range.setStart(node, at);
          range.setEnd(node, at + word.length);
          ranges.push(range);
        }
      }
    }
  }
  matches.set(target, ranges);
  for (const element of matches.keys()) if (!element.isConnected) matches.delete(element);
  const all = [...matches.values()].flat();
  if (all.length) CSS.highlights.set('tagaction-match', new Highlight(...all));
  else CSS.highlights.delete('tagaction-match');
}

function filter(control, target) {
  const words = control.value.toLowerCase().split(/\s+/).filter(Boolean);
  if (results.has(target)) target.hidden = !words.length;
  const items = target.tBodies ? [...target.tBodies].flatMap((body) => [...body.rows]) : [...target.children].filter((child) => child.matches('li'));
  let shown = 0;
  for (const item of items) {
    const text = item.textContent.toLowerCase();
    item.hidden = !words.every((word) => text.includes(word));
    if (!item.hidden) shown++;
  }
  highlight(target, items, words);
  // "No matches" shows at once; the count for screen readers waits for a
  // pause in typing, so it isn't announced on every keystroke.
  const status = statusFor(target);
  const none = words.length > 0 && shown === 0;
  clearTimeout(timers.get(status));
  status.toggleAttribute('data-tag-empty', none);
  if (!words.length || none) status.textContent = none ? `No matches for “${control.value.trim()}”` : '';
  else timers.set(status, setTimeout(() => { status.textContent = `${shown} of ${items.length} shown`; }, 400));
}

export function init(root) {
  each(root, 'table', 'table', (table) => {
    const headerRow = table.tHead?.rows[table.tHead.rows.length - 1];
    if (!headerRow) return;
    if (![...table.tBodies].some((body) => body.rows.length > 1)) return;
    for (const th of headerRow.cells) {
      if (th.tagName !== 'TH' || th.colSpan > 1 || th.dataset.tagaction === 'off' || !th.textContent.trim() || th.querySelector('input, button, select, a')) continue;
      const button = h('button', { type: 'button', 'data-tag': 'sort' });
      button.append(...th.childNodes);
      th.append(button);
      button.addEventListener('click', () => sort(table, th));
    }
    if (remembered(table)) {
      const [index, order] = (store.get(sortKeyFor(table)) ?? '').split(' ');
      const th = headerRow.cells[Number(index)];
      if (th?.querySelector(':scope > [data-tag="sort"]') && (order === 'ascending' || order === 'descending')) sort(table, th, order);
    }
  });

  each(root, 'tbody > tr', 'num-row', (row) => {
    const table = row.closest('table');
    if (table?.tHead && !table.closest('[data-tagaction="off"]')) schedule(table);
  });

  each(root, 'input[aria-controls]:is([type="search"], [type="text"], :not([type]))', 'filter', (control) => {
    const target = document.getElementById(control.getAttribute('aria-controls'));
    if (!target?.matches('table, ul, ol, menu')) return;
    // A list written with `hidden` is a list of search results: it shows only
    // while something is typed, like a site search over a list of every page.
    if (target.hidden && !target.matches('table')) results.add(target);
    reveal(control);
    statusFor(target);
    const name = control.name;
    if (name) {
      const value = new URLSearchParams(location.search).get(name);
      if (value !== null && !control.value) control.value = value;
    }
    control.addEventListener('input', () => {
      filter(control, target);
      if (!name) return;
      const url = new URL(location.href);
      if (control.value) url.searchParams.set(name, control.value);
      else url.searchParams.delete(name);
      // Safari throws once a page calls this more than 100 times in 30 seconds.
      try { history.replaceState(history.state, '', url); } catch { /* the filter still works */ }
    });
    if (control.value) filter(control, target);
  });
}
