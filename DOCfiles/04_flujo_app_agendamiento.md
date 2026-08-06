# Flujo de la App — Diagrama de Agendamiento Completo
**LactaNido Platform · Versión 1.0 · Julio 2026**

---

## Tabla de Contenidos
1. [Hallazgos Críticos](#1-hallazgos-críticos)
2. [Flujo Principal de Agendamiento](#2-flujo-principal-de-agendamiento)
3. [Ramas por Tipo de Perfil](#3-ramas-por-tipo-de-perfil)
4. [Flujo de Solapamiento — Prestador Dual](#4-flujo-de-solapamiento--prestador-dual)
5. [Flujo de Cancelación](#5-flujo-de-cancelación)
6. [Flujo de Notificaciones](#6-flujo-de-notificaciones)
7. [Flujo Tienda Mercado Libre](#7-flujo-tienda-mercado-libre)
8. [Recomendaciones de Mejora](#8-recomendaciones-de-mejora-priorizadas)

---

## 1. Hallazgos Críticos

### 1.1 Campo `profesionalId` no se asigna en el formulario de agendamiento ⚠️ ALTA SEVERIDAD
El flujo de agendamiento actual (modal en `index.html`) no muestra lógica de selección de prestadora específica. La función `fetchServiceAppointments` filtra por `profesionalId`, pero ese campo no se puede asignar si la UI no permite elegir a qué profesional se le asigna la reserva.

**Consecuencia:** Las citas creadas por padres posiblemente no tienen `profesionalId`, por lo que ninguna cuidadora/consejera las ve en su dashboard.

### 1.2 Sin flujo de confirmación por parte de la prestadora
El flujo actual no contempla que la prestadora **acepte o rechace** la reserva. La reserva se crea directamente como `estado: 'pendiente'`, pero no hay UI ni Cloud Function que notifique a la prestadora para confirmar.

### 1.3 Sin notificaciones push o por email al padre
El flujo no tiene ningún paso de notificación al padre cuando la prestadora acepta, rechaza o completa un turno. El módulo `emailService.js` existe pero no está integrado en el flujo de reservas.

---

## 2. Flujo Principal de Agendamiento

```
PADRE (usuario autenticado)
│
├─► Accede a Dashboard → Tab "Resumen"
│
├─► Click "Agendar Nueva Cita"
│     ↓
│   [Modal de agendamiento]
│     ├── Selecciona tipo de servicio: Cuidado | Consejería
│     ├── Selecciona zona geográfica (solo para Cuidado)
│     ├── Selecciona fecha (calendario)
│     └── Selecciona franja horaria
│          ↓
│   [Sistema busca slots disponibles]
│     ├── Query: /disponibilidad donde servicio=X, zona=Y, fecha=Z, reservado=false
│     └── Resultado: lista de prestadoras disponibles con ese slot
│          ↓
│   [Padre elige prestadora]
│     ├── Ve foto, nombre, especialidades, calificación, tarifas
│     └── Click "Reservar con [nombre]"
│          ↓
│   [Confirmación de reserva]
│     ├── Muestra resumen: prestadora, fecha, hora, duración, tarifa estimada
│     └── Click "Confirmar reserva"
│          ↓
│   [Transacción atómica en Firestore]
│     ├── Marca slot como reservado: true, bookingId: reservaId
│     ├── Crea documento en /reservas con profesionalId asignado
│     └── ¿Éxito?
│          ├── SÍ → Toast "¡Reserva confirmada!" → Email a padre y prestadora
│          └── NO (slot ya tomado) → Toast "Horario no disponible" → volver a lista
```

---

## 3. Ramas por Tipo de Perfil

### 3.1 Rama Cuidadora

```
PRESTADORA (rol: cuidadora)
│
├─► Accede a Dashboard → Tab "Mis turnos asignados"
│     └── Lista citas con estado pendiente/completada
│
├─► Tab "Mi disponibilidad"
│     ├── [+ Declarar turno disponible]
│     │     ├── Ingresa fecha inicio, fecha fin, zona
│     │     ├── Detección de solapamiento (si rol dual)
│     │     │     ├── Sin conflicto → guarda slot → aparece en lista
│     │     │     └── Con conflicto → Modal advertencia (ver §4)
│     │     └── Slot creado en /usuarios/{uid}/disponibilidad
│     │
│     └── Sección "Días bloqueados"
│           ├── [+ Añadir bloqueo de fecha]
│           │     └── Ingresa fecha + motivo opcional → guarda en /bloqueos
│           └── Lista bloqueos activos con botón Eliminar
│
├─► Cita asignada → Click "Completar Bitácora"
│     ├── Modal de ficha de cuidado
│     │     ├── tipoAlimentacion, horasSueno, cantidadPanales
│     │     ├── horasEfectivas, observaciones
│     │     └── Click "Guardar bitácora"
│     │          ├── Crea documento en /bitacoras
│     │          ├── Actualiza reserva a estado: 'completada'
│     │          └── Toast "Bitácora guardada ✅"
│     └── Cita marcada como "Bitácora Registrada" (no editable)
```

### 3.2 Rama Consejera

```
PRESTADORA (rol: consejera)
│
├─► Tab "Mis citas"
│     └── Lista citas de tipo Consultor con estado pendiente/completada
│
├─► Tab "Mis horarios"
│     ├── Vista semanal con slots existentes
│     ├── [+ Añadir bloque]
│     │     ├── Selecciona día(s), hora inicio, hora fin
│     │     ├── Detección de solapamiento (si rol dual)
│     │     │     ├── Sin conflicto → guarda slot
│     │     │     └── Con conflicto → Modal advertencia (ver §4)
│     │     └── Slot creado en /disponibilidad con servicio: 'consejeria'
│     └── Click en slot existente → modal de edición/eliminación
│
├─► Cita asignada → Click "Registrar Bitácora"
│     └── (mismo flujo que cuidadora con campos diferenciados)
```

### 3.3 Rama Admin

```
ADMIN
│
├─► Dashboard con estadísticas (fetchAdminStats)
│     ├── Total usuarios activos/pendientes
│     ├── Citas activas
│     ├── Total prestadores (deduplicado por rol dual)
│     └── Prestadores pendientes de aprobación
│
├─► Aprobar/rechazar usuarios pendientes
│     ├── Lista usuarios con estado: 'pendiente'
│     └── Click "Aprobar" → updateDoc estado: 'activo'
│
├─► Gestión de productos
│     ├── Ver lista de productos activos
│     ├── [+ Crear producto] con campo mercadoLibreUrl
│     ├── [Editar] → puede modificar todos los campos
│     └── [Eliminar] → soft delete (activo: false)
│
└─► Vista de todas las reservas
      └── Filtro por servicio, estado, fecha
```

---

## 4. Flujo de Solapamiento — Prestador Dual

```
PRESTADORA DUAL intenta guardar nuevo slot
│
├─► [JS] Cargar todos sus slots existentes de /disponibilidad
│
├─► [JS] detectarSolapamiento(nuevoSlot, slotsExistentes, minRestHours)
│
├─► ¿Hay conflictos?
│     │
│     ├── NO → Guardar slot directamente
│     │           └── Toast "Turno agregado ✅"
│     │
│     └── SÍ → Mostrar modal de advertencia
│                   │
│                   ├── Muestra: turnos en conflicto, brecha de descanso,
│                   │           preferencia personal si está configurada
│                   │
│                   └── Prestadora elige:
│                         │
│                         ├── [← Ajustar horario]
│                         │     └── Cierra modal, vuelve al formulario
│                         │         con los campos pre-cargados para editar
│                         │
│                         └── [Confirmar y guardar ✓]
│                               │
│                               └── [Firestore] Guardar slot con:
│                                     allowOverlap: true
│                                     overlapConfirmedAt: now()
│                                     overlapConfirmedBy: uid
│                                     overlapWithSlotId: slotConflicto.id
│                                     │
│                                     └── Toast "Turno guardado con
│                                         solapamiento registrado ⚠️"

CASOS DE PRUEBA DOCUMENTADOS

CASO 1: Solapamiento aceptado
  Slot existente:  Consejería Mar 08/07 09:00 → 13:00
  Slot nuevo:      Cuidado    Lun 07/07 21:00 → Mar 08/07 08:00
  Diferencia:      1 hora (08:00 → 09:00)
  Resultado:       Sistema advierte → Prestadora acepta
  Firestore:       allowOverlap: true, overlapConfirmedAt: [timestamp]

CASO 2: Prestadora ajusta tras advertencia
  Slot existente:  Consejería Mié 09/07 09:00 → 13:00
  Slot nuevo (1er intento): Cuidado Mar 08/07 22:00 → Mié 09/07 09:00
  Diferencia:      0 horas (solapamiento exacto al inicio)
  Resultado:       Sistema advierte → Prestadora ajusta fin a 07:00
  Slot nuevo (2do intento): Cuidado Mar 08/07 22:00 → Mié 09/07 07:00
  Diferencia:      2 horas → No hay advertencia → Guarda directamente

CASO 3: Sábado sin bloqueo
  Slot existente:  Consejería Sáb 12/07 09:00 → 13:00
  Slot nuevo:      Cuidado    Sáb 12/07 21:00 → Dom 13/07 07:00
  Diferencia:      8 horas (13:00 → 21:00)
  Resultado:       Sin conflicto → Guarda directamente sin advertencia
  Nota:            Aunque la prestadora trabaja dos veces el mismo día,
                   la brecha de 8 horas es suficiente → flujo silencioso
```

---

## 5. Flujo de Cancelación

```
PADRE cancela reserva
│
├─► Dashboard → Tab "Mis citas"
├─► Click "Cancelar" en cita con estado 'pendiente'
│
├─► Modal confirmación: "¿Seguro que deseas cancelar?"
│     ├── [No, mantener]  →  Cierra modal
│     └── [Sí, cancelar]
│           ↓
│     [Transacción]
│     ├── Actualiza /reservas/{id}: estado: 'cancelada'
│     ├── Actualiza /disponibilidad/{slotId}: reservado: false, bookingId: null
│     └── Notificación por email a la prestadora (emailService)
│           └── Toast "Reserva cancelada"

PRESTADORA cancela reserva
│
├─► Dashboard → Tab "Turnos asignados"
├─► Click "Cancelar turno" en cita pendiente
│
├─► Modal: "El padre será notificado de la cancelación"
│     └── [Confirmar cancelación]
│           ↓
│     [Transacción] (igual que arriba)
│     └── Notificación por email al padre
```

---

## 6. Flujo de Notificaciones

```
EVENTOS que generan notificación (vía emailService.js o Cloud Function)

Reserva creada
  → Email a PADRE: "Tu reserva fue confirmada. [detalles]"
  → Email a PRESTADORA: "Tienes una nueva reserva. [detalles]"

Reserva completada (bitácora guardada)
  → Email a PADRE: "La bitácora del turno del [fecha] está disponible."

Reserva cancelada por padre
  → Email a PRESTADORA: "El padre canceló la cita del [fecha]."

Reserva cancelada por prestadora
  → Email a PADRE: "Tu prestadora canceló la cita del [fecha]. Reagenda aquí."

Usuario aprobado por admin
  → Email a PRESTADORA: "Tu cuenta ha sido aprobada. Ya puedes recibir reservas."

Solapamiento aceptado (registro interno, sin email)
  → Solo se escribe en Firestore con timestamp y uid confirmador
```

---

## 7. Flujo Tienda Mercado Libre

```
PADRE en Tab "Tienda"
│
├─► Lista de productos (fetchActiveProducts)
│
├─► Click en IMAGEN del producto
│     └── Si tiene mercadoLibreUrl → abre en nueva pestaña de ML
│
├─► Click en BOTÓN "Ver en Mercado Libre 🛒"
│     └── Si tiene mercadoLibreUrl → abre en nueva pestaña de ML
│     └── Si no tiene ML URL y tiene whatsappNumber → abre WhatsApp
│
└─► (No hay carrito, no hay checkout interno para productos de ML)
     Nota: El flujo de carrito interno y createPedido se mantiene
     solo para productos que NO tengan mercadoLibreUrl y sean
     productos gestionados por LactaNido con stock propio.

ADMIN gestiona producto con Mercado Libre
│
├─► Dashboard → Tab "Tienda"
├─► [+ Crear producto]
│     ├── nombre, precio, descripcion, categoria, imagenUrl
│     ├── stock (si es producto propio)
│     └── mercadoLibreUrl (campo obligatorio para productos ML)
│           └── Validación de formato antes de guardar
│
└─► [Editar producto existente]
      └── Puede añadir mercadoLibreUrl a productos legacy con whatsappNumber
```

---

## 8. Recomendaciones de Mejora (Priorizadas)

### 🔴 Impacto alto / Esfuerzo medio
1. **Implementar selección de prestadora en modal de agendamiento** — sin esto, el campo `profesionalId` nunca se asigna y las citas son invisibles para las prestadoras.
2. **Implementar transacción de reserva de slot** — previene dobles reservas en concurrencia.
3. **Integrar emailService en flujo de reservas** — padre y prestadora deben recibir confirmación.

### 🔴 Impacto alto / Esfuerzo bajo
4. **Implementar flujo de solapamiento** con modal de advertencia antes del `addDoc` de disponibilidad.

### 🟡 Impacto medio / Esfuerzo medio
5. **Flujo de aceptación/rechazo de reserva por la prestadora** — actualmente no existe, la reserva queda en 'pendiente' indefinidamente.
6. **Historial de solapamientos confirmados** — vista en el perfil del prestador para auditoría propia.

### 🟢 Impacto bajo / Esfuerzo bajo
7. **Estado "Cancelada por prestadora"** diferenciado de "Cancelada por padre" en historial del padre.
8. **Feedback visual de disponibilidad en tiempo real** — indicador de "cargando disponibilidad" al seleccionar fecha en modal de agendamiento.
