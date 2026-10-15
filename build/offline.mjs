#!/usr/bin/env node
// Lists every file a learner needs, for "Save for offline", and writes the
// service worker with this build's version in it.
//
//   web/offline-manifest.json   every file, its size, and the cache it goes in
//   web/sw.js                   build/sw.template.js with the versions filled in
//
// Both are generated, so both are in .gitignore. The version is a fingerprint
// of every file's contents: change any file and it changes, so the browser
// picks up the new service worker and learners see "save again".

import { readdir, readFile, writeFile, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import { join, relative, sep } from "node:path";

const WEB = "web";

// Developer-only pages and files a learner never needs.
const SKIP = [
  /^index\.html$/,          // the old webR diagnostics page
  /^test\.(html|js)$/,      // the exercise harness
  /^spike\.js$/,
  /^_/,                     // scratch pages, _headers
  /(^|\/)\./,              // hidden files, like an R session's .Rhistory
  /\.map$/,
  /(^|\/)\.version$/,
  /^sw\.js$/,
  /^offline-manifest\.json$/,
];

async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...await walk(p));
    else out.push(p);
  }
  return out;
}

const files = [];
for (const p of await walk(WEB)) {
  const rel = relative(WEB, p).split(sep).join("/");
  if (SKIP.some((re) => re.test(rel))) continue;
  const buf = await readFile(p);
  files.push({ path: rel, bytes: buf.length, hash: createHash("sha256").update(buf).digest("hex") });
}
files.sort((a, b) => a.path.localeCompare(b.path));

const fingerprint = (list) => createHash("sha256")
  .update(list.map((f) => `${f.path}:${f.hash}`).join("\n")).digest("hex").slice(0, 12);

const vendor = files.filter((f) => f.path.startsWith("vendor/"));
const shell = files.filter((f) => !f.path.startsWith("vendor/"));
const version = fingerprint(files);
const vendorVersion = fingerprint(vendor);

const manifest = {
  version,
  caches: { shell: `rcourse-shell-${version}`, vendor: `rcourse-vendor-${vendorVersion}`, rpkgs: "rcourse-rpkgs-v1" },
  // Packages a module installs. Saved for offline by installing them once.
  packages: ["dplyr"],
  bytes: files.reduce((n, f) => n + f.bytes, 0),
  files: files.map((f) => ({ path: f.path, bytes: f.bytes, cache: f.path.startsWith("vendor/") ? "vendor" : "shell" })),
};
await writeFile(join(WEB, "offline-manifest.json"), JSON.stringify(manifest));

const template = await readFile(join("build", "sw.template.js"), "utf8");
await writeFile(join(WEB, "sw.js"),
  template.replace("__VERSION__", version).replace("__VENDOR__", vendorVersion));

const mb = (n) => (n / 1e6).toFixed(1) + " MB";
console.log(`offline: ${files.length} files, ${mb(manifest.bytes)} ` +
            `(R and fonts ${mb(vendor.reduce((n, f) => n + f.bytes, 0))}), version ${version}`);
