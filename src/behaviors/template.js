// <template>: a button adds a copy of the template's content just before the
// template, for repeated rows or list items:
//   <ul><li>…</li><template id="new-item"><li>…</li></template></ul>
//   <button type="button" commandfor="new-item" command="--clone" hidden>Add item</button>
// The button uses the browser's commandfor/command attributes. It only works
// with JavaScript, so it can carry `hidden`; TagAction shows it.
// Ids inside each copy get a number (-2, -3, …) and the for, aria-*, list,
// and commandfor attributes that point at them are updated to match.
// A button with command="--remove" removes the element it names, so every
// row can be taken out again: give the template's row an id and put
//   <button type="button" commandfor="row-id" command="--remove" hidden>Remove</button>
// in it (and in the first, static row). Focus moves to the previous row, or
// else to the Add button, or the next row.

import { each, find, focusables, once, reveal } from '../core.js';

const REFERENCES = ['for', 'list', 'commandfor', 'aria-controls', 'aria-describedby', 'aria-labelledby'];

function clone(template) {
  const copies = (Number(template.dataset.tagCopies) || 1) + 1;
  template.dataset.tagCopies = copies;
  const fragment = template.content.cloneNode(true);
  const renamed = new Map();
  for (const element of fragment.querySelectorAll('[id]')) {
    const id = `${element.id}-${copies}`;
    renamed.set(element.id, id);
    element.id = id;
  }
  for (const element of fragment.querySelectorAll(REFERENCES.map((name) => `[${name}]`).join(','))) {
    for (const name of REFERENCES) {
      const value = element.getAttribute(name);
      if (value) element.setAttribute(name, value.split(/\s+/).map((id) => renamed.get(id) ?? id).join(' '));
    }
  }
  const added = [...fragment.children];
  template.before(fragment);
  (added.map((element) => focusables(element)[0] ?? null).find(Boolean))?.focus();
}

const rows = (element) => [...element.parentElement.children].filter((child) => !child.matches('template'));

function remove(row) {
  const siblings = rows(row);
  const index = siblings.indexOf(row);
  const template = row.parentElement.querySelector(':scope > template[id]');
  const add = template && find(document, `button[command="--clone"][commandfor="${CSS.escape(template.id)}"]`)[0];
  const next = [siblings[index - 1], add, siblings[index + 1]].map((place) => place && (place.matches('button') ? place : focusables(place)[0])).find(Boolean);
  row.remove();
  next?.focus();
}

export function init(root) {
  each(root, 'button[commandfor][command="--clone"]', 'clone-button', (button) => {
    if (document.getElementById(button.getAttribute('commandfor'))?.matches('template')) reveal(button);
  });
  each(root, 'button[commandfor][command="--remove"]', 'remove-button', (button) => {
    if (document.getElementById(button.getAttribute('commandfor'))) reveal(button);
  });
  if (!once(document, 'template')) return;
  document.addEventListener('command', (event) => {
    const target = event.target;
    if (event.command === '--remove' && target.parentElement && find(target, '*').includes(target)) remove(target);
    if (event.command !== '--clone' || !target.matches?.('template') || !find(target, 'template').length) return;
    clone(target);
  }, true);
}
