// Selectable rows: a checkbox in a <thead> cell selects every row whose cell
// in that column holds a checkbox.
//   <thead><tr><th><input type="checkbox" aria-label="Select all"></th>…
//   <tbody><tr><td><input type="checkbox" name="user" value="1" aria-label="Select Maya"></td>…
// - Checking the header box checks every shown row (rows a filter hides are
//   left as they are); it shows a mixed state (indeterminate) when only some are.
// - Shift-click a row's box to set every shown box between it and the last
//   one clicked.
// Works on rows added later, since it reads the table each time.

import { each } from '../core.js';

const boxes = (table, index) => [...table.tBodies].flatMap((body) => [...body.rows])
  .filter((row) => !row.hidden)
  .map((row) => row.cells[index]?.querySelector('input[type="checkbox"]:not([role="switch"])'))
  .filter((box) => box && !box.disabled);

function set(box, checked) {
  if (box.checked === checked) return;
  box.checked = checked;
  box.dispatchEvent(new Event('input', { bubbles: true }));
  box.dispatchEvent(new Event('change', { bubbles: true }));
}

export function init(root) {
  each(root, 'thead th input[type="checkbox"]:not([role="switch"])', 'select-all', (all) => {
    const th = all.closest('th');
    const table = th.closest('table');
    const index = th.cellIndex;
    let last = null;
    let syncing = false;
    const sync = () => {
      const list = boxes(table, index);
      const checked = list.filter((box) => box.checked).length;
      all.checked = list.length > 0 && checked === list.length;
      all.indeterminate = checked > 0 && checked < list.length;
    };
    all.addEventListener('change', () => {
      syncing = true;
      for (const box of boxes(table, index)) set(box, all.checked);
      syncing = false;
      sync();
    });
    table.addEventListener('click', (event) => {
      const box = event.target;
      const list = boxes(table, index);
      if (!list.includes(box)) return;
      if (event.shiftKey && last && list.includes(last) && last !== box) {
        const [from, to] = [list.indexOf(last), list.indexOf(box)].sort((a, b) => a - b);
        for (const other of list.slice(from, to + 1)) set(other, box.checked);
      }
      last = box;
    });
    table.addEventListener('change', (event) => { if (!syncing && event.target !== all) sync(); });
    sync();
  });
}
