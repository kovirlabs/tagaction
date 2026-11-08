# Changelog

## 0.2.0 (2026-11-08)

Fixes from the family agent evaluation: `<output>` can multiply and format, and an empty table of contents stays hidden without JavaScript. Tested with TagBrush.css 1.2.0.

- `<output data-tag-calc="product">` multiplies the fields it lists (nights × nightly rate), leaving out unchecked checkboxes and radios, and `data-tag-format` shows the result as currency (`USD`), a percent, or a grouped number in the page's language. An agent in the family evaluation couldn't multiply and put the "$" outside the output.
- A `<nav data-tag-toc hidden>` is shown once it's filled, and so is a hidden element around it, so readers without JavaScript don't get an empty "On this page" menu. Write `hidden` on the nav (the guide, README, and demo do).
- `llms.txt` lists the file endings that make a link an image link for the viewer (`.jpg`, `.png`, …). An agent in the family evaluation linked a photo to an address without one, as TagKit's blog template did, and the viewer never opened.
- The demo page (the GitHub Pages site) wears the Tag family brand: the family bar, the shared theme from kovirlabs.github.io/tagstack/brand.css, and a footer linking the family.

## 0.1.0 (2026-11-06)

First version. Tested with TagBrush.css 1.1.0.

- Behaviors for `dialog`, `details`, `table`, `form`, `textarea`, `input type="file"`, `input type="password"`, `pre`, `time`, `nav` and `a`, `h2` and `h3`, `img`, `menu` and dropdown buttons, `output`, `abbr`, and `template` cloning.
- A fallback for the `commandfor`/`command` attributes in browsers without them.
- One `MutationObserver` enhances content added after load (htmx swaps, page scripts).
- `data-tagaction="off"` opts an element out.
- `llms.txt`, linked to the Tag family guide, plus a Claude Code skill, a Cursor rule, and an AGENTS.md section generated from it.
