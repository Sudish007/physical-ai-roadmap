import json, sys, pathlib
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
from playwright.sync_api import sync_playwright

TASK = pathlib.Path(r"c:/Users/sudiskmr/Downloads/DomainClassification/physical-ai-roadmap/.agents/tasks/site-build")
MOCKS = {"home": "home.html", "section": "section.html", "my-plan": "my-plan.html", "feed": "feed.html"}
SHOT_VIEWPORTS = [(390, 844, 1), (1440, 900, 1), (1920, 1080, 1), (2560, 1440, 0.75)]
AUDIT_VIEWPORTS = [(320, 568), (360, 740), (390, 844), (820, 1180), (1024, 768), (1440, 900), (1920, 1080), (2560, 1440)]
THEMES = ["light", "dark"]
ONLY = set(a for a in sys.argv[1:] if ":" in a)

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
  const pairs = new Map(); let minFont = Infinity; let minFontEl = ''; let textEls = 0;
  for (const el of document.body.querySelectorAll('*')) {
    let hasText = false;
    for (const ch of el.childNodes) if (ch.nodeType === 3 && ch.textContent.trim()) { hasText = true; break; }
    if (!hasText) continue;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    const r = el.getBoundingClientRect(); if (r.width < 2 || r.height < 2) continue;
    if (!el.getClientRects().length) continue;
    if (effectiveOpacity(el) === 0) continue;
    textEls++;
    const fs = parseFloat(cs.fontSize);
    if (fs < minFont) { minFont = fs; minFontEl = el.tagName.toLowerCase() + (el.className ? '.' + String(el.className).split(' ')[0] : ''); }
    let fg = parse(cs.color); if (!fg) continue;
    const bg = effectiveBg(el);
    if (fg.a < 1) fg = over(fg, bg);
    const op = effectiveOpacity(el);
    if (op < 1) fg = over({ ...fg, a: op }, bg);
    const bold = parseInt(cs.fontWeight, 10) >= 700;
    const large = fs >= 24 || (bold && fs >= 18.66);
    const key = hex(fg) + '/' + hex(bg);
    const rt = ratio(fg, bg);
    const prev = pairs.get(key);
    const sample = (el.textContent || '').trim().slice(0, 40);
    if (!prev) pairs.set(key, { fg: hex(fg), bg: hex(bg), ratio: Math.round(rt * 100) / 100, large, count: 1, sample, el: el.tagName.toLowerCase() + (el.className ? '.' + String(el.className).split(' ')[0] : '') });
    else { prev.count++; prev.large = prev.large && large; }
  }
  const main = document.querySelector('.page.layout') || document.querySelector('main.page') || document.body;
  const mcs = getComputedStyle(main); const mr = main.getBoundingClientRect();
  const contentBox = mr.width - parseFloat(mcs.paddingLeft) - parseFloat(mcs.paddingRight);
  const controls = [...document.querySelectorAll('button, input:not([type=checkbox]), select, .search-box, .check')].filter((e) => e.getClientRects().length).map((e) => Math.round(e.getBoundingClientRect().height));
  const feedGeom = { items: 0, overlaps: 0, titleMisaligned: 0 };
  for (const item of document.querySelectorAll('.feed-item')) {
    feedGeom.items++;
    const kids = [...item.children].filter((k) => k.getClientRects().length).map((k) => ({ k, r: k.getBoundingClientRect() }));
    for (let i = 0; i < kids.length; i++) for (let j = i + 1; j < kids.length; j++) {
      const a = kids[i].r, b = kids[j].r;
      if (a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1) feedGeom.overlaps++;
    }
    const title = item.querySelector('h3'); const ir = item.getBoundingClientRect(); const ics = getComputedStyle(item);
    if (title && Math.abs(title.getBoundingClientRect().left - (ir.left + parseFloat(ics.paddingLeft))) > 1) feedGeom.titleMisaligned++;
  }
  return {
    feedGeom,
    scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth, innerWidth: innerWidth,
    bodyFont: parseFloat(getComputedStyle(document.body).fontSize), minFont, minFontEl, textEls,
    contentBox: Math.round(contentBox), contentRatio: Math.round(contentBox / innerWidth * 1000) / 1000,
    controlHeights: { min: Math.min(...controls), max: Math.max(...controls) },
    pairs: [...pairs.values()].sort((a, b) => a.ratio - b.ratio),
  };
}
"""

report = {"generatedAt": None, "browser": "msedge headless, --disable-lcd-text (grayscale antialiasing; see OF-7)", "thresholds": {"feedItemGeometry": "no two child boxes of a .feed-item intersect; title left edge == content column left edge (OF-1)", "overflow": "scrollWidth <= clientWidth", "bodyFont": ">=17px at 390, >=21px at 2560", "minFont": ">=12px", "contentRatio": ">=0.88 at >=1920", "contrast": "AA: >=4.5 normal, >=3.0 large", "controls": "40-44px (checkbox hit target 44)"}, "pages": {}, "failures": []}
import datetime
report["generatedAt"] = datetime.datetime.now(datetime.timezone.utc).isoformat()

with sync_playwright() as p:
    browser = p.chromium.launch(channel="msedge", headless=True, args=["--disable-lcd-text"])
    # Screenshots
    for name, file in MOCKS.items():
        url = (TASK / "mocks" / file).resolve().as_uri()
        for (w, h, dsf) in SHOT_VIEWPORTS:
            ctx = browser.new_context(viewport={"width": w, "height": h}, device_scale_factor=dsf, reduced_motion="reduce")
            page = ctx.new_page()
            page.goto(url, wait_until="load")
            for theme in THEMES:
                if ONLY and f"{name}:{w}:{theme}" not in ONLY: continue
                page.evaluate("t => { document.documentElement.dataset.theme = t; }", theme)
                page.wait_for_timeout(120)
                out = TASK / "shots" / f"mock-{name}-{w}-{theme}.png"
                page.screenshot(path=str(out), full_page=False)
                print("shot", out.name)
            ctx.close()
    # Audit
    for name, file in MOCKS.items():
        url = (TASK / "mocks" / file).resolve().as_uri()
        report["pages"][name] = {}
        for (w, h) in AUDIT_VIEWPORTS:
            ctx = browser.new_context(viewport={"width": w, "height": h}, device_scale_factor=1, reduced_motion="reduce")
            page = ctx.new_page()
            page.goto(url, wait_until="load")
            # open all <details> so hidden-by-default text is also audited for contrast
            page.evaluate("() => document.querySelectorAll('details').forEach(d => d.open = true)")
            page.wait_for_timeout(80)
            per_theme = {}
            for theme in THEMES:
                page.evaluate("t => { document.documentElement.dataset.theme = t; }", theme)
                page.wait_for_timeout(80)
                a = page.evaluate(AUDIT_JS)
                checks = {}
                checks["noOverflow"] = a["scrollWidth"] <= a["clientWidth"]
                checks["bodyFont"] = (a["bodyFont"] >= 17 if w == 390 else True) and (a["bodyFont"] >= 21 if w == 2560 else True)
                checks["minFont12"] = a["minFont"] >= 12
                checks["contentRatio88"] = (a["contentRatio"] >= 0.88) if w >= 1920 else True
                bad = [pp for pp in a["pairs"] if pp["ratio"] < (3.0 if pp["large"] else 4.5)]
                checks["contrastAA"] = len(bad) == 0
                checks["controls40to44"] = a["controlHeights"]["min"] >= 40 and a["controlHeights"]["max"] <= 44
                checks["feedItemGeometry"] = a["feedGeom"]["overlaps"] == 0 and a["feedGeom"]["titleMisaligned"] == 0
                for k, ok in checks.items():
                    if not ok:
                        report["failures"].append({"page": name, "width": w, "theme": theme, "check": k, "detail": {"scrollWidth": a["scrollWidth"], "clientWidth": a["clientWidth"], "bodyFont": a["bodyFont"], "minFont": a["minFont"], "minFontEl": a["minFontEl"], "contentRatio": a["contentRatio"], "controls": a["controlHeights"], "feedGeom": a["feedGeom"], "badPairs": bad[:6]}})
                per_theme[theme] = {"scrollWidth": a["scrollWidth"], "clientWidth": a["clientWidth"], "bodyFont": a["bodyFont"], "minFont": a["minFont"], "minFontEl": a["minFontEl"], "textEls": a["textEls"], "contentBox": a["contentBox"], "contentRatio": a["contentRatio"], "controlHeights": a["controlHeights"], "feedGeom": a["feedGeom"], "checks": checks, "pairs": a["pairs"]}
                print(f"{name:8} {w:5} {theme:5} scroll={a['scrollWidth']}/{a['clientWidth']} body={a['bodyFont']:.2f} min={a['minFont']:.2f}({a['minFontEl']}) content={a['contentRatio']} ctrl={a['controlHeights']} pairs={len(a['pairs'])} minRatio={a['pairs'][0]['ratio'] if a['pairs'] else None} {'OK' if all(checks.values()) else 'FAIL ' + ','.join(k for k,v in checks.items() if not v)}")
            report["pages"][name][str(w)] = per_theme
            ctx.close()
    browser.close()

report["summary"] = {"pass": len(report["failures"]) == 0, "failureCount": len(report["failures"])}
(TASK / "shots" / "mock-audit.json").write_text(json.dumps(report, indent=1), encoding="utf-8")
print("AUDIT", "PASS" if report["summary"]["pass"] else f"FAIL ({len(report['failures'])})")
