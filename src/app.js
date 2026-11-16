'use strict';

const path = require('node:path');
const express = require('express');
const { validarSolicitud } = require('./validation');
const { crearAlmacen } = require('./store');

const PUBLICO = path.join(__dirname, '..', 'public');

function crearApp({ dataDir, log = console.log } = {}) {
  const almacen = crearAlmacen(dataDir);
  const app = express();

  app.disable('x-powered-by');
  app.use((req, res, next) => {
    res.set({
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'same-origin',
      'Content-Security-Policy':
        "default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; font-src 'self'; frame-ancestors 'none'",
    });
    next();
  });
  app.use(express.json({ limit: '10kb' }));

  app.get('/salud', (req, res) => res.json({ estado: 'ok' }));

  app.get('/api/solicitudes', async (req, res, next) => {
    try {
      // El correo no se publica: la consulta es pública.
      const solicitudes = (await almacen.listar()).map(({ correo, ...resto }) => resto);
      res.json({ total: solicitudes.length, solicitudes });
    } catch (err) {
      next(err);
    }
  });

  app.post('/api/solicitudes', async (req, res, next) => {
    try {
      const resultado = validarSolicitud(req.body || {});
      if (!resultado.ok) {
        log(`[rechazada] campos con error: ${Object.keys(resultado.errores).join(', ')}`);
        return res.status(400).json({ mensaje: 'Revisa los campos marcados.', errores: resultado.errores });
      }
      const s = await almacen.guardar(resultado.datos);
      log(`[guardada] ${s.id} tipo=${s.tipo} prioridad=${s.prioridad}`);
      res.status(201).json({ id: s.id, fecha: s.fecha });
    } catch (err) {
      next(err);
    }
  });

  app.use('/api', (req, res) => res.status(404).json({ mensaje: 'Ruta no encontrada.' }));

  app.get('/consulta', (req, res) => res.sendFile(path.join(PUBLICO, 'consulta.html')));
  app.use(express.static(PUBLICO, { extensions: ['html'] }));

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err.type === 'entity.too.large') {
      return res.status(413).json({ mensaje: 'La solicitud es demasiado grande.' });
    }
    if (err.type === 'entity.parse.failed') {
      return res.status(400).json({ mensaje: 'Los datos enviados no son JSON válido.' });
    }
    console.error('[error]', err);
    res.status(500).json({ mensaje: 'No se pudo completar la operación. Intenta de nuevo.' });
  });

  return app;
}

module.exports = { crearApp };
