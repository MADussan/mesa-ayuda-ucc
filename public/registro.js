'use strict';

(() => {
  const MIN_DESCRIPCION = 15;
  const CORREO_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const ETIQUETAS = {
    nombre: 'Nombre del solicitante',
    correo: 'Correo electrónico',
    tipo: 'Tipo de problema',
    descripcion: 'Descripción',
    prioridad: 'Prioridad',
  };

  const form = document.getElementById('formulario');
  const enviar = document.getElementById('enviar');
  const resumen = document.getElementById('resumen');
  const resumenTitulo = document.getElementById('resumen-titulo');
  const resumenLista = document.getElementById('resumen-lista');
  const descripcion = document.getElementById('descripcion');
  const contador = document.getElementById('contador');
  const confirmacion = document.getElementById('confirmacion');
  const intentado = { valor: false };

  function datosFormulario() {
    const fd = new FormData(form);
    return {
      nombre: (fd.get('nombre') || '').toString(),
      correo: (fd.get('correo') || '').toString(),
      tipo: (fd.get('tipo') || '').toString(),
      descripcion: (fd.get('descripcion') || '').toString(),
      prioridad: (fd.get('prioridad') || '').toString(),
    };
  }

  // Mismas reglas que el servidor; el servidor sigue siendo quien decide.
  function validar(d) {
    const e = {};
    const nombre = d.nombre.trim();
    const correo = d.correo.trim();
    const desc = d.descripcion.trim();
    if (!nombre) e.nombre = 'Escribe el nombre de quien reporta.';
    if (!correo) e.correo = 'Escribe un correo electrónico.';
    else if (!CORREO_RE.test(correo)) e.correo = 'El correo no es válido. Ejemplo: nombre@dominio.com';
    if (!d.tipo) e.tipo = 'Elige el tipo de problema.';
    if (!desc) e.descripcion = 'Describe la falla.';
    else if (desc.length < MIN_DESCRIPCION) {
      e.descripcion = `Escribe al menos ${MIN_DESCRIPCION} caracteres (llevas ${desc.length}).`;
    }
    if (!d.prioridad) e.prioridad = 'Elige la prioridad.';
    return e;
  }

  function icono(id) {
    return `<svg class="icono" aria-hidden="true"><use href="#${id}" /></svg>`;
  }

  function pintarErrores(errores) {
    for (const campo of Object.keys(ETIQUETAS)) {
      const caja = document.getElementById(`error-${campo}`);
      const msg = errores[campo];
      caja.textContent = '';
      if (msg) {
        caja.insertAdjacentHTML('afterbegin', icono('i-alerta'));
        caja.append(document.createTextNode(msg));
      }
      const control = document.getElementById(campo);
      if (campo === 'tipo' || campo === 'prioridad') {
        document.getElementById(`campo-${campo}`).dataset.invalido = String(Boolean(msg));
      } else {
        control.setAttribute('aria-invalid', String(Boolean(msg)));
      }
    }
  }

  function pintarResumen(errores, titulo) {
    const campos = Object.keys(errores);
    resumenLista.textContent = '';
    if (!campos.length && !titulo) {
      resumen.hidden = true;
      return;
    }
    resumenTitulo.textContent = titulo || (campos.length === 1 ? 'Revisa 1 campo.' : `Revisa ${campos.length} campos.`);
    for (const campo of campos) {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = `#${campo}`;
      a.textContent = ETIQUETAS[campo];
      a.addEventListener('click', (ev) => {
        ev.preventDefault();
        document.getElementById(campo).focus();
      });
      li.append(a);
      resumenLista.append(li);
    }
    resumen.hidden = false;
  }

  function actualizarContador() {
    const n = descripcion.value.trim().length;
    contador.dataset.estado = n >= MIN_DESCRIPCION ? 'ok' : '';
    contador.textContent = n >= MIN_DESCRIPCION ? `${n} caracteres` : `${n} caracteres · mínimo ${MIN_DESCRIPCION}`;
  }

  function ocupado(si) {
    enviar.disabled = si;
    enviar.setAttribute('aria-busy', String(si));
    enviar.innerHTML = si ? `${icono('i-cargando')}Registrando…` : 'Registrar solicitud';
  }

  const formatoFecha = new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'America/Bogota',
  });

  function mostrarConfirmacion(id, fecha) {
    document.getElementById('confirmacion-id').textContent = id;
    document.getElementById('confirmacion-detalle').textContent =
      `Guarda este número: con él puedes encontrar tu caso en la consulta. Fecha de registro: ${formatoFecha.format(new Date(fecha))}`;
    form.hidden = true;
    confirmacion.hidden = false;
    confirmacion.focus();
  }

  form.addEventListener('input', (ev) => {
    if (ev.target === descripcion) actualizarContador();
    if (intentado.valor) {
      const errores = validar(datosFormulario());
      pintarErrores(errores);
      if (!Object.keys(errores).length) resumen.hidden = true;
    }
  });

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    intentado.valor = true;
    const datos = datosFormulario();
    const errores = validar(datos);
    pintarErrores(errores);
    if (Object.keys(errores).length) {
      pintarResumen(errores);
      resumen.focus();
      return;
    }
    resumen.hidden = true;
    ocupado(true);
    try {
      const r = await fetch('/api/solicitudes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos),
      });
      const cuerpo = await r.json().catch(() => ({}));
      if (r.status === 201) {
        mostrarConfirmacion(cuerpo.id, cuerpo.fecha);
        return;
      }
      if (r.status === 400 && cuerpo.errores) {
        pintarErrores(cuerpo.errores);
        pintarResumen(cuerpo.errores);
      } else {
        pintarResumen({}, cuerpo.mensaje || 'No se pudo registrar la solicitud. Intenta de nuevo.');
      }
      resumen.focus();
    } catch {
      pintarResumen({}, 'No hay conexión con el servidor. Revisa tu internet e intenta de nuevo; lo que escribiste sigue aquí.');
      resumen.focus();
    } finally {
      ocupado(false);
    }
  });

  document.getElementById('otra').addEventListener('click', () => {
    form.reset();
    intentado.valor = false;
    pintarErrores({});
    actualizarContador();
    confirmacion.hidden = true;
    form.hidden = false;
    document.getElementById('nombre').focus();
  });

  actualizarContador();
})();
