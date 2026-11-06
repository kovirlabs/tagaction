// <output for="a b c">: shows a live result of the fields it lists.
// - One field: its value (for example a range slider's number).
// - Several fields: the sum of their numbers (a total). A checkbox or radio
//   counts its value only while it is checked.

import { each } from '../core.js';

function valueOf(field) {
  if ((field.type === 'checkbox' || field.type === 'radio') && !field.checked) return 0;
  return field.value;
}

export function init(root) {
  each(root, 'output[for]', 'output', (output) => {
    const fields = output.getAttribute('for').split(/\s+/).map((id) => document.getElementById(id)).filter(Boolean);
    if (!fields.length) return;
    const update = () => {
      if (fields.length === 1) {
        output.value = valueOf(fields[0]);
        return;
      }
      const total = fields.reduce((sum, field) => sum + (parseFloat(valueOf(field)) || 0), 0);
      output.value = String(Math.round(total * 1e6) / 1e6);
    };
    // Radios in the same group change each other, so listen on their form too.
    for (const target of new Set(fields.map((field) => field.form ?? field))) {
      target.addEventListener('input', update);
      target.addEventListener('change', update);
      target.addEventListener('reset', () => setTimeout(update));
    }
    update();
  });
}
