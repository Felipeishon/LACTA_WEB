import { showToast } from '../ui/notifications.js';
import { getAvailabilitySlots, addAvailabilitySlot, removeAvailabilitySlot, fetchServiceAppointments, updateAppointmentDateTime } from '../api/firestore.js';
import { escapeHTML } from '../utils/html.js';
import { renderPrestadorFichas } from './prestador.js';
import { renderTarifasForm } from './shared/tarifas.js';

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
            <p class="text-[#887263]">Gestiona y modifica la programación de tus turnos asignados.</p>
          </div>
        </div>
      </div>
      <div class="space-y-4" id="cuidadora-turnos-list">
        ${appointments.length > 0 ? appointments.map(app => `
          <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between flex-wrap gap-4">
            <div>
              <h4 class="font-bold text-lg">${escapeHTML(app.nombre)}</h4>
              <p class="text-xs text-gray-500">Fecha actual: <span class="font-bold text-gray-700">${escapeHTML(app.fecha)}</span> • Hora: ${escapeHTML(app.hora)} • Duración: ${app.duracion} hrs</p>
              <p class="text-sm text-gray-600 mt-1">Cliente: ${escapeHTML(app.email)}</p>
            </div>
            
            <div class="bg-gray-50 p-3 rounded-lg border border-gray-100 flex items-center gap-2">
              <div>
                <input type="date" value="${escapeHTML(app.fecha)}" class="edit-fecha p-1 border rounded text-xs block mb-1" data-id="${app.id}" />
                <input type="time" value="${escapeHTML(app.hora)}" class="edit-hora p-1 border rounded text-xs block" data-id="${app.id}" />
              </div>
              <button data-id="${app.id}" class="btn-guardar-cambio-cita bg-gray-800 hover:bg-[#e87a30] text-white text-xs font-bold px-3 py-2 rounded transition">Actualizar</button>
            </div>

            <div>
              ${app.estado === 'completada' ? `
                <span class="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-full font-bold">Bitácora Guardada ✅</span>
              ` : `
                <button data-id="${escapeHTML(app.id)}" data-nid="${escapeHTML(app.nidoId || '')}" class="btn-abrir-ficha bg-[#e87a30] hover:bg-[#d66a20] text-white font-bold py-2 px-4 rounded-lg text-xs transition">
                  Completar Bitácora 📝
                </button>
              `}
            </div>
          </div>
        `).join('') : `
          <p class="text-center py-10 text-gray-400 italic">No tienes turnos programados en el sistema.</p>
        `}
      </div>
    `;

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

        try {
          btn.disabled = true;
          btn.textContent = '...';
          await updateAppointmentDateTime(id, nuevaFecha, nuevaHora);
          showToast('Turno actualizado con éxito', 'success');
          renderCuidadoraTab('dashboard', userData, openFichaCuidadoModal);
        } catch (e) {
          showToast('Error al actualizar turno', 'error');
          btn.disabled = false;
          btn.textContent = 'Actualizar';
        }
      };
    });

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
    // Validar si tiene servicios o citas con nidos asignados para habilitar esta sección
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
    dashboardContent.innerHTML = `
      <div class="space-y-8">
        <div>
          <h3 class="font-bold text-xl mb-2">Mi Disponibilidad (Turnos)</h3>
          <p class="text-sm text-gray-500 mb-4">Declara los turnos en los que estás disponible para recibir reservas.</p>
          <div class="bg-white border border-gray-200 rounded-xl p-4">
            <button id="btnOpenAddSlotModal" class="w-full bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg text-sm hover:bg-indigo-700 transition shadow-sm">
              + Declarar Nuevo Turno Disponible
            </button>
            <h4 class="font-bold text-sm text-gray-800 mt-6 mb-2">Turnos Activos:</h4>
            <ul class="space-y-2" id="caregiver-availability-slots-list"></ul>
          </div>
        </div>
      </div>

      <div id="addSlotModal" class="fixed inset-0 bg-black/60 hidden items-center justify-center p-4 z-[100]">
        <div class="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
          <h3 class="font-bold text-lg mb-4">Declarar Nuevo Turno</h3>
          <form id="addSlotForm" class="space-y-4">
            <div>
              <label class="block text-xs font-bold text-gray-700 mb-1">Fecha y Hora de Inicio</label>
              <input type="datetime-local" id="slot-start-date" required class="w-full p-2 border border-gray-300 rounded-lg text-sm">
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-700 mb-1">Fecha y Hora de Fin</label>
              <input type="datetime-local" id="slot-end-date" required class="w-full p-2 border border-gray-300 rounded-lg text-sm">
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-700 mb-1">Zona de Atención</label>
              <input type="text" id="slot-zona" placeholder="Ej: Las Condes, Providencia" required class="w-full p-2 border border-gray-300 rounded-lg text-sm">
            </div>
            <div class="flex justify-end gap-4 pt-4">
              <button type="button" id="btnCloseAddSlotModal" class="bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-lg text-sm">Cancelar</button>
              <button type="submit" id="btnSaveSlot" class="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg text-sm">Guardar Turno</button>
            </div>
          </form>
        </div>
      </div>
    `;
    setupAvailabilityHandlers(uid);

  } else if (activeTab === 'tarifas') {
    renderTarifasForm(dashboardContent, userData, uid, 'cuidadora');
  }
}

function setupAvailabilityHandlers(uid) {
  if (!uid || uid === 'undefined') {
    showToast('Error de sesión, no se puede gestionar la disponibilidad.', 'error');
    return;
  }

  loadCaregiverAvailabilitySlots(uid);

  const addSlotModal = document.getElementById('addSlotModal');
  const btnOpenModal = document.getElementById('btnOpenAddSlotModal');
  const btnCloseModal = document.getElementById('btnCloseAddSlotModal');
  const addSlotForm = document.getElementById('addSlotForm');

  btnOpenModal.onclick = () => {
    addSlotModal.classList.remove('hidden');
    addSlotModal.classList.add('flex');
  };
  
  btnCloseModal.onclick = () => {
    addSlotModal.classList.add('hidden');
    addSlotModal.classList.remove('flex');
  };
  
  addSlotModal.onclick = (e) => {
    if (e.target === addSlotModal) {
      addSlotModal.classList.add('hidden');
      addSlotModal.classList.remove('flex');
    }
  };

  addSlotForm.onsubmit = async (e) => {
    e.preventDefault();
    const startDate = document.getElementById('slot-start-date').value;
    const endDate = document.getElementById('slot-end-date').value;
    const zona = document.getElementById('slot-zona').value;

    if (new Date(endDate) <= new Date(startDate)) {
      showToast('La fecha de fin debe ser posterior a la de inicio.', 'error');
      return;
    }

    const btnSave = document.getElementById('btnSaveSlot');
    btnSave.disabled = true;
    btnSave.textContent = 'Guardando...';

    try {
      await addAvailabilitySlot(uid, {
        servicio: 'cuidado',
        fechaInicio: new Date(startDate),
        fechaFin: new Date(endDate),
        zona: zona,
      });
      showToast('Turno disponible agregado con éxito', 'success');
      
      addSlotModal.classList.add('hidden');
      addSlotModal.classList.remove('flex');
      addSlotForm.reset();
      loadCaregiverAvailabilitySlots(uid);
    } catch (error) {
      showToast('Error al guardar el turno.', 'error');
    } finally {
      btnSave.disabled = false;
      btnSave.textContent = 'Guardar Turno';
    }
  };
}

async function loadCaregiverAvailabilitySlots(uid) {
  const slotsList = document.getElementById('caregiver-availability-slots-list');
  if (!slotsList) return;

  slotsList.innerHTML = '<li class="p-2 text-center text-gray-400 italic">Cargando turnos...</li>';

  try {
    const slots = await getAvailabilitySlots(uid);
    if (slots.length === 0) {
      slotsList.innerHTML = '<li class="p-2 text-center text-gray-400 italic">No tienes turnos futuros disponibles.</li>';
    } else {
      slotsList.innerHTML = slots.map(slot => {
        const isReserved = slot.reservado;
        const statusClass = isReserved ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700';
        const statusText = isReserved ? 'Reservado' : 'Disponible';

        return `
          <li class="flex items-center justify-between bg-gray-50 p-3 rounded-lg border">
            <div>
              <p class="font-bold text-gray-800 text-sm">${formatDateRange(slot.fechaInicio, slot.fechaFin)}</p>
              <p class="text-xs text-gray-500">📍 ${escapeHTML(slot.zona)}</p>
            </div>
            <div class="flex items-center gap-4">
              <span class="text-xs font-bold px-2 py-1 rounded-full ${statusClass}">${statusText}</span>
              ${!isReserved ? `
                <button data-id="${escapeHTML(slot.id)}" class="btn-delete-slot text-red-400 hover:text-red-700 text-xs font-semibold">Eliminar</button>
              ` : ''}
            </div>
          </li>
        `;
      }).join('');

      slotsList.querySelectorAll('.btn-delete-slot').forEach(btn => {
        btn.onclick = async () => {
          if (confirm('¿Seguro que quieres eliminar este turno disponible?')) {
            try {
              await removeAvailabilitySlot(uid, btn.dataset.id);
              showToast('Turno eliminado', 'success');
              loadCaregiverAvailabilitySlots(uid);
            } catch (e) {
              showToast('Error al eliminar el turno', 'error');
            }
          }
        };
      });
    }
  } catch (e) {
    slotsList.innerHTML = '<li class="p-2 text-center text-red-500 italic">Error al cargar los turnos.</li>';
  }
}

function formatDateRange(start, end) {
  const startDate = start.toDate();
  const endDate = end.toDate();
  const options = { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' };
  return `${startDate.toLocaleDateString('es-CL', options)} → ${endDate.toLocaleDateString('es-CL', options)}`;
}