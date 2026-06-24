import './styles.css';
import { initModales } from './modales.js';
import { initCalendario } from './calendario.js';
import { initFormularios } from './formularios.js';
import { auth } from './firebase.js';
import { onAuthStateChanged } from 'firebase/auth';

document.addEventListener('DOMContentLoaded', () => {
  initModales();
  initCalendario();
  initFormularios();

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

