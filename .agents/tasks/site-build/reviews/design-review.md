# Design review — Physical AI Roadmap site (round 1)

Reviewer: wf-design-reviewer (fresh session). Date: 2026-10-21.
Reviewed: `TASK/design.md` (commit `ea80eed`), `TASK/mocks/*`, `TASK/shots/mock-audit.json`, `TASK/shots/mock-audit.py`, `TASK/probe-pc-2026-10-20.json`, `content/roadmap.md`, `content/SOURCE.md`, and Ahead's `.github/workflows/refresh.yml` (for the "matches Ahead" claims).

Severity rule applied (from the step prompt): HIGH = would violate D1–D11, miss a required v1 feature, invent numbers or strip labels, or is ambiguous beyond the planner. MEDIUM = correct during implementation, proven by a real-browser audit. NIT = wording. Only HIGH blocks. D1–D11 and the ORCHESTRATOR FINDINGS (OF-1…OF-11) are treated as binding.

**Verdict: APPROVED — 0 HIGH, 5 MEDIUM, 5 NIT.** Every MEDIUM/NIT below is a mandatory implementer item with the numeric audit that proves it.

---

## 1. What I read and checked

Design document, all sections (Decisions, tokens, layout grid, page inventory, build pipeline, tracker, feed, §17 source list, Actions workflow, verification plan, open questions, ORCHESTRATOR FINDINGS with design responses).

Content checks run against `content/roadmap.md` with a throwaway script in `$env:TEMP` (no repo files created; scratch removed):

| Design claim | Result |
|---|---|
| `content/roadmap.md` is a verbatim copy of the ahead report (D11) | **Verified**: SHA-256 `EF5461…FB11` identical for both files, 297,594 bytes, 1,510 lines |
| 127 bracket labels; breakdown 28/28/21/15/11/3/2/2/1 + 16 one-offs; 0 labels followed by `(` | **Verified exactly** (127; same breakdown; 0 followed by `(`) |
| Three cross-ref exception literals exist; `§43` ×2 is the only N>19; all `§N.M` targets exist as h3 | **Verified**: all 3 literals present once; 129 `§` tokens = 118 section refs + 4 legal `§N(…)` + 4 `§§` ranges + 1 `§ 44801` + 2 `§43`; 73 `§N.M` refs, 0 missing targets; a scan of legal/statute contexts found no `§N` ref outside the three listed exceptions |
| Wide-table list (§3, §8.1, §18.3 = 7 cols; §5.4, §11.5 second table, §15.4 track table, Appendix A = 6; §12.2 objectives = 8; §15.3 ×2 = 10) | **Verified exactly** (55 tables parsed; the ten ≥6-column tables are exactly those) |
| §15.5: 24 rows match `/^(\d+) \(W(\d+)–(\d+); (\d+)\/(\d+)\)$/`, weeks contiguous 1…104 | **Verified** (W1–4 … W100–104) |
| §15.6: 8 gates, clauses 5/4/4/5/5/5/4/4 on `; ` | **Verified exactly** |
| §14.1 rows `Fit profile`, `**Month 24 outcome**`, `Mandatory 24 h branch` exist | **Verified** |
| 5 relative dossier links (`physical-ai-roadmap-research-2026/…`) | **Verified** (claim-source-ledger ×2, research-plan, evidence-audit, coverage-audit) |
| Trackable set sizes 7/10/36/12/14/26/9/24+24/8 gates/18 questions | **Verified** by reading §2, §3, §4, §7.2–7.5, §8.1, §9, §10.1–10.2, §12.2, §15.5, §15.6 (RL-1…RL-36 appear in exactly two §7 tables each; 12 modules + excluded total row; 14 books; 10 + 16 media; rungs 0–8 + excluded Totals row) |
| Media ids unique under "first link text, 8 words" | **Verified**: 26 unique slugs; my reproduction gives exactly the design's own example `ri-seminar-max-simchowitz-generative-control-action-chunking` |
| §3 titles "all 10 resolve to the italic/quoted span (none falls back)" | **Wrong for #5, #8, #9** — see DR-2 |
| "markdown-it's GFM table rule respects backticks" | **Wrong** (markdown-it 14.1.0 `escapedSplit` tracks only backslash escapes) but **harmless**: no table row in the content has a `\|` inside a code span (naive cell counts equal header counts for every row) — see DR-8 |
| "94 `**[link](url)**` cases" | **Wrong count/pattern**: 0 of that form; 18 links inside bold runs, 32 italic-inside-link — harmless, markdown-it handles both — see DR-8 |
| Action versions match Ahead's working set (checkout v7, setup-node v7, configure-pages v6 + `enablement: true`, upload-pages-artifact v5, deploy-pages v5, `paths-ignore: data/**`) | **Verified** against `ahead/.github/workflows/refresh.yml` |
| Probe file consistent with the §17 table | **Verified**: 41 probes incl. feed guesses; eGazette `UNABLE_TO_VERIFY_LEAF_SIGNATURE`; OpenReview notes endpoints 200 with no notes; PMLR v305 RSS 263 items; GRASP `/news/feed/` 10 items |
| mock-audit.json PASS | **Verified**: 4 mocks × 8 widths × 2 themes = 64 runs, every check true; scrollWidth == clientWidth everywhere; body 17.00 px at 320–390 → 22.00 at 2560; smallest text 12.75 px (chip) / 13.24 / 13.62 / 14.40 / 15.30 / 16.50; content ratio 0.90–0.93; controls 40–44; composited contrast minima 4.87 (light, `#0e7490` on `#f3f4f6`) and 7.12 (dark, `#06b6d4` on `#171b20`) — identical to the design's token table; feed geometry 0 overlaps / 0 misaligned titles at all widths |
| mock-audit.py method | Read in full: opens all `<details>`, composites text colour over the effective background with opacity, skips `display:none`/`visibility:hidden`/zero-size/opacity-0 elements, checks controls and feed-item geometry; screenshots viewport-only |

