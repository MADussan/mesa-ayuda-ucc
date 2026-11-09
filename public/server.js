const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'solicitudes.json');
const PUBLIC_DIR = path.join(__dirname, 'public');

// Asegurar carpeta y archivo JSON con 3 solicitudes ficticias iniciales
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(DATA_FILE)) {
  const iniciales = [
    {
      id: 'SOL-1001',
      nombre: 'Laura Sofía Perdomo',
      correo: 'laura.perdomo@campusucc.edu.co',
      tipo: 'Equipo',
      descripcion: 'El computador PC-12 del laboratorio 3 no reconoce el monitor ni los periféricos USB.',
      prioridad: 'Alta',
      fecha: '08/11/2026, 08:30:15'
    },
    {
      id: 'SOL-1002',
      nombre: 'Diego Fernando Rojas',
      correo: 'diego.rojas@campusucc.edu.co',
      tipo: 'Internet',
      descripcion: 'Intermitencia constante en la red cableada de la fila B durante la práctica de contenedores.',
      prioridad: 'Media',
      fecha: '08/11/2026, 09:15:42'
    },
    {
      id: 'SOL-1003',
      nombre: 'Valentina Ortiz Polanía',
      correo: 'valentina.ortiz@campusucc.edu.co',
      tipo: 'Software',
      descripcion: 'Se requiere actualización del entorno ProjectLibre y configuración de variables de Java en el PC-04.',
      prioridad: 'Baja',
      fecha: '08/11/2026, 10:05:19'
    }
  ];
  fs.writeFileSync(DATA_FILE, JSON.stringify(iniciales, null, 2), 'utf-8');
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8'
};

const server = http.createServer((req, res) => {
  // Endpoint GET /api/solicitudes
  if (req.url === '/api/solicitudes' && req.method === 'GET') {
    const contenido = fs.readFileSync(DATA_FILE, 'utf-8');
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    return res.end(contenido);
  }

  // Endpoint POST /api/solicitudes
  if (req.url === '/api/solicitudes' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      try {
        const recibida = JSON.parse(body);
        const lista = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));

        const nueva = {
          id: `SOL-${1000 + lista.length + 1}`,
          nombre: String(recibida.nombre || '').trim(),
          correo: String(recibida.correo || '').trim(),
          tipo: String(recibida.tipo || '').trim(),
          descripcion: String(recibida.descripcion || '').trim(),
          prioridad: String(recibida.prioridad || '').trim(),
          fecha: new Date().toLocaleString('es-CO', { hour12: false })
        };

        lista.unshift(nueva);
        fs.writeFileSync(DATA_FILE, JSON.stringify(lista, null, 2), 'utf-8');
        console.log(`[REGISTRO] Ticket guardado: ${nueva.id} - ${nueva.nombre}`);

        res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(nueva));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: 'Formato inválido' }));
      }
    });
    return;
  }

  // Servir archivos estáticos (index.html, styles.css, app.js)
  const safePath = req.url === '/' ? '/index.html' : req.url.split('?')[0];
  const filePath = path.join(PUBLIC_DIR, safePath);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'text/plain' });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404 - Recurso no encontrado');
  }
});

server.listen(PORT, () => {
  console.log(`Servidor de Mesa de Ayuda activo en http://localhost:${PORT}`);
});