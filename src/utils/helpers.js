import { escapeHTML } from './html.js';

function formatFirestoreDate(value, includeTime = false) {
  if (!value) return null;
  try {
    let date;
    if (value instanceof Date) {
      date = value;
    } else if (typeof value === 'string') {
      date = new Date(value);
    } else if (typeof value.toDate === 'function') {
      date = value.toDate();
    } else if (typeof value === 'object' && typeof value.seconds === 'number') {
      date = new Date(value.seconds * 1000);
    } else {
      return null;
    }
    if (isNaN(date.getTime())) return null;
    if (includeTime) {
      return date.toLocaleString('es-CL', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    }
    return date.toLocaleDateString('es-CL', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  } catch {
    return null;
  }
}

/**
 * Devuelve la fecha en formato YYYY-MM-DD para comparaciones.
 */
function toDateInputValue(value) {
  if (!value) return null;
  try {
    let date;
    if (value instanceof Date) date = value;
    else if (typeof value === 'string') date = new Date(value);
    else if (typeof value.toDate === 'function') date = value.toDate();
    else if (typeof value === 'object' && typeof value.seconds === 'number') date = new Date(value.seconds * 1000);
    else return null;
    if (isNaN(date.getTime())) return null;
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  } catch { return null; }
}

const FIELD_LABELS = {
  uidPadre: 'UID Padre',
  nidoId: 'ID Nido',
  reservaId: 'ID Reserva',
  creadoEn: 'Fecha de Creación',
  actualizadoEn: 'Última Actualización',
  fecha: 'Fecha',
  fechaHora: 'Fecha y Hora',
  sueno: 'Sueño',
  deposiciones: 'Deposiciones',
  tipoAlimentacion: 'Tipo de Alimentación',
  alimentacion: 'Alimentación',
  cantidadPanales: 'Cantidad de Pañales',
  horasSueno: 'Horas de Sueño',
  horasEfectivas: 'Horas Efectivas',
  observaciones: 'Observaciones',
  prestadorId: 'ID Prestador',
  prestadorNombre: 'Nombre Prestador',
  prestadorRol: 'Rol Prestador',
  prestadorRut: 'RUT Prestador',
  nidoNombreBebe: 'Nombre del Bebé',
  nidoRutBebe: 'RUT del Bebé',
  padresNombres: 'Padres',
  fechaAtencion: 'Fecha de Atención',
  consejeraId: 'ID Consejera',
  consejeraNombre: 'Nombre Consejera',
  motivoConsulta: 'Motivo de Consulta',
  motivo: 'Motivo',
  planAccion: 'Plan de Acción',
  recomendaciones: 'Recomendaciones',
  evaluacion: 'Evaluación',
  seguimiento: 'Seguimiento',
};

function showInfoModal({ title, subtitle, icon, rows }) {
  const existing = document.getElementById('info-modal-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'info-modal-overlay';
  overlay.className = 'fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4';
  
  const rowsHTML = rows.map(([label, value]) => {
    const display = (value === null || value === undefined || value === '') 
      ? '<em class="text-gray-400 not-italic">Sin datos</em>' 
      : escapeHTML(String(value));
    return `
      <div class="border-b border-gray-100 pb-3 last:border-0">
        <dt class="text-[10px] font-black text-[#e87a30] uppercase tracking-wider mb-1">${escapeHTML(label)}</dt>
        <dd class="text-sm text-[#181411] break-words">${display}</dd>
      </div>
    `;
  }).join('');

  overlay.innerHTML = `
    <div class="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] flex flex-col overflow-hidden border-t-4 border-[#e87a30]">
      <div class="p-5 border-b border-gray-100 bg-gradient-to-r from-[#f4eade] to-white flex items-center gap-3">
        <span class="text-3xl">${icon || '📋'}</span>
        <div class="flex-1">
          <h3 class="text-lg font-black text-[#181411]">${escapeHTML(title)}</h3>
          ${subtitle ? `<p class="text-xs text-gray-500 mt-0.5">${escapeHTML(subtitle)}</p>` : ''}
        </div>
        <button id="info-modal-close-x" class="text-gray-400 hover:text-gray-700 text-2xl leading-none">&times;</button>
      </div>
      <div class="p-5 overflow-y-auto flex-1">
        <dl class="space-y-3">${rowsHTML}</dl>
      </div>
      <div class="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
        <button id="info-modal-close-btn" class="bg-[#e87a30] hover:bg-[#d66a20] text-white font-bold py-2 px-6 rounded-full transition-colors text-sm">
          Cerrar
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const close = () => overlay.remove();
  document.getElementById('info-modal-close-x').addEventListener('click', close);
  document.getElementById('info-modal-close-btn').addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  document.addEventListener('keydown', function escHandler(e) {
    if (e.key === 'Escape') { close(); document.removeEventListener('keydown', escHandler); }
  });
}

function resolveHistoricalName(snapshotValue, lookupFn, fallback = 'Sin nombre') {
  if (snapshotValue && String(snapshotValue).trim() !== '') return snapshotValue;
  try {
    const live = lookupFn();
    if (live) return live;
  } catch {}
  return fallback;
}

function getNidoNombreDesdePadre(uidPadre, userMap, nidoMap) {
  if (!uidPadre) return null;
  const padre = userMap.get(uidPadre);
  if (padre && padre.nidoId) {
    return nidoMap.get(padre.nidoId) || null;
  }
  return null;
}

function fileToBase64(file) {
  const maxBytes = 200 * 1024;
  if (file.size <= maxBytes) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('No se pudo leer la imagen.'));
      reader.readAsDataURL(file);
    });
  }

  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const maxWidth = 800;
      const scale = Math.min(1, maxWidth / image.width);
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      const context = canvas.getContext('2d');
      if (!context) { reject(new Error('No se pudo preparar la imagen.')); return; }
      context.drawImage(image, 0, 0, canvas.width, canvas.height);

      const compress = (quality, attemptsLeft) => {
        canvas.toBlob(blob => {
          if (!blob) { reject(new Error('No se pudo comprimir la imagen.')); return; }
          if (blob.size <= maxBytes || attemptsLeft === 0) {
            if (blob.size > maxBytes) { reject(new Error('La imagen no pudo reducirse por debajo de 200 KB.')); return; }
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error('No se pudo leer la imagen comprimida.'));
            reader.readAsDataURL(blob);
            return;
          }
          compress(Math.max(0.2, quality - 0.1), attemptsLeft - 1);
        }, 'image/jpeg', quality);
      };

      compress(0.8, 6);
    };
    image.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error('El archivo seleccionado no es una imagen válida.')); };
    image.src = objectUrl;
  });
}

export { formatFirestoreDate, toDateInputValue, FIELD_LABELS, showInfoModal, resolveHistoricalName, getNidoNombreDesdePadre, fileToBase64 };
