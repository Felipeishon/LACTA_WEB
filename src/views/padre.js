import { db } from '../firebase.js';
import { collection, addDoc, doc, updateDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { fetchUserAppointments, obtenerDatosNido, createPedido, actualizarEstadoCita, updateAppointmentDateTime } from '../api/firestore.js';
import { escapeHTML } from '../utils/html.js';
import { renderPadreTienda } from './padre/tienda.js';
import { renderPadrePedidos } from './padre/pedidos.js';
import { renderPadreHistorial } from './padre/historial.js';
import { showToast } from '../ui/notifications.js';

export async function renderPadreTab(activeTab, userData, openPerfilBebeModal, switchTab) {
  const dashboardContent = document.getElementById('dashboard-content');
  if (!dashboardContent) return;

  const nidoId = userData?.nidoId;

  if (activeTab === 'resumen') {
    const appointments = await fetchUserAppointments(userData.uid);
    let nidoData = null;
    if (nidoId) {
      nidoData = await obtenerDatosNido(nidoId);
    }

    let appointmentsHTML = '<tr><td colspan="5" class="p-6 text-center text-gray-400 italic">No tienes citas agendadas aún.</td></tr>';
    
    if (appointments && appointments.length > 0) {
      appointmentsHTML = appointments.map(app => {
        const serv = escapeHTML(app.servicioVisual || app.servicio || app.tipoServicio || 'Atención');
        const prof = escapeHTML(app.profesionalNombre || app.prestadorNombre || app.consejeraNombre || 'Asignado');
        const fDate = escapeHTML(app.fecha || '');
        const fTime = escapeHTML(app.hora || '');
        const fEst = escapeHTML(app.estado || 'Pendiente');
        
        let fEstClass = 'bg-amber-100 text-amber-800'; 
        if (fEst === 'Aprobado') fEstClass = 'bg-blue-100 text-blue-800';
        else if (fEst === 'Cancelada' || fEst === 'Rechazada') fEstClass = 'bg-red-100 text-red-800';
        else if (fEst === 'completada') fEstClass = 'bg-green-100 text-green-800';

        let actions = '';
        const slotDataId = app.slotId || app.slotAsignado || '';
        const profDataId = app.profesionalId || app.prestadorId || app.consejeraId || app.cuidadoraId || '';
        const profNombre = escapeHTML(app.profesionalNombre || app.prestadorNombre || app.consejeraNombre || app.cuidadoraNombre || 'Profesional');
        const servicioVisual = escapeHTML(app.servicioVisual || app.servicio || 'Atención');

        if (fEst === 'Pendiente' || fEst === 'Aprobado') {
            actions = `<button data-id="${escapeHTML(app.id)}" data-slot="${escapeHTML(slotDataId)}" data-prof="${escapeHTML(profDataId)}" class="btn-anular-cita text-red-500 hover:text-red-700 text-xs font-bold transition underline">Anular</button>`;
        } else if (fEst === 'Cancelada' || fEst === 'Rechazada') {
            actions = `<button
              data-id="${escapeHTML(app.id)}"
              data-prof="${escapeHTML(profDataId)}"
              data-servicio="${servicioVisual}"
              data-prof-nombre="${profNombre}"
              class="btn-reagendar-cita text-[#e87a30] hover:text-[#d66a20] text-xs font-bold transition underline"
            >Reagendar</button>`;
        }

        return `
          <tr class="border-b hover:bg-gray-50/50">
            <td class="p-3 font-bold">${serv}</td>
            <td class="p-3">${prof}</td>
            <td class="p-3">${fDate} ${fTime}</td>
            <td class="p-3"><span class="px-2.5 py-1 rounded-full text-[10px] font-bold ${fEstClass} uppercase tracking-wider">${fEst}</span></td>
            <td class="p-3">${actions}</td>
          </tr>
        `;
      }).join('');
    }

    dashboardContent.innerHTML = `
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div class="glass-panel p-8 rounded-2xl border-t-4 border-[#e87a30] lg:col-span-2 relative overflow-hidden flex flex-col justify-between">
          <div>
            <span class="text-xs font-bold bg-[#f4eade] text-[#e87a30] px-3 py-1 rounded-full uppercase tracking-wider">Panel Familiar</span>
            <h2 class="text-3xl font-black text-[#181411] mt-2 mb-2">¡Hola, ${escapeHTML(userData.nombre || 'Familia')}! 👋</h2>
            <p class="text-[#887263] text-sm mb-6">Gestiona el cuidado y bienestar de tu familia desde aquí.</p>
          </div>
          <div class="flex flex-wrap gap-3">
            <button id="btnAgendarCitaResumen" class="bg-[#e87a30] hover:bg-[#d66a20] text-white font-bold py-2.5 px-5 rounded-xl text-sm transition shadow-md flex items-center gap-2">
              <span>+ Agendar Nueva Cita</span>
            </button>
            <button id="btnIrTiendaResumen" class="bg-white border border-gray-200 hover:bg-gray-50 text-[#181411] font-bold py-2.5 px-5 rounded-xl text-sm transition shadow-sm flex items-center gap-2">
              <span>🛍️ Tienda de Bebé</span>
            </button>
          </div>
        </div>

        <div class="glass-panel p-6 rounded-2xl border-t-4 border-[#887263] flex flex-col justify-between text-center">
          <div>
            <div class="w-12 h-12 bg-[#f4eade] rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">👶</div>
            <h3 class="font-bold text-lg text-[#181411]">Mi Nido Familiar</h3>
            <p class="text-xs text-[#887263] mt-1">${nidoData ? '¡Nido vinculado!' : 'Sin nido vinculado aún'}</p>
          </div>
          <button id="btnAbrirPerfilNido" class="mt-4 w-full bg-[#f4eade] hover:bg-[#e8dcd0] text-[#181411] font-bold py-2 px-4 rounded-xl text-xs transition">
            Ver Perfil del Nido
          </button>
        </div>
      </div>

      <div class="glass-panel p-6 rounded-2xl">
        <h3 class="text-xl font-black text-[#181411] mb-4">Tus Citas Recientes</h3>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead>
              <tr class="border-b text-[#887263]">
                <th class="p-3">Servicio</th>
                <th class="p-3">Profesional</th>
                <th class="p-3">Fecha</th>
                <th class="p-3">Estado</th>
                <th class="p-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              ${appointmentsHTML}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Event listeners para anular cita
    dashboardContent.querySelectorAll('.btn-anular-cita').forEach(btn => {
      btn.onclick = async () => {
        if (!confirm('¿Estás seguro que deseas anular esta cita? El horario se volverá a liberar.')) return;
        
        try {
          btn.textContent = 'Anulando...';
          btn.disabled = true;
          const { id, slot, prof } = btn.dataset;
          await actualizarEstadoCita(id, 'Cancelada', slot, prof);
          showToast('Cita anulada y horario liberado con éxito', 'success');
          // Recargar pestaña
          renderPadreTab('resumen', userData, openPerfilBebeModal, switchTab);
        } catch(err) {
          showToast('Error al anular cita', 'error');
          btn.textContent = 'Anular';
          btn.disabled = false;
        }
      };
    });

    dashboardContent.querySelectorAll('.btn-reagendar-cita').forEach(btn => {
      btn.onclick = async () => {
        const citaId = btn.dataset.id;
        const profId = btn.dataset.prof;
        const servicio = btn.dataset.servicio;
        const profNombre = btn.dataset.profNombre;

        if (!profId) {
          showToast('No se pudo identificar al profesional.', 'error');
          return;
        }

        const modalExistente = document.getElementById('modal-reagendar-cita');
        if (modalExistente) modalExistente.remove();

        const modalHtml = `
          <div id="modal-reagendar-cita" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div class="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
              <button id="cerrar-modal-reagendar" class="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-xl font-bold">&times;</button>
              <h3 class="text-xl font-black text-[#181411] mb-2">🔄 Reagendar Cita</h3>
              <p class="text-xs text-gray-500 mb-4">Servicio: <strong>${escapeHTML(servicio)}</strong> · Profesional: <strong>${escapeHTML(profNombre)}</strong></p>

              <div id="reagendar-slots-container" class="space-y-2 mb-4">
                <p class="text-center py-4 text-gray-400 italic text-sm">Cargando horarios disponibles...</p>
              </div>

              <div class="flex justify-end gap-3 pt-2 border-t border-gray-100">
                <button type="button" id="btn-cancelar-reagendar" class="px-4 py-2 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition">Cancelar</button>
              </div>
            </div>
          </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        const container = document.getElementById('reagendar-slots-container');
        const closeReagendarModal = () => document.getElementById('modal-reagendar-cita')?.remove();
        document.getElementById('cerrar-modal-reagendar').onclick = closeReagendarModal;
        document.getElementById('btn-cancelar-reagendar').onclick = closeReagendarModal;

        try {
          const slotsRef = collection(db, `usuarios/${profId}/disponibilidad`);
          const slotsSnap = await getDocs(slotsRef);

          if (slotsSnap.empty) {
            container.innerHTML = '<p class="text-center py-4 text-gray-400 italic text-sm">Este profesional no tiene horarios publicados.</p>';
            return;
          }

          const slotsDisponibles = [];
          slotsSnap.forEach(doc => {
            const slot = doc.data();
            if (slot.reservado === true || slot.disponible === false) return;

            let inicio = null, fin = null;
            if (slot.fechaInicio?.toDate) inicio = slot.fechaInicio.toDate();
            else if (typeof slot.fechaInicio === 'string') inicio = new Date(slot.fechaInicio);

            if (slot.fechaFin?.toDate) fin = slot.fechaFin.toDate();
            else if (typeof slot.fechaFin === 'string') fin = new Date(slot.fechaFin);

            if (inicio && fin && !isNaN(inicio.getTime()) && !isNaN(fin.getTime())) {
              slotsDisponibles.push({
                id: doc.id,
                inicio,
                horaInicio: slot.horaInicio || '',
                horaFin: slot.horaFin || '',
                texto: `${inicio.toLocaleDateString('es-CL', {weekday:'short', day:'numeric', month:'short'})} · ${slot.horaInicio || inicio.toLocaleTimeString('es-CL', {hour:'2-digit', minute:'2-digit'})} → ${slot.horaFin || fin.toLocaleTimeString('es-CL', {hour:'2-digit', minute:'2-digit'})}`
              });
            }
          });

          if (slotsDisponibles.length === 0) {
            container.innerHTML = '<p class="text-center py-4 text-gray-400 italic text-sm">No hay horarios disponibles actualmente.</p>';
            return;
          }

          container.innerHTML = slotsDisponibles.map(slot => `
            <button
              data-slot-id="${escapeHTML(slot.id)}"
              data-fecha="${slot.inicio.toLocaleDateString('es-CL')}"
              data-hora="${escapeHTML(`${slot.horaInicio} a ${slot.horaFin}`)}"
              data-slot-texto="${escapeHTML(slot.texto)}"
              class="btn-confirmar-reagendar w-full text-left p-3 bg-white border border-gray-200 hover:border-[#e87a30] hover:bg-orange-50 rounded-xl transition"
            >
              <p class="font-bold text-sm text-[#181411]">${escapeHTML(slot.texto)}</p>
              <p class="text-xs text-gray-500 mt-1">Click para reagendar en este horario</p>
            </button>
          `).join('');

          container.querySelectorAll('.btn-confirmar-reagendar').forEach(btnSlot => {
            btnSlot.onclick = async () => {
              if (!confirm('¿Confirmas el reagendamiento en este nuevo horario?')) return;

              const nuevoSlotId = btnSlot.dataset.slotId;
              const nuevaFecha = btnSlot.dataset.fecha;
              const nuevaHora = btnSlot.dataset.hora;

              try {
                btnSlot.disabled = true;
                btnSlot.textContent = 'Reagendando...';

                await updateAppointmentDateTime(citaId, nuevaFecha, nuevaHora);
                await updateDoc(doc(db, 'reservas', citaId), {
                  slotId: nuevoSlotId,
                  slotAsignado: nuevoSlotId
                });

                const nuevoSlotRef = doc(db, `usuarios/${profId}/disponibilidad`, nuevoSlotId);
                await updateDoc(nuevoSlotRef, { reservado: true, disponible: false, bookingId: citaId });

                await actualizarEstadoCita(citaId, 'Pendiente');

                showToast('¡Cita reagendada con éxito!', 'success');
                closeReagendarModal();
                renderPadreTab('resumen', userData, openPerfilBebeModal, switchTab);
              } catch (err) {
                console.error('Error al reagendar:', err);
                showToast('Error al reagendar la cita', 'error');
                btnSlot.disabled = false;
              }
            };
          });

        } catch (err) {
          console.error('Error al cargar slots:', err);
          container.innerHTML = '<p class="text-center py-4 text-red-500 italic text-sm">Error al cargar horarios.</p>';
        }
      };
    });

    document.getElementById('btnAgendarCitaResumen')?.addEventListener('click', () => {
      const modalExistente = document.getElementById('modal-agendar-cita');
      if (modalExistente) modalExistente.remove();

      const modalHtml = `
        <div id="modal-agendar-cita" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div class="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button id="cerrar-modal-cita" class="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-xl font-bold">&times;</button>
            <h3 class="text-xl font-black text-[#181411] mb-4">🗓️ Agendar Nueva Cita</h3>
            
            <form id="form-agendar-cita" class="space-y-4">
              
              <div>
                <label class="block text-xs font-bold text-gray-600 mb-1">Servicio</label>
                <select id="cita-servicio" required class="w-full p-2.5 border rounded-xl text-sm bg-white">
                  <option value="Cuidado de Recién Nacido">Cuidado de Recién Nacido</option>
                  <option value="Consejería de Lactancia">Consejería de Lactancia</option>
                </select>
              </div>

              <div id="container-modalidad" class="hidden">
                <label class="block text-xs font-bold text-gray-600 mb-1">Modalidad de Atención</label>
                <select id="cita-modalidad" class="w-full p-2.5 border rounded-xl text-sm bg-white">
                  <option value="Presencial">Presencial (Domicilio)</option>
                  <option value="Online">Online (Videollamada)</option>
                </select>
              </div>

              <div>
                <label class="block text-xs font-bold text-gray-600 mb-1">Profesional Disponible</label>
                <select id="cita-profesional" required class="w-full p-2.5 border rounded-xl text-sm bg-white focus:ring-[#e87a30]">
                  <option value="">Buscando disponibilidad...</option>
                </select>
                <p id="mensaje-sin-disponibilidad" class="text-red-500 text-[11px] font-bold hidden mt-1">Lo sentimos, no hay profesionales disponibles actualmente.</p>
              </div>

              <div id="container-turnos" class="hidden bg-orange-50 p-3 rounded-xl border border-orange-100">
                <label class="block text-xs font-bold text-[#e87a30] mb-1">Bloque Publicado por el Profesional</label>
                <select id="cita-turno" class="w-full p-2.5 border border-orange-200 rounded-xl text-sm bg-white font-semibold text-gray-700">
                  <option value="">Selecciona un profesional primero...</option>
                </select>
                
                <div id="container-hora-consejera" class="hidden mt-3 p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
                  <label class="block text-xs font-bold text-gray-800 mb-1">Define el horario exacto del servicio</label>
                  <p id="instruccion-rango" class="text-[11px] text-gray-500 mb-3 leading-tight">Selecciona la hora de inicio y término dentro del bloque publicado.</p>
                  
                  <div class="grid grid-cols-2 gap-3">
                    <div>
                      <label class="block text-[10px] font-bold text-gray-500 uppercase mb-1">Hora Inicio</label>
                      <select id="cita-hora-inicio-consejera" class="w-full p-2 border rounded-lg text-sm bg-gray-50 focus:bg-white"></select>
                    </div>
                    <div>
                      <label class="block text-[10px] font-bold text-gray-500 uppercase mb-1">Hora Término</label>
                      <select id="cita-hora-fin-consejera" class="w-full p-2 border rounded-lg text-sm bg-gray-50 focus:bg-white"></select>
                    </div>
                  </div>
                </div>
                
                <p id="nota-duracion" class="text-xs text-gray-600 mt-2 font-medium"></p>
              </div>

              <div id="container-manual" class="grid grid-cols-2 gap-3 hidden">
                <div>
                  <label class="block text-xs font-bold text-gray-600 mb-1">Fecha Sugerida</label>
                  <input type="date" id="cita-fecha-manual" class="w-full p-2.5 border rounded-xl text-sm bg-white" />
                </div>
                <div>
                  <label class="block text-xs font-bold text-gray-600 mb-1">Hora Sugerida</label>
                  <input type="time" id="cita-hora-manual" class="w-full p-2.5 border rounded-xl text-sm bg-white" />
                </div>
              </div>

              <div>
                <label class="block text-xs font-bold text-gray-600 mb-1">Teléfono de Contacto</label>
                <input type="tel" id="cita-telefono" required placeholder="+56 9 1234 5678" class="w-full p-2.5 border rounded-xl text-sm bg-white" />
              </div>

              <div id="container-direccion">
                <label class="block text-xs font-bold text-gray-600 mb-1">Dirección (Solo presencial)</label>
                <input type="text" id="cita-direccion" placeholder="Ej: Av. Las Condes 1234, Depto 501" class="w-full p-2.5 border rounded-xl text-sm bg-white" />
              </div>

              <div>
                <label class="block text-xs font-bold text-gray-600 mb-1">Motivo u Observaciones</label>
                <textarea id="cita-notas" rows="2" placeholder="Detalles o requerimientos especiales..." class="w-full p-2.5 border rounded-xl text-sm bg-white"></textarea>
              </div>

              <div class="flex justify-end gap-3 pt-2">
                <button type="button" id="btn-cancelar-cita" class="px-4 py-2 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition">Cancelar</button>
                <button type="submit" id="btn-submit-cita" class="bg-[#e87a30] hover:bg-[#d66a20] text-white px-5 py-2 rounded-xl text-sm font-bold transition shadow-md disabled:bg-gray-300 disabled:cursor-not-allowed">Confirmar Cita</button>
              </div>
            </form>
          </div>
        </div>
      `;

      document.body.insertAdjacentHTML('beforeend', modalHtml);

      const selectServicio = document.getElementById('cita-servicio');
      const selectModalidad = document.getElementById('cita-modalidad');
      const selectProfesional = document.getElementById('cita-profesional');
      const selectTurno = document.getElementById('cita-turno');
      const containerTurnos = document.getElementById('container-turnos');
      const containerManual = document.getElementById('container-manual');
      const containerHoraConsejera = document.getElementById('container-hora-consejera');
      const inputHoraInicio = document.getElementById('cita-hora-inicio-consejera');
      const inputHoraFin = document.getElementById('cita-hora-fin-consejera');
      const instruccionRango = document.getElementById('instruccion-rango');
      const notaDuracion = document.getElementById('nota-duracion');
      const mensajeSinDisponibilidad = document.getElementById('mensaje-sin-disponibilidad');
      const btnSubmitCita = document.getElementById('btn-submit-cita');
      const containerModalidad = document.getElementById('container-modalidad');
      const containerDireccion = document.getElementById('container-direccion');
      const inputDireccion = document.getElementById('cita-direccion');

      let ultimoServicioCargado = '';

      const formatDateRango = (start, end) => {
        const options = { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' };
        return `${start.toLocaleDateString('es-CL', options)} → ${end.toLocaleDateString('es-CL', options)}`;
      };

      const updateFormUI = async () => {
        const servicio = selectServicio.value;
        const modalidad = selectModalidad.value;
        const isConsejera = servicio === 'Consejería de Lactancia';

        if (isConsejera) {
          containerModalidad.classList.remove('hidden');
        } else {
          containerModalidad.classList.add('hidden');
          selectModalidad.value = 'Presencial'; 
        }

        if (isConsejera && modalidad === 'Online') {
          containerDireccion.classList.add('hidden');
          inputDireccion.removeAttribute('required');
          inputDireccion.value = 'Atención Online';
        } else {
          containerDireccion.classList.remove('hidden');
          inputDireccion.setAttribute('required', 'true');
          if (inputDireccion.value === 'Atención Online') inputDireccion.value = '';
        }

        if (servicio !== ultimoServicioCargado) {
          ultimoServicioCargado = servicio;
          selectProfesional.innerHTML = '<option value="">Buscando disponibilidad...</option>';
          selectProfesional.disabled = true;
          btnSubmitCita.disabled = true;
          mensajeSinDisponibilidad.classList.add('hidden');
          containerTurnos.classList.add('hidden');
          containerManual.classList.add('hidden');

          try {
            const rolBuscado = isConsejera ? 'consejera' : 'cuidadora';
            let profesionales = [];
            let bloqueoPorReglas = false;
            
            try {
              const q = query(collection(db, 'usuarios'), where('rol', 'array-contains', rolBuscado));
              const querySnapshot = await getDocs(q);
              
              if (querySnapshot.empty) {
                const qAntiguo = query(collection(db, 'usuarios'), where('rol', '==', rolBuscado));
                const snapAntiguo = await getDocs(qAntiguo);
                snapAntiguo.forEach((doc) => {
                  const prof = doc.data();
                  if (prof.estado !== 'pendiente') profesionales.push({ id: doc.id, nombre: prof.nombre });
                });
              } else {
                querySnapshot.forEach((doc) => {
                  const prof = doc.data();
                  if (prof.estado !== 'pendiente') profesionales.push({ id: doc.id, nombre: prof.nombre });
                });
              }
            } catch (queryError) {
              bloqueoPorReglas = true;
            }

            if (bloqueoPorReglas) {
              selectProfesional.innerHTML = '<option value="asignacion_automatica">Asignar automáticamente (Se asignará por disponibilidad)</option>';
              selectProfesional.disabled = false;
            } else if (profesionales.length === 0) {
              selectProfesional.innerHTML = '<option value="">No hay disponibilidad actual</option>';
              mensajeSinDisponibilidad.classList.remove('hidden');
              btnSubmitCita.disabled = true; 
            } else {
              let opciones = '<option value="">Selecciona un profesional...</option>';
              profesionales.forEach(prof => {
                 opciones += `<option value="${prof.id}" data-nombre="${escapeHTML(prof.nombre)}">${escapeHTML(prof.nombre || 'Profesional')}</option>`;
              });
              selectProfesional.innerHTML = opciones;
              selectProfesional.disabled = false;
            }
          } catch (err) {
            selectProfesional.innerHTML = '<option value="asignacion_automatica">Asignar automáticamente</option>';
            selectProfesional.disabled = false;
          }
        }
      };

      selectProfesional.addEventListener('change', async () => {
        const profId = selectProfesional.value;
        const isConsejera = selectServicio.value === 'Consejería de Lactancia';
        selectTurno.innerHTML = '<option value="">Cargando horarios...</option>';
        
        if (isConsejera) {
          containerHoraConsejera.classList.remove('hidden');
          inputHoraInicio.required = true;
          inputHoraFin.required = true;
          notaDuracion.textContent = '💡 Selecciona el horario exacto. Las opciones de la lista están limitadas estrictamente a la disponibilidad del bloque publicado.';
          notaDuracion.classList.replace('text-gray-600', 'text-[#e87a30]');
        } else {
          containerHoraConsejera.classList.add('hidden');
          inputHoraInicio.required = false;
          inputHoraFin.required = false;
          notaDuracion.textContent = '⏱️ El servicio de cuidado de recién nacido cubre el bloque completo de forma predeterminada.';
          notaDuracion.classList.replace('text-[#e87a30]', 'text-gray-600');
        }

        if (!profId) {
          containerTurnos.classList.add('hidden');
          containerManual.classList.add('hidden');
          btnSubmitCita.disabled = true;
          return;
        }

        if (profId === 'asignacion_automatica') {
          containerTurnos.classList.add('hidden');
          containerManual.classList.remove('hidden');
          document.getElementById('cita-fecha-manual').required = true;
          document.getElementById('cita-hora-manual').required = true;
          selectTurno.required = false;
          inputHoraInicio.required = false;
          inputHoraFin.required = false;
          btnSubmitCita.disabled = false;
        } else {
          containerTurnos.classList.remove('hidden');
          containerManual.classList.add('hidden');
          document.getElementById('cita-fecha-manual').required = false;
          document.getElementById('cita-hora-manual').required = false;
          selectTurno.required = true;

          try {
            const slotsRef = collection(db, `usuarios/${profId}/disponibilidad`);
            const slotsSnap = await getDocs(slotsRef);

            if (slotsSnap.empty) {
              selectTurno.innerHTML = '<option value="">El profesional no ha publicado horarios</option>';
              btnSubmitCita.disabled = true;
            } else {
              let hasAvailable = false;
              let optionsHTML = '<option value="">Selecciona un bloque disponible...</option>';

              slotsSnap.forEach(doc => {
                const slot = doc.data();
                
                if (slot.reservado === true || slot.disponible === false) return;

                let inicio = null;
                let fin = null;

                if (slot.fechaInicio && typeof slot.fechaInicio.toDate === 'function') {
                  inicio = slot.fechaInicio.toDate();
                } else if (slot.fechaInicio && typeof slot.fechaInicio === 'string') {
                  inicio = new Date(slot.fechaInicio);
                }

                if (slot.fechaFin && typeof slot.fechaFin.toDate === 'function') {
                  fin = slot.fechaFin.toDate();
                } else if (slot.fechaFin && typeof slot.fechaFin === 'string') {
                  fin = new Date(slot.fechaFin);
                }

                if (!inicio && slot.fecha && slot.horaInicio) {
                  let f = slot.fecha; 
                  if (f.includes('/')) {
                     const parts = f.split('/');
                     f = `${parts[2]}-${parts[1]}-${parts[0]}`;
                  }
                  inicio = new Date(`${f}T${slot.horaInicio}:00`);
                }
                
                if (!fin && slot.fecha && slot.horaFin) {
                  let f = slot.fecha;
                  if (f.includes('/')) {
                     const parts = f.split('/');
                     f = `${parts[2]}-${parts[1]}-${parts[0]}`;
                  }
                  fin = new Date(`${f}T${slot.horaFin}:00`);
                }

                if (inicio && fin && !isNaN(inicio.getTime()) && !isNaN(fin.getTime())) {
                  const duracionHoras = (fin - inicio) / (1000 * 60 * 60);
                  const pad = (n) => String(n).padStart(2, '0');
                  const hInicioStr = slot.horaInicio || `${pad(inicio.getHours())}:${pad(inicio.getMinutes())}`;
                  const hFinStr = slot.horaFin || `${pad(fin.getHours())}:${pad(fin.getMinutes())}`;
                  
                  const hInicioNum = parseInt(hInicioStr.split(':')[0], 10);

                  if (isConsejera) {
                    if (duracionHoras > 8 || hInicioNum >= 20 || hInicioNum < 7) {
                      return; 
                    }
                  } else {
                    if (duracionHoras <= 8) {
                      return;
                    }
                  }

                  hasAvailable = true;
                  const label = formatDateRango(inicio, fin);
                  const pFecha = inicio.toLocaleDateString('es-CL');
                  
                  const slotData = JSON.stringify({ 
                    id: doc.id, 
                    fecha: pFecha, 
                    horaInicio: hInicioStr, 
                    horaFin: hFinStr, 
                    texto: label 
                  });
                  optionsHTML += `<option value='${slotData}'>${label}</option>`;
                }
              });

              if (!hasAvailable) {
                selectTurno.innerHTML = '<option value="">No hay bloques disponibles para este servicio</option>';
                btnSubmitCita.disabled = true;
                inputHoraInicio.innerHTML = '';
                inputHoraFin.innerHTML = '';
              } else {
                selectTurno.innerHTML = optionsHTML;
                btnSubmitCita.disabled = false;
              }
            }
          } catch(e) {
            console.error("Error al cargar turnos:", e);
            selectTurno.innerHTML = '<option value="">Error al cargar turnos</option>';
            btnSubmitCita.disabled = true;
          }
        }
      });

      selectTurno.addEventListener('change', () => {
        if (!selectTurno.value) {
            inputHoraInicio.innerHTML = '';
            inputHoraFin.innerHTML = '';
            return;
        }
        
        try {
          const isConsejera = selectServicio.value === 'Consejería de Lactancia';
          if (isConsejera) {
            const slotData = JSON.parse(selectTurno.value);
            if (slotData.horaInicio && slotData.horaFin) {
              
              const generarOpciones = (hI_str, hF_str) => {
                let opciones = [];
                let [hI, mI] = hI_str.split(':').map(Number);
                let [hF, mF] = hF_str.split(':').map(Number);
                
                let actual = new Date(2000, 0, 1, hI, mI);
                let final = new Date(2000, 0, 1, hF, mF);
                if (final <= actual) final.setDate(final.getDate() + 1);

                while (actual <= final) {
                  opciones.push(`${String(actual.getHours()).padStart(2, '0')}:${String(actual.getMinutes()).padStart(2, '0')}`);
                  actual.setMinutes(actual.getMinutes() + 30);
                }
                return opciones;
              };

              const rangosPermitidos = generarOpciones(slotData.horaInicio, slotData.horaFin);

              inputHoraInicio.innerHTML = rangosPermitidos.slice(0, -1).map(h => `<option value="${h}">${h}</option>`).join('');
              inputHoraFin.innerHTML = rangosPermitidos.slice(1).map(h => `<option value="${h}">${h}</option>`).join('');

              inputHoraInicio.onchange = () => {
                const idxSeleccionado = rangosPermitidos.indexOf(inputHoraInicio.value);
                const validosParaFin = rangosPermitidos.slice(idxSeleccionado + 1);
                
                const valorFinActual = inputHoraFin.value;
                inputHoraFin.innerHTML = validosParaFin.map(h => `<option value="${h}">${h}</option>`).join('');
                
                if (validosParaFin.includes(valorFinActual)) {
                  inputHoraFin.value = valorFinActual;
                }
              };

              instruccionRango.textContent = `✅ Bloque detectado: entre las ${slotData.horaInicio} y las ${slotData.horaFin} hrs.`;
              instruccionRango.classList.add('text-green-600', 'font-bold');
            }
          }
        } catch(err) {
          console.error("Error al procesar bloque:", err);
        }
      });

      selectServicio.addEventListener('change', () => {
        updateFormUI();
        if(selectProfesional.value) {
            selectProfesional.dispatchEvent(new Event('change'));
        }
      });
      selectModalidad.addEventListener('change', updateFormUI);
      
      updateFormUI();

      const closeModal = () => document.getElementById('modal-agendar-cita')?.remove();
      document.getElementById('cerrar-modal-cita').onclick = closeModal;
      document.getElementById('btn-cancelar-cita').onclick = closeModal;

      document.getElementById('form-agendar-cita').onsubmit = async (e) => {
        e.preventDefault();
        
        let profId = selectProfesional.value;
        let profNombre = 'Asignado Automáticamente';
        let finalFecha = '';
        let finalHora = '';
        let finalSlotId = null;
        let notaHorarioStr = '';
        
        const isConsejera = selectServicio.value === 'Consejería de Lactancia';

        if (profId === 'asignacion_automatica') {
          finalFecha = document.getElementById('cita-fecha-manual').value;
          finalHora = document.getElementById('cita-hora-manual').value;
        } else {
          const profOption = selectProfesional.options[selectProfesional.selectedIndex];
          profNombre = profOption ? profOption.dataset.nombre : 'Profesional';
          
          const slotData = JSON.parse(selectTurno.value);
          finalFecha = slotData.fecha; 
          finalSlotId = slotData.id;
          
          if (isConsejera) {
            const horaIn = inputHoraInicio.value;
            const horaOut = inputHoraFin.value;

            finalHora = `${horaIn} a ${horaOut}`; 
            notaHorarioStr = `\n\n[Bloque publicado por profesional: ${slotData.texto}] \n[Horario específico contratado: ${horaIn} hrs hasta las ${horaOut} hrs]`;
          } else {
            const inicio = slotData.horaInicio || '00:00';
            const fin = slotData.horaFin || '00:00';
            finalHora = `${inicio} a ${fin}`;
            notaHorarioStr = `\n\n[Turno de cuidado completo reservado: ${slotData.texto}]`;
          }
        }

        try {
          btnSubmitCita.disabled = true;
          btnSubmitCita.textContent = 'Guardando...';

          const servicioSeleccionado = document.getElementById('cita-servicio').value;
          const userPhone = document.getElementById('cita-telefono').value;
          const userAddress = document.getElementById('cita-direccion').value;
          const userNotes = document.getElementById('cita-notas').value + notaHorarioStr;

          const servicioNombreReal = isConsejera ? 'Consultor' : 'Cuidado de Recién Nacido';
          const tipoServicioReal = isConsejera ? 'Consultor' : 'Cuidadora';

          const nuevaReservaData = {
            uid: userData.uid,
            userId: userData.uid,
            usuarioId: userData.uid,
            clienteId: userData.uid,
            nombre: userData.nombre || 'Padre/Madre',
            userNombre: userData.nombre || 'Padre/Madre',
            clienteNombre: userData.nombre || 'Padre/Madre',
            email: userData.email || '',
            nidoId: userData.nidoId || null,
            servicio: servicioNombreReal,
            tipoServicio: tipoServicioReal,
            servicioVisual: servicioSeleccionado,
            modalidad: selectModalidad.value,
            profesionalId: profId,
            prestadorId: profId,
            consejeraId: isConsejera ? profId : null,
            cuidadoraId: !isConsejera ? profId : null,
            profesionalNombre: profNombre,
            prestadorNombre: profNombre,
            consejeraNombre: isConsejera ? profNombre : null,
            cuidadoraNombre: !isConsejera ? profNombre : null,
            slotAsignado: finalSlotId,
            slotId: finalSlotId,
            fecha: finalFecha,
            hora: finalHora,
            telefono: userPhone,
            direccion: userAddress,
            notas: userNotes,
            estado: 'Pendiente',
            creadoEn: serverTimestamp(),
            timestamp: serverTimestamp()
          };

          let erroresSecundarios = false;

          await addDoc(collection(db, 'reservas'), nuevaReservaData);

          if (profId && finalSlotId && profId !== 'asignacion_automatica') {
            try {
              const slotRef = doc(db, `usuarios/${profId}/disponibilidad`, finalSlotId);
              await updateDoc(slotRef, { 
                reservado: true,
                disponible: false
              });
            } catch(eSlot) {
              console.error("Firebase bloqueó ocultar el bloque:", eSlot);
              erroresSecundarios = true;
            }
          }

          if (erroresSecundarios) {
            showToast('⚠️ Cita agendada, pero hubo error de permisos al actualizar el panel de la Consejera.', 'warning');
          } else {
            showToast('¡Cita solicitada con éxito y bloque reservado!', 'success');
          }
          
          closeModal();
          switchTab('resumen', 'padre', userData);
        } catch (err) {
          console.error("Error crítico al guardar:", err);
          showToast('Error al agendar la cita. Revisa permisos.', 'error');
          btnSubmitCita.disabled = false;
          btnSubmitCita.textContent = 'Confirmar Cita';
        }
      };
    });

    document.getElementById('btnIrTiendaResumen')?.addEventListener('click', () => {
      switchTab('tienda', 'padre', userData);
    });

    document.getElementById('btnAbrirPerfilNido')?.addEventListener('click', () => {
      openPerfilBebeModal(userData);
    });

  } else if (activeTab === 'historial_bebe') {
    await renderPadreHistorial(dashboardContent, nidoId);

  } else if (activeTab === 'tienda') {
    await renderPadreTienda(dashboardContent);

  } else if (activeTab === 'pedidos') {
    await renderPadrePedidos(dashboardContent, userData);
  }
}