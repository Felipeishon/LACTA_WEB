import { showToast } from '../ui/notifications.js';
import { fetchServiceAppointments, actualizarEstadoCita } from '../api/firestore.js';
import { escapeHTML } from '../utils/html.js';
import { formatDateRange } from '../utils/helpers.js';
import { renderPrestadorFichas } from './prestador.js';
import { renderTarifasForm } from './shared/tarifas.js';
import { renderCuidadoraDisponibilidad } from './cuidadora/disponibilidad.js';
import { showConfirmModal } from '../modales.js';

export async function renderCuidadoraTab(activeTab, userData, openFichaCuidadoModal) {
  const dashboardContent = document.getElementById('dashboard-content');
  if (!dashboardContent) return;

  const uid = userData?.uid || userData?.id;
  if (!uid || uid === 'undefined') {
    dashboardContent.innerHTML = `<div class="text-center p-8"><p class="text-red-500 font-bold">Error Crítico</p><p class="text-gray-600">No se pudo identificar la cuenta del usuario.</p></div>`;
    return;
  }

  if (activeTab === 'dashboard') {
    const appointments = await fetchServiceAppointments('Cuidador', uid);
    dashboardContent.innerHTML = `
      <div class="glass-panel p-8 rounded-2xl border-t-4 border-[#887263] mb-8">
        <h2 class="text-2xl font-black text-[#181411]">Mi Agenda 📅</h2>
        <p class="text-[#887263] text-sm">Gestiona la aprobación y atención de tus citas.</p>
      </div>
      ${appointments.length > 0 ? `<div class="space-y-4" id="cuidadora-turnos-list">${appointments.map(app => {
          const estado = app.estado || 'Pendiente';
          // CORRECCIÓN: Forzamos minúsculas
          const estadoNormalizado = estado.toLowerCase().trim();
          
          const slotDataId = app.slotId || app.slotAsignado || '';
          const profDataId = app.profesionalId || app.prestadorId || app.cuidadoraId || '';
          const nidoDataId = app.nidoId || '';
          
          const appIdSafe = escapeHTML(app.id || '');
          const nidoIdSafe = escapeHTML(nidoDataId);
          const nombreSafe = escapeHTML(app.nombre || '');
          const [horaInicio, horaFin] = String(app.hora || '').split(/\s+a\s+/i);
          const fechaHora = formatDateRange(
            app.fechaInicio || (horaInicio ? `${app.fecha}T${horaInicio}` : null),
            app.fechaFin || (horaFin ? `${app.fecha}T${horaFin}` : null)
          ) || [app.fecha, app.hora].filter(Boolean).join(' ');
          const fechaHoraSafe = escapeHTML(fechaHora);
          const emailSafe = escapeHTML(app.email || '');

          let actionButtons = '';

          // Control Inteligente de Botones
          if (estadoNormalizado === 'pendiente') {
            actionButtons = `
              <div class="flex gap-2">
                <button data-id="${appIdSafe}" data-slot="${slotDataId}" data-prof="${profDataId}" class="btn-rechazar-cita bg-red-100 hover:bg-red-200 text-red-700 font-bold py-2 px-3 rounded-lg text-xs transition">Rechazar</button>
                <button data-id="${appIdSafe}" class="btn-aprobar-cita bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-3 rounded-lg text-xs transition">Aprobar Turno</button>
              </div>
            `;
          } else if (estadoNormalizado === 'aprobado') {
            actionButtons = `
              <button data-id="${appIdSafe}" data-nid="${nidoIdSafe}" class="btn-abrir-ficha bg-[#e87a30] hover:bg-[#d66a20] text-white font-bold py-2 px-4 rounded-lg text-xs transition">
                Completar Bitácora 📝
              </button>
            `;
          } else if (estadoNormalizado === 'completada') {
            actionButtons = `<span class="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-full font-bold">Bitácora Guardada ✅</span>`;
          } else {
            actionButtons = `<span class="text-xs bg-gray-100 text-gray-500 px-3 py-1.5 rounded-full font-bold uppercase tracking-wider">${estado}</span>`;
          }

          return `
          <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between flex-wrap gap-4">
            <div>
              <h4 class="font-bold text-lg">${nombreSafe}</h4>
              <p class="text-xs text-gray-500">Fecha: <span class="font-bold text-gray-700">${fechaHoraSafe}</span></p>
              <p class="text-sm text-gray-600 mt-1">Cliente: ${emailSafe}</p>
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
          btn.textContent = 'Aprobando...';
          btn.disabled = true;
          await actualizarEstadoCita(btn.dataset.id, 'Aprobado');
          showToast('Cita aprobada correctamente', 'success');
          renderCuidadoraTab('dashboard', userData, openFichaCuidadoModal);
        } catch (e) {
          showToast('Error al aprobar', 'error');
          btn.disabled = false;
        }
      };
    });

    // Handler para Rechazar
    dashboardContent.querySelectorAll('.btn-rechazar-cita').forEach(btn => {
      btn.onclick = async () => {
        const confirmado = await showConfirmModal('Rechazar Turno', '¿Segura que deseas rechazar este turno? El horario se volverá a liberar para otros padres.');
        if (!confirmado) return;
        try {
          btn.textContent = 'Rechazando...';
          btn.disabled = true;
          const { id, slot, prof } = btn.dataset;
          await actualizarEstadoCita(id, 'Rechazada', slot, prof);
          showToast('Turno rechazado y horario liberado', 'success');
          renderCuidadoraTab('dashboard', userData, openFichaCuidadoModal);
        } catch (e) {
          showToast('Error al rechazar', 'error');
          btn.disabled = false;
        }
      };
    });

    // Handler para Completar Bitácora
    dashboardContent.querySelectorAll('.btn-abrir-ficha').forEach(btn => {
      btn.onclick = () => {
        const { id, nid } = btn.dataset;
        openFichaCuidadoModal(id, nid);
      };
    });

  } else if (activeTab === 'historial_fichas') {
    dashboardContent.innerHTML = `
      <div class="mb-6">
        <div>
          <h2 class="text-2xl font-black text-[#181411]">Mis Bitácoras 📖</h2>
          <p class="text-sm text-gray-500 mb-3">Visualiza todas las bitácoras registradas de cuidado con opción de filtro.</p>
        </div>
        <div>
          <input type="text" id="filtro-bitacoras-cuidadora" placeholder="🔍 Buscar por nido, RUT o cuidadora..." class="p-2 border border-gray-300 rounded-lg text-sm w-full md:w-72 bg-white" />
        </div>
      </div>
      <div class="space-y-4" id="prestador-fichas-list">
        <p class="text-center py-10 text-gray-400 italic">Cargando bitácoras...</p>
      </div>
    `;
    renderPrestadorFichas(uid, 'filtro-bitacoras-cuidadora');

  } else if (activeTab === 'fichas_cuidado') {
    const appointments = await fetchServiceAppointments('Cuidador', uid);
    const tieneServiciosValidos = appointments.some(app => app.nidoId);

    if (!tieneServiciosValidos) {
      dashboardContent.innerHTML = `
        <div class="glass-panel p-10 rounded-2xl text-center max-w-lg mx-auto mt-10 border-t-4 border-amber-500">
          <span class="text-4xl mb-3 block">🔒</span>
          <h3 class="font-bold text-xl text-[#181411] mb-2">Sección No Habilitada</h3>
          <p class="text-sm text-gray-600">Las Fichas de Cuidado solo se habilitan una vez que hayas realizado un servicio de cuidado efectivo asociado a una familia/nido.</p>
        </div>
      `;
      return;
    }

    dashboardContent.innerHTML = `
      <div class="flex justify-between items-center mb-4 flex-wrap gap-4">
        <div>
          <h2 class="text-2xl font-black text-[#181411]">Evaluaciones 📝</h2>
          <p class="text-sm text-gray-600 mt-1">Aquí puedes consultar las fichas de los servicios realizados a tus nidos asignados.</p>
        </div>
        <input type="text" id="filtro-evaluaciones-cuidadora" placeholder="🔍 Buscar por nido, RUT o cliente..." class="p-2 border border-gray-300 rounded-lg text-sm w-72 bg-white mb-4" />
      </div>
      <div class="space-y-4" id="prestador-fichas-list">
        <p class="text-center py-10 text-gray-400 italic">Cargando fichas de nidos...</p>
      </div>
    `;
    renderPrestadorFichas(uid, 'filtro-evaluaciones-cuidadora');

  } else if (activeTab === 'disponibilidad') {
    await renderCuidadoraDisponibilidad(dashboardContent, userData);

  } else if (activeTab === 'tarifas') {
    renderTarifasForm(dashboardContent, userData, uid, 'cuidadora');
  }
}