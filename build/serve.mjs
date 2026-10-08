// Local dev server with the headers webR needs. `npm run dev`
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const TYPES = { ".html": "text/html", ".js": "text/javascript", ".json": "application/json",
                ".css": "text/css", ".wasm": "application/wasm" };

// The written-answer grader only exists on Netlify, where the API key lives.
// Locally, pass grading requests through to the live site, so written
// answers can be tested on your own machine. Nothing is stored either way.
const LIVE = process.env.LIVE_SITE ?? "https://stellar-paprenjak-4e1479.netlify.app";

async function proxy(req, res) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  try {
    const up = await fetch(LIVE + req.url, {
      method: req.method,
      headers: { "content-type": req.headers["content-type"] ?? "application/json" },
      body: req.method === "POST" ? Buffer.concat(chunks) : undefined,
    });
    res.writeHead(up.status, { "Content-Type": up.headers.get("content-type") ?? "application/json" });
    res.end(Buffer.from(await up.arrayBuffer()));
  } catch (e) {
    res.writeHead(502, { "Content-Type": "application/json" })
       .end(JSON.stringify({ error: `couldn't reach ${LIVE}: ${e.message}` }));
  }
}

createServer(async (req, res) => {
  if (req.url.startsWith("/.netlify/functions/")) return proxy(req, res);
  const p = normalize(decodeURIComponent(new URL(req.url, "http://x").pathname));
  const file = join("web", p === "/" ? "index.html" : p);
  try {
    const body = await readFile(file);
    res.writeHead(200, {
      "Content-Type": TYPES[extname(file)] ?? "application/octet-stream",
      // Without both of these, crossOriginIsolated is false and webR silently
      // drops to a slower channel with no interrupt support.
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    });
    res.end(body);
  } catch {
    res.writeHead(404).end("not found");
  }
}).listen(8080, () => {
  console.log("http://localhost:8080  (cross-origin isolated)");
  console.log(`written answers are graded by ${LIVE}`);
});
