// Archivo: src/ui/account.js
import { auth, db } from '../firebase.js';
import { saveFichaCuidado, saveFichaAtencion, obtenerDatosNido } from '../api/firestore.js';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { showToast } from './notifications.js';
import { escapeHTML } from '../utils/html.js';
import { formatRut, validarRut } from '../rut.js';

let fichaModalContext = null;

export async function openPerfilBebeModal(userData) {
  const modal = document.getElementById('modalPerfilBebe');
  if (!modal) return;

  if (!userData?.nidoId) {
    showToast('No tienes ningún Nido familiar vinculado todavía.', 'warning');
    return;
  }

  modal.showModal();

  try {
    const nidoData = await obtenerDatosNido(userData.nidoId);
    if (!nidoData) {
      showToast('No se encontraron los datos del Nido.', 'error');
      return;
    }

    let listaHijosHtml = '';
    const hijos = nidoData.hijos || (nidoData.rutBebe ? [{ nombre: nidoData.nombreBebe || 'Hijo/a', rut: nidoData.rutBebe }] : []);

    if (hijos.length > 0) {
      listaHijosHtml = hijos.map((h, index) => `
        <div class="bg-gray-50 p-3 rounded-xl mb-2 border border-gray-100 text-xs flex justify-between items-center">
          <div>
            <p class="font-bold text-[#181411]">👶 Hijo/a ${index + 1}: ${escapeHTML(h.nombre || 'Sin nombre')}</p>
            <p class="text-gray-500">🆔 RUT: ${escapeHTML(h.rut || 'N/A')}</p>
          </div>
        </div>
      `).join('');
    } else {
      listaHijosHtml = '<p class="text-xs text-gray-400 italic">No hay hijos registrados en este nido.</p>';
    }

    let nombresPadresHtml = '';
    const padresUids = nidoData.padresUids || [userData.uid];
    
    const nombresPadresPromises = padresUids.map(async (pUid) => {
      try {
        const pDoc = await getDoc(doc(db, 'usuarios', pUid));
        if (pDoc.exists()) {
          const pData = pDoc.data();
          const esActual = pUid === userData.uid ? ' (Tú)' : '';
          return `<li class="text-xs text-gray-700 font-medium py-1">👤 ${escapeHTML(pData.nombre || 'Usuario')} ${esActual}</li>`;
        }
      } catch (e) {
        console.error("Error al obtener datos del padre:", e);
      }
      return `<li class="text-xs text-gray-700 font-medium py-1">👤 Usuario (${pUid.slice(0, 6)}...)</li>`;
    });

    const resultadosPadres = await Promise.all(nombresPadresPromises);
    nombresPadresHtml = `<ul class="divide-y divide-gray-100">${resultadosPadres.join('')}</ul>`;

    const modalBox = modal.querySelector('.modal-box') || modal.querySelector('div.bg-white, div.glass-panel') || modal;
    
    let infoSection = modal.querySelector('#nido-dinamico-info');
    if (!infoSection) {
      infoSection = document.createElement('div');
      infoSection.id = 'nido-dinamico-info';
      infoSection.className = 'mt-4 space-y-4 text-left';
      const tituloModal = modal.querySelector('h2, h3, h4');
      if (tituloModal && tituloModal.parentNode) {
        tituloModal.parentNode.insertBefore(infoSection, tituloModal.nextSibling);
      } else {
        modalBox.appendChild(infoSection);
      }
    }

    infoSection.innerHTML = `
      <div class="border-t border-gray-100 pt-3">
        <div class="flex justify-between items-center mb-2">
          <h4 class="font-bold text-xs text-[#887263] uppercase">Hijos / Bebés en el Nido</h4>
          <button type="button" id="btnAbrirFormAddHijo" class="text-xs text-[#e87a30] font-bold hover:underline">+ Añadir otro hijo/a</button>
        </div>
        <div id="contenedor-lista-hijos">
          ${listaHijosHtml}
        </div>
        
        <div id="form-add-hijo-container" class="hidden mt-3 p-3 bg-gray-50 rounded-xl border border-dashed border-gray-300">
          <p class="text-xs font-bold text-[#181411] mb-2">Registrar nuevo hijo/a</p>
          <input type="text" id="nuevo-nombre-hijo" placeholder="Nombre hijo/a" class="w-full p-2 mb-2 border border-gray-200 rounded text-xs" />
          <input type="text" id="nuevo-rut-hijo" placeholder="RUT hijo/a" maxlength="12" class="w-full p-2 mb-2 border border-gray-200 rounded text-xs" />
          <div class="flex gap-2">
            <button type="button" id="btnGuardarNuevoHijo" class="bg-[#e87a30] text-white text-xs font-bold px-3 py-1.5 rounded-lg">Guardar</button>
            <button type="button" id="btnCancelarNuevoHijo" class="bg-gray-200 text-gray-700 text-xs font-bold px-3 py-1.5 rounded-lg">Cancelar</button>
          </div>
        </div>
      </div>

      <div class="border-t border-gray-100 pt-3">
        <h4 class="font-bold text-xs text-[#887263] uppercase mb-1">Padres / Cuidadores Vinculados</h4>
        ${nombresPadresHtml}
      </div>
    `;

    const contenedoresAntiguos = modal.querySelectorAll('.bg-gray-50, .border-t');
    contenedoresAntiguos.forEach(el => {
      if (el !== infoSection && !infoSection.contains(el) && (el.textContent.includes('DATOS DEL BEBÉ') || el.textContent.includes('Registrado y Seguro') || el.textContent.includes('Información compartida'))) {
        el.remove();
      }
    });

    const btnAbrirForm = infoSection.querySelector('#btnAbrirFormAddHijo');
    const formContainer = infoSection.querySelector('#form-add-hijo-container');
    const btnCancelar = infoSection.querySelector('#btnCancelarNuevoHijo');
    const btnGuardar = infoSection.querySelector('#btnGuardarNuevoHijo');

    if (btnAbrirForm && formContainer) {
      btnAbrirForm.onclick = () => formContainer.classList.toggle('hidden');
    }
    if (btnCancelar && formContainer) {
      btnCancelar.onclick = () => formContainer.classList.add('hidden');
    }

    const inputRutNuevo = infoSection.querySelector('#nuevo-rut-hijo');
    if (inputRutNuevo) {
      inputRutNuevo.addEventListener('input', (e) => {
        e.target.value = formatRut(e.target.value);
      });
    }

    if (btnGuardar) {
      btnGuardar.onclick = async () => {
        const nombreVal = infoSection.querySelector('#nuevo-nombre-hijo').value.trim();
        const rutVal = inputRutNuevo.value.trim();

        if (!nombreVal || !validarRut(rutVal)) {
          showToast('Por favor ingresa un nombre y un RUT válido.', 'warning');
          return;
        }

        try {
          btnGuardar.disabled = true;
          btnGuardar.textContent = 'Guardando...';

          const hijosActuales = nidoData.hijos || [];
          if (hijosActuales.some(h => h.rut === rutVal)) {
            showToast('Este RUT ya se encuentra registrado en el nido.', 'warning');
            btnGuardar.disabled = false;
            btnGuardar.textContent = 'Guardar';
            return;
          }

          const nuevosHijos = [...hijosActuales, { nombre: nombreVal, rut: rutVal }];
          await updateDoc(doc(db, "nidos", userData.nidoId), {
            hijos: nuevosHijos
          });

          showToast('¡Hijo/a añadido con éxito!', 'success');
          modal.close();
          setTimeout(() => location.reload(), 1000);
        } catch (err) {
          console.error("Error al añadir hijo:", err);
          showToast('Error al registrar al nuevo miembro.', 'error');
          btnGuardar.disabled = false;
          btnGuardar.textContent = 'Guardar';
        }
      };
    }

  } catch (error) {
    console.error("Error al cargar perfil del nido:", error);
    showToast('Error al cargar la información del nido.', 'error');
  }
}

