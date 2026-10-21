// Reachability sources (the §13.6 Indian official pages): GET, record the status only, produce no items.
// `ok` on HTTP 200, `failed` otherwise (the HTTP client already throws for ≥400, redirects are followed).

/** @param {{ status: number }} res */
export function reachabilityResult(res) {
  const status = Number(res && res.status);
  return { ok: status === 200, httpStatus: Number.isFinite(status) ? status : null, items: [] };
}
