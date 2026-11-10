# TagAction

Use TagAction when you want plain semantic HTML to behave the way people expect (sortable tables, copy buttons on code, dialogs that open from a button) with one script tag, no classes, and no page script.

```html
<script src="https://cdn.jsdelivr.net/npm/tagaction@0/tagaction.min.js" defer></script>
```

TagAction is the companion to [TagBrush.css](https://github.com/kovirlabs/tagbrush), the classless stylesheet. TagBrush makes HTML look finished; TagAction makes it act finished. Each works without the other, and they look best together.

- **Progressive enhancement.** Every page works with JavaScript off. TagAction only adds behavior.
- **No new syntax.** It keys off native elements and attributes first, then ARIA attributes, then a few `data-tag-*` attributes. No classes, no templating, no components, no reactive state.
- **Fills gaps, doesn't replace the browser.** Native `<details>`, `<dialog>`, `popover`, and `commandfor` do their own work.
- **Works with htmx and anything else.** Content added after load is enhanced automatically.
- **Small.** One file, no dependencies, about 9 KB gzipped.

## What it does

| HTML | Behavior | Hook |
| --- | --- | --- |
| `<dialog>` | A modal closes on a backdrop click. Opens from a button with no script. | native `commandfor` / `command`; `closedby` opts out |
| `<details>` | One open at a time; remembers open state; opens when a link points inside it; in the header nav, a dropdown that closes on Escape, a click outside, or a chosen link | native `name`; `data-tag-remember`; `#fragment` links; `<li><details>` in a header `<nav>` |
| `<table>`, lists | Click a header to sort; columns of numbers line up on the right; filter from a search box; a list written `hidden` is search results | `<thead>`; `aria-sort`; `<input aria-controls>` |
| `<form>` | Messages under the fields; busy submit button; unsaved-changes warning; a confirm field must match | native validation; `method="post"`; `data-tag-match` |
| `<textarea>` | Grows as you type; character counter | no `rows`; `maxlength` |
| `<input type="file">` | Lists chosen files; drag and drop | `multiple`; its `<label>` |
| `<input type="password">` | Show/Hide button | automatic |
| `<pre>` | Copy button | automatic |
| `<time>` | Reader's timezone; "3 hours ago" | `datetime` with a zone; `data-tag-time="relative"` |
| `<nav>`, `<a>` | `aria-current="page"`; follows the scroll in a table of contents | automatic |
| `<h2>`, `<h3>` | "#" links; generated table of contents | `id`; `<nav data-tag-toc hidden>` |
| `<img>` | Click to enlarge | a link to an image file; a shrunk image in `<figure>` |
| `<menu>`, dropdowns | Arrow keys, Escape, click outside; a popover of links closes when one is followed | `<button aria-expanded aria-controls>`; popover menus |
| Tabs | Shows the selected panel; arrow keys, Home, End | `role="tablist"`, `role="tab"` with `aria-controls` |
| Theme | Light/dark switch, remembered (load the script without `defer` so the saved scheme applies before the first paint) | `<select data-tag-theme>` or `<button data-tag-theme>` |
| Copy, share | Copy any field or element; share a link or section | `<button commandfor command="--copy">`, `command="--share"` |
| `<output>` | Live value, total, or product; currency and percent formatting | native `for`; `data-tag-calc="product"`, `data-tag-format="USD"` |
| `<abbr>` | Title shown on tap | `title` |
| `<template>` | Add repeated rows | `<button commandfor command="--clone">` |

[`llms.txt`](llms.txt) has the exact HTML for each one. It is the short, complete guide, written for people and for AI agents.

## Examples

A modal with no script:

```html
<button commandfor="confirm" command="show-modal">Delete</button>
<dialog id="confirm">
  <form method="dialog">
    <p>Delete this file?</p>
    <button value="cancel">Cancel</button>
    <button value="ok">Delete</button>
  </form>
</dialog>
```

A table you can sort and filter:

```html
<input type="search" aria-label="Filter orders" aria-controls="orders" hidden>
<table id="orders">
  <thead><tr><th>Customer</th><th>Total</th></tr></thead>
  <tbody>
    <tr><td>Maya Lin</td><td><data value="1240">$1,240.00</data></td></tr>
    <tr><td>Bo Ito</td><td><data value="18">$18.00</data></td></tr>
  </tbody>
</table>
```

The filter box carries `hidden` because it only works with JavaScript; TagAction shows it. Any control that needs TagAction can do the same.

A dropdown that still works without JavaScript (the list simply stays open):

```html
<button aria-expanded="false" aria-controls="account">Account</button>
<ul id="account">
  <li><a href="/profile">Profile</a></li>
  <li><a href="/logout">Sign out</a></li>
</ul>
```

## Opting out

`data-tagaction="off"` on any element turns TagAction off for it and everything inside it. On `<html>` it turns TagAction off for the page. On a `<th>` it keeps that column from sorting.

## Content added later

A single `MutationObserver` enhances anything added to the page, including htmx swaps. To enhance content yourself (inside a shadow root, for example), call:

```js
TagAction.init(element);
```

`init` is safe to call any number of times on the same content.

## Browser support

Current Chrome, Edge, Firefox, and Safari. Where a browser lacks `commandfor`, exclusive `<details name>`, or CSS `field-sizing`, TagAction fills the gap.

## Tested with

TagAction 0.2.0 is tested with TagBrush.css 1.2.0 (0.1.0 was tested with 1.1.0). The unreleased changes are tested with TagBrush.css 1.2.0; tabs look best with the tab styles in the next TagBrush.css release.

## Development

```sh
npm install
npm run build   # src/ → tagaction.js, tagaction.min.js, ai/ instruction files
npm test        # Playwright: Chromium, Firefox, WebKit
```

- `src/behaviors/` has one module per behavior. Each exports an idempotent `init(root)`.
- `llms.txt` is the source of truth for agent docs; `ai/` is generated from it. Don't edit `ai/` by hand.
- The tests check every behavior with mouse, keyboard, and content added later; the pages with JavaScript off; that `llms.txt` only documents what exists; contrast of everything TagAction inserts, in light and dark mode; and the size budget.

## License

Apache-2.0