§17 coverage check (read §17.1–17.6, §13.6, §10.4, §11.1 in the content): the registry covers every machine-readable thing §17 names — cs.RO and eess.SY listings, the four §17.3 queries verbatim, RSS proceedings (HTML index, feed probed 404), OpenReview (probed, challenge, documented as manual), PMLR CoRL volume, the §17.5 lab feeds (CMU RI, optional BAIR) plus the one candidate lab with a feed (GRASP), the §10.4/§11.1 release atoms (ros2, Nav2, PX4, MuJoCo, gz-sim, QGC, MAVSDK), NIST news with exactly the §17.5 filter, and the five §13.6 Indian pages as reachability checks with a "check manually" card. MIT CSAIL is correctly excluded (§17.5 says do not subscribe). The §10.4 newsletters/press feeds are correctly left out (not §17). Scholar/Semantic Scholar alerts, the §17.4 venue watchlist and the §17.5 benchmark watches are manual by nature (no feed); see "For the planner".

Screenshots opened (dimensions read first with System.Drawing; all 32 files are ≤1920 px per side; 2560 shots are 1920×1080 at dsf 0.75):

| File | Pixels | Theme | Notes |
|---|---|---|---|
| mock-home-2560-light.png | 1920×1080 | light | **stale** (05:15Z, before the OF fixes): "verified" hero copy, empty hero right half |
| mock-home-390-light.png | 390×844 | light | stale copy; layout correct (single column, 44 px checkbox) |
| mock-home-1920-dark.png | 1920×1080 | dark | stale; palette fine; 3 cards per row |
| mock-section-2560-light.png | 1920×1080 | light | **current** (re-shot 05:24Z): rails + 80ch prose + full-width tables, checkboxes in both §12.2 tables, rail "2 of 9", legend strip under h1 |
| mock-section-390-light.png | 390×844 | light | stale (always-visible "link" pill, LCD-AA tinted words); collapsed rails render correctly |
| mock-section-1440-dark.png | 1440×900 | dark | stale ("Light" label in dark); 3-column composition correct |
| mock-my-plan-1440-light.png | 1440×900 | light | stale (OF-9 wrap); setup row, 5 stat cards, two-column lower section |
| mock-my-plan-390-dark.png | 390×844 | dark | stacked setup, 42 px controls |
| mock-my-plan-2560-light.png | 1920×1080 | light | two-column "This month" / "Quarter 1 budget", gate clauses as checkboxes |
| mock-feed-1920-light.png | 1920×1080 | light | **current** (re-shot): OF-1 fixed, OF-6 compact protocol, health strip, filters |
| mock-feed-390-dark.png | 390×844 | dark | header icon buttons, wrapped filter rows |
| mock-feed-2560-dark.png | 1920×1080 | dark | stale (pre-OF-1 overlaps visible); Indian notices card shows "unavailable since 21 Oct 2026 · tls" honestly |

