import { fetchActiveProducts } from '../../api/firestore.js';
import { escapeHTML } from '../../utils/html.js';
import { getCartQuantity, openCartModal } from '../../ui/cart.js';

export async function renderPadreTienda(dashboardContent) {
  dashboardContent.innerHTML = `
      <div class="flex justify-between items-center mb-6">
        <div>
          <h2 class="text-2xl font-black text-[#181411]">Tienda Bebé 🛍️</h2>
          <p class="text-sm text-[#887263]">Encuentra productos especializados para el cuidado y lactancia.</p>
        </div>
        <button id="btnVerCarritoTienda" class="bg-[#e87a30] text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md hover:bg-[#d66a20] transition">
          🛒 Ver Carrito (${getCartQuantity()})
        </button>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6" id="grid-productos-tienda">
        <p class="col-span-full text-center py-10 text-gray-400 italic">Cargando productos...</p>
      </div>
    `;

    document.getElementById('btnVerCarritoTienda')?.addEventListener('click', openCartModal);

    try {
      const productos = await fetchActiveProducts();
      const grid = document.getElementById('grid-productos-tienda');
      if (grid) {
        if (productos.length === 0) {
          grid.innerHTML = '<p class="col-span-full text-center py-10 text-gray-400 italic">No hay productos disponibles por el momento.</p>';
        } else {
          grid.innerHTML = productos.map(prod => {
            const urlDestino = prod.mercadoLibreUrl || (prod.whatsappNumber ? `https://wa.me/${prod.whatsappNumber}` : null);
            const urlDestinoHTML = escapeHTML(urlDestino);
            const imagen = prod.imagenUrl ? `<img src="${escapeHTML(prod.imagenUrl)}" alt="${escapeHTML(prod.nombre)}" class="w-full h-40 object-cover rounded-xl mb-3" />` : '';
            const imgTag = urlDestino && imagen ? `<a href="${urlDestinoHTML}" target="_blank" rel="noopener noreferrer">${imagen}</a>` : imagen;
            const enlaceCompra = prod.mercadoLibreUrl
              ? `<a href="${urlDestinoHTML}" target="_blank" rel="noopener noreferrer" class="bg-[#181411] hover:bg-[#332b26] text-white text-xs font-bold px-3 py-2 rounded-xl transition">Ver en Mercado Libre 🛒</a>`
              : prod.whatsappNumber
                ? `<a href="${urlDestinoHTML}" target="_blank" rel="noopener noreferrer" class="bg-[#181411] hover:bg-[#332b26] text-white text-xs font-bold px-3 py-2 rounded-xl transition">Contactar por WhatsApp 💬</a>`
                : '<button disabled class="bg-gray-200 text-gray-400 text-xs font-bold px-3 py-2 rounded-xl cursor-not-allowed">Sin enlace</button>';
            return `
            <div class="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
              <div>
                ${imgTag}
                <span class="text-xs bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full font-bold">${escapeHTML(prod.categoria || 'General')}</span>
                <h4 class="font-bold text-lg mt-2 text-[#181411]">${escapeHTML(prod.nombre)}</h4>
                <p class="text-xs text-gray-500 mt-1">Stock: ${escapeHTML(prod.stock || 0)} disponibles</p>
              </div>
              <div class="mt-4 flex items-center justify-between">
                <span class="text-lg font-black text-[#e87a30]">$${escapeHTML(Number(prod.precio || 0).toLocaleString('es-CL'))}</span>
                ${enlaceCompra}
              </div>
            </div>
            `;
          }).join('');
        }
      }
    } catch (e) {
      console.error("Error al cargar productos:", e);
    }
}
