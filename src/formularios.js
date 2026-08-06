import { db, auth } from './firebase.js';
import { collection, addDoc } from 'firebase/firestore';
import { getActiveProfessionals } from './api/firestore.js';
import { formatRut } from './rut.js';
import { initAuthHandlers } from './auth.js';

export function initFormularios() {
  const formReserva = document.getElementById('reservaForm');
  const servicio = document.getElementById('servicio') || document.getElementById('servicioAnon');
  const fechaInput = document.getElementById('fecha') || document.getElementById('fechaAnon');
  const hora = document.getElementById('hora') || document.getElementById('horaAnon');
  const aviso = document.getElementById('avisoHorario') || document.getElementById('avisoHorarioAnon');
  const avisoReserva = document.getElementById('avisoReserva') || document.getElementById('avisoReservaAnon');
  const modalAgendarCita = document.getElementById('modalAgendarCita');
  
  const profesionalSelect = document.getElementById('profesional') || document.getElementById('profesionalAnon');
  const labelProfesional = document.getElementById('labelProfesional') || document.getElementById('labelProfesionalAnon');

  // Inicializa los manejadores de formularios de autenticación
  initAuthHandlers();

  if (servicio && profesionalSelect) {
    servicio.addEventListener('change', async (e) => {
      const selectedService = e.target.value;
      if (!selectedService) {
        labelProfesional.classList.add('hidden');
        profesionalSelect.disabled = true;
        profesionalSelect.innerHTML = '<option value="">Selecciona profesional...</option>';
        return;
      }
      
      const rolStr = selectedService === 'Cuidador' ? 'cuidadora' : 'consejera';
      profesionalSelect.innerHTML = '<option value="">Cargando profesionales...</option>';
      labelProfesional.classList.remove('hidden');
      profesionalSelect.disabled = true;
      
      try {
        const profesionales = await getActiveProfessionals(rolStr);
        profesionalSelect.innerHTML = '<option value="">Selecciona profesional...</option>';
        
        if (profesionales.length === 0) {
          profesionalSelect.innerHTML = '<option value="">No hay profesionales disponibles</option>';
        } else {
          profesionales.forEach(p => {
             const opt = document.createElement('option');
             opt.value = p.id;
             // Agregamos data-nombre para guardarlo en la reserva y no solo el ID
             opt.dataset.nombre = p.nombre;
             opt.textContent = p.nombre;
             profesionalSelect.appendChild(opt);
          });
          profesionalSelect.disabled = false;
        }
      } catch (err) {
        profesionalSelect.innerHTML = '<option value="">Error al cargar</option>';
      }
    });
  }

  document.querySelectorAll('.input-rut').forEach(input => {
    input.addEventListener('input', (e) => {
      e.target.value = formatRut(e.target.value);
    });
  });

  function validarHorario() {
    if (!servicio || !fechaInput || !hora || !aviso) return true;
    const tipo = servicio.value;
    const fechaVal = fechaInput.value;
    const horaVal = hora.value;

    aviso.textContent = '';
    if (avisoReserva) avisoReserva.textContent = '';

    if (tipo === 'Cuidador') {
      hora.min = '';
      hora.max = '';
      aviso.textContent = 'Las cuidadoras están disponibles 24/7.';
      return true;
    }

    if (tipo === 'Consultor') {
      if (!fechaVal) return true;
      const dateObj = new Date(fechaVal + 'T00:00');
      const day = dateObj.getDay();

      if (day === 0) {
        aviso.textContent = 'Los consultores no atienden los domingos.';
        return false;
      }
      if (day >= 1 && day <= 5) {
        hora.min = '08:00';
        hora.max = '18:00';
        if (horaVal && (horaVal < '08:00' || horaVal > '18:00')) {
          aviso.textContent = 'Horario: 08:00 a 18:00';
          return false;
        }
      } else if (day === 6) {
        hora.min = '09:00';
        hora.max = '17:00';
        if (horaVal && (horaVal < '09:00' || horaVal > '17:00')) {
          aviso.textContent = 'Horario: 09:00 a 17:00';
          return false;
        }
      }
    }
    return true;
  } // <--- AQUÍ SE CIERRA validarHorario correctamente

  if (servicio) servicio.addEventListener('change', validarHorario);
  if (fechaInput) fechaInput.addEventListener('change', validarHorario);
  if (hora) hora.addEventListener('change', validarHorario);

  if (formReserva) {
    formReserva.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Validar horario antes de enviar
      if (!validarHorario()) {
        if (avisoReserva) avisoReserva.textContent = "Por favor, corrige el horario seleccionado.";
        return;
      }

      const btnSubmit = formReserva.querySelector('button[type="submit"]');
      const originalText = btnSubmit.textContent;

      const data = Object.fromEntries(new FormData(formReserva).entries());
      const currentUser = auth.currentUser;
      
      // Capturar nombre del profesional si existe el select
      if (profesionalSelect && profesionalSelect.selectedIndex > 0) {
         data.profesionalNombre = profesionalSelect.options[profesionalSelect.selectedIndex].dataset.nombre || 'Profesional';
      }

      btnSubmit.textContent = 'Enviando...';
      btnSubmit.disabled = true;

      try {
        await addDoc(collection(db, "reservas"), {
          ...data,
          // Si el usuario está logueado, vinculamos la cita a su cuenta
          uid: currentUser ? currentUser.uid : null,
          // Si está logueado usamos su email de auth, si no, el del formulario
          email: currentUser ? currentUser.email : (data.email || 'Anónimo'),
          creadoEn: new Date().toISOString(),
          estado: 'pendiente'
        });

        if (avisoReserva) avisoReserva.textContent = "Reserva enviada con éxito.";
        formReserva.reset();
        setTimeout(() => {
          modalAgendarCita?.close();
          if (window.location.pathname.includes('mi-cuenta')) {
            window.location.reload();
          }
        }, 1500);
      } catch (err) {
        console.error(err);
        if (avisoReserva) avisoReserva.textContent = "Error al enviar reserva.";
      } finally {
        btnSubmit.disabled = false;
        btnSubmit.textContent = originalText;
      }
    });
  }
}