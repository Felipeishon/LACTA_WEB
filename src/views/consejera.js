import { showToast } from '../ui/notifications.js';
import { fetchServiceAppointments, fetchAllBitacoras, actualizarEstadoCita } from '../api/firestore.js';
import { escapeHTML } from '../utils/html.js';
import { formatDateRange } from '../utils/helpers.js';
import { renderPrestadorEvaluacionesPorPrestador } from './prestador.js';
import { renderTarifasForm } from './shared/tarifas.js';
import { renderConsejeraHorarios } from './consejera/horarios.js';
import { showConfirmModal } from '../modales.js';

export async function renderConsejeraTab(activeTab, userData, openFichaCuidadoModal) {
  const dashboardContent = document.getElementById('dashboard-content');
  if (!dashboardContent) return;

  const uid = userData?.uid || userData?.id;
  
  if (!uid || uid === 'undefined') {
    dashboardContent.innerHTML = `<div class="text-center p-8"><p class="text-red-500 font-bold">Error Crítico</p><p class="text-gray-600">No se pudo identificar la cuenta del usuario.</p></div>`;
    return;
  }

  if (activeTab === 'dashboard') {
    const appointments = await fetchServiceAppointments('Consultor', uid);
    dashboardContent.innerHTML = `
      <div class="glass-panel p-8 rounded-2xl border-t-4 border-[#887263] mb-8">
        <h2 class="text-2xl font-black text-[#181411]">Mi Agenda 📅</h2>
        <p class="text-[#887263] text-sm">Gestiona la aprobación y atención de tus citas.</p>
      </div>
      ${appointments.length > 0 ? `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="lista-atenciones-consejera">${appointments.map(app => {
          const estado = app.estado || 'Pendiente';
          // ESTA ES LA CORRECCIÓN: Forzamos a minúsculas para evitar errores de tipeo en la BD
          const estadoNormalizado = estado.toLowerCase().trim();
          
          const slotDataId = app.slotId || app.slotAsignado || '';
          const profDataId = app.profesionalId || app.prestadorId || app.consejeraId || '';
          const nidoDataId = app.nidoId || '';
          
          const appIdSafe = escapeHTML(app.id || '');
          const nidoIdSafe = escapeHTML(nidoDataId);
          const horaSafe = escapeHTML(app.hora || '');
          const nombreSafe = escapeHTML(app.nombre || '');
          const [horaInicio, horaFin] = String(app.hora || '').split(/\s+a\s+/i);
          const fechaHora = formatDateRange(
            app.fechaInicio || (horaInicio ? `${app.fecha}T${horaInicio}` : null),
            app.fechaFin || (horaFin ? `${app.fecha}T${horaFin}` : null)
          ) || [app.fecha, app.hora].filter(Boolean).join(' ');
          const fechaHoraSafe = escapeHTML(fechaHora);
          const emailSafe = escapeHTML(app.email || '');

          let actionButtons = '';

          if (estadoNormalizado === 'pendiente') {
            actionButtons = `
              <div class="flex gap-2 w-full mt-2">
                <button data-id="${appIdSafe}" data-slot="${slotDataId}" data-prof="${profDataId}" class="btn-rechazar-cita flex-1 bg-red-100 hover:bg-red-200 text-red-700 font-bold py-2 rounded text-[11px] transition">Rechazar</button>
                <button data-id="${appIdSafe}" class="btn-aprobar-cita flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 rounded text-[11px] transition">Aprobar</button>
              </div>
            `;
          } else if (estadoNormalizado === 'aprobado') {
            actionButtons = `
              <button data-id="${appIdSafe}" data-nid="${nidoIdSafe}" class="btn-abrir-ficha w-full mt-2 bg-[#e87a30] hover:bg-[#d66a20] text-white font-bold py-2 rounded text-xs transition">
                Completar Evaluación 📝
              </button>
            `;
          } else if (estadoNormalizado === 'completada') {
            actionButtons = `<div class="mt-2 text-center text-[11px] bg-green-100 text-green-700 py-1.5 rounded font-bold">Evaluación Guardada ✅</div>`;
          } else {
            actionButtons = `<div class="mt-2 text-center text-[11px] bg-gray-100 text-gray-500 py-1.5 rounded font-bold uppercase tracking-wider">${estado}</div>`;
          }

          return `
          <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
            <div>
              <span class="bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-xs font-bold">${horaSafe}</span>
              <h4 class="font-bold text-lg mt-2">${nombreSafe}</h4>
              <p class="text-xs text-gray-500 mb-1">Fecha: <span class="font-bold text-gray-700">${fechaHoraSafe}</span></p>
              <p class="text-xs text-gray-500 mb-3">Cliente: ${emailSafe}</p>
              <p class="text-xs text-gray-600 mt-1"><strong>Tel:</strong> <a href="tel:${escapeHTML(app.telefono || '')}" class="text-[#e87a30] hover:underline font-semibold">${escapeHTML(app.telefono || 'No registrado')}</a></p>
              <p class="text-xs text-gray-600"><strong>Dir:</strong> ${escapeHTML(app.direccion || 'No registrada')}</p>
            </div>
            <div>
              ${actionButtons}
            </div>
          </div>
          `;
        }).join('')}</div>` : `
        <div class="bg-white p-8 rounded-xl border border-gray-200 shadow-sm text-center">
          <p class="text-gray-400 italic">No tienes atenciones agendadas actualmente.</p>
        </div>
      `}
    `;

    // Handler para Aprobar
    dashboardContent.querySelectorAll('.btn-aprobar-cita').forEach(btn => {
      btn.onclick = async () => {
        try {
          btn.textContent = '...';
          btn.disabled = true;
          await actualizarEstadoCita(btn.dataset.id, 'Aprobado');
          showToast('Consejería aprobada correctamente', 'success');
          renderConsejeraTab('dashboard', userData, openFichaCuidadoModal);
        } catch (e) {
          showToast('Error al aprobar', 'error');
          btn.disabled = false;
        }
      };
    });

    // Handler para Rechazar
    dashboardContent.querySelectorAll('.btn-rechazar-cita').forEach(btn => {
      btn.onclick = async () => {
        const confirmado = await showConfirmModal('Rechazar Consejería', '¿Segura que deseas rechazar esta consejería? El bloque horario quedará libre.');
        if (!confirmado) return;
        try {
          btn.textContent = '...';
          btn.disabled = true;
          const { id, slot, prof } = btn.dataset;
          await actualizarEstadoCita(id, 'Rechazada', slot, prof);
          showToast('Cita rechazada y horario liberado', 'success');
          renderConsejeraTab('dashboard', userData, openFichaCuidadoModal);
        } catch (e) {
          showToast('Error al rechazar', 'error');
          btn.disabled = false;
        }
      };
    });

    // Handler para Completar Bitácora/Ficha Directo
    dashboardContent.querySelectorAll('.btn-abrir-ficha').forEach(btn => {
      btn.onclick = () => {
        const { id, nid } = btn.dataset;
        openFichaCuidadoModal(id, nid);
      };
    });

  } else if (activeTab === 'historial_fichas') {
    dashboardContent.innerHTML = `
      <div class="flex justify-between items-center mb-6 flex-wrap gap-4">
        <div>
          <h2 class="text-2xl font-black text-[#181411]">Mis Evaluaciones 📝</h2>
          <p class="text-sm text-gray-500">Historial completo y filtrable de las atenciones brindadas a los nidos.</p>
        </div>
        <div>
          <input type="text" id="filtro-fichas" placeholder="🔍 Buscar por nido, RUT o cliente..." class="p-2 border border-gray-300 rounded-lg text-sm w-72 bg-white" />
        </div>
      </div>
      <div class="space-y-4" id="prestador-fichas-list">
        <p class="text-center py-10 text-gray-400 italic">Cargando evaluaciones...</p>
      </div>
    `;
    renderPrestadorEvaluacionesPorPrestador(uid, 'filtro-fichas');

  } else if (activeTab === 'bitacoras') {
    dashboardContent.innerHTML = `
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 class="text-2xl font-black text-[#181411]">Bitácoras 📖</h2>
          <p class="text-sm text-gray-500">Visualiza todas las bitácoras registradas de cuidado con opción de filtro.</p>
        </div>
        <div>
          <input type="text" id="filtro-bitacoras-consejera" placeholder="🔍 Buscar por nido, RUT o cuidadora..." class="p-2 border border-gray-300 rounded-lg text-sm w-full md:w-72 bg-white" />
        </div>
      </div>
      <div class="space-y-4" id="consejera-bitacoras-list">
        <p class="text-center py-10 text-gray-400 italic">Cargando bitácoras...</p>
      </div>
    `;

    try {
      const bitacoras = await fetchAllBitacoras();
      const listContainer = document.getElementById('consejera-bitacoras-list');
      const inputFiltro = document.getElementById('filtro-bitacoras-consejera');

      const renderList = (items) => {
        if (!listContainer) return;
        if (items.length === 0) {
          listContainer.innerHTML = '<p class="text-center py-10 text-gray-400 italic">No se encontraron bitácoras.</p>';
          return;
        }

        listContainer.innerHTML = items.map(reg => {
          const fechaObj = reg.creadoEn ? new Date(reg.creadoEn) : new Date(0);
          const dateStr = fechaObj.toLocaleDateString('es-CL');
          const timeStr = fechaObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          
          const nidoNameSafe = escapeHTML(reg.nidoNombreBebe || (reg.nidoId ? reg.nidoId.slice(0, 8) : 'N/A'));
          const prestadorNameSafe = escapeHTML(reg.prestadorNombre || 'Prestador');
          const nidoRutSafe = escapeHTML(reg.nidoRutBebe || 'N/A');
          const prestadorRolSafe = escapeHTML(reg.prestadorRol || 'Cuidadora');
          const tipoAlimentacionSafe = escapeHTML(reg.tipoAlimentacion || 'N/A');
          const observacionesSafe = escapeHTML(reg.observaciones || 'Sin observaciones');

          return `
            <div class="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative pl-8 border-l-4 border-emerald-500 slide-up">
              <div class="flex justify-between items-start mb-3 flex-wrap gap-2">
                <div>
                  <span class="text-xs text-gray-400 font-bold block">${dateStr} a las ${timeStr} hrs</span>
                  <h4 class="font-bold text-lg text-[#181411]">Bitácora de Cuidado - Nido: ${nidoNameSafe}</h4>
                  <p class="text-xs text-[#887263]">Registrado por: ${prestadorNameSafe} • RUT Bebé: ${nidoRutSafe}</p>
                </div>
                <span class="text-xs font-bold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full uppercase tracking-wider">🍼 ${prestadorRolSafe}</span>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-xl mb-4 border border-gray-100 text-xs">
                <div><strong>🥛 Alimentación:</strong> ${tipoAlimentacionSafe}</div>
                <div><strong>😴 Horas Sueño:</strong> ${reg.horasSueno || 0}</div>
                <div><strong>🧻 Pañales:</strong> ${reg.cantidadPanales || 0}</div>
              </div>
              <div class="text-sm text-gray-600">${observacionesSafe}</div>
            </div>
          `;
        }).join('');
      };

      renderList(bitacoras);

      if (inputFiltro) {
        inputFiltro.addEventListener('input', (e) => {
          const val = e.target.value.toLowerCase();
          const filtered = bitacoras.filter(b => {
            const nombre = (b.nidoNombreBebe || '').toLowerCase();
            const rut = (b.nidoRutBebe || '').toLowerCase();
            const prestador = (b.prestadorNombre || '').toLowerCase();
            return nombre.includes(val) || rut.includes(val) || prestador.includes(val);
          });
          renderList(filtered);
        });
      }
    } catch (e) {
      console.error("Error al cargar bitácoras:", e);
      const listContainer = document.getElementById('consejera-bitacoras-list');
      if (listContainer) {
        listContainer.innerHTML = '<p class="text-center py-10 text-red-500 italic">Error al cargar las bitácoras.</p>';
      }
    }

  } else if (activeTab === 'horarios') {
    await renderConsejeraHorarios(dashboardContent, userData);

  } else if (activeTab === 'tarifas') {
    renderTarifasForm(dashboardContent, userData, uid, 'consejera');
  }
}