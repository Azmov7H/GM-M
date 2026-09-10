import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";

import { db } from "@/server/db";
import { users, userRoles, roles } from "@/server/db/schema";
import { hashPassword } from "@/lib/auth/password";
import { getUserRoles, listUsers } from "@/server/repositories/user-repository";
import { uid } from "@/server/db/factories";
import { logAudit } from "./audit.service";

export interface ServiceActor {
  id: string;
  roles: string[];
}

const OWNER_ROLE_NAME = "owner";

export const OWNER_MANAGE_DENIED = "لا يمكن إدارة حساب المالك";
export const OWNER_GRANT_DENIED = "منح دور المالك يتطلب صلاحية المالك";

function actorIsOwner(actor?: ServiceActor): boolean {
  return actor?.roles.includes(OWNER_ROLE_NAME) ?? false;
}

async function ownerRoleId(): Promise<string | null> {
  const rows = await db
    .select({ id: roles.id })
    .from(roles)
    .where(eq(roles.name, OWNER_ROLE_NAME))
    .limit(1);
  return rows[0]?.id ?? null;
}

async function targetIsOwner(userId: string): Promise<boolean> {
  return (await getUserRoles(userId)).includes(OWNER_ROLE_NAME);
}

/**
 * Owner accounts can only be managed by owners. Prevents privilege
 * escalation via role assignment, password reset, or deactivation.
 */
async function assertManageable(
  targetId: string,
  actor?: ServiceActor,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!actorIsOwner(actor) && (await targetIsOwner(targetId))) {
    return { ok: false as const, error: OWNER_MANAGE_DENIED };
  }
  return { ok: true as const };
}

async function assertGrantable(
  roleIds: string[] | undefined,
  actor?: ServiceActor,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!roleIds || roleIds.length === 0) return { ok: true as const };
  const ownerId = await ownerRoleId();
  if (ownerId && roleIds.includes(ownerId) && !actorIsOwner(actor)) {
    return { ok: false as const, error: OWNER_GRANT_DENIED };
  }
  return { ok: true as const };
}

export interface CreateUserInput {
  username: string;
  displayName: string;
  email?: string;
  password: string;
  roleIds?: string[];
}

export async function createUser(input: CreateUserInput, actor?: ServiceActor) {
  const grant = await assertGrantable(input.roleIds, actor);
  if (!grant.ok) return grant;

  const username = input.username.toLowerCase().trim();
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, username))
    .limit(1);
  if (existing.length > 0) {
    return { ok: false as const, error: "اسم المستخدم موجود مسبقاً" };
  }

  const id = uid("user");
  await db.insert(users).values({
    id,
    username,
    displayName: input.displayName.trim(),
    email: input.email?.trim() || null,
    passwordHash: await hashPassword(input.password),
    isActive: true,
  });

  if (input.roleIds && input.roleIds.length > 0) {
    await assignUserRoles(id, input.roleIds, actor);
  }

  await logAudit({
    userId: actor?.id,
    action: "create",
    resource: "users",
    resourceId: id,
  });
  return { ok: true as const, id };
}

export async function updateUser(
  id: string,
  input: { displayName?: string; email?: string | null; isActive?: boolean },
  actor?: ServiceActor,
) {
  const manageable = await assertManageable(id, actor);
  if (!manageable.ok) return manageable;
  const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!rows[0]) {
    return { ok: false as const, error: "المستخدم غير موجود" };
  }
  const patch: Partial<typeof users.$inferInsert> = {};
  if (input.displayName !== undefined) patch.displayName = input.displayName.trim();
  if (input.email !== undefined) patch.email = input.email?.trim() || null;
  if (input.isActive !== undefined) patch.isActive = input.isActive;
  if (Object.keys(patch).length > 0) {
    await db.update(users).set(patch).where(eq(users.id, id));
  }
  await logAudit({
    userId: actor?.id,
    action: "update",
    resource: "users",
    resourceId: id,
  });
  return { ok: true as const };
}

export async function deactivateUser(id: string, actorId: string, actor?: ServiceActor) {
  if (id === actorId) {
    return { ok: false as const, error: "لا يمكنك تعطيل حسابك الخاص" };
  }
  const manageable = await assertManageable(id, actor);
  if (!manageable.ok) return manageable;
  const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!rows[0]) {
    return { ok: false as const, error: "المستخدم غير موجود" };
  }
  await db.update(users).set({ isActive: false }).where(eq(users.id, id));
  await logAudit({
    userId: actorId,
    action: "deactivate",
    resource: "users",
    resourceId: id,
  });
  return { ok: true as const };
}

export async function assignUserRoles(
  userId: string,
  roleIds: string[],
  actor?: ServiceActor,
) {
  const manageable = await assertManageable(userId, actor);
  if (!manageable.ok) return manageable;
  const grant = await assertGrantable(roleIds, actor);
  if (!grant.ok) return grant;
  const userRows = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!userRows[0]) {
    return { ok: false as const, error: "المستخدم غير موجود" };
  }

  const roleRows = await db.select({ id: roles.id }).from(roles);
  const validIds = new Set(roleRows.map((r) => r.id));
  const uniqueIds = Array.from(new Set(roleIds)).filter((rid) => validIds.has(rid));

  await db.delete(userRoles).where(eq(userRoles.userId, userId));
  if (uniqueIds.length > 0) {
    await db.insert(userRoles).values(
      uniqueIds.map((roleId) => ({
        userId,
        roleId,
      })),
    );
  }
  await logAudit({
    userId: actor?.id,
    action: "assign-roles",
    resource: "users",
    resourceId: userId,
    details: uniqueIds.join(","),
  });
  return { ok: true as const };
}

export async function getUserDetail(id: string) {
  const rows = await db
    .select({
      id: users.id,
      username: users.username,
      displayName: users.displayName,
      email: users.email,
      isActive: users.isActive,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  const user = rows[0];
  if (!user) return null;
  const roleNames = await getUserRoles(id);
  return { ...user, roles: roleNames };
}

export async function listRoles() {
  return db.select({ id: roles.id, name: roles.name }).from(roles);
}

export { listUsers };

export function newTempPassword(): string {
  return `Tmp-${randomUUID().slice(0, 8)}`;
}
