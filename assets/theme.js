// Theme control (D3, OF-3, plan Decision 15). Modes cycle Light → Dark → System.
// The FIRST paint is decided by the inline bootstrap in src/build/templates.js: light unless the
// visitor stored another mode. This module takes over the header button and the `t` key after load,
// keeps html[data-theme] in sync, and follows the OS scheme only while the stored mode is "system".
import { KEYS, getRaw, setRaw } from './lib/store.js';

export const MODES = Object.freeze(['light', 'dark', 'system']);
const NAMES = Object.freeze({ light: 'Light', dark: 'Dark', system: 'System' });
const DARK_QUERY = '(prefers-color-scheme: dark)';

let mode = 'light';
let button = null;
let media = null;

export function nextMode(current) {
  return MODES[(MODES.indexOf(current) + 1) % MODES.length];
}

/** The palette a mode paints with: "system" follows the OS; the other two are themselves. */
export function resolveMode(current, prefersDark) {
  return current === 'system' ? (prefersDark ? 'dark' : 'light') : current;
}

export function ariaLabelFor(current) {
  return `Theme: ${NAMES[current]}. Activate for ${NAMES[nextMode(current)]}`;
}

export function currentMode() {
  return mode;
}

/** Set the mode, paint it on <html>, and update the button's label, icon and aria-label. Does not persist. */
export function apply(next) {
  mode = MODES.includes(next) ? next : 'light';
  document.documentElement.setAttribute('data-theme', resolveMode(mode, media ? media.matches : false));
  if (!button) return;
  const label = button.querySelector('.label');
  if (label) label.textContent = NAMES[mode];
  const icon = button.querySelector('svg');
  if (icon) icon.setAttribute('data-mode', mode);
  button.setAttribute('aria-label', ariaLabelFor(mode));
}

/** Advance Light → Dark → System → Light and persist the choice. */
export function cycle() {
  apply(nextMode(mode));
  setRaw(KEYS.theme, mode);
}

export function initTheme(root = document) {
  button = root.querySelector('.theme-btn');
  media = typeof matchMedia === 'function' ? matchMedia(DARK_QUERY) : null;
  const stored = getRaw(KEYS.theme);
  apply(MODES.includes(stored) ? stored : 'light');
  if (button) button.addEventListener('click', cycle);
  if (media) media.addEventListener('change', () => { if (mode === 'system') apply('system'); });
}
