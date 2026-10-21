import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseArxiv, arxivIdFromUrl } from '../src/feed/parsers/arxiv.js';
import { parseAtomRss } from '../src/feed/parsers/atomrss.js';
import { parseRssProceedings } from '../src/feed/parsers/rss-proceedings.js';
import { reachabilityResult } from '../src/feed/parsers/reachability.js';
import { ParseError } from '../src/feed/http.js';
import { read, sourceById } from './helpers.js';

test('arXiv API Atom: ids without version, abs links, updated as the date, categories, summaries', () => {
  const { items, totalResults } = parseArxiv(read('arxiv-api-cs.RO.xml'));
  assert.equal(items.length, 10);
  assert.equal(totalResults, 100_000 > totalResults ? totalResults : totalResults, 'opensearch total parsed as a number');
  assert.ok(Number.isInteger(totalResults) && totalResults > 10);
  const first = items[0];
  assert.equal(first.arxivId, '2610.28632');
  assert.equal(first.url, 'https://arxiv.org/abs/2610.28632');
  assert.equal(first.title, 'Joints, Camera, Action! Co-Generating 3D Motion and Video for Arbitrary Rigs');
  assert.equal(first.date, '2026-10-20T17:59:56Z');
  assert.equal(first.updated, first.date);
  assert.ok(first.published);
  assert.ok(first.summary.startsWith('Video generation models can now depict remarkably realistic motion.'));
  assert.ok(first.categories.includes('cs.RO'));
  for (const it of items) assert.match(it.arxivId, /^\d{4}\.\d{4,5}$/);
  const thesis = parseArxiv(read('arxiv-q-thesis-narrow.xml'));
  assert.equal(thesis.items.length, 33);
  assert.equal(thesis.items[0].date, '2026-07-21T09:48:50Z');
  assert.equal(thesis.items[0].arxivId, '2607.13830', 'v2 stripped');
  assert.equal(parseArxiv(read('arxiv-q-aerial.xml')).items.length, 10);
  assert.equal(arxivIdFromUrl('http://arxiv.org/abs/2610.28632v1'), '2610.28632');
  assert.equal(arxivIdFromUrl('https://arxiv.org/pdf/2610.28632v3.pdf'), '2610.28632');
  assert.equal(arxivIdFromUrl('https://arxiv.org/abs/math/0601001v2'), 'math/0601001');
  assert.equal(arxivIdFromUrl('https://example.org/abs/1'), null);
  assert.throws(() => parseArxiv('<html><body>no</body></html>'), (e) => e instanceof ParseError && e.kind === 'xml');
  assert.throws(() => parseArxiv(''), ParseError);
});

