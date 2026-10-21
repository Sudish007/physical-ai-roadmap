// Build orchestration and output: content/roadmap.md → <out>.tmp/ → swap into <out>/ (default dist/).
// Any error leaves the previous output untouched.
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { splitSections, headingIndex } from './parse.js';
import { createPlainMd, parse, renderTokens, render, renderInline, newStats } from './md.js';
import { assertExceptionsPresent } from './crossref.js';
import { legendFromTables, LEGEND_ORDER, countLabels } from './labels.js';
import { extractTables } from './tables.js';
import { buildManifest, manifestSummary } from './manifest.js';
import { buildHomeData } from './home-data.js';
import { buildPlanData } from './plan-data.js';
import { indexTokens, titleRecord, assertIndexSize } from './search-index.js';
import { sectionPage, homePage, planPage, feedPage, notFoundPage } from './templates.js';

export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

/** Everything the pages need, computed in memory (no disk writes). */
export function buildSite(markdown) {
  assertExceptionsPresent(markdown);
  const { frontMatter, sections } = splitSections(markdown);
  const plainMd = createPlainMd();
  const s0 = sections[0];
  const legendMap = legendFromTables(extractTables(s0.body, plainMd, 'section 0'));
  const legend = LEGEND_ORDER.map((k) => legendMap[k]);
  const { manifest, rowIndex, setsBySection } = buildManifest(sections, plainMd);
  const hIndex = headingIndex(sections);
  const stats = newStats();
  const dataEnv = () => ({ label: 'data', headingIndex: hIndex, legend: legendMap });

  const pages = new Map(); // file → html
  const search = [];
  let h3Count = 0;

  sections.forEach((s, i) => {
    const env = { label: `section ${s.key}`, headingIndex: hIndex, legend: legendMap, headings: s.headings, rows: rowIndex.get(s.slug), stats };
    const tokens = parse(s.body, env);
    const proseHtml = renderTokens(tokens, env);
    h3Count += s.headings.length;
    const page = { file: s.file, key: s.key, title: s.headingText };
    search.push(titleRecord(page));
    let frontMatterHtml = null;
    if (i === 0 && frontMatter.markdown) {
      const fmEnv = { label: 'front matter', headingIndex: hIndex, legend: legendMap, demoteH1: true, stats };
      const fmTokens = parse(frontMatter.markdown, fmEnv);
      frontMatterHtml = renderTokens(fmTokens, fmEnv);
      for (const r of indexTokens({ ...page }, fmTokens, 'Front matter')) search.push({ ...r, a: 'front-matter' });
    }
    search.push(...indexTokens(page, tokens));
    pages.set(s.file, sectionPage({
      section: s,
      sections,
      headingHtml: renderInline(s.headingMarkdown, dataEnv()),
      proseHtml,
      frontMatterHtml,
      legend,
      sets: (setsBySection.get(s.slug) || []).map((set) => (set.kind === 'answers' ? { ...set, label: 'Answers (§4)' } : set)),
      prev: i > 0 ? sections[i - 1] : null,
      next: i + 1 < sections.length ? sections[i + 1] : null,
    }));
  });

  const sourceLabels = countLabels(markdown);
  if (stats.chips !== sourceLabels) {
    throw new Error(`Rendered ${stats.chips} label chips but the source has ${sourceLabels} bracket labels`);
  }

  const home = buildHomeData(sections, plainMd, (s) => renderInline(s, dataEnv()));
  const planData = buildPlanData(sections, plainMd, (s) => renderInline(s, dataEnv()));
  pages.set('index.html', homePage({ home, manifest }));
  pages.set('plan.html', planPage());
  pages.set('feed.html', feedPage());
  pages.set('404.html', notFoundPage());

  const searchJson = JSON.stringify(search);
  assertIndexSize(searchJson);

  return {
    pages,
    files: {
      'search-index.json': searchJson,
      'tracker-manifest.json': JSON.stringify(manifest, null, 1),
      'plan-data.json': JSON.stringify(planData),
    },
    manifest,
    home,
    planData,
    search,
    stats,
    counts: { pages: pages.size, h3: h3Count, chips: stats.chips, searchRecords: search.length },
    sections,
  };
}

async function copyDir(src, dest) {
  await fs.mkdir(dest, { recursive: true });
  for (const entry of await fs.readdir(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) await copyDir(s, d);
    else await fs.copyFile(s, d);
  }
}

async function dirBytes(dir) {
  let total = 0;
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) total += await dirBytes(p);
    else total += (await fs.stat(p)).size;
  }
  return total;
}

export function summaryLine(site, bytes) {
  const c = site.counts;
  return `pages ${c.pages} · h3 ${c.h3} · chips ${c.chips} · crossrefs ${site.stats.crossrefs.rewritten} rewritten / ${site.stats.crossrefs.skipped.length} skipped · manifest ${manifestSummary(site.manifest)} · search ${c.searchRecords} records · bytes ${bytes}`;
}

/**
 * Build and write the site.
 * @param {{ out?: string, root?: string, content?: string }} options
 */
export async function writeSite(options = {}) {
  const root = options.root || REPO_ROOT;
  const out = path.resolve(options.out || path.join(root, 'dist'));
  const tmp = `${out}.tmp`;
  const contentPath = options.content || path.join(root, 'content', 'roadmap.md');
  const markdown = await fs.readFile(contentPath, 'utf8');
  const site = buildSite(markdown);

  await fs.rm(tmp, { recursive: true, force: true });
  await fs.mkdir(tmp, { recursive: true });
  for (const [file, html] of site.pages) await fs.writeFile(path.join(tmp, file), html, 'utf8');
  for (const [file, text] of Object.entries(site.files)) await fs.writeFile(path.join(tmp, file), text, 'utf8');
  await fs.writeFile(path.join(tmp, '.nojekyll'), '', 'utf8');
  await copyDir(path.join(root, 'assets'), path.join(tmp, 'assets'));
  await fs.copyFile(path.join(root, 'favicon.svg'), path.join(tmp, 'favicon.svg'));
  await fs.mkdir(path.join(tmp, 'data'), { recursive: true });
  for (const f of ['feed.json', 'meta.json']) await fs.copyFile(path.join(root, 'data', f), path.join(tmp, 'data', f));
  const bytes = await dirBytes(tmp);

  await fs.rm(out, { recursive: true, force: true });
  await fs.rename(tmp, out);
  return { site, out, bytes, summary: summaryLine(site, bytes) };
}
