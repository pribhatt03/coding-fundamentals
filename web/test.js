import { md, esc, renderExercise, setStatusHandler } from "./exercise.js";

// Dev harness: one exercise at a time, with a sidebar. The chapter preview
// (chapter.html) shows the same exercises inline in your prose.

const $ = (id) => document.getElementById(id);
import("./theme.js").then((t) => t.mount($("themeslot")));
import("./reference.js").then((r) => r.mount($("fnslot")));
setStatusHandler((t) => { if (t) $("status").textContent = t; });

let CHAPTERS = [];
try {
  const r = await fetch("./exercises/index.json");
  if (r.ok) CHAPTERS = await r.json();
} catch (e) { console.error("could not load index.json — run `npm run build`", e); }

const all = [];
for (const ch of CHAPTERS) {
  try {
    const res = await fetch(`./exercises/${ch}.json`);
    if (res.ok) all.push(...(await res.json()).map((e) => ({ ...e, _ch: ch })));
  } catch { }
}

if (!all.length) {
  $("status").textContent = "No exercises found. Run `npm run build` first.";
} else {
  buildNav();
  show(all[0]);
  $("status").textContent = `${all.length} exercises`;
}

function buildNav() {
  const nav = $("nav");
  for (const ch of CHAPTERS) {
    const items = all.filter((e) => e._ch === ch);
    if (!items.length) continue;
    const h = document.createElement("h2");
    h.innerHTML = `${ch} <a href="./chapter.html?ch=${ch}">prose</a>`;
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

function show(ex) {
  const el = $("ex");
  el.innerHTML = `<div id="host"></div>
    <details><summary>Raw record</summary><pre>${esc(JSON.stringify(ex, null, 2))}</pre></details>`;
  renderExercise(ex, $("host"));
}
