# CLAUDE.md

Guidance for Claude Code working in kovirlabs/tagaction and the wider Tag family.

## What this project is

TagAction is a tiny, no-build JavaScript library that makes semantic HTML tags behave the way people expect on a web page. It is the companion to TagBrush (classless CSS). See the Tag Family Ecosystem Spec for the full plan, including TagCheck and TagKit.

## Non-negotiable rules

- Progressive enhancement: every page must remain usable with JavaScript disabled. Never hide content or controls that only work with JS unless TagAction reveals them.
- No build step for users. Ship one plain ES file plus a minified copy. No runtime dependencies.
- Do not reimplement native browser behavior. Use native details, dialog, and popover; only fill gaps.
- No new template syntax, reactive state, or components. Do not add v-if style directives.
- Hooks, in order of preference: native elements and attributes, then ARIA attributes, then `data-tag*` attributes. Never add CSS classes as API.
- Opt-out per element with `data-tagaction="off"`.
- Do not bundle htmx or add server fetch-and-swap behavior. Do not add client-side HTML includes; those belong in TagKit at build time.
- Do not add JavaScript to TagBrush. TagBrush must stay CSS-only.
- Stay within the size budget enforced in CI.

## Behaviors in scope (v1)

dialog, details, table, form, textarea, input type=file, input type=password, pre/code, time, nav and a, h2/h3, img, menu or button-controlled lists, output, abbr, and template cloning. Details for each are in the spec, section 5.2.

## Architecture

- One module per behavior, each exporting `init(root)` that is idempotent (safe to call twice on the same element).
- A single entry point auto-initializes on DOMContentLoaded.
- A single MutationObserver calls behavior `init` on added subtrees, so content inserted by htmx or any other library is enhanced.
- No global state beyond a WeakSet or WeakMap tracking initialized elements.

## Accessibility

- Full keyboard support for every interactive behavior.
- Keep ARIA states accurate (aria-sort, aria-expanded, aria-current, aria-controls).
- Respect prefers-reduced-motion.
- Any UI TagAction injects (copy buttons, password toggles, counters) must be labeled and meet WCAG AA contrast with TagBrush in light and dark schemes.

## AI-facing documentation

- llms.txt is the source of truth for agent-facing docs. Generated instruction files (Claude Code skill, Cursor rule, AGENTS.md) are built from it; never edit generated files by hand.
- Every feature must be explainable in llms.txt in a few lines.
- Every snippet and attribute in llms.txt must exist and be covered by tests; CI fails on drift.
- Each README starts with a one-sentence "Use this when" statement.

## Testing

- Run the full test suite before every commit.
- Each behavior needs browser tests covering mouse, keyboard, and dynamic insertion.
- No-JS test: pages must stay usable with scripts disabled.
- Run TagCheck (when available) against demo and eval pages.
- Agent evaluations follow the TagBrush evals pattern: fresh agents with only llms.txt build pages, then automated checks score them.

## Workflow

- Small, focused PRs, one behavior or concern each, with a CHANGELOG entry.
- Update README, llms.txt, and demo page in the same PR as the feature.
- Document tested TagBrush versions in each release.
- When unsure whether something belongs in TagAction, TagBrush, TagCheck, or TagKit, check the spec and ask before building.
