// <pre>: a Copy button in the corner copies the code.

import { each, h } from '../core.js';

export async function copy(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // No clipboard API (an http:// page, an old browser): copy a selection.
    const area = h('textarea', { readonly: '', 'aria-hidden': 'true', style: 'position:fixed;opacity:0' });
    area.value = text;
    document.body.append(area);
    area.select();
    const copied = document.execCommand('copy');
    area.remove();
    return copied;
  }
}

export function init(root) {
  each(root, 'pre', 'copy', (pre) => {
    if (!pre.textContent.trim()) return;
    const wrapper = h('div', { 'data-tag': 'code' });
    const button = h('button', { type: 'button', class: 'outline', 'data-tag': 'copy', 'aria-live': 'polite' }, 'Copy');
    pre.before(wrapper);
    wrapper.append(pre, button);
    let timer;
    button.addEventListener('click', async () => {
      const copied = await copy(pre.textContent);
      button.textContent = copied ? 'Copied' : 'Press Ctrl+C to copy';
      if (!copied) getSelection()?.selectAllChildren(pre);
      clearTimeout(timer);
      timer = setTimeout(() => { button.textContent = 'Copy'; }, 2000);
    });
  });
}
