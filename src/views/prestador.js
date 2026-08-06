import { fetchFichasCuidadoPorPrestador } from '../api/firestore.js';
import { showToast } from '../ui/notifications.js';
import { escapeHTML } from '../utils/html.js';

export async function renderPrestadorFichas(uid) {
  const list = document.getElementById('prestador-fichas-list');
  if (!list) return;

  if (!uid) {
    console.error("renderPrestadorFichas fue llamado sin UID.");
    list.innerHTML = '<p class="text-center py-10 text-red-500 italic">Error: No se pudo identificar al prestador.</p>';
    return;
  }

  try {
    const bitacoras = await fetchFichasCuidadoPorPrestador(uid);
    if (bitacoras.length === 0) {
      list.innerHTML = '<p class="text-center py-10 text-gray-400 italic">No tienes fichas registradas aún.</p>';
      return;
    }
    list.innerHTML = bitacoras.map(b => `
      <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
        <div class="flex justify-between font-bold text-sm text-[#e87a30] mb-2">
          <span>Fecha: ${escapeHTML(b.fecha)} (${b.horasEfectivas} hrs)</span>
          <span class="text-xs text-gray-400 font-normal">${new Date(b.creadoEn).toLocaleDateString()}</span>
        </div>
        <p class="text-sm"><strong>Actividades:</strong> Alimentación: ${escapeHTML(b.tipoAlimentacion || 'N/A')} • Horas Sueño: ${b.horasSueno || 0}h • Pañales: ${b.cantidadPanales || 0}</p>
        <p class="text-xs text-gray-500 mt-2"><strong>Observaciones:</strong> ${escapeHTML(b.observaciones || 'Ninguna')}</p>
      </div>
    `).join('');
  } catch (e) {
    list.innerHTML = '<p class="text-center py-10 text-red-500 italic">Error al cargar historial.</p>';
    showToast('Error al cargar historial de fichas', 'error');
  }
}