export function openFichaCuidadoModal(reservaId, nidoId) {
  const modal = document.getElementById('modalFichaCuidado');
  if (!modal) return;

  const currentUser = fichaModalContext?.getCurrentUserData();
  const currentUserRole = fichaModalContext?.getCurrentUserRole()?.toLowerCase();
  const esCuidadora = currentUserRole === 'cuidadora';
  const esConsejera = currentUserRole === 'consejera';
  if (!currentUser || (!esCuidadora && !esConsejera)) {
    showToast('No se pudo identificar el rol para completar la ficha.', 'error');
    return;
  }

  const titulo = esCuidadora ? 'Completar Bitácora de Cuidado' : 'Completar Ficha de Atención';
  const campos = esCuidadora ? `
    <label class="text-xs font-bold text-gray-700">Alimentación
      <input type="text" name="tipoAlimentacion" placeholder="Ej. Leche materna" required class="w-full mt-1 p-2 border border-gray-300 rounded-lg text-sm font-normal">
    </label>
    <label class="text-xs font-bold text-gray-700">Horas de sueño
      <input type="number" name="horasSueno" min="0" step="0.5" required class="w-full mt-1 p-2 border border-gray-300 rounded-lg text-sm font-normal">
    </label>
    <label class="text-xs font-bold text-gray-700">Cantidad de pañales
      <input type="number" name="cantidadPanales" min="0" step="1" required class="w-full mt-1 p-2 border border-gray-300 rounded-lg text-sm font-normal">
    </label>
    <label class="text-xs font-bold text-gray-700">Observaciones
      <textarea name="observaciones" rows="4" class="w-full mt-1 p-2 border border-gray-300 rounded-lg text-sm font-normal"></textarea>
    </label>
  ` : `
    <label class="text-xs font-bold text-gray-700">Motivo de consulta
      <input type="text" name="motivoConsulta" required class="w-full mt-1 p-2 border border-gray-300 rounded-lg text-sm font-normal">
    </label>
    <label class="text-xs font-bold text-gray-700">Evaluación
      <textarea name="evaluacion" rows="4" required class="w-full mt-1 p-2 border border-gray-300 rounded-lg text-sm font-normal"></textarea>
    </label>
    <label class="text-xs font-bold text-gray-700">Plan de acción
      <textarea name="planAccion" rows="4" required class="w-full mt-1 p-2 border border-gray-300 rounded-lg text-sm font-normal"></textarea>
    </label>
  `;

  modal.innerHTML = `
    <div class="bg-white rounded-2xl p-6 sm:p-8 w-full relative shadow-xl max-h-[90vh] overflow-y-auto">
      <button type="button" class="btnCerrarModal absolute top-3 right-4 text-2xl text-gray-400 hover:text-gray-700" aria-label="Cerrar">&times;</button>
      <h2 class="text-xl font-bold mb-5 text-[#181411]">${titulo}</h2>
      <form id="fichaCuidadoForm" class="flex flex-col gap-4">
        <input type="hidden" name="reservaId">
        <input type="hidden" name="nidoId">
        ${campos}
        <button type="submit" class="bg-[#e87a30] text-white font-bold rounded-full py-2.5 mt-2 hover:bg-[#d66a20] transition-colors text-sm">Guardar</button>
      </form>
    </div>
  `;

  const form = modal.querySelector('#fichaCuidadoForm');
  form.elements.namedItem('reservaId').value = reservaId || '';
  form.elements.namedItem('nidoId').value = nidoId || '';
  modal.querySelector('.btnCerrarModal').onclick = () => modal.close();
  modal.onclick = (event) => {
    if (event.target === modal) modal.close();
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const formNidoId = formData.get('nidoId');
    if (!formNidoId) {
      showToast('Esta cita no tiene un Nido asociado. Pide a los padres registrar su nido.', 'error');
      return;
    }

    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Guardando...';

    try {
      const prestadorId = auth.currentUser?.uid;
      if (!prestadorId) throw new Error('No se pudo identificar al profesional.');
      const snapshotNido = await capturarSnapshotNido(formNidoId);
      const ahora = new Date().toISOString();
      const data = {
        reservaId: formData.get('reservaId'),
        nidoId: formNidoId,
        prestadorId,
        prestadorNombre: currentUser.nombre || 'Prestador',
        prestadorRol: currentUserRole,
        prestadorRut: currentUser.rut || null,
        nidoNombreBebe: snapshotNido.nidoNombreBebe,
        nidoRutBebe: snapshotNido.nidoRutBebe,
        padresNombres: snapshotNido.padresNombres,
        creadoEn: ahora,
        ...(esCuidadora ? {
          fecha: ahora,
          tipoAlimentacion: formData.get('tipoAlimentacion').trim(),
          horasSueno: parseFloat(formData.get('horasSueno')) || 0,
          cantidadPanales: parseInt(formData.get('cantidadPanales'), 10) || 0,
          observaciones: formData.get('observaciones').trim()
        } : {
          motivoConsulta: formData.get('motivoConsulta').trim(),
          evaluacion: formData.get('evaluacion').trim(),
          planAccion: formData.get('planAccion').trim()
        })
      };

      if (esCuidadora) {
        await saveFichaCuidado(data);
      } else {
        await saveFichaAtencion(data);
      }

      showToast(esCuidadora ? 'Bitácora de cuidado guardada y compartida' : 'Ficha de atención guardada y compartida', 'success');
      modal.close();
      await fichaModalContext.renderContent(currentUserRole, currentUser);
    } catch (error) {
      console.error('Error guardando ficha:', error);
      showToast('Error al guardar la ficha.', 'error');
      btn.disabled = false;
      btn.textContent = 'Guardar';
    }
  });

  modal.showModal();
}

