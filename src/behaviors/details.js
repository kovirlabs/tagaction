// <details>:
// - Group mode: details with the same name="…" open one at a time. Browsers do
//   this natively; older ones get the same behavior here.
// - data-tag-remember (on a <details> or a container of them) keeps open/closed
//   state across visits. Each remembered <details> needs an id.
// - A dropdown menu, a <details> in a list in the page header's nav
//   (<li><details><summary>Services</summary><ul>…</ul></details></li>),
//   closes on Escape, on a click outside it, and when a link in it is
//   followed. Arrow keys move through its links.
// - A link to something inside a closed <details> (an FAQ answer) opens it,
//   on load and when the address's #fragment changes.
// - Printing: every closed <details> (except header-nav dropdowns) opens
//   for the printout, so a printed FAQ has its answers, and closes again
//   afterwards. A name="…" group is lifted while printing so all can open.

import { each, once, store } from '../core.js';
import { arrowKeys } from './menu.js';

function openTarget() {
  const id = decodeURIComponent(location.hash.slice(1));
  const target = id && document.getElementById(id);
  if (!target) return;
  let opened = false;
  for (let details = target.closest('details'); details; details = details.parentElement?.closest('details')) {
    if (!details.open) { details.open = true; opened = true; }
  }
  if (opened) target.scrollIntoView();
}

function dropdown(details) {
  const summary = details.querySelector(':scope > summary');
  const close = (returnFocus) => {
    if (!details.open) return;
    details.open = false;
    if (returnFocus) summary?.focus();
  };
  details.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') { close(true); event.preventDefault(); return; }
    if (!details.open || !['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    const list = details.querySelector(':scope > :is(ul, ol, menu, nav)');
    if (list) arrowKeys(list, event);
  });
  details.addEventListener('click', (event) => {
    if (event.target.closest('a[href]')) close(false);
  });
  document.addEventListener('click', (event) => {
    if (!details.contains(event.target)) close(false);
  });
  details.addEventListener('focusout', (event) => {
    if (event.relatedTarget && !details.contains(event.relatedTarget)) close(false);
  });
}

const nativeGroups = () => 'name' in HTMLDetailsElement.prototype;
const keyFor = (details) => `tagaction:details:${location.pathname}#${details.id}`;

let printed = [];
function beforePrint() {
  printed = [...document.querySelectorAll('details:not([open])')]
    .filter((details) => !details.closest('[data-tagaction="off"], header nav li'))
    .map((details) => [details, details.getAttribute('name')]);
  for (const [details] of printed) details.removeAttribute('name');
  for (const [details] of printed) details.open = true;
}
function afterPrint() {
  for (const [details, name] of printed) {
    details.open = false;
    if (name !== null) details.setAttribute('name', name);
  }
  printed = [];
}

export function init(root) {
  if (once(document, 'details-hash')) {
    addEventListener('hashchange', openTarget);
    openTarget();
    addEventListener('beforeprint', beforePrint);
    addEventListener('afterprint', afterPrint);
  }

  each(root, 'header nav li > details', 'details-dropdown', dropdown);

  each(root, 'details', 'details', (details) => {
    if (!nativeGroups() && details.getAttribute('name')) {
      details.addEventListener('toggle', () => {
        if (!details.open) return;
        const name = details.getAttribute('name');
        for (const other of document.querySelectorAll('details[open]')) {
          if (other !== details && other.getAttribute('name') === name) other.open = false;
        }
      });
    }

    if (details.id && details.closest('[data-tag-remember]')) {
      const saved = store.get(keyFor(details));
      if (saved !== null) details.open = saved === 'open';
      details.addEventListener('toggle', () => store.set(keyFor(details), details.open ? 'open' : 'closed'));
    }
  });
}
