import { db, auth } from './firebase.js';
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';
import { getActiveProfessionals, getAvailableHoursForProfessional } from './api/firestore.js';
import { showToast } from './ui/notifications.js';
import { formatRut } from './rut.js';
import { initAuthHandlers } from './auth.js';
import { calcularCostoServicio } from './utils/pricing.js';

export function initFormularios() {
  const formReserva = document.getElementById('reservaForm');
  const servicio = document.getElementById('servicio') || document.getElementById('servicioAnon');
  const fechaInput = document.getElementById('fecha') || document.getElementById('fechaAnon');
  const hora = document.getElementById('horaCita') || document.getElementById('hora') || document.getElementById('horaAnon');
  
  // Nuevos campos opcionales o esperados para fecha/hora de término
  const fechaFinInput = document.getElementById('fechaFin') || document.getElementById('fechaFinAnon');
  const horaFinInput = document.getElementById('horaFin') || document.getElementById('horaFinAnon');
  
  const aviso = document.getElementById('avisoHorario') || document.getElementById('avisoHorarioAnon');
  const avisoReserva = document.getElementById('avisoReserva') || document.getElementById('avisoReservaAnon');
  const modalAgendarCita = document.getElementById('modalAgendarCita');

  const profesionalSelect = document.getElementById('profesionalId') || document.getElementById('profesionalIdAnon') || document.getElementById('profesional');
  const labelProfesional = document.getElementById('labelProfesional') || document.getElementById('labelProfesionalAnon');

  // Contenedor visual para el resumen del precio estimado en el modal
  const resumenPrecioDiv = document.getElementById('resumenPrecio');
  const spanPrecioTotal = document.getElementById('precioTotal');
  const spanPrecioDesglose = document.getElementById('precioDesglose');
  let profesionalTarifasCache = null;

  initAuthHandlers();

  if (servicio && profesionalSelect) {
    servicio.addEventListener('change', async (e) => {
      const selectedService = e.target.value;
      if (!selectedService) {
        labelProfesional.classList.add('hidden');
        profesionalSelect.disabled = true;
        profesionalSelect.innerHTML = '<option value="">Selecciona profesional...</option>';
        if (fechaInput) { fechaInput.value = ''; fechaInput.disabled = true; }
        if (hora) { hora.innerHTML = '<option value="">Selecciona fecha y profesional primero</option>'; hora.disabled = true; }
        return;
      }
      
      const rolStr = selectedService;
      profesionalSelect.innerHTML = '<option value="">Cargando profesionales...</option>';
      labelProfesional.classList.remove('hidden');
      profesionalSelect.disabled = true;
      
      try {
        let profesionales = [];
        let lastErr = null;
        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            profesionales = await getActiveProfessionals(rolStr);
            lastErr = null;
            break;
          } catch (err) {
            lastErr = err;
            await new Promise(r => setTimeout(r, 300));
          }
        }

        profesionalSelect.innerHTML = '<option value="">Selecciona profesional...</option>';
        if (lastErr) {
          profesionalSelect.innerHTML = '<option value="">Error al cargar profesionales</option>';
          profesionalSelect.disabled = true;
          labelProfesional.classList.remove('hidden');
          if (typeof showToast === 'function') showToast('No se pudieron cargar los profesionales.', 'error');
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
             opt.dataset.nombre = p.nombre;
             opt.textContent = p.nombre;
             profesionalSelect.appendChild(opt);
          });
          profesionalSelect.disabled = false;
          if (fechaInput) { fechaInput.value = ''; fechaInput.disabled = true; }
          if (hora) { hora.innerHTML = '<option value="">Selecciona fecha y profesional primero</option>'; hora.disabled = true; }
        }
      } catch (errOuter) {
        profesionalSelect.innerHTML = '<option value="">Error al cargar profesionales</option>';
        profesionalSelect.disabled = true;
      }
    });
  }

  // Al seleccionar profesional, precargamos sus tarifas desde Firestore
  if (profesionalSelect) {
    profesionalSelect.addEventListener('change', async (e) => {
      const profId = e.target.value;
      profesionalTarifasCache = null; 
      if (resumenPrecioDiv) resumenPrecioDiv.classList.add('hidden');

      if (!profId) {
        if (fechaInput) { fechaInput.value = ''; fechaInput.disabled = true; }
        if (hora) { hora.innerHTML = '<option value="">Selecciona fecha y profesional primero</option>'; hora.disabled = true; }
        return;
      }

      fechaInput.disabled = false;
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      fechaInput.min = `${yyyy}-${mm}-${dd}`;
      fechaInput.value = '';
      if (hora) { hora.innerHTML = '<option value="">Selecciona fecha y profesional primero</option>'; hora.disabled = true; }

      // Obtener tarifas del profesional seleccionado
      try {
        const docSnap = await getDoc(doc(db, 'usuarios', profId));
        if (docSnap.exists() && docSnap.data().tarifas) {
           profesionalTarifasCache = docSnap.data().tarifas;
        }
      } catch(err) {
        console.error("Error al cargar tarifas del profesional:", err);
      }
    });
  }

  if (fechaInput && hora && profesionalSelect) {
    fechaInput.addEventListener('change', async (e) => {
      const fechaVal = e.target.value;
      const profId = profesionalSelect.value;
      hora.innerHTML = '<option value="">Cargando horarios...</option>';
      hora.disabled = true;
      if (!fechaVal || !profId) {
        hora.innerHTML = '<option value="">Selecciona fecha y profesional primero</option>';
        return;
      }

      try {
        const available = await getAvailableHoursForProfessional(profId, fechaVal);
        if (!available || available.length === 0) {
          hora.innerHTML = '<option value="">No hay horarios disponibles</option>';
        } else {
          hora.innerHTML = '<option value="">Selecciona horario...</option>';
          available.forEach(h => {
            const opt = document.createElement('option');
            opt.value = h;
            opt.textContent = h;
            hora.appendChild(opt);
          });
          hora.disabled = false;
        }
      } catch (err) {
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

  function procesarCalculoCita() {
    const esValido = validarHorario(); 
    if (!esValido) {
      if (resumenPrecioDiv) resumenPrecioDiv.classList.add('hidden');
      return false;
    }

    // Si el HTML no tiene implementados inputs de fin, estimamos por defecto 1 hora para cálculo en vivo
    const fFinVal = fechaFinInput?.value || fechaInput?.value;
    const hFinVal = horaFinInput?.value || (hora?.value ? `${parseInt(hora.value.split(':')[0]) + 1}:00`.padStart(5, '0') : null);

    if (!fechaInput?.value || !hora?.value || !fFinVal || !hFinVal || !profesionalTarifasCache) {
      if (resumenPrecioDiv) resumenPrecioDiv.classList.add('hidden');
      return true;
    }

    const dateInicio = new Date(`${fechaInput.value}T${hora.value}:00`);
    const dateFin = new Date(`${fFinVal}T${hFinVal}:00`);

    if (dateFin <= dateInicio) {
       aviso.textContent = 'La fecha/hora de fin debe ser posterior a la de inicio.';
       if (resumenPrecioDiv) resumenPrecioDiv.classList.add('hidden');
       return false;
    }

    const tipo = servicio?.value;
    let tarifasAplicables = { baseHora: 0, finDeSemanaHora: 0, festivoHora: 0 };
    
    if (tipo === 'cuidadora') {
       tarifasAplicables = {
         baseHora: profesionalTarifasCache.cuidadoraBase || 0,
         finDeSemanaHora: profesionalTarifasCache.cuidadoraFinde || 0,
         festivoHora: profesionalTarifasCache.cuidadoraFinde || 0
       };
    } else if (tipo === 'consejera') {
       tarifasAplicables = {
         baseHora: profesionalTarifasCache.consejeraPresencialBase || 0,
         finDeSemanaHora: profesionalTarifasCache.consejeraPresencialFinde || 0,
         festivoHora: profesionalTarifasCache.consejeraPresencialFinde || 0
       };
    }

    const cotizacion = calcularCostoServicio(dateInicio, dateFin, tarifasAplicables);

    if (resumenPrecioDiv && spanPrecioTotal && spanPrecioDesglose) {
       spanPrecioTotal.textContent = `$${cotizacion.total.toLocaleString('cl-CL')}`;
       spanPrecioDesglose.textContent = cotizacion.desglose;
       resumenPrecioDiv.classList.remove('hidden');
    }

    return true;
  }

  if (servicio) servicio.addEventListener('change', procesarCalculoCita);
  if (fechaInput) fechaInput.addEventListener('change', procesarCalculoCita);
  if (hora) hora.addEventListener('change', procesarCalculoCita);
  if (fechaFinInput) fechaFinInput.addEventListener('change', procesarCalculoCita);
  if (horaFinInput) horaFinInput.addEventListener('change', procesarCalculoCita);

  if (formReserva) {
    formReserva.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (!procesarCalculoCita()) {
        if (avisoReserva) avisoReserva.textContent = "Por favor, corrige el horario seleccionado.";
        return;
      }

      if (profesionalSelect && !profesionalSelect.disabled && !profesionalSelect.value) {
        showToast('Debes seleccionar un profesional para continuar.', 'warning');
        if (avisoReserva) avisoReserva.textContent = "Por favor, selecciona un profesional.";
        return;
      }

      const btnSubmit = formReserva.querySelector('button[type="submit"]');
      const originalText = btnSubmit.textContent;

      const data = Object.fromEntries(new FormData(formReserva).entries());
      const currentUser = auth.currentUser;

      if (profesionalSelect && profesionalSelect.value) {
         const selectedOption = profesionalSelect.options[profesionalSelect.selectedIndex];
         data.profesionalId = profesionalSelect.value;
         data.profesionalNombre = selectedOption.dataset.nombre || selectedOption.textContent;
      }

      // Calcular costo final para asegurar que se guarde correctamente en la base de datos
      let costoFinalGuardado = 0;
      if (fechaInput?.value && hora?.value && profesionalTarifasCache) {
          const fFinVal = fechaFinInput?.value || fechaInput.value;
          const hFinVal = horaFinInput?.value || `${parseInt(hora.value.split(':')[0]) + 1}:00`.padStart(5, '0');
          
          const start = new Date(`${fechaInput.value}T${hora.value}:00`);
          const end = new Date(`${fFinVal}T${hFinVal}:00`);
          const rolVal = servicio.value;
          
          let objTarifas = {};
          if (rolVal === 'cuidadora') {
            objTarifas = { baseHora: profesionalTarifasCache.cuidadoraBase || 0, finDeSemanaHora: profesionalTarifasCache.cuidadoraFinde || 0, festivoHora: profesionalTarifasCache.cuidadoraFinde || 0 };
          } else if (rolVal === 'consejera') {
            objTarifas = { baseHora: profesionalTarifasCache.consejeraPresencialBase || 0, finDeSemanaHora: profesionalTarifasCache.consejeraPresencialFinde || 0, festivoHora: profesionalTarifasCache.consejeraPresencialFinde || 0 };
          }
          
          const costo = calcularCostoServicio(start, end, objTarifas);
          costoFinalGuardado = costo.total;
      }

      btnSubmit.textContent = 'Enviando...';
      btnSubmit.disabled = true;

      try {
        await addDoc(collection(db, "reservas"), {
          ...data,
          uid: currentUser ? currentUser.uid : null,
          email: currentUser ? currentUser.email : (data.email || 'Anónimo'),
          costoTotal: costoFinalGuardado,
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