test('GitHub releases Atom: titles, tag links, updated dates, HTML bodies', () => {
  const px4 = parseAtomRss(read('gh-releases-px4.xml'));
  assert.equal(px4.format, 'atom');
  assert.equal(px4.items.length, 4);
  assert.equal(px4.items[0].title, 'v1.18.0-rc1');
  assert.equal(px4.items[0].url, 'https://github.com/PX4/PX4-Autopilot/releases/tag/v1.18.0-rc1');
  assert.equal(px4.items[0].date, '2026-09-10T20:09:29Z');
  assert.match(px4.items[0].summary, /pre-release for flight testing/);
  const mujoco = parseAtomRss(read('gh-releases-mujoco.xml'));
  assert.deepEqual(mujoco.items.map((i) => i.title), ['3.16.0', '3.15.0', '3.14.0']);
  assert.deepEqual(mujoco.items.map((i) => i.date), ['2026-10-14T09:29:02Z', '2026-10-05T14:58:18Z', '2026-09-22T16:52:58Z']);
  const gz = parseAtomRss(read('gh-releases-gz-sim.xml'));
  assert.equal(gz.items.length, 3);
  assert.match(gz.items[0].summary, /Signed-off-by: Addisu Z\. Taddese/);
  for (const f of ['gh-releases-nav2.xml', 'gh-releases-ros2.xml', 'gh-releases-qgc.xml', 'gh-releases-mavsdk.xml']) {
    const r = parseAtomRss(read(f));
    assert.equal(r.items.length, 3, f);
    for (const it of r.items) { assert.ok(it.title, f); assert.match(it.url, /^https:\/\/github\.com\/.+\/releases\/tag\//, f); assert.ok(!Number.isNaN(Date.parse(it.date)), f); }
  }
});

test('RSS 2.0 (WordPress, Jekyll, Drupal, PMLR): titles, links, pubDate, description/content:encoded', () => {
  const cmu = parseAtomRss(read('cmu-ri.xml'));
  assert.equal(cmu.format, 'rss');
  assert.equal(cmu.items.length, 5);
  assert.equal(cmu.items[0].title, 'Bajcsy Awarded Packard Fellowship for Science and Engineering');
  assert.equal(cmu.items[0].url, 'https://www.ri.cmu.edu/bajcsy-awarded-packard-fellowship-for-science-and-engineering/');
  assert.equal(cmu.items[0].date, 'Thu, 15 Oct 2026 17:38:49 +0000');
  assert.match(cmu.items[0].summary, /Andrea Bajcsy/);
  const grasp = parseAtomRss(read('grasp-news.xml'));
  assert.equal(grasp.items.length, 5);
  assert.match(grasp.items[0].summary, /&#8230;|…/, 'the WordPress ellipsis entity reaches normalize as-is or decoded');
  const bair = parseAtomRss(read('bair-blog.xml'));
  assert.equal(bair.items.length, 3);
  assert.equal(bair.items[0].title, 'From CUDA to MLX: How K-Search Brings Decades of Kernel Expertise to Apple Silicon');
  assert.match(bair.items[0].url, /^https?:\/\/bair\.berkeley\.edu\/blog\/2026\/07\/29\//);
  const pmlr = parseAtomRss(read('pmlr-v305.xml'));
  assert.equal(pmlr.items.length, 5);
  assert.ok(pmlr.items.every((i) => i.date === 'Tue, 07 Oct 2025 00:00:00 +0000'));
  assert.ok(pmlr.items.every((i) => /^https:\/\/proceedings\.mlr\.press\/v305\/[a-z0-9]+\.html$/.test(i.url)));
  const nist = parseAtomRss(read('nist-news.xml'));
  assert.equal(nist.items.length, 5);
  assert.equal(nist.items[0].date, 'Fri, 16 Oct 2026 12:00:00 +0000');
  assert.match(nist.items[0].url, /^https:\/\/www\.nist\.gov\/news-events\/news\/2026\/10\//);
  assert.throws(() => parseAtomRss(read('rss22-index.html')), (e) => e instanceof ParseError && e.kind === 'xml');
  assert.throws(() => parseAtomRss('<?xml version="1.0"?><root><x/></root>'), (e) => e instanceof ParseError && e.kind === 'xml', 'XML without a feed or rss root');
  assert.throws(() => parseAtomRss(''), ParseError);
  assert.throws(() => parseAtomRss('{"json": true}'), ParseError);
  assert.deepEqual(parseAtomRss('<rss><channel><title>t</title></channel></rss>').items, [], 'a channel without items is an empty list, not an error');
});

test('RSS XXII index: paper links with the volume date and base URL; a page without paper links is a parse error', () => {
  const s = sourceById('rss-proceedings');
  const { items } = parseRssProceedings(read('rss22-index.html'), { baseUrl: s.url, volumeDate: s.volumeDate });
  assert.equal(items.length, 15);
  assert.equal(items[0].title, 'One-Shot Real-World Demonstration Synthesis for Scalable Bimanual Manipulation');
  assert.equal(items[0].url, 'https://www.roboticsproceedings.org/rss22/p001.html');
  assert.equal(items[1].url, 'https://www.roboticsproceedings.org/rss22/p002.html');
  assert.ok(items.every((i) => i.date === '2026-07-13T00:00:00Z' && i.summary === ''));
  assert.equal(new Set(items.map((i) => i.url)).size, 15);
  assert.throws(() => parseRssProceedings('<html><body>Moved</body></html>', { baseUrl: s.url, volumeDate: s.volumeDate }), (e) => e instanceof ParseError && e.kind === 'html');
  assert.throws(() => parseRssProceedings('', { baseUrl: s.url, volumeDate: 'July 2026' }), /volumeDate/);
});

test('reachability: 200 is ok, anything else failed, never items', () => {
  assert.deepEqual(reachabilityResult({ status: 200 }), { ok: true, httpStatus: 200, items: [] });
  assert.deepEqual(reachabilityResult({ status: 503 }), { ok: false, httpStatus: 503, items: [] });
  assert.deepEqual(reachabilityResult({}), { ok: false, httpStatus: null, items: [] });
});
