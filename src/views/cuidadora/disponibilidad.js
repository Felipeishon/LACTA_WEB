import { showToast } from '../../ui/notifications.js';
import { getAvailabilitySlots, addAvailabilitySlot, removeAvailabilitySlot } from '../../api/firestore.js';
import { escapeHTML } from '../../utils/html.js';
import { showConfirmModal } from '../../modales.js';

export async function renderCuidadoraDisponibilidad(dashboardContent, userData) {
  const uid = userData?.uid || userData?.id;
  const opcionesHora = Array.from({ length: 24 }, (_, hora) =>
    `<option value="${String(hora).padStart(2, '0')}">${String(hora).padStart(2, '0')}</option>`
  ).join('');
  const opcionesMinuto = ['00', '30'].map(minuto =>
    `<option value="${minuto}">${minuto}</option>`
  ).join('');

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
              <label class="block text-xs font-bold text-gray-700 mb-1">📅 Fecha de Inicio</label>
              <input type="date" id="slot-start-date" required class="w-full p-2 border border-gray-300 rounded-lg text-sm">
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-700 mb-1">⏰ Hora de Inicio</label>
              <div class="flex gap-2">
                <select id="slot-start-hour" required class="flex-1 min-w-0 p-2 border border-gray-300 rounded-lg text-sm">${opcionesHora}</select>
                <select id="slot-start-minute" required class="flex-1 min-w-0 p-2 border border-gray-300 rounded-lg text-sm">${opcionesMinuto}</select>
              </div>
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-700 mb-1">📅 Fecha de Fin</label>
              <input type="date" id="slot-end-date" required class="w-full p-2 border border-gray-300 rounded-lg text-sm">
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-700 mb-1">⏰ Hora de Fin</label>
              <div class="flex gap-2">
                <select id="slot-end-hour" required class="flex-1 min-w-0 p-2 border border-gray-300 rounded-lg text-sm">${opcionesHora}</select>
                <select id="slot-end-minute" required class="flex-1 min-w-0 p-2 border border-gray-300 rounded-lg text-sm">${opcionesMinuto}</select>
              </div>
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
    const startDateVal = document.getElementById('slot-start-date').value;
    const startTimeVal = `${document.getElementById('slot-start-hour').value}:${document.getElementById('slot-start-minute').value}`;
    const endDateVal = document.getElementById('slot-end-date').value;
    const endTimeVal = `${document.getElementById('slot-end-hour').value}:${document.getElementById('slot-end-minute').value}`;

    if (!startDateVal || !startTimeVal || !endDateVal || !endTimeVal) {
      showToast('Debes completar todas las fechas y horas.', 'error');
      return;
    }

    const startDateTime = new Date(`${startDateVal}T${startTimeVal}:00`);
    const endDateTime = new Date(`${endDateVal}T${endTimeVal}:00`);

    const horasDiferencia = (startDateTime - new Date()) / (1000 * 60 * 60);
    if (horasDiferencia < 48) {
      showToast('Los turnos de cuidado deben declararse con al menos 48 horas de anticipación.', 'warning');
      return;
    }

    if (endDateTime <= startDateTime) {
      showToast('La fecha y hora de fin debe ser posterior a la de inicio.', 'error');
      return;
    }

    const btnSave = document.getElementById('btnSaveSlot');
    btnSave.disabled = true;
    btnSave.textContent = 'Guardando...';

    try {
      await addAvailabilitySlot(uid, {
        servicio: 'cuidado',
        tipoServicio: 'cuidado',
        fechaInicio: startDateTime,
        fechaFin: endDateTime,
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
    const slots = await getAvailabilitySlots(uid, 'cuidado');
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
          const confirmado = await showConfirmModal('Eliminar Turno', '¿Seguro que quieres eliminar este turno disponible?');
          if (!confirmado) return;
          try {
            await removeAvailabilitySlot(uid, btn.dataset.id);
            showToast('Turno eliminado', 'success');
            loadCaregiverAvailabilitySlots(uid);
          } catch (e) {
            showToast('Error al eliminar el turno', 'error');
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
