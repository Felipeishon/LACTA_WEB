import './styles.css';
import './css/index.css';
import { initModales } from './modales.js';
import { initCalendario } from './calendario.js';
import { initFormularios } from './formularios.js';
import { auth } from './firebase.js';
import { onAuthStateChanged } from 'firebase/auth';

document.addEventListener('DOMContentLoaded', () => {
  initModales();
  initCalendario();
  initFormularios();
  initMobileMenu();
  initSectionHighlight();

  // --- Observador de sesión: adapta el navbar según el estado de autenticación ---
  const btnLogin = document.getElementById('btnAbrirModalLogin');
  const btnRegistro = document.getElementById('btnAbrirModalRegistroPadre');
  const btnMiCuenta = document.getElementById('btnIrMiCuenta');

  onAuthStateChanged(auth, (user) => {
    if (user) {
      // Usuario con sesión activa: ocultar login/registro, mostrar "Mi Cuenta"
      if (btnLogin) btnLogin.classList.add('hidden');
      if (btnRegistro) btnRegistro.classList.add('hidden');
      if (btnMiCuenta) {
        btnMiCuenta.classList.remove('hidden');
        btnMiCuenta.classList.add('flex');
      }
    } else {
      // Sin sesión: mostrar login/registro, ocultar "Mi Cuenta"
      if (btnLogin) btnLogin.classList.remove('hidden');
      if (btnRegistro) btnRegistro.classList.remove('hidden');
      if (btnMiCuenta) {
        btnMiCuenta.classList.add('hidden');
        btnMiCuenta.classList.remove('flex');
      }
    }
  });
});

function initMobileMenu() {
  const btnToggleMenu = document.getElementById('btnToggleMenu');
  const mobileNav = document.getElementById('mobileNav');
  const userMenuToggle = document.getElementById('btnUserMenuToggle');
  const userMenu = document.getElementById('userMenu');
  const btnUserMenuLogin = document.getElementById('btnUserMenuLogin');
  const btnUserMenuRegistro = document.getElementById('btnUserMenuRegistro');
  const btnMobileLogin = document.getElementById('btnMobileLogin');
  const btnMobileRegistro = document.getElementById('btnMobileRegistro');

  if (!btnToggleMenu || !mobileNav) return;

  btnToggleMenu.addEventListener('click', () => {
    const expanded = btnToggleMenu.getAttribute('aria-expanded') === 'true';
    btnToggleMenu.setAttribute('aria-expanded', String(!expanded));
    mobileNav.classList.toggle('hidden');
  });

  if (userMenuToggle && userMenu) {
    userMenuToggle.addEventListener('click', (event) => {
      event.stopPropagation();
      const expanded = userMenuToggle.getAttribute('aria-expanded') === 'true';
      userMenuToggle.setAttribute('aria-expanded', String(!expanded));
      userMenu.classList.toggle('hidden');
    });
  }

  if (btnUserMenuLogin) {
    btnUserMenuLogin.addEventListener('click', () => {
      document.getElementById('btnAbrirModalLogin')?.click();
      userMenu?.classList.add('hidden');
      userMenuToggle?.setAttribute('aria-expanded', 'false');
    });
  }

  if (btnUserMenuRegistro) {
    btnUserMenuRegistro.addEventListener('click', () => {
      document.getElementById('btnAbrirModalRegistroPadre')?.click();
      userMenu?.classList.add('hidden');
      userMenuToggle?.setAttribute('aria-expanded', 'false');
    });
  }

  if (btnMobileLogin) {
    btnMobileLogin.addEventListener('click', () => {
      document.getElementById('btnAbrirModalLogin')?.click();
      mobileNav.classList.add('hidden');
      btnToggleMenu.setAttribute('aria-expanded', 'false');
    });
  }

  if (btnMobileRegistro) {
    btnMobileRegistro.addEventListener('click', () => {
      document.getElementById('btnAbrirModalRegistroPadre')?.click();
      mobileNav.classList.add('hidden');
      btnToggleMenu.setAttribute('aria-expanded', 'false');
    });
  }

  document.addEventListener('click', (event) => {
    const target = event.target;
    if (!mobileNav.contains(target) && target !== btnToggleMenu && !btnToggleMenu.contains(target)) {
      mobileNav.classList.add('hidden');
      btnToggleMenu.setAttribute('aria-expanded', 'false');
    }

    if (userMenu && userMenuToggle && !userMenu.contains(target) && target !== userMenuToggle && !userMenuToggle.contains(target)) {
      userMenu.classList.add('hidden');
      userMenuToggle.setAttribute('aria-expanded', 'false');
    }
  });
}

function initSectionHighlight() {
  const sectionIds = ['servicios', 'tienda', 'testimonios', 'contacto'];
  const sections = sectionIds.map((id) => document.getElementById(id)).filter(Boolean);
  const navLinks = document.querySelectorAll('header nav a[href^="#"]');
  const mobileNav = document.getElementById('mobileNav');
  const toggleButton = document.getElementById('btnToggleMenu');

  if (!sections.length || !navLinks.length) return;

  const setActiveLink = (activeId) => {
    navLinks.forEach((link) => {
      link.classList.toggle('active-nav-link', link.getAttribute('href') === `#${activeId}`);
    });
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveLink(entry.target.id);
        }
      });
    },
    { rootMargin: '-30% 0px -55% 0px', threshold: 0.2 }
  );

  sections.forEach((section) => observer.observe(section));

  const updateActiveSectionOnScroll = () => {
    const offset = window.innerHeight * 0.35;
    const minScroll = 120; // absolute pixel threshold before highlighting the nav
    let activeId = null;

    if (window.scrollY < minScroll) {
      navLinks.forEach((link) => link.classList.remove('active-nav-link'));
      return;
    }

    sections.forEach((section) => {
      const { top, bottom } = section.getBoundingClientRect();
      const isVisible = top <= offset && bottom > offset;
      if (isVisible) {
        activeId = section.id;
      }
    });

    if (activeId) {
      setActiveLink(activeId);
    } else {
      navLinks.forEach((link) => link.classList.remove('active-nav-link'));
    }
  };

  window.addEventListener('scroll', updateActiveSectionOnScroll, { passive: true });
  window.addEventListener('resize', updateActiveSectionOnScroll);
  updateActiveSectionOnScroll();

  navLinks.forEach((link) => {
    link.addEventListener('click', () => {
      if (mobileNav) {
        mobileNav.classList.add('hidden');
      }
      if (toggleButton) {
        toggleButton.setAttribute('aria-expanded', 'false');
      }
      const targetId = link.getAttribute('href')?.slice(1);
      if (targetId) {
        setActiveLink(targetId);
      }
    });
  });
}
