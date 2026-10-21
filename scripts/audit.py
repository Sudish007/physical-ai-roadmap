"""Browser audit of the built site (port of .agents/tasks/site-build/shots/mock-audit.py).

Driven by scripts/verify.mjs (`npm run verify`), which serves dist/ and passes --base. Direct use:

    python scripts/audit.py --base http://127.0.0.1:8790/physical-ai-roadmap/ --pages index,s12 \
        [--extra-pages s00,s01] [--widths 320,390,2560] [--themes light,dark] \
        [--shots <prefix> [--shot-pages index,s12,plan,feed] [--shot-extras s03:1920:light]] [--report <path>]

Generic checks run for every page x width x theme with all <details> opened: horizontal overflow, body
font size, smallest visible text, content box ratio, composited WCAG contrast, control heights, gutters,
footer text, [style] attribute count before scripts, securitypolicyviolation events, wide-table min-width
(DR-1). Pages given with --pages also get: the DR-3 dark-emulated first paint (index, plan, s12), the DR-4
theme cycle at 390 and 1440, and their page-type GROUPS. Specials run once per audit unless --no-specials:
keyboard navigation (s11), print at 1440 (s12), reading-position restore (s06), search (index at 1440
and 390), the tracker round trip s12 -> index -> s12 (+ s04 answers) and the My plan behaviours (prompt,
export, import, reset). Pages given with --extra-pages get the generic checks only (verify.mjs --all).

Later FEATs append page-type checks: GROUPS["index"].append(fn) where fn(page, width, theme, ctx) returns a
list of Check dicts (see `check()`); `ctx.page` is the live Playwright page, `ctx.name` the page name.
"""
import argparse
import datetime
import html as html_mod
import json
import os
import pathlib
import re
import sys
import tempfile
import traceback
import urllib.parse

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

from playwright.sync_api import sync_playwright  # noqa: E402  (after the stdout reconfigure)

DEFAULT_WIDTHS = [320, 360, 390, 820, 1024, 1440, 1920, 2560]
HEIGHTS = {320: 568, 360: 740, 390: 844, 820: 1180, 1024: 768, 1440: 900, 1920: 1080, 2560: 1440}
SHOT_VIEWPORTS = [(390, 844, 1), (1440, 900, 1), (1920, 1080, 1), (2560, 1440, 0.75)]
# FEAT-007: the committed screenshot set = SHOT_PAGES x SHOT_VIEWPORTS x --themes plus one extra shot per
# SHOT_EXTRAS entry ("<page>:<width>:<theme>"); every PNG is viewport-only and <= SHOT_MAX_SIDE px per side.
SHOT_PAGES = ["index", "s12", "plan", "feed"]
SHOT_EXTRAS = "s03:1920:light"
SHOT_MAX_SIDE = 1920
DEFAULT_THEMES = ["light", "dark"]
FOOTER_TEXT = "Sudish Kumar · sudish.dev · GitHub repository · Evidence cutoff 20 Oct 2026 · Not legal advice"
THEME_KEY = "physical-ai-roadmap.v1.theme"
FIRST_PAINT_PAGES = ["index", "plan", "s12"]
THEME_CYCLE_WIDTHS = [390, 1440]
KEYS_PAGE = "s11"
KEYS_NEXT_PAGE = "s12"
PRINT_PAGE = "s12"
PRINT_WIDTH = 1440
LAUNCH_ARGS = ["--disable-lcd-text"]  # OF-7: grayscale antialiasing so prose colour is measurable
THRESHOLDS = {
    "noOverflow": "documentElement.scrollWidth <= clientWidth (all <details> open)",
    "bodyFont": ">=17px at <=390; 21..22.5px at 2560",
    "minFont12": "smallest visible text >= 12px (display:none, visibility:hidden, <2px boxes and opacity 0 excluded)",
    "contentRatio88": "content box of .page.layout / main.page >= 0.88 x innerWidth at >=1920",
    "contrastAA": "every composited text/background pair >= 4.5 (>= 3.0 for >=24px or bold >=18.66px)",
    "controls40to44": "button, text/date/number/search input, select, .search-box, .check between 40 and 44px tall",
    "gutters": "padding-inline of the main .page equals clamp(16px, 3.5vw, 96px) +-0.5px",
    "footerText": "footer textContent == '" + FOOTER_TEXT + "'",
    "noStyleAttrs": "querySelectorAll('[style]').length == 0 when readyState becomes interactive (before module scripts)",
    "noCspViolations": "0 securitypolicyviolation events during the page's checks",
    "wideMinWidth": "computed min-width of every table.wide == data-cols x 13 x root font-size (+-0.5px)",
    "firstPaintLight": "prefers-color-scheme: dark + empty storage: data-theme light at <body>, computed color-scheme light, background #ffffff",
    "themeCycle": "t x3 then click x3: aria-label Light->Dark->System->Light, html[data-theme] and svg[data-mode] follow, visible .label at >=860",
    "keys": "] on s11 lands on s12.html, [ returns; / focuses #search; Esc leaves it",
    "print": "emulate print at 1440: header and rails display none; every table.wide scrollWidth <= its .table-wrap clientWidth",
    "layoutColumns": "section grid tracks: 3 at >=1440, 2 at 1024..1439, 1 below",
    "proseMeasure": "computed max-width of .prose > p <= 80ch",
    "proseColour": "OF-7: text nodes in .prose paragraphs/lists outside links, chips, kbd have the body colour, which equals the --fg token",
    "copyHidden": "OF-10: every .anchor-h .copy has opacity 0 at rest",
    # FEAT-003: home composition (index group)
    "heroHalves": "OF-5: .hero-grid has two children with text; two columns (2 distinct left edges) at >=1440, stacked below",
    "legendOnce": "D5/OF-5: 'Labels used throughout' occurs exactly once in the body text",
    "heroNoVerified": "OF-4: .hero text has no 'verified'",
    "titleNoVerified": "OF-4: document.title has no 'verified' (index, plan, feed, 404)",
    "best10Titles": "DR-2: the ten .cards.best-10 h3 texts start with 'N. <title>' for the fixed DR-2 list",
    "best10Geometry": "OF-8: .cards.best-10 columns (distinct left edges) 1 <720, 2 <1680, 3 <2240, 4 <2400, 5 at >=2400; exactly 2 rows at 2560",
    "cardsGeometry": "D4: .cards columns 1/2/3/4 at <720/720/1680/2240 (sessions 7 cards; tracks min(3, cols))",
    "cutoffCount": "D5: 'Evidence cutoff' exactly twice on index (hero + footer) and once outside the content elsewhere",
    "siteNameOnce": "D1/D5: the site name occurs once outside the content (the .wordmark)",
    "overallWording": "DR-9: progress line 'Overall N of M items (plan months are counted once a plan is chosen).'",
    "feedWidget": "D6: #latest-feed lists real items or 'No feed items yet'; note 'Feed last updated <formatLastUpdated>. GitHub may delay or skip scheduled runs.'",
    # FEAT-003: section-page behaviours (section group)
    "kicker": "kicker matches ^(Section \\d+ of 24|Appendix [A-D] · part \\d+ of 24)$",
    "legendChips": "D6: details.legend present with 5 chips in the summary and 5 definitions",
    "copyFocus": "OF-10: the first .anchor-h .copy has opacity 0 at rest and 1 after focus()",
    "onPageCount": "right-rail and inline 'On this page' link counts == .prose h3.anchor-h count",
    "scrollspy": "after scrollIntoView of the third h3 (or the last when fewer), its rail link has aria-current=true within 500 ms and no other does",
    "prevNext": "<link rel=prev|next> and the .prevnext links resolve (HEAD 200) and match",
    "linkParity": "OF-7: .prose a[href^=http] count == markdown http link count of the section (verify.mjs --link-counts)",
    "codeCopy": "Decision 11: every .prose pre has a client-added Copy button (40-44px); on s17 clicking it puts the block's text in the clipboard and the label reads Copied",
    "copyLink": "clicking an .anchor-h .copy pill on s17 copies location without fragment + #id, sets the hash, and flashes 'Copied' then 'link'",
    # FEAT-003: specials
    "readingPosition": "Decision 3: s06 scrollTo 1500, leave, return without a fragment -> scrollY within +-50px; with a fragment the heading wins",
    "search": "/ focuses #search (opens the box below 860px); 'quadrotor' -> >=1 group; ArrowDown/Up move focus; Esc closes and leaves; Enter opens the first hit on a page containing the term",
    # FEAT-004: My plan (plan group, fixture state 10 h / Track B / start today-14 d / weeks 1-2 logged 10+8 h)
    "planStats": "stat cards read 'Week 3 of 104 …', 'Month 1 W1–4 · 40 h planned (10 h plan)', 'Quarter 1 <§15.3 emphasis>', '20 h expected so far (2 completed weeks × 10 h)', '18 h logged · −2 h behind'; prompt card hidden; 10 h and B pressed",
    "planMonthCurrent": "the 24-row month list marks month 1 aria-current=true; the 'This month' card shows month 1 (W1–4) with the plan-10h box",
    "planBudget": "quarter budget table == the §15.3 Q1 row of the 10 h plan: F 50, P 10, B 35, E 8, W 12, C 5, R 10, Total 130 (labels from the §15.3 'Columns:' sentence)",
    "planGate": "Gate Q1 (W13) foundations: 5 clause boxes s15:gates:q1:1..5 plus the one gate box s15:gates:q1 (Decision 7)",
    "planLog": "hours log: the week input defaults to the current week (3); entries 'Week 1 10 h' and 'Week 2 8 h' listed",
    "trackGroup": "OF-9/DR-4: the four .track-group buttons share one top at >=1024; exactly two distinct tops with two buttons each below 1024",
    "checkSize": "OF-2: every visible label.check is 44x44 and its native checkbox 22x22 (plan, index, section pages)",
    # FEAT-004: specials
    "trackerRoundTrip": "D6/OF-2: tick Rung 0 on s12 -> rail 'Rungs 1 of 9', tr[data-done], both inputs checked -> index rungs row '1 of 9', overall 1 of 122 -> 10 h plan + month 1 ticked: plan row '1 of 24', overall 2 of 146 -> back on s12 the box is still checked",
    "answersCount": "Decision 21: with two non-empty plan.answers the s04 rail reads 'Answers (§4) 2 of 18' and the inline summary ' · Answers 2 of 18'",
    "planPrompt": "empty storage at 1440: prompt card rendered, its quote == the §4 Q7 rule text of plan-data.json; stat grid and the empty left plan column not rendered (computed display); no month rows, no digits in the stat values; the §4 questions span the full grid width in two columns (9 rows for 18 questions)",
    "planExport": "Export JSON downloads physical-ai-roadmap-export-<YYYY-MM-DD>.json with version 1, keys tracker/plan/triage and the fixture plan",
    "planImportInvalid": "a version-2 file and a non-JSON file each show #plan-msg.error and leave localStorage byte-identical",
    "planImportMerge": "a valid file after confirm(): imported entries overwrite (track C, rung 3 added), the rest stays (10 h, start date, rung 0)",
    "planReset": "Reset after confirm(): tracker/plan/triage keys absent, theme key kept, prompt card visible again",
    # FEAT-005: Feed page with the real data/feed.json + data/meta.json (feed group)
    "feedItemGeometry": "OF-1: in every .feed-item no two child boxes (h3, .meta, .summary, .triage) intersect and the title's left edge equals the item's content edge",
    "feedActions": "OF-11: the three triage buttons share one top at the title's top and sit right of the title at >=1440; three distinct tops right of the content at 820..1439; below the meta row under 820",
    "healthSummary": "DR-9: details.health summary matches /^■ ok \\d+ · □ empty \\d+ · ✕ failed \\d+ · \\d+ sources · details$/ (a space after each glyph)",
    "unavailableRows": "D6: every meta source with status failed renders a health row and a notices entry reading 'Unavailable since <date> · <error class>'; no other row does",
    "summaryEllipsis": "DR-9: no .summary text ends with '...' or exceeds 300 characters",
    "protocolCard": "DR-5/OF-6: table.protocol has exactly 3 tbody rows, every td text is a cell string of the §17.1 table (no added numbers), and the month-end line links s17.html#s17-1",
    "lastUpdated": "D9: [data-last-updated] equals formatLastUpdated(meta.generatedAt) ('D MMM YYYY, HH:mm UTC') and the page says 'GitHub may delay or skip scheduled runs'",
    "feedFirstFive": "D6: the first five items' title, source and date texts equal data/feed.json's five newest items (publishedAt desc, id)",
    "feedStatusLine": "'Showing N of N items in the window.' with N = feed.json items; triage counts 0 with a clean storage",
    # FEAT-005: specials (feed at 1440, light)
    "feedClassFilter": "clicking Class 'Releases' shows exactly the release items of feed.json (ids and order) and the status line counts them; 'All' restores",
    "feedQueryFilter": "clicking Query 'Aerial autonomy' shows exactly the items whose matchedQuery or alsoMatched carries the label; clicking it again clears the filter",
    "feedKeepPersists": "Keep on the first item: aria-pressed true, chip 'Kept 1', physical-ai-roadmap.v1.triage[id].state == 'keep'; identical after a reload",
    "feedDropHides": "Drop on the second item hides it (N-1 visible, 'Dropped 1') until the Dropped filter is active, where it is the only item, marked .dropped with Drop pressed; the generic checks (contrast AA) pass in that state in both themes; 'Everything' restores N-1",
    "feedLatestHome": "index 'Latest from the feed' lists the 5 newest non-dropped feed.json titles in order and the note 'Feed last updated <formatLastUpdated>. GitHub may delay or skip scheduled runs.'",
    # FEAT-007: screenshots (--shots)
    "shotPixels": "each PNG's IHDR size == viewport x device_scale_factor (390x844, 1440x900, 1920x1080; 2560x1440 at 0.75 -> 1920x1080) and <= 1920 px per side",
}

