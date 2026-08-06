import { showToast } from '../ui/notifications.js';
import { fetchServiceAppointments, saveConsejeraSchedule, saveUserTarifas } from '../api/firestore.js';
import { escapeHTML } from '../utils/html.js';
import { renderPrestadorFichas } from './prestador.js';

export async function renderConsejeraTab(activeTab, userData, openFichaCuidadoModal) {
  const dashboardContent = document.getElementById('dashboard-content');
  if (!dashboardContent) return;

  const uid = userData?.uid || userData?.id;

  if (activeTab === 'dashboard' || activeTab === 'citas') {
    const appointments = await fetchServiceAppointments('Consultor', uid);
    dashboardContent.innerHTML = `
      <div class="flex items-center justify-between mb-6">
        <div>
          <h2 class="text-2xl font-black text-[#181411]">Buen día, ${escapeHTML(userData.nombre)} 👩‍⚕️</h2>
          <p class="text-gray-500 text-sm">Gestiona tus consultas y reporta las bitácoras del bebé.</p>
        </div>
      </div>
      <h3 class="font-bold text-lg mb-4">Tus Citas Programadas</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        ${appointments.length > 0 ? appointments.map(app => `
          <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
            <div>
              <span class="bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-xs font-bold">${escapeHTML(app.hora)}</span>
              <h4 class="font-bold text-lg mt-2">${escapeHTML(app.nombre)}</h4>
              <p class="text-xs text-gray-500 mb-2">Fecha: ${escapeHTML(app.fecha)} • Creado por: ${escapeHTML(app.email)}</p>
              <p class="text-sm font-medium text-gray-600 mb-4">Servicio: ${escapeHTML(app.servicio)} (${app.duracion} hrs)</p>
            </div>
            <div class="flex flex-col gap-2">
              ${app.estado === 'completada' ? `
                <span class="text-center text-xs bg-green-100 text-green-700 py-2 rounded-lg font-bold">Bitácora Registrada ✅</span>
              ` : `
                <button data-id="${escapeHTML(app.id)}" data-nid="${escapeHTML(app.nidoId || '')}" class="btn-abrir-ficha w-full bg-indigo-600 text-white font-semibold py-2 rounded-lg text-sm hover:bg-indigo-700 transition shadow">
                  Registrar Bitácora 📝
                </button>
              `}
            </div>
          </div>
        `).join('') : `
          <div class="col-span-full p-8 text-center text-gray-400 italic">No tienes citas asignadas.</div>
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
      <h2 class="text-2xl font-black text-[#181411] mb-6">🤱 Historial de Fichas Emitidas</h2>
      <div class="space-y-4" id="prestador-fichas-list">
        <p class="text-center py-10 text-gray-400 italic">Cargando fichas...</p>
      </div>
    `;
    renderPrestadorFichas(uid);

  } else if (activeTab === 'horarios') {
    const h = userData.horarios || {};
    const getBtn = (day, block) => {
      const disp = h[day] && h[day][block];
      if (disp) return `<button data-day="${day}" data-block="${block}" class="btn-bloque w-full py-2 bg-green-100 text-green-700 rounded-lg font-bold hover:bg-green-200 transition">Disponible</button>`;
      return `<button data-day="${day}" data-block="${block}" class="btn-bloque w-full py-2 bg-gray-100 text-gray-400 rounded-lg hover:bg-gray-200 transition">No Disp.</button>`;
    };

    dashboardContent.innerHTML = `
      <h3 class="font-bold text-xl mb-2">Gestión de Horarios Base</h3>
      <p class="text-sm text-[#887263] mb-6">Selecciona tus horarios disponibles.</p>
      <div class="glass-panel p-6 rounded-2xl">
        <div class="overflow-x-auto">
          <table class="w-full min-w-[800px] text-center text-sm border-collapse">
            <thead>
              <tr class="text-[#887263]">
                <th class="p-2 border-b border-[#e5dfdc]">Hora</th>
                <th class="p-2 border-b border-[#e5dfdc]">Lunes</th>
                <th class="p-2 border-b border-[#e5dfdc]">Martes</th>
                <th class="p-2 border-b border-[#e5dfdc]">Miércoles</th>
                <th class="p-2 border-b border-[#e5dfdc]">Jueves</th>
                <th class="p-2 border-b border-[#e5dfdc]">Viernes</th>
                <th class="p-2 border-b border-[#e5dfdc]">Sábado</th>
                <th class="p-2 border-b border-[#e5dfdc]">Domingo</th>
              </tr>
            </thead>
            <tbody id="tabla-horarios">
              <tr>
                <td class="p-2 font-medium text-[#181411]">09:00 - 13:00</td>
                <td class="p-2">${getBtn('Lunes', '09:00-13:00')}</td>
                <td class="p-2">${getBtn('Martes', '09:00-13:00')}</td>
                <td class="p-2">${getBtn('Miercoles', '09:00-13:00')}</td>
                <td class="p-2">${getBtn('Jueves', '09:00-13:00')}</td>
                <td class="p-2">${getBtn('Viernes', '09:00-13:00')}</td>
                <td class="p-2">${getBtn('Sabado', '09:00-13:00')}</td>
                <td class="p-2">${getBtn('Domingo', '09:00-13:00')}</td>
              </tr>
              <tr>
                <td class="p-2 font-medium text-[#181411]">14:00 - 18:00</td>
                <td class="p-2">${getBtn('Lunes', '14:00-18:00')}</td>
                <td class="p-2">${getBtn('Martes', '14:00-18:00')}</td>
                <td class="p-2">${getBtn('Miercoles', '14:00-18:00')}</td>
                <td class="p-2">${getBtn('Jueves', '14:00-18:00')}</td>
                <td class="p-2">${getBtn('Viernes', '14:00-18:00')}</td>
                <td class="p-2">${getBtn('Sabado', '14:00-18:00')}</td>
                <td class="p-2">${getBtn('Domingo', '14:00-18:00')}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="mt-4 flex justify-end">
           <button id="btnGuardarHorarios" class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-full text-sm transition-colors shadow-md">Guardar Horarios</button>
        </div>
      </div>
    `;

    const botonesBloque = dashboardContent.querySelectorAll('.btn-bloque');
    botonesBloque.forEach(btn => {
      btn.addEventListener('click', () => {
        const isDisp = btn.classList.contains('bg-green-100');
        if (isDisp) {
          btn.className = 'btn-bloque w-full py-2 bg-gray-100 text-gray-400 rounded-lg hover:bg-gray-200 transition';
          btn.textContent = 'No Disp.';
        } else {
          btn.className = 'btn-bloque w-full py-2 bg-green-100 text-green-700 rounded-lg font-bold hover:bg-green-200 transition';
          btn.textContent = 'Disponible';
        }
      });
    });

    const btnGuardar = document.getElementById('btnGuardarHorarios');
    btnGuardar.onclick = async () => {
      btnGuardar.textContent = 'Guardando...';
      btnGuardar.disabled = true;
      const nuevoHorario = {};
      botonesBloque.forEach(btn => {
        const day = btn.dataset.day;
        const block = btn.dataset.block;
        const isDisp = btn.classList.contains('bg-green-100');
        if (!nuevoHorario[day]) nuevoHorario[day] = {};
        nuevoHorario[day][block] = isDisp;
      });

      try {
        await saveConsejeraSchedule(uid, nuevoHorario);
        showToast('Horarios base actualizados', 'success');
      } catch (e) {
        showToast('Error al actualizar horarios', 'error');
      } finally {
        btnGuardar.textContent = 'Guardar Horarios';
        btnGuardar.disabled = false;
      }
    };

  // --- NUEVA PESTAÑA: MIS TARIFAS PARA CONSEJERA ---
  } else if (activeTab === 'tarifas') {
    const tarifas = userData.tarifas || { baseHora: '', finDeSemanaHora: '', festivoHora: '' };
    
    dashboardContent.innerHTML = `
      <h3 class="font-bold text-2xl mb-2 text-[#181411]">Mis Tarifas 💰</h3>
      <p class="text-sm text-[#887263] mb-6">Configura el valor por hora de tus servicios para las consultas.</p>
      
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
        userData.tarifas = nuevasTarifas;
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