// Tabs, the ARIA way:
//   <div role="tablist" aria-label="Install">
//     <button role="tab" aria-controls="npm" aria-selected="true">npm</button>
//     <button role="tab" aria-controls="cdn">CDN</button>
//   </div>
//   <section id="npm" role="tabpanel">…</section>
//   <section id="cdn" role="tabpanel">…</section>
// Without JavaScript every panel shows, one after another. TagAction shows
// only the selected tab's panel (the first tab if none is marked), links each
// panel to its tab, and moves between tabs with the arrow keys, Home, and End,
// as the ARIA tabs pattern describes.
// Hidden panels use hidden="until-found" where the browser supports it, so
// find-in-page reaches their text and selects their tab (beforematch). A
// link to a panel, or to anything in it (#cdn), selects its tab, on load and
// when the #fragment changes.

import { each, idFor, once } from '../core.js';

const UNTIL_FOUND = typeof document !== 'undefined' && 'onbeforematch' in document.documentElement;
const selectors = new Set(); // select-a-panel functions, for #fragment links
function fromHash() {
  const id = decodeURIComponent(location.hash.slice(1));
  const target = id && document.getElementById(id);
  if (target) for (const show of selectors) if (show(target)) target.scrollIntoView();
}

export function init(root) {
  each(root, '[role="tablist"]', 'tabs', (list) => {
    const tabs = [...list.querySelectorAll('[role="tab"][aria-controls]')]
      .filter((tab) => document.getElementById(tab.getAttribute('aria-controls')));
    if (!tabs.length) return;
    const panelOf = (tab) => document.getElementById(tab.getAttribute('aria-controls'));

    const select = (chosen, focus) => {
      for (const tab of tabs) {
        const selected = tab === chosen;
        tab.setAttribute('aria-selected', String(selected));
        tab.tabIndex = selected ? 0 : -1;
        if (selected) panelOf(tab).removeAttribute('hidden');
        else if (UNTIL_FOUND) panelOf(tab).setAttribute('hidden', 'until-found');
        else panelOf(tab).hidden = true;
      }
      if (focus) chosen.focus();
    };

    for (const tab of tabs) {
      if (tab.matches('button:not([type])')) tab.type = 'button';
      const panel = panelOf(tab);
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', idFor(tab, 'tab'));
      if (!panel.hasAttribute('tabindex')) panel.tabIndex = 0;
      tab.addEventListener('click', () => select(tab, false));
      panel.addEventListener('beforematch', () => select(tab, false));
    }

    // Returns true when the target was in a hidden panel of this list.
    selectors.add((target) => {
      const tab = tabs.find((t) => panelOf(t).contains(target));
      if (!tab || tab.getAttribute('aria-selected') === 'true') return false;
      select(tab, false);
      return true;
    });

    list.addEventListener('keydown', (event) => {
      const index = tabs.indexOf(document.activeElement);
      if (index < 0) return;
      const vertical = list.getAttribute('aria-orientation') === 'vertical';
      const keys = {
        [vertical ? 'ArrowDown' : 'ArrowRight']: index + 1,
        [vertical ? 'ArrowUp' : 'ArrowLeft']: index - 1,
        Home: 0,
        End: tabs.length - 1,
      };
      if (!(event.key in keys)) return;
      event.preventDefault();
      select(tabs[(keys[event.key] + tabs.length) % tabs.length], true);
    });

    const id = decodeURIComponent(location.hash.slice(1));
    const linked = id && document.getElementById(id);
    select(tabs.find((tab) => linked && panelOf(tab).contains(linked)) ?? tabs.find((tab) => tab.getAttribute('aria-selected') === 'true') ?? tabs[0], false);
  });
  if (once(document, 'tabs-hash')) addEventListener('hashchange', fromHash);
}
