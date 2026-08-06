import { db, auth } from './firebase.js';
import { doc, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { showToast } from './ui/notifications.js';
import { emailService } from './emailService.js';
import { validarRut } from './rut.js';

export function initAuthHandlers() {
  const registroPadreForm = document.getElementById('registroPadreForm');
  if (registroPadreForm) {
    registroPadreForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btnSubmit = registroPadreForm.querySelector('button[type="submit"]');
      btnSubmit.disabled = true;
      btnSubmit.textContent = 'Registrando...';
      const data = Object.fromEntries(new FormData(registroPadreForm).entries());

      if (!validarRut(data.rut)) {
        showToast('El RUT ingresado no es válido.', 'error');
        btnSubmit.disabled = false;
        btnSubmit.textContent = 'Crear mi cuenta';
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
          // `rol` siempre se guarda como arreglo, incluso con un solo valor,
          // para ser consistente con prestadores (que pueden tener varios roles)
          // y con las reglas de Firestore (isAdmin/isPrestador esperan arreglo).
          rol: ['padre'],
          fechaRegistro: new Date().toISOString(),
          estado: 'activo'
        });

        emailService.sendWelcomeParent(data.nombre, data.email);

        showToast('¡Bienvenido/a a LactaNido! Registro completado.', 'success');
        window.location.href = 'mi-cuenta.html';
      } catch (e) {
        console.error('Registro padre error:', e);
        if (e.code === 'auth/email-already-in-use') {
          showToast('El correo ya está registrado. Intenta iniciar sesión o recuperar la contraseña.', 'warning');
        } else {
          showToast('Error al registrar: ' + e.message, 'error');
        }
      } finally {
        btnSubmit.disabled = false;
        btnSubmit.textContent = 'Crear mi cuenta';
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
        showToast('El RUT ingresado no es válido.', 'error');
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

        emailService.sendPendingPrestador(data.nombre, data.email);

        showToast('Registro recibido. Tu perfil será revisado y te notificaremos.', 'info');
        window.location.href = 'mi-cuenta.html';
      } catch (e) {
        console.error('Registro prestador error:', e);
        if (e.code === 'auth/email-already-in-use') {
          showToast('El correo ya está registrado. Intenta iniciar sesión o recuperar la contraseña.', 'warning');
        } else {
          showToast('Error al registrar: ' + e.message, 'error');
        }
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
        // Mensaje más amigable para el usuario final
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
            showToast('Correo o contraseña incorrectos.', 'error');
        } else {
            showToast('Error al iniciar sesión. Intenta más tarde.', 'error');
        }
      } finally {
        btnSubmit.disabled = false;
        btnSubmit.textContent = 'Entrar';
      }
    });
  }

  const btnOlvidasteClave = document.getElementById('btnOlvidasteClave');
  if (btnOlvidasteClave && loginForm) {
    btnOlvidasteClave.addEventListener('click', async (e) => {
      e.preventDefault();
      const emailInput = loginForm.querySelector('input[name="email"]');
      const email = emailInput.value;
      if (!email) {
        showToast('Por favor, ingresa tu correo electrónico para recuperar la contraseña.', 'info');
        return;
      }

      const btn = e.currentTarget;
      btn.disabled = true;

      try {
        await sendPasswordResetEmail(auth, email);
        showToast('Se ha enviado un correo para restablecer tu contraseña.', 'success');
      } catch (error) {
        console.error("Error al enviar correo de recuperación:", error);
        if (error.code === 'auth/user-not-found') {
            showToast('No se encontró una cuenta con ese correo electrónico.', 'warning');
        } else {
            showToast('No se pudo enviar el correo de recuperación. Intenta más tarde.', 'error');
        }
      } finally {
        btn.disabled = false;
      }
    });
  }
}