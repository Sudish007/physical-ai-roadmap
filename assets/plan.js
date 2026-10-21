// My plan page. Reads/writes physical-ai-roadmap.v1.plan { hoursPerWeek, track, startDate, weeklyHours,
// answers }, fills every number from plan-data.json (the report's §15.3 / §15.5 / §15.6 / §14.3 / §4 tables)
// through assets/lib/derive.js, renders the month list and gate card with the same tracker ids as s15.html,
// and offers Export / Import / Reset (design "Tracker"). Nothing is shown before a plan is chosen: the
// prompt card quotes the §4 Q7 rule instead (D6: no invented numbers).
import { KEYS, get, set, remove, isPlainObject, trackerShape, validateImport, mergeImport, importedEntryCount, exportBundle } from './lib/store.js';
import { normalizePlan, planPosition, monthRow, gate, budget, substitution, loggedHours, differenceText, formatHours, isoDate, TOTAL_WEEKS } from './lib/derive.js';
import { formatDate } from './lib/format.js';
import { applyState, refresh as refreshTracker } from './tracker.js';

const SAVE_DEBOUNCE_MS = 400;
const RESET_PROMPT = 'Remove all tracker, plan and triage data stored in this browser?';

let planData = null;
let plan = normalizePlan(null);
let lastDefaultWeek = null;
let saveTimer = null;
const el = {};

const $ = (sel, root = document) => root.querySelector(sel);

function readPlan() {
  return normalizePlan(get(KEYS.plan, isPlainObject));
}

function savePlan() {
  set(KEYS.plan, plan);
}

/** Small element builder: attrs `class`, `text`, `html` (trusted build output only), others as attributes. */
function h(tag, attrs = {}, ...children) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined || v === false) continue;
    if (k === 'class') e.className = v;
    else if (k === 'text') e.textContent = v;
    else if (k === 'html') e.innerHTML = v;
    else e.setAttribute(k, v === true ? '' : String(v));
  }
  for (const c of children) if (c !== null && c !== undefined && c !== false) e.append(c);
  return e;
}

function checkbox(id, ariaLabel) {
  return h('label', { class: 'check' }, h('input', { type: 'checkbox', 'data-track': id, 'aria-label': ariaLabel }));
}

/** A span with a rendered cell; a full stop is appended when the cell does not already end a sentence. */
function cell(html, { dot = false } = {}) {
  const s = h('span', { html });
  if (dot && !/[.!?…]$/.test(s.textContent.trim())) s.append('.');
  return s;
}

function message(text, isError) {
  el.msg.textContent = text;
  el.msg.hidden = false;
  el.msg.classList.toggle('error', !!isError);
  el.msg.setAttribute('role', isError ? 'alert' : 'status');
}

// ---------------------------------------------------------------------------
// Rendering

function renderControls() {
  for (const b of el.hoursButtons) b.setAttribute('aria-pressed', String(Number(b.dataset.hours) === plan.hoursPerWeek));
  for (const b of el.trackButtons) b.setAttribute('aria-pressed', String((b.dataset.trackChoice || null) === plan.track));
  if (el.start.value !== (plan.startDate || '')) el.start.value = plan.startDate || '';
}

function fillAnswers() {
  for (const ta of el.answers) {
    if (ta === document.activeElement) continue;
    const v = plan.answers[ta.dataset.answer] || '';
    if (ta.value !== v) ta.value = v;
  }
}

function showStat(key, v, k) {
  const s = el.stats.querySelector(`[data-stat="${key}"]`);
  s.querySelector('[data-v]').textContent = v;
  s.querySelector('[data-k]').textContent = k;
}

function planHours(m) {
  return plan.hoursPerWeek === 20 ? m.hours20 : m.hours10;
}

