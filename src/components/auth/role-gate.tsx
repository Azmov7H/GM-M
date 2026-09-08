import type { ReactNode } from "react";

import { getCurrentUser } from "@/lib/auth/current-user";
import { hasAllPermissions, hasAnyRole } from "@/lib/auth/permissions";

interface RoleGateProps {
  children: ReactNode;
  fallback?: ReactNode;
  /** User must have at least one of these roles */
  roles?: string[];
  /** User must have all of these permissions */
  permissions?: string[];
}

/**
 * Server-side gate. Hides children unless the current user satisfies the
 * role/permission requirements. This is cosmetic — real enforcement must
 * happen in API routes and server actions via permission checks.
 */
export async function RoleGate({
  children,
  fallback = null,
  roles,
  permissions,
}: RoleGateProps) {
  const user = await getCurrentUser();
  if (!user) return <>{fallback}</>;

  if (roles && roles.length > 0 && !hasAnyRole(user.roles, roles)) {
    return <>{fallback}</>;
  }

  if (
    permissions &&
    permissions.length > 0 &&
    !hasAllPermissions(user.permissions, permissions)
  ) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
