import { describe, it, expect } from "vitest";

import { hashPassword, verifyPassword } from "./password";

describe("password", () => {
  it("hashes and verifies a password", async () => {
    const hashed = await hashPassword("admin123");
    expect(hashed).not.toBe("admin123");
    expect(await verifyPassword("admin123", hashed)).toBe(true);
  });

  it("rejects a wrong password", async () => {
    const hashed = await hashPassword("correct-horse");
    expect(await verifyPassword("wrong-password", hashed)).toBe(false);
  });

  it("produces different hashes for the same password (salted)", async () => {
    const a = await hashPassword("same-password");
    const b = await hashPassword("same-password");
    expect(a).not.toBe(b);
  });
});