function renderStats(pos) {
  const hpw = plan.hoursPerWeek;
  if (!pos) {
    showStat('week', 'Week —', `of ${TOTAL_WEEKS} · set a start date above`);
    showStat('month', '—', 'current month: needs the start date');
    showStat('quarter', '—', 'current quarter: needs the start date');
    showStat('expected', '—', `expected so far (completed weeks × ${hpw} h): needs the start date`);
    showStat('logged', `${formatHours(loggedHours(plan.weeklyHours))} h`, 'logged (manual weekly entries)');
    return;
  }
  if (!pos.started) {
    const days = pos.startsInDays;
    showStat('week', 'Week 0', `of 104 · starts in ${days} day${days === 1 ? '' : 's'} (${formatDate(plan.startDate)})`);
    showStat('month', '—', 'current month: the plan has not started');
    showStat('quarter', '—', 'current quarter: the plan has not started');
    showStat('expected', '0 h', `expected so far (0 completed weeks × ${hpw} h)`);
    showStat('logged', `${formatHours(pos.loggedHours)} h`, `logged · ${differenceText(pos.difference)}`);
    return;
  }
  showStat('week', `Week ${pos.currentWeek}`, `of ${TOTAL_WEEKS} · started ${formatDate(plan.startDate)}`);
  const m = monthRow(planData, pos.currentMonth);
  showStat('month', m ? `Month ${m.month}` : '—', m ? `W${m.weekStart}–${m.weekEnd} · ${planHours(m)} h planned (${hpw} h plan)` : `no §15.5 row contains week ${pos.currentWeek}`);
  const b = budget(planData, hpw, pos.currentQuarter);
  showStat('quarter', pos.currentQuarter ? `Quarter ${pos.currentQuarter}` : '—', b ? b.emphasis : 'no §15.3 row for this quarter');
  showStat('expected', `${formatHours(pos.expectedHours)} h`, `expected so far (${pos.completedWeeks} completed week${pos.completedWeeks === 1 ? '' : 's'} × ${hpw} h)`);
  showStat('logged', `${formatHours(pos.loggedHours)} h`, `logged · ${differenceText(pos.difference)}`);
}

/** The month's work: the §14.3 cell for the chosen track from month 10, else the §15.5 shared cell. */
function workFor(m) {
  const sub = substitution(planData, m.month, plan.track);
  return sub === null ? { html: m.sharedHtml, substituted: false } : { html: sub, substituted: true };
}

function scopeLabel() {
  return plan.hoursPerWeek === 20 ? '20 h extension' : '10 h reduced scope';
}

function monthCheckbox(m) {
  const id = plan.hoursPerWeek === 20 ? m.ids.plan20 : m.ids.plan10;
  return checkbox(id, `Done: Month ${m.label} · ${plan.hoursPerWeek} h plan`);
}

function renderMonth(pos) {
  const body = $('[data-body]', el.month);
  const title = $('[data-title]', el.month);
  body.replaceChildren();
  const m = pos && pos.currentMonth !== null ? monthRow(planData, pos.currentMonth) : null;
  if (!m) {
    title.textContent = 'This month';
    body.append(h('p', { class: 'small muted', text: notStartedText(pos, 'the current month') }));
    return;
  }
  title.textContent = `This month: ${m.month} (W${m.weekStart}–${m.weekEnd})`;
  const work = workFor(m);
  if (work.substituted) {
    body.append(h('p', {}, h('strong', { text: `Track ${plan.track} work (§14.3 replacement). ` }), cell(work.html)));
  } else {
    body.append(h('p', {}, h('strong', { text: 'Shared work. ' }), cell(work.html)));
    if (m.month >= 10) {
      body.append(h('p', { class: 'small muted' }, 'This is the Track B wording, the report\'s default. The track is chosen at the end of month 9; once chosen, the ', h('a', { href: 's14.html#s14-3', text: '§14.3 replacement' }), ' for that track takes this place.'));
    }
  }
  body.append(h('p', {}, h('strong', { text: 'Required deliverable. ' }), cell(m.deliverableHtml)));
  body.append(h('p', {}, h('strong', { text: `${scopeLabel()}. ` }), cell(plan.hoursPerWeek === 20 ? m.scope20Html : m.scope10Html)));
  body.append(h('div', { class: 'check-row' }, monthCheckbox(m), h('span', { class: 'small', text: `Month ${m.month} deliverable done (the same box as in §15.5 and in the month list below)` })));
}

