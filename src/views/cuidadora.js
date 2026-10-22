import { showToast } from '../ui/notifications.js';
import { fetchServiceAppointments, updateAppointmentDateTime, actualizarEstadoCita } from '../api/firestore.js';
import { escapeHTML } from '../utils/html.js';
import { renderPrestadorFichas } from './prestador.js';
import { renderTarifasForm } from './shared/tarifas.js';
import { renderCuidadoraDisponibilidad } from './cuidadora/disponibilidad.js';

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
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 class="text-2xl font-black text-[#181411]">Mis Atenciones (Cuidadora) 🌙</h2>
            <p class="text-[#887263]">Gestiona la aprobación y modificación de tus turnos asignados.</p>
          </div>
        </div>
      </div>
      <div class="space-y-4" id="cuidadora-turnos-list">
        ${appointments.length > 0 ? appointments.map(app => {
          const estado = app.estado || 'Pendiente';
          // CORRECCIÓN: Forzamos minúsculas
          const estadoNormalizado = estado.toLowerCase().trim();
          
          const slotDataId = app.slotId || app.slotAsignado || '';
          const profDataId = app.profesionalId || app.prestadorId || app.cuidadoraId || '';
          const nidoDataId = app.nidoId || '';
          
          const appIdSafe = escapeHTML(app.id || '');
          const nidoIdSafe = escapeHTML(nidoDataId);
          const horaSafe = escapeHTML(app.hora || '');
          const nombreSafe = escapeHTML(app.nombre || '');
          const fechaSafe = escapeHTML(app.fecha || '');
          const emailSafe = escapeHTML(app.email || '');

          // Traductor de Fechas
          let dateInputVal = fechaSafe;
          const fParts = fechaSafe.split('-');
          if (fParts.length === 3 && fParts[0].length === 2) {
              dateInputVal = `${fParts[2]}-${fParts[1]}-${fParts[0]}`;
          }

          // Traductor de Horas
          let timeInputVal = '';
          const tMatch = horaSafe.match(/\d{2}:\d{2}/);
          if (tMatch) timeInputVal = tMatch[0];

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
              <p class="text-xs text-gray-500">Fecha actual: <span class="font-bold text-gray-700">${fechaSafe}</span> • Hora: ${horaSafe}</p>
              <p class="text-sm text-gray-600 mt-1">Cliente: ${emailSafe}</p>
            </div>
            
            <div class="bg-gray-50 p-3 rounded-lg border border-gray-100 flex items-center gap-2">
              <div>
                <input type="date" value="${dateInputVal}" class="edit-fecha p-1 border rounded text-xs block mb-1" data-id="${appIdSafe}" />
                <input type="time" value="${timeInputVal}" class="edit-hora p-1 border rounded text-xs block" data-id="${appIdSafe}" />
              </div>
              <button data-id="${appIdSafe}" class="btn-guardar-cambio-cita bg-gray-800 hover:bg-[#e87a30] text-white text-xs font-bold px-3 py-2 rounded transition">Actualizar</button>
            </div>

            <div>
              ${actionButtons}
            </div>
          </div>
          `;
        }).join('') : `
          <p class="text-center py-10 text-gray-400 italic">No tienes turnos programados en el sistema.</p>
        `}
      </div>
    `;

    // Handler para Modificar Fecha
    dashboardContent.querySelectorAll('.btn-guardar-cambio-cita').forEach(btn => {
      btn.onclick = async () => {
        const id = btn.dataset.id;
        const container = btn.closest('div.bg-gray-50');
        const nuevaFecha = container.querySelector('.edit-fecha').value;
        const nuevaHora = container.querySelector('.edit-hora').value;

        if (!nuevaFecha || !nuevaHora) {
          showToast('Selecciona fecha y hora', 'warning');
          return;
        }

        let fechaParaGuardar = nuevaFecha;
        if (nuevaFecha.includes('-')) {
            const parts = nuevaFecha.split('-');
            if (parts[0].length === 4) {
                fechaParaGuardar = `${parts[2]}-${parts[1]}-${parts[0]}`;
            }
        }

        try {
          btn.disabled = true;
          btn.textContent = '...';
          await updateAppointmentDateTime(id, fechaParaGuardar, nuevaHora);
          showToast('Turno actualizado con éxito', 'success');
          renderCuidadoraTab('dashboard', userData, openFichaCuidadoModal);
        } catch (e) {
          showToast('Error al actualizar turno', 'error');
          btn.disabled = false;
          btn.textContent = 'Actualizar';
        }
      };
    });

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
        if (!confirm('¿Segura que deseas rechazar este turno? El horario se volverá a liberar para otros padres.')) return;
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
      <h2 class="text-2xl font-black text-[#181411] mb-6">📋 Mis Bitácoras</h2>
      <div class="space-y-4" id="prestador-fichas-list">
        <p class="text-center py-10 text-gray-400 italic">Cargando bitácoras...</p>
      </div>
    `;
    renderPrestadorFichas(uid);

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
      <h2 class="text-2xl font-black text-[#181411] mb-6">📝 Registro y Creación de Fichas</h2>
      <p class="text-sm text-gray-600 mb-4">Aquí puedes consultar las fichas de los servicios realizados a tus nidos asignados.</p>
      <div class="space-y-4" id="prestador-fichas-list">
        <p class="text-center py-10 text-gray-400 italic">Cargando fichas de nidos...</p>
      </div>
    `;
    renderPrestadorFichas(uid);

  } else if (activeTab === 'disponibilidad') {
    await renderCuidadoraDisponibilidad(dashboardContent, userData);

  } else if (activeTab === 'tarifas') {
    renderTarifasForm(dashboardContent, userData, uid, 'cuidadora');
  }
}