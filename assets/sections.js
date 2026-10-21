// Section-page behaviours: scrollspy for the "On this page" rails, copy-link pills on h3 headings,
// Copy buttons on fenced code blocks (Decision 11: UI, not content) and reading-position restore
// (Decision 3) under physical-ai-roadmap.v1.readpos.
import { KEYS, get, set, isPlainObject } from './lib/store.js';

const COPIED_MS = 1500;

function pageKey() {
  const last = window.location.pathname.split('/').pop();
  return last || 'index.html';
}

function headerBottom() {
  const h = document.querySelector('.site-header');
  return h ? h.getBoundingClientRect().bottom : 56;
}

// ---------------------------------------------------------------------------
// Scrollspy: the h3 nearest the top of the viewport (the last one at or above the line just under the
// sticky header) gets aria-current="true" in the right rail and the inline "On this page" list.
export function initScrollspy() {
  const headings = [...document.querySelectorAll('.prose h3.anchor-h[id]')];
  if (!headings.length) return null;
  const links = new Map();
  for (const h of headings) {
    links.set(h.id, [...document.querySelectorAll(`.rail-right a[href="#${h.id}"], .onpage-inline a[href="#${h.id}"]`)]);
  }
  let current = null;
  const rootFs = parseFloat(getComputedStyle(document.documentElement).fontSize) || 17;
  const update = () => {
    const line = headerBottom() + 2 * rootFs;
    let active = headings[0];
    for (const h of headings) {
      if (h.getBoundingClientRect().top <= line) active = h; else break;
    }
    if (active === current) return;
    current = active;
    for (const [id, list] of links) {
      for (const a of list) {
        if (id === active.id) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
      }
    }
  };
  if (typeof IntersectionObserver === 'function') {
    const io = new IntersectionObserver(update, { threshold: [0, 1] });
    headings.forEach((h) => io.observe(h));
  }
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
  return update;
}

// ---------------------------------------------------------------------------
// Copy-link pills (OF-10): clicking copies the page URL with the heading fragment; the native fragment
// navigation still happens so the address bar shows the same link.
function flash(button, text) {
  const original = button.textContent;
  button.textContent = text;
  setTimeout(() => { button.textContent = original; }, COPIED_MS);
}

function copyText(text) {
  if (!navigator.clipboard || typeof navigator.clipboard.writeText !== 'function') return Promise.reject(new Error('clipboard unavailable'));
  return navigator.clipboard.writeText(text);
}

export function initCopyLinks() {
  for (const a of document.querySelectorAll('.anchor-h .copy')) {
    a.addEventListener('click', () => {
      const id = (a.getAttribute('href') || '').replace(/^#/, '');
      if (!id) return;
      copyText(`${window.location.href.split('#')[0]}#${id}`).then(() => flash(a, 'Copied'), () => {});
    });
  }
}

// ---------------------------------------------------------------------------
// Copy button for fenced code blocks (the §17.3 query block and the other <pre> blocks): a toolbar row
// above the block, so nothing overlaps the code on narrow screens.
export function initCodeCopy() {
  for (const pre of document.querySelectorAll('.prose pre')) {
    const code = pre.querySelector('code') || pre;
    const wrap = document.createElement('div');
    wrap.className = 'code-block';
    const tools = document.createElement('div');
    tools.className = 'code-tools';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn copy-code';
    btn.textContent = 'Copy';
    btn.setAttribute('aria-label', 'Copy this block');
    btn.addEventListener('click', () => {
      copyText(code.textContent.replace(/\n$/, '')).then(() => flash(btn, 'Copied'), () => flash(btn, 'Copy failed'));
    });
    tools.append(btn);
    pre.parentNode.insertBefore(wrap, pre);
    wrap.append(tools, pre);
  }
}

// ---------------------------------------------------------------------------
// Reading position (Decision 3): { "<page>": scrollY } written on pagehide; restored on load only when the
// URL has no fragment and the stored value is a finite number within the page.
export function saveReadingPosition() {
  const stored = get(KEYS.readpos, isPlainObject) || {};
  stored[pageKey()] = Math.round(window.scrollY);
  set(KEYS.readpos, stored);
}

export function restoreReadingPosition() {
  if (window.location.hash) return false;
  const stored = get(KEYS.readpos, isPlainObject);
  if (!stored) return false;
  const y = stored[pageKey()];
  if (typeof y !== 'number' || !Number.isFinite(y) || y <= 0) return false;
  if (y > document.documentElement.scrollHeight) return false;
  window.scrollTo(0, y);
  return true;
}

export function init() {
  initCopyLinks();
  initCodeCopy();
  restoreReadingPosition();
  const spy = initScrollspy();
  if (spy) spy();
  window.addEventListener('pagehide', saveReadingPosition);
}