function notStartedText(pos, what) {
  if (!pos) return `Set a start date above to see ${what}.`;
  if (!pos.started) return `The plan starts in ${pos.startsInDays} day${pos.startsInDays === 1 ? '' : 's'}; ${what} appears from week 1.`;
  return `No report row matches week ${pos.currentWeek}.`;
}

function renderGate(pos) {
  const body = $('[data-body]', el.gate);
  const title = $('[data-title]', el.gate);
  body.replaceChildren();
  const g = pos && pos.currentQuarter !== null ? gate(planData, pos.currentQuarter) : null;
  if (!g) {
    title.textContent = 'Gate';
    body.append(h('p', { class: 'small muted', text: notStartedText(pos, 'this quarter\'s gate') }));
    return;
  }
  title.textContent = `Gate ${g.gate}`;
  if (Array.isArray(g.clauses) && g.clauses.length) {
    const ul = h('ul', { class: 'gate-list' });
    for (const c of g.clauses) ul.append(h('li', {}, checkbox(c.id, `${g.gate}: ${c.text}`), cell(c.html)));
    body.append(h('p', { class: 'small muted', text: 'Pass evidence, one box per clause (your own notes; only the gate box below is counted):' }), ul);
  } else {
    body.append(h('p', {}, h('strong', { text: 'Pass evidence. ' }), cell(g.passEvidenceHtml)));
  }
  body.append(h('div', { class: 'check-row' }, checkbox(g.id, `Done: ${g.gate}`), h('span', { class: 'small' }, h('strong', { text: 'Gate passed' }), ' · the box counted in Quarterly gates, the same as in §15.6')));
  body.append(h('p', { class: 'small' }, h('strong', { text: 'If it fails: ' }), cell(g.ifItFailsHtml)));
  if (plan.hoursPerWeek === 20) body.append(h('p', { class: 'small' }, h('strong', { text: 'Added 20 h evidence: ' }), cell(g.added20hHtml)));
}

function renderLog(pos) {
  const defaultWeek = pos ? Math.max(1, pos.currentWeek) : 1;
  if (el.logWeek.value === '' || el.logWeek.value === String(lastDefaultWeek)) el.logWeek.value = String(defaultWeek);
  lastDefaultWeek = defaultWeek;
  const weeks = Object.keys(plan.weeklyHours).map(Number).sort((a, b) => a - b);
  el.logList.replaceChildren(...weeks.map((w) => h('li', { 'data-week': w },
    h('span', { text: `Week ${w}` }),
    h('span', { class: 'count', text: `${formatHours(plan.weeklyHours[w])} h` }),
    h('button', { class: 'btn quiet', type: 'button', 'data-remove-week': w, 'aria-label': `Remove the week ${w} entry`, text: 'Remove' }))));
  el.logNote.hidden = weeks.length > 0;
}

function renderMonths(pos) {
  const title = $('[data-title]', el.months);
  const note = $('[data-note]', el.months);
  title.textContent = `Month by month, ${plan.hoursPerWeek} h plan`;
  note.replaceChildren();
  if (plan.track) {
    note.append(`Months 1–9 are common. From month 10 the rows show the Track ${plan.track} replacement from `, h('a', { href: 's14.html#s14-3', text: '§14.3' }), '.');
  } else {
    note.append('Months 1–9 are common. From month 10 the rows show the Track B wording, the report\'s default; the A/B/C replacements are in ', h('a', { href: 's14.html#s14-3', text: '§14.3' }), '.');
  }
  el.monthList.replaceChildren(...planData.months.map((m) => {
    const current = !!pos && pos.currentMonth === m.month;
    const work = workFor(m);
    const body = h('div', {}, cell(work.html, { dot: true }), ' ', h('strong', { text: 'Deliverable: ' }), cell(m.deliverableHtml, { dot: true }), ' ', h('em', {}, cell(plan.hoursPerWeek === 20 ? m.scope20Html : m.scope10Html, { dot: true })));
    return h('li', { 'data-month': m.month, 'aria-current': current ? 'true' : null },
      h('span', { class: 'm', text: `${m.month} · W${m.weekStart}–${m.weekEnd} · ${planHours(m)} h` }),
      body,
      monthCheckbox(m));
  }));
}

