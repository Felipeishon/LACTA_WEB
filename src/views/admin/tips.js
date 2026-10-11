import { showToast } from '../../ui/notifications.js';
import { fetchAllTips, approveTip, deleteTip } from '../../api/firestore.js';
import { escapeHTML } from '../../utils/html.js';

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

export { renderAdminTipsManagement };
