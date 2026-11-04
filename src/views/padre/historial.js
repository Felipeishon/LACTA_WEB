import { fetchFichasAtencionPorNido, fetchFichasCuidadoPorNido, getEncuestasByNido, saveEncuesta } from '../../api/firestore.js';
import { auth } from '../../firebase.js';
import { escapeHTML } from '../../utils/html.js';
import { showToast } from '../../ui/notifications.js';

export async function renderPadreHistorial(dashboardContent, nidoId) {
    dashboardContent.innerHTML = `
      <div class="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 class="text-2xl font-black text-[#181411]">📜 Historial del Bebé</h2>
          <p class="text-sm text-[#887263]">Consulta unificada de evaluaciones de atención y bitácoras de cuidado.</p>
        </div>
      </div>

      <div class="glass-panel p-4 rounded-xl mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label class="block text-xs font-bold text-gray-600 mb-1">Buscar (Prestador / Nido)</label>
          <input type="text" id="filtro-texto" placeholder="🔍 Texto..." class="w-full p-2 border rounded-lg text-xs bg-white" />
        </div>
        <div>
          <label class="block text-xs font-bold text-gray-600 mb-1">Tipo de Registro</label>
          <select id="filtro-tipo" class="w-full p-2 border rounded-lg text-xs bg-white">
            <option value="todos">Todos los registros</option>
            <option value="ficha">Evaluaciones de Atención</option>
            <option value="bitacora">Bitácoras de Cuidado</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-bold text-gray-600 mb-1">Fecha Desde</label>
          <input type="date" id="filtro-fecha-desde" class="w-full p-2 border rounded-lg text-xs bg-white" />
        </div>
        <div>
          <label class="block text-xs font-bold text-gray-600 mb-1">Fecha Hasta</label>
          <input type="date" id="filtro-fecha-hasta" class="w-full p-2 border rounded-lg text-xs bg-white" />
        </div>
      </div>

      <div class="space-y-4" id="lista-historial-unificado">
        <p class="text-center py-10 text-gray-400 italic">Cargando historial...</p>
      </div>
    `;

    try {
      let fichasAtencion = [];
      let bitacoras = [];
      let encuestasPrevias = [];

      if (nidoId) {
        [fichasAtencion, bitacoras, encuestasPrevias] = await Promise.all([
          fetchFichasAtencionPorNido(nidoId),
          fetchFichasCuidadoPorNido(nidoId),
          getEncuestasByNido(nidoId)
        ]);
      }
      const reservasCalificadas = encuestasPrevias.map(encuesta => encuesta.reservaId);

      const parsearFecha = (rawDate) => {
        if (!rawDate) return null;
        if (typeof rawDate.toDate === 'function') {
          return rawDate.toDate();
        }
        if (rawDate.seconds) {
          return new Date(rawDate.seconds * 1000);
        }
        const parsed = new Date(rawDate);
        return !isNaN(parsed.getTime()) ? parsed : null;
      };

      const historialCombinado = [
        ...fichasAtencion.map(f => ({ ...f, tipoRegistro: 'ficha', fechaObj: parsearFecha(f.creadoEn || f.fecha || f.timestamp) })),
        ...bitacoras.map(b => ({ ...b, tipoRegistro: 'bitacora', fechaObj: parsearFecha(b.creadoEn || b.fecha || b.timestamp) }))
      ].sort((a, b) => {
        const tA = a.fechaObj ? a.fechaObj.getTime() : 0;
        const tB = b.fechaObj ? b.fechaObj.getTime() : 0;
        return tB - tA;
      });

      const contenedorLista = document.getElementById('lista-historial-unificado');
      const inputTexto = document.getElementById('filtro-texto');
      const selectTipo = document.getElementById('filtro-tipo');
      const inputDesde = document.getElementById('filtro-fecha-desde');
      const inputHasta = document.getElementById('filtro-fecha-hasta');

      const renderRegistros = (items) => {
        if (!contenedorLista) return;
        if (items.length === 0) {
          contenedorLista.innerHTML = '<div class="glass-panel p-8 text-center text-gray-400 italic rounded-xl">No se encontraron registros en el historial con los filtros seleccionados.</div>';
          return;
        }

        contenedorLista.innerHTML = items.map(reg => {
          const esFicha = reg.tipoRegistro === 'ficha';
          let fechaStr = 'Fecha no especificada';
          if (reg.fechaObj) {
            fechaStr = reg.fechaObj.toLocaleDateString('es-CL', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
          }

          const title = esFicha ? '📝 Evaluación' : '🍼 Bitácora';
          const provider = escapeHTML(reg.prestadorNombre || reg.consejeraNombre || 'Profesional');
          const yaCalificada = reservasCalificadas.includes(reg.reservaId);
          const botonCalificar = !yaCalificada && reg.reservaId
            ? `
              <button class="btn-calificar mt-3 text-xs font-bold bg-[#f4eade] text-[#e87a30] hover:bg-[#e8dcd0] px-3 py-1.5 rounded-lg transition"
                data-reserva="${escapeHTML(reg.reservaId)}"
                data-prestador="${escapeHTML(reg.prestadorId || reg.consejeraId || '')}"
                data-nombre="${provider}">
                ⭐ Calificar Atención
              </button>
            `
            : yaCalificada
              ? '<span class="text-xs text-green-600 font-bold mt-3 block">✅ Calificación enviada</span>'
              : '';
          const observations = esFicha ? `
            <p><strong>Motivo:</strong> ${escapeHTML(reg.motivoConsulta || 'N/A')}</p>
            <p><strong>Evaluación:</strong> ${escapeHTML(reg.evaluacion || 'N/A')}</p>
            <p><strong>Plan:</strong> ${escapeHTML(reg.planAccion || 'N/A')}</p>
          ` : `
            <p><strong>Alimentación:</strong> ${escapeHTML(reg.tipoAlimentacion || 'N/A')} • <strong>Sueño:</strong> ${escapeHTML(reg.horasSueno || 0)}h • <strong>Pañales:</strong> ${escapeHTML(reg.cantidadPanales || 0)}</p>
            <p class="mt-1"><strong>Obs:</strong> ${escapeHTML(reg.observaciones || 'Sin observaciones')}</p>
          `;

          return `
            <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm relative pl-6 border-l-4 ${esFicha ? 'border-indigo-500' : 'border-emerald-500'}">
              <div class="flex justify-between items-start mb-2 flex-wrap gap-2">
                <div>
                  <span class="text-xs text-gray-400 font-bold block mb-1">${escapeHTML(fechaStr)}</span>
                  <h4 class="font-bold text-base text-[#181411] mt-1">${title}</h4>
                  <p class="text-xs text-[#887263]">Prestador: ${provider}</p>
                </div>
              </div>
              <div class="text-sm text-gray-600 mt-2 bg-gray-50 p-3 rounded-lg border border-gray-100">
                ${observations}
              </div>
              ${botonCalificar}
            </div>
          `;
        }).join('');
      };

      const aplicarFiltros = () => {
        const texto = (inputTexto?.value || '').toLowerCase();
        const tipo = selectTipo?.value || 'todos';
        const desde = inputDesde?.value ? new Date(inputDesde.value) : null;
        const hasta = inputHasta?.value ? new Date(inputHasta.value) : null;
        if (hasta) hasta.setHours(23, 59, 59);

        const filtrados = historialCombinado.filter(item => {
          const matchTipo = tipo === 'todos' || item.tipoRegistro === tipo;
          const prestador = (item.prestadorNombre || item.consejeraNombre || '').toLowerCase();
          const notas = (item.observaciones || item.diagnostico || item.resumen || '').toLowerCase();
          const matchTexto = prestador.includes(texto) || notas.includes(texto) || texto === '';

          let matchFecha = true;
          if (item.fechaObj) {
            if (desde && item.fechaObj < desde) matchFecha = false;
            if (hasta && item.fechaObj > hasta) matchFecha = false;
          }

          return matchTipo && matchTexto && matchFecha;
        });

        renderRegistros(filtrados);
      };

      renderRegistros(historialCombinado);

      contenedorLista?.addEventListener('click', event => {
        const botonCalificar = event.target?.closest?.('.btn-calificar');
        if (!botonCalificar) return;

        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4';
        modal.innerHTML = `
          <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" role="dialog" aria-modal="true" aria-labelledby="titulo-encuesta">
            <div class="mb-4 flex items-start justify-between gap-4">
              <h3 id="titulo-encuesta" class="text-xl font-black text-[#181411]">Calificar a ${escapeHTML(botonCalificar.dataset.nombre || 'Profesional')}</h3>
              <button type="button" data-cerrar-encuesta class="text-xl text-gray-400 hover:text-gray-700" aria-label="Cerrar">×</button>
            </div>
            <form id="form-encuesta">
              <div id="selector-estrellas" class="flex justify-center gap-2 my-4 text-4xl cursor-pointer">
                <span data-val="1" class="estrella text-gray-300 hover:text-yellow-400 transition-colors">★</span>
                <span data-val="2" class="estrella text-gray-300 hover:text-yellow-400 transition-colors">★</span>
                <span data-val="3" class="estrella text-gray-300 hover:text-yellow-400 transition-colors">★</span>
                <span data-val="4" class="estrella text-gray-300 hover:text-yellow-400 transition-colors">★</span>
                <span data-val="5" class="estrella text-gray-300 hover:text-yellow-400 transition-colors">★</span>
              </div>
              <input type="hidden" id="valor-calificacion" value="0">
              <textarea id="comentario-encuesta" placeholder="¿Cómo fue tu experiencia? (Opcional)" class="mb-4 min-h-24 w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-[#e87a30] focus:outline-none"></textarea>
              <div class="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" id="check-publicar-testimonio" class="w-4 h-4 text-[#e87a30] rounded focus:ring-[#e87a30]">
                  <span class="text-sm font-bold text-gray-700">Autorizo publicar mi comentario como testimonio</span>
                </label>

                <div id="container-nombre-testimonio" class="hidden mt-2">
                  <label class="block text-xs font-bold text-gray-600 mb-1">¿Cómo quieres aparecer?</label>
                  <input type="text" id="input-nombre-testimonio" placeholder="Ej: María P." maxlength="30" class="w-full p-2 border rounded-xl text-sm">
                </div>
              </div>
              <button type="submit" class="w-full rounded-lg bg-[#e87a30] px-4 py-2 font-bold text-white transition hover:bg-[#cf6825]">Enviar Calificación</button>
            </form>
          </div>
        `;
        document.body.append(modal);

        let calificacionSeleccionada = 0;
        const estrellas = modal.querySelectorAll('.estrella');
        const inputCalificacion = modal.querySelector('#valor-calificacion');

        estrellas.forEach(estrella => {
          estrella.addEventListener('click', event => {
            const valor = parseInt(event.currentTarget.dataset.val, 10);
            calificacionSeleccionada = valor;
            inputCalificacion.value = valor;

            estrellas.forEach((est, index) => {
              if (index < valor) {
                est.classList.remove('text-gray-300');
                est.classList.add('text-yellow-400');
              } else {
                est.classList.remove('text-yellow-400');
                est.classList.add('text-gray-300');
              }
            });
          });
        });

        const checkPublicarTestimonio = modal.querySelector('#check-publicar-testimonio');
        const containerNombreTestimonio = modal.querySelector('#container-nombre-testimonio');
        const inputNombreTestimonio = modal.querySelector('#input-nombre-testimonio');
        checkPublicarTestimonio.addEventListener('change', () => {
          containerNombreTestimonio.classList.toggle('hidden', !checkPublicarTestimonio.checked);
          if (!checkPublicarTestimonio.checked) inputNombreTestimonio.value = '';
        });

        const cerrarModal = () => modal.remove();
        modal.addEventListener('click', event => {
          const botonCerrar = modal.querySelector('[data-cerrar-encuesta]');
          if (event.target === modal || botonCerrar?.contains(event.target)) {
            cerrarModal();
          }
        });

        modal.querySelector('#form-encuesta')?.addEventListener('submit', async event => {
          event.preventDefault();
          const form = event.currentTarget;
          const botonEnviar = form.querySelector('button[type="submit"]');
          if (calificacionSeleccionada === 0) {
            showToast('Por favor selecciona una calificación de 1 a 5 estrellas.', 'warning');
            return;
          }
          if (!botonEnviar) return;

          botonEnviar.disabled = true;
          const reservaId = botonCalificar.dataset.reserva;
          try {
            await saveEncuesta({
              reservaId,
              nidoId,
              prestadorId: botonCalificar.dataset.prestador || '',
              prestadorNombre: botonCalificar.dataset.nombre || 'Profesional',
              calificacion: calificacionSeleccionada,
              comentario: form.querySelector('#comentario-encuesta').value.trim(),
              padreUid: auth.currentUser.uid,
              publicarTestimonio: checkPublicarTestimonio.checked,
              nombreTestimonio: inputNombreTestimonio.value.trim() || 'Anónimo'
            });
            reservasCalificadas.push(reservaId);
            cerrarModal();
            showToast('¡Gracias por calificar la atención!', 'success');
            const botonEnHistorial = Array.from(contenedorLista.querySelectorAll('.btn-calificar'))
              .find(boton => boton.dataset.reserva === reservaId);
            if (botonEnHistorial) {
              const spanExito = document.createElement('span');
              spanExito.className = 'text-xs text-green-600 font-bold mt-3 block';
              spanExito.textContent = '✅ Calificación enviada';
              botonEnHistorial.replaceWith(spanExito);
            }
          } catch (error) {
            console.error('Error al enviar la calificación:', error);
            showToast(error.message || 'No se pudo enviar la calificación. Intenta nuevamente.', 'error');
            botonEnviar.disabled = false;
          }
        });
      });

      inputTexto?.addEventListener('input', aplicarFiltros);
      selectTipo?.addEventListener('change', aplicarFiltros);
      inputDesde?.addEventListener('change', aplicarFiltros);
      inputHasta?.addEventListener('change', aplicarFiltros);

    } catch (e) {
      console.error("Error al cargar historial unificado:", e);
      const contenedorLista = document.getElementById('lista-historial-unificado');
      if (contenedorLista) {
        contenedorLista.innerHTML = '<div class="text-center py-10 text-red-500 italic">Error al cargar el historial del bebé.</div>';
      }
    }
}