function renderBudget(pos) {
  const body = $('[data-body]', el.budget);
  const title = $('[data-title]', el.budget);
  body.replaceChildren();
  const row = pos && pos.currentQuarter !== null ? budget(planData, plan.hoursPerWeek, pos.currentQuarter) : null;
  if (!row) {
    title.textContent = 'Quarter budget';
    body.append(h('p', { class: 'small muted', text: notStartedText(pos, 'the quarter budget') }));
    return;
  }
  title.textContent = `Quarter ${row.q} budget, ${plan.hoursPerWeek} h plan`;
  const tbody = h('tbody');
  for (const c of planData.columns) {
    tbody.append(h('tr', {}, h('td', { text: `${c.key} ${c.label}` }), h('td', { class: 'num', text: String(row[c.key]) })));
  }
  tbody.append(h('tr', { class: 'total' }, h('td', { text: 'Total' }), h('td', { class: 'num', text: String(row.Total) })));
  body.append(h('div', { class: 'table-wrap' }, h('table', { 'data-cols': '2' }, h('thead', {}, h('tr', {}, h('th', { text: 'Category' }), h('th', { class: 'num', text: 'Hours' }))), tbody)));
}

function render() {
  const chosen = plan.hoursPerWeek !== null;
  el.prompt.hidden = chosen;
  renderControls();
  fillAnswers();
  for (const s of [el.stats, el.month, el.gate, el.log, el.months, el.budget]) s.hidden = !chosen;
  if (chosen) {
    const pos = planPosition(planData, plan, new Date());
    renderStats(pos);
    renderMonth(pos);
    renderGate(pos);
    renderLog(pos);
    renderMonths(pos);
    renderBudget(pos);
    applyState(el.app);
  }
  el.app.dataset.ready = chosen ? 'plan' : 'prompt';
}

// ---------------------------------------------------------------------------
// Behaviour

function update(mutate) {
  mutate();
  savePlan();
  render();
}

function saveWeek() {
  const week = Number(el.logWeek.value);
  const hours = Number(el.logHours.value);
  const ok = Number.isInteger(week) && week >= 1 && week <= TOTAL_WEEKS && el.logHours.value.trim() !== '' && Number.isFinite(hours) && hours >= 0 && hours <= 168;
  if (!ok) {
    el.logNote.hidden = false;
    el.logNote.textContent = `Enter a week from 1 to ${TOTAL_WEEKS} and hours from 0 to 168.`;
    return;
  }
  update(() => { plan.weeklyHours[week] = Math.round(hours * 100) / 100; });
  el.logHours.value = '';
  el.logNote.textContent = 'No entries yet. Expected-versus-logged compares completed weeks × hours/week with the sum of these entries.';
}

function scheduleAnswerSave(ta) {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => flushAnswer(ta), SAVE_DEBOUNCE_MS);
}

function flushAnswer(ta) {
  clearTimeout(saveTimer);
  const id = ta.dataset.answer;
  const text = ta.value;
  if (text.trim()) plan.answers[id] = text;
  else delete plan.answers[id];
  savePlan();
}

function exportJson() {
  const bundle = exportBundle();
  const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = h('a', { href: url, download: `physical-ai-roadmap-export-${isoDate()}.json`, hidden: true });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  const n = importedEntryCount(bundle);
  message(`Exported ${n} entr${n === 1 ? 'y' : 'ies'} to ${a.download}.`, false);
}

