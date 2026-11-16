'use strict';

(() => {
  const filas = document.getElementById('filas');
  const total = document.getElementById('total');
  const marco = document.getElementById('marco');
  const vacio = document.getElementById('vacio');
  const fallo = document.getElementById('fallo');
  const actualizar = document.getElementById('actualizar');
  const ICONOS = { Equipo: 'i-equipo', Internet: 'i-internet', Software: 'i-software', Otro: 'i-otro' };
  const esqueleto = filas.innerHTML;

  const formatoFecha = new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/Bogota',
  });

  // Todo el texto del usuario entra con textContent: nunca se interpreta como HTML.
  function celda(clase, texto) {
    const td = document.createElement('td');
    td.className = clase;
    if (texto !== undefined) td.textContent = texto;
    return td;
  }

  function svg(id) {
    const ns = 'http://www.w3.org/2000/svg';
    const s = document.createElementNS(ns, 'svg');
    s.setAttribute('class', 'icono');
    s.setAttribute('aria-hidden', 'true');
    const use = document.createElementNS(ns, 'use');
    use.setAttribute('href', `#${id}`);
    s.append(use);
    return s;
  }

  function fila(s) {
    const tr = document.createElement('tr');
    const fecha = new Date(s.fecha);

    const tdFecha = celda('col-fecha');
    const time = document.createElement('time');
    time.dateTime = s.fecha;
    time.textContent = formatoFecha.format(fecha);
    tdFecha.append(time);

    const tdTipo = celda('col-tipo');
    const tipo = document.createElement('span');
    tipo.className = 'etiqueta-tipo';
    tipo.append(svg(ICONOS[s.tipo] || 'i-otro'), document.createTextNode(s.tipo));
    tdTipo.append(tipo);

    const tdPrioridad = celda('col-prioridad');
    const prioridad = document.createElement('span');
    prioridad.className = 'prioridad';
    const punto = document.createElement('i');
    punto.className = `punto punto--${['Alta', 'Media', 'Baja'].includes(s.prioridad) ? s.prioridad : 'Baja'}`;
    prioridad.append(punto, document.createTextNode(s.prioridad));
    tdPrioridad.append(prioridad);

    tr.append(
      celda('col-id', s.id),
      tdFecha,
      celda('col-nombre', s.nombre),
      tdTipo,
      tdPrioridad,
      celda('col-descripcion', s.descripcion),
    );
    return tr;
  }

  async function cargar() {
    actualizar.disabled = true;
    actualizar.setAttribute('aria-busy', 'true');
    fallo.hidden = true;
    try {
      const r = await fetch('/api/solicitudes', { cache: 'no-store' });
      if (!r.ok) throw new Error(String(r.status));
      const { solicitudes } = await r.json();
      filas.textContent = '';
      if (!solicitudes.length) {
        marco.hidden = true;
        vacio.hidden = false;
        total.textContent = 'No hay solicitudes registradas.';
        return;
      }
      vacio.hidden = true;
      marco.hidden = false;
      filas.append(...solicitudes.map(fila));
      total.textContent =
        solicitudes.length === 1
          ? '1 solicitud, la más reciente primero.'
          : `${solicitudes.length} solicitudes, de la más reciente a la más antigua.`;
    } catch {
      marco.hidden = true;
      vacio.hidden = true;
      fallo.hidden = false;
      total.textContent = 'Sin datos.';
    } finally {
      actualizar.disabled = false;
      actualizar.setAttribute('aria-busy', 'false');
    }
  }

  function recargar() {
    if (!marco.hidden && filas.querySelector('.esqueleto') === null && filas.children.length === 0) {
      filas.innerHTML = esqueleto;
    }
    cargar();
  }

  actualizar.addEventListener('click', recargar);
  document.getElementById('reintentar').addEventListener('click', () => {
    marco.hidden = false;
    filas.innerHTML = esqueleto;
    cargar();
  });

  cargar();
})();
