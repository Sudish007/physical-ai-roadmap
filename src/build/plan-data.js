// plan-data.json: the report's own plan tables (§15.3, §15.5, §15.6, §14.3, §4), parsed — never invented (DR-10, D6).
import { extractTables, headersMatch } from './tables.js';

const MONTH_RE = /^(\d+) \(W(\d+)–(\d+); (\d+)\/(\d+)\)$/;
const QUARTER_COLS = ['F', 'P', 'B', 'E', 'W', 'C', 'R', 'Total'];

function sectionBySlug(sections, slug) {
  const s = sections.find((x) => x.slug === slug);
  if (!s) throw new Error(`Section ${slug} not found`);
  return s;
}

/** "**1,040**" → 1040 (strip emphasis markers and thousands separators before Number()). */
export function cellNumber(raw) {
  const cleaned = String(raw).replace(/\*/g, '').replace(/,/g, '').trim();
  if (!/^-?\d+(\.\d+)?$/.test(cleaned)) throw new Error(`Not a number: "${raw}"`);
  return Number(cleaned);
}

function timeTable(table, hoursPerWeek, expectedTotal) {
  const want = ['Quarter', 'Emphasis', ...QUARTER_COLS];
  if (!headersMatch(table, want)) throw new Error(`§15.3 table header mismatch: ${table.signature}`);
  const quarters = [];
  let totals = null;
  for (const row of table.rows) {
    const first = row.cells[0].raw.trim();
    const nums = {};
    QUARTER_COLS.forEach((c, i) => { nums[c] = cellNumber(row.cells[2 + i].raw); });
    if (/^\*\*Total\*\*$/i.test(first)) { totals = nums; continue; }
    const q = /^Q(\d)$/.exec(first);
    if (!q) throw new Error(`§15.3 unexpected row "${first}"`);
    quarters.push({ q: Number(q[1]), emphasis: row.cells[1].text, ...nums });
  }
  if (quarters.length !== 8) throw new Error(`§15.3 ${hoursPerWeek} h table has ${quarters.length} quarter rows, expected 8`);
  if (!totals) throw new Error(`§15.3 ${hoursPerWeek} h table has no Total row`);
  if (totals.Total !== expectedTotal) throw new Error(`§15.3 ${hoursPerWeek} h total is ${totals.Total}, expected ${expectedTotal}`);
  for (const c of QUARTER_COLS) {
    const sum = quarters.reduce((a, r) => a + r[c], 0);
    if (sum !== totals[c]) throw new Error(`§15.3 ${hoursPerWeek} h column ${c} sums to ${sum} but the Total row says ${totals[c]}`);
  }
  return { hoursPerWeek, quarters, totals };
}

