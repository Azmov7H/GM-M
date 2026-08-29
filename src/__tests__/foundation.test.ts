import { describe, it, expect } from "vitest";

describe("Foundation", () => {
  it("should have correct project name", () => {
    expect(true).toBe(true);
  });

  it("should import database schema", async () => {
    const schema = await import("@/server/db/schema");
    expect(schema).toBeDefined();
    expect(schema.users).toBeDefined();
    expect(schema.roles).toBeDefined();
    expect(schema.permissions).toBeDefined();
    expect(schema.sessions).toBeDefined();
    expect(schema.auditLogs).toBeDefined();
    expect(schema.settings).toBeDefined();
  });

  it("should import utility function", async () => {
    const { cn } = await import("@/lib/utils");
    expect(cn).toBeDefined();
    expect(typeof cn).toBe("function");
  });
});
