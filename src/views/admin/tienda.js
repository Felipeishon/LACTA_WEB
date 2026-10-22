import { showToast } from '../../ui/notifications.js';
import { fetchActiveProducts, updateProduct, deleteProduct, fetchTodosPedidos } from '../../api/firestore.js';
import { escapeHTML } from '../../utils/html.js';
import { fileToBase64, formatFirestoreDate } from '../../utils/helpers.js';
import { showConfirmModal } from '../../modales.js';

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
        const confirmado = await showConfirmModal('Eliminar Producto', '¿Estás seguro de eliminar este producto?');
        if (!confirmado) return;
        try {
          await deleteProduct(btn.dataset.id);
          showToast('Producto eliminado', 'success');
          renderAdminInventory();
        } catch {
          showToast('Error al eliminar producto', 'error');
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
            precio: Number(formData.get('precio')),
            stock: Number(formData.get('stock')),
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
              <td class="p-3 text-xs text-gray-400">${formatFirestoreDate(o.creadoEn) || '---'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } catch {
    div.innerHTML = '<p class="text-center py-6 text-red-500 italic">Error cargando pedidos.</p>';
  }
}

export { renderAdminInventory, renderAdminAllOrders };
