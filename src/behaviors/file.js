// <input type="file">:
// - With `multiple`, the chosen file names are listed after the field
//   (browsers only say "3 files").
// - With accept="image/…", a thumbnail of each chosen picture shows in the
//   same list (object URLs, revoked when the choice changes).
// - Files can be dropped on the field or on its <label>.

import { each, h, idFor, addToken } from '../core.js';

export function init(root) {
  each(root, 'input[type="file"]', 'file', (input) => {
    let list = null;
    let urls = [];
    const images = input.matches('[accept^="image"]');
    const update = () => {
      if (!input.multiple && !images) return;
      if (!list) {
        list = h('small', { 'data-tag': 'files', 'aria-live': 'polite' });
        const help = input.nextElementSibling?.matches('small:not([data-tag])') ? input.nextElementSibling : null;
        (help ?? input).after(list);
        addToken(input, 'aria-describedby', idFor(list));
      }
      for (const url of urls) URL.revokeObjectURL(url);
      urls = [];
      list.replaceChildren(...[...input.files].flatMap((file, index) => {
        const parts = [index ? ', ' : ''];
        if (images && file.type.startsWith('image/')) {
          urls.push(URL.createObjectURL(file));
          parts.push(h('img', { src: urls.at(-1), alt: '', 'data-tag': 'thumb' }));
        }
        return [...parts, file.name];
      }));
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
