import { db, auth } from './firebase.js';
import { collection, addDoc, doc, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { emailService } from './emailService.js';
import { getActiveProfessionals } from './api/firestore.js';

export const formatRut = (value) => {
  let rut = value.replace(/[^\dkK]/g, "");
  if (rut.length < 2) return rut;
  let body = rut.slice(0, -1);
  let dv = rut.slice(-1).toUpperCase();
  body = body.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${body}-${dv}`;
};

export const validarRut = (rut) => {
  if (!/^[0-9.]+[-|‐][0-9kK]{1}$/.test(rut)) return false;
  let tmp = rut.split('-');
  let digv = tmp[1].toLowerCase();
  let rutNum = tmp[0].replace(/\./g, '');
  let M = 0, S = 1;
  for (let t = parseInt(rutNum); t; t = Math.floor(t / 10))
    S = (S + t % 10 * (9 - M++ % 6)) % 11;
  let dvCalculado = S ? (S - 1).toString() : 'k';
  return dvCalculado === digv;
};

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

  const registroPadreForm = document.getElementById('registroPadreForm');
  if (registroPadreForm) {
    registroPadreForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btnSubmit = registroPadreForm.querySelector('button[type="submit"]');
      btnSubmit.disabled = true;
      btnSubmit.textContent = 'Registrando...';
      const data = Object.fromEntries(new FormData(registroPadreForm).entries());

      if (!validarRut(data.rut)) {
        alert('El RUT ingresado no es válido.');
        btnSubmit.disabled = false;
        btnSubmit.textContent = 'Registrarse';
        return;
      }

      try {
        const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
        const user = userCredential.user;
        await setDoc(doc(db, "usuarios", user.uid), {
          uid: user.uid,
          nombre: data.nombre,
          rut: data.rut,
          email: data.email,
          telefono: data.telefono,
          subtipo: data.subtipo,
          rol: 'padre',
          fechaRegistro: new Date().toISOString(),
          estado: 'activo'
        });

        // Enviar correo de bienvenida
        emailService.sendWelcomeParent(data.nombre, data.email);

        alert('¡Bienvenido/a a LactaNido! Registro completado.');
        window.location.href = 'mi-cuenta.html';
      } catch (e) {
        alert('Error al registrar: ' + e.message);
      } finally {
        btnSubmit.disabled = false;
        btnSubmit.textContent = 'Registrarse';
      }
    });
  }

  const registroPrestadorForm = document.getElementById('registroPrestadorForm');
  if (registroPrestadorForm) {
    registroPrestadorForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btnSubmit = registroPrestadorForm.querySelector('button[type="submit"]');
      btnSubmit.disabled = true;
      btnSubmit.textContent = 'Registrando...';
      const formData = new FormData(registroPrestadorForm);
      const data = Object.fromEntries(formData.entries());
      const rolesSeleccionados = formData.getAll('tipo');

      if (!validarRut(data.rut)) {
        alert('El RUT ingresado no es válido.');
        btnSubmit.disabled = false;
        btnSubmit.textContent = 'Registrarse como Prestador';
        return;
      }

      try {
        const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
        const user = userCredential.user;
        await setDoc(doc(db, "usuarios", user.uid), {
          uid: user.uid,
          nombre: data.nombre,
          rut: data.rut,
          email: data.email,
          telefono: data.telefono,
          referencias: data.referencias || '',
          rol: rolesSeleccionados,
          fechaRegistro: new Date().toISOString(),
          estado: 'pendiente'
        });

        // Enviar correo de "Estamos revisando tu perfil"
        emailService.sendPendingPrestador(data.nombre, data.email);

        alert('Registro recibido. Tu perfil será revisado.');
        window.location.href = 'mi-cuenta.html';
      } catch (e) {
        alert('Error al registrar: ' + e.message);
      } finally {
        btnSubmit.disabled = false;
        btnSubmit.textContent = 'Registrarse como Prestador';
      }
    });
  }

  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btnSubmit = loginForm.querySelector('button[type="submit"]');
      btnSubmit.disabled = true;
      btnSubmit.textContent = 'Iniciando sesión...';
      const email = loginForm.querySelector('input[name="email"]').value;
      const password = loginForm.querySelector('input[name="password"]').value;
      try {
        await signInWithEmailAndPassword(auth, email, password);
        window.location.href = 'mi-cuenta.html';
      } catch (error) {
        console.error("Error completo de login:", error);
        alert('Error al iniciar sesión: ' + error.code + " - " + error.message);
      } finally {
        btnSubmit.disabled = false;
        btnSubmit.textContent = 'Iniciar Sesión';
      }
    });
  }

  const btnOlvidasteClave = document.getElementById('btnOlvidasteClave');
  const msgRecuperacion = document.getElementById('msgRecuperacion');
  const msgRecuperacionError = document.getElementById('msgRecuperacionError');

  if (btnOlvidasteClave && loginForm) {
    btnOlvidasteClave.addEventListener('click', async () => {
      const emailInput = loginForm.querySelector('input[name="email"]');
      const email = emailInput.value;
      if (!email) {
        alert('Ingresa tu email primero.');
        return;
      }
      try {
        await sendPasswordResetEmail(auth, email);
        if (msgRecuperacion) msgRecuperacion.classList.remove('hidden');
      } catch (error) {
        if (msgRecuperacionError) msgRecuperacionError.classList.remove('hidden');
      }
    });
  }
}