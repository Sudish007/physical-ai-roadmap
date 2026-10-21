# Physical AI Roadmap

A reading site for the report in `content/roadmap.md` (a learning-and-research roadmap for physical AI, robotics and drones, evidence cutoff 20 October 2026), a personal progress tracker that lives in the browser, and a low-noise research feed built from the report's own §17 monitoring sources.

Live site: https://sudish007.github.io/physical-ai-roadmap/

## Content

- `content/roadmap.md` is the single source of truth. The build renders it into one page per section (§0–§19, Appendices A–D), a home page, My plan, Feed and a 404 page.
- Evidence cutoff: 20 October 2026. The date is shown once in the home hero and in the footer of every page.
- Every `[FACT]`, `[JUDGMENT]`, `[UNCERTAIN]`, `[HYPE/DEMO]` and `[STALE-BUT-FOUNDATIONAL]` label is rendered as a chip; each section page carries the legend. Nothing in the report is reworded, softened or dropped; all links keep their dates.
- Internal "§N" and "§N.M" cross-references become links to the generated section pages. Heading ids are the only other transformation.
- `content/SOURCE.md` records the origin path, copy date and SHA256 of the report.

## Run locally

Requires Node 24.

| Command | What it does |
|---|---|
| `npm ci` | installs the two dependencies (markdown-it, fast-xml-parser), nothing else |
| `npm run build` | renders `content/roadmap.md` into `dist/` (pages, search index, tracker manifest, plan data) and copies `assets/`, `favicon.svg` and `data/` |
| `npm run serve` | serves `dist/` at http://127.0.0.1:8790/ and http://127.0.0.1:8790/physical-ai-roadmap/ (the Pages subpath); `PORT` and `DIST_DIR` can be set in the environment |
| `npm test` | `node --test` over `tests/**/*.test.js`; no network, feed tests use the recorded fixtures in `tests/fixtures/feed/` |
| `npm run fetch` | runs the §17 pipeline and writes `data/feed.json` and `data/meta.json`; flags `--dry-run`, `--data-dir <dir>`, `--now <iso>`, `--source <ids>` (with `--dry-run`) |
| `npm run verify` | needs a prior `npm run build`; serves `dist/`, crawls every internal link and fragment, and runs `scripts/audit.py` in a real browser. Needs the workspace venv Python with Playwright and Microsoft Edge (`scripts/verify.mjs` names the path; `VERIFY_PYTHON` overrides it). Writes `docs/verify-report.json` |
| `npm run sync-content` | re-copies the report from its origin path when that path exists and rewrites `content/SOURCE.md` (local convenience only) |

Typical loop: `npm ci`, `npm run build`, `npm run serve`, open http://127.0.0.1:8790/physical-ai-roadmap/.

## How the feed works

```
sources.config.mjs ──▶ scripts/fetch.mjs ──▶ src/feed/pipeline.js
                                              fetch every registry entry (4 workers, 45 s per source, 8 min per run)
                                              normalize → 30-day window → dedupe by canonical URL / arXiv id
                                              merge with the previous feed.json → data/feed.json + data/meta.json
assets/feed.js reads data/*.json in the browser ◀── GitHub Pages serves dist/
```

- The registry is the report's own §17 list: the arXiv cs.RO and eess.SY listings filtered by the §17.3 include rules, the four §17.3 keyword queries verbatim, two proceedings volumes, three lab feeds, seven release feeds, the NIST news feed filtered with the §17.5 terms, and five Indian regulator pages checked for reachability only.
- Window: 30 days. Items older than that are dropped at fetch time.
- Per-source status in `data/meta.json`: `ok` (fetched, items in the window), `empty` (fetched fine, nothing in the window), `failed` (with an error class of at most 120 characters, for example `tls: UNABLE_TO_VERIFY_LEAF_SIGNATURE` or `blocked: 403 Cloudflare`). The Feed page shows the status of every source; a failed source is shown as "Unavailable since <date>" with its error class, never hidden.
- The workflow runs daily at 02:23 UTC and on manual dispatch. GitHub may delay or skip scheduled runs. The "Last updated" shown on the site is `generatedAt` from `data/meta.json`.
- No LLM layer, no relay, no API keys. The fetch step reads no secrets.

### Sources

