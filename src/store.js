'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');

const ARCHIVO = 'solicitudes.json';

// Almacén en archivo JSON. Todas las operaciones pasan por una cola para que
// dos registros simultáneos no obtengan el mismo identificador ni se pisen.
function crearAlmacen(carpeta) {
  const archivo = path.join(carpeta, ARCHIVO);
  let cola = Promise.resolve();

  function enCola(tarea) {
    const resultado = cola.then(tarea);
    cola = resultado.catch(() => {});
    return resultado;
  }

  async function leer() {
    await fs.mkdir(carpeta, { recursive: true });
    let contenido;
    try {
      contenido = await fs.readFile(archivo, 'utf8');
    } catch (err) {
      if (err.code === 'ENOENT') return [];
      throw err;
    }
    try {
      const lista = JSON.parse(contenido);
      if (!Array.isArray(lista)) throw new Error('el archivo no contiene una lista');
      return lista;
    } catch (err) {
      const respaldo = path.join(carpeta, `solicitudes.corrupto-${Date.now()}.json`);
      await fs.rename(archivo, respaldo);
      console.error(`[almacen] ${ARCHIVO} dañado (${err.message}); respaldado en ${path.basename(respaldo)}`);
      return [];
    }
  }

  async function escribir(lista) {
    // Escritura atómica: si el proceso muere a mitad, el archivo original queda intacto.
    const temporal = `${archivo}.${process.pid}.tmp`;
    await fs.writeFile(temporal, JSON.stringify(lista, null, 2));
    await fs.rename(temporal, archivo);
  }

  function siguienteId(lista) {
    const max = lista.reduce((m, s) => Math.max(m, Number(String(s.id).replace('SOL-', '')) || 0), 0);
    return `SOL-${String(max + 1).padStart(4, '0')}`;
  }

  return {
    archivo,
    listar: () => enCola(async () => (await leer()).slice().reverse()),
    guardar: (datos) =>
      enCola(async () => {
        const lista = await leer();
        const solicitud = {
          id: siguienteId(lista),
          nombre: datos.nombre,
          correo: datos.correo,
          tipo: datos.tipo,
          descripcion: datos.descripcion,
          prioridad: datos.prioridad,
          fecha: new Date().toISOString(),
        };
        lista.push(solicitud);
        await escribir(lista);
        return solicitud;
      }),
  };
}

module.exports = { crearAlmacen };
