// Archivo: src/ui/account.js
// Origen: extraído de src/mi-cuenta.js durante refactor.
// Propósito: centralizar handlers compartidos relacionados con cuenta,
// carrito y formularios (checkout, ficha de cuidado) para mantener
// `src/mi-cuenta.js` como orquestador ligero.
//
// Exporta:
// - `openPerfilBebeModal(userData)` : abre modal perfil bebé
// - `openFichaCuidadoModal(reservaId, nidoId)` : abre modal de ficha
// - `initAccountFormHandlers({ renderContent, getCurrentUserData, getCurrentUserRole })` :
//     registra submit handlers de `checkoutForm` y `fichaCuidadoForm`.
//
// Referencias:
// - llamadas desde: `src/mi-cuenta.js`
// - usa: `src/ui/cart.js`, `src/api/firestore.js`, `src/ui/notifications.js`

import { auth } from '../firebase.js';
import { saveFichaCuidado } from '../api/firestore.js';
import { showToast } from './notifications.js';

export function openPerfilBebeModal(userData) {
  const modal = document.getElementById('modalPerfilBebe');
  if (!modal) return;
  modal.showModal();
}

export function openFichaCuidadoModal(reservaId, nidoId) {
  const modal = document.getElementById('modalFichaCuidado');
  if (!modal) return;

  document.getElementById('ficha-reservaId').value = reservaId;
  document.getElementById('ficha-nidoId').value = nidoId;

  const inputFecha = modal.querySelector('input[name="fecha"]');
  if (inputFecha) inputFecha.value = new Date().toISOString().split('T')[0];

  modal.showModal();
}

export function initAccountFormHandlers({ renderContent, getCurrentUserData, getCurrentUserRole }) {
  const fichaCuidadoForm = document.getElementById('fichaCuidadoForm');
  if (fichaCuidadoForm) {
    fichaCuidadoForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = fichaCuidadoForm.querySelector('button[type="submit"]');
      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Guardando Ficha...';
      }

      const fd = new FormData(fichaCuidadoForm);
      const data = {
        reservaId: fd.get('reservaId'),
        nidoId: fd.get('nidoId'),
        fecha: fd.get('fecha'),
        horasEfectivas: parseInt(fd.get('horasEfectivas')),
        tipoAlimentacion: fd.get('tipoAlimentacion'),
        cantidadOz: parseInt(fd.get('cantidadOz')) || 0,
        horasSueno: parseFloat(fd.get('horasSueno')) || 0,
        cantidadPanales: parseInt(fd.get('cantidadPanales')) || 0,
        observaciones: fd.get('observaciones'),
        recomendaciones: fd.get('recomendaciones'),
        seguimiento: fd.get('seguimiento'),
        prestadorId: auth.currentUser.uid,
        prestadorNombre: getCurrentUserData()?.nombre || 'Prestador',
        prestadorRol: getCurrentUserRole()
      };

      if (!data.nidoId) {
        showToast('Error: Esta cita no tiene un Nido asociado. Pide a los padres registrar su nido.', 'error');
        if (btn) {
          btn.disabled = false;
          btn.textContent = 'Guardar y Enviar Bitácora';
        }
        return;
      }

      try {
        await saveFichaCuidado(data);
        showToast('Ficha de cuidado guardada y compartida', 'success');
        fichaCuidadoForm.reset();
        document.getElementById('modalFichaCuidado')?.close();
        renderContent(getCurrentUserRole(), getCurrentUserData());
      } catch (err) {
        showToast('Error al guardar la bitácora', 'error');
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.textContent = 'Guardar y Enviar Bitácora';
        }
      }
    });
  }
}
