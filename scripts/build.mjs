// Builds the distributable files from src/:
//   tagaction.js       readable, one plain script (no modules, no dependencies)
//   tagaction.min.js   minified
//   ai/…               agent instruction files generated from llms.txt
//
// Users never run this; it only exists for maintainers. Run with `npm run build`.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { build } from 'esbuild';

const root = new URL('../', import.meta.url);
const read = (file) => readFileSync(new URL(file, root), 'utf8');
const write = (file, contents) => {
  mkdirSync(new URL(file.slice(0, file.lastIndexOf('/') + 1) || './', root), { recursive: true });
  writeFileSync(new URL(file, root), contents);
};

const { version } = JSON.parse(read('package.json'));
const tested = JSON.parse(read('package.json')).devDependencies.tagbrush;
const banner = `/*! TagAction v${version} | Apache-2.0 | https://github.com/kovirlabs/tagaction | tested with TagBrush.css ${tested} */`;

// The injected stylesheet is a template string; squeeze its whitespace.
const minifyCssString = {
  name: 'minify-css-string',
  setup(builder) {
    builder.onLoad({ filter: /src[\\/]styles\.js$/ }, ({ path }) => ({
      contents: readFileSync(path, 'utf8').replace(/`@layer[\s\S]*?`/, (css) => css.replace(/\s*\n\s*/g, '').replace(/\s*([{}:;,>])\s*/g, '$1').replace(/;}/g, '}')),
      loader: 'js',
    }));
  },
};

for (const [file, minify] of [['tagaction.js', false], ['tagaction.min.js', true]]) {
  const result = await build({
    entryPoints: [new URL('src/index.js', root).pathname],
    bundle: true,
    format: 'iife',
    target: ['es2022'],
    minify,
    legalComments: 'none',
    write: false,
    banner: { js: banner },
    plugins: [minifyCssString],
  });
  write(file, result.outputFiles[0].text.replace('__VERSION__', version));
}

// Instruction files for AI coding agents, generated from llms.txt so every
// agent gets the same, tested guidance (see tests/llms.spec.mjs).
const guide = read('llms.txt').trim();
const generated = '<!-- Generated from llms.txt by scripts/build.mjs. Do not edit directly. -->';
const agentFiles = {
  'ai/claude/tagaction/SKILL.md': [
    '---',
    'name: tagaction',
    'description: Add TagAction, a tiny script that makes semantic HTML behave as expected (sortable tables, copy buttons on code, password show/hide, dialogs opened from buttons, dropdown menus, live outputs). Use when writing plain HTML pages that need small interactive touches without a framework, often alongside TagBrush.css.',
    '---',
    '',
    generated,
    '',
    guide,
  ].join('\n'),
  'ai/cursor/tagaction.mdc': [
    '---',
    'description: How to write HTML that TagAction enhances (native elements and ARIA attributes, no classes, no page script)',
    'globs: ["**/*.html", "**/*.htm", "**/*.njk", "**/*.liquid", "**/*.md"]',
    'alwaysApply: false',
    '---',
    '',
    generated,
    '',
    guide,
  ].join('\n'),
  'ai/AGENTS.md': [generated, '', guide.replace(/^(#+) /gm, '#$1 ')].join('\n'),
};
for (const [file, contents] of Object.entries(agentFiles)) write(file, contents + '\n');

for (const file of ['tagaction.js', 'tagaction.min.js']) {
  const source = readFileSync(new URL(file, root));
  console.log(`${file.padEnd(18)} ${(source.length / 1024).toFixed(1)} KB, ${(gzipSync(source, { level: 9 }).length / 1024).toFixed(2)} KB gzipped`);
}
