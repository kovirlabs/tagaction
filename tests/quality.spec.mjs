import { test, expect } from '@playwright/test';
import { readFileSync, readdirSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { open, fileUrl } from './helpers.mjs';

const chromiumOnly = () => test.skip(test.info().project.name !== 'chromium', 'Checked once, in Chromium');
const source = () => readdirSync('src/behaviors').map((f) => readFileSync(`src/behaviors/${f}`, 'utf8')).join('\n') + readFileSync('src/core.js', 'utf8');
const guide = () => readFileSync('llms.txt', 'utf8');
const FIXTURES = readdirSync('tests/fixtures').filter((f) => f.endsWith('.html'));

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  for (const fixture of FIXTURES) {
    test(`${fixture}: all content is visible and nothing is hidden for JS`, async ({ page }) => {
      await page.route(/tagbrush@[^/]+\/tagbrush(\.min)?\.css/, (route) => route.fulfill({ path: 'node_modules/tagbrush/tagbrush.css', contentType: 'text/css' }));
      await page.goto(fileUrl(`tests/fixtures/${fixture}`));
      // Lists that a dropdown button controls stay visible without TagAction.
      for (const list of await page.locator('button[aria-controls]').evaluateAll((els) => els.map((e) => e.getAttribute('aria-controls')))) {
        const target = page.locator(`#${list}`);
        if (await target.count()) await expect(target).toBeVisible();
      }
      // Only things that need TagAction may be hidden: --clone, --remove, --copy and
      // --share buttons, filter boxes with aria-controls, theme switches, and
      // tables of contents (empty until filled).
      // A list a hidden search box controls is a results list, also JS-only.
      const hidden = await page.locator('body [hidden]').evaluateAll((els) => els
        .filter((e) => !(e.id && document.querySelector(`[hidden][aria-controls="${e.id}"]`)))
        .map((e) => e.outerHTML.slice(0, 80)));
      for (const html of hidden) expect(html).toMatch(/command="--(clone|remove|copy|share)"|aria-controls=|data-tag-toc|data-tag-theme/);
    });
  }
});

