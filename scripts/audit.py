"""Browser audit of the built site (port of .agents/tasks/site-build/shots/mock-audit.py).

Driven by scripts/verify.mjs (`npm run verify`), which serves dist/ and passes --base. Direct use:

    python scripts/audit.py --base http://127.0.0.1:8790/physical-ai-roadmap/ --pages index,s12 \
        [--extra-pages s00,s01] [--widths 320,390,2560] [--themes light,dark] \
        [--shots <prefix>] [--report <path>]

Generic checks run for every page x width x theme with all <details> opened: horizontal overflow, body
font size, smallest visible text, content box ratio, composited WCAG contrast, control heights, gutters,
footer text, [style] attribute count before scripts, securitypolicyviolation events, wide-table min-width
(DR-1). Pages given with --pages also get: the DR-3 dark-emulated first paint (index, plan, s12), the DR-4
theme cycle at 390 and 1440, keyboard navigation (s11), print at 1440 (s12), and their page-type GROUPS.
Pages given with --extra-pages get the generic checks only (verify.mjs --all).

Later FEATs append page-type checks: GROUPS["index"].append(fn) where fn(page, width, theme, ctx) returns a
list of Check dicts (see `check()`); `ctx.page` is the live Playwright page, `ctx.name` the page name.
"""
import argparse
import datetime
import json
import pathlib
import sys
import traceback

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

from playwright.sync_api import sync_playwright  # noqa: E402  (after the stdout reconfigure)

DEFAULT_WIDTHS = [320, 360, 390, 820, 1024, 1440, 1920, 2560]
HEIGHTS = {320: 568, 360: 740, 390: 844, 820: 1180, 1024: 768, 1440: 900, 1920: 1080, 2560: 1440}
SHOT_VIEWPORTS = [(390, 844, 1), (1440, 900, 1), (1920, 1080, 1), (2560, 1440, 0.75)]
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
    "proseColour": "OF-7: text nodes in .prose paragraphs/lists outside links, chips, kbd have the body colour",
    "copyHidden": "OF-10: every .anchor-h .copy has opacity 0 at rest",
}

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
  return { tracks, eightyCh: Math.round(eightyCh * 10) / 10, maxW, paragraphs: paras.length, nodes, off, offSamples, copyOpacities: copies };
}
"""


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
        out.append(check("proseColour", s["off"] == 0 and s["nodes"] > 0, {"nodes": s["nodes"], "off": s["off"], "samples": s["offSamples"]}))
    out.append(check("copyHidden", s["copyOpacities"] == ["0"] or s["copyOpacities"] == [], {"opacities": s["copyOpacities"]}))
    return out


# Page-type check groups, keyed by body[data-page]. FEAT-003 appends to "index" and "section",
# FEAT-004 to "plan", FEAT-005 to "feed". Each fn(page_name, width, theme, ctx) -> [check, ...].
# They run after the generic evaluation, with every <details> open and html[data-theme] set directly.
GROUPS = {
    "index": [],
    "section": [section_checks],
    "plan": [],
    "feed": [],
    "404": [],
}

# Extra init script per page NAME (e.g. FEAT-004: PAGE_INIT["plan"] = "localStorage.setItem('physical-ai-roadmap.v1.plan', ...)")
# so a fixture state exists before the page's modules run. Not applied to the first-paint (DR-3) contexts.
PAGE_INIT = {}


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

    # ---- screenshots ----------------------------------------------------------------------------
    def shots(self, browser, names, prefix):
        written = []
        for name in names:
            for (w, h, dsf) in SHOT_VIEWPORTS:
                for theme in self.themes:
                    ctx = browser.new_context(viewport={"width": w, "height": h}, device_scale_factor=dsf, reduced_motion="reduce")
                    ctx.add_init_script("(() => { try { localStorage.setItem('%s', '%s'); } catch (e) {} })();" % (THEME_KEY, theme))
                    if name in PAGE_INIT:
                        ctx.add_init_script(PAGE_INIT[name])
                    try:
                        page = ctx.new_page()
                        page.goto(self.url(name), wait_until="load")
                        page.wait_for_timeout(120)
                        out = pathlib.Path(f"{prefix}{name}-{w}-{theme}.png")
                        out.parent.mkdir(parents=True, exist_ok=True)
                        page.screenshot(path=str(out), full_page=False)
                        written.append({"file": str(out), "page": name, "width": w, "theme": theme, "pixels": [round(w * dsf), round(h * dsf)]})
                        print("shot", out)
                    finally:
                        ctx.close()
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
                if self.args.shots:
                    report["shots"] = self.shots(browser, self.args.shot_pages or self.args.pages, self.args.shots)
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
    ap.add_argument("--shot-pages", default="", help="pages to screenshot (default: --pages)")
    ap.add_argument("--report", default="", help="write the JSON report here")
    ap.add_argument("--no-specials", action="store_true", help="skip the keyboard (s11) and print (s12) checks")
    a = ap.parse_args(argv)
    split = lambda s: [x.strip() for x in s.split(",") if x.strip()]  # noqa: E731
    a.pages = split(a.pages)
    a.extra_pages = [x for x in split(a.extra_pages) if x not in a.pages]
    a.widths = [int(x) for x in split(a.widths)]
    a.themes = split(a.themes)
    a.shot_pages = split(a.shot_pages)
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
