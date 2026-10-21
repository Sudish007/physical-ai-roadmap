import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatLastUpdated, formatDate, parseDate } from '../assets/lib/format.js';

test('formatLastUpdated: fixed ISO → "D MMM YYYY, HH:mm UTC"; absent or invalid → "not yet"', () => {
  assert.equal(formatLastUpdated('2026-10-21T02:31:07.123Z'), '21 Oct 2026, 02:31 UTC');
  assert.equal(formatLastUpdated('2026-01-05T23:59:59Z'), '5 Jan 2026, 23:59 UTC');
  assert.equal(formatLastUpdated('2026-10-21T05:30:00+05:30'), '21 Oct 2026, 00:00 UTC', 'offsets are converted to UTC');
  assert.equal(formatLastUpdated('2026-12-31T23:30:00-02:00'), '1 Jan 2027, 01:30 UTC');
  assert.equal(formatLastUpdated(Date.UTC(2026, 9, 21, 2, 31)), '21 Oct 2026, 02:31 UTC');
  for (const bad of [null, undefined, '', 'yesterday', '2026-13-45', {}, [], true]) {
    assert.equal(formatLastUpdated(bad), 'not yet', `value ${JSON.stringify(bad)}`);
  }
});

test('formatDate: "D MMM YYYY" in UTC; invalid → empty string', () => {
  assert.equal(formatDate('2026-10-20T12:30:41Z'), '20 Oct 2026');
  assert.equal(formatDate('2026-10-20T23:30:00Z'), '20 Oct 2026', 'UTC date, not the local one');
  assert.equal(formatDate('2026-03-01'), '1 Mar 2026');
  assert.equal(formatDate(null), '');
  assert.equal(formatDate('not a date'), '');
  assert.equal(parseDate('2026-10-20T12:30:41Z').toISOString(), '2026-10-20T12:30:41.000Z');
  assert.equal(parseDate(undefined), null);
});
