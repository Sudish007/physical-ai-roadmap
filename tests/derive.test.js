import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSite } from '../src/build/write.js';
import {
  parseIsoDate, dayNumber, isoDate, chosenPlanSet, normalizePlan, loggedHours, countDone, countAnswers, percent, progress,
  monthForWeek, planPosition, monthRow, gate, budget, substitution, differenceText, formatHours, TOTAL_WEEKS,
} from '../assets/lib/derive.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const site = buildSite(readFileSync(path.join(ROOT, 'content', 'roadmap.md'), 'utf8'));
const planData = site.planData;
const manifest = site.manifest;

const plan10 = { hoursPerWeek: 10, track: 'B', startDate: '2026-10-20', weeklyHours: {}, answers: {} };
const plan20 = { ...plan10, hoursPerWeek: 20 };

test('dates: ISO parsing rejects malformed and impossible dates; day numbers are calendar days', () => {
  assert.equal(parseIsoDate('2026-10-20'), Date.UTC(2026, 9, 20) / 86400000);
  assert.equal(parseIsoDate('2026-02-30'), null, 'impossible date');
  assert.equal(parseIsoDate('2026-1-5'), null);
  assert.equal(parseIsoDate('20 Oct 2026'), null);
  assert.equal(parseIsoDate(null), null);
  assert.equal(dayNumber('2026-10-21') - dayNumber('2026-10-20'), 1);
  assert.equal(dayNumber(new Date(2026, 9, 21, 23, 59)), dayNumber('2026-10-21'), 'local calendar date, not UTC instant');
  assert.equal(isoDate(new Date(2026, 0, 5)), '2026-01-05');
});

test('planPosition: the FEAT-004 fixtures (start 2026-10-20)', () => {
  const day1 = planPosition(planData, plan10, '2026-10-21');
  assert.deepEqual({ ...day1, loggedHours: 0 }, { started: true, startsInDays: null, days: 1, completedWeeks: 0, currentWeek: 1, currentMonth: 1, currentQuarter: 1, hoursPerWeek: 10, expectedHours: 0, loggedHours: 0, difference: 0 });
  const jan = planPosition(planData, plan10, '2027-01-05');
  assert.equal(jan.days, 77);
  assert.equal(jan.completedWeeks, 11);
  assert.equal(jan.currentWeek, 12);
  assert.equal(jan.currentMonth, 3, 'month 3 spans W9–13');
  assert.deepEqual([monthRow(planData, 3).weekStart, monthRow(planData, 3).weekEnd], [9, 13]);
  assert.equal(jan.currentQuarter, 1);
  assert.equal(jan.expectedHours, 110, '11 weeks × 10 h');
  assert.equal(planPosition(planData, plan20, '2027-01-05').expectedHours, 220, '11 weeks × 20 h');
  const late = planPosition(planData, plan10, '2028-10-30');
  assert.equal(late.completedWeeks, 104, 'clamped at 104');
  assert.equal(late.currentWeek, 104);
  assert.equal(late.currentMonth, 24);
  assert.equal(late.currentQuarter, 8);
  assert.equal(late.expectedHours, 1040, 'the report\'s own total: 10 h × 104');
  assert.equal(planPosition(planData, plan20, '2028-10-30').expectedHours, 2080);
  const early = planPosition(planData, plan10, '2026-10-10');
  assert.equal(early.started, false);
  assert.equal(early.startsInDays, 10);
  assert.equal(early.currentWeek, 0, 'week 0 before the start');
  assert.equal(early.completedWeeks, 0);
  assert.equal(early.currentMonth, null);
  assert.equal(early.currentQuarter, null);
  assert.equal(early.expectedHours, 0);
  // the audit fixture: start = today − 14 days → week 3 of 104, month 1, Q1, 20 h expected, 18 h logged, −2 h behind
  const fixture = planPosition(planData, { hoursPerWeek: 10, track: 'B', startDate: '2026-10-07', weeklyHours: { 1: 10, 2: 8 } }, '2026-10-21');
  assert.equal(fixture.completedWeeks, 2);
  assert.equal(fixture.currentWeek, 3);
  assert.equal(fixture.currentMonth, 1);
  assert.equal(fixture.currentQuarter, 1);
  assert.equal(fixture.expectedHours, 20);
  assert.equal(fixture.loggedHours, 18);
  assert.equal(fixture.difference, -2);
  assert.equal(differenceText(fixture.difference), '−2 h behind');
  assert.equal(differenceText(2.5), '+2.5 h ahead');
  assert.equal(differenceText(0), 'on schedule');
  assert.equal(differenceText(null), null);
});

