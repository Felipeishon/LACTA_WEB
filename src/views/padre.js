import { formatRut, validarRut } from '../rut.js';
import { addToCart } from '../ui/cart.js';
import { showToast } from '../ui/notifications.js';
import { fetchUserAppointments, fetchActiveProducts, fetchPedidosUsuario, vincularNidoPorRutBebe, fetchFichasCuidadoPorNido } from '../api/firestore.js';
import { escapeHTML } from '../utils/html.js';

export async function renderPadreTab(activeTab, userData, openPerfilBebeModal, switchTab) {
  const dashboardContent = document.getElementById('dashboard-content');
  if (!dashboardContent) return;

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
          </tbody>
        </table>
      </div>
    `;

    const btnNuevaCita = document.getElementById('btnNuevaCita');
    if (btnNuevaCita) {
      btnNuevaCita.onclick = () => document.getElementById('modalAgendarCita')?.showModal();
    }
    const btnIrTienda = document.getElementById('btnIrTienda');
    if (btnIrTienda) {
      btnIrTienda.onclick = () => switchTab('tienda');
    }
    const btnVerPerfil = document.getElementById('btnVerPerfilBebe');
    if (btnVerPerfil) {
      btnVerPerfil.onclick = () => openPerfilBebeModal(userData);
    }

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
    dashboardContent.innerHTML = `
      <h2 class="text-2xl font-black text-[#181411] mb-6">📦 Historial de Pedidos</h2>
      <div class="bg-white rounded-xl shadow-sm border border-[#e5dfdc] overflow-hidden" id="pedidos-container">
        <p class="text-center py-10 text-gray-400 italic">Cargando historial...</p>
      </div>
    `;
    renderMisPedidos(userData.uid);

  } else if (activeTab === 'bitacora') {
    dashboardContent.innerHTML = `
      <h2 class="text-2xl font-black text-[#181411] mb-2">🍼 Historial del Bebé</h2>
      <p class="text-sm text-gray-500 mb-6">Información e indicaciones ingresadas por las cuidadoras y consejeras de LactaNido.</p>
      <div class="space-y-6" id="bitacora-timeline">
        <p class="text-center py-10 text-gray-400 italic">Cargando bitácoras y fichas...</p>
      </div>
    `;
    renderBitacoraTimeline(userData.nidoId);
  }
}

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

    grid.querySelectorAll('.btn-agregar-carrito').forEach(btn => {
      btn.onclick = () => {
        const { id, nombre, precio, stock } = btn.dataset;
        addToCart({ productoId: id, nombre, precio, stock });
      };
    });

  } catch (e) {
    grid.innerHTML = '<p class="col-span-full text-center text-red-500 py-10 italic">Error al cargar productos.</p>';
  }
}

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

async function renderBitacoraTimeline(nidoId) {
  const timeline = document.getElementById('bitacora-timeline');
  if (!timeline) return;
  if (!nidoId) {
    timeline.innerHTML = '<p class="text-center py-10 text-red-500 italic font-semibold">Debes vincular tu Nido familiar para ver las bitácoras del bebé.</p>';
    return;
  }

  try {
    // Antes esta consulta filtraba por `uidPadre` (campo que nunca se guarda en
    // `bitacoras`) y además leía una colección `fichas_atencion` que la app
    // nunca escribe, por lo que el timeline siempre quedaba vacío. La forma
    // correcta de obtener los registros de un nido es por `nidoId`, usando la
    // misma función que ya usan (correctamente) las vistas de prestador.
    const fichas = await fetchFichasCuidadoPorNido(nidoId);

    if (fichas.length === 0) {
      timeline.innerHTML = '<p class="text-center py-10 text-gray-400 italic">No hay registros de cuidado cargados todavía.</p>';
      return;
    }

    timeline.innerHTML = fichas.map(reg => {
      const fechaObj = reg.creadoEn ? new Date(reg.creadoEn) : new Date(0);
      const fechaLegible = fechaObj.toLocaleDateString('es-CL');
      const horaLegible = fechaObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      return `
        <div class="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative pl-8 border-l-4 border-emerald-500 slide-up">
          <div class="flex justify-between items-start mb-3 flex-wrap gap-2">
            <div>
              <span class="text-xs text-gray-400 font-bold block">${fechaLegible} a las ${horaLegible} hrs</span>
              <h4 class="font-bold text-lg text-[#181411]">Reporte de Cuidado</h4>
              <p class="text-xs text-[#887263]">Registrado por: ${escapeHTML(reg.prestadorNombre || 'Prestador')} • Turno efectivo: ${reg.horasEfectivas || 0} hrs</p>
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
  } catch (e) {
    console.error('Error cargando bitácoras:', e);
    timeline.innerHTML = '<p class="text-center py-10 text-red-500 italic">Error cargando bitácoras.</p>';
  }
}
