const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { crearApp } = require('../src/app');

const valida = {
  nombre: 'Laura Gómez',
  correo: 'laura.gomez@ejemplo.com',
  tipo: 'Internet',
  descripcion: 'No hay conexión a internet en el PC 12',
  prioridad: 'Alta',
};

async function levantar(dir = fs.mkdtempSync(path.join(os.tmpdir(), 'api-'))) {
  const app = crearApp({ dataDir: dir, log: () => {} });
  const server = await new Promise((ok) => {
    const s = app.listen(0, () => ok(s));
  });
  const base = `http://127.0.0.1:${server.address().port}`;
  const post = (body) =>
    fetch(`${base}/api/solicitudes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    });
  const listar = async () => (await fetch(`${base}/api/solicitudes`)).json();
  return { base, dir, post, listar, cerrar: () => new Promise((ok) => server.close(ok)) };
}

test('POST válido responde 201 con el identificador SOL-0001', async (t) => {
  const s = await levantar();
  t.after(s.cerrar);
  const r = await s.post(valida);
  assert.equal(r.status, 201);
  const body = await r.json();
  assert.equal(body.id, 'SOL-0001');
  assert.ok(body.fecha);
});

test('campo vacío responde 400 y no guarda', async (t) => {
  const s = await levantar();
  t.after(s.cerrar);
  const r = await s.post({ ...valida, nombre: '' });
  assert.equal(r.status, 400);
  assert.ok((await r.json()).errores.nombre);
  assert.equal((await s.listar()).solicitudes.length, 0);
});

test('correo inválido y descripción corta se rechazan sin guardar', async (t) => {
  const s = await levantar();
  t.after(s.cerrar);
  const r1 = await s.post({ ...valida, correo: 'laura.gomez@' });
  assert.equal(r1.status, 400);
  assert.ok((await r1.json()).errores.correo);
  const r2 = await s.post({ ...valida, descripcion: 'PC no prende' });
  assert.equal(r2.status, 400);
  assert.ok((await r2.json()).errores.descripcion);
  assert.equal((await s.listar()).solicitudes.length, 0);
});

test('tres solicitudes aparecen en la consulta, la más reciente primero y sin correo', async (t) => {
  const s = await levantar();
  t.after(s.cerrar);
  for (const nombre of ['Ana', 'Beto', 'Carla']) await s.post({ ...valida, nombre });
  const { solicitudes } = await s.listar();
  assert.deepEqual(solicitudes.map((x) => x.id), ['SOL-0003', 'SOL-0002', 'SOL-0001']);
  assert.deepEqual(Object.keys(solicitudes[0]).sort(), ['descripcion', 'fecha', 'id', 'nombre', 'prioridad', 'tipo']);
  assert.ok(!JSON.stringify(solicitudes).includes('ejemplo.com'));
});

test('los datos sobreviven a reiniciar el servidor con la misma carpeta', async () => {
  const a = await levantar();
  await a.post(valida);
  await a.cerrar();
  const b = await levantar(a.dir);
  const { solicitudes } = await b.listar();
  assert.equal(solicitudes[0].id, 'SOL-0001');
  assert.equal((await (await b.post(valida)).json()).id, 'SOL-0002');
  await b.cerrar();
});

test('JSON mal formado responde 400', async (t) => {
  const s = await levantar();
  t.after(s.cerrar);
  const r = await s.post('{malo');
  assert.equal(r.status, 400);
});

test('cuerpo mayor a 10 KB responde 413', async (t) => {
  const s = await levantar();
  t.after(s.cerrar);
  const r = await s.post({ ...valida, descripcion: 'x'.repeat(11 * 1024) });
  assert.equal(r.status, 413);
});

test('sirve las páginas de registro, consulta y salud', async (t) => {
  const s = await levantar();
  t.after(s.cerrar);
  assert.equal((await fetch(`${s.base}/`)).status, 200);
  assert.equal((await fetch(`${s.base}/consulta`)).status, 200);
  const salud = await (await fetch(`${s.base}/salud`)).json();
  assert.equal(salud.estado, 'ok');
});

test('ruta inexistente de la API responde 404 JSON', async (t) => {
  const s = await levantar();
  t.after(s.cerrar);
  const r = await fetch(`${s.base}/api/nada`);
  assert.equal(r.status, 404);
});
