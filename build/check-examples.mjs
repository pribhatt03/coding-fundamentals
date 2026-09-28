#!/usr/bin/env node
// Runs every example in content/reference.yml through R and compares what R
// prints with the `result` written in the file. A reference that shows the
// wrong output teaches students to distrust the course, so check after any
// edit:
//
//   npm run check-examples
//
// Needs R installed (Rscript on your PATH).

import { readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import yaml from "js-yaml";

const norm = (s) => String(s ?? "").replace(/\s+/g, " ").trim();

try { execFileSync("Rscript", ["--version"], { stdio: "ignore" }); }
catch { console.error("Rscript not found — install R to run this check."); process.exit(1); }

const ref = yaml.load(await readFile("content/reference.yml", "utf8"));
let checked = 0, bad = 0;

for (const f of ref) {
  for (const ex of [{ example: f.example, result: f.result }, ...(f.also ?? [])]) {
    checked++;
    // str() and print() show their own output; everything else is wrapped in
    // print() so Rscript shows it.
    const code = /^(str|print)\(/.test(ex.example) ? ex.example : `print(${ex.example})`;
    let out;
    try { out = execFileSync("Rscript", ["-e", code], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }); }
    catch (e) { out = `ERROR: ${e.stderr ?? e.message}`; }
    if (norm(out) !== norm(ex.result)) {
      bad++;
      console.log(`MISMATCH  ${f.name}(): ${ex.example}\n  file says: ${norm(ex.result)}\n  R says:    ${norm(out)}\n`);
    }
  }
}
console.log(`${checked} examples checked, ${bad} mismatch${bad === 1 ? "" : "es"}.`);
process.exit(bad ? 1 : 0);