Timestamps: 30 of 32 PNGs were written 05:15:19–05:15:36Z; `mock.css`/`*.html` were last edited 05:21–05:22Z; only `mock-section-2560-light.png` and `mock-feed-1920-light.png` (05:24Z) and `mock-audit.json` (05:24:35Z) post-date the fixes. This follows the orchestrator's instruction to re-shoot only two images; it means the other 30 shots are not evidence for OF-3/4/5/6/9/10 (DR-6).

One permitted spot-check (articulable doubt: no committed shot shows the home hero after OF-4/OF-5): rendered `mocks/home.html` at 1920×1080 light with the venv Playwright. Result: `.hero-grid` has two children — `.hero` (x 67–929) and `.hero-legend` (x 991–1853) — both with content; "verified" occurs 0 times in body text; "Labels used throughout" heading occurs once; site name occurs once; "Evidence cutoff" twice (hero + footer, as the design notes); theme button text "Light", `aria-label="Theme: Light. Activate for Dark"`; scrollWidth 1920 == innerWidth. OF-3/4/5 are implemented in the current mock. Screenshot kept only in `$env:TEMP` and deleted.

---

## 2. Compliance summary against the review checklist

(a) D1–D11: no violation found in the design. Light-first bootstrap, token pairs, gutters/no max-width, 80ch prose, rails, scroll-container tables, footer text, chips + legend, single workflow with cron minute 23 and whole-`dist/` upload, markdown-it + fast-xml-parser only, verbatim content copy — all present. One shell detail works against D3's intent (DR-3) and one internal conflict would silently degrade D4 table behaviour (DR-1); both are implementation-level and audit-provable.
(b) Every v1 feature in brief §2 A–D has a concrete design (home blocks, 24 section pages with rails/scrollspy/prev-next/anchors/chips/domain hints/notices/tables, search index + `/` panel, print CSS, keys; manifest + 8 trackable sets + gates + §4 answers, My plan derivations, export/import/reset; feed page filters/health/triage/protocol card, pipeline + fixtures; README/LICENSE/.gitignore/scripts). Reading-position restore is correctly left as an open question (brief: nice-to-have).
(c) §17 source list covers what §17 actually names, probe results are honest (eGazette TLS failure and OpenReview challenge recorded, NIST marked provisional with a ship rule).
(d) Tracker id scheme is stable (declared table slugs, report's own row identifiers, shared ids across tables of a set). Two wording gaps could make two implementers differ on books/media keys and the 8-word cap (DR-7, planner-resolvable).
(e) Build pipeline, feed/meta schema and workflow are implementable; D7–D9 respected (same job sequence, whole-folder upload, off-peak minute, relative flat paths). One conflict: CSP vs inline `style` attributes (DR-1).
(f) Verification plan is numeric with thresholds for every check; two orchestrator items need their proof widened (DR-4).
(g) Mocks and mock-audit.json meet the D4/D5 thresholds at every width and theme (table above).

---

## 3. Findings

### MEDIUM (mandatory; proven by audit, not by more prose)

**DR-1 (MEDIUM) — CSP `style-src 'self'` blocks the design's own inline `style` attributes.**
Where: Build pipeline step 13 (CSP meta `style-src 'self'`) vs step 7 (`<table class="wide" style="--cols:N">`). The mocks also carry 53 inline `style="…"` attributes (progress bars `style="width:0%"`, margins), and the mocks have no CSP meta, so the conflict was never exercised. Under `style-src 'self'` without `'unsafe-inline'`, HTML `style` attributes are blocked; `--cols` would be undefined and `min-width: calc(var(--cols) * 13rem)` would not apply, quietly squeezing every wide table (D4/D5 degradation) and zeroing progress bars.
Fix: emit no `style` attributes at all. Tables: `data-cols="N"` plus CSS `table.wide[data-cols="6"]{--cols:6}` … for 2…10 (or `.cols-N` classes). Margins: utility classes. Bars: set `el.style.width` from JS (CSSOM writes are allowed by CSP). Keep `style-src 'self'`.
Proof: on every page type at 390 and 1920, `document.querySelectorAll('[style]').length === 0` before scripts run; 0 `securitypolicyviolation` events collected during the whole browser audit; `parseFloat(getComputedStyle(tbl).minWidth) === cols × 13 × parseFloat(getComputedStyle(document.documentElement).fontSize)` for the §3, §12.2 and §15.3 tables.

**DR-2 (MEDIUM) — §3 best-10 card title rule returns the journal name for resources 8 and 9.**
Where: Build pipeline step 10 ("title = the first `*italic*` span in the identity cell, else the first quoted span, else the first link text") and the test "all 10 titles resolve to the italic/quoted span (none falls back)". In the content, #8's cell is `"Safe-Control-Gym: …", …, *IEEE Robotics and Automation Letters* 7(4)` and #9's is `"Diffusion Policy: …", …, *Robotics: Science and Systems XIX*`: the first italic span is the venue, not the title. #5 (`[ROS 2 Jazzy official tutorials](…)`) has neither span. The mock itself shows the quoted paper titles, so the intent is clear and only the rule is wrong.
Fix: title = whichever of {first `*italic*` span, first `"…"`/`“…”` quoted span} starts earliest in the cell; else the first link text; else whole cell. Test asserts the exact list: 1 Mathematics for Machine Learning · 2 Modern Robotics: Mechanics, Planning, and Control · 3 Control Engineering for Robotics · 4 State Estimation for Robotics · 5 ROS 2 Jazzy official tutorials · 6 Principles of Perception and Planning for Aerial Vehicles · 7 Deep Learning for Computer Vision · 8 Safe-Control-Gym: A Unified Benchmark Suite for Safe Learning-Based Control and Reinforcement Learning in Robotics · 9 Diffusion Policy: Visuomotor Policy Learning via Action Diffusion · 10 Underactuated Robotics: Algorithms for Walking, Running, Swimming, Flying, and Manipulation.
Proof: node:test on `home-data` with that fixture list; crawl check that the ten `index.html` best-10 card `h3` texts start with `N. <title>`.

**DR-3 (MEDIUM) — `<meta name="color-scheme" content="light dark">` contradicts D3 (light first paint for everyone).**
Where: Page inventory ("`<head>` with … `color-scheme: light dark`") and `mocks/home.html` line 6. The CSS already sets `:root{color-scheme:light}` and `[data-theme=dark]{color-scheme:dark}`; the meta tells the UA the page supports both and lets a dark-preferring UA paint canvas and form controls dark before/without the stylesheet.
Fix: delete the meta; keep the per-theme `color-scheme` in CSS only.
Proof (already in the plan's theme audit; extend it): with `color_scheme="dark"` emulated and empty localStorage, after `goto` of `index.html`, `plan.html` (date input) and `s12.html`: `document.documentElement.dataset.theme === "light"`, `getComputedStyle(document.documentElement).colorScheme === "light"`, html/body composited background `#ffffff`.

**DR-4 (MEDIUM) — OF-3 and OF-9 are not fully proven by the verification plan.**
Where: Verification table — "Theme control (OF-3)" runs at 1440 only; OF-9 (track selector on one row) has no audit; below 860 px the theme button is icon-only (stale 390 shots), so the label check cannot run there.
Fix/proof: run the theme audit at 390 and 1440: pressing `t` three times yields `aria-label` sequence "Theme: Light. Activate for Dark" → "Theme: Dark. Activate for System" → "Theme: System. Activate for Light" → back to Light, with `html[data-theme]` following and the icon `data-mode` (or `<use href>`) changing; at ≥860 the visible label text equals the mode. OF-9: at 1024, 1440, 1920, 2560 the four `.track-group button` elements have identical `getBoundingClientRect().top` (one row); at 390/820 the group is an explicit 2×2 (two distinct tops, two buttons each).

**DR-5 (MEDIUM) — The feed "Weekly protocol" card adds a row index (1, 2, 3) that §17.1 does not contain.**
Where: `mocks/feed.html` protocol table (header "Normal week", cells 1/2/3) vs the source table, whose first cells are "Normal week", "", "". D6 forbids numbers the report does not state; a reader can mistake 1/2/3 for session numbering.
Fix: render the three Normal-week rows with the source's own cells (first cell "Normal week" on the first row, blank on the others, or drop the first column) — no added numbers.
Proof: build-time assertion (or crawl check) that every `td` text in the protocol card equals a cell string of the §17.1 table in `content/roadmap.md`.

### NIT (mandatory; wording/markup precision)

**DR-6 (NIT) — 30 of 32 mock screenshots predate the OF fixes.** Only `mock-section-2560-light.png` and `mock-feed-1920-light.png` show the current mocks (per the orchestrator's re-shoot instruction). Fix: say so in `status.md`; never cite a mock shot as acceptance evidence; FEAT-007's real-build shots (390/1440/1920/2560 × light/dark × index/s12/plan/feed, each ≤1920 px per side) are the evidence set. Proof: the committed `docs/screenshots/live-*.png` timestamps post-date the last FEAT commit.

**DR-7 (NIT) — Tracker row-key wording leaves two choices open.** The prose says "the slug of the first `*italic*` span or first link text in the key cell, capped at 8 words (books, media)"; the table says books = italic title (col 2), media = first link text. Taken as a precedence rule, italic-first would collide for media (two `*The Robot Brains Podcast*`, two `*Sense Think Act*` rows). Fix (one sentence in `content-map.mjs` comments and plan.md): leading identifier → `^\*{0,2}([A-Za-z]{0,2}-?\d+)\*{0,2}(?=[.\s(]|$)` lowercased; books → first `*italic*` span of column 2; media → full text of the first link (markdown stripped); "8 words" = the first 8 whitespace-separated tokens containing an ASCII alphanumeric, then lowercase, ASCII-fold, `[^a-z0-9]+`→`-`, trim `-`. Proof: `manifest` test asserts the 26 media ids and 14 book ids against a fixture list; collision check fails the build.

**DR-8 (NIT) — Two renderer claims are wrong (harmless today).** markdown-it 14.1.0's table `escapedSplit` honours only backslash escapes, not backticks; the content has no `|` inside a code span in any table row, so nothing mangles. The "94 `**[link](url)**` cases" figure is 0 (18 links sit inside bold runs; 32 link texts contain italics). Fix: correct the two sentences; add a build assertion that every table row has exactly the header's cell count (so a future content edit with a piped code span fails loudly). Proof: `tables` test with a fixture row containing `` `a|b` `` fails the assertion.

**DR-9 (NIT) — Copy/markup details.** Health glyphs render "■ok" in the mock; the design says `■ ok` (add the space or a `gap`). Mock summaries end with "..." while the normaliser writes `…` (keep `…`). "Overall 0 of 114 items outside the plan months" → "Overall 0 of 114 items (plan months are counted once a plan is chosen)". Proof: string checks in the crawl.

**DR-10 (NIT) — Parser details to state explicitly.** §15.3 totals are `**1,040**`/`**2,080**` (strip `**` and thousands separators before `Number()`); §3 quoted-title detection must accept straight `"` and curly `“”` (the §3 cells use straight quotes, §0 prose uses curly). Proof: `plan-data` totals test (1,040 / 2,080) and the DR-2 title test.

---

## 4. Verified assumptions

- `content/roadmap.md` byte-identical to the ahead source; `content/SOURCE.md` records origin, date, SHA-256, line count.
- Label count and breakdown (127), zero labels followed by `(`; all 73 `§N.M` targets exist; the three legal exception literals are the only legal `§N` refs that would otherwise match; `§43` is the only N>19 form.
- The wide-table inventory, §15.5 regex, §15.6 clause counts, §14.1 row keys, dossier link count, and all eight trackable-set sizes.
- mock-audit.json: 64 runs, 0 failures, thresholds as stated; contrast pairs equal the token table; audit method sound (details opened, composited colours, opacity).
- Current `mocks/home.html` implements OF-3/OF-4/OF-5 (spot-check); `mocks/section.html` wraps none of the OF-7 words in any element (plain text), consistent with the LCD-antialiasing explanation; `.anchor-h .copy{opacity:0}` implements OF-10.
- Actions versions and `paths-ignore`/`enablement: true` match Ahead's working workflow; the design's cron `23 2 * * *` avoids the top-of-hour minute (Ahead's own `0 */6` does not — irrelevant here).
- Probe JSON matches the §17 table (41 probes, statuses, counts, eGazette TLS error).
- favicon.svg: 263 bytes, three rectangles, single colour `#0e7490`, no gradient/glow.
- mock.css: no gradients, shadows, keyframes or `prefers-color-scheme` rules; system font stack; radius 2 px; `color-scheme` set per theme in CSS.

## 5. Unverified or wrong assumptions

- **Wrong**: "markdown-it's GFM table rule respects backticks" (DR-8) — harmless for this content.
- **Wrong**: "94 `**[link](url)**` cases" (DR-8) — 0 of that form.
- **Wrong**: "all 10 §3 titles resolve to the italic/quoted span" (DR-2) — #5 has none; #8/#9 resolve to the venue.
- **Unverifiable until live**: runner egress for NIST (Cloudflare) and the "ok 17 · empty 6 · failed 1" expectation; the design's ship rule (remove NIST on a recorded 403) is the right handling.
- **Not evidenced by committed shots**: OF-3/4/5/6/9/10 fixes (DR-6); OF-3/4/5 confirmed by my spot-check, OF-10 by CSS, OF-6 by the re-shot feed-1920, OF-9 only by the design text.

## 6. Mandatory implementer items (all of §3, restated as audits)

1. DR-1 — zero `[style]` attributes in `dist/*.html`; zero CSP violations during the audit; `table.wide` computed `min-width` = cols × 13rem.
2. DR-2 — ten exact best-10 titles (fixture list) in `home-data` test and on `index.html`.
3. DR-3 — no `color-scheme` meta; dark-emulated first paint is light on index/plan/s12 (`data-theme`, computed `color-scheme`, background).
4. DR-4 — theme cycle audit at 390 and 1440 (aria-label sequence, icon mode); OF-9 one-row audit at 1024/1440/1920/2560, 2×2 at 390/820.
5. DR-5 — protocol card cells ⊂ §17.1 cell strings; no added numbers.
6. DR-6 — status.md note; real-build screenshot set is the evidence.
7. DR-7 — exact row-key/word-cap rule written once; manifest id fixtures (26 media, 14 books).
8. DR-8 — row-arity assertion in the table renderer + test.
9. DR-9 — `■ ok` spacing, `…`, progress wording.
10. DR-10 — totals parsing (1,040 / 2,080), straight+curly quote detection.

## 7. For the planner (decide in plan.md "Decisions"; not design findings)

1. §17.5 says the CMU RI feed is subscribed "with an aerial/safety/learning filter"; the design applies no filter to `lab-cmu-ri` (9 items in window). Decide: none (record it), or apply the union of the three §17.3 regex lines as that filter and say so in the source `note`.
2. `gates` progress: count 8 gate rows (recommended), the 36 clauses, or both; whether the gate checkbox is independent of its clauses (recommended: independent, no auto-derivation).
3. Five-column tables (§9, §10.2, §12.4, §14.2, §15.5) get `--cols:5` → 65rem min-width and therefore scroll inside their container at 1440 (center ≈706 px) and 1920 (center ≈1010 px). D4 permits this; alternatives are an 11rem floor for ≤5 columns or letting tables span the right rail at ≥1920 ("may use the full content width").
4. cs.LG listing is not fetched (§17.3: "add cs.LG only with local filters"); the SAFE AUTONOMY and ROBOT-LEARNING EVALUATION queries already include `cat:cs.LG`. Record.
5. Manual-only §17 items (Scholar/Semantic Scholar alerts, §17.4 venue watchlist, §17.5 benchmark watches, §13.6 quarterly comparators FAA/EASA/ASTM/IEEE RAS): optionally one "Manual checks" line on the Feed page linking §17.3/§17.4/§17.5/§13.6; not required by D8.
6. Paths `src/feed/http.js` / `src/feed/normalize.js` vs the brief's `src/http.js` / `src/normalize.js` — either; record.
7. Open questions 1–10 in design.md (OF-8 five columns, OF-11 action row, read-position restore, `target="_blank"`, dropped-item rendering, `maxItems` before/after merge and the 500 cap, §10.4 feeds as v2, NIST ship rule in the ship prompt, appendix kicker wording, Copy button/anchor pills).
8. "System" theme: whether to listen for `matchMedia` changes live (cheap; recommended).
9. Row-key regex and word-cap rule from DR-7 — adopt as written or adjust, then freeze in `content-map.mjs`.
