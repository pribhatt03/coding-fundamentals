import { WebR } from "https://webr.r-wasm.org/latest/webr.mjs";

// Dev harness. Renders every exercise and grades it for real, so you can check
// your YAML by answering it rather than by reading it. Not the course UI.

// Chapters are discovered from the build, so adding a chapter needs no edit here.
let CHAPTERS = [];
try { CHAPTERS = await (await fetch("./exercises/index.json")).json(); } catch { }
const $ = (id) => document.getElementById(id);

let webR = null, rReady = null, warmedFor = null, current = null;
const all = [];

/* ------------------------------------------------------------- loading --- */

for (const ch of CHAPTERS) {
  try {
    const res = await fetch(`./exercises/${ch}.json`);
    if (res.ok) all.push(...(await res.json()).map((e) => ({ ...e, _ch: ch })));
  } catch { /* chapter not built yet */ }
}

if (!all.length) {
  $("status").textContent = "No exercises found. Run `npm run build` first.";
} else {
  buildNav();
  show(all[0]);
  $("status").textContent = `${all.length} exercises loaded. R starts when you open a code exercise.`;
}

function buildNav() {
  const nav = $("nav");
  for (const ch of CHAPTERS) {
    const items = all.filter((e) => e._ch === ch);
    if (!items.length) continue;
    const h = document.createElement("h2");
    h.textContent = ch;
    nav.append(h);
    for (const ex of items) {
      const b = document.createElement("button");
      b.innerHTML = `${ex.id}<br><span class="kind">${ex.response.kind}</span>`;
      b.onclick = () => {
        nav.querySelectorAll("button").forEach((x) => x.removeAttribute("aria-current"));
        b.setAttribute("aria-current", "true");
        show(ex);
      };
      nav.append(b);
    }
  }
  nav.querySelector("button")?.setAttribute("aria-current", "true");
}

/* ------------------------------------------------------------ markdown --- */
// Deliberately minimal. The real site pre-renders markdown at build time.

function esc(s) {
  return s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
}

function md(src = "") {
  return esc(src)
    .replace(/```r?\n([\s\S]*?)```/g, (_, c) => `<pre><code>${c.replace(/\n$/, "")}</code></pre>`)
    .replace(/`([^`\n]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .split(/\n\n+/).map((p) => (p.startsWith("<pre>") ? p : `<p>${p}</p>`)).join("");
}

/* -------------------------------------------------------------- render --- */

function show(ex) {
  current = ex;
  const r = ex.response;
  const el = $("ex");
  el.innerHTML = `
    <h1>${esc(ex.title ?? ex.id)}</h1>
    <p class="meta">${ex.id} · type: ${ex.type} · response: ${r.kind}${ex.follows ? ` · follows ${ex.follows}` : ""}</p>
    <div class="prompt">${md(ex.prompt)}</div>
    <div id="body"></div>
    <div id="fb"></div>
    ${ex.hint ? `<details><summary>Hint</summary>${md(ex.hint)}</details>` : ""}
    <details><summary>Raw record</summary><pre>${esc(JSON.stringify(ex, null, 2))}</pre></details>
  `;
  ({ choice: renderChoice, span: renderSpan, "r-code": renderCode, prose: renderProse }[r.kind])(ex, $("body"));
}

function feedback(pass, html, detail) {
  $("fb").innerHTML =
    `<div class="fb ${pass ? "pass" : "fail"}">
       <div class="verdict">${pass ? "Correct" : "Not yet"}</div>
       ${html}
       ${detail ? `<pre>${esc(detail)}</pre>` : ""}
     </div>`;
}

/* -------------------------------------------------------------- choice --- */

function renderChoice(ex, el) {
  const opts = [...ex.response.options];
  if (ex.response.shuffle) opts.sort(() => Math.random() - 0.5);
  el.innerHTML =
    opts.map((o) => `<label class="opt"><input type="radio" name="c" value="${o.id}">${md(o.text).replace(/^<p>|<\/p>$/g, "")}</label>`).join("") +
    `<div class="row"><button class="act" id="sub">Check</button></div>`;
  $("sub").onclick = () => {
    const picked = el.querySelector("input:checked");
    if (!picked) return;
    const o = ex.response.options.find((x) => x.id === picked.value);
    feedback(!!o.correct, md(o.feedback));
  };
}

/* ---------------------------------------------------------------- span --- */

function renderSpan(ex, el) {
  let picked = null;
  const code = ex.response.parts
    .map((p) => (p.t === "span" ? `<span class="sel" data-id="${p.id}">${esc(p.v)}</span>` : esc(p.v)))
    .join("");
  el.innerHTML = `<div class="spancode">${code}</div>
    <div class="row"><button class="act" id="sub" disabled>Check</button></div>`;
  el.querySelectorAll(".sel").forEach((s) => {
    s.onclick = () => {
      el.querySelectorAll(".sel").forEach((x) => x.classList.remove("picked"));
      s.classList.add("picked");
      picked = s.dataset.id;
      $("sub").disabled = false;
    };
  });
  $("sub").onclick = () => {
    const o = ex.response.options.find((x) => x.id === picked);
    feedback(!!o.correct, md(o.feedback));
  };
}

/* --------------------------------------------------------------- prose --- */

