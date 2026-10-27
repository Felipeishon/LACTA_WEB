export async function showConfirmModal(title, message, isDanger = true) {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4';
  modal.innerHTML = `
    <div class="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center">
      <div class="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">⚠️</div>
      <h3 class="text-xl font-black text-[#181411] mb-2"></h3>
      <p class="text-sm text-gray-600 mb-6"></p>
      <div class="flex gap-3 justify-center">
        <button class="confirm-cancel px-5 py-2 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition">Cancelar</button>
        <button class="confirm-accept px-5 py-2 rounded-xl text-sm font-bold text-white shadow-md transition"></button>
      </div>
    </div>
  `;

  modal.querySelector('h3').textContent = title;
  modal.querySelector('p').textContent = message;
  const acceptButton = modal.querySelector('.confirm-accept');
  acceptButton.classList.add(...(isDanger ? ['bg-red-500', 'hover:bg-red-600'] : ['bg-[#e87a30]', 'hover:bg-[#d66a20]']));
  acceptButton.textContent = 'Sí, confirmar';
  document.body.appendChild(modal);

  return new Promise(resolve => {
    const finish = (confirmed) => {
      document.removeEventListener('keydown', handleKeydown);
      modal.remove();
      resolve(confirmed);
    };
    const handleKeydown = (event) => {
      if (event.key === 'Escape') finish(false);
    };

    modal.querySelector('.confirm-cancel').addEventListener('click', () => finish(false));
    acceptButton.addEventListener('click', () => finish(true));
    modal.addEventListener('click', (event) => {
      if (event.target === modal) finish(false);
    });
    document.addEventListener('keydown', handleKeydown);
  });
}

export function initModales() {
  document.querySelectorAll('.btn-toggle-password').forEach(button => {
    button.addEventListener('click', () => {
      const input = button.previousElementSibling;
      const icon = button.querySelector('i');

      if (!(input instanceof HTMLInputElement) || !icon) return;

      const showPassword = input.type === 'password';
      input.type = showPassword ? 'text' : 'password';
      icon.classList.toggle('fa-eye', !showPassword);
      icon.classList.toggle('fa-eye-slash', showPassword);
    });
  });

  const modales = {
    registroPadre: document.getElementById('modalRegistroPadre'),
    registroPrestador: document.getElementById('modalRegistroPrestador'),
    agendarCita: document.getElementById('modalAgendarCita'),
    calendario: document.getElementById('modalCalendario') || document.getElementById('modalCalendarioAnon'),
    login: document.getElementById('modalLogin'),
    tipsLactancia: document.getElementById('modalTipsLactancia'),
    edicionUsuario: document.getElementById('modalEdicionUsuario')
  };

  // Botones para abrir modales (pueden no existir en todas las páginas)
  const btnAbrirPadre = document.getElementById('btnAbrirModalRegistroPadre') || document.getElementById('btnMobileRegistro');
  const btnAbrirLogin = document.getElementById('btnAbrirModalLogin') || document.getElementById('btnMobileLogin');
  const btnAbrirCita = document.getElementById('btnAbrirModalAgendarCita'); // Solo en mi-cuenta

  if(btnAbrirPadre) btnAbrirPadre.addEventListener('click', () => modales.registroPadre?.showModal());
  if(btnAbrirLogin) btnAbrirLogin.addEventListener('click', () => modales.login?.showModal());
  if(btnAbrirCita) btnAbrirCita.addEventListener('click', () => modales.agendarCita?.showModal());

  // Botones dentro del modal de tips
  const btnCerrarTips = document.getElementById('btnCerrarTips');
  const btnEntendidoTips = document.getElementById('btnEntendidoTips');
  if (btnCerrarTips) btnCerrarTips.addEventListener('click', () => modales.tipsLactancia?.close());
  if (btnEntendidoTips) btnEntendidoTips.addEventListener('click', () => modales.tipsLactancia?.close());

  // Lógica para saltar del registro de padre al de prestador
  const linkPrestador = document.getElementById('linkCambiarAPrestador');
  if (linkPrestador) {
    linkPrestador.addEventListener('click', () => {
      modales.registroPadre?.close();
      modales.registroPrestador?.showModal();
    });
  }

  // Lógica para saltar del login al registro
  const linkRegistrateGratis = document.getElementById('linkRegistrateGratis');
  if (linkRegistrateGratis) {
    linkRegistrateGratis.addEventListener('click', () => {
      modales.login?.close();
      modales.registroPadre?.showModal();
    });
  }

  // Botones genéricos para cerrar cualquier modal
  const btnsCerrar = document.querySelectorAll('.btnCerrarModal');
  btnsCerrar.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.target.closest('dialog')?.close();
    });
  });

  // Cerrar al hacer clic en el fondo oscuro (backdrop)
  Object.values(modales).forEach(modal => {
    if (modal) {
      modal.addEventListener('click', (e) => {
        const dialogDimensions = modal.getBoundingClientRect();
        if (
          e.clientX < dialogDimensions.left ||
          e.clientX > dialogDimensions.right ||
          e.clientY < dialogDimensions.top ||
          e.clientY > dialogDimensions.bottom
        ) {
          modal.close();
        }
      });
    }
  });
}
