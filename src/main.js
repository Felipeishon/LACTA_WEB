import './styles.css';
import './css/index.css';
import { initModales } from './modales.js';
import { initCalendario } from './calendario.js';
import { initFormularios } from './formularios.js';
import { initNavigation } from './ui/navigation.js';
import { initTipsModal } from './views/tips.js';
import { auth } from './firebase.js';
import { onAuthStateChanged } from 'firebase/auth';

document.addEventListener('DOMContentLoaded', () => {
  initModales();
  initCalendario();
  initFormularios();
  initNavigation();
  initTipsModal(); // Inicializar el modal de tips

  // --- Observador de sesión: adapta el navbar según el estado de autenticación ---
  const btnLogin = document.getElementById('btnAbrirModalLogin');
  const btnRegistro = document.getElementById('btnAbrirModalRegistroPadre');
  const btnMobileLogin = document.getElementById('btnMobileLogin');
  const btnMobileRegistro = document.getElementById('btnMobileRegistro');
  const btnMiCuenta = document.getElementById('btnIrMiCuenta');

  onAuthStateChanged(auth, (user) => {
    if (user) {
      // Usuario con sesión activa: ocultar login/registro, mostrar "Mi Cuenta"
      if (btnLogin) btnLogin.classList.add('hidden');
      if (btnRegistro) btnRegistro.classList.add('hidden');
      if (btnMobileLogin) btnMobileLogin.classList.add('hidden');
      if (btnMobileRegistro) btnMobileRegistro.classList.add('hidden');
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
      if (btnMiCuenta) {
        btnMiCuenta.classList.add('hidden');
        btnMiCuenta.classList.remove('flex');
      }
    }
  });


});
