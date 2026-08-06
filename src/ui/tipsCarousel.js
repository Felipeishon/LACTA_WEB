// src/ui/tipsCarousel.js

import { auth } from '../firebase.js';

export function initTipsCarousel() {
  const modal = document.getElementById('modalTipsLactancia');
  if (!modal) return;

  const tips = modal.querySelectorAll('.tip-card');
  const btnPrev = modal.querySelector('#tip-prev');
  const btnNext = modal.querySelector('#tip-next');
  const counter = modal.querySelector('#tip-counter');
  const btnRegister = modal.querySelector('#tip-register-cta');
  const btnClose = modal.querySelector('#btnEntendidoTips');

  let currentIndex = 0;
  const totalTips = tips.length;

  function updateView(user) {
    tips.forEach((tip, index) => {
      tip.classList.toggle('hidden', index !== currentIndex);
    });

    if (user) {
      // Logged-in user
      if (btnPrev) btnPrev.classList.remove('hidden');
      if (btnNext) btnNext.classList.remove('hidden');
      if (counter) counter.classList.remove('hidden');
      if (btnRegister) btnRegister.classList.add('hidden');
      if (btnClose) btnClose.classList.add('hidden');

      if (counter) counter.textContent = `Tip ${currentIndex + 1} de ${totalTips}`;
      if (btnPrev) btnPrev.disabled = currentIndex === 0;
      if (btnNext) btnNext.disabled = currentIndex === totalTips - 1;

    } else {
      // Logged-out user
      if (btnPrev) btnPrev.classList.add('hidden');
      if (btnNext) btnNext.classList.add('hidden');
      if (counter) counter.classList.add('hidden');
      if (btnRegister) btnRegister.classList.remove('hidden');
      if (btnClose) btnClose.classList.remove('hidden'); // Show the default close button

      // Only show the first tip
      currentIndex = 0;
      tips.forEach((tip, index) => {
        tip.classList.toggle('hidden', index !== 0);
      });
    }
  }

  // --- Event Listeners ---
  if (btnNext) {
    btnNext.addEventListener('click', () => {
      if (currentIndex < totalTips - 1) {
        currentIndex++;
        updateView(auth.currentUser);
      }
    });
  }

  if (btnPrev) {
    btnPrev.addEventListener('click', () => {
      if (currentIndex > 0) {
        currentIndex--;
        updateView(auth.currentUser);
      }
    });
  }
  
  // Also update when auth state changes (e.g. user logs in/out while modal is open)
  // and when the modal is opened.
  const modalObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.attributeName === 'open' && modal.open) {
         // Reset to first tip and update view based on current auth state
        currentIndex = 0;
        updateView(auth.currentUser);
      }
    });
  });

  modalObserver.observe(modal, { attributes: true });
  
  // Initial setup in case modal is already open on load (less likely but safe)
  updateView(auth.currentUser);
}