# DR-2: the ten best-10 titles (also asserted by tests/home-data.test.js)
DR2_TITLES = [
    "Mathematics for Machine Learning",
    "Modern Robotics: Mechanics, Planning, and Control",
    "Control Engineering for Robotics",
    "State Estimation for Robotics",
    "ROS 2 Jazzy official tutorials",
    "Principles of Perception and Planning for Aerial Vehicles",
    "Deep Learning for Computer Vision",
    "Safe-Control-Gym: A Unified Benchmark Suite for Safe Learning-Based Control and Reinforcement Learning in Robotics",
    "Diffusion Policy: Visuomotor Policy Learning via Action Diffusion",
    "Underactuated Robotics: Algorithms for Walking, Running, Swimming, Flying, and Manipulation",
]
READPOS_PAGE = "s06"
READPOS_Y = 1500
CLIPBOARD_PAGE = "s17"  # has h3 copy-link pills and the §17.3 fenced query block
COPIED_MS = 1500
SEARCH_PAGE = "index"
SEARCH_TERM = "quadrotor"
SEARCH_WIDTHS = [1440, 390]
# page name -> markdown http link count, filled from --link-counts (verify.mjs computes it from content/roadmap.md)
LINK_COUNTS = {}


def card_columns(width, maximum=4, five_from=None):
    """Expected .cards columns at a viewport width (app.css breakpoints); best-10 adds a fifth from 2400px."""
    cols = 1 if width < 720 else 2 if width < 1680 else 3 if width < 2240 else 4
    if five_from and width >= five_from:
        cols = 5
    return min(cols, maximum)

INIT_JS = r"""
(() => {
  window.__audit = { cspViolations: [], styleCountBeforeScripts: null, themeAtBody: null };
  document.addEventListener('securitypolicyviolation', (e) => {
    window.__audit.cspViolations.push(`${e.violatedDirective} ${e.blockedURI || ''} ${e.sourceFile || ''}:${e.lineNumber || 0}`);
  });
  // readyState becomes 'interactive' after parsing and BEFORE deferred/module scripts run (HTML "the end" steps).
  document.addEventListener('readystatechange', () => {
    if (document.readyState === 'interactive' && window.__audit.styleCountBeforeScripts === null) {
      window.__audit.styleCountBeforeScripts = document.querySelectorAll('[style]').length;
    }
  });
  const obs = new MutationObserver(() => {
    if (document.body) { window.__audit.themeAtBody = document.documentElement.getAttribute('data-theme'); obs.disconnect(); }
  });
  obs.observe(document, { childList: true, subtree: true });
})();
"""

AUDIT_JS = r"""
() => {
  const parse = (c) => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(',').map((s) => parseFloat(s)); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
  const over = (fg, bg) => ({ r: fg.r * fg.a + bg.r * (1 - fg.a), g: fg.g * fg.a + bg.g * (1 - fg.a), b: fg.b * fg.a + bg.b * (1 - fg.a), a: 1 });
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
  const ratio = (a, b) => { const la = lum(a), lb = lum(b); return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05); };
  const hex = (c) => '#' + [c.r, c.g, c.b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
  const rootBg = parse(getComputedStyle(document.documentElement).backgroundColor) || { r: 255, g: 255, b: 255, a: 1 };
  function effectiveBg(el) {
    let node = el; let acc = null;
    while (node && node.nodeType === 1) {
      const c = parse(getComputedStyle(node).backgroundColor);
      if (c && c.a > 0) { acc = acc ? over(acc, c) : c; if (acc.a >= 0.999) return acc; }
      node = node.parentElement;
    }
    const base = rootBg.a > 0 ? rootBg : { r: 255, g: 255, b: 255, a: 1 };
    return acc ? over(acc, base) : base;
  }
  function effectiveOpacity(el) { let o = 1; let n = el; while (n && n.nodeType === 1) { o *= parseFloat(getComputedStyle(n).opacity || '1'); n = n.parentElement; } return o; }
  const tag = (el) => el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : '');
  const pairs = new Map(); let minFont = Infinity; let minFontEl = ''; let textEls = 0;
  for (const el of document.body.querySelectorAll('*')) {
    let hasText = false;
    for (const ch of el.childNodes) if (ch.nodeType === 3 && ch.textContent.trim()) { hasText = true; break; }
    if (!hasText) continue;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    const r = el.getBoundingClientRect(); if (r.width < 2 || r.height < 2) continue;
    if (!el.getClientRects().length) continue;
    const op = effectiveOpacity(el);
    if (op === 0) continue;
    textEls++;
    const fs = parseFloat(cs.fontSize);
    if (fs < minFont) { minFont = fs; minFontEl = tag(el); }
    let fg = parse(cs.color); if (!fg) continue;
    const bg = effectiveBg(el);
    if (fg.a < 1) fg = over(fg, bg);
    if (op < 1) fg = over({ ...fg, a: op }, bg);
    const bold = parseInt(cs.fontWeight, 10) >= 700;
    const large = fs >= 24 || (bold && fs >= 18.66);
    const key = hex(fg) + '/' + hex(bg);
    const rt = ratio(fg, bg);
    const prev = pairs.get(key);
    if (!prev) pairs.set(key, { fg: hex(fg), bg: hex(bg), ratio: Math.round(rt * 100) / 100, large, count: 1, sample: (el.textContent || '').trim().slice(0, 40), el: tag(el) });
    else { prev.count++; prev.large = prev.large && large; }
  }
  const main = document.querySelector('.page.layout') || document.querySelector('main.page') || document.body;
  const mcs = getComputedStyle(main); const mr = main.getBoundingClientRect();
  const padL = parseFloat(mcs.paddingLeft), padR = parseFloat(mcs.paddingRight);
  const contentBox = mr.width - padL - padR;
  const controls = [...document.querySelectorAll('button, input:not([type=checkbox]), select, .search-box, .check')]
    .filter((e) => e.getClientRects().length).map((e) => ({ h: Math.round(e.getBoundingClientRect().height), el: tag(e) }));
  const heights = controls.map((c) => c.h);
  const badControls = controls.filter((c) => c.h < 40 || c.h > 44).slice(0, 5);
  const rootFs = parseFloat(getComputedStyle(document.documentElement).fontSize);
  const wide = [...document.querySelectorAll('table.wide')].map((t) => ({ cols: parseInt(t.dataset.cols, 10), minWidth: parseFloat(getComputedStyle(t).minWidth), scrollWidth: t.scrollWidth, wrapClientWidth: t.parentElement ? t.parentElement.clientWidth : null }));
  const footer = document.querySelector('.site-footer');
  return {
    page: document.body.dataset.page || '',
    scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth, innerWidth: innerWidth,
    bodyFont: parseFloat(getComputedStyle(document.body).fontSize), rootFs, minFont, minFontEl, textEls,
    contentBox: Math.round(contentBox), contentRatio: Math.round(contentBox / innerWidth * 1000) / 1000,
    gutters: { left: Math.round(padL * 100) / 100, right: Math.round(padR * 100) / 100 },
    controlHeights: { min: heights.length ? Math.min(...heights) : null, max: heights.length ? Math.max(...heights) : null, count: heights.length, bad: badControls },
    wide,
    footerText: footer ? footer.textContent.replace(/\s+/g, ' ').trim() : '',
    styleCountNow: document.querySelectorAll('[style]').length,
    audit: window.__audit || null,
    pairs: [...pairs.values()].sort((a, b) => a.ratio - b.ratio),
  };
}
"""

SECTION_JS = r"""
() => {
  const layout = document.querySelector('.page.layout');
  const tracks = layout ? getComputedStyle(layout).gridTemplateColumns.trim().split(/\s+/).length : 0;
  const prose = document.querySelector('.prose') || document.body;
  const probe = document.createElement('span');
  probe.style.position = 'absolute'; probe.style.visibility = 'hidden'; probe.style.width = '80ch';
  prose.appendChild(probe);
  const eightyCh = probe.getBoundingClientRect().width;
  probe.remove();
  const paras = [...document.querySelectorAll('.prose > p')];
  const widths = paras.map((p) => parseFloat(getComputedStyle(p).maxWidth)).filter((v) => !Number.isNaN(v));
  const maxW = widths.length ? Math.max(...widths) : null;
  const fg = getComputedStyle(document.body).color;
  let nodes = 0, off = 0; const offSamples = [];
  const walker = document.createTreeWalker(prose, NodeFilter.SHOW_TEXT);
  let n;
  while ((n = walker.nextNode())) {
    if (!n.textContent.trim()) continue;
    const el = n.parentElement; if (!el) continue;
    if (!el.closest('.prose > p, .prose > ul, .prose > ol')) continue;
    if (el.closest('a, .chip, .dom, kbd, .copy')) continue;
    nodes++;
    const c = getComputedStyle(el).color;
    if (c !== fg) { off++; if (offSamples.length < 3) offSamples.push({ text: n.textContent.trim().slice(0, 30), color: c }); }
  }
  const copies = [...new Set([...document.querySelectorAll('.anchor-h .copy')].map((c) => getComputedStyle(c).opacity))];
  // OF-7: the body colour must be the --fg token itself (the check above compares every text node with it)
  const fgToken = getComputedStyle(document.documentElement).getPropertyValue('--fg').trim();
  const hexToRgb = (hex) => { const m = /^#([0-9a-f]{6})$/i.exec(hex); if (!m) return null; const n = parseInt(m[1], 16); return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`; };
  return { tracks, eightyCh: Math.round(eightyCh * 10) / 10, maxW, paragraphs: paras.length, nodes, off, offSamples, copyOpacities: copies, fgToken, fgTokenRgb: hexToRgb(fgToken), bodyColor: fg };
}
"""

INDEX_JS = r"""
() => {
  const txt = (el) => (el ? el.textContent.replace(/\s+/g, ' ').trim() : '');
  const count = (needle, hay) => hay.split(needle).length - 1;
  const body = txt(document.body);
  const rect = (el) => { const r = el.getBoundingClientRect(); return { left: Math.round(r.left), top: Math.round(r.top), width: Math.round(r.width) }; };
  const geometry = (sel) => { const els = [...document.querySelectorAll(sel)]; const rs = els.map(rect); return { n: els.length, lefts: new Set(rs.map((r) => r.left)).size, tops: new Set(rs.map((r) => r.top)).size }; };
  const grid = document.querySelector('.hero-grid');
  const halves = grid ? [...grid.children].map((c) => ({ chars: txt(c).length, ...rect(c) })) : [];
  const best = [...document.querySelectorAll('.cards.best-10 > li')].map((li) => txt(li.querySelector('h3')));
  const note = document.querySelector('[data-feed-updated]');
  return {
    halves,
    heroText: txt(document.querySelector('.hero')),
    title: document.title,
    legendCount: count('Labels used throughout', body),
    cutoffCount: count('Evidence cutoff', body),
    siteNameCount: count('Physical AI Roadmap', body),
    wordmarks: document.querySelectorAll('.wordmark').length,
    bestTitles: best,
    bestGeometry: geometry('.cards.best-10 > li'),
    sessionsGeometry: geometry('section[aria-labelledby="h-week"] .cards > li'),
    tracksGeometry: geometry('section[aria-labelledby="h-tracks"] .cards > li'),
    overall: txt(document.querySelector('.progress-note')),
    feedItems: document.querySelectorAll('#latest-feed > li').length,
    feedText: txt(document.getElementById('latest-feed')),
    feedNote: txt(note),
    feedNoteHidden: note ? note.hidden : null,
  };
}
"""

SECTION_BEHAVIOUR_JS = r"""
() => {
  const txt = (el) => (el ? el.textContent.replace(/\s+/g, ' ').trim() : '');
  const count = (needle, hay) => hay.split(needle).length - 1;
  const body = txt(document.body); const prose = txt(document.querySelector('.prose'));
  const legend = document.querySelector('details.legend');
  const abs = (href) => (href ? new URL(href, location.href).href : null);
  const linkRel = (rel) => { const l = document.querySelector(`link[rel="${rel}"]`); return l ? l.href : null; };
  const navRel = (rel) => { const a = document.querySelector(`.prevnext a[rel="${rel}"]`); return a ? abs(a.getAttribute('href')) : null; };
  const pres = [...document.querySelectorAll('.prose pre')];
  const copyBtns = pres.map((p) => { const b = p.parentElement && p.parentElement.classList.contains('code-block') ? p.parentElement.querySelector('button.copy-code') : null; return b ? Math.round(b.getBoundingClientRect().height) : null; });
  return {
    kicker: txt(document.querySelector('.article-head .kicker')),
    legendPresent: !!legend,
    legendSummaryChips: legend ? legend.querySelectorAll('summary .chip').length : 0,
    legendDefs: legend ? legend.querySelectorAll('dl dd').length : 0,
    h3s: document.querySelectorAll('.prose h3.anchor-h').length,
    railLinks: document.querySelectorAll('.rail-right a[href^="#"]').length,
    inlineLinks: document.querySelectorAll('.onpage-inline a[href^="#"]').length,
    httpLinks: document.querySelectorAll('.prose a[href^="http"]').length,
    prev: { link: linkRel('prev'), nav: navRel('prev') },
    next: { link: linkRel('next'), nav: navRel('next') },
    cutoffOutsideProse: count('Evidence cutoff', body) - count('Evidence cutoff', prose),
    siteNameOutsideProse: count('Physical AI Roadmap', body) - count('Physical AI Roadmap', prose),
    wordmarks: document.querySelectorAll('.wordmark').length,
    pres: pres.length,
    copyBtns,
  };
}
"""

SHELL_TEXT_JS = r"""
() => {
  const txt = (el) => (el ? el.textContent.replace(/\s+/g, ' ').trim() : '');
  const count = (needle, hay) => hay.split(needle).length - 1;
  const body = txt(document.body);
  return { title: document.title, cutoffCount: count('Evidence cutoff', body), siteNameCount: count('Physical AI Roadmap', body), wordmarks: document.querySelectorAll('.wordmark').length };
}
"""

