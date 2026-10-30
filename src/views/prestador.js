import { fetchFichasAtencionPorNido, fetchFichasCuidadoPorPrestador } from '../api/firestore.js';
import { showToast } from '../ui/notifications.js';
import { escapeHTML } from '../utils/html.js';

export async function renderPrestadorFichas(uid, filterInputId, emptyMessage = 'No se encontraron evaluaciones.') {
  const list = document.getElementById('prestador-fichas-list');
  if (!list) return;

  if (!uid) {
    console.error("renderPrestadorFichas fue llamado sin UID.");
    list.innerHTML = '<p class="text-center py-10 text-red-500 italic">Error: No se pudo identificar al prestador.</p>';
    return;
  }

  try {
    const bitacoras = await fetchFichasCuidadoPorPrestador(uid);
    const getSearchText = b => [
      b.nidoNombreBebe,
      b.nidoRutBebe,
      ...(Array.isArray(b.padresNombres) ? b.padresNombres : [b.padresNombres]),
      b.prestadorNombre
    ].filter(Boolean).join(' ').toLowerCase();
    const renderList = items => {
      if (items.length === 0) {
        list.innerHTML = `<p class="text-center py-10 text-gray-400 italic">${escapeHTML(emptyMessage)}</p>`;
        return;
      }
      list.innerHTML = items.map(b => `
        <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div class="flex justify-between font-bold text-sm text-[#e87a30] mb-2">
            <span>Fecha: ${escapeHTML(b.fecha)} (${b.horasEfectivas} hrs)</span>
            <span class="text-xs text-gray-400 font-normal">${new Date(b.creadoEn).toLocaleDateString()}</span>
          </div>
          <p class="text-sm"><strong>Actividades:</strong> Alimentación: ${escapeHTML(b.tipoAlimentacion || 'N/A')} • Horas Sueño: ${b.horasSueno || 0}h • Pañales: ${b.cantidadPanales || 0}</p>
          <p class="text-xs text-gray-500 mt-2"><strong>Observaciones:</strong> ${escapeHTML(b.observaciones || 'Ninguna')}</p>
        </div>
      `).join('');
    };
    renderList(bitacoras);

    const filterInput = filterInputId && document.getElementById(filterInputId);
    if (filterInput) {
      filterInput.addEventListener('input', () => {
        const searchTerm = filterInput.value.trim().toLowerCase();
        renderList(bitacoras.filter(b => getSearchText(b).includes(searchTerm)));
      });
    }
  } catch (e) {
    list.innerHTML = '<p class="text-center py-10 text-red-500 italic">Error al cargar historial.</p>';
    showToast('Error al cargar historial de evaluaciones', 'error');
  }
}

export async function renderPrestadorEvaluaciones(nidoIds) {
  const list = document.getElementById('prestador-fichas-list');
  if (!list) return;

  try {
    const uniqueNidoIds = [...new Set(nidoIds.filter(Boolean))];
    const fichas = (await Promise.all(
      uniqueNidoIds.map(nidoId => fetchFichasAtencionPorNido(nidoId))
    )).flat();
    if (fichas.length === 0) {
      list.innerHTML = '<p class="text-center py-10 text-gray-400 italic">No se encontraron evaluaciones.</p>';
      return;
    }

    list.innerHTML = fichas.map(ficha => `
      <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
        <div class="flex justify-between font-bold text-sm text-[#e87a30] mb-2">
          <span>${escapeHTML(ficha.nidoNombreBebe || 'Evaluación de atención')}</span>
          <span class="text-xs text-gray-400 font-normal">${escapeHTML(ficha.fechaAtencion || ficha.creadoEn || '')}</span>
        </div>
        <p class="text-sm"><strong>Motivo:</strong> ${escapeHTML(ficha.motivoConsulta || ficha.motivo || 'No especificado')}</p>
        <p class="text-xs text-gray-600 mt-2"><strong>Evaluación:</strong> ${escapeHTML(ficha.evaluacion || 'Sin detalle')}</p>
        <p class="text-xs text-gray-500 mt-2"><strong>Plan de acción:</strong> ${escapeHTML(ficha.planAccion || 'Sin detalle')}</p>
      </div>
    `).join('');
  } catch (error) {
    console.error('Error al cargar evaluaciones de atención:', error);
    list.innerHTML = '<p class="text-center py-10 text-red-500 italic">Error al cargar las evaluaciones.</p>';
    showToast('Error al cargar evaluaciones de atención', 'error');
  }
}
