const API_URL = '/api/solicitudes';
const STORAGE_KEY = 'mesa_ayuda_solicitudes_respaldo';

// 3 solicitudes ficticias iniciales para cumplir la prueba de aceptación
const DATOS_INICIALES = [
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

let solicitudes = [];

// Referencias del DOM
const form = document.getElementById('form-soporte');
const inputNombre = document.getElementById('nombre');
const inputCorreo = document.getElementById('correo');
const selectTipo = document.getElementById('tipo');
const selectPrioridad = document.getElementById('prioridad');
const textareaDesc = document.getElementById('descripcion');
const contadorDesc = document.getElementById('contador-desc');

const alertaError = document.getElementById('alerta-error');
const listaErrores = document.getElementById('lista-errores');
const alertaExito = document.getElementById('alerta-exito');
const ticketIdGenerado = document.getElementById('ticket-id-generado');
const ticketFechaGenerada = document.getElementById('ticket-fecha-generada');

const tablaSolicitudes = document.getElementById('tabla-solicitudes');
const badgeTotal = document.getElementById('badge-total');
const buscador = document.getElementById('buscador');
const estadoVacio = document.getElementById('estado-vacio');
const tabBtns = document.querySelectorAll('.tab-btn');
const viewSections = document.querySelectorAll('.view-section');

// Cambio entre pestañas (Registro / Consulta)
function cambiarVista(targetId) {
  tabBtns.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.target === targetId);
  });
  viewSections.forEach((sec) => {
    sec.classList.toggle('active', sec.id === targetId);
  });
}

tabBtns.forEach((btn) => {
  btn.addEventListener('click', () => cambiarVista(btn.dataset.target));
});

document.getElementById('btn-ir-consulta').addEventListener('click', () => {
  cambiarVista('vista-consulta');
});

// Contador en vivo para los 15 caracteres mínimos de la descripción
textareaDesc.addEventListener('input', () => {
  const len = textareaDesc.value.trim().length;
  contadorDesc.textContent = `${len} / 15 mín.`;
  contadorDesc.classList.toggle('valid', len >= 15);
});

// Carga de solicitudes (Intenta servidor JSON primero; respalda en navegador si se abre sin servidor)
async function cargarSolicitudes() {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error('Servidor API no disponible');
    solicitudes = await res.json();
  } catch {
    const guardadas = localStorage.getItem(STORAGE_KEY);
    if (guardadas) {
      solicitudes = JSON.parse(guardadas);
    } else {
      solicitudes = [...DATOS_INICIALES];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(solicitudes));
    }
  }
  renderizarTabla(solicitudes);
}

// Guardar solicitud (En archivo JSON del servidor o respaldo local)
async function guardarSolicitud(nueva) {
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nueva)
    });
    if (!res.ok) throw new Error('Error guardando en API');
    const guardada = await res.json();
    solicitudes.unshift(guardada);
    return guardada;
  } catch {
    solicitudes.unshift(nueva);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(solicitudes));
    return nueva;
  }
}

// Limpiar mensajes de error previos
function limpiarErrores() {
  alertaError.classList.add('hidden');
  listaErrores.innerHTML = '';
  ['nombre', 'correo', 'tipo', 'prioridad', 'descripcion'].forEach((campo) => {
    document.getElementById(campo).classList.remove('input-invalid');
    document.getElementById(`err-${campo}`).textContent = '';
  });
}

