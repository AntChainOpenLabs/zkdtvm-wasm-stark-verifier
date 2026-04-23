import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT) || 8788;

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'text/javascript; charset=utf-8',
  '.mjs':  'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.wasm': 'application/wasm',
  '.bin':  'application/octet-stream',
};

function safePath(urlPath) {
  const rel = decodeURIComponent(urlPath.split('?')[0]).replace(/^\/+/, '');
  if (!rel || rel.includes('..')) return null;
  return path.join(root, rel);
}

http
  .createServer((req, res) => {
    if (req.url === '/' || req.url === '/index.html') {
      const filePath = path.join(root, 'demo', 'app.html');
      fs.readFile(filePath, (err, buf) => {
        if (err) { res.writeHead(500); res.end('missing demo/app.html'); return; }
        res.writeHead(200, { 'Content-Type': mime['.html'] });
        res.end(buf);
      });
      return;
    }

    const filePath = safePath(req.url);
    if (!filePath) { res.writeHead(400); res.end('bad path'); return; }

    fs.readFile(filePath, (err, buf) => {
      if (err) { res.writeHead(404); res.end('not found'); return; }
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { 'Content-Type': mime[ext] || 'application/octet-stream' });
      res.end(buf);
    });
  })
  .listen(port, () => {
    console.log(`http://127.0.0.1:${port}/  (project root: ${root})`);
  });
