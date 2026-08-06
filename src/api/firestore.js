import { db } from '../firebase.js';
import { collection, query, where, getDocs, updateDoc, doc, setDoc, getDoc, orderBy, limit, addDoc, deleteDoc, runTransaction, serverTimestamp } from 'firebase/firestore';

export async function getUserProfileWithSubcollections(uid) {
    try {
        const userRef = doc(db, 'usuarios', uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
            return null;
        }

        const userData = { id: userSnap.id, ...userSnap.data() };

        const [caregiverResult, counselorResult] = await Promise.allSettled([
            getDocs(collection(db, 'usuarios', uid, 'caregiverProfile')),
            getDocs(collection(db, 'usuarios', uid, 'counselorProfile'))
        ]);

        const userRoles = userData.rol?.map(r => r.toLowerCase()) || [];
        const hasCaregiverRole = userRoles.includes('cuidadora') || userRoles.includes('caregiver');
        const hasCounselorRole = userRoles.includes('consejera') || userRoles.includes('counselor');

        if (hasCaregiverRole && caregiverResult.status === 'rejected') {
            console.error('Error crítico al leer subcolección de cuidadora:', caregiverResult.reason);
            throw new Error('No se pudo cargar el perfil de cuidadora. Verifica las reglas de seguridad de Firestore.');
        }
        if (caregiverResult.status === 'fulfilled' && !caregiverResult.value.empty) {
            const docSnap = caregiverResult.value.docs[0];
            userData.caregiverProfile = { id: docSnap.id, ...docSnap.data() };
        }

        if (hasCounselorRole && counselorResult.status === 'rejected') {
            console.error('Error crítico al leer subcolección de consejera:', counselorResult.reason);
            throw new Error('No se pudo cargar el perfil de consejera. Verifica las reglas de seguridad de Firestore.');
        }
        if (counselorResult.status === 'fulfilled' && !counselorResult.value.empty) {
            const docSnap = counselorResult.value.docs[0];
            userData.counselorProfile = { id: docSnap.id, ...docSnap.data() };
        }

        return userData;
    } catch (error) {
        console.error('Error al obtener perfil del usuario con subcolecciones:', error);
        throw error;
    }
}

export async function fetchAdminStats() {
    try {
        const activeUsersSnap = await getDocs(query(collection(db, "usuarios"), where("estado", "==", "activo")));
        const pendingUsersSnap = await getDocs(query(collection(db, "usuarios"), where("estado", "==", "pendiente")));
        const activeAppointmentsSnap = await getDocs(query(collection(db, "reservas"), where("estado", "==", "pendiente")));
        
        const consejerasSnap = await getDocs(query(collection(db, "usuarios"), where("rol", "array-contains", "consejera")));
        const cuidadorasSnap = await getDocs(query(collection(db, "usuarios"), where("rol", "array-contains", "cuidadora")));
        
        return {
            totalUsers: activeUsersSnap.size + pendingUsersSnap.size,
            activeAppointments: activeAppointmentsSnap.size,
            totalPrestadores: new Set([...consejerasSnap.docs.map(d => d.id), ...cuidadorasSnap.docs.map(d => d.id)]).size,
            pendingPrestadores: pendingUsersSnap.size
        };
    } catch (e) {
        console.error("Error al obtener estadísticas:", e);
        throw e;
    }
}

export async function fetchUserAppointments(uid) {
    try {
        const q = query(collection(db, "reservas"), where("uid", "==", uid));
        const snap = await getDocs(q);
        const docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return docs.sort((a, b) => new Date(b.creadoEn) - new Date(a.creadoEn));
    } catch (error) {
        console.error("Error al obtener citas del usuario:", error);
        throw error;
    }
}

export async function fetchServiceAppointments(servicio, uid) {
    try {
        let q;
        if (uid) {
            q = query(collection(db, "reservas"), where("profesionalId", "==", uid));
        } else {
            q = query(collection(db, "reservas"), where("servicio", "==", servicio));
        }
        const snap = await getDocs(q);
        const all = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (uid) {
            return all.filter(a => a.servicio === servicio || !servicio);
        }
        return all;
    } catch (error) {
        console.error("Error al obtener citas del servicio:", error);
        throw error;
    }
}

export async function getPendingUsers() {
    try {
        const q = query(collection(db, "usuarios"), where("estado", "==", "pendiente"));
        const snap = await getDocs(q);
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error al obtener usuarios pendientes:", error);
        throw error;
    }
}

export async function getActiveProfessionals(rolStr) {
    try {
        const q = query(
            collection(db, "usuarios"), 
            where("estado", "==", "activo"),
            where("rol", "array-contains", rolStr)
        );
        const snap = await getDocs(q);
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error al obtener profesionales activos:", error);
        throw error;
    }
}

