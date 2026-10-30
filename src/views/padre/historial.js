import { fetchFichasAtencionPorNido, fetchFichasCuidadoPorNido } from '../../api/firestore.js';
import { escapeHTML } from '../../utils/html.js';

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

      if (nidoId) {
        [fichasAtencion, bitacoras] = await Promise.all([
          fetchFichasAtencionPorNido(nidoId),
          fetchFichasCuidadoPorNido(nidoId)
        ]);
      }

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

          const badgeClass = esFicha ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700';
          const badgeLabel = esFicha ? '🤱 Evaluación de Atención' : '🍼 Evaluación de Cuidado';

          const title = escapeHTML(reg.titulo || (esFicha ? 'Atención de Consejería' : 'Reporte de Cuidado'));
          const provider = escapeHTML(reg.prestadorNombre || reg.consejeraNombre || 'Profesional');
          const observations = escapeHTML(reg.observaciones || reg.diagnostico || reg.resumen || 'Sin observaciones detalladas.');

          return `
            <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm relative pl-6 border-l-4 ${esFicha ? 'border-indigo-500' : 'border-emerald-500'}">
              <div class="flex justify-between items-start mb-2 flex-wrap gap-2">
                <div>
                  <span class="text-xs text-gray-400 font-bold block">${escapeHTML(fechaStr)}</span>
                  <h4 class="font-bold text-base text-[#181411]">${title}</h4>
                  <p class="text-xs text-[#887263]">Prestador: ${provider}</p>
                </div>
                <span class="text-xs font-bold px-2.5 py-1 rounded-full ${badgeClass}">${badgeLabel}</span>
              </div>
              <div class="text-sm text-gray-600 mt-2 bg-gray-50 p-3 rounded-lg border border-gray-100">
                ${observations}
              </div>
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
