// <img>: click to see it larger, in a modal <dialog>.
// - A link around an image that points to an image file
//   (<a href="photo-large.jpg"><img src="photo.jpg" alt="…"></a>) opens the
//   file in the viewer. Without JavaScript the link still opens the file.
// - An image in a <figure> that is shown smaller than its real size opens
//   in the viewer too. It becomes focusable so the keyboard can open it.
// Lazy loading is native (loading="lazy" works in every current browser), so
// TagAction leaves it to the browser.

import { each, h } from '../core.js';

const IMAGE_FILE = /\.(avif|gif|jpe?g|png|svg|webp)(\?.*)?$/i;

function view(src, image) {
  const dialog = h('dialog', { 'data-tag': 'viewer', 'aria-label': image.alt || 'Image' });
  const form = h('form', { method: 'dialog' });
  form.append(h('button', { 'aria-label': 'Close' }, '✕'));
  const figure = h('figure');
  figure.append(h('img', { src, alt: image.alt }));
  const caption = image.closest('figure')?.querySelector('figcaption');
  if (caption) figure.append(caption.cloneNode(true));
  dialog.append(form, figure);
  dialog.addEventListener('close', () => dialog.remove());
  // A click anywhere outside the close button closes the viewer.
  dialog.addEventListener('click', (event) => { if (event.target.closest('figure, dialog') && event.detail) dialog.close(); });
  document.body.append(dialog);
  dialog.showModal();
}

const shrunk = (image) => image.naturalWidth > image.clientWidth * 1.2 || image.naturalHeight > image.clientHeight * 1.2;

export function init(root) {
  each(root, 'a[href]:has(> img:only-child)', 'zoom-link', (link) => {
    if (!IMAGE_FILE.test(new URL(link.href).pathname)) return;
    link.setAttribute('aria-haspopup', 'dialog');
    link.addEventListener('click', (event) => {
      if (event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return; // new tab etc.
      event.preventDefault();
      view(link.href, link.querySelector('img'));
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
    const open = () => image.dataset.tag === 'zoom' && view(image.currentSrc || image.src, image);
    image.addEventListener('click', open);
    image.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open(); }
    });
  });
}
