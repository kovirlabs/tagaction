// Buttons that act on another element by id, with no page script:
//   <button commandfor="confirm" command="show-modal">Delete</button>
// This is the browser's own Invoker Commands API. Current browsers do it
// natively; this fills the gap in older ones by dispatching the same
// `command` event and running the built-in commands.

import { once } from '../core.js';

const supported = () => 'commandForElement' in HTMLButtonElement.prototype;

const builtIn = {
  'show-modal': (target) => target.open || target.showModal?.(),
  close: (target, button) => target.close?.(button.value),
  'request-close': (target, button) => (target.requestClose ? target.requestClose(button.value) : target.close?.(button.value)),
  'toggle-popover': (target) => target.togglePopover?.(),
  'show-popover': (target) => target.matches(':popover-open') || target.showPopover?.(),
  'hide-popover': (target) => target.matches(':popover-open') && target.hidePopover?.(),
};

export function init() {
  if (supported() || !once(document, 'command')) return;
  document.addEventListener('click', (event) => {
    const button = event.target.closest?.('button[commandfor]');
    if (!button || button.disabled || button.closest('[data-tagaction="off"]')) return;
    const target = document.getElementById(button.getAttribute('commandfor'));
    const command = (button.getAttribute('command') ?? '').toLowerCase();
    if (!target || !command) return;
    const commandEvent = new Event('command', { cancelable: true });
    commandEvent.command = command.startsWith('--') ? button.getAttribute('command') : command;
    commandEvent.source = button;
    if (target.dispatchEvent(commandEvent)) builtIn[command]?.(target, button);
  });
}
