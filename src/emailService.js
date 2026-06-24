import emailjs from '@emailjs/browser';

// Reemplaza estas variables con tus verdaderas credenciales de EmailJS (https://www.emailjs.com/)
// Lo ideal es mover esto al archivo .env como VITE_EMAILJS_PUBLIC_KEY, etc.
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || "TU_PUBLIC_KEY_AQUI";
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || "TU_SERVICE_ID_AQUI";

// Configura las plantillas en EmailJS
const TEMPLATES = {
    WELCOME_PARENT: "template_welcome_parent",
    PENDING_PRESTADOR: "template_pending_prestador",
    APPROVED_PRESTADOR: "template_approved_prestador"
};

// Inicializa EmailJS (idealmente se llama una vez en el inicio de la app)
emailjs.init({
    publicKey: EMAILJS_PUBLIC_KEY,
});

async function sendEmail(templateId, templateParams) {
    if (EMAILJS_PUBLIC_KEY === "TU_PUBLIC_KEY_AQUI" || !EMAILJS_PUBLIC_KEY) {
        console.warn(`[EmailJS Simulado] Se habría enviado un correo usando plantilla: ${templateId} a ${templateParams.to_email}`);
        return null;
    }

    try {
        const response = await emailjs.send(EMAILJS_SERVICE_ID, templateId, templateParams);
        console.log(`Email enviado con éxito (Template: ${templateId}):`, response.status, response.text);
        return response;
    } catch (err) {
        console.error("Error al enviar email con EmailJS:", err);
        // No lanzamos el error para no romper el flujo de la aplicación
        return null;
    }
}

export const emailService = {
    sendWelcomeParent: (nombre, email) =>
        sendEmail(TEMPLATES.WELCOME_PARENT, { 
            to_name: nombre, 
            to_email: email,
            reply_to: "support@lactanido.cl"
        }),
        
    sendPendingPrestador: (nombre, email) =>
        sendEmail(TEMPLATES.PENDING_PRESTADOR, { 
            to_name: nombre, 
            to_email: email,
            reply_to: "support@lactanido.cl"
        }),
        
    sendApprovalNotification: (nombre, email) =>
        sendEmail(TEMPLATES.APPROVED_PRESTADOR, { 
            to_name: nombre, 
            to_email: email,
            reply_to: "support@lactanido.cl"
        })
};