// Validación estricta según pruebas de aceptación del documento
function validarFormulario() {
  limpiarErrores();
  const errores = [];

  const nombre = inputNombre.value.trim();
  const correo = inputCorreo.value.trim();
  const tipo = selectTipo.value;
  const prioridad = selectPrioridad.value;
  const descripcion = textareaDesc.value.trim();

  const regexCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!nombre) {
    errores.push('El nombre del solicitante es obligatorio.');
    inputNombre.classList.add('input-invalid');
    document.getElementById('err-nombre').textContent = 'Campo obligatorio.';
  }

  if (!correo) {
    errores.push('El correo electrónico es obligatorio.');
    inputCorreo.classList.add('input-invalid');
    document.getElementById('err-correo').textContent = 'Campo obligatorio.';
  } else if (!regexCorreo.test(correo)) {
    errores.push('El correo electrónico no tiene un formato válido (ejemplo: usuario@dominio.com).');
    inputCorreo.classList.add('input-invalid');
    document.getElementById('err-correo').textContent = 'Formato de correo inválido.';
  }

  if (!tipo) {
    errores.push('Debe seleccionar un tipo de problema (Equipo, Internet, Software u Otro).');
    selectTipo.classList.add('input-invalid');
    document.getElementById('err-tipo').textContent = 'Seleccione una opción.';
  }

  if (!prioridad) {
    errores.push('Debe seleccionar un nivel de prioridad (Baja, Media o Alta).');
    selectPrioridad.classList.add('input-invalid');
    document.getElementById('err-prioridad').textContent = 'Seleccione una opción.';
  }

  if (!descripcion) {
    errores.push('La descripción del problema es obligatoria.');
    textareaDesc.classList.add('input-invalid');
    document.getElementById('err-descripcion').textContent = 'Campo obligatorio.';
  } else if (descripcion.length < 15) {
    errores.push(`La descripción debe tener al menos 15 caracteres (actualmente tiene ${descripcion.length}).`);
    textareaDesc.classList.add('input-invalid');
    document.getElementById('err-descripcion').textContent = 'Mínimo 15 caracteres requeridos.';
  }

  if (errores.length > 0) {
    alertaExito.classList.add('hidden');
    alertaError.classList.remove('hidden');
    errores.forEach((err) => {
      const li = document.createElement('li');
      li.textContent = err;
      listaErrores.appendChild(li);
    });
    return null;
  }

  const consecutivo = 1000 + solicitudes.length + 1;
  return {
    id: `SOL-${consecutivo}`,
    nombre,
    correo,
    tipo,
    descripcion,
    prioridad,
    fecha: new Date().toLocaleString('es-CO', { hour12: false })
  };
}

// Envío del formulario
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const datosValidos = validarFormulario();
  if (!datosValidos) return;

  const registro = await guardarSolicitud(datosValidos);
  renderizarTabla(solicitudes);

  // Mostrar confirmación con su identificador y fecha
  ticketIdGenerado.textContent = `ID: ${registro.id}`;
  ticketFechaGenerada.textContent = `Registrado el ${registro.fecha} a nombre de ${registro.nombre}.`;
  alertaExito.classList.remove('hidden');

  form.reset();
  contadorDesc.textContent = '0 / 15 mín.';
  contadorDesc.classList.remove('valid');
});

document.getElementById('btn-limpiar').addEventListener('click', () => {
  limpiarErrores();
  alertaExito.classList.add('hidden');
  contadorDesc.textContent = '0 / 15 mín.';
  contadorDesc.classList.remove('valid');
});

// Prevención de inyección HTML al mostrar texto en la tabla
function escaparHTML(texto) {
  const div = document.createElement('div');
  div.textContent = texto;
  return div.innerHTML;
}

// Renderizado de la tabla de consulta
function renderizarTabla(lista) {
  badgeTotal.textContent = solicitudes.length;
  tablaSolicitudes.innerHTML = '';

  if (lista.length === 0) {
    estadoVacio.classList.remove('hidden');
    return;
  }

  estadoVacio.classList.add('hidden');

  lista.forEach((item) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="id-cell">${escaparHTML(item.id)}</td>
      <td>
        <strong>${escaparHTML(item.nombre)}</strong>
        <span class="user-email">${escaparHTML(item.correo)}</span>
      </td>
      <td>${escaparHTML(item.tipo)}</td>
      <td>${escaparHTML(item.descripcion)}</td>
      <td><span class="badge prio-${escaparHTML(item.prioridad)}">${escaparHTML(item.prioridad)}</span></td>
      <td>${escaparHTML(item.fecha)}</td>
    `;
    tablaSolicitudes.appendChild(tr);
  });
}

// Filtro de búsqueda en la vista de consulta
buscador.addEventListener('input', () => {
  const termino = buscador.value.trim().toLowerCase();
  const filtradas = solicitudes.filter(
    (s) =>
      s.id.toLowerCase().includes(termino) ||
      s.nombre.toLowerCase().includes(termino) ||
      s.correo.toLowerCase().includes(termino) ||
      s.tipo.toLowerCase().includes(termino) ||
      s.prioridad.toLowerCase().includes(termino)
  );
  renderizarTabla(filtradas);
});

// Inicializar al cargar la página
document.addEventListener('DOMContentLoaded', cargarSolicitudes);