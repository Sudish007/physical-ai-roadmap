import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createPlainMd, renderInline } from '../src/build/md.js';
import { splitSections, headingIndex } from '../src/build/parse.js';
import { buildPlanData, cellNumber } from '../src/build/plan-data.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const content = readFileSync(path.join(ROOT, 'content', 'roadmap.md'), 'utf8');
const plainMd = createPlainMd();
const { sections } = splitSections(content);
const env = { label: 'test', headingIndex: headingIndex(sections) };
const plan = buildPlanData(sections, plainMd, (s) => renderInline(s, env));

test('DR-10: §15.3 totals parse from **1,040** / **2,080**; columns sum to their totals', () => {
  assert.equal(cellNumber('**1,040**'), 1040);
  assert.equal(cellNumber(' 2,080 '), 2080);
  assert.throws(() => cellNumber('**n/a**'), /Not a number/);
  assert.equal(plan.budgets['10'].totals.Total, 1040);
  assert.equal(plan.budgets['20'].totals.Total, 2080);
  assert.equal(plan.budgets['10'].quarters.length, 8);
  assert.deepEqual(plan.budgets['10'].quarters[0], { q: 1, emphasis: 'Numerical work, mathematics, mechanics, research habits', F: 50, P: 10, B: 35, E: 8, W: 12, C: 5, R: 10, Total: 130 });
  assert.equal(plan.budgets['20'].quarters[7].Total, 260);
  assert.deepEqual(plan.budgets['10'].totals, { F: 160, P: 116, B: 218, E: 249, W: 134, C: 83, R: 80, Total: 1040 });
  assert.deepEqual(plan.budgets['20'].totals, { F: 250, P: 218, B: 400, E: 545, W: 270, C: 197, R: 200, Total: 2080 });
});

test('§15.5: 24 months, weeks contiguous 1…104, hours parsed from the month cell', () => {
  assert.equal(plan.months.length, 24);
  assert.deepEqual(plan.months[0], {
    ...plan.months[0],
    month: 1, weekStart: 1, weekEnd: 4, hours10: 40, hours20: 80, label: '1 (W1–4; 40/80)',
    ids: { plan10: 's15:plan-10h:1', plan20: 's15:plan-20h:1' }, anchor: 't-s15-plan-10h-1',
  });
  assert.equal(plan.months[23].weekEnd, 104);
  assert.equal(plan.months[2].hours10, 50);
  for (let i = 1; i < 24; i++) assert.equal(plan.months[i].weekStart, plan.months[i - 1].weekEnd + 1);
  assert.equal(plan.months.reduce((a, m) => a + m.hours10, 0), 1040);
  assert.equal(plan.months.reduce((a, m) => a + m.hours20, 0), 2080);
  assert.ok(plan.months[2].deliverableHtml.includes('<strong>Q1 gate report</strong>'));
  assert.ok(plan.months[13].sharedHtml.includes('<a class="xref" href="s11.html#s11-5">§11.5</a>'), 'cross-references survive in cells');
});

test('§15.6: 8 gates with clause counts 5/4/4/5/5/5/4/4 and the three other columns', () => {
  assert.equal(plan.gates.length, 8);
  assert.deepEqual(plan.gates.map((g) => g.clauses.length), [5, 4, 4, 5, 5, 5, 4, 4]);
  assert.deepEqual(plan.gates.map((g) => g.id), ['s15:gates:q1', 's15:gates:q2', 's15:gates:q3', 's15:gates:q4', 's15:gates:q5', 's15:gates:q6', 's15:gates:q7', 's15:gates:q8']);
  assert.equal(plan.gates[0].gate, 'Q1 (W13) foundations');
  assert.equal(plan.gates[0].clauses[0].id, 's15:gates:q1:1');
  assert.equal(plan.gates[0].clauses[4].text, '500-word memo separates result from interpretation');
  assert.ok(plan.gates[2].clauses[3].html.includes('<a class="xref" href="s14.html">§14</a> decision memo'));
  assert.equal(plan.gates[0].ifItFailsHtml, 'Four remediation weeks; drop LQR and C++ extensions; do not start ROS');
  assert.equal(plan.gates[0].added20hHtml, 'Integrator/controller comparison and one peer review');
  assert.equal(plan.gates[7].anchor, 't-s15-gates-q8');
});

test('§14.3: 15 rows, months 10–24 × Track A/B/C', () => {
  assert.equal(plan.substitutions.length, 15);
  assert.deepEqual(plan.substitutions.map((r) => r.month), Array.from({ length: 15 }, (_, i) => i + 10));
  assert.equal(plan.substitutions[0].B, 'Freeze PX4 SITL, mission/reset protocol, ULog and failsafe states');
  assert.equal(plan.substitutions[14].A, 'Portfolio, applications, retrospective; finish R7/R8 substitute and final evidence table');
});

test('§4: 18 questions with decision rules; Q7 is exposed as the hours rule', () => {
  assert.equal(plan.questions.length, 18);
  assert.deepEqual(plan.questions.map((q) => q.n), Array.from({ length: 18 }, (_, i) => i + 1));
  assert.equal(plan.questions[6].id, 's04:questions:7');
  assert.equal(plan.questions[6].question, 'Hours per week you can protect for 104 weeks (not a best week)?');
  assert.ok(plan.questions[6].ruleHtml.startsWith('≤12 → 10 h plan. ≥18 → 20 h plan. Between →'));
  assert.equal(plan.hoursRule.ruleHtml, plan.questions[6].ruleHtml);
  assert.ok(plan.questions[8].ruleHtml.includes('<strong>single-machine smoke observation with a partial manifest</strong>'));
});

test('a tampered total fails the build', () => {
  const bad = content.replace('| **Total** | | **160** | **116** | **218** | **249** | **134** | **83** | **80** | **1,040** |', '| **Total** | | **160** | **116** | **218** | **249** | **134** | **83** | **80** | **1,041** |');
  assert.notEqual(bad, content);
  assert.throws(() => buildPlanData(splitSections(bad).sections, plainMd, (s) => renderInline(s, env)), /10 h total is 1041, expected 1040/);
});
