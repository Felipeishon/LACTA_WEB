
import { showToast } from '../../ui/notifications.js';
import { emailService } from '../../emailService.js';
import {
  getPendingUsers, getAllUsers, getLatestUsers,
  updateUserProfile, deleteUserProfile
} from '../../api/firestore.js';
import { approveUserWithAudit } from '../../api/admin.js';
import { escapeHTML } from '../../utils/html.js';
import { hasRole } from '../../utils/roles.js';
import { formatFirestoreDate } from '../../utils/helpers.js';
import { auth } from '../../firebase.js';
import { sendPasswordResetEmail } from 'firebase/auth';
import { showConfirmModal } from '../../modales.js';

function getCertificateDataUrl(value) {
  if (typeof value !== 'string' ||
      !/^data:(?:image\/(?:jpeg|png)|application\/pdf);base64,[A-Za-z0-9+/=]+$/i.test(value)) {
    return '';
  }
  return value;
}

async function loadPendingUsers() {
  const container = document.getElementById('pending-users-list');
  if (!container) return;
  try {
    const users = await getPendingUsers();
    if (users.length === 0) {
      container.innerHTML = '<p class="text-sm text-gray-500 italic">No hay solicitudes nuevas.</p>';
      return;
    }

    container.innerHTML = '';
    users.forEach(u => {
      const div = document.createElement('div');
      div.className = 'flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200';
      const certificadoUrl = getCertificateDataUrl(u.certificadoUrl);
      div.innerHTML = `
        <div>
          <p class="font-bold text-sm">${escapeHTML(u.nombre)} <span class="text-[10px] bg-blue-100 text-blue-700 px-1 rounded">${escapeHTML(Array.isArray(u.rol) ? u.rol.join(', ') : u.rol)}</span></p>
          <p class="text-[10px] text-gray-500">${escapeHTML(u.email)} • RUT: ${escapeHTML(u.rut || 'No registrado')}</p>
          ${certificadoUrl
            ? `<a href="${escapeHTML(certificadoUrl)}" target="_blank" rel="noopener noreferrer" class="mt-2 inline-block text-xs font-bold text-blue-600 underline">📄 Ver Certificación</a>`
            : '<span class="text-xs text-gray-400 italic mt-2 block">Sin certificación adjunta</span>'}
        </div>
        <button data-uid="${escapeHTML(u.id)}" data-nombre="${escapeHTML(u.nombre)}" data-email="${escapeHTML(u.email)}" class="btn-approve bg-green-500 text-white text-[10px] font-bold py-1 px-2 rounded hover:bg-green-600 transition-colors">Aprobar</button>
      `;
      container.appendChild(div);
    });

    container.querySelectorAll('.btn-approve').forEach(b => b.addEventListener('click', async (e) => {
      const { uid, nombre, email } = e.target.dataset;
      const targetBtn = e.target;
      targetBtn.disabled = true;
      try {
        await approveUserWithAudit(uid, 'Aprobado desde el panel de administración.');
        showToast('Usuario aprobado con éxito (acción auditada).', 'success');
        emailService.sendApprovalNotification(nombre, email);
        loadPendingUsers();
      } catch (error) {
        console.error('Error en el flujo de aprobación:', error);
        showToast(error.message || 'Error al aprobar usuario', 'error');
        targetBtn.disabled = false;
      }
    }));

  } catch {
    container.innerHTML = '<p class="text-xs text-red-500">Error al cargar.</p>';
  }
}

