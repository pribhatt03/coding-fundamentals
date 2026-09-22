// Theme switching. Stored per browser; falls back to the system light/dark
// preference on a first visit.
//
// Themes decide for themselves whether code sits on a different surface from
// the prose. "night" puts everything on one dark surface; "paper" and "sepia"
// keep prose light and tint code slightly; "access" maximises contrast and
// uses a palette that stays distinguishable across the common forms of colour
// blindness.

const KEY = "rcourse:v1:theme";

export const THEMES = [
  { id: "paper",  label: "Paper" },
  { id: "night",  label: "Night" },
  { id: "sepia",  label: "Sepia" },
  { id: "access", label: "High contrast" },
];

function stored() {
  try { return localStorage.getItem(KEY); } catch { return null; }
}

export function current() {
  return stored() ?? (matchMedia("(prefers-color-scheme: dark)").matches ? "night" : "paper");
}

export function apply(id) {
  document.documentElement.setAttribute("data-theme", id);
  try { localStorage.setItem(KEY, id); } catch { }
}

/** Drop a theme selector into an element. */
export function mount(host) {
  const sel = document.createElement("select");
  sel.id = "theme";
  sel.title = "colour scheme";
  sel.innerHTML = THEMES.map((t) => `<option value="${t.id}">${t.label}</option>`).join("");
  sel.value = current();
  sel.onchange = () => apply(sel.value);
  host.append(sel);
  return sel;
}

// Applied immediately, before first paint, so the page never flashes the
// wrong colours.
apply(current());
