import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/server/db", async () => {
  const { createTestDb } = await import("@/server/db/test-db");
  return { db: createTestDb() };
});

import { db } from "@/server/db";
import {
  findByUsername,
  getUserRoles,
  getUserPermissions,
  getUserWithRoles,
  listUsers,
} from "./user-repository";
import {
  createUser,
  createRole,
  createPermission,
  assignRoleToUser,
  assignPermissionToRole,
} from "@/server/db/factories";
import { hashPassword } from "@/lib/auth/password";

describe("user-repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  async function seedOwner(usernameSuffix: string) {
    const role = await createRole(db, { name: `owner_${usernameSuffix}` });
    const perm = await createPermission(db, {
      name: `users:read_${usernameSuffix}`,
      resource: "users",
      action: "read",
    });
    await assignPermissionToRole(db, role.id, perm.id);
    const user = await createUser(db, {
      username: `owner_${usernameSuffix}`,
      displayName: "المالك",
      passwordHash: await hashPassword("secret123"),
    });
    await assignRoleToUser(db, user.id, role.id);
    return { user, role, perm };
  }

  it("finds a user by username", async () => {
    const { user } = await seedOwner("findme");
    const found = await findByUsername(user.username);
    expect(found?.id).toBe(user.id);
    expect(await findByUsername("no-such-user")).toBeUndefined();
  });

  it("returns roles and permissions for a user", async () => {
    const { user, role, perm } = await seedOwner("perms");
    expect(await getUserRoles(user.id)).toEqual([role.name]);
    expect(await getUserPermissions(user.id)).toEqual([perm.name]);
  });

  it("returns null from getUserWithRoles for unknown users", async () => {
    expect(await getUserWithRoles("user_missing")).toBeNull();
  });

  it("lists users", async () => {
    await seedOwner("listed");
    const rows = await listUsers();
    expect(rows.length).toBeGreaterThan(0);
    expect(rows[0]).not.toHaveProperty("passwordHash");
  });
});
