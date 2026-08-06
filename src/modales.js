export function initModales() {
  const modales = {
    registroPadre: document.getElementById('modalRegistroPadre'),
    registroPrestador: document.getElementById('modalRegistroPrestador'),
    agendarCita: document.getElementById('modalAgendarCita'),
    calendario: document.getElementById('modalCalendario') || document.getElementById('modalCalendarioAnon'),
    login: document.getElementById('modalLogin'),
    tipsLactancia: document.getElementById('modalTipsLactancia')
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
