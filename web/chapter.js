// Chapter preview: your prose with the exercises rendered where the markers are.
// This is how you check the rhythm of reading and doing while you write.

import { md, renderExercise, setStatusHandler, makeScratch } from "./exercise.js";
import * as progress from "./progress.js";
import * as events from "./events.js";
import * as theme from "./theme.js";
import * as reference from "./reference.js";

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
picker.innerHTML = chapters.map((c) => `<option value="${c}">${label(c)}</option>`).join("");
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

$("#events").onclick = () => events.download();
$("#events").title = "download your event log as JSON";

$("#reset").onclick = () => {
  if (!confirm("Clear your progress for every module? This can't be undone.")) return;
  progress.reset();
  load(picker.value);
};

if (!progress.isStorageAvailable()) {
  $("#warn").textContent = "Progress won't be saved — storage is blocked in this browser.";
}

// Chapter to chapter, so the end of one module leads somewhere.
function chapterNav(ch) {
  const i = chapters.indexOf(ch);
  const prev = chapters[i - 1], next = chapters[i + 1];
  if (!prev && !next) return "";
  return `<nav class="chapnav">
    ${prev ? `<a href="?ch=${prev}">\u2190 ${label(prev)}</a>` : "<span></span>"}
    ${next ? `<a href="?ch=${next}">${label(next)} \u2192</a>` : "<span></span>"}
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

  for (const line of text.split("\n")) {
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
  // Code blocks in the prose become editable scratchpads, so "below is a box
  // you can type in" is actually true.
  root.querySelectorAll("pre.runnable").forEach((pre) => makeScratch(pre, ch));

  flush();
  root.insertAdjacentHTML("beforeend", chapterNav(ch));
  updateBar();
}