test('planPosition: null without a valid start date; expected/difference null without a chosen plan', () => {
  assert.equal(planPosition(planData, { ...plan10, startDate: null }, '2026-10-21'), null);
  assert.equal(planPosition(planData, { ...plan10, startDate: 'soon' }, '2026-10-21'), null);
  assert.equal(planPosition(planData, null, '2026-10-21'), null);
  const noHours = planPosition(planData, { ...plan10, hoursPerWeek: null, weeklyHours: { 1: 4 } }, '2026-11-10');
  assert.equal(noHours.completedWeeks, 3);
  assert.equal(noHours.expectedHours, null, 'never a made-up number');
  assert.equal(noHours.difference, null);
  assert.equal(noHours.loggedHours, 4);
});

test('every week 1..104 maps to exactly one §15.5 month; quarters are months/3 rounded up', () => {
  for (let w = 1; w <= TOTAL_WEEKS; w++) {
    const m = monthForWeek(planData, w);
    assert.ok(m, `week ${w}`);
    assert.equal(planData.months.filter((r) => w >= r.weekStart && w <= r.weekEnd).length, 1);
  }
  assert.equal(monthForWeek(planData, 0), null);
  assert.equal(monthForWeek(planData, 105), null);
  assert.equal(Math.ceil(3 / 3), 1);
  assert.equal(Math.ceil(4 / 3), 2);
  assert.equal(Math.ceil(24 / 3), 8);
  assert.equal(gate(planData, 1).gate, 'Q1 (W13) foundations');
  assert.equal(monthRow(planData, 3).weekEnd, 13, 'Q1 gate at W13 closes month 3');
});

test('lookups return the report rows or null', () => {
  assert.equal(monthRow(planData, 1).label, '1 (W1–4; 40/80)');
  assert.equal(monthRow(planData, 25), null);
  assert.equal(gate(planData, 8).quarter, 8);
  assert.equal(gate(planData, 9), null);
  const q1 = budget(planData, 10, 1);
  assert.deepEqual([q1.F, q1.P, q1.B, q1.E, q1.W, q1.C, q1.R, q1.Total], [50, 10, 35, 8, 12, 5, 10, 130]);
  assert.equal(q1.emphasis, 'Numerical work, mathematics, mechanics, research habits');
  assert.equal(budget(planData, 20, 1).Total, 260);
  assert.equal(budget(planData, 15, 1), null);
  assert.equal(budget(planData, 10, 0), null);
  assert.deepEqual(planData.columns.map((c) => c.key), ['F', 'P', 'B', 'E', 'W', 'C', 'R']);
  assert.equal(planData.columns[0].label, 'foundations/coursework');
  assert.equal(planData.columns[6].label, 'review/buffer');
  assert.equal(planData.quarterNote, '104 weeks in eight 13-week quarters: 11 build weeks, one integration/reproduction week, one gate/buffer week.');
});

test('§14.3 substitution: months 10–24 for a chosen track, null otherwise', () => {
  assert.equal(substitution(planData, 9, 'A'), null, 'months 1–9 are common');
  assert.equal(substitution(planData, 10, null), null, 'undecided track keeps the Track-B wording of §15.5');
  assert.equal(substitution(planData, 10, 'A'), 'Freeze MuJoCo manipulation task, reset protocol, scripted baseline, failure events');
  assert.equal(substitution(planData, 10, 'B'), 'Freeze PX4 SITL, mission/reset protocol, ULog and failsafe states');
  assert.equal(substitution(planData, 10, 'C'), 'Freeze constrained plant/task, fault injector, monitor-off baseline, violation definition');
  for (let m = 10; m <= 24; m++) for (const t of ['A', 'B', 'C']) assert.equal(typeof substitution(planData, m, t), 'string', `month ${m} track ${t}`);
  assert.equal(substitution(planData, 25, 'A'), null);
  assert.equal(substitution(planData, 12, 'D'), null);
});

