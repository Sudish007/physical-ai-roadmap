// Physical AI Roadmap client entry. Runs on every page: theme control, keyboard shortcuts and search,
// then the module for the current page type (body[data-page]).
import { initTheme, cycle } from './theme.js';
import { initKeys } from './keys.js';
import { initSearch } from './search.js';
import { init as initTracker } from './tracker.js';

// Page modules, loaded on demand. Each module exports init({ keys }).
const PAGE_MODULES = {
  home: () => import('./home.js'),
  section: () => import('./sections.js'),
  plan: () => import('./plan.js'),
  feed: () => import('./feed.js'),
  '404': null,
};

initTheme();
const keys = initKeys({ theme: cycle });
initSearch(keys);
initTracker(); // every page: binds input[data-track], fills [data-set] counts (FEAT-004)

const page = document.body.dataset.page;
const load = PAGE_MODULES[page];
if (typeof load === 'function') {
  load().then((mod) => { if (typeof mod.init === 'function') mod.init({ keys }); });
}
