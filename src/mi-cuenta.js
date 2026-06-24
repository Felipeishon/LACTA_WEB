import { db, auth } from './firebase.js';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { initFormularios, formatRut, validarRut } from './formularios.js';
import { initCalendario } from './calendario.js';
import { initModales } from './modales.js';
import { emailService } from './emailService.js';
import {
  fetchAdminStats,
  fetchUserAppointments,
  fetchServiceAppointments,
  getPendingUsers,
  approveUser,
  getLatestUsers,
  getCaregiverBlockedDays,
  vincularNidoPorRutBebe,
  obtenerDatosNido,
  addCaregiverBlockedDay,
  removeCaregiverBlockedDay,
  saveConsejeraSchedule,
  saveFichaCuidado,
  fetchFichasCuidadoPorNido,
  fetchFichasCuidadoPorPrestador,
  fetchActiveProducts,
  createProduct,
  deleteProduct,
  createPedido,
  fetchPedidosUsuario,
  fetchTodosPedidos
} from './api/firestore.js';
import { showToast } from './ui/notifications.js';

function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

document.addEventListener('DOMContentLoaded', () => {
  const dashboardContent = document.getElementById('dashboard-content');
  const sidebarNav = document.getElementById('sidebar-nav');

  const userNameEl = document.getElementById('user-name');
  const userRoleLabel = document.getElementById('user-role-label');
  const userInitial = document.getElementById('user-initial');

  // Estado global del carrito y de la navegación
  let cart = JSON.parse(localStorage.getItem('lactanido_cart') || '[]');
  let activeTab = 'resumen'; 
  let currentUserData = null;
  let currentUserRole = 'padre';

  // Inicializar módulos una única vez al cargar el DOM (evita duplicar listeners)
  initFormularios();
  initCalendario();
  initModales();

  // Guardar y renderizar estado del carrito
  function saveCart() {
    localStorage.setItem('lactanido_cart', JSON.stringify(cart));
    updateCartIconIndicator();
  }

  function updateCartIconIndicator() {
    const totalItems = cart.reduce((sum, item) => sum + item.cantidad, 0);
    const cartBadge = document.getElementById('cart-badge');
    if (cartBadge) {
      if (totalItems > 0) {
        cartBadge.textContent = totalItems;
        cartBadge.classList.remove('hidden');
      } else {
        cartBadge.classList.add('hidden');
      }
    }
  }

  // Estructura de Navegación según Rol
  const NAV_CONFIG = {
    padre: [
      { label: "Resumen", icon: "🏠", action: "resumen" },
      { label: "Tienda Bebé 🛍️", action: "tienda", icon: "🧸" },
      { label: "Mis Pedidos 📦", action: "pedidos", icon: "🚚" },
      { label: "Bitácoras Bebé 📋", action: "bitacora", icon: "🍼" },
      { label: "Perfil Nido", action: "modalPerfilBebe", icon: "👶", isModal: true }
    ],
    consejera: [
      { label: "Dashboard", icon: "📊", action: "dashboard" },
      { label: "Mis Citas", icon: "🗓️", action: "citas" },
      { label: "Fichas Guardadas", icon: "🤱", action: "historial_fichas" },
      { label: "Mi Horario", icon: "⏱️", action: "horarios" }
    ],
    cuidadora: [
      { label: "Turnos", icon: "🌙", action: "dashboard" },
      { label: "Fichas Guardadas", icon: "📋", action: "historial_fichas" },
      { label: "Disponibilidad", icon: "🗓️", action: "disponibilidad" }
    ],
    admin: [
      { label: "Visión General", icon: "👁️", action: "dashboard" },
      { label: "Usuarios", icon: "👥", action: "usuarios" },
      { label: "Pedidos / Tienda", icon: "🛍️", action: "admin_tienda" }
    ]
  };

  // Función para cambiar de pestaña activa
  function switchTab(action, role, userData) {
    if (action === 'modalPerfilBebe') {
      openPerfilBebeModal(userData);
      return;
    }
    activeTab = action;
    renderSidebar(role, userData);
    renderContent(role, userData);
  }

  function renderSidebar(role, userData) {
    if (!sidebarNav) return;
    const items = NAV_CONFIG[role] || [];
    
    // Crear botón del carrito flotante para el perfil Padres en la barra superior o sidebar
    let cartBtnHtml = '';
    if (role === 'padre') {
      cartBtnHtml = `
        <button id="btnVerCarrito" class="flex items-center justify-between gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-medium text-[#887263] hover:bg-[#f4eade] hover:text-[#181411] w-full mt-2 relative">
          <span class="flex items-center gap-3">
            <span class="text-xl">🛒</span> Ver Carrito
          </span>
          <span id="cart-badge" class="bg-[#e87a30] text-white text-xs px-2 py-0.5 rounded-full font-bold ${cart.length === 0 ? 'hidden' : ''}">
            ${cart.reduce((sum, item) => sum + item.cantidad, 0)}
          </span>
        </button>
      `;
    }

    sidebarNav.innerHTML = items.map(item => {
      const isActive = activeTab === item.action;
      return `
        <a href="#" data-action="${item.action}" class="nav-item flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-medium ${isActive ? 'bg-[#e87a30] text-white shadow-md shadow-[#e87a30]/30 transform scale-[1.02]' : 'text-[#887263] hover:bg-[#f4eade] hover:text-[#181411]'}">
          <span class="text-xl">${item.icon}</span>
          ${item.label}
        </a>
      `;
    }).join('') + cartBtnHtml;

    sidebarNav.querySelectorAll('.nav-item, #btnVerCarrito').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const action = link.dataset.action || 'carrito';
        if (action === 'carrito') {
          openCartModal();
        } else {
          switchTab(action, role, userData);
        }
      });
    });
  }

  // --- RENDERIZADO DE CONTENIDOS SEGÚN ROL Y PESTAÑA ---
  async function renderContent(role, userData) {
    if (!dashboardContent) return;
    dashboardContent.innerHTML = `
      <div class="flex flex-col items-center justify-center h-64 text-gray-400">
        <div class="w-12 h-12 border-4 border-[#e87a30] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p class="animate-pulse font-medium">Cargando sección...</p>
      </div>`;

    try {
      if (role === 'padre') {
        await renderPadreTab(userData);
      } else if (role === 'consejera') {
        await renderConsejeraTab(userData);
      } else if (role === 'cuidadora') {
        await renderCuidadoraTab(userData);
      } else if (role === 'admin') {
        await renderAdminTab(userData);
      }
    } catch (error) {
      console.error("Error cargando pestaña:", error);
      dashboardContent.innerHTML = `
        <div class="text-center py-10">
          <p class="text-red-500 font-bold mb-2">Error al cargar la información:</p>
          <p class="text-xs text-red-400 bg-red-50 p-4 rounded-lg border border-red-100 max-w-lg mx-auto font-mono text-left whitespace-pre-wrap">${error.message}\n${error.stack}</p>
        </div>`;
    }
  }

  // --- INTERFAZ PADRES ---
  async function renderPadreTab(userData) {
    if (activeTab === 'resumen') {
      dashboardContent.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 slide-up">
          <div class="col-span-1 md:col-span-2 glass-panel p-8 rounded-2xl border-l-4 border-[#e87a30] relative overflow-hidden group">
            <div class="absolute -right-10 -top-10 text-[#e87a30] opacity-10 text-9xl transition-transform group-hover:scale-110">🍼</div>
            <h2 class="text-3xl font-black text-[#181411] mb-2">¡Hola, ${escapeHTML(userData?.nombre?.split(' ')[0] || 'Bienvenido/a')}! 👋</h2>
            <p class="text-[#887263] mb-6">Gestiona el cuidado y bienestar de tu familia desde aquí.</p>
            
            <div class="flex flex-wrap gap-3">
                <button id="btnNuevaCita" class="bg-[#e87a30] text-white font-bold rounded-full py-2 px-6 hover:bg-[#d66a20] transition-colors shadow-md flex items-center gap-2">
                  <span class="text-xl leading-none">+</span> Agendar Nueva Cita
                </button>
                <button id="btnIrTienda" class="bg-white border border-[#e5dfdc] text-[#181411] font-bold rounded-full py-2 px-6 hover:bg-gray-50 transition-colors shadow-sm flex items-center gap-2">
                  🛍️ Tienda de Bebé
                </button>
            </div>
          </div>
          
          <div class="glass-panel p-6 rounded-2xl flex flex-col justify-center items-center text-center">
             <div class="w-16 h-16 bg-[#f4eade] rounded-full flex items-center justify-center text-2xl mb-4 shadow-inner">
               👶
             </div>
             <h3 class="font-bold text-lg">Mi Nido (Bebé)</h3>
             ${userData.nidoId ? `
               <p class="text-sm text-green-600 font-bold mb-1">¡Nido vinculado!</p>
               <p class="text-xs text-gray-500 mb-4">Compartiendo el cuidado en familia</p>
               <button id="btnVerPerfilBebe" class="w-full bg-[#f4f2f0] hover:bg-[#e5dfdc] text-[#181411] py-2 rounded-lg text-sm font-semibold transition-colors">Ver Perfil del Bebé</button>
             ` : `
               <p class="text-xs text-red-500 mb-2 font-bold">No has registrado a tu bebé</p>
               <p class="text-[10px] text-gray-500 mb-2 leading-tight">Si tu pareja ya registró al bebé, usa el mismo RUT para vincularte a su Nido automáticamente.</p>
               <form id="formVincularNido" class="flex flex-col gap-2 w-full mt-2">
                 <input type="text" name="nombreBebe" placeholder="Nombre del bebé" required class="p-2 border border-gray-200 rounded text-sm w-full" />
                 <input type="text" name="rutBebe" placeholder="RUT del bebé" maxlength="12" required class="input-rut p-2 border border-gray-200 rounded text-sm w-full" />
                 <button type="submit" class="w-full bg-[#e87a30] text-white py-2 rounded-lg text-sm font-semibold transition-colors hover:bg-[#d66a20]">Vincular Nido</button>
               </form>
             `}
          </div>
        </div>

        <h3 class="font-bold text-xl mt-8 mb-4">Tus Citas Recientes</h3>
        <div class="bg-white rounded-xl shadow-sm border border-[#e5dfdc] overflow-hidden">
          <table class="w-full text-left text-sm" id="parent-appointments-table">
            <thead class="bg-[#fbf9f8] border-b border-[#e5dfdc] text-[#887263]">
              <tr>
                <th class="p-4 font-medium">Servicio</th>
                <th class="p-4 font-medium">Profesional</th>
                <th class="p-4 font-medium">Fecha</th>
                <th class="p-4 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#e5dfdc]">
              <!-- Dinámico -->
            </tbody>
          </table>
        </div>
      `;

      // Eventos Resumen
      const btnNuevaCita = document.getElementById('btnNuevaCita');
      if (btnNuevaCita) {
        btnNuevaCita.onclick = () => document.getElementById('modalAgendarCita')?.showModal();
      }
      const btnIrTienda = document.getElementById('btnIrTienda');
      if (btnIrTienda) {
        btnIrTienda.onclick = () => switchTab('tienda', 'padre', userData);
      }
      const btnVerPerfil = document.getElementById('btnVerPerfilBebe');
      if (btnVerPerfil) {
        btnVerPerfil.onclick = () => openPerfilBebeModal(userData);
      }

      // Enlazar form de vinculación de nido
      const formVincular = document.getElementById('formVincularNido');
      if (formVincular) {
        const inputRutBebe = formVincular.querySelector('input[name="rutBebe"]');
        if (inputRutBebe) {
          inputRutBebe.addEventListener('input', (e) => {
            e.target.value = formatRut(e.target.value);
          });
        }
        formVincular.addEventListener('submit', async (e) => {
          e.preventDefault();
          const btn = formVincular.querySelector('button');
          btn.disabled = true;
          btn.textContent = 'Vinculando...';
          
          if (!validarRut(formVincular.rutBebe.value)) {
            showToast('El RUT ingresado no es válido.', 'warning');
            btn.disabled = false;
            btn.textContent = 'Vincular Nido';
            return;
          }

          try {
            await vincularNidoPorRutBebe(userData.uid, formVincular.rutBebe.value, formVincular.nombreBebe.value);
            showToast('¡Nido vinculado correctamente!', 'success');
            setTimeout(() => location.reload(), 1500);
          } catch (error) {
            showToast('Error al vincular el nido', 'error');
            btn.disabled = false;
            btn.textContent = 'Vincular Nido';
          }
        });
      }

      // Cargar citas reales
      const tableBody = document.querySelector('#parent-appointments-table tbody');
      if (tableBody) {
        tableBody.innerHTML = '<tr><td colspan="4" class="p-4 text-center text-gray-400 italic">Cargando citas...</td></tr>';
        const appointments = await fetchUserAppointments(userData.uid);
        if (appointments.length === 0) {
          tableBody.innerHTML = '<tr><td colspan="4" class="p-4 text-center text-gray-400 italic">No tienes citas agendadas aún.</td></tr>';
        } else {
          tableBody.innerHTML = appointments.map(app => `
            <tr>
              <td class="p-4 font-medium">${escapeHTML(app.servicio)}</td>
              <td class="p-4 text-gray-600">${escapeHTML(app.profesionalNombre || 'Por asignar')}</td>
              <td class="p-4">${escapeHTML(app.fecha)} ${escapeHTML(app.hora)}</td>
              <td class="p-4">
                <span class="px-2 py-1 rounded-full text-xs font-bold ${
                  app.estado === 'completada' ? 'bg-green-100 text-green-700' :
                  app.estado === 'activo' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
                }">${escapeHTML(app.estado)}</span>
              </td>
            </tr>
          `).join('');
        }
      }

    } else if (activeTab === 'tienda') {
      // Vista Tienda
      dashboardContent.innerHTML = `
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-black text-[#181411]">🛍️ Tienda de Bebés</h2>
          <div class="flex gap-2">
            <button class="btn-categoria bg-[#e87a30] text-white px-3 py-1.5 rounded-full text-xs font-bold" data-cat="Todos">Todos</button>
            <button class="btn-categoria bg-white border border-[#e5dfdc] text-gray-700 px-3 py-1.5 rounded-full text-xs font-bold" data-cat="Lactancia">Lactancia</button>
            <button class="btn-categoria bg-white border border-[#e5dfdc] text-gray-700 px-3 py-1.5 rounded-full text-xs font-bold" data-cat="Higiene">Higiene</button>
          </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6" id="tienda-productos-grid">
          <p class="col-span-full text-center text-gray-400 py-10 italic">Cargando productos...</p>
        </div>
      `;

      renderTiendaProductos('Todos');

      // Filtrado por categoría
      dashboardContent.querySelectorAll('.btn-categoria').forEach(btn => {
        btn.addEventListener('click', (e) => {
          dashboardContent.querySelectorAll('.btn-categoria').forEach(b => {
            b.className = "btn-categoria bg-white border border-[#e5dfdc] text-gray-700 px-3 py-1.5 rounded-full text-xs font-bold";
          });
          e.target.className = "btn-categoria bg-[#e87a30] text-white px-3 py-1.5 rounded-full text-xs font-bold";
          renderTiendaProductos(e.target.dataset.cat);
        });
      });

    } else if (activeTab === 'pedidos') {
      // Historial de compras
      dashboardContent.innerHTML = `
        <h2 class="text-2xl font-black text-[#181411] mb-6">📦 Historial de Pedidos</h2>
        <div class="bg-white rounded-xl shadow-sm border border-[#e5dfdc] overflow-hidden" id="pedidos-container">
          <p class="text-center py-10 text-gray-400 italic">Cargando historial...</p>
        </div>
      `;
      renderMisPedidos(userData.uid);

    } else if (activeTab === 'bitacora') {
      // Línea de tiempo de bitácoras del bebé
      dashboardContent.innerHTML = `
        <h2 class="text-2xl font-black text-[#181411] mb-2">🍼 Bitácora de Cuidado del Bebé</h2>
        <p class="text-sm text-gray-500 mb-6">Información ingresada por los prestadores durante las citas de tu nido.</p>
        <div class="space-y-6" id="bitacora-timeline">
          <p class="text-center py-10 text-gray-400 italic">Cargando bitácoras...</p>
        </div>
      `;
      renderBitacoraTimeline(userData.nidoId);
    }
  }

  // Cargar productos de la tienda de forma dinámica
  async function renderTiendaProductos(categoria) {
    const grid = document.getElementById('tienda-productos-grid');
    if (!grid) return;
    try {
      const products = await fetchActiveProducts();
      const filtered = categoria === 'Todos' ? products : products.filter(p => p.categoria === categoria);
      
      if (filtered.length === 0) {
        grid.innerHTML = '<p class="col-span-full text-center text-gray-400 py-10 italic">No hay productos disponibles en esta categoría.</p>';
        return;
      }

      grid.innerHTML = filtered.map(p => `
        <div class="bg-white rounded-xl shadow-sm border border-[#e5dfdc] p-5 flex flex-col items-center hover:shadow-md transition-all">
          <img src="${escapeHTML(p.imagenUrl || 'https://images.unsplash.com/photo-1519864600265-abb23847ef2c?auto=format&fit=crop&w=300&q=80')}" alt="${escapeHTML(p.nombre)}" class="w-full h-32 object-cover rounded-lg mb-4" />
          <h4 class="font-bold text-[#181411] text-center mb-1 line-clamp-2 h-10">${escapeHTML(p.nombre)}</h4>
          <p class="text-[#e87a30] font-black text-xl mb-1">$${p.precio.toLocaleString('cl-CL')}</p>
          <p class="text-xs text-gray-400 mb-4">Stock disponible: ${p.stock}</p>
          <button data-id="${escapeHTML(p.id)}" data-nombre="${escapeHTML(p.nombre)}" data-precio="${p.precio}" data-stock="${p.stock}" class="btn-agregar-carrito w-full bg-[#181411] text-white py-2 rounded-lg text-sm font-bold hover:bg-[#e87a30] transition-colors flex items-center justify-center gap-2">
            Agregar 🛒
          </button>
        </div>
      `).join('');

      // Listener para añadir al carrito
      grid.querySelectorAll('.btn-agregar-carrito').forEach(btn => {
        btn.onclick = () => {
          const { id, nombre, precio, stock } = btn.dataset;
          const maxStock = parseInt(stock);
          const existing = cart.find(item => item.productoId === id);
          
          if (existing) {
            if (existing.cantidad >= maxStock) {
              showToast('No puedes agregar más del stock disponible', 'warning');
              return;
            }
            existing.cantidad++;
          } else {
            if (maxStock <= 0) {
              showToast('Producto sin stock disponible', 'warning');
              return;
            }
            cart.push({ productoId: id, nombre, precio: parseFloat(precio), cantidad: 1 });
          }
          saveCart();
          showToast(`¡${nombre} añadido al carrito!`, 'success');
        };
      });

    } catch (e) {
      grid.innerHTML = '<p class="col-span-full text-center text-red-500 py-10 italic">Error al cargar productos.</p>';
    }
  }

  // Renders de bitácoras del bebé (línea de tiempo)
  async function renderBitacoraTimeline(nidoId) {
    const timeline = document.getElementById('bitacora-timeline');
    if (!timeline) return;
    if (!nidoId) {
      timeline.innerHTML = '<p class="text-center py-10 text-red-500 italic font-semibold">Debes vincular tu Nido familiar para ver las bitácoras del bebé.</p>';
      return;
    }

    try {
      const bitacoras = await fetchFichasCuidadoPorNido(nidoId);
      if (bitacoras.length === 0) {
        timeline.innerHTML = '<p class="text-center py-10 text-gray-400 italic">No hay registros de cuidado cargados todavía.</p>';
        return;
      }

      timeline.innerHTML = bitacoras.map(b => `
        <div class="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative pl-8 border-l-4 border-[#e87a30]">
          <div class="flex justify-between items-start mb-3 flex-wrap gap-2">
            <div>
              <span class="text-xs text-gray-400 font-bold block">${new Date(b.creadoEn).toLocaleDateString()} ${new Date(b.creadoEn).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              <h4 class="font-bold text-lg text-[#181411]">Reporte de ${escapeHTML(b.prestadorNombre || 'Colaboradora')}</h4>
              <p class="text-xs text-[#887263]">Duración del Turno: ${b.horasEfectivas || 0} hrs</p>
            </div>
            <span class="text-xs font-bold bg-[#f4eade] text-[#e87a30] px-2.5 py-1 rounded-full uppercase tracking-wider">${escapeHTML(b.prestadorRol)}</span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-xl mb-4 border border-gray-100">
            <div class="text-sm"><strong>🍼 Alimentación:</strong> ${escapeHTML(b.tipoAlimentacion || 'Ninguna')} ${b.cantidadOz ? `(${b.cantidadOz} Oz)` : ''}</div>
            <div class="text-sm"><strong>😴 Sueño:</strong> ${b.horasSueno || 0} hrs</div>
            <div class="text-sm"><strong>🧷 Pañales:</strong> ${b.cantidadPanales || 0} cambiados</div>
          </div>

          <div class="space-y-2 text-sm text-[#181411]">
            <p><strong>Observaciones:</strong> <span class="text-gray-600">${escapeHTML(b.observaciones || 'Sin observaciones.')}</span></p>
            <p><strong>Recomendaciones:</strong> <span class="text-gray-600">${escapeHTML(b.recomendaciones || 'Sin recomendaciones especiales.')}</span></p>
            ${b.seguimiento ? `<p><strong>Seguimiento:</strong> <span class="text-[#e87a30] font-medium">${escapeHTML(b.seguimiento)}</span></p>` : ''}
          </div>
        </div>
      `).join('');

    } catch (e) {
      timeline.innerHTML = '<p class="text-center py-10 text-red-500 italic">Error al cargar bitácoras.</p>';
    }
  }

  // Renders de historial de compras para Padres
  async function renderMisPedidos(uid) {
    const container = document.getElementById('pedidos-container');
    if (!container) return;
    try {
      const pedidos = await fetchPedidosUsuario(uid);
      if (pedidos.length === 0) {
        container.innerHTML = '<p class="text-center py-10 text-gray-400 italic">No tienes compras registradas en tu cuenta.</p>';
        return;
      }

      container.innerHTML = `
        <table class="w-full text-left text-sm">
          <thead class="bg-[#fbf9f8] border-b border-[#e5dfdc] text-[#887263]">
            <tr>
              <th class="p-4 font-medium">Pedido ID</th>
              <th class="p-4 font-medium">Productos</th>
              <th class="p-4 font-medium">Total</th>
              <th class="p-4 font-medium">Fecha</th>
              <th class="p-4 font-medium">Despacho</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#e5dfdc]">
            ${pedidos.map(p => `
              <tr>
                <td class="p-4 font-mono text-xs">${escapeHTML(p.id.slice(0, 8))}...</td>
                <td class="p-4 text-gray-700">
                  ${p.productos.map(item => `${escapeHTML(item.nombre)} x${item.cantidad}`).join(', ')}
                </td>
                <td class="p-4 font-bold text-[#e87a30]">$${p.total.toLocaleString('cl-CL')}</td>
                <td class="p-4 text-gray-500 text-xs">${new Date(p.creadoEn).toLocaleDateString()}</td>
                <td class="p-4">
                  <span class="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">Recibido</span>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;

    } catch (e) {
      container.innerHTML = '<p class="text-center py-10 text-red-500 italic">Error al cargar pedidos.</p>';
    }
  }

  // --- INTERFAZ PRESTADORES (CONSEJERA) ---
  async function renderConsejeraTab(userData) {
    if (activeTab === 'dashboard' || activeTab === 'citas') {
      const appointments = await fetchServiceAppointments('Consultor', userData.uid);
      dashboardContent.innerHTML = `
        <div class="flex items-center justify-between mb-6">
          <div>
            <h2 class="text-2xl font-black text-[#181411]">Buen día, ${userData.nombre} 👩‍⚕️</h2>
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
      renderPrestadorFichas(userData.uid);

    } else if (activeTab === 'horarios') {
      // Renderizar cuadrícula original de horarios
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
            <table class="w-full min-w-[600px] text-center text-sm border-collapse">
              <thead>
                <tr class="text-[#887263]">
                  <th class="p-2 border-b border-[#e5dfdc]">Hora</th>
                  <th class="p-2 border-b border-[#e5dfdc]">Lunes</th>
                  <th class="p-2 border-b border-[#e5dfdc]">Martes</th>
                  <th class="p-2 border-b border-[#e5dfdc]">Miércoles</th>
                  <th class="p-2 border-b border-[#e5dfdc]">Jueves</th>
                  <th class="p-2 border-b border-[#e5dfdc]">Viernes</th>
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
                </tr>
                <tr>
                  <td class="p-2 font-medium text-[#181411]">14:00 - 18:00</td>
                  <td class="p-2">${getBtn('Lunes', '14:00-18:00')}</td>
                  <td class="p-2">${getBtn('Martes', '14:00-18:00')}</td>
                  <td class="p-2">${getBtn('Miercoles', '14:00-18:00')}</td>
                  <td class="p-2">${getBtn('Jueves', '14:00-18:00')}</td>
                  <td class="p-2">${getBtn('Viernes', '14:00-18:00')}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="mt-4 flex justify-end">
             <button id="btnGuardarHorarios" class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-full text-sm transition-colors shadow-md">Guardar Horarios</button>
          </div>
        </div>
      `;

      // Registrar lógica de guardar horarios
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
          await saveConsejeraSchedule(userData.uid, nuevoHorario);
          showToast('Horarios base actualizados', 'success');
        } catch (e) {
          showToast('Error al actualizar horarios', 'error');
        } finally {
          btnGuardar.textContent = 'Guardar Horarios';
          btnGuardar.disabled = false;
        }
      };
    }
  }

  // --- INTERFAZ PRESTADORES (CUIDADORA) ---
  async function renderCuidadoraTab(userData) {
    if (activeTab === 'dashboard') {
      const appointments = await fetchServiceAppointments('Cuidador', userData.uid);
      dashboardContent.innerHTML = `
        <div class="glass-panel p-8 rounded-2xl border-t-4 border-[#887263] mb-8">
          <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 class="text-2xl font-black text-[#181411]">Hola ${userData.nombre} 🍼</h2>
              <p class="text-[#887263]">Gestiona tus turnos asignados de cuidado infantil.</p>
            </div>
          </div>
        </div>

        <h3 class="font-bold text-lg mb-4">Turnos de Cuidado Asignados</h3>
        <div class="space-y-4" id="cuidadora-turnos-list">
          ${appointments.length > 0 ? appointments.map(app => `
            <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between flex-wrap gap-4">
              <div>
                <h4 class="font-bold text-lg">${escapeHTML(app.nombre)}</h4>
                <p class="text-xs text-gray-500">Fecha: ${escapeHTML(app.fecha)} • Hora: ${escapeHTML(app.hora)} • Duración: ${app.duracion} hrs</p>
                <p class="text-sm text-gray-600 mt-1">${escapeHTML(app.email)}</p>
              </div>
              <div>
                ${app.estado === 'completada' ? `
                  <span class="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-full font-bold">Bitácora Guardada ✅</span>
                ` : `
                  <button data-id="${escapeHTML(app.id)}" data-nid="${escapeHTML(app.nidoId || '')}" class="btn-abrir-ficha bg-[#e87a30] hover:bg-[#d66a20] text-white font-bold py-2 px-4 rounded-lg text-xs transition">
                    Completar Bitácora 📝
                  </button>
                `}
              </div>
            </div>
          `).join('') : `
            <p class="text-center py-10 text-gray-400 italic">No tienes turnos programados en el sistema.</p>
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
        <h2 class="text-2xl font-black text-[#181411] mb-6">📋 Historial de Bitácoras Entregadas</h2>
        <div class="space-y-4" id="prestador-fichas-list">
          <p class="text-center py-10 text-gray-400 italic">Cargando fichas...</p>
        </div>
      `;
      renderPrestadorFichas(userData.uid);

    } else if (activeTab === 'disponibilidad') {
      // Gestión de bloqueos
      dashboardContent.innerHTML = `
        <h3 class="font-bold text-xl mb-2">Bloqueo de Días por Vacaciones / Descanso</h3>
        <p class="text-sm text-gray-500 mb-6">Ingresa las fechas específicas que deseas bloquear en el calendario.</p>
        
        <div class="bg-white border border-[#e5dfdc] rounded-xl p-4 mb-4 flex flex-col md:flex-row gap-4 items-end">
          <div class="flex-1 w-full">
            <label class="block text-xs font-bold text-[#181411] mb-1">Fecha a bloquear</label>
            <input type="date" id="bloqueo-date" class="w-full p-2 border border-[#e5dfdc] rounded-lg text-sm" />
          </div>
          <div class="flex-1 w-full">
            <label class="block text-xs font-bold text-[#181411] mb-1">Motivo (Opcional)</label>
            <input type="text" id="bloqueo-motivo" placeholder="Ej. Cumpleaños, Descanso..." class="w-full p-2 border border-[#e5dfdc] rounded-lg text-sm" />
          </div>
          <button id="btnAñadirBloqueo" class="bg-[#e87a30] hover:bg-[#d66a20] text-white font-bold py-2 px-6 rounded-lg text-sm transition-colors w-full md:w-auto h-[38px]">Añadir Bloqueo</button>
        </div>

        <h4 class="font-bold text-sm text-[#181411] mb-2">Bloqueos de Fechas Activos:</h4>
        <ul class="space-y-2" id="caregiver-blocked-days-list"></ul>
      `;

      loadCaregiverBlockedDays(userData.uid);

      const btnBloqueo = document.getElementById('btnAñadirBloqueo');
      btnBloqueo.onclick = async () => {
        const dInput = document.getElementById('bloqueo-date');
        const mInput = document.getElementById('bloqueo-motivo');
        if (!dInput.value) {
          showToast('Selecciona una fecha', 'warning');
          return;
        }
        btnBloqueo.disabled = true;
        try {
          await addCaregiverBlockedDay(userData.uid, dInput.value, mInput.value);
          showToast('Fecha bloqueada con éxito', 'success');
          dInput.value = '';
          mInput.value = '';
          loadCaregiverBlockedDays(userData.uid);
        } catch (e) {
          showToast('Error al bloquear fecha', 'error');
        } finally {
          btnBloqueo.disabled = false;
        }
      };
    }
  }

  // Renderizar fichas emitidas por prestador
  async function renderPrestadorFichas(uid) {
    const list = document.getElementById('prestador-fichas-list');
    if (!list) return;
    try {
      const bitacoras = await fetchFichasCuidadoPorPrestador(uid);
      if (bitacoras.length === 0) {
        list.innerHTML = '<p class="text-center py-10 text-gray-400 italic">No tienes fichas registradas aún.</p>';
        return;
      }
      list.innerHTML = bitacoras.map(b => `
        <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div class="flex justify-between font-bold text-sm text-[#e87a30] mb-2">
            <span>Fecha: ${escapeHTML(b.fecha)} (${b.horasEfectivas} hrs)</span>
            <span class="text-xs text-gray-400 font-normal">${new Date(b.creadoEn).toLocaleDateString()}</span>
          </div>
          <p class="text-sm"><strong>Actividades:</strong> Alimentación: ${escapeHTML(b.tipoAlimentacion || 'N/A')} • Horas Sueño: ${b.horasSueno || 0}h • Pañales: ${b.cantidadPanales || 0}</p>
          <p class="text-xs text-gray-500 mt-2"><strong>Observaciones:</strong> ${escapeHTML(b.observaciones || 'Ninguna')}</p>
        </div>
      `).join('');
    } catch (e) {
      list.innerHTML = '<p class="text-center py-10 text-red-500 italic">Error al cargar historial.</p>';
    }
  }

  // --- INTERFAZ ADMINISTRADOR ---
  async function renderAdminTab(userData) {
    if (activeTab === 'dashboard' || activeTab === 'usuarios') {
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
      
      // Cargar contador de pedidos en el admin
      try {
        const ped = await fetchTodosPedidos();
        const cnt = document.getElementById('admin-orders-count');
        if (cnt) cnt.textContent = ped.length;
      } catch(e) {}

    } else if (activeTab === 'admin_tienda') {
      dashboardContent.innerHTML = `
        <h2 class="text-2xl font-black text-[#181411] mb-6">Gestión de Tienda & Inventario</h2>
        
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <!-- Formulario Agregar -->
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
                  <label class="block text-xs font-bold text-gray-700 mb-1">Imagen (URL)</label>
                  <input type="url" name="imagenUrl" placeholder="https://..." class="w-full p-2 border border-gray-300 rounded text-sm focus:border-[#e87a30] outline-none" />
                </div>
              </div>
              <button type="submit" class="w-full bg-[#181411] hover:bg-[#e87a30] text-white font-bold py-2.5 rounded-lg text-sm transition">
                Guardar Producto en Tienda
              </button>
            </form>
          </div>

          <!-- Listado de Productos -->
          <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col">
            <h4 class="font-bold text-lg text-[#181411] mb-4">Productos en Inventario</h4>
            <div class="flex-1 overflow-y-auto space-y-3 max-h-[500px]" id="admin-inventory-list">
              <p class="text-gray-400 italic text-sm">Cargando catálogo...</p>
            </div>
          </div>
        </div>

        <h3 class="font-bold text-lg mt-8 mb-4">Todos los Pedidos Clientes</h3>
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden" id="admin-orders-list">
          <p class="text-center py-6 text-gray-400 italic">Cargando historial de pedidos...</p>
        </div>
      `;

      renderAdminInventory();
      renderAdminAllOrders();

      // Submit Formulario
      const addForm = document.getElementById('adminAddProductForm');
      addForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = new FormData(addForm);
        const data = {
          nombre: fd.get('nombre'),
          precio: parseFloat(fd.get('precio')),
          stock: parseInt(fd.get('stock')),
          categoria: fd.get('categoria'),
          imagenUrl: fd.get('imagenUrl') || 'https://images.unsplash.com/photo-1519864600265-abb23847ef2c?auto=format&fit=crop&w=300&q=80'
        };

        try {
          await createProduct(data);
          showToast('Producto creado con éxito', 'success');
          addForm.reset();
          renderAdminInventory();
        } catch (err) {
          showToast('Error al crear producto', 'error');
        }
      });
    }
  }

  async function renderAdminInventory() {
    const list = document.getElementById('admin-inventory-list');
    if (!list) return;
    try {
      const products = await fetchActiveProducts();
      if (products.length === 0) {
        list.innerHTML = '<p class="text-gray-400 italic text-sm">No hay productos cargados.</p>';
        return;
      }

      list.innerHTML = products.map(p => `
        <div class="flex items-center justify-between border-b border-gray-100 pb-3">
          <div class="flex items-center gap-3">
            <img src="${p.imagenUrl}" alt="" class="w-10 h-10 object-cover rounded" />
            <div>
              <p class="font-bold text-sm text-[#181411]">${p.nombre}</p>
              <p class="text-xs text-gray-500">$${p.precio.toLocaleString('cl-CL')} • Stock: ${p.stock} • Cat: ${p.categoria}</p>
            </div>
          </div>
          <button data-id="${p.id}" class="btn-delete-product text-red-500 hover:text-red-700 text-xs font-bold transition">Quitar</button>
        </div>
      `).join('');

      list.querySelectorAll('.btn-delete-product').forEach(btn => {
        btn.onclick = async () => {
          if (confirm('¿Estás seguro de eliminar este producto?')) {
            try {
              await deleteProduct(btn.dataset.id);
              showToast('Producto eliminado', 'success');
              renderAdminInventory();
            } catch (e) {
              showToast('Error al eliminar producto', 'error');
            }
          }
        };
      });

    } catch (e) {
      list.innerHTML = '<p class="text-red-500 italic text-sm">Error cargando inventario.</p>';
    }
  }

  async function renderAdminAllOrders() {
    const div = document.getElementById('admin-orders-list');
    if (!div) return;
    try {
      const orders = await fetchTodosPedidos();
      if (orders.length === 0) {
        div.innerHTML = '<p class="text-center py-6 text-gray-400 italic">No hay registros de compras.</p>';
        return;
      }

      div.innerHTML = `
        <table class="w-full text-left text-sm">
          <thead class="bg-gray-50 text-gray-600 border-b border-gray-200">
            <tr>
              <th class="p-3">ID Pedido</th>
              <th class="p-3">Usuario UID</th>
              <th class="p-3">Dirección</th>
              <th class="p-3">Productos</th>
              <th class="p-3">Total</th>
              <th class="p-3">Fecha</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            ${orders.map(o => `
              <tr>
                <td class="p-3 font-mono text-xs">${o.id}</td>
                <td class="p-3 text-xs text-gray-600">${o.compradorUid}</td>
                <td class="p-3 text-xs">${o.direccion || 'No ingresada'}</td>
                <td class="p-3 text-xs">${o.productos.map(p => `${p.nombre} x${p.cantidad}`).join(', ')}</td>
                <td class="p-3 font-bold text-[#e87a30]">$${o.total.toLocaleString('cl-CL')}</td>
                <td class="p-3 text-xs text-gray-400">${new Date(o.creadoEn).toLocaleDateString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } catch(e) {
      div.innerHTML = '<p class="text-center py-6 text-red-500 italic">Error cargando pedidos.</p>';
    }
  }

  // --- LOGICA DE MODALES DE SOPORTE ---
  function openPerfilBebeModal(userData) {
    const modal = document.getElementById('modalPerfilBebe');
    if (!modal) return;
    modal.showModal();
  }

  // --- LOGICA DEL CARRITO ---
  function openCartModal() {
    const modal = document.getElementById('modalCarrito');
    if (!modal) return;
    renderCartItems();
    modal.showModal();
  }

  function renderCartItems() {
    const container = document.getElementById('carrito-items');
    const totalEl = document.getElementById('carrito-total');
    if (!container) return;

    if (cart.length === 0) {
      container.innerHTML = '<p class="text-gray-400 text-center py-8 text-sm italic">Tu carrito está vacío.</p>';
      if (totalEl) totalEl.textContent = '$0';
      return;
    }

    let total = 0;
    container.innerHTML = cart.map((item, idx) => {
      const sub = item.precio * item.cantidad;
      total += sub;
      return `
        <div class="flex items-center justify-between border-b border-gray-100 pb-2">
          <div>
            <p class="font-bold text-sm text-gray-800">${item.nombre}</p>
            <p class="text-xs text-gray-400">$${item.precio.toLocaleString('cl-CL')} x ${item.cantidad}</p>
          </div>
          <div class="flex items-center gap-2">
            <button class="btn-cart-qty bg-gray-100 hover:bg-gray-200 px-2 py-0.5 rounded text-xs" data-idx="${idx}" data-action="dec">-</button>
            <span class="text-sm font-bold">${item.cantidad}</span>
            <button class="btn-cart-qty bg-gray-100 hover:bg-gray-200 px-2 py-0.5 rounded text-xs" data-idx="${idx}" data-action="inc">+</button>
            <button class="btn-cart-del text-red-500 hover:text-red-700 text-xs ml-2 font-bold" data-idx="${idx}">Quitar</button>
          </div>
        </div>
      `;
    }).join('');

    if (totalEl) totalEl.textContent = `$${total.toLocaleString('cl-CL')}`;

    // Eventos cantidad
    container.querySelectorAll('.btn-cart-qty').forEach(btn => {
      btn.onclick = () => {
        const idx = parseInt(btn.dataset.idx);
        const action = btn.dataset.action;
        if (action === 'inc') {
          cart[idx].cantidad++;
        } else if (action === 'dec') {
          cart[idx].cantidad--;
          if (cart[idx].cantidad <= 0) {
            cart.splice(idx, 1);
          }
        }
        saveCart();
        renderCartItems();
      };
    });

    container.querySelectorAll('.btn-cart-del').forEach(btn => {
      btn.onclick = () => {
        const idx = parseInt(btn.dataset.idx);
        cart.splice(idx, 1);
        saveCart();
        renderCartItems();
      };
    });
  }

  // Confirmar Pedido (Checkout Form)
  const checkoutForm = document.getElementById('checkoutForm');
  checkoutForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (cart.length === 0) {
      showToast('El carrito está vacío', 'warning');
      return;
    }
    const btn = document.getElementById('btnConfirmarPedido');
    btn.disabled = true;
    btn.textContent = 'Procesando Pedido...';

    const orderData = {
      compradorUid: auth.currentUser.uid,
      nidoId: currentUserData?.nidoId || null,
      productos: cart,
      total: cart.reduce((sum, item) => sum + (item.precio * item.cantidad), 0),
      direccion: document.getElementById('cart-direccion').value,
      telefono: document.getElementById('cart-telefono').value,
      estado: 'pagado'
    };

    try {
      await createPedido(orderData);
      showToast('¡Pedido realizado con éxito!', 'success');
      cart = [];
      saveCart();
      checkoutForm.reset();
      document.getElementById('modalCarrito')?.close();
      renderContent('padre', currentUserData);
    } catch (err) {
      showToast('Error al procesar el pedido. Revisa el stock.', 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Confirmar Pedido y Pagar 💳';
    }
  });

  // --- LOGICA DE BITACORA DE CUIDADO MODAL (PRESTADOR) ---
  function openFichaCuidadoModal(reservaId, nidoId) {
    const modal = document.getElementById('modalFichaCuidado');
    if (!modal) return;
    
    // Setear valores ocultos
    document.getElementById('ficha-reservaId').value = reservaId;
    document.getElementById('ficha-nidoId').value = nidoId;
    
    // Pre-llenar fecha de hoy
    const inputFecha = modal.querySelector('input[name="fecha"]');
    if (inputFecha) inputFecha.value = new Date().toISOString().split('T')[0];

    modal.showModal();
  }

  const fichaCuidadoForm = document.getElementById('fichaCuidadoForm');
  fichaCuidadoForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = fichaCuidadoForm.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Guardando Ficha...';

    const fd = new FormData(fichaCuidadoForm);
    const data = {
      reservaId: fd.get('reservaId'),
      nidoId: fd.get('nidoId'),
      fecha: fd.get('fecha'),
      horasEfectivas: parseInt(fd.get('horasEfectivas')),
      tipoAlimentacion: fd.get('tipoAlimentacion'),
      cantidadOz: parseInt(fd.get('cantidadOz')) || 0,
      horasSueno: parseFloat(fd.get('horasSueno')) || 0,
      cantidadPanales: parseInt(fd.get('cantidadPanales')) || 0,
      observaciones: fd.get('observaciones'),
      recomendaciones: fd.get('recomendaciones'),
      seguimiento: fd.get('seguimiento'),
      prestadorId: auth.currentUser.uid,
      prestadorNombre: currentUserData?.nombre || 'Prestador',
      prestadorRol: currentUserRole
    };

    if (!data.nidoId) {
      showToast('Error: Esta cita no tiene un Nido asociado. Pide a los padres registrar su nido.', 'error');
      btn.disabled = false;
      btn.textContent = 'Guardar y Enviar Bitácora';
      return;
    }

    try {
      await saveFichaCuidado(data);
      showToast('Ficha de cuidado guardada y compartida', 'success');
      fichaCuidadoForm.reset();
      document.getElementById('modalFichaCuidado')?.close();
      renderContent(currentUserRole, currentUserData);
    } catch(err) {
      showToast('Error al guardar la bitácora', 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Guardar y Enviar Bitácora';
    }
  });


  // --- ADMINISTRADOR (APROBACIONES PENDIENTES) ---
  async function loadPendingUsers() {
    const container = document.getElementById('pending-users-list');
    if (!container) return;
    try {
      const users = await getPendingUsers();
      if (users.length === 0) {
        container.innerHTML = '<p class="text-sm text-gray-500 italic">No hay solicitudes nuevas.</p>';
        return;
      }
      container.innerHTML = '';
      users.forEach(u => {
        const div = document.createElement('div');
        div.className = 'flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200';
        div.innerHTML = `
            <div>
              <p class="font-bold text-sm">${escapeHTML(u.nombre)} <span class="text-[10px] bg-blue-100 text-blue-700 px-1 rounded">${escapeHTML(Array.isArray(u.rol) ? u.rol.join(', ') : u.rol)}</span></p>
              <p class="text-[10px] text-gray-500">${escapeHTML(u.email)} • RUT: ${escapeHTML(u.rut || 'No registrado')}</p>
            </div>
            <button data-uid="${escapeHTML(u.id)}" data-nombre="${escapeHTML(u.nombre)}" data-email="${escapeHTML(u.email)}" class="btn-approve bg-green-500 text-white text-[10px] font-bold py-1 px-2 rounded hover:bg-green-600 transition-colors">Aprobar</button>
          `;
        container.appendChild(div);
      });
      container.querySelectorAll('.btn-approve').forEach(b => b.addEventListener('click', async (e) => {
        const { uid, nombre, email } = e.target.dataset;
        e.target.disabled = true;
        try {
          await approveUser(uid);
          showToast('Usuario aprobado con éxito', 'success');
          emailService.sendApprovalNotification(nombre, email);
          loadPendingUsers();
        } catch (error) {
          showToast('Error al aprobar usuario', 'error');
          e.target.disabled = false;
        }
      }));
    } catch (e) {
      container.innerHTML = '<p class="text-xs text-red-500">Error al cargar.</p>';
    }
  }

  async function loadLatestUsers() {
    const container = document.getElementById('admin-latest-users');
    if (!container) return;
    try {
      const users = await getLatestUsers();
      if (users.length === 0) {
        container.innerHTML = '<p class="text-sm text-gray-400">No hay usuarios registrados.</p>';
        return;
      }
      container.innerHTML = users.map(u => {
        const esPrestador = u.rol !== 'padre';
        const color = esPrestador ? 'bg-green-500' : 'bg-blue-500';
        const fecha = u.fechaRegistro ? new Date(u.fechaRegistro).toLocaleDateString() : '---';
        return `
          <li class="flex items-center justify-between text-sm">
            <span class="flex items-center gap-2">
              <span class="w-2 h-2 ${color} rounded-full"></span> ${escapeHTML(u.nombre)}
            </span>
            <span class="text-gray-400 text-xs">${escapeHTML(fecha)}</span>
          </li>
        `;
      }).join('');
    } catch (e) {
      showToast('Error al cargar últimos registros', 'error');
    }
  }

  async function loadCaregiverBlockedDays(uid) {
    const blockedDaysList = document.getElementById('caregiver-blocked-days-list');
    if (!blockedDaysList) return;
    blockedDaysList.innerHTML = '<li class="p-2 text-center text-gray-400 italic">Cargando bloqueos...</li>';
    try {
      const bloqueos = await getCaregiverBlockedDays(uid);
      if (bloqueos.length === 0) {
        blockedDaysList.innerHTML = '<li class="p-2 text-center text-gray-400 italic">No tienes días bloqueados.</li>';
      } else {
        blockedDaysList.innerHTML = bloqueos.map(data => `
          <li class="flex items-center justify-between bg-red-50 p-2.5 rounded-lg border border-red-100">
            <div class="flex items-center gap-3">
              <span class="text-sm">⛔</span>
              <div>
                <p class="font-bold text-red-800 text-xs">${escapeHTML(data.date)}</p>
                <p class="text-[10px] text-red-600">${escapeHTML(data.motivo || 'Sin motivo')}</p>
              </div>
            </div>
            <button data-id="${escapeHTML(data.id)}" class="btn-delete-block text-red-400 hover:text-red-700 text-xs">Eliminar</button>
          </li>`).join('');

        blockedDaysList.querySelectorAll('.btn-delete-block').forEach(btn => {
          btn.onclick = async () => {
            try {
              await removeCaregiverBlockedDay(uid, btn.dataset.id);
              showToast('Bloqueo eliminado', 'success');
              loadCaregiverBlockedDays(uid);
            } catch(e) {
              showToast('Error al eliminar bloqueo', 'error');
            }
          };
        });
      }
    } catch (e) {
      blockedDaysList.innerHTML = '<li class="p-2 text-center text-red-500 italic">Error al cargar.</li>';
    }
  }

  // --- VERIFICACIÓN DE AUTENTICACIÓN ---
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      try {
        const docRef = doc(db, "usuarios", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const userData = docSnap.data();
          currentUserData = userData;

          if (userData.estado === 'pendiente' && userData.rol !== 'admin') {
            renderWaitingScreen(userData.nombre);
          } else {
            const rol = (Array.isArray(userData.rol) ? userData.rol[0] : userData.rol) || 'padre';
            currentUserRole = rol;
            
            // Seteo de cabecera de cuenta
            if (userNameEl) userNameEl.textContent = userData?.nombre || "Usuario";
            if (userInitial) userInitial.textContent = (userData?.nombre || "U").charAt(0).toUpperCase();
            if (userRoleLabel) {
              // Prioridad 1: Si es admin, siempre mostramos 'Administrador'
              if (rol === 'admin') {
                userRoleLabel.textContent = 'Administrador';
              // Prioridad 2: Si tiene subtipo (madre/padre), mostramos eso
              } else if (userData.subtipo && userData.subtipo !== 'admin') {
                userRoleLabel.textContent = userData.subtipo === 'madre' ? 'Mamá' : 'Papá';
              // Prioridad 3: Mostramos el rol capitalizado como fallback
              } else {
                const labelMap = { consejera: 'Consejera', cuidadora: 'Cuidadora', padre: 'Padre' };
                userRoleLabel.textContent = labelMap[rol] || rol;
              }
            }

            // Seleccionar pestaña por defecto
            activeTab = (rol === 'padre') ? 'resumen' : 'dashboard';

            renderSidebar(rol, userData);
            renderContent(rol, userData);
          }
        } else {
          showToast('Perfil de usuario no encontrado', 'error');
          setTimeout(() => window.location.href = 'index.html', 3000);
        }
      } catch (error) {
        showToast('Error al conectar con el servidor', 'error');
      }
    } else {
      window.location.href = 'index.html';
    }
  });

  function renderWaitingScreen(nombre) {
    if (dashboardContent) {
      dashboardContent.innerHTML = `
        <div class="glass-panel p-10 rounded-2xl text-center slide-up max-w-xl mx-auto mt-20">
          <div class="text-5xl mb-4">⌛</div>
          <h2 class="text-2xl font-black mb-4 text-[#181411]">Cuenta en Revisión</h2>
          <p class="text-[#887263]">Hola ${nombre || 'Colaborador/a'}, estamos validando tus antecedentes. Te notificaremos por correo cuando tu perfil esté activo.</p>
          <button onclick="location.reload()" class="mt-6 text-sm text-[#e87a30] font-bold">Refrescar estado</button>
        </div>`;
    }
  }

  // Cerrar sesión
  const btnLogout = document.getElementById('btnCerrarSesion');
  if (btnLogout) {
    btnLogout.addEventListener('click', async (e) => {
      e.preventDefault();
      await signOut(auth);
      window.location.href = 'index.html';
    });
  }
});
