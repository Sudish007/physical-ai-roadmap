import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { render } from '../src/build/md.js';
import { headingInventory } from '../src/build/parse.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fixture = readFileSync(path.join(ROOT, 'tests', 'fixtures', 'md', 'headings.md'), 'utf8');

test('h3 ids, anchor class and copy pill come from the inventory; duplicates are de-duplicated', () => {
  const headings = headingInventory(fixture);
  const html = render(fixture, { label: 'fixture', headings });
  assert.ok(html.includes('<h3 id="s12-1" class="anchor-h">12.1 Purchase rule<a class="copy" href="#s12-1" aria-label="Link to 12.1 Purchase rule">link</a></h3>'));
  assert.ok(html.includes('<h3 id="labels" class="anchor-h">Labels<a class="copy" href="#labels" aria-label="Link to Labels">link</a></h3>'));
  assert.ok(html.includes('<h3 id="labels-2" class="anchor-h">Labels<a class="copy" href="#labels-2"'));
  assert.ok(html.includes('<h3 id="f1-data-efficient-robot-learning-and-real-world-data-quality" class="anchor-h">F1. Data-efficient'));
  assert.ok(html.includes('<h3 id="s11-1" class="anchor-h">11.1 Documented-compatibility profile, <strong>not an integration-tested manifest</strong><a class="copy" href="#s11-1" aria-label="Link to 11.1 Documented-compatibility profile, not an integration-tested manifest">link</a></h3>'));
  assert.ok(html.includes('aria-label="Link to 18.2 How physical AI could serve a Nobel domain [JUDGMENT]"'), 'aria-label keeps the plain heading text');
  assert.equal((html.match(/<h3 /g) || []).length, 6);
  assert.equal((html.match(/class="copy"/g) || []).length, 6);
});

test('an inventory that does not match the body fails the build instead of mis-assigning ids', () => {
  const headings = headingInventory(fixture).slice(0, 2);
  assert.throws(() => render(fixture, { label: 'fixture', headings }), /Heading inventory out of sync at h3 #3/);
});

test('a markdown h1 is demoted to a plain h3 in front-matter mode (no pill, no id)', () => {
  const html = render('# Report title\n\nBody.', { label: 'front', demoteH1: true });
  assert.ok(html.includes('<h3>Report title</h3>'));
  assert.ok(!html.includes('class="copy"'));
  assert.ok(!html.includes('<h1'));
});
