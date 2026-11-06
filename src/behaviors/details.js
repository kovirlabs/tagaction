// <details>:
// - Group mode: details with the same name="…" open one at a time. Browsers do
//   this natively; older ones get the same behavior here.
// - data-tag-remember (on a <details> or a container of them) keeps open/closed
//   state across visits. Each remembered <details> needs an id.

import { each, store } from '../core.js';

const nativeGroups = () => 'name' in HTMLDetailsElement.prototype;
const keyFor = (details) => `tagaction:details:${location.pathname}#${details.id}`;

export function init(root) {
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
