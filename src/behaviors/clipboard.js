// Buttons that copy or share another element, using the browser's
// commandfor/command attributes like --clone does:
// - <button commandfor="invite" command="--copy">Copy</button> copies the
//   value of a field, or the text of any other element.
// - <button commandfor="pricing" command="--share">Share</button> opens the
//   device's share sheet for a link: the href of an <a>, or this page's
//   address with the element's #id. Where there is no share sheet, the link is
//   copied instead.
// Both buttons only work with JavaScript, so they can carry `hidden`; TagAction
// shows them. The button's text says what happened for two seconds.

import { each, once, reveal } from '../core.js';
import { copy } from './code.js';

const timers = new WeakMap();

function say(button, text) {
  if (!button.dataset.tagLabel) button.dataset.tagLabel = button.textContent;
  button.textContent = text;
  clearTimeout(timers.get(button));
  timers.set(button, setTimeout(() => { button.textContent = button.dataset.tagLabel; }, 2000));
}

async function share(target, button) {
  const url = target.matches('a[href]') ? target.href : `${location.href.split('#')[0]}#${target.id}`;
  const title = target.matches('a[href]') ? target.textContent.trim() : document.title;
  if (navigator.share) {
    try {
      await navigator.share({ title, url });
      return;
    } catch (error) {
      if (error.name === 'AbortError') return; // the reader closed the share sheet
    }
  }
  say(button, (await copy(url)) ? 'Link copied' : 'Copy failed');
}

export function init(root) {
  each(root, 'button[commandfor]:is([command="--copy"], [command="--share"])', 'clipboard-button', (button) => {
    if (document.getElementById(button.getAttribute('commandfor'))) reveal(button);
  });
  if (!once(document, 'clipboard')) return;
  document.addEventListener('command', async (event) => {
    if (event.command !== '--copy' && event.command !== '--share') return;
    const target = event.target;
    const button = event.source;
    if (!button || target.closest?.('[data-tagaction="off"]')) return;
    if (event.command === '--share') return share(target, button);
    const text = target.matches('input, textarea, select') ? target.value : target.textContent.trim();
    say(button, (await copy(text)) ? 'Copied' : 'Press Ctrl+C to copy');
  }, true);
}
