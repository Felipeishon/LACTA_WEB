// `rol` en `usuarios` siempre se guarda como arreglo (ej: ['padre'], ['consejera'],
// ['consejera', 'cuidadora'], ['admin']), incluso cuando el usuario tiene un solo rol.
// Estos helpers evitan repetir `Array.isArray(...)` en cada archivo y previenen bugs
// de comparar un arreglo directamente contra un string (ej: `rol !== 'padre'`).

export function getRoles(userData) {
  if (!userData) return [];
  const rol = userData.rol;
  if (Array.isArray(rol)) return rol;
  if (rol) return [rol]; // compatibilidad con datos antiguos guardados como string
  return [];
}

export function getPrimaryRole(userData) {
  return getRoles(userData)[0] || 'padre';
}

export function hasRole(userData, rolBuscado) {
  return getRoles(userData).includes(rolBuscado);
}
