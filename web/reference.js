// Function reference: the course's own help page.
//
// Like the lab-values panel in a USMLE question — you aren't expected to have
// memorised every function, you're expected to know when to look one up.
// Search matches descriptions as well as names, so "count" finds sum(). That
// is the describe-what-you-want skill, practised here before students try it
// with a search engine or an AI.

let data = [];
let chapters = [];
let current = null;          // null = show everything (the harness)
let panel, list, input, count;

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const inline = (s) => esc(s)
  .replace(/`([^`]+)`/g, "<code>$1</code>")
  .replace(/\*([^*]+)\*/g, "<em>$1</em>");
const moduleNo = (ch) => (ch?.match(/\d+/) ? String(+ch.match(/\d+/)[0]) : ch);

// A note can be held back until a later module, so the reference doesn't
// give away an exercise whose point is the surprise.
function noteShown(f) {
  if (!f.note) return false;
  if (!f.note_from || !current) return true;
  return chapters.indexOf(current) >= chapters.indexOf(f.note_from);
}

function visible() {
  if (!current) return data;
  const upTo = chapters.indexOf(current);
  if (upTo < 0) return data;
  return data.filter((f) => chapters.indexOf(f.introduced) <= upTo);
}

function render() {
  if (!list) return;
  const q = input.value.trim().toLowerCase();
  const pool = visible();
  const shown = !q ? pool : pool.filter((f) =>
    [f.name, f.does, noteShown(f) ? f.note : "", f.usage]
      .some((t) => String(t ?? "").toLowerCase().includes(q)));

  count.textContent = current
    ? `${pool.length} functions so far, up to module ${moduleNo(current)}`
    : `${pool.length} functions`;

  list.innerHTML = shown.length ? shown.map((f) => `
    <article class="fn">
      <h3><code>${esc(f.name)}()</code><span class="fnfrom">module ${moduleNo(f.introduced)}</span></h3>
      <p>${inline(f.does)}</p>
      <pre class="fnusage"><code>${esc(f.usage)}</code></pre>
      <pre class="fnex"><code>${esc(f.example)}${f.result ? `\n<span class="fnres">${esc(f.result)}</span>` : ""}</code></pre>
      ${noteShown(f) ? `<p class="fnnote">${inline(f.note)}</p>` : ""}
    </article>`).join("")
    : `<p class="fnnone">Nothing matches "${esc(q)}". Try describing what you want
       the function to do — "count", "average", "order".</p>`;
}

function open() {
  panel.hidden = false;
  requestAnimationFrame(() => panel.classList.add("open"));
  input.focus();
}
function close() {
  panel.classList.remove("open");
  setTimeout(() => { panel.hidden = true; }, 180);
}

/** Put the button in `buttonHost` and the panel at the end of the page. */
export async function mount(buttonHost) {
  try {
    data = await (await fetch("./reference.json")).json();
    chapters = await (await fetch("./exercises/index.json")).json();
  } catch (e) {
    console.error("reference unavailable — run `npm run build`", e);
    return;
  }

  const btn = document.createElement("button");
  btn.className = "linky";
  btn.id = "fnbtn";
  btn.textContent = "Functions";
  btn.onclick = () => (panel.hidden ? open() : close());
  buttonHost.append(btn);

  panel = document.createElement("aside");
  panel.id = "fnpanel";
  panel.hidden = true;
  panel.setAttribute("aria-label", "Function reference");
  panel.innerHTML = `
    <header>
      <h2>Functions</h2>
      <button class="linky fnclose" aria-label="Close">Close</button>
    </header>
    <input type="search" placeholder="Search by name, or by what it does">
    <p class="fncount"></p>
    <div class="fnlist"></div>`;
  document.body.append(panel);

  list = panel.querySelector(".fnlist");
  input = panel.querySelector("input");
  count = panel.querySelector(".fncount");
  input.oninput = render;
  panel.querySelector(".fnclose").onclick = close;
  addEventListener("keydown", (e) => { if (e.key === "Escape" && !panel.hidden) close(); });

  render();
}

/** Limit the list to functions introduced up to this chapter. */
export function setChapter(ch) { current = ch; render(); }
