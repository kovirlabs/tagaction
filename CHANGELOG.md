# Changelog

## Unreleased

### Fixed
- The Copy button on a `<pre>` no longer covers the code. A line too long for the block (the install line on the demo page) ran under the button, which sat over the end of the visible text ("defer" was hidden at 360px and 1280px). The `<pre>` now keeps a transparent 5rem end border for the button, instead of 5rem of end padding: its background shows through, but the code scrolls inside it, so it never passes under the button, at the start or scrolled to the end. The `<pre>` also scrolls sideways without a stylesheet.

## 0.2.0 (2026-11-12)

Behaviors for the patterns TagBrush.css gained (dropdowns from `<details>`, the phone menu), and things visitors expect on any site.

- A `<details>` dropdown in the page header's nav closes on Escape, on a click outside, and when a link in it is followed; arrow keys move through its links. A `<details>` anywhere else is left alone.
- A link to something inside a closed `<details>` (an FAQ answer) opens it, on load and when the `#fragment` changes.
- A popover holding links (a phone menu) closes when one is followed, so a link to a section on the same page isn't hidden behind the panel.
- Tabs: `role="tablist"` with `role="tab"` buttons and `aria-controls` panels. TagAction shows the selected panel, links each panel to its tab, and handles the arrow keys, Home, and End. Without JavaScript every panel shows.
- A light/dark switch, remembered across visits: `<select data-tag-theme>` (Auto, Light, Dark) or a toggle `<button data-tag-theme>`, setting `data-theme` on `<html>`.
- `command="--copy"` copies a field's value or any element's text; `command="--share"` opens the share sheet for a section's link or an `<a>`, and copies the link where there is no share sheet.
- `data-tag-match="password"` keeps a confirm field invalid, with a message, until it matches.
- A list a filter box controls, written with `hidden`, is a list of search results: it shows only while something is typed, with just the matches. TagKit's MkDocs theme uses it for search by page title.
- Fix: help text in a `<small>` after a password field sat inline beside the next label once the Show/Hide row wrapped the field (TagKit's sign-up page). It now stays under the row, muted, and turns red with the field.
- Columns of numbers line up on the right. TagAction already knew which columns hold numbers for sorting; it now marks their header and cells `data-tag="num"`, and its own sheet sets `text-align: end` and tabular figures. TagBrush.css only aligned a cell holding a lone `<data>`, so a "Customers" column (42, 118) sat on the left beside a right-aligned "Revenue", and no header lined up with its numbers. Dates (`<time>`) and labels such as "Q1" or "#1042" are not numbers; amounts with a sign before the currency ("−$5.00") or in accounting parentheses ("($5.00)") are. Rows added later (a `--clone` row, an htmx swap) line up in the columns already marked, and a table that starts empty is checked when rows arrive. An `align` attribute or the page's own `text-align` wins.
- The saved light/dark choice is applied the moment the script runs instead of at `DOMContentLoaded`. A deferred script runs after the first paint on long pages, so a dark page flashed light first. The guide says to load the script in `<head>` without `defer` on a page with a theme switch; the demo does.
- Ctrl+Enter (⌘+Enter on a Mac) in a `<textarea>` sends its form with `requestSubmit()`, so validation and other submit handlers run. It does nothing while an input method is composing text (`isComposing`, or `keyCode` 229 for Safari), following the modern-web-guidance `ime-safe-enter-submit` guide.
- `command="--remove"` removes the element its `commandfor` names, so every row added with `--clone` can be taken out again (ids in copies are already renumbered). Focus moves to the previous row, or the Add button, or the next row. Write the button `hidden`, in the template and in rows written in the page; TagAction shows it.
- A filter box that matches nothing says so: a `role="status"` line after the table or list reads "No matches for “x”" instead of leaving an empty table, and otherwise tells screen readers how many rows show ("3 of 12 shown") while staying out of sight. The count is written after a 400 ms pause in typing, so it isn't announced on every keystroke.
- A dropdown list in a nav stays on screen: it is anchored to its button with CSS anchor positioning and flips up or to the other side near an edge, where `position-area` is supported (otherwise it keeps its place under the button).
- Keyboard shortcuts from `aria-keyshortcuts`: the key it names focuses a field (`"/"` for search) or clicks a button (`"Control+K Meta+K"`). Keys without Control, Alt, or Meta are ignored while you type in a field; hidden and disabled elements are skipped.
- `<input type="file" accept="image/*">` shows a thumbnail of each chosen picture in its file list (object URLs, revoked when the choice changes).
- A filter box with a `name` starts from `?name=…` in the address and keeps it up to date with `history.replaceState`, so a filtered table survives a reload and can be shared. Without a `name` the address is left alone.
- Filter matches are highlighted with the CSS Custom Highlight API (`::highlight(tagaction-match)`, the theme's highlight color with an underline), without changing the page's HTML; browsers without it show no highlight (modern-web-guidance `highlight-text-ranges`).
- Select all: a checkbox in a `<thead>` cell checks or clears the checkboxes in its column for every shown row (rows a filter hides are left alone), is indeterminate when only some are checked, and Shift-click on a row's box sets the range from the last one clicked. Rows added later count. A header cell holding a control no longer gets wrapped in a sort button.
- Printing opens every closed `<details>` (header-nav dropdowns excepted), name groups included, so a printed FAQ has its answers; they close again after printing.
- Tabs: hidden panels use `hidden="until-found"` where supported, so find-in-page reaches their text and `beforematch` selects their tab; a link to a panel or to anything in it selects its tab, on load and when the `#fragment` changes.
- The first invalid field is scrolled to the middle of the window when it's focused, so a sticky top bar (TagBrush.css's `<header data-layout="sticky">`) never covers it; WebKit's own focus scroll can stop a few pixels under one.
- Under `data-tag-remember`, a table with an `id` keeps its sort column and direction across visits, as `<details>` keep their open state.
- The image viewer steps through a set: pictures in the same `<figure>`, or else the same `<section>`, get Previous and Next buttons, a "2 of 5" count, and the arrow keys. A picture on its own is unchanged.
- Size: about 10 KB gzipped. The ceiling is now 15 KB: coverage matters more than bytes, as for TagBrush.css, and the size is reported in each release.

Fixes from the family agent evaluation: `<output>` can multiply and format, and an empty table of contents stays hidden without JavaScript. Tested with TagBrush.css 1.2.0.

- `<output data-tag-calc="product">` multiplies the fields it lists (nights × nightly rate), leaving out unchecked checkboxes and radios, and `data-tag-format` shows the result as currency (`USD`), a percent, or a grouped number in the page's language. An agent in the family evaluation couldn't multiply and put the "$" outside the output.
- A `<nav data-tag-toc hidden>` is shown once it's filled, and so is a hidden element around it, so readers without JavaScript don't get an empty "On this page" menu. Write `hidden` on the nav (the guide, README, and demo do).
- `llms.txt` says where validation messages go (after a checkbox's `<label>`, at the end of a radio group's `<fieldset>`) and that the `maxlength` counter follows help text. The sign-up agent in the family evaluation had to guess.
- `llms.txt` lists the file endings that make a link an image link for the viewer (`.jpg`, `.png`, …). An agent in the family evaluation linked a photo to an address without one, as TagKit's blog template did, and the viewer never opened.
- The demo page (the GitHub Pages site) wears the Tag family brand: the family bar, the shared theme from kovirlabs.github.io/tagstack/brand.css, and a footer linking the family.

## 0.1.0 (2026-11-06)

First version. Tested with TagBrush.css 1.1.0.

- Behaviors for `dialog`, `details`, `table`, `form`, `textarea`, `input type="file"`, `input type="password"`, `pre`, `time`, `nav` and `a`, `h2` and `h3`, `img`, `menu` and dropdown buttons, `output`, `abbr`, and `template` cloning.
- A fallback for the `commandfor`/`command` attributes in browsers without them.
- One `MutationObserver` enhances content added after load (htmx swaps, page scripts).
- `data-tagaction="off"` opts an element out.
- `llms.txt`, linked to the Tag family guide, plus a Claude Code skill, a Cursor rule, and an AGENTS.md section generated from it.
