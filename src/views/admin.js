// Archivo: src/views/admin.js
// Origen: extraído de src/mi-cuenta.js durante refactor (panel admin)

import { showToast } from '../ui/notifications.js';
import {
  fetchAdminStats,
  getAllUsers,
  getAllNidos,
  deleteNidoProfile,
  reactivarNidoProfile,
  fetchTodosPedidos,
  createProduct,
  fetchFichasCuidadoPorNido,
  fetchFichasAtencionPorNido,
  fetchAllBitacoras,
  fetchAllFichasAtencion,
} from '../api/firestore.js';
import { escapeHTML } from '../utils/html.js';
import { renderAdminInventory, renderAdminAllOrders } from './admin/tienda.js';
import { renderAdminTipsManagement } from './admin/tips.js';
import { formatFirestoreDate, toDateInputValue, FIELD_LABELS, showInfoModal, resolveHistoricalName, getNidoNombreDesdePadre, fileToBase64 } from './admin/helpers.js';
import { loadPendingUsers, loadAllUsersTable, loadLatestUsers } from './admin/usuarios.js';

// ══════════════════════════════════════════════════════════════
// RENDER PRINCIPAL
// ══════════════════════════════════════════════════════════════

export async function renderAdminTab(activeTab) {
  const dashboardContent = document.getElementById('dashboard-content');
  if (!dashboardContent) return;

  if (activeTab === 'dashboard') {
    const stats = await fetchAdminStats();
    dashboardContent.innerHTML = `
      <h2 class="text-3xl font-black text-[#181411] mb-6">Panel Super Administrador 🚀</h2>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div class="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <div class="text-gray-500 text-sm font-medium mb-1">Total Usuarios</div>
          <div class="text-3xl font-black">${stats.totalUsers || 0}</div>
        </div>
        <div class="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <div class="text-gray-500 text-sm font-medium mb-1">Citas Activas</div>
          <div class="text-3xl font-black text-[#e87a30]">${stats.activeAppointments || 0}</div>
        </div>
        <div class="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <div class="text-gray-500 text-sm font-medium mb-1">Prestadores</div>
          <div class="text-3xl font-black text-[#887263]">${stats.totalPrestadores || 0}</div>
        </div>
        <div class="bg-gradient-to-br from-[#e87a30] to-[#f4c28e] p-5 rounded-xl shadow-sm text-white">
          <div class="text-white/80 text-sm font-medium mb-1">Pedidos Generados</div>
          <div id="admin-orders-count" class="text-3xl font-black">Cargando...</div>
        </div>
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 class="font-bold text-lg mb-4 border-b pb-2">Aprobaciones Pendientes</h3>
          <div id="pending-users-list" class="space-y-3">
            <p class="text-sm text-gray-400 italic">Cargando solicitudes...</p>
          </div>
        </div>
        <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 class="font-bold text-lg mb-4 border-b pb-2">Últimos Registros</h3>
          <ul id="admin-latest-users" class="space-y-3">
            <p class="text-sm text-gray-400 italic">Cargando usuarios...</p>
          </ul>
        </div>
      </div>
    `;

    loadPendingUsers();
    loadLatestUsers();

    try {
      const ped = await fetchTodosPedidos();
      const cnt = document.getElementById('admin-orders-count');
      if (cnt) cnt.textContent = ped.length;
    } catch (e) {
      console.warn('No se pudo cargar el conteo de pedidos', e);
    }

  } else if (activeTab === 'usuarios') {
    dashboardContent.innerHTML = `
      <h2 class="text-2xl font-black text-[#181411] mb-6">Gestión de Usuarios</h2>
      <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <input id="users-search" type="search" placeholder="Buscar por nombre, email o RUT" class="p-2 border border-gray-300 rounded text-sm focus:border-[#e87a30] outline-none" />
          <select id="users-role-filter" class="p-2 border border-gray-300 rounded text-sm focus:border-[#e87a30] outline-none">
            <option value="">Todos los roles</option>
            <option value="padre">Padre</option>
            <option value="consejera">Consejera</option>
            <option value="cuidadora">Cuidadora</option>
          </select>
          <select id="users-status-filter" class="p-2 border border-gray-300 rounded text-sm focus:border-[#e87a30] outline-none">
            <option value="">Todos los estados</option>
            <option value="activo">Activo</option>
            <option value="pendiente">Pendiente</option>
            <option value="inactivo">Inactivo</option>
          </select>
        </div>
        <div id="users-table-container" class="overflow-x-auto">
          <p class="text-center py-8 text-gray-400 italic">Cargando usuarios...</p>
        </div>
      </div>
    `;
    loadAllUsersTable();
  
  } else if (activeTab === 'admin_nidos') {
    dashboardContent.innerHTML = `
      <h2 class="text-2xl font-black text-[#181411] mb-6">Gestión de Nidos y Familias</h2>
      <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div id="nidos-table-container" class="overflow-x-auto">
          <p class="text-center py-8 text-gray-400 italic">Cargando nidos...</p>
        </div>
      </div>
    `;
    loadAllNidos();
  
  } else if (activeTab === 'admin_registros') {
    dashboardContent.innerHTML = `
      <h2 class="text-2xl font-black text-[#181411] mb-6">📋 Registros del Sistema</h2>
      <div id="registros-container">
        <p class="text-center py-8 text-gray-400 italic">Cargando registros...</p>
      </div>
    `;
    loadAllRegistros();

  } else if (activeTab === 'admin_tienda') {
    dashboardContent.innerHTML = `
      <h2 class="text-2xl font-black text-[#181411] mb-6">Gestión de Tienda & Inventario</h2>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h4 class="font-bold text-lg text-[#181411] mb-4">Añadir Nuevo Producto</h4>
          <form id="adminAddProductForm" class="space-y-4">
            <div>
              <label class="block text-xs font-bold text-gray-700 mb-1">Nombre</label>
              <input type="text" name="nombre" required placeholder="Ej. Cojín de Lactancia" class="w-full p-2 border border-gray-300 rounded text-sm focus:border-[#e87a30] outline-none" />
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-bold text-gray-700 mb-1">Precio (CLP)</label>
                <input type="number" name="precio" required placeholder="32500" class="w-full p-2 border border-gray-300 rounded text-sm focus:border-[#e87a30] outline-none" />
              </div>
              <div>
                <label class="block text-xs font-bold text-gray-700 mb-1">Stock</label>
                <input type="number" name="stock" required placeholder="10" class="w-full p-2 border border-gray-300 rounded text-sm focus:border-[#e87a30] outline-none" />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-bold text-gray-700 mb-1">Categoría</label>
                <select name="categoria" required class="w-full p-2 border border-gray-300 rounded text-sm focus:border-[#e87a30] outline-none">
                  <option value="Lactancia">Lactancia</option>
                  <option value="Higiene">Higiene</option>
                  <option value="Accesorios">Accesorios</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-bold text-gray-700 mb-1">Imagen</label>
                <input type="file" name="imagenFile" accept="image/*" class="w-full p-2 border border-gray-300 rounded text-sm focus:border-[#e87a30] outline-none file:mr-3 file:rounded file:border-0 file:bg-[#f4eade] file:px-3 file:py-1 file:text-xs file:font-bold" />
              </div>
            </div>
            <button type="submit" class="w-full bg-[#181411] hover:bg-[#e87a30] text-white font-bold py-2.5 rounded-lg text-sm transition">
              Guardar Producto en Tienda
            </button>
          </form>
        </div>
        <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col">
          <h4 class="font-bold text-lg text-[#181411] mb-4">Productos en Inventario</h4>
          <div class="flex-1 overflow-y-auto space-y-3 max-h-[500px]" id="admin-inventory-list">
            <p class="text-gray-400 italic text-sm">Cargando catálogo...</p>
          </div>
        </div>
      </div>
    `;

    renderAdminInventory();

    const addForm = document.getElementById('adminAddProductForm');
    if (addForm) {
      addForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = new FormData(addForm);
        const imageFile = fd.get('imagenFile');
        let imagenUrl = 'https://images.unsplash.com/photo-1519864600265-abb23847ef2c?auto=format&fit=crop&w=300&q=80';

        if (imageFile instanceof File && imageFile.size > 0) {
          imagenUrl = await fileToBase64(imageFile);
        }

        const data = {
          nombre: fd.get('nombre'),
          precio: parseFloat(fd.get('precio')),
          stock: parseInt(fd.get('stock')),
          categoria: fd.get('categoria'),
          imagenUrl
        };

        try {
          await createProduct(data);
          showToast('Producto creado con éxito', 'success');
          addForm.reset();
          renderAdminInventory();
        } catch {
          showToast('Error al crear producto', 'error');
        }
      });
    }

  } else if (activeTab === 'admin_tips') {
    dashboardContent.innerHTML = `
      <h2 class="text-2xl font-black text-[#181411] mb-6">Gestión de Tips</h2>
      <div id="admin-tips-management" class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <p class="text-center text-gray-500">Cargando tips existentes...</p>
      </div>
    `;
    await renderAdminTipsManagement();

  } else if (activeTab === 'admin_pedidos') {
    dashboardContent.innerHTML = `
      <h2 class="text-2xl font-black text-[#181411] mb-6">📦 Historial de Todos los Pedidos</h2>
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden" id="admin-orders-list">
        <p class="text-center py-10 text-gray-400 italic">Cargando todos los pedidos...</p>
      </div>
    `;
    renderAdminAllOrders();
  }
}

