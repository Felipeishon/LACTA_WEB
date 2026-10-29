import { getPrimaryRole } from '../utils/roles.js';

const NAV_CONFIG = {
  padre: [
    { label: "Resumen", icon: "🏠", action: "resumen" },
    { label: "Tienda Bebé 🛍️", icon: "🧸", action: "tienda" },
    { label: "Mis Favoritos ❤️", icon: "❤️", action: "favoritos" },
    { label: "Historial del Bebé", icon: "📜", action: "historial_bebe" }
  ],
  consejera: [
    { label: "Mi Agenda", icon: "📅", action: "dashboard" },
    { label: "Mi Disponibilidad", icon: "⏰", action: "horarios" },
    { label: "Mis Evaluaciones", icon: "📝", action: "historial_fichas" },
    { label: "Bitácoras", icon: "📖", action: "bitacoras" },
    { label: "Mis Tarifas", icon: "💵", action: "tarifas" },
    { label: "Tips", icon: "💡", action: "gestionar_tips", permission: "puedeCrearTips" }
  ],
  cuidadora: [
    { label: "Mi Agenda", icon: "📅", action: "dashboard" },
    { label: "Mi Disponibilidad", icon: "⏰", action: "disponibilidad" },
    { label: "Mis Bitácoras", icon: "📖", action: "historial_fichas" },
    { label: "Evaluaciones", icon: "📝", action: "fichas_cuidado" },
    { label: "Mis Tarifas", icon: "💵", action: "tarifas" },
    { label: "Tips", icon: "💡", action: "gestionar_tips", permission: "puedeCrearTips" }
  ],
  admin: [
    { label: "Visión General", icon: "👁️", action: "dashboard" },
    { label: "Usuarios", icon: "👥", action: "usuarios" },
    { label: "Nidos / Familias", icon: "👶", action: "admin_nidos" },
    { label: "Registros", icon: "📋", action: "admin_registros" },
    { label: "Tienda / Inventario", icon: "🛍️️", action: "admin_tienda" },
    { label: "Gestión de Tips", icon: "💡", action: "admin_tips" },
    { label: "Servicios", icon: "🩺", action: "admin_servicios" }
  ]
};

export function renderSidebar(userData, options = {}) {
  const {
    role = getPrimaryRole(userData),
    activeTab = 'dashboard',
    onNavigate,
    onClose
  } = options;
  const sidebarNav = document.getElementById('sidebar-nav');
  if (!sidebarNav) return;

  const items = NAV_CONFIG[role] || [];
  const filteredItems = items.filter(item =>
    !item.permission || userData[item.permission] === true
  );

  sidebarNav.innerHTML = filteredItems.map(item => {
    const isActive = activeTab === item.action;
    return `
      <a href="#" data-action="${item.action}" class="nav-item flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-medium ${isActive ? 'bg-[#e87a30] text-white shadow-md shadow-[#e87a30]/30 transform scale-[1.02]' : 'text-[#887263] hover:bg-[#f4eade] hover:text-[#181411]'}">
        <span class="text-xl">${item.icon}</span>
        ${item.label}
      </a>
    `;
  }).join('');

  sidebarNav.querySelectorAll('.nav-item').forEach(link => {
    link.addEventListener('click', event => {
      event.preventDefault();
      onNavigate?.(link.dataset.action);
      onClose?.();
    });
  });
}
