// <input type="file">:
// - With `multiple`, the chosen file names are listed after the field
//   (browsers only say "3 files").
// - Files can be dropped on the field or on its <label>.

import { each, h, idFor, addToken } from '../core.js';

export function init(root) {
  each(root, 'input[type="file"]', 'file', (input) => {
    let list = null;
    const update = () => {
      if (!input.multiple) return;
      if (!list) {
        list = h('small', { 'data-tag': 'files', 'aria-live': 'polite' });
        const help = input.nextElementSibling?.matches('small:not([data-tag])') ? input.nextElementSibling : null;
        (help ?? input).after(list);
        addToken(input, 'aria-describedby', idFor(list));
      }
      list.textContent = [...input.files].map((file) => file.name).join(', ');
    };
    input.addEventListener('change', update);

    for (const zone of [input, ...input.labels]) {
      const over = (on) => {
        input.toggleAttribute('data-tag-drop', on);
        zone.toggleAttribute('data-tag-drop', on);
      };
      zone.addEventListener('dragover', (event) => {
        if (input.disabled || !event.dataTransfer?.types.includes('Files')) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
        over(true);
      });
      zone.addEventListener('dragleave', () => over(false));
      zone.addEventListener('drop', (event) => {
        over(false);
        if (input.disabled || !event.dataTransfer?.files.length) return;
        event.preventDefault();
        const files = new DataTransfer();
        for (const file of [...event.dataTransfer.files].slice(0, input.multiple ? undefined : 1)) files.items.add(file);
        input.files = files.files;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      });
    }
  });
}
