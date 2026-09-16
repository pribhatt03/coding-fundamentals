import { WebR } from "https://webr.r-wasm.org/latest/webr.mjs";

const $ = (id) => document.getElementById(id);
const ms = (t) => `${Math.round(t)} ms`;
const since = (t0) => ms(performance.now() - t0);

// One instance for the page. In the real app this is a module-level singleton
// created lazily on first scroll into an exercise, not at page load.
const webR = new WebR();

let gradingEnv = null;

/* ---------------------------------------------------------------- boot ---- */

async function boot() {
  $("coi").textContent = crossOriginIsolated ? "yes" : "no";
  $("channel").textContent = crossOriginIsolated
    ? "SharedArrayBuffer"
    : "fallback — interrupt and readline() will not work";

  let t = performance.now();
  await webR.init();
  $("t-init").textContent = since(t);

  $("rver").textContent = await webR.evalRString("paste(R.version$major, R.version$minor, sep='.')");

  $("status").textContent = "installing dplyr…";
  t = performance.now();
  await webR.installPackages(["dplyr"]);
  $("t-pkg").textContent = since(t);

  // First eval pays for loading the package into the session; later ones don't.
  t = performance.now();
  await webR.evalRVoid("library(dplyr)");
  $("t-first").textContent = since(t);

  t = performance.now();
  await webR.evalRVoid("1 + 1");
  $("t-warm").textContent = since(t);

  await warmExercise(EX);

  $("status").textContent = "ready";
  $("run").disabled = false;
  $("grade").disabled = false;
}

/* ------------------------------------------------------- scratch eval ---- */

async function evalCode(code, env) {
  const shelter = await new webR.Shelter();
  try {
    // Bind the source as data rather than interpolating it into an R string.
    // Escaping R code into R code is how you get a parser bug at 11pm.
    await webR.objs.globalEnv.bind(".submitted", code);
    const cap = await shelter.captureR(
      `eval(parse(text = .submitted), envir = ${env ?? "globalenv()"})`,
      { withAutoprint: true, captureStreams: true, captureConditions: false }
    );
    return {
      ok: true,
      text: cap.output.map((o) => o.data).join("\n"),
      streams: cap.output,
    };
  } catch (e) {
    return { ok: false, text: String(e.message ?? e) };
  } finally {
    await shelter.purge();
  }
}

$("run").addEventListener("click", async () => {
  $("run").disabled = true;
  $("status").textContent = "running…";
  const t = performance.now();
  const r = await evalCode($("code").value);
  $("out").textContent = r.text || "(no output)";
  $("out").className = r.ok ? "" : "err";
  $("status").textContent = `done in ${since(t)}`;
  $("run").disabled = false;
});

/* ------------------------------------------------------------ grading ---- */
// Inlined from dist/exercises/ch04.json. In the real app this is fetched.

const EX = {
  id: "ch04-ex01",
  setup: `library(dplyr)
readings <- data.frame(
  site = c("north","north","north","south","south","south"),
  day  = c(1, 2, 3, 1, 2, 3),
  temp = c(18.2, 21.5, NA, 22.1, 23.4, 19.9)
)`,
  checks: [
    { expr: "as.numeric(round(.result$avg_temp, 2))", equals: [19.85, 21.8] },
    { expr: "colnames(.result)", equals: ["site", "avg_temp"] },
  ],
  misconceptions: [
    {
      match: { on: "result", expr: "as.logical(is.na(.result$avg_temp))", equals: [true, false] },
      feedback: "North came back NA because one of its three readings is missing. South is fine, so half the output looks right.",
    },
    {
      match: { on: "source", pattern: "drop_na\\(|filter\\(\\s*!is\\.na" },
      feedback: "That works, but it discards north's day 3 row entirely rather than scoping the decision to this calculation.",
    },
  ],
};

// Setup runs once per exercise into its own environment. The session stays warm;
// submissions never re-run library() or rebuild the data.
async function warmExercise(ex) {
  gradingEnv = `.env_${ex.id.replace(/-/g, "_")}`;
  await webR.objs.globalEnv.bind(".setup_src", ex.setup ?? "");
  await webR.evalRVoid(`
    ${gradingEnv} <- new.env(parent = globalenv())
    eval(parse(text = .setup_src), envir = ${gradingEnv})
  `);
}

const deepEq = (a, b) =>
  Array.isArray(a) && Array.isArray(b) &&
  a.length === b.length &&
  a.every((v, i) => (typeof v === "number" ? Math.abs(v - b[i]) < 1e-9 : v === b[i]));

async function grade(ex, code) {
  const shelter = await new webR.Shelter();
  const log = [];
  try {
    // Fresh child env per attempt, so a submission can't poison the setup data
    // for the next attempt. Parent is the warm setup env.
    await webR.objs.globalEnv.bind(".submitted", code);
    try {
      await shelter.captureR(
        `.attempt <- new.env(parent = ${gradingEnv})
         assign(".result", eval(parse(text = .submitted), envir = .attempt), envir = .attempt)`,
        { withAutoprint: false, captureStreams: true, captureConditions: false }
      );
    } catch (e) {
      return { pass: false, log: [`R error: ${e.message ?? e}`] };
    }

    const evalCheck = async (expr) => {
      const obj = await shelter.evalR(expr, { env: await webR.evalR(".attempt") });
      const js = await obj.toJs();
      return js.values;
    };

    // Misconceptions first — a specific wrong answer beats a generic failure.
    for (const m of ex.misconceptions ?? []) {
      if (m.match.on === "source") {
        if (new RegExp(m.match.pattern).test(code)) {
          return { pass: false, log: [`matched misconception (source)`, m.feedback] };
        }
      } else if (m.match.on === "result") {
        try {
          if (deepEq(await evalCheck(m.match.expr), m.match.equals)) {
            return { pass: false, log: [`matched misconception (result)`, m.feedback] };
          }
        } catch { /* expr didn't apply to this result; not a match */ }
      }
    }

    let pass = true;
    for (const c of ex.checks) {
      let got;
      try { got = await evalCheck(c.expr); }
      catch (e) { log.push(`✗ ${c.expr} — could not evaluate: ${e.message ?? e}`); pass = false; continue; }
      const ok = deepEq(got, c.equals);
      if (!ok) pass = false;
      log.push(`${ok ? "✓" : "✗"} ${c.expr}  →  ${JSON.stringify(got)}`);
    }
    return { pass, log };
  } finally {
    await shelter.purge();
  }
}

$("grade").addEventListener("click", async () => {
  $("grade").disabled = true;
  $("verdict").textContent = "grading…";
  const t = performance.now();
  const r = await grade(EX, $("code").value);
  $("verdict").innerHTML =
    `<span class="${r.pass ? "pass" : "fail"}">${r.pass ? "PASS" : "FAIL"}</span>` +
    `  (${since(t)})\n\n` + r.log.join("\n");
  $("grade").disabled = false;
});

boot().catch((e) => {
  $("status").textContent = "boot failed";
  $("out").className = "err";
  $("out").textContent = String(e.message ?? e);
});
