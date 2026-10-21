# Physical AI Roadmap — site design

Date: 2026-10-21 (design step; evidence cutoff of the content is 20 October 2026). Owner: Sudish Kumar (GitHub Sudish007).
Repo: `c:/Users/sudiskmr/Downloads/DomainClassification/physical-ai-roadmap/` (branch `main`). Task dir (TASK): `c:/Users/sudiskmr/Downloads/DomainClassification/physical-ai-roadmap/.agents/tasks/site-build/`.

Visual contract (static mocks, real content, no invented numbers):
- `TASK/mocks/home.html`, `TASK/mocks/section.html` (§12 with the 8-column rung table), `TASK/mocks/my-plan.html`, `TASK/mocks/feed.html` (real items from the 21 Oct 2026 probe), `TASK/mocks/mock.css`, `TASK/mocks/favicon.svg`.
- Screenshots: `TASK/shots/mock-{home|section|my-plan|feed}-{390|1440|1920|2560}-{light|dark}.png` (32 files; 390×844, 1440×900, 1920×1080; the 2560 set is shot at device_scale_factor 0.75 so each PNG is 1920×1080).
- Numeric audit: `TASK/shots/mock-audit.json` — PASS, 0 failures over 4 mocks × 8 widths (320/360/390/820/1024/1440/1920/2560) × 2 themes. Browser: msedge headless with `--disable-lcd-text`.
- §17 source probe from this PC: `TASK/probe-pc-2026-10-20.json` (probed 2026-10-21T04:49Z).

The sections below are, in order: Decisions · Design tokens · Layout grid per breakpoint · Page inventory · Build pipeline · Tracker · Feed · §17 source list and probe results · Actions workflow · Verification plan · Open questions for the planner · ORCHESTRATOR FINDINGS (2026-10-20) with design responses.

---

## Decisions (binding, copied verbatim from the brief; not reviewable)

D1. Site name/wordmark: "Physical AI Roadmap". Plain text wordmark in the header; a simple monochrome geometric SVG favicon (no gradient, no glow, no neural-node/circuit motif). Do not repeat the site name again in the hero under the wordmark; the hero says what the site is in one sentence and shows the evidence-cutoff date ONCE.

D2. Visual language: classy coder, monochrome greys + ONE accent: cyan #0e7490 for text/links on light, #06b6d4 on dark; square/low-radius corners; NO gradients, NO glow, NO drop shadows, NO animated logo effects, NO stock illustrations, NO emoji in UI. System font stack or ONE self-hosted/variable font is acceptable only if licence-clean and ≤2 files; no Google Fonts runtime calls. No monospace kickers; monospace only for code/ids.

D3. Theme: LIGHT is the first paint for every visitor regardless of prefers-color-scheme. Header toggle cycles Light → Dark → System, persisted in localStorage, applied as data-theme on <html> by an inline bootstrap script in <head> (no flash). Both palettes as CSS custom properties; every text/background pair WCAG AA, measured with composited colours.

D4. Layout (hard rules, verified in a real browser, every page): side gutters `padding-inline: clamp(16px, 3.5vw, 96px)`; NO container max-width below 2200px; content box ≥ 88% of innerWidth at ≥1920 wide; fluid type scale via clamp — body ≈17–18px on phones → ≈22px at 2560; UI text floor 12px; controls 40–44px tall; reading column for prose ≤ 80ch but the EXTRA width on wide screens is used by composition (a sticky left contents rail + the reading column + a right "on this page / progress" rail, symmetric; card grids 1/2/3/4 columns at 390/1024–1440/1920/2560), never by stretching body lines past ~80ch and never by empty margins. `documentElement.scrollWidth <= clientWidth` at 320, 360, 390, 820, 1024, 1440, 1920, 2560. Wide markdown tables render inside their own horizontally scrollable container (sticky first column where a row label exists) so the PAGE never overflows on phones; at ≥1920 the table may use the full content width.

D5. Readability: never shrink text to make things fit; restructure instead. Show each fact once (no duplicated metadata). Footer: "Sudish Kumar · sudish.dev · GitHub repository · Evidence cutoff 20 Oct 2026 · Not legal advice". NO self-referential blurbs ("hand-coded", "zero build step", "view source"), no "AI-powered" marketing.

D6. Honesty: preserve EVERY [FACT]/[JUDGMENT]/[UNCERTAIN]/[HYPE/DEMO]/[STALE-BUT-FOUNDATIONAL] label as a visible chip with a legend on every section page; never strip, soften, or reword the report's claims; keep all links and their dates; render "Not established"/"UNCERTAIN" exactly as written. Progress percentages must be computed from real checkbox counts. Feed items show real titles, real dates, real source names; failed sources are shown as "unavailable since <date>" with the recorded error class, never hidden. No invented numbers anywhere.

D7. Stack: plain Node 24 ESM, zero runtime framework, static output in dist/ (or built in place — planner decides, but Pages must serve the built output). Build script `npm run build` = markdown → pages + search index + tracker item manifest. Tests with node:test, `npm test`. Dependencies allowed: a markdown parser (marked or markdown-it), fast-xml-parser. Nothing else.

