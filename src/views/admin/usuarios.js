
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
import { db } from '../../firebase.js';
import { doc, updateDoc } from 'firebase/firestore';

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
      div.innerHTML = `
        <div>
          <p class="font-bold text-sm">${escapeHTML(u.nombre)} <span class="text-[10px] bg-blue-100 text-blue-700 px-1 rounded">${escapeHTML(Array.isArray(u.rol) ? u.rol.join(', ') : u.rol)}</span></p>
          <p class="text-[10px] text-gray-500">${escapeHTML(u.email)} • RUT: ${escapeHTML(u.rut || 'No registrado')}</p>
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
        const searchable = [user.nombre, user.email, user.rut].filter(Boolean).join(' ').toLowerCase();
        return (!search || searchable.includes(search))
          && (!role || roles.includes(role))
          && (!status || user.estado === status);
      });

      if (filteredUsers.length === 0) {
        container.innerHTML = '<p class="text-center py-8 text-gray-400 italic">No hay usuarios que coincidan.</p>';
        return;
      }

      container.innerHTML = `
        <table class="w-full text-left text-sm">
          <thead class="bg-gray-50 text-gray-600 border-b border-gray-200">
            <tr>
              <th class="p-3">Nombre</th>
              <th class="p-3">Email</th>
              <th class="p-3">RUT</th>
              <th class="p-3">Rol</th>
              <th class="p-3">Estado</th>
              <th class="p-3">Registro</th>
              <th class="p-3">Tips</th>
              <th class="p-3">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            ${filteredUsers.map(user => {
              const roles = Array.isArray(user.rol) ? user.rol : [user.rol].filter(Boolean);
              const fecha = formatFirestoreDate(user.fechaRegistro) || '---';
              const esPrestador = roles.includes('consejera') || roles.includes('cuidadora');
              return `
                <tr>
                  <td class="p-3 font-bold">${escapeHTML(user.nombre || 'Sin nombre')}</td>
                  <td class="p-3 text-xs">${escapeHTML(user.email || '---')}</td>
                  <td class="p-3 text-xs">${escapeHTML(user.rut || '---')}</td>
                  <td class="p-3 text-xs">${escapeHTML(roles.join(', ') || '---')}</td>
                  <td class="p-3 text-xs">${escapeHTML(user.estado || '---')}</td>
                  <td class="p-3 text-xs text-gray-500">${escapeHTML(fecha)}</td>
                  <td class="p-3 text-center">
                    ${esPrestador ? `<input type="checkbox" data-uid="${escapeHTML(user.id)}" class="toggle-tips-admin" ${user.puedeCrearTips ? 'checked' : ''}>` : '---'}
                  </td>
                  <td class="p-3 whitespace-nowrap">
                    <button type="button" data-uid="${escapeHTML(user.id)}" class="btn-edit-user text-blue-600 hover:text-blue-800 text-xs font-bold">Editar</button>
                    <button type="button" data-uid="${escapeHTML(user.id)}" class="btn-delete-user text-red-600 hover:text-red-800 text-xs font-bold ml-3">Eliminar</button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      `;

      container.querySelectorAll('.toggle-tips-admin').forEach(toggle => {
        toggle.addEventListener('change', async event => {
          const canCreateTips = event.target.checked;
          try {
            await updateDoc(doc(db, 'usuarios', event.target.dataset.uid), { puedeCrearTips: canCreateTips });
            showToast(`Permiso para crear tips ${canCreateTips ? 'otorgado' : 'revocado'}.`, 'success');
          } catch {
            event.target.checked = !canCreateTips;
            showToast('Error al actualizar permiso.', 'error');
          }
        });
      });

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
          form.elements.estado.value = user.estado || 'pendiente';
          form.querySelectorAll('input[name="rol"]').forEach(input => {
            input.checked = roles.includes(input.value);
          });
          modal.showModal();
        });
      });

      container.querySelectorAll('.btn-delete-user').forEach(button => {
        button.addEventListener('click', async () => {
          const uid = button.dataset.uid;
          if (!window.confirm('¿Estás seguro de desactivar este usuario?')) return;
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
        if (roles.length === 0) {
          showToast('Selecciona al menos un rol.', 'error');
          return;
        }
        try {
          await updateUserProfile(uid, {
            nombre: formData.get('nombre'),
            email: formData.get('email'),
            estado: formData.get('estado'),
            rol: roles
          });
          const user = users.find(item => item.id === uid);
          if (user) {
            user.nombre = formData.get('nombre');
            user.email = formData.get('email');
            user.estado = formData.get('estado');
            user.rol = roles;
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
      const esPrestador = !hasRole(u, 'padre');
      const color = esPrestador ? 'bg-green-500' : 'bg-blue-500';
      const fecha = formatFirestoreDate(u.fechaRegistro) || '---';
      return `
        <li class="flex items-center justify-between text-sm">
          <span class="flex items-center gap-2">
            <span class="w-2 h-2 ${color} rounded-full"></span> ${escapeHTML(u.nombre)}
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