test('normalizePlan coerces storage garbage to the declared shape; loggedHours sums valid weeks only', () => {
  assert.deepEqual(normalizePlan(null), { hoursPerWeek: null, track: null, startDate: null, weeklyHours: {}, answers: {} });
  assert.deepEqual(normalizePlan({ hoursPerWeek: '10', track: 'D', startDate: '2026-13-01', weeklyHours: [1, 2], answers: 'x' }), { hoursPerWeek: null, track: null, startDate: null, weeklyHours: {}, answers: {} });
  assert.deepEqual(normalizePlan({ hoursPerWeek: 20, track: 'C', startDate: '2026-10-20', weeklyHours: { 1: 10, '2': '8', 0: 5, 105: 5, 3: -1, 4: 'x' }, answers: { 's04:questions:1': 'yes', 's04:questions:2': '   ', 's04:questions:3': 7 } }),
    { hoursPerWeek: 20, track: 'C', startDate: '2026-10-20', weeklyHours: { 1: 10, 2: 8 }, answers: { 's04:questions:1': 'yes' } });
  assert.equal(loggedHours({ 1: 10, 2: 8 }), 18);
  assert.equal(loggedHours({ 1: 10, 2: 8.5, 200: 100, x: 3 }), 18.5);
  assert.equal(loggedHours(null), 0);
  assert.equal(formatHours(18), '18');
  assert.equal(formatHours(18.5), '18.5');
});

test('progress: real counts, stale ids ignored, the plan set counted only once a plan is chosen', () => {
  const state = { items: {
    's12:rungs:0': { done: true, at: 'x' }, 's12:rungs:1': { done: true, at: 'x' },
    's12:rungs:99': { done: true, at: 'x' }, // stale id, not in the manifest
    's15:plan-10h:1': { done: true, at: 'x' }, 's15:plan-20h:1': { done: true, at: 'x' }, 's15:plan-20h:2': { done: true, at: 'x' },
    's15:gates:q1': { done: true, at: 'x' }, 's15:gates:q1:1': { done: true, at: 'x' }, // a clause is not a gate
    's02:sessions:1': { done: false, at: 'x' },
  } };
  const none = progress(manifest, state, null);
  const by = (p, id) => p.sets.find((s) => s.id === id);
  assert.deepEqual([by(none, 'rungs').done, by(none, 'rungs').total], [2, 9]);
  assert.deepEqual([by(none, 'gates').done, by(none, 'gates').total], [1, 8], 'Decision 7: gates count 8, clauses are independent');
  assert.equal(by(none, 'sessions').done, 0);
  assert.equal(by(none, 'plan-10h').done, 1);
  assert.equal(by(none, 'plan-20h').done, 2);
  assert.equal(none.planSet, null);
  assert.deepEqual(none.overall, { done: 3, total: 122 }, 'no plan chosen: neither plan set is counted (114 + 8 gates)');
  const ten = progress(manifest, state, { hoursPerWeek: 10 });
  assert.equal(ten.planSet, 'plan-10h');
  assert.deepEqual(ten.overall, { done: 4, total: 146 });
  const twenty = progress(manifest, state, { hoursPerWeek: 20 });
  assert.equal(twenty.planSet, 'plan-20h');
  assert.deepEqual(twenty.overall, { done: 5, total: 146 });
  assert.equal(chosenPlanSet({ hoursPerWeek: 15 }), null);
  assert.deepEqual(progress(manifest, null, null).overall, { done: 0, total: 122 });
  assert.equal(none.sets.find((s) => s.id === 'rungs').short, 'Rungs');
  // §4 answers (Decision 21)
  const answered = progress(manifest, state, { answers: { 's04:questions:1': 'a', 's04:questions:7': '12', 's04:questions:9': ' ', 'nope': 'x' } }).answers;
  assert.deepEqual([answered.id, answered.done, answered.total, answered.short], ['questions', 2, 18, 'Answers']);
  assert.equal(countAnswers(manifest.questions.items, null), 0);
  assert.equal(countDone(manifest.sets[0].items, { items: 'nope' }), 0);
  assert.equal(percent(1, 9), 11);
  assert.equal(percent(0, 0), 0);
  assert.equal(percent(5, 4), 100);
});
