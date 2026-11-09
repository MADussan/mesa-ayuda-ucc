const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'solicitudes.json');
const PUBLIC_DIR = path.join(__dirname, 'public');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]', 'utf-8');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8'
};

const server = http.createServer((req, res) => {
  if (req.url === '/api/solicitudes' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    return res.end(fs.readFileSync(DATA_FILE, 'utf-8'));
  }
  if (req.url === '/api/solicitudes' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const item = JSON.parse(body);
        const lista = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
        lista.unshift(item);
        fs.writeFileSync(DATA_FILE, JSON.stringify(lista, null, 2), 'utf-8');
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(item));
      } catch (e) {
        res.writeHead(400);
        res.end('Error');
      }
    });
    return;
  }
  const safePath = req.url === '/' ? '/index.html' : req.url.split('?')[0];
  const filePath = path.join(PUBLIC_DIR, safePath);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    res.writeHead(200, { 'Content-Type': MIME_TYPES[path.extname(filePath)] || 'text/plain' });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404);
    res.end('404 No encontrado');
  }
});

server.listen(PORT, () => console.log('Servidor corriendo en el puerto ' + PORT));
