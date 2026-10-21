# Feed fixtures

Real responses captured once from the §17 sources on 2026-10-21 (13:14 UTC) with the repo's own HTTP client (`src/feed/http.js`, browser-like headers) by a scratch script that was removed afterwards. Large feeds are trimmed to N items (the first N unless the row says otherwise); the XML envelope is preserved byte-for-byte so the parsers see the real namespaces, CDATA and date formats. Fixtures are byte-exact captures and are never edited by hand; regenerate from a new capture instead. `.gitattributes` marks `tests/fixtures/**` `-text`, so CRLF conversion cannot alter them. `tests/helpers.js` maps every registry URL to one of these files (sources without their own capture reuse the same-kind file, which doubles as a dedupe test) and throws on any other URL.

| file | upstream | items kept | note |
|---|---|---|---|
| arxiv-api-cs.RO.xml | `export.arxiv.org/api/query?search_query=cat:cs.RO…max_results=100` | 10 of 100 (entries 1–7, 31, 42, 67) | arXiv API Atom: versioned ids, `summary`, `published`/`updated`, `arxiv:primary_category`; entries 31, 42 and 67 pass the §17.3 include rule, the first seven do not |
| arxiv-q-thesis-narrow.xml | the THESIS NARROW query, `max_results=50` | all 33 | as served; newest entry 2026-07-21 → `empty` in a 30-day window |
| arxiv-q-aerial.xml | the AERIAL AUTONOMY query, `max_results=50` | 10 of 50 | newest 2026-10-15; also stands in for the Safe-autonomy and Robot-learning-evaluation queries in tests |
| gh-releases-px4.xml | `github.com/PX4/PX4-Autopilot/releases.atom` | 4 of 10 | newest v1.18.0-rc1 2026-09-10 → `empty`; release notes as HTML in `content` |
| gh-releases-mujoco.xml | `github.com/google-deepmind/mujoco/releases.atom` | 3 of 10 | 3.16.0 / 3.15.0 / 3.14.0, long release notes |
| gh-releases-gz-sim.xml | `github.com/gazebosim/gz-sim/releases.atom` | 3 of 10 | pre-release tags; bodies are `Signed-off-by:` trailers only (summary becomes empty) |
| gh-releases-nav2.xml | `github.com/ros-navigation/navigation2/releases.atom` | 3 of 10 | 1.3.14 and 1.5.3 on 2026-10-17 |
| gh-releases-ros2.xml | `github.com/ros2/ros2/releases.atom` | 3 of 10 | newest 2026-09-14 → `empty` |
| gh-releases-qgc.xml | `github.com/mavlink/qgroundcontrol/releases.atom` | 3 of 10 | two entries share the title "QGroundControl V5.1 - Stable" (different tags) |
| gh-releases-mavsdk.xml | `github.com/mavlink/MAVSDK/releases.atom` | 3 of 10 | v4.0.6 / v4.0.5 / v4.0.4 |
| cmu-ri.xml | `www.ri.cmu.edu/feed/` | 5 of 100 | WordPress RSS 2.0 with `content:encoded`, `dc:creator`; none of the five matches the §17.5 filter → `empty` |
| grasp-news.xml | `www.grasp.upenn.edu/news/feed/` | 5 of 10 | WordPress RSS; descriptions end with `[&#8230;]` inside CDATA |
| bair-blog.xml | `bair.berkeley.edu/blog/feed.xml` | 3 of 10 | Jekyll RSS with full HTML posts; newest 2026-07-29 → `empty` |
| pmlr-v305.xml | `proceedings.mlr.press/v305/assets/rss/feed.xml` | 5 of 263 | all dated 2025-10-07 (CoRL 2025 volume) → `empty` |
| nist-news.xml | `www.nist.gov/news-events/news/rss.xml` | 5 of 40 | Drupal RSS; one of the five matches the §17.5 filter ("Safety") |
| rss22-index.html | `www.roboticsproceedings.org/rss22/index.html` | 15 of 210 paper links | HTML volume index, no feed; head, the first fifteen `pNNN.html` entries and the closing structure kept |
| cloudflare-403.html | synthesized (no capture: the PC was not blocked) | — | a Cloudflare block page in the shape the runner may receive: title "Attention Required!", "Sorry, you have been blocked", a Ray ID; served in tests with `server: cloudflare` and a `cf-ray` header |
