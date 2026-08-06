# Backend — Arquitectura, Algoritmos y Cloud Functions
**LactaNido Platform · Versión 1.0 · Julio 2026**

---

## Tabla de Contenidos
1. [Hallazgos Críticos](#1-hallazgos-críticos)
2. [Arquitectura General](#2-arquitectura-general)
3. [Capa de API — firestore.js](#3-capa-de-api--firestorejs)
4. [Algoritmo de Detección de Solapamientos](#4-algoritmo-de-detección-de-solapamientos)
5. [Cloud Functions](#5-cloud-functions)
6. [Integridad Transaccional](#6-integridad-transaccional)
7. [Colecciones Firestore — Estado Actual vs. Propuesto](#7-colecciones-firestore--estado-actual-vs-propuesto)
8. [Módulo Tienda — Validación de mercadoLibreUrl](#8-módulo-tienda--validación-de-mercadolibreurl)
9. [Recomendaciones de Mejora](#9-recomendaciones-de-mejora-priorizadas)

---

## 1. Hallazgos Críticos

### 1.1 Operación de stock en cliente sin transacción robusta ⚠️ MEDIA SEVERIDAD
`createPedido` en `firestore.js` usa `runTransaction` correctamente para validar stock y descontarlo. Sin embargo, la regla Firestore de `/productos` permite que **cualquier usuario autenticado** pueda actualizar el campo `stock` directamente (el "parche rápido" comentado en las reglas). Esto significa que un cliente malicioso podría reducir stock de un producto sin crear un pedido real.

**Solución:** Mover la operación de stock a una Cloud Function que valide la existencia del pedido antes de decrementar.

### 1.2 fetchAdminStats con múltiples reads sin caché ⚠️ BAJA SEVERIDAD
`fetchAdminStats` realiza 4 queries Firestore cada vez que el admin carga su dashboard. Para dashboards con muchos usuarios esto se convierte en un costo innecesario y posible lentitud.

### 1.3 Ordenamiento en memoria para evitar índices — patrón de deuda técnica
Varios métodos (`fetchUserAppointments`, `fetchFichasCuidadoPorNido`) ordenan resultados en memoria con `.sort()` en lugar de usar `orderBy` en la query. Esto es aceptable a pequeña escala pero no escalará más allá de unos cientos de documentos por colección.

### 1.4 Sin endpoint de búsqueda de disponibilidad
No existe ninguna función en `firestore.js` para buscar slots de disponibilidad entre prestadoras. Los padres no tienen mecanismo para encontrar quién está disponible; actualmente parece que la selección de prestadora es manual o inexistente en el flujo de agendamiento.

---

## 2. Arquitectura General

```
┌────────────────────────────────────────────────────────────────┐
│  CLIENTE (Vanilla JS + Vite + Tailwind)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐ │
│  │ src/views/   │  │ src/ui/      │  │ src/api/firestore.js │ │
│  │ padre.js     │  │ cart.js      │  │                      │ │
│  │ consejera.js │  │ navigation.js│  │  Firebase SDK v9     │ │
│  │ cuidadora.js │  │ notifications│  │  (modular, no compat)│ │
│  │ admin.js     │  └──────────────┘  └──────────┬───────────┘ │
│  └──────────────┘                               │             │
└─────────────────────────────────────────────────┼─────────────┘
                                                  │ HTTPS
                          ┌───────────────────────▼──────────────┐
                          │  FIREBASE PLATFORM                    │
                          │  ┌──────────────┐ ┌────────────────┐ │
                          │  │  Firestore   │ │ Cloud Storage  │ │
                          │  │  (base datos)│ │ (archivos,     │ │
                          │  └──────┬───────┘ │  certs, imgs)  │ │
                          │         │         └────────────────┘ │
                          │  ┌──────▼───────┐ ┌────────────────┐ │
                          │  │   Auth       │ │ Cloud Functions│ │
                          │  │  (Firebase)  │ │ (server logic) │ │
                          │  └──────────────┘ └────────────────┘ │
                          └──────────────────────────────────────┘
                                    │
                          ┌─────────▼──────────┐
                          │  EXTERNAL SERVICES │
                          │  EmailJS (email)   │
                          │  Mercado Libre     │
                          │  (redirect only)   │
                          └────────────────────┘
```

---

## 3. Capa de API — firestore.js

### 3.1 Funciones existentes (estado actual)

| Función | Colección | Operación | Notas |
|---------|-----------|-----------|-------|
| `fetchAdminStats` | /usuarios, /reservas | getDocs × 4 | Sin caché; múltiples reads |
| `fetchUserAppointments` | /reservas | getDocs + sort en memoria | OK a escala pequeña |
| `fetchServiceAppointments` | /reservas | getDocs con filtro | Correcto desde fix de `profesionalId` |
| `getPendingUsers` | /usuarios | getDocs where estado=pendiente | OK |
| `getActiveProfessionals` | /usuarios | getDocs where rol array-contains | OK |
| `approveUser` | /usuarios | updateDoc | OK |
| `getCaregiverBlockedDays` | /usuarios/{uid}/bloqueos | getDocs | Falla por regla faltante |
| `addCaregiverBlockedDay` | /usuarios/{uid}/bloqueos | addDoc | Falla por regla faltante |
| `removeCaregiverBlockedDay` | /usuarios/{uid}/bloqueos | deleteDoc | Falla por regla faltante |
| `saveConsejeraSchedule` | /usuarios | updateDoc campo horarios | Modelo insuficiente |
| `vincularNidoPorRutBebe` | /nidos, /usuarios | getDocs + setDoc/updateDoc | Sin transacción; riesgo de race condition |
| `saveFichaCuidado` | /bitacoras, /reservas | addDoc + updateDoc | OK |
| `fetchActiveProducts` | /productos | getDocs where activo=true | OK |
| `createPedido` | /productos, /pedidos | runTransaction | Correcto |

### 3.2 Funciones que DEBEN AÑADIRSE

```javascript
// ─────────────────────────────────────────────────
// DISPONIBILIDAD — reemplaza saveConsejeraSchedule
// ─────────────────────────────────────────────────

export async function agregarSlotDisponibilidad(uid, slot, opcionesOverlap = {}) {
  const { aceptaSolapamiento = false, slotConflictoId = null } = opcionesOverlap;
  const ref = collection(db, 'usuarios', uid, 'disponibilidad');

  const data = {
    servicio: slot.servicio,
    fechaInicio: slot.fechaInicio,
    fechaFin: slot.fechaFin,
    zona: slot.zona ?? null,
    reservado: false,
    bookingId: null,
    notas: slot.notas ?? '',
    creadoEn: serverTimestamp(),
    actualizadoEn: serverTimestamp(),
  };

  if (aceptaSolapamiento && slotConflictoId) {
    data.allowOverlap = true;
    data.overlapConfirmedAt = serverTimestamp();
    data.overlapConfirmedBy = uid;
    data.overlapWithSlotId = slotConflictoId;
  }

  return await addDoc(ref, data);
}

export async function obtenerSlotsDisponibilidad(uid) {
  const q = query(
    collection(db, 'usuarios', uid, 'disponibilidad'),
    orderBy('fechaInicio', 'asc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function eliminarSlotDisponibilidad(uid, slotId) {
  await deleteDoc(doc(db, 'usuarios', uid, 'disponibilidad', slotId));
}

// ─────────────────────────────────────────────────
// BÚSQUEDA DE DISPONIBILIDAD (para padres)
// ─────────────────────────────────────────────────

export async function buscarPrestadorasDisponibles({ servicio, zona, fechaDesde, fechaHasta }) {
  // Usa collectionGroup query — requiere índice compuesto (ver TRD §5.3)
  const conditions = [
    where('servicio', '==', servicio),
    where('reservado', '==', false),
    where('fechaInicio', '>=', fechaDesde),
    orderBy('fechaInicio', 'asc'),
    limit(20)
  ];

  if (zona) conditions.splice(3, 0, where('zona', '==', zona));

  const q = query(collectionGroup(db, 'disponibilidad'), ...conditions);
  const snap = await getDocs(q);

  // Extraer uid de cada slot (está en la ruta del documento)
  const resultados = snap.docs.map(d => ({
    slotId: d.id,
    uid: d.ref.parent.parent.id,
    ...d.data()
  }));

  // Filtrar slots que terminan antes del fin de la franja solicitada
  return resultados.filter(r => r.fechaFin.toDate() <= fechaHasta);
}

// ─────────────────────────────────────────────────
// RESERVA ATÓMICA (reemplaza flujo actual)
// ─────────────────────────────────────────────────

export async function reservarSlotConTransaccion(uid, slotId, reservaData) {
  const slotRef = doc(db, 'usuarios', uid, 'disponibilidad', slotId);
  const reservaRef = doc(collection(db, 'reservas'));

  await runTransaction(db, async (transaction) => {
    const slotDoc = await transaction.get(slotRef);
    if (!slotDoc.exists()) throw new Error('Slot no existe');
    if (slotDoc.data().reservado) throw new Error('Slot ya reservado por otro usuario');

    transaction.update(slotRef, {
      reservado: true,
      bookingId: reservaRef.id,
      actualizadoEn: serverTimestamp(),
    });

    transaction.set(reservaRef, {
      ...reservaData,
      slotId,
      profesionalId: uid,
      estado: 'pendiente',
      creadoEn: serverTimestamp(),
    });
  });

  return reservaRef.id;
}

// ─────────────────────────────────────────────────
// CANCELACIÓN
// ─────────────────────────────────────────────────

export async function cancelarReserva(reservaId, slotId, profesionalUid, motivo) {
  const reservaRef = doc(db, 'reservas', reservaId);
  const slotRef = doc(db, 'usuarios', profesionalUid, 'disponibilidad', slotId);

  await runTransaction(db, async (transaction) => {
    transaction.update(reservaRef, { estado: 'cancelada', motivoCancelacion: motivo });
    transaction.update(slotRef, { reservado: false, bookingId: null, actualizadoEn: serverTimestamp() });
  });
}
```

---

## 4. Algoritmo de Detección de Solapamientos

```javascript
/**
 * Detecta solapamientos entre un slot nuevo y los existentes del mismo prestador.
 * No bloquea: retorna la lista de conflictos para que el frontend decida qué mostrar.
 *
 * @param {Object} nuevoSlot - { servicio, fechaInicio: Date, fechaFin: Date }
 * @param {Array}  slotsExistentes - [{id, servicio, fechaInicio, fechaFin, ...}]
 * @param {number} minRestHours - preferencia de descanso mínimo (0 = sin preferencia)
 * @returns {Array} conflictos - lista de objetos { tipo, slot, brechaHoras }
 */
export function detectarSolapamientos(nuevoSlot, slotsExistentes, minRestHours = 0) {
  const conflictos = [];

  const inicioNuevo = nuevoSlot.fechaInicio instanceof Date
    ? nuevoSlot.fechaInicio.getTime()
    : nuevoSlot.fechaInicio.toDate().getTime();

  const finNuevo = nuevoSlot.fechaFin instanceof Date
    ? nuevoSlot.fechaFin.getTime()
    : nuevoSlot.fechaFin.toDate().getTime();

  for (const slot of slotsExistentes) {
    // Solo detectar entre distintos tipos de servicio (para rol dual)
    if (slot.servicio === nuevoSlot.servicio) continue;

    const inicioExist = slot.fechaInicio instanceof Date
      ? slot.fechaInicio.getTime()
      : slot.fechaInicio.toDate().getTime();

    const finExist = slot.fechaFin instanceof Date
      ? slot.fechaFin.getTime()
      : slot.fechaFin.toDate().getTime();

    // Caso 1: Solapamiento real (los intervalos se intersecan)
    const hayInterseccion = inicioNuevo < finExist && finNuevo > inicioExist;
    if (hayInterseccion) {
      conflictos.push({
        tipo: 'solapamiento_real',
        slot,
        brechaHoras: 0,
        descripcion: `El turno se superpone con ${slot.servicio} (${formatFecha(inicioExist)} - ${formatFecha(finExist)})`
      });
      continue;
    }

    // Caso 2: Sin solapamiento real, pero brecha menor al mínimo de descanso
    if (minRestHours > 0) {
      // Brecha entre el fin de uno y el inicio del otro
      const brechaMs = Math.min(
        Math.abs(inicioNuevo - finExist),   // nuevo empieza después de existente
        Math.abs(inicioExist - finNuevo)    // existente empieza después de nuevo
      );
      const brechaHoras = brechaMs / (1000 * 60 * 60);

      if (brechaHoras < minRestHours) {
        conflictos.push({
          tipo: 'descanso_insuficiente',
          slot,
          brechaHoras: Math.round(brechaHoras * 10) / 10,
          descripcion: `Solo ${brechaHoras.toFixed(1)}h de descanso antes/después de ${slot.servicio}`
        });
      }
    }
  }

  return conflictos;
}

function formatFecha(timestamp) {
  return new Date(timestamp).toLocaleString('es-CL', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
  });
}

// ─────────────────────────────────────────────────
// USO EN EL FLUJO DE GUARDADO
// ─────────────────────────────────────────────────

async function guardarSlotConDeteccion(uid, nuevoSlot, userData) {
  // 1. Cargar slots existentes
  const slotsExistentes = await obtenerSlotsDisponibilidad(uid);
  const minRest = userData.minRestHours || 0;

  // 2. Detectar conflictos
  const conflictos = detectarSolapamientos(nuevoSlot, slotsExistentes, minRest);

  // 3. Si no hay conflictos → guardar directamente
  if (conflictos.length === 0) {
    await agregarSlotDisponibilidad(uid, nuevoSlot);
    showToast('Turno agregado correctamente', 'success');
    return;
  }

  // 4. Si hay conflictos → mostrar modal y esperar decisión del usuario
  const decision = await mostrarModalSolapamiento(conflictos, minRest);

  if (decision === 'ajustar') {
    // El usuario quiere editar el slot — no guardar, volver al formulario
    return;
  }

  if (decision === 'confirmar') {
    // El usuario acepta el solapamiento
    const primerConflicto = conflictos[0];
    await agregarSlotDisponibilidad(uid, nuevoSlot, {
      aceptaSolapamiento: true,
      slotConflictoId: primerConflicto.slot.id
    });
    showToast('Turno guardado con solapamiento registrado ⚠️', 'warning');
  }
}
```

---

## 5. Cloud Functions

### 5.1 Procesamiento de certificaciones (ver TRD §4.6)
Trigger: `onDocumentCreated('usuarios/{uid}/certifications/{certId}')`
- Descarga el archivo de Cloud Storage
- Genera thumbnail 200×200 con `sharp`
- Actualiza `thumbnailURL` en el documento

### 5.2 Notificaciones por email al crear reserva

```javascript
const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const nodemailer = require('nodemailer');

exports.notificarNuevaReserva = onDocumentCreated(
  'reservas/{reservaId}',
  async (event) => {
    const reserva = event.data.data();
    const db = getFirestore();

    // Obtener datos del padre
    const padreDoc = await db.doc(`usuarios/${reserva.uid}`).get();
    // Obtener datos de la prestadora
    const prestadoraDoc = await db.doc(`usuarios/${reserva.profesionalId}`).get();

    if (!padreDoc.exists || !prestadoraDoc.exists) return;

    const padre = padreDoc.data();
    const prestadora = prestadoraDoc.data();

    // Enviar email al padre
    await enviarEmail(padre.email, 'Reserva confirmada en LactaNido', `
      Hola ${padre.nombre},
      Tu reserva de ${reserva.servicio} con ${prestadora.nombre}
      está programada para el ${reserva.fecha} a las ${reserva.hora}.
    `);

    // Enviar email a la prestadora
    await enviarEmail(prestadora.email, 'Nueva reserva recibida', `
      Hola ${prestadora.nombre},
      Tienes una nueva reserva para el ${reserva.fecha} a las ${reserva.hora}.
    `);
  }
);
```

### 5.3 Validación de mercadoLibreUrl al crear/actualizar producto

```javascript
const { onDocumentWritten } = require('firebase-functions/v2/firestore');

exports.validarProducto = onDocumentWritten('productos/{productoId}', async (event) => {
  const data = event.data.after?.data();
  if (!data) return; // delete event

  if (data.mercadoLibreUrl) {
    const regex = /^https:\/\/(www\.)?mercadolibre\.(cl|com\.ar|com|com\.mx)\/.+/i;
    if (!regex.test(data.mercadoLibreUrl)) {
      // Revertir el campo inválido
      await event.data.after.ref.update({
        mercadoLibreUrl: null,
        _validationError: 'URL de Mercado Libre inválida. Debe comenzar con https://www.mercadolibre.cl/...'
      });
    }
  }
});
```

### 5.4 Resumen diario de disponibilidad (agregación)

```javascript
// Cron: cada día a las 06:00 AM
// Genera documento de disponibilidad agregada por zona para acelerar búsquedas
const { onSchedule } = require('firebase-functions/v2/scheduler');

exports.agregarDisponibilidadDiaria = onSchedule('0 6 * * *', async () => {
  const db = getFirestore();
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const manana = new Date(hoy.getTime() + 86400000);

  // Buscar todos los slots disponibles para hoy
  const snap = await db.collectionGroup('disponibilidad')
    .where('reservado', '==', false)
    .where('fechaInicio', '>=', hoy)
    .where('fechaInicio', '<', manana)
    .get();

  // Agrupar por zona y tipo de servicio
  const agregado = {};
  snap.docs.forEach(d => {
    const data = d.data();
    const key = `${data.zona || 'virtual'}_${data.servicio}`;
    if (!agregado[key]) agregado[key] = 0;
    agregado[key]++;
  });

  // Guardar resumen
  await db.doc(`disponibilidad_resumen/${hoy.toISOString().split('T')[0]}`).set({
    fecha: hoy,
    slots: agregado,
    generadoEn: new Date()
  });
});
```

---

## 6. Integridad Transaccional

### 6.1 Operaciones que DEBEN ser transaccionales

| Operación | Riesgo sin transacción | Estado actual |
|-----------|----------------------|---------------|
| Reservar slot | Doble reserva simultánea | ❌ No transaccional |
| Cancelar reserva + liberar slot | Slot queda ocupado sin reserva | ❌ No transaccional |
| Crear pedido + descontar stock | Stock negativo | ✅ Ya usa runTransaction |
| Vincular nido | Padre duplicado en padresUids | ⚠️ Parcial (no transacción real) |

### 6.2 `vincularNidoPorRutBebe` — mejorar con transacción

```javascript
export async function vincularNidoPorRutBebe(uidPadre, rutBebe, nombreBebe) {
  return await runTransaction(db, async (transaction) => {
    // Buscar nido existente — no se puede usar getDocs dentro de transacción,
    // por lo que se usa un documento de índice por RUT
    const nidoIndexRef = doc(db, 'nidos_index', rutBebe);
    const nidoIndex = await transaction.get(nidoIndexRef);

    let nidoId;

    if (!nidoIndex.exists()) {
      // Crear nido nuevo
      const nuevoNidoRef = doc(collection(db, 'nidos'));
      nidoId = nuevoNidoRef.id;
      transaction.set(nuevoNidoRef, {
        rutBebe, nombreBebe, padresUids: [uidPadre], creadoEn: new Date().toISOString()
      });
      transaction.set(nidoIndexRef, { nidoId });
    } else {
      nidoId = nidoIndex.data().nidoId;
      const nidoRef = doc(db, 'nidos', nidoId);
      const nidoDoc = await transaction.get(nidoRef);
      if (!nidoDoc.data().padresUids.includes(uidPadre)) {
        transaction.update(nidoRef, {
          padresUids: [...nidoDoc.data().padresUids, uidPadre]
        });
      }
    }

    transaction.update(doc(db, 'usuarios', uidPadre), { nidoId });
    return nidoId;
  });
}
```

---

## 7. Colecciones Firestore — Estado Actual vs. Propuesto

| Colección | Estado actual | Estado propuesto |
|-----------|--------------|-----------------|
| `/usuarios/{uid}` | Incluye campo `horarios{}` (modelo plano) | Mantener pero sin `horarios`; agregar `minRestHours` |
| `/usuarios/{uid}/bloqueos` | Existe, sin regla de seguridad | Mantener, añadir regla |
| `/usuarios/{uid}/disponibilidad` | ❌ No existe | ✅ Crear — slots individuales con timestamps |
| `/usuarios/{uid}/caregiverProfile` | ❌ No existe | ✅ Crear — datos especializados de cuidadora |
| `/usuarios/{uid}/counselorProfile` | ❌ No existe | ✅ Crear — datos especializados de consejera |
| `/usuarios/{uid}/certifications` | ❌ No existe | ✅ Crear — para flujo de verificación |
| `/reservas/{id}` | Existe, campo `slotId` ausente | Añadir campo `slotId` para referenciar slot reservado |
| `/nidos/{id}` | Existe | Mantener; añadir `/nidos_index/{rutBebe}` para transacciones |
| `/bitacoras/{id}` | Existe | Mantener |
| `/productos/{id}` | Existe, sin `mercadoLibreUrl` | Añadir `mercadoLibreUrl` y `_migrationNote` |
| `/pedidos/{id}` | Existe | Mantener |
| `/tips/{id}` | Existe | Mantener |
| `/disponibilidad_resumen/{fecha}` | ❌ No existe | ✅ Crear — agregado diario por Cloud Function |

---

## 8. Módulo Tienda — Validación de mercadoLibreUrl

### 8.1 Dominios válidos de Mercado Libre por país

```javascript
const ML_DOMINIOS = [
  'mercadolibre.cl',
  'mercadolibre.com.ar',
  'mercadolibre.com',
  'mercadolibre.com.mx',
  'mercadolibre.com.co',
  'mercadolibre.com.br',
  'mercadolibre.com.uy',
  'mercadolibre.com.pe',
];

export function validarUrlMercadoLibre(url) {
  if (!url || url.trim() === '') return { valida: false, error: 'URL vacía' };
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return { valida: false, error: 'Debe usar HTTPS' };
    const dominioValido = ML_DOMINIOS.some(d =>
      parsed.hostname === d || parsed.hostname === `www.${d}`
    );
    if (!dominioValido) return { valida: false, error: 'Dominio no es de Mercado Libre' };
    if (parsed.pathname.length < 3) return { valida: false, error: 'URL incompleta (falta path del producto)' };
    return { valida: true, error: null };
  } catch {
    return { valida: false, error: 'URL malformada' };
  }
}
```

### 8.2 Script de migración con backward compatibility

```javascript
// MIGRACIÓN: Paso 1 — agregar campo null a productos legacy
// Ejecutar desde consola admin o Cloud Function programada
export async function migrarProductosLegacy() {
  const snap = await getDocs(
    query(collection(db, 'productos'), where('activo', '==', true))
  );

  const batch = writeBatch(db);
  let migrados = 0;

  snap.docs.forEach(docSnap => {
    const data = docSnap.data();
    // Solo migrar si no tienen aún el campo
    if (!('mercadoLibreUrl' in data)) {
      batch.update(doc(db, 'productos', docSnap.id), {
        mercadoLibreUrl: null,
        _needsMlUrl: true,  // flag para que admin sepa qué completar
        _migratedAt: new Date().toISOString()
      });
      migrados++;
    }
  });

  if (migrados > 0) {
    await batch.commit();
    console.log(`Migrados ${migrados} productos. Completar mercadoLibreUrl en admin.`);
  }
  return migrados;
}

// MIGRACIÓN: Paso 2 — lógica de UI durante coexistencia
// El frontend ya aplica la lógica de fallback descrita en UIUX doc §8
// No requiere migración adicional — backward compatible automáticamente
```

---

## 9. Recomendaciones de Mejora (Priorizadas)

### 🔴 Impacto alto / Esfuerzo bajo
1. **Añadir regla Firestore para `/bloqueos`** — fix de seguridad crítico; una línea de código.
2. **Añadir `buscarPrestadorasDisponibles()`** a `firestore.js` — desbloquea el flujo de agendamiento real.
3. **Migrar `saveConsejeraSchedule`** a `agregarSlotDisponibilidad` — reemplaza modelo insuficiente.

### 🔴 Impacto alto / Esfuerzo medio
4. **Implementar `reservarSlotConTransaccion`** — previene dobles reservas.
5. **Implementar `cancelarReserva`** con transacción para liberar slot.
6. **Cloud Function de notificaciones por email** al crear reserva.

### 🟡 Impacto medio / Esfuerzo medio
7. **Mover descuento de stock a Cloud Function** — elimina el "parche rápido" de reglas.
8. **Mejorar `vincularNidoPorRutBebe` con transacción real** usando `nidos_index`.
9. **Cloud Function de agregado diario de disponibilidad** — mejora rendimiento de búsquedas.

### 🟢 Impacto bajo / Esfuerzo bajo
10. **Añadir `orderBy` en Firestore** en lugar de `.sort()` en memoria, con índices compuestos.
11. **Cache de `fetchAdminStats`** en localStorage con TTL de 5 minutos para reducir reads.
