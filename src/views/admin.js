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
  getAllUsers,
  updateUserProfile,
  deleteUserProfile,
  getLatestUsers,
  fetchTodosPedidos,
  fetchActiveProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  fetchAllTips,
  approveTip,
  deleteTip,
} from '../api/firestore.js';
import { approveUserWithAudit } from '../api/admin.js';
import { escapeHTML } from '../utils/html.js';
import { hasRole } from '../utils/roles.js';
import { db } from '../firebase.js'; // Importar db desde su origen
import { doc, updateDoc } from 'firebase/firestore'; // Importar funciones de firestore

function fileToBase64(file) {
  const maxBytes = 200 * 1024;
  if (file.size <= maxBytes) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('No se pudo leer la imagen.'));
      reader.readAsDataURL(file);
    });
  }

  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const maxWidth = 800;
      const scale = Math.min(1, maxWidth / image.width);
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      const context = canvas.getContext('2d');
      if (!context) {
        reject(new Error('No se pudo preparar la imagen.'));
        return;
      }
      context.drawImage(image, 0, 0, canvas.width, canvas.height);

      const compress = (quality, attemptsLeft) => {
        canvas.toBlob(blob => {
          if (!blob) {
            reject(new Error('No se pudo comprimir la imagen.'));
            return;
          }
          if (blob.size <= maxBytes || attemptsLeft === 0) {
            if (blob.size > maxBytes) {
              reject(new Error('La imagen no pudo reducirse por debajo de 200 KB.'));
              return;
            }
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error('No se pudo leer la imagen comprimida.'));
            reader.readAsDataURL(blob);
            return;
          }
          compress(Math.max(0.2, quality - 0.1), attemptsLeft - 1);
        }, 'image/jpeg', quality);
      };

      compress(0.8, 6);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('El archivo seleccionado no es una imagen válida.'));
    };
    image.src = objectUrl;
  });
}

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

