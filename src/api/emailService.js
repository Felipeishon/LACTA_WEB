import emailjs from '@emailjs/browser';

export const ADMIN_EMAIL = 'contacto@lactanido.cl';

export function formatRolesLabel(roles) {
  const normalizedRoles = Array.isArray(roles) ? roles : [roles].filter(Boolean);
  const isConsejera = normalizedRoles.includes('consejera');
  const isCuidadora = normalizedRoles.includes('cuidadora');

  if (isConsejera && isCuidadora) {
    return 'Perfil Mixto (Consejera de Lactancia y Cuidadora)';
  }
  if (isConsejera) return 'Consejera de Lactancia';
  if (isCuidadora) return 'Cuidadora';
  return '';
}

export async function enviarNotificacionCita(to_email, to_name, subject, message, replyTo = ADMIN_EMAIL) {
  const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
  const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

  if (!serviceId || !templateId || !publicKey) {
    console.warn('No se pudo enviar el correo: faltan credenciales de EmailJS.');
    return null;
  }
  if (!to_email || !String(to_email).includes('@')) {
    console.warn('No se pudo enviar el correo: la dirección destinataria no es válida.');
    return null;
  }

  try {
    return await emailjs.send(
      serviceId,
      templateId,
      { to_email, to_name, subject, message, email: replyTo },
      publicKey
    );
  } catch (error) {
    console.warn('Error al enviar notificación por EmailJS:', error);
    return null;
  }
}

export const emailService = {
  sendWelcomeParent(nombre, email) {
    return enviarNotificacionCita(
      email,
      nombre,
      '¡Bienvenido/a a LactaNido!',
      `Hola ${nombre}, tu registro como padre/madre se completó correctamente. Ya puedes ingresar a tu cuenta y solicitar servicios en LactaNido.`
    );
  },

  sendPendingPrestador(nombre, email, roles) {
    const rolesLabel = formatRolesLabel(roles);
    return enviarNotificacionCita(
      email,
      nombre,
      'Recibimos tu postulación a LactaNido',
      `Hola ${nombre}, recibimos tu postulación como prestadora${rolesLabel ? ` (${rolesLabel})` : ''}. Tu cuenta y perfil están en revisión; te notificaremos cuando se complete el proceso.`
    );
  },

  sendAdminNewPrestadorAlert({ nombre, email, rut, telefono, roles }) {
    const rolesLabel = formatRolesLabel(roles) || 'Sin perfil indicado';
    return enviarNotificacionCita(
      ADMIN_EMAIL,
      'Equipo LactaNido',
      'Nueva prestadora pendiente de aprobación',
      `Hay una nueva prestadora pendiente de aprobación.\n\nNombre: ${nombre}\nEmail: ${email}\nRUT: ${rut}\nTeléfono: ${telefono}\nPerfiles: ${rolesLabel}`
    );
  },

  sendApprovalNotification(nombre, email, roles) {
    const rolesLabel = formatRolesLabel(roles);
    return enviarNotificacionCita(
      email,
      nombre,
      'Tu perfil de LactaNido fue aprobado',
      `Hola ${nombre}, tu cuenta${rolesLabel ? ` y perfil${Array.isArray(roles) && roles.length > 1 ? 'es' : ''} (${rolesLabel})` : ''} fueron aprobados. Ya puedes publicar tu disponibilidad y recibir solicitudes de citas.`
    );
  },

  sendBookingCreatedToProvider({ profId, profEmail, profNombre, padreNombre, servicio, modalidad, fecha, hora }) {
    const isAdminRecipient = !profEmail || profId === 'asignacion_automatica';
    return enviarNotificacionCita(
      isAdminRecipient ? ADMIN_EMAIL : profEmail,
      isAdminRecipient ? 'Equipo LactaNido' : profNombre,
      'Nueva solicitud de cita pendiente de aprobación',
      `Hola ${isAdminRecipient ? 'Equipo LactaNido' : profNombre}, tienes una nueva solicitud de cita pendiente de aprobación${isAdminRecipient ? ' para asignación automática' : ''}.\n\nPadre/madre: ${padreNombre}\nServicio: ${servicio}\nModalidad: ${modalidad}\nFecha: ${fecha}\nHora: ${hora}`
    );
  },

  sendBookingCreatedToParent({ padreEmail, padreNombre, profNombre, servicio, modalidad, fecha, hora }) {
    return enviarNotificacionCita(
      padreEmail,
      padreNombre,
      'Solicitud de cita registrada - LactaNido',
      `Hola ${padreNombre}, tu solicitud de cita quedó registrada en estado Pendiente.\n\nProfesional: ${profNombre}\nServicio: ${servicio}\nModalidad: ${modalidad}\nFecha: ${fecha}\nHora: ${hora}`
    );
  },

  sendBookingApproved({ padreEmail, padreNombre, profNombre, servicio, fecha, hora }) {
    return enviarNotificacionCita(
      padreEmail,
      padreNombre,
      'Tu cita fue aprobada - LactaNido',
      `Hola ${padreNombre}, ${profNombre} aprobó tu cita de ${servicio} para el día ${fecha} a las ${hora}. ¡Te esperamos!`
    );
  },

  sendBookingRejected({ padreEmail, padreNombre, profNombre, servicio, fecha, hora }) {
    return enviarNotificacionCita(
      padreEmail,
      padreNombre,
      'Actualización sobre tu solicitud de cita - LactaNido',
      `Hola ${padreNombre}, ${profNombre} no pudo aceptar tu cita de ${servicio} del día ${fecha} a las ${hora} por un imprevisto de agenda. El horario fue liberado; te invitamos a reagendar desde tu cuenta de LactaNido.`
    );
  },

  sendBookingCancelled({ profEmail, profNombre, padreNombre, servicio, fecha, hora }) {
    const isAdminRecipient = !profEmail;
    return enviarNotificacionCita(
      profEmail || ADMIN_EMAIL,
      isAdminRecipient ? 'Equipo LactaNido' : profNombre,
      'Cita anulada por el padre/madre - LactaNido',
      `Hola ${isAdminRecipient ? 'Equipo LactaNido' : profNombre}, ${padreNombre} anuló la cita de ${servicio} del día ${fecha} a las ${hora}. El bloque quedó disponible nuevamente.`
    );
  },

  sendBookingRescheduled({ profEmail, profNombre, padreNombre, servicio, fecha, hora }) {
    const isAdminRecipient = !profEmail;
    const destinatario = isAdminRecipient ? 'Equipo LactaNido' : profNombre;
    return enviarNotificacionCita(
      profEmail || ADMIN_EMAIL,
      destinatario,
      'Cita reagendada pendiente de aprobación - LactaNido',
      `Hola ${destinatario}, ${padreNombre} reagendó su cita de ${servicio} al día ${fecha} a las ${hora}. La solicitud requiere ${isAdminRecipient ? 'asignación del equipo' : 'tu aprobación'}.`
    );
  }
};