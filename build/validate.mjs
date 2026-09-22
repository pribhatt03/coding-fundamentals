#!/usr/bin/env node
// Validates every exercise YAML, applies the rules JSON Schema can't express,
// and emits one runtime JSON bundle per chapter.
//
//   node build/validate.mjs            # validate + build
//   node build/validate.mjs --check    # validate only, no output (use in CI)

import { readFile, readdir, mkdir, writeFile, copyFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { createHash } from "node:crypto";
import Ajv from "ajv/dist/2020.js"; // draft 2020-12; the default ajv export is draft-07
import yaml from "js-yaml";

const CONTENT = "content";
const OUT = "web/exercises";
const PROSE_OUT = "web/chapters";
const CHECK_ONLY = process.argv.includes("--check");

// Selectable region in a span exercise: <<id|text>>
// The negative lookahead matters. In `filter(avg <<c|>>> 20)` the span text is
// a single `>`, and a plain non-greedy `>>` would close early and capture "".
// Requiring the closing `>>` not to be followed by another `>` fixes it.
const MARKER = /<<([a-z0-9_-]+)\|([\s\S]*?)>>(?!>)/g;

// Packages known to build for Wasm. Refresh from https://repo.r-wasm.org/src/contrib/PACKAGES
// This is a guard against typos and against reaching for something CRAN-only,
// not a security boundary.
const WASM_PACKAGES = new Set([
  "dplyr", "ggplot2", "tidyr", "readr", "purrr", "tibble", "stringr", "forcats",
  "lubridate", "janitor", "gt", "knitr", "palmerpenguins", "nycflights13",
  "gapminder", "patchwork", "scales", "glue", "magrittr",
]);

const errors = [];
const warnings = [];
const fail = (file, msg) => errors.push(`${file}: ${msg}`);
const warn = (file, msg) => warnings.push(`${file}: ${msg}`);

const schema = JSON.parse(await readFile("schema/exercise.schema.json", "utf8"));
const ajv = new Ajv({ allErrors: true, strict: false });
const validate = ajv.compile(schema);

/** Rules that JSON Schema cannot express. Each one has burned someone. */
function customRules(ex, file) {
  if (ex.id !== basename(file, ".yml")) {
    fail(file, `id "${ex.id}" does not match the filename`);
  }

  for (const pkg of ex.packages ?? []) {
    if (!WASM_PACKAGES.has(pkg)) {
      warn(file, `package "${pkg}" is not in the known-Wasm list — verify it installs`);
    }
  }

  const r = ex.response;

  if (r.kind === "choice") {
    const correct = r.options.filter((o) => o.correct);
    if ((r.select ?? "one") === "one" && correct.length !== 1) {
      fail(file, `select: one needs exactly 1 correct option, found ${correct.length}`);
    }
    if (correct.length === 0) fail(file, "no option marked correct");
  }

  if (r.kind === "span") {
    const found = new Map();
    for (const m of r.code.matchAll(MARKER)) {
      if (found.has(m[1])) fail(file, `duplicate span marker "${m[1]}"`);
      found.set(m[1], m[2]);
    }
    if (found.size === 0) fail(file, "span code contains no <<id|text>> markers");
    for (const [id, text] of found) {
      if (text.length === 0) fail(file, `span "${id}" captured empty text — check for a > delimiter clash`);
      if (!r.options.some((o) => o.id === id)) fail(file, `span marker "${id}" has no matching option`);
    }
    for (const o of r.options) {
      if (!found.has(o.id)) fail(file, `option "${o.id}" has no marker in the code`);
    }
    if (!r.options.some((o) => o.correct)) fail(file, "no span marked correct");
  }

  if (r.kind === "prose") {
    const ids = new Set();
    for (const c of r.rubric) {
      if (ids.has(c.id)) fail(file, `duplicate rubric id "${c.id}"`);
      ids.add(c.id);
      // Compound criteria make the judge's yes/no meaningless.
      if (/\band\b/i.test(c.criterion)) {
        warn(file, `rubric "${c.id}" looks compound — split it so the judge answers one thing`);
      }
    }
    if (typeof r.pass_threshold === "number" && r.pass_threshold > r.rubric.length) {
      fail(file, "pass_threshold exceeds the number of rubric criteria");
    }
  }

  if (r.kind === "r-code") {
    // fix-the-llm exercises hand the learner broken code to repair, so they
    // legitimately have no blank.
    if (!r.starter.includes("______") && ex.type !== "fix-the-llm") {
      warn(file, "starter has no ______ blank — intentional?");
    }
    for (const m of r.misconceptions ?? []) {
      if (m.match.on !== "result") {
        try { new RegExp(m.match.pattern); }
        catch { fail(file, `invalid regex in misconception: ${m.match.pattern}`); }
      }
    }
    if (!(r.misconceptions ?? []).length) {
      warn(file, "no misconceptions — this is the highest-value field, write at least one");
    }
  }
}

/** Stable hash of an exercise's content.
 *  Recorded with every analytics event so that editing an exercise after
 *  students have seen it doesn't silently merge two different versions under
 *  one id. Keys are sorted so formatting changes don't alter the hash. */
function contentHash(ex) {
  const canon = (v) =>
    Array.isArray(v) ? v.map(canon)
    : v && typeof v === "object"
      ? Object.fromEntries(Object.keys(v).sort().filter((k) => k !== "hash").map((k) => [k, canon(v[k])]))
      : v;
  return createHash("sha256").update(JSON.stringify(canon(ex))).digest("hex").slice(0, 10);
}

/** Split marked code into inert text and selectable spans, so the runtime never parses. */
function compileSpans(code) {
  const parts = [];
  let last = 0;
  for (const m of code.matchAll(MARKER)) {
    if (m.index > last) parts.push({ t: "text", v: code.slice(last, m.index) });
    parts.push({ t: "span", id: m[1], v: m[2] });
    last = m.index + m[0].length;
  }
  if (last < code.length) parts.push({ t: "text", v: code.slice(last) });
  return parts;
}

const chapters = (await readdir(CONTENT, { withFileTypes: true }))
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

let total = 0;
const bundles = new Map();
const prose = new Set();

for (const ch of chapters) {
  const dir = join(CONTENT, ch, "exercises");
  let files;
  try { files = (await readdir(dir)).filter((f) => f.endsWith(".yml")); }
  catch { continue; }

  const bundle = [];

  for (const f of files.sort()) {
    const path = join(dir, f);
    let ex;
    try {
      ex = yaml.load(await readFile(path, "utf8"));
    } catch (e) {
      fail(f, `YAML parse error: ${e.message}`);
      continue;
    }

    if (!validate(ex)) {
      for (const e of validate.errors) {
        fail(f, `${e.instancePath || "/"} ${e.message}`);
      }
      continue;
    }

    customRules(ex, f);

    const out = { ...ex };
    out.hash = contentHash(ex);
    if (out.response.kind === "span") {
      out.response = { ...out.response, parts: compileSpans(out.response.code) };
      delete out.response.code;
    }
    bundle.push(out);
    total++;
  }

  // `follows` must point at something that exists in the same chapter.
  const ids = new Set(bundle.map((e) => e.id));
  for (const e of bundle) {
    if (e.follows && !ids.has(e.follows)) fail(e.id, `follows "${e.follows}" not found in ${ch}`);
  }

  if (!CHECK_ONLY && !errors.length) {
    await mkdir(OUT, { recursive: true });
    await writeFile(join(OUT, `${ch}.json`), JSON.stringify(bundle));
    bundles.set(ch, bundle.length);
    // Chapter prose, if it exists, gets copied alongside for the preview page.
    try {
      await mkdir(PROSE_OUT, { recursive: true });
      await copyFile(join(CONTENT, ch, `${ch}.md`), join(PROSE_OUT, `${ch}.md`));
      prose.add(ch);
    } catch { /* no prose written yet */ }
  }
}

if (!CHECK_ONLY && !errors.length) {
  const built = chapters.filter((c) => bundles.has(c)).sort();
  await writeFile(join(OUT, "index.json"), JSON.stringify(built));
}

/* ------------------------------------------------------------ reference --- */
// The function reference doubles as a check on the show-first rule: every
// function a solution relies on should be in the reference, introduced no
// later than the chapter that uses it.

const NOT_FUNCTIONS = new Set(["if", "for", "while", "function", "return", "repeat"]);
let reference = [];
try {
  reference = yaml.load(await readFile(join(CONTENT, "reference.yml"), "utf8")) ?? [];
} catch (e) {
  warnings.push(`reference.yml: ${e.code === "ENOENT" ? "missing" : e.message}`);
}

const chapterOrder = [...bundles.keys()].filter((c) => /^ch\d+$/.test(c)).sort();
const refByName = new Map();
for (const [i, f] of reference.entries()) {
  const where = `reference.yml entry ${i + 1}${f?.name ? ` (${f.name})` : ""}`;
  for (const k of ["name", "usage", "does", "example", "introduced"]) {
    if (!f?.[k]) fail(where, `missing "${k}"`);
  }
  if (f?.name && refByName.has(f.name)) fail(where, `duplicate function "${f.name}"`);
  if (f?.introduced && !chapterOrder.includes(f.introduced)) {
    warn(where, `introduced in "${f.introduced}", which has no exercises`);
  }
  if (f?.note_from && !chapterOrder.includes(f.note_from)) {
    warn(where, `note_from "${f.note_from}" is not a chapter with exercises`);
  }
  if (f?.name) refByName.set(f.name, f);
}

const calls = (code = "") =>
  [...code.matchAll(/(?<![\w.])([A-Za-z.][A-Za-z0-9._]*)\s*\(/g)]
    .map((m) => m[1]).filter((n) => !NOT_FUNCTIONS.has(n));

for (const ch of chapterOrder) {
  const exs = JSON.parse(await readFile(join(OUT, `${ch}.json`), "utf8"));
  for (const ex of exs) {
    const r = ex.response;
    const used = new Set([
      ...calls(r.solution?.code),
      ...(r.options ?? []).filter((o) => o.correct).flatMap((o) => calls(o.text)),
    ]);
    for (const name of used) {
      const f = refByName.get(name);
      if (!f) {
        warn(ex.id, `solution uses ${name}() — not in reference.yml`);
      } else if (chapterOrder.indexOf(f.introduced) > chapterOrder.indexOf(ch)) {
        warn(ex.id, `solution uses ${name}(), which the reference introduces later in ${f.introduced}`);
      }
    }
  }
}

if (!CHECK_ONLY && !errors.length) {
  await writeFile(join("web", "reference.json"), JSON.stringify(reference));
}

for (const w of warnings) console.warn(`  warn  ${w}`);
for (const e of errors) console.error(`  FAIL  ${e}`);

if (errors.length) {
  console.error(`\n${errors.length} error(s). No output written.`);
  process.exit(1);
}
console.log(`\n${total} exercise(s) valid${CHECK_ONLY ? "" : `, written to ${OUT}/`}.`);
if (!CHECK_ONLY) {
  const without = [...bundles.keys()].filter((c) => !prose.has(c)).sort();
  if (prose.size) console.log(`prose: ${[...prose].sort().join(", ")}`);
  if (without.length) console.log(`no prose yet: ${without.join(", ")}`);
}
