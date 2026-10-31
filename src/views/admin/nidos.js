import { showToast } from '../../ui/notifications.js';
import { 
  getAllNidos, 
  getAllUsers, 
  deleteNidoProfile, 
  reactivarNidoProfile, 
  fetchFichasCuidadoPorNido, 
  fetchFichasAtencionPorNido 
} from '../../api/firestore.js';
import { escapeHTML } from '../../utils/html.js';
import { formatFirestoreDate, showInfoModal, FIELD_LABELS } from '../../utils/helpers.js';
import { renderAdminTab } from '../admin.js';
import { showConfirmModal } from '../../modales.js';

async function loadAllNidos() {
  const container = document.getElementById('nidos-table-container');
  if (!container) return;

  try {
    const [nidos, usuarios] = await Promise.all([getAllNidos(), getAllUsers()]);
    if (nidos.length === 0) {
      container.innerHTML = '<p class="text-center py-8 text-gray-400 italic">No hay nidos registrados.</p>';
      return;
    }

    const userMap = new Map();
    usuarios.forEach(u => userMap.set(u.id, u));

    let mostrarInactivos = false;
    let terminoBusqueda = '';

    const renderTabla = () => {
      const nidosDelEstado = nidos.filter(n => {
        const estado = n.estado || 'activo';
        return mostrarInactivos ? estado === 'inactivo' : estado === 'activo';
      });
      const busqueda = terminoBusqueda.trim().toLowerCase();
      const nidosFiltrados = nidosDelEstado.filter(nido => {
        if (!busqueda) return true;
        const hijos = nido.hijos || (nido.rutBebe ? [{ nombre: 'Nido antiguo', rut: nido.rutBebe }] : []);
        return hijos.some(hijo =>
          [hijo.nombre, hijo.rut].filter(Boolean).join(' ').toLowerCase().includes(busqueda)
        );
      });

      const totalActivos = nidos.filter(n => (n.estado || 'activo') === 'activo').length;
      const totalInactivos = nidos.filter(n => n.estado === 'inactivo').length;

      container.innerHTML = `
        <div class="flex flex-col gap-3 mb-4">
          <div class="flex items-center justify-between">
            <p class="text-sm text-gray-500">Mostrando <strong>${nidosFiltrados.length}</strong> nido(s) ${mostrarInactivos ? 'inactivo(s)' : 'activo(s)'}</p>
            <button id="toggle-nidos-inactivos" class="text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${mostrarInactivos ? 'bg-[#e87a30] text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}">
              ${mostrarInactivos ? `← Ver Activos (${totalActivos})` : `Ver Inactivos (${totalInactivos})`}
            </button>
          </div>
          <div class="flex flex-col md:flex-row md:items-center gap-2">
            <input type="text" id="buscar-nido" value="${escapeHTML(terminoBusqueda)}" placeholder="🔍 Buscar por nombre o RUT del bebé..." class="p-2 border rounded-lg text-sm w-full md:w-64">
            <button type="button" id="btn-exportar-nidos" class="bg-[#e87a30] hover:bg-[#d66a20] text-white font-bold py-2 px-4 rounded-lg text-sm transition">📥 Exportar CSV</button>
          </div>
        </div>
        ${nidosFiltrados.length === 0
          ? `<p class="text-center py-8 text-gray-400 italic">${busqueda ? 'No hay nidos que coincidan con la búsqueda.' : mostrarInactivos ? 'No hay nidos desactivados.' : 'No hay nidos activos.'}</p>`
          : `
            <div class="overflow-x-auto w-full rounded-lg border border-gray-200">
              <table class="w-full min-w-[900px] text-left text-sm">
                <thead class="bg-gray-50 text-gray-600 border-b border-gray-200">
                  <tr>
                    <th class="p-3 whitespace-nowrap">Estado</th>
                    <th class="p-3 whitespace-nowrap">Bebés / Hijos</th>
                    <th class="p-3 whitespace-nowrap">N° Hijos</th>
                    <th class="p-3 whitespace-nowrap">Padres / Familia</th>
                    <th class="p-3 whitespace-nowrap">Fecha Creación</th>
                    <th class="p-3 whitespace-nowrap">Acciones</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                  ${nidosFiltrados.map(nido => {
                    const hijos = nido.hijos || (nido.rutBebe ? [{ nombre: 'Nido antiguo', rut: nido.rutBebe }] : []);
                    const padresUids = nido.padresUids || [];
                    const padres = padresUids.map(uid => userMap.get(uid));
                    const estadoNido = nido.estado || 'activo';
                    const esActivo = estadoNido === 'activo';
                    const fechaCreacion = formatFirestoreDate(nido.creadoEn) || '---';

                    return `
                      <tr class="${esActivo ? '' : 'bg-red-50/30 opacity-75'}">
                        <td class="p-3 whitespace-nowrap">
                          <span class="text-[10px] font-bold px-2 py-1 rounded-full ${esActivo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">
                            ${esActivo ? '● ACTIVO' : '● INACTIVO'}
                          </span>
                        </td>
                        <td class="p-3 text-xs whitespace-nowrap">
                          ${hijos.length > 0 ? hijos.map(h => `<div class="mb-1"><span class="font-bold">${escapeHTML(h.nombre || 'Sin nombre')}</span>${h.rut ? `<span class="text-gray-400 ml-1">(${escapeHTML(h.rut)})</span>` : ''}</div>`).join('') : '<span class="text-gray-400 italic">Sin registros</span>'}
                        </td>
                        <td class="p-3 text-xs whitespace-nowrap">${hijos.length}</td>
                        <td class="p-3 text-xs whitespace-nowrap">${padresUids.length > 0 ? padres.map((padre, index) => {
                          const uid = padresUids[index];
                          const nombre = padre?.nombre || padre?.email || (uid ? `(UID: ${uid.substring(0, 8)}...)` : '');
                          return `<div class="mb-1">${escapeHTML(nombre)}${padre?.telefono ? `<span class="block text-[10px] text-gray-500">${escapeHTML(padre.telefono)}</span>` : ''}</div>`;
                        }).join('') : '<span class="text-gray-400 italic">Sin padres vinculados</span>'}</td>
                        <td class="p-3 text-xs text-gray-500 whitespace-nowrap">${escapeHTML(fechaCreacion)}</td>
                        <td class="p-3 whitespace-nowrap">
                          <button type="button" class="btn-view-nido text-blue-600 hover:text-blue-800 text-xs font-bold" data-id="${nido.id}">Ver</button>
                          ${esActivo ? `<button type="button" class="btn-delete-nido text-red-600 hover:text-red-800 text-xs font-bold ml-3" data-id="${nido.id}">Desactivar</button>` : `<button type="button" class="btn-reactivate-nido text-green-600 hover:text-green-800 text-xs font-bold ml-3" data-id="${nido.id}">Reactivar</button>`}
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          `}
      `;

      document.getElementById('toggle-nidos-inactivos')?.addEventListener('click', () => {
        mostrarInactivos = !mostrarInactivos;
        renderTabla();
      });

      document.getElementById('buscar-nido')?.addEventListener('input', event => {
        terminoBusqueda = event.target.value;
        const cursor = event.target.selectionStart;
        renderTabla();
        const input = document.getElementById('buscar-nido');
        input?.focus();
        input?.setSelectionRange(cursor, cursor);
      });

      document.getElementById('btn-exportar-nidos')?.addEventListener('click', () => exportNidosToCsv(nidosFiltrados, userMap));

      container.querySelectorAll('.btn-view-nido').forEach(btn => {
        btn.addEventListener('click', () => renderDetalleNido(btn.dataset.id));
      });

      container.querySelectorAll('.btn-delete-nido').forEach(btn => {
        btn.addEventListener('click', async () => {
          const nidoId = btn.dataset.id;
          const confirmado = await showConfirmModal('Desactivar Nido', '¿Estás seguro de desactivar este nido?');
          if (!confirmado) return;
          btn.disabled = true;
          btn.textContent = 'Desactivando...';
          try {
            await deleteNidoProfile(nidoId);
            const nido = nidos.find(n => n.id === nidoId);
            if (nido) nido.estado = 'inactivo';
            showToast('Nido desactivado correctamente.', 'success');
            renderTabla();
          } catch (error) {
            console.error('Error al desactivar nido:', error);
            btn.disabled = false;
            btn.textContent = 'Desactivar';
            showToast(error.message || 'Error al desactivar nido.', 'error');
          }
        });
      });

      container.querySelectorAll('.btn-reactivate-nido').forEach(btn => {
        btn.addEventListener('click', async () => {
          const nidoId = btn.dataset.id;
          const confirmado = await showConfirmModal('Reactivar Nido', '¿Reactivar este nido?', false);
          if (!confirmado) return;
          btn.disabled = true;
          btn.textContent = 'Reactivando...';
          try {
            await reactivarNidoProfile(nidoId);
            const nido = nidos.find(n => n.id === nidoId);
            if (nido) nido.estado = 'activo';
            showToast('Nido reactivado correctamente.', 'success');
            renderTabla();
          } catch (error) {
            console.error('Error al reactivar nido:', error);
            btn.disabled = false;
            btn.textContent = 'Reactivar';
            showToast(error.message || 'Error al reactivar nido.', 'error');
          }
        });
      });
    };

    renderTabla();
  } catch (error) {
    console.error('Error al cargar nidos:', error);
    container.innerHTML = '<p class="text-center py-8 text-red-500 italic">Error cargando nidos.</p>';
  }
}

function exportNidosToCsv(nidos, userMap) {
  const csvCell = value => {
    const text = String(value ?? '');
    const safeText = /^[=+\-@]/.test(text) ? `'${text}` : text;
    return `"${safeText.replace(/"/g, '""')}"`;
  };
  const headers = ['ID Nido', 'Bebés', 'Padres', 'Estado', 'Fecha Creación'];
  const rows = nidos.map(nido => {
    const hijos = nido.hijos || (nido.rutBebe ? [{ nombre: 'Nido antiguo', rut: nido.rutBebe }] : []);
    const bebes = hijos.map(hijo => [hijo.nombre || 'Sin nombre', hijo.rut].filter(Boolean).join(' - ')).join('; ');
    const padres = (nido.padresUids || []).map(uid => {
      const padre = userMap.get(uid);
      const nombre = padre?.nombre || padre?.email || (uid ? `(UID: ${uid.substring(0, 8)}...)` : '');
      return [nombre, padre?.telefono].filter(Boolean).join(' - ');
    }).join('; ');
    return [
      nido.id,
      bebes,
      padres,
      nido.estado || 'activo',
      formatFirestoreDate(nido.creadoEn) || '---'
    ].map(csvCell).join(',');
  });
  const csv = `\uFEFF${[headers.map(csvCell).join(','), ...rows].join('\r\n')}`;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'nidos_lactanido.csv';
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

async function renderDetalleNido(nidoId) {
  const dashboardContent = document.getElementById('dashboard-content');
  if (!dashboardContent) return;

  dashboardContent.innerHTML = `
    <div class="flex flex-col items-center justify-center h-64 text-gray-400">
      <div class="w-12 h-12 border-4 border-[#e87a30] border-t-transparent rounded-full animate-spin mb-4"></div>
      <p class="animate-pulse font-medium">Cargando detalles del nido...</p>
    </div>
  `;

  try {
    const [nidos, usuarios, bitacoras, fichas] = await Promise.all([
      getAllNidos(), getAllUsers(),
      fetchFichasCuidadoPorNido(nidoId),
      fetchFichasAtencionPorNido(nidoId)
    ]);

    const nido = nidos.find(n => n.id === nidoId);
    if (!nido) {
      dashboardContent.innerHTML = '<p class="text-center py-8 text-red-500">Nido no encontrado.</p>';
      return;
    }

    const userMap = new Map();
    usuarios.forEach(u => userMap.set(u.id, u.nombre || u.email || u.id));

    const hijos = nido.hijos || (nido.rutBebe ? [{ nombre: 'Nido antiguo', rut: nido.rutBebe }] : []);
    const padresUids = nido.padresUids || [];
    const nombresPadres = padresUids.map(uid => userMap.get(uid) || `(UID: ${uid.substring(0, 8)}...)`);
    const fechaCreacion = formatFirestoreDate(nido.creadoEn, true) || 'No registrada';

    const renderBitacora = (b) => {
      const fechaB = formatFirestoreDate(b.fecha || b.creadoEn, true) || 'Sin fecha';
      const nombrePrestador = b.prestadorNombre || userMap.get(b.prestadorId) || 'Prestador';
      const preview = b.observaciones || b.sueno || 'Sin observaciones';
      return `
        <div class="border border-gray-100 rounded-lg p-4 mb-3 bg-white shadow-sm hover:shadow-md transition-shadow">
          <div class="flex justify-between items-start mb-2">
            <div>
              <p class="font-bold text-sm text-[#181411]">Bitácora de Cuidado</p>
              <p class="text-xs text-gray-500">${escapeHTML(fechaB)}</p>
              <p class="text-xs text-[#e87a30] font-semibold mt-0.5">${escapeHTML(nombrePrestador)}</p>
            </div>
            <span class="text-[10px] bg-[#f4eade] text-[#e87a30] px-2 py-1 rounded-full font-bold">🍼</span>
          </div>
          <p class="text-xs text-gray-600 line-clamp-2">${escapeHTML(preview.substring(0, 120))}</p>
          <button type="button" class="btn-ver-bitacora-detalle text-[#e87a30] hover:text-[#d66a20] text-[10px] font-bold mt-2" data-json='${escapeHTML(JSON.stringify(b))}'>Ver detalle completo →</button>
        </div>
      `;
    };

    const renderFicha = (f) => {
      const fechaF = formatFirestoreDate(f.fechaAtencion || f.creadoEn, true) || 'Sin fecha';
      const nombreConsejera = f.consejeraNombre || userMap.get(f.consejeraId) || 'Consejera';
      const preview = f.motivoConsulta || f.motivo || f.planAccion || 'Sin detalles';
      return `
        <div class="border border-gray-100 rounded-lg p-4 mb-3 bg-white shadow-sm hover:shadow-md transition-shadow">
          <div class="flex justify-between items-start mb-2">
            <div>
              <p class="font-bold text-sm text-[#181411]">Evaluación de Atención</p>
              <p class="text-xs text-gray-500">${escapeHTML(fechaF)}</p>
              <p class="text-xs text-purple-600 font-semibold mt-0.5">${escapeHTML(nombreConsejera)}</p>
            </div>
            <span class="text-[10px] bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-bold">💜</span>
          </div>
          <p class="text-xs text-gray-600 line-clamp-2">${escapeHTML(preview.substring(0, 120))}</p>
          <button type="button" class="btn-ver-ficha-detalle text-[#e87a30] hover:text-[#d66a20] text-[10px] font-bold mt-2" data-json='${escapeHTML(JSON.stringify(f))}'>Ver detalle completo →</button>
        </div>
      `;
    };

    dashboardContent.innerHTML = `
      <div class="mb-6">
        <button id="btn-volver-nidos" class="text-sm text-[#e87a30] font-bold hover:underline mb-4">← Volver a Nidos / Familias</button>
        <h2 class="text-2xl font-black text-[#181411] mb-2">Detalles del Nido</h2>
        <p class="text-xs font-mono text-gray-500">ID: ${nido.id}</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-1 space-y-6">
          <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 class="font-bold text-lg mb-4 border-b pb-2">Información del Nido</h3>
            <div class="mb-4">
              <p class="text-xs font-bold text-gray-500 mb-2">👶 BEBÉS / HIJOS</p>
              ${hijos.length > 0 ? hijos.map(h => `
                <div class="mb-2 p-2 bg-gray-50 rounded">
                  <p class="font-bold text-sm">${escapeHTML(h.nombre || 'Sin nombre')}</p>
                  ${h.rut ? `<p class="text-xs text-gray-500">RUT: ${escapeHTML(h.rut)}</p>` : ''}
                </div>
              `).join('') : '<p class="text-sm text-gray-400 italic">Sin registros</p>'}
            </div>
            <div class="mb-4">
              <p class="text-xs font-bold text-gray-500 mb-2">👨‍👩‍👧 PADRES / FAMILIA</p>
              ${nombresPadres.map(n => `<p class="text-sm mb-1">${escapeHTML(n)}</p>`).join('') || '<p class="text-sm text-gray-400 italic">Sin padres vinculados</p>'}
            </div>
            <div>
              <p class="text-xs font-bold text-gray-500 mb-1">📅 FECHA DE CREACIÓN</p>
              <p class="text-sm">${escapeHTML(fechaCreacion)}</p>
            </div>
            <div class="mt-4">
              <p class="text-xs font-bold text-gray-500 mb-1">📌 ESTADO</p>
              <span class="text-[10px] font-bold px-2 py-1 rounded-full ${(nido.estado || 'activo') === 'activo' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">
                ${(nido.estado || 'activo').toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        <div class="lg:col-span-2 space-y-6">
          <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 class="font-bold text-lg mb-4 border-b pb-2">📋 Bitácoras de Cuidado (${bitacoras.length})</h3>
            <div class="max-h-[400px] overflow-y-auto pr-2">
              ${bitacoras.length > 0 ? bitacoras.map(renderBitacora).join('') : '<p class="text-sm text-gray-400 italic">No hay bitácoras registradas para este nido.</p>'}
            </div>
          </div>

          <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 class="font-bold text-lg mb-4 border-b pb-2">💜 Evaluaciones de Atención (${fichas.length})</h3>
            <div class="max-h-[400px] overflow-y-auto pr-2">
              ${fichas.length > 0 ? fichas.map(renderFicha).join('') : '<p class="text-sm text-gray-400 italic">No hay fichas de atención registradas para este nido.</p>'}
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById('btn-volver-nidos')?.addEventListener('click', () => renderAdminTab('admin_nidos'));

    dashboardContent.querySelectorAll('.btn-ver-bitacora-detalle').forEach(btn => {
      btn.addEventListener('click', () => {
        const data = JSON.parse(btn.dataset.json);
        const rows = [];
        Object.entries(data).forEach(([key, value]) => {
          if (key === 'id') return;
          const label = FIELD_LABELS[key] || key;
          let display = value;
          if (key === 'fecha' || key === 'fechaHora' || key === 'creadoEn' || key === 'fechaAtencion') {
            display = formatFirestoreDate(value, true) || value;
          } else if (Array.isArray(value)) display = value.join(', ');
          else if (typeof value === 'object' && value !== null) display = JSON.stringify(value);
          rows.push([label, display]);
        });
        showInfoModal({ title: 'Bitácora de Cuidado', subtitle: `Nido: ${hijos[0]?.nombre || 'Sin nombre'}`, icon: '🍼', rows });
      });
    });

    dashboardContent.querySelectorAll('.btn-ver-ficha-detalle').forEach(btn => {
      btn.addEventListener('click', () => {
        const data = JSON.parse(btn.dataset.json);
        const rows = [];
        Object.entries(data).forEach(([key, value]) => {
          if (key === 'id') return;
          const label = FIELD_LABELS[key] || key;
          let display = value;
          if (key === 'fecha' || key === 'fechaHora' || key === 'creadoEn' || key === 'fechaAtencion') {
            display = formatFirestoreDate(value, true) || value;
          } else if (Array.isArray(value)) display = value.join(', ');
          else if (typeof value === 'object' && value !== null) display = JSON.stringify(value);
          rows.push([label, display]);
        });
        showInfoModal({ title: 'Ficha de Atención', subtitle: `Nido: ${hijos[0]?.nombre || 'Sin nombre'}`, icon: '💜', rows });
      });
    });

  } catch (error) {
    console.error('Error al cargar detalle del nido:', error);
    dashboardContent.innerHTML = '<p class="text-center py-8 text-red-500">Error al cargar los detalles del nido.</p>';
  }
}

export { loadAllNidos, renderDetalleNido };
