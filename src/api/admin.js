import { app } from '../firebase.js';
import { getFirestore, doc, collection, serverTimestamp, runTransaction } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

/**
 * Aprueba un usuario y registra la acción en una transacción atómica.
 * Esta implementación se ejecuta en el cliente para evitar costos de Cloud Functions.
 * La seguridad depende enteramente de las Reglas de Firestore.
 * @param {string} targetUid El UID del usuario a aprobar.
 * @param {string} adminNotes Notas opcionales del administrador para el registro de auditoría.
 * @returns {Promise<object>} Resultado para mantener compatibilidad con la vista.
 */
export async function approveUserWithAudit(targetUid, adminNotes = 'Aprobación de perfil estándar.') {
  const db = getFirestore(app);
  const auth = getAuth(app);
  const adminUid = auth.currentUser ? auth.currentUser.uid : null;

  if (!adminUid) {
    throw new Error('No se pudo identificar al administrador. Inicia sesión nuevamente.');
  }

  try {
    // Usamos una transacción para asegurar que ambas operaciones (actualizar usuario y crear log)
    // se completen con éxito, o ninguna lo haga.
    await runTransaction(db, async (transaction) => {
      // 1. Referencia al documento del usuario que queremos aprobar
      const usuarioRef = doc(db, 'usuarios', targetUid);

      // 2. Actualizar el estado directamente en la colección 'usuarios'
      transaction.update(usuarioRef, {
        estado: 'activo'
      });

      // 3. Crear el registro de auditoría en la colección dedicada '/auditLogs'
      const auditLogRef = doc(collection(db, 'auditLogs'));
      transaction.set(auditLogRef, {
        adminUid,
        action: 'APPROVE_USER',
        targetType: 'USER',
        targetId: targetUid,
        reason: adminNotes,
        timestamp: serverTimestamp()
      });

      console.log('Transacción de aprobación preparada para el usuario:', targetUid);
    });

    return {
      success: true,
      message: 'Usuario aprobado y acción auditada correctamente.'
    };
  } catch (error) {
    console.error("Error en la transacción de aprobación:", error);
    throw new Error(error.message || 'La acción de aprobación falló.');
  }
}