async function loadAllUsersTable() {
  const container = document.getElementById('users-table-container');
  const searchInput = document.getElementById('users-search');
  const roleFilter = document.getElementById('users-role-filter');
  const statusFilter = document.getElementById('users-status-filter');
  if (!container) return;

  try {
    const users = await getAllUsers();

    const renderTable = () => {
      const search = searchInput.value.trim().toLowerCase();
      const role = roleFilter.value;
      const status = statusFilter.value;
      const filteredUsers = users.filter(user => {
        const roles = Array.isArray(user.rol) ? user.rol : [user.rol].filter(Boolean);
        const searchable = [user.nombre, user.email, user.telefono, user.rut].filter(Boolean).join(' ').toLowerCase();
        return (!search || searchable.includes(search))
          && (!role || roles.includes(role))
          && (!status || user.estado === status);
      });

      if (filteredUsers.length === 0) {
        container.innerHTML = `
          <div class="flex justify-end mb-4">
            <button type="button" id="btn-export-users" class="bg-[#e87a30] hover:bg-[#d66a20] text-white font-bold py-2 px-4 rounded-lg text-sm transition">📥 Exportar CSV</button>
          </div>
          <p class="text-center py-8 text-gray-400 italic">No hay usuarios que coincidan.</p>
        `;
        document.getElementById('btn-export-users').addEventListener('click', () => exportUsersToCsv(filteredUsers));
        return;
      }

      container.innerHTML = `
        <div class="flex justify-end mb-4">
          <button type="button" id="btn-export-users" class="bg-[#e87a30] hover:bg-[#d66a20] text-white font-bold py-2 px-4 rounded-lg text-sm transition">📥 Exportar CSV</button>
        </div>
        <div class="overflow-x-auto w-full rounded-lg border border-gray-200">
          <table class="w-full min-w-[900px] text-left text-sm">
            <thead class="bg-gray-50 text-gray-600 border-b border-gray-200">
              <tr>
                <th class="p-3 whitespace-nowrap">Nombre</th>
                <th class="p-3 whitespace-nowrap">Email</th>
                <th class="p-3 whitespace-nowrap">Teléfono</th>
                <th class="p-3 whitespace-nowrap">RUT</th>
                <th class="p-3 whitespace-nowrap">Rol</th>
                <th class="p-3 whitespace-nowrap">Estado</th>
                <th class="p-3 whitespace-nowrap">Registro</th>
                <th class="p-3 whitespace-nowrap">Último Acceso</th>
                <th class="p-3 whitespace-nowrap">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              ${filteredUsers.map(user => {
                const roles = Array.isArray(user.rol) ? user.rol : [user.rol].filter(Boolean);
                const fecha = formatFirestoreDate(user.fechaRegistro) || '---';
                const ultimoAcceso = formatFirestoreDate(user.ultimoAcceso, true) || 'Nunca';
                const esCurrentUser = user.id === auth.currentUser?.uid;
                return `
                  <tr>
                    <td class="p-3 font-bold whitespace-nowrap">${escapeHTML(user.nombre || 'Sin nombre')}</td>
                    <td class="p-3 text-xs whitespace-nowrap">${escapeHTML(user.email || '---')}</td>
                    <td class="p-3 text-xs whitespace-nowrap">${escapeHTML(user.telefono || '-')}</td>
                    <td class="p-3 text-xs whitespace-nowrap">${escapeHTML(user.rut || '---')}</td>
                    <td class="p-3 text-xs whitespace-nowrap">${escapeHTML(roles.join(', ') || '---')}</td>
                    <td class="p-3 text-xs whitespace-nowrap">${escapeHTML(user.estado || '---')}</td>
                    <td class="p-3 text-xs text-gray-500 whitespace-nowrap">${escapeHTML(fecha)}</td>
                    <td class="p-3 text-xs text-gray-500 whitespace-nowrap">${escapeHTML(ultimoAcceso)}</td>
                    <td class="p-3 whitespace-nowrap">
                      <button type="button" data-uid="${escapeHTML(user.id)}" class="btn-edit-user text-blue-600 hover:text-blue-800 text-xs font-bold">Editar</button>
                      <button type="button" data-uid="${escapeHTML(user.id)}" class="btn-delete-user text-red-600 hover:text-red-800 text-xs font-bold ml-3 ${esCurrentUser ? 'invisible pointer-events-none' : ''}" ${esCurrentUser ? 'disabled aria-hidden="true" tabindex="-1"' : ''}>Desactivar</button>
                      <button type="button" data-uid="${escapeHTML(user.id)}" class="btn-reset-password text-indigo-600 hover:text-indigo-800 text-xs font-bold ml-3">🔑 Reset Pass</button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `;

      document.getElementById('btn-export-users').addEventListener('click', () => exportUsersToCsv(filteredUsers));

      container.querySelectorAll('.btn-edit-user').forEach(button => {
        button.addEventListener('click', () => {
          const user = users.find(item => item.id === button.dataset.uid);
          const modal = document.getElementById('modalEdicionUsuario');
          const form = document.getElementById('formEdicionUsuario');
          if (!user || !modal || !form) return;
          const roles = Array.isArray(user.rol) ? user.rol : [user.rol].filter(Boolean);
          form.elements.uid.value = user.id;
          form.elements.nombre.value = user.nombre || '';
          form.elements.email.value = user.email || '';
          form.elements.telefono.value = user.telefono || '';
          form.elements.estado.value = user.estado || 'pendiente';
          const certificateContainer = form.querySelector('#edit-user-certificate');
          const certificateUrl = getCertificateDataUrl(user.certificadoUrl);
          if (certificateContainer) {
            certificateContainer.innerHTML = certificateUrl
              ? `<a href="${escapeHTML(certificateUrl)}" target="_blank" rel="noopener noreferrer" class="inline-block text-xs font-bold text-blue-600 underline">📄 Ver Certificación</a>`
              : '';
            certificateContainer.classList.toggle('hidden', !certificateUrl);
          }
          const direccion = user.direccion && typeof user.direccion === 'object'
            ? user.direccion
            : { calle: typeof user.direccion === 'string' ? user.direccion : '' };
          form.querySelector('#edit-user-calle').value = direccion.calle || '';
          form.querySelector('#edit-user-numero').value = direccion.numero || '';
          form.querySelector('#edit-user-departamento').value = direccion.departamento || '';
          form.querySelector('#edit-user-comuna').value = direccion.comuna || '';
          form.querySelector('#edit-user-referencia').value = direccion.referencia || '';
          const direccionContainer = document.getElementById('container-direccion-admin');
          const tipsPermissionContainer = document.getElementById('edit-tips-permission-container');
          const tipsPermissionInput = document.getElementById('edit-user-tips');
          const roleInputs = form.querySelectorAll('input[name="rol"]');
          const updateTipsPermissionVisibility = () => {
            const rolesActuales = Array.from(roleInputs)
              .filter(input => input.checked)
              .map(input => input.value);
            const esPrestador = rolesActuales.includes('consejera') || rolesActuales.includes('cuidadora');
            direccionContainer.classList.toggle('hidden', !rolesActuales.includes('padre'));
            tipsPermissionContainer.classList.toggle('hidden', !esPrestador);
            if (!esPrestador) tipsPermissionInput.checked = false;
          };

          tipsPermissionInput.checked = Boolean(user.puedeCrearTips);
          roleInputs.forEach(input => {
            input.checked = roles.includes(input.value);
            if (!input.dataset.tipsPermissionListenerAttached) {
              input.dataset.tipsPermissionListenerAttached = 'true';
              input.addEventListener('change', updateTipsPermissionVisibility);
            }
          });
          updateTipsPermissionVisibility();
          modal.showModal();
        });
      });

      container.querySelectorAll('.btn-delete-user').forEach(button => {
        button.addEventListener('click', async () => {
          const uid = button.dataset.uid;
          const confirmado = await showConfirmModal('Desactivar Usuario', '¿Estás seguro de desactivar a este usuario? No podrá acceder al sistema, pero sus datos se conservarán.');
          if (!confirmado) return;
          button.disabled = true;
          try {
            await deleteUserProfile(uid);
            const userIndex = users.findIndex(user => user.id === uid);
            if (userIndex !== -1) users[userIndex].estado = 'inactivo';
            renderTable();
            showToast('Usuario desactivado correctamente.', 'success');
          } catch (error) {
            console.error('Error al desactivar usuario:', error);
            button.disabled = false;
            showToast(error.message || 'Error al desactivar usuario.', 'error');
          }
        });
      });

      container.querySelectorAll('.btn-reset-password').forEach(button => {
        button.addEventListener('click', async () => {
          const user = users.find(item => item.id === button.dataset.uid);
          if (!user?.email) {
            showToast('El usuario no tiene un email registrado.', 'error');
            return;
          }
          const confirmado = await showConfirmModal('Restablecer Contraseña', `¿Enviar un correo para restablecer la contraseña a ${user.email}?`, false);
          if (!confirmado) return;

          button.disabled = true;
          try {
            await sendPasswordResetEmail(auth, user.email);
            showToast('Correo para restablecer contraseña enviado.', 'success');
          } catch (error) {
            console.error('Error al enviar restablecimiento de contraseña:', error);
            showToast('No se pudo enviar el correo para restablecer la contraseña.', 'error');
            button.disabled = false;
          }
        });
      });
    };

    const editModal = document.getElementById('modalEdicionUsuario');
    const editForm = document.getElementById('formEdicionUsuario');
    if (editForm && !editForm.dataset.listenerAttached) {
      editForm.dataset.listenerAttached = 'true';
      editForm.addEventListener('submit', async event => {
        event.preventDefault();
        const formData = new FormData(editForm);
        const uid = formData.get('uid');
        const roles = Array.from(editForm.querySelectorAll('input[name="rol"]:checked')).map(input => input.value);
        const esPrestador = roles.includes('consejera') || roles.includes('cuidadora');
        const puedeCrearTips = esPrestador && document.getElementById('edit-user-tips').checked;
        const direccion = roles.includes('padre') ? {
          calle: document.getElementById('edit-user-calle').value.trim(),
          numero: document.getElementById('edit-user-numero').value.trim(),
          departamento: document.getElementById('edit-user-departamento').value.trim(),
          comuna: document.getElementById('edit-user-comuna').value.trim(),
          referencia: document.getElementById('edit-user-referencia').value.trim()
        } : undefined;
        if (direccion) {
          direccion.texto = [[direccion.calle, direccion.numero].filter(Boolean).join(' '), direccion.comuna].filter(Boolean).join(', ');
        }
        if (roles.length === 0) {
          showToast('Selecciona al menos un rol.', 'error');
          return;
        }
        try {
          await updateUserProfile(uid, {
            nombre: formData.get('nombre'),
            email: formData.get('email'),
            telefono: formData.get('telefono'),
            estado: formData.get('estado'),
            rol: roles,
            puedeCrearTips,
            direccion
          });
          const user = users.find(item => item.id === uid);
          if (user) {
            user.nombre = formData.get('nombre');
            user.email = formData.get('email');
            user.telefono = formData.get('telefono');
            user.estado = formData.get('estado');
            user.rol = roles;
            user.puedeCrearTips = puedeCrearTips;
            if (direccion) user.direccion = direccion;
          }
          editModal?.close();
          renderTable();
          showToast('Usuario actualizado con éxito.', 'success');
        } catch (error) {
          console.error('Error al actualizar usuario:', error);
          showToast('Error al actualizar usuario.', 'error');
        }
      });
    }

    searchInput.addEventListener('input', renderTable);
    roleFilter.addEventListener('change', renderTable);
    statusFilter.addEventListener('change', renderTable);
    renderTable();
  } catch (error) {
    console.error('Error en loadAllUsersTable:', error);
    container.innerHTML = '<p class="text-center py-8 text-red-500 italic">Error cargando usuarios.</p>';
  }
}

function exportUsersToCsv(users) {
  const headers = ['Nombre', 'Email', 'Teléfono', 'RUT', 'Rol', 'Estado'];
  const csvCell = value => {
    const text = String(value ?? '');
    const safeText = /^[=+\-@]/.test(text) ? `'${text}` : text;
    return `"${safeText.replace(/"/g, '""')}"`;
  };
  const rows = users.map(user => {
    const roles = Array.isArray(user.rol) ? user.rol : [user.rol].filter(Boolean);
    return [
      user.nombre || '',
      user.email || '',
      user.telefono || '',
      user.rut || '',
      roles.join(', '),
      user.estado || ''
    ].map(csvCell).join(',');
  });
  const csv = `\uFEFF${[headers.map(csvCell).join(','), ...rows].join('\r\n')}`;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'usuarios_lactanido.csv';
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

async function loadLatestUsers() {
  const container = document.getElementById('admin-latest-users');
  if (!container) return;
  try {
    const users = await getLatestUsers();
    if (users.length === 0) {
      container.innerHTML = '<p class="text-sm text-gray-400">No hay usuarios registrados.</p>';
      return;
    }

    container.innerHTML = users.map(u => {
      const roles = Array.isArray(u.rol) ? u.rol : [u.rol].filter(Boolean);
      const labelRoles = { padre: 'Padre', consejera: 'Consejera', cuidadora: 'Cuidadora', admin: 'Admin' };
      const rolesLabel = roles.map(rol => labelRoles[rol] || rol).join(', ') || 'Sin rol';
      const esPrestador = hasRole(u, 'consejera') || hasRole(u, 'cuidadora');
      const color = esPrestador ? 'bg-green-500' : 'bg-blue-500';
      const fecha = formatFirestoreDate(u.fechaRegistro) || '---';
      return `
        <li class="flex items-center justify-between text-sm">
          <span class="flex items-center gap-2">
            <span class="w-2 h-2 ${color} rounded-full"></span> ${escapeHTML(u.nombre)} (${escapeHTML(rolesLabel)})
          </span>
          <span class="text-gray-400 text-xs">${escapeHTML(fecha)}</span>
        </li>
      `;
    }).join('');
  } catch {
    showToast('Error al cargar últimos registros', 'error');
  }
}

export { loadPendingUsers, loadAllUsersTable, loadLatestUsers };
