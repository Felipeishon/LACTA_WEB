const meses = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];
let fechaActualCalendario = new Date();
let diaSeleccionadoCalendario = null;

export function initCalendario() {
  const btnAbrirCalendario = document.getElementById('btnAbrirModalCalendario') || document.getElementById('btnAbrirModalCalendarioAnon');
  const modalCalendario = document.getElementById('modalCalendario') || document.getElementById('modalCalendarioAnon');
  const fechaInputFormulario = document.getElementById('fecha') || document.getElementById('fechaAnon');

  if (btnAbrirCalendario && modalCalendario) {
    btnAbrirCalendario.addEventListener('click', () => {
      if (fechaInputFormulario && fechaInputFormulario.value) {
        const parts = fechaInputFormulario.value.split('-');
        fechaActualCalendario = new Date(parts[0], parts[1] - 1, parts[2]);
        diaSeleccionadoCalendario = new Date(parts[0], parts[1] - 1, parts[2]);
      } else {
        fechaActualCalendario = new Date();
        diaSeleccionadoCalendario = null;
      }
      renderizarCalendarioEnModal(fechaActualCalendario, modalCalendario.id === 'modalCalendarioAnon');
      modalCalendario.showModal();
    });
  }
}

function renderizarCalendarioEnModal(dateObj, isAnon = false) {
  const calendarioContainer = document.getElementById('calendarioContainer');
  if (!calendarioContainer) return;
  calendarioContainer.innerHTML = '';

  const year = dateObj.getFullYear();
  const month = dateObj.getMonth();

  const header = document.createElement('div');
  header.className = 'calendario-header';

  const btnPrev = document.createElement('button');
  btnPrev.innerHTML = '‹';
  btnPrev.type = 'button';
  btnPrev.onclick = () => cambiarMesModal(-1, isAnon);

  const titulo = document.createElement('span');
  titulo.textContent = `${meses[month]} ${year}`;

  const btnNext = document.createElement('button');
  btnNext.innerHTML = '›';
  btnNext.type = 'button';
  btnNext.onclick = () => cambiarMesModal(1, isAnon);

  header.appendChild(btnPrev);
  header.appendChild(titulo);
  header.appendChild(btnNext);
  calendarioContainer.appendChild(header);

  const grid = document.createElement('div');
  grid.className = 'calendario-grid';

  const diasNombres = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
  diasNombres.forEach(d => {
    const dayNameEl = document.createElement('div');
    dayNameEl.className = 'day-name';
    dayNameEl.textContent = d;
    grid.appendChild(dayNameEl);
  });

  const primerDiaDelMes = new Date(year, month, 1).getDay();
  for (let i = 0; i < primerDiaDelMes; i++) {
    grid.appendChild(document.createElement('div'));
  }

  const diasEnMes = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= diasEnMes; d++) {
    const btnDia = document.createElement('button');
    btnDia.textContent = d;
    btnDia.type = 'button';
    if (
      diaSeleccionadoCalendario &&
      diaSeleccionadoCalendario.getFullYear() === year &&
      diaSeleccionadoCalendario.getMonth() === month &&
      diaSeleccionadoCalendario.getDate() === d
    ) {
      btnDia.classList.add('selected');
    }
    btnDia.onclick = () => seleccionarDiaModal(new Date(year, month, d), isAnon);
    grid.appendChild(btnDia);
  }
  calendarioContainer.appendChild(grid);
}

function cambiarMesModal(delta, isAnon) {
  fechaActualCalendario.setMonth(fechaActualCalendario.getMonth() + delta);
  renderizarCalendarioEnModal(fechaActualCalendario, isAnon);
}

function seleccionarDiaModal(selectedDate, isAnon) {
  diaSeleccionadoCalendario = selectedDate;
  const year = selectedDate.getFullYear();
  const month = (selectedDate.getMonth() + 1).toString().padStart(2, '0');
  const day = selectedDate.getDate().toString().padStart(2, '0');
  const fechaFormateada = `${year}-${month}-${day}`;

  const fechaInputFormulario = document.getElementById(isAnon ? 'fechaAnon' : 'fecha');
  if (fechaInputFormulario) {
    fechaInputFormulario.value = fechaFormateada;
    fechaInputFormulario.dispatchEvent(new Event('change'));
  }

  const modalCalendario = document.getElementById(isAnon ? 'modalCalendarioAnon' : 'modalCalendario');
  if (modalCalendario) { modalCalendario.close(); }
}
