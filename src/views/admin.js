// Archivo: src/views/admin.js
// Origen: extraído de src/mi-cuenta.js durante refactor (panel admin)
// Ubicación original (referencia): lógica admin y handlers de formularios
// - Funciones movidas aquí: loadPendingUsers, loadLatestUsers,
//   renderAdminInventory, renderAdminAllOrders y renderAdminTab
// - Formularios y handlers relacionados con tienda/pedidos se trasladaron
//   a este módulo para mantener `src/mi-cuenta.js` como orquestador.
// Revisa src/mi-cuenta.js para el flujo de llamada y src/ui/account.js
// para handlers de checkout y fichas compartidos.

import { showToast } from '../ui/notifications.js';
import { emailService } from '../emailService.js';
import {
  fetchAdminStats,
  getPendingUsers,
  getLatestUsers,
  fetchTodosPedidos,
  fetchActiveProducts,
  createProduct,
  deleteProduct,
} from '../api/firestore.js';
import { approveUserWithAudit } from '../api/admin.js';
import { escapeHTML } from '../utils/html.js';
import { hasRole } from '../utils/roles.js';
import { db } from '../firebase.js'; // Importar db desde su origen
import { doc, updateDoc } from 'firebase/firestore'; // Importar funciones de firestore

export async function renderAdminTab(activeTab, userData) {
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
      <div class="bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
        <p class="text-gray-600">Esta sección está en desarrollo. Próximamente, aquí encontrarás una tabla completa con todos los usuarios de la plataforma, con herramientas de búsqueda, filtro y acciones de moderación directa (como editar perfiles o eliminar cuentas).</p>
      </div>
    `;
    // En el futuro, aquí se llamaría a una función como `loadAllUsersTable()`
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
                <label class="block text-xs font-bold text-gray-700 mb-1">Imagen (URL)</label>
                <input type="url" name="imagenUrl" placeholder="https://..." class="w-full p-2 border border-gray-300 rounded text-sm focus:border-[#e87a30] outline-none" />
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
    renderAdminAllOrders();

    const addForm = document.getElementById('adminAddProductForm');
    if (addForm) {
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
  } catch (e) {
    div.innerHTML = '<p class="text-center py-6 text-red-500 italic">Error cargando pedidos.</p>';
  }
}

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
      const targetBtn = e.target;
      targetBtn.disabled = true;
      try {
        // Se reemplaza la llamada directa a la DB por la nueva función auditada.
        await approveUserWithAudit(uid, 'Aprobado desde el panel de administración.');
        showToast('Usuario aprobado con éxito (acción auditada).', 'success');
        emailService.sendApprovalNotification(nombre, email);
        loadPendingUsers();
      } catch (error) {
        console.error('Error en el flujo de aprobación:', error);
        showToast(error.message || 'Error al aprobar usuario', 'error');
        targetBtn.disabled = false;
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
      const esPrestador = !hasRole(u, 'padre');
      const color = esPrestador ? 'bg-green-500' : 'bg-blue-500';
      const fecha = u.fechaRegistro ? new Date(u.fechaRegistro).toLocaleDateString() : '---';
      
      // Lógica para el toggle de permisos de tips
      const puedeCrearTips = u.puedeCrearTips || false;
      const tipsPermissionToggle = esPrestador ? `
        <div class="flex items-center gap-1 text-[10px] text-gray-500">
          <label for="tips-${u.id}" class="cursor-pointer">Tips:</label>
          <input type="checkbox" id="tips-${u.id}" data-uid="${u.id}" class="toggle-tips-permission" ${puedeCrearTips ? 'checked' : ''}>
        </div>
      ` : '';

      return `
        <li class="flex items-center justify-between text-sm">
          <span class="flex items-center gap-2">
            <span class="w-2 h-2 ${color} rounded-full"></span> ${escapeHTML(u.nombre)}
          </span>
          <span class="flex items-center gap-3 text-gray-400 text-xs">${tipsPermissionToggle} ${escapeHTML(fecha)}</span>
        </li>
      `;
    }).join('');

    // Toggle para permiso de crear tips (movido aquí, a la lista de usuarios ya activos)
    container.querySelectorAll('.toggle-tips-permission').forEach(toggle => {
      toggle.addEventListener('change', async (e) => {
        const { uid } = e.target.dataset;
        const canCreate = e.target.checked;
        try {
          const userRef = doc(db, "usuarios", uid);
          await updateDoc(userRef, {
            puedeCrearTips: canCreate
          });
          showToast(`Permiso para crear tips ${canCreate ? 'otorgado' : 'revocado'}.`, 'success');
        } catch (error) {
          console.error("Error al actualizar permiso de tips:", error);
          showToast('Error al actualizar permiso.', 'error');
          // Revertir el estado visual del toggle en caso de error
          e.target.checked = !canCreate;
        }
      });
    });
  } catch (e) {
    showToast('Error al cargar últimos registros', 'error');
  }
}
