import { fetchActiveProducts } from '../../api/firestore.js';
import { escapeHTML } from '../../utils/html.js';

export async function renderPadreFavoritos(dashboardContent) {
  dashboardContent.innerHTML = `
    <h2 class="text-2xl font-black text-[#181411] mb-6">Mis Favoritos ❤️</h2>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6" id="grid-productos-favoritos">
      <p class="col-span-full text-center py-10 text-gray-400 italic">Cargando favoritos...</p>
    </div>
  `;

  try {
    const favs = JSON.parse(localStorage.getItem('lactanido_favs') || '[]');
    const productos = await fetchActiveProducts();
    const productosFavoritos = productos.filter(producto => favs.includes(producto.id));
    const grid = document.getElementById('grid-productos-favoritos');

    if (!grid) return;

    if (productosFavoritos.length === 0) {
      grid.innerHTML = '<p class="col-span-full text-center py-10 text-[#887263]">Aún no tienes productos favoritos. Explora la tienda ❤️</p>';
      return;
    }

    grid.innerHTML = productosFavoritos.map(prod => {
      const urlDestino = prod.mercadoLibreUrl || (prod.whatsappNumber ? `https://wa.me/${prod.whatsappNumber}` : null);
      const imagen = prod.imagenUrl
        ? `<img src="${escapeHTML(prod.imagenUrl)}" alt="${escapeHTML(prod.nombre)}" class="w-full h-40 object-cover rounded-xl mb-3" />`
        : '';
      const imgTag = urlDestino && imagen
        ? `<a href="${escapeHTML(urlDestino)}" target="_blank" rel="noopener noreferrer">${imagen}</a>`
        : imagen;
      const enlaceCompra = prod.mercadoLibreUrl
        ? `<a href="${escapeHTML(urlDestino)}" target="_blank" rel="noopener noreferrer" class="bg-[#181411] hover:bg-[#332b26] text-white text-xs font-bold px-3 py-2 rounded-xl transition">Ver en Mercado Libre 🛒</a>`
        : prod.whatsappNumber
          ? `<a href="${escapeHTML(urlDestino)}" target="_blank" rel="noopener noreferrer" class="bg-[#181411] hover:bg-[#332b26] text-white text-xs font-bold px-3 py-2 rounded-xl transition">Contactar por WhatsApp 💬</a>`
          : '<span class="text-xs text-gray-400">Sin enlace de compra</span>';

      return `
        <div class="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <div>
            ${imgTag}
            <h4 class="font-bold text-lg mt-2 text-[#181411]">${escapeHTML(prod.nombre)}</h4>
            <p class="text-xs text-gray-500 mt-1">${escapeHTML(prod.categoria || 'General')}</p>
          </div>
          <div class="mt-4 flex items-center justify-between gap-3">
            <span class="text-lg font-black text-[#e87a30]">$${escapeHTML(Number(prod.precio || 0).toLocaleString('es-CL'))}</span>
            ${enlaceCompra}
          </div>
        </div>
      `;
    }).join('');
  } catch (error) {
    console.error('Error al cargar favoritos:', error);
    const grid = document.getElementById('grid-productos-favoritos');
    if (grid) {
      grid.innerHTML = '<p class="col-span-full text-center py-10 text-red-500">No se pudieron cargar tus favoritos.</p>';
    }
  }
}
