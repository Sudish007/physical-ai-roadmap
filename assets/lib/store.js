// Versioned localStorage keys and guarded access. Pure (no DOM access): the storage object is
// resolved lazily from globalThis.localStorage and can be replaced with useStorage() for node:test.
//
// The theme key holds a RAW string ('light' | 'dark' | 'system') because the inline bootstrap in
// src/build/templates.js compares localStorage.getItem(...) with those literals before any module runs.
// Every other key holds JSON written by set() and read back with get(key, shapeCheck).

export const KEYS = Object.freeze({
  theme: 'physical-ai-roadmap.v1.theme',
  tracker: 'physical-ai-roadmap.v1.tracker',
  plan: 'physical-ai-roadmap.v1.plan',
  triage: 'physical-ai-roadmap.v1.triage',
  readpos: 'physical-ai-roadmap.v1.readpos',
});

let backend = null;

/** Replace the storage object (tests pass a Map-backed fake; `null` restores globalThis.localStorage). */
export function useStorage(storage) {
  backend = storage;
}

function storage() {
  if (backend) return backend;
  try {
    return globalThis.localStorage || null;
  } catch {
    return null; // storage access denied (private mode, sandboxed frame)
  }
}

/** Raw string under `key`, or null when absent or unreadable. */
export function getRaw(key) {
  try {
    const s = storage();
    return s ? s.getItem(key) : null;
  } catch {
    return null;
  }
}

/** Store a raw string. Returns false when storage is unavailable or full. */
export function setRaw(key, value) {
  try {
    const s = storage();
    if (!s) return false;
    s.setItem(key, String(value));
    return true;
  } catch {
    return false;
  }
}

/**
 * Parse the JSON stored under `key`. Returns null when the key is absent, the JSON is corrupt,
 * or `shapeCheck(value)` (when given) returns false.
 */
export function get(key, shapeCheck) {
  const text = getRaw(key);
  if (text === null || text === undefined) return null;
  let value;
  try {
    value = JSON.parse(text);
  } catch {
    return null;
  }
  if (typeof shapeCheck === 'function' && !shapeCheck(value)) return null;
  return value;
}

/** Store `value` as JSON. Returns false when storage is unavailable, full, or the value is not serialisable. */
export function set(key, value) {
  let text;
  try {
    text = JSON.stringify(value);
  } catch {
    return false;
  }
  if (text === undefined) return false;
  return setRaw(key, text);
}

/** Remove `key`. Returns false when storage is unavailable. */
export function remove(key) {
  try {
    const s = storage();
    if (!s) return false;
    s.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

/** True when `value` is a plain object (not null, not an array). */
export function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// ---------------------------------------------------------------------------
// Export / Import (design "Tracker": version 1 bundles; imported entries overwrite, nothing else is touched)

export const EXPORT_VERSION = 1;
const DATA_KEYS = ['tracker', 'plan', 'triage'];

/** Shape check for the tracker key: { items: { id: { done, at } } }. */
export function trackerShape(value) {
  return isPlainObject(value) && isPlainObject(value.items);
}

/**
 * Validate a parsed import file. Requires `version === 1` and object-typed tracker / plan / triage
 * (each may be missing). Returns { ok: true, bundle } or { ok: false, error }.
 */
export function validateImport(obj) {
  if (!isPlainObject(obj)) return { ok: false, error: 'The file is not a JSON object.' };
  if (obj.version !== EXPORT_VERSION) return { ok: false, error: `Unsupported export version ${JSON.stringify(obj.version === undefined ? null : obj.version)}; this site reads version ${EXPORT_VERSION}.` };
  for (const k of DATA_KEYS) {
    if (obj[k] !== undefined && obj[k] !== null && !isPlainObject(obj[k])) return { ok: false, error: `"${k}" must be an object.` };
  }
  if (obj.tracker && obj.tracker.items !== undefined && !isPlainObject(obj.tracker.items)) return { ok: false, error: '"tracker.items" must be an object.' };
  for (const k of ['weeklyHours', 'answers']) {
    if (obj.plan && obj.plan[k] !== undefined && obj.plan[k] !== null && !isPlainObject(obj.plan[k])) return { ok: false, error: `"plan.${k}" must be an object.` };
  }
  return { ok: true, bundle: { tracker: obj.tracker || null, plan: obj.plan || null, triage: obj.triage || null } };
}

/**
 * Merge an imported bundle into the current data. Imported entries (tracker item ids, triage item ids,
 * plan fields, plan.weeklyHours weeks, plan.answers ids) overwrite the existing ones; everything else stays.
 * Both arguments are { tracker, plan, triage } with nullable members. Pure.
 */
export function mergeImport(current, imported) {
  const cur = isPlainObject(current) ? current : {};
  const imp = isPlainObject(imported) ? imported : {};
  const items = { ...(trackerShape(cur.tracker) ? cur.tracker.items : {}), ...(trackerShape(imp.tracker) ? imp.tracker.items : {}) };
  const triage = { ...(isPlainObject(cur.triage) ? cur.triage : {}), ...(isPlainObject(imp.triage) ? imp.triage : {}) };
  const curPlan = isPlainObject(cur.plan) ? cur.plan : {};
  const impPlan = isPlainObject(imp.plan) ? imp.plan : {};
  const plan = { ...curPlan };
  for (const [k, v] of Object.entries(impPlan)) {
    if (k === 'weeklyHours' || k === 'answers') continue;
    plan[k] = v;
  }
  for (const k of ['weeklyHours', 'answers']) {
    if (impPlan[k] !== undefined || curPlan[k] !== undefined) {
      plan[k] = { ...(isPlainObject(curPlan[k]) ? curPlan[k] : {}), ...(isPlainObject(impPlan[k]) ? impPlan[k] : {}) };
    }
  }
  return { tracker: { items }, plan, triage };
}

/** Number of entries an import bundle carries (tracker items + plan fields/weeks/answers + triage items). */
export function importedEntryCount(bundle) {
  const b = isPlainObject(bundle) ? bundle : {};
  let n = 0;
  if (trackerShape(b.tracker)) n += Object.keys(b.tracker.items).length;
  if (isPlainObject(b.triage)) n += Object.keys(b.triage).length;
  if (isPlainObject(b.plan)) {
    for (const [k, v] of Object.entries(b.plan)) {
      if ((k === 'weeklyHours' || k === 'answers') && isPlainObject(v)) n += Object.keys(v).length;
      else if (v !== undefined) n++;
    }
  }
  return n;
}

/** The current data as a version-1 bundle: { version, exportedAt, tracker, plan, triage }. */
export function exportBundle(now = new Date()) {
  return {
    version: EXPORT_VERSION,
    exportedAt: now.toISOString(),
    tracker: get(KEYS.tracker, trackerShape) || { items: {} },
    plan: get(KEYS.plan, isPlainObject) || {},
    triage: get(KEYS.triage, isPlainObject) || {},
  };
}
