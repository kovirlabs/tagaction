import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

export const fileUrl = (path) => pathToFileURL(resolve(path)).href;

// Fixtures link the CDN URLs real pages use. Serve them from this checkout
// (TagAction) and from the pinned TagBrush.css dev dependency.
export async function open(page, fixture, { width = 1000, height = 800, scheme = 'light' } = {}) {
  await page.route(/cdn\.jsdelivr\.net\/npm\/tagaction@[^/]+\/tagaction(\.min)?\.js/, (route) =>
    route.fulfill({ path: 'tagaction.js', contentType: 'text/javascript' }));
  await page.route(/cdn\.jsdelivr\.net\/npm\/tagbrush@[^/]+\/tagbrush(\.min)?\.css/, (route) =>
    route.fulfill({ path: 'node_modules/tagbrush/tagbrush.css', contentType: 'text/css' }));
  await page.setViewportSize({ width, height });
  await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' });
  await page.goto(fileUrl(`tests/fixtures/${fixture}`));
  await page.waitForFunction(() => window.TagAction !== undefined || document.documentElement.dataset.nojs !== undefined).catch(() => {});
}
