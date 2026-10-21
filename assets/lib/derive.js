// Derived numbers for the tracker and My plan. Pure: no DOM, no storage, no clock unless `today` is
// omitted. Every input is a report table carried by plan-data.json / tracker-manifest.json; every lookup
// returns null when its row is missing so the UI can fall back to the raw cell text (D6: no invented numbers).

export const TOTAL_WEEKS = 104;
export const PLAN_SETS = Object.freeze({ 10: 'plan-10h', 20: 'plan-20h' });
const DAY_MS = 86400000;

function isObj(v) {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Day number (days since the epoch, UTC) for a 'YYYY-MM-DD' string, or null when malformed or impossible. */
export function parseIsoDate(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(typeof s === 'string' ? s : '');
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const t = Date.UTC(y, mo - 1, d);
  const back = new Date(t);
  if (back.getUTCFullYear() !== y || back.getUTCMonth() !== mo - 1 || back.getUTCDate() !== d) return null;
  return t / DAY_MS;
}

/** Day number of a calendar date: a 'YYYY-MM-DD' string, or a Date read in the visitor's local calendar. */
export function dayNumber(today) {
  if (typeof today === 'string') return parseIsoDate(today);
  const d = today instanceof Date ? today : new Date();
  if (Number.isNaN(d.getTime())) return null;
  return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / DAY_MS;
}

/** 'YYYY-MM-DD' of a Date in the visitor's local calendar. */
export function isoDate(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** 10 → 'plan-10h', 20 → 'plan-20h', anything else → null (no plan chosen: neither plan set is counted). */
export function chosenPlanSet(plan) {
  const h = isObj(plan) ? plan.hoursPerWeek : null;
  return PLAN_SETS[h] || null;
}

/**
 * The stored plan, coerced to its declared shape: { hoursPerWeek: 10|20|null, track: 'A'|'B'|'C'|null,
 * startDate: 'YYYY-MM-DD'|null, weeklyHours: { week: hours }, answers: { id: text } }. Garbage is dropped.
 */
export function normalizePlan(raw) {
  const p = isObj(raw) ? raw : {};
  const hoursPerWeek = p.hoursPerWeek === 10 || p.hoursPerWeek === 20 ? p.hoursPerWeek : null;
  const track = p.track === 'A' || p.track === 'B' || p.track === 'C' ? p.track : null;
  const startDate = parseIsoDate(p.startDate) === null ? null : p.startDate;
  const weeklyHours = {};
  if (isObj(p.weeklyHours)) {
    for (const [k, v] of Object.entries(p.weeklyHours)) {
      const week = Number(k);
      const hours = typeof v === 'number' ? v : Number(v);
      if (Number.isInteger(week) && week >= 1 && week <= TOTAL_WEEKS && Number.isFinite(hours) && hours >= 0) weeklyHours[week] = hours;
    }
  }
  const answers = {};
  if (isObj(p.answers)) {
    for (const [k, v] of Object.entries(p.answers)) if (typeof v === 'string' && v.trim()) answers[k] = v;
  }
  return { hoursPerWeek, track, startDate, weeklyHours, answers };
}

/** Σ weeklyHours over weeks 1..104 with finite non-negative values. */
export function loggedHours(weeklyHours) {
  if (!isObj(weeklyHours)) return 0;
  let sum = 0;
  for (const [k, v] of Object.entries(weeklyHours)) {
    const week = Number(k);
    const hours = typeof v === 'number' ? v : Number(v);
    if (Number.isInteger(week) && week >= 1 && week <= TOTAL_WEEKS && Number.isFinite(hours) && hours >= 0) sum += hours;
  }
  return Math.round(sum * 100) / 100;
}

// ---------------------------------------------------------------------------
// Progress counts (manifest ids present in the tracker state; stale ids are never counted)

export function countDone(items, trackerState) {
  const stored = isObj(trackerState) && isObj(trackerState.items) ? trackerState.items : {};
  let n = 0;
  for (const it of Array.isArray(items) ? items : []) {
    const e = it && stored[it.id];
    if (isObj(e) && e.done === true) n++;
  }
  return n;
}

export function countAnswers(items, plan) {
  const answers = isObj(plan) && isObj(plan.answers) ? plan.answers : {};
  let n = 0;
  for (const it of Array.isArray(items) ? items : []) {
    const a = it && answers[it.id];
    if (typeof a === 'string' && a.trim()) n++;
  }
  return n;
}

export function percent(done, total) {
  if (!total || !(done >= 0)) return 0;
  return Math.round((100 * Math.min(done, total)) / total);
}

/**
 * Per-set and overall counts. The plan set counted overall is the chosen plan's (plan-10h or plan-20h) or,
 * with no plan chosen, neither. `answers` counts the §4 questions with a non-empty saved answer.
 */
export function progress(manifest, trackerState, planState) {
  const list = manifest && Array.isArray(manifest.sets) ? manifest.sets : [];
  const sets = list.map((s) => ({ id: s.id, label: s.label, short: s.short || s.label, done: countDone(s.items, trackerState), total: Array.isArray(s.items) ? s.items.length : 0 }));
  const planSet = chosenPlanSet(planState);
  const overall = { done: 0, total: 0 };
  for (const s of sets) {
    if ((s.id === 'plan-10h' || s.id === 'plan-20h') && s.id !== planSet) continue;
    overall.done += s.done;
    overall.total += s.total;
  }
  const q = manifest && isObj(manifest.questions) && Array.isArray(manifest.questions.items) ? manifest.questions : null;
  const answers = q ? { id: q.id, label: q.label, short: q.short || q.label, done: countAnswers(q.items, planState), total: q.items.length } : null;
  return { sets, overall, planSet, answers };
}

// ---------------------------------------------------------------------------
// Position in the 104-week plan

function months(planData) {
  return planData && Array.isArray(planData.months) ? planData.months : [];
}

/** The §15.5 row whose [weekStart, weekEnd] contains `week`, or null. */
export function monthForWeek(planData, week) {
  return months(planData).find((m) => week >= m.weekStart && week <= m.weekEnd) || null;
}

/**
 * completedWeeks = clamp(floor((today − startDate) / 7 d), 0, 104); currentWeek = min(completedWeeks + 1, 104);
 * before the start date: startsInDays > 0, week 0, no current month or quarter. expectedHours =
 * completedWeeks × hoursPerWeek (null without a chosen plan); difference = logged − expected.
 * Returns null without a valid start date.
 */
export function planPosition(planData, plan, today = new Date()) {
  const start = isObj(plan) ? parseIsoDate(plan.startDate) : null;
  const now = dayNumber(today);
  if (start === null || now === null) return null;
  const hoursPerWeek = plan.hoursPerWeek === 10 || plan.hoursPerWeek === 20 ? plan.hoursPerWeek : null;
  const logged = loggedHours(plan.weeklyHours);
  const days = now - start;
  if (days < 0) {
    return {
      started: false, startsInDays: -days, days, completedWeeks: 0, currentWeek: 0,
      currentMonth: null, currentQuarter: null, hoursPerWeek,
      expectedHours: hoursPerWeek === null ? null : 0, loggedHours: logged, difference: hoursPerWeek === null ? null : logged,
    };
  }
  const completedWeeks = Math.min(TOTAL_WEEKS, Math.max(0, Math.floor(days / 7)));
  const currentWeek = Math.min(completedWeeks + 1, TOTAL_WEEKS);
  const row = monthForWeek(planData, currentWeek);
  const currentMonth = row ? row.month : null;
  const currentQuarter = currentMonth === null ? null : Math.ceil(currentMonth / 3);
  const expectedHours = hoursPerWeek === null ? null : completedWeeks * hoursPerWeek;
  return {
    started: true, startsInDays: null, days, completedWeeks, currentWeek, currentMonth, currentQuarter, hoursPerWeek,
    expectedHours, loggedHours: logged, difference: expectedHours === null ? null : Math.round((logged - expectedHours) * 100) / 100,
  };
}

// ---------------------------------------------------------------------------
// Row lookups (null when the row is missing — the UI then shows raw text, never a made-up structure)

/** The §15.5 row for a month number. */
export function monthRow(planData, month) {
  return months(planData).find((m) => m.month === month) || null;
}

/** The §15.6 row for a quarter number. */
export function gate(planData, quarter) {
  const gates = planData && Array.isArray(planData.gates) ? planData.gates : [];
  return gates.find((g) => g.quarter === quarter) || null;
}

/** The §15.3 row for (hours per week, quarter). */
export function budget(planData, hoursPerWeek, quarter) {
  const table = planData && isObj(planData.budgets) ? planData.budgets[String(hoursPerWeek)] : null;
  const quarters = table && Array.isArray(table.quarters) ? table.quarters : [];
  return quarters.find((q) => q.q === quarter) || null;
}

/** The §14.3 cell for (month ≥ 10, track A|B|C); null for months 1–9, an undecided track, or a missing row. */
export function substitution(planData, month, track) {
  if (!(month >= 10) || !(track === 'A' || track === 'B' || track === 'C')) return null;
  const rows = planData && Array.isArray(planData.substitutions) ? planData.substitutions : [];
  const row = rows.find((r) => r.month === month);
  return row && typeof row[track] === 'string' ? row[track] : null;
}

/** '+N h ahead' / '−N h behind' / 'on schedule'; null without an expected figure. */
export function differenceText(difference) {
  if (typeof difference !== 'number' || !Number.isFinite(difference)) return null;
  if (difference > 0) return `+${formatHours(difference)} h ahead`;
  if (difference < 0) return `−${formatHours(-difference)} h behind`;
  return 'on schedule';
}

export function formatHours(n) {
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100);
}
