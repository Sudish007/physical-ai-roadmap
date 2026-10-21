// Physical AI Roadmap client entry. Runs on every page: theme control, keyboard shortcuts and search,
// then the module for the current page type (body[data-page]).
import { initTheme, cycle } from './theme.js';
import { initKeys } from './keys.js';
import { initSearch } from './search.js';

// Page modules, loaded on demand. Each module exports init({ keys }). Later FEATs fill the table:
//   FEAT-004  plan: () => import('./plan.js')   (+ tracker.js on every page with input[data-track])
//   FEAT-005  feed: () => import('./feed.js')
const PAGE_MODULES = {
  home: () => import('./home.js'),
  section: () => import('./sections.js'),
  plan: null,
  feed: null,
  '404': null,
};

initTheme();
const keys = initKeys({ theme: cycle });
initSearch(keys);

const page = document.body.dataset.page;
const load = PAGE_MODULES[page];
if (typeof load === 'function') {
  load().then((mod) => { if (typeof mod.init === 'function') mod.init({ keys }); });
}
