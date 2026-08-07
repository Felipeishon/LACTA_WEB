// Archivo: src/mi-cuenta.js
// Propósito: Orquestador de la interfaz "Mi Cuenta" — autentica usuario,
// determina rol y delega renderizado por rol a los módulos en `src/views/`.
//
// Notas de refactor:
// - Renderizado específico por rol fue extraído a `src/views/*.js`:
//   `padre.js`, `consejera.js`, `cuidadora.js`, `admin.js`.
// - Handlers compartidos de formularios y modales se movieron a
//   `src/ui/account.js` (checkout, ficha de cuidado, abrir modales).
// - Mantener `mi-cuenta.js` como punto de entrada/orquestador simplifica
//   pruebas y futuras migraciones a frameworks.

import '../index.css';

import { db, auth } from './firebase.js';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { initFormularios } from './formularios.js';
import { getUserProfileWithSubcollections } from './api/firestore.js';
import { initCalendario } from './calendario.js';
import { initModales } from './modales.js';
import { showToast } from './ui/notifications.js';
import { getCartQuantity, openCartModal, updateCartIconIndicator, initCheckoutForm } from './ui/cart.js';
import { initAccountFormHandlers, openPerfilBebeModal, openFichaCuidadoModal } from './ui/account.js';
import { renderPadreTab } from './views/padre.js';
import { renderConsejeraTab } from './views/consejera.js';
import { renderCuidadoraTab } from './views/cuidadora.js';
import { renderAdminTab } from './views/admin.js';
import { renderCreatorTipsManagement } from './views/tips.js'; 
import { escapeHTML } from './utils/html.js';
import { getPrimaryRole, hasRole, getRoles } from './utils/roles.js';
import './css/mi-cuenta.css';

