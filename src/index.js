// TagAction entry point. Sets up every behavior when the page loads, then
// watches for added content (htmx swaps, page scripts, frameworks) and sets
// that up too. Opt an element and everything inside it out with
// data-tagaction="off".

import { addStyles } from './styles.js';
import { init as command } from './behaviors/command.js';
import { init as dialog } from './behaviors/dialog.js';
import { init as details } from './behaviors/details.js';
import { init as table } from './behaviors/table.js';
import { init as form } from './behaviors/form.js';
import { init as textarea } from './behaviors/textarea.js';
import { init as file } from './behaviors/file.js';
import { init as password } from './behaviors/password.js';
import { init as code } from './behaviors/code.js';
import { init as time } from './behaviors/time.js';
import { init as headings } from './behaviors/headings.js';
import { init as nav } from './behaviors/nav.js';
import { init as img } from './behaviors/img.js';
import { init as menu } from './behaviors/menu.js';
import { init as output } from './behaviors/output.js';
import { init as abbr } from './behaviors/abbr.js';
import { init as template } from './behaviors/template.js';
import { init as clipboard } from './behaviors/clipboard.js';
import { init as theme } from './behaviors/theme.js';
import { init as tabs } from './behaviors/tabs.js';
import { init as match } from './behaviors/match.js';
import { init as shortcuts } from './behaviors/shortcuts.js';
import { init as select } from './behaviors/select.js';

// Order matters in one place: headings build tables of contents before nav
// decides which navs follow the scroll.
const behaviors = [command, theme, dialog, details, table, form, match, textarea, file, password, code, time, headings, nav, img, menu, output, abbr, template, clipboard, tabs, shortcuts, select];

const VERSION = '__VERSION__';

/** Set up every behavior inside `root` (an element or the document). Safe to call again. */
export function init(root = document) {
  for (const behavior of behaviors) {
    try {
      behavior(root);
    } catch (error) {
      // One behavior failing must not stop the others.
      console.error('TagAction:', error);
    }
  }
}

function start() {
  if (document.documentElement.dataset.tagaction === 'off') return;
  addStyles();
  init(document);
  new MutationObserver((records) => {
    const added = new Set();
    for (const record of records) {
      for (const node of record.addedNodes) if (node.nodeType === 1) added.add(node);
    }
    // Skip nodes inside another added node; init() on the outer one covers them.
    for (const node of added) {
      let covered = false;
      for (let parent = node.parentElement; parent && !covered; parent = parent.parentElement) covered = added.has(parent);
      if (!covered && node.isConnected) init(node);
    }
  }).observe(document.documentElement, { childList: true, subtree: true });
}

if (typeof window !== 'undefined' && !window.TagAction) {
  window.TagAction = { init, version: VERSION };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
}