PLAN_JS = r"""
() => {
  const txt = (el) => (el ? el.textContent.replace(/\s+/g, ' ').trim() : '');
  const stats = {};
  for (const s of document.querySelectorAll('#plan-stats .stat')) stats[s.dataset.stat] = [...s.children].map(txt).join(' ');
  const hidden = (id) => { const e = document.getElementById(id); return e ? e.hidden : null; };
  // rendered = the computed display, not the attribute: an author display rule could override [hidden]
  const rendered = (sel) => { const e = document.querySelector(sel); return e ? getComputedStyle(e).display !== 'none' : null; };
  const questions = document.querySelector('#plan-questions');
  const grid = document.querySelector('.plan-grid');
  return {
    ready: !!document.querySelector('#plan-app[data-ready]'),
    stats, statsHidden: hidden('plan-stats'), promptHidden: hidden('plan-prompt'),
    statsRendered: rendered('#plan-stats'), promptRendered: rendered('#plan-prompt'), leftRendered: rendered('.plan-grid > div:first-child'),
    questionsWidth: questions && grid ? Math.round(questions.getBoundingClientRect().width / grid.getBoundingClientRect().width * 100) / 100 : null,
    questionTops: [...new Set([...document.querySelectorAll('.q-list > li')].map((li) => Math.round(li.getBoundingClientRect().top)))].length,
    pressedHours: [...document.querySelectorAll('button[data-hours]')].map((b) => b.getAttribute('aria-pressed')),
    pressedTrack: [...document.querySelectorAll('.track-group button')].map((b) => b.getAttribute('aria-pressed')),
    trackTops: [...document.querySelectorAll('.track-group button')].map((b) => Math.round(b.getBoundingClientRect().top)),
    monthRows: document.querySelectorAll('.month-list li').length,
    currentMonths: [...document.querySelectorAll('.month-list li[aria-current="true"]')].map((li) => li.dataset.month),
    monthTitle: txt(document.querySelector('#plan-month [data-title]')),
    monthBox: [...document.querySelectorAll('#plan-month input[data-track]')].map((i) => i.dataset.track),
    budgetTitle: txt(document.querySelector('#plan-budget [data-title]')),
    budget: [...document.querySelectorAll('#plan-budget tbody tr')].map((tr) => [...tr.children].map(txt)),
    gateTitle: txt(document.querySelector('#plan-gate [data-title]')),
    gateClauses: [...document.querySelectorAll('#plan-gate .gate-list input[data-track]')].map((i) => i.dataset.track),
    gateBox: [...document.querySelectorAll('#plan-gate .check-row input[data-track]')].map((i) => i.dataset.track),
    logWeek: (document.getElementById('log-week') || {}).value,
    logEntries: [...document.querySelectorAll('[data-log-list] li')].map((li) => [...li.children].map(txt).join(' ')),
    ruleText: txt(document.querySelector('[data-hours-rule]')),
    statValues: [...document.querySelectorAll('#plan-stats [data-v]')].map(txt),
  };
}
"""

CHECK_JS = r"""
() => {
  const labels = [...document.querySelectorAll('label.check')].filter((l) => l.getClientRects().length && l.querySelector('input'));
  const sizes = labels.map((l) => { const r = l.getBoundingClientRect(); const ir = l.querySelector('input').getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height), Math.round(ir.width), Math.round(ir.height)]; });
  const bad = sizes.filter((s) => s[0] !== 44 || s[1] !== 44 || s[2] !== 22 || s[3] !== 22);
  return { n: labels.length, bad: bad.slice(0, 5), distinct: [...new Set(sizes.map((s) => s.join('x')))] };
}
"""

Q1_BUDGET_10H = [["F foundations/coursework", "50"], ["P paper discovery and deep reading", "10"], ["B implementation", "35"], ["E controlled experiments", "8"], ["W writing", "12"], ["C community, mentors, career", "5"], ["R review/buffer", "10"], ["Total", "130"]]
PLAN_KEY = "physical-ai-roadmap.v1.plan"
TRACKER_KEY = "physical-ai-roadmap.v1.tracker"
TRIAGE_KEY = "physical-ai-roadmap.v1.triage"
DATA_KEYS_JS = "['%s', '%s', '%s']" % (TRACKER_KEY, PLAN_KEY, TRIAGE_KEY)


def plan_fixture():
    """The FEAT-004 audit fixture: 10 h plan, Track B, started 14 days ago, weeks 1 and 2 logged (10 h, 8 h)."""
    start = (datetime.date.today() - datetime.timedelta(days=14)).isoformat()
    return {"hoursPerWeek": 10, "track": "B", "startDate": start, "weeklyHours": {"1": 10, "2": 8}, "answers": {}}


def storage_init_js(key, value):
    return "(() => { try { localStorage.setItem(%s, %s); } catch (e) {} })();" % (json.dumps(key), json.dumps(json.dumps(value)))


def check(name, ok, value, threshold=None):
    """One check result. The threshold text lives once in report["thresholds"][name]; pass one here only for ad-hoc names."""
    c = {"name": name, "pass": bool(ok), "value": value}
    if threshold:
        c["threshold"] = threshold
    return c


def expected_gutter(width):
    return min(96.0, max(16.0, 0.035 * width))


def generic_checks(width, a):
    """Checks from one AUDIT_JS evaluation (page x width x theme)."""
    out = []
    out.append(check("noOverflow", a["scrollWidth"] <= a["clientWidth"], {"scrollWidth": a["scrollWidth"], "clientWidth": a["clientWidth"]}))
    body_ok = (a["bodyFont"] >= 17 if width <= 390 else True) and (21 <= a["bodyFont"] <= 22.5 if width == 2560 else True)
    out.append(check("bodyFont", body_ok, round(a["bodyFont"], 2)))
    out.append(check("minFont12", a["minFont"] >= 12, {"minFont": round(a["minFont"], 2), "el": a["minFontEl"]}))
    out.append(check("contentRatio88", (a["contentRatio"] >= 0.88) if width >= 1920 else True, a["contentRatio"]))
    bad = [p for p in a["pairs"] if p["ratio"] < (3.0 if p["large"] else 4.5)]
    out.append(check("contrastAA", len(bad) == 0, {"minRatio": a["pairs"][0]["ratio"] if a["pairs"] else None, "pairs": len(a["pairs"]), "bad": bad[:6]}))
    ch = a["controlHeights"]
    out.append(check("controls40to44", ch["count"] == 0 or (ch["min"] >= 40 and ch["max"] <= 44), ch))
    exp = expected_gutter(a["innerWidth"])
    g = a["gutters"]
    out.append(check("gutters", abs(g["left"] - exp) <= 0.5 and abs(g["right"] - exp) <= 0.5, {"left": g["left"], "right": g["right"], "expected": round(exp, 2)}))
    footer_ok = a["footerText"] == FOOTER_TEXT
    out.append(check("footerText", footer_ok, "exact" if footer_ok else a["footerText"]))
    before = a["audit"]["styleCountBeforeScripts"] if a.get("audit") else None
    out.append(check("noStyleAttrs", before == 0, {"beforeScripts": before, "now": a["styleCountNow"]}))
    wide_bad = [w for w in a["wide"] if abs(w["minWidth"] - w["cols"] * 13 * a["rootFs"]) > 0.5]
    out.append(check("wideMinWidth", len(wide_bad) == 0, {"tables": len(a["wide"]), "rootFs": a["rootFs"], "bad": wide_bad[:4]}))
    return out


def section_checks(page, width, theme, ctx):
    s = ctx.page.evaluate(SECTION_JS)
    exp_tracks = 3 if width >= 1440 else 2 if width >= 1024 else 1
    out = [check("layoutColumns", s["tracks"] == exp_tracks, {"tracks": s["tracks"], "expected": exp_tracks})]
    out.append(check("proseMeasure", s["maxW"] is not None and s["maxW"] <= s["eightyCh"] + 0.5, {"maxWidth": s["maxW"], "eightyCh": s["eightyCh"], "paragraphs": s["paragraphs"]}))
    if width in (390, 2560):
        fg_ok = s["fgTokenRgb"] is not None and s["fgTokenRgb"] == s["bodyColor"]
        out.append(check("proseColour", s["off"] == 0 and s["nodes"] > 0 and fg_ok, {"nodes": s["nodes"], "off": s["off"], "samples": s["offSamples"], "fgToken": s["fgToken"], "bodyColor": s["bodyColor"]}))
    out.append(check("copyHidden", s["copyOpacities"] == ["0"] or s["copyOpacities"] == [], {"opacities": s["copyOpacities"]}))
    return out


KICKER_RE = re.compile(r"^(Section \d+ of 24|Appendix [A-D] · part \d+ of 24)$")
HEALTH_RE = re.compile(r"^■ ok \d+ · □ empty \d+ · ✕ failed \d+ · \d+ sources · details$")
MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
# §17.1 cell strings for the DR-5 check, filled from --protocol-cells (verify.mjs writes them from content/roadmap.md)
PROTOCOL_CELLS = set()
_FEED_DATA = {}


def parse_iso(value):
    if not value or not isinstance(value, str):
        return None
    try:
        return datetime.datetime.fromisoformat(value.replace("Z", "+00:00")).astimezone(datetime.timezone.utc)
    except ValueError:
        return None


def fmt_date(value):
    """assets/lib/format.js formatDate: 'D MMM YYYY' in UTC, '' when absent or invalid."""
    d = parse_iso(value)
    return f"{d.day} {MONTHS[d.month - 1]} {d.year}" if d else ""


def fmt_last_updated(value):
    """assets/lib/format.js formatLastUpdated: 'D MMM YYYY, HH:mm UTC', 'not yet' when absent or invalid."""
    d = parse_iso(value)
    return f"{fmt_date(value)}, {d.hour:02d}:{d.minute:02d} UTC" if d else "not yet"


def feed_data(page):
    """data/feed.json and data/meta.json of the served site (cached per base URL; `?cb=<ts>` defeats a CDN cache on --live)."""
    base = page.url.rsplit("/", 1)[0] + "/"
    if base not in _FEED_DATA:
        cb = int(datetime.datetime.now(datetime.timezone.utc).timestamp())
        _FEED_DATA[base] = {"feed": page.request.get(f"{base}data/feed.json?cb={cb}").json(), "meta": page.request.get(f"{base}data/meta.json?cb={cb}").json()}
    return _FEED_DATA[base]


def png_size(path):
    """(width, height) from the PNG IHDR chunk, or None when the file is not a PNG."""
    with open(path, "rb") as f:
        head = f.read(24)
    if head[:8] != b"\x89PNG\r\n\x1a\n" or head[12:16] != b"IHDR":
        return None
    return int.from_bytes(head[16:20], "big"), int.from_bytes(head[20:24], "big")


def parse_shot_extras(text):
    """'s03:1920:light,index:390:dark' -> [(page, width, theme), ...]; the width must be one of SHOT_VIEWPORTS."""
    out = []
    widths = {w for (w, _h, _d) in SHOT_VIEWPORTS}
    for part in [p.strip() for p in text.split(",") if p.strip()]:
        page, width, theme = part.split(":")
        if int(width) not in widths or theme not in DEFAULT_THEMES:
            raise ValueError(f"bad --shot-extras entry {part!r}: width must be one of {sorted(widths)}, theme light|dark")
        out.append((page, int(width), theme))
    return out


def sorted_items(feed):
    """The client's order (assets/lib/filter.js sortNewest): publishedAt descending, then id ascending."""
    def ts(iso):
        d = parse_iso(iso)
        return d.timestamp() if d else 0.0
    return sorted(feed.get("items", []), key=lambda it: (-ts(it["publishedAt"]), it["id"]))
FEED_NOTE_RE = re.compile(r"^Feed last updated (not yet|\d{1,2} [A-Z][a-z]{2} \d{4}, \d{2}:\d{2} UTC)\. GitHub may delay or skip scheduled runs\.$")
OVERALL_RE = re.compile(r"^Overall \d+ of \d+ items \(plan months are counted once a plan is chosen\)\.")


def index_checks(page, width, theme, ctx):
    """FEAT-003 home composition: OF-4, OF-5, OF-8, DR-2, DR-9, D5 counts and the feed widget."""
    try:  # home.js fills the widget after fetching data/*.json; wait once for it
        ctx.page.wait_for_selector("[data-feed-updated]:not([hidden])", timeout=4000)
    except Exception:
        pass
    s = ctx.page.evaluate(INDEX_JS)
    out = []
    halves = s["halves"]
    lefts = len({h["left"] for h in halves})
    halves_ok = len(halves) == 2 and all(h["chars"] > 0 for h in halves) and lefts == (2 if width >= 1440 else 1)
    out.append(check("heroHalves", halves_ok, {"halves": halves, "distinctLefts": lefts}))
    out.append(check("legendOnce", s["legendCount"] == 1, s["legendCount"]))
    out.append(check("heroNoVerified", "verified" not in s["heroText"].lower(), s["heroText"][:80]))
    out.append(check("titleNoVerified", "verified" not in s["title"].lower(), s["title"]))
    titles_ok = len(s["bestTitles"]) == 10 and all(t.startswith(f"{i + 1}. {DR2_TITLES[i]}") for i, t in enumerate(s["bestTitles"]))
    out.append(check("best10Titles", titles_ok, s["bestTitles"]))
    bg = s["bestGeometry"]
    exp_best = card_columns(width, maximum=10, five_from=2400)
    best_ok = bg["n"] == 10 and bg["lefts"] == exp_best and (bg["tops"] == 2 if width >= 2400 else True)
    out.append(check("best10Geometry", best_ok, {**bg, "expectedColumns": exp_best}))
    sg, tg = s["sessionsGeometry"], s["tracksGeometry"]
    exp_cols = card_columns(width)
    cards_ok = sg["n"] == 7 and sg["lefts"] == exp_cols and tg["n"] == 3 and tg["lefts"] == min(3, exp_cols)
    out.append(check("cardsGeometry", cards_ok, {"sessions": sg, "tracks": tg, "expectedColumns": exp_cols}))
    out.append(check("cutoffCount", s["cutoffCount"] == 2, s["cutoffCount"]))
    out.append(check("siteNameOnce", s["siteNameCount"] == 1 and s["wordmarks"] == 1, {"bodyCount": s["siteNameCount"], "wordmarks": s["wordmarks"]}))
    out.append(check("overallWording", bool(OVERALL_RE.match(s["overall"])), s["overall"]))
    feed_ok = bool(FEED_NOTE_RE.match(s["feedNote"])) and s["feedNoteHidden"] is False and (s["feedItems"] >= 1) and (s["feedText"].startswith("No feed items yet") or s["feedItems"] <= 5)
    out.append(check("feedWidget", feed_ok, {"items": s["feedItems"], "note": s["feedNote"], "hidden": s["feedNoteHidden"], "text": s["feedText"][:80]}))
    return out


