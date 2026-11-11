// Keyboard shortcuts written with ARIA's own attribute, so the shortcut a page
// shows is one that works:
//   <input type="search" aria-label="Search" aria-keyshortcuts="/">
//   <button aria-keyshortcuts="Control+K Meta+K">Command menu</button>
// The key focuses a field, or clicks anything else. A shortcut without
// Control, Alt, or Meta is ignored while you type in a field. Hidden and
// disabled elements are skipped.

import { find, once } from '../core.js';

const MODIFIERS = { Control: 'ctrlKey', Alt: 'altKey', Shift: 'shiftKey', Meta: 'metaKey' };
const typing = (target) => target.closest?.('input, textarea, select, [contenteditable]:not([contenteditable="false"])');

// "Control+K" → "control+k". Shift is dropped for single characters ("?" already says it).
function normalize(parts) {
  const key = parts.pop().toLowerCase();
  const mods = parts.map((part) => part.toLowerCase()).filter((part) => !(part === 'shift' && key.length === 1));
  return [...new Set(mods)].sort().concat(key).join('+');
}

function fromEvent(event) {
  const key = event.key === ' ' ? 'Space' : event.key;
  const mods = Object.keys(MODIFIERS).filter((name) => event[MODIFIERS[name]] && name !== key);
  return normalize([...mods, key]);
}

export function init() {
  if (!once(document, 'shortcuts')) return;
  document.addEventListener('keydown', (event) => {
    if (event.defaultPrevented || event.repeat || event.isComposing || !event.key) return;
    const pressed = fromEvent(event);
    const modified = /(^|\+)(control|alt|meta)\+/.test(pressed);
    if (!modified && typing(event.target)) return;
    const target = find(document, '[aria-keyshortcuts]').find((element) =>
      !element.disabled && !element.closest('[hidden], [inert]') && (element.checkVisibility?.() ?? true) &&
      element.getAttribute('aria-keyshortcuts').split(/\s+/).filter(Boolean).some((shortcut) => normalize(shortcut.split('+')) === pressed));
    if (!target) return;
    event.preventDefault();
    if (typing(target) && target.matches('input, textarea, select')) {
      target.focus();
      if (target.select && target.matches('input')) target.select();
    } else target.click();
  });
}
