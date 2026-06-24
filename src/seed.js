import { db } from './firebase.js';
import { doc, setDoc, collection, addDoc } from 'firebase/firestore';

/**
 * Función para generar datos de prueba rápidamente en Firestore.
 */
export async function seedDatabase() {
    const dummyUsers = [
        { uid: "seed_1", nombre: "Marta Gómez", email: "testcero1973+marta@gmail.com", rol: ["consejera"], estado: "pendiente", rut: "12.345.678-5" },
        { uid: "seed_2", nombre: "Lucía Pérez", email: "testcero1973+lucia@gmail.com", rol: ["cuidadora"], estado: "activo", rut: "11.111.111-1" },
        { uid: "seed_3", nombre: "Pedro Marmol", email: "testcero1973+pedro@gmail.com", rol: "padre", estado: "activo", rut: "9.999.999-9", subtipo: "padre" },
        { uid: "seed_4", nombre: "Carla Silva", email: "testcero1973+carla@gmail.com", rol: ["consejera", "cuidadora"], estado: "pendiente", rut: "8.888.888-8" }
    ];

    console.log("Iniciando carga de datos de prueba...");

    for (const user of dummyUsers) {
        await setDoc(doc(db, "usuarios", user.uid), {
            ...user,
            fechaRegistro: new Date().toISOString()
        });
    }

    const dummyReservas = [
        { nombre: "Pedro Marmol", servicio: "Consultor", fecha: "2025-05-20", hora: "10:00", estado: "pendiente", uid: "seed_3", creadoEn: new Date().toISOString() },
        { nombre: "Anónimo", servicio: "Cuidador", fecha: "2025-05-21", hora: "22:00", estado: "pendiente", uid: null, creadoEn: new Date().toISOString() }
    ];

    for (const res of dummyReservas) {
        await addDoc(collection(db, "reservas"), res);
    }

    const dummyProductos = [
        { nombre: "Set Mamaderas Anticólico Avent", precio: 24990, stock: 15, imagenUrl: "https://images.unsplash.com/photo-1519864600265-abb23847ef2c?auto=format&fit=crop&w=300&q=80", categoria: "Lactancia", activo: true, creadoEn: new Date().toISOString() },
        { nombre: "Cojín de Lactancia Ergonómico Premium", precio: 32500, stock: 8, imagenUrl: "https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=300&q=80", categoria: "Lactancia", activo: true, creadoEn: new Date().toISOString() },
        { nombre: "Crema Calmante Natural (100% Orgánica)", precio: 15990, stock: 20, imagenUrl: "https://images.unsplash.com/photo-1608248597481-496100c80836?auto=format&fit=crop&w=300&q=80", categoria: "Higiene", activo: true, creadoEn: new Date().toISOString() }
    ];

    for (const prod of dummyProductos) {
        await addDoc(collection(db, "productos"), prod);
    }

    alert("¡Datos de prueba cargados! Recarga el Dashboard del Admin para ver los cambios.");
}