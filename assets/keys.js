// Keyboard shortcuts: `/` search, `t` theme, `[` previous section, `]` next section, `Esc` closes.
// Ignored while the visitor types in an input, textarea, select or contenteditable element
// (Esc is the exception: it always reaches the `escape` handler so a focused search box can be left).

function isTyping(el) {
  if (!el) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable === true;
}

function isVisible(el) {
  return !!el && el.getClientRects().length > 0;
}

/** Default `/` behaviour: focus the header search input; below 360px (input hidden) follow the nav-strip "Search" link. */
export function focusSearch() {
  const input = document.getElementById('search');
  if (isVisible(input)) {
    input.focus();
    input.select();
    return true;
  }
  const link = document.querySelector('.nav-strip .search-link');
  if (isVisible(link)) {
    link.click();
    return true;
  }
  return false;
}

/** Default Esc behaviour: leave the search box. FEAT-003 replaces it with "close the search panel". */
export function blurSearch() {
  const active = document.activeElement;
  if (active && active.id === 'search') {
    active.blur();
    return true;
  }
  return false;
}

export function followRel(rel) {
  const link = document.querySelector(`link[rel="${rel}"]`);
  if (!link || !link.href) return false;
  window.location.href = link.href;
  return true;
}

/**
 * @param {{ search?: () => void, escape?: () => void, theme?: () => void, prev?: () => void, next?: () => void }} handlers
 */
export function initKeys(handlers = {}) {
  const h = {
    search: focusSearch,
    escape: blurSearch,
    theme: null,
    prev: () => followRel('prev'),
    next: () => followRel('next'),
    ...handlers,
  };
  document.addEventListener('keydown', (e) => {
    if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'Escape') {
      if (h.escape && h.escape() === true) e.preventDefault();
      return;
    }
    if (isTyping(document.activeElement)) return;
    switch (e.key) {
      case '/':
        if (h.search) { e.preventDefault(); h.search(); }
        break;
      case 't':
        if (h.theme) { e.preventDefault(); h.theme(); }
        break;
      case '[':
        if (h.prev) { e.preventDefault(); h.prev(); }
        break;
      case ']':
        if (h.next) { e.preventDefault(); h.next(); }
        break;
      default:
    }
  });
  return h;
}
