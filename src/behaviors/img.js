// <img>: click to see it larger, in a modal <dialog>.
// - A link around an image that points to an image file
//   (<a href="photo-large.jpg"><img src="photo.jpg" alt="…"></a>) opens the
//   file in the viewer. Without JavaScript the link still opens the file.
// - An image in a <figure> that is shown smaller than its real size opens
//   in the viewer too. It becomes focusable so the keyboard can open it.
// - Pictures in the same <figure>, or else the same <section>, form a set:
//   the viewer has Previous and Next buttons, and the arrow keys step
//   through the set.
// Lazy loading is native (loading="lazy" works in every current browser), so
// TagAction leaves it to the browser.

import { each, h } from '../core.js';

const IMAGE_FILE = /\.(avif|gif|jpe?g|png|svg|webp)(\?.*)?$/i;

// Everything the viewer can show, in document order: [element, src getter].
const viewables = new Map();

function setOf(element) {
  const all = [...viewables.keys()].filter((item) => item.isConnected && (item.dataset.tag === 'zoom' || item.matches('a')));
  for (const container of [element.closest('figure'), element.closest('section')]) {
    const members = container ? all.filter((item) => container.contains(item)) : [];
    if (members.length > 1) return members.sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
  }
  return [element];
}

function view(element) {
  const set = setOf(element);
  let index = set.indexOf(element);
  const dialog = h('dialog', { 'data-tag': 'viewer' });
  const form = h('form', { method: 'dialog' });
  form.append(h('button', { 'aria-label': 'Close' }, '✕'));
  const figure = h('figure');
  const picture = h('img');
  figure.append(picture);
  const show = (step) => {
    index = (index + step + set.length) % set.length;
    const item = set[index];
    const image = item.matches('img') ? item : item.querySelector('img');
    picture.src = viewables.get(item)();
    picture.alt = image.alt;
    dialog.setAttribute('aria-label', image.alt || 'Image');
    figure.querySelector('figcaption')?.remove();
    const caption = image.closest('figure')?.querySelector('figcaption');
    if (caption) figure.append(caption.cloneNode(true));
    if (counter) counter.textContent = `${index + 1} of ${set.length}`;
  };
  let counter = null;
  if (set.length > 1) {
    const previous = h('button', { type: 'button', 'aria-label': 'Previous picture' }, '←');
    const next = h('button', { type: 'button', 'aria-label': 'Next picture' }, '→');
    counter = h('output', { 'aria-live': 'polite' });
    previous.addEventListener('click', () => show(-1));
    next.addEventListener('click', () => show(1));
    form.prepend(counter, previous, next);
    dialog.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); show(event.key === 'ArrowLeft' ? -1 : 1); }
    });
  }
  show(0);
  dialog.append(form, figure);
  dialog.addEventListener('close', () => dialog.remove());
  // A click on the picture or the backdrop closes the viewer; the buttons don't.
  dialog.addEventListener('click', (event) => { if (event.detail && !event.target.closest('form') && event.target.closest('figure, dialog')) dialog.close(); });
  document.body.append(dialog);
  dialog.showModal();
}

const shrunk = (image) => image.naturalWidth > image.clientWidth * 1.2 || image.naturalHeight > image.clientHeight * 1.2;

export function init(root) {
  each(root, 'a[href]:has(> img:only-child)', 'zoom-link', (link) => {
    if (!IMAGE_FILE.test(new URL(link.href).pathname)) return;
    link.setAttribute('aria-haspopup', 'dialog');
    viewables.set(link, () => link.href);
    link.addEventListener('click', (event) => {
      if (event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return; // new tab etc.
      event.preventDefault();
      view(link);
    });
  });

  each(root, 'figure img', 'zoom', (image) => {
    if (image.closest('a, button, dialog')) return;
    const setup = () => {
      if (!shrunk(image)) return;
      image.tabIndex = 0;
      image.setAttribute('data-tag', 'zoom');
    };
    if (image.complete) setup();
    else image.addEventListener('load', setup, { once: true });
    viewables.set(image, () => image.currentSrc || image.src);
    const open = () => image.dataset.tag === 'zoom' && view(image);
    image.addEventListener('click', open);
    image.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open(); }
    });
  });
}
