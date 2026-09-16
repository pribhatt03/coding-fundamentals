// Local dev server with the headers webR needs. `npm run dev`
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const TYPES = { ".html": "text/html", ".js": "text/javascript", ".json": "application/json",
                ".css": "text/css", ".wasm": "application/wasm" };

createServer(async (req, res) => {
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
}).listen(8080, () => console.log("http://localhost:8080  (cross-origin isolated)"));
