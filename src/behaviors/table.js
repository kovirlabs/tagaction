// <table>:
// - Sorting: every table with a <thead> and rows in <tbody> gets a button in
//   each header cell. Clicking sorts ascending, then descending, and sets
//   aria-sort. Numbers sort as numbers; <data value>, <time datetime>, and
//   <meter>/<progress> values in a cell are used as its sort key.
// - Filtering: <input type="search" aria-controls="table-id"> hides rows that
//   don't contain every typed word. It also filters the <li>s of a list. A
//   list written with `hidden` shows only while there's a search (results).
// - Number columns: a column whose body cells all hold numbers (or a <data
//   value> number) gets data-tag="num" on its header and cells, and the
//   injected styles line it up on the right in tabular figures. An align
//   attribute or the page's own text-align wins.

import { each, h, reveal } from '../core.js';

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
const NUMBER = /^[^\d\s-]{0,3}\s*[-−]?\d[\d,\s]*(\.\d+)?\s*[%a-zA-Z]{0,3}$/;

function sortKey(cell) {
  if (!cell) return '';
  const valued = cell.querySelector('data[value], time[datetime], meter, progress');
  if (valued) return valued.getAttribute('value') ?? valued.getAttribute('datetime') ?? '';
  return cell.textContent.trim();
}

// Stricter than the sort's test: only a currency sign may lead, not a letter
// or a "#" ("Q1", "Mar 2", "#1042" are labels).
const ALIGNED = /^\p{Sc}?\s*[-−+]?\d[\d,\s]*(\.\d+)?\s*[%a-zA-Z]{0,3}$/u;
const isNumber = (cell) => {
  if (cell.querySelector('time, meter, progress')) return false;
  const data = cell.querySelector('data[value]');
  return ALIGNED.test(data ? data.getAttribute('value') : cell.textContent.trim());
};

// Mark the columns where every non-empty body cell is a number.
function markNumbers(table, headerRow) {
  const rows = [...table.tBodies].flatMap((body) => [...body.rows]);
  if (!rows.length || rows.some((row) => [...row.cells].some((cell) => cell.colSpan > 1))) return;
  [...headerRow.cells].forEach((th, index) => {
    if (th.colSpan > 1) return;
    const cells = rows.map((row) => row.cells[index]).filter((cell) => cell && cell.textContent.trim());
    if (!cells.length || !cells.every(isNumber)) return;
    for (const cell of [th, ...cells]) if (!cell.dataset.tag) cell.dataset.tag = 'num';
  });
}

function compare(a, b) {
  if (NUMBER.test(a) && NUMBER.test(b)) {
    const number = (text) => parseFloat(text.replace(/[^\d.−-]/g, '').replace('−', '-'));
    return number(a) - number(b);
  }
  if (a === '' || b === '') return a === '' ? (b === '' ? 0 : 1) : -1; // empty cells last
  return collator.compare(a, b);
}

function sort(table, header) {
  const descending = header.getAttribute('aria-sort') === 'ascending';
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

function filter(control, target) {
  const words = control.value.toLowerCase().split(/\s+/).filter(Boolean);
  if (results.has(target)) target.hidden = !words.length;
  const items = target.tBodies ? [...target.tBodies].flatMap((body) => [...body.rows]) : [...target.children].filter((child) => child.matches('li'));
  for (const item of items) {
    const text = item.textContent.toLowerCase();
    item.hidden = !words.every((word) => text.includes(word));
  }
}

export function init(root) {
  each(root, 'table', 'table', (table) => {
    const headerRow = table.tHead?.rows[table.tHead.rows.length - 1];
    if (!headerRow) return;
    markNumbers(table, headerRow);
    if (![...table.tBodies].some((body) => body.rows.length > 1)) return;
    for (const th of headerRow.cells) {
      if (th.tagName !== 'TH' || th.colSpan > 1 || th.dataset.tagaction === 'off' || !th.textContent.trim()) continue;
      const button = h('button', { type: 'button', 'data-tag': 'sort' });
      button.append(...th.childNodes);
      th.append(button);
      button.addEventListener('click', () => sort(table, th));
    }
  });

  each(root, 'input[aria-controls]:is([type="search"], [type="text"], :not([type]))', 'filter', (control) => {
    const target = document.getElementById(control.getAttribute('aria-controls'));
    if (!target?.matches('table, ul, ol, menu')) return;
    // A list written with `hidden` is a list of search results: it shows only
    // while something is typed, like a site search over a list of every page.
    if (target.hidden && !target.matches('table')) results.add(target);
    reveal(control);
    control.addEventListener('input', () => filter(control, target));
    if (control.value) filter(control, target);
  });
}
