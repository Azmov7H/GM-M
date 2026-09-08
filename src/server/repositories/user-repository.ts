import { eq, and } from "drizzle-orm";
import { db } from "@/server/db";
import {
  users,
  userRoles,
  roles,
  rolePermissions,
  permissions,
} from "@/server/db/schema";

export interface UserWithRoles {
  user: Pick<typeof users.$inferSelect, "id" | "username" | "displayName">;
  roles: string[];
}

export async function findByUsername(username: string) {
  const rows = await db.select().from(users).where(eq(users.username, username)).limit(1);
  return rows[0];
}

export async function findById(id: string) {
  const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return rows[0];
}

export async function getUserRoles(userId: string): Promise<string[]> {
  const rows = await db
    .select({ name: roles.name })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .where(eq(userRoles.userId, userId));
  return rows.map((r) => r.name);
}

export async function getRoleNamesByUser(userId: string): Promise<string[]> {
  return getUserRoles(userId);
}

export async function getUserPermissions(userId: string): Promise<string[]> {
  const rows = await db
    .select({ name: permissions.name })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .innerJoin(rolePermissions, eq(rolePermissions.roleId, roles.id))
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(eq(userRoles.userId, userId));
  return Array.from(new Set(rows.map((r) => r.name)));
}

export async function getUserWithRoles(userId: string): Promise<UserWithRoles | null> {
  const rows = await db
    .select({ id: users.id, username: users.username, displayName: users.displayName })
    .from(users)
    .where(and(eq(users.id, userId), eq(users.isActive, true)))
    .limit(1);
  const user = rows[0];
  if (!user) return null;
  const roleNames = await getUserRoles(userId);
  return { user, roles: roleNames };
}

export async function listUsers() {
  return db
    .select({
      id: users.id,
      username: users.username,
      displayName: users.displayName,
      email: users.email,
      isActive: users.isActive,
      createdAt: users.createdAt,
    })
    .from(users);
}
