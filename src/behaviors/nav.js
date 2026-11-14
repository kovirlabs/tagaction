// <nav> and <a>:
// - The link to the current page gets aria-current="page", unless the nav
//   already marks one.
// - In a nav of same-page links (a table of contents), the link to the section
//   you are reading gets aria-current="true" as you scroll.
// - A sticky page header (<header data-layout="sticky">, TagBrush.css's top
//   bar) has its height kept in --tag-header-height on <html>, so the room
//   TagBrush.css keeps above a heading you jump to fits the bar exactly,
//   however many rows it wraps to.

import { each } from '../core.js';

const normalize = (url) => url.origin + url.pathname.replace(/\/index\.html?$/, '/').replace(/(.)\/$/, '$1');

function markCurrentPage(nav) {
  if (nav.querySelector('[aria-current]')) return;
  const here = normalize(location);
  const link = [...nav.querySelectorAll('a[href]')].find((a) => {
    if (a.getAttribute('href').startsWith('#')) return false;
    const url = new URL(a.href);
    return url.protocol.startsWith('http') || url.protocol === 'file:' ? normalize(url) === here : false;
  });
  link?.setAttribute('aria-current', 'page');
}

function followScroll(nav, links) {
  const targets = links.map((a) => document.getElementById(decodeURIComponent(a.hash.slice(1))));
  let frame = 0;
  const update = () => {
    frame = 0;
    const line = innerHeight * 0.25;
    const atBottom = innerHeight + scrollY >= document.documentElement.scrollHeight - 2;
    let active = atBottom ? targets.length - 1 : 0;
    if (!atBottom) targets.forEach((target, i) => { if (target.getBoundingClientRect().top <= line) active = i; });
    links.forEach((a, i) => {
      if (i === active) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
  };
  addEventListener('scroll', () => { frame ||= requestAnimationFrame(update); }, { passive: true });
  update();
}

export function init(root) {
  each(root, 'nav', 'nav', (nav) => {
    const links = [...nav.querySelectorAll('a[href^="#"]')].filter((a) => a.hash.length > 1 && document.getElementById(decodeURIComponent(a.hash.slice(1))));
    if (links.length >= 2 && links.length === nav.querySelectorAll('a[href]').length) followScroll(nav, links);
    else markCurrentPage(nav);
  });
  each(root, 'body > header[data-layout="sticky"], body > :not([class]) > header[data-layout="sticky"]', 'header-height', (header) => {
    new ResizeObserver(() => {
      if (header.isConnected) document.documentElement.style.setProperty('--tag-header-height', `${header.offsetHeight}px`);
    }).observe(header);
  });
}