async function renderProse(ex, el) {
  el.innerHTML = `<textarea id="ans" placeholder="Your answer"></textarea>
    <div class="row"><button class="act" id="sub">Check</button>
    <span id="pstat" style="font-size:.8rem;color:#888"></span></div>`;
  $("sub").onclick = async () => {
    const answer = $("ans").value.trim();
    if (!answer) return;
    $("sub").disabled = true;
    $("pstat").textContent = "judging…";
    const fails = [];
    try {
      for (const c of ex.response.rubric) {
        const res = await fetch("/.netlify/functions/judge", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ answer, criterion: c.criterion, exemplar: ex.response.exemplar }),
        });
        if (!res.ok) throw new Error(`judge returned ${res.status}`);
        if (!(await res.json()).pass) fails.push(c);
      }
      feedback(!fails.length,
        fails.length ? fails.map((c) => md(c.on_fail)).join("") : "<p>All criteria met.</p>",
        fails.length ? `failed: ${fails.map((c) => c.id).join(", ")}` : "");
    } catch (e) {
      // Same fallback the real site uses when the judge is unreachable.
      feedback(false,
        `<p><strong>Judge unavailable — self-assess.</strong></p>` +
        `<p>Does your answer do each of these?</p><ul>` +
        ex.response.rubric.map((c) => `<li>${esc(c.criterion)}</li>`).join("") +
        `</ul><p>A good answer:</p>${md("```\n" + ex.response.exemplar + "\n```")}`,
        String(e.message ?? e) + "\n(the judge only runs on the deployed site, not localhost)");
    }
    $("pstat").textContent = "";
    $("sub").disabled = false;
  };
}

/* -------------------------------------------------------------- r-code --- */

async function ensureR(ex) {
  if (!webR) {
    $("status").textContent = "starting R…";
    webR = new WebR();
    rReady = webR.init();
  }
  await rReady;
  const pkgs = ex.packages ?? [];
  if (pkgs.length) {
    $("status").textContent = `installing ${pkgs.join(", ")}…`;
    await webR.installPackages(pkgs);
  }
  if (warmedFor !== ex.id) {
    await webR.objs.globalEnv.bind(".setup_src", ex.setup ?? "");
    await webR.evalRVoid(`.setup_env <- new.env(parent = globalenv())
                          eval(parse(text = .setup_src), envir = .setup_env)`);
    warmedFor = ex.id;
  }
  $("status").textContent = "R ready";
}

const deepEq = (a, b) =>
  Array.isArray(a) && Array.isArray(b) && a.length === b.length &&
  a.every((v, i) => (typeof v === "number" ? Math.abs(v - b[i]) < 1e-9 : v === b[i]));

async function renderCode(ex, el) {
  el.innerHTML = `<textarea id="ans" spellcheck="false">${esc(ex.response.starter.replace(/\n$/, ""))}</textarea>
    <div class="row">
      <button class="act" id="run">Run</button>
      <button class="act" id="sub">Check</button>
      <span id="out" style="font-size:.8rem;color:#888"></span>
    </div>`;
  $("run").onclick = async () => {
    await ensureR(ex);
    const shelter = await new webR.Shelter();
    try {
      await webR.objs.globalEnv.bind(".submitted", $("ans").value);
      const cap = await shelter.captureR(`eval(parse(text = .submitted), envir = .setup_env)`,
        { withAutoprint: true, captureStreams: true, captureConditions: false });
      $("out").textContent = cap.output.map((o) => o.data).join(" ") || "(no output)";
    } catch (e) {
      $("out").textContent = String(e.message ?? e);
    } finally { await shelter.purge(); }
  };
  $("sub").onclick = () => grade(ex, $("ans").value);
}

async function grade(ex, code) {
  await ensureR(ex);
  const r = ex.response;
  const shelter = await new webR.Shelter();
  try {
    await webR.objs.globalEnv.bind(".submitted", code);
    try {
      await shelter.captureR(
        `.attempt <- new.env(parent = .setup_env)
         assign(".result", eval(parse(text = .submitted), envir = .attempt), envir = .attempt)`,
        { withAutoprint: false, captureStreams: true, captureConditions: false });
    } catch (e) {
      const msg = String(e.message ?? e);
      const m = (r.misconceptions ?? []).find((x) => x.match.on === "error" && new RegExp(x.match.pattern).test(msg));
      return feedback(false, m ? md(m.feedback) : "<p>Your code didn't run.</p>", msg);
    }

    const ev = async (expr) => {
      await webR.objs.globalEnv.bind(".check_src", expr);
      return (await (await shelter.evalR(`eval(parse(text = .check_src), envir = .attempt)`)).toJs()).values;
    };

    for (const m of r.misconceptions ?? []) {
      if (m.match.on === "source" && new RegExp(m.match.pattern).test(code)) {
        return feedback(false, md(m.feedback), `matched source: ${m.match.pattern}`);
      }
      if (m.match.on === "result") {
        try { if (deepEq(await ev(m.match.expr), m.match.equals)) return feedback(false, md(m.feedback), `matched result: ${m.match.expr}`); }
        catch (e) { console.warn("misconception check failed:", m.match.expr, e.message ?? e); }
      }
    }

    let pass = true; const log = [];
    for (const c of r.checks) {
      let got;
      try { got = await ev(c.expr); }
      catch (e) { pass = false; log.push(`✗ ${c.expr} — ${e.message ?? e}`); continue; }
      const ok = deepEq(got, c.equals);
      if (!ok) pass = false;
      log.push(`${ok ? "✓" : "✗"} ${c.expr} → ${JSON.stringify(got)}`);
    }
    const failed = r.checks.find((c, i) => log[i]?.startsWith("✗"));
    feedback(pass,
      pass ? md(r.solution.why) : md(failed?.on_fail ?? "That isn't right yet."),
      log.join("\n"));
  } finally { await shelter.purge(); }
}
