// <dialog>: a modal closes when you click its backdrop.
// Opening from a button uses native commandfor/command (see command.js).
// A dialog with a closedby attribute is left to the browser.

import { each } from '../core.js';

export function init(root) {
  each(root, 'dialog:not([closedby])', 'dialog', (dialog) => {
    let pressedOnBackdrop = false;
    // Only a press that starts and ends on the backdrop counts, so selecting
    // text and releasing outside the dialog doesn't close it.
    const onBackdrop = (event) => {
      if (event.target !== dialog || !dialog.matches(':modal')) return false;
      const box = dialog.getBoundingClientRect();
      return event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom;
    };
    dialog.addEventListener('pointerdown', (event) => { pressedOnBackdrop = onBackdrop(event); });
    dialog.addEventListener('click', (event) => {
      // Keyboard "clicks" have no coordinates (0, 0); ignore them.
      if (event.detail === 0 || !pressedOnBackdrop || !onBackdrop(event)) return;
      if (dialog.requestClose) dialog.requestClose();
      else dialog.close();
    });
  });
}
