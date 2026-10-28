import { db } from '../../firebase.js';
import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import { showToast } from '../../ui/notifications.js';
import { saveConsejeraSchedule } from '../../api/firestore.js';

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

export async function renderConsejeraHorarios(dashboardContent, userData) {
  const uid = userData?.uid || userData?.id;
  const semanas = getSiguientes4Semanas();
  let semanaSeleccionada = semanas[0].key;
  const horariosGuardados = userData.horarios || {};
  let hayCambios = false;
  const modalidadesTarifas = userData?.tarifas?.modalidades;
  const permiteOnline = Array.isArray(modalidadesTarifas)
    ? modalidadesTarifas.includes('online')
    : userData?.tarifas?.online !== false;
  const permitePresencial = Array.isArray(modalidadesTarifas)
    ? modalidadesTarifas.includes('presencial')
    : userData?.tarifas?.presencial !== false;
  const estadosPosibles = ['no_disp'];
  if (permiteOnline) estadosPosibles.push('online');
  if (permitePresencial) estadosPosibles.push('presencial');
  if (permiteOnline && permitePresencial) estadosPosibles.push('ambas');

  const renderTablaHorarios = (semKey) => {
    const hSemana = horariosGuardados[semKey] || {};
    const [yyyy, mm, dd] = semKey.split('-').map(Number);
    const lunes = new Date(yyyy, mm - 1, dd);
    lunes.setHours(0, 0, 0, 0);
    const ahora = new Date();
    const hoy = new Date(ahora);
    hoy.setHours(0, 0, 0, 0);
    const diasSemana = { Lunes: 0, Martes: 1, Miercoles: 2, Jueves: 3, Viernes: 4, Sabado: 5, Domingo: 6 };

    const getBtn = (day, block) => {
      const disp = hSemana[day] && hSemana[day][block];
      let modalidad = typeof disp === 'string' ? disp.toLowerCase() : (disp ? 'ambas' : '');
      if (modalidad && !estadosPosibles.includes(modalidad)) modalidad = '';
      const fechaDia = new Date(lunes);
      fechaDia.setDate(lunes.getDate() + diasSemana[day]);
      const [horaInicio] = block.split('-');
      const [hora, minuto] = horaInicio.split(':').map(Number);
      const inicioBloque = new Date(fechaDia);
      inicioBloque.setHours(hora, minuto, 0, 0);
      const esPasado = fechaDia < hoy || (fechaDia.getTime() === hoy.getTime() && inicioBloque <= ahora);
      if (esPasado) {
        return `<button type="button" data-day="${day}" data-block="${block}" data-pasado="true" class="w-full py-2 bg-gray-200 text-gray-400 cursor-not-allowed opacity-50 rounded-lg" disabled>Pasado</button>`;
      }
      const horasDiferencia = (inicioBloque - ahora) / (1000 * 60 * 60);
      const requiere48Horas = modalidad !== 'online';
      if (horasDiferencia < 24 || (horasDiferencia < 48 && requiere48Horas)) {
        return `<button type="button" data-day="${day}" data-block="${block}" data-pasado="true" class="w-full py-2 bg-gray-200 text-gray-400 cursor-not-allowed opacity-50 rounded-lg" disabled>Muy pronto</button>`;
      }

      const estados = {
        '': { texto: 'No Disp.', clases: 'bg-gray-100 text-gray-400 hover:bg-gray-200' },
        online: { texto: 'Disp. Online', clases: 'bg-blue-100 text-blue-700 hover:bg-blue-200' },
        presencial: { texto: 'Disp. Presencial', clases: 'bg-green-100 text-green-700 hover:bg-green-200' },
        ambas: { texto: 'Disp. Ambas', clases: 'bg-purple-100 text-purple-700 hover:bg-purple-200' }
      };
      const estado = estados[modalidad] || estados[''];
      return `<button type="button" data-day="${day}" data-block="${block}" data-modalidad="${modalidad}" data-horas-diferencia="${horasDiferencia}" class="btn-bloque w-full py-2 ${estado.clases} rounded-lg font-bold transition">${estado.texto}</button>`;
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
      if (btn.dataset.pasado === 'true') return;
      btn.addEventListener('click', () => {
        const estadosDelBloque = Number(btn.dataset.horasDiferencia) < 48
          ? estadosPosibles.filter(estado => estado === 'no_disp' || estado === 'online')
          : estadosPosibles;
        const actual = btn.dataset.modalidad || 'no_disp';
        const indiceActual = estadosDelBloque.indexOf(actual);
        const siguiente = estadosDelBloque[(indiceActual + 1) % estadosDelBloque.length];
        const estados = {
          no_disp: { texto: 'No Disp.', clases: 'bg-gray-100 text-gray-400 hover:bg-gray-200' },
          online: { texto: 'Disp. Online', clases: 'bg-blue-100 text-blue-700 hover:bg-blue-200' },
          presencial: { texto: 'Disp. Presencial', clases: 'bg-green-100 text-green-700 hover:bg-green-200' },
          ambas: { texto: 'Disp. Ambas', clases: 'bg-purple-100 text-purple-700 hover:bg-purple-200' }
        };
        const estado = estados[siguiente];
        btn.dataset.modalidad = siguiente === 'no_disp' ? '' : siguiente;
        btn.className = `btn-bloque w-full py-2 ${estado.clases} rounded-lg font-bold transition`;
        btn.textContent = estado.texto;
        hayCambios = true;
        const estadoGuardado = document.getElementById('estado-guardado');
        estadoGuardado.textContent = '● Tienes cambios sin guardar';
        estadoGuardado.classList.remove('text-gray-400', 'text-green-500', 'opacity-0');
        estadoGuardado.classList.add('text-amber-500', 'opacity-100');
        const btnGuardar = document.getElementById('btnGuardarHorarios');
        if (btnGuardar) {
          btnGuardar.disabled = false;
          btnGuardar.className = 'bg-[#e87a30] hover:bg-[#d66a20] text-white font-bold py-2 px-6 rounded-full text-sm transition-colors shadow-md';
          btnGuardar.textContent = 'Guardar Cambios';
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
        <div class="flex items-center justify-between mt-4">
           <span id="estado-guardado" class="text-sm font-bold text-gray-400 transition-opacity opacity-0"></span>
           <button id="btnGuardarHorarios" class="bg-gray-300 text-gray-500 font-bold py-2 px-6 rounded-full text-sm cursor-not-allowed transition-colors shadow-sm" disabled>Guardar Horarios</button>
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
    if (!hayCambios) return;

    btnGuardar.disabled = true;
    btnGuardar.textContent = 'Guardando...';

    const horarioSemanaActual = {};
    let hayModalidadNoPermitida = false;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    dashboardContent.querySelectorAll('.btn-bloque').forEach(btn => {
      const day = btn.dataset.day;
      const block = btn.dataset.block;
      const modalidad = btn.dataset.modalidad || '';
      const modalidadPermitida = modalidad === '' ||
        (modalidad === 'online' && permiteOnline) ||
        (modalidad === 'presencial' && permitePresencial) ||
        (modalidad === 'ambas' && permiteOnline && permitePresencial);
      if (!modalidadPermitida) {
        hayModalidadNoPermitida = true;
      }
      if (!horarioSemanaActual[day]) horarioSemanaActual[day] = {};
      horarioSemanaActual[day][block] = modalidad || false;
    });

    if (hayModalidadNoPermitida) {
      showToast('No puedes guardar una modalidad no habilitada en tus tarifas.', 'warning');
      btnGuardar.disabled = false;
      btnGuardar.textContent = 'Guardar Cambios';
      return;
    }

    if (!horariosGuardados[semanaSeleccionada]) {
      horariosGuardados[semanaSeleccionada] = {};
    }
    horariosGuardados[semanaSeleccionada] = horarioSemanaActual;

    try {
      await saveConsejeraSchedule(uid, horariosGuardados);
      
      const [yyyy, mm, dd] = semanaSeleccionada.split('-').map(Number);
      const monday = new Date(yyyy, mm - 1, dd);
      
      const startOfWeek = new Date(monday);
      startOfWeek.setHours(0, 0, 0, 0);
      const endOfWeek = new Date(monday);
      endOfWeek.setDate(monday.getDate() + 6);
      endOfWeek.setHours(0, 0, 0, 0);
      const formatDateKey = date => [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, '0'),
        String(date.getDate()).padStart(2, '0')
      ].join('-');
      const startOfWeekKey = formatDateKey(startOfWeek);
      const endOfWeekKey = formatDateKey(endOfWeek);
      const getSlotDateKey = value => {
        if (!value) return null;
        if (typeof value === 'string') {
          const dateMatch = value.match(/^(\d{4}-\d{2}-\d{2})/);
          if (dateMatch) return dateMatch[1];
        }
        const date = typeof value.toDate === 'function' ? value.toDate() : new Date(value);
        if (Number.isNaN(date.getTime())) return null;
        return formatDateKey(date);
      };

      const daysMap = { 'Lunes': 0, 'Martes': 1, 'Miercoles': 2, 'Jueves': 3, 'Viernes': 4, 'Sabado': 5, 'Domingo': 6 };
      const newSlots = [];

      for (const day in horarioSemanaActual) {
        for (const block in horarioSemanaActual[day]) {
          const modalidad = horarioSemanaActual[day][block];
          if (modalidad) {
            const exactDate = new Date(monday);
            exactDate.setDate(monday.getDate() + daysMap[day]);
            exactDate.setHours(0, 0, 0, 0);
            if (exactDate < hoy) continue;
            
            const [horaInicioStr, horaFinStr] = block.split('-');
            
            const [hI, mI] = horaInicioStr.split(':');
            const [hF, mF] = horaFinStr.split(':');
            const fechaInicio = new Date(exactDate.getFullYear(), exactDate.getMonth(), exactDate.getDate(), parseInt(hI), parseInt(mI), 0);
            const fechaFin = new Date(exactDate.getFullYear(), exactDate.getMonth(), exactDate.getDate(), parseInt(hF), parseInt(mF), 0);

            newSlots.push({
              fechaInicio: fechaInicio,
              fechaFin: fechaFin,
              horaInicio: horaInicioStr,
              horaFin: horaFinStr,
              disponible: true,
              reservado: false,
              tipoServicio: 'consejeria',
              modalidad: modalidad || 'ambas'
            });
          }
        }
      }

      const dispRef = collection(db, `usuarios/${uid}/disponibilidad`);
      const snapshot = await getDocs(dispRef);
      const batch = writeBatch(db);

      snapshot.forEach(docSnap => {
        const slot = docSnap.data();
        if (slot.reservado) return; 
        if (slot.tipoServicio !== 'consejeria' && slot.tipoServicio !== 'Consejería') return;
        
        const slotDateKey = getSlotDateKey(slot.fechaInicio);
        if (slotDateKey && slotDateKey >= startOfWeekKey && slotDateKey <= endOfWeekKey) {
          batch.delete(docSnap.ref);
        }
      });

      newSlots.forEach(slotData => {
        const newDocRef = doc(collection(db, `usuarios/${uid}/disponibilidad`));
        batch.set(newDocRef, slotData);
      });

      await batch.commit();

      hayCambios = false;
      btnGuardar.className = 'bg-green-500 text-white font-bold py-2 px-6 rounded-full text-sm cursor-not-allowed transition-colors shadow-sm';
      btnGuardar.disabled = true;
      btnGuardar.textContent = '✅ Guardado';
      setTimeout(() => {
        if (!hayCambios) {
          btnGuardar.className = 'bg-gray-300 text-gray-500 font-bold py-2 px-6 rounded-full text-sm cursor-not-allowed transition-colors shadow-sm';
          btnGuardar.disabled = true;
          btnGuardar.textContent = 'Guardar Horarios';
        }
      }, 3000);

      const estadoGuardado = document.getElementById('estado-guardado');
      estadoGuardado.textContent = '✅ Horario guardado';
      estadoGuardado.classList.remove('text-gray-400', 'text-amber-500', 'opacity-0');
      estadoGuardado.classList.add('text-green-500', 'opacity-100');

      showToast('Horarios de la semana actualizados', 'success');
      userData.horarios = horariosGuardados;
    } catch (e) {
      console.error("Error al actualizar la grilla:", e);
      btnGuardar.className = 'bg-[#e87a30] hover:bg-[#d66a20] text-white font-bold py-2 px-6 rounded-full text-sm transition-colors shadow-md';
      btnGuardar.disabled = false;
      btnGuardar.textContent = 'Guardar Cambios';
      showToast('Error al actualizar horarios', 'error');
    }
  };
}
