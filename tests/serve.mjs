// Minimal static server for local use and tests: node tests/serve.mjs [port]
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = fileURLToPath(new URL('../public/', import.meta.url));
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8' };
export function serve(port = 8080) {
  const srv = http.createServer(async (req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html';
    const file = normalize(join(ROOT, p)); if (!file.startsWith(ROOT)) { res.writeHead(403).end(); return; }
    try { const body = await readFile(file); res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream' }).end(body); }
    catch { res.writeHead(404).end('Not found'); }
  });
  return new Promise(r => srv.listen(port, () => r(srv)));
}
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const port = +process.argv[2] || 8080; await serve(port); console.log(`TTLO running at http://localhost:${port}`);
}
