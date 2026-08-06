# UI/UX — Flujos de Configuración, Disponibilidad y Advertencias de Solapamiento
**LactaNido Platform · Versión 1.0 · Julio 2026**

---

## Tabla de Contenidos
1. [Hallazgos Críticos](#1-hallazgos-críticos)
2. [Principios de Diseño](#2-principios-de-diseño)
3. [Flujo Consejera — Configuración de Horarios](#3-flujo-consejera--configuración-de-horarios)
4. [Flujo Cuidadora — Configuración de Disponibilidad](#4-flujo-cuidadora--configuración-de-disponibilidad)
5. [Flujo Prestador Dual — Vista Unificada](#5-flujo-prestador-dual--vista-unificada)
6. [Componente de Advertencia de Solapamiento](#6-componente-de-advertencia-de-solapamiento)
7. [Estados de Error y Feedback](#7-estados-de-error-y-feedback)
8. [Módulo Tienda — Cambio a Mercado Libre](#8-módulo-tienda--cambio-a-mercado-libre)
9. [Recomendaciones de Mejora](#9-recomendaciones-de-mejora-priorizadas)

---

## 1. Hallazgos Críticos

### 1.1 Tabla de horarios de Consejera — hardcodeada y sin sábado ⚠️ ALTA SEVERIDAD
El componente actual en `consejera.js` renderiza una tabla estática con exactamente 5 columnas (L–V) y 2 filas de bloques. **No existe UI para:**
- Agregar bloques horarios personalizados
- Activar el sábado (aunque las reglas de negocio lo permiten)
- Editar el inicio/fin de un bloque existente
- Ver el calendario semanal con disponibilidad real

La UI debe evolucionar de una tabla de toggle a un **gestor de slots con hora de inicio y fin libre**.

### 1.2 Disponibilidad de Cuidadora — formulario de bloqueo, no de disponibilidad ⚠️ ALTA SEVERIDAD
La pestaña `disponibilidad` de la cuidadora muestra únicamente un formulario para agregar **bloqueos de fechas**, no para declarar disponibilidad activa. No hay forma visual de que la cuidadora diga "estoy disponible el jueves de 21:00 a 08:00".

### 1.3 Ausencia de advertencia de solapamiento en UI
No existe ningún componente modal, toast, o inline que advierta al prestador dual sobre solapamientos. Esta lógica debe añadirse antes de que el usuario guarde un slot conflictivo.

### 1.4 Imagen de producto no es clickeable
En `renderTiendaProductos` la imagen se renderiza con `<img>` sin un `<a>` wrapper. El botón de acción lleva a `addToCart`, no a Mercado Libre. Ambos deben cambiar de destino.

---

## 2. Principios de Diseño

### 2.1 Advierte, no bloquea
Las advertencias de solapamiento usan un tono informativo ("Heads up"), nunca bloqueante ("Error"). El usuario siempre puede proceder con una acción explícita.

### 2.2 Acción explícita para solapamientos
La confirmación de solapamiento requiere un **botón nombrado claramente** (ej. "Entendido, guardar de todas formas"). No se acepta por omisión ni al cerrar el modal.

### 2.3 Contexto suficiente en advertencias
La advertencia muestra: qué slots solapan, qué brecha de descanso resultaría, y si la prestadora tiene una preferencia personal configurada (ej. "Tu preferencia es de mínimo 4 horas de descanso").

### 2.4 Paleta de colores para estados de disponibilidad
| Estado | Color | Clase Tailwind |
|--------|-------|----------------|
| Disponible | Verde | `bg-green-100 text-green-700` |
| Reservado | Naranja | `bg-orange-100 text-orange-700` |
| Bloqueado | Rojo | `bg-red-100 text-red-700` |
| Solapamiento aceptado | Ámbar | `bg-amber-100 text-amber-700` |
| Sin configurar | Gris | `bg-gray-100 text-gray-400` |

---

## 3. Flujo Consejera — Configuración de Horarios

### 3.1 Vista actual vs. propuesta

**Vista actual:** tabla 5×2 con botones verde/gris que solo guardan `{dia: {bloque: bool}}`.

**Vista propuesta:** gestor de slots semanal con capacidad de:
- Ver slots existentes en vista semanal (7 días)
- Añadir un slot nuevo con hora de inicio y fin libre
- Editar un slot existente
- Eliminar un slot
- Ver advertencias de solapamiento inline

### 3.2 Wireframe textual — Vista semanal de Consejera

```
┌────────────────────────────────────────────────────────────────┐
│  GESTIÓN DE DISPONIBILIDAD - CONSEJERA                         │
│  Semana del 7 al 13 de julio 2026        [< Semana] [Semana >] │
├──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────────────┤
│      │ Lun  │ Mar  │ Mié  │ Jue  │ Vie  │ Sáb  │ Dom          │
│      │ 07   │ 08   │ 09   │ 10   │ 11   │ 12   │ 13           │
├──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────────────┤
│09:00 │ [🟢] │ [🟢] │ [🟠] │ [🟢] │ [🟢] │ [🟢] │  —           │
│      │09-13 │09-13 │RESV. │09-13 │09-13 │09-13 │              │
├──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────────────┤
│14:00 │ [🟢] │ [🔴] │ [🟢] │ [🟢] │ [—]  │  —   │  —           │
│      │14-18 │BLOQ. │14-18 │14-18 │      │      │              │
├──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────────────┤
│  [+ Añadir nuevo bloque horario]                               │
└────────────────────────────────────────────────────────────────┘
```

### 3.3 Modal "Añadir bloque horario"

```
┌──────────────────────────────────────────┐
│  NUEVO BLOQUE DE DISPONIBILIDAD          │
│                                          │
│  Día(s) de la semana                     │
│  [ ] Lunes  [x] Martes  [x] Miércoles   │
│  [ ] Jueves [ ] Viernes [ ] Sábado       │
│                                          │
│  Hora de inicio     Hora de fin          │
│  [09:00 ▼]          [13:00 ▼]           │
│                                          │
│  Tipo de servicio                        │
│  (◉) Consejería   ( ) Cuidado           │
│                                          │
│  Modalidad                               │
│  (◉) Virtual  ( ) Presencial  ( ) Ambas  │
│                                          │
│        [Cancelar]  [Guardar bloque]      │
└──────────────────────────────────────────┘
```

Al hacer clic en "Guardar bloque", el sistema ejecuta la detección de solapamientos antes de escribir en Firestore (ver §6).

---

## 4. Flujo Cuidadora — Configuración de Disponibilidad

### 4.1 Vista propuesta — Pestaña "Disponibilidad"

La pestaña debe tener **dos secciones**:

**Sección A: Mis turnos disponibles** (nuevo)
Lista de slots declarados con estado, fecha/hora, zona y opción de eliminar.

**Sección B: Días bloqueados** (existente, conservar)
El formulario de bloqueo actual funciona bien; se mantiene sin cambios.

### 4.2 Wireframe textual — Sección A

```
┌────────────────────────────────────────────────────────────┐
│  MIS TURNOS DISPONIBLES                                    │
│  ─────────────────────────────────────────────────────── │
│  [+ Declarar nuevo turno disponible]                       │
│                                                            │
│  Lun 07/07 · 21:00 → Mar 08/07 · 08:00                   │
│  📍 Santiago Centro · 🟢 Disponible           [Eliminar]   │
│                                                            │
│  Mar 08/07 · 21:00 → Mié 09/07 · 08:00                   │
│  📍 Providencia · 🟠 Reservado (Nido #XYZ)   [—]          │
│                                                            │
│  Vie 11/07 · 22:00 → Sáb 12/07 · 07:00                   │
│  📍 Las Condes · 🟢 Disponible               [Eliminar]    │
└────────────────────────────────────────────────────────────┘
```

### 4.3 Modal "Declarar turno disponible"

```
┌───────────────────────────────────────────────┐
│  NUEVO TURNO DE CUIDADO                       │
│                                               │
│  Fecha y hora de INICIO                       │
│  [07/07/2026 ▼]  [21:00 ▼]                  │
│                                               │
│  Fecha y hora de FIN                          │
│  [08/07/2026 ▼]  [08:00 ▼]                  │
│                                               │
│  Zona de atención                             │
│  [Santiago Centro              ▼]             │
│                                               │
│  Notas (opcional)                             │
│  [________________________________]           │
│                                               │
│        [Cancelar]  [Guardar turno]            │
└───────────────────────────────────────────────┘
```

---

## 5. Flujo Prestador Dual — Vista Unificada

### 5.1 Navegación para rol dual

El menú lateral debe mostrar secciones diferenciadas por color:

```
┌────────────────────────────────┐
│  🍼 LactaNido                  │
│  ──────────────────────────── │
│  📊 Dashboard                  │
│                                │
│  🧡 ROL CUIDADORA             │
│  ├─ Mis turnos asignados       │
│  ├─ Mi disponibilidad          │
│  └─ Historial de bitácoras     │
│                                │
│  💜 ROL CONSEJERA             │
│  ├─ Mis citas                  │
│  ├─ Mis horarios               │
│  └─ Historial de fichas        │
│                                │
│  ⚙️ Mi perfil                  │
│  └─ Preferencias de descanso   │
└────────────────────────────────┘
```

### 5.2 Vista de calendario unificada para rol dual

```
┌──────────────────────────────────────────────────────────────┐
│  SEMANA DEL 7 AL 13 DE JULIO 2026                            │
│  🧡 Cuidado   💜 Consejería   🟠 Reservado   ⚠️ Solapamiento │
├──────┬────────┬────────┬────────┬────────┬────────┬──────────┤
│      │ Lun 07 │ Mar 08 │ Mié 09 │ Jue 10 │ Vie 11 │  Sáb 12 │
│00:00 │        │        │        │        │        │          │
│...   │        │        │        │        │        │          │
│09:00 │  💜    │  💜    │  💜🟠  │  💜    │  💜    │  💜      │
│10:00 │        │        │        │        │        │          │
│11:00 │        │        │        │        │        │          │
│12:00 │        │        │        │        │        │          │
│13:00 │        │        │        │        │        │ —        │
│14:00 │  💜    │  💜    │  💜    │  💜    │        │          │
│15:00 │        │        │        │        │        │          │
│16:00 │        │        │        │        │        │          │
│17:00 │        │        │        │        │        │          │
│18:00 │        │        │        │        │        │          │
│19:00 │        │        │        │        │        │          │
│20:00 │        │        │        │        │        │          │
│21:00 │  🧡⚠️  │  🧡    │  🧡    │  🧡    │  🧡    │  🧡      │
│22:00 │        │        │        │        │        │          │
└──────┴────────┴────────┴────────┴────────┴────────┴──────────┘
  ⚠️ Lun 07: Turno de cuidado 21:00–08:00 con solo 1h antes de tu consulta 09:00
  [Ver detalle del solapamiento]
```

### 5.3 Panel de preferencias de descanso

```
┌───────────────────────────────────────────────────────┐
│  PREFERENCIA PERSONAL DE DESCANSO                     │
│  ─────────────────────────────────────────────────── │
│  Tiempo mínimo de descanso entre turnos               │
│                                                       │
│  [    4    ] horas                                    │
│                                                       │
│  ℹ️ El sistema te avisará si aceptas turnos con menos │
│  de este tiempo de diferencia entre ellos.            │
│  Esta preferencia no bloquea el agendamiento.         │
│                                                       │
│  [ ] Activar esta preferencia                         │
│                                                       │
│  [Guardar preferencia]                                │
└───────────────────────────────────────────────────────┘
```

---

## 6. Componente de Advertencia de Solapamiento

### 6.1 Lógica de detección (pseudocódigo)

```javascript
function detectarSolapamiento(nuevoSlot, slotsExistentes, minRestHours = 0) {
  const conflictos = [];

  for (const slot of slotsExistentes) {
    if (slot.servicio === nuevoSlot.servicio) continue; // mismo servicio, no aplica

    const inicioNuevo = nuevoSlot.fechaInicio.getTime();
    const finNuevo = nuevoSlot.fechaFin.getTime();
    const inicioExist = slot.fechaInicio.getTime();
    const finExist = slot.fechaFin.getTime();

    // Solapamiento real
    if (inicioNuevo < finExist && finNuevo > inicioExist) {
      conflictos.push({ tipo: 'solapamiento', slot, brechaHoras: 0 });
      continue;
    }

    // Dentro del límite de descanso preferido
    const brechaMs = Math.min(
      Math.abs(inicioNuevo - finExist),
      Math.abs(inicioExist - finNuevo)
    );
    const brechaHoras = brechaMs / (1000 * 60 * 60);

    if (minRestHours > 0 && brechaHoras < minRestHours) {
      conflictos.push({ tipo: 'descanso_insuficiente', slot, brechaHoras });
    }
  }

  return conflictos;
}
```

### 6.2 Modal de advertencia — Solapamiento real

```
┌──────────────────────────────────────────────────────┐
│  ⚠️ Posible solapamiento detectado                   │
│  ─────────────────────────────────────────────────  │
│  El turno que estás guardando coincide en horario    │
│  con otro servicio:                                  │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │ 🧡 Cuidado  Lun 07/07  21:00 → Mar 08/07 08:00│  │
│  │ 💜 Consejería  Mar 08/07  09:00 → 13:00      │   │
│  │ ⏱ Diferencia: 1 hora de descanso             │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  Tu preferencia de descanso mínimo es 4 horas.      │
│                                                      │
│  Puedes:                                             │
│  • Ajustar el horario de uno de los dos turnos       │
│  • Confirmar que aceptas esta superposición          │
│    (quedará registrado para tu historial)            │
│                                                      │
│  [← Ajustar horario]  [Confirmar y guardar ✓]       │
└──────────────────────────────────────────────────────┘
```

### 6.3 Modal de advertencia — Descanso insuficiente (sin solapamiento real)

```
┌──────────────────────────────────────────────────────┐
│  💛 Aviso de descanso                                │
│  ─────────────────────────────────────────────────  │
│  No hay solapamiento, pero la brecha entre turnos    │
│  es menor a tu preferencia:                          │
│                                                      │
│  Brecha disponible: 2 horas                          │
│  Tu preferencia mínima: 4 horas                      │
│                                                      │
│  Esto no bloquea el guardado. ¿Deseas continuar?     │
│                                                      │
│  [← Volver]          [Guardar de todas formas]       │
└──────────────────────────────────────────────────────┘
```

### 6.4 Sin solapamiento — flujo silencioso
Si no hay conflictos, el slot se guarda directamente con un toast de confirmación:
> ✅ Turno agregado correctamente

---

## 7. Estados de Error y Feedback

### 7.1 Toast notifications (sistema actual — mantener)
El sistema ya usa `showToast(mensaje, tipo)`. Extender con tipo `'warning'` para solapamientos:

| Situación | Tipo | Mensaje |
|-----------|------|---------|
| Slot guardado sin conflicto | `success` | "Turno agregado correctamente" |
| Slot bloqueado agregado | `success` | "Fecha bloqueada" |
| Error de red al guardar | `error` | "Error al guardar. Intenta nuevamente." |
| Slot ya reservado (concurrencia) | `error` | "Este horario fue tomado. Elige otro." |
| Sin fecha seleccionada | `warning` | "Selecciona una fecha" |
| Solapamiento aceptado | `warning` | "Turno guardado con solapamiento registrado" |

### 7.2 Estado vacío — sin disponibilidad configurada
```
┌──────────────────────────────────────────────────────┐
│                                                      │
│          📅                                          │
│                                                      │
│  Aún no has configurado tu disponibilidad.           │
│  Agrega tu primer turno para que los padres          │
│  puedan encontrarte y agendar contigo.               │
│                                                      │
│  [+ Agregar primer turno]                            │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### 7.3 Estado de slot reservado — no editable
Los slots con `reservado: true` muestran:
- Badge naranja "Reservado"
- Nombre del nido (si el prestador tiene acceso)
- Botón deshabilitado "No disponible"
- Opción "Cancelar turno" (abre modal de confirmación con aviso al padre)

---

## 8. Módulo Tienda — Cambio a Mercado Libre

### 8.1 Cambio de comportamiento

| Elemento | Comportamiento actual | Comportamiento propuesto |
|----------|----------------------|--------------------------|
| Imagen del producto | `<img>` estático sin link | `<a href={mercadoLibreUrl} target="_blank">` wrapeando la imagen |
| Botón de acción | "Agregar 🛒" → `addToCart()` | "Ver en Mercado Libre 🛒" → `window.open(mercadoLibreUrl)` |
| Fallback (sin ML URL) | N/A | Botón WhatsApp si existe `whatsappNumber` |

### 8.2 Pseudocódigo del componente de producto

```javascript
function renderProductCard(producto) {
  const destino = producto.mercadoLibreUrl;
  const fallback = producto.whatsappNumber
    ? `https://wa.me/${producto.whatsappNumber}`
    : null;

  const urlFinal = destino || fallback;
  const labelBoton = destino ? 'Ver en Mercado Libre 🛒' : 'Contactar por WhatsApp 💬';

  return `
    <div class="bg-white rounded-xl shadow-sm border border-[#e5dfdc] p-5 flex flex-col">
      <!-- Imagen clickeable -->
      ${urlFinal ? `
        <a href="${escapeHTML(urlFinal)}" target="_blank" rel="noopener noreferrer" class="block">
          <img src="${escapeHTML(producto.imagenUrl)}"
               alt="${escapeHTML(producto.nombre)}"
               class="w-full h-32 object-cover rounded-lg mb-4 hover:opacity-90 transition-opacity cursor-pointer" />
        </a>
      ` : `
        <img src="${escapeHTML(producto.imagenUrl)}"
             alt="${escapeHTML(producto.nombre)}"
             class="w-full h-32 object-cover rounded-lg mb-4" />
      `}

      <h4 class="font-bold text-[#181411] text-center mb-1 line-clamp-2">${escapeHTML(producto.nombre)}</h4>
      <p class="text-[#e87a30] font-black text-xl mb-1">$${producto.precio.toLocaleString('cl-CL')}</p>
      <p class="text-xs text-gray-400 mb-4">${escapeHTML(producto.descripcion || '')}</p>

      <!-- Botón de acción -->
      ${urlFinal ? `
        <a href="${escapeHTML(urlFinal)}"
           target="_blank"
           rel="noopener noreferrer"
           class="w-full bg-[#181411] text-white py-2 rounded-lg text-sm font-bold
                  hover:bg-[#e87a30] transition-colors text-center block">
          ${labelBoton}
        </a>
      ` : `
        <button disabled
                class="w-full bg-gray-200 text-gray-400 py-2 rounded-lg text-sm font-bold cursor-not-allowed">
          Sin enlace configurado
        </button>
      `}
    </div>
  `;
}
```

### 8.3 Validación de URL en formulario admin

```javascript
function validarMercadoLibreUrl(url) {
  if (!url) return true; // campo opcional durante migración
  const regex = /^https:\/\/(www\.)?mercadolibre\.(cl|com\.ar|com|com\.mx|com\.co|com\.br|com\.uy|com\.pe|com\.ve|com\.ec|com\.bo|com\.py)\/.+/i;
  return regex.test(url);
}
```

### 8.4 Script de migración de productos existentes

```javascript
// Ejecutar una vez desde la consola de admin o Cloud Function
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';

async function migrarProductosAMercadoLibre() {
  const snap = await getDocs(collection(db, 'productos'));
  const batch = writeBatch(db);
  let count = 0;

  snap.docs.forEach(docSnap => {
    const data = docSnap.data();
    // Solo migrar si tiene whatsappNumber pero no mercadoLibreUrl
    if (data.whatsappNumber && !data.mercadoLibreUrl) {
      batch.update(doc(db, 'productos', docSnap.id), {
        mercadoLibreUrl: null, // placeholder; admin debe completar manualmente
        _migrationNote: `Tenía whatsappNumber: ${data.whatsappNumber}. Pendiente asignar URL de ML.`
      });
      count++;
    }
  });

  if (count > 0) await batch.commit();
  console.log(`Migrados ${count} productos. Revisar campo _migrationNote en Firestore.`);
}
```

---

## 9. Recomendaciones de Mejora (Priorizadas)

### 🔴 Impacto alto / Esfuerzo bajo
1. **Añadir columna sábado** a tabla de horarios de Consejera — cambio de una línea en `consejera.js`.
2. **Wrappear imagen de producto** en `<a href>` con `mercadoLibreUrl` — cambio en `padre.js::renderTiendaProductos`.
3. **Cambiar botón "Agregar 🛒"** a enlace de Mercado Libre.

### 🔴 Impacto alto / Esfuerzo medio
4. **Rediseñar pestaña "Disponibilidad" de Cuidadora** para incluir sección de slots positivos además de bloqueos.
5. **Implementar modal de advertencia de solapamiento** con lógica `detectarSolapamiento()`.

### 🟡 Impacto medio / Esfuerzo medio
6. **Vista de calendario unificada** para rol dual (semana con ambos tipos de servicio diferenciados por color).
7. **Panel de preferencias de descanso** en sección de perfil del prestador.
8. **Estado vacío** en sección de disponibilidad con CTA claro.

### 🟢 Impacto bajo / Esfuerzo bajo
9. **Mensaje descriptivo en advertencia** que incluya la brecha de descanso en horas de forma legible.
10. **Badge "Solapamiento aceptado"** visible en el slot del calendario para trazabilidad visual.