document.addEventListener('DOMContentLoaded', () => {
  const dashboardContent = document.getElementById('dashboard-content');
  const sidebarNav = document.getElementById('sidebar-nav');

  const userNameEl = document.getElementById('user-name');
  const userRoleLabel = document.getElementById('user-role-label');
  const userInitial = document.getElementById('user-initial');

  let activeTab = 'resumen';
  let currentUserData = null;
  let currentUser = null;
  let currentUserRole = 'padre';

  initFormularios();
  initCalendario();
  initModales();
  initAccountFormHandlers({
    renderContent,
    getCurrentUserData: () => currentUserData,
    getCurrentUserRole: () => currentUserRole
  });
  initCheckoutForm({
    renderContent,
    getCurrentUserData: () => currentUserData
  });

  updateCartIconIndicator();

  // --- ESTRUCTURA DE NAVEGACIÓN MODIFICADA (SE AGREGÓ 'MIS TARIFAS') ---
  const NAV_CONFIG = {
    padre: [
      { label: "Resumen", icon: "🏠", action: "resumen" },
      { label: "Tienda Bebé 🛍️", action: "tienda", icon: "🧸" },
      { label: "Mis Pedidos 📦", action: "pedidos", icon: "🚚" },
      { label: "Bitácoras Bebé 📋", action: "bitacora", icon: "🍼" },
      { label: "Perfil Nido", action: "modalPerfilBebe", icon: "👶", isModal: true }
    ],
    consejera: [
      { label: "Dashboard", icon: "📊", action: "dashboard" },
      { label: "Mis Citas", icon: "🗓️", action: "citas" },
      { label: "Fichas Guardadas", icon: "🤱", action: "historial_fichas" },
      { label: "Mi Horario", icon: "⏱️", action: "horarios" },
      { label: "Mis Tarifas", icon: "💰", action: "tarifas" }, // NUEVA PESTAÑA
      { label: "Gestionar Tips", icon: "💡", action: "gestionar_tips", permission: "puedeCrearTips" }
    ],
    cuidadora: [
      { label: "Turnos", icon: "🌙", action: "dashboard" },
      { label: "Fichas Guardadas", icon: "📋", action: "historial_fichas" },
      { label: "Disponibilidad", icon: "🗓️", action: "disponibilidad" },
      { label: "Mis Tarifas", icon: "💰", action: "tarifas" }, // NUEVA PESTAÑA
      { label: "Gestionar Tips", icon: "💡", action: "gestionar_tips", permission: "puedeCrearTips" }
    ],
    admin: [
      { label: "Visión General", icon: "👁️", action: "dashboard" },
      { label: "Usuarios", icon: "👥", action: "usuarios" },
      { label: "Pedidos / Tienda", icon: "🛍️", action: "admin_tienda" }
    ]
  };

  function switchTab(action, role, userData) {
    if (action === 'modalPerfilBebe') {
      openPerfilBebeModal(userData);
      return;
    }
    activeTab = action;
    renderSidebar(role, userData);
    renderContent(role, userData);
  }

  function renderSidebar(role, userData) {
    if (!sidebarNav) return;
    const items = NAV_CONFIG[role] || [];
    const filteredItems = items.filter(item => {
      return !item.permission || (item.permission && userData[item.permission] === true);
    });

    let cartBtnHtml = '';
    if (role === 'padre') {
      cartBtnHtml = `
        <button id="btnVerCarrito" class="flex items-center justify-between gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-medium text-[#887263] hover:bg-[#f4eade] hover:text-[#181411] w-full mt-2 relative">
          <span class="flex items-center gap-3">
            <span class="text-xl">🛒</span> Ver Carrito
          </span>
          <span id="cart-badge" class="bg-[#e87a30] text-white text-xs px-2 py-0.5 rounded-full font-bold ${getCartQuantity() === 0 ? 'hidden' : ''}">
            ${getCartQuantity()}
          </span>
        </button>
      `;
    }

    sidebarNav.innerHTML = filteredItems.map(item => {
      const isActive = activeTab === item.action;
      return `
        <a href="#" data-action="${item.action}" class="nav-item flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-medium ${isActive ? 'bg-[#e87a30] text-white shadow-md shadow-[#e87a30]/30 transform scale-[1.02]' : 'text-[#887263] hover:bg-[#f4eade] hover:text-[#181411]'}">
          <span class="text-xl">${item.icon}</span>
          ${item.label}
        </a>
      `;
    }).join('') + cartBtnHtml;

    sidebarNav.querySelectorAll('.nav-item, #btnVerCarrito').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const action = link.dataset.action || 'carrito';
        if (action === 'carrito') {
          openCartModal();
        } else {
          switchTab(action, role, userData);
        }
      });
    });
  }

  async function renderContent(role, userData) {
    if (!dashboardContent) return;
    dashboardContent.innerHTML = `
      <div class="flex flex-col items-center justify-center h-64 text-gray-400">
        <div class="w-12 h-12 border-4 border-[#e87a30] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p class="animate-pulse font-medium">Cargando sección...</p>
      </div>`;

    try {
      if (role === 'padre') {
        await renderPadreTab(activeTab, userData, openPerfilBebeModal, switchTab);
      } else if (role === 'consejera') {
        await renderConsejeraTab(activeTab, userData, openFichaCuidadoModal);
      } else if (role === 'cuidadora') {
        await renderCuidadoraTab(activeTab, userData, openFichaCuidadoModal);
      } else if (role === 'admin') {
        await renderAdminTab(activeTab, userData);
      }
      
      if (activeTab === 'gestionar_tips') {
        await renderCreatorTipsManagement('dashboard-content');
      }
    } catch (error) {
      console.error("Error cargando pestaña:", error);
      dashboardContent.innerHTML = `
        <div class="text-center py-10">
          <p class="text-red-500 font-bold mb-2">No pudimos cargar esta sección.</p>
          <p class="text-sm text-gray-500">Intenta recargar la página. Si el problema persiste, contáctanos.</p>
        </div>`;
    }
  }

  function getUserRoleLabel(userData) {
    const roles = getRoles(userData);
    if (roles.length > 1) {
      const roleNames = roles.map(rol => {
        const labelMap = { consejera: 'Consejera', cuidadora: 'Cuidadora', padre: 'Padre', admin: 'Admin' };
        return labelMap[rol] || rol;
      });
      return roleNames.join(' / ');
    }
    
    const rol = getPrimaryRole(userData);
    if (rol === 'admin') {
      return 'Administrador';
    }
    if (rol === 'padre' && userData.subtipo) {
      return userData.subtipo === 'madre' ? 'Mamá' : 'Papá';
    }
    const labelMap = { consejera: 'Consejera', cuidadora: 'Cuidadora', padre: 'Padre' };
    return labelMap[rol] || rol;
  }
  
  function renderRoleSwitcher(userData, onRoleChange) {
    const roles = getRoles(userData);
    const roleLabelEl = document.getElementById('user-role-label');
    const roleContainer = roleLabelEl ? roleLabelEl.parentElement : null;
    
    if (!roleContainer) return;

    const oldSwitcher = document.getElementById('role-switcher');
    if (oldSwitcher) {
      oldSwitcher.remove();
    }

    if (roles.length > 1) {
      if (roleLabelEl) roleLabelEl.style.display = 'none';

      const select = document.createElement('select');
      select.id = 'role-switcher';
      select.className = 'mt-1 text-xs bg-white border border-gray-300 rounded p-1 focus:ring-1 focus:ring-[#e87a30] w-full text-[#887263] font-bold cursor-pointer';
      
      roles.forEach(rol => {
        const option = document.createElement('option');
        option.value = rol;
        const labelMap = { consejera: 'Consejera', cuidadora: 'Cuidadora', padre: 'Padre', admin: 'Admin' };
        option.textContent = labelMap[rol] || (rol.charAt(0).toUpperCase() + rol.slice(1));
        
        if (rol === currentUserRole) {
          option.selected = true;
        }
        select.appendChild(option);
      });
      
      select.addEventListener('change', (e) => {
        onRoleChange(e.target.value);
      });

      roleContainer.appendChild(select);
    } else {
      if (roleLabelEl) {
        roleLabelEl.style.display = 'block';
        roleLabelEl.textContent = getUserRoleLabel(userData);
      }
    }
  }
  
  function updateUIForRole(role, userData) {
    currentUserRole = role;
    activeTab = (role === 'padre') ? 'resumen' : 'dashboard';
    renderSidebar(role, userData);
    renderContent(role, userData);
    renderRoleSwitcher(userData, (newRole) => {
        updateUIForRole(newRole, userData);
    });
  }

  function normalizeUserStatus(status) {
    if (!status) return 'unknown';
    const raw = String(status).trim().toLowerCase();
    const isActivo = raw.includes('activo');
    const isPendiente = raw.includes('pendiente') || raw.includes('pending');

    if (isActivo && !isPendiente) return 'activo';
    if (!isActivo && isPendiente) return 'pendiente';
    if (isActivo && isPendiente) return 'activo';

    return raw;
  }

  function isUserPending(userData) {
    const status = normalizeUserStatus(userData?.estado);
    return status === 'pendiente';
  }

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      try {
        currentUser = user; 
        const userData = await getUserProfileWithSubcollections(user.uid);

        if (userData) {
          userData.uid = user.uid;
          userData.id = user.uid;
          
          currentUserData = userData;

          if (isUserPending(userData) && !hasRole(userData, 'admin')) {
            renderWaitingScreen(userData.nombre);
          } else {
            const initialRole = getPrimaryRole(userData);
            
            if (userNameEl) userNameEl.textContent = userData?.nombre || "Usuario";
            if (userInitial) userInitial.textContent = (userData?.nombre || "U").charAt(0).toUpperCase();
            if (userRoleLabel) userRoleLabel.textContent = getUserRoleLabel(userData);

            updateUIForRole(initialRole, userData);
          }
        } else {
          showToast('Perfil de usuario no encontrado', 'error');
          setTimeout(() => window.location.href = 'index.html', 3000);
        }
      } catch (error) {
        console.error('Error cargando datos de usuario:', error);
        showToast('Error al conectar con el servidor', 'error');
      }
    } else {
      currentUser = null; 
      window.location.href = 'index.html';
    }
  });

  function renderWaitingScreen(nombre) {
    if (dashboardContent) {
      dashboardContent.innerHTML = `
        <div class="glass-panel p-10 rounded-2xl text-center slide-up max-w-xl mx-auto mt-20">
          <div class="text-5xl mb-4">⌛</div>
          <h2 class="text-2xl font-black mb-4 text-[#181411]">Cuenta en Revisión</h2>
          <p class="text-[#887263]">Hola ${nombre || 'Colaborador/a'}, estamos validando tus antecedentes. Te notificaremos por correo cuando tu perfil esté activo.</p>
          <button onclick="location.reload()" class="mt-6 text-sm text-[#e87a30] font-bold">Refrescar estado</button>
        </div>`;
    }
  }

  const btnLogout = document.getElementById('btnCerrarSesion');
  if (btnLogout) {
    btnLogout.addEventListener('click', async (e) => {
      e.preventDefault();
      await signOut(auth);
      window.location.href = 'index.html';
    });
  }
});