async function renderAdminTipsManagement() {
  const container = document.getElementById('admin-tips-management');
  if (!container) return;

  try {
    const tips = await fetchAllTips();
    const pendingTips = tips.filter(tip => tip.estado === 'pendiente');
    const approvedTips = tips.filter(tip => tip.estado === 'aprobado');
    if (tips.length === 0) {
      container.innerHTML = '<p class="text-center text-gray-500">Aún no hay tips creados.</p>';
      return;
    }

    container.innerHTML = `
      <h4 class="font-bold text-lg mb-4">Tips Pendientes de Aprobación</h4>
      <div class="space-y-3 max-h-[400px] overflow-y-auto pr-2 mb-8">
        ${pendingTips.length === 0 ? '<p class="text-sm text-gray-500">No hay tips pendientes.</p>' : pendingTips.map(tip => `
          <div class="flex items-start justify-between gap-4 p-3 bg-gray-50 border rounded-md">
            <div>
              <p class="font-bold text-sm">${escapeHTML(tip.titulo)}</p>
              <p class="text-xs text-gray-600">${escapeHTML(tip.contenido)}</p>
              <p class="text-[10px] text-gray-400 mt-1">${escapeHTML(tip.autorNombre || 'Autor no registrado')}</p>
            </div>
            <button type="button" data-id="${escapeHTML(tip.id)}" class="btn-approve-tip bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs font-bold whitespace-nowrap">Aprobar</button>
          </div>
        `).join('')}
      </div>
      <h4 class="font-bold text-lg mb-4">Tips Aprobados</h4>
      <div class="space-y-3 max-h-[500px] overflow-y-auto pr-2">
        ${approvedTips.length === 0 ? '<p class="text-sm text-gray-500">No hay tips aprobados.</p>' : approvedTips.map(tip => `
          <div class="flex items-start justify-between gap-4 p-3 bg-gray-50 border rounded-md">
            <div>
              <p class="font-bold text-sm">${escapeHTML(tip.titulo)}</p>
              <p class="text-xs text-gray-600">${escapeHTML(tip.contenido)}</p>
              <p class="text-[10px] text-gray-400 mt-1">${escapeHTML(tip.autorNombre || 'Autor no registrado')}</p>
            </div>
            <button type="button" data-id="${escapeHTML(tip.id)}" class="btn-delete-tip text-red-600 hover:text-red-800 text-xs font-bold whitespace-nowrap">Eliminar</button>
          </div>
        `).join('')}
      </div>
    `;

    container.querySelectorAll('.btn-approve-tip').forEach(button => {
      button.addEventListener('click', async () => {
        if (!window.confirm('¿Aprobar este tip?')) return;
        button.disabled = true;
        try {
          await approveTip(button.dataset.id);
          showToast('Tip aprobado correctamente.', 'success');
          await renderAdminTipsManagement();
        } catch (error) {
          console.error('Error al aprobar tip:', error);
          button.disabled = false;
          showToast(error.message || 'Error al aprobar tip.', 'error');
        }
      });
    });

    container.querySelectorAll('.btn-delete-tip').forEach(button => {
      button.addEventListener('click', async () => {
        if (!window.confirm('¿Estás seguro de eliminar este tip?')) return;
        button.disabled = true;
        try {
          await deleteTip(button.dataset.id);
          showToast('Tip eliminado correctamente.', 'success');
          await renderAdminTipsManagement();
        } catch (error) {
          console.error('Error al eliminar tip:', error);
          button.disabled = false;
          showToast(error.message || 'Error al eliminar tip.', 'error');
        }
      });
    });
  } catch (error) {
    console.error('Error al cargar tips administrativos:', error);
    container.innerHTML = '<p class="text-center text-red-500">Error al cargar los tips.</p>';
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
            <p class="font-bold text-sm text-[#181411]">${escapeHTML(p.nombre)}</p>
            <p class="text-xs text-gray-500">$${p.precio.toLocaleString('cl-CL')} • Stock: ${p.stock} • Cat: ${escapeHTML(p.categoria)}</p>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <button type="button" data-id="${p.id}" class="btn-edit-product text-blue-600 hover:text-blue-800 text-xs font-bold transition">Editar</button>
          <button type="button" data-id="${p.id}" class="btn-delete-product text-red-500 hover:text-red-700 text-xs font-bold transition">Quitar</button>
        </div>
      </div>
    `).join('');

    list.querySelectorAll('.btn-edit-product').forEach(btn => {
      btn.onclick = () => {
        const product = products.find(item => item.id === btn.dataset.id);
        const modal = document.getElementById('modalEdicionProducto');
        const form = document.getElementById('formEdicionProducto');
        if (!product || !modal || !form) return;

        form.elements.id.value = product.id;
        form.elements.nombre.value = product.nombre || '';
        form.elements.precio.value = product.precio ?? '';
        form.elements.stock.value = product.stock ?? '';
        form.elements.categoria.value = product.categoria || 'Lactancia';
        form.elements.imagenUrlActual.value = product.imagenUrl || '';
        modal.showModal();
      };
    });

    list.querySelectorAll('.btn-delete-product').forEach(btn => {
      btn.onclick = async () => {
        if (window.confirm('¿Estás seguro de eliminar este producto?')) {
          try {
            await deleteProduct(btn.dataset.id);
            showToast('Producto eliminado', 'success');
            renderAdminInventory();
          } catch {
            showToast('Error al eliminar producto', 'error');
          }
        }
      };
    });

    const editForm = document.getElementById('formEdicionProducto');
    const editModal = document.getElementById('modalEdicionProducto');
    if (editForm && !editForm.dataset.listenerAttached) {
      editForm.dataset.listenerAttached = 'true';
      editForm.addEventListener('submit', async event => {
        event.preventDefault();
        const formData = new FormData(editForm);
        const imageFile = formData.get('imagenFile');
        let imagenUrl = formData.get('imagenUrlActual') || '';
        const submitButton = editForm.querySelector('button[type="submit"]');
        if (submitButton) submitButton.disabled = true;

        try {
          if (imageFile instanceof File && imageFile.size > 0) {
            imagenUrl = await fileToBase64(imageFile);
          }

          await updateProduct(formData.get('id'), {
            nombre: formData.get('nombre'),
            precio: formData.get('precio'),
            stock: formData.get('stock'),
            categoria: formData.get('categoria'),
            imagenUrl
          });
          editModal?.close();
          showToast('Producto actualizado con éxito', 'success');
          renderAdminInventory();
        } catch (error) {
          console.error('Error al actualizar producto:', error);
          showToast(error.message || 'Error al actualizar producto', 'error');
        } finally {
          if (submitButton) submitButton.disabled = false;
        }
      });
    }

  } catch {
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
              <td class="p-3 text-xs">${escapeHTML(o.direccion || 'No ingresada')}</td>
              <td class="p-3 text-xs">${o.productos.map(p => `${escapeHTML(p.nombre)} x${p.cantidad}`).join(', ')}</td>
              <td class="p-3 font-bold text-[#e87a30]">$${o.total.toLocaleString('cl-CL')}</td>
              <td class="p-3 text-xs text-gray-400">${new Date(o.creadoEn).toLocaleDateString()}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } catch {
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

  } catch {
    container.innerHTML = '<p class="text-xs text-red-500">Error al cargar.</p>';
  }
}

async function loadAllUsersTable() {
  const container = document.getElementById('users-table-container');
  const searchInput = document.getElementById('users-search');
  const roleFilter = document.getElementById('users-role-filter');
  const statusFilter = document.getElementById('users-status-filter');
  if (!container) return;

  try {
    const users = await getAllUsers();

    const renderTable = () => {
      const search = searchInput.value.trim().toLowerCase();
      const role = roleFilter.value;
      const status = statusFilter.value;
      const filteredUsers = users.filter(user => {
        const roles = Array.isArray(user.rol) ? user.rol : [user.rol].filter(Boolean);
        const searchable = [user.nombre, user.email, user.rut].filter(Boolean).join(' ').toLowerCase();
        return (!search || searchable.includes(search))
          && (!role || roles.includes(role))
          && (!status || user.estado === status);
      });

      if (filteredUsers.length === 0) {
        container.innerHTML = '<p class="text-center py-8 text-gray-400 italic">No hay usuarios que coincidan.</p>';
        return;
      }

      container.innerHTML = `
        <table class="w-full text-left text-sm">
          <thead class="bg-gray-50 text-gray-600 border-b border-gray-200">
            <tr>
              <th class="p-3">Nombre</th>
              <th class="p-3">Email</th>
              <th class="p-3">RUT</th>
              <th class="p-3">Rol</th>
              <th class="p-3">Estado</th>
              <th class="p-3">Registro</th>
              <th class="p-3">Tips</th>
              <th class="p-3">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            ${filteredUsers.map(user => {
              const roles = Array.isArray(user.rol) ? user.rol : [user.rol].filter(Boolean);
              const fecha = user.fechaRegistro ? new Date(user.fechaRegistro).toLocaleDateString() : '---';
              const esPrestador = roles.includes('consejera') || roles.includes('cuidadora');
              return `
                <tr>
                  <td class="p-3 font-bold">${escapeHTML(user.nombre || 'Sin nombre')}</td>
                  <td class="p-3 text-xs">${escapeHTML(user.email || '---')}</td>
                  <td class="p-3 text-xs">${escapeHTML(user.rut || '---')}</td>
                  <td class="p-3 text-xs">${escapeHTML(roles.join(', ') || '---')}</td>
                  <td class="p-3 text-xs">${escapeHTML(user.estado || '---')}</td>
                  <td class="p-3 text-xs text-gray-500">${escapeHTML(fecha)}</td>
                  <td class="p-3 text-center">
                    ${esPrestador ? `<input type="checkbox" data-uid="${escapeHTML(user.id)}" class="toggle-tips-admin" ${user.puedeCrearTips ? 'checked' : ''}>` : '---'}
                  </td>
                  <td class="p-3 whitespace-nowrap">
                    <button type="button" data-uid="${escapeHTML(user.id)}" class="btn-edit-user text-blue-600 hover:text-blue-800 text-xs font-bold">Editar</button>
                    <button type="button" data-uid="${escapeHTML(user.id)}" class="btn-delete-user text-red-600 hover:text-red-800 text-xs font-bold ml-3">Eliminar</button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      `;

      container.querySelectorAll('.toggle-tips-admin').forEach(toggle => {
        toggle.addEventListener('change', async event => {
          const canCreateTips = event.target.checked;
          try {
            await updateDoc(doc(db, 'usuarios', event.target.dataset.uid), { puedeCrearTips: canCreateTips });
            showToast(`Permiso para crear tips ${canCreateTips ? 'otorgado' : 'revocado'}.`, 'success');
          } catch {
            event.target.checked = !canCreateTips;
            showToast('Error al actualizar permiso.', 'error');
          }
        });
      });

      container.querySelectorAll('.btn-edit-user').forEach(button => {
        button.addEventListener('click', () => {
          const user = users.find(item => item.id === button.dataset.uid);
          const modal = document.getElementById('modalEdicionUsuario');
          const form = document.getElementById('formEdicionUsuario');
          if (!user || !modal || !form) return;

          const roles = Array.isArray(user.rol) ? user.rol : [user.rol].filter(Boolean);
          form.elements.uid.value = user.id;
          form.elements.nombre.value = user.nombre || '';
          form.elements.email.value = user.email || '';
          form.elements.estado.value = user.estado || 'pendiente';
          form.querySelectorAll('input[name="rol"]').forEach(input => {
            input.checked = roles.includes(input.value);
          });
          modal.showModal();
        });
      });

      container.querySelectorAll('.btn-delete-user').forEach(button => {
        button.addEventListener('click', async () => {
          const uid = button.dataset.uid;
          if (!window.confirm('¿Estás seguro de desactivar este usuario?')) return;

          button.disabled = true;
          try {
            await deleteUserProfile(uid);
            const userIndex = users.findIndex(user => user.id === uid);
            if (userIndex !== -1) users[userIndex].estado = 'inactivo';
            renderTable();
            showToast('Usuario desactivado correctamente.', 'success');
          } catch (error) {
            console.error('Error al desactivar usuario:', error);
            button.disabled = false;
            showToast(error.message || 'Error al desactivar usuario.', 'error');
          }
        });
      });
    };

    const editModal = document.getElementById('modalEdicionUsuario');
    const editForm = document.getElementById('formEdicionUsuario');
    if (editForm && !editForm.dataset.listenerAttached) {
      editForm.dataset.listenerAttached = 'true';
      editForm.addEventListener('submit', async event => {
        event.preventDefault();
        const formData = new FormData(editForm);
        const uid = formData.get('uid');
        const roles = Array.from(editForm.querySelectorAll('input[name="rol"]:checked')).map(input => input.value);
        if (roles.length === 0) {
          showToast('Selecciona al menos un rol.', 'error');
          return;
        }

        try {
          await updateUserProfile(uid, {
            nombre: formData.get('nombre'),
            email: formData.get('email'),
            estado: formData.get('estado'),
            rol: roles
          });

          const user = users.find(item => item.id === uid);
          if (user) {
            user.nombre = formData.get('nombre');
            user.email = formData.get('email');
            user.estado = formData.get('estado');
            user.rol = roles;
          }
          editModal?.close();
          renderTable();
          showToast('Usuario actualizado con éxito.', 'success');
        } catch (error) {
          console.error('Error al actualizar usuario:', error);
          showToast('Error al actualizar usuario.', 'error');
        }
      });
    }

    searchInput.addEventListener('input', renderTable);
    roleFilter.addEventListener('change', renderTable);
    statusFilter.addEventListener('change', renderTable);
    renderTable();
  } catch (error) {
    console.error('Error en loadAllUsersTable:', error);
    container.innerHTML = '<p class="text-center py-8 text-red-500 italic">Error cargando usuarios.</p>';
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
      
      // Lógica de fecha robusta para evitar "Invalid Date"
      let fecha = '---';
      if (u.fechaRegistro) {
        const dateObj = new Date(u.fechaRegistro);
        // Se comprueba si la fecha es un número válido antes de mostrarla
        if (!isNaN(dateObj.getTime())) {
          fecha = dateObj.toLocaleDateString();
        }
      }
      
      return `
        <li class="flex items-center justify-between text-sm">
          <span class="flex items-center gap-2">
            <span class="w-2 h-2 ${color} rounded-full"></span> ${escapeHTML(u.nombre)}
          </span>
          <span class="text-gray-400 text-xs">${escapeHTML(fecha)}</span>
        </li>
      `;
    }).join('');
  } catch {
    showToast('Error al cargar últimos registros', 'error');
  }
}
