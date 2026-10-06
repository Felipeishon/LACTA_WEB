// src/views/shared/tarifas.js
import { saveUserTarifas } from '../../api/firestore.js';
import { showToast } from '../../ui/notifications.js';

export function renderTarifasForm(dashboardContent, userData, uid, currentRole = 'consejera') {
  const isConsejera = currentRole === 'consejera';
  const isCuidadora = currentRole === 'cuidadora';
  
  const tarifas = userData.tarifas || {};
  let formHTML = '';

  if (isConsejera) {
    const mods = tarifas.modalidades || [];
    const isPresencial = mods.includes('presencial');
    const isOnline = mods.includes('online');

    formHTML = `
      <div class="mb-5 pb-4 border-b border-gray-100">
        <label class="block text-sm font-bold text-[#181411] mb-2">Modalidad de Atención (Consejería)</label>
        <div class="flex gap-4">
          <label class="flex items-center gap-2 text-sm">
            <input type="checkbox" id="mod_presencial" value="presencial" class="form-checkbox text-[#e87a30]" ${isPresencial ? 'checked' : ''}>
            Presencial
          </label>
          <label class="flex items-center gap-2 text-sm">
            <input type="checkbox" id="mod_online" value="online" class="form-checkbox text-[#e87a30]" ${isOnline ? 'checked' : ''}>
            Online
          </label>
        </div>
      </div>

      <!-- Bloque de Tarifas Presenciales -->
      <div id="tarifas-presencial" class="${isPresencial ? 'block' : 'hidden'} mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
        <h4 class="font-bold text-[#181411] mb-3 text-sm">🩺 Tarifas Presenciales</h4>
        <div class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-gray-700 mb-1">Tarifa Base (Lunes a Viernes)</label>
            <div class="relative">
              <span class="absolute left-3 top-2 text-gray-500 font-bold">$</span>
              <input type="number" id="t_presencial_base" value="${tarifas.consejeraPresencialBase || ''}" min="0" class="w-full pl-8 p-2 border border-[#e5dfdc] rounded-lg text-sm focus:ring-[#e87a30]">
            </div>
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-700 mb-1">Tarifa Fin de Semana y Festivos</label>
            <div class="relative">
              <span class="absolute left-3 top-2 text-gray-500 font-bold">$</span>
              <input type="number" id="t_presencial_finde" value="${tarifas.consejeraPresencialFinde || ''}" min="0" class="w-full pl-8 p-2 border border-[#e5dfdc] rounded-lg text-sm focus:ring-[#e87a30]">
            </div>
          </div>
        </div>
      </div>

      <!-- Bloque de Tarifas Online -->
      <div id="tarifas-online" class="${isOnline ? 'block' : 'hidden'} mb-6 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
        <h4 class="font-bold text-[#181411] mb-3 text-sm">💻 Tarifas Online</h4>
        <div class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-gray-700 mb-1">Tarifa Base (Lunes a Viernes)</label>
            <div class="relative">
              <span class="absolute left-3 top-2 text-gray-500 font-bold">$</span>
              <input type="number" id="t_online_base" value="${tarifas.consejeraOnlineBase || ''}" min="0" class="w-full pl-8 p-2 border border-[#e5dfdc] rounded-lg text-sm focus:ring-[#e87a30]">
            </div>
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-700 mb-1">Tarifa Fin de Semana y Festivos</label>
            <div class="relative">
              <span class="absolute left-3 top-2 text-gray-500 font-bold">$</span>
              <input type="number" id="t_online_finde" value="${tarifas.consejeraOnlineFinde || ''}" min="0" class="w-full pl-8 p-2 border border-[#e5dfdc] rounded-lg text-sm focus:ring-[#e87a30]">
            </div>
          </div>
        </div>
      </div>
    `;
  } else if (isCuidadora) {
    formHTML = `
      <div class="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
        <h4 class="font-bold text-[#181411] mb-3 text-sm">🍼 Tarifas de Cuidado (Presencial)</h4>
        <div class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-gray-700 mb-1">Tarifa Base (Lunes a Viernes)</label>
            <div class="relative">
              <span class="absolute left-3 top-2 text-gray-500 font-bold">$</span>
              <input type="number" id="t_cuidadora_base" value="${tarifas.cuidadoraBase || ''}" required min="0" class="w-full pl-8 p-2 border border-[#e5dfdc] rounded-lg text-sm focus:ring-[#e87a30]">
            </div>
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-700 mb-1">Tarifa Fin de Semana y Festivos</label>
            <div class="relative">
              <span class="absolute left-3 top-2 text-gray-500 font-bold">$</span>
              <input type="number" id="t_cuidadora_finde" value="${tarifas.cuidadoraFinde || ''}" required min="0" class="w-full pl-8 p-2 border border-[#e5dfdc] rounded-lg text-sm focus:ring-[#e87a30]">
            </div>
          </div>
        </div>
      </div>
    `;
  }

  dashboardContent.innerHTML = `
    <h3 class="font-bold text-2xl mb-2 text-[#181411]">Mis Tarifas 💰</h3>
    <p class="text-sm text-[#887263] mb-6">Configura el valor por hora de tus servicios.</p>
    
    <div class="glass-panel p-6 rounded-2xl max-w-lg border-t-4 border-[#e87a30]">
      <form id="form-tarifas" class="space-y-4">
        ${formHTML}
        <div class="pt-2">
          <button type="submit" id="btnGuardarTarifas" class="w-full bg-[#181411] hover:bg-[#e87a30] text-white font-bold py-3 rounded-xl text-sm transition-all shadow-md">
            Guardar Mis Tarifas
          </button>
        </div>
      </form>
    </div>
  `;

  // Listeners para mostrar/ocultar los bloques dinámicamente si es Consejera
  if (isConsejera) {
    const chkPresencial = document.getElementById('mod_presencial');
    const chkOnline = document.getElementById('mod_online');
    const divPresencial = document.getElementById('tarifas-presencial');
    const divOnline = document.getElementById('tarifas-online');

    chkPresencial?.addEventListener('change', (e) => {
      divPresencial.classList.toggle('hidden', !e.target.checked);
      divPresencial.classList.toggle('block', e.target.checked);
    });

    chkOnline?.addEventListener('change', (e) => {
      divOnline.classList.toggle('hidden', !e.target.checked);
      divOnline.classList.toggle('block', e.target.checked);
    });
  }

  document.getElementById('form-tarifas').onsubmit = async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btnGuardarTarifas');
    btn.disabled = true;
    btn.textContent = 'Guardando...';
    
    try {
      // Mantenemos las tarifas del otro rol si el usuario tiene ambos
      let nuevasTarifas = { ...tarifas };

      if (isConsejera) {
        const chkP = document.getElementById('mod_presencial').checked;
        const chkO = document.getElementById('mod_online').checked;
        
        if (!chkP && !chkO) {
          showToast('Debes seleccionar al menos una modalidad', 'warning');
          btn.disabled = false;
          btn.textContent = 'Guardar Mis Tarifas';
          return;
        }

        const modalidades = [];
        if (chkP) modalidades.push('presencial');
        if (chkO) modalidades.push('online');
        nuevasTarifas.modalidades = modalidades;
        
        nuevasTarifas.consejeraPresencialBase = chkP ? (parseInt(document.getElementById('t_presencial_base').value) || 0) : 0;
        nuevasTarifas.consejeraPresencialFinde = chkP ? (parseInt(document.getElementById('t_presencial_finde').value) || 0) : 0;
        
        nuevasTarifas.consejeraOnlineBase = chkO ? (parseInt(document.getElementById('t_online_base').value) || 0) : 0;
        nuevasTarifas.consejeraOnlineFinde = chkO ? (parseInt(document.getElementById('t_online_finde').value) || 0) : 0;
      }

      if (isCuidadora) {
        nuevasTarifas.cuidadoraBase = parseInt(document.getElementById('t_cuidadora_base').value) || 0;
        nuevasTarifas.cuidadoraFinde = parseInt(document.getElementById('t_cuidadora_finde').value) || 0;
      }

      await saveUserTarifas(uid, nuevasTarifas);
      showToast('Tarifas guardadas exitosamente', 'success');
      userData.tarifas = nuevasTarifas; 
    } catch (error) {
      showToast('Error al guardar las tarifas', 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Guardar Mis Tarifas';
    }
  };
}