// ══════════════════════════════════════════════════════════════
// REGISTROS GLOBALES CON FILTROS
// ══════════════════════════════════════════════════════════════

async function loadAllRegistros() {
  const container = document.getElementById('registros-container');
  if (!container) return;

  try {
    const [bitacoras, fichas, usuarios, nidos] = await Promise.all([
      fetchAllBitacoras(),
      fetchAllFichasAtencion(),
      getAllUsers(),
      getAllNidos()
    ]);

    const userMap = new Map();
    usuarios.forEach(u => userMap.set(u.id, { ...u, nombre: u.nombre || u.email || u.id }));

    const nidoMap = new Map();
    nidos.forEach(n => {
      const hijos = n.hijos || [];
      nidoMap.set(n.id, hijos[0]?.nombre || 'Sin nombre');
    });

    // Estado de la vista y filtros
    let vistaActual = 'bitacoras';
    const filtros = {
      bitacoras: { texto: '', desde: '', hasta: '' },
      fichas: { texto: '', desde: '', hasta: '' }
    };

    /**
     * Aplica los filtros a un array de registros según su tipo.
     */
    const aplicarFiltros = (registros, tipo) => {
      const f = filtros[tipo];
      const search = f.texto.trim().toLowerCase();

      return registros.filter(r => {
        // 1. Filtro de texto
        if (search) {
          let textoBuscable = '';
          if (tipo === 'bitacoras') {
            const nombreNido = resolveHistoricalName(r.nidoNombreBebe, () => (r.nidoId ? nidoMap.get(r.nidoId) : null) || getNidoNombreDesdePadre(r.uidPadre, userMap, nidoMap), '');
            const nombrePrestador = resolveHistoricalName(r.prestadorNombre, () => userMap.get(r.prestadorId)?.nombre, '');
            textoBuscable = `${nombreNido} ${nombrePrestador} ${r.observaciones || ''} ${r.deposiciones || ''} ${r.sueno || ''}`.toLowerCase();
          } else {
            const nombreNido = resolveHistoricalName(r.nidoNombreBebe, () => (r.nidoId ? nidoMap.get(r.nidoId) : null) || getNidoNombreDesdePadre(r.uidPadre, userMap, nidoMap), '');
            const nombreConsejera = resolveHistoricalName(r.consejeraNombre, () => userMap.get(r.consejeraId)?.nombre, '');
            textoBuscable = `${nombreNido} ${nombreConsejera} ${r.motivoConsulta || ''} ${r.motivo || ''} ${r.evaluacion || ''} ${r.planAccion || ''}`.toLowerCase();
          }
          if (!textoBuscable.includes(search)) return false;
        }

        // 2. Filtro de fecha
        const fechaRegistro = tipo === 'bitacoras' 
          ? toDateInputValue(r.fecha || r.creadoEn)
          : toDateInputValue(r.fechaAtencion || r.creadoEn);

        if (f.desde && fechaRegistro && fechaRegistro < f.desde) return false;
        if (f.hasta && fechaRegistro && fechaRegistro > f.hasta) return false;
        if ((f.desde || f.hasta) && !fechaRegistro) return false;

        return true;
      });
    };

    const render = () => {
      const totalBitacoras = bitacoras.length;
      const totalFichas = fichas.length;
      const esBitacoras = vistaActual === 'bitacoras';
      const filtroActual = esBitacoras ? filtros.bitacoras : filtros.fichas;
      const registrosBase = esBitacoras ? bitacoras : fichas;
      const registrosFiltrados = aplicarFiltros(registrosBase, vistaActual);
      const totalFiltrados = registrosFiltrados.length;
      const totalBase = registrosBase.length;
      const hayFiltrosActivos = filtroActual.texto || filtroActual.desde || filtroActual.hasta;

      const headerHTML = `
        <div class="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div class="flex gap-2">
            <button id="btn-vista-bitacoras" class="text-sm font-bold px-4 py-2 rounded-lg transition-colors ${esBitacoras ? 'bg-[#e87a30] text-white shadow-md' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'}">
              🍼 Bitácoras (${totalBitacoras})
            </button>
            <button id="btn-vista-fichas" class="text-sm font-bold px-4 py-2 rounded-lg transition-colors ${!esBitacoras ? 'bg-[#e87a30] text-white shadow-md' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'}">
              💜 Fichas (${totalFichas})
            </button>
          </div>
          <div class="text-xs text-gray-500">
            ${hayFiltrosActivos 
              ? `Mostrando <strong>${totalFiltrados}</strong> de <strong>${totalBase}</strong> registros`
              : `Total: <strong>${totalBase}</strong> registros`}
          </div>
        </div>

        <!-- BARRA DE FILTROS -->
        <div class="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-4">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div class="md:col-span-2">
              <label class="block text-[10px] font-bold text-gray-500 uppercase mb-1">Buscar</label>
              <input 
                type="search" 
                id="filtro-texto"
                value="${escapeHTML(filtroActual.texto)}"
                placeholder="${esBitacoras ? 'Buscar por nido, prestador, observaciones...' : 'Buscar por nido, consejera, motivo...'}"
                class="w-full p-2 border border-gray-300 rounded text-sm focus:border-[#e87a30] outline-none"
              />
            </div>
            <div>
              <label class="block text-[10px] font-bold text-gray-500 uppercase mb-1">Desde</label>
              <input 
                type="date" 
                id="filtro-desde"
                value="${filtroActual.desde}"
                class="w-full p-2 border border-gray-300 rounded text-sm focus:border-[#e87a30] outline-none"
              />
            </div>
            <div>
              <label class="block text-[10px] font-bold text-gray-500 uppercase mb-1">Hasta</label>
              <input 
                type="date" 
                id="filtro-hasta"
                value="${filtroActual.hasta}"
                class="w-full p-2 border border-gray-300 rounded text-sm focus:border-[#e87a30] outline-none"
              />
            </div>
          </div>
          ${hayFiltrosActivos ? `
            <div class="mt-3 flex justify-end">
              <button id="btn-limpiar-filtros" class="text-xs font-bold text-[#e87a30] hover:text-[#d66a20] hover:underline">
                ✕ Limpiar filtros
              </button>
            </div>
          ` : ''}
        </div>
      `;

      if (esBitacoras) {
        if (totalFiltrados === 0) {
          container.innerHTML = headerHTML + `<p class="text-center py-8 text-gray-400 italic bg-white rounded-xl border border-gray-200">${hayFiltrosActivos ? 'No hay bitácoras que coincidan con los filtros aplicados.' : 'No hay bitácoras registradas en el sistema.'}</p>`;
        } else {
          container.innerHTML = headerHTML + `
            <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div class="overflow-x-auto">
                <table class="w-full text-left text-sm">
                  <thead class="bg-gray-50 text-gray-600 border-b border-gray-200">
                    <tr>
                      <th class="p-3">Fecha</th>
                      <th class="p-3">Nido / Bebé</th>
                      <th class="p-3">Prestador</th>
                      <th class="p-3">Sueño</th>
                      <th class="p-3">Deposiciones</th>
                      <th class="p-3">Acciones</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-100">
                    ${registrosFiltrados.map(b => {
                      const fecha = formatFirestoreDate(b.fecha || b.creadoEn) || '---';
                      const nombreNido = resolveHistoricalName(b.nidoNombreBebe, () => (b.nidoId ? nidoMap.get(b.nidoId) : null) || getNidoNombreDesdePadre(b.uidPadre, userMap, nidoMap), 'Sin nido');
                      const nombrePrestador = resolveHistoricalName(b.prestadorNombre, () => userMap.get(b.prestadorId)?.nombre, 'Sin nombre');
                      return `
                        <tr>
                          <td class="p-3 text-xs">${escapeHTML(fecha)}</td>
                          <td class="p-3 text-xs font-bold">${escapeHTML(nombreNido)}</td>
                          <td class="p-3 text-xs">${escapeHTML(nombrePrestador)}</td>
                          <td class="p-3 text-xs">${escapeHTML((b.sueno || '---').toString().substring(0, 40))}</td>
                          <td class="p-3 text-xs">${escapeHTML((b.deposiciones || '---').toString().substring(0, 40))}</td>
                          <td class="p-3 whitespace-nowrap">
                            <button type="button" class="btn-ver-bitacora text-blue-600 hover:text-blue-800 text-xs font-bold" data-json='${escapeHTML(JSON.stringify(b))}' data-nido='${escapeHTML(nombreNido)}' data-prestador='${escapeHTML(nombrePrestador)}'>Ver</button>
                          </td>
                        </tr>
                      `;
                    }).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          `;
        }
      } else {
        if (totalFiltrados === 0) {
          container.innerHTML = headerHTML + `<p class="text-center py-8 text-gray-400 italic bg-white rounded-xl border border-gray-200">${hayFiltrosActivos ? 'No hay fichas que coincidan con los filtros aplicados.' : 'No hay fichas de atención registradas en el sistema.'}</p>`;
        } else {
          container.innerHTML = headerHTML + `
            <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div class="overflow-x-auto">
                <table class="w-full text-left text-sm">
                  <thead class="bg-gray-50 text-gray-600 border-b border-gray-200">
                    <tr>
                      <th class="p-3">Fecha Atención</th>
                      <th class="p-3">Nido / Bebé</th>
                      <th class="p-3">Consejera</th>
                      <th class="p-3">Motivo</th>
                      <th class="p-3">Acciones</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-100">
                    ${registrosFiltrados.map(f => {
                      const fecha = formatFirestoreDate(f.fechaAtencion || f.creadoEn) || '---';
                      const nombreNido = resolveHistoricalName(f.nidoNombreBebe, () => (f.nidoId ? nidoMap.get(f.nidoId) : null) || getNidoNombreDesdePadre(f.uidPadre, userMap, nidoMap), 'Sin nido');
                      const nombreConsejera = resolveHistoricalName(f.consejeraNombre, () => userMap.get(f.consejeraId)?.nombre, 'Sin nombre');
                      return `
                        <tr>
                          <td class="p-3 text-xs">${escapeHTML(fecha)}</td>
                          <td class="p-3 text-xs font-bold">${escapeHTML(nombreNido)}</td>
                          <td class="p-3 text-xs">${escapeHTML(nombreConsejera)}</td>
                          <td class="p-3 text-xs">${escapeHTML((f.motivoConsulta || f.motivo || '---').substring(0, 50))}</td>
                          <td class="p-3 whitespace-nowrap">
                            <button type="button" class="btn-ver-ficha-global text-blue-600 hover:text-blue-800 text-xs font-bold" data-json='${escapeHTML(JSON.stringify(f))}' data-nido='${escapeHTML(nombreNido)}' data-consejera='${escapeHTML(nombreConsejera)}'>Ver</button>
                          </td>
                        </tr>
                      `;
                    }).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          `;
        }
      }

      // Listeners de cambio de vista
      document.getElementById('btn-vista-bitacoras')?.addEventListener('click', () => {
        vistaActual = 'bitacoras';
        render();
      });
      document.getElementById('btn-vista-fichas')?.addEventListener('click', () => {
        vistaActual = 'fichas';
        render();
      });

      // Listeners de filtros (inputs)
      const inputTexto = document.getElementById('filtro-texto');
      const inputDesde = document.getElementById('filtro-desde');
      const inputHasta = document.getElementById('filtro-hasta');
      const btnLimpiar = document.getElementById('btn-limpiar-filtros');

      let debounceTimer;
      inputTexto?.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          filtros[vistaActual].texto = e.target.value;
          const cursorPos = e.target.selectionStart;
          render();
          const newInput = document.getElementById('filtro-texto');
          if (newInput) {
            newInput.focus();
            newInput.setSelectionRange(cursorPos, cursorPos);
          }
        }, 300);
      });

      inputDesde?.addEventListener('change', (e) => {
        filtros[vistaActual].desde = e.target.value;
        render();
      });

      inputHasta?.addEventListener('change', (e) => {
        filtros[vistaActual].hasta = e.target.value;
        render();
      });

      btnLimpiar?.addEventListener('click', () => {
        filtros[vistaActual] = { texto: '', desde: '', hasta: '' };
        render();
      });

      // Listeners de "Ver"
      container.querySelectorAll('.btn-ver-bitacora').forEach(btn => {
        btn.addEventListener('click', () => {
          const data = JSON.parse(btn.dataset.json);
          const rows = [];
          Object.entries(data).forEach(([key, value]) => {
            if (key === 'id') return;
            const label = FIELD_LABELS[key] || key;
            let display = value;
            if (key === 'fecha' || key === 'fechaHora' || key === 'creadoEn' || key === 'actualizadoEn' || key === 'fechaAtencion') {
              display = formatFirestoreDate(value, true) || value;
            } else if (Array.isArray(value)) {
              display = value.join(', ');
            } else if (typeof value === 'object' && value !== null) {
              display = JSON.stringify(value);
            }
            rows.push([label, display]);
          });

          showInfoModal({
            title: 'Bitácora de Cuidado',
            subtitle: `Nido: ${btn.dataset.nido} · Prestador: ${btn.dataset.prestador}`,
            icon: '🍼',
            rows
          });
        });
      });

      container.querySelectorAll('.btn-ver-ficha-global').forEach(btn => {
        btn.addEventListener('click', () => {
          const data = JSON.parse(btn.dataset.json);
          const rows = [];
          Object.entries(data).forEach(([key, value]) => {
            if (key === 'id') return;
            const label = FIELD_LABELS[key] || key;
            let display = value;
            if (key === 'fechaAtencion' || key === 'fecha' || key === 'creadoEn' || key === 'actualizadoEn') {
              display = formatFirestoreDate(value, true) || value;
            } else if (Array.isArray(value)) {
              display = value.join(', ');
            } else if (typeof value === 'object' && value !== null) {
              display = JSON.stringify(value);
            }
            rows.push([label, display]);
          });

          showInfoModal({
            title: 'Ficha de Atención',
            subtitle: `Nido: ${btn.dataset.nido} · Consejera: ${btn.dataset.consejera}`,
            icon: '💜',
            rows
          });
        });
      });
    };

    render();
  } catch (error) {
    console.error('Error al cargar registros globales:', error);
    container.innerHTML = '<p class="text-center py-8 text-red-500 italic">Error al cargar los registros.</p>';
  }
}

