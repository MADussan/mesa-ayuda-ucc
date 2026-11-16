'use strict';

const path = require('node:path');
const { crearApp } = require('./src/app');

const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');

const app = crearApp({ dataDir: DATA_DIR });

const server = app.listen(PORT, () => {
  console.log(`Mesa de ayuda escuchando en el puerto ${PORT}`);
  console.log(`Datos en ${path.join(DATA_DIR, 'solicitudes.json')}`);
});

// Docker envía SIGTERM al detener el contenedor: cerramos ordenadamente.
for (const senal of ['SIGTERM', 'SIGINT']) {
  process.on(senal, () => {
    console.log(`Recibido ${senal}, cerrando servidor...`);
    server.close(() => process.exit(0));
  });
}
