// Data panel: every data frame used in the current module, shown as a grid.
//
// Like RStudio's Environment pane — you can keep a data frame in view while
// you write code about it, instead of scrolling back up to find a column
// name. Datasets come from content/chNN/data.yml, copied to web/data/ by the
// build.

import * as progress from "./progress.js";

let panel, list, btn;
let sets = [];

// A column can wait for the exercise that creates it: `after: {dbp: ch09-ex01}`
// keeps dbp out of the panel until that exercise is done, so the panel shows
// the data frame as the student has actually built it.
function shown(d) {
  const keep = d.columns.map((c) => {
    const id = d.after?.[c];
    return !id || progress.get(id).passed;
  });
  return {
    columns: d.columns.filter((_, i) => keep[i]),
    rows: d.rows.map((r) => r.filter((_, i) => keep[i])),
  };
}

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const cell = (v) =>
  v === null ? `<span class="tna">NA</span>`
  : v === true ? "TRUE" : v === false ? "FALSE" : esc(v);

function render() {
  if (!list) return;
  list.innerHTML = sets.map((full) => full.print != null
    // Not a table — a vector or a list — so show it the way R prints it.
    ? `<section class="dataset">
        <h3><code>${esc(full.name)}</code></h3>
        ${full.shape ? `<p class="datashape">${esc(full.shape)}</p>` : ""}
        <pre>${esc(full.print)}</pre>
      </section>`
    : null).map((html, i) => html ?? tableHtml({ name: sets[i].name, ...shown(sets[i]) })).join("");
}

function tableHtml(d) {
  return `
    <section class="dataset">
      <h3><code>${esc(d.name)}</code></h3>
      <p class="datashape">${d.rows.length} obs. of ${d.columns.length} variables</p>
      <div class="dfwrap"><table class="df">
        <thead><tr><th class="rn"></th>${d.columns.map((c) => `<th>${esc(c)}</th>`).join("")}</tr></thead>
        <tbody>${d.rows.map((row, i) => `<tr><th class="rn">${i + 1}</th>${row.map((v) =>
          `<td class="${typeof v === "number" ? "num" : ""}">${cell(v)}</td>`).join("")}</tr>`).join("")}
        </tbody>
      </table></div>
    </section>`;
}

function open() {
  document.dispatchEvent(new CustomEvent("sidepanel:open", { detail: "data" }));
  panel.hidden = false;
  requestAnimationFrame(() => panel.classList.add("open"));
}
function close() {
  panel.classList.remove("open");
  setTimeout(() => { panel.hidden = true; }, 180);
}

export function mount(buttonHost) {
  btn = document.createElement("button");
  btn.className = "linky";
  btn.id = "databtn";
  btn.textContent = "Data";
  btn.hidden = true;
  btn.onclick = () => (panel.hidden ? open() : close());
  buttonHost.append(btn);

  panel = document.createElement("aside");
  panel.id = "datapanel";
  panel.className = "sidepanel wide";
  panel.hidden = true;
  panel.setAttribute("aria-label", "Data frames in this module");
  panel.innerHTML = `
    <div class="panelhead">
      <header>
        <h2>Data</h2>
        <button class="linky dataclose" aria-label="Close">Close</button>
      </header>
      <p class="fncount">The data frames used in this module.</p>
    </div>
    <div class="datalist panelbody"></div>`;
  document.body.append(panel);
  list = panel.querySelector(".datalist");
  panel.querySelector(".dataclose").onclick = close;
  addEventListener("keydown", (e) => { if (e.key === "Escape" && !panel.hidden) close(); });
  document.addEventListener("sidepanel:open", (e) => { if (e.detail !== "data" && !panel.hidden) close(); });
  document.addEventListener("progress:changed", render);
}

/** Load this module's data. The button only appears if there is some. */
export async function setChapter(ch) {
  sets = [];
  try {
    const res = await fetch(`./data/${ch}.json`);
    if (res.ok) sets = await res.json();
  } catch { /* no datasets for this module */ }
  if (btn) btn.hidden = !sets.length;
  if (!sets.length && panel && !panel.hidden) close();
  render();
}
