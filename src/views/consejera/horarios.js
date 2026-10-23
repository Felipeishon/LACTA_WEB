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
      const modalidad = typeof disp === 'string' ? disp.toLowerCase() : (disp ? 'ambas' : '');
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
        const modalidades = ['', 'online', 'presencial', 'ambas'];
        const actual = btn.dataset.modalidad || '';
        let siguiente = modalidades[(modalidades.indexOf(actual) + 1) % modalidades.length];
        if (Number(btn.dataset.horasDiferencia) < 48 && siguiente !== 'online' && siguiente !== '') {
          siguiente = '';
        }
        const estados = {
          '': { texto: 'No Disp.', clases: 'bg-gray-100 text-gray-400 hover:bg-gray-200' },
          online: { texto: 'Disp. Online', clases: 'bg-blue-100 text-blue-700 hover:bg-blue-200' },
          presencial: { texto: 'Disp. Presencial', clases: 'bg-green-100 text-green-700 hover:bg-green-200' },
          ambas: { texto: 'Disp. Ambas', clases: 'bg-purple-100 text-purple-700 hover:bg-purple-200' }
        };
        const estado = estados[siguiente];
        btn.dataset.modalidad = siguiente;
        btn.className = `btn-bloque w-full py-2 ${estado.clases} rounded-lg font-bold transition`;
        btn.textContent = estado.texto;
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
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    dashboardContent.querySelectorAll('.btn-bloque').forEach(btn => {
      const day = btn.dataset.day;
      const block = btn.dataset.block;
      const modalidad = btn.dataset.modalidad || '';
      if (!horarioSemanaActual[day]) horarioSemanaActual[day] = {};
      horarioSemanaActual[day][block] = modalidad || false;
    });

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
      endOfWeek.setHours(23, 59, 59, 999);

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
            
            const fechaInicio = new Date(exactDate);
            const [hI, mI] = horaInicioStr.split(':');
            fechaInicio.setHours(hI, mI, 0, 0);

            const fechaFin = new Date(exactDate);
            const [hF, mF] = horaFinStr.split(':');
            fechaFin.setHours(hF, mF, 0, 0);

            newSlots.push({
              fechaInicio: fechaInicio,
              fechaFin: fechaFin,
              horaInicio: horaInicioStr,
              horaFin: horaFinStr,
              disponible: true,
              reservado: false,
              tipoServicio: 'Consejería',
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
        
        let slotDate = null;
        if (slot.fechaInicio && typeof slot.fechaInicio.toDate === 'function') {
          slotDate = slot.fechaInicio.toDate();
        } else if (slot.fechaInicio) {
          slotDate = new Date(slot.fechaInicio);
        }
        
        if (slotDate && slotDate >= startOfWeek && slotDate <= endOfWeek) {
          batch.delete(docSnap.ref);
        }
      });

      newSlots.forEach(slotData => {
        const newDocRef = doc(collection(db, `usuarios/${uid}/disponibilidad`));
        batch.set(newDocRef, slotData);
      });

      await batch.commit();

      showToast('Horarios de la semana actualizados', 'success');
      userData.horarios = horariosGuardados;
    } catch (e) {
      console.error("Error al actualizar la grilla:", e);
      showToast('Error al actualizar horarios', 'error');
    } finally {
      btnGuardar.textContent = 'Guardar Horarios de la Semana';
      btnGuardar.disabled = false;
    }
  };
}