FEED_JS = r"""
() => {
  const txt = (el) => (el ? el.textContent.replace(/\s+/g, ' ').trim() : '');
  const box = (el) => { const r = el.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom }; };
  const intersects = (a, b) => a.l < b.r - 0.5 && b.l < a.r - 0.5 && a.t < b.b - 0.5 && b.t < a.b - 0.5;
  const items = [...document.querySelectorAll('.feed-item:not(.feed-message)')];
  let overlaps = 0, misaligned = 0, placement = 0;
  const samples = [];
  const w = innerWidth;
  for (const li of items) {
    const kids = [...li.children].filter((k) => k.getClientRects().length).map((k) => ({ name: k.className || k.tagName.toLowerCase(), b: box(k) }));
    for (let i = 0; i < kids.length; i++) for (let j = i + 1; j < kids.length; j++) if (intersects(kids[i].b, kids[j].b)) { overlaps++; if (samples.length < 3) samples.push(['overlap', kids[i].name, kids[j].name, Math.round(kids[i].b.t), Math.round(kids[j].b.t)]); }
    const h3 = li.querySelector('h3'); const meta = li.querySelector('.meta');
    const lb = box(li); const hb = box(h3); const mb = meta ? box(meta) : hb;
    if (Math.abs(hb.l - (lb.l + parseFloat(getComputedStyle(li).paddingLeft))) > 0.5) misaligned++;
    const btns = [...li.querySelectorAll('.triage .btn')].map(box);
    const tops = new Set(btns.map((b) => Math.round(b.t)));
    let ok;
    if (w >= 1440) ok = btns.length === 3 && tops.size === 1 && btns.every((b) => b.l >= hb.r - 0.5) && Math.abs(btns[0].t - hb.t) <= 2;
    else if (w >= 820) ok = btns.length === 3 && tops.size === 3 && btns.every((b) => b.l >= hb.r - 0.5);
    else ok = btns.length === 3 && btns.every((b) => b.t >= mb.b - 0.5);
    if (!ok) { placement++; if (samples.length < 3) samples.push(['placement', Math.round(hb.r), btns.map((b) => [Math.round(b.l), Math.round(b.t)])]); }
  }
  const first = items.slice(0, 5).map((li) => ({ title: txt(li.querySelector('h3 a')), source: txt(li.querySelector('.meta .src')), date: txt(li.querySelector('.meta .date')), id: li.dataset.id }));
  const card = document.querySelector('table.protocol');
  const rows = card ? [...card.querySelectorAll('tbody tr')] : [];
  const monthEnd = [...document.querySelectorAll('.feed-aside p')].find((p) => /Month-end 90 min · Quarter-end 120 min — see/.test(txt(p)));
  const healthRows = [...document.querySelectorAll('[data-health-rows] tr')].map((tr) => ({ status: tr.dataset.status, text: txt(tr) }));
  return {
    items: items.length, overlaps, misaligned, placement, samples, first,
    summaries: [...document.querySelectorAll('.feed-item .summary')].map(txt),
    health: txt(document.querySelector('details.health > summary')),
    healthRows,
    protocolRows: rows.length,
    protocolCells: rows.flatMap((tr) => [...tr.querySelectorAll('td')].map(txt)),
    monthEndLink: monthEnd ? (monthEnd.querySelector('a[href="s17.html#s17-1"]') ? 's17.html#s17-1' : 'no link') : 'no line',
    lastUpdated: txt(document.querySelector('[data-last-updated]')),
    freshness: txt(document.body).includes('GitHub may delay or skip scheduled runs'),
    status: txt(document.querySelector('[data-feed-status]')),
    notices: [...document.querySelectorAll('[data-notice]')].map((li) => ({ id: li.dataset.notice, status: txt(li.querySelector('[data-notice-status]')) })),
    counts: Object.fromEntries([...document.querySelectorAll('[data-count]')].map((s) => [s.dataset.count, s.textContent])),
  };
}
"""


def feed_checks(page, width, theme, ctx):
    """FEAT-005 Feed page with the real data: OF-1/OF-11 geometry, DR-9 health strip, D6 failures and first items, DR-5 protocol card, D9 freshness."""
    p = ctx.page
    try:
        p.wait_for_selector("[data-feed-list][data-feed-ready]", timeout=6000)
    except Exception:
        pass
    data = feed_data(p)
    s = p.evaluate(FEED_JS)
    out = []
    out.append(check("feedItemGeometry", s["items"] > 0 and s["overlaps"] == 0 and s["misaligned"] == 0, {"items": s["items"], "overlaps": s["overlaps"], "misalignedTitles": s["misaligned"], "samples": s["samples"][:3]}))
    band = "row at the top-right" if width >= 1440 else "stacked right column" if width >= 820 else "below the meta row"
    out.append(check("feedActions", s["items"] > 0 and s["placement"] == 0, {"band": band, "itemsOff": s["placement"], "samples": [x for x in s["samples"] if x[0] == "placement"][:3]}))
    out.append(check("healthSummary", bool(HEALTH_RE.match(s["health"])), s["health"]))
    failed = [sid for sid, m in data["meta"]["sources"].items() if m.get("status") == "failed"]
    rows_failed = [r for r in s["healthRows"] if r["status"] == "failed"]
    unavailable_ok = len(rows_failed) == len(failed) and all("Unavailable since" in r["text"] and " · " in r["text"] for r in rows_failed)
    notices_ok = all(("Unavailable since" in n["status"]) == (data["meta"]["sources"].get(n["id"], {}).get("status") == "failed") for n in s["notices"]) and len(s["notices"]) == 5
    out.append(check("unavailableRows", unavailable_ok and notices_ok, {"failedSources": failed, "failedRows": [r["text"][:120] for r in rows_failed], "notices": s["notices"]}))
    dots = [x for x in s["summaries"] if x.endswith("...")]
    over = [x for x in s["summaries"] if len(x) > 300]
    out.append(check("summaryEllipsis", not dots and not over, {"summaries": len(s["summaries"]), "endingWithDots": len(dots), "over300": len(over)}))
    bad_cells = [c for c in s["protocolCells"] if c not in PROTOCOL_CELLS] if PROTOCOL_CELLS else ["no --protocol-cells given"]
    out.append(check("protocolCard", s["protocolRows"] == 3 and not bad_cells and s["monthEndLink"] == "s17.html#s17-1", {"tbodyRows": s["protocolRows"], "cells": s["protocolCells"], "notInSource": bad_cells, "monthEndLink": s["monthEndLink"], "sourceCells": len(PROTOCOL_CELLS)}))
    expected = fmt_last_updated(data["meta"].get("generatedAt"))
    out.append(check("lastUpdated", s["lastUpdated"] == expected and s["freshness"], {"shown": s["lastUpdated"], "expected": expected, "freshnessSentence": s["freshness"]}))
    items = sorted_items(data["feed"])[:5]
    exp_first = [{"title": it["title"], "source": it["source"], "date": fmt_date(it["publishedAt"]), "id": it["id"]} for it in items]
    out.append(check("feedFirstFive", s["first"] == exp_first and len(exp_first) == 5, {"dom": s["first"], "json": exp_first}))
    status_ok = s["status"].startswith(f"Showing {len(data['feed']['items'])} of {len(data['feed']['items'])} items in the window.")
    out.append(check("feedStatusLine", status_ok and s["counts"] == {"keep": "0", "later": "0", "drop": "0"}, {"status": s["status"][:80], "counts": s["counts"]}))
    return out


def shell_text_checks(page, width, theme, ctx):
    """FEAT-003 D1/D5/OF-4 string checks on the non-content pages (plan, feed, 404)."""
    s = ctx.page.evaluate(SHELL_TEXT_JS)
    return [
        check("titleNoVerified", "verified" not in s["title"].lower(), s["title"]),
        check("cutoffCount", s["cutoffCount"] == 1, s["cutoffCount"]),
        check("siteNameOnce", s["siteNameCount"] == 1 and s["wordmarks"] == 1, {"bodyCount": s["siteNameCount"], "wordmarks": s["wordmarks"]}),
    ]


def section_behaviours(page, width, theme, ctx):
    """FEAT-003 section pages: kicker, legend, anchors, rails, scrollspy, prev/next, OF-7 link parity, code Copy."""
    p = ctx.page
    s = p.evaluate(SECTION_BEHAVIOUR_JS)
    out = [check("kicker", bool(KICKER_RE.match(s["kicker"])), s["kicker"])]
    out.append(check("legendChips", s["legendPresent"] and s["legendSummaryChips"] == 5 and s["legendDefs"] == 5, {"summaryChips": s["legendSummaryChips"], "definitions": s["legendDefs"]}))
    if s["h3s"]:
        focus = p.evaluate("""() => { const c = document.querySelector('.anchor-h .copy'); const rest = getComputedStyle(c).opacity;
            c.focus({ preventScroll: true }); const focused = getComputedStyle(c).opacity; const active = document.activeElement === c; c.blur();
            return { rest, focused, active, after: getComputedStyle(c).opacity }; }""")
        out.append(check("copyFocus", focus["rest"] == "0" and focus["focused"] == "1" and focus["active"] and focus["after"] == "0", focus))
    out.append(check("onPageCount", s["railLinks"] == s["h3s"] and s["inlineLinks"] == s["h3s"], {"h3": s["h3s"], "rail": s["railLinks"], "inline": s["inlineLinks"]}))
    if s["h3s"]:
        target = p.evaluate("""() => { const hs = [...document.querySelectorAll('.prose h3.anchor-h')]; const h = hs[Math.min(2, hs.length - 1)]; h.scrollIntoView(); return h.id; }""")
        ok = True
        try:
            p.wait_for_function("(id) => document.querySelectorAll(`a[href=\"#${id}\"][aria-current=\"true\"]`).length >= 1", arg=target, timeout=500)
        except Exception:
            ok = False
        state = p.evaluate("""(id) => ({ current: [...document.querySelectorAll('a[aria-current="true"][href^="#"]')].map((a) => a.getAttribute('href')), target: '#' + id, scrollY: Math.round(scrollY) })""", target)
        others = [h for h in state["current"] if h != state["target"]]
        out.append(check("scrollspy", ok and not others and state["target"] in state["current"], state))
        p.evaluate("() => scrollTo(0, 0)")
    else:
        out.append(check("scrollspy", True, "no h3 on this page"))
    if width == 390 and theme == "light":
        resolved = {}
        for rel in ("prev", "next"):
            link = s[rel]["link"]
            nav = s[rel]["nav"]
            if link is None and nav is None:
                resolved[rel] = "none"
                continue
            status = None
            try:
                status = p.request.head(link).status if link else None
            except Exception as e:
                status = f"{type(e).__name__}"
            resolved[rel] = {"status": status, "sameTarget": link == nav}
        ok = all(v == "none" or (v["status"] == 200 and v["sameTarget"]) for v in resolved.values()) and not (resolved["prev"] == "none" and resolved["next"] == "none")
        out.append(check("prevNext", ok, resolved))
    if width in (390, 2560) and page in LINK_COUNTS:
        out.append(check("linkParity", s["httpLinks"] == LINK_COUNTS[page], {"rendered": s["httpLinks"], "markdown": LINK_COUNTS[page]}))
    out.append(check("cutoffCount", s["cutoffOutsideProse"] == 1, s["cutoffOutsideProse"]))
    out.append(check("siteNameOnce", s["siteNameOutsideProse"] == 1 and s["wordmarks"] == 1, {"outsideContent": s["siteNameOutsideProse"], "wordmarks": s["wordmarks"]}))
    if s["pres"]:
        out.append(check("codeCopy", all(h is not None and 40 <= h <= 44 for h in s["copyBtns"]), {"pre": s["pres"], "buttonHeights": s["copyBtns"]}))
    return out


