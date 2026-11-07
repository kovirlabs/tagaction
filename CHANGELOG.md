# Changelog

## Unreleased

- Tested with TagBrush.css 1.2.0.
- `llms.txt` lists the file endings that make a link an image link for the viewer (`.jpg`, `.png`, …). An agent in the family evaluation linked a photo to an address without one, as TagKit's blog template did, and the viewer never opened.
- The demo page (the GitHub Pages site) wears the Tag family brand: the family bar, the shared theme from kovirlabs.github.io/tagstack/brand.css, and a footer linking the family.

## 0.1.0 (2026-11-06)

First version. Tested with TagBrush.css 1.1.0.

- Behaviors for `dialog`, `details`, `table`, `form`, `textarea`, `input type="file"`, `input type="password"`, `pre`, `time`, `nav` and `a`, `h2` and `h3`, `img`, `menu` and dropdown buttons, `output`, `abbr`, and `template` cloning.
- A fallback for the `commandfor`/`command` attributes in browsers without them.
- One `MutationObserver` enhances content added after load (htmx swaps, page scripts).
- `data-tagaction="off"` opts an element out.
- `llms.txt`, linked to the Tag family guide, plus a Claude Code skill, a Cursor rule, and an AGENTS.md section generated from it.