export async function getLatestUsers() {
    try {
        const q = query(collection(db, "usuarios"), orderBy("fechaRegistro", "desc"), limit(5));
        const snap = await getDocs(q);
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error al obtener últimos usuarios:", error);
        throw error;
    }
}

export async function getCaregiverBlockedDays(uid) {
    try {
        const q = query(collection(db, `usuarios/${uid}/bloqueos`), orderBy("date", "asc"));
        const snap = await getDocs(q);
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error cargando bloqueos:", error);
        throw error;
    }
}

export async function addCaregiverBlockedDay(uid, date, motivo) {
    try {
        const docRef = await addDoc(collection(db, `usuarios/${uid}/bloqueos`), {
            date,
            motivo,
            creadoEn: new Date().toISOString()
        });
        return docRef.id;
    } catch (error) {
        console.error("Error agregando bloqueo:", error);
        throw error;
    }
}

export async function removeCaregiverBlockedDay(uid, bloqueoId) {
    try {
        await deleteDoc(doc(db, `usuarios/${uid}/bloqueos`, bloqueoId));
    } catch (error) {
        console.error("Error eliminando bloqueo:", error);
        throw error;
    }
}

export async function saveConsejeraSchedule(uid, horarios) {
    try {
        await updateDoc(doc(db, "usuarios", uid), { horarios });
    } catch (error) {
        console.error("Error guardando horario:", error);
        throw error;
    }
}

// NUEVA FUNCIÓN: Guarda las tarifas personalizadas en el documento principal del usuario
export async function saveUserTarifas(uid, tarifas) {
    try {
        await updateDoc(doc(db, "usuarios", uid), { tarifas });
    } catch (error) {
        console.error("Error guardando tarifas:", error);
        throw error;
    }
}

export async function getAvailabilitySlots(uid) {
    try {
        const q = query(collection(db, `usuarios/${uid}/disponibilidad`), orderBy("fechaInicio", "asc"));
        const snap = await getDocs(q);
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error cargando slots de disponibilidad:", error);
        throw error;
    }
}

export async function addAvailabilitySlot(uid, slotData) {
    try {
        const data = {
            ...slotData,
            reservado: false,
            bookingId: null,
            creadoEn: serverTimestamp(),
            actualizadoEn: serverTimestamp(),
        };
        const docRef = await addDoc(collection(db, `usuarios/${uid}/disponibilidad`), data);
        return docRef.id;
    } catch (error) {
        console.error("Error agregando slot de disponibilidad:", error);
        throw error;
    }
}

export async function removeAvailabilitySlot(uid, slotId) {
    try {
        await deleteDoc(doc(db, `usuarios/${uid}/disponibilidad`, slotId));
    } catch (error) {
        console.error("Error eliminando slot de disponibilidad:", error);
        throw error;
    }
}

export async function vincularNidoPorRutBebe(uidPadre, rutBebe, nombreBebe) {
    try {
        const q = query(collection(db, "nidos"), where("rutBebe", "==", rutBebe));
        const snap = await getDocs(q);
        let nidoId = null;

        if (snap.empty) {
            const nuevoNidoRef = doc(collection(db, "nidos"));
            nidoId = nuevoNidoRef.id;
            await setDoc(nuevoNidoRef, {
                rutBebe: rutBebe,
                nombreBebe: nombreBebe,
                padresUids: [uidPadre],
                creadoEn: new Date().toISOString()
            });
        } else {
            const nidoDoc = snap.docs[0];
            nidoId = nidoDoc.id;
            const datosNido = nidoDoc.data();
            if (!datosNido.padresUids.includes(uidPadre)) {
                await updateDoc(doc(db, "nidos", nidoId), {
                    padresUids: [...datosNido.padresUids, uidPadre]
                });
            }
        }

        await updateDoc(doc(db, "usuarios", uidPadre), {
            nidoId: nidoId
        });

        return nidoId;
    } catch (error) {
        console.error("Error al vincular nido:", error);
        throw error;
    }
}

export async function obtenerDatosNido(nidoId) {
    if (!nidoId) return null;
    try {
        const docSnap = await getDoc(doc(db, "nidos", nidoId));
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        }
        return null;
    } catch (error) {
        console.error("Error al obtener datos del nido:", error);
        throw error;
    }
}

export async function saveFichaCuidado(fichaData) {
    try {
        const docRef = await addDoc(collection(db, "bitacoras"), {
            ...fichaData,
            creadoEn: new Date().toISOString()
        });
        if (fichaData.reservaId) {
            await updateDoc(doc(db, "reservas", fichaData.reservaId), {
                estado: 'completada'
            });
        }
        return docRef.id;
    } catch (error) {
        console.error("Error al guardar ficha de cuidado:", error);
        throw error;
    }
}

