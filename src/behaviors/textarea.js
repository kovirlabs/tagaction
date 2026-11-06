// <textarea>:
// - Grows as you type when it has no rows attribute. CSS field-sizing does this
//   in browsers that support it (TagBrush.css uses it); this covers the rest.
// - With maxlength, a counter ("12 / 280") follows the field.

import { each, h, idFor, addToken } from '../core.js';

export function init(root) {
  each(root, 'textarea:not([rows])', 'grow', (textarea) => {
    if (CSS.supports?.('field-sizing', 'content')) return;
    const grow = () => {
      const style = getComputedStyle(textarea);
      const borders = parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth);
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight + borders}px`;
    };
    textarea.addEventListener('input', grow);
    if (textarea.value) requestAnimationFrame(grow);
  });

  each(root, 'textarea[maxlength]', 'count', (textarea) => {
    const max = textarea.maxLength;
    if (max < 0) return;
    const counter = h('small', { 'data-tag': 'count' });
    // Keep help text directly after the field; the counter goes after it.
    const help = textarea.nextElementSibling?.matches('small') ? textarea.nextElementSibling : null;
    (help ?? textarea).after(counter);
    addToken(textarea, 'aria-describedby', idFor(counter));
    const update = () => {
      const left = max - textarea.value.length;
      counter.textContent = `${textarea.value.length} / ${max}`;
      counter.toggleAttribute('data-tag-low', left <= Math.max(10, max * 0.1));
    };
    textarea.addEventListener('input', update);
    update();
  });
}
