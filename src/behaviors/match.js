// A field that must repeat another (Confirm password, Confirm email):
//   <label for="password">Password</label><input type="password" id="password">
//   <label for="confirm">Confirm password</label>
//   <input type="password" id="confirm" data-tag-match="password">
// The field is invalid while the two differ ("Doesn't match Password."), so
// the form won't submit, and TagAction's form messages show why.

import { each } from '../core.js';

export function init(root) {
  each(root, 'input[data-tag-match]', 'match', (field) => {
    const other = document.getElementById(field.dataset.tagMatch);
    if (!other) return;
    const name = other.labels?.[0]?.textContent.trim() || other.name || 'the other field';
    const check = () => field.setCustomValidity(field.value && field.value !== other.value ? `Doesn't match ${name}.` : '');
    // Capture runs this before the form's own listeners, so they see the new validity.
    field.addEventListener('input', check, true);
    other.addEventListener('input', () => {
      const wasInvalid = !field.validity.valid;
      check();
      // Let the form clear a message that's no longer true.
      if (wasInvalid && field.validity.valid) field.dispatchEvent(new Event('input', { bubbles: true }));
    });
    check();
  });
}
