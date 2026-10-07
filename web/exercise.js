// Rendering and grading for all four response kinds. Shared by test.html
// (one exercise at a time) and chapter.html (inline in the prose), so both
// always behave identically.

import { WebR } from "https://webr.r-wasm.org/latest/webr.mjs";
import * as progress from "./progress.js";
import * as events from "./events.js";
import * as reference from "./reference.js";

/* ------------------------------------------------------------ markdown --- */

export function esc(s) {
  return String(s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
}

// Small on purpose. The real site pre-renders markdown at build time; this is
// here so you can see your prose while writing it.
// Function names get the same colour everywhere: editors, the Functions
// panel, and inline code in prose and feedback. A name followed by "(" is a
// call, so that's what gets marked.
const colourCalls = (html) =>
  html.replace(/(^|[^\w.])([A-Za-z.][A-Za-z0-9._]*)(?=\()/g, '$1<span class="fncall">$2</span>');

export function md(src = "") {
  const blocks = [];
  const langs = [];
  let s = esc(src).replace(/```(rtry|r)?\n([\s\S]*?)```/g, (_, lang, c) => {
    blocks.push(c.replace(/\n$/, ""));
    langs.push(lang || "");
    return `\u0000${blocks.length - 1}\u0000`;
  });

  s = s.replace(/`([^`\n]+)`/g, (_, c) => `<code>${colourCalls(c)}</code>`)
       .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
       .replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>");

  const html = s.split(/\n\n+/).map((p) => {
    p = p.trim();
    if (!p) return "";
    if (/^\u0000\d+\u0000$/.test(p)) return p;
    if (/^### /.test(p)) return `<h3>${p.slice(4)}</h3>`;
    if (/^## /.test(p)) return `<h2>${p.slice(3)}</h2>`;
    if (/^# /.test(p)) return `<h1>${p.slice(2)}</h1>`;
    // A list: every line starts a bullet or continues the one above it. An
    // indented line is a continuation, so a long bullet can wrap.
    const lines = p.split("\n");
    // Numbered list, same rules: "1. ", "2. " … with indented continuations.
    if (/^\d+\. /.test(lines[0].trim()) &&
        lines.every((l) => /^\d+\. /.test(l.trim()) || /^\s+\S/.test(l))) {
      const items = [];
      for (const l of lines) {
        if (/^\d+\. /.test(l.trim())) items.push(l.trim().replace(/^\d+\. /, ""));
        else items[items.length - 1] += " " + l.trim();
      }
      return `<ol>${items.map((i) => `<li>${i}</li>`).join("")}</ol>`;
    }
    if (/^[-*] /.test(lines[0].trim()) &&
        lines.every((l) => /^[-*] /.test(l.trim()) || /^\s+\S/.test(l))) {
      const items = [];
      for (const l of lines) {
        if (/^[-*] /.test(l.trim())) items.push(l.trim().slice(2));
        else items[items.length - 1] += " " + l.trim();
      }
      return `<ul>${items.map((i) => `<li>${i}</li>`).join("")}</ul>`;
    }
    return `<p>${p.replace(/\n/g, " ")}</p>`;
  }).join("");

  return html.replace(/\u0000(\d+)\u0000/g, (_, i) =>
    `<pre${langs[i] === "rtry" ? ' class="runnable try"' : langs[i] === "r" ? ' class="runnable"' : ""}><code>${langs[i] ? colourCalls(blocks[i]) : blocks[i]}</code></pre>`);
}

const inline = (s) => md(s).replace(/^<p>|<\/p>$/g, "");

/* ------------------------------------------------------------------ R ---- */

let webR = null, ready = null;
const warmed = new Set();
const installed = new Set();
let onStatus = () => {};

export function setStatusHandler(fn) { onStatus = fn; }

const envName = (id) => `.setup_${id.replace(/-/g, "_")}`;

// Run code the way the R console does: every top-level line that produces a
// visible value prints it, not only the last. Evaluating the whole block as one
// expression hid the output of every line but the final one, which taught a
// false picture of how R behaves. Grading still evaluates as one expression,
// because it needs the last value as .result.
// Run gets its own workspace, sitting on top of the exercise's data. Anything
// a student creates while experimenting lives there — it persists between
// Runs the way the RStudio console does — but Check never sees it, and always
// grades from the original data. Before this, a variable made with Run could
// quietly change what Check found.
async function runEnvFor(w, id) {
  const name = `.run_${id.replace(/-/g, "_")}`;
  await w.evalRVoid(`if (!exists("${name}", envir = globalenv(), inherits = FALSE))
    assign("${name}", new.env(parent = ${envName(id)}), envir = globalenv())`);
  return name;
}

// Run prints R's output as the console would. With captureConditions off,
// webR writes errors to stderr as "Error: ..." rather than throwing, so that's
// how Run recognises one. Warnings also go to stderr but aren't errors.
const hadError = (cap) => cap.output.some((o) => o.type === "stderr" && /^Error/.test(o.data));

// Errors print the way RStudio prints them — "Error in <call> : <message>" —
// so what students learn to read here is what they'll see there. Without
// this, webR showed only the message, dropping the "where". Syntax errors
// keep R's extra line with a ^ under the spot where it got stuck.
const COURSE_RUN = `.course_run <- function(src, env) {
  tryCatch(
    invisible(withAutoprint(parse(text = src), evaluated = TRUE, local = env, echo = FALSE)),
    error = function(e) {
      cl <- conditionCall(e)
      where <- if (is.null(cl)) "" else paste(deparse(cl, width.cutoff = 500L), collapse = " ")
      plumbing <- where == "" || any(startsWith(where, c("eval(", "withAutoprint(", "source(", "parse(", "withVisible(")))
      if (plumbing) message("Error: ", conditionMessage(e))
      else message("Error in ", where, " : ", conditionMessage(e))
    })
}`;

const consoleEval = (env) => `.course_run(.submitted, ${env})`;

// R boots once per page and stays warm. Each exercise gets its own setup
// environment, so switching between them never re-runs library() or rebuilds
// data that is already there.
export async function ensureR(ex) {
  if (!webR) {
    onStatus("starting R…");
    webR = new WebR();
    // warn = 1 prints warnings immediately to stderr, where Run can show them.
    // Otherwise R holds them until the end and they never reach the page —
    // and "it ran but warned" is exactly the kind of failure this course is
    // about.
    ready = webR.init()
      .then(() => webR.evalRVoid("options(warn = 1)"))
      .then(() => webR.evalRVoid(COURSE_RUN));
  }
  await ready;

  for (const p of ex.packages ?? []) {
    if (!installed.has(p)) {
      onStatus(`installing ${p}…`);
      await webR.installPackages([p]);
      installed.add(p);
    }
  }

  if (!warmed.has(ex.id)) {
    await webR.objs.globalEnv.bind(".setup_src", ex.setup ?? "");
    await webR.evalRVoid(`${envName(ex.id)} <- new.env(parent = globalenv())
                          eval(parse(text = .setup_src), envir = ${envName(ex.id)})`);
    warmed.add(ex.id);
  }
  onStatus("");
  return webR;
}

const deepEq = (a, b) =>
  Array.isArray(a) && Array.isArray(b) && a.length === b.length &&
  a.every((v, i) => (typeof v === "number" ? Math.abs(v - b[i]) < 1e-9 : v === b[i]));

/* -------------------------------------------------------------- render --- */

let uid = 0;

// The grader's working (which checks passed, what each returned) is for you
// while writing exercises, not for learners. Shown in the harness, or with
// ?dev in the address. R's own error messages are always shown.
const DEV = new URLSearchParams(location.search).has("dev") ||
            location.pathname.endsWith("test.html");

// CodeMirror's R mode only knows a short list of language builtins, so
// round(), log() and anything from a package stay uncoloured. This overlay
// colours any name directly followed by "(" — which is what a call looks
// like — while skipping strings and comments so their contents are left
// alone.
const callOverlay = {
  token(stream) {
    if (stream.match(/^#.*/)) return null;
    if (stream.match(/^"(?:[^"\\]|\\.)*"?/)) return null;
    if (stream.match(/^'(?:[^'\\]|\\.)*'?/)) return null;
    if (stream.match(/^[A-Za-z.][A-Za-z0-9._]*(?=\s*\()/)) return "callname";
    if (stream.match(/^[A-Za-z.][A-Za-z0-9._]*/)) return null;
    stream.next();
    return null;
  },
};

/** Wrap a textarea in CodeMirror. Returns a getter; falls back to the
 *  textarea itself if the library didn't load. */
export function makeEditor(ta, onRun) {
  if (!window.CodeMirror) return () => ta.value;
  const cm = window.CodeMirror.fromTextArea(ta, {
    mode: "r",
    lineNumbers: true,
    matchBrackets: true,
    indentUnit: 2,
    viewportMargin: Infinity,
    extraKeys: {
      "Cmd-Enter": () => onRun?.(),
      "Ctrl-Enter": () => onRun?.(),
      Tab: (c) => c.execCommand("insertSoftTab"),
    },
  });
  cm.addOverlay(callOverlay);
  return () => cm.getValue();
}

/** Turn a prose code block into something the reader can run and edit.
 *  No checking, no feedback — it's a scratchpad, which is what the prose
 *  promises when it says "below is a box you can type in". */
export function makeScratch(pre, chapter, owner = null) {
  const code = pre.textContent.replace(/\n$/, "");
  // Code in an exercise's prompt runs against that exercise's data, in its own
  // Run workspace, so `patients` exists there. Prose code runs in a shared
  // scratch space for the chapter.
  const ex = owner ?? { id: `scratch_${chapter}`, setup: "", packages: [] };
  const host = document.createElement("div");
  host.className = "scratch";
  host.innerHTML = `<textarea spellcheck="false">${esc(code)}</textarea>
    <div class="row"><button class="act run">Run</button><span class="stat"></span></div>
    <pre class="out"></pre>`;
  pre.replaceWith(host);

  const ta = host.querySelector("textarea");
  const out = host.querySelector(".out");
  const stat = host.querySelector(".stat");
  const getCode = makeEditor(ta, () => run());

  async function run() {
    stat.textContent = "running…";
    const w = await ensureR(ex);
    const shelter = await new w.Shelter();
    try {
      await w.objs.globalEnv.bind(".submitted", getCode());
      const cap = await shelter.captureR(consoleEval(owner ? await runEnvFor(w, ex.id) : envName(ex.id)),
        { withAutoprint: false, captureStreams: true, captureConditions: false });
      out.textContent = cap.output.map((o) => o.data).join("\n") || "(no output)";
      out.classList.toggle("err", hadError(cap));
    } catch (e) {
      out.textContent = String(e.message ?? e);
      out.classList.add("err");
    } finally { await shelter.purge(); stat.textContent = ""; }
  }
  host.querySelector(".run").onclick = () => { events.log("scratch_run", { ch: chapter }); run(); };
}

/** Render one exercise into `host`. Returns nothing; the element owns its state. */
/** @param {{n:number, of:number}} [position] shown instead of the raw id.
 *  Exercise ids are stable slugs used in analytics and must never be
 *  renumbered to match reading order, so the chapter shows position instead. */
export function renderExercise(ex, host, position) {
  const n = ++uid;
  const r = ex.response;
  const prior = progress.get(ex.id);

  host.classList.add("exercise");
  host.id = `ex-${ex.id}`;
  if (prior.passed) host.classList.add("done");
  host.innerHTML = `
    <div class="exhead">
      <span class="extitle">${esc(ex.title ?? ex.id)}</span>
      <span class="exid">${position ? `${position.n} of ${position.of}` : ex.id}</span>
      <span class="exdone" title="you finished this earlier">done</span>
    </div>
    <div class="prompt">${md(ex.prompt)}</div>
    <div class="body" id="b${n}"></div>
    <div class="fb" id="f${n}"></div>
    <div class="exfoot">
      ${ex.hint ? `<details class="hint"><summary>Hint</summary>${md(ex.hint)}</details>` : ""}
      <button class="linky reveal">Show me the answer</button>
    </div>
    <div class="revealed" id="r${n}"></div>
  `;
  const body = host.querySelector(`#b${n}`);
  const fbox = host.querySelector(`#f${n}`);
  const revBox = host.querySelector(`#r${n}`);

  const show = (pass, html, detail) => {
    // Two wrong code answers in a row usually means a missing piece of
    // knowledge rather than a slip, so point at where to find it.
    const nudge = !pass && r.kind === "r-code" && state.fails >= 2 && reference.isMounted();
    // A wrong prediction is the best moment to check with R itself — if the
    // prompt has code that runs, say so.
    const tryIt = !pass && r.kind === "choice" && host.querySelector(".prompt .scratch");
    fbox.innerHTML = `<div class="verdictbox ${pass ? "pass" : "fail"}">
      <div class="verdict">${pass ? "Correct" : "Not yet"}</div>${html}
      ${nudge ? `<p class="nudge">Stuck? The <button class="linky opennfn">Functions</button>
        panel has the usage line and an example for every function you've met.</p>` : ""}
      ${tryIt ? `<p class="nudge">Not sure? The code above runs. Add a line, press Run, and
        see what R actually does.</p>` : ""}
      ${detail ? `<pre class="detail">${esc(detail)}</pre>` : ""}</div>`;
    fbox.querySelector(".opennfn")?.addEventListener("click", () => reference.openWith(""));
  };

  // Asking for the answer is always allowed — locking it just makes people
  // skip the exercise — but it is recorded, because "how often was this
  // revealed" is the clearest signal that an exercise is too hard or unclear.
  const reveal = () => {
    events.log("reveal", { ex: ex.id, hash: ex.hash, n: state.attempts });
    progress.record(ex.id, { revealed: true, attempts: state.attempts });
    host.querySelector(".reveal").remove();
    revBox.innerHTML = `<div class="revealbox"><div class="verdict">The answer</div>
      ${revealHtml(ex)}</div>`;
  };
  host.querySelector(".reveal").onclick = reveal;

  const state = { attempts: 0, fails: 0, seen: false };

  // Time from first sight to first attempt is one of the better signals for
  // "this one is confusing", so record when it comes into view.
  if (window.IntersectionObserver) {
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting && !state.seen) {
          state.seen = true;
          events.log("view", { ex: ex.id, hash: ex.hash });
          io.disconnect();
        }
      }
    }, { threshold: 0.4 });
    io.observe(host);
  }
  const done = (passed) => {
    state.fails = passed ? 0 : state.fails + 1;
    progress.record(ex.id, {
      passed: passed || progress.get(ex.id).passed,
      attempts: state.attempts,
    });
    if (passed) host.classList.add("done");
  };

  ({ choice: doChoice, span: doSpan, table: doTable, prose: doProse, "r-code": doCode }[r.kind])(
    ex, body, show, state, done
  );
}

function revealHtml(ex) {
  const r = ex.response;
  const correct = r.options?.find((o) => o.correct);

  if (r.kind === "choice") {
    return inline(correct.text) + md(correct.feedback);
  }
  if (r.kind === "span") {
    // The answer text lives in parts, not in the option, so show the whole
    // snippet with the right piece marked.
    const code = r.parts.map((p) =>
      p.t === "span" && p.id === correct.id
        ? `<span class="sel picked">${esc(p.v)}</span>`
        : esc(p.v)
    ).join("");
    return `<div class="spancode">${code}</div>` + md(correct.feedback);
  }
  if (r.kind === "table") {
    return `<p>${tableLabel(r, correct.id)}</p>` + md(correct.feedback);
  }
  if (r.kind === "r-code") {
    return `<pre><code>${esc(r.solution.code.replace(/\n$/, ""))}</code></pre>${md(r.solution.why)}`;
  }
  return md("```\n" + r.exemplar + "\n```") +
    `<p>Check yours against these:</p><ul>${r.rubric.map((c) => `<li>${esc(c.criterion)}</li>`).join("")}</ul>`;
}

function review(opts, chosen) {
  return opts.map((o) => {
    const tag = o.correct ? "correct" : "incorrect";
    const mine = o.id === chosen.id;
    return `<div class="rev ${tag}${mine ? " you" : ""}">
      <div class="revhead">${tag}${mine ? " — your answer" : ""}</div>
      ${o.text ? (o.text.startsWith("the <code>") || o.text.startsWith("row ") ? `<p>${o.text}</p>` : inline(o.text)) : ""}${md(o.feedback)}</div>`;
  }).join("");
}

function doChoice(ex, body, show, state, done) {
  // Shuffle, but keep catch-alls like "Neither" at the end where they read
  // naturally.
  const shuffled = ex.response.shuffle ? [...ex.response.options].sort(() => Math.random() - 0.5)
                                       : [...ex.response.options];
  const opts = [...shuffled.filter((o) => !o.last), ...shuffled.filter((o) => o.last)];
  const nm = `q${++uid}`;
  body.innerHTML = opts.map((o) =>
    `<label class="opt"><input type="radio" name="${nm}" value="${o.id}">${inline(o.text)}</label>`
  ).join("") + `<div class="row"><button class="act">Check</button></div>`;

  body.querySelector("button").onclick = (e) => {
    const picked = body.querySelector("input:checked");
    if (!picked) return;
    state.attempts++;
    const chosen = ex.response.options.find((x) => x.id === picked.value);
    // Wrong answer shows only their own feedback, so they go back and think.
    // The full review is what they get for arriving at the right one.
    events.log("attempt", { ex: ex.id, hash: ex.hash, n: state.attempts,
                            ok: !!chosen.correct, choice: chosen.id });
    if (!chosen.correct) { done(false); return show(false, md(chosen.feedback)); }
    body.querySelectorAll("input").forEach((i) => (i.disabled = true));
    e.target.disabled = true;
    done(true);
    show(true, review(opts, chosen));
  };
}

function doSpan(ex, body, show, state, done) {
  let picked = null;
  const runnable = !!ex.response.runnable;
  body.innerHTML =
    `<div class="spancode">${ex.response.parts.map((p) =>
      p.t === "span" ? `<span class="sel" data-id="${p.id}">${esc(p.v)}</span>` : esc(p.v)).join("")}</div>
     <div class="row">
       ${runnable ? `<button class="act run">Run</button>` : ""}
       <button class="act check" disabled>Check</button>
       <span class="stat"></span>
     </div>
     ${runnable ? `<pre class="out"></pre>` : ""}`;
  const btn = body.querySelector(".check");

  if (runnable) {
    const out = body.querySelector(".out"), stat = body.querySelector(".stat");
    const code = ex.response.parts.map((p) => p.v).join("");
    body.querySelector(".run").onclick = async () => {
      stat.textContent = "running…";
      const w = await ensureR(ex);
      const shelter = await new w.Shelter();
      try {
        await w.objs.globalEnv.bind(".submitted", code);
        const cap = await shelter.captureR(consoleEval(await runEnvFor(w, ex.id)),
          { withAutoprint: false, captureStreams: true, captureConditions: false });
        out.textContent = cap.output.map((o) => o.data).join("\n") || "(no output)";
        out.classList.toggle("err", hadError(cap));
      } catch (e) {
        out.textContent = String(e.message ?? e); out.classList.add("err");
      } finally { await shelter.purge(); stat.textContent = ""; }
    };
  }
  body.querySelectorAll(".sel").forEach((s) => {
    s.onclick = () => {
      body.querySelectorAll(".sel").forEach((x) => x.classList.remove("picked"));
      s.classList.add("picked");
      picked = s.dataset.id;
      btn.disabled = false;
    };
  });
  btn.onclick = () => {
    state.attempts++;
    const chosen = ex.response.options.find((x) => x.id === picked);
    events.log("attempt", { ex: ex.id, hash: ex.hash, n: state.attempts,
                            ok: !!chosen.correct, choice: chosen.id });
    if (!chosen.correct) { done(false); return show(false, md(chosen.feedback)); }
    btn.disabled = true;
    body.querySelectorAll(".sel").forEach((x) => (x.style.pointerEvents = "none"));
    done(true);
    show(true, review(ex.response.options, chosen));
  };
}

/* --------------------------------------------------------------- table --- */
// A data frame the learner can click, laid out like RStudio's View(): row
// numbers down the side, NA in italics, numbers right-aligned, no types
// shown. That last part matters — the grid hides exactly what str() reveals.

function tableLabel(r, id) {
  if (r.select === "column") return `the <code>${esc(id)}</code> column`;
  if (r.select === "row") return `row ${esc(id.slice(1))}`;
  const [row, ...col] = id.split("-");
  return `row ${esc(row.slice(1))}, <code>${esc(col.join("-"))}</code>`;
}

function doTable(ex, body, show, state, done) {
  const r = ex.response;
  const attr = { column: "col", row: "row", cell: "cell" }[r.select];
  const cellText = (v) =>
    v === null ? `<span class="tna">NA</span>`
    : v === true ? "TRUE" : v === false ? "FALSE" : esc(String(v));

  body.innerHTML = `
    <div class="dfwrap"><table class="df df-${r.select}">
      <thead><tr><th class="rn"></th>${r.columns.map((c) =>
        `<th data-col="${esc(c)}">${esc(c)}</th>`).join("")}</tr></thead>
      <tbody>${r.rows.map((row, i) => `
        <tr><th class="rn" data-row="r${i + 1}">${i + 1}</th>${row.map((v, j) =>
          `<td class="${typeof v === "number" ? "num" : ""}" data-col="${esc(r.columns[j])}"
               data-row="r${i + 1}" data-cell="r${i + 1}-${esc(r.columns[j])}">${cellText(v)}</td>`
        ).join("")}</tr>`).join("")}
      </tbody>
    </table></div>
    <div class="row"><button class="act check" disabled>Check</button></div>`;

  const table = body.querySelector("table");
  const btn = body.querySelector(".check");
  let picked = null;
  const matching = (id) => table.querySelectorAll(`[data-${attr}="${CSS.escape(id)}"]`);
  const targetOf = (el) => el?.closest(`[data-${attr}]`)?.dataset[attr];

  table.addEventListener("mouseover", (e) => {
    table.querySelectorAll(".hot").forEach((x) => x.classList.remove("hot"));
    const id = targetOf(e.target);
    if (id) matching(id).forEach((x) => x.classList.add("hot"));
  });
  table.addEventListener("mouseleave", () =>
    table.querySelectorAll(".hot").forEach((x) => x.classList.remove("hot")));
  table.addEventListener("click", (e) => {
    if (btn.dataset.locked) return;
    const id = targetOf(e.target);
    if (!id) return;
    table.querySelectorAll(".picked").forEach((x) => x.classList.remove("picked"));
    matching(id).forEach((x) => x.classList.add("picked"));
    picked = id;
    btn.disabled = false;
  });

  btn.onclick = () => {
    state.attempts++;
    const chosen = r.options.find((o) => o.id === picked);
    events.log("attempt", { ex: ex.id, hash: ex.hash, n: state.attempts,
                            ok: !!chosen?.correct, choice: picked });
    if (!chosen) { done(false); return show(false, md(r.other)); }
    if (!chosen.correct) { done(false); return show(false, md(chosen.feedback)); }
    btn.disabled = true;
    btn.dataset.locked = "1";
    done(true);
    show(true, review(r.options.map((o) => ({ ...o, text: tableLabel(r, o.id) })), chosen));
  };
}

async function doProse(ex, body, show, state, done) {
  // The warning lives in the placeholder as well as above the box. A notice
  // repeated above twenty consecutive exercises becomes wallpaper; one inside
  // the field is read at the moment of typing, which is when it matters.
  body.innerHTML = `<p class="nophi">Sent to a server to be checked \u2014 nothing identifiable.</p>
    <textarea placeholder="Your answer \u2014 no patient details"></textarea>
    <div class="row"><button class="act">Check</button><span class="stat"></span></div>`;
  const ta = body.querySelector("textarea"), btn = body.querySelector("button");
  const stat = body.querySelector(".stat");
  btn.onclick = async () => {
    const answer = ta.value.trim();
    if (!answer) return;
    btn.disabled = true; stat.textContent = "checking…";
    state.attempts++;
    const fails = [];
    try {
      // Every criterion is judged at once rather than one after another, so a
      // five-criterion answer takes as long as a one-criterion answer.
      const verdicts = await Promise.all(ex.response.rubric.map(async (c) => {
        const res = await fetch("/.netlify/functions/judge", {
          method: "POST", headers: { "content-type": "application/json" },
          body: JSON.stringify({ answer, criterion: c.criterion, exemplar: ex.response.exemplar }),
        });
        if (!res.ok) throw new Error(`judge returned ${res.status}`);
        return (await res.json()).pass;
      }));
      ex.response.rubric.forEach((c, i) => { if (!verdicts[i]) fails.push(c); });
      events.log("attempt", { ex: ex.id, hash: ex.hash, n: state.attempts,
                              ok: !fails.length, failed: fails.map((c) => c.id) });
      done(!fails.length);
      show(!fails.length, fails.length ? fails.map((c) => md(c.on_fail)).join("")
                                       : `<p>Every criterion met. Here's one good answer, for comparison:</p>
                                          <div class="exemplar">${md(ex.response.exemplar)}</div>`);
    } catch (e) {
      // Same fallback the live site uses when the judge can't be reached.
      show(false,
        `<p><strong>Check it yourself — the judge isn't available here.</strong></p>
         <p>Does your answer do each of these?</p>
         <ul>${ex.response.rubric.map((c) => `<li>${esc(c.criterion)}</li>`).join("")}</ul>
         <p>A good answer:</p>${md("```\n" + ex.response.exemplar + "\n```")}`,
        `${e.message ?? e} — the judge only runs on the deployed site`);
    }
    stat.textContent = ""; btn.disabled = false;
  };
}

async function doCode(ex, body, show, state, done) {
  // Code exercises need a keyboard. On a phone, say so rather than offering
  // an editor nobody can reasonably use.
  if (window.matchMedia("(max-width: 700px)").matches) {
    body.innerHTML = `<p class="needlaptop">This one needs a keyboard — come back
      to it on a laptop. The reading and the multiple-choice questions work fine
      here.</p>`;
    return;
  }
  body.innerHTML = `<textarea spellcheck="false">${esc(ex.response.starter.replace(/\n$/, ""))}</textarea>
    <div class="row"><button class="act run">Run</button><button class="act check">Check</button>
    <span class="stat"></span></div><pre class="out"></pre>`;
  const ta = body.querySelector("textarea");
  const out = body.querySelector(".out");
  const stat = body.querySelector(".stat");
  const env = envName(ex.id);

  // CodeMirror turns the plain box into a real editor: R syntax colouring,
  // line numbers, bracket matching. If the library didn't load, the textarea
  // still works — the exercise degrades rather than breaking.
  const getCode = makeEditor(ta, () => run());

  async function run() {
    stat.textContent = "running…";
    const w = await ensureR(ex);
    const shelter = await new w.Shelter();
    try {
      await w.objs.globalEnv.bind(".submitted", getCode());
      const cap = await shelter.captureR(consoleEval(await runEnvFor(w, ex.id)),
        { withAutoprint: false, captureStreams: true, captureConditions: false });
      out.textContent = cap.output.map((o) => o.data).join("\n") || "(no output)";
      out.classList.toggle("err", hadError(cap));
    } catch (e) {
      out.textContent = String(e.message ?? e);
      out.classList.add("err");
    } finally { await shelter.purge(); stat.textContent = ""; }
  }

  async function check() {
    stat.textContent = "checking…";
    state.attempts++;
    const code = getCode();
    const w = await ensureR(ex);
    const r = ex.response;
    const shelter = await new w.Shelter();
    try {
      await w.objs.globalEnv.bind(".submitted", code);
      try {
        await shelter.captureR(
          `.attempt <- new.env(parent = ${env})
           assign(".result", eval(parse(text = .submitted), envir = .attempt), envir = .attempt)`,
          // captureConditions MUST be true here. With it off, webR catches the
          // R error itself, prints it, and reports success — so every error
          // misconception silently never fired, and grading carried on against
          // the unchanged data. With it on, webR throws the error to us.
          { withAutoprint: false, captureStreams: true, captureConditions: true, captureGraphics: false });
      } catch (e) {
        const msg = String(e.message ?? e);
        const mi = (r.misconceptions ?? []).findIndex((x) => x.match.on === "error" && new RegExp(x.match.pattern).test(msg));
        const m = mi >= 0 ? r.misconceptions[mi] : null;
        events.log("attempt", { ex: ex.id, hash: ex.hash, n: state.attempts, ok: false,
                                err: true, matched: m ? (m.id ?? `m${mi}`) : null });
        done(false);
        return show(false, m ? md(m.feedback) : "<p>Your code didn't run.</p>", msg);
      }

      const ev = async (expr) => {
        await w.objs.globalEnv.bind(".check_src", expr);
        return (await (await shelter.evalR(`eval(parse(text = .check_src), envir = .attempt)`)).toJs()).values;
      };

      // A specific wrong answer beats a generic failure, so these run first.
      for (const [mi, m] of (r.misconceptions ?? []).entries()) {
        const mid = m.id ?? `m${mi}`;
        if (m.match.on === "source" && new RegExp(m.match.pattern).test(code)) {
          events.log("attempt", { ex: ex.id, hash: ex.hash, n: state.attempts, ok: false, matched: mid });
          done(false);
          return show(false, md(m.feedback));
        }
        if (m.match.on === "result") {
          try {
            if (deepEq(await ev(m.match.expr), m.match.equals)) {
              events.log("attempt", { ex: ex.id, hash: ex.hash, n: state.attempts, ok: false, matched: mid });
              done(false); return show(false, md(m.feedback));
            }
          }
          catch (err) { console.warn("misconception check failed:", m.match.expr, err.message ?? err); }
        }
      }

      let pass = true, firstFail = null;
      const log = [];
      for (const c of r.checks) {
        let got;
        try { got = await ev(c.expr); }
        catch (err) { pass = false; firstFail ??= c; log.push(`\u2717 ${c.expr} — ${err.message ?? err}`); continue; }
        const ok = deepEq(got, c.equals);
        if (!ok) { pass = false; firstFail ??= c; }
        log.push(`${ok ? "\u2713" : "\u2717"} ${c.expr} \u2192 ${JSON.stringify(got)}`);
      }
      events.log("attempt", { ex: ex.id, hash: ex.hash, n: state.attempts, ok: pass, matched: null });
      done(pass);
      show(pass, pass ? md(r.solution.why) : md(firstFail?.on_fail ?? "That isn't right yet."),
           DEV ? log.join("\n") : "");
    } finally { await shelter.purge(); stat.textContent = ""; }
  }

  body.querySelector(".run").onclick = run;
  body.querySelector(".check").onclick = check;
}
