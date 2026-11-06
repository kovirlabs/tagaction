// Shared helpers for every behavior. The only state is a WeakMap of the
// behaviors each element already has, so init() can run any number of times.

const done = new WeakMap();

/** True the first time `name` is set up on `element`, false after that. */
export function once(element, name) {
  let names = done.get(element);
  if (!names) done.set(element, (names = new Set()));
  if (names.has(name)) return false;
  names.add(name);
  return true;
}

/** Elements matching `selector` in `root` (including root itself), minus opted-out ones. */
export function find(root, selector) {
  const list = root.matches?.(selector) ? [root] : [];
  if (root.querySelectorAll) list.push(...root.querySelectorAll(selector));
  return list.filter((element) => !element.closest('[data-tagaction="off"]'));
}

/** Run `setup` once per element matching `selector`. */
export function each(root, selector, name, setup) {
  for (const element of find(root, selector)) if (once(element, name)) setup(element);
}

/** Create an element: h('button', { type: 'button', 'data-tag': 'copy' }, 'Copy'). */
export function h(name, attributes = {}, text) {
  const element = document.createElement(name);
  for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, value);
  if (text != null) element.textContent = text;
  return element;
}

/** Controls that only work with JavaScript may carry `hidden` in the HTML; show them. */
export const reveal = (control) => control.removeAttribute('hidden');

/** Give an element an id if it has none, and return it. */
let counter = 0;
export function idFor(element, base = 'tag') {
  if (!element.id) {
    let id;
    do id = `${base}-${++counter}`; while (document.getElementById(id));
    element.id = id;
  }
  return element.id;
}

/** Add an id to an element's space-separated attribute list (aria-describedby and similar). */
export function addToken(element, attribute, token) {
  const tokens = (element.getAttribute(attribute) ?? '').split(/\s+/).filter(Boolean);
  if (!tokens.includes(token)) element.setAttribute(attribute, [...tokens, token].join(' '));
}

/** localStorage that fails quietly (private mode, blocked storage). */
export const store = {
  get(key) {
    try { return localStorage.getItem(key); } catch { return null; }
  },
  set(key, value) {
    try { localStorage.setItem(key, value); } catch { /* storage unavailable */ }
  },
};

/** Elements that can take keyboard focus, in document order. */
export const focusables = (container) => [...container.querySelectorAll(
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
)].filter((element) => !element.closest('[hidden]'));
