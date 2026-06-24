import { db } from '../firebase.js';
import { collection, query, where, getDocs, updateDoc, doc, setDoc, getDoc, orderBy, limit, addDoc, deleteDoc, runTransaction } from 'firebase/firestore';

export async function fetchAdminStats() {
    try {
        const usersSnap = await getDocs(collection(db, "usuarios"));
        const pendingSnap = await getDocs(query(collection(db, "usuarios"), where("estado", "==", "pendiente")));
        const appointmentsSnap = await getDocs(query(collection(db, "reservas"), where("estado", "==", "pendiente")));

        const prestadores = usersSnap.docs.filter(d => {
            const r = d.data().rol;
            const roles = Array.isArray(r) ? r : [r];
            return roles.some(rol => rol === 'consejera' || rol === 'cuidadora');
        });

        return {
            totalUsers: usersSnap.size,
            activeAppointments: appointmentsSnap.size,
            totalPrestadores: prestadores.length,
            pendingPrestadores: pendingSnap.size
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
        // Ordenar en memoria para no requerir índice compuesto en Firestore
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
            // Consultar solo las citas donde el prestador fue quien las creó (uid)
            q = query(collection(db, "reservas"), where("uid", "==", uid));
        } else {
            // Fallback para admin: todas las citas del tipo de servicio
            q = query(collection(db, "reservas"), where("servicio", "==", servicio));
        }
        const snap = await getDocs(q);
        const all = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Filtrar por tipo de servicio en memoria (evita índice compuesto)
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
        // Filtrar directamente en base de datos para mayor rendimiento y escalabilidad
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

export async function approveUser(uid) {
    try {
        await updateDoc(doc(db, "usuarios", uid), { estado: 'activo' });
    } catch (error) {
        console.error("Error al aprobar usuario:", error);
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

// ==========================================
// LÓGICA DE NIDOS (FAMILIAS VINCULADAS)
// ==========================================

export async function vincularNidoPorRutBebe(uidPadre, rutBebe, nombreBebe) {
    try {
        // 1. Buscamos si ya existe un nido con ese RUT de bebé
        const q = query(collection(db, "nidos"), where("rutBebe", "==", rutBebe));
        const snap = await getDocs(q);
        
        let nidoId = null;

        if (snap.empty) {
            // 2. Si NO existe, creamos un nuevo Nido
            const nuevoNidoRef = doc(collection(db, "nidos"));
            nidoId = nuevoNidoRef.id;
            
            await setDoc(nuevoNidoRef, {
                rutBebe: rutBebe,
                nombreBebe: nombreBebe,
                padresUids: [uidPadre],
                creadoEn: new Date().toISOString()
            });
        } else {
            // 3. Si YA EXISTE, unimos a este padre al nido existente
            const nidoDoc = snap.docs[0];
            nidoId = nidoDoc.id;
            const datosNido = nidoDoc.data();
            
            // Evitamos duplicar el UID si ya estaba
            if (!datosNido.padresUids.includes(uidPadre)) {
                await updateDoc(doc(db, "nidos", nidoId), {
                    padresUids: [...datosNido.padresUids, uidPadre]
                });
            }
        }

        // 4. Actualizamos el documento del usuario para asignarle su nidoId
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

// ==========================================
// LÓGICA DE BITÁCORAS / FICHAS DE CUIDADO
// ==========================================

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

// ==========================================
// LÓGICA DE TIENDA Y PRODUCTOS
// ==========================================

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