/**
 * Captura un snapshot inmutable del nido y los padres al momento de la creación.
 * Este snapshot queda grabado en el documento histórico y NUNCA cambia,
 * incluso si después se modifican los datos del nido.
 */
async function capturarSnapshotNido(nidoId) {
  const snapshot = {
    nidoNombreBebe: null,
    nidoRutBebe: null,
    padresNombres: [],
    padresUids: [],
  };
  if (!nidoId) return snapshot;

  try {
    const nidoData = await obtenerDatosNido(nidoId);
    if (!nidoData) return snapshot;

    // Nombre y RUT del primer bebé
    const hijos = nidoData.hijos || (nidoData.rutBebe ? [{ nombre: nidoData.nombreBebe, rut: nidoData.rutBebe }] : []);
    if (hijos[0]) {
      snapshot.nidoNombreBebe = hijos[0].nombre || null;
      snapshot.nidoRutBebe = hijos[0].rut || null;
    }

    // Nombres de los padres
    const padresUids = nidoData.padresUids || [];
    snapshot.padresUids = [...padresUids];

    const nombresPromises = padresUids.map(async (uid) => {
      try {
        const pDoc = await getDoc(doc(db, 'usuarios', uid));
        return pDoc.exists() ? (pDoc.data().nombre || null) : null;
      } catch { return null; }
    });
    const nombres = await Promise.all(nombresPromises);
    snapshot.padresNombres = nombres.filter(Boolean);
  } catch (err) {
    console.warn('No se pudo capturar snapshot del nido:', err);
  }

  return snapshot;
}

export function initAccountFormHandlers({ renderContent, getCurrentUserData, getCurrentUserRole }) {
  fichaModalContext = { renderContent, getCurrentUserData, getCurrentUserRole };
}