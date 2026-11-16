'use strict';

// Reglas del formulario. Este archivo es la fuente de verdad: el navegador
// repite las mismas reglas solo para avisar antes de enviar.
const TIPOS = ['Equipo', 'Internet', 'Software', 'Otro'];
const PRIORIDADES = ['Baja', 'Media', 'Alta'];
const MAX_NOMBRE = 100;
const MAX_CORREO = 254;
const MIN_DESCRIPCION = 15;
const MAX_DESCRIPCION = 1000;
const CORREO_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function texto(valor) {
  return typeof valor === 'string' ? valor.trim() : '';
}

function validarSolicitud(entrada = {}) {
  const datos = {
    nombre: texto(entrada.nombre),
    correo: texto(entrada.correo).toLowerCase(),
    tipo: texto(entrada.tipo),
    descripcion: texto(entrada.descripcion),
    prioridad: texto(entrada.prioridad),
  };
  const errores = {};

  if (!datos.nombre) errores.nombre = 'Escribe el nombre de quien reporta.';
  else if (datos.nombre.length > MAX_NOMBRE) errores.nombre = `Máximo ${MAX_NOMBRE} caracteres.`;

  if (!datos.correo) errores.correo = 'Escribe un correo electrónico.';
  else if (datos.correo.length > MAX_CORREO || !CORREO_RE.test(datos.correo)) {
    errores.correo = 'El correo no es válido. Ejemplo: nombre@dominio.com';
  }

  if (!TIPOS.includes(datos.tipo)) errores.tipo = 'Elige el tipo de problema.';

  if (!datos.descripcion) errores.descripcion = 'Describe la falla.';
  else if (datos.descripcion.length < MIN_DESCRIPCION) {
    errores.descripcion = `Escribe al menos ${MIN_DESCRIPCION} caracteres (llevas ${datos.descripcion.length}).`;
  } else if (datos.descripcion.length > MAX_DESCRIPCION) {
    errores.descripcion = `Máximo ${MAX_DESCRIPCION} caracteres.`;
  }

  if (!PRIORIDADES.includes(datos.prioridad)) errores.prioridad = 'Elige la prioridad.';

  const ok = Object.keys(errores).length === 0;
  return ok ? { ok, datos, errores } : { ok, errores };
}

module.exports = { validarSolicitud, TIPOS, PRIORIDADES, MIN_DESCRIPCION };
