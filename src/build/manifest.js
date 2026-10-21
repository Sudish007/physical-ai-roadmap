// Tracker manifest: locate every declared table by section + header signature, apply the per-set
// row-key rule (content-map.mjs), assert counts and collisions, and index rows for the renderer.
import { TRACKABLE, LEADING_ID_RE, slugify } from './content-map.mjs';
import { extractTables, headersMatch, firstItalicText, firstLink } from './tables.js';

export function anchorOf(id) {
  return `t-${id.replace(/:/g, '-')}`;
}

/** Row key for one set's rule; null when the rule yields nothing. */
export function rowKey(set, row) {
  const cell = row.cells[(set.keyColumn || 1) - 1];
  if (!cell) return null;
  switch (set.keyRule) {
    case 'leading-id': {
      const m = LEADING_ID_RE.exec(cell.raw.trim());
      return m ? { key: m[1].toLowerCase(), label: cell.text } : null;
    }
    case 'italic-col2': {
      const t = firstItalicText(cell.children);
      return t ? { key: slugify(t), label: t } : null;
    }
    case 'first-link-text': {
      const l = firstLink(cell.children);
      return l ? { key: slugify(l.text), label: l.text } : null;
    }
    default:
      throw new Error(`Unknown key rule ${set.keyRule} for set ${set.id}`);
  }
}

function locate(section, spec, tables) {
  const matches = tables.filter((t) => headersMatch(t, spec.headers));
  if (spec.all) {
    if (!matches.length) throw new Error(`No table starting with "${spec.headers.join(' · ')}" in ${section.slug}`);
    return matches;
  }
  if (matches.length !== 1) throw new Error(`Expected exactly one table starting with "${spec.headers.join(' · ')}" in ${section.slug}, found ${matches.length}`);
  return matches;
}

/**
 * @param sections parse.splitSections().sections
 * @param plainMd  md.createPlainMd()
 * @returns {{ manifest, rowIndex: Map<string, Map<number, Map<number, object[]>>>, setsBySection: Map<string, object[]> }}
 */
export function buildManifest(sections, plainMd) {
  const bySlug = new Map(sections.map((s) => [s.slug, s]));
  const tableCache = new Map();
  const tablesOf = (section) => {
    if (!tableCache.has(section.slug)) tableCache.set(section.slug, extractTables(section.body, plainMd, `section ${section.key}`));
    return tableCache.get(section.slug);
  };
  const rowIndex = new Map();
  const setsBySection = new Map();
  const globalIds = new Map(); // id → { setId, tableOrdinal }
  const sets = [];
  let questions = null;

  for (const set of TRACKABLE) {
    const section = bySlug.get(set.section);
    if (!section) throw new Error(`Set ${set.id}: section ${set.section} not found`);
    const tables = tablesOf(section);
    const items = new Map(); // id → item
    const clauses = [];
    for (const spec of set.tables) {
      for (const table of locate(section, spec, tables)) {
        const seenInTable = new Set();
        for (const row of table.rows) {
          const k = rowKey(set, row);
          if (!k) {
            if (set.skipKeyless) continue;
            throw new Error(`Set ${set.id}: no row key in table "${table.signature}" (${section.slug}) row ${row.index + 1}: "${(row.cells[0] || {}).raw?.slice(0, 80)}"`);
          }
          if (set.rowFilter && !set.rowFilter(k.key)) continue;
          const id = `${set.section}:${spec.slug}:${k.key}`;
          if (seenInTable.has(id)) throw new Error(`Set ${set.id}: id collision ${id} inside table "${table.signature}" (${section.slug}) row ${row.index + 1}`);
          seenInTable.add(id);
          const prior = globalIds.get(id);
          if (prior && !(prior.setId === set.id && set.shared && prior.tableOrdinal !== table.ordinal)) {
            throw new Error(`Set ${set.id}: id collision ${id} (already used by ${prior.setId}, table #${prior.tableOrdinal + 1})`);
          }
          const label = set.labelPrefix ? `${set.labelPrefix} ${k.label}` : k.label;
          const baseAnchor = set.rowIdFrom ? anchorOf(`${set.section}:${set.rowIdFrom}:${k.key}`) : anchorOf(id);
          let item = items.get(id);
          let rowId = null;
          if (!item) {
            item = { id, label, anchor: baseAnchor };
            items.set(id, item);
            globalIds.set(id, { setId: set.id, tableOrdinal: table.ordinal });
            item.occurrences = 1;
            if (!set.rowIdFrom) rowId = baseAnchor;
          } else {
            item.occurrences++;
            if (label.length > item.label.length) item.label = label;
            if (!set.rowIdFrom) rowId = `${baseAnchor}-${item.occurrences}`;
          }
          if (set.clauses) {
            const cell = row.cells[set.clauses.column - 1];
            const parts = cell.text.split(set.clauses.separator).map((s) => s.trim()).filter(Boolean);
            parts.forEach((text, n) => clauses.push({ id: `${id}:${n + 1}`, gate: id, text }));
          }
          const ariaLabel = `Done: ${label}${set.ariaSuffix ? ` · ${set.ariaSuffix}` : ''}`;
          const entry = { setId: set.id, id, label, rowId, checkbox: !set.answers, checkboxColumn: set.checkboxColumn || 1, ariaLabel };
          if (!rowIndex.has(section.slug)) rowIndex.set(section.slug, new Map());
          const perTable = rowIndex.get(section.slug);
          if (!perTable.has(table.ordinal)) perTable.set(table.ordinal, new Map());
          const perRow = perTable.get(table.ordinal);
          if (!perRow.has(row.index)) perRow.set(row.index, []);
          perRow.get(row.index).push(entry);
        }
      }
    }
    if (items.size !== set.expectedCount) {
      throw new Error(`Set ${set.id}: expected ${set.expectedCount} items, found ${items.size} (${[...items.keys()].slice(0, 6).join(', ')}…)`);
    }
    if (set.clauses && clauses.length !== set.clauses.expectedTotal) {
      throw new Error(`Set ${set.id}: expected ${set.clauses.expectedTotal} clauses, found ${clauses.length}`);
    }
    const out = { id: set.id, label: set.label, short: set.short || set.label, page: `${set.section}.html`, items: [...items.values()].map(({ id, label, anchor }) => ({ id, label, anchor })) };
    if (set.clauses) out.clauses = clauses;
    if (set.answers) { out.kind = 'answers'; questions = out; } else sets.push(out);
    if (!setsBySection.has(section.slug)) setsBySection.set(section.slug, []);
    setsBySection.get(section.slug).push(out);
  }

  const manifest = { version: 1, sets };
  if (questions) manifest.questions = questions;
  return { manifest, rowIndex, setsBySection };
}

export function manifestSummary(manifest) {
  return manifest.sets.map((s) => s.items.length).join('/');
}