test.describe('llms.txt contract', () => {
  test('every data-tag attribute llms.txt mentions is implemented', () => {
    const attributes = new Set([...guide().matchAll(/\b(data-tag[a-z-]*)/g)].map((m) => m[1]));
    expect(attributes.size).toBeGreaterThanOrEqual(4);
    const code = source();
    const asDataset = (name) => name.replace(/^data-/, '').replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    const missing = [...attributes].filter((name) => !code.includes(name) && !code.includes(asDataset(name)));
    expect(missing).toEqual([]);
  });

  test('every custom command llms.txt mentions is implemented', () => {
    const commands = new Set([...guide().matchAll(/command="(--[a-z-]+)"/g)].map((m) => m[1]));
    expect(commands.size).toBeGreaterThan(0);
    expect([...commands].filter((command) => !source().includes(`'${command}'`))).toEqual([]);
  });

  test('llms.txt does not mention classes, and generated agent files match it', () => {
    expect(guide()).not.toMatch(/class="/);
    const text = guide().trim();
    expect(readFileSync('ai/claude/tagaction/SKILL.md', 'utf8')).toContain(text);
    expect(readFileSync('ai/cursor/tagaction.mdc', 'utf8')).toContain(text);
  });

  test('every HTML snippet in llms.txt runs without errors, and is enhanced', async ({ page }) => {
    chromiumOnly();
    const snippets = [...guide().matchAll(/`(<[a-z][^`]*>)`/g)].map((m) => m[1]).filter((html) => html.includes('</'));
    expect(snippets.length).toBeGreaterThan(10);
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    // Example images in the snippets don't exist; only script errors count.
    page.on('console', (message) => { if (message.type() === 'error' && !message.text().startsWith('Failed to load resource')) errors.push(message.text()); });
    await open(page, 'blank.html');
    const unchanged = await page.evaluate((snippets) => snippets.filter((html) => {
      const main = document.querySelector('main');
      main.dataset.tagaction = 'off';
      main.innerHTML = `<section>${html}</section><h2 id="snippet-heading">Heading</h2>`;
      const before = main.innerHTML;
      delete main.dataset.tagaction;
      window.TagAction.init(main);
      return main.innerHTML.replace(/<a[^>]*data-tag="anchor"[^>]*>#<\/a>/, '') === before;
    }), snippets);
    expect(errors).toEqual([]);
    // Snippets for behaviors that only listen for events (dialogs, popover
    // menus, details groups and remembered state, sort keys, shortcuts) don't change the HTML.
    expect(unchanged.filter((html) => !/<dialog|popover|<details|<menu|<template|^<data |aria-keyshortcuts/.test(html))).toEqual([]);
  });
});

test.describe('accessibility of inserted UI', () => {
  // Contrast of every element TagAction inserts, against what's behind it.
  const contrastProblems = (page) => page.evaluate(() => {
    const parse = (color) => {
      const canvas = document.createElement('canvas').getContext('2d');
      canvas.fillStyle = color;
      canvas.fillRect(0, 0, 1, 1);
      return [...canvas.getImageData(0, 0, 1, 1).data];
    };
    const luminance = ([r, g, b]) => [r, g, b].map((v) => v / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
      .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
    const background = (element) => {
      for (let node = element; node; node = node.parentElement) {
        const color = parse(getComputedStyle(node).backgroundColor);
        if (color[3] > 0) return color;
      }
      return parse(getComputedStyle(document.documentElement).backgroundColor);
    };
    return [...document.querySelectorAll('[data-tag]:not([data-tag="code"], [data-tag="password"], [data-tag="viewer"])')]
      .filter((element) => element.textContent.trim() && element.getClientRects().length)
      .map((element) => {
        const style = getComputedStyle(element);
        const fg = luminance(parse(style.color));
        const bg = luminance(background(element));
        const ratio = (Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05);
        return { tag: element.dataset.tag, ratio: Math.round(ratio * 100) / 100 };
      })
      .filter(({ ratio }) => ratio < 4.5);
  });

  for (const scheme of ['light', 'dark']) {
    test(`inserted text meets WCAG AA with TagBrush.css in ${scheme} mode`, async ({ page }) => {
      chromiumOnly();
      await open(page, 'form.html', { scheme });
      await page.getByRole('button', { name: 'Create account' }).click();
      await page.getByLabel('Bio').fill('x'.repeat(38));
      await page.getByLabel('Documents').setInputFiles([{ name: 'a.txt', mimeType: 'text/plain', buffer: Buffer.from('a') }]);
      expect(await contrastProblems(page)).toEqual([]);
      await open(page, 'widgets.html', { scheme });
      await page.locator('abbr').click();
      await page.locator('h1').hover();
      expect(await contrastProblems(page)).toEqual([]);
      await open(page, 'table.html', { scheme });
      expect(await contrastProblems(page)).toEqual([]);
    });
  }

  test('every inserted control has an accessible name', async ({ page }) => {
    for (const fixture of ['form.html', 'widgets.html', 'table.html', 'nav.html']) {
      await open(page, fixture);
      const unnamed = await page.locator('button[data-tag], a[data-tag]').evaluateAll((controls) =>
        controls.filter((control) => !(control.getAttribute('aria-label') || control.textContent.trim())).map((c) => c.outerHTML));
      expect(unnamed).toEqual([]);
    }
  });

  test('injected styles respect prefers-reduced-motion (no animations or transitions)', () => {
    expect(readFileSync('src/styles.js', 'utf8')).not.toMatch(/animation|transition/);
  });
});

test.describe('size budget', () => {
  // Coverage matters more than bytes (as for TagBrush.css); this ceiling only
  // catches accidental bloat. Report the size in each release.
  const BUDGET = 15 * 1024;
  test(`tagaction.min.js is at most ${BUDGET / 1024} KB gzipped`, () => {
    chromiumOnly();
    expect(gzipSync(readFileSync('tagaction.min.js'), { level: 9 }).length).toBeLessThanOrEqual(BUDGET);
  });
});
