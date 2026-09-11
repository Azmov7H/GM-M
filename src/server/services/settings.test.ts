import { describe, expect, it, vi } from "vitest";

vi.mock("@/server/db", async () => {
  const { createTestDb } = await import("@/server/db/test-db");
  return { db: createTestDb() };
});

vi.mock("./audit.service", () => ({
  logAudit: vi.fn(async () => undefined),
}));

import { db } from "@/server/db";
import { settings } from "@/server/db/schema";
import { getSetting, getSettings, updateSettings } from "./settings.service";

describe("settings service", () => {
  it("returns defaults for missing keys", async () => {
    expect(await getSetting("company.name")).toBe("مؤسستي");
    expect(await getSetting("company.currency")).toBe("ر.س");
    expect(await getSetting("invoice.template")).toBe("standard");
    expect(await getSetting("sale.allow_below_cost")).toBe("false");
  });

  it("migrates the legacy store.name key transparently", async () => {
    await db.insert(settings).values({
      id: "set_legacy_probe",
      key: "store.name",
      value: "متجر القديم",
    });
    expect(await getSetting("company.name")).toBe("متجر القديم");
    expect((await getSettings())["company.name"]).toBe("متجر القديم");
  });

  it("updates whitelisted keys and rejects the rest", async () => {
    expect(await updateSettings({ "company.name": "شركة النور" })).toMatchObject({
      ok: true,
    });
    expect(await getSetting("company.name")).toBe("شركة النور");

    expect(await updateSettings({ "unknown.key": "x" })).toMatchObject({
      ok: false,
    });
    expect(await updateSettings({ "invoice.template": "fancy" })).toMatchObject({
      ok: false,
    });
    expect(await updateSettings({ "company.name": "" })).toMatchObject({
      ok: false,
    });
    expect(await updateSettings({ "company.currency": "دولار" })).toMatchObject({
      ok: true,
    });
    expect(await getSetting("company.currency")).toBe("دولار");
  });
});
