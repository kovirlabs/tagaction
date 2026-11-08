// <h2> and <h3>:
// - <nav data-tag-toc> is filled with a table of contents of the h2 and h3
//   headings in <main> (or the page), giving headings ids where needed. A
//   hidden nav (empty without JavaScript) is shown once it has links, and so
//   is a hidden element around it.
// - Every h2 and h3 with an id gets a "#" link to itself, so readers can copy
//   a link to the section.

import { each, find, h, once } from '../core.js';

const SKIP = 'nav, aside, dialog, footer, body > header, [popover], [data-tagaction="off"]';

const slug = (text) => text.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '') || 'section';

function headingText(heading) {
  const copy = heading.cloneNode(true);
  copy.querySelector('[data-tag="anchor"]')?.remove();
  return copy.textContent.trim();
}

function buildToc(nav) {
  const scope = document.querySelector('main') ?? document.body;
  const headings = [...scope.querySelectorAll('h2, h3')].filter((heading) => !heading.parentElement.closest(SKIP));
  if (!headings.length) return;
  const list = h('ul');
  let sublist = null;
  for (const heading of headings) {
    if (!heading.id) {
      const base = slug(headingText(heading));
      let id = base;
      for (let n = 2; document.getElementById(id); n++) id = `${base}-${n}`;
      heading.id = id;
    }
    const item = h('li');
    item.append(h('a', { href: `#${heading.id}` }, headingText(heading)));
    if (heading.tagName === 'H3' && list.lastElementChild) {
      if (!sublist || sublist.parentElement !== list.lastElementChild) list.lastElementChild.append((sublist = h('ul')));
      sublist.append(item);
    } else {
      list.append(item);
      sublist = null;
    }
  }
  nav.append(list);
  for (let el = nav; el; el = el.parentElement?.closest('[hidden]')) el.hidden = false;
  if (!nav.hasAttribute('aria-label') && !nav.hasAttribute('aria-labelledby')) nav.setAttribute('aria-label', 'On this page');
}

export function init(root) {
  each(root, 'nav[data-tag-toc]', 'toc', buildToc);
  for (const heading of find(root, 'h2[id], h3[id]')) {
    if (heading.parentElement.closest(SKIP) || !once(heading, 'anchor')) continue;
    heading.append(h('a', { href: `#${heading.id}`, 'data-tag': 'anchor', 'aria-label': `Link to section: ${headingText(heading)}` }, '#'));
  }
}
