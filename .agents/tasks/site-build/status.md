# Build status

Date: 2026-10-21 (planner). Repo `c:/Users/sudiskmr/Downloads/DomainClassification/physical-ai-roadmap/`, branch `main`.

| FEAT | title | state | commit | verification |
|------|-------|-------|--------|--------------|
| FEAT-001 | Scaffold, content pipeline, data extractors, skeleton pages, tests | done | `02a4ff2` (+ `docs(FEAT-001)` hash record) | `npm test` 61/61 pass (13 suites, fixtures + real content, no network); `npm run build` → `pages 28 · h3 89 · chips 127 · crossrefs 113 rewritten / 5 skipped · manifest 7/10/36/12/14/26/9/24/24/8 · search 965 records · bytes 1148152`; build-dist test: 0 broken internal links/fragments (1,500+ checked), 0 `style=`, 0 color-scheme meta, 127 content chips, link parity on all 24 pages, 5 "(not published)", every manifest id has an `input[data-track]`; `node scripts/sync-content.mjs` left content/roadmap.md byte-identical (SHA256 EF5461…FB11 before and after) and rewrote content/SOURCE.md; serve smoke: 200 for /index.html and /physical-ai-roadmap/s12.html on 8790, 404 for a missing page, server killed. No browser audit (FEAT-002 brings the tooling). |
| FEAT-002 | Site shell, light-first theme, fluid layout CSS, client bootstrap, browser audit tooling | todo | — | — |
| FEAT-003 | Home composition, section-page behaviours, client-side search | todo | — | — |
| FEAT-004 | Local progress tracker and My plan page | todo | — | — |
| FEAT-005 | §17 feed pipeline, fixtures, feed page, initial data | todo | — | — |
| FEAT-006 | build-deploy workflow, README, MIT licence, repo hygiene | todo | — | — |
| FEAT-007 | Verification runner completion, local screenshots, verify report | todo | — | — |
| fix/review loop | integration fix → code review (max 2) | todo | — | — |
| ship | repo creation, Pages, dispatch, live verification | todo | — | — |

Each coder fills its row: state `done`, the commit hash, and one line of verification results (tests passed, build summary, verify thresholds / audit group). Deviations from plan.md go in the row and in the FEAT file's `findings`.

## Notes

- Design step (2026-10-21): design.md written; mocks in mocks/ (home, section=§12, my-plan, feed); 32 mock screenshots + mock-audit.json (PASS) in shots/; §17 probe in probe-pc-2026-10-20.json; orchestrator findings OF-1..OF-11 appended to design.md.
- Design review (2026-10-21): APPROVED, 0 HIGH, 5 MEDIUM (DR-1…DR-5), 5 NIT (DR-6…DR-10); all carried into the FEAT files as mandatory items with their audits.
- DR-6: 30 of the 32 mock screenshots predate the OF fixes (only `mock-section-2560-light.png` and `mock-feed-1920-light.png` are current). Mock shots are never acceptance evidence; the evidence set is the real-build `docs/screenshots/*.png` written by FEAT-007 and the live `docs/screenshots/live-*.png` written by the ship step.
- Planner (2026-10-21): plan.md, features/FEAT-001…007.json, context.json, task.json, workflow-tail.json written; remaining workflow steps restructured into one coder step per FEAT, a fix+review loop (max 2, pause), and ship. The planner's commit also adds the two design-review files the review step left untracked.
- FEAT-001 (2026-10-21): pipeline, pages and tests committed. Decisions taken inside the FEAT (details in features/FEAT-001.json `findings`): 404.html's CSP uses `base-uri 'self'` (the `<base>` element would otherwise be blocked; every other page keeps `'none'`); the home "Your progress" list has one row per manifest set including gates (9 rows; overall total 122 outside the plan months); `s04.html`'s rail shows "Answers (§4) 0 of 18" under `data-set="questions"`; rows shared by two tables (rungs, reading map) anchor the first occurrence and give later ones a `-2`/`-3` suffix; the §12.2 objectives table and the §10.2 talks table are not sticky-first by the <24-char average rule. The FEAT commit is `02a4ff2ffad436707157f57836ff024d658d4741`; a commit cannot contain its own hash, so this line and the FEAT JSON were updated in a follow-up `docs(FEAT-001)` commit.
