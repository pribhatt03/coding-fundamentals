// Chapter preview: your prose with the exercises rendered where the markers are.
// This is how you check the rhythm of reading and doing while you write.

import { md, renderExercise, setStatusHandler, makeScratch } from "./exercise.js";
import * as progress from "./progress.js";
import * as events from "./events.js";
import * as theme from "./theme.js";
import * as reference from "./reference.js";
import * as data from "./data.js";

// Compact spacing is the default. ?space=open shows the roomier version.
if (new URLSearchParams(location.search).get("space") === "open") {
  document.documentElement.setAttribute("data-space", "open");
}

// Read once, before load() rewrites the address.
let arrivedByNext = new URLSearchParams(location.search).get("via") === "next";

const $ = (s) => document.querySelector(s);
const MARKER = /^::: exercise \{#([a-z0-9-]+)\}\s*$/;

setStatusHandler((t) => { $("#status").textContent = t; });

let chapters = [];
try { chapters = await (await fetch("./exercises/index.json")).json(); }
catch (e) { console.error("run `npm run build` first", e); }

const exercises = new Map();
for (const ch of chapters) {
  try {
    for (const ex of await (await fetch(`./exercises/${ch}.json`)).json()) exercises.set(ex.id, ex);
  } catch { }
}

// Students see "Module 5"; internally everything is keyed by "ch05", which
// is stable and recorded in analytics.
const label = (ch) => (/^ch\d+$/.test(ch) ? `Module ${+ch.slice(2)}` : ch[0].toUpperCase() + ch.slice(1));

const picker = $("#chapter");
const devMenu = new URLSearchParams(location.search).has("dev");
let outline = [];
try { outline = await (await fetch("./outline.json")).json(); } catch { }

// Grouped by part, with each module's title, so twenty modules stay
// scannable. Anything that isn't a numbered module (the demo) is only listed
// in dev mode.
const titleOf = {};
outline.forEach((p) => p.modules.forEach((m) => { titleOf[m.id] = m.title; }));
const optionFor = (c) =>
  `<option value="${c}">${/^ch\d+$/.test(c) ? `${+c.slice(2)}${titleOf[c] ? ` \u00b7 ${titleOf[c]}` : ""}` : label(c)}</option>`;

if (outline.length) {
  picker.innerHTML = outline
    .filter((p) => p.part || devMenu)
    .map((p) => `<optgroup label="${p.part ? `Part ${p.part} \u2014 ${p.title}` : p.title}">
      ${p.modules.map((m) => optionFor(m.id)).join("")}</optgroup>`).join("");
} else {
  picker.innerHTML = chapters.map(optionFor).join("");
}
picker.onchange = () => load(picker.value);

let currentIds = [];

document.addEventListener("progress:changed", updateBar);

function updateBar() {
  const { done, total } = progress.summary(currentIds);
  $("#bar-fill").style.width = total ? `${(done / total) * 100}%` : "0%";
  $("#count").textContent = total ? `${done} of ${total} done` : "";
}

theme.mount($("#themeslot"));
reference.mount($("#fnslot"));
data.mount($("#dataslot"));

// Development tools stay out of the learner's way. Add ?dev to the address to
// see them — on localhost too, so testing locally shows exactly what a
// learner sees.
const devMode = new URLSearchParams(location.search).has("dev");
if (devMode) $("#devtools").hidden = false;

$("#events").onclick = () => events.download();
$("#events").title = "download your event log as JSON";

$("#reset").onclick = () => {
  if (!confirm("Clear your progress for every module? This can't be undone.")) return;
  progress.reset();
  try {
    Object.keys(localStorage).filter((k) => k.startsWith("rcourse:v1:seen:"))
      .forEach((k) => localStorage.removeItem(k));
  } catch { }
  load(picker.value);
};

if (!progress.isStorageAvailable()) {
  $("#warn").textContent = "Progress won't be saved — storage is blocked in this browser.";
}

function showPart(ch, source, force = false) {
  const key = `rcourse:v1:seen:${ch}`;
  try { if (!force && localStorage.getItem(key)) return; } catch { }

  const overlay = document.createElement("div");
  overlay.className = "partoverlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.innerHTML = `<div class="partcard">${md(source)}
    <button class="act partgo">Continue to ${label(ch)}</button></div>`;
  document.body.append(overlay);
  document.body.classList.add("locked");
  scrollTo(0, 0);
  requestAnimationFrame(() => requestAnimationFrame(() => overlay.classList.add("show")));

  const go = () => {
    try { localStorage.setItem(key, "1"); } catch { }
    overlay.classList.remove("show");
    removeEventListener("keydown", onKey);
    const finish = () => { overlay.remove(); document.body.classList.remove("locked"); };
    matchMedia("(prefers-reduced-motion: reduce)").matches ? finish() : setTimeout(finish, 650);
  };
  const onKey = (e) => { if (e.key === "Enter" || e.key === "Escape") go(); };
  overlay.querySelector(".partgo").onclick = go;
  addEventListener("keydown", onKey);
  overlay.querySelector(".partgo").focus({ preventScroll: true });
}

// Chapter to chapter, so the end of one module leads somewhere.
function chapterNav(ch) {
  const i = chapters.indexOf(ch);
  const prev = chapters[i - 1], next = chapters[i + 1];
  if (!prev && !next) return "";
  return `<nav class="chapnav">
    ${prev ? `<a href="?ch=${prev}">\u2190 ${label(prev)}</a>` : "<span></span>"}
    ${next ? `<a href="?ch=${next}&via=next">${label(next)} \u2192</a>` : "<span></span>"}
  </nav>`;
}

const params = new URLSearchParams(location.search);
if (params.get("ch") && chapters.includes(params.get("ch"))) picker.value = params.get("ch");
load(picker.value ?? chapters[0]);

async function load(ch) {
  if (!ch) return;
  history.replaceState(null, "", `?ch=${ch}`);
  events.watchChapter(ch);
  reference.setChapter(ch);
  data.setChapter(ch);
  events.log("chapter_open", { ch });
  const root = $("#chapter-body");
  let text;
  try {
    const res = await fetch(`./chapters/${ch}.md`);
    if (!res.ok) throw new Error(res.status);
    text = await res.text();
  } catch {
    root.innerHTML = `<p class="missing">No prose yet for ${label(ch)}. Create
      <code>content/${ch}/${ch}.md</code> and run <code>npm run build</code>.</p>`;
    return;
  }

  root.innerHTML = "";
  // Count the markers first so each exercise can show its position in the
  // chapter rather than its internal id.
  const order = [...text.matchAll(/^::: exercise \{#([a-z0-9-]+)\}\s*$/gm)].map((m) => m[1]);
  const total = order.length;
  let seq = 0;

  currentIds = [];
  let buffer = [];
  const flush = () => {
    if (!buffer.length) return;
    const d = document.createElement("div");
    d.innerHTML = md(buffer.join("\n"));
    root.append(d);
    buffer = [];
  };

  // A "::: part" block opens a new part of the course. It isn't shown inline:
  // it becomes a full-screen page that fades in the first time the module is
  // opened, and fades away into the module when the student continues.
  let partBuf = null;
  let partMd = null;

  for (const line of text.split("\n")) {
    if (partBuf) {
      if (line.trim() === ":::") { partMd = partBuf.join("\n"); partBuf = null; }
      else partBuf.push(line);
      continue;
    }
    if (line.trim() === "::: part") { flush(); partBuf = []; continue; }

    const m = line.match(MARKER);
    if (!m) { buffer.push(line); continue; }
    flush();
    const host = document.createElement("div");
    root.append(host);
    const ex = exercises.get(m[1]);
    if (ex) {
      currentIds.push(ex.id);
      renderExercise(ex, host, { n: ++seq, of: total });
    }
    else host.innerHTML = `<p class="missing">No exercise with id <code>${m[1]}</code>.</p>`;
  }
  flush();

  // Every R code block — in prose or in an exercise prompt — becomes an
  // editable scratchpad. Students may run a predict exercise's code before
  // answering; that's a deliberate choice, not an oversight.
  root.querySelectorAll("pre.runnable").forEach((pre) => {
    const owner = exercises.get(pre.closest(".exercise")?.id?.replace(/^ex-/, ""));
    makeScratch(pre, ch, owner ?? null);
  });
  root.insertAdjacentHTML("beforeend", chapterNav(ch));
  updateBar();
  const cameByNext = arrivedByNext;
  arrivedByNext = false;
  if (partMd) {
    // A small label at the top of the module, so the part page can be seen
    // again any time.
    const [first] = partMd.split("\n").filter((l) => l.trim());
    const heading = (partMd.match(/^# (.+)$/m) || [])[1] ?? "";
    const eyebrow = document.createElement("button");
    eyebrow.className = "parteyebrow";
    eyebrow.textContent = `${first.trim()}${heading ? ` \u2014 ${heading}` : ""}`;
    eyebrow.onclick = () => showPart(ch, partMd, true);
    root.prepend(eyebrow);

    // Shown the first time, and whenever the student walks into this part
    // from the module before it.
    showPart(ch, partMd, cameByNext);
  }
}
