import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { splitSections, headingIndex, headingId, plainText, headingInventory } from '../src/build/parse.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const content = readFileSync(path.join(ROOT, 'content', 'roadmap.md'), 'utf8');
const fixture = (name) => readFileSync(path.join(ROOT, 'tests', 'fixtures', 'md', name), 'utf8');

test('splits the real content into 24 sections in order with stable file names', () => {
  const { sections } = splitSections(content);
  assert.equal(sections.length, 24);
  assert.deepEqual(sections.map((s) => s.key), [...Array.from({ length: 20 }, (_, i) => String(i)), 'A', 'B', 'C', 'D']);
  assert.equal(sections[0].file, 's00.html');
  assert.equal(sections[19].file, 's19.html');
  assert.equal(sections[20].file, 'appendix-a.html');
  assert.equal(sections[23].slug, 'appendix-d');
  assert.equal(sections[12].titleText, 'Project ladder, hardware gates, and dated budgets');
  assert.equal(sections[12].headingText, '12. Project ladder, hardware gates, and dated budgets');
  assert.equal(sections[20].titleText, 'Documented compatibility matrix, not integration-tested (checked 20 October 2026)');
  assert.equal(sections[20].headingText.startsWith('Appendix A. '), true);
  assert.ok(!sections[0].body.includes('## Contents'), 'the Contents block is skipped');
  assert.ok(sections[0].body.startsWith('### Labels'));
  assert.ok(!/---\s*$/.test(sections[12].body), 'trailing rule stripped');
});

test('front matter = title line + the four opening paragraphs before Contents', () => {
  const { frontMatter } = splitSections(content);
  assert.equal(frontMatter.title, 'Physical AI, Robotics, and Autonomous Drones: A Verified Learning-and-Research Roadmap for Sudish');
  assert.ok(frontMatter.markdown.startsWith('# Physical AI'));
  const paragraphs = frontMatter.markdown.split(/\n\n+/).filter((p) => p.trim() && !p.startsWith('# '));
  assert.equal(paragraphs.length, 4);
  assert.ok(!frontMatter.markdown.includes('## Contents'));
  assert.ok(!/---\s*$/.test(frontMatter.markdown));
});

test('fails loudly when a section is missing, naming what was found', () => {
  assert.throws(() => splitSections(fixture('sections-missing.md')), /found: 0, 2/);
});

test('heading ids: N.M → sN-M, otherwise slug; de-duplicated', () => {
  assert.equal(headingId('12.1 Purchase rule'), 's12-1');
  assert.equal(headingId('5.4 Competency matrix'), 's5-4');
  assert.equal(headingId('Labels'), 'labels');
  assert.equal(headingId('F1. Data-efficient robot learning and real-world data quality'), 'f1-data-efficient-robot-learning-and-real-world-data-quality');
  assert.equal(headingId('F2. Vision-language-action (VLA) and generalist policies, including cross-embodiment transfer'), 'f2-vision-language-action-vla-and-generalist-policies-including-cross-embodiment', 'capped at 8 word tokens');
  const inv = headingInventory(fixture('headings.md'));
  assert.deepEqual(inv.map((h) => h.id), ['s12-1', 'labels', 'labels-2', 'f1-data-efficient-robot-learning-and-real-world-data-quality', 's11-1', 's18-2']);
  assert.equal(inv[4].text, '11.1 Documented-compatibility profile, not an integration-tested manifest');
  assert.equal(inv[5].text, '18.2 How physical AI could serve a Nobel domain [JUDGMENT]');
});

test('real content inventory: 89 h3 headings, §12 has six numbered subsections', () => {
  const { sections } = splitSections(content);
  const total = sections.reduce((a, s) => a + s.headings.length, 0);
  assert.equal(total, 89);
  assert.deepEqual(sections[12].headings.map((h) => h.id), ['s12-1', 's12-2', 's12-3', 's12-4', 's12-5', 's12-6']);
  const idx = headingIndex(sections);
  assert.ok(idx.get(14).has('s14-2'));
  assert.ok(idx.get(6).has('f1-data-efficient-robot-learning-and-real-world-data-quality'));
  assert.equal(idx.has(20), false);
  const allIds = sections.flatMap((s) => s.headings.map((h) => `${s.slug}#${h.id}`));
  assert.equal(new Set(allIds).size, allIds.length, 'ids unique per page');
});

test('plainText strips emphasis and link syntax', () => {
  assert.equal(plainText('**bold** and *em* and [link](https://x.org) and `code`'), 'bold and em and link and code');
});
