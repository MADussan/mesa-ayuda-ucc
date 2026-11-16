const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { crearAlmacen } = require('../src/store');

const datos = {
  nombre: 'Laura Gómez',
  correo: 'laura.gomez@ejemplo.com',
  tipo: 'Internet',
  descripcion: 'No hay conexión a internet en el PC 12',
  prioridad: 'Alta',
};

function carpetaTemporal() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'mesa-'));
}

test('crea la carpeta y el archivo si no existen', async () => {
  const dir = path.join(carpetaTemporal(), 'no-existe');
  const almacen = crearAlmacen(dir);
  assert.deepEqual(await almacen.listar(), []);
  await almacen.guardar(datos);
  assert.ok(fs.existsSync(path.join(dir, 'solicitudes.json')));
});

test('asigna SOL-0001 y fecha ISO del servidor', async () => {
  const dir = carpetaTemporal();
  const almacen = crearAlmacen(dir);
  const s = await almacen.guardar({ ...datos, fecha: '1999-01-01' });
  assert.equal(s.id, 'SOL-0001');
  assert.ok(!Number.isNaN(Date.parse(s.fecha)));
  assert.notEqual(s.fecha, '1999-01-01');
  const enDisco = JSON.parse(fs.readFileSync(path.join(dir, 'solicitudes.json'), 'utf8'));
  assert.equal(enDisco.length, 1);
  assert.equal(enDisco[0].id, 'SOL-0001');
});

test('lista de la más reciente a la más antigua', async () => {
  const almacen = crearAlmacen(carpetaTemporal());
  await almacen.guardar(datos);
  await almacen.guardar(datos);
  await almacen.guardar(datos);
  const ids = (await almacen.listar()).map((s) => s.id);
  assert.deepEqual(ids, ['SOL-0003', 'SOL-0002', 'SOL-0001']);
});

test('persiste entre instancias con la misma carpeta', async () => {
  const dir = carpetaTemporal();
  await crearAlmacen(dir).guardar(datos);
  const otra = crearAlmacen(dir);
  assert.equal((await otra.listar())[0].id, 'SOL-0001');
  assert.equal((await otra.guardar(datos)).id, 'SOL-0002');
});

test('respalda un archivo corrupto y sigue funcionando', async () => {
  const dir = carpetaTemporal();
  fs.writeFileSync(path.join(dir, 'solicitudes.json'), '{roto');
  const almacen = crearAlmacen(dir);
  const s = await almacen.guardar(datos);
  assert.equal(s.id, 'SOL-0001');
  const respaldos = fs.readdirSync(dir).filter((f) => f.startsWith('solicitudes.corrupto-'));
  assert.equal(respaldos.length, 1);
  assert.equal(fs.readFileSync(path.join(dir, respaldos[0]), 'utf8'), '{roto');
});

test('10 guardados simultáneos producen ids únicos', async () => {
  const almacen = crearAlmacen(carpetaTemporal());
  const res = await Promise.all(Array.from({ length: 10 }, () => almacen.guardar(datos)));
  const ids = res.map((s) => s.id).sort();
  assert.deepEqual(ids, Array.from({ length: 10 }, (_, i) => `SOL-${String(i + 1).padStart(4, '0')}`));
  assert.equal((await almacen.listar()).length, 10);
});
