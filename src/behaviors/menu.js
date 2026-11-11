// Dropdowns:
// - <button aria-expanded="false" aria-controls="list-id"> toggles the element
//   it controls (a <ul>, <ol>, <menu>, or any element). Write the list visible
//   in the HTML; TagAction hides it, so it stays usable without JavaScript.
//   Escape and clicking outside close it; arrow keys move through its links
//   and buttons.
// - Arrow keys, Home, and End also move through the items of a <menu> and of
//   a popover menu (<div popover><nav><ul>…).
// - A popover holding links closes when one is followed.

import { each, focusables, reveal } from '../core.js';

export function arrowKeys(container, event, close) {
  const items = focusables(container);
  const index = items.indexOf(document.activeElement);
  let next;
  if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = items[(index + 1) % items.length];
  else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = items[(index - 1 + items.length) % items.length];
  else if (event.key === 'Home') next = items[0];
  else if (event.key === 'End') next = items[items.length - 1];
  else if (event.key === 'Escape' && close) { close(true); event.preventDefault(); return; }
  if (!next) return;
  event.preventDefault();
  next.focus();
}

export function init(root) {
  each(root, 'button[aria-controls][aria-expanded]', 'menu', (button) => {
    const list = document.getElementById(button.getAttribute('aria-controls'));
    if (!list || list.closest('[data-tagaction="off"]')) return;
    reveal(button);
    const isOpen = () => button.getAttribute('aria-expanded') === 'true';
    const set = (open) => {
      button.setAttribute('aria-expanded', String(open));
      list.hidden = !open;
    };
    const close = (returnFocus) => {
      if (!isOpen()) return;
      set(false);
      if (returnFocus) button.focus();
    };
    // A list beside its button in a nav (a top-bar menu) drops down below it.
    if (list.parentElement === button.parentElement && list.closest('nav')) list.setAttribute('data-tag', 'dropdown');
    set(isOpen());

    button.addEventListener('click', () => set(!isOpen()));
    button.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') close(true);
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        set(true);
        focusables(list)[0]?.focus();
      }
    });
    list.addEventListener('keydown', (event) => arrowKeys(list, event, close));
    document.addEventListener('click', (event) => {
      if (isOpen() && !button.contains(event.target) && !list.contains(event.target)) close(false);
    });
    list.addEventListener('focusout', (event) => {
      if (event.relatedTarget && !list.contains(event.relatedTarget) && event.relatedTarget !== button) close(false);
    });
  });

  each(root, 'menu, [popover]:has(nav, ul, ol, menu)', 'arrows', (container) => {
    container.addEventListener('keydown', (event) => {
      if (event.defaultPrevented || event.target.matches('input, textarea, select')) return;
      arrowKeys(container, event);
    });
  });

  // A popover of links (a phone menu, a user menu) closes when you follow one,
  // so a link to a section on the same page isn't hidden behind the panel.
  each(root, '[popover]:has(a[href])', 'popover-links', (popover) => {
    popover.addEventListener('click', (event) => {
      if (event.target.closest('a[href]') && popover.matches(':popover-open')) popover.hidePopover();
    });
  });
}
