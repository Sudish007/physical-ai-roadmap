// Date formatting (plan Decision 19). Pure: no DOM access. All output is UTC so the "Last updated" line
// matches the runner's cron and the data commit, whatever the visitor's timezone. This is the ONE place
// that derives the visible "Last updated" text (D9).

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Date for a string or number timestamp, or null when absent or invalid. */
export function parseDate(value) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** "D MMM YYYY" in UTC, e.g. "21 Oct 2026"; "" when the value is absent or invalid. */
export function formatDate(value) {
  const d = parseDate(value);
  if (!d) return '';
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** "D MMM YYYY, HH:mm UTC", e.g. "21 Oct 2026, 02:31 UTC"; "not yet" when absent or invalid. */
export function formatLastUpdated(value) {
  const d = parseDate(value);
  if (!d) return 'not yet';
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  return `${formatDate(d.getTime())}, ${hh}:${mm} UTC`;
}
