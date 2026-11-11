// <input type="password">: a Show/Hide button beside the field. The field goes
// back to hidden characters when the form is sent, so password managers still
// see a password field. Help text in a <small> after the field ends up after
// the row the field now sits in, and the injected styles keep it under the row.

import { each, h, idFor } from '../core.js';

export function init(root) {
  each(root, 'input[type="password"]', 'password', (input) => {
    let group = input.parentElement;
    if (!group?.matches('[role="group"]')) {
      group = h('div', { role: 'group', 'data-tag': 'password' });
      input.before(group);
      group.append(input);
    }
    const button = h('button', {
      type: 'button',
      class: 'outline',
      'data-tag': 'reveal',
      'aria-pressed': 'false',
      'aria-controls': idFor(input),
      'aria-label': 'Show password',
    }, 'Show');
    input.after(button);
    const set = (visible) => {
      input.type = visible ? 'text' : 'password';
      button.setAttribute('aria-pressed', String(visible));
      button.textContent = visible ? 'Hide' : 'Show';
    };
    button.addEventListener('click', () => set(input.type === 'password'));
    input.form?.addEventListener('submit', () => set(false));
  });
}
