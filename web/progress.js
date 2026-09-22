// Per-browser progress. Nothing here leaves the device — analytics is a
// separate layer that will read the same events.
//
// localStorage can be unavailable (private browsing, blocked cookies), so
// every access is guarded and the page has to work when it comes back empty.

const KEY = "rcourse:v1:progress";
let cache = null;

function read() {
  if (cache) return cache;
  try {
    cache = JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    cache = {};
  }
  return cache;
}

function write() {
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    // Out of space or storage disabled. The session still works; it just
    // won't be remembered next time.
  }
}

/** What we know about one exercise. Always returns an object. */
export function get(id) {
  return read()[id] ?? { passed: false, attempts: 0, revealed: false };
}

/** Record an attempt. Merges into whatever is already stored. */
export function record(id, patch) {
  const now = read();
  const prev = now[id] ?? { passed: false, attempts: 0, revealed: false };
  now[id] = { ...prev, ...patch, updated: Date.now() };
  write();
  document.dispatchEvent(new CustomEvent("progress:changed", {
    detail: { id, ...now[id] },
  }));
  return now[id];
}

/** Counts for a set of exercise ids. */
export function summary(ids) {
  const p = read();
  let done = 0, revealed = 0;
  for (const id of ids) {
    const e = p[id];
    if (e?.passed) done++;
    if (e?.revealed) revealed++;
  }
  return { done, revealed, total: ids.length };
}

/** Wipe everything. Offered in the UI so a student can start over. */
export function reset() {
  cache = {};
  try { localStorage.removeItem(KEY); } catch { }
  document.dispatchEvent(new CustomEvent("progress:changed", { detail: null }));
}

export function isStorageAvailable() {
  try {
    const k = "rcourse:test";
    localStorage.setItem(k, "1");
    localStorage.removeItem(k);
    return true;
  } catch {
    return false;
  }
}
