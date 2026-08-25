// Archivo: src/ui/account.js
import { auth, db } from '../firebase.js';
import { saveFichaCuidado, obtenerDatosNido } from '../api/firestore.js';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { showToast } from './notifications.js';
import { escapeHTML } from '../utils/html.js';
import { formatRut, validarRut } from '../rut.js';

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

    // 1. Procesamos la lista de hijos
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

    // 2. Obtenemos los nombres reales de los padres vinculados desde Firestore
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

    // 3. Estructura limpia y depurada del modal (eliminando todo el contenido estático anterior)
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
        
        <!-- Formulario oculto para añadir hijo desde el modal -->
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

    // Limpiamos también cualquier nodo estático heredado del HTML del modal si existiera
    const contenedoresAntiguos = modal.querySelectorAll('.bg-gray-50, .border-t');
    contenedoresAntiguos.forEach(el => {
      if (el !== infoSection && !infoSection.contains(el) && (el.textContent.includes('DATOS DEL BEBÉ') || el.textContent.includes('Registrado y Seguro') || el.textContent.includes('Información compartida'))) {
        el.remove();
      }
    });

    // Eventos interactivos internos del modal
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

  document.getElementById('ficha-reservaId').value = reservaId;
  document.getElementById('ficha-nidoId').value = nidoId;

  const inputFecha = modal.querySelector('input[name="fecha"]');
  if (inputFecha) inputFecha.value = new Date().toISOString().split('T')[0];

  modal.showModal();
}

export function initAccountFormHandlers({ renderContent, getCurrentUserData, getCurrentUserRole }) {
  const fichaCuidadoForm = document.getElementById('fichaCuidadoForm');
  if (fichaCuidadoForm) {
    fichaCuidadoForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = fichaCuidadoForm.querySelector('button[type="submit"]');
      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Guardando Ficha...';
      }

      const fd = new FormData(fichaCuidadoForm);
      const data = {
        reservaId: fd.get('reservaId'),
        nidoId: fd.get('nidoId'),
        fecha: fd.get('fecha'),
        horasEfectivas: parseInt(fd.get('horasEfectivas')),
        tipoAlimentacion: fd.get('tipoAlimentacion'),
        cantidadOz: parseInt(fd.get('cantidadOz')) || 0,
        horasSueno: parseFloat(fd.get('horasSueno')) || 0,
        cantidadPanales: parseInt(fd.get('cantidadPanales')) || 0,
        observaciones: fd.get('observaciones'),
        recomendaciones: fd.get('recomendaciones'),
        seguimiento: fd.get('seguimiento'),
        prestadorId: auth.currentUser.uid,
        prestadorNombre: getCurrentUserData()?.nombre || 'Prestador',
        prestadorRol: getCurrentUserRole()
      };

      if (!data.nidoId) {
        showToast('Error: Esta cita no tiene un Nido asociado. Pide a los padres registrar su nido.', 'error');
        if (btn) {
          btn.disabled = false;
          btn.textContent = 'Guardar y Enviar Bitácora';
        }
        return;
      }

      try {
        await saveFichaCuidado(data);
        showToast('Ficha de cuidado guardada y compartida', 'success');
        fichaCuidadoForm.reset();
        document.getElementById('modalFichaCuidado')?.close();
        renderContent(getCurrentUserRole(), getCurrentUserData());
      } catch (err) {
        showToast('Error al guardar la bitácora', 'error');
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.textContent = 'Guardar y Enviar Bitácora';
        }
      }
    });
  }
}