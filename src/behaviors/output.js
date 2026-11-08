// <output for="a b c">: shows a live result of the fields it lists.
// - One field: its value (for example a range slider's number).
// - Several fields: the sum of their numbers (a total). A checkbox or radio
//   counts its value only while it is checked.
// - data-tag-calc="product": multiplies them instead (nights x nightly rate).
//   Unchecked checkboxes and radios are left out, so listing every radio in
//   a group multiplies by the chosen one.
// - data-tag-format="USD" (any currency code), "percent", or "number" shows
//   the result formatted for the page's language.

import { each } from '../core.js';

function format(value, how) {
  const number = parseFloat(value);
  if (!how || Number.isNaN(number)) return String(value);
  const options = how === 'percent' ? { style: 'percent', maximumFractionDigits: 2 }
    : how === 'number' ? {} : { style: 'currency', currency: how };
  try {
    return new Intl.NumberFormat(document.documentElement.lang || undefined, options).format(number);
  } catch {
    return String(value); // an unknown currency code
  }
}

export function init(root) {
  each(root, 'output[for]', 'output', (output) => {
    const fields = output.getAttribute('for').split(/\s+/).map((id) => document.getElementById(id)).filter(Boolean);
    if (!fields.length) return;
    const product = output.dataset.tagCalc === 'product';
    const update = () => {
      const counted = fields.filter((field) => !/^(checkbox|radio)$/.test(field.type) || field.checked);
      let result;
      if (fields.length === 1) result = counted.length ? fields[0].value : 0;
      else {
        const numbers = counted.map((field) => parseFloat(field.value) || 0);
        result = Math.round(numbers.reduce((a, b) => (product ? a * b : a + b), product ? 1 : 0) * 1e6) / 1e6;
      }
      output.value = format(result, output.dataset.tagFormat);
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