D8. Feed scope = the report's own §17 "Low-noise monitoring system" (lines ~1260–1361 of the source file). The fetch pipeline implements THOSE sources and queries (read §17 first and record the exact list in design.md): arXiv categories cs.RO and eess.SY plus §17's narrow keyword queries via the export API `https://export.arxiv.org/api/query?search_query=...&sortBy=submittedDate&sortOrder=descending&max_results=...` with ≥15 s timeout and one retry (arXiv RSS is EMPTY before ~04:00 UTC, don't use it); conference proceedings where a machine-readable source exists (roboticsproceedings.org RSS proceedings, OpenReview API v2 for CoRL, PMLR/CoRL volume pages) — probe each, keep what works from GitHub runners, document what doesn't; the "three labs" named in §17 via their official blog/news RSS if present; release feeds as GitHub `releases.atom` for the stack in §11 (ros2/ros2, PX4/PX4-Autopilot, google-deepmind/mujoco, gazebosim/gz-sim, and any others §11/§17 names — transient atom failures get a retry, not a "blocked"); Indian official notices (DGCA/MoCA pages §13/§17 cite — probe; if they are not machine-readable from runners, show a static "check manually" card with the official links and record the probe result honestly). NO LLM layer, NO Cloudflare relay, NO paid services in v1; env-gated hooks may be left for later but must not be required. Record per-source health in data/meta.json ({status ok|empty|failed, error ≤120 chars, checkedAt, note}) exactly like Ahead; "empty" = fetched fine but nothing in the window.

D9. Schedule: ONE GitHub Actions workflow `.github/workflows/build-deploy.yml` with triggers push(main) + workflow_dispatch + schedule on an OFF-PEAK minute (e.g. `23 2 * * *` UTC daily — never minute 0; GitHub drops top-of-hour schedules). It runs `npm ci`, `npm test`, (on schedule/dispatch) `npm run fetch` → writes data/feed.json + data/meta.json, commits data back as github-actions[bot] with `git pull --rebase` first, then `npm run build`, then deploys to Pages (actions/upload-pages-artifact + actions/deploy-pages; permissions contents/pages/id-token write). FACT to design around: pushes made with the default GITHUB_TOKEN do NOT trigger other workflow runs, so fetch+build+deploy must live in the SAME job sequence (never rely on the data commit re-triggering a deploy). Deploy must upload the whole built folder, never a hand-maintained file list (Ahead's fixed-file-list trap silently dropped a new file). Site copy about freshness must say "GitHub may delay or skip scheduled runs", and the "Last updated" shown to visitors comes from data/meta.json, derived in ONE place.

D10. Repo flow: work directly on `main` in the new repo (no worktree; nothing exists yet). Create the GitHub repo with `gh repo create Sudish007/physical-ai-roadmap --public --source . --remote origin --push` only at the SHIP step; enable Pages non-interactively with `gh api -X POST repos/Sudish007/physical-ai-roadmap/pages -f build_type=workflow`; dispatch with `gh workflow run build-deploy.yml --repo Sudish007/physical-ai-roadmap`; wait with `gh run watch <id> --repo Sudish007/physical-ai-roadmap --exit-status`; then read the LIVE data/meta.json with a cache-busting query and verify the live pages in a browser. Set the repo description and homepage via `gh api -X PATCH repos/Sudish007/physical-ai-roadmap -f description='Physical AI, robotics and drone research roadmap with progress tracking and a low-noise research feed' -f homepage='https://sudish007.github.io/physical-ai-roadmap/'`. Set `$env:GIT_TERMINAL_PROMPT='0'`, use `git --no-pager`, and treat an execute output cut off with "^C" as unknown outcome: re-check state before re-running anything non-idempotent.

D11. Content copy: copy the source markdown into the repo as content/roadmap.md verbatim (plus a content/SOURCE.md noting origin path and date). The site's single source of truth is now content/roadmap.md. Add `npm run sync-content` that re-copies from the ahead path if it exists (local convenience only). Do not edit the roadmap prose except: (a) rewriting internal "§N" cross-references into links to the generated section pages, (b) heading ids. If the markdown parser mangles a construct (nested tables, bold-in-link), FIX THE RENDERER, not the content.

Decision notes that D1–D11 do not settle but this design fixes (the planner records any change in plan.md "Decisions"):
- The evidence-cutoff date appears in the home hero (D1) and in the footer of every page (D5, fixed text). On the home page it therefore appears twice; nowhere a third time.
- Site copy never uses "verified" as a descriptor (OF-4). The report's own title ("… A Verified Learning-and-Research Roadmap for Sudish") is content and is rendered verbatim on the §0 page only.
- Output goes to `dist/` (gitignored), flat. Pages deploys `dist/`.
- Feed data is rendered client-side from `data/feed.json` and `data/meta.json`; the build never bakes feed items or dates into HTML, so "Last updated" has one derivation (`assets/lib/format.js: formatLastUpdated(meta)`).

---

## Design tokens

Font: system stack only — `ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`; monospace `ui-monospace, "Cascadia Mono", Consolas, "SF Mono", Menlo, monospace` for `code`, `kbd`, ids. No font files, no runtime font requests.

Type: `html { font-size: clamp(17px, 15.6px + 0.25vw, 22px) }` → measured body size 17.00 px at 320–390, 17.65 at 820, 18.16 at 1024, 19.20 at 1440, 20.40 at 1920, 22.00 at 2560. Body `line-height 1.55`. Headings: h1 1.75rem, h2 1.35rem, h3 1.15rem (line-height 1.25, weight 650). Small text `--text-sm: 0.875rem`; UI floor `--text-xs: max(12px, 0.75rem)` (measured smallest visible text: 12.75 px at 320–390, 13.24 at 820, 13.62 at 1024, 14.40 at 1440, 15.30 at 1920, 16.50 at 2560). Never reduce a font size to fit; restructure (D5).

Spacing: rem steps 0.25 / 0.5 / 0.75 / 1 / 1.5 / 2 / 2.5 / 3. Radius `--radius: 2px` everywhere (buttons, inputs, chips, cards, table wrap). Borders 1px `--line`. No shadows, no gradients, no transitions on the logo; `prefers-reduced-motion` disables smooth scrolling.

Controls: `--control-h: 42px` (buttons `min-height 42px; max-height 44px`; text/date/number/search inputs `height 42px`; the checkbox hit target is a 44×44 label around a 22px native checkbox with `accent-color`). Measured on the mocks: all controls 40–44 px at every width (the search input inside its 42px box measures 40px).

Gutters `--gutter: clamp(16px, 3.5vw, 96px)`; rails `--rail-w: 14rem` (16rem from 1920); grid gap `--gap: 2.5rem` (3rem from 1920); sticky header `--header-h: 56px`.

Palettes (CSS custom properties on `:root`, dark on `:root[data-theme="dark"]`; no `prefers-color-scheme` rule anywhere — light is the first paint, D3):

| Token | Light | Dark | Use |
|---|---|---|---|
| `--bg` | #ffffff | #0f1215 | page |
| `--bg-2` | #f3f4f6 | #171b20 | panels, rails' active item, notices, legend box |
| `--bg-3` | #e8eaee | #212730 | table header, JUDGMENT chip fill, progress track |
| `--fg` | #16191d | #e4e7eb | text |
| `--fg-2` | #4f5862 | #a6aeb8 | muted text, kickers, meta, separators |
| `--line` | #d4d8de | #2b323b | borders |
| `--line-2` | #8e97a3 | #5f6b78 | control borders only (never text) |
| `--accent` | #0e7490 | #06b6d4 | links only (D2) |
| `--chip-solid-bg` / `--chip-solid-fg` | #16191d / #ffffff | #e4e7eb / #0f1215 | FACT chip |
| `--inverse-bg` / `--inverse-fg` | #16191d / #ffffff | #e4e7eb / #0f1215 | pressed filter buttons, primary button |

Composited contrast measured on the mocks (every distinct visible text/background pair, `TASK/shots/mock-audit.json`; AA needs ≥4.5 normal, ≥3.0 large):

| Pair (text on background) | Light | Dark |
|---|---|---|
| `--fg` on `--bg` | #16191d/#ffffff 17.63 | #e4e7eb/#0f1215 15.15 |
| `--fg` on `--bg-2` | 16.02 | 13.94 |
| `--fg` on `--bg-3` (table header, JUDGMENT chip) | 14.64 | 12.11 |
| `--fg-2` on `--bg` | #4f5862/#ffffff 7.23 | #a6aeb8/#0f1215 8.38 |
| `--fg-2` on `--bg-2` | 6.57 | 7.72 |
| `--accent` on `--bg` (links) | #0e7490/#ffffff 5.36 | #06b6d4/#0f1215 7.74 |
| `--accent` on `--bg-2` (links inside notices/legend) | 4.87 | 7.12 |
| inverse (FACT chip, pressed buttons) | #ffffff/#16191d 17.63 | #0f1215/#e4e7eb 15.15 |

Rules that keep this true: `--line-2` is never used as a text colour (the footer separators use `--fg-2`); `--accent` text never sits on `--bg-3`; text with `opacity < 1` is only used for dropped feed items (0.6 → measured ≥4.5 must be re-checked by the audit in the real build; if it fails, use `--fg-2` instead of opacity).

Label chips (D6) — monochrome variants distinguished by shape, not hue; the chip text is the full bracket text from the source, e.g. `JUDGMENT, high confidence`, `UNCERTAIN: vendor-stated foreign price`, `FACT for final records; UNCERTAIN for abstract-level outcomes`:
- `.chip-fact` solid `--chip-solid-bg`/`--chip-solid-fg`.
- `.chip-judgment` fill `--bg-3`, border `--line-2`.
- `.chip-uncertain` dashed 1px border `--fg-2`, no fill.
- `.chip-hype` dotted 2px border `--fg`, no fill.
- `.chip-stale` no box, 2px bottom border `--fg-2`, text `--fg-2`.
- `.chip-mixed` (text contains two label keywords or `+`) solid 1px border `--fg`, no fill.
Chip font: `--text-xs`, weight 650, letter-spacing 0.02em, `white-space: nowrap` except `.wrap` inside table cells for long qualifiers. Every chip carries `title` = the §0 meaning of its first keyword.

Favicon (`favicon.svg`, hand-written, 3 rectangles forming three rising steps, single colour #0e7490, 32×32, 300 bytes): `TASK/mocks/favicon.svg`. The header wordmark uses the same glyph inline with `currentColor`.

Status glyphs in the feed health strip are text, not colour: `■ ok`, `□ empty`, `✕ failed` (U+25A0, U+25A1, U+2715; no emoji).

---

## Layout grid per breakpoint

Frame: `.page { padding-inline: var(--gutter) }`, no max-width at all (content box = innerWidth − 2×gutter; measured 0.90 at 320, 0.918 at 390, 0.93 at 820–2560). Header is sticky (56px) and contains: wordmark · primary nav (Home, Sections, My plan, Feed) · search box (`/`) · theme button. Below 860px the primary nav becomes a horizontally scrollable strip under the header row and the search box shrinks to a 42px icon button; below 360px the search box leaves the header and a "Search" link appears in the strip.

| Width | html font | Gutter | Content box | Section-page columns | Prose measure | Cards per row | Rails |
|---|---|---|---|---|---|---|---|
| 390 | 17.0 px | 16 px | 358 px (0.918) | 1 | ≤80ch (never reached) | 1 | Contents and "On this page / progress" are collapsed `<details>` blocks above the article |
| 820 | 17.65 px | 28.7 px | 763 px (0.93) | 1 | ≤80ch | 2 | same as 390 |
| 1024 | 18.16 px | 35.8 px | 952 px (0.93) | 2: left rail 14rem (254 px) + gap 45 px + center ≈653 px | ≤80ch | 2 | left rail sticky; "On this page / progress" collapsed above the article |
| 1440 | 19.2 px | 50.4 px | 1339 px (0.93) | 3: 14rem + center ≈706 px + 14rem (gaps 48 px) | ≤80ch | 2 | both rails sticky |
| 1920 | 20.4 px | 67.2 px | 1786 px (0.93) | 3: 16rem + center ≈1010 px + 16rem (gaps 61 px) | 80ch | 3 | both rails sticky |
| 2560 | 22.0 px | 89.6 px | 2381 px (0.93) | 3: 16rem + center ≈1545 px + 16rem (gaps 66 px) | 80ch | 4 (best-10: 5 from 2400 px if the planner adopts OF-8) | both rails sticky |

Composition rules:
- The three-column grid is `grid-template-columns: var(--rail-w) minmax(0,1fr) var(--rail-w)`; both rails `position: sticky; top: calc(56px + 1rem); max-height: calc(100vh − 56px − 2rem); overflow-y: auto`.
- Inside the center column, prose blocks (`p`, `ul`, `ol`, `blockquote.notice`, `h2`, `h3`) are capped at `max-width: 80ch`; tables, card grids, `pre`, the legend box and the stat grid span the full center column. The extra width on wide screens goes to rails, tables and card columns, not to longer lines.
- Card grids: 1 column <720 px, 2 from 720, 3 from 1680, 4 from 2240 (`.cards`); `.cards.best-10` may switch to 5 from 2400 px (OF-8, planner decides).
- Home hero: two columns from 1440 (`.hero-grid`): the one-sentence purpose, cutoff line and three buttons on the left; the label legend (five chips, one-line meanings from §0) on the right (OF-5). Below 1440 it stacks.
- Tables: every table is wrapped in `<div class="table-wrap">` (`overflow-x: auto; border: 1px solid var(--line)`); tables with ≥5 columns get `class="wide"` and `style="--cols:N"` → `min-width: calc(var(--cols) * 13rem)`, so columns never fall below ~24ch of width; on phones the container scrolls, the page does not (`documentElement.scrollWidth == clientWidth` at 320–2560, measured). Tables with ≤5 columns fit the center column at 2560 (5 × 13rem = 1430 px < 1545 px); the tables with 6–10 columns (§3 and §8.1 and §18.3 with 7; §5.4, §11.5's second table, §15.4's track-branch table and Appendix A with 6; §12.2's objectives table with 8; the two §15.3 tables with 10) scroll inside their container at every width — that is the D4-permitted behaviour, and the alternative (squeezing eight prose columns into 190 px each) breaks D5. First column is sticky (`data-sticky-first`) when the build classifies it as a row label (average first-cell text length < 24 characters, which is true for every trackable table). Numeric columns (`---:` in the delimiter row) get `class="num"` and right alignment. The header row is sticky inside the wrap. Totals rows (first cell bold "Total"/"Totals"/"…total") get `class="total"`.
- Every grid/flex child that can contain a table has `min-width: 0` (the cause of the only overflow found in the first mock audit).
- Blockquotes render as `<blockquote class="notice">` (3px left border `--fg`, `--bg-2` fill).
- External links: `<a href rel="noopener external">text</a><span class="dom">host</span>`; the domain hint is `--text-xs`, `--fg-2`, `white-space: nowrap`; hidden in print (the URL is printed instead).
- Print (`@media print`): header, rails, collapsed rails, prev/next, buttons, triage and the keys line are hidden; grids become single flow; `.table-wrap` overflow visible and `table.wide { min-width: 0 }` so nothing is clipped; `a[href^="http"]::after { content: " (" attr(href) ")" }`.

---

## Page inventory

All pages share: `<head>` with charset, viewport, `color-scheme: light dark`, the CSP meta (hash of the inline theme script, computed at build), the inline theme bootstrap (reads `physical-ai-roadmap.v1.theme`; `system` resolves via `matchMedia`; default `light`; sets `data-theme` on `<html>`), `<title>`, favicon, `assets/app.css`; sticky header; footer exactly "Sudish Kumar · sudish.dev · GitHub repository · Evidence cutoff 20 Oct 2026 · Not legal advice" (sudish.dev → https://sudish.dev, GitHub repository → https://github.com/Sudish007/physical-ai-roadmap); `<script type="module" src="assets/app.js">`. All URLs are relative file names (flat `dist/`), so the site works at `/physical-ai-roadmap/` and at `/`.

Files in `dist/`: `index.html`, `s00.html` … `s19.html`, `appendix-a.html` … `appendix-d.html`, `plan.html`, `feed.html`, `404.html`, `assets/app.css`, `assets/*.js`, `favicon.svg`, `search-index.json`, `tracker-manifest.json`, `plan-data.json`, `data/feed.json`, `data/meta.json`, `.nojekyll`.

Home (`index.html`, from mock `home.html`):
1. Hero: one sentence ("A source-checked learning-and-research roadmap for physical AI, robotics and autonomous drones, written for a software builder in India, with a personal progress tracker and a low-noise research feed."), the cutoff line ("Evidence cutoff 20 October 2026. …"), buttons "Read from §0" → `s00.html`, "Set up My plan" → `plan.html`, "Open the feed" → `feed.html`. Right column from 1440: "Labels used throughout" — the five chips with the §0 meanings verbatim (this is the home page's legend; it does not appear again on the page).
2. "Start this week" → 7 cards from the §2 table: checkbox (id `s02:sessions:N`), `N. Session title` (first cell), time (second cell), "Output to keep" (fourth cell), link "What to do, in §2" → `s02.html#t-s02-sessions-N`. The "Do" column stays on the §2 page (summary, not duplicate).
3. "The best 10 resources" → 10 cards from §3: checkbox (`s03:best-10:N`), title (extraction rule in Build pipeline), purpose (col 3), time and cost (col 5), first link of the identity cell with its domain hint. Scores, prerequisites and notes stay on `s03.html`.
4. "Three tracks" → three cards from the §14.1 track table rows "Fit profile", "Month 24 outcome", "Mandatory 24 h branch", column headers as card titles; the default is marked with the report's own `JUDGMENT` chip ("Default [JUDGMENT]: Track B"); link → `s14.html#s14-1`.
5. Two columns from 1024: "Your progress" (one row per trackable set: label, `done of total`, bar; overall line; computed at runtime from `tracker-manifest.json` + localStorage) and "Latest from the feed" (5 newest non-dropped items from `data/feed.json`: title link, source name, date, class or matched query; "Feed last updated <formatLastUpdated(meta)>. GitHub may delay or skip scheduled runs."). Without JS the progress block shows "Progress needs JavaScript (stored in this browser only)" and the feed block shows a link to `feed.html`.

Section pages (24; `s00.html` … `s19.html`, `appendix-a.html` … `appendix-d.html`, from mock `section.html`):
- Left rail "Contents": all 24 entries (number or letter + the title from the markdown `## ` heading, without the trailing "." after the number), current page marked `aria-current="page"`. Below 1024 the same list is a collapsed `<details class="inline-rail">` "Contents: 24 sections" above the article.
- Article header: kicker "Section N of 24" (appendices: "Appendix A of 24 parts"), h1 = heading text verbatim, then the compact legend `<details class="legend">` whose summary shows the five chips and whose body lists the §0 meanings verbatim (D6: legend on every section page).
- Right rail (from 1440): "On this page" (all h3 of the page, scrollspy via IntersectionObserver sets `aria-current="true"`), "Section progress" (one line per trackable set on this page with `done of total` and a bar; omitted on pages without trackables), "Keys" (`/` search · `t` theme · `[` `]` previous/next). Below 1440 "On this page · <set> N of M done" is a collapsed `<details>` above the prose.
- Prose: markdown rendered as described in Build pipeline; h3 headings carry ids and a hover/focus-visible anchor pill "link"; label chips; §N links; external links with domain hints; `.notice` blockquotes; tables in scroll containers with checkboxes in trackable rows.
- `s00.html` additionally renders the report's front matter (title h1 line and the four opening paragraphs before "## Contents") verbatim under an h2 "Front matter" above the "## 0." content. The "## Contents" list itself is not rendered (the rails replace it).
- Prev/next links at the end (`<nav class="prevnext">`), also exposed as `<link rel="prev">`/`<link rel="next">` for the `[`/`]` keys.

My plan (`plan.html`, from mock `my-plan.html`): plan setup (10 h/20 h, Track Undecided · A · B (default) · C on one row from 1024, start date, Export JSON / Import JSON / Reset…), stat grid (Week N of 104, Month N with its week range and planned hours, Quarter N with its §15.3 emphasis, expected hours, logged hours), "This month" (the §15.5 row: Shared work, Required deliverable, the chosen plan's column; from month 10 the §14.3 cell for the chosen track replaces the Track-B wording, with the Track-B text shown when the track is undecided and a note that the choice happens at the end of month 9), "Gate Qn" (the §15.6 row split into checkbox clauses, "If it fails", and "Added 20 h evidence" when the 20 h plan is chosen), "Hours log" (week number defaulting to the current week, hours, Save; list of entries), "Month by month" (24 rows of the chosen plan with checkboxes, current month highlighted), "Quarter n budget" (the §15.3 row for the chosen plan as a two-column table), "Personalization questions" (§4: 18 questions, each with the decision rule in a collapsed `<details>` and a textarea saved locally). Before any choice, a prompt card at the top says what to choose and quotes the §4 Q7 rule verbatim ("≤12 → 10 h plan. ≥18 → 20 h plan. Between → …").

Feed (`feed.html`, from mock `feed.html`): kicker "Stay ahead · the §17 monitoring system, fetched daily", h1 "Feed", one line "Last updated <formatLastUpdated(meta)> · 30-day window · GitHub may delay or skip scheduled runs.", health disclosure (`■ ok N · □ empty N · ✕ failed N · N sources · details` → table Source / Class / Status / Fetched / Newest item / Note or error; failed rows read "Unavailable since <date> · <error class>"), the rule card ("Keep only if it changes an experiment or a claim." + link to §17.6), filter rows (Class: All/arXiv/Proceedings/Labs/Releases/Regulators; Query: the four §17.3 queries + "Category listings"; Triage: Everything/Kept N/Read later N/Dropped N), the item list (newest first; per item: title link, source name, date, matched query or class, summary ≤300 chars, Keep / Read later / Drop with `aria-pressed`), the right column with "Weekly protocol" (the three Normal-week rows from §17.1 and the line "Month-end 90 min · Quarter-end 120 min — see §17.1", plus the §17.6 limits line), "Indian official notices: check manually" (the §13.6 links with each page's last reachability result) and "Labs without a feed: check monthly" (UZH RPG, ETH ASL, IIIT-H RRC, Stanford ASL — the §17.5 candidates that expose no feed).

Search: build-time `search-index.json`; the header box (and `/`) opens a results panel under the header (`role="dialog"`, `aria-label="Search results"`, Esc closes): results grouped by section page in report order, each hit shows the heading and a snippet with the matched terms wrapped in `<mark>`; Enter opens the first hit; up to 8 hits per page group, 60 overall. The index is fetched lazily on first focus of the search box.

Keyboard: `/` focus search, `t` cycle theme (Light → Dark → System; the button shows the current mode with its icon and `aria-label="Theme: <mode>. Activate for <next>"`), `[` previous section, `]` next section (section pages only), `Esc` closes search. Shortcuts are ignored while typing in inputs, textareas or contenteditable.

404 page: static, same shell, a sentence and links to Home, §0, My plan, Feed (GitHub Pages serves `404.html`).

---
## Build pipeline

Stack (locked): Node 24 ESM, `markdown-it` (exact-pinned latest 14.x) for Markdown, `fast-xml-parser` (exact-pinned; Ahead uses 5.11.2) for Atom/RSS in the fetch pipeline. No other dependencies, no devDependencies, no bundler. `markdown-it` over `marked` because its token stream (core rules over `inline` children, renderer rule overrides for `table_open`/`td_open`/`link_open`/`heading_open`) is the natural place for every transformation below without re-parsing HTML; GFM tables are built in; `html: false`, `linkify: false`, `typographer: false` so the source text is never changed.

`package.json` scripts: `build` → `node scripts/build.mjs`; `serve` → `node scripts/serve.mjs` (serves `dist/` at `/` and `/physical-ai-roadmap/` on `PORT`, default 8790, 127.0.0.1 only, `Cache-Control: no-store`, path-traversal guard like Ahead's); `fetch` → `node scripts/fetch.mjs`; `test` → `node --test "tests/**/*.test.js"`; `sync-content` → `node scripts/sync-content.mjs` (copies `c:/Users/sudiskmr/Downloads/DomainClassification/ahead/.agents/tasks/physical-ai-frontier-roadmap-2026.md` to `content/roadmap.md` and rewrites `content/SOURCE.md` with date, line count and SHA-256 when the origin exists; prints "origin not found, nothing to do" otherwise); `verify` → `node scripts/verify.mjs` (see Verification plan). `engines.node >= 24`. `.gitattributes`: `* text=auto eol=lf` and `tests/fixtures/** -text`. `.gitignore`: `node_modules/`, `dist/`, `*.log`.

Repository layout:
```
content/roadmap.md, content/SOURCE.md
scripts/build.mjs  scripts/fetch.mjs  scripts/serve.mjs  scripts/sync-content.mjs  scripts/verify.mjs  scripts/audit.py
src/build/  parse.js (split sections, front matter, headings)  md.js (markdown-it instance + plugins)  crossref.js  labels.js  tables.js  manifest.js  home-data.js  plan-data.js  search-index.js  templates.js  write.js
src/build/content-map.mjs  (declared trackable tables, cross-ref exceptions, section file names)
src/feed/   http.js  normalize.js  pipeline.js  parsers/{arxiv,atomrss,rss-proceedings,reachability}.js
sources.config.mjs  (feed registry: one object literal per source)
assets/     app.css  app.js  theme.js  keys.js  search.js  tracker.js  plan.js  feed.js  lib/{store,derive,format,filter,score}.js
tests/      *.test.js  fixtures/
data/       feed.json  meta.json  (committed; refreshed by the workflow)
docs/screenshots/  live-*.png
.github/workflows/build-deploy.yml
README.md  LICENSE  (MIT for code; README states content/roadmap.md is © Sudish Kumar, all rights reserved unless he changes it)
```

Build steps (`scripts/build.mjs`, deterministic, ~1 s):
1. `parse.splitSections(markdown)` → `{ frontMatter, sections[24] }`. A section starts at `^## (\d{1,2})\. (.+)$` or `^## Appendix ([A-D])\. (.+)$`; the `## Contents` block is skipped. The build fails (exit 1, message names what was found) unless exactly sections 0–19 and A–D are present in order.
2. Section file names are fixed: `s00.html` … `s19.html`, `appendix-a.html` … `appendix-d.html` (short, stable; heading text may be edited later without breaking links). Rail labels = heading text after the number/letter.
3. Heading ids: numbered h3 `N.M Title` → `id="sN-M"`; unnumbered h3 (e.g. `### F1. Data-efficient …`, `### Labels`) → slug of the text (lowercase, ASCII-fold, non-alphanumerics → `-`, collapsed; de-duplicated within the page with `-2`, `-3`). The page h1 has `id="top"`. Each h3 gets `class="anchor-h"` and a trailing `<a class="copy" href="#id" aria-label="Link to <heading>">link</a>` (hover/focus-visible only, OF-10).
4. Cross-references (`src/build/crossref.js`): a core rule over inline text tokens applies `/(?<!§)§(\d{1,2})(?:\.(\d{1,2}))?(?!\d)(?!\.\d)(?!\()/g` (a ref that ends a sentence, `… in §8.`, still matches; `§8.2`, `§1(2)` and `§§3–17` are handled by the lookaheads and the lookbehind). A match is rewritten to `<a class="xref" href="sNN.html">§N</a>` / `href="sNN.html#sN-M"` only when N ∈ 0–19 and, for N.M, the heading `sN-M` exists in that section (checked against the heading inventory built in step 3). Structural skips: `§§…` (ranges like `§§18–26`), `§N(…)` (legal sub-sections like `§1(2)`, `§6(9)`, `§27(1)(d)`), `§ 44801` (space), N > 19 (`§43`, `§44`). Remaining legal mentions are listed as literal exceptions in `content-map.mjs` and skipped when the match is inside that literal: `"expert scrutiny (§5)"`, `"open to organizations (§4)"`, `"§1(2), §2, §§18–26"`. The build asserts every exception literal still occurs in the content (so a content edit surfaces as a build error) and prints `crossrefs: N rewritten, M skipped` with the skipped list. `§14.2–14.3` links the first reference and leaves `–14.3` as text. Tests cover each rule with fixture snippets.
5. Label chips (`src/build/labels.js`): a core rule over inline text tokens matches `/\[(FACT|JUDGMENT|UNCERTAIN|HYPE\/DEMO|STALE-BUT-FOUNDATIONAL)([^\]]{0,160})\](?!\()/g` and replaces the bracket with `<span class="chip chip-<kind>" title="<§0 meaning>">FULL TEXT WITHOUT BRACKETS</span>`; `<kind>` is the first keyword (`fact`, `judgment`, `uncertain`, `hype`, `stale`), and the class `chip-mixed` replaces it when the text contains a second keyword or ` + `. Because markdown-it has already split `**[FACT]**` into `strong_open`/`text`/`strong_close`, the chip lands inside the `<strong>` (harmless); link texts are separate tokens, so `[Drone Rules, 2021 …](url)` can never match (`(?!\()` is a second guard). The rule never alters text outside the brackets. Counted in the source with `\[(FACT|JUDGMENT|UNCERTAIN|HYPE/DEMO|STALE-BUT-FOUNDATIONAL)[^\]]*\](?!\()` (tests assert the rendered chip count equals this count): 127 bracket labels — `[JUDGMENT]` 28, `[FACT]` 28, `[STALE-BUT-FOUNDATIONAL]` 21, `[UNCERTAIN]` 15, `[HYPE/DEMO]` 11, `[UNCERTAIN: vendor-stated foreign price]` 3, `[FACT + JUDGMENT]` 2, `[JUDGMENT, high confidence]` 2, `[FACT, medium confidence]` 1, and 16 one-off qualified or compound forms such as `[FACT for final records; UNCERTAIN for abstract-level outcomes]` and `[FACT: vendor-stated specification; UNCERTAIN price]`. Some labels open a longer bold run (`**[JUDGMENT] Use one documented-compatibility baseline…**`): the chip replaces the bracket only and the rest of the run stays bold. No bracket label is followed by `(` anywhere in the source (0 matches), so no label can be confused with a link.
6. Links: renderer override for `link_open`/`link_close`: http(s) links get `rel="noopener external"` and `<span class="dom">host-without-www</span>` after the closing tag; relative links inside the content (five `physical-ai-roadmap-research-2026/….md` dossier links in §19.1 and Appendix D — `claim-source-ledger.md` twice, `research-plan.md`, `evidence-audit.md`, `coverage-audit.md` — point at files that are not published in v1) are rendered as plain text followed by ` (not published)` — the only non-verbatim rendering, recorded here because D11 forbids content edits and a dead link would fail the crawl. No `target="_blank"` (same tab; `rel` is still set as the brief requires).
7. Tables (`src/build/tables.js`): `table_open` → `<div class="table-wrap"><table class="wide"? style="--cols:N" data-sticky-first?>`, `table_close` → `</table></div>`; cells with `style="text-align:right"` from the delimiter row get `class="num"` instead; rows whose first cell is bold and starts with "Total" get `class="total"`; trackable rows (step 9) get `id="t-<id with ':' → '-'>"` and the checkbox label inserted at the start of the first cell.
8. Blockquote → `<blockquote class="notice">`. Fenced code keeps its language class; the §17.3 query block renders in `<pre><code>` with a "Copy" button added by the client (`navigator.clipboard`), which is UI, not content.
9. Tracker manifest (`src/build/manifest.js`, declared in `content-map.mjs`; see Tracker): tables are located by section + header signature; the build fails if any declared table is missing or any id collides. Output `tracker-manifest.json`: `{ "version": 1, "sets": [ { "id": "sessions", "label": "Start-this-week sessions (§2)", "page": "s02.html", "items": [ { "id": "s02:sessions:1", "label": "1. Seven-task diagnostic", "anchor": "t-s02-sessions-1" }, … ] }, … ] }`.
10. Home data (`src/build/home-data.js`): §2 cards = first/second/fourth cells; §3 cards: title = the first `*italic*` span in the identity cell, else the first `"quoted"` span, else the first link text, else the whole cell text (fallback, "show it as text"); link = the first link in the cell; purpose = cell 3; time/cost = cell 5. §14.1: rows whose first cell is `Fit profile`, `**Month 24 outcome**` and `Mandatory 24 h branch`. The §0 label table gives the legend meanings. Tests assert all 10 §3 titles resolve to the italic/quoted span (none falls back).
11. Plan data (`src/build/plan-data.js`) → `plan-data.json`: §15.3 (first table = 10 h, second = 20 h; parsed F/P/B/E/W/C/R/Total per quarter plus the Emphasis cell; assert totals 1,040 and 2,080), §15.5 (24 rows; first cell parsed with `/^(\d+) \(W(\d+)–(\d+); (\d+)\/(\d+)\)$/` → month, weekStart, weekEnd, hours10, hours20; assert weeks are contiguous 1…104), §15.6 (8 gates; `Pass evidence` split on `; ` into clauses; `If it fails`; `Added 20 h evidence`), §14.3 (15 rows month 10–24 × Track A/B/C), §4 (18 questions with decision rules). Cell content is rendered to HTML with the same markdown-it instance so links and chips are preserved.
12. Search index (`src/build/search-index.js`) → `search-index.json`: one record per paragraph, list item and table row: `{ "p": "s12.html", "s": "12", "h": "12.2 Nine rungs", "a": "s12-2" | "t-s12-rungs-0", "x": "<plain text ≤ 400 chars>" }`; the h2 title of each page is also a record. Expected size ≈ 350–450 KB uncompressed (the content is 296 k characters); loaded lazily.
13. Templates (`src/build/templates.js`): tagged-template functions with HTML escaping for every interpolated string; no template engine. The CSP meta is `default-src 'self'; img-src 'self'; style-src 'self'; script-src 'self' 'sha256-<base64 of the inline theme script>'; connect-src 'self'; base-uri 'none'; form-action 'none'`; the inline script string lives once in `templates.js` and its hash is computed there.
14. Write (`src/build/write.js`): render into `dist.tmp/`, copy `assets/`, `favicon.svg`, `data/feed.json`, `data/meta.json`, write `.nojekyll`, then replace `dist/` (remove old, rename). The build prints a one-line summary: pages, h3 count, chips, crossrefs rewritten/skipped, manifest items per set, search records, output bytes.

Client code (`assets/`, ES modules loaded by `<script type="module" src="assets/app.js">`, no build step): `theme.js` (cycle, persist, button label/icon/aria-label, `t`), `keys.js`, `search.js`, `tracker.js` (binds every `input[data-track]`, writes `{done, at}`, updates rail/home counts live), `plan.js`, `feed.js`, and pure modules in `assets/lib/` with no DOM access so node:test can import them directly: `store.js` (versioned keys, JSON guards), `derive.js` (progress counts, plan arithmetic), `format.js` (dates; `formatLastUpdated`), `filter.js` (feed filters/sort/triage), `score.js` (search tokenising and ranking). Without JavaScript every page is readable; checkboxes are inert; the feed page shows a link to `data/feed.json`.

Edge cases handled by the renderer, not by editing content (D11): nested emphasis inside link text (94 `**[link](url)**` cases → `<strong><a …>` — markdown-it handles this natively); `*italic*` spans inside link text; `|` inside code spans in table cells (markdown-it's GFM table rule respects backticks); the §17.3 regex block contains backslashes and must stay verbatim in `<pre><code>`; arXiv-style `$\pi_0.5$` in feed titles is left as text (no math rendering); `→` and `≥` characters pass through (UTF-8 throughout, `<meta charset="utf-8">`).

Error handling in the build: any missing section, missing declared table, id collision, failed extraction assertion, unknown `§N.M` target (a numbered ref whose heading does not exist is left as text and listed in the summary as a warning, not an error) is reported with the section number and the first 80 characters of the offending line; the build exits 1 and leaves the previous `dist/` untouched (the tmp-dir swap). The workflow therefore never deploys a half-built site.

Unit tests (node:test, fixtures only, no network): `parse`, `crossref` (every rule and exception), `labels` (all variants; count parity with the source), `tables` (wrap, `--cols`, sticky-first classification, `num`, `total`, checkbox injection), `links` (attrs, domain hint, unpublished relative links), `manifest` (set sizes 7/10/36/12/14/26/9/24+24/8 gates/18 answers; id stability across a title edit), `home-data` (10 titles), `plan-data` (totals, contiguous weeks, 8 gates, 15 §14.3 rows), `search-index` (record shape, size cap), `templates` (escaping, CSP hash), `derive`/`filter`/`score`/`format` (pure client logic), `serve` (path handling, traversal guard), plus the feed tests listed under Feed. Integration (real browser) checks live in `scripts/verify.mjs`.

---

## Tracker

Id scheme: `<section slug>:<table slug>:<row key slug>`, all lowercase ASCII. Section slug = `s02`, `s03` … (`appendix-a` for appendices). Table slug = declared in `content-map.mjs` (not derived from text, so a header edit cannot change ids). Row key slug = the leading identifier when the first cell starts with one (`1.` → `1`, `**M4**` → `m4`, `RL-25` → `rl-25`, `**0** Reproducibility…` → `0`, `1 (W1–4; 40/80)` → `1`, `Q3 (W39) …` → `q3`, `#` column values `1`…`10`), otherwise the slug of the first `*italic*` span or first link text in the key cell, capped at 8 words (books, media). Collisions fail the build. Rebuilds and prose edits keep ids because the keys are the report's own identifiers.

| Set id | Section page | Table (located by header signature) | Key cell | Items | Example id |
|---|---|---|---|---|---|
| `sessions` | s02 | `Session · Time · Do · Output to keep` | Session | 7 | `s02:sessions:1` |
| `best-10` | s03 | `# · Resource (exact identity) · …` | `#` | 10 | `s03:best-10:8` |
| `reading-map` | s07 | all four §7 tables whose first header is `ID` (7.2 contract, 7.3 shelf, 7.4, 7.5) share ids — the same RL item appears in two tables and has one state | ID | 36 (RL-1 … RL-36) | `s07:reading-map:rl-25` |
| `modules` | s08 | `Module · Exact course, …` (§8.1); rows whose key matches `^M\d+`; the "Track-B allocation total" row is excluded | Module | 12 (M0 … M11) | `s08:modules:m4` |
| `books` | s09 | `Tier · Exact book, edition, access · …` | Exact book (col 2, italic title) | 14 | `s09:books:feedback-systems` |
| `media` | s10 | two tables: §10.1 `Series · Verified activity …` (slug `series`) and §10.2 `Item · Metadata · …` (slug `talks`) | first link text | 26 (10 + 16) | `s10:talks:ri-seminar-max-simchowitz-generative-control-action-chunking` |
| `rungs` | s12 | both §12.2 tables (`Rung · 10 h plan B/E · 20 h plan B/E · Scope rule` and `Rung · Objective and prerequisites · …`) share ids; the Totals row is excluded | Rung | 9 (0 … 8) | `s12:rungs:4` |
| `plan-10h` | s15 | §15.5 `Month (weeks; 10 h/20 h) · Shared work · …` | Month | 24 | `s15:plan-10h:12` |
| `plan-20h` | s15 | same table, second checkbox placed in the "20 h extension" cell | Month | 24 | `s15:plan-20h:12` |
| `gates` | s15 | §15.6 `Gate · Pass evidence · If it fails · Added 20 h evidence`; the gate row itself plus one sub-item per `; `-separated clause of "Pass evidence" | Gate | 8 gates, 36 clauses (5/4/4/5/5/5/4/4) | `s15:gates:q1`, `s15:gates:q1:3` |
| `questions` (answers, not done-flags) | s04 | `# · Question · Decision rule` | `#` | 18 | `s04:questions:7` |

In-place rendering: the first cell of each trackable row starts with `<label class="check"><input type="checkbox" data-track="ID" aria-label="Done: <row label>"></label>` (44×44 hit target, 22px box); in §15.5 the 10 h checkbox sits in the "10 h reduced scope" cell and the 20 h checkbox in the "20 h extension" cell, each labelled; on the home cards and the My-plan month list the same ids are bound, so a tick anywhere shows everywhere. Checked rows get `data-done` (first cell muted), checked cards get a 3px left border.

Storage (localStorage, versioned keys; all reads guarded with try/JSON.parse and shape checks, corrupt values are ignored and overwritten on next write):
- `physical-ai-roadmap.v1.theme` → `"light" | "dark" | "system"`.
- `physical-ai-roadmap.v1.tracker` → `{ "items": { "<id>": { "done": true, "at": "<ISO>" } } }`; unticking deletes the entry.
- `physical-ai-roadmap.v1.plan` → `{ "hoursPerWeek": 10 | 20 | null, "track": "A" | "B" | "C" | null, "startDate": "YYYY-MM-DD" | null, "weeklyHours": { "<week 1..104>": <number ≥ 0> }, "answers": { "s04:questions:<n>": "<text>" } }`.
- `physical-ai-roadmap.v1.triage` → `{ "<feed item id>": { "state": "keep" | "later" | "drop", "at": "<ISO>" } }`.
Progress = for each set, `done` = number of manifest ids present in `tracker.items` (stale ids that are no longer in the manifest are ignored, never counted), `total` = manifest size; overall = sum over sets, where the plan set counted is the chosen plan's (`plan-10h` or `plan-20h`) or, with no plan chosen, neither (the home line then says "outside the plan months"). Percentages are `Math.round(100*done/total)` of these real counts (D6).

Derived numbers on My plan (every input is a report table; `assets/lib/derive.js`, unit-tested):
- `completedWeeks = clamp(floor((today − startDate)/7 days), 0, 104)`; `currentWeek = min(completedWeeks + 1, 104)`; before the start date the page shows "starts in N days" and week 0.
- `currentMonth` = the §15.5 row whose `[weekStart, weekEnd]` contains `currentWeek`; `currentQuarter = ceil(currentMonth / 3)` (consistent with §15.3's 4+4+5-week months and 13-week quarters).
- `expectedHours = completedWeeks × hoursPerWeek` (the report's own accounting: 10 h × 104 = 1,040; 20 h × 104 = 2,080); `loggedHours = Σ weeklyHours`; difference shown as "+N h ahead" / "−N h behind".
- Quarter budget = the §15.3 row for (plan, quarter); month card = the §15.5 row (+ §14.3 cell for months ≥ 10 and a chosen track); gate card = the §15.6 row for the quarter.
- If any row fails to parse, the page shows that row's raw cell text with a single checkbox instead of derived numbers (never a made-up structure).

Export / Import / Reset: Export downloads `physical-ai-roadmap-export-<date>.json` = `{ "version": 1, "exportedAt": "<ISO>", "tracker": …, "plan": …, "triage": … }` via a Blob URL. Import takes a file, requires `version === 1` and object-typed fields, then merges (imported entries overwrite existing ones; a `confirm()` states this before writing); malformed files show an inline error and change nothing. Reset asks `confirm("Remove all tracker, plan and triage data stored in this browser?")` and deletes the three data keys (theme kept).

---

## Feed

`data/feed.json` (written only by `scripts/fetch.mjs`): `{ "generatedAt": "<ISO>", "windowDays": 30, "items": [ { "id": "arxiv:2610.28121", "title": "…", "url": "https://arxiv.org/abs/2610.28121", "source": "arXiv query: Safe autonomy", "sourceId": "arxiv-q-safe-autonomy", "sourceClass": "arxiv", "publishedAt": "2026-10-20T12:30:41Z", "summary": "<≤300 chars from the source's own abstract/body, word-boundary truncation with …, never generated>", "matchedQuery": "Safe autonomy", "alsoMatched": ["cs.RO listing"] } ] }`. `sourceClass ∈ arxiv | proceedings | lab | release | regulator` (brief vocabulary). `matchedQuery` is the first matching registry entry's label (registry order) and `alsoMatched` the others; the query filter matches either.

`data/meta.json` (same shape as Ahead's plus the D8 fields): `{ "generatedAt", "durationMs", "windowDays": 30, "itemCount", "newItemCount", "runner": "github-actions" | "local", "sources": { "<id>": { "name", "class", "kind", "status": "ok" | "empty" | "failed", "fetched", "kept", "ms", "httpStatus", "checkedAt": "<ISO>", "newestAt": "<ISO>" | null, "error": "<≤120 chars>", "unavailableSince": "<ISO>", "note": "<≤120 chars>" } } }`. `unavailableSince` is carried forward from the previous meta.json while a source keeps failing and cleared when it succeeds; the UI renders "Unavailable since <date> · <error>". `status`: `ok` = fetched and ≥1 item inside the window; `empty` = fetched fine, nothing inside the window (yearly proceedings volumes will sit here most of the year — the note says "yearly volume"); `failed` = HTTP ≥400, timeout, TLS or parse error (the error class is the recorded string: `HTTP 403`, `timeout`, `tls: UNABLE_TO_VERIFY_LEAF_SIGNATURE`, `parse error: xml`, `network`). Reachability sources (`kind: "reachability"`) are `ok` on HTTP 200 and `failed` otherwise and produce no items.

Pipeline (`scripts/fetch.mjs` → `src/feed/pipeline.js`): load `sources.config.mjs`; fetch all sources with a concurrency of 4 and per-host pacing (`export.arxiv.org` 3 s between requests, `github.com` 1 s); per source: fetch → parse → normalize → window filter → per-source cap (`maxItems`, default 60); merge with the previous `data/feed.json` (previous items still inside the window are kept, same-id items are replaced by the fresh copy, so a transient failure never empties a source's recent history); dedupe; sort by `publishedAt` desc; cap 500 items; write `feed.json` and `meta.json` atomically (`.tmp` + rename). Exit code 0 even when sources fail (health is data, not a crash); exit 1 only when the registry cannot load, when writing fails, or when every network source fails (then a `::warning::` is printed and the workflow continues with the previous data because the step has `continue-on-error: true`). `--dry-run` writes to a `--data-dir` of choice (used for the local proof run into `$env:TEMP`). Total wall-clock cap 8 minutes (per-source deadline 45 s).

HTTP (`src/feed/http.js`, Ahead's pattern re-written): browser-like Chrome UA and `Accept: application/atom+xml, application/rss+xml, application/xml;q=0.9, text/html;q=0.8, */*;q=0.7`, `Accept-Language: en-US,en;q=0.9`; `redirect: manual` with ≤5 hops; timeout 15 s for `export.arxiv.org` and 20 s elsewhere; one retry after 2 s on network error, timeout, 429 (honouring `Retry-After` ≤30 s) and 5xx (also 404 for github.com atom feeds, which answer 404 transiently); body cap 8 MB; errors are `HttpError(status, url, detail)` with server/cf-ray/content-type/300-char body snippet, `TimeoutError`, `BodyTooLarge`, `ParseError(kind)`; `redactKey(text)` replaces `key=<value>` and `Authorization: <value>` in every message, URL and detail before it can reach a log or meta.json (no secrets are used in v1; the function exists so a later env-gated source cannot leak one). `errorSummary(err)` yields the ≤120-char class recorded in meta.json.

Parsers: `arxiv.js` (Atom via fast-xml-parser: id → arXiv id without version, title, summary, `published`, `updated`, categories, abs link; `publishedAt = updated` so a new version re-surfaces); `atomrss.js` (Atom `entry` and RSS `item`: title, link/`href`, `published|updated|pubDate|dc:date`, `summary|content|description|content:encoded` with HTML stripped); `rss-proceedings.js` (regex over `<a href="pNNN.html">Title</a><br><i>authors</i>` on the volume index page; `publishedAt = volumeDate` from the registry; url = volume base + `pNNN.html`); `reachability.js` (GET, records status only). Fixtures captured from the probes (one file per parser kind: arXiv API cs.RO page, arXiv query page, PX4 and MuJoCo releases atom, CMU RI RSS, GRASP RSS, BAIR Atom, PMLR v305 RSS, NIST RSS, RSS XXII index HTML) live in `tests/fixtures/` and are the only inputs tests use.

Normalize (`src/feed/normalize.js`): canonical URL (lowercase scheme/host, strip `utm_*`/`ref`/`fbclid` params and fragments, strip trailing slash except root, arXiv `abs/ID vN` → `abs/ID`); id = `arxiv:<id>` when an arXiv id is present else `url:<first 16 hex of SHA-1 of canonical URL>`; title whitespace-collapsed; summary = plain text ≤300 chars cut at a word boundary with `…`, after stripping HTML, collapsing whitespace and removing lines that start with `Signed-off-by:` or `Co-authored-by:` (GitHub release bodies); dates parsed to ISO (invalid → item dropped and counted in `skipped`); window = `publishedAt ≥ now − 30 days`; the §17.3 include rule is applied to the two arXiv category listings only: keep when (rule 1 OR rule 3) AND rule 2 match title+summary (rule 1 = embodiment terms, rule 2 = method/evaluation terms, rule 3 = robot-learning terms; the report says "require one embodiment term and one method/evaluation term"); the NIST feed keeps items matching `/robot|autonomous system|AI risk|assurance|test and evaluation|safety/i` (§17.5). No other heuristics: §17.3's "drop networking-only UAV papers…" is a judgment left to the user's triage.

Feed page behaviour (`assets/feed.js`, pure parts in `assets/lib/filter.js`): fetch both JSON files with `cache: "no-cache"`; filters (class, query, triage) are page state; dropped items are hidden unless the "Dropped N" filter is active; Keep/Read later/Drop toggle (`aria-pressed`) and persist to `physical-ai-roadmap.v1.triage`; counts in the triage filter chips update live; the "Showing N of M items in the window" line is computed. Health strip counts come from `meta.sources`. Home's "Latest from the feed" = the 5 newest items not marked `drop`. Items at ≥1440 render Keep / Read later / Drop in one horizontal row at the top-right of the item (OF-11), stacked column at 820–1439, below the meta row under 820.

Local proof run before the first deploy: `node scripts/fetch.mjs --data-dir $env:TEMP\pair-feed` once from the PC, inspect, then run again into `data/` and commit the result so the first deploy is not empty; the live truth is the runner's own run (its meta.json is read at the ship step; `runner` records which produced the data).

---
## §17 source list and probe results

Probe: `TASK/probe-pc-2026-10-20.json`, run from the PC on 2026-10-21T04:49Z with browser-like headers, 15 s timeout, one retry; newest-item dates re-checked in a second probe at about 05:00Z the same day. "In window" counts use the 30-day window ending 20 Oct 2026. Runner expectations follow D8 and Ahead's experience (Cloudflare-fronted hosts may 403, YouTube 404 — none of the included sources is YouTube; only NIST is Cloudflare-served).

| # | Source (registry id) | Class | URL / query | PC probe | Expected from GitHub runners | v1 | Why / fallback |
|---|---|---|---|---|---|---|---|
| 1 | arXiv cs.RO listing (`arxiv-cs.RO`) | arxiv | export API `search_query=cat:cs.RO`, `max_results=100`, newest first | 200, atom, 100 entries, newest 2026-10-20T17:59Z, 659 ms | ok (Google Frontend; Ahead's arXiv API fallback works from runners) | yes | §17.3 "Subscribe to cs.RO and eess.SY"; filtered by the §17.3 include rules |
| 2 | arXiv eess.SY listing (`arxiv-eess.SY`) | arxiv | `cat:eess.SY`, 100 | 200, 100 entries, newest 2026-10-20T17:56Z | ok | yes | same |
| 3 | THESIS NARROW (`arxiv-q-thesis-narrow`) | arxiv | `(cat:cs.RO OR cat:eess.SY) AND (all:"precision landing" OR (all:landing AND all:quadrotor)) AND (all:uncertainty OR all:calibration OR all:failure OR all:robustness)`, 50 | 200, 33 total results, newest 2026-07-21 → empty in window | ok (status will read `empty` until a new match appears) | yes | §17.3 verbatim query |
| 4 | AERIAL AUTONOMY (`arxiv-q-aerial-autonomy`) | arxiv | `(cat:cs.RO OR cat:eess.SY) AND (all:quadrotor OR all:UAV OR all:"aerial robot") AND (all:landing OR all:"visual-inertial" OR all:"GPS-denied")`, 50 | 200, 50, newest 2026-10-15 | ok | yes | §17.3 verbatim |
| 5 | SAFE AUTONOMY (`arxiv-q-safe-autonomy`) | arxiv | `(cat:cs.RO OR cat:eess.SY OR cat:cs.LG) AND (all:"runtime assurance" OR all:"control barrier function" OR all:"safe reinforcement learning") AND (all:robot OR all:quadrotor OR all:autonomous)`, 50 | 200, 50, newest 2026-10-20 | ok | yes | §17.3 verbatim |
| 6 | ROBOT-LEARNING EVALUATION (`arxiv-q-robot-learning-eval`) | arxiv | `(cat:cs.RO OR cat:cs.LG) AND (all:"vision-language-action" OR all:"robot learning" OR all:"sim-to-real") AND (all:evaluation OR all:benchmark OR all:recovery)`, 50 | 200, 50, newest 2026-10-20 | ok | yes | §17.3 verbatim |
| 7 | RSS XXII proceedings (`rss-proceedings`) | proceedings | `https://www.roboticsproceedings.org/rss22/index.html` (HTML; `feed.xml` → 404; no feed `<link>` advertised) | 200, 210 paper links parsed (`p001.html` …), no per-paper dates | ok (plain Apache, no challenge seen) | yes | §17.2 priority 1 "final proceedings"; items dated with the volume date 2026-07-13 → `empty` outside the publication window; registry entry is updated once a year when the next volume appears |
| 8 | OpenReview API v2, CoRL 2026 notes | proceedings | `api2.openreview.net/notes?content.venueid=robot-learning.org/CoRL/2026/Conference` and `…invitation=…/-/Submission` | 200 but redirected to `openreview.net/challenge?redirect=…` (bot challenge page, `text/html`, 0 notes); `groups?id=…` returned JSON | challenge from runners too (an interactive challenge is not passable without a browser; §17.3 itself says API 2 requires an account) | no | PMLR volume feed (#9) covers CoRL; the Feed page's venue line links the §17.3 OpenReview saved searches for manual use |
| 9 | PMLR v305 = CoRL 2025 (`pmlr-corl`) | proceedings | `https://proceedings.mlr.press/v305/assets/rss/feed.xml` (263 items; `v305/feed.xml` has 10) | 200, application/xml, 263 items, all dated 2025-10-07 → empty in window | ok (GitHub Pages host) | yes | machine-readable PMLR/CoRL volume; `empty` until CoRL 2026's volume is published (registry then moves to the new volume number). The site-wide `proceedings.mlr.press/feed.xml` returned 0 entries, so it cannot announce new volumes |
| 10 | CMU Robotics Institute news (`lab-cmu-ri`) | lab | `https://www.ri.cmu.edu/feed/` | 200, RSS, 100 items (609 KB, 5.4 s), 9 in window, newest 2026-10-15 | ok (Apache/RHEL, slow but direct) | yes | §17.5's first XML feed; body cap 2 MB for this source |
| 11 | BAIR blog (`lab-bair`) | lab | `https://bair.berkeley.edu/blog/feed.xml` | 200, 10 items, newest 2026-07-29 → empty | ok | yes | §17.5's optional second XML feed |
| 12 | UPenn GRASP news (`lab-grasp`) | lab | `https://www.grasp.upenn.edu/news/feed/` (`/feed/` only holds two 2023–2025 "uncategorized" posts) | 200, RSS, 10 items, 8 in window, newest 2026-10-15 | ok | yes | the only §17.5 "candidate lab" with a working feed → the third lab |
| 13 | UZH Robotics and Perception Group | lab | `https://rpg.ifi.uzh.ch/` (HTML; `rss.xml` 404; no feed link) | 200 HTML, no feed | — | no (manual) | listed in the "Labs without a feed: check monthly" card |
| 14 | ETH Autonomous Systems Lab | lab | `https://asl.ethz.ch/` (`news-and-events.rss` 404) | 200 HTML, no feed | — | no (manual) | same card |
| 15 | IIIT Hyderabad RRC | lab | `https://robotics.iiit.ac.in/` (`/feed/` 404) | 200 HTML, no feed | — | no (manual) | same card |
| 16 | Stanford ASL | lab | `https://stanfordasl.github.io/` (`feed.xml` 404) | 200 HTML, no feed | — | no (manual) | same card |
| 17 | ros2/ros2 releases (`rel-ros2`) | release | `https://github.com/ros2/ros2/releases.atom` | 200, 10 entries, newest 2026-09-14 (Humble patch 15) → empty | ok (github.com atom works from runners; 404s are transient and retried) | yes | §11 stack, §10.4 feed |
| 18 | PX4/PX4-Autopilot releases (`rel-px4`) | release | `…/PX4/PX4-Autopilot/releases.atom` | 200, newest 2026-09-10 (v1.18.0-rc1) → empty | ok | yes | §11.1 |
| 19 | google-deepmind/mujoco releases (`rel-mujoco`) | release | `…/google-deepmind/mujoco/releases.atom` | 200, 3 in window, newest 3.16.0 2026-10-14 | ok | yes | §11.1 |
| 20 | gazebosim/gz-sim releases (`rel-gz-sim`) | release | `…/gazebosim/gz-sim/releases.atom` | 200, 2 in window, newest 2026-10-20 (11.0.0-pre3) | ok | yes | §11.1 (pre-release tags appear; the title is kept as published) |
| 21 | ros-navigation/navigation2 releases (`rel-nav2`) | release | `…/ros-navigation/navigation2/releases.atom` | 200, 2 in window, newest 1.5.3 2026-10-17 | ok | yes | §10.4 names the Nav2 Atom feed; Rung 3 stack |
| 22 | mavlink/qgroundcontrol releases (`rel-qgc`) | release | `…/mavlink/qgroundcontrol/releases.atom` | 200, 1 in window, newest 2026-10-01 | ok | yes | §11.1 QGC v5.1.5 |
| 23 | mavlink/MAVSDK releases (`rel-mavsdk`) | release | `…/mavlink/MAVSDK/releases.atom` | 200, 7 in window, newest v4.0.6 2026-10-08 | ok | yes | §11.1 aerial client |
| 24 | NIST news, filtered (`reg-nist`) | regulator | `https://www.nist.gov/news-events/news/rss.xml` + `/robot\|autonomous system\|AI risk\|assurance\|test and evaluation\|safety/i` | 200, RSS, 40 items, 5 in window, server `cloudflare` (no challenge from the PC) | uncertain: Cloudflare-served; may 403 from runners | yes, provisional | §17.5 names it with exactly this filter. Ship rule: if the first runner run records `HTTP 403`, remove the source from the registry in the ship commit and record it in the ship report (D8 forbids including Cloudflare-blocked source types); otherwise keep |
| 25 | DGCA portal (`reg-dgca`) | regulator | `https://www.dgca.gov.in/digigov-portal/` | 200 HTML (JSP portal, "What's New" is script-rendered) | likely 200 | reachability only | §13.6 monthly check; "check manually" card shows the last status and date |
| 26 | Ministry of Civil Aviation rules (`reg-moca`) | regulator | `https://www.civilaviation.gov.in/ministry-documents/rules` | 200 HTML (Drupal list of PDFs) | likely 200 | reachability only | §13.6 (search terms shown on the card) |
| 27 | eGazette (`reg-egazette`) | regulator | `https://egazette.gov.in/` | failed: `tls: UNABLE_TO_VERIFY_LEAF_SIGNATURE` (incomplete certificate chain; TLS verification is never disabled) | same failure expected | reachability only | shows "Unavailable since <date> · tls: …" honestly; link still offered |
| 28 | AAI Digital Sky (`reg-digitalsky`) | regulator | `https://digitalsky.aai.aero/` | 200 HTML (JS application shell) | likely 200 | reachability only | §13.6 |
| 29 | AAI AIM NOTAM summaries (`reg-aai-aim`) | regulator | `https://aim-india.aai.aero/notam-summaries` | 200 HTML | likely 200 | reachability only | §13.6 |

Registry total for v1: 19 fetched feeds (6 arXiv, 2 proceedings, 3 labs, 7 releases, 1 regulator feed) + 5 reachability checks = 24 sources. Out of scope by D8 (not §17): the §10.4 newsletters/press feeds (Import AI, IEEE Spectrum, OSRA Discourse, Robot Report podcast) — listed under Open questions as a possible v2.

Honest expectation for the first live run (from the probe): ok 17 · empty 6 (thesis query, RSS XXII, PMLR v305, BAIR, ros2, PX4) · failed 1 (eGazette TLS), with NIST the one source whose runner status is unknown.

---

## Actions workflow

`.github/workflows/build-deploy.yml` (single job; fetch, data commit, build and deploy in one sequence per D9; the schedule minute is 23):

```yaml
name: Build and deploy
on:
  push:
    branches: [main]
    paths-ignore: ['data/**']
  workflow_dispatch:
  schedule:
    - cron: '23 2 * * *'
concurrency:
  group: build-deploy
  cancel-in-progress: false
permissions:
  contents: write
  pages: write
  id-token: write
jobs:
  build-deploy:
    runs-on: ubuntu-latest
    timeout-minutes: 20
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/checkout@v7
        with:
          fetch-depth: 0
          persist-credentials: true
      - uses: actions/setup-node@v7
        with:
          node-version: 24
          cache: npm
      - run: npm ci
      - run: npm test
      - name: Fetch the §17 sources
        if: github.event_name == 'schedule' || github.event_name == 'workflow_dispatch'
        run: node scripts/fetch.mjs
        continue-on-error: true
        env:
          RUNNER_NAME_FOR_META: github-actions
      - name: Commit refreshed data back to main
        if: github.event_name == 'schedule' || github.event_name == 'workflow_dispatch'
        continue-on-error: true
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
          git add data/feed.json data/meta.json
          if git diff --cached --quiet; then echo "no data changes"; exit 0; fi
          git commit -m "data: refresh $(date -u +%Y-%m-%dT%H:%MZ)"
          git pull --rebase origin main
          git push origin HEAD:main
      - run: npm run build
      - uses: actions/configure-pages@v6
        with:
          enablement: true
      - uses: actions/upload-pages-artifact@v5
        with:
          path: dist
      - id: deployment
        uses: actions/deploy-pages@v5
```

Design notes: the bot's push does not trigger another run (GITHUB_TOKEN), which is why build and deploy follow in the same job; `paths-ignore: data/**` additionally keeps a manual data commit from redeploying twice. `continue-on-error` on fetch and commit means a network-dark runner still redeploys the site from the committed data (fetch writes atomically, so `data/` is either fully new or unchanged). If `git pull --rebase` conflicts (only the bot writes `data/`, so this needs a concurrent manual data commit), the step fails softly and the next scheduled run regenerates the data. `upload-pages-artifact` takes the whole `dist/` folder — no file list. Action versions match Ahead's working set (checkout v7, setup-node v7, configure-pages v6, upload-pages-artifact v5, deploy-pages v5). The fetch step reads no secrets. The ship step enables Pages with `gh api -X POST repos/Sudish007/physical-ai-roadmap/pages -f build_type=workflow` before the first dispatch; `configure-pages` with `enablement: true` is the belt to that brace.

Site copy about freshness (feed page and home widget): "Last updated <formatLastUpdated(meta.generatedAt)> · 30-day window · GitHub may delay or skip scheduled runs."

---

## Verification plan

Tooling: `scripts/audit.py` (committed; Playwright from the workspace venv `c:/Users/sudiskmr/Downloads/DomainClassification/.venv/Scripts/python.exe`, `chromium.launch(channel="msedge", headless=True, args=["--disable-lcd-text"])`, `new_context(viewport=…, device_scale_factor=1 or 0.75, reduced_motion="reduce")`, `sys.stdout.reconfigure(encoding="utf-8", errors="replace")`) is driven by `scripts/verify.mjs`, which: (1) unless `--live <url>` is given, starts `scripts/serve.mjs` on a free port in 8790–8799 (checked with `Get-NetTCPConnection -LocalPort <p> -State Listen` in PowerShell; the script itself probes `listen` errors) and polls until HTTP 200; (2) crawls every internal link and anchor of the built site (all `href` without a scheme, plus `#fragment` targets must exist in the target page); (3) runs the Python audit; (4) samples 40 external links (deterministic sample: every k-th distinct host) with HEAD then GET fallback and reports status counts without failing on 403/anti-bot; (5) reads `data/meta.json` and prints the per-source table; (6) writes `verify-report.json` next to the screenshots and exits non-zero on any threshold failure. `npm run verify` runs it locally; the ship step runs `node scripts/verify.mjs --live https://sudish007.github.io/physical-ai-roadmap/ --shots docs/screenshots/live-`. If the venv Python is absent the script says so and skips the browser part with a non-zero exit (the browser audit is mandatory for the reviewer and the ship step).

Pages audited (every page type): `index.html`, `s03.html` (7-column table), `s12.html` (8-column table, trackables), `s15.html` (10-column tables, two checkbox sets), `appendix-a.html`, `plan.html` (with a fixture plan state injected via localStorage: 10 h, Track B, start 2026-10-20), `feed.html`. The scrollWidth/font/contrast/control audits run on all 24 section pages as well (cheap).

| Audit | Widths | Threshold | Where |
|---|---|---|---|
| Horizontal overflow | 320, 360, 390, 820, 1024, 1440, 1920, 2560 | `documentElement.scrollWidth <= clientWidth` on every page, both themes, all `<details>` opened | local + live |
| Body font | 390 and 2560 | computed `body` font-size ≥17 px at 390 and ≥21 px at 2560 | local + live |
| Text floor | all widths | smallest computed font-size of any visible text-bearing element ≥12 px (hover-only anchors with opacity 0 are excluded as unrendered) | local + live |
| Content box | 1920, 2560 | content box of `main.page` / `.page.layout` (border box minus padding) ≥ 0.88 × innerWidth | local + live |
| Contrast | all widths, both themes | every distinct composited (text colour over the effective background, opacity applied) pair ≥4.5:1, or ≥3.0:1 for text ≥24 px / bold ≥18.66 px; pairs listed in the report | local + live |
| Controls | all widths | every `button`, text/date/number/search input, `select`, `.search-box`, `.check` between 40 and 44 px tall | local + live |
| Feed item geometry (OF-1) | 390, 820, 1024, 1440, 1920, 2560 | no two child boxes of a `.feed-item` intersect; every title's left edge equals the item content edge | local + live |
| Prose colour (OF-7) | 390, 2560 | computed colour of every text node outside `<a>` is `--fg`; `<a>` count inside the article equals the markdown link count for that section | local |
| Theme control (OF-3) | 1440 | after `t` the button label and `aria-label` change (Light → Dark → System → Light) and `html[data-theme]` follows; the first paint is light with `prefers-color-scheme: dark` emulated | local + live |
| Label parity (D6) | build | number of chips rendered == number of bracket labels in `content/roadmap.md` (127 at this commit) | npm test |
| Links | build + live | every internal link and fragment resolves (crawl); 40 external links sampled: statuses counted, 403/anti-bot reported not failed; no link from the markdown is missing in the HTML (count parity per section) | local + live |
| Checkbox parity | build | manifest sizes 7/10/36/12/14/26/9/24/24/8; every manifest id has exactly one `input[data-track]` per rendered occurrence; home cards bind the same ids | npm test + crawl |
| Screenshots | 390×844, 1440×900, 1920×1080, 2560×1440 (dsf 0.75) | viewport-only, both themes, for index, s12, plan, feed (and s03 at 1920 light) → `docs/screenshots/live-<page>-<w>-<theme>.png`; each ≤1920 px per side | ship (live) + reviewer (local) |
| Feed data | live | `data/meta.json?cb=<ts>` fetched; per-source status table printed; D6 "unavailable since" rendering checked for every `failed` source | ship |
| Print | 1440 | `page.emulate_media(media="print")`: rails hidden, `table.wide` not clipped (`scrollWidth` of each table ≤ its wrap width) | local |

Reviewer protocol (P5): open the committed screenshots one per call after checking dimensions; run `npm test` and `npm run verify`; read `verify-report.json`. Everything above is a numeric check with a stated threshold, not spec prose.

---

## Open questions for the planner

The planner decides these in `plan.md` "Decisions" (not another design round):
1. OF-8: switch `.cards.best-10` to five columns from 2400 px (CSS ready in the mock) or keep four.
2. OF-11: adopt the horizontal action row at ≥1440 as specified by the orchestrator (default yes).
3. Reading-position restore per section page (`physical-ai-roadmap.v1.readpos.<page>`), a brief nice-to-have: include in FEAT-003 or backlog.
4. Whether `rel="noopener external"` links should also open in a new tab (`target="_blank"`); design default: same tab.
5. Dropped feed items: hidden behind the "Dropped N" filter (design default) vs. collapsed one-line rows.
6. Per-source `maxItems` for the two arXiv listings after the include filter (default 60) and the global cap (default 500 items / ~400 KB feed.json).
7. §10.4 newsletters and press feeds (Import AI, IEEE Spectrum robotics, OSRA Discourse, Robot Report podcast) are outside D8's §17 scope; record as a v2 candidate, do not build.
8. NIST feed: the ship step removes it if the first runner run records a Cloudflare 403 (D8); planner confirms this rule lands in the ship prompt.
9. `appendix-*.html` kicker wording ("Appendix A · part 21 of 24" vs "Section 21 of 24").
10. Whether the §17.3 query block's "Copy" button and the per-heading anchor pills count as UI chrome worth keeping (both are small; design default: keep).

---

## ORCHESTRATOR FINDINGS (2026-10-20)

ORCHESTRATOR FINDINGS (2026-10-20, binding acceptance items — append verbatim to design.md as a section titled "ORCHESTRATOR FINDINGS (2026-10-20)"; the design reviewer treats them as binding, the planner maps each to a FEAT acceptance criterion). Reviewed mock-home-2560-light, mock-section-2560-light, mock-my-plan-1440-light, mock-feed-1920-light, mock-home-390-light, mock-section-390-light, mock-home-1920-dark. Layout rules, type scale, contrast, the collapsible phone rails and the label chips are good — keep them.

OF-1 (HIGH) Feed item layout is broken at 1920: item 1's title is right-aligned while others are left-aligned; item 2's triage buttons wrap into two rows; item 3's "Keep"/"Read later" buttons overlap the title and meta text. Fix: each item is a CSS grid `grid-template-columns: minmax(0,1fr) auto` at ≥820 (content left, actions in a fixed-width right column, stacked vertically), actions below the meta row at <820; titles always left-aligned; no floats. Acceptance: at 390/820/1440/1920/2560 no two element boxes inside an item intersect, and every title's left edge equals the content column's left edge.

OF-2 (HIGH) Trackable table rows have no checkboxes: the §12.2 rung table shows none although the right rail says "Rungs 0 of 9". Every trackable set in the brief (§2 sessions, §3 best-10, §7 reading items, §8 modules, §9 books, §10 media, §12 rungs, §15 month rows) renders a checkbox with a 44px hit target in the leading cell, in-place. Show it in the §12.2 mock including a checked-state style and the rail count updating.

OF-3 (MEDIUM) Theme control reads "Light" in BOTH the light and dark renders. It must show the current mode (Light / Dark / System) with an icon and an aria-label naming the next mode, update on click and on the `t` key.

OF-4 (MEDIUM) Hero copy "A verified learning-and-research roadmap" overstates a report that carries UNCERTAIN and JUDGMENT labels. Use "A source-checked learning-and-research roadmap …". Do not use "verified" as a site-wide descriptor anywhere.

OF-5 (MEDIUM) At 1920/2560 the hero's right ~55% is empty. Use the width by composition: at ≥1440 put the label legend (five chips with a one-line meaning each) or the "Your progress" summary in the hero's right column; single column below 1440. Acceptance: at 1920 and 2560 both hero halves carry content, and whatever moves into the hero does not appear a second time further down the home page.

OF-6 (MEDIUM) The Feed page's "Weekly protocol" table reproduces most of §17.1. Compact it to the Normal-week rows only (0–5, 5–20, 20–30 min with their hard outputs) plus one line "Month-end 90 min · Quarter-end 120 min — see §17.1" linking out.

OF-7 (MEDIUM) In mock-section-390-light several non-link words in the §12.1 paragraph ("rolling shutter", "slip", "repeatability", "connector failures") render in the accent colour, while the 2560 render shows them black. If these are glossary auto-links, remove the feature (not in the brief; adds noise). If it is a rendering bug, fix it. Acceptance: computed colour of non-link prose text is identical at every width; prose links exist only where content/roadmap.md has a link.

OF-8 (LOW) Best-10 grid at 2560 leaves two empty slots (10 cards in 4 columns). Consider 5 columns at ≥2400px so the 10 cards fill two rows; the 7 session cards may stay at 4 columns. Planner decides.

OF-9 (LOW) My plan at 1440: the Track selector wraps "Undecided" alone onto a second row. Keep all four options on one row (order: Undecided · A · B (default) · C) or make an explicit 2×2 group.

OF-10 (LOW) The "link" anchor pill beside every h2/h3 is always visible; show it on hover/focus only, keyboard-reachable.

Process: do not re-shoot all 32 images. After fixing OF-1 and OF-2 in the mocks, re-shoot only mock-feed-1920-light and mock-section-2560-light (viewport-only, ≤1920px per side) and send me the two paths in one info message, then write design.md.

OF-11 (LOW, planner decides) — the stacked Keep/Read later/Drop column makes a one-line item ~170px tall, so only ~5 items fit a 1080px screen; the §17 protocol is "scan ≤10 titles in 5–20 min". At ≥1440 render the three buttons as one horizontal row at the item's top-right (same fixed-width actions column, row direction) so single-line items stay ≈110px; keep the stacked column at 820–1439 and the below-meta row under 820. Geometry acceptance (0 overlaps, aligned titles) unchanged. No re-shoot needed; continue with design.md.

### Design responses to the findings

| Finding | Status in the mocks | What the design specifies |
|---|---|---|
| OF-1 | Fixed; re-shot `TASK/shots/mock-feed-1920-light.png`; audit `feedItemGeometry` = 0 overlaps, 0 misaligned titles at 390/820/1024/1440/1920/2560 | `.feed-item` explicit grid areas (title/meta/summary left; actions right from 820 px in a 9.5rem column; below meta under 820); the geometry check is part of `scripts/audit.py` |
| OF-2 | Fixed; re-shot `TASK/shots/mock-section-2560-light.png` (both §12.2 tables carry checkboxes; rungs 0–1 checked; rail "2 of 9") | Tracker section: in-place 44 px checkbox in the leading cell of every trackable row, shared ids across tables of the same set, `data-done` style, live rail/home counts |
| OF-3 | Mocks now update the label and `aria-label` from `data-theme` | `assets/theme.js`: label Light/Dark/System + icon, `aria-label="Theme: <mode>. Activate for <next>"`, click and `t`; audited |
| OF-4 | Hero copy changed to "A source-checked …" | "verified" banned as a site descriptor (README, titles, hero); the report's own title stays verbatim on `s00.html` |
| OF-5 | Hero is two-column from 1440 with the label legend on the right; the lower legend block removed | Page inventory (Home 1); acceptance: both hero halves carry content at 1920/2560 and the legend appears once on the page |
| OF-6 | Protocol table compacted to the three Normal-week rows + the month-end/quarter-end line | Page inventory (Feed) |
| OF-7 | Not CSS: computed colour of every text node in §12.1 is rgb(22,25,29), 0 `<a>`; 4,902 bluish pixels with default Chromium LCD antialiasing vs 0 with `--disable-lcd-text`. All screenshots now use that flag | Verification plan: prose-colour audit at 390 and 2560 + link-count parity; screenshot launch args |
| OF-8 | CSS present (`.cards.best-10` 5 columns from 2400 px) | Open question 1 |
| OF-9 | Track group rendered as Undecided · A · B (default) · C on one row from 1024 (2×2 below) | Page inventory (My plan) |
| OF-10 | Anchor pill hidden until hover/`:focus-visible` (opacity, so it stays in the tab order) | Build step 3; audit excludes opacity-0 text |
| OF-11 | Not re-shot (per instruction) | Feed section: horizontal action row at ≥1440, stacked column 820–1439, below-meta row under 820; Open question 2 |