def plan_checks(page, width, theme, ctx):
    """FEAT-004 My plan with the PAGE_INIT fixture: derived numbers, current month, budget, gate, log, OF-9 geometry."""
    p = ctx.page
    try:
        p.wait_for_selector("#plan-app[data-ready]", timeout=4000)
    except Exception:
        pass
    s = p.evaluate(PLAN_JS)
    st = s["stats"]
    stats_ok = (s["ready"] and s["statsHidden"] is False and s["promptHidden"] is True
                and st.get("week", "").startswith("Week 3 of 104") and st.get("month", "").startswith("Month 1 W1–4 · 40 h planned (10 h plan)")
                and st.get("quarter", "").startswith("Quarter 1 Numerical work, mathematics, mechanics, research habits")
                and st.get("expected", "") == "20 h expected so far (2 completed weeks × 10 h)" and st.get("logged", "") == "18 h logged · −2 h behind"
                and s["pressedHours"] == ["true", "false"] and s["pressedTrack"] == ["false", "false", "true", "false"])
    out = [check("planStats", stats_ok, {"stats": st, "statsHidden": s["statsHidden"], "promptHidden": s["promptHidden"], "pressedHours": s["pressedHours"], "pressedTrack": s["pressedTrack"]})]
    out.append(check("planMonthCurrent", s["monthRows"] == 24 and s["currentMonths"] == ["1"] and s["monthTitle"].startswith("This month: 1 (W1–4)") and s["monthBox"] == ["s15:plan-10h:1"],
                     {"rows": s["monthRows"], "current": s["currentMonths"], "title": s["monthTitle"], "box": s["monthBox"]}))
    out.append(check("planBudget", s["budget"] == Q1_BUDGET_10H and s["budgetTitle"] == "Quarter 1 budget, 10 h plan", {"title": s["budgetTitle"], "rows": s["budget"]}))
    out.append(check("planGate", s["gateTitle"] == "Gate Q1 (W13) foundations" and s["gateClauses"] == [f"s15:gates:q1:{k}" for k in range(1, 6)] and s["gateBox"] == ["s15:gates:q1"],
                     {"title": s["gateTitle"], "clauses": s["gateClauses"], "gateBox": s["gateBox"]}))
    out.append(check("planLog", s["logWeek"] == "3" and s["logEntries"] == ["Week 1 10 h Remove", "Week 2 8 h Remove"], {"weekInput": s["logWeek"], "entries": s["logEntries"]}))
    tops = s["trackTops"]
    distinct = sorted(set(tops))
    if width >= 1024:
        geo_ok = len(tops) == 4 and len(distinct) == 1
    else:
        geo_ok = len(tops) == 4 and len(distinct) == 2 and all(tops.count(t) == 2 for t in distinct)
    out.append(check("trackGroup", geo_ok, {"tops": tops, "distinct": distinct, "expectedRows": 1 if width >= 1024 else 2}))
    return out


def check_geometry(page, width, theme, ctx):
    """OF-2 / FEAT-004: every visible label.check is 44x44 with a 22x22 native checkbox."""
    s = ctx.page.evaluate(CHECK_JS)
    return [check("checkSize", s["n"] == 0 or len(s["bad"]) == 0, s if s["n"] else "no checkboxes on this page")]


# Page-type check groups, keyed by body[data-page]. FEAT-003 appends to "index" and "section",
# FEAT-004 to "plan", FEAT-005 to "feed". Each fn(page_name, width, theme, ctx) -> [check, ...].
# They run after the generic evaluation, with every <details> open and html[data-theme] set directly.
GROUPS = {
    "home": [index_checks, check_geometry],  # index.html carries body[data-page="home"]
    "section": [section_checks, section_behaviours, check_geometry],
    "plan": [shell_text_checks, plan_checks, check_geometry],
    "feed": [shell_text_checks, feed_checks],
    "404": [shell_text_checks],
}

# Extra init script per page NAME so a fixture state exists before the page's modules run. Not applied to the
# first-paint (DR-3) contexts. FEAT-004: the My plan fixture (also used for the plan screenshots).
PAGE_INIT = {
    "plan": storage_init_js(PLAN_KEY, plan_fixture()),
}


class Ctx:
    def __init__(self, page, name):
        self.page = page
        self.name = name


