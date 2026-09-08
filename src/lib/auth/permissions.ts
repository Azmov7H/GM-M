export function hasAnyRole(userRoles: string[], allowed: string[]): boolean {
  return userRoles.some((role) => allowed.includes(role));
}

export function hasPermission(userPermissions: string[], required: string): boolean {
  return userPermissions.includes(required);
}

export function hasAllPermissions(
  userPermissions: string[],
  required: string[],
): boolean {
  return required.every((p) => userPermissions.includes(p));
}

export function requirePermission(userPermissions: string[], required: string): boolean {
  return userPermissions.includes(required);
}
