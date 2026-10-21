import { fetchPedidosUsuario } from '../../api/firestore.js';
import { escapeHTML } from '../../utils/html.js';

export async function renderPadrePedidos(dashboardContent, userData) {
    dashboardContent.innerHTML = `
      <h2 class="text-2xl font-black text-[#181411] mb-6">Mis Pedidos 📦</h2>
      <div class="space-y-4" id="lista-pedidos-padre">
        <p class="text-center py-10 text-gray-400 italic">Cargando pedidos...</p>
      </div>
    `;
    try {
      let pedidos = await fetchPedidosUsuario(userData.uid);
      const container = document.getElementById('lista-pedidos-padre');
      if (container) {
        if (pedidos.length === 0) {
          container.innerHTML = '<p class="text-center py-10 text-gray-400 italic">No has realizado ningún pedido todavía.</p>';
        } else {
          container.innerHTML = pedidos.map(ped => {
            const id = escapeHTML(ped.id);
            const total = Number(ped.total || 0).toLocaleString('es-CL');
            const address = escapeHTML(ped.direccion || 'N/A');
            const state = escapeHTML(ped.estado);
            return `
            <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex justify-between items-center flex-wrap gap-4">
              <div>
                <span class="text-xs text-gray-400 font-bold">Pedido ID: ${id}</span>
                <h4 class="font-bold text-base text-[#181411]">Total: $${total}</h4>
                <p class="text-xs text-gray-600 mt-1">Dirección: ${address}</p>
              </div>
              <div>
                <span class="text-xs font-bold px-3 py-1 rounded-full bg-blue-100 text-blue-700 uppercase">${state}</span>
              </div>
            </div>
            `;
          }).join('');
        }
      }
    } catch (e) {
      console.error("Error cargando pedidos:", e);
    }
}