async function importFile(file) {
  let parsed;
  try {
    parsed = JSON.parse(await file.text());
  } catch {
    message(`Import failed: ${file.name} is not valid JSON. Nothing was changed.`, true);
    return;
  }
  const v = validateImport(parsed);
  if (!v.ok) {
    message(`Import failed: ${v.error} Nothing was changed.`, true);
    return;
  }
  const n = importedEntryCount(v.bundle);
  if (!window.confirm(`Import ${n} entr${n === 1 ? 'y' : 'ies'} from ${file.name}? Imported entries overwrite existing ones with the same id; everything else stays as it is.`)) {
    message('Import cancelled; nothing was changed.', false);
    return;
  }
  const merged = mergeImport({ tracker: get(KEYS.tracker, trackerShape), plan: get(KEYS.plan, isPlainObject), triage: get(KEYS.triage, isPlainObject) }, v.bundle);
  set(KEYS.tracker, merged.tracker);
  set(KEYS.plan, merged.plan);
  set(KEYS.triage, merged.triage);
  plan = readPlan();
  render();
  refreshTracker();
  message(`Imported ${n} entr${n === 1 ? 'y' : 'ies'} from ${file.name}.`, false);
}

function resetAll() {
  if (!window.confirm(RESET_PROMPT)) return;
  remove(KEYS.tracker);
  remove(KEYS.plan);
  remove(KEYS.triage);
  plan = normalizePlan(null);
  lastDefaultWeek = null;
  el.logWeek.value = '';
  render();
  refreshTracker();
  message('Tracker, plan and triage data stored in this browser were removed; the theme setting was kept.', false);
}

function bind() {
  for (const b of el.hoursButtons) b.addEventListener('click', () => update(() => { plan.hoursPerWeek = Number(b.dataset.hours); }));
  for (const b of el.trackButtons) b.addEventListener('click', () => update(() => { plan.track = b.dataset.trackChoice || null; }));
  el.start.addEventListener('change', () => update(() => { plan.startDate = /^\d{4}-\d{2}-\d{2}$/.test(el.start.value) ? el.start.value : null; }));
  el.logSave.addEventListener('click', saveWeek);
  for (const input of [el.logWeek, el.logHours]) input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); saveWeek(); } });
  el.logList.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-remove-week]');
    if (!b) return;
    update(() => { delete plan.weeklyHours[Number(b.dataset.removeWeek)]; });
  });
  for (const ta of el.answers) {
    ta.addEventListener('input', () => scheduleAnswerSave(ta));
    ta.addEventListener('blur', () => flushAnswer(ta));
  }
  el.exportBtn.addEventListener('click', exportJson);
  el.importBtn.addEventListener('click', () => el.file.click());
  el.file.addEventListener('change', () => {
    const file = el.file.files && el.file.files[0];
    el.file.value = '';
    if (file) importFile(file);
  });
  el.resetBtn.addEventListener('click', resetAll);
  window.addEventListener('storage', (e) => {
    if (e.key === null || e.key === KEYS.plan) { plan = readPlan(); render(); }
  });
}

export async function init() {
  el.app = $('#plan-app');
  if (!el.app) return;
  el.msg = $('#plan-msg');
  try {
    const r = await fetch('plan-data.json');
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    planData = await r.json();
  } catch {
    message('plan-data.json could not be loaded, so the plan numbers cannot be shown. Reload the page to try again.', true);
    return;
  }
  Object.assign(el, {
    prompt: $('#plan-prompt'),
    hoursButtons: [...el.app.querySelectorAll('button[data-hours]')],
    trackButtons: [...el.app.querySelectorAll('.track-group button[data-track-choice]')],
    start: $('#plan-start'),
    exportBtn: $('#plan-export'),
    importBtn: $('#plan-import'),
    file: $('#plan-import-file'),
    resetBtn: $('#plan-reset'),
    stats: $('#plan-stats'),
    month: $('#plan-month'),
    gate: $('#plan-gate'),
    log: $('#plan-log'),
    logWeek: $('#log-week'),
    logHours: $('#log-hours'),
    logSave: $('#log-save'),
    logList: $('[data-log-list]'),
    logNote: $('[data-log-note]'),
    months: $('#plan-months'),
    monthList: $('[data-month-list]'),
    budget: $('#plan-budget'),
    answers: [...el.app.querySelectorAll('textarea[data-answer]')],
  });
  plan = readPlan();
  bind();
  render();
}