| id | class | What it is | Expected status | Notes |
|---|---|---|---|---|
| `arxiv-cs.RO` | arxiv | arXiv cs.RO listing (export API, newest 100) | ok | filtered by the §17.3 include rules |
| `arxiv-eess.SY` | arxiv | arXiv eess.SY listing (export API, newest 100) | ok | filtered by the §17.3 include rules |
| `arxiv-q-thesis-narrow` | arxiv | §17.3 query "Thesis narrow" | empty most weeks | the query is narrow by design; ok when a matching paper appears |
| `arxiv-q-aerial-autonomy` | arxiv | §17.3 query "Aerial autonomy" | ok | |
| `arxiv-q-safe-autonomy` | arxiv | §17.3 query "Safe autonomy" | ok | |
| `arxiv-q-robot-learning-eval` | arxiv | §17.3 query "Robot-learning evaluation" | ok | |
| `rss-proceedings` | proceedings | RSS XXII proceedings index | empty most of the year | yearly volume; ok around the conference |
| `pmlr-corl` | proceedings | PMLR v305 (CoRL 2025) RSS | empty most of the year | yearly volume |
| `lab-cmu-ri` | lab | CMU Robotics Institute news | empty or ok | filtered with the §17.3 include terms (the §17.5 aerial/safety/learning filter) |
| `lab-bair` | lab | BAIR blog | empty or ok | posts are infrequent |
| `lab-grasp` | lab | UPenn GRASP news | ok | |
| `rel-ros2` | release | ros2/ros2 releases | empty or ok | releases.atom |
| `rel-px4` | release | PX4/PX4-Autopilot releases | empty or ok | releases.atom |
| `rel-mujoco` | release | google-deepmind/mujoco releases | ok | releases.atom |
| `rel-gz-sim` | release | gazebosim/gz-sim releases | ok | releases.atom |
| `rel-nav2` | release | ros-navigation/navigation2 releases | ok | releases.atom |
| `rel-qgc` | release | mavlink/qgroundcontrol releases | ok | releases.atom |
| `rel-mavsdk` | release | mavlink/MAVSDK releases | ok | releases.atom |
| `reg-nist` | regulator | NIST news RSS, filtered with the §17.5 terms | provisional | Cloudflare-served; answered 200 from a PC, the runner result decides whether it stays |
| `reg-dgca` | regulator | DGCA portal | ok (reachability) | not machine-readable; check manually (§13.6) |
| `reg-moca` | regulator | Ministry of Civil Aviation rules | ok (reachability) | not machine-readable; check manually (§13.6) |
| `reg-egazette` | regulator | eGazette | failed | TLS: `UNABLE_TO_VERIFY_LEAF_SIGNATURE` from Node; check manually (§13.6) |
| `reg-digitalsky` | regulator | AAI Digital Sky | ok (reachability) | not machine-readable; check manually (§13.6) |
| `reg-aai-aim` | regulator | AAI AIM NOTAM summaries | ok (reachability) | not machine-readable; check manually (§13.6) |

"Reachability" sources are only pinged; the Feed page shows them as a "check manually" card with the official links and the last HTTP status. The local run on 21 October 2026 recorded ok 16, empty 7, failed 1 (eGazette) with 129 items.

## Progress tracker

- Checkboxes on the section pages (sessions, best-10 resources, reading map, modules, books, lectures and talks, rungs, plan months, gates) and the My plan page (hours per week, track, start date, weekly hours log, §4 answers, feed triage) are stored in `localStorage` only. Nothing leaves the browser.
- Keys are versioned: `physical-ai-roadmap.v1.{theme,tracker,plan,triage,readpos}`.
- My plan has Export (a JSON file with the tracker, plan and triage state), Import (merges after confirmation) and Reset (clears everything except the theme).
- Progress percentages are computed from the real checkbox counts in `tracker-manifest.json`.

## Repository layout

```
content/            roadmap.md (source of truth), SOURCE.md
src/build/          markdown → pages, manifest, plan data, search index, templates
src/feed/           http client, parsers, normalize, pipeline
sources.config.mjs  the §17 source registry (one object literal per source)
scripts/            build.mjs, serve.mjs, fetch.mjs, sync-content.mjs, verify.mjs, audit.py
assets/             app.css, app.js and the page modules; assets/lib/ holds the pure modules the tests import
data/               feed.json, meta.json (written by fetch; refreshed by the workflow as github-actions[bot])
tests/              node:test suites; fixtures/md and fixtures/feed
docs/               verify-report.json and screenshots
.github/workflows/  build-deploy.yml
dist/               build output (gitignored; deployed by the workflow)
```

## Deployment

`.github/workflows/build-deploy.yml` is one job: `npm ci`, `npm test`, then on schedule or dispatch `node scripts/fetch.mjs` and a data commit back to `main` as `github-actions[bot]` (with `git pull --rebase origin main` before the push), then `npm run build` and a Pages deployment of the whole `dist/` folder. Pushes made with the default `GITHUB_TOKEN` do not trigger other runs, which is why fetch, build and deploy sit in the same job. The fetch and commit steps are `continue-on-error`, so a network-dark runner still redeploys the site from the committed data. Pages must be enabled with `build_type=workflow` before the first dispatch.

## Not in v1

- The §10.4 newsletters and press feeds (Import AI, IEEE Spectrum robotics, OSRA Discourse, Robot Report podcast). The feed scope is §17.
- The OpenReview API for CoRL (bot challenge from runners); CoRL arrives through the PMLR volume feed.
- LLM summaries or ranking, any relay, any paid service.
- Scholar / Semantic Scholar alerts, the §17.4 venue watchlist and the §17.5 benchmark watches stay manual; the Feed page links to them.

Reading-position restore on section pages is included.

## Licence

The code is released under the MIT licence; see `LICENSE`. `content/roadmap.md` is © Sudish Kumar, all rights reserved unless he changes it.
