import { db, auth } from './firebase.js';
import { collection, addDoc } from 'firebase/firestore';
import { getActiveProfessionals, getAvailableHoursForProfessional } from './api/firestore.js';
import { showToast } from './ui/notifications.js';
import { formatRut } from './rut.js';
import { initAuthHandlers } from './auth.js';

export function initFormularios() {
  const formReserva = document.getElementById('reservaForm');
  const servicio = document.getElementById('servicio') || document.getElementById('servicioAnon');
  const fechaInput = document.getElementById('fecha') || document.getElementById('fechaAnon');
  const hora = document.getElementById('horaCita') || document.getElementById('hora') || document.getElementById('horaAnon');
  const aviso = document.getElementById('avisoHorario') || document.getElementById('avisoHorarioAnon');
  const avisoReserva = document.getElementById('avisoReserva') || document.getElementById('avisoReservaAnon');
  const modalAgendarCita = document.getElementById('modalAgendarCita');

  const profesionalSelect = document.getElementById('profesionalId') || document.getElementById('profesionalIdAnon') || document.getElementById('profesional');
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
        // also reset downstream controls
        if (fechaInput) { fechaInput.value = ''; fechaInput.disabled = true; }
        if (hora) { hora.innerHTML = '<option value="">Selecciona fecha y profesional primero</option>'; hora.disabled = true; }
        return;
      }
      // valores esperados: 'cuidadora' o 'consejera'
      const rolStr = selectedService;
      profesionalSelect.innerHTML = '<option value="">Cargando profesionales...</option>';
      labelProfesional.classList.remove('hidden');
      profesionalSelect.disabled = true;
      
      try {
        // Intentamos obtener profesionales con un reintento simple
        let profesionales = [];
        let lastErr = null;
        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            profesionales = await getActiveProfessionals(rolStr);
            lastErr = null;
            break;
          } catch (err) {
            lastErr = err;
            console.warn(`Intento ${attempt + 1} fallido al cargar profesionales:`, err);
            // pequeña espera antes de reintentar
            await new Promise(r => setTimeout(r, 300));
          }
        }

        profesionalSelect.innerHTML = '<option value="">Selecciona profesional...</option>';
        if (lastErr) {
          console.error('Error al obtener profesionales después de reintentos:', lastErr);
          profesionalSelect.innerHTML = '<option value="">Error al cargar profesionales</option>';
          profesionalSelect.disabled = true;
          labelProfesional.classList.remove('hidden');
          if (typeof showToast === 'function') showToast('No se pudieron cargar los profesionales. Revisa la consola.', 'error');
          // reset downstream controls
          if (fechaInput) { fechaInput.value = ''; fechaInput.disabled = true; }
          if (hora) { hora.innerHTML = '<option value="">Selecciona fecha y profesional primero</option>'; hora.disabled = true; }
          return;
        }

        if (!Array.isArray(profesionales) || profesionales.length === 0) {
          profesionalSelect.innerHTML = '<option value="">No hay profesionales disponibles</option>';
          profesionalSelect.disabled = true;
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
          // reset downstream controls until user picks profesional
          if (fechaInput) { fechaInput.value = ''; fechaInput.disabled = true; }
          if (hora) { hora.innerHTML = '<option value="">Selecciona fecha y profesional primero</option>'; hora.disabled = true; }
        }
      } catch (errOuter) {
        console.error('Error inesperado al cargar profesionales:', errOuter);
        profesionalSelect.innerHTML = '<option value="">Error al cargar profesionales</option>';
        profesionalSelect.disabled = true;
        if (typeof showToast === 'function') showToast('Error al cargar profesionales. Revisa la consola.', 'error');
      }
    });
  }

  // Cuando se selecciona profesional, habilitamos la fecha
  if (profesionalSelect && fechaInput) {
    profesionalSelect.addEventListener('change', (e) => {
      const profId = e.target.value;
      if (!profId) {
        fechaInput.value = '';
        fechaInput.disabled = true;
        if (hora) { hora.innerHTML = '<option value="">Selecciona fecha y profesional primero</option>'; hora.disabled = true; }
        return;
      }
      // Habilitar la fecha y fijar 'min' a hoy para evitar fechas pasadas
      fechaInput.disabled = false;
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      fechaInput.min = `${yyyy}-${mm}-${dd}`;
      // Clear previous date/hour
      fechaInput.value = '';
      if (hora) { hora.innerHTML = '<option value="">Selecciona fecha y profesional primero</option>'; hora.disabled = true; }
    });
  }

  // Al cambiar la fecha, consultamos disponibilidad y llenamos horas
  if (fechaInput && hora && profesionalSelect) {
    fechaInput.addEventListener('change', async (e) => {
      const fechaVal = e.target.value; // formato YYYY-MM-DD
      const profId = profesionalSelect.value;
      hora.innerHTML = '<option value="">Cargando horarios...</option>';
      hora.disabled = true;
      if (!fechaVal || !profId) {
        hora.innerHTML = '<option value="">Selecciona fecha y profesional primero</option>';
        return;
      }

      try {
        // Llamamos a la función que consulta la disponibilidad real en Firestore
        const available = await getAvailableHoursForProfessional(profId, fechaVal);
        if (!available || available.length === 0) {
          hora.innerHTML = '<option value="">No hay horarios disponibles</option>';
        } else {
          hora.innerHTML = '<option value="">Selecciona horario...</option>';
          available.forEach(h => {
            const opt = document.createElement('option');
            opt.value = h; // formato 'HH:MM'
            opt.textContent = h;
            hora.appendChild(opt);
          });
          hora.disabled = false;
        }
      } catch (err) {
        console.error(err);
        hora.innerHTML = '<option value="">Error al obtener horarios</option>';
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

    if (tipo === 'cuidadora') {
      aviso.textContent = 'Las cuidadoras están disponibles 24/7.';
      return true;
    }

    if (tipo === 'consejera') {
      if (!fechaVal) return true;
      const dateObj = new Date(fechaVal + 'T00:00');
      const day = dateObj.getDay();

      if (day === 0) {
        aviso.textContent = 'Las consejeras no atienden los domingos.';
        return false;
      }
      // límites por día: L-V 08:00-18:00, Sáb 09:00-17:00
      if (horaVal) {
        const [hh] = horaVal.split(':');
        const hour = parseInt(hh, 10);
        if (day >= 1 && day <= 5) {
          if (hour < 8 || hour > 18) { aviso.textContent = 'Horario: 08:00 a 18:00'; return false; }
        } else if (day === 6) {
          if (hour < 9 || hour > 17) { aviso.textContent = 'Horario: 09:00 a 17:00'; return false; }
        }
      }
    }
    return true;
  }

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

      // Validación para asegurar que se ha seleccionado un profesional
      if (profesionalSelect && !profesionalSelect.disabled && !profesionalSelect.value) {
        showToast('Debes seleccionar un profesional para continuar.', 'warning');
        if (avisoReserva) avisoReserva.textContent = "Por favor, selecciona un profesional.";
        return;
      }

      const btnSubmit = formReserva.querySelector('button[type="submit"]');
      const originalText = btnSubmit.textContent;

      const data = Object.fromEntries(new FormData(formReserva).entries());
      const currentUser = auth.currentUser;

      // Capturar explícitamente el ID y nombre del profesional para asegurar que se guarde.
      if (profesionalSelect && profesionalSelect.value) {
         const selectedOption = profesionalSelect.options[profesionalSelect.selectedIndex];
         data.profesionalId = profesionalSelect.value;
         data.profesionalNombre = selectedOption.dataset.nombre || selectedOption.textContent;
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
        window.setTimeout(() => {
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