export async function fetchFichasCuidadoPorNido(nidoId) {
    try {
        const q = query(collection(db, "bitacoras"), where("nidoId", "==", nidoId));
        const snap = await getDocs(q);
        const docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return docs.sort((a, b) => new Date(b.creadoEn) - new Date(a.creadoEn));
    } catch (error) {
        console.error("Error al obtener fichas del nido:", error);
        throw error;
    }
}

export async function fetchFichasCuidadoPorPrestador(prestadorId) {
    if (!prestadorId) {
        console.warn("fetchFichasCuidadoPorPrestador fue llamado sin un prestadorId.");
        return [];
    }
    try {
        const q = query(collection(db, "bitacoras"), where("prestadorId", "==", prestadorId));
        const snap = await getDocs(q);
        const docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return docs.sort((a, b) => new Date(b.creadoEn) - new Date(a.creadoEn));
    } catch (error) {
        console.error("Error al obtener fichas del prestador:", error);
        throw error;
    }
}

export async function fetchActiveProducts() {
    try {
        const q = query(collection(db, "productos"), where("activo", "==", true));
        const snap = await getDocs(q);
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error al obtener productos:", error);
        throw error;
    }
}

export async function createProduct(productData) {
    try {
        const docRef = await addDoc(collection(db, "productos"), {
            ...productData,
            activo: true,
            creadoEn: new Date().toISOString()
        });
        return docRef.id;
    } catch (error) {
        console.error("Error al crear producto:", error);
        throw error;
    }
}

export async function deleteProduct(productId) {
    try {
        await updateDoc(doc(db, "productos", productId), {
            activo: false
        });
    } catch (error) {
        console.error("Error al eliminar producto:", error);
        throw error;
    }
}

export async function createPedido(pedidoData) {
    try {
        await runTransaction(db, async (transaction) => {
            let totalCalculado = 0;
            const productosVerificados = [];

            for (const item of pedidoData.productos) {
                const prodRef = doc(db, "productos", item.productoId);
                const prodDoc = await transaction.get(prodRef);
                if (!prodDoc.exists()) {
                    throw new Error(`Producto no existe.`);
                }
                const dbData = prodDoc.data();
                const actualStock = dbData.stock || 0;
                if (actualStock < item.cantidad) {
                    throw new Error(`Stock insuficiente. Stock actual: ${actualStock}`);
                }
                
                const precioReal = dbData.precio || 0;
                totalCalculado += precioReal * item.cantidad;

                productosVerificados.push({
                    productoId: item.productoId,
                    nombre: dbData.nombre || item.nombre,
                    precio: precioReal,
                    cantidad: item.cantidad
                });

                transaction.update(prodRef, {
                    stock: actualStock - item.cantidad
                });
            }
            
            const nuevoPedidoRef = doc(collection(db, "pedidos"));
            transaction.set(nuevoPedidoRef, {
                compradorUid: pedidoData.compradorUid,
                nidoId: pedidoData.nidoId || null,
                direccion: pedidoData.direccion || '',
                telefono: pedidoData.telefono || '',
                productos: productosVerificados,
                total: totalCalculado,
                estado: pedidoData.estado || 'pagado',
                creadoEn: new Date().toISOString()
            });
        });
    } catch (error) {
        console.error("Error al realizar el pedido en transacción:", error);
        throw error;
    }
}

export async function fetchPedidosUsuario(uid) {
    try {
        const q = query(collection(db, "pedidos"), where("compradorUid", "==", uid));
        const snap = await getDocs(q);
        const docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return docs.sort((a, b) => new Date(b.creadoEn) - new Date(a.creadoEn));
    } catch (error) {
        console.error("Error al obtener pedidos del usuario:", error);
        throw error;
    }
}

export async function fetchTodosPedidos() {
    try {
        const snap = await getDocs(collection(db, "pedidos"));
        const docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return docs.sort((a, b) => new Date(b.creadoEn) - new Date(a.creadoEn));
    } catch (error) {
        console.error("Error al obtener todos los pedidos:", error);
        throw error;
    }
}

export async function fetchAllTips() {
    try {
        const q = query(collection(db, "tips"), orderBy("creadoEn", "desc"));
        const snap = await getDocs(q);
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error al obtener todos los tips:", error);
        throw error;
    }
}

export async function createTip(tipData) {
    try {
        const docRef = await addDoc(collection(db, "tips"), {
            ...tipData,
            creadoEn: new Date().toISOString()
        });
        return docRef.id;
    } catch (error) {
        console.error("Error al crear el tip:", error);
        throw error;
    }
}