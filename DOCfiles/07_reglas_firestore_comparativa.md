# Reglas Firestore — Comparativa y Propuesta Consolidada
**LactaNido Platform · Versión 1.0 · Julio 2026**

---

## Tabla de Contenidos
1. [Resumen de cambios](#1-resumen-de-cambios)
2. [Reglas propuestas completas](#2-reglas-propuestas-completas-firestore-rules)
3. [Tabla de diferencias](#3-tabla-de-diferencias)

---

## 1. Resumen de Cambios

| Colección | Estado | Cambio |
|-----------|--------|--------|
| `/usuarios/{uid}` | ⚠️ MODIFICAR | Consolidar dos bloques match en uno; sin pérdida de funcionalidad |
| `/usuarios/{uid}/bloqueos/{id}` | 🔴 FALTANTE | **Añadir** — regla crítica, funcionalidad rota en producción |
| `/usuarios/{uid}/disponibilidad/{id}` | 🆕 NUEVA | **Añadir** — reemplaza campo `horarios{}` |
| `/usuarios/{uid}/caregiverProfile/{id}` | 🆕 NUEVA | **Añadir** — subcolección de perfil de cuidadora |
| `/usuarios/{uid}/counselorProfile/{id}` | 🆕 NUEVA | **Añadir** — subcolección de perfil de consejera |
| `/usuarios/{uid}/certifications/{id}` | 🆕 NUEVA | **Añadir** — para flujo de verificación de credenciales |
| `/reservas/{id}` | ✅ MANTENER | Sin cambios |
| `/nidos/{id}` | ✅ MANTENER | Sin cambios |
| `/bitacoras/{id}` | ⚠️ MODIFICAR | Reemplazar `isPrestador()` en `list` por `prestadorId == auth.uid` |
| `/fichas_atencion/{id}` | ✅ MANTENER | Sin cambios |
| `/productos/{id}` | ✅ MANTENER | Sin cambios (parche de stock sigue siendo aceptable a corto plazo) |
| `/pedidos/{id}` | ✅ MANTENER | Sin cambios |
| `/tips/{id}` | ✅ MANTENER | Sin cambios |
| `/{document=**}` | ✅ MANTENER | Cierre global correcto |

---

## 2. Reglas Propuestas Completas (firestore.rules)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // ─────────────────────────────────────────────────────────
    // FUNCIONES DE CONTROL DE ACCESO
    // ─────────────────────────────────────────────────────────
    // `rol` en /usuarios/{uid} siempre es un ARREGLO.
    // (ej: ["padre"], ["consejera"], ["consejera","cuidadora"], ["admin"])

    function datosUsuario() {
      return get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data;
    }

    function isAdmin() {
      return request.auth != null &&
             exists(/databases/$(database)/documents/usuarios/$(request.auth.uid)) &&
             get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.rol.hasAny(['admin']);
    }

    function isPrestador() {
      return request.auth != null &&
             exists(/databases/$(database)/documents/usuarios/$(request.auth.uid)) &&
             datosUsuario().rol.hasAny(['consejera', 'cuidadora', 'admin']);
    }

    function esMiembroDelNido(nidoId) {
      return nidoId != null &&
             exists(/databases/$(database)/documents/nidos/$(nidoId)) &&
             request.auth.uid in get(/databases/$(database)/documents/nidos/$(nidoId)).data.padresUids;
    }

    // ─────────────────────────────────────────────────────────
    // USUARIOS — BLOQUE CONSOLIDADO (reemplaza los dos bloques anteriores)
    // ─────────────────────────────────────────────────────────
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

      // Nadie puede borrar su propia cuenta desde el cliente.
      allow delete: if isAdmin();

      // ─── SUBCOLECCIÓN: Días bloqueados (cuidadora) ───────────
      // CRÍTICO: Esta regla faltaba en la versión anterior.
      // Sin ella, getCaregiverBlockedDays / addCaregiverBlockedDay
      // fallan con error de permisos en producción.
      match /bloqueos/{bloqueoId} {
        allow read, list: if request.auth != null &&
          (request.auth.uid == userId || isAdmin());
        allow create: if request.auth != null &&
          request.auth.uid == userId;
        allow delete: if request.auth != null &&
          (request.auth.uid == userId || isAdmin());
        // Solo admin puede modificar un bloqueo existente
        allow update: if isAdmin();
      }

      // ─── SUBCOLECCIÓN: Disponibilidad (slots) ────────────────
      // NUEVA: Reemplaza el campo `horarios{}` en el documento base.
      // Los padres pueden leer (para buscar disponibilidad).
      // Solo el propio usuario o admin puede escribir.
      match /disponibilidad/{slotId} {
        allow read, list: if request.auth != null;
        allow create: if request.auth != null &&
          request.auth.uid == userId &&
          request.resource.data.reservado == false &&
          request.resource.data.fechaInicio is timestamp &&
          request.resource.data.fechaFin is timestamp;
        allow update: if request.auth != null &&
          (request.auth.uid == userId || isAdmin());
        allow delete: if request.auth != null &&
          (request.auth.uid == userId || isAdmin());
      }

      // ─── SUBCOLECCIÓN: Perfil de Cuidadora ───────────────────
      match /caregiverProfile/{profileId} {
        allow read: if request.auth != null;
        allow write: if request.auth != null &&
          (request.auth.uid == userId || isAdmin());
      }

      // ─── SUBCOLECCIÓN: Perfil de Consejera ───────────────────
      match /counselorProfile/{profileId} {
        allow read: if request.auth != null;
        allow write: if request.auth != null &&
          (request.auth.uid == userId || isAdmin());
      }

      // ─── SUBCOLECCIÓN: Certificaciones ───────────────────────
      match /certifications/{certId} {
        // Solo el propio usuario o admin puede leer sus certificaciones
        allow read, list: if request.auth != null &&
          (request.auth.uid == userId || isAdmin());

        // El usuario puede subir sus propias certificaciones
        allow create: if request.auth != null &&
          request.auth.uid == userId;

        // El usuario puede actualizar sus datos (excepto el estado de verificación
        // que solo puede cambiar el admin).
        allow update: if isAdmin() || (
          request.auth != null &&
          request.auth.uid == userId &&
          !request.resource.data.diff(resource.data).affectedKeys()
            .hasAny(['verificationStatus', 'verifiedBy', 'verifiedAt', 'rejectionReason'])
        );

        // Solo admin puede eliminar certificaciones
        allow delete: if isAdmin();
      }
    }

    // ─────────────────────────────────────────────────────────
    // RESERVAS
    // ─────────────────────────────────────────────────────────
    match /reservas/{reservaId} {
      // Admin lee todo; padre y prestadora solo leen las suyas.
      allow read: if isAdmin() || (
        request.auth != null && (
          request.auth.uid == resource.data.uid ||
          request.auth.uid == resource.data.profesionalId
        )
      );
      allow update: if request.auth != null && (
        request.auth.uid == resource.data.uid ||
        request.auth.uid == resource.data.profesionalId ||
        isAdmin()
      );
      allow delete: if isAdmin();
      // Cualquier usuario autenticado puede crear una reserva.
      // La validación de slot disponible ocurre en transacción del cliente.
      allow create: if request.auth != null;
    }

    // ─────────────────────────────────────────────────────────
    // NIDOS (FAMILIAS VINCULADAS)
    // ─────────────────────────────────────────────────────────
    match /nidos/{nidoId} {
      allow read, update: if request.auth != null &&
        (request.auth.uid in resource.data.padresUids || isAdmin());
      allow create: if request.auth != null;
      allow delete: if isAdmin();
    }

    // ─────────────────────────────────────────────────────────
    // BITÁCORAS DE CUIDADO
    // ─────────────────────────────────────────────────────────
    match /bitacoras/{bitacoraId} {
      allow create: if request.auth != null;

      // MODIFICADO: se elimina isPrestador() genérico que permitía a cualquier
      // prestadora leer bitácoras de otros nidos. Ahora el prestador solo puede
      // leer sus propias bitácoras (las que él/ella creó).
      allow read, list: if request.auth != null && (
        esMiembroDelNido(resource.data.nidoId) ||
        resource.data.prestadorId == request.auth.uid ||
        isAdmin()
      );

      allow update, delete: if request.auth != null &&
        (resource.data.prestadorId == request.auth.uid || isAdmin());
    }

    // ─────────────────────────────────────────────────────────
    // FICHAS DE ATENCIÓN (para uso futuro — Fase 3 del plan)
    // ─────────────────────────────────────────────────────────
    match /fichas_atencion/{fichaId} {
      allow create: if request.auth != null;
      allow read, list: if request.auth != null && (
        esMiembroDelNido(resource.data.nidoId) ||
        resource.data.consejeraId == request.auth.uid ||
        isAdmin()
      );
      allow update, delete: if request.auth != null &&
        (resource.data.consejeraId == request.auth.uid || isAdmin());
    }

    // ─────────────────────────────────────────────────────────
    // PRODUCTOS
    // ─────────────────────────────────────────────────────────
    match /productos/{productoId} {
      allow read, list: if request.auth != null;
      allow create, delete: if isAdmin();
      // Parche de stock: solo admin puede editar libremente;
      // usuarios solo pueden reducir el campo `stock`.
      // A mediano plazo: mover descuento de stock a Cloud Function.
      allow update: if isAdmin() || (
        request.auth != null &&
        request.resource.data.diff(resource.data).affectedKeys().hasOnly(['stock']) &&
        request.resource.data.stock >= 0 &&
        request.resource.data.stock < resource.data.stock
      );
    }

    // ─────────────────────────────────────────────────────────
    // PEDIDOS
    // ─────────────────────────────────────────────────────────
    match /pedidos/{pedidoId} {
      allow create: if request.auth != null &&
        request.resource.data.compradorUid == request.auth.uid;
      allow read, list: if request.auth != null &&
        (resource.data.compradorUid == request.auth.uid || isAdmin());
      allow update: if request.auth != null && isAdmin();
      allow delete: if isAdmin();
    }

    // ─────────────────────────────────────────────────────────
    // TIPS DE LACTANCIA
    // ─────────────────────────────────────────────────────────
    match /tips/{tipId} {
      allow read, list: if true;
      allow create, update, delete: if request.auth != null &&
        (datosUsuario().puedeCrearTips == true || isAdmin());
    }

    // ─────────────────────────────────────────────────────────
    // ÍNDICE DE NIDOS (para transacciones seguras de vinculación)
    // Se usa en vincularNidoPorRutBebe con runTransaction.
    // ─────────────────────────────────────────────────────────
    match /nidos_index/{rutBebe} {
      allow read: if request.auth != null;
      allow create, update: if request.auth != null;
      allow delete: if isAdmin();
    }

    // ─────────────────────────────────────────────────────────
    // CIERRE DE SEGURIDAD GLOBAL
    // Cualquier colección no declarada arriba es inaccesible.
    // ─────────────────────────────────────────────────────────
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

## 3. Tabla de Diferencias

| Colección / Regla | Versión Actual | Versión Propuesta | Motivo |
|-------------------|----------------|-------------------|--------|
| `/usuarios` (doble bloque) | Dos bloques `match` separados para el mismo path | Un bloque consolidado | Evita ambigüedad y posibles permisos no deseados |
| `/usuarios` — `create` | Sin validaciones de contenido en uno de los bloques | Validaciones en bloque único: email=token, rol válido | Consistencia |
| `/usuarios/{uid}/bloqueos` | **No existe** | **Añadida** | Funcionalidad rota en producción |
| `/usuarios/{uid}/disponibilidad` | **No existe** | **Añadida** | Nueva subcolección para el modelo de slots |
| `/usuarios/{uid}/caregiverProfile` | **No existe** | **Añadida** | Nueva subcolección de perfil especializado |
| `/usuarios/{uid}/counselorProfile` | **No existe** | **Añadida** | Nueva subcolección de perfil especializado |
| `/usuarios/{uid}/certifications` | **No existe** | **Añadida** | Para flujo de verificación de credenciales |
| `/bitacoras` — `list` | `isPrestador()` permite a cualquier prestador ver todas | `prestadorId == request.auth.uid` restringe a sus propias | Privacidad entre prestadoras |
| `/fichas_atencion` — `list` | `isPrestador()` genérico | `consejeraId == request.auth.uid` | Igual que bitácoras |
| `/nidos_index` | **No existe** | **Añadida** | Necesario para transacciones de vinculación |
| `/reservas`, `/nidos`, `/productos`, `/pedidos`, `/tips` | Sin cambios | Sin cambios | Correctas en la versión actual |