export function buildPlanData(sections, plainMd, renderInline) {
  const s15 = sectionBySlug(sections, 's15');
  const s14 = sectionBySlug(sections, 's14');
  const s4 = sectionBySlug(sections, 's04');
  const t15 = extractTables(s15.body, plainMd, 'section 15');
  const t14 = extractTables(s14.body, plainMd, 'section 14');
  const t4 = extractTables(s4.body, plainMd, 'section 4');

  // §15.3 — first table = 10 h, second = 20 h
  const timeTables = t15.filter((t) => headersMatch(t, ['Quarter', 'Emphasis', 'F']));
  if (timeTables.length !== 2) throw new Error(`§15.3: expected two time-accounting tables, found ${timeTables.length}`);
  const budgets = { '10': timeTable(timeTables[0], 10, 1040), '20': timeTable(timeTables[1], 20, 2080) };

  // §15.5 — 24 months
  const monthTables = t15.filter((t) => headersMatch(t, ['Month (weeks; 10 h/20 h)', 'Shared work']));
  if (monthTables.length !== 1) throw new Error('§15.5 month table not found');
  const months = monthTables[0].rows.map((row) => {
    const m = MONTH_RE.exec(row.cells[0].raw.trim());
    if (!m) throw new Error(`§15.5 month cell does not match the pattern: "${row.cells[0].raw}"`);
    const month = Number(m[1]);
    return {
      month,
      weekStart: Number(m[2]),
      weekEnd: Number(m[3]),
      hours10: Number(m[4]),
      hours20: Number(m[5]),
      label: row.cells[0].text,
      sharedHtml: renderInline(row.cells[1].raw),
      deliverableHtml: renderInline(row.cells[2].raw),
      scope10Html: renderInline(row.cells[3].raw),
      scope20Html: renderInline(row.cells[4].raw),
      ids: { plan10: `s15:plan-10h:${month}`, plan20: `s15:plan-20h:${month}` },
      anchor: `t-s15-plan-10h-${month}`,
    };
  });
  if (months.length !== 24) throw new Error(`§15.5 has ${months.length} rows, expected 24`);
  let week = 1;
  for (const r of months) {
    if (r.weekStart !== week) throw new Error(`§15.5 month ${r.month} starts at W${r.weekStart}, expected W${week}`);
    if (r.weekEnd < r.weekStart) throw new Error(`§15.5 month ${r.month} has an inverted week range`);
    week = r.weekEnd + 1;
  }
  if (week - 1 !== 104) throw new Error(`§15.5 weeks end at ${week - 1}, expected 104`);

  // §15.6 — 8 gates
  const gateTables = t15.filter((t) => headersMatch(t, ['Gate', 'Pass evidence', 'If it fails', 'Added 20 h evidence']));
  if (gateTables.length !== 1) throw new Error('§15.6 gates table not found');
  const gates = gateTables[0].rows.map((row) => {
    const m = /^Q(\d)\b/.exec(row.cells[0].raw.trim());
    if (!m) throw new Error(`§15.6 gate cell without Qn: "${row.cells[0].raw}"`);
    const id = `s15:gates:q${m[1]}`;
    const clauseTexts = row.cells[1].text.split('; ').map((s) => s.trim()).filter(Boolean);
    const clauseMd = row.cells[1].raw.split('; ').map((s) => s.trim()).filter(Boolean);
    return {
      id,
      quarter: Number(m[1]),
      gate: row.cells[0].text,
      gateHtml: renderInline(row.cells[0].raw),
      passEvidenceHtml: renderInline(row.cells[1].raw),
      clauses: clauseTexts.map((text, k) => ({ id: `${id}:${k + 1}`, text, html: clauseMd[k] !== undefined ? renderInline(clauseMd[k]) : text })),
      ifItFailsHtml: renderInline(row.cells[2].raw),
      added20hHtml: renderInline(row.cells[3].raw),
      anchor: `t-${id.replace(/:/g, '-')}`,
    };
  });
  if (gates.length !== 8) throw new Error(`§15.6 has ${gates.length} gates, expected 8`);

  // §14.3 — months 10–24 × Track A/B/C
  const subTables = t14.filter((t) => headersMatch(t, ['Month', 'Track A replacement', 'Track B replacement', 'Track C replacement']));
  if (subTables.length !== 1) throw new Error('§14.3 substitution table not found');
  const substitutions = subTables[0].rows.map((row) => ({
    month: cellNumber(row.cells[0].raw),
    A: renderInline(row.cells[1].raw),
    B: renderInline(row.cells[2].raw),
    C: renderInline(row.cells[3].raw),
  }));
  if (substitutions.length !== 15 || substitutions[0].month !== 10 || substitutions[14].month !== 24) {
    throw new Error(`§14.3 expected 15 rows for months 10–24, found ${substitutions.length}`);
  }

  // §4 — 18 questions
  const qTables = t4.filter((t) => headersMatch(t, ['#', 'Question', 'Decision rule']));
  if (qTables.length !== 1) throw new Error('§4 questions table not found');
  const questions = qTables[0].rows.map((row) => {
    const n = cellNumber(row.cells[0].raw);
    return {
      n,
      id: `s04:questions:${n}`,
      question: row.cells[1].text,
      questionHtml: renderInline(row.cells[1].raw),
      ruleHtml: renderInline(row.cells[2].raw),
      anchor: `t-s04-questions-${n}`,
    };
  });
  if (questions.length !== 18) throw new Error(`§4 has ${questions.length} questions, expected 18`);
  const q7 = questions.find((q) => q.n === 7);

  return {
    version: 1,
    source: 'content/roadmap.md §15.3, §15.5, §15.6, §14.3, §4',
    budgets,
    months,
    gates,
    substitutions,
    questions,
    hoursRule: q7 ? { question: q7.question, ruleHtml: q7.ruleHtml } : null,
  };
}
