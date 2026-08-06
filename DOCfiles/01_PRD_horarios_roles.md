# PRD — Horarios Autogestionados y Roles de Prestador
**LactaNido Platform · Versión 1.0 · Julio 2026**

---

## Tabla de Contenidos
1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Alcance](#2-alcance)
3. [Hallazgos Críticos](#3-hallazgos-críticos)
4. [Roles y Perfiles](#4-roles-y-perfiles)
5. [Requerimientos Funcionales](#5-requerimientos-funcionales)
6. [Requerimientos No Funcionales](#6-requerimientos-no-funcionales)
7. [Casos de Uso](#7-casos-de-uso)
8. [Criterios de Aceptación](#8-criterios-de-aceptación)
9. [Recomendaciones de Mejora](#9-recomendaciones-de-mejora-priorizadas)

---

## 1. Resumen Ejecutivo

LactaNido es una plataforma web que conecta familias con dos tipos de prestadoras: **Cuidadoras** (cuidado infantil presencial, principalmente nocturno) y **Consejeras** (asesoría profesional en lactancia y crianza, en franjas diurnas). Un mismo perfil puede ejercer ambos roles simultáneamente (**rol dual**).

Este PRD describe los requerimientos para el módulo de **disponibilidad autogestionada**, donde cada prestadora controla libremente sus horarios, el sistema detecta solapamientos y advierte — pero no bloquea — y la prestadora decide conscientemente si acepta la superposición.

---

## 2. Alcance

**Dentro del alcance:**
- Configuración libre de disponibilidad por perfil (Cuidadora / Consejera / Dual)
- Detección y advertencia de solapamientos de horario
- Confirmación explícita de solapamiento aceptado con trazabilidad
- Módulo de bloqueos de fechas (vacaciones, descanso)
- Preferencia personal de separación mínima entre turnos (opcional)

**Fuera del alcance:**
- Cobro, facturación o integración con medios de pago (fase separada)
- Verificación de certificaciones (cubierta en TRD §6)
- App móvil nativa

---

## 3. Hallazgos Críticos

### 3.1 Disponibilidad de Consejera — Bloques fijos no editables ⚠️ ALTA SEVERIDAD
El código actual en `src/views/consejera.js` renderiza una tabla con exactamente **dos bloques fijos**: `09:00–13:00` y `14:00–18:00`, únicamente de lunes a viernes. No hay sábado, no hay horarios personalizados, no hay posibilidad de añadir bloques ad-hoc. El modelo de datos (`horarios` como campo plano en `/usuarios/{uid}`) no soporta estructura de disponibilidad granular.

**Impacto:** La consejera no puede reflejar su disponibilidad real; padres pueden agendar fuera de la disponibilidad efectiva de la prestadora.

### 3.2 Disponibilidad de Cuidadora — Solo bloqueos, sin disponibilidad positiva ⚠️ ALTA SEVERIDAD
La cuidadora solo puede bloquear fechas específicas mediante la subcolección `/usuarios/{uid}/bloqueos`. No existe un mecanismo para declarar disponibilidad positiva (ej.: "estoy disponible el viernes 11 de julio de 21:00 a 08:00"). El sistema asume disponibilidad 7×24 menos los días bloqueados, lo que es incorrecto para disponibilidad real.

### 3.3 Sin modelo de solapamiento ⚠️ ALTA SEVERIDAD
No existe ninguna lógica, ni en frontend ni en reglas Firestore, que detecte solapamientos cuando una misma persona tiene rol dual. No hay campo `allowOverlap`, no hay advertencias, no hay trazabilidad de confirmación.

### 3.4 Reservas sin asignación automática de profesional
El campo `profesionalId` en `/reservas` se usa para filtrar en `fetchServiceAppointments`, pero el flujo de creación de reserva desde la vista del padre no muestra cómo se selecciona ni asigna ese ID. Se requiere revisar `main.js` y el modal de agendamiento.

---

## 4. Roles y Perfiles

### 4.1 Definición de roles
El campo `rol` en `/usuarios/{uid}` es **siempre un arreglo**. Valores válidos:

| Valor | Descripción |
|-------|-------------|
| `padre` | Familia que solicita servicios |
| `cuidadora` | Presta cuidado infantil presencial |
| `consejera` | Asesora en lactancia/crianza |
| `admin` | Administrador de la plataforma |

El rol dual se representa como `["cuidadora", "consejera"]`.

### 4.2 Principio de disponibilidad autogestionada
> La disponibilidad NO es un patrón fijo impuesto por el sistema. Es configuración que cada prestadora define y ajusta libremente.

Reglas derivadas de este principio:
- El sistema **sugiere** patrones de referencia al crear el perfil, pero no los impone.
- El sistema **advierte** de solapamientos pero **no bloquea**.
- La prestadora **confirma explícitamente** cualquier solapamiento.
- Esa confirmación queda **registrada** para trazabilidad.

---

## 5. Requerimientos Funcionales

### RF-01: Configuración de disponibilidad — Cuidadora
- **RF-01.1** La cuidadora puede crear slots de disponibilidad con fecha de inicio, fecha de fin, zona geográfica y estado (libre/reservado).
- **RF-01.2** Cada slot puede ser de duración variable; no hay restricción mínima ni máxima impuesta por el sistema.
- **RF-01.3** La cuidadora puede mantener disponibilidad nocturna estándar y agregar excepciones diurnas sin que estas se eliminen entre sí.
- **RF-01.4** La cuidadora puede bloquear fechas específicas (vacaciones/descanso) con motivo opcional; los bloqueos tienen prioridad sobre cualquier slot de disponibilidad.

### RF-02: Configuración de disponibilidad — Consejera
- **RF-02.1** La consejera puede configurar disponibilidad por día de la semana y franja horaria, incluyendo sábados y franjas fuera del patrón de referencia.
- **RF-02.2** El patrón de referencia (L-V 09:00–18:00, S 09:00–13:00) se pre-carga al crear el perfil pero es editable en cualquier momento.
- **RF-02.3** La consejera puede añadir bloques horarios adicionales (ej. domingo 10:00–12:00) sin restricción del sistema.
- **RF-02.4** La consejera puede reducir o eliminar cualquier bloque de su patrón habitual.

### RF-03: Gestión de solapamientos — Rol dual
- **RF-03.1** Al guardar disponibilidad, el sistema verifica si algún slot nuevo se solapa con slots existentes del mismo prestador en cualquiera de sus roles.
- **RF-03.2** Si detecta solapamiento, el sistema muestra una advertencia descriptiva indicando los bloques que se superponen y la brecha de descanso resultante.
- **RF-03.3** La advertencia no bloquea el guardado; la prestadora puede: (a) aceptar el solapamiento, o (b) modificar uno de los bloques.
- **RF-03.4** Si acepta el solapamiento, el sistema registra en el documento de disponibilidad: `allowOverlap: true`, `overlapConfirmedAt: timestamp`, `overlapConfirmedBy: uid`.
- **RF-03.5** La prestadora puede configurar una **preferencia personal** de separación mínima entre turnos (ej. "mínimo 4 horas de descanso entre servicios"). Esta preferencia es opcional, editable y activa advertencias adicionales pero nunca bloqueos.

### RF-04: Vista de disponibilidad para padres
- **RF-04.1** Los padres pueden buscar prestadoras disponibles filtrando por: tipo de servicio, zona geográfica, día, franja horaria.
- **RF-04.2** Los resultados muestran solo slots con `reservado: false` y sin bloqueos activos.
- **RF-04.3** Los resultados se ordenan por: (1) verificación activa, (2) calificación promedio, (3) proximidad geográfica.
- **RF-04.4** La búsqueda soporta paginación de 10 resultados por página.

### RF-05: Agendamiento
- **RF-05.1** Al agendar, el slot seleccionado se marca como `reservado: true` con el `bookingId` de la reserva.
- **RF-05.2** Si durante el proceso de confirmación el slot fue reservado por otro padre, el sistema notifica y solicita seleccionar otro horario (manejo de concurrencia).
- **RF-05.3** La cancelación por parte del padre o la prestadora revierte el slot a `reservado: false` y elimina el `bookingId`.

### RF-06: Módulo de tienda — Integración Mercado Libre
- **RF-06.1** Cada producto tiene un campo `mercadoLibreUrl` (obligatorio para productos activos).
- **RF-06.2** La imagen del producto redirige a `mercadoLibreUrl` al hacer clic.
- **RF-06.3** El botón de acción principal redirige a `mercadoLibreUrl` (ya no a WhatsApp).
- **RF-06.4** Se mantiene visualización de nombre, precio, descripción y categoría.
- **RF-06.5** Productos existentes con `whatsappNumber` siguen visibles durante la migración; la UI muestra el botón de ML si existe `mercadoLibreUrl`, y el botón de WA como fallback si no.

---

## 6. Requerimientos No Funcionales

### RNF-01: Rendimiento
- La búsqueda de disponibilidad debe devolver resultados en menos de 2 segundos para hasta 500 prestadoras activas.
- Las operaciones de guardado de disponibilidad no deben bloquear la UI por más de 500ms.

### RNF-02: Consistencia de datos
- El marcado de slot como `reservado` debe realizarse en una transacción Firestore para evitar dobles reservas.
- La confirmación de solapamiento debe escribirse en la misma operación que el guardado del slot.

### RNF-03: Usabilidad
- La advertencia de solapamiento debe ser comprensible sin jerga técnica.
- Debe indicar claramente la brecha de descanso (en horas) entre los turnos que se solapan.
- El flujo de confirmación debe requerir una acción explícita (botón "Confirmar solapamiento") — no puede aceptarse por omisión.

### RNF-04: Seguridad
- Solo la propia prestadora o un admin puede modificar su disponibilidad.
- Los datos de solapamiento confirmado son de solo lectura para usuarios no admin.

### RNF-05: Escalabilidad
- El modelo de disponibilidad debe soportar al menos 365 días futuros de slots sin degradación de rendimiento en queries.

---

## 7. Casos de Uso

### CU-01: Prestadora dual configura turno nocturno con solapamiento aceptado
**Actor:** Prestadora con roles `["cuidadora", "consejera"]`
**Precondición:** Tiene un slot de consejería el martes 08/07 de 09:00 a 13:00.
**Flujo:**
1. Accede a "Disponibilidad" → "Añadir turno de cuidado".
2. Ingresa: lunes 07/07 21:00 → martes 08/07 08:00.
3. El sistema detecta solapamiento: el turno de cuidado termina a las 08:00 y el de consejería inicia a las 09:00 (1 hora de diferencia).
4. Muestra advertencia: *"Este turno termina 1 hora antes de tu próxima consulta de consejería (09:00). ¿Deseas continuar?"*
5. La prestadora hace clic en "Aceptar solapamiento".
6. El sistema guarda el slot con `allowOverlap: true` y registra la confirmación.

**Resultado:** Ambos slots visibles en su calendario; la reserva nocturna está disponible para padres.

### CU-02: Prestadora dual ajusta horario tras advertencia
**Actor:** Prestadora con roles `["cuidadora", "consejera"]`
**Precondición:** Tiene consejería el miércoles 09/07 de 09:00 a 13:00.
**Flujo:**
1. Intenta crear turno de cuidado: martes 08/07 22:00 → miércoles 09/07 09:00.
2. Sistema advierte: *"Este turno termina exactamente a las 09:00, coincidiendo con tu consulta de consejería. Tendrás 0 minutos de descanso."*
3. La prestadora decide ajustar y cambia el fin del turno a miércoles 09/07 07:00.
4. Guarda sin advertencia (brecha de 2 horas).

**Resultado:** Turno de cuidado termina a las 07:00; consulta de consejería inicia a las 09:00 con 2 horas de margen.

### CU-03: Sábado — Consejería + cuidado nocturno sin bloqueo
**Actor:** Prestadora con roles `["cuidadora", "consejera"]`
**Flujo:**
1. Tiene consejería el sábado 12/07 de 09:00 a 13:00.
2. Agrega turno de cuidado: sábado 12/07 21:00 → domingo 13/07 07:00.
3. El sistema calcula la diferencia: 8 horas entre fin de consejería (13:00) e inicio de cuidado (21:00).
4. No hay advertencia de solapamiento (brecha suficiente).
5. Se guardan ambos slots sin fricción.

**Resultado:** La prestadora tiene mañana libre entre su sesión de consejería y su turno nocturno de cuidado.

### CU-04: Padre busca cuidadora disponible el viernes por la noche
**Actor:** Usuario con rol `padre`
**Flujo:**
1. Accede a "Agendar Nueva Cita" → tipo: Cuidado.
2. Selecciona zona: Santiago Centro, viernes 18/07, desde 21:00.
3. El sistema consulta slots donde `reservado == false`, `zona` contiene "Santiago Centro", `fechaInicio >= viernes 18/07 21:00`.
4. Muestra resultados paginados, ordenados por verificación y calificación.
5. El padre selecciona una prestadora y confirma.

### CU-05: Consejera amplía disponibilidad al sábado
**Actor:** Usuario con rol `consejera`
**Flujo:**
1. Accede a su perfil → "Horarios".
2. Ve su patrón de referencia L-V pre-cargado.
3. Activa el sábado 09:00–13:00 con el toggle.
4. Guarda. El sistema actualiza su disponibilidad semanal.

---

## 8. Criterios de Aceptación

| ID | Criterio | Cómo verificar |
|----|----------|----------------|
| CA-01 | Consejera puede activar sábado en su disponibilidad | UI muestra toggle de sábado habilitado; Firestore refleja el slot |
| CA-02 | Cuidadora puede crear slot con hora de inicio y fin específica | Formulario acepta fecha/hora; slot visible en calendario |
| CA-03 | Sistema detecta solapamiento < 1h en rol dual | Test: crear turno de cuidado que termina 30 min antes de consejería → aparece advertencia |
| CA-04 | Solapamiento aceptado queda registrado con timestamp | Firestore slot tiene `allowOverlap: true` y `overlapConfirmedAt` |
| CA-05 | Solapamiento con brecha > 4h no genera advertencia | Test: 8h entre servicios → guardado sin modal de advertencia |
| CA-06 | Búsqueda de padres filtra por zona, servicio y franja | Query devuelve solo slots `reservado: false` en el rango indicado |
| CA-07 | Doble reserva simultánea resuelve sin corrupción | Test de concurrencia: dos sesiones reservan el mismo slot → solo una tiene éxito |
| CA-08 | Producto con `mercadoLibreUrl` redirige al clic en imagen y botón | Verificación manual en UI: ambos elementos abren la URL de ML |
| CA-09 | Producto sin `mercadoLibreUrl` muestra fallback WA | Verificación manual: botón WA visible cuando no hay campo ML |

---

## 9. Recomendaciones de Mejora (Priorizadas)

### 🔴 Impacto alto / Esfuerzo bajo
1. **Migrar modelo de disponibilidad de Consejera**: reemplazar el campo `horarios` por subcolección `/disponibilidad/{slotId}` (ver TRD §4). Desbloquea sábados, horarios ad-hoc y solapamiento.
2. **Añadir disponibilidad positiva para Cuidadora**: actualmente solo hay bloqueos; añadir la misma subcolección `/disponibilidad` permite mostrar disponibilidad real a los padres.

### 🔴 Impacto alto / Esfuerzo medio
3. **Implementar detección de solapamientos**: función JS que compara slots antes de guardar, con modal de advertencia y campo `allowOverlap`.
4. **Transacción en reserva de slot**: asegurar que el marcado como `reservado: true` sea atómico.

### 🟡 Impacto medio / Esfuerzo bajo
5. **Preferencia de separación mínima**: campo `minRestHours` en el perfil del prestador; activa advertencias personalizadas.
6. **Sábado en tabla de consejera**: cambio inmediato en `consejera.js` para incluir columna sábado y bloque 09:00–13:00.

### 🟡 Impacto medio / Esfuerzo medio
7. **Vista de calendario unificada**: para prestador dual, mostrar ambos tipos de servicio en una vista de calendario semanal con colores diferenciados.
8. **Notificaciones push de solapamiento**: alertar a la prestadora cuando una reserva entrante genera un solapamiento con otro slot existente.
