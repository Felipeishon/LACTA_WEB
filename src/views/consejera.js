import { showToast } from '../ui/notifications.js';
import { fetchServiceAppointments, saveConsejeraSchedule, updateAppointmentDateTime, fetchAllBitacoras } from '../api/firestore.js';
import { escapeHTML } from '../utils/html.js';
import { renderPrestadorFichas } from './prestador.js';
import { renderTarifasForm } from './shared/tarifas.js';

function getSiguientes4Semanas() {
  const semanas = [];
  const hoy = new Date();
  const dia = hoy.getDay();
  const diff = hoy.getDate() - dia + (dia === 0 ? -6 : 1);
  const lunesActual = new Date(hoy.setDate(diff));

  for (let i = 0; i < 4; i++) {
    const inicio = new Date(lunesActual);
    inicio.setDate(lunesActual.getDate() + (i * 7));
    const fin = new Date(inicio);
    fin.setDate(inicio.getDate() + 6);

    const key = inicio.toISOString().split('T')[0];
    const label = `Semana del ${inicio.toLocaleDateString('es-CL', {day: 'numeric', month: 'short'})} al ${fin.toLocaleDateString('es-CL', {day: 'numeric', month: 'short'})}`;
    semanas.push({ key, label });
  }
  return semanas;
}

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
      <div class="flex items-center justify-between mb-6">
        <div>
          <h2 class="text-2xl font-black text-[#181411]">Mis Atenciones (Consejería) 🗓️</h2>
          <p class="text-gray-500 text-sm">Listado informativo de agendas tomadas y gestión de fechas/horarios.</p>
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="lista-atenciones-consejera">
        ${appointments.length > 0 ? appointments.map(app => `
          <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
            <div>
              <span class="bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-xs font-bold">${escapeHTML(app.hora)}</span>
              <h4 class="font-bold text-lg mt-2">${escapeHTML(app.nombre)}</h4>
              <p class="text-xs text-gray-500 mb-1">Fecha actual: <span class="font-bold text-gray-700">${escapeHTML(app.fecha)}</span></p>
              <p class="text-xs text-gray-500 mb-3">Cliente: ${escapeHTML(app.email)}</p>
              
              <!-- Formulario rápido para editar fecha y hora -->
              <div class="bg-gray-50 p-2.5 rounded-lg border border-gray-100 mb-3 space-y-2">
                <p class="text-[11px] font-bold text-gray-600 uppercase">Modificar fecha/hora:</p>
                <input type="date" value="${escapeHTML(app.fecha)}" class="edit-fecha w-full p-1.5 border rounded text-xs" data-id="${app.id}" />
                <input type="time" value="${escapeHTML(app.hora)}" class="edit-hora w-full p-1.5 border rounded text-xs" data-id="${app.id}" />
                <button data-id="${app.id}" class="btn-guardar-cambio-cita w-full bg-gray-800 text-white text-xs font-bold py-1.5 rounded hover:bg-[#e87a30] transition">Actualizar Cita</button>
              </div>
            </div>
          </div>
        `).join('') : `
          <div class="col-span-full p-8 text-center text-gray-400 italic">No tienes atenciones agendadas actualmente.</div>
        `}
      </div>
    `;

    dashboardContent.querySelectorAll('.btn-guardar-cambio-cita').forEach(btn => {
      btn.onclick = async () => {
        const id = btn.dataset.id;
        const card = btn.closest('div');
        const nuevaFecha = card.querySelector('.edit-fecha').value;
        const nuevaHora = card.querySelector('.edit-hora').value;

        if (!nuevaFecha || !nuevaHora) {
          showToast('Selecciona fecha y hora válidas', 'warning');
          return;
        }

        try {
          btn.disabled = true;
          btn.textContent = 'Guardando...';
          await updateAppointmentDateTime(id, nuevaFecha, nuevaHora);
          showToast('Fecha y horario actualizados con éxito', 'success');
          renderConsejeraTab('dashboard', userData, openFichaCuidadoModal);
        } catch (e) {
          showToast('Error al actualizar la cita', 'error');
          btn.disabled = false;
          btn.textContent = 'Actualizar Cita';
        }
      };
    });

  } else if (activeTab === 'historial_fichas') {
    dashboardContent.innerHTML = `
      <div class="flex justify-between items-center mb-6 flex-wrap gap-4">
        <div>
          <h2 class="text-2xl font-black text-[#181411]">Mis Fichas 🤱</h2>
          <p class="text-sm text-gray-500">Historial completo y filtrable de las atenciones brindadas a los nidos.</p>
        </div>
        <div>
          <input type="text" id="filtro-fichas" placeholder="🔍 Buscar por nido, RUT o cliente..." class="p-2 border border-gray-300 rounded-lg text-sm w-72 bg-white" />
        </div>
      </div>
      <div class="space-y-4" id="prestador-fichas-list">
        <p class="text-center py-10 text-gray-400 italic">Cargando fichas...</p>
      </div>
    `;
    renderPrestadorFichas(uid, 'filtro-fichas');

  } else if (activeTab === 'bitacoras') {
    dashboardContent.innerHTML = `
      <div class="flex justify-between items-center mb-6 flex-wrap gap-4">
        <div>
          <h2 class="text-2xl font-black text-[#181411]">Bitácoras de Cuidado 📋</h2>
          <p class="text-sm text-gray-500">Visualiza todas las bitácoras registradas de cuidado con opción de filtro.</p>
        </div>
        <div>
          <input type="text" id="filtro-bitacoras-consejera" placeholder="🔍 Buscar por nido, RUT o cuidadora..." class="p-2 border border-gray-300 rounded-lg text-sm w-72 bg-white" />
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
          return `
            <div class="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative pl-8 border-l-4 border-emerald-500 slide-up">
              <div class="flex justify-between items-start mb-3 flex-wrap gap-2">
                <div>
                  <span class="text-xs text-gray-400 font-bold block">${fechaObj.toLocaleDateString('es-CL')} a las ${fechaObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} hrs</span>
                  <h4 class="font-bold text-lg text-[#181411]">Bitácora de Cuidado - Nido: ${escapeHTML(reg.nidoNombreBebe || reg.nidoId?.slice(0, 8) || 'N/A')}</h4>
                  <p class="text-xs text-[#887263]">Registrado por: ${escapeHTML(reg.prestadorNombre || 'Prestador')} • RUT Bebé: ${escapeHTML(reg.nidoRutBebe || 'N/A')}</p>
                </div>
                <span class="text-xs font-bold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full uppercase tracking-wider">🍼 ${escapeHTML(reg.prestadorRol || 'Cuidadora')}</span>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-xl mb-4 border border-gray-100 text-xs">
                <div><strong>🥛 Alimentación:</strong> ${escapeHTML(reg.tipoAlimentacion || 'N/A')}</div>
                <div><strong>😴 Horas Sueño:</strong> ${reg.horasSueno || 0}</div>
                <div><strong>🧻 Pañales:</strong> ${reg.cantidadPanales || 0}</div>
              </div>
              <div class="text-sm text-gray-600">${escapeHTML(reg.observaciones || 'Sin observaciones')}</div>
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
    const semanas = getSiguientes4Semanas();
    let semanaSeleccionada = semanas[0].key;
    const horariosGuardados = userData.horarios || {};

    const renderTablaHorarios = (semKey) => {
      const hSemana = horariosGuardados[semKey] || {};
      const getBtn = (day, block) => {
        const disp = hSemana[day] && hSemana[day][block];
        if (disp) return `<button data-day="${day}" data-block="${block}" class="btn-bloque w-full py-2 bg-green-100 text-green-700 rounded-lg font-bold hover:bg-green-200 transition">Disponible</button>`;
        return `<button data-day="${day}" data-block="${block}" class="btn-bloque w-full py-2 bg-gray-100 text-gray-400 rounded-lg hover:bg-gray-200 transition">No Disp.</button>`;
      };

      const containerTabla = document.getElementById('contenedor-tabla-horarios');
      if (!containerTabla) return;

      containerTabla.innerHTML = `
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
          <tbody>
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
      `;

      containerTabla.querySelectorAll('.btn-bloque').forEach(btn => {
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
    };

    dashboardContent.innerHTML = `
      <div class="flex justify-between items-center mb-4 flex-wrap gap-4">
        <div>
          <h3 class="font-bold text-xl mb-1">Mi Disponibilidad (Horarios Base)</h3>
          <p class="text-sm text-[#887263]">Selecciona la semana y configura tu disponibilidad para el próximo mes.</p>
        </div>
        <div>
          <select id="select-semana" class="p-2 border border-gray-300 rounded-lg text-sm bg-white font-bold text-[#181411] focus:ring-[#e87a30]">
            ${semanas.map(s => `<option value="${s.key}">${s.label}</option>`).join('')}
          </select>
        </div>
      </div>

      <div class="glass-panel p-6 rounded-2xl">
        <div class="overflow-x-auto" id="contenedor-tabla-horarios"></div>
        <div class="mt-4 flex justify-end">
           <button id="btnGuardarHorarios" class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-full text-sm transition-colors shadow-md">Guardar Horarios de la Semana</button>
        </div>
      </div>
    `;

    renderTablaHorarios(semanaSeleccionada);

    document.getElementById('select-semana').addEventListener('change', (e) => {
      semanaSeleccionada = e.target.value;
      renderTablaHorarios(semanaSeleccionada);
    });

    const btnGuardar = document.getElementById('btnGuardarHorarios');
    btnGuardar.onclick = async () => {
      btnGuardar.textContent = 'Guardando...';
      btnGuardar.disabled = true;

      const horarioSemanaActual = {};
      dashboardContent.querySelectorAll('.btn-bloque').forEach(btn => {
        const day = btn.dataset.day;
        const block = btn.dataset.block;
        const isDisp = btn.classList.contains('bg-green-100');
        if (!horarioSemanaActual[day]) horarioSemanaActual[day] = {};
        horarioSemanaActual[day][block] = isDisp;
      });

      if (!horariosGuardados[semanaSeleccionada]) {
        horariosGuardados[semanaSeleccionada] = {};
      }
      horariosGuardados[semanaSeleccionada] = horarioSemanaActual;

      try {
        await saveConsejeraSchedule(uid, horariosGuardados);
        showToast('Horarios de la semana actualizados', 'success');
        userData.horarios = horariosGuardados;
      } catch (e) {
        showToast('Error al actualizar horarios', 'error');
      } finally {
        btnGuardar.textContent = 'Guardar Horarios de la Semana';
        btnGuardar.disabled = false;
      }
    };

  } else if (activeTab === 'tarifas') {
    renderTarifasForm(dashboardContent, userData, uid, 'consejera');
  }
}