import { showToast } from '../../ui/notifications.js';
import { fetchAllTips, approveTip, deleteTip } from '../../api/firestore.js';
import { escapeHTML } from '../../utils/html.js';
import { showConfirmModal } from '../../modales.js';

async function renderAdminTipsManagement() {
  const container = document.getElementById('admin-tips-management');
  if (!container) return;

  try {
    const tips = await fetchAllTips();
    const pendingTips = tips.filter(tip => tip.estado === 'pendiente');
    const approvedTips = tips.filter(tip => tip.estado === 'aprobado');
    if (tips.length === 0) {
      container.innerHTML = '<div class="text-center py-8 text-gray-400 italic flex flex-col items-center justify-center"><span class="text-3xl mb-2">🍃</span>Aún no hay tips creados.</div>';
      return;
    }

    const renderTipCard = (tip, actionButton) => {
      const autorRol = tip.autorRol || tip.rolAutor;
      return `
        <article class="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-4 md:p-5 mb-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div class="min-w-0 flex-1">
            <h5 class="text-lg font-black text-[#181411] mb-2">${escapeHTML(tip.titulo)}</h5>
            <div class="bg-gray-50 p-3 rounded-lg text-sm text-gray-700 mb-3">${escapeHTML(tip.contenido)}</div>
            <div class="flex flex-wrap items-center gap-2">
              <span class="text-xs text-gray-500 italic">${escapeHTML(tip.autorNombre || 'Autor no registrado')}</span>
              ${autorRol ? `<span class="bg-pink-100 text-pink-700 px-2 py-1 rounded-full text-[10px] font-bold">${escapeHTML(autorRol)}</span>` : ''}
            </div>
          </div>
          ${actionButton}
        </article>
      `;
    };

    container.innerHTML = `
      <h4 class="font-bold text-lg mb-4">Tips Pendientes de Aprobación</h4>
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2 mb-8">
        ${pendingTips.length === 0
          ? '<div class="text-center py-8 text-gray-400 italic flex flex-col items-center justify-center"><span class="text-3xl mb-2">🍃</span>No hay tips pendientes de aprobación.</div>'
          : pendingTips.map(tip => renderTipCard(tip, `
              <button type="button" data-id="${escapeHTML(tip.id)}" class="btn-approve-tip shrink-0 bg-green-500 hover:bg-green-600 text-white font-bold py-2 sm:py-1.5 px-4 rounded-lg text-xs transition shadow-sm">Aprobar</button>
            `)).join('')}
      </div>
      <h4 class="font-bold text-lg mb-4">Tips Aprobados</h4>
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-2">
        ${approvedTips.length === 0
          ? '<div class="text-center py-8 text-gray-400 italic flex flex-col items-center justify-center"><span class="text-3xl mb-2">🍃</span>No hay tips aprobados.</div>'
          : approvedTips.map(tip => renderTipCard(tip, `
              <button type="button" data-id="${escapeHTML(tip.id)}" class="btn-delete-tip shrink-0 bg-red-50 hover:bg-red-100 text-red-600 font-bold py-2 sm:py-1.5 px-4 rounded-lg text-xs transition border border-red-200">Eliminar</button>
            `)).join('')}
      </div>
    `;

    container.querySelectorAll('.btn-approve-tip').forEach(button => {
      button.addEventListener('click', async () => {
        const confirmado = await showConfirmModal('Aprobar Tip', '¿Aprobar este tip?', false);
        if (!confirmado) return;
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
        const confirmado = await showConfirmModal('Eliminar Tip', '¿Estás seguro de eliminar este tip?');
        if (!confirmado) return;
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