class Audit:
    def __init__(self, args):
        self.args = args
        self.base = args.base if args.base.endswith("/") else args.base + "/"
        self.widths = args.widths
        self.themes = args.themes
        self.checks = []
        self.pages = {}
        self.errors = []

    def url(self, name):
        return f"{self.base}{name}.html"

    def record(self, page, width, theme, items):
        for c in items:
            c.update({"page": page, "width": width, "theme": theme})
            self.checks.append(c)
        return all(c["pass"] for c in items)

    # ---- generic per-page run -------------------------------------------------------------------
    def new_context(self, browser, width, height, dsf=1, color_scheme="light", name=None):
        ctx = browser.new_context(viewport={"width": width, "height": height}, device_scale_factor=dsf, reduced_motion="reduce", color_scheme=color_scheme)
        ctx.add_init_script(INIT_JS)
        if name in PAGE_INIT:
            ctx.add_init_script(PAGE_INIT[name])
        return ctx

    def run_page(self, browser, name, full):
        w0 = self.widths[0]
        ctx = self.new_context(browser, w0, HEIGHTS.get(w0, 900), name=name)
        page = ctx.new_page()
        page.goto(self.url(name), wait_until="load")
        page_type = page.evaluate("() => document.body.dataset.page || ''")
        self.pages[name] = {"type": page_type, "widths": {}}
        try:
            for w in self.widths:
                page.set_viewport_size({"width": w, "height": HEIGHTS.get(w, 900)})
                if full and w in THEME_CYCLE_WIDTHS:
                    page.reload(wait_until="load")
                    page.set_viewport_size({"width": w, "height": HEIGHTS.get(w, 900)})
                    self.theme_cycle(page, name, w)
                    page.reload(wait_until="load")
                    page.set_viewport_size({"width": w, "height": HEIGHTS.get(w, 900)})
                page.evaluate("() => document.querySelectorAll('details').forEach((d) => { d.open = true; })")
                page.wait_for_timeout(60)
                per_theme = {}
                for theme in self.themes:
                    page.evaluate("(t) => { document.documentElement.dataset.theme = t; }", theme)
                    page.wait_for_timeout(60)
                    a = page.evaluate(AUDIT_JS)
                    items = generic_checks(w, a)
                    if full:
                        for fn in GROUPS.get(page_type, []):
                            try:
                                items.extend(fn(name, w, theme, Ctx(page, name)))
                            except Exception as e:  # a broken group must show up as a failure, not a crash
                                items.append(check(f"group:{fn.__name__}", False, f"{type(e).__name__}: {e}"[:200], "group function raised"))
                    ok = self.record(name, w, theme, items)
                    # Per-cell numbers (the checks above carry pass/fail); the full pair list only for --pages.
                    detail = {k: a[k] for k in ("scrollWidth", "clientWidth", "bodyFont", "rootFs", "minFont", "minFontEl", "textEls", "contentRatio")}
                    detail["gutter"] = a["gutters"]["left"]
                    detail["controls"] = [a["controlHeights"]["min"], a["controlHeights"]["max"], a["controlHeights"]["count"]]
                    detail["styleCountBeforeScripts"] = a["audit"]["styleCountBeforeScripts"] if a.get("audit") else None
                    detail["minPair"] = {k: a["pairs"][0][k] for k in ("fg", "bg", "ratio")} if a["pairs"] else None
                    if full:
                        detail["contentBox"] = a["contentBox"]
                        detail["wide"] = a["wide"]
                        detail["pairs"] = a["pairs"]
                    per_theme[theme] = detail
                    failed = [c["name"] for c in items if not c["pass"]]
                    pmin = a["pairs"][0]["ratio"] if a["pairs"] else None
                    print(f"{name:11} {w:5} {theme:5} scroll={a['scrollWidth']}/{a['clientWidth']} body={a['bodyFont']:.2f} min={a['minFont']:.2f}({a['minFontEl']}) content={a['contentRatio']} gutter={a['gutters']['left']} ctrl={a['controlHeights']['min']}-{a['controlHeights']['max']} pairs={len(a['pairs'])} minRatio={pmin} {'OK' if ok else 'FAIL ' + ','.join(failed)}")
                self.pages[name]["widths"][str(w)] = per_theme
            # CSP violations accumulate over the whole page run (all widths, themes, reloads)
            violations = page.evaluate("() => (window.__audit && window.__audit.cspViolations) || []")
            self.record(name, self.widths[-1], self.themes[-1], [check("noCspViolations", len(violations) == 0, violations[:5])])
        finally:
            ctx.close()

    # ---- DR-4 -----------------------------------------------------------------------------------
    def theme_cycle(self, page, name, width):
        read = """() => { const b = document.querySelector('.theme-btn'); const l = b.querySelector('.label'); const r = l.getBoundingClientRect();
            return { aria: b.getAttribute('aria-label'), html: document.documentElement.dataset.theme, icon: b.querySelector('svg').dataset.mode, label: l.textContent, labelVisible: r.width > 1 && r.height > 1, stored: localStorage.getItem('%s') }; }""" % THEME_KEY
        names = {"light": "Light", "dark": "Dark", "system": "System"}
        modes = ["light", "dark", "system", "light"]
        prefers_dark = page.evaluate("() => matchMedia('(prefers-color-scheme: dark)').matches")
        nxt = {"light": "dark", "dark": "system", "system": "light"}
        exp_html = [m if m != "system" else ("dark" if prefers_dark else "light") for m in modes]
        exp_aria = [f"Theme: {names[m]}. Activate for {names[nxt[m]]}" for m in modes]
        for method in ("key", "click"):
            seen = [page.evaluate(read)]
            for _ in range(3):
                if method == "key":
                    page.keyboard.press("t")
                else:
                    page.click(".theme-btn")
                page.wait_for_timeout(40)
                seen.append(page.evaluate(read))
            aria_ok = [s["aria"] for s in seen] == exp_aria
            html_ok = [s["html"] for s in seen] == exp_html
            icon_ok = [s["icon"] for s in seen] == modes
            label_ok = all(s["label"] == names[m] for s, m in zip(seen, modes))
            visible_ok = all(s["labelVisible"] == (width >= 860) for s in seen)
            stored_ok = seen[-1]["stored"] == "light"
            ok = aria_ok and html_ok and icon_ok and label_ok and visible_ok and stored_ok
            self.record(name, width, "light", [check("themeCycle", ok, {"method": method, "aria": [s["aria"] for s in seen], "html": [s["html"] for s in seen], "icon": [s["icon"] for s in seen], "label": [s["label"] for s in seen], "labelVisible": seen[0]["labelVisible"], "stored": seen[-1]["stored"]})])
            print(f"{name:11} {width:5} theme-cycle({method}) {'OK' if ok else 'FAIL'} aria={[s['aria'] for s in seen]}")

    # ---- DR-3 -----------------------------------------------------------------------------------
    def first_paint(self, browser, name):
        ctx = self.new_context(browser, 1440, 900, color_scheme="dark")
        try:
            page = ctx.new_page()
            page.goto(self.url(name), wait_until="load")
            page.wait_for_timeout(80)
            s = page.evaluate("""() => {
                const cs = getComputedStyle(document.documentElement);
                const bcs = getComputedStyle(document.body);
                const parse = (c) => { const m = c.match(/rgba?\\(([^)]+)\\)/); if (!m) return null; const p = m[1].split(',').map((x) => parseFloat(x)); return p.length > 3 && p[3] === 0 ? null : '#' + p.slice(0, 3).map((v) => Math.round(v).toString(16).padStart(2, '0')).join(''); };
                return { themeAtBody: window.__audit && window.__audit.themeAtBody, theme: document.documentElement.dataset.theme, colorScheme: cs.colorScheme, htmlBg: parse(cs.backgroundColor), bodyBg: parse(bcs.backgroundColor) || parse(cs.backgroundColor), prefersDark: matchMedia('(prefers-color-scheme: dark)').matches, stored: localStorage.getItem('%s') };
            }""" % THEME_KEY)
            ok = s["prefersDark"] is True and s["themeAtBody"] == "light" and s["theme"] == "light" and s["colorScheme"] == "light" and s["htmlBg"] == "#ffffff" and s["bodyBg"] == "#ffffff" and s["stored"] is None
            self.record(name, 1440, "dark-emulated", [check("firstPaintLight", ok, s)])
            print(f"{name:11}  1440 first-paint(dark emulated) {'OK' if ok else 'FAIL'} {s}")
        finally:
            ctx.close()

    # ---- keyboard -------------------------------------------------------------------------------
    def keys(self, browser):
        ctx = self.new_context(browser, 1440, 900)
        try:
            page = ctx.new_page()
            page.goto(self.url(KEYS_PAGE), wait_until="load")
            with page.expect_navigation(wait_until="load"):
                page.keyboard.press("]")
            after_next = page.url
            with page.expect_navigation(wait_until="load"):
                page.keyboard.press("[")
            after_prev = page.url
            page.keyboard.press("/")
            focused = page.evaluate("() => document.activeElement && document.activeElement.id")
            page.keyboard.press("Escape")
            after_esc = page.evaluate("() => document.activeElement && document.activeElement.tagName")
            # typing in the search box must not trigger shortcuts
            page.focus("#search")
            page.keyboard.type("t]")
            typed = page.evaluate("() => ({ url: location.href, theme: document.documentElement.dataset.theme, value: document.getElementById('search').value })")
            ok = after_next.endswith(f"{KEYS_NEXT_PAGE}.html") and after_prev.endswith(f"{KEYS_PAGE}.html") and focused == "search" and after_esc == "BODY" and typed["url"].endswith(f"{KEYS_PAGE}.html") and typed["theme"] == "light" and typed["value"] == "t]"
            self.record(KEYS_PAGE, 1440, "light", [check("keys", ok, {"afterNext": after_next, "afterPrev": after_prev, "slashFocuses": focused, "afterEsc": after_esc, "typed": typed})])
            print(f"{KEYS_PAGE:11}  1440 keys {'OK' if ok else 'FAIL'} next={after_next.rsplit('/', 1)[-1]} prev={after_prev.rsplit('/', 1)[-1]} /={focused} esc={after_esc}")
        finally:
            ctx.close()

    # ---- print ----------------------------------------------------------------------------------
    def print_check(self, browser):
        ctx = self.new_context(browser, PRINT_WIDTH, 900)
        try:
            page = ctx.new_page()
            page.goto(self.url(PRINT_PAGE), wait_until="load")
            page.emulate_media(media="print")
            page.wait_for_timeout(80)
            s = page.evaluate("""() => {
                const d = (sel) => [...document.querySelectorAll(sel)].map((e) => getComputedStyle(e).display);
                const tables = [...document.querySelectorAll('table.wide')].map((t) => ({ cols: t.dataset.cols, scrollWidth: t.scrollWidth, wrapClientWidth: t.parentElement.clientWidth, minWidth: getComputedStyle(t).minWidth }));
                return { header: d('.site-header'), rails: d('.rail'), inlineRails: d('.inline-rail'), prevnext: d('.prevnext'), tables, overflow: document.documentElement.scrollWidth <= document.documentElement.clientWidth };
            }""")
            ok = all(v == "none" for v in s["header"] + s["rails"] + s["inlineRails"] + s["prevnext"]) and all(t["scrollWidth"] <= t["wrapClientWidth"] for t in s["tables"]) and len(s["tables"]) > 0
            self.record(PRINT_PAGE, PRINT_WIDTH, "print", [check("print", ok, s)])
            print(f"{PRINT_PAGE:11}  {PRINT_WIDTH} print {'OK' if ok else 'FAIL'} tables={[(t['cols'], t['scrollWidth'], t['wrapClientWidth']) for t in s['tables']]}")
        finally:
            ctx.close()

    # ---- reading position (Decision 3) ----------------------------------------------------------
    def reading_position(self, browser):
        ctx = self.new_context(browser, 1440, 900)
        try:
            page = ctx.new_page()
            page.goto(self.url(READPOS_PAGE), wait_until="load")
            page.evaluate("(y) => scrollTo(0, y)", READPOS_Y)
            page.wait_for_timeout(100)
            before = page.evaluate("() => Math.round(scrollY)")
            page.goto(self.url(KEYS_PAGE), wait_until="load")  # pagehide on s06 writes the position
            stored = page.evaluate("() => localStorage.getItem('physical-ai-roadmap.v1.readpos')")
            page.goto(self.url(READPOS_PAGE), wait_until="load")
            restored = None
            try:
                page.wait_for_function("(y) => Math.abs(scrollY - y) <= 50", arg=READPOS_Y, timeout=1500)
                restored = page.evaluate("() => Math.round(scrollY)")
            except Exception:
                restored = page.evaluate("() => Math.round(scrollY)")
            # with a fragment the heading wins over the stored position
            frag = page.evaluate("() => { const h = document.querySelectorAll('.prose h3.anchor-h'); return h.length > 2 ? h[2].id : h[0].id; }")
            page.goto(f"{self.url(READPOS_PAGE)}#{frag}", wait_until="load")
            page.wait_for_timeout(300)
            frag_state = page.evaluate("(id) => { const h = document.getElementById(id); return { headingTop: Math.round(h.getBoundingClientRect().top), scrollY: Math.round(scrollY) }; }", frag)
            ok = before == READPOS_Y and restored is not None and abs(restored - READPOS_Y) <= 50 and stored is not None and f'"{READPOS_PAGE}.html":{READPOS_Y}' in stored.replace(" ", "") and 0 <= frag_state["headingTop"] <= 120
            self.record(READPOS_PAGE, 1440, "light", [check("readingPosition", ok, {"before": before, "stored": stored, "restored": restored, "fragment": frag, "fragmentState": frag_state})])
            print(f"{READPOS_PAGE:11}  1440 reading-position {'OK' if ok else 'FAIL'} before={before} restored={restored} stored={stored} frag={frag_state}")
        finally:
            ctx.close()

    # ---- search ---------------------------------------------------------------------------------
    def search(self, browser, width):
        ctx = self.new_context(browser, width, HEIGHTS.get(width, 900))
        try:
            page = ctx.new_page()
            page.goto(self.url(SEARCH_PAGE), wait_until="load")
            page.wait_for_timeout(100)
            page.keyboard.press("/")
            focused = page.evaluate("() => { const a = document.activeElement; const r = a ? a.getBoundingClientRect() : null; return { id: a && a.id, visible: !!r && r.width > 1 && r.height > 1, open: document.querySelector('.site-header').classList.contains('search-open') }; }")
            page.keyboard.type(SEARCH_TERM)
            groups = 0
            try:
                page.wait_for_selector(".search-panel:not([hidden]) .search-group", timeout=6000)
                groups = page.evaluate("() => document.querySelectorAll('.search-panel .search-group').length")
            except Exception:
                groups = 0
            panel = page.evaluate("""() => { const p = document.querySelector('.search-panel'); const marks = p.querySelectorAll('mark').length; const hits = p.querySelectorAll('a[href]').length;
                const r = p.getBoundingClientRect(); return { role: p.getAttribute('role'), label: p.getAttribute('aria-label'), hits, marks, status: (p.querySelector('.search-status') || {}).textContent || '', right: Math.round(r.right), left: Math.round(r.left), top: Math.round(r.top), headerBottom: Math.round(document.querySelector('.site-header').getBoundingClientRect().bottom), overflow: document.documentElement.scrollWidth <= document.documentElement.clientWidth, firstHref: (p.querySelector('a[href]') || {}).getAttribute ? p.querySelector('a[href]').getAttribute('href') : null }; }""")
            page.keyboard.press("ArrowDown")
            arrow_down = page.evaluate("() => { const a = document.activeElement; return { tag: a.tagName, inPanel: !!a.closest('.search-panel') }; }")
            page.keyboard.press("ArrowDown")
            arrow_down2 = page.evaluate("() => { const a = document.activeElement; const links = [...document.querySelectorAll('.search-panel a[href]')]; return links.indexOf(a); }")
            page.keyboard.press("ArrowUp")
            page.keyboard.press("ArrowUp")
            arrow_up = page.evaluate("() => document.activeElement && document.activeElement.id")
            page.keyboard.press("Escape")
            after_esc = page.evaluate("() => ({ hidden: document.querySelector('.search-panel').hidden, active: document.activeElement.tagName, open: document.querySelector('.site-header').classList.contains('search-open') })")
            page.keyboard.press("/")
            reopened = False
            try:
                page.wait_for_selector(".search-panel:not([hidden]) .search-group", timeout=3000)
                reopened = True
            except Exception:
                reopened = False
            with page.expect_navigation(wait_until="load"):
                page.keyboard.press("Enter")
            landed = page.evaluate("(term) => ({ url: location.href, hasTerm: document.body.innerText.toLowerCase().includes(term), page: document.body.dataset.page })", SEARCH_TERM)
            ok = (focused["id"] == "search" and focused["visible"] and groups >= 1 and panel["role"] == "dialog" and panel["label"] == "Search results" and panel["marks"] >= 1
                  and panel["top"] >= panel["headerBottom"] - 1 and panel["overflow"] and arrow_down["tag"] == "A" and arrow_down["inPanel"] and arrow_down2 == 1 and arrow_up == "search"
                  and after_esc["hidden"] is True and after_esc["active"] == "BODY" and after_esc["open"] is False and reopened and landed["hasTerm"] and landed["url"].endswith(panel["firstHref"] or "∅"))
            self.record(SEARCH_PAGE, width, "light", [check("search", ok, {"focused": focused, "groups": groups, "panel": panel, "arrowDown": arrow_down, "arrowDown2": arrow_down2, "arrowUp": arrow_up, "afterEsc": after_esc, "reopened": reopened, "landed": landed})])
            print(f"{SEARCH_PAGE:11} {width:5} search {'OK' if ok else 'FAIL'} groups={groups} hits={panel['hits']} marks={panel['marks']} esc={after_esc} landed={landed['url'].rsplit('/', 1)[-1]} hasTerm={landed['hasTerm']}")
        finally:
            ctx.close()

    # ---- clipboard: copy-link pills and the code Copy button (s17 has both) -----------------------
    def clipboard(self, browser):
        ctx = self.new_context(browser, 1440, 900)
        try:
            u = urllib.parse.urlsplit(self.base)
            ctx.grant_permissions(["clipboard-read", "clipboard-write"], origin=f"{u.scheme}://{u.netloc}")
            page = ctx.new_page()
            page.goto(self.url(CLIPBOARD_PAGE), wait_until="load")
            page.wait_for_selector(".code-block button.copy-code", timeout=4000)
            before = page.evaluate("""() => { const c = document.querySelector('.anchor-h .copy'); return { href: c.getAttribute('href'), label: c.textContent, expected: location.href.split('#')[0] + c.getAttribute('href') }; }""")
            page.click(".anchor-h .copy")
            page.wait_for_timeout(150)
            link = page.evaluate("""async () => { const c = document.querySelector('.anchor-h .copy'); return { label: c.textContent, clip: await navigator.clipboard.readText(), hash: location.hash }; }""")
            page.wait_for_timeout(COPIED_MS + 200)
            link_after = page.evaluate("() => document.querySelector('.anchor-h .copy').textContent")
            code = page.evaluate("""() => { const b = document.querySelectorAll('.code-block'); return { blocks: b.length, pres: document.querySelectorAll('.prose pre').length,
                buttons: [...document.querySelectorAll('.code-block button.copy-code')].map((x) => Math.round(x.getBoundingClientRect().height)), text: b[0].querySelector('code').textContent.replace(/\\n$/, '') }; }""")
            page.click(".code-block button.copy-code")
            page.wait_for_timeout(150)
            copied = page.evaluate("""async () => ({ label: document.querySelector('.code-block button.copy-code').textContent, clip: await navigator.clipboard.readText() })""")
            ok_link = link["clip"] == before["expected"] and link["label"] == "Copied" and link_after == "link" and link["hash"] == before["href"]
            clip_text = copied["clip"].replace("\r\n", "\n")  # the Windows clipboard stores CRLF
            ok_code = code["blocks"] == code["pres"] >= 1 and all(40 <= h <= 44 for h in code["buttons"]) and clip_text == code["text"] and copied["label"] == "Copied" and "THESIS NARROW" in code["text"]
            self.record(CLIPBOARD_PAGE, 1440, "light", [check("copyLink", ok_link, {"expected": before["expected"], "clipboard": link["clip"], "label": link["label"], "labelAfter": link_after, "hash": link["hash"]}),
                                                         check("codeCopy", ok_code, {"blocks": code["blocks"], "pre": code["pres"], "buttonHeights": code["buttons"], "clipboardChars": len(copied["clip"]), "label": copied["label"], "startsWith": copied["clip"][:40]})])
            print(f"{CLIPBOARD_PAGE:11}  1440 clipboard copy-link {'OK' if ok_link else 'FAIL'} code-copy {'OK' if ok_code else 'FAIL'} clip={link['clip'].rsplit('/', 1)[-1]} code={copied['clip'][:30]!r}")
        finally:
            ctx.close()

    # ---- FEAT-004: tracker round trip s12 -> index -> s12, plan-set rule, s04 answers ---------------
    def tracker_round_trip(self, browser):
        ctx = self.new_context(browser, 1440, 900)
        try:
            page = ctx.new_page()
            rail = """() => { const txt = (el) => (el ? el.textContent.replace(/\\s+/g, ' ').trim() : ''); const li = document.querySelector('.rail-right li[data-set="rungs"]');
                return { count: txt(li && li.querySelector('.count')), bar: li ? li.querySelector('[data-bar]').style.width : null,
                  checked: [...document.querySelectorAll('input[data-track="s12:rungs:0"]')].map((i) => i.checked), rowDone: document.getElementById('t-s12-rungs-0').hasAttribute('data-done'),
                  summary: txt(document.querySelector('.onpage-inline summary')) }; }"""
            page.goto(self.url("s12"), wait_until="load")
            page.wait_for_selector(".rail-right li[data-set='rungs'] [data-bar]", state="attached", timeout=4000)
            page.wait_for_timeout(150)  # tracker.js fetches the manifest before the first count
            before = page.evaluate(rail)
            page.locator('input[data-track="s12:rungs:0"]').first.check()
            try:
                page.wait_for_function("() => document.querySelector('.rail-right li[data-set=\"rungs\"] [data-done]').textContent === '1'", timeout=3000)
            except Exception:
                pass
            after = page.evaluate(rail)
            stored = page.evaluate("(k) => JSON.parse(localStorage.getItem(k) || 'null')", TRACKER_KEY)
            s12_ok = (before["count"] == "0 of 9" and before["checked"] == [False, False] and after["count"] == "1 of 9" and after["checked"] == [True, True]
                      and after["rowDone"] is True and after["bar"] == "11%" and after["summary"] == "On this page · Rungs 1 of 9 done"
                      and stored and stored["items"]["s12:rungs:0"]["done"] is True)
            home = """() => { const txt = (el) => (el ? el.textContent.replace(/\\s+/g, ' ').trim() : ''); const li = document.querySelector('li[data-set="rungs"]'); const plan = document.querySelector('li[data-set="plan"]');
                return { rungs: txt(li.querySelector('.count')), plan: txt(plan.querySelector('.count')), planLabel: txt(plan.querySelector(':scope > span')), overall: txt(document.querySelector('.progress-note')) }; }"""
            page.goto(self.url("index"), wait_until="load")
            try:
                page.wait_for_function("() => document.querySelector('li[data-set=\"rungs\"] [data-done]').textContent === '1'", timeout=3000)
            except Exception:
                pass
            h1 = page.evaluate(home)
            home_ok = h1["rungs"] == "1 of 9" and h1["plan"] == "0 of 24" and h1["planLabel"] == "Plan months (§15, choose a plan first)" and h1["overall"].startswith("Overall 1 of 122 items (plan months are counted once a plan is chosen).")
            # D6 plan-set rule: with a 10 h plan the plan row resolves to plan-10h and joins the overall count
            page.evaluate("(a) => { localStorage.setItem(a[0], JSON.stringify({ hoursPerWeek: 10 })); const t = JSON.parse(localStorage.getItem(a[1])); t.items['s15:plan-10h:1'] = { done: true, at: 'audit' }; t.items['s15:plan-20h:2'] = { done: true, at: 'audit' }; localStorage.setItem(a[1], JSON.stringify(t)); }", [PLAN_KEY, TRACKER_KEY])
            page.reload(wait_until="load")
            try:
                page.wait_for_function("() => document.querySelector('li[data-set=\"plan\"] [data-done]').textContent === '1'", timeout=3000)
            except Exception:
                pass
            h2 = page.evaluate(home)
            plan_ok = h2["rungs"] == "1 of 9" and h2["plan"] == "1 of 24" and h2["planLabel"] == "Plan months, 10 h plan (§15)" and h2["overall"].startswith("Overall 2 of 146 items")
            page.goto(self.url("s12"), wait_until="load")
            page.wait_for_timeout(200)
            back = page.evaluate(rail)
            back_ok = back["checked"] == [True, True] and back["count"] == "1 of 9" and back["rowDone"] is True
            ok = s12_ok and home_ok and plan_ok and back_ok
            self.record("s12", 1440, "light", [check("trackerRoundTrip", ok, {"s12Before": before, "s12After": after, "index": h1, "indexWithPlan": h2, "s12Back": back})])
            print(f"{'s12':11}  1440 tracker round trip {'OK' if ok else 'FAIL'} s12={after['count']} index={h1['rungs']} plan={h2['plan']} overall={h2['overall'][:22]} back={back['checked']}")
            # Decision 21: s04 answers count
            page.evaluate("(k) => localStorage.setItem(k, JSON.stringify({ hoursPerWeek: 10, answers: { 's04:questions:1': 'yes', 's04:questions:7': '12', 's04:questions:9': '   ' } }))", PLAN_KEY)
            page.goto(self.url("s04"), wait_until="load")
            try:
                page.wait_for_function("() => document.querySelector('li[data-set=\"questions\"] [data-done]').textContent === '2'", timeout=3000)
            except Exception:
                pass
            a = page.evaluate("""() => { const txt = (el) => (el ? el.textContent.replace(/\\s+/g, ' ').trim() : ''); const li = document.querySelector('.rail-right li[data-set="questions"]');
                return { label: txt(li.querySelector(':scope > span')), count: txt(li.querySelector('.count')), summary: txt(document.querySelector('.onpage-inline summary')), bar: li.querySelector('[data-bar]').style.width }; }""")
            a_ok = a["label"] == "Answers (§4)" and a["count"] == "2 of 18" and a["summary"] == "On this page · Answers 2 of 18" and a["bar"] == "11%"
            self.record("s04", 1440, "light", [check("answersCount", a_ok, a)])
            print(f"{'s04':11}  1440 answers count {'OK' if a_ok else 'FAIL'} {a}")
        finally:
            ctx.close()

    # ---- FEAT-004: My plan behaviours: prompt, export, import (invalid + merge), reset ---------------
    def plan_behaviours(self, browser):
        snapshot = "(keys) => Object.fromEntries(keys.concat(['%s']).map((k) => [k, localStorage.getItem(k)]))" % THEME_KEY
        keys_js = [TRACKER_KEY, PLAN_KEY, TRIAGE_KEY]
        # 1. empty storage: the prompt card with the Q7 rule, no numbers
        ctx = self.new_context(browser, 1440, 900)
        try:
            page = ctx.new_page()
            page.goto(self.url("plan"), wait_until="load")
            page.wait_for_selector("#plan-app[data-ready]", timeout=4000)
            s = page.evaluate(PLAN_JS)
            rule_html = page.request.get(f"{self.base}plan-data.json").json()["hoursRule"]["ruleHtml"]
            rule_text = re.sub(r"\s+", " ", html_mod.unescape(re.sub(r"<[^>]+>", "", rule_html))).strip()
            # the stat grid and the empty left column must not be rendered (computed display), and the §4 questions
            # take the full grid width in two columns at 1440 (no empty half, D4)
            ok = (s["promptHidden"] is False and s["promptRendered"] is True and s["ruleText"] == rule_text and rule_text.startswith("≤12 → 10 h plan. ≥18 → 20 h plan. Between →")
                  and s["statsHidden"] is True and s["statsRendered"] is False and s["leftRendered"] is False and s["questionsWidth"] == 1.0 and s["questionTops"] == 9
                  and s["monthRows"] == 0 and all(v == "—" for v in s["statValues"]) and not re.search(r"\d", "".join(s["statValues"])))
            self.record("plan", 1440, "light", [check("planPrompt", ok, {"promptHidden": s["promptHidden"], "promptRendered": s["promptRendered"], "rule": s["ruleText"][:90], "ruleMatches": s["ruleText"] == rule_text, "statsHidden": s["statsHidden"], "statsRendered": s["statsRendered"], "leftRendered": s["leftRendered"], "questionsWidth": s["questionsWidth"], "questionRows": s["questionTops"], "statValues": s["statValues"], "monthRows": s["monthRows"]})])
            print(f"{'plan':11}  1440 prompt(empty storage) {'OK' if ok else 'FAIL'} rule={s['ruleText'][:50]!r} statsRendered={s['statsRendered']} questions={s['questionsWidth']}x{s['questionTops']}rows")
        finally:
            ctx.close()
        # 2–4. with the fixture: export, invalid import, merge import, reset
        ctx = self.new_context(browser, 1440, 900, name="plan")
        scratch = []
        try:
            page = ctx.new_page()
            page.goto(self.url("plan"), wait_until="load")
            page.wait_for_selector("#plan-app[data-ready='plan']", timeout=4000)
            with page.expect_download(timeout=5000) as dl:
                page.click("#plan-export")
            download = dl.value
            with open(download.path(), "r", encoding="utf-8") as f:
                exported = json.load(f)
            name_ok = re.fullmatch(r"physical-ai-roadmap-export-\d{4}-\d{2}-\d{2}\.json", download.suggested_filename) is not None
            exp_ok = (name_ok and exported.get("version") == 1 and all(k in exported for k in ("tracker", "plan", "triage", "exportedAt"))
                      and exported["plan"].get("hoursPerWeek") == 10 and exported["plan"].get("track") == "B" and exported["plan"].get("weeklyHours") == {"1": 10, "2": 8})
            self.record("plan", 1440, "light", [check("planExport", exp_ok, {"filename": download.suggested_filename, "keys": sorted(exported.keys()), "version": exported.get("version"), "plan": exported.get("plan")})])
            print(f"{'plan':11}  1440 export {'OK' if exp_ok else 'FAIL'} {download.suggested_filename} keys={sorted(exported.keys())}")
            # invalid imports: version 2, then non-JSON — inline error, storage unchanged
            tmpdir = tempfile.gettempdir()
            results = []
            for label, content in (("version2", '{"version": 2, "tracker": {"items": {}}}'), ("notjson", "not json at all")):
                path = os.path.join(tmpdir, f"pair-import-{label}-{os.getpid()}.json")
                with open(path, "w", encoding="utf-8") as f:
                    f.write(content)
                scratch.append(path)
                before = page.evaluate(snapshot, keys_js)
                page.evaluate("() => { const m = document.getElementById('plan-msg'); m.hidden = true; m.textContent = ''; m.classList.remove('error'); }")
                page.set_input_files("#plan-import-file", path)
                try:
                    page.wait_for_selector("#plan-msg.error:not([hidden])", timeout=3000)
                except Exception:
                    pass
                msg = page.evaluate("() => { const m = document.getElementById('plan-msg'); const r = m.getBoundingClientRect(); return { text: m.textContent, error: m.classList.contains('error'), hidden: m.hidden, visible: r.width > 1 && r.height > 1, role: m.getAttribute('role') }; }")
                after = page.evaluate(snapshot, keys_js)
                results.append({"file": label, "msg": msg, "unchanged": before == after})
            inv_ok = all(r["msg"]["error"] and r["msg"]["visible"] and r["msg"]["text"].startswith("Import failed") and r["unchanged"] for r in results)
            self.record("plan", 1440, "light", [check("planImportInvalid", inv_ok, results)])
            print(f"{'plan':11}  1440 import(invalid) {'OK' if inv_ok else 'FAIL'} {[r['msg']['text'][:60] for r in results]}")
            # valid import merges after confirm(): track C and rung 3 arrive, 10 h / start date / rung 0 stay
            page.evaluate("(k) => localStorage.setItem(k, JSON.stringify({ items: { 's12:rungs:0': { done: true, at: 'audit' } } }))", TRACKER_KEY)
            good = os.path.join(tmpdir, f"pair-import-good-{os.getpid()}.json")
            with open(good, "w", encoding="utf-8") as f:
                json.dump({"version": 1, "exportedAt": "2026-10-21T00:00:00Z", "tracker": {"items": {"s12:rungs:3": {"done": True, "at": "import"}}}, "plan": {"track": "C"}}, f)
            scratch.append(good)
            page.once("dialog", lambda d: d.accept())
            page.set_input_files("#plan-import-file", good)
            try:
                page.wait_for_function("() => { const m = document.getElementById('plan-msg'); return !m.hidden && !m.classList.contains('error') && m.textContent.startsWith('Imported'); }", timeout=3000)
            except Exception:
                pass
            merged = page.evaluate("(a) => ({ tracker: JSON.parse(localStorage.getItem(a[0])), plan: JSON.parse(localStorage.getItem(a[1])), msg: document.getElementById('plan-msg').textContent, pressedTrack: [...document.querySelectorAll('.track-group button')].map((b) => b.getAttribute('aria-pressed')) })", [TRACKER_KEY, PLAN_KEY])
            merge_ok = (set(merged["tracker"]["items"].keys()) == {"s12:rungs:0", "s12:rungs:3"} and merged["plan"].get("track") == "C" and merged["plan"].get("hoursPerWeek") == 10
                        and merged["plan"].get("startDate") == plan_fixture()["startDate"] and merged["plan"].get("weeklyHours") == {"1": 10, "2": 8}
                        and merged["pressedTrack"] == ["false", "false", "false", "true"] and merged["msg"].startswith("Imported 2 entries"))
            self.record("plan", 1440, "light", [check("planImportMerge", merge_ok, {"trackerIds": sorted(merged["tracker"]["items"].keys()), "plan": merged["plan"], "msg": merged["msg"], "pressedTrack": merged["pressedTrack"]})])
            print(f"{'plan':11}  1440 import(merge) {'OK' if merge_ok else 'FAIL'} ids={sorted(merged['tracker']['items'].keys())} track={merged['plan'].get('track')} hours={merged['plan'].get('hoursPerWeek')}")
            # reset: the three data keys go, the theme stays
            page.evaluate("(k) => localStorage.setItem(k, 'dark')", THEME_KEY)
            page.once("dialog", lambda d: d.accept())
            page.click("#plan-reset")
            try:
                page.wait_for_selector("#plan-prompt:not([hidden])", timeout=3000)
            except Exception:
                pass
            after_reset = page.evaluate(snapshot, keys_js)
            reset_ok = all(after_reset[k] is None for k in keys_js) and after_reset[THEME_KEY] == "dark" and page.evaluate("() => document.getElementById('plan-prompt').hidden") is False
            self.record("plan", 1440, "light", [check("planReset", reset_ok, after_reset)])
            print(f"{'plan':11}  1440 reset {'OK' if reset_ok else 'FAIL'} {after_reset}")
        finally:
            ctx.close()
            for pth in scratch:
                try:
                    os.remove(pth)
                except OSError:
                    pass

    # ---- FEAT-005: feed filters, triage persistence, dropped state contrast, home widget ------------
    def feed_behaviours(self, browser):
        ctx = self.new_context(browser, 1440, 900)
        try:
            page = ctx.new_page()
            page.goto(self.url("feed"), wait_until="load")
            page.wait_for_selector("[data-feed-list][data-feed-ready='ok']", timeout=6000)
            data = feed_data(page)
            items = sorted_items(data["feed"])
            total = len(items)
            visible = "() => [...document.querySelectorAll('.feed-item:not(.feed-message)')].map((li) => li.dataset.id)"
            state = """() => { const txt = (el) => (el ? el.textContent.replace(/\\s+/g, ' ').trim() : ''); const first = document.querySelector('.feed-item');
                return { visible: document.querySelectorAll('.feed-item:not(.feed-message)').length, status: txt(document.querySelector('[data-feed-status]')),
                  counts: Object.fromEntries([...document.querySelectorAll('[data-count]')].map((s) => [s.dataset.count, s.textContent])),
                  pressed: Object.fromEntries([...document.querySelectorAll('button[data-filter][aria-pressed="true"]')].map((b) => [b.dataset.filter, b.dataset.value])),
                  firstId: first && first.dataset.id, firstTriage: first ? [...first.querySelectorAll('.triage .btn')].map((b) => b.getAttribute('aria-pressed')) : null,
                  dropped: [...document.querySelectorAll('.feed-item.dropped')].map((li) => li.dataset.id) }; }"""
            s0 = page.evaluate(state)
            # class filter
            page.click('button[data-filter="class"][data-value="release"]')
            page.wait_for_timeout(80)
            releases = [it["id"] for it in items if it["sourceClass"] == "release"]
            s1 = page.evaluate(state)
            v1 = page.evaluate(visible)
            class_ok = s0["visible"] == total and s1["visible"] == len(releases) and v1 == releases and s1["pressed"].get("class") == "release" and s1["status"].startswith(f"Showing {len(releases)} of {total} items")
            page.click('button[data-filter="class"][data-value="all"]')
            # query filter (toggle)
            label = "Aerial autonomy"
            page.click(f'button[data-filter="query"][data-value="{label}"]')
            page.wait_for_timeout(80)
            matching = [it["id"] for it in items if label in [it.get("matchedQuery")] + list(it.get("alsoMatched") or [])]
            v2 = page.evaluate(visible)
            s2 = page.evaluate(state)
            page.click(f'button[data-filter="query"][data-value="{label}"]')
            page.wait_for_timeout(80)
            s3 = page.evaluate(state)
            query_ok = v2 == matching and s2["pressed"].get("query") == label and s3["visible"] == total and "query" not in s3["pressed"]
            self.record("feed", 1440, "light", [check("feedClassFilter", class_ok, {"all": s0["visible"], "releases": s1["visible"], "expected": len(releases), "status": s1["status"][:60], "pressed": s1["pressed"]}),
                                                check("feedQueryFilter", query_ok, {"label": label, "visible": len(v2), "expected": len(matching), "afterToggle": s3["visible"]})])
            print(f"{'feed':11}  1440 class filter {'OK' if class_ok else 'FAIL'} releases={s1['visible']}/{len(releases)} · query filter {'OK' if query_ok else 'FAIL'} {label}={len(v2)}/{len(matching)}")
            # Keep on the first item persists across a reload
            first_id = s0["firstId"]
            page.click('.feed-item:first-child .triage button[data-triage="keep"]')
            page.wait_for_timeout(80)
            k1 = page.evaluate(state)
            stored = page.evaluate("(k) => JSON.parse(localStorage.getItem(k) || 'null')", TRIAGE_KEY)
            page.reload(wait_until="load")
            page.wait_for_selector("[data-feed-list][data-feed-ready='ok']", timeout=6000)
            k2 = page.evaluate(state)
            keep_ok = (k1["firstTriage"] == ["true", "false", "false"] and k1["counts"]["keep"] == "1" and stored and stored.get(first_id, {}).get("state") == "keep"
                       and k2["firstId"] == first_id and k2["firstTriage"] == ["true", "false", "false"] and k2["counts"]["keep"] == "1")
            self.record("feed", 1440, "light", [check("feedKeepPersists", keep_ok, {"afterClick": k1["firstTriage"], "stored": stored and stored.get(first_id), "afterReload": k2["firstTriage"], "counts": k2["counts"]})])
            print(f"{'feed':11}  1440 keep persists {'OK' if keep_ok else 'FAIL'} {k2['firstTriage']} stored={stored and stored.get(first_id)}")
            # Drop hides the second item until the Dropped filter is active; the dropped state stays AA in both themes
            second_id = items[1]["id"]
            page.click(f'.feed-item[data-id="{second_id}"] .triage button[data-triage="drop"]')
            page.wait_for_timeout(80)
            d1 = page.evaluate(state)
            v3 = page.evaluate(visible)
            page.click('button[data-filter="triage"][data-value="drop"]')
            page.wait_for_timeout(80)
            d2 = page.evaluate(state)
            v4 = page.evaluate(visible)
            drop_pressed = page.evaluate("(id) => [...document.querySelector(`.feed-item[data-id=\"${id}\"] .triage`).querySelectorAll('.btn')].map((b) => b.getAttribute('aria-pressed'))", second_id)
            drop_ok = (second_id not in v3 and d1["visible"] == total - 1 and d1["counts"]["drop"] == "1" and d1["status"].startswith(f"Showing {total - 1} of {total} items")
                       and v4 == [second_id] and d2["dropped"] == [second_id] and drop_pressed == ["false", "false", "true"])
            contrast = {}
            for theme in self.themes:
                page.evaluate("(t) => { document.documentElement.dataset.theme = t; }", theme)
                page.wait_for_timeout(60)
                a = page.evaluate(AUDIT_JS)
                items_ = generic_checks(1440, a)
                self.record("feed", 1440, f"{theme} dropped-state", items_)
                contrast[theme] = a["pairs"][0]["ratio"] if a["pairs"] else None
                drop_ok = drop_ok and all(c["pass"] for c in items_)
            page.evaluate("() => { document.documentElement.dataset.theme = 'light'; }")
            page.click('button[data-filter="triage"][data-value="all"]')
            page.wait_for_timeout(80)
            d3 = page.evaluate(state)
            drop_ok = drop_ok and d3["visible"] == total - 1
            self.record("feed", 1440, "light", [check("feedDropHides", drop_ok, {"hiddenAfterDrop": second_id not in v3, "visibleAfterDrop": d1["visible"], "droppedFilterShows": v4, "pressed": drop_pressed, "minContrastDroppedState": contrast, "afterEverything": d3["visible"]})])
            print(f"{'feed':11}  1440 drop hides {'OK' if drop_ok else 'FAIL'} visible={d1['visible']}/{total} droppedFilter={len(v4)} contrast={contrast}")
            # Home "Latest from the feed": the 5 newest non-dropped items from feed.json
            page.goto(self.url("index"), wait_until="load")
            try:
                page.wait_for_selector("[data-feed-updated]:not([hidden])", timeout=4000)
            except Exception:
                pass
            home = page.evaluate("""() => { const txt = (el) => (el ? el.textContent.replace(/\\s+/g, ' ').trim() : '');
                return { titles: [...document.querySelectorAll('#latest-feed li h3 a')].map(txt), note: txt(document.querySelector('[data-feed-updated]')) }; }""")
            exp_titles = [it["title"] for it in items if it["id"] != second_id][:5]
            home_ok = home["titles"] == exp_titles and len(exp_titles) == 5 and home["note"] == f"Feed last updated {fmt_last_updated(data['meta'].get('generatedAt'))}. GitHub may delay or skip scheduled runs."
            self.record("index", 1440, "light", [check("feedLatestHome", home_ok, {"dom": home["titles"], "expected": exp_titles, "note": home["note"]})])
            print(f"{'index':11}  1440 latest from the feed {'OK' if home_ok else 'FAIL'} {len(home['titles'])} items, dropped item excluded={second_id not in [it['id'] for it in items if it['title'] in home['titles']]}")
        finally:
            ctx.close()

    # ---- screenshots (FEAT-007) -----------------------------------------------------------------
    def shot(self, browser, name, w, h, dsf, theme, prefix):
        """One viewport-only PNG <prefix><name>-<w>-<theme>.png; the theme is seeded in storage so the real bootstrap paints it."""
        ctx = browser.new_context(viewport={"width": w, "height": h}, device_scale_factor=dsf, reduced_motion="reduce")
        ctx.add_init_script("(() => { try { localStorage.setItem('%s', '%s'); } catch (e) {} })();" % (THEME_KEY, theme))
        if name in PAGE_INIT:
            ctx.add_init_script(PAGE_INIT[name])
        try:
            page = ctx.new_page()
            page.goto(self.url(name), wait_until="load")
            if name in ("index", "feed"):
                try:  # home.js / feed.js fill their lists after fetching data/*.json
                    page.wait_for_selector("[data-feed-updated]:not([hidden]), [data-feed-list][data-feed-ready]", timeout=4000)
                except Exception:
                    pass
            page.wait_for_timeout(120)
            out = pathlib.Path(f"{prefix}{name}-{w}-{theme}.png")
            out.parent.mkdir(parents=True, exist_ok=True)
            page.screenshot(path=str(out), full_page=False)
            expected = [round(w * dsf), round(h * dsf)]
            measured = png_size(out)
            ok = measured is not None and list(measured) == expected and max(measured) <= SHOT_MAX_SIDE
            self.record(name, w, theme, [check("shotPixels", ok, {"file": str(out), "expected": expected, "measured": list(measured) if measured else None})])
            print(f"shot {out} {measured[0]}x{measured[1]} {'OK' if ok else 'FAIL'}" if measured else f"shot {out} not a PNG FAIL")
            return {"file": str(out), "page": name, "width": w, "theme": theme, "dsf": dsf, "pixels": expected, "measured": list(measured) if measured else None, "ok": ok}
        finally:
            ctx.close()

    def shots(self, browser, names, prefix, extras=()):
        """SHOT_PAGES x SHOT_VIEWPORTS x --themes, then the extras; returns the list the report carries as `shots`."""
        written = []
        for name in names:
            for (w, h, dsf) in SHOT_VIEWPORTS:
                for theme in self.themes:
                    written.append(self.shot(browser, name, w, h, dsf, theme, prefix))
        viewport = {w: (h, dsf) for (w, h, dsf) in SHOT_VIEWPORTS}
        for (name, w, theme) in extras:
            h, dsf = viewport[w]
            written.append(self.shot(browser, name, w, h, dsf, theme, prefix))
        return written

    # ---- driver ---------------------------------------------------------------------------------
    def run(self):
        started = datetime.datetime.now(datetime.timezone.utc)
        report = {"generatedAt": started.isoformat(), "base": self.base, "browser": "msedge headless, --disable-lcd-text", "pages": self.args.pages, "extraPages": self.args.extra_pages, "widths": self.widths, "themes": self.themes, "thresholds": THRESHOLDS}
        with sync_playwright() as p:
            browser = p.chromium.launch(channel="msedge", headless=True, args=LAUNCH_ARGS)
            try:
                for name in self.args.pages:
                    self.run_page(browser, name, full=True)
                for name in self.args.extra_pages:
                    self.run_page(browser, name, full=False)
                for name in FIRST_PAINT_PAGES:
                    if name in self.args.pages:
                        self.first_paint(browser, name)
                if not self.args.no_specials:
                    self.keys(browser)
                    self.print_check(browser)
                    self.reading_position(browser)
                    self.clipboard(browser)
                    for w in SEARCH_WIDTHS:
                        self.search(browser, w)
                    self.tracker_round_trip(browser)
                    self.plan_behaviours(browser)
                    self.feed_behaviours(browser)
                if self.args.shots:
                    report["shots"] = self.shots(browser, self.args.shot_pages, self.args.shots, self.args.shot_extras)
            finally:
                browser.close()
        failures = [c for c in self.checks if not c["pass"]]
        report["checks"] = self.checks
        report["failures"] = failures
        report["pageDetails"] = self.pages
        report["summary"] = self.summary(failures)
        return report

    def summary(self, failures):
        def minimum(name, theme=None, widths=None):
            vals = []
            for c in self.checks:
                if c["name"] != name or (theme and c["theme"] != theme) or (widths and c["width"] not in widths):
                    continue
                v = c["value"]
                if name == "contrastAA":
                    v = v.get("minRatio")
                elif name == "minFont12":
                    v = v.get("minFont")
                if isinstance(v, (int, float)):
                    vals.append(v)
            return min(vals) if vals else None
        s = {
            "pass": len(failures) == 0,
            "failureCount": len(failures),
            "checkCount": len(self.checks),
            "pagesAudited": len(self.pages),
            "minContrast": {t: minimum("contrastAA", theme=t) for t in self.themes},
            "minFont": minimum("minFont12"),
            "bodyFont": {str(w): minimum("bodyFont", widths=[w]) for w in self.widths if w in (320, 390, 2560)},
            "contentRatio": {str(w): minimum("contentRatio88", widths=[w]) for w in self.widths if w >= 1920},
        }
        s["elapsedSeconds"] = None  # filled by main()
        return s


