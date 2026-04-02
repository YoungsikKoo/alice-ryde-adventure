// server-qa.js — Simple local QA server
// Uses only Node.js built-in modules (no npm install needed!)
// Run: node server-qa.js
// Open: http://localhost:3000

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const PUBLIC = path.join(__dirname, 'public');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.mp3':  'audio/mpeg',
  '.wav':  'audio/wav',
  '.ico':  'image/x-icon'
};

const server = http.createServer((req, res) => {
  // Clean URL
  let urlPath = req.url.split('?')[0];
  if (urlPath === '/') urlPath = '/index.html';

  const filePath = path.join(PUBLIC, urlPath);
  const ext = path.extname(filePath);
  const mime = MIME[ext] || 'application/octet-stream';

  // Security: prevent directory traversal
  if (!filePath.startsWith(PUBLIC)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404);
        res.end('Not found: ' + urlPath);
      } else {
        res.writeHead(500);
        res.end('Server error');
      }
      return;
    }

    res.writeHead(200, {
      'Content-Type': mime,
      'Cache-Control': 'no-cache'  // No caching during QA
    });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log('');
  console.log('  ╔══════════════════════════════════════╗');
  console.log('  ║  🎮 Alice\'s Ryde Adventure — QA      ║');
  console.log('  ╠══════════════════════════════════════╣');
  console.log('  ║                                      ║');
  console.log('  ║  Open: http://localhost:' + PORT + '          ║');
  console.log('  ║                                      ║');
  console.log('  ║  WASD = Move                         ║');
  console.log('  ║  SPACE = Attack                      ║');
  console.log('  ║  E = Interact / Talk                 ║');
  console.log('  ║                                      ║');
  console.log('  ║  Press Ctrl+C to stop server         ║');
  console.log('  ╚══════════════════════════════════════╝');
  console.log('');
});