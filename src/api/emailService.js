import emailjs from '@emailjs/browser';

export async function enviarNotificacionCita(to_email, to_name, subject, message) {
  try {
    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
    const templateParams = { to_email, to_name, subject, message };

    console.log('Intentando enviar correo con EmailJS:', { to_email, to_name, subject, serviceId, templateId });
    await emailjs.send(serviceId, templateId, templateParams, publicKey);
    console.log('Correo EmailJS enviado con éxito');
  } catch (error) {
    console.error('Error al enviar notificación de cita:', error);
  }
}
