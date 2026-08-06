import { db } from './firebase.js';
import { doc, setDoc, collection, addDoc } from 'firebase/firestore';
import { showToast } from './ui/notifications.js';

/**
 * Función para generar datos de prueba rápidamente en Firestore.
 */
export async function seedDatabase() {
    // --- USUARIOS DE PRUEBA ---
    // Esta lista debe coincidir con los usuarios que tienes en Firebase Authentication.
    // El `uid` aquí DEBE ser el mismo "UID del usuario" que ves en la consola de Firebase.
    const dummyUsers = [
        // --- USUARIOS CON UID REAL (ya existen en tu Firebase Auth) ---
        { 
            uid: "8TD3kAl1xbTdi4O1bp4biKLLrtJ3", 
            nombre: "Admin LactaNido", 
            email: "adminlactanido@gmail.com", 
            rol: ["admin"], 
            estado: "activo", 
            rut: "1.111.111-1" 
        },
        { 
            uid: "l19of6LT5DSnZ2GeETTtS8dClNt1", 
            nombre: "Papá de Prueba", 
            email: "papalactanido@gmail.com", 
            rol: ["padre"], 
            estado: "activo", 
            rut: "2.222.222-2", 
            subtipo: "padre" 
        },
        { 
            uid: "26M7wJcPbEMwqNexLUFU8J5AXcE2", 
            nombre: "Consejera Test", 
            email: "testcero1973@gmail.com", 
            rol: ["consejera"], 
            estado: "pendiente", 
            rut: "5.555.555-5" 
        },
        // --- USUARIOS NUEVOS / A MODIFICAR (requieren tu acción) ---
        // Para estos, crea la cuenta en Firebase Auth, copia su UID y reemplaza el texto "REEMPLAZAR_CON_UID...".
        { 
            uid: "REEMPLAZAR_CON_UID_DE_MAMALACTA", 
            nombre: "Mamá de Prueba", 
            email: "mamalacta@proton.me", 
            rol: ["padre"], 
            estado: "activo", 
            rut: "3.333.333-3", 
            subtipo: "madre" 
        },
        { 
            uid: "REEMPLAZAR_CON_UID_DE_CUIDALACTANIDO", 
            nombre: "Cuidadora Test", 
            email: "cuidalactanido@proton.me", 
            rol: ["cuidadora"], 
            estado: "pendiente", 
            rut: "4.444.444-4" 
        },
        { 
            uid: "REEMPLAZAR_CON_UID_DE_IPTVPROFESIONAL", 
            nombre: "Profesional Mixto", 
            email: "iptvprofesional2020@gmail.com", 
            rol: ["consejera", "cuidadora"], 
            estado: "pendiente", 
            rut: "6.666.666-6" 
        }
    ];

    console.log("Iniciando carga de datos de prueba...");

    for (const user of dummyUsers) {
        // La clave está aquí: `doc(db, "usuarios", user.uid)`
        // Esto asegura que el ID del documento en Firestore sea el UID de Authentication.
        await setDoc(doc(db, "usuarios", user.uid), {
            ...user,
            fechaRegistro: new Date().toISOString()
        });
    }

    const dummyReservas = [
        { nombre: "Papá de Prueba", servicio: "Consultor", fecha: "2025-05-20", hora: "10:00", estado: "pendiente", uid: "l19of6LT5DSnZ2GeETTtS8dClNt1", creadoEn: new Date().toISOString() }, // Reserva para el papá con UID real
        { nombre: "Anónimo Test", servicio: "Cuidador", fecha: "2025-05-21", hora: "22:00", estado: "pendiente", uid: null, creadoEn: new Date().toISOString() }
    ];

    for (const res of dummyReservas) {
        await addDoc(collection(db, "reservas"), res);
    }

    const dummyProductos = [
        { id: "prod_mamadera_avent", nombre: "Set Mamaderas Anticólico Avent", precio: 24990, stock: 15, imagenUrl: "https://images.unsplash.com/photo-1519864600265-abb23847ef2c?auto=format&fit=crop&w=300&q=80", categoria: "Lactancia", activo: true, creadoEn: new Date().toISOString() },
        { id: "prod_cojin_lactancia", nombre: "Cojín de Lactancia Ergonómico Premium", precio: 32500, stock: 8, imagenUrl: "https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=300&q=80", categoria: "Lactancia", activo: true, creadoEn: new Date().toISOString() },
        { id: "prod_crema_organica", nombre: "Crema Calmante Natural (100% Orgánica)", precio: 15990, stock: 20, imagenUrl: "https://images.unsplash.com/photo-1608248597481-496100c80836?auto=format&fit=crop&w=300&q=80", categoria: "Higiene", activo: true, creadoEn: new Date().toISOString() }
    ];

    for (const prod of dummyProductos) {
        await setDoc(doc(db, "productos", prod.id), prod);
    }

    showToast("¡Datos de prueba cargados! Recarga la página para ver los cambios.", "success");
}