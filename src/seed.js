import { db } from './firebase.js';
import { doc, setDoc, collection, addDoc } from 'firebase/firestore';
import { showToast } from './ui/notifications.js';

/**
 * Función para generar datos de prueba en Firestore.
 *
 * ⚠️  IMPORTANTE PARA DESARROLLADORES:
 * Los UIDs reales de Firebase Auth NO se hardcodean aquí.
 * En su lugar, usa variables de entorno definidas en el archivo .env
 * (nunca subas el .env al repositorio).
 *
 * Para configurar, copia .env.example a .env y completa:
 *   VITE_SEED_UID_ADMIN=tu_uid_admin_real
 *   VITE_SEED_UID_PADRE1=tu_uid_padre1_real
 *   VITE_SEED_UID_PADRE2=tu_uid_padre2_real
 *   VITE_SEED_UID_CONSEJERA=tu_uid_consejera_real
 *   VITE_SEED_UID_CUIDADORA=tu_uid_cuidadora_real
 *   VITE_SEED_UID_MIXTO=tu_uid_mixto_real
 *
 * Si las variables no están definidas, se usan UIDs ficticios de prueba
 * que NO corresponden a cuentas reales.
 */
export async function seedDatabase() {

    // --- Leer UIDs desde variables de entorno (.env) ---
    // Si no existen, se usan placeholders ficticios que no rompen nada
    const UID_ADMIN     = import.meta.env.VITE_SEED_UID_ADMIN     || 'seed-admin-uid-placeholder';
    const UID_PADRE1    = import.meta.env.VITE_SEED_UID_PADRE1    || 'seed-padre1-uid-placeholder';
    const UID_PADRE2    = import.meta.env.VITE_SEED_UID_PADRE2    || 'seed-padre2-uid-placeholder';
    const UID_CONSEJERA = import.meta.env.VITE_SEED_UID_CONSEJERA || 'seed-consejera-uid-placeholder';
    const UID_CUIDADORA = import.meta.env.VITE_SEED_UID_CUIDADORA || 'seed-cuidadora-uid-placeholder';
    const UID_MIXTO     = import.meta.env.VITE_SEED_UID_MIXTO     || 'seed-mixto-uid-placeholder';

    // --- USUARIOS DE PRUEBA ---
    // Emails y RUTs son ficticios. Los UIDs vienen del .env.
    const dummyUsers = [
        {
            uid: UID_ADMIN,
            nombre: "Admin LactaNido",
            email: "admin-prueba@example.com",
            rol: ["admin"],
            estado: "activo",
            rut: "1.111.111-1"
        },
        {
            uid: UID_PADRE1,
            nombre: "Papá de Prueba",
            email: "padre1-prueba@example.com",
            rol: ["padre"],
            estado: "activo",
            rut: "2.222.222-2"
        },
        {
            uid: UID_PADRE2,
            nombre: "Mamá de Prueba",
            email: "madre2-prueba@example.com",
            rol: ["padre"],
            estado: "activo",
            rut: "3.333.333-3"
        },
        {
            uid: UID_CONSEJERA,
            nombre: "Consejera Test",
            email: "consejera-prueba@example.com",
            rol: ["consejera"],
            estado: "pendiente",
            rut: "5.555.555-5"
        },
        {
            uid: UID_CUIDADORA,
            nombre: "Cuidadora Test",
            email: "cuidadora-prueba@example.com",
            rol: ["cuidadora"],
            estado: "pendiente",
            rut: "4.444.444-4"
        },
        {
            uid: UID_MIXTO,
            nombre: "Profesional Mixto",
            email: "mixto-prueba@example.com",
            rol: ["consejera", "cuidadora"],
            estado: "pendiente",
            rut: "6.666.666-6"
        }
    ];

    console.log("Iniciando carga de datos de prueba...");

    for (const user of dummyUsers) {
        await setDoc(doc(db, "usuarios", user.uid), {
            ...user,
            fechaRegistro: new Date().toISOString()
        });
    }

    // --- RESERVAS DE PRUEBA ---
    const dummyReservas = [
        {
            nombre: "Papá de Prueba",
            servicio: "Consultor",
            fecha: "2025-05-20",
            hora: "10:00",
            estado: "pendiente",
            uid: UID_PADRE1,
            profesionalId: UID_CONSEJERA,
            creadoEn: new Date().toISOString()
        },
        {
            nombre: "Anónimo Test",
            servicio: "Cuidador",
            fecha: "2025-05-21",
            hora: "22:00",
            estado: "pendiente",
            uid: null,
            profesionalId: null,
            creadoEn: new Date().toISOString()
        }
    ];

    for (const res of dummyReservas) {
        await addDoc(collection(db, "reservas"), res);
    }

    // --- PRODUCTOS DE PRUEBA ---
    // mercadoLibreUrl: null por defecto; completar manualmente en Firebase Console
    const dummyProductos = [
        {
            id: "prod_mamadera_avent",
            nombre: "Set Mamaderas Anticólico Avent",
            precio: 24990,
            stock: 15,
            imagenUrl: "https://images.unsplash.com/photo-1519864600265-abb23847ef2c?auto=format&fit=crop&w=300&q=80",
            categoria: "Lactancia",
            activo: true,
            mercadoLibreUrl: null,
            creadoEn: new Date().toISOString()
        },
        {
            id: "prod_cojin_lactancia",
            nombre: "Cojín de Lactancia Ergonómico Premium",
            precio: 32500,
            stock: 8,
            imagenUrl: "https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=300&q=80",
            categoria: "Lactancia",
            activo: true,
            mercadoLibreUrl: null,
            creadoEn: new Date().toISOString()
        },
        {
            id: "prod_crema_organica",
            nombre: "Crema Calmante Natural (100% Orgánica)",
            precio: 15990,
            stock: 20,
            imagenUrl: "https://images.unsplash.com/photo-1608248597481-496100c80836?auto=format&fit=crop&w=300&q=80",
            categoria: "Higiene",
            activo: true,
            mercadoLibreUrl: null,
            creadoEn: new Date().toISOString()
        }
    ];

    for (const prod of dummyProductos) {
        await setDoc(doc(db, "productos", prod.id), prod);
    }

    showToast("¡Datos de prueba cargados! Recarga la página para ver los cambios.", "success");
}