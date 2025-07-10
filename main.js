// Calendario simple interactivo

const calendario = document.getElementById('calendario');
const meses = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];
let fechaActual = new Date();
let diaSeleccionado = null;

function renderCalendario(fecha) {
  calendario.innerHTML = '';
  const year = fecha.getFullYear();
  const month = fecha.getMonth();

  // Header
  const header = document.createElement('div');
  header.className = 'calendario-header';
  const btnPrev = document.createElement('button');
  btnPrev.innerHTML = '‹';
  btnPrev.setAttribute('aria-label', 'Mes anterior');
  btnPrev.onclick = () => cambiarMes(-1);

  const titulo = document.createElement('span');
  titulo.textContent = `${meses[month]} ${year}`;

  const btnNext = document.createElement('button');
  btnNext.innerHTML = '›';
  btnNext.setAttribute('aria-label', 'Mes siguiente');
  btnNext.onclick = () => cambiarMes(1);

  header.appendChild(btnPrev);
  header.appendChild(titulo);
  header.appendChild(btnNext);
  calendario.appendChild(header);

  // Grid días
  const grid = document.createElement('div');
  grid.className = 'calendario-grid';

  // Nombres días
  const dias = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
  dias.forEach(d => {
    const dayName = document.createElement('div');
    dayName.className = 'day-name';
    dayName.textContent = d;
    grid.appendChild(dayName);
  });

  // Días vacíos antes del primer día
  const primerDia = new Date(year, month, 1).getDay();
  for (let i = 0; i < primerDia; i++) {
    grid.appendChild(document.createElement('div'));
  }

  // Días del mes
  const diasMes = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= diasMes; d++) {
    const btnDia = document.createElement('button');
    btnDia.textContent = d;
    btnDia.setAttribute('aria-label', `Seleccionar ${d} de ${meses[month]}`);
    if (
      diaSeleccionado &&
      diaSeleccionado.getFullYear() === year &&
      diaSeleccionado.getMonth() === month &&
      diaSeleccionado.getDate() === d
    ) {
      btnDia.classList.add('selected');
    }
    btnDia.onclick = () => seleccionarDia(new Date(year, month, d));
    grid.appendChild(btnDia);
  }

  calendario.appendChild(grid);
}

function cambiarMes(delta) {
  fechaActual.setMonth(fechaActual.getMonth() + delta);
  renderCalendario(fechaActual);
}

function seleccionarDia(fecha) {
  diaSeleccionado = fecha;
  renderCalendario(fechaActual);
  alert(`Has seleccionado el ${fecha.getDate()} de ${meses[fecha.getMonth()]} de ${fecha.getFullYear()}`);
}

// Tabs
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', function () {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    this.classList.add('active');
    // Aquí podrías cambiar el calendario según el tipo de reserva
  });
});

// Inicializar calendario
renderCalendario(fechaActual);
document.addEventListener('DOMContentLoaded', function () {
  const servicio = document.getElementById('servicio');
  const fecha = document.getElementById('fecha');
  const hora = document.getElementById('hora');
  const aviso = document.getElementById('avisoHorario');
  const avisoReserva = document.getElementById('avisoReserva');
  const form = document.getElementById('reservaForm');
  const btnEliminar = document.getElementById('eliminarReserva');

  function getReservaKey() {
    return `${servicio.value}|${fecha.value}|${hora.value}`;
  }

  function validarHorario() {
    const tipo = servicio.value;
    const fechaVal = fecha.value;
    const horaVal = hora.value;
    aviso.textContent = '';
    avisoReserva.textContent = '';

    if (tipo === 'Cuidador') {
      hora.min = '';
      hora.max = '';
      aviso.textContent = 'Las cuidadoras están disponibles 24/7.';
      return true;
    }

    if (tipo === 'Consultor') {
      if (!fechaVal) {
        aviso.textContent = 'Selecciona una fecha para ver los horarios disponibles.';
        return false;
      }
      const dateObj = new Date(fechaVal + 'T00:00');
      const day = dateObj.getDay(); // 0=Dom, 1=Lun, ..., 6=Sab

      if (day === 0) {
        aviso.textContent = 'Los consultores no atienden los domingos. Elige otro día.';
        return false;
      }
      if (day >= 1 && day <= 5) {
        hora.min = '08:00';
        hora.max = '18:00';
        aviso.textContent = 'Horario consultor: Lunes a Viernes de 08:00 a 18:00.';
        if (horaVal && (horaVal < '08:00' || horaVal > '18:00')) {
          aviso.textContent += ' Selecciona una hora entre 08:00 y 18:00.';
          return false;
        }
      } else if (day === 6) {
        hora.min = '09:00';
        hora.max = '17:00';
        aviso.textContent = 'Horario consultor: Sábado de 09:00 a 17:00.';
        if (horaVal && (horaVal < '09:00' || horaVal > '17:00')) {
          aviso.textContent += ' Selecciona una hora entre 09:00 y 17:00.';
          return false;
        }
      }
      return true;
    }
    aviso.textContent = '';
    return true;
  }

  function checkReservaLocal() {
    const key = getReservaKey();
    if (localStorage.getItem('reservaNidoNutrir') === key) {
      avisoReserva.textContent = 'Ya tienes una reserva para este servicio, fecha y hora. Si quieres cambiarla, elimina tu reserva primero.';
      btnEliminar.classList.remove('hidden');
      return false;
    }
    avisoReserva.textContent = '';
    btnEliminar.classList.add('hidden');
    return true;
  }

  servicio.addEventListener('change', () => {
    validarHorario();
    checkReservaLocal();
  });
  fecha.addEventListener('change', () => {
    validarHorario();
    checkReservaLocal();
  });
  hora.addEventListener('change', () => {
    validarHorario();
    checkReservaLocal();
  });

  form.addEventListener('submit', function (e) {
    if (!validarHorario() || !checkReservaLocal()) {
      e.preventDefault();
      avisoReserva.textContent += ' Corrige los datos antes de enviar.';
      return;
    }
    // Guarda la reserva en localStorage
    localStorage.setItem('reservaNidoNutrir', getReservaKey());
    btnEliminar.classList.remove('hidden');
    avisoReserva.textContent = 'Reserva guardada en este navegador.';
    // El formulario sigue su curso (envío por mailto)
  });

  btnEliminar.addEventListener('click', function () {
    localStorage.removeItem('reservaNidoNutrir');
    avisoReserva.textContent = 'Reserva eliminada. Ahora puedes reservar otra fecha/hora.';
    btnEliminar.classList.add('hidden');
  });

  // Mostrar botón eliminar si ya hay reserva
  if (localStorage.getItem('reservaNidoNutrir')) {
    btnEliminar.classList.remove('hidden');
  }
});