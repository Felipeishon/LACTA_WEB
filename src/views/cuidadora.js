import { showToast } from '../ui/notifications.js';
// IMPORTANTE: Asegúrate de que `saveUserTarifas` se agregue en el import de firestore.js
import { getAvailabilitySlots, addAvailabilitySlot, removeAvailabilitySlot, addCaregiverBlockedDay, removeCaregiverBlockedDay, getCaregiverBlockedDays, fetchServiceAppointments, saveUserTarifas } from '../api/firestore.js';
import { escapeHTML } from '../utils/html.js';
import { renderPrestadorFichas } from './prestador.js';

export async function renderCuidadoraTab(activeTab, userData, openFichaCuidadoModal) {
  const dashboardContent = document.getElementById('dashboard-content');
  if (!dashboardContent) return;

  const uid = userData?.uid || userData?.id;
  if (!uid || uid === 'undefined') {
    console.error("renderCuidadoraTab fue llamado sin un UID de usuario válido.", { userData });
    dashboardContent.innerHTML = `<div class="text-center p-8"><p class="text-red-500 font-bold">Error Crítico</p><p class="text-gray-600">No se pudo identificar la cuenta del usuario (UID faltante). Por favor, recarga la página.</p></div>`;
    return;
  }

  if (activeTab === 'dashboard') {
    const appointments = await fetchServiceAppointments('Cuidador', uid);
    dashboardContent.innerHTML = `
      <div class="glass-panel p-8 rounded-2xl border-t-4 border-[#887263] mb-8">
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 class="text-2xl font-black text-[#181411]">Hola ${escapeHTML(userData.nombre)} 🍼</h2>
            <p class="text-[#887263]">Gestiona tus turnos asignados de cuidado infantil.</p>
          </div>
        </div>
      </div>
      <h3 class="font-bold text-lg mb-4">Turnos de Cuidado Asignados</h3>
      <div class="space-y-4" id="cuidadora-turnos-list">
        ${appointments.length > 0 ? appointments.map(app => `
          <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between flex-wrap gap-4">
            <div>
              <h4 class="font-bold text-lg">${escapeHTML(app.nombre)}</h4>
              <p class="text-xs text-gray-500">Fecha: ${escapeHTML(app.fecha)} • Hora: ${escapeHTML(app.hora)} • Duración: ${app.duracion} hrs</p>
              <p class="text-sm text-gray-600 mt-1">${escapeHTML(app.email)}</p>
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

    dashboardContent.querySelectorAll('.btn-abrir-ficha').forEach(btn => {
      btn.onclick = () => {
        const { id, nid } = btn.dataset;
        openFichaCuidadoModal(id, nid);
      };
    });

  } else if (activeTab === 'historial_fichas') {
    dashboardContent.innerHTML = `
      <h2 class="text-2xl font-black text-[#181411] mb-6">📋 Historial de Bitácoras Entregadas</h2>
      <div class="space-y-4" id="prestador-fichas-list">
        <p class="text-center py-10 text-gray-400 italic">Cargando fichas...</p>
      </div>
    `;
    renderPrestadorFichas(uid);

  } else if (activeTab === 'disponibilidad') {
    dashboardContent.innerHTML = `
      <div class="space-y-8">
        <div>
          <h3 class="font-bold text-xl mb-2">Mis Turnos Disponibles</h3>
          <p class="text-sm text-gray-500 mb-4">Declara los turnos en los que estás disponible para recibir reservas.</p>
          <div class="bg-white border border-gray-200 rounded-xl p-4">
            <button id="btnOpenAddSlotModal" class="w-full bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg text-sm hover:bg-indigo-700 transition shadow-sm">
              + Declarar Nuevo Turno Disponible
            </button>
            <h4 class="font-bold text-sm text-gray-800 mt-6 mb-2">Turnos Activos:</h4>
            <ul class="space-y-2" id="caregiver-availability-slots-list"></ul>
          </div>
        </div>

        <div>
          <h3 class="font-bold text-xl mb-2">Bloqueo de Días Completos</h3>
          <p class="text-sm text-gray-500 mb-4">Ingresa fechas específicas que deseas bloquear por vacaciones o descanso.</p>
          <div class="bg-white border border-gray-200 rounded-xl p-4">
            <div class="flex flex-col md:flex-row gap-4 items-end mb-6">
              <div class="flex-1 w-full">
                <label class="block text-xs font-bold text-gray-700 mb-1">Fecha a bloquear</label>
                <input type="date" id="bloqueo-date" class="w-full p-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div class="flex-1 w-full">
                <label class="block text-xs font-bold text-gray-700 mb-1">Motivo (Opcional)</label>
                <input type="text" id="bloqueo-motivo" placeholder="Ej. Cumpleaños, Descanso..." class="w-full p-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <button id="btnAñadirBloqueo" class="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg text-sm transition-colors w-full md:w-auto h-[38px]">Añadir Bloqueo</button>
            </div>
            <h4 class="font-bold text-sm text-gray-800 mb-2">Bloqueos Activos:</h4>
            <ul class="space-y-2" id="caregiver-blocked-days-list"></ul>
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

  // --- NUEVA PESTAÑA: MIS TARIFAS ---
  } else if (activeTab === 'tarifas') {
    const tarifas = userData.tarifas || { baseHora: '', finDeSemanaHora: '', festivoHora: '' };
    
    dashboardContent.innerHTML = `
      <h3 class="font-bold text-2xl mb-2 text-[#181411]">Mis Tarifas 💰</h3>
      <p class="text-sm text-[#887263] mb-6">Configura el valor por hora de tus servicios para los padres.</p>
      
      <div class="glass-panel p-6 rounded-2xl max-w-lg border-t-4 border-[#e87a30]">
        <form id="form-tarifas" class="space-y-5">
          
          <div>
            <label class="block text-sm font-bold text-[#181411] mb-1">Tarifa Base (Lunes a Viernes)</label>
            <div class="relative">
              <span class="absolute left-3 top-2 text-gray-500 font-bold">$</span>
              <input type="number" id="tarifa-base" value="${tarifas.baseHora || ''}" required min="0" 
                class="w-full pl-8 p-2 border border-[#e5dfdc] rounded-lg text-sm focus:ring-[#e87a30] focus:border-[#e87a30]" 
                placeholder="15000">
            </div>
            <p class="text-xs text-gray-400 mt-1">Valor por cada hora en días hábiles.</p>
          </div>
          
          <div>
            <label class="block text-sm font-bold text-[#181411] mb-1">Tarifa Fin de Semana (Sáb y Dom)</label>
            <div class="relative">
              <span class="absolute left-3 top-2 text-gray-500 font-bold">$</span>
              <input type="number" id="tarifa-finde" value="${tarifas.finDeSemanaHora || ''}" required min="0" 
                class="w-full pl-8 p-2 border border-[#e5dfdc] rounded-lg text-sm focus:ring-[#e87a30] focus:border-[#e87a30]" 
                placeholder="20000">
            </div>
          </div>
          
          <div>
            <label class="block text-sm font-bold text-[#181411] mb-1">Tarifa Días Festivos</label>
            <div class="relative">
              <span class="absolute left-3 top-2 text-gray-500 font-bold">$</span>
              <input type="number" id="tarifa-festivo" value="${tarifas.festivoHora || ''}" required min="0" 
                class="w-full pl-8 p-2 border border-[#e5dfdc] rounded-lg text-sm focus:ring-[#e87a30] focus:border-[#e87a30]" 
                placeholder="25000">
            </div>
          </div>
          
          <div class="pt-4">
            <button type="submit" id="btnGuardarTarifas" 
              class="w-full bg-[#181411] hover:bg-[#e87a30] text-white font-bold py-3 rounded-xl text-sm transition-all shadow-md">
              Guardar Mis Tarifas
            </button>
          </div>

        </form>
      </div>
    `;

    document.getElementById('form-tarifas').onsubmit = async (e) => {
      e.preventDefault();
      const btn = document.getElementById('btnGuardarTarifas');
      btn.disabled = true;
      btn.textContent = 'Guardando...';
      
      try {
        const nuevasTarifas = {
          baseHora: parseInt(document.getElementById('tarifa-base').value),
          finDeSemanaHora: parseInt(document.getElementById('tarifa-finde').value),
          festivoHora: parseInt(document.getElementById('tarifa-festivo').value)
        };
        
        await saveUserTarifas(uid, nuevasTarifas);
        
        showToast('Tarifas guardadas exitosamente', 'success');
        userData.tarifas = nuevasTarifas; // Actualiza los datos en memoria local
      } catch (error) {
        showToast('Error al guardar las tarifas', 'error');
        console.error(error);
      } finally {
        btn.disabled = false;
        btn.textContent = 'Guardar Mis Tarifas';
      }
    };
  }
}

// --- FUNCIONES AUXILIARES DE CUIDADORA ---
function setupAvailabilityHandlers(uid) {
  if (!uid || uid === 'undefined') {
    console.error("setupAvailabilityHandlers fue llamado sin un UID válido. Abortando.");
    showToast('Error de sesión, no se puede gestionar la disponibilidad.', 'error');
    return;
  }

  loadCaregiverAvailabilitySlots(uid);
  loadCaregiverBlockedDays(uid);

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
      console.error(error);
    } finally {
      btnSave.disabled = false;
      btnSave.textContent = 'Guardar Turno';
    }
  };

  const btnBloqueo = document.getElementById('btnAñadirBloqueo');
  btnBloqueo.onclick = async () => {
    const dInput = document.getElementById('bloqueo-date');
    const mInput = document.getElementById('bloqueo-motivo');
    if (!dInput.value) {
      showToast('Selecciona una fecha', 'warning');
      return;
    }
    btnBloqueo.disabled = true;
    try {
      await addCaregiverBlockedDay(uid, dInput.value, mInput.value);
      showToast('Fecha bloqueada con éxito', 'success');
      dInput.value = '';
      mInput.value = '';
      loadCaregiverBlockedDays(uid);
    } catch (e) {
      showToast('Error al bloquear fecha', 'error');
    } finally {
      btnBloqueo.disabled = false;
    }
  };
}

async function loadCaregiverAvailabilitySlots(uid) {
  const slotsList = document.getElementById('caregiver-availability-slots-list');
  if (!slotsList) return;
  if (!uid || uid === 'undefined') {
    slotsList.innerHTML = '<li class="p-2 text-center text-red-500 italic">Error: ID de usuario no encontrado.</li>';
    return;
  }

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
  
  const startStr = startDate.toLocaleDateString('es-CL', options);
  const endStr = endDate.toLocaleDateString('es-CL', options);

  return `${startStr} → ${endStr}`;
}

async function loadCaregiverBlockedDays(uid) {
  const blockedDaysList = document.getElementById('caregiver-blocked-days-list');
  if (!blockedDaysList) return;
  if (!uid || uid === 'undefined') {
    blockedDaysList.innerHTML = '<li class="p-2 text-center text-red-500 italic">Error: ID de usuario no encontrado.</li>';
    return;
  }

  blockedDaysList.innerHTML = '<li class="p-2 text-center text-gray-400 italic">Cargando bloqueos...</li>';
  
  let bloqueos = [];
  try {
    bloqueos = await getCaregiverBlockedDays(uid);
  } catch (e) {
    console.warn("No se pudieron cargar los bloqueos. Asumiendo lista vacía.", e);
  }

  if (bloqueos.length === 0) {
    blockedDaysList.innerHTML = '<li class="p-2 text-center text-gray-400 italic">No tienes días bloqueados.</li>';
  } else {
    blockedDaysList.innerHTML = bloqueos.map(data => `
      <li class="flex items-center justify-between bg-red-50 p-2.5 rounded-lg border border-red-100">
        <div class="flex items-center gap-3">
          <span class="text-sm">⛔</span>
          <div>
            <p class="font-bold text-red-800 text-sm">${escapeHTML(data.date)}</p>
            <p class="text-xs text-red-600">${escapeHTML(data.motivo || 'Sin motivo')}</p>
          </div>
        </div>
        <button data-id="${escapeHTML(data.id)}" class="btn-delete-block text-red-400 hover:text-red-700 text-xs font-semibold">Eliminar</button>
      </li>
    `).join('');

    blockedDaysList.querySelectorAll('.btn-delete-block').forEach(btn => {
      btn.onclick = async () => {
        if (confirm('¿Seguro que quieres eliminar este bloqueo?')) {
          try {
            await removeCaregiverBlockedDay(uid, btn.dataset.id);
            showToast('Bloqueo eliminado', 'success');
            loadCaregiverBlockedDays(uid);
          } catch(e) {
            showToast('Error al eliminar bloqueo', 'error');
          }
        }
      };
    });
  }
}