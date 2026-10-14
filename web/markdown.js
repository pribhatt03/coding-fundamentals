// Markdown for prose, feedback and prompts. No imports, so any page can use it
// without loading the R engine.

export function esc(s) {
  return String(s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
}

// Small on purpose. The real site pre-renders markdown at build time; this is
// here so you can see your prose while writing it.
// Function names get the same colour everywhere: editors, the Functions
// panel, and inline code in prose and feedback. A name followed by "(" is a
// call, so that's what gets marked.
export const colourCalls = (html) =>
  html.replace(/(^|[^\w.])([A-Za-z.][A-Za-z0-9._]*)(?=\()/g, '$1<span class="fncall">$2</span>');

export function md(src = "") {
  const blocks = [];
  const langs = [];
  let s = esc(src).replace(/```(rtry|r)?\n([\s\S]*?)```/g, (_, lang, c) => {
    blocks.push(c.replace(/\n$/, ""));
    langs.push(lang || "");
    return `\u0000${blocks.length - 1}\u0000`;
  });

  s = s.replace(/`([^`\n]+)`/g, (_, c) => `<code>${colourCalls(c)}</code>`)
       // Links are allowed only to the course's own pages — never to other sites.
       .replace(/\[([^\]\n]+)\]\(((?:testout|chapter)\.html\?[\w=.-]+)\)/g, '<a href="$2">$1</a>')
       .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
       .replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>");

  const html = s.split(/\n\n+/).map((p) => {
    p = p.trim();
    if (!p) return "";
    if (/^\u0000\d+\u0000$/.test(p)) return p;
    if (/^### /.test(p)) return `<h3>${p.slice(4)}</h3>`;
    if (/^## /.test(p)) return `<h2>${p.slice(3)}</h2>`;
    if (/^# /.test(p)) return `<h1>${p.slice(2)}</h1>`;
    // A list: every line starts a bullet or continues the one above it. An
    // indented line is a continuation, so a long bullet can wrap.
    const lines = p.split("\n");
    // Numbered list, same rules: "1. ", "2. " … with indented continuations.
    if (/^\d+\. /.test(lines[0].trim()) &&
        lines.every((l) => /^\d+\. /.test(l.trim()) || /^\s+\S/.test(l))) {
      const items = [];
      for (const l of lines) {
        if (/^\d+\. /.test(l.trim())) items.push(l.trim().replace(/^\d+\. /, ""));
        else items[items.length - 1] += " " + l.trim();
      }
      return `<ol>${items.map((i) => `<li>${i}</li>`).join("")}</ol>`;
    }
    if (/^[-*] /.test(lines[0].trim()) &&
        lines.every((l) => /^[-*] /.test(l.trim()) || /^\s+\S/.test(l))) {
      const items = [];
      for (const l of lines) {
        if (/^[-*] /.test(l.trim())) items.push(l.trim().slice(2));
        else items[items.length - 1] += " " + l.trim();
      }
      return `<ul>${items.map((i) => `<li>${i}</li>`).join("")}</ul>`;
    }
    return `<p>${p.replace(/\n/g, " ")}</p>`;
  }).join("");

  return html.replace(/\u0000(\d+)\u0000/g, (_, i) =>
    `<pre${langs[i] === "rtry" ? ' class="runnable try"' : langs[i] === "r" ? ' class="runnable"' : ""}><code>${langs[i] ? colourCalls(blocks[i]) : blocks[i]}</code></pre>`);
}

export const inline = (s) => md(s).replace(/^<p>|<\/p>$/g, "");

