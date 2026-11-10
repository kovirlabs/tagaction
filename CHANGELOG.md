# Changelog

## Unreleased

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
- Size: about 9 KB gzipped. The ceiling is now 15 KB: coverage matters more than bytes, as for TagBrush.css, and the size is reported in each release.

## 0.2.0 (2026-11-08)

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
