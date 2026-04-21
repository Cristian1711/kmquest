// Simple HTTP server for KM Quest development
// Run: node serve.js
// Then open http://YOUR_LOCAL_IP:3000 in Safari on iPhone

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = 3000;
const STATIC_DIR = path.join(__dirname, 'src');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

const server = http.createServer((req, res) => {
  let filePath = path.join(STATIC_DIR, req.url === '/' ? '/index.html' : req.url.split('?')[0]);

  if (!fs.existsSync(filePath)) {
    // SPA fallback
    filePath = path.join(STATIC_DIR, 'index.html');
  }

  const ext = path.extname(filePath);
  const contentType = MIME[ext] || 'application/octet-stream';

  // Required headers for PWA Service Worker
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Service-Worker-Allowed', '/');
  if (ext === '.js') res.setHeader('Content-Type', 'application/javascript');

  try {
    const data = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  // Print local network IP
  const nets = os.networkInterfaces();
  let localIP = 'localhost';
  for (const name of Object.values(nets)) {
    for (const net of name) {
      if (net.family === 'IPv4' && !net.internal) { localIP = net.address; break; }
    }
  }

  console.log('\n🏃 KM Quest server running!');
  console.log(`\n📱 En tu iPhone (Safari): http://${localIP}:${PORT}`);
  console.log(`💻 En este PC: http://localhost:${PORT}`);
  console.log('\nAsegúrate de que tu iPhone y PC estén en la misma red WiFi.');
  console.log('En Safari → Compartir → "Añadir a pantalla de inicio" para instalar como app.\n');
});
