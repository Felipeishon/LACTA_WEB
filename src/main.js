import './styles.css';
import './css/index.css';
import { initModales } from './modales.js';
import { initCalendario } from './calendario.js';
import { initFormularios } from './formularios.js';
import { initNavigation } from './ui/navigation.js';
import { initTipsModal } from './views/tips.js';
import { auth } from './firebase.js';
import { onAuthStateChanged } from 'firebase/auth';
import { fetchActiveProducts, fetchServiciosActivos } from './api/firestore.js';
import { escapeHTML } from './utils/html.js';

async function renderServicios() {
  const grid = document.getElementById('servicios-grid');
  if (!grid) return;

  try {
    const servicios = await fetchServiciosActivos();
    if (servicios.length === 0) {
      grid.innerHTML = '<p class="col-span-full rounded-xl border border-white/30 bg-white/90 px-6 py-8 text-center font-medium text-[#887263] shadow-sm">Pronto compartiremos nuestros servicios. ¡Vuelve pronto!</p>';
      return;
    }

    grid.innerHTML = servicios.map(servicio => {
      const icono = escapeHTML(servicio.icono || 'fa-solid fa-heart');

      return `
        <article class="h-full flex flex-col items-center justify-start gap-4 rounded-xl border border-[#e5dfdc] bg-white p-6 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl cursor-default">
          <div class="text-[#e87a30] bg-[#fdf5f0] p-4 rounded-full flex items-center justify-center" aria-hidden="true">
            <i class="${icono} text-3xl"></i>
          </div>
          <div class="flex flex-col gap-2 text-center">
            <h4 class="text-[#181411] text-lg font-bold leading-tight">${escapeHTML(servicio.nombre)}</h4>
            <p class="text-[#887263] text-sm font-normal leading-relaxed">${escapeHTML(servicio.descripcion)}</p>
          </div>
        </article>
      `;
    }).join('');
  } catch (error) {
    console.error('Error al cargar servicios de la landing:', error);
    grid.innerHTML = '<p class="col-span-full rounded-xl border border-red-200 bg-white/95 px-6 py-8 text-center font-medium text-red-700 shadow-sm">No fue posible cargar los servicios.</p>';
  }
}

async function renderLandingProducts() {
  const grid = document.getElementById('tienda-productos-grid');
  if (!grid) return;

  try {
    const productos = await fetchActiveProducts();
    const productosAleatorios = [...productos]
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    if (productosAleatorios.length === 0) {
      grid.innerHTML = '<p class="col-span-full text-center py-10 text-white italic">Próximamente nuevos productos</p>';
      return;
    }

    grid.innerHTML = productosAleatorios.map(producto => {
      const urlDestino = producto.mercadoLibreUrl || (producto.whatsappNumber ? `https://wa.me/${producto.whatsappNumber}` : null);
      const urlDestinoHTML = escapeHTML(urlDestino);
      const imagen = producto.imagenUrl
        ? `<img src="${escapeHTML(producto.imagenUrl)}" loading="lazy" alt="${escapeHTML(producto.nombre)}" class="w-32 h-32 object-cover rounded-lg mb-4 shadow-sm" />`
        : '';
      const imagenHTML = urlDestino && imagen
        ? `<a href="${urlDestinoHTML}" target="_blank" rel="noopener noreferrer">${imagen}</a>`
        : imagen;
      const enlaceCompra = producto.mercadoLibreUrl
        ? `<a href="${urlDestinoHTML}" target="_blank" rel="noopener noreferrer" class="bg-[#181411] hover:bg-[#332b26] text-white rounded-full px-5 py-2 text-sm font-bold transition-colors active:scale-95 w-full text-center">Ver en Mercado Libre</a>`
        : producto.whatsappNumber
          ? `<a href="${urlDestinoHTML}" target="_blank" rel="noopener noreferrer" class="bg-[#5b8a72] hover:bg-[#4a735e] text-white rounded-full px-5 py-2 text-sm font-bold transition-colors active:scale-95 w-full text-center">Adquirir por WhatsApp</a>`
          : '<button disabled class="bg-gray-200 text-gray-400 rounded-full px-5 py-2 text-sm font-bold w-full text-center cursor-not-allowed">Sin enlace</button>';

      return `
        <div class="flex flex-col justify-between bg-white rounded-xl border border-[#e5dfdc] p-5 w-full max-w-xs mx-auto items-center transition-all duration-300 hover:-translate-y-2 hover:shadow-lg h-full">
          <div class="flex flex-col items-center flex-1 w-full text-center">
            ${imagenHTML}
            <h3 class="text-[#181411] font-bold text-lg mb-1">${escapeHTML(producto.nombre)}</h3>
            <p class="text-[#e87a30] font-bold text-base mb-4">$${escapeHTML(Number(producto.precio || 0).toLocaleString('es-CL'))}</p>
          </div>
          ${enlaceCompra}
        </div>
      `;
    }).join('');
  } catch (error) {
    console.error('Error al cargar productos de la landing:', error);
    grid.innerHTML = '<p class="col-span-full text-center py-10 text-white italic">No fue posible cargar los productos.</p>';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initModales();
  initCalendario();
  initFormularios();
  initNavigation();
  initTipsModal(); // Inicializar el modal de tips
  renderServicios();
  renderLandingProducts();

  // --- Observador de sesión: adapta el navbar según el estado de autenticación ---
  const btnLogin = document.getElementById('btnAbrirModalLogin');
  const btnRegistro = document.getElementById('btnAbrirModalRegistroPadre');
  const btnMobileLogin = document.getElementById('btnMobileLogin');
  const btnMobileRegistro = document.getElementById('btnMobileRegistro');
  const btnMobileMiCuenta = document.getElementById('btnMobileMiCuenta');
  const btnMiCuenta = document.getElementById('btnIrMiCuenta');

  onAuthStateChanged(auth, (user) => {
    if (user) {
      // Usuario con sesión activa: ocultar login/registro, mostrar "Mi Cuenta"
      if (btnLogin) btnLogin.classList.add('hidden');
      if (btnRegistro) btnRegistro.classList.add('hidden');
      if (btnMobileLogin) btnMobileLogin.classList.add('hidden');
      if (btnMobileRegistro) btnMobileRegistro.classList.add('hidden');
      if (btnMobileMiCuenta) {
        btnMobileMiCuenta.classList.remove('hidden');
        btnMobileMiCuenta.classList.add('block');
      }
      if (btnMiCuenta) {
        btnMiCuenta.classList.remove('hidden');
        btnMiCuenta.classList.add('flex');
      }
    } else {
      // Sin sesión: mostrar login/registro, ocultar "Mi Cuenta"
      if (btnLogin) btnLogin.classList.remove('hidden');
      if (btnRegistro) btnRegistro.classList.remove('hidden');
      if (btnMobileLogin) btnMobileLogin.classList.remove('hidden');
      if (btnMobileRegistro) btnMobileRegistro.classList.remove('hidden');
      if (btnMobileMiCuenta) {
        btnMobileMiCuenta.classList.add('hidden');
        btnMobileMiCuenta.classList.remove('block');
      }
      if (btnMiCuenta) {
        btnMiCuenta.classList.add('hidden');
        btnMiCuenta.classList.remove('flex');
      }
    }
  });


});
