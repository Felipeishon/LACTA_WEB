export function initModales() {
  const modales = {
    registroPadre: document.getElementById('modalRegistroPadre'),
    registroPrestador: document.getElementById('modalRegistroPrestador'),
    agendarCita: document.getElementById('modalAgendarCita'),
    calendario: document.getElementById('modalCalendario') || document.getElementById('modalCalendarioAnon'),
    login: document.getElementById('modalLogin')
  };

  const btnAbrirPadre = document.getElementById('btnAbrirModalRegistroPadre');
  const btnAbrirPrestador = document.getElementById('btnAbrirModalRegistroPrestador');
  const btnAbrirCita = document.getElementById('btnAbrirModalAgendarCita');
  const btnAbrirCalendario = document.getElementById('btnAbrirModalCalendario') || document.getElementById('btnAbrirModalCalendarioAnon');
  const btnAbrirLogin = document.getElementById('btnAbrirModalLogin');

  const btnsCerrar = document.querySelectorAll('.btnCerrarModal');

  if (btnAbrirPadre) btnAbrirPadre.addEventListener('click', () => modales.registroPadre?.showModal());
  if (btnAbrirPrestador) btnAbrirPrestador.addEventListener('click', () => modales.registroPrestador?.showModal());
  if (btnAbrirCita) btnAbrirCita.addEventListener('click', () => modales.agendarCita?.showModal());
  if (btnAbrirLogin) btnAbrirLogin.addEventListener('click', () => modales.login?.showModal());

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
