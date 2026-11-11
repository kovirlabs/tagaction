// <form>:
// - Validation messages appear as text next to the field (in its <small> help
//   text, or a new <small>) instead of a bubble that disappears, with
//   aria-invalid and aria-describedby set. They clear as soon as the field is fixed.
// - The submit button is disabled and shows aria-busy while the form is sent.
// - A method="post" form with unsent changes warns before you leave the page.

import { each, h, idFor, addToken } from '../core.js';

const messages = new WeakMap(); // anchor element -> its message <small>
const helpText = new WeakMap(); // <small> -> its original help text

// Where a field's message goes: after the field, or after the label wrapping a
// checkbox or radio, or at the end of the fieldset holding a radio group.
function anchorFor(field) {
  if (field.type === 'radio') return field.closest('fieldset') ?? field.closest('label') ?? field;
  return field.closest('label:has(input:is([type="checkbox"], [type="radio"])), [data-tag="password"]') ?? field;
}

function messageFor(field) {
  const anchor = anchorFor(field);
  let small = messages.get(anchor);
  if (!small) {
    const next = anchor.nextElementSibling;
    if (!anchor.matches('fieldset') && next?.matches('small:not([data-tag])')) {
      small = next;
      helpText.set(small, small.textContent);
    } else {
      small = h('small', { 'data-tag': 'error' });
      if (anchor.matches('fieldset')) anchor.append(small);
      else anchor.after(small);
    }
    messages.set(anchor, small);
  }
  addToken(field, 'aria-describedby', idFor(small));
  return small;
}

function show(field) {
  const small = messageFor(field);
  const title = field.validity.patternMismatch && field.title ? ` ${field.title}` : '';
  small.textContent = field.validationMessage + title;
  small.setAttribute('data-tag', 'error');
  field.setAttribute('aria-invalid', 'true');
}

function clear(field) {
  if (field.getAttribute('aria-invalid') !== 'true') return;
  const group = field.type === 'radio' && field.form ? [...field.form.elements].filter((f) => f.name === field.name) : [field];
  if (!group.every((f) => f.validity.valid)) return;
  const small = messages.get(anchorFor(field));
  for (const f of group) f.removeAttribute('aria-invalid');
  if (!small) return;
  if (helpText.has(small)) {
    small.textContent = helpText.get(small);
    small.removeAttribute('data-tag');
  } else {
    small.textContent = '';
  }
}

function submitButton(form, submitter) {
  return submitter ?? form.querySelector('button:not([type]), button[type="submit"], input[type="submit"]');
}

export function init(root) {
  each(root, 'form', 'form', (form) => {
    let firstInvalid = null;
    let dirty = false;

    form.addEventListener('invalid', (event) => {
      const field = event.target;
      event.preventDefault(); // show the message on the page instead of a bubble
      show(field);
      if (!firstInvalid) {
        firstInvalid = field;
        // After every field has reported (each 'invalid' event runs its own microtasks).
        // Focus it in the middle of the window, clear of a sticky top bar
        // (WebKit's own focus scroll can stop under one).
        setTimeout(() => {
          firstInvalid.focus({ preventScroll: true });
          firstInvalid.scrollIntoView({ block: 'center' });
          firstInvalid = null;
        });
      }
    }, true);

    const recheck = (event) => clear(event.target);
    form.addEventListener('input', recheck);
    form.addEventListener('change', recheck);

    form.addEventListener('input', () => { dirty = true; });
    form.addEventListener('reset', () => { dirty = false; });

    form.addEventListener('submit', (event) => {
      dirty = false; // the changes are being sent (by the browser or a script)
      // Let every other submit handler (htmx, page scripts) run first.
      setTimeout(() => {
        if (event.defaultPrevented || form.method === 'dialog') return;
        if (form.target && form.target !== '_self') return;
        const button = submitButton(form, event.submitter);
        if (!button) return;
        button.disabled = true;
        button.setAttribute('aria-busy', 'true');
        const restore = () => { button.disabled = false; button.removeAttribute('aria-busy'); };
        // The page stays if the response is a download or a 204; re-enable then,
        // and when the page comes back from the back/forward cache.
        setTimeout(restore, 10000);
        addEventListener('pageshow', restore, { once: true });
      });
    });

    if (form.method === 'post') {
      addEventListener('beforeunload', (event) => {
        if (!dirty || !form.isConnected) return;
        event.preventDefault();
        event.returnValue = '';
      });
    }
  });
}
