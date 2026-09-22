// Append-only event log.
//
// Why events rather than current state: "passed: true" can be derived from a
// sequence of attempts, but a sequence can't be recovered from a boolean. Any
// later analysis of what people struggle with needs the order and the timing,
// and there is no way to add that retrospectively.
//
// Everything here stays in the browser for now. When an endpoint exists, the
// buffer is drained to it — nothing about the recording changes.
//
// Nothing identifying is stored. The participant id is a random value created
// on first visit and tied to no person, no email and no account.

const SCHEMA = 1;
const PID_KEY = "rcourse:v1:pid";
const ARM_KEY = "rcourse:v1:arm";
const BUF_KEY = "rcourse:v1:events";
const MAX = 3000;          // oldest events drop once the buffer is full

const store = {
  get(k, fallback = null) {
    try { const v = localStorage.getItem(k); return v === null ? fallback : v; }
    catch { return fallback; }
  },
  set(k, v) { try { localStorage.setItem(k, v); } catch { } },
};

function randomId() {
  if (crypto?.randomUUID) return crypto.randomUUID();
  const a = new Uint8Array(16);
  crypto.getRandomValues(a);
  return [...a].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Stable across visits, created on first load. Not linked to a person. */
export function participantId() {
  let id = store.get(PID_KEY);
  if (!id) { id = randomId(); store.set(PID_KEY, id); }
  return id;
}

/** One page load. Lets you separate "came back next week" from "kept scrolling". */
const sessionId = randomId();

/** Trial arm, if this install is ever randomised. Null until then — the field
 *  exists now so adding randomisation later needs no schema change. */
export function arm() { return store.get(ARM_KEY, null); }
export function setArm(a) { store.set(ARM_KEY, a); }

let buffer = [];
try { buffer = JSON.parse(store.get(BUF_KEY, "[]")); } catch { buffer = []; }

function flushToStorage() {
  if (buffer.length > MAX) buffer = buffer.slice(-MAX);
  store.set(BUF_KEY, JSON.stringify(buffer));
}

/**
 * Record one event.
 * @param {string} ev   attempt | reveal | run | view | chapter_open | heartbeat
 * @param {object} data event-specific fields (ex, hash, ch, n, ok, choice, ms)
 */
export function log(ev, data = {}) {
  buffer.push({
    v: SCHEMA,
    pid: participantId(),
    sid: sessionId,
    arm: arm(),
    ts: new Date().toISOString(),
    ev,
    ...data,
  });
  flushToStorage();
}

export function all() { return [...buffer]; }
export function count() { return buffer.length; }

/** Hand the buffer over for upload. Only clears if the caller confirms. */
export function drain() {
  const batch = [...buffer];
  return {
    batch,
    ack() { buffer = buffer.filter((e) => !batch.includes(e)); flushToStorage(); },
  };
}

export function clear() { buffer = []; flushToStorage(); }

/** Save the log to a file. For your own inspection while building. */
export function download() {
  const blob = new Blob([JSON.stringify(buffer, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `events-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

/* ------------------------------------------------------- active time ---- */
// Elapsed time is nearly useless for a self-paced course — a tab can sit open
// over lunch. This counts only time when the tab is visible and something has
// happened recently.

const TICK = 15000;        // heartbeat interval
const IDLE_AFTER = 120000; // no interaction for this long stops the clock

let lastInteraction = Date.now();
let activeMs = 0;
let currentChapter = null;

for (const ev of ["keydown", "pointerdown", "scroll", "wheel"]) {
  addEventListener(ev, () => { lastInteraction = Date.now(); }, { passive: true });
}

export function watchChapter(ch) { currentChapter = ch; }

setInterval(() => {
  if (document.visibilityState !== "visible") return;
  if (Date.now() - lastInteraction > IDLE_AFTER) return;
  activeMs += TICK;
  log("heartbeat", { ch: currentChapter, ms: TICK });
}, TICK);

export function activeTime() { return activeMs; }
