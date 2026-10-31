import { showToast } from '../../ui/notifications.js';
import { fetchActiveProducts, updateProduct, deleteProduct } from '../../api/firestore.js';
import { escapeHTML } from '../../utils/html.js';
import { fileToBase64 } from '../../utils/helpers.js';
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

export { renderAdminInventory };
