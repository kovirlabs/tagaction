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

import { each, idFor } from '../core.js';

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
        panelOf(tab).hidden = !selected;
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
    }

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

    select(tabs.find((tab) => tab.getAttribute('aria-selected') === 'true') ?? tabs[0], false);
  });
}
