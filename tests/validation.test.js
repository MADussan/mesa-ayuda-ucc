const test = require('node:test');
const assert = require('node:assert/strict');
const { validarSolicitud } = require('../src/validation');

const valida = {
  nombre: 'Laura Gómez',
  correo: 'laura.gomez@ejemplo.com',
  tipo: 'Internet',
  descripcion: 'No hay conexión a internet en el PC 12',
  prioridad: 'Alta',
};

test('acepta una solicitud válida y devuelve los datos limpios', () => {
  const r = validarSolicitud({ ...valida, nombre: '  Laura Gómez  ' });
  assert.equal(r.ok, true);
  assert.equal(r.datos.nombre, 'Laura Gómez');
});

test('rechaza nombre vacío', () => {
  const r = validarSolicitud({ ...valida, nombre: '' });
  assert.equal(r.ok, false);
  assert.ok(r.errores.nombre);
});

test('rechaza nombre con solo espacios', () => {
  const r = validarSolicitud({ ...valida, nombre: '   ' });
  assert.equal(r.ok, false);
  assert.ok(r.errores.nombre);
});

test('rechaza correo con formato inválido', () => {
  for (const correo of ['laura.gomez@', 'laura', '@ejemplo.com', 'a@b', 'a b@c.com', '']) {
    const r = validarSolicitud({ ...valida, correo });
    assert.equal(r.ok, false, `debió rechazar "${correo}"`);
    assert.ok(r.errores.correo);
  }
});

test('rechaza descripción de 14 caracteres y acepta 15', () => {
  const corta = validarSolicitud({ ...valida, descripcion: 'Falla en red 0' });
  assert.equal(corta.ok, false);
  assert.ok(corta.errores.descripcion);
  const justa = validarSolicitud({ ...valida, descripcion: 'Falla en red 01' });
  assert.equal(justa.ok, true);
});

test('rechaza descripción corta "PC no prende"', () => {
  const r = validarSolicitud({ ...valida, descripcion: 'PC no prende' });
  assert.equal(r.ok, false);
  assert.ok(r.errores.descripcion);
});

test('rechaza tipo fuera de la lista', () => {
  const r = validarSolicitud({ ...valida, tipo: 'Hardware' });
  assert.equal(r.ok, false);
  assert.ok(r.errores.tipo);
});

test('rechaza prioridad fuera de la lista', () => {
  const r = validarSolicitud({ ...valida, prioridad: 'Urgente' });
  assert.equal(r.ok, false);
  assert.ok(r.errores.prioridad);
});

test('rechaza textos demasiado largos', () => {
  assert.ok(validarSolicitud({ ...valida, nombre: 'a'.repeat(101) }).errores.nombre);
  assert.ok(validarSolicitud({ ...valida, descripcion: 'a'.repeat(1001) }).errores.descripcion);
});

test('reporta todos los campos con error a la vez', () => {
  const r = validarSolicitud({});
  assert.deepEqual(Object.keys(r.errores).sort(), ['correo', 'descripcion', 'nombre', 'prioridad', 'tipo']);
});

test('ignora valores que no son texto', () => {
  const r = validarSolicitud({ ...valida, nombre: { $ne: 1 } });
  assert.equal(r.ok, false);
  assert.ok(r.errores.nombre);
});
