import { showToast } from '../../ui/notifications.js';
import { fetchAdminStats, createProduct, fetchServiciosActivos, createServicio, deleteServicio } from '../../api/firestore.js';
import { escapeHTML } from '../../utils/html.js';
import { renderAdminInventory } from './tienda.js';
import { renderAdminTipsManagement } from './tips.js';
import {
  loadPendingUsers, loadAllUsersTable, loadLatestUsers
} from './usuarios.js';
import { loadAllNidos } from './nidos.js';
import { loadAllRegistros } from './registros.js';
import { fileToBase64 } from '../../utils/helpers.js';

async function renderAdminServicesList() {
  const servicesList = document.getElementById('admin-services-list');
  if (!servicesList) return;

  try {
    const servicios = await fetchServiciosActivos();
    if (servicios.length === 0) {
      servicesList.innerHTML = '<p class="text-sm text-gray-400 italic">Aún no hay servicios activos.</p>';
      return;
    }

    servicesList.innerHTML = servicios.map(servicio => `
      <div class="flex items-start justify-between gap-4 rounded-lg border border-gray-100 p-4">
        <div class="flex items-start gap-3">
          <i class="${escapeHTML(servicio.icono || 'fa-solid fa-heart')} text-xl text-[#e87a30]" aria-hidden="true"></i>
          <div>
            <h5 class="font-bold text-[#181411]">${escapeHTML(servicio.nombre)}</h5>
            <p class="mt-1 text-sm text-gray-500">${escapeHTML(servicio.descripcion)}</p>
          </div>
        </div>
        <button type="button" data-delete-service="${escapeHTML(servicio.id)}" class="shrink-0 rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-100">Eliminar</button>
      </div>
    `).join('');

    servicesList.querySelectorAll('[data-delete-service]').forEach(button => {
      button.addEventListener('click', async () => {
        if (!window.confirm('¿Eliminar este servicio?')) return;
        try {
          await deleteServicio(button.dataset.deleteService);
          showToast('Servicio eliminado con éxito', 'success');
          await renderAdminServicesList();
        } catch (error) {
          console.error('Error al eliminar servicio desde administración:', error);
          showToast('Error al eliminar el servicio', 'error');
        }
      });
    });
  } catch (error) {
    console.error('Error al cargar servicios para administración:', error);
    servicesList.innerHTML = '<p class="text-sm font-medium text-red-600">No se pudieron cargar los servicios.</p>';
  }
}

async function renderAdminTab(activeTab) {
  const dashboardContent = document.getElementById('dashboard-content');
  if (!dashboardContent) return;

  if (activeTab === 'dashboard') {
    const stats = await fetchAdminStats();
    dashboardContent.innerHTML = `
      <h2 class="text-3xl font-black text-[#181411] mb-6">Panel Super Administrador 🚀</h2>
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <div class="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <div class="text-gray-500 text-sm font-medium mb-1">Total Usuarios</div>
          <div class="text-3xl font-black">${stats.totalUsers || 0}</div>
        </div>
        <div class="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <div class="text-gray-500 text-sm font-medium mb-1">Citas Activas</div>
          <div class="text-3xl font-black text-[#e87a30]">${stats.activeAppointments || 0}</div>
          <div class="text-xs text-gray-400 mt-1">${stats.citasCompletadas || 0} completadas</div>
        </div>
        <div class="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <div class="text-gray-500 text-sm font-medium mb-1">Prestadores</div>
          <div class="text-3xl font-black text-[#887263]">${stats.totalPrestadores || 0}</div>
        </div>
        <div class="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <div class="text-gray-500 text-sm font-medium mb-1">Fichas de Consejería</div>
          <div class="text-3xl font-black text-[#887263]">${stats.totalFichas || 0}</div>
        </div>
        <div class="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <div class="text-gray-500 text-sm font-medium mb-1">Bitácoras de Cuidado</div>
          <div class="text-3xl font-black text-[#887263]">${stats.totalBitacoras || 0}</div>
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

  } else if (activeTab === 'admin_servicios') {
    dashboardContent.innerHTML = `
      <h2 class="text-2xl font-black text-[#181411] mb-6">Gestión de Servicios</h2>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h4 class="font-bold text-lg text-[#181411] mb-4">Añadir Servicio</h4>
          <form id="adminAddServiceForm" class="space-y-4">
            <div>
              <label class="block text-xs font-bold text-gray-700 mb-1">Nombre</label>
              <input type="text" name="nombre" required maxlength="120" class="w-full p-2 border border-gray-300 rounded text-sm focus:border-[#e87a30] outline-none" />
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-700 mb-1">Descripción</label>
              <textarea name="descripcion" required maxlength="1000" rows="4" class="w-full p-2 border border-gray-300 rounded text-sm focus:border-[#e87a30] outline-none"></textarea>
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-700 mb-1">Ícono (opcional)</label>
              <select id="servicio-icono" name="icono" class="w-full p-2 border rounded-xl text-sm mb-3">
                <option value="fa-solid fa-heart">❤️ Corazón (Apoyo)</option>
                <option value="fa-solid fa-baby">👶 Bebé (Lactancia)</option>
                <option value="fa-solid fa-moon">🌙 Luna (Cuidado nocturno)</option>
                <option value="fa-solid fa-hand-holding-heart">🤝 Mano con Corazón (Ayuda)</option>
                <option value="fa-solid fa-hands-holding-child">🫂 Manos con Niño (Cuidado)</option>
                <option value="fa-solid fa-stethoscope">🩺 Estetoscopio (Salud)</option>
              </select>
            </div>
            <button type="submit" class="w-full bg-[#181411] hover:bg-[#e87a30] text-white font-bold py-2.5 rounded-lg text-sm transition">Guardar Servicio</button>
          </form>
        </div>
        <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h4 class="font-bold text-lg text-[#181411] mb-4">Servicios activos</h4>
          <div id="admin-services-list" class="space-y-3">
            <p class="text-sm text-gray-400 italic">Cargando servicios...</p>
          </div>
        </div>
      </div>
    `;

    await renderAdminServicesList();

    const addServiceForm = document.getElementById('adminAddServiceForm');
    addServiceForm?.addEventListener('submit', async event => {
      event.preventDefault();
      const formData = new FormData(addServiceForm);
      try {
        await createServicio({
          nombre: formData.get('nombre'),
          descripcion: formData.get('descripcion'),
          icono: formData.get('icono')
        });
        showToast('Servicio creado con éxito', 'success');
        addServiceForm.reset();
        await renderAdminServicesList();
      } catch (error) {
        console.error('Error al crear servicio desde administración:', error);
        showToast('Error al crear el servicio', 'error');
      }
    });
  }
}

export { renderAdminTab };
