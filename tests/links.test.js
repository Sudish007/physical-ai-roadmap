import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { render, newStats } from '../src/build/md.js';
import { hostOf, linkKind } from '../src/build/links.js';
import { splitSections } from '../src/build/parse.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fixture = readFileSync(path.join(ROOT, 'tests', 'fixtures', 'md', 'links.md'), 'utf8');
const content = readFileSync(path.join(ROOT, 'content', 'roadmap.md'), 'utf8');

test('http(s) links get rel="noopener external", no target, and a domain hint without www', () => {
  const html = render(fixture, { label: 'fixture' });
  assert.ok(html.includes('<a href="https://www.example.org/book" rel="noopener external">the book</a><span class="dom">example.org</span>'));
  assert.ok(html.includes('<a href="https://doi.org/10.1017/9781316661239" rel="noopener external">a DOI</a><span class="dom">doi.org</span>'));
  assert.ok(html.includes('<strong><a href="http://sub.example.net/a(b)c" rel="noopener external">bold link <em>with em</em></a><span class="dom">sub.example.net</span></strong>'), 'bold + italic inside link text, balanced parentheses in the URL');
  assert.ok(!html.includes('target='));
});

test('the unpublished dossier links render as text + " (not published)" with no anchor', () => {
  const stats = newStats();
  const html = render(fixture, { label: 'fixture', stats });
  assert.ok(html.includes('The plan is <code>research-plan.md</code> (not published) and the ledger is claim-source-ledger.md (not published).'));
  assert.ok(!html.includes('physical-ai-roadmap-research-2026'));
  assert.equal(stats.unpublished, 2);
  assert.ok(html.includes('<a href="#top">top</a>'), 'other relative links are left alone');
});

test('helpers', () => {
  assert.equal(hostOf('https://www.ecb.europa.eu/stats/x.xml'), 'ecb.europa.eu');
  assert.equal(hostOf('not a url'), '');
  assert.equal(linkKind('https://x.org'), 'external');
  assert.equal(linkKind('physical-ai-roadmap-research-2026/evidence-audit.md'), 'unpublished');
  assert.equal(linkKind('#top'), 'other');
});

test('real content: exactly five unpublished dossier links, 497 http(s) links kept', () => {
  const { sections } = splitSections(content);
  const stats = newStats();
  let anchors = 0;
  for (const s of sections) {
    const html = render(s.body, { label: s.slug, headings: s.headings, stats });
    const rendered = (html.match(/<a href="http/g) || []).length;
    const inMarkdown = (s.body.match(/\]\(https?:\/\//g) || []).length;
    assert.equal(rendered, inMarkdown, `link parity in ${s.slug}`);
    anchors += rendered;
  }
  assert.equal(stats.unpublished, 5);
  assert.equal(anchors + 5, (content.match(/\]\((https?:\/\/|physical-ai-roadmap-research-2026\/)/g) || []).length);
});