def parse_args(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--base", required=True, help="served site root, e.g. http://127.0.0.1:8790/physical-ai-roadmap/")
    ap.add_argument("--pages", default="index,s03,s12,s15,appendix-a,plan,feed", help="pages that get every check and their GROUPS")
    ap.add_argument("--extra-pages", default="", help="pages that get the generic checks only")
    ap.add_argument("--widths", default=",".join(map(str, DEFAULT_WIDTHS)))
    ap.add_argument("--themes", default=",".join(DEFAULT_THEMES))
    ap.add_argument("--shots", default="", help="PNG path prefix; writes <prefix><page>-<width>-<theme>.png (viewport only, 2560 at dsf 0.75)")
    ap.add_argument("--shot-pages", default=",".join(SHOT_PAGES), help="pages to screenshot at every SHOT_VIEWPORTS x --themes (default: %s)" % ",".join(SHOT_PAGES))
    ap.add_argument("--shot-extras", default=SHOT_EXTRAS, help="extra single shots as <page>:<width>:<theme>, comma-separated (default: %s; '' for none)" % SHOT_EXTRAS)
    ap.add_argument("--report", default="", help="write the JSON report here")
    ap.add_argument("--no-specials", action="store_true", help="skip the keyboard (s11), print (s12), reading-position (s06), search (index), tracker round trip (s12/index/s04) and My plan behaviour checks")
    ap.add_argument("--link-counts", default="", help="OF-7 link parity reference: page=markdownHttpLinks pairs, e.g. s12=21,s03=23 (verify.mjs computes them)")
    ap.add_argument("--protocol-cells", default="", help="DR-5 reference: path of a JSON array with every cell string of the §17.1 table (verify.mjs writes it)")
    a = ap.parse_args(argv)
    if a.protocol_cells:
        PROTOCOL_CELLS.update(json.loads(pathlib.Path(a.protocol_cells).read_text(encoding="utf-8")))
    split = lambda s: [x.strip() for x in s.split(",") if x.strip()]  # noqa: E731
    a.pages = split(a.pages)
    a.extra_pages = [x for x in split(a.extra_pages) if x not in a.pages]
    a.widths = [int(x) for x in split(a.widths)]
    a.themes = split(a.themes)
    a.shot_pages = split(a.shot_pages)
    a.shot_extras = parse_shot_extras(a.shot_extras)
    for pair in split(a.link_counts):
        name, _, n = pair.partition("=")
        if name and n.isdigit():
            LINK_COUNTS[name] = int(n)
    return a


def main(argv=None):
    args = parse_args(argv)
    t0 = datetime.datetime.now(datetime.timezone.utc)
    try:
        report = Audit(args).run()
    except Exception:
        traceback.print_exc()
        print("AUDIT ERROR")
        return 2
    report["summary"]["elapsedSeconds"] = round((datetime.datetime.now(datetime.timezone.utc) - t0).total_seconds(), 1)
    if args.report:
        out = pathlib.Path(args.report)
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(json.dumps(report, indent=1, ensure_ascii=False), encoding="utf-8")
    s = report["summary"]
    print(f"AUDIT {'PASS' if s['pass'] else 'FAIL (' + str(s['failureCount']) + ')'} · pages {s['pagesAudited']} · widths {','.join(map(str, args.widths))} · themes {','.join(args.themes)} · checks {s['checkCount']} · minContrast {s['minContrast']} · minFont {s['minFont']} · bodyFont {s['bodyFont']} · contentRatio {s['contentRatio']} · {s['elapsedSeconds']}s")
    for f in report["failures"][:40]:
        print(f"  FAIL {f['page']} {f['width']} {f['theme']} {f['name']}: {json.dumps(f['value'], ensure_ascii=False)[:300]}")
    return 0 if s["pass"] else 1


if __name__ == "__main__":
    sys.exit(main())
