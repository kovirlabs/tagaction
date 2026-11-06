// <abbr title="…">: tapping (or clicking, or Enter) shows the title in
// brackets after the abbreviation, since touch screens have no hover.
// Screen readers already read the title, so the abbr only gains a tab stop.

import { each, h } from '../core.js';

export function init(root) {
  each(root, 'abbr[title]', 'abbr', (abbr) => {
    const title = abbr.title.trim();
    if (!title) return;
    abbr.tabIndex = 0;
    let expansion = null;
    const toggle = () => {
      if (expansion) {
        expansion.remove();
        expansion = null;
      } else {
        expansion = h('small', { 'data-tag': 'abbr' }, ` (${title})`);
        abbr.after(expansion);
      }
    };
    abbr.addEventListener('click', toggle);
    abbr.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); toggle(); }
    });
  });
}
