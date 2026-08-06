# Plan de Implementación — Fases, Esfuerzo, Riesgos y Testing
**LactaNido Platform · Versión 1.0 · Julio 2026**

---

## Tabla de Contenidos
1. [Hallazgos Críticos](#1-hallazgos-críticos)
2. [Visión General del Plan](#2-visión-general-del-plan)
3. [Fase 0 — Correcciones Críticas de Seguridad](#3-fase-0--correcciones-críticas-de-seguridad)
4. [Fase 1 — Quick Wins Funcionales](#4-fase-1--quick-wins-funcionales)
5. [Fase 2 — Modelo de Disponibilidad](#5-fase-2--modelo-de-disponibilidad)
6. [Fase 3 — Solapamientos y Rol Dual](#6-fase-3--solapamientos-y-rol-dual)
7. [Fase 4 — Agendamiento End-to-End](#7-fase-4--agendamiento-end-to-end)
8. [Fase 5 — Calidad y Escalabilidad](#8-fase-5--calidad-y-escalabilidad)
9. [Riesgos y Dependencias](#9-riesgos-y-dependencias)
10. [Plan de Testing](#10-plan-de-testing)
11. [Criterios de Done](#11-criterios-de-done)
12. [Recomendaciones de Mejora](#12-recomendaciones-de-mejora-priorizadas)

---

## 1. Hallazgos Críticos

### 1.1 La Fase 0 es no negociable ⚠️ PRODUCCIÓN AFECTADA
La subcolección `/bloqueos` no tiene reglas Firestore. Cualquier cuidadora que intente bloquear un día en producción recibe un error de permisos. Esto rompe una funcionalidad existente y visible para usuarios. Debe corregirse en la próxima ventana de despliegue.

### 1.2 El flujo de agendamiento tiene un gap estructural
El modal de agendamiento crea una reserva pero no asigna `profesionalId`. Esto hace que la cita sea invisible para la prestadora. Las fases 1 y 4 abordan esto, pero el equipo debe ser consciente de que las citas creadas antes de la Fase 4 requerirán una migración de datos.

### 1.3 Las Fases 2 y 3 son dependientes entre sí
El modelo de disponibilidad (Fase 2) debe estar completo antes de implementar la detección de solapamientos (Fase 3). No se deben iniciar en paralelo si el equipo es de una sola persona.

---

## 2. Visión General del Plan

```
LÍNEA DE TIEMPO ESTIMADA

Semana 1    │ FASE 0 │ Correcciones críticas de seguridad (1-2 días)
Semana 1-2  │ FASE 1 │ Quick wins funcionales — tienda ML, sábado (3-5 días)
Semana 2-3  │ FASE 2 │ Modelo de disponibilidad — subcolección + UI (5-7 días)
Semana 3-4  │ FASE 3 │ Solapamientos y rol dual (4-6 días)
Semana 4-6  │ FASE 4 │ Agendamiento end-to-end — búsqueda + transacción (7-10 días)
Semana 6+   │ FASE 5 │ Calidad, escalabilidad y Cloud Functions (5-8 días)

ESFUERZO TOTAL ESTIMADO: 25-38 días de desarrollo (trabajo individual)
```

### Matriz de impacto/esfuerzo

```
IMPACTO
  Alto │ F0: Regla bloqueos  │ F2: Modelo disponib.   │ F4: Agendamiento E2E
       │ F1: Tienda ML (img) │ F3: Solapamientos      │ F5: Cloud Functions
       │                     │                         │
  Med  │ F1: Sábado consej.  │ F3: Vista dual          │ F5: Notificaciones
       │                     │                         │
  Bajo │ F1: Prefij. desc.   │ F5: Cache stats         │ F5: Agr. diario
       ├─────────────────────┴─────────────────────────┴─────────────────────
       │  Bajo (< 1 día)       Medio (2-5 días)          Alto (> 5 días)
                                                       ESFUERZO
```

---

## 3. Fase 0 — Correcciones Críticas de Seguridad

**Objetivo:** Corregir errores que afectan la producción actual.
**Esfuerzo:** 1-2 días
**Dependencias:** Ninguna
**Riesgo si no se hace:** Funcionalidad de bloqueos rota; privacidad de bitácoras comprometida.

### Tareas

| # | Tarea | Archivo | Esfuerzo |
|---|-------|---------|---------|
| F0-1 | Añadir regla Firestore para `/usuarios/{uid}/bloqueos` | `firestore.rules` | 30 min |
| F0-2 | Consolidar doble bloque `match /usuarios/{userId}` | `firestore.rules` | 1h |
| F0-3 | Corregir regla `list` de `/bitacoras` (quitar `isPrestador()` genérico) | `firestore.rules` | 1h |
| F0-4 | Deploy de reglas y smoke test manual de bloqueos | Firebase Console | 30 min |

### Regla Firestore a añadir (F0-1)

```javascript
match /usuarios/{userId}/bloqueos/{bloqueoId} {
  allow read, list: if request.auth != null &&
    (request.auth.uid == userId || isAdmin());
  allow create: if request.auth != null && request.auth.uid == userId;
  allow delete: if request.auth != null &&
    (request.auth.uid == userId || isAdmin());
  allow update: if isAdmin();
}
```

### Criterio de Done F0
- [ ] Cuidadora puede agregar y eliminar bloqueos de fechas sin error de permisos
- [ ] Una prestadora no puede ver bitácoras de nidos a los que no pertenece
- [ ] Deploy de reglas verificado en entorno de producción

---

## 4. Fase 1 — Quick Wins Funcionales

**Objetivo:** Cambios de alto impacto y bajo esfuerzo que mejoran la experiencia inmediatamente.
**Esfuerzo:** 3-5 días
**Dependencias:** F0 completa

### Tareas

| # | Tarea | Archivo | Esfuerzo |
|---|-------|---------|---------|
| F1-1 | Wrappear imagen de producto en `<a href>` con `mercadoLibreUrl` | `src/views/padre.js` | 1h |
| F1-2 | Cambiar botón "Agregar 🛒" a enlace de ML | `src/views/padre.js` | 1h |
| F1-3 | Agregar fallback a WhatsApp cuando no hay URL de ML | `src/views/padre.js` | 1h |
| F1-4 | Validación de `mercadoLibreUrl` en formulario de admin | `src/views/admin.js` | 2h |
| F1-5 | Añadir columna Sábado a tabla de horarios de Consejera | `src/views/consejera.js` | 2h |
| F1-6 | Añadir bloque 09:00-13:00 del Sábado como opción toggle | `src/views/consejera.js` | 1h |
| F1-7 | Script de migración de productos legacy (agregar campo `null`) | `src/seed.js` o admin panel | 2h |
| F1-8 | Actualizar campo `mercadoLibreUrl` en Firestore para productos existentes | Firebase Console / script | 1h |

### Código — Cambio crítico en renderTiendaProductos

```javascript
// ANTES (en padre.js)
grid.innerHTML = filtered.map(p => `
  <div class="...">
    <img src="${p.imagenUrl}" ... />
    ...
    <button class="btn-agregar-carrito ...">Agregar 🛒</button>
  </div>
`).join('');

// DESPUÉS
grid.innerHTML = filtered.map(p => {
  const urlDestino = p.mercadoLibreUrl || (p.whatsappNumber ? `https://wa.me/${p.whatsappNumber}` : null);
  const labelBtn = p.mercadoLibreUrl ? 'Ver en Mercado Libre 🛒' : 'Contactar por WhatsApp 💬';

  return `
    <div class="bg-white rounded-xl shadow-sm border border-[#e5dfdc] p-5 flex flex-col items-center hover:shadow-md transition-all">
      ${urlDestino
        ? `<a href="${escapeHTML(urlDestino)}" target="_blank" rel="noopener noreferrer" class="block w-full">
             <img src="${escapeHTML(p.imagenUrl || '')}" alt="${escapeHTML(p.nombre)}"
                  class="w-full h-32 object-cover rounded-lg mb-4 hover:opacity-90 transition-opacity" />
           </a>`
        : `<img src="${escapeHTML(p.imagenUrl || '')}" alt="${escapeHTML(p.nombre)}"
                class="w-full h-32 object-cover rounded-lg mb-4" />`
      }
      <h4 class="font-bold text-[#181411] text-center mb-1 line-clamp-2 h-10">${escapeHTML(p.nombre)}</h4>
      <p class="text-[#e87a30] font-black text-xl mb-1">$${p.precio.toLocaleString('cl-CL')}</p>
      <p class="text-xs text-gray-400 mb-4">Stock: ${p.stock}</p>
      ${urlDestino
        ? `<a href="${escapeHTML(urlDestino)}" target="_blank" rel="noopener noreferrer"
              class="w-full bg-[#181411] text-white py-2 rounded-lg text-sm font-bold
                     hover:bg-[#e87a30] transition-colors text-center block">
             ${labelBtn}
           </a>`
        : `<button disabled class="w-full bg-gray-200 text-gray-400 py-2 rounded-lg text-sm cursor-not-allowed">
             Sin enlace configurado
           </button>`
      }
    </div>
  `;
}).join('');
```

### Criterio de Done F1
- [ ] Click en imagen de producto abre Mercado Libre en nueva pestaña
- [ ] Botón de acción redirige a ML (no a carrito)
- [ ] Fallback WhatsApp funciona para productos sin URL de ML
- [ ] Consejera ve columna Sábado y puede activar el bloque 09:00–13:00
- [ ] Sábado se guarda en Firestore correctamente

---

## 5. Fase 2 — Modelo de Disponibilidad

**Objetivo:** Migrar de `horarios{}` plano a subcolección `/disponibilidad/{slotId}`.
**Esfuerzo:** 5-7 días
**Dependencias:** F0, F1

### Tareas

| # | Tarea | Archivo | Esfuerzo |
|---|-------|---------|---------|
| F2-1 | Añadir regla Firestore para `/disponibilidad` | `firestore.rules` | 30 min |
| F2-2 | Crear función `agregarSlotDisponibilidad()` | `src/api/firestore.js` | 2h |
| F2-3 | Crear función `obtenerSlotsDisponibilidad()` | `src/api/firestore.js` | 1h |
| F2-4 | Crear función `eliminarSlotDisponibilidad()` | `src/api/firestore.js` | 30 min |
| F2-5 | Rediseñar pestaña "Disponibilidad" de Cuidadora | `src/views/cuidadora.js` | 4h |
| F2-6 | Rediseñar pestaña "Horarios" de Consejera | `src/views/consejera.js` | 4h |
| F2-7 | Modal "Nuevo turno/bloque horario" (compartido) | `src/modales.js` | 3h |
| F2-8 | Migrar horarios existentes de `horarios{}` a subcolección | Script en `src/seed.js` | 2h |
| F2-9 | Añadir índices compuestos en `firestore.indexes.json` | `firestore.indexes.json` | 1h |

### Criterio de Done F2
- [ ] Cuidadora puede crear slots con fecha/hora de inicio y fin
- [ ] Consejera puede crear slots para cualquier día incluyendo sábado con horario libre
- [ ] Los slots se guardan en `/usuarios/{uid}/disponibilidad/{slotId}`
- [ ] La lista de slots muestra estado (disponible/reservado) correctamente
- [ ] Los horarios del modelo antiguo (`horarios{}`) se migran sin pérdida

---

## 6. Fase 3 — Solapamientos y Rol Dual

**Objetivo:** Implementar detección de solapamientos con advertencia (no bloqueo) y trazabilidad.
**Esfuerzo:** 4-6 días
**Dependencias:** F2 completa

### Tareas

| # | Tarea | Archivo | Esfuerzo |
|---|-------|---------|---------|
| F3-1 | Implementar `detectarSolapamientos()` | `src/utils/disponibilidad.js` (nuevo) | 2h |
| F3-2 | Integrar detección en flujo de guardado de slot | `src/views/cuidadora.js`, `consejera.js` | 2h |
| F3-3 | Crear modal de advertencia de solapamiento | `src/modales.js` | 3h |
| F3-4 | Guardar `allowOverlap` + `overlapConfirmedAt` en slot | `src/api/firestore.js` | 1h |
| F3-5 | Panel de preferencias de descanso en perfil | `src/mi-cuenta.js` | 2h |
| F3-6 | Vista de calendario unificada para rol dual | `src/views/prestador.js` | 4h |
| F3-7 | Tests de los 3 casos de prueba documentados | Manual + smoke test | 2h |

### Criterio de Done F3
- [ ] CASO 1: Sistema advierte solapamiento de 1h → prestadora confirma → `allowOverlap: true` en Firestore
- [ ] CASO 2: Prestadora ajusta horario tras advertencia → guardado sin conflicto
- [ ] CASO 3: Sábado con 8h de brecha → guardado sin advertencia
- [ ] El campo `overlapConfirmedAt` y `overlapConfirmedBy` quedan registrados correctamente
- [ ] La preferencia de `minRestHours` activa advertencias adicionales

---

## 7. Fase 4 — Agendamiento End-to-End

**Objetivo:** Completar el flujo de reserva con selección de prestadora, transacción atómica y slot liberado en cancelación.
**Esfuerzo:** 7-10 días
**Dependencias:** F2, F3

### Tareas

| # | Tarea | Archivo | Esfuerzo |
|---|-------|---------|---------|
| F4-1 | Crear `buscarPrestadorasDisponibles()` | `src/api/firestore.js` | 3h |
| F4-2 | Rediseñar modal de agendamiento con selección de prestadora | `index.html` + `src/formularios.js` | 5h |
| F4-3 | Crear `reservarSlotConTransaccion()` | `src/api/firestore.js` | 2h |
| F4-4 | Crear `cancelarReserva()` con liberación de slot | `src/api/firestore.js` | 2h |
| F4-5 | Botón "Cancelar" en vista del padre | `src/views/padre.js` | 1h |
| F4-6 | Botón "Cancelar turno" en vista de prestadora | `src/views/cuidadora.js`, `consejera.js` | 1h |
| F4-7 | Manejo de error por slot ya tomado (concurrencia) | `src/views/padre.js` | 1h |
| F4-8 | Migración de reservas existentes sin `slotId` | Script de migración | 2h |

### Criterio de Done F4
- [ ] El padre puede buscar prestadoras por zona, servicio y franja horaria
- [ ] El padre puede seleccionar una prestadora específica y confirmar la reserva
- [ ] La reserva asigna `profesionalId` correctamente
- [ ] La prestadora ve la cita en su dashboard inmediatamente después de la reserva
- [ ] La doble reserva del mismo slot es rechazada con mensaje de error claro
- [ ] La cancelación libera el slot y actualiza el estado de la reserva

---

## 8. Fase 5 — Calidad y Escalabilidad

**Objetivo:** Añadir Cloud Functions, notificaciones y optimizaciones de rendimiento.
**Esfuerzo:** 5-8 días
**Dependencias:** F4

### Tareas

| # | Tarea | Esfuerzo |
|---|-------|---------|
| F5-1 | Cloud Function: notificación email al crear reserva | 3h |
| F5-2 | Cloud Function: notificación email al cancelar reserva | 2h |
| F5-3 | Cloud Function: procesamiento de certificaciones (thumbnail) | 4h |
| F5-4 | Cloud Function: validación de `mercadoLibreUrl` en productos | 2h |
| F5-5 | Cloud Function: mover descuento de stock fuera de reglas Firestore | 4h |
| F5-6 | Mejorar `vincularNidoPorRutBebe` con transacción + `nidos_index` | 2h |
| F5-7 | Reemplazar `.sort()` en memoria por `orderBy` en queries con índices | 2h |
| F5-8 | Cloud Function: agregado diario de disponibilidad (cron) | 3h |
| F5-9 | Subcolecciones `caregiverProfile` y `counselorProfile` con UI | 6h |
| F5-10 | Subcolección `certifications` con UI de carga y vista admin | 5h |

### Criterio de Done F5
- [ ] Las prestadoras reciben email al tener nueva reserva
- [ ] Los padres reciben email de confirmación de reserva
- [ ] El descuento de stock ocurre en Cloud Function, no en regla Firestore
- [ ] Las queries usan `orderBy` con índices en lugar de sort en memoria

---

## 9. Riesgos y Dependencias

### 9.1 Matriz de riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| CollectionGroup query no soportada sin índice deploy | Alta | Alto | Desplegar índices ANTES de implementar la búsqueda F4-1 |
| Pérdida de datos en migración de `horarios{}` a subcolección | Media | Alto | Hacer backup de colección `/usuarios` antes de migrar |
| Doble reserva en producción antes de F4 | Media | Alto | Comunicar a usuarios como limitación conocida; monitorear manualmente |
| `emailService.js` con cuota excedida de EmailJS | Media | Medio | Limitar notificaciones a eventos críticos; migrar a Firebase Extensions |
| Reglas Firestore muy permisivas en `/bitacoras` exponen datos | Alta | Alto | Incluido en F0; prioridad máxima |

### 9.2 Mapa de dependencias entre documentos

```
01_PRD → define requerimientos
  └─► 02_TRD → define modelo de datos
        ├─► 03_UIUX → define los flujos de UI
        │     └─► 04_Flujo → detalla el flujo completo
        └─► 05_Backend → define la implementación técnica
              └─► 06_Plan (este doc) → secuencia las fases

Dependencias entre fases:
  F0 → F1 → F2 → F3 → F4 → F5
       ↑              ↑
  (independiente)  (depende de F2+F3)
```

---

## 10. Plan de Testing

### 10.1 Tests unitarios (JavaScript puro)

```javascript
// src/utils/__tests__/disponibilidad.test.js

import { detectarSolapamientos } from '../disponibilidad.js';

describe('detectarSolapamientos', () => {

  const slotConsejeria = {
    id: 'cons-1',
    servicio: 'consejeria',
    fechaInicio: new Date('2026-07-08T09:00:00'),
    fechaFin: new Date('2026-07-08T13:00:00'),
  };

  // CASO 1: Solapamiento real con 1h de diferencia
  test('debe detectar solapamiento cuando brecha es 1h', () => {
    const nuevoCuidado = {
      servicio: 'cuidado',
      fechaInicio: new Date('2026-07-07T21:00:00'),
      fechaFin: new Date('2026-07-08T08:00:00'), // 1h antes de consejería
    };
    const resultado = detectarSolapamientos(nuevoCuidado, [slotConsejeria], 4);
    expect(resultado).toHaveLength(1);
    expect(resultado[0].tipo).toBe('descanso_insuficiente');
    expect(resultado[0].brechaHoras).toBe(1);
  });

  // CASO 2: Sin solapamiento (2h de brecha, preferencia 4h)
  test('debe detectar descanso insuficiente con 2h de brecha y preferencia de 4h', () => {
    const nuevoCuidado = {
      servicio: 'cuidado',
      fechaInicio: new Date('2026-07-07T22:00:00'),
      fechaFin: new Date('2026-07-08T07:00:00'), // 2h antes de consejería a las 09:00
    };
    const resultado = detectarSolapamientos(nuevoCuidado, [slotConsejeria], 4);
    expect(resultado).toHaveLength(1);
    expect(resultado[0].tipo).toBe('descanso_insuficiente');
    expect(resultado[0].brechaHoras).toBe(2);
  });

  // CASO 3: Sábado — sin conflicto con 8h de brecha
  test('no debe detectar conflicto con 8h de brecha', () => {
    const slotConsSabado = {
      id: 'cons-sab',
      servicio: 'consejeria',
      fechaInicio: new Date('2026-07-12T09:00:00'),
      fechaFin: new Date('2026-07-12T13:00:00'),
    };
    const nuevoCuidadoNoche = {
      servicio: 'cuidado',
      fechaInicio: new Date('2026-07-12T21:00:00'),
      fechaFin: new Date('2026-07-13T07:00:00'),
    };
    const resultado = detectarSolapamientos(nuevoCuidadoNoche, [slotConsSabado], 4);
    expect(resultado).toHaveLength(0);
  });

  // Solapamiento real (intersección de intervalos)
  test('debe detectar solapamiento real cuando intervalos se intersectan', () => {
    const slotSolapado = {
      id: 'cons-2',
      servicio: 'consejeria',
      fechaInicio: new Date('2026-07-08T07:00:00'),
      fechaFin: new Date('2026-07-08T11:00:00'),
    };
    const nuevoCuidado = {
      servicio: 'cuidado',
      fechaInicio: new Date('2026-07-07T21:00:00'),
      fechaFin: new Date('2026-07-08T09:00:00'), // se superpone 2h
    };
    const resultado = detectarSolapamientos(nuevoCuidado, [slotSolapado], 0);
    expect(resultado).toHaveLength(1);
    expect(resultado[0].tipo).toBe('solapamiento_real');
    expect(resultado[0].brechaHoras).toBe(0);
  });

  // Mismo tipo de servicio — no debe detectarse como conflicto
  test('no debe detectar conflicto entre slots del mismo servicio', () => {
    const otroCuidado = {
      id: 'cuid-2',
      servicio: 'cuidado',
      fechaInicio: new Date('2026-07-08T09:00:00'),
      fechaFin: new Date('2026-07-08T13:00:00'),
    };
    const nuevoCuidado = {
      servicio: 'cuidado',
      fechaInicio: new Date('2026-07-07T21:00:00'),
      fechaFin: new Date('2026-07-08T08:00:00'),
    };
    const resultado = detectarSolapamientos(nuevoCuidado, [otroCuidado], 4);
    expect(resultado).toHaveLength(0);
  });
});
```

### 10.2 Tests de integración (manual con Firebase Emulator)

| Test | Pasos | Resultado esperado |
|------|-------|-------------------|
| INT-01: Reserva concurrente | Dos pestañas intentan reservar el mismo slot simultáneamente | Solo una reserva tiene éxito; la segunda recibe error |
| INT-02: Bloqueo de fecha | Cuidadora bloquea 14/07; padre intenta agendar el 14/07 | Slot no aparece en resultados de búsqueda |
| INT-03: Slot liberado en cancelación | Padre crea reserva, luego cancela | Slot vuelve a `reservado: false`; bookingId: null |
| INT-04: Reglas Firestore — prestadora no ve bitácoras ajenas | Prestadora A intenta leer bitácoras del nido B (al que no pertenece) | Permiso denegado |
| INT-05: Stock en transacción | Dos padres compran el último ítem de stock simultáneamente | Solo uno tiene éxito; stock no llega a -1 |

### 10.3 Edge cases de horarios — casos adicionales

| Caso | Descripción | Resultado esperado |
|------|-------------|-------------------|
| EC-01 | Turno de cuidado que cruza medianoche (21:00 → 08:00) | Sistema calcula correctamente la duración de 11h |
| EC-02 | Slot con `fechaInicio == fechaFin` | Sistema rechaza con error de validación |
| EC-03 | Bloqueo de fecha coincide con slot disponible | Slot aparece como bloqueado en búsqueda del padre |
| EC-04 | Prestadora sin `minRestHours` configurado | No se emite advertencia de descanso (solo de solapamiento real) |
| EC-05 | Prestadora con un solo rol intenta crear slot del otro tipo | Sistema rechaza; campo `servicio` debe coincidir con roles del usuario |
| EC-06 | Slot con `allowOverlap: true` que se reserva | El solapamiento confirmado no impide que el slot sea reservable |
| EC-07 | Búsqueda en zona inexistente | Devuelve lista vacía sin error |
| EC-08 | Turno que comienza y termina a la misma hora que otro comienza | Brecha de 0 → advertencia si hay preferencia de descanso |

---

## 11. Criterios de Done

### Por fase

**F0 — Seguridad:**
- [ ] 0 errores de permisos en funcionalidad de bloqueos
- [ ] Reglas desplegadas y verificadas en Firebase Console

**F1 — Quick wins:**
- [ ] Imagen de producto es clickeable y abre ML
- [ ] Consejera tiene opción de sábado en su grilla de horarios

**F2 — Disponibilidad:**
- [ ] Subcolección `/disponibilidad` existe y recibe escrituras
- [ ] No hay más uso del campo `horarios{}` en código nuevo
- [ ] Migración ejecutada sin pérdida de datos

**F3 — Solapamientos:**
- [ ] 3 casos de prueba documentados pasan manualmente
- [ ] `allowOverlap` se persiste correctamente en Firestore
- [ ] Un tercero (padre) no puede ver el campo `allowOverlap` de una prestadora

**F4 — Agendamiento:**
- [ ] Padre completa el flujo búsqueda → selección → confirmación sin salir del modal
- [ ] `profesionalId` siempre presente en reservas creadas desde F4 en adelante
- [ ] Test de concurrencia INT-01 pasa

**F5 — Calidad:**
- [ ] Al menos 2 Cloud Functions desplegadas en producción
- [ ] 0 `.sort()` en memoria para colecciones con más de 50 documentos esperados

---

## 12. Recomendaciones de Mejora (Priorizadas)

### 🔴 Impacto alto / Esfuerzo bajo — Hacer en los próximos 2 días
1. **F0 completa** — Corregir reglas Firestore antes que cualquier otra cosa.
2. **F1-1 a F1-3** — Cambio de imagen y botón en tienda; impacto inmediato para usuarios.

### 🔴 Impacto alto / Esfuerzo medio — Hacer en la próxima semana
3. **F2** — Migrar modelo de disponibilidad; bloquea todas las fases siguientes.
4. **F1-5 y F1-6** — Sábado en consejera; corrige un gap visible en la UI actual.

### 🟡 Impacto medio / Esfuerzo medio — Planificar para semanas 3-4
5. **F3** — Solapamientos; necesario antes del lanzamiento de rol dual.
6. **F4** — Agendamiento completo; el más complejo pero el que cierra el flujo core.

### 🟢 Impacto medio / Esfuerzo alto — Planificar para después del MVP
7. **F5** — Cloud Functions y calidad; mejoras de robustez post-MVP.
8. **Certificaciones y perfiles especializados** — Diferenciación competitiva a mediano plazo.
