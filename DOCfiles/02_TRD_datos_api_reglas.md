# TRD — Modelos de Datos, APIs, Validaciones y Reglas Firestore
**LactaNido Platform · Versión 1.0 · Julio 2026**

---

## Tabla de Contenidos
1. [Hallazgos Críticos](#1-hallazgos-críticos)
2. [Diagrama Jerárquico de Colecciones](#2-diagrama-jerárquico-de-colecciones)
3. [Modelos de Datos Propuestos](#3-modelos-de-datos-propuestos)
4. [Ejemplos de Código Firebase SDK v9](#4-ejemplos-de-código-firebase-sdk-v9)
5. [Queries y Índices Compuestos](#5-queries-e-índices-compuestos)
6. [Análisis de Reglas Firestore](#6-análisis-de-reglas-firestore)
7. [Validaciones Client-Side vs Server-Side](#7-validaciones-client-side-vs-server-side)
8. [Escalabilidad y Concurrencia](#8-escalabilidad-y-concurrencia)
9. [Recomendaciones de Mejora](#9-recomendaciones-de-mejora-priorizadas)

---

## 1. Hallazgos Críticos

### 1.1 Subcolección `/bloqueos` sin reglas Firestore ⚠️ SEGURIDAD CRÍTICA
La subcolección `/usuarios/{uid}/bloqueos` es usada en producción (`getCaregiverBlockedDays`, `addCaregiverBlockedDay`, `removeCaregiverBlockedDay`) pero **no existe ninguna regla** en `firestore.rules` que la proteja. Cae en el cierre global `allow read, write: if false`, lo que significa que actualmente **falla en producción** para usuarios legítimos, o existe una regla temporal más permisiva en una versión no incluida.

**Acción inmediata:** Añadir match para `/usuarios/{userId}/bloqueos/{bloqueoId}`.

### 1.2 Disponibilidad sin subcolección — modelo de datos insuficiente ⚠️ ALTA SEVERIDAD
La consejera guarda sus horarios como un campo `horarios` anidado en el documento principal de `/usuarios/{uid}`. Esto limita la granularidad, imposibilita queries eficientes por franja horaria y no soporta slots individuales con estado de reserva.

### 1.3 Ausencia de subcolecciones de perfil especializado
No existen subcolecciones `/caregiverProfile` ni `/counselorProfile` en el código actual. Toda la información del prestador (zonas, tarifas, especialidades) se mezcla en el documento `/usuarios/{uid}`, lo que dificultará queries y escalabilidad.

### 1.4 Campo `mercadoLibreUrl` ausente en modelo de productos
El modelo actual de productos (`/productos/{productoId}`) no incluye `mercadoLibreUrl`. La UI usa WhatsApp como único canal de contacto para productos.

---

## 2. Diagrama Jerárquico de Colecciones

```
/usuarios/{uid}
│  ├── nombre, email, telefono, foto, rol[], estado, fechaRegistro
│  ├── nidoId?, horarios{} [LEGACY - migrar]
│  ├── puedeCrearTips, minRestHours [NUEVO]
│  │
│  ├── /caregiverProfile (subcolección - 1 documento)
│  │    └── {uid}  →  zonas[], tarifaHora, experienciaEdades{},
│  │                   cuidadosEspeciales[], horarioPreferencia{}
│  │
│  ├── /counselorProfile (subcolección - 1 documento)
│  │    └── {uid}  →  especialidades[], aniosExperiencia,
│  │                   modalidad, tarifaSesion, descripcion
│  │
│  ├── /disponibilidad/{slotId}   [NUEVO - reemplaza horarios{} y bloqueos/]
│  │    └── tipo, fechaInicio, fechaFin, zona, reservado, bookingId,
│  │         allowOverlap, overlapConfirmedAt, overlapConfirmedBy,
│  │         servicio, notas, creadoEn
│  │
│  ├── /bloqueos/{bloqueoId}      [EXISTENTE - mantener para bloqueos de días]
│  │    └── date, motivo, creadoEn
│  │
│  └── /certifications/{certId}  [NUEVO]
│       └── tipo, institucion, año, archivoURL, thumbnailURL,
│            verificationStatus, verifiedBy, verifiedAt, rejectionReason

/nidos/{nidoId}
│  ├── rutBebe, nombreBebe, padresUids[], creadoEn
│  └── (sin subcolecciones — los documentos de bitácora referencian nidoId)

/reservas/{reservaId}
│  └── uid (padre), profesionalId, profesionalNombre, servicio,
│       fecha, hora, duracion, estado, nidoId, slotId [NUEVO], creadoEn

/bitacoras/{bitacoraId}
│  └── nidoId, reservaId, prestadorId, prestadorNombre, prestadorRol,
│       tipoAlimentacion, horasSueno, cantidadPanales, observaciones,
│       horasEfectivas, creadoEn

/fichas_atencion/{fichaId}
│  └── nidoId, reservaId, consejeraId, [campos clínicos], creadoEn

/productos/{productoId}
│  └── nombre, precio, descripcion, categoria, imagenUrl, stock, activo,
│       mercadoLibreUrl [NUEVO], whatsappNumber [LEGACY], creadoEn

/pedidos/{pedidoId}
│  └── compradorUid, nidoId, direccion, telefono, productos[], total,
│       estado, creadoEn

/tips/{tipId}
│  └── titulo, contenido, autor, creadoEn
```

---

## 3. Modelos de Datos Propuestos

### 3.1 `/usuarios/{uid}` — Documento base
```typescript
interface UsuarioDoc {
  nombre: string;
  email: string;
  telefono?: string;
  foto?: string;
  rol: ('padre' | 'cuidadora' | 'consejera' | 'admin')[];
  estado: 'pendiente' | 'activo' | 'suspendido';
  fechaRegistro: string; // ISO 8601
  nidoId?: string;
  puedeCrearTips?: boolean;
  minRestHours?: number; // preferencia personal de descanso mínimo entre turnos
}
```

### 3.2 `/usuarios/{uid}/caregiverProfile/{uid}` — Perfil Cuidadora
```typescript
interface CaregiverProfile {
  zonas: string[];           // ej. ["Santiago Centro", "Providencia"]
  tarifaHora: number;        // en CLP
  experienciaEdades: {
    recienNacido: boolean;   // 0-3 meses
    lactante: boolean;       // 3-12 meses
    infante: boolean;        // 1-3 años
    preescolar: boolean;     // 3-5 años
  };
  cuidadosEspeciales: string[]; // ej. ["prematuros", "necesidades especiales"]
  horarioPreferencia: {
    nocturno: boolean;       // patrón más común
    diurno: boolean;
    finesDeSemanma: boolean;
  };
  descripcion?: string;
  actualizadoEn: string;
}
```

### 3.3 `/usuarios/{uid}/counselorProfile/{uid}` — Perfil Consejera
```typescript
interface CounselorProfile {
  especialidades: string[]; // ej. ["psicología", "lactancia", "terapia ocupacional"]
  aniosExperiencia: number;
  modalidad: 'presencial' | 'virtual' | 'hibrida';
  tarifaSesion: number;     // en CLP
  descripcion?: string;
  actualizadoEn: string;
}
```

### 3.4 `/usuarios/{uid}/disponibilidad/{slotId}` — Slot de disponibilidad
```typescript
interface DisponibilidadSlot {
  servicio: 'cuidado' | 'consejeria'; // permite distinguir en rol dual
  fechaInicio: Timestamp;   // Firestore Timestamp
  fechaFin: Timestamp;
  zona?: string;            // para cuidado; null para consejería virtual
  reservado: boolean;
  bookingId?: string;       // ID de la reserva que ocupa este slot
  // Solapamiento consciente
  allowOverlap?: boolean;         // true si la prestadora confirmó solapamiento
  overlapConfirmedAt?: Timestamp;
  overlapConfirmedBy?: string;    // uid de quien confirmó (la misma prestadora)
  overlapWithSlotId?: string;     // ID del slot con el que solapa
  // Metadatos
  notas?: string;
  creadoEn: Timestamp;
  actualizadoEn: Timestamp;
}
```

### 3.5 `/usuarios/{uid}/certifications/{certId}` — Certificaciones
```typescript
interface Certification {
  tipo: string;              // ej. "IBCLC", "Pediatría", "Enfermería"
  institucion: string;
  año: number;
  archivoURL: string;        // Cloud Storage URL
  thumbnailURL?: string;
  verificationStatus: 'pending' | 'approved' | 'rejected';
  verifiedBy?: string;       // uid del admin que verificó
  verifiedAt?: Timestamp;
  rejectionReason?: string;
}
```

### 3.6 Modelo de producto con `mercadoLibreUrl`
```typescript
interface Producto {
  nombre: string;
  precio: number;
  descripcion: string;
  categoria: string;
  imagenUrl: string;
  stock: number;
  activo: boolean;
  mercadoLibreUrl?: string;   // NUEVO: URL de Mercado Libre
  whatsappNumber?: string;    // LEGACY: mantener durante migración
  creadoEn: string;
}
```

---

## 4. Ejemplos de Código Firebase SDK v9

### 4.1 Crear usuario base
```javascript
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

async function crearUsuario(uid, datos) {
  await setDoc(doc(db, 'usuarios', uid), {
    nombre: datos.nombre,
    email: datos.email,
    telefono: datos.telefono || null,
    foto: datos.foto || null,
    rol: datos.rol, // siempre arreglo, ej. ['padre']
    estado: 'pendiente',
    fechaRegistro: new Date().toISOString(),
    nidoId: null,
  });
}
```

### 4.2 Crear perfil de Cuidadora
```javascript
async function crearPerfilCuidadora(uid, perfilData) {
  const ref = doc(db, 'usuarios', uid, 'caregiverProfile', uid);
  await setDoc(ref, {
    zonas: perfilData.zonas,
    tarifaHora: perfilData.tarifaHora,
    experienciaEdades: {
      recienNacido: perfilData.recienNacido ?? false,
      lactante: perfilData.lactante ?? true,
      infante: perfilData.infante ?? false,
      preescolar: perfilData.preescolar ?? false,
    },
    cuidadosEspeciales: perfilData.cuidadosEspeciales ?? [],
    horarioPreferencia: {
      nocturno: true,
      diurno: false,
      finesDeSemanma: false,
    },
    descripcion: perfilData.descripcion ?? '',
    actualizadoEn: new Date().toISOString(),
  });
}
```

### 4.3 Crear perfil de Consejera
```javascript
async function crearPerfilConsejera(uid, perfilData) {
  const ref = doc(db, 'usuarios', uid, 'counselorProfile', uid);
  await setDoc(ref, {
    especialidades: perfilData.especialidades,
    aniosExperiencia: perfilData.aniosExperiencia,
    modalidad: perfilData.modalidad,
    tarifaSesion: perfilData.tarifaSesion,
    descripcion: perfilData.descripcion ?? '',
    actualizadoEn: new Date().toISOString(),
  });
}
```

### 4.4 Crear perfil dual (Cuidadora + Consejera)
```javascript
import { writeBatch } from 'firebase/firestore';

async function crearPerfilDual(uid, perfilCuidadora, perfilConsejera) {
  // Actualizar rol en documento base
  await updateDoc(doc(db, 'usuarios', uid), {
    rol: ['cuidadora', 'consejera']
  });

  const batch = writeBatch(db);
  batch.set(doc(db, 'usuarios', uid, 'caregiverProfile', uid), {
    ...perfilCuidadora,
    actualizadoEn: new Date().toISOString(),
  });
  batch.set(doc(db, 'usuarios', uid, 'counselorProfile', uid), {
    ...perfilConsejera,
    actualizadoEn: new Date().toISOString(),
  });
  await batch.commit();
}
```

### 4.5 Configurar disponibilidad con opción de solapamiento
```javascript
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

async function agregarSlotDisponibilidad(uid, slot, { aceptaSolapamiento = false, slotConflictoId = null } = {}) {
  const data = {
    servicio: slot.servicio,
    fechaInicio: slot.fechaInicio,   // Date o Timestamp
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

  const ref = collection(db, 'usuarios', uid, 'disponibilidad');
  return await addDoc(ref, data);
}
```

### 4.6 Subir certificación con Cloud Function de post-procesamiento
```javascript
// CLIENTE: subir archivo a Cloud Storage y crear documento de certificación
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

async function subirCertificacion(uid, archivo, metadata) {
  // 1. Subir a Storage
  const storageRef = ref(storage, `certifications/${uid}/${Date.now()}_${archivo.name}`);
  const snapshot = await uploadBytes(storageRef, archivo);
  const archivoURL = await getDownloadURL(snapshot.ref);

  // 2. Crear documento en Firestore (Cloud Function escucha onCreate)
  const certRef = collection(db, 'usuarios', uid, 'certifications');
  return await addDoc(certRef, {
    tipo: metadata.tipo,
    institucion: metadata.institucion,
    año: metadata.año,
    archivoURL,
    thumbnailURL: null,          // Cloud Function generará el thumbnail
    verificationStatus: 'pending',
    verifiedBy: null,
    verifiedAt: null,
    rejectionReason: null,
    creadoEn: serverTimestamp(),
  });
}
```

```javascript
// CLOUD FUNCTION: genera thumbnail al crear certificación
const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { getStorage } = require('firebase-admin/storage');
const sharp = require('sharp');

exports.procesarCertificacion = onDocumentCreated(
  'usuarios/{uid}/certifications/{certId}',
  async (event) => {
    const { uid, certId } = event.params;
    const data = event.data.data();

    // Descargar PDF/imagen, generar thumbnail 200x200
    const bucket = getStorage().bucket();
    const filePath = data.archivoURL.split('/o/')[1].split('?')[0];
    const decodedPath = decodeURIComponent(filePath);
    const file = bucket.file(decodedPath);
    const [buffer] = await file.download();

    const thumbBuffer = await sharp(buffer).resize(200, 200, { fit: 'cover' }).toBuffer();
    const thumbPath = decodedPath.replace(/(\.[^.]+)$/, '_thumb$1');
    await bucket.file(thumbPath).save(thumbBuffer);
    const thumbURL = `https://storage.googleapis.com/${bucket.name}/${thumbPath}`;

    // Actualizar documento con thumbnailURL
    await event.data.ref.update({ thumbnailURL: thumbURL });
  }
);
```

---

## 5. Queries e Índices Compuestos

### 5.1 Padre busca prestadoras disponibles
```javascript
import { query, collection, where, orderBy, limit, startAfter, getDocs } from 'firebase/firestore';

async function buscarDisponibilidad({ servicio, zona, fechaInicio, fechaFin, lastDoc = null, pageSize = 10 }) {
  // Paso 1: obtener UIDs de prestadores activos del tipo adecuado
  const rolFiltro = servicio === 'cuidado' ? 'cuidadora' : 'consejera';
  const usuariosQ = query(
    collection(db, 'usuarios'),
    where('estado', '==', 'activo'),
    where('rol', 'array-contains', rolFiltro)
  );
  const usuariosSnap = await getDocs(usuariosQ);
  const uids = usuariosSnap.docs.map(d => d.id);

  // Paso 2: para cada UID buscar slots disponibles en el rango
  // (En producción con muchos prestadores: usar collectionGroup query)
  const slotPromises = uids.map(uid =>
    getDocs(query(
      collection(db, 'usuarios', uid, 'disponibilidad'),
      where('servicio', '==', servicio),
      where('reservado', '==', false),
      where('fechaInicio', '>=', fechaInicio),
      where('fechaFin', '<=', fechaFin),
      ...(zona ? [where('zona', '==', zona)] : [])
    ))
  );
  const results = await Promise.all(slotPromises);
  // Aplanar y paginar en memoria o usar collectionGroup (ver §5.2)
  return results.flatMap(snap => snap.docs.map(d => ({ uid: d.ref.parent.parent.id, ...d.data() })));
}
```

### 5.2 Query collectionGroup para escalar (recomendado)
```javascript
import { collectionGroup, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

async function buscarDisponibilidadGlobal({ servicio, zona, fechaDesde, fechaHasta }) {
  const q = query(
    collectionGroup(db, 'disponibilidad'),
    where('servicio', '==', servicio),
    where('reservado', '==', false),
    where('fechaInicio', '>=', fechaDesde),
    where('zona', '==', zona),
    orderBy('fechaInicio', 'asc'),
    limit(10)
  );
  return await getDocs(q);
}
```

### 5.3 Índices compuestos necesarios

Definir en `firestore.indexes.json`:

```json
{
  "indexes": [
    {
      "collectionGroup": "disponibilidad",
      "queryScope": "COLLECTION_GROUP",
      "fields": [
        { "fieldPath": "servicio", "order": "ASCENDING" },
        { "fieldPath": "reservado", "order": "ASCENDING" },
        { "fieldPath": "fechaInicio", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "disponibilidad",
      "queryScope": "COLLECTION_GROUP",
      "fields": [
        { "fieldPath": "servicio", "order": "ASCENDING" },
        { "fieldPath": "reservado", "order": "ASCENDING" },
        { "fieldPath": "zona", "order": "ASCENDING" },
        { "fieldPath": "fechaInicio", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "usuarios",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "estado", "order": "ASCENDING" },
        { "fieldPath": "rol", "arrayConfig": "CONTAINS" }
      ]
    },
    {
      "collectionGroup": "reservas",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "profesionalId", "order": "ASCENDING" },
        { "fieldPath": "servicio", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "certifications",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "verificationStatus", "order": "ASCENDING" },
        { "fieldPath": "creadoEn", "order": "DESCENDING" }
      ]
    }
  ]
}
```

---

## 6. Análisis de Reglas Firestore

Comparación entre las reglas actuales (en el ZIP) y las propuestas.

### 6.1 Reglas que FALTAN ⚠️

#### `/usuarios/{userId}/bloqueos/{bloqueoId}` — CRÍTICO, FALTANTE
```javascript
// PROPUESTA — añadir a firestore.rules
match /usuarios/{userId}/bloqueos/{bloqueoId} {
  // Solo el propio usuario puede leer y crear sus bloqueos
  allow read, list: if request.auth != null &&
    (request.auth.uid == userId || isAdmin());
  allow create: if request.auth != null && request.auth.uid == userId;
  allow delete: if request.auth != null &&
    (request.auth.uid == userId || isAdmin());
  allow update: if isAdmin();
}
```

#### `/usuarios/{userId}/disponibilidad/{slotId}` — NUEVA COLECCIÓN
```javascript
match /usuarios/{userId}/disponibilidad/{slotId} {
  allow read, list: if request.auth != null; // padres pueden leer para buscar
  allow create, update: if request.auth != null &&
    (request.auth.uid == userId || isAdmin());
  allow delete: if request.auth != null &&
    (request.auth.uid == userId || isAdmin());
}
```

#### `/usuarios/{userId}/caregiverProfile/{profileId}` — NUEVA SUBCOLECCIÓN
```javascript
match /usuarios/{userId}/caregiverProfile/{profileId} {
  allow read: if request.auth != null;
  allow write: if request.auth != null &&
    (request.auth.uid == userId || isAdmin());
}
```

#### `/usuarios/{userId}/counselorProfile/{profileId}` — NUEVA SUBCOLECCIÓN
```javascript
match /usuarios/{userId}/counselorProfile/{profileId} {
  allow read: if request.auth != null;
  allow write: if request.auth != null &&
    (request.auth.uid == userId || isAdmin());
}
```

#### `/usuarios/{userId}/certifications/{certId}` — NUEVA SUBCOLECCIÓN
```javascript
match /usuarios/{userId}/certifications/{certId} {
  allow read: if request.auth != null &&
    (request.auth.uid == userId || isAdmin());
  allow create: if request.auth != null && request.auth.uid == userId;
  // Solo admin puede cambiar verificationStatus
  allow update: if isAdmin() || (
    request.auth != null &&
    request.auth.uid == userId &&
    !request.resource.data.diff(resource.data).affectedKeys().hasAny(['verificationStatus', 'verifiedBy', 'verifiedAt'])
  );
  allow delete: if isAdmin();
}
```

### 6.2 Reglas que SOBRAN o DEBEN MODIFICARSE

#### Doble bloque `match /usuarios/{userId}` — MODIFICAR
Las reglas actuales tienen **dos bloques `match /usuarios/{userId}`** para el mismo path. Aunque Firestore los evalúa por separado (OR lógico), esto es confuso y puede llevar a permisos más amplios de lo esperado. **Consolidar en un solo bloque:**

```javascript
// PROPUESTA CONSOLIDADA
match /usuarios/{userId} {
  allow read: if request.auth != null &&
    (request.auth.uid == userId || isAdmin());
  allow create: if request.auth != null &&
    request.auth.uid == userId &&
    request.resource.data.email == request.auth.token.email &&
    (request.resource.data.rol is list) &&
    request.resource.data.rol.size() > 0 &&
    request.resource.data.rol.hasOnly(['padre', 'consejera', 'cuidadora', 'admin']);
  allow update: if request.auth != null &&
    (request.auth.uid == userId || isAdmin());
  allow delete: if isAdmin();
}
```

#### Regla `list` en `/bitacoras` con `isPrestador()` — RIESGO DE PRIVACIDAD
```javascript
// ACTUAL: cualquier prestador puede listar TODAS las bitácoras
allow read, list: if request.auth != null && (
  esMiembroDelNido(resource.data.nidoId) ||
  isPrestador() ||  // ← problema: ve bitácoras de otros prestadores
  isAdmin()
);

// PROPUESTA: restringir al prestador que creó la bitácora
allow read, list: if request.auth != null && (
  esMiembroDelNido(resource.data.nidoId) ||
  resource.data.prestadorId == request.auth.uid ||
  isAdmin()
);
```

**Nota:** `list` con `resource.data` solo funciona en reglas de documento único; para queries de colección se necesita índice + filtro en la query. La regla actual de `isPrestador()` en `list` puede exponer bitácoras de otros nidos.

### 6.3 Reglas que ESTÁN CORRECTAS ✅

- `/reservas/{reservaId}`: correcta separación de `read`/`update`, restricción a `uid` o `profesionalId`.
- `/nidos/{nidoId}`: correctamente restringido a `padresUids`.
- `/productos/{productoId}`: el patch de stock-only es aceptable a corto plazo; la recomendación de moverlo a Cloud Function es la acción correcta a mediano plazo.
- `/pedidos/{pedidoId}`: exige `compradorUid == request.auth.uid` en create.
- `/tips/{tipId}`: `read` público correcto; write protegido por flag `puedeCrearTips`.
- Cierre global `allow read, write: if false` — correcto como guardia por defecto.

---

## 7. Validaciones Client-Side vs Server-Side

| Campo | Client-Side | Server-Side (Regla/CF) | Prioridad |
|-------|------------|------------------------|-----------|
| `rol` solo valores válidos | `roles.js` hasOnly check | Regla `create` en /usuarios | ✅ Ambos |
| `email` coincide con auth | Form HTML validation | Regla `create`: `token.email` | ✅ Ambos |
| `mercadoLibreUrl` formato | Regex en formulario admin | Cloud Function o regla update | 🟡 CF recomendada |
| `fechaFin > fechaInicio` en slot | JS antes de addDoc | Regla update en /disponibilidad | 🟡 CF recomendada |
| `stock >= 0` al comprar | Cart UI check | Regla update /productos | ✅ Ambos |
| Solapamiento de horarios | JS `detectarSolapamiento()` | No aplicable (es advertencia, no bloqueo) | ✅ Solo client |
| `compradorUid == auth.uid` | No validado en cliente | Regla create /pedidos | ✅ Server |

---

## 8. Escalabilidad y Concurrencia

### 8.1 Reserva de slot — transacción atómica
```javascript
import { runTransaction, doc, serverTimestamp } from 'firebase/firestore';

async function reservarSlot(uid, slotId, reservaData) {
  const slotRef = doc(db, 'usuarios', uid, 'disponibilidad', slotId);
  const reservaRef = doc(collection(db, 'reservas'));

  await runTransaction(db, async (transaction) => {
    const slotDoc = await transaction.get(slotRef);
    if (!slotDoc.exists()) throw new Error('Slot no existe');
    if (slotDoc.data().reservado) throw new Error('Slot ya reservado');

    transaction.update(slotRef, {
      reservado: true,
      bookingId: reservaRef.id,
      actualizadoEn: serverTimestamp(),
    });
    transaction.set(reservaRef, {
      ...reservaData,
      slotId,
      estado: 'pendiente',
      creadoEn: serverTimestamp(),
    });
  });
  return reservaRef.id;
}
```

### 8.2 Límites de Firestore relevantes
- Máximo 1 escritura por documento por segundo → usar batch para múltiples slots.
- CollectionGroup queries requieren single-field exemptions en reglas de seguridad para `disponibilidad`.
- Para >500 prestadores activos, considerar un índice de disponibilidad agregado (documento summary por zona/fecha).

---

## 9. Recomendaciones de Mejora (Priorizadas)

### 🔴 Impacto alto / Esfuerzo bajo
1. **Añadir regla para `/bloqueos`** en `firestore.rules` — fix de seguridad inmediato.
2. **Consolidar doble bloque `/usuarios`** — evitar ambigüedad en permisos.
3. **Corregir regla `list` de `/bitacoras`** — eliminar exposición de datos entre prestadores.

### 🔴 Impacto alto / Esfuerzo medio
4. **Migrar `horarios{}` a subcolección `/disponibilidad`** — desbloquea toda la lógica de slots.
5. **Implementar transacción de reserva de slot** — previene dobles reservas.

### 🟡 Impacto medio / Esfuerzo medio
6. **Añadir `caregiverProfile` y `counselorProfile` como subcolecciones** — mejora escalabilidad de queries.
7. **Añadir `mercadoLibreUrl` a modelo de producto** — requerido para módulo de tienda.
8. **Implementar índices compuestos** de la sección §5.3 para queries eficientes.

### 🟢 Impacto bajo / Esfuerzo bajo
9. **Agregar `minRestHours` a `/usuarios`** — campo que activa advertencias personalizadas.
10. **Crear subcolección `/certifications`** con reglas incluidas — prepara flujo de verificación.
