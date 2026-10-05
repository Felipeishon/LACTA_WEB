// seed-temp.js - Script temporal para inyectar datos de prueba
import { db } from './src/firebase.js';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// ─── CONFIGURACIÓN: Ajusta estos datos ───
const NIDO_ID_REAL = 'd6dKzbPE88WOJUNcsTiO';
const UID_PADRE_REAL = 'WOq9SZDW05WO7wuKqv00hgaLg9F2';
const UID_CUIDADORA_REAL = 'glslfOGjZzYa3nZitb6DTjLVqN33';
const UID_CONSEJERA_REAL = '26M7wJcPbEMwqNexLUFU8J5AXcE2';
const NOMBRE_BEBE_REAL = 'Junior';
const RUT_BEBE_REAL = '77.777.777-7';
const NOMBRES_PADRES = ['Juanito', 'Juanita'];
const NOMBRE_CUIDADORA = 'Andrea Matta';
const NOMBRE_CONSEJERA = 'Andrea';

const bitacorasDePrueba = [
  {
    reservaId: 'reserva_prueba_001',
    nidoId: NIDO_ID_REAL, uidPadre: UID_PADRE_REAL,
    nidoNombreBebe: NOMBRE_BEBE_REAL, nidoRutBebe: RUT_BEBE_REAL, padresNombres: NOMBRES_PADRES,
    prestadorId: UID_CUIDADORA_REAL, prestadorNombre: NOMBRE_CUIDADORA, prestadorRol: 'cuidadora', prestadorRut: '55.555.555-5',
    fecha: new Date('2026-10-01T22:00:00').toISOString(),
    horasEfectivas: 10, tipoAlimentacion: 'Leche materna + fórmula', cantidadOz: 4,
    horasSueno: 8, cantidadPanales: 5,
    observaciones: 'Bebé tranquilo. Primera prueba con snapshot.',
    recomendaciones: 'Mantener rutina.', seguimiento: 'Sin novedades.'
  },
  {
    reservaId: 'reserva_prueba_002',
    nidoId: NIDO_ID_REAL, uidPadre: UID_PADRE_REAL,
    nidoNombreBebe: NOMBRE_BEBE_REAL, nidoRutBebe: RUT_BEBE_REAL, padresNombres: NOMBRES_PADRES,
    prestadorId: UID_CUIDADORA_REAL, prestadorNombre: NOMBRE_CUIDADORA, prestadorRol: 'cuidadora', prestadorRut: '55.555.555-5',
    fecha: new Date('2026-10-08T22:00:00').toISOString(),
    horasEfectivas: 11, tipoAlimentacion: 'Leche materna exclusiva', cantidadOz: 3,
    horasSueno: 7, cantidadPanales: 4,
    observaciones: 'Segunda atención. Bebé con cólico.',
    recomendaciones: 'Masajes abdominales.', seguimiento: 'Revisar próxima visita.'
  },
  {
    reservaId: 'reserva_prueba_003',
    nidoId: NIDO_ID_REAL, uidPadre: UID_PADRE_REAL,
    nidoNombreBebe: NOMBRE_BEBE_REAL, nidoRutBebe: RUT_BEBE_REAL, padresNombres: NOMBRES_PADRES,
    prestadorId: UID_CUIDADORA_REAL, prestadorNombre: NOMBRE_CUIDADORA, prestadorRol: 'cuidadora', prestadorRut: '55.555.555-5',
    fecha: new Date('2026-10-15T22:00:00').toISOString(),
    horasEfectivas: 9, tipoAlimentacion: 'Leche materna', cantidadOz: 4,
    horasSueno: 9, cantidadPanales: 6,
    observaciones: 'Tercera atención. Excelente comportamiento.',
    recomendaciones: 'Continuar rutina.', seguimiento: 'Sin complicaciones.'
  }
];

const fichasDePrueba = [
  {
    reservaId: 'reserva_ficha_001',
    nidoId: NIDO_ID_REAL, uidPadre: UID_PADRE_REAL,
    nidoNombreBebe: NOMBRE_BEBE_REAL, nidoRutBebe: RUT_BEBE_REAL, padresNombres: NOMBRES_PADRES,
    consejeraId: UID_CONSEJERA_REAL, consejeraNombre: NOMBRE_CONSEJERA,
    fechaAtencion: new Date('2026-10-05T10:00:00').toISOString(),
    motivoConsulta: 'Dolor al amamantar y grietas en pezón derecho.',
    evaluacion: 'Acople superficial secundario a restricción anatómica.',
    planAccion: 'Corrección de postura, aplicación de frío local, derivación.',
    recomendaciones: 'Cambiar posición cada 10 minutos.', seguimiento: 'Control en 5 días.'
  },
  {
    reservaId: 'reserva_ficha_002',
    nidoId: NIDO_ID_REAL, uidPadre: UID_PADRE_REAL,
    nidoNombreBebe: NOMBRE_BEBE_REAL, nidoRutBebe: RUT_BEBE_REAL, padresNombres: NOMBRES_PADRES,
    consejeraId: UID_CONSEJERA_REAL, consejeraNombre: NOMBRE_CONSEJERA,
    fechaAtencion: new Date('2026-10-12T11:30:00').toISOString(),
    motivoConsulta: 'Control de seguimiento por grietas.',
    evaluacion: 'Mejoría significativa. Grietas en cicatrización.',
    planAccion: 'Mantener técnicas de acople. Continuar con frío local.',
    recomendaciones: 'Pezonera de silicona por 3 días más.', seguimiento: 'Alta próxima sesión si mejora.'
  }
];

export async function inyectarDatosDePrueba() {
  try {
    console.log('🚀 Iniciando inyección de datos...');

    for (const b of bitacorasDePrueba) {
      b.creadoEn = serverTimestamp();
      const ref = await addDoc(collection(db, 'bitacoras'), b);
      console.log(`✅ Bitácora creada: ${ref.id}`);
    }

    for (const f of fichasDePrueba) {
      f.creadoEn = serverTimestamp();
      const ref = await addDoc(collection(db, 'fichas_atencion'), f);
      console.log(`✅ Ficha creada: ${ref.id}`);
    }

    console.log('🎉 ¡Datos inyectados! Recarga con Ctrl + F5 y ve a Registros.');
  } catch (err) {
    console.error('❌ Error al inyectar datos:', err);
  }
}