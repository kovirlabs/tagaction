// Styles for the few things TagAction adds to a page (copy buttons, sort
// buttons, anchor links, counters). In a cascade layer and :where(), so any
// page or TagBrush.css rule wins. TagBrush.css variables are used when present.

const CSS = `@layer tagaction {
:where([data-tag="code"]) { position: relative; }
:where([data-tag="code"] > pre) { padding-inline-end: 5rem; }
:where([data-tag="copy"]) { position: absolute; top: 0.4rem; right: 0.4rem; margin: 0; padding: 0.15rem 0.6rem; font-size: 0.8rem; line-height: 1.5; background: var(--color-surface, Canvas); }
:where(:has(> [data-tag="dropdown"])) { position: relative; }
:where([data-tag="dropdown"]:not([hidden])) { position: absolute; z-index: 10; top: 100%; right: 0; min-width: 12rem; margin: 0.25rem 0 0; padding: 0.5rem; display: flex; flex-direction: column; align-items: stretch; gap: 0.25rem; list-style: none; background: var(--color-surface, Canvas); border: 1px solid var(--color-border, GrayText); border-radius: var(--border-radius, 0.5rem); box-shadow: 0 8px 24px rgb(0 0 0 / 0.15); }
:where([data-tag="num"]:not([align])) { text-align: end; font-variant-numeric: tabular-nums; }
:where([data-tag="filter-status"]:not([data-tag-empty])) { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
:where([data-tag="filter-status"][data-tag-empty]) { padding-block: 0.5rem; color: var(--color-text-muted, GrayText); }
@supports (position-area: block-end) {
:where(:has(> [data-tag="dropdown"])) { anchor-scope: --tag-dropdown; }
:where(:has(> [data-tag="dropdown"]) > [aria-controls][aria-expanded]) { anchor-name: --tag-dropdown; }
:where([data-tag="dropdown"]:not([hidden])) { position: fixed; position-anchor: --tag-dropdown; inset: auto; position-area: block-end span-inline-start; position-try-fallbacks: flip-inline, flip-block, flip-block flip-inline; }
}
::highlight(tagaction-match) { background-color: var(--color-highlight, Mark); color: var(--color-text, MarkText); text-decoration: underline; }
:where([data-tag="sort"]) { all: unset; display: inline-flex; align-items: center; gap: 0.35em; cursor: pointer; font: inherit; color: inherit; text-align: inherit; }
:where([data-tag="sort"]):focus-visible { outline: 2px solid var(--color-primary, Highlight); outline-offset: 2px; border-radius: 2px; }
:where([data-tag="sort"])::after { content: "↕" / ""; opacity: 0.45; font-size: 0.85em; }
:where([aria-sort="ascending"] > [data-tag="sort"])::after { content: "↑" / ""; opacity: 1; }
:where([aria-sort="descending"] > [data-tag="sort"])::after { content: "↓" / ""; opacity: 1; }
:where([data-tag="anchor"]) { margin-inline-start: 0.35em; color: var(--color-text-muted, GrayText); text-decoration: none; font-weight: normal; opacity: 0; }
:where(:hover > [data-tag="anchor"], [data-tag="anchor"]:focus-visible) { opacity: 1; }
@media (hover: none) { :where([data-tag="anchor"]) { opacity: 1; } }
:where([data-tag="count"], [data-tag="files"]) { display: block; text-align: end; color: var(--color-text-muted, GrayText); }
:where([data-tag="files"]) { text-align: start; }
:where([data-tag="thumb"]) { display: inline-block; width: auto; height: 3rem; max-width: 6rem; margin: 0.25rem 0.5rem 0.25rem 0; object-fit: cover; vertical-align: middle; border-radius: var(--border-radius, 0.25rem); }
:where([data-tag="count"][data-tag-low]) { color: var(--color-error, #b91c1c); }
:where([data-tag="error"]) { display: block; color: var(--color-error, #b91c1c); }
:where([data-tag="password"]:has(+ small)) { margin-bottom: 0; }
:where([data-tag="password"] + small) { display: block; margin-top: var(--spacing-xs, 0.25rem); margin-bottom: var(--spacing-md, 1rem); color: var(--color-text-muted, GrayText); }
:where([data-tag="password"]:has([aria-invalid="true"], :user-invalid) + small) { color: var(--color-error, #b91c1c); }
:where([data-tag="abbr"]) { font-size: inherit; color: var(--color-text-muted, inherit); }
:where([data-tag-drop]) { outline: 2px dashed var(--color-primary, Highlight); outline-offset: 2px; }
:where(img[data-tag="zoom"]) { cursor: zoom-in; }
:where(abbr[title][tabindex]) { cursor: help; }
:where([data-tag="viewer"]) { max-width: 95vw; max-height: 95vh; padding: 0.5rem; }
:where([data-tag="viewer"] form) { display: flex; justify-content: end; margin: 0; }
:where([data-tag="viewer"] figure) { margin: 0; cursor: zoom-out; }
:where([data-tag="viewer"] img) { display: block; max-width: 100%; max-height: 80vh; margin: auto; object-fit: contain; }
}`;

// An adopted stylesheet comes after the page's stylesheets, so the tagaction
// layer is ordered after TagBrush.css's layer, and unlayered page CSS still
// wins over both. It also works under a Content-Security-Policy that blocks
// inline <style>.
export function addStyles() {
  try {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(CSS);
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
  } catch {
    const style = document.createElement('style');
    style.setAttribute('data-tagaction', 'styles');
    style.textContent = CSS;
    document.head.append(style);
  }
}
