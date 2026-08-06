import { showToast } from './notifications.js';
import { auth } from '../firebase.js';
import { createPedido } from '../api/firestore.js';

const CART_STORAGE_KEY = 'lactanido_cart';
let cart = loadCart();

function loadCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function persistCart() {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}

export function getCart() {
  return cart;
}

export function getCartQuantity() {
  return cart.reduce((sum, item) => sum + item.cantidad, 0);
}

export function getCartTotal() {
  return cart.reduce((sum, item) => sum + item.precio * item.cantidad, 0);
}

export function saveCart() {
  persistCart();
  updateCartIconIndicator();
}

export function clearCart() {
  cart = [];
  persistCart();
  updateCartIconIndicator();
}

export function addToCart({ productoId, nombre, precio, stock }) {
  const existing = cart.find(item => item.productoId === productoId);
  const maxStock = parseInt(stock, 10);

  if (existing) {
    if (existing.cantidad >= maxStock) {
      showToast('No puedes agregar más del stock disponible', 'warning');
      return;
    }
    existing.cantidad += 1;
  } else {
    if (maxStock <= 0) {
      showToast('Producto sin stock disponible', 'warning');
      return;
    }
    cart.push({ productoId, nombre, precio: parseFloat(precio), cantidad: 1 });
  }

  saveCart();
  showToast(`¡${nombre} añadido al carrito!`, 'success');
}

export function updateCartIconIndicator() {
  const cartBadge = document.getElementById('cart-badge');
  if (!cartBadge) return;

  const totalItems = getCartQuantity();
  if (totalItems > 0) {
    cartBadge.textContent = totalItems;
    cartBadge.classList.remove('hidden');
  } else {
    cartBadge.classList.add('hidden');
  }
}

export function renderCartItems() {
  const container = document.getElementById('carrito-items');
  const totalEl = document.getElementById('carrito-total');
  if (!container) return;

  if (cart.length === 0) {
    container.innerHTML = '<p class="text-gray-400 text-center py-8 text-sm italic">Tu carrito está vacío.</p>';
    if (totalEl) totalEl.textContent = '$0';
    return;
  }

  let total = 0;
  container.innerHTML = cart.map((item, idx) => {
    const sub = item.precio * item.cantidad;
    total += sub;
    return `
      <div class="flex items-center justify-between border-b border-gray-100 pb-2">
        <div>
          <p class="font-bold text-sm text-gray-800">${item.nombre}</p>
          <p class="text-xs text-gray-400">$${item.precio.toLocaleString('cl-CL')} x ${item.cantidad}</p>
        </div>
        <div class="flex items-center gap-2">
          <button class="btn-cart-qty bg-gray-100 hover:bg-gray-200 px-2 py-0.5 rounded text-xs" data-idx="${idx}" data-action="dec">-</button>
          <span class="text-sm font-bold">${item.cantidad}</span>
          <button class="btn-cart-qty bg-gray-100 hover:bg-gray-200 px-2 py-0.5 rounded text-xs" data-idx="${idx}" data-action="inc">+</button>
          <button class="btn-cart-del text-red-500 hover:text-red-700 text-xs ml-2 font-bold" data-idx="${idx}">Quitar</button>
        </div>
      </div>
    `;
  }).join('');

  if (totalEl) totalEl.textContent = `$${total.toLocaleString('cl-CL')}`;

  container.querySelectorAll('.btn-cart-qty').forEach(btn => {
    btn.onclick = () => {
      const idx = parseInt(btn.dataset.idx, 10);
      const action = btn.dataset.action;
      if (action === 'inc') {
        cart[idx].cantidad++;
      } else if (action === 'dec') {
        cart[idx].cantidad--;
        if (cart[idx].cantidad <= 0) {
          cart.splice(idx, 1);
        }
      }
      saveCart();
      renderCartItems();
    };
  });

  container.querySelectorAll('.btn-cart-del').forEach(btn => {
    btn.onclick = () => {
      const idx = parseInt(btn.dataset.idx, 10);
      cart.splice(idx, 1);
      saveCart();
      renderCartItems();
    };
  });
}

export function openCartModal() {
  const modal = document.getElementById('modalCarrito');
  if (!modal) return;
  renderCartItems();
  modal.showModal();
}

export function initCheckoutForm({ renderContent, getCurrentUserData }) {
  const checkoutForm = document.getElementById('checkoutForm');
  if (!checkoutForm) return;

  checkoutForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const cartItems = getCart();
    if (cartItems.length === 0) {
      showToast('El carrito está vacío', 'warning');
      return;
    }
    const btn = document.getElementById('btnConfirmarPedido');
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Procesando Pedido...';
    }

    const currentUserData = getCurrentUserData();
    const orderData = {
      compradorUid: auth.currentUser.uid,
      nidoId: currentUserData?.nidoId || null,
      productos: cartItems,
      total: getCartTotal(),
      direccion: document.getElementById('cart-direccion')?.value,
      telefono: document.getElementById('cart-telefono')?.value,
      estado: 'pagado'
    };

    try {
      await createPedido(orderData);
      showToast('¡Pedido realizado con éxito!', 'success');
      clearCart();
      checkoutForm.reset();
      document.getElementById('modalCarrito')?.close();
      renderContent('padre', currentUserData);
    } catch (err) {
      showToast('Error al procesar el pedido. Revisa el stock.', 'error');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Confirmar Pedido y Pagar 💳';
      }
    }
  });
}