// ══════════════════════════════════════════════════════════════
// RESTO DE FUNCIONES (sin cambios)
// ══════════════════════════════════════════════════════════════

async function loadAllNidos() {
  const container = document.getElementById('nidos-table-container');
  if (!container) return;

  try {
    const [nidos, usuarios] = await Promise.all([getAllNidos(), getAllUsers()]);
    if (nidos.length === 0) {
      container.innerHTML = '<p class="text-center py-8 text-gray-400 italic">No hay nidos registrados.</p>';
      return;
    }

    const userMap = new Map();
    usuarios.forEach(u => userMap.set(u.id, u.nombre || u.email || u.id));

    let mostrarInactivos = false;

    const renderTabla = () => {
      const nidosFiltrados = nidos.filter(n => {
        const estado = n.estado || 'activo';
        return mostrarInactivos ? estado === 'inactivo' : estado === 'activo';
      });

      const totalActivos = nidos.filter(n => (n.estado || 'activo') === 'activo').length;
      const totalInactivos = nidos.filter(n => n.estado === 'inactivo').length;

      if (nidosFiltrados.length === 0) {
        container.innerHTML = `
          <div class="flex items-center gap-3 mb-4">
            <button id="toggle-nidos-inactivos" class="text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${mostrarInactivos ? 'bg-[#e87a30] text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}">
              ${mostrarInactivos ? '← Ver Activos' : `Ver Inactivos (${totalInactivos})`}
            </button>
          </div>
          <p class="text-center py-8 text-gray-400 italic">${mostrarInactivos ? 'No hay nidos desactivados.' : 'No hay nidos activos.'}</p>
        `;
        document.getElementById('toggle-nidos-inactivos')?.addEventListener('click', () => {
          mostrarInactivos = !mostrarInactivos;
          renderTabla();
        });
        return;
      }

      container.innerHTML = `
        <div class="flex items-center justify-between mb-4">
          <p class="text-sm text-gray-500">Mostrando <strong>${nidosFiltrados.length}</strong> nido(s) ${mostrarInactivos ? 'inactivo(s)' : 'activo(s)'}</p>
          <button id="toggle-nidos-inactivos" class="text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${mostrarInactivos ? 'bg-[#e87a30] text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}">
            ${mostrarInactivos ? `← Ver Activos (${totalActivos})` : `Ver Inactivos (${totalInactivos})`}
          </button>
        </div>
        <table class="w-full text-left text-sm">
          <thead class="bg-gray-50 text-gray-600 border-b border-gray-200">
            <tr>
              <th class="p-3">Estado</th>
              <th class="p-3">Bebés / Hijos</th>
              <th class="p-3">Padres / Familia</th>
              <th class="p-3">Fecha Creación</th>
              <th class="p-3">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            ${nidosFiltrados.map(nido => {
              const hijos = nido.hijos || (nido.rutBebe ? [{ nombre: 'Nido antiguo', rut: nido.rutBebe }] : []);
              const padresUids = nido.padresUids || [];
              const nombresPadres = padresUids.map(uid => userMap.get(uid) || `(UID: ${uid.substring(0, 8)}...)`);
              const estadoNido = nido.estado || 'activo';
              const esActivo = estadoNido === 'activo';
              const fechaCreacion = formatFirestoreDate(nido.creadoEn) || '---';

              return `
                <tr class="${esActivo ? '' : 'bg-red-50/30 opacity-75'}">
                  <td class="p-3">
                    <span class="text-[10px] font-bold px-2 py-1 rounded-full ${esActivo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">
                      ${esActivo ? '● ACTIVO' : '● INACTIVO'}
                    </span>
                  </td>
                  <td class="p-3 text-xs">
                    ${hijos.length > 0 ? hijos.map(h => `<div class="mb-1"><span class="font-bold">${escapeHTML(h.nombre || 'Sin nombre')}</span>${h.rut ? `<span class="text-gray-400 ml-1">(${escapeHTML(h.rut)})</span>` : ''}</div>`).join('') : '<span class="text-gray-400 italic">Sin registros</span>'}
                  </td>
                  <td class="p-3 text-xs">${nombresPadres.length > 0 ? nombresPadres.map(n => `<div class="mb-1">${escapeHTML(n)}</div>`).join('') : '<span class="text-gray-400 italic">Sin padres vinculados</span>'}</td>
                  <td class="p-3 text-xs text-gray-500">${escapeHTML(fechaCreacion)}</td>
                  <td class="p-3 whitespace-nowrap">
                    <button type="button" class="btn-view-nido text-blue-600 hover:text-blue-800 text-xs font-bold" data-id="${nido.id}">Ver</button>
                    ${esActivo ? `<button type="button" class="btn-delete-nido text-red-600 hover:text-red-800 text-xs font-bold ml-3" data-id="${nido.id}">Desactivar</button>` : `<button type="button" class="btn-reactivate-nido text-green-600 hover:text-green-800 text-xs font-bold ml-3" data-id="${nido.id}">Reactivar</button>`}
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      `;

      document.getElementById('toggle-nidos-inactivos')?.addEventListener('click', () => {
        mostrarInactivos = !mostrarInactivos;
        renderTabla();
      });

      container.querySelectorAll('.btn-view-nido').forEach(btn => {
        btn.addEventListener('click', () => renderDetalleNido(btn.dataset.id));
      });

      container.querySelectorAll('.btn-delete-nido').forEach(btn => {
        btn.addEventListener('click', async () => {
          const nidoId = btn.dataset.id;
          if (!window.confirm('¿Estás seguro de desactivar este nido?')) return;
          btn.disabled = true;
          btn.textContent = 'Desactivando...';
          try {
            await deleteNidoProfile(nidoId);
            const nido = nidos.find(n => n.id === nidoId);
            if (nido) nido.estado = 'inactivo';
            showToast('Nido desactivado correctamente.', 'success');
            renderTabla();
          } catch (error) {
            console.error('Error al desactivar nido:', error);
            btn.disabled = false;
            btn.textContent = 'Desactivar';
            showToast(error.message || 'Error al desactivar nido.', 'error');
          }
        });
      });

      container.querySelectorAll('.btn-reactivate-nido').forEach(btn => {
        btn.addEventListener('click', async () => {
          const nidoId = btn.dataset.id;
          if (!window.confirm('¿Reactivar este nido?')) return;
          btn.disabled = true;
          btn.textContent = 'Reactivando...';
          try {
            await reactivarNidoProfile(nidoId);
            const nido = nidos.find(n => n.id === nidoId);
            if (nido) nido.estado = 'activo';
            showToast('Nido reactivado correctamente.', 'success');
            renderTabla();
          } catch (error) {
            console.error('Error al reactivar nido:', error);
            btn.disabled = false;
            btn.textContent = 'Reactivar';
            showToast(error.message || 'Error al reactivar nido.', 'error');
          }
        });
      });
    };

    renderTabla();
  } catch (error) {
    console.error('Error al cargar nidos:', error);
    container.innerHTML = '<p class="text-center py-8 text-red-500 italic">Error cargando nidos.</p>';
  }
}

async function renderDetalleNido(nidoId) {
  const dashboardContent = document.getElementById('dashboard-content');
  if (!dashboardContent) return;

  dashboardContent.innerHTML = `
    <div class="flex flex-col items-center justify-center h-64 text-gray-400">
      <div class="w-12 h-12 border-4 border-[#e87a30] border-t-transparent rounded-full animate-spin mb-4"></div>
      <p class="animate-pulse font-medium">Cargando detalles del nido...</p>
    </div>
  `;

  try {
    const [nidos, usuarios, bitacoras, fichas] = await Promise.all([
      getAllNidos(), getAllUsers(),
      fetchFichasCuidadoPorNido(nidoId),
      fetchFichasAtencionPorNido(nidoId)
    ]);

    const nido = nidos.find(n => n.id === nidoId);
    if (!nido) {
      dashboardContent.innerHTML = '<p class="text-center py-8 text-red-500">Nido no encontrado.</p>';
      return;
    }

    const userMap = new Map();
    usuarios.forEach(u => userMap.set(u.id, u.nombre || u.email || u.id));

    const hijos = nido.hijos || (nido.rutBebe ? [{ nombre: 'Nido antiguo', rut: nido.rutBebe }] : []);
    const padresUids = nido.padresUids || [];
    const nombresPadres = padresUids.map(uid => userMap.get(uid) || `(UID: ${uid.substring(0, 8)}...)`);
    const fechaCreacion = formatFirestoreDate(nido.creadoEn, true) || 'No registrada';

    const renderBitacora = (b) => {
      const fechaB = formatFirestoreDate(b.fecha || b.creadoEn, true) || 'Sin fecha';
      const nombrePrestador = b.prestadorNombre || userMap.get(b.prestadorId) || 'Prestador';
      const preview = b.observaciones || b.sueno || 'Sin observaciones';
      return `
        <div class="border border-gray-100 rounded-lg p-4 mb-3 bg-white shadow-sm hover:shadow-md transition-shadow">
          <div class="flex justify-between items-start mb-2">
            <div>
              <p class="font-bold text-sm text-[#181411]">Bitácora de Cuidado</p>
              <p class="text-xs text-gray-500">${escapeHTML(fechaB)}</p>
              <p class="text-xs text-[#e87a30] font-semibold mt-0.5">${escapeHTML(nombrePrestador)}</p>
            </div>
            <span class="text-[10px] bg-[#f4eade] text-[#e87a30] px-2 py-1 rounded-full font-bold">🍼</span>
          </div>
          <p class="text-xs text-gray-600 line-clamp-2">${escapeHTML(preview.substring(0, 120))}</p>
          <button type="button" class="btn-ver-bitacora-detalle text-[#e87a30] hover:text-[#d66a20] text-[10px] font-bold mt-2" data-json='${escapeHTML(JSON.stringify(b))}'>Ver detalle completo →</button>
        </div>
      `;
    };

    const renderFicha = (f) => {
      const fechaF = formatFirestoreDate(f.fechaAtencion || f.creadoEn, true) || 'Sin fecha';
      const nombreConsejera = f.consejeraNombre || userMap.get(f.consejeraId) || 'Consejera';
      const preview = f.motivoConsulta || f.motivo || f.planAccion || 'Sin detalles';
      return `
        <div class="border border-gray-100 rounded-lg p-4 mb-3 bg-white shadow-sm hover:shadow-md transition-shadow">
          <div class="flex justify-between items-start mb-2">
            <div>
              <p class="font-bold text-sm text-[#181411]">Ficha de Atención</p>
              <p class="text-xs text-gray-500">${escapeHTML(fechaF)}</p>
              <p class="text-xs text-purple-600 font-semibold mt-0.5">${escapeHTML(nombreConsejera)}</p>
            </div>
            <span class="text-[10px] bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-bold">💜</span>
          </div>
          <p class="text-xs text-gray-600 line-clamp-2">${escapeHTML(preview.substring(0, 120))}</p>
          <button type="button" class="btn-ver-ficha-detalle text-[#e87a30] hover:text-[#d66a20] text-[10px] font-bold mt-2" data-json='${escapeHTML(JSON.stringify(f))}'>Ver detalle completo →</button>
        </div>
      `;
    };

    dashboardContent.innerHTML = `
      <div class="mb-6">
        <button id="btn-volver-nidos" class="text-sm text-[#e87a30] font-bold hover:underline mb-4">← Volver a Nidos / Familias</button>
        <h2 class="text-2xl font-black text-[#181411] mb-2">Detalles del Nido</h2>
        <p class="text-xs font-mono text-gray-500">ID: ${nido.id}</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-1 space-y-6">
          <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 class="font-bold text-lg mb-4 border-b pb-2">Información del Nido</h3>
            <div class="mb-4">
              <p class="text-xs font-bold text-gray-500 mb-2">👶 BEBÉS / HIJOS</p>
              ${hijos.length > 0 ? hijos.map(h => `
                <div class="mb-2 p-2 bg-gray-50 rounded">
                  <p class="font-bold text-sm">${escapeHTML(h.nombre || 'Sin nombre')}</p>
                  ${h.rut ? `<p class="text-xs text-gray-500">RUT: ${escapeHTML(h.rut)}</p>` : ''}
                </div>
              `).join('') : '<p class="text-sm text-gray-400 italic">Sin registros</p>'}
            </div>
            <div class="mb-4">
              <p class="text-xs font-bold text-gray-500 mb-2">👨‍👩‍👧 PADRES / FAMILIA</p>
              ${nombresPadres.map(n => `<p class="text-sm mb-1">${escapeHTML(n)}</p>`).join('') || '<p class="text-sm text-gray-400 italic">Sin padres vinculados</p>'}
            </div>
            <div>
              <p class="text-xs font-bold text-gray-500 mb-1">📅 FECHA DE CREACIÓN</p>
              <p class="text-sm">${escapeHTML(fechaCreacion)}</p>
            </div>
            <div class="mt-4">
              <p class="text-xs font-bold text-gray-500 mb-1">📌 ESTADO</p>
              <span class="text-[10px] font-bold px-2 py-1 rounded-full ${(nido.estado || 'activo') === 'activo' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">
                ${(nido.estado || 'activo').toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        <div class="lg:col-span-2 space-y-6">
          <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 class="font-bold text-lg mb-4 border-b pb-2">📋 Bitácoras de Cuidado (${bitacoras.length})</h3>
            <div class="max-h-[400px] overflow-y-auto pr-2">
              ${bitacoras.length > 0 ? bitacoras.map(renderBitacora).join('') : '<p class="text-sm text-gray-400 italic">No hay bitácoras registradas para este nido.</p>'}
            </div>
          </div>

          <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 class="font-bold text-lg mb-4 border-b pb-2">💜 Fichas de Atención (${fichas.length})</h3>
            <div class="max-h-[400px] overflow-y-auto pr-2">
              ${fichas.length > 0 ? fichas.map(renderFicha).join('') : '<p class="text-sm text-gray-400 italic">No hay fichas de atención registradas para este nido.</p>'}
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById('btn-volver-nidos')?.addEventListener('click', () => renderAdminTab('admin_nidos'));

    dashboardContent.querySelectorAll('.btn-ver-bitacora-detalle').forEach(btn => {
      btn.addEventListener('click', () => {
        const data = JSON.parse(btn.dataset.json);
        const rows = [];
        Object.entries(data).forEach(([key, value]) => {
          if (key === 'id') return;
          const label = FIELD_LABELS[key] || key;
          let display = value;
          if (key === 'fecha' || key === 'fechaHora' || key === 'creadoEn' || key === 'fechaAtencion') {
            display = formatFirestoreDate(value, true) || value;
          } else if (Array.isArray(value)) display = value.join(', ');
          else if (typeof value === 'object' && value !== null) display = JSON.stringify(value);
          rows.push([label, display]);
        });
        showInfoModal({ title: 'Bitácora de Cuidado', subtitle: `Nido: ${hijos[0]?.nombre || 'Sin nombre'}`, icon: '🍼', rows });
      });
    });

    dashboardContent.querySelectorAll('.btn-ver-ficha-detalle').forEach(btn => {
      btn.addEventListener('click', () => {
        const data = JSON.parse(btn.dataset.json);
        const rows = [];
        Object.entries(data).forEach(([key, value]) => {
          if (key === 'id') return;
          const label = FIELD_LABELS[key] || key;
          let display = value;
          if (key === 'fecha' || key === 'fechaHora' || key === 'creadoEn' || key === 'fechaAtencion') {
            display = formatFirestoreDate(value, true) || value;
          } else if (Array.isArray(value)) display = value.join(', ');
          else if (typeof value === 'object' && value !== null) display = JSON.stringify(value);
          rows.push([label, display]);
        });
        showInfoModal({ title: 'Ficha de Atención', subtitle: `Nido: ${hijos[0]?.nombre || 'Sin nombre'}`, icon: '💜', rows });
      });
    });

  } catch (error) {
    console.error('Error al cargar detalle del nido:', error);
    dashboardContent.innerHTML = '<p class="text-center py-8 text-red-500">Error al cargar los detalles del nido.</p>';
  }
}
