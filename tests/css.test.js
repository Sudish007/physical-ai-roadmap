import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const css = readFileSync(path.join(ROOT, 'assets', 'app.css'), 'utf8');
const stripped = css.replace(/\/\*[\s\S]*?\*\//g, '');

test('D2/D3 structure: no prefers-color-scheme, gradient, shadow, keyframes or animation in app.css', () => {
  for (const banned of ['prefers-color-scheme', 'gradient(', 'box-shadow', 'text-shadow', '@keyframes', 'animation:', 'transition:']) {
    assert.equal(stripped.includes(banned), false, `app.css contains ${banned}`);
  }
  assert.ok(stripped.includes('@media (prefers-reduced-motion: reduce)'));
  assert.ok(stripped.includes(':root[data-theme="dark"]'), 'the dark palette hangs off html[data-theme] only');
  assert.equal((stripped.match(/color-scheme:\s*light/g) || []).length, 1);
  assert.equal((stripped.match(/color-scheme:\s*dark/g) || []).length, 1);
});

test('D4 tokens: clamp gutter, fluid root font, no container max-width below 2200px', () => {
  assert.ok(stripped.includes('--gutter: clamp(16px, 3.5vw, 96px)'));
  assert.ok(stripped.includes('font-size: clamp(17px, 15.6px + 0.25vw, 22px)'));
  assert.ok(stripped.includes('--text-xs: max(12px, 0.75rem)'));
  assert.ok(stripped.includes('--control-h: 42px'));
  for (const m of stripped.matchAll(/(?<!\()max-width:\s*([\d.]+)(px|rem|ch|%)/g)) {
    const [, n, unit] = m;
    if (unit === 'px') assert.ok(Number(n) >= 2200, `max-width ${n}px caps the layout`);
    if (unit === 'rem') assert.ok(Number(n) * 22 >= 2200, `max-width ${n}rem caps the layout`);
  }
});

test('DR-1: data-cols rules 2..10 and the 13rem wide-table floor; bars default to width 0', () => {
  for (let n = 2; n <= 10; n++) {
    assert.ok(stripped.includes(`table.wide[data-cols="${n}"] { --cols: ${n}; }`), `data-cols ${n}`);
  }
  assert.ok(stripped.includes('table.wide { min-width: calc(var(--cols) * 13rem); }'));
  assert.equal(stripped.includes('* 15rem'), false, 'the mock 15rem factor is gone');
  assert.match(stripped, /\.bar > i \{[^}]*width: 0;/);
  assert.ok(stripped.includes('.check { display: inline-grid; place-items: center; width: 44px; height: 44px;'));
  assert.ok(stripped.includes('.check input { width: 22px; height: 22px;'));
});

test('breakpoints: nav strip and icon-only theme button below 860, rails from 1024/1440, card columns, best-10 five columns', () => {
  assert.ok(stripped.includes('@media (max-width: 859px)'));
  assert.match(stripped, /@media \(max-width: 859px\) \{[^}]*\.site-nav \{ display: none; \}/);
  assert.ok(stripped.includes('@media (min-width: 1024px) {\n  .layout { grid-template-columns: var(--rail-w) minmax(0, 1fr); }'));
  assert.ok(stripped.includes('@media (min-width: 1440px) {\n  .layout { grid-template-columns: var(--rail-w) minmax(0, 1fr) var(--rail-w); }'));
  assert.ok(stripped.includes('@media (min-width: 720px) { .cards { grid-template-columns: repeat(2, minmax(0, 1fr)); } }'));
  assert.ok(stripped.includes('@media (min-width: 1680px) { .cards { grid-template-columns: repeat(3, minmax(0, 1fr)); } }'));
  assert.ok(stripped.includes('@media (min-width: 2240px) { .cards { grid-template-columns: repeat(4, minmax(0, 1fr)); } }'));
  assert.ok(stripped.includes('@media (min-width: 2400px) { .cards.best-10 { grid-template-columns: repeat(5, minmax(0, 1fr)); } }'));
  assert.ok(stripped.includes('.theme-btn svg[data-mode="light"] .ic-light'));
  assert.ok(stripped.includes('.skip:focus'));
  assert.ok(stripped.includes('@media print'));
  assert.equal(stripped.includes('style='), false);
});
