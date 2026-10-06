import { fetchFichasCuidadoPorNido, fetchFichasAtencionPorNido, fetchUserAppointments, obtenerDatosNido, fetchActiveProducts, createPedido, fetchPedidosUsuario } from '../api/firestore.js';
import { escapeHTML } from '../utils/html.js';
import { openCartModal, getCartQuantity } from '../ui/cart.js';
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
              </tr>
            </thead>
            <tbody>
              ${appointments.length > 0 ? appointments.map(app => `
                <tr class="border-b hover:bg-gray-50/50">
                  <td class="p-3 font-bold">${escapeHTML(app.servicio)}</td>
                  <td class="p-3">${escapeHTML(app.profesionalNombre || 'Asignado')}</td>
                  <td class="p-3">${escapeHTML(app.fecha)}${escapeHTML(app.hora || '')}</td>
                  <td class="p-3"><span class="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">${escapeHTML(app.estado)}</span></td>
                </tr>
              `).join('') : `
                <tr><td colspan="4" class="p-6 text-center text-gray-400 italic">No tienes citas agendadas aún.</td></tr>
              `}
            </tbody>
          </table>
        </div>
      </div>
    `;

    document.getElementById('btnAgendarCitaResumen')?.addEventListener('click', () => {
      const btnCalendario = document.getElementById('btnAbrirCalendarioModal') || document.querySelector('[data-action="calendario"]');
      if (btnCalendario) btnCalendario.click();
      else showToast('Usa el calendario principal para agendar', 'info');
    });

    document.getElementById('btnIrTiendaResumen')?.addEventListener('click', () => {
      switchTab('tienda', 'padre', userData);
    });

    document.getElementById('btnAbrirPerfilNido')?.addEventListener('click', () => {
      openPerfilBebeModal(userData);
    });

  } else if (activeTab === 'historial_bebe') {
    dashboardContent.innerHTML = `
      <div class="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 class="text-2xl font-black text-[#181411]">📜 Historial del Bebé</h2>
          <p class="text-sm text-[#887263]">Consulta unificada de fichas de atención y bitácoras de cuidado.</p>
        </div>
      </div>

      <!-- Filtros de Búsqueda -->
      <div class="glass-panel p-4 rounded-xl mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label class="block text-xs font-bold text-gray-600 mb-1">Buscar (Prestador / Nido)</label>
          <input type="text" id="filtro-texto" placeholder="🔍 Texto..." class="w-full p-2 border rounded-lg text-xs bg-white" />
        </div>
        <div>
          <label class="block text-xs font-bold text-gray-600 mb-1">Tipo de Registro</label>
          <select id="filtro-tipo" class="w-full p-2 border rounded-lg text-xs bg-white">
            <option value="todos">Todos los registros</option>
            <option value="ficha">Fichas de Atención</option>
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

      // Función auxiliar para parsear fechas de Firestore de forma segura
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
          const badgeLabel = esFicha ? '🤱 Ficha de Atención' : '🍼 Bitácora de Cuidado';

          return `
            <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm relative pl-6 border-l-4 ${esFicha ? 'border-indigo-500' : 'border-emerald-500'}">
              <div class="flex justify-between items-start mb-2 flex-wrap gap-2">
                <div>
                  <span class="text-xs text-gray-400 font-bold block">${escapeHTML(fechaStr)}</span>
                  <h4 class="font-bold text-base text-[#181411]">${escapeHTML(reg.titulo || (esFicha ? 'Atención de Consejería' : 'Reporte de Cuidado'))}</h4>
                  <p class="text-xs text-[#887263]">Prestador: ${escapeHTML(reg.prestadorNombre || reg.consejeraNombre || 'Profesional')}</p>
                </div>
                <span class="text-xs font-bold px-2.5 py-1 rounded-full ${badgeClass}">${badgeLabel}</span>
              </div>
              <div class="text-sm text-gray-600 mt-2 bg-gray-50 p-3 rounded-lg border border-gray-100">
                ${escapeHTML(reg.observaciones || reg.diagnostico || reg.resumen || 'Sin observaciones detalladas.')}
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

  } else if (activeTab === 'tienda') {
    dashboardContent.innerHTML = `
      <div class="flex justify-between items-center mb-6">
        <div>
          <h2 class="text-2xl font-black text-[#181411]">Tienda Bebé 🛍️</h2>
          <p class="text-sm text-[#887263]">Encuentra productos especializados para el cuidado y lactancia.</p>
        </div>
        <button id="btnVerCarritoTienda" class="bg-[#e87a30] text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md hover:bg-[#d66a20] transition">
          🛒 Ver Carrito (${getCartQuantity()})
        </button>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6" id="grid-productos-tienda">
        <p class="col-span-full text-center py-10 text-gray-400 italic">Cargando productos...</p>
      </div>
    `;

    document.getElementById('btnVerCarritoTienda')?.addEventListener('click', openCartModal);

    try {
      const productos = await fetchActiveProducts();
      const grid = document.getElementById('grid-productos-tienda');
      if (grid) {
        if (productos.length === 0) {
          grid.innerHTML = '<p class="col-span-full text-center py-10 text-gray-400 italic">No hay productos disponibles por el momento.</p>';
        } else {
          grid.innerHTML = productos.map(prod => `
            <div class="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
              <div>
                ${prod.imagenUrl ? `<img src="${escapeHTML(prod.imagenUrl)}" alt="${escapeHTML(prod.nombre)}" class="w-full h-40 object-cover rounded-xl mb-3" />` : ''}
                <span class="text-xs bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full font-bold">${escapeHTML(prod.categoria || 'General')}</span>
                <h4 class="font-bold text-lg mt-2 text-[#181411]">${escapeHTML(prod.nombre)}</h4>
                <p class="text-xs text-gray-500 mt-1">Stock: ${prod.stock || 0} disponibles</p>
              </div>
              <div class="mt-4 flex items-center justify-between">
                <span class="text-lg font-black text-[#e87a30]">$${Number(prod.precio || 0).toLocaleString('es-CL')}</span>
                <button class="btn-agregar-carrito bg-[#181411] hover:bg-[#332b26] text-white text-xs font-bold px-3 py-2 rounded-xl transition" data-id="${prod.id}" data-nombre="${escapeHTML(prod.nombre)}" data-precio="${prod.precio}">
                  Agregar 🛒
                </button>
              </div>
            </div>
          `).join('');

          grid.querySelectorAll('.btn-agregar-carrito').forEach(btn => {
            btn.onclick = () => {
              const { id, nombre, precio } = btn.dataset;
              showToast(`Añadido al carrito: ${nombre}`, 'success');
            };
          });
        }
      }
    } catch (e) {
      console.error("Error al cargar productos:", e);
    }

  } else if (activeTab === 'pedidos') {
    dashboardContent.innerHTML = `
      <h2 class="text-2xl font-black text-[#181411] mb-6">Mis Pedidos 📦</h2>
      <div class="space-y-4" id="lista-pedidos-padre">
        <p class="text-center py-10 text-gray-400 italic">Cargando pedidos...</p>
      </div>
    `;
    try {
      const pedidos = await fetchPedidosUsuario(userData.uid);
      const container = document.getElementById('lista-pedidos-padre');
      if (container) {
        if (pedidos.length === 0) {
          container.innerHTML = '<p class="text-center py-10 text-gray-400 italic">No has realizado ningún pedido todavía.</p>';
        } else {
          container.innerHTML = pedidos.map(ped => `
            <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex justify-between items-center flex-wrap gap-4">
              <div>
                <span class="text-xs text-gray-400 font-bold">Pedido ID: ${escapeHTML(ped.id)}</span>
                <h4 class="font-bold text-base text-[#181411]">Total: $${Number(ped.total || 0).toLocaleString('es-CL')}</h4>
                <p class="text-xs text-gray-600 mt-1">Dirección: ${escapeHTML(ped.direccion || 'N/A')}</p>
              </div>
              <div>
                <span class="text-xs font-bold px-3 py-1 rounded-full bg-blue-100 text-blue-700 uppercase">${escapeHTML(ped.estado)}</span>
              </div>
            </div>
          `).join('');
        }
      }
    } catch (e) {
      console.error("Error cargando pedidos:", e);
    }
  }
}