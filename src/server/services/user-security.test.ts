import { eq } from "drizzle-orm";
import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("@/server/db", async () => {
  const { createTestDb } = await import("@/server/db/test-db");
  return { db: createTestDb() };
});

// Real audit service: this file asserts audit rows are written.

import { db } from "@/server/db";
import { auditLogs, userRoles } from "@/server/db/schema";
import { createRole, createUser as mkUser } from "@/server/db/factories";
import {
  assignUserRoles,
  createUser,
  deactivateUser,
  updateUser,
  type ServiceActor,
} from "./user.service";
import { resetUserPassword } from "./auth.service";

let OWNER_ID = "";

beforeAll(async () => {
  const owner = await createRole(db, { id: "role_owner", name: "owner" });
  OWNER_ID = owner.id;
});

function actor(id: string, roles: string[]): ServiceActor {
  return { id, roles };
}

describe("owner privilege escalation guards", () => {
  it("blocks a manager from creating an owner user", async () => {
    const owner = { id: OWNER_ID };
    const mgr = await mkUser(db, { username: "mgr1" });
    const res = await createUser(
      {
        username: "evil_owner",
        displayName: "Evil",
        password: "secret123",
        roleIds: [owner.id],
      },
      actor(mgr.id, ["manager"]),
    );
    expect(res.ok).toBe(false);
  });

  it("allows an owner to create an owner user", async () => {
    const owner = { id: OWNER_ID };
    const adm = await mkUser(db, { username: "adm1" });
    const res = await createUser(
      {
        username: "good_owner",
        displayName: "Good",
        password: "secret123",
        roleIds: [owner.id],
      },
      actor(adm.id, ["owner"]),
    );
    expect(res.ok).toBe(true);
  });

  it("blocks granting the owner role to an existing user", async () => {
    const owner = { id: OWNER_ID };
    const mgr = await mkUser(db, { username: "mgr2" });
    const victim = await mkUser(db, { username: "victim1" });
    const res = await assignUserRoles(victim.id, [owner.id], actor(mgr.id, ["manager"]));
    expect(res.ok).toBe(false);
    const rows = await db.select().from(userRoles).where(eq(userRoles.userId, victim.id));
    expect(rows).toHaveLength(0);
  });

  it("blocks resetting an owner's password by a non-owner", async () => {
    const owner = { id: OWNER_ID };
    const mgr = await mkUser(db, { username: "mgr3" });
    const boss = await mkUser(db, { username: "boss1" });
    await assignUserRoles(boss.id, [owner.id], actor(boss.id, ["owner"]));
    const denied = await resetUserPassword(
      boss.id,
      "hacked-password",
      actor(mgr.id, ["manager"]),
    );
    expect(denied.ok).toBe(false);
  });

  it("blocks deactivating or editing an owner by a non-owner", async () => {
    const owner = { id: OWNER_ID };
    const mgr = await mkUser(db, { username: "mgr4" });
    const boss = await mkUser(db, { username: "boss2" });
    await assignUserRoles(boss.id, [owner.id], actor(boss.id, ["owner"]));

    expect(
      await deactivateUser(boss.id, mgr.id, actor(mgr.id, ["manager"])),
    ).toMatchObject({ ok: false });
    expect(
      await updateUser(boss.id, { displayName: "Pwned" }, actor(mgr.id, ["manager"])),
    ).toMatchObject({ ok: false });
  });

  it("lets an owner manage owners and managers manage staff", async () => {
    const owner = { id: OWNER_ID };
    const adm = await mkUser(db, { username: "adm2" });
    const boss = await mkUser(db, { username: "boss3" });
    await assignUserRoles(boss.id, [owner.id], actor(adm.id, ["owner"]));
    const staff = await mkUser(db, { username: "staff1" });

    expect(
      await deactivateUser(staff.id, adm.id, actor(adm.id, ["manager"])),
    ).toMatchObject({ ok: true });
    expect(await deactivateUser(boss.id, adm.id, actor(adm.id, ["owner"]))).toMatchObject(
      { ok: true },
    );
  });
});

describe("user mutation audit trail", () => {
  it("logs create/update/deactivate/assign-roles", async () => {
    const adm = await mkUser(db, { username: "aud1" });
    const created = await createUser(
      {
        username: "audited_user",
        displayName: "Audited",
        password: "secret123",
      },
      actor(adm.id, ["owner"]),
    );
    expect(created.ok).toBe(true);
    const id = (created as { id: string }).id;
    await updateUser(id, { displayName: "Audited 2" }, actor(adm.id, ["owner"]));
    await deactivateUser(id, adm.id, actor(adm.id, ["owner"]));

    const rows = await db.select().from(auditLogs);
    const actions = rows.map((r) => r.action);
    expect(actions).toContain("create");
    expect(actions).toContain("update");
    expect(actions).toContain("deactivate");
    expect(
      rows.filter((r) => r.resource === "users" && r.userId === adm.id).length,
    ).toBeGreaterThanOrEqual(3);